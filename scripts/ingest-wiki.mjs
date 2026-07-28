// Indexa páginas de una wiki MediaWiki interna en Postgres (pgvector), reutilizando la misma
// Neon DB del resto de la app. Puerto a Node del backend Python de ChatWikiAI2 (wiki_scraper.py +
// document_processor.py + vector_store.py) — pero sin FAISS ni archivo JSON estático: un wiki con
// decenas de miles de páginas genera demasiados chunks para caber en un solo archivo (superaría el
// límite de string de Node/V8 y los límites de tamaño de función serverless de Vercel). En vez de
// eso, cada página se guarda en la tabla `wiki_chunks` INMEDIATAMENTE después de embeberla, así que
// si el proceso se interrumpe a mitad de camino no se pierde el trabajo (ni el gasto de OpenAI) de
// las páginas ya procesadas.
//
// Uso: npm run ingest:wiki
// Requiere en .env: WIKI_USERNAME, WIKI_PASSWORD, OPENAI_API_KEY, DATABASE_URL (o POSTGRES_URL), y
// al menos una de:
//   WIKI_OPERACION_URL (por defecto indexa 3 páginas de ejemplo — ver DEFAULT_PAGES)
//   WIKI_GENERAL_URL   (sin páginas por defecto — define WIKI_GENERAL_PAGES para activarla)
// Opcionales por wiki: WIKI_OPERACION_PAGES / WIKI_GENERAL_PAGES (coma-separado, sobreescribe el default).
// Opcionales globales: WIKI_SCRAPE_ALL=true (indexa TODAS las páginas del namespace en cada wiki
//             configurada, ignorando las listas de páginas), WIKI_LIMIT, WIKI_PREFIX, WIKI_NAMESPACE (default 0).
//
// Volver a correr cada vez que cambie contenido relevante en la wiki (no hay reindexado automático).
// Re-correr es seguro: cada página borra sus chunks viejos antes de insertar los nuevos.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as cheerio from "cheerio";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import XLSX from "xlsx";
import { Agent, fetch as undiciFetch } from "undici";
import { neon } from "@neondatabase/serverless";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EMBEDDING_MODEL = "text-embedding-3-small";
const DEFAULT_PAGES = ["Nuestros_Clientes", "Página_principal", "Equipos_de_Operación"];

// Las wikis internas de grupocnet usan un certificado que Node no puede verificar (cadena
// incompleta / CA interna) — el backend Python original usaba verify=False por lo mismo.
// Se limita el bypass de verificación TLS SOLO a las peticiones a la wiki (nunca a OpenAI).
const insecureAgent = new Agent({ connect: { rejectUnauthorized: false } });

function loadDotEnvIfPresent() {
    const envPath = path.join(__dirname, "..", ".env");
    if (!existsSync(envPath)) return;
    const raw = readFileSync(envPath, "utf-8");
    for (const line of raw.split("\n")) {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
        if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
}

// ---------- Cliente de sesión MediaWiki (login por cookies + action API) ----------

class WikiSession {
    constructor(baseUrl) {
        this.base = baseUrl;
        this.cookies = new Map();
    }

    _cookieHeader() {
        return [...this.cookies.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
    }

    _captureCookies(res) {
        const setCookies = res.headers.getSetCookie ? res.headers.getSetCookie() : (res.headers.get("set-cookie") ? [res.headers.get("set-cookie")] : []);
        for (const raw of setCookies) {
            const [pair] = raw.split(";");
            const idx = pair.indexOf("=");
            if (idx > 0) this.cookies.set(pair.slice(0, idx).trim(), pair.slice(idx + 1).trim());
        }
    }

    async apiGet(params) {
        const url = new URL("/api.php", this.base);
        for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
        const res = await undiciFetch(url, { headers: { Cookie: this._cookieHeader(), "User-Agent": "WikiChatBot-TS/1.0" }, dispatcher: insecureAgent });
        this._captureCookies(res);
        return res.json();
    }

    async apiPost(params) {
        const url = new URL("/api.php", this.base);
        const body = new URLSearchParams(params);
        const res = await undiciFetch(url, {
            method: "POST",
            headers: { Cookie: this._cookieHeader(), "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "WikiChatBot-TS/1.0" },
            body,
            dispatcher: insecureAgent,
        });
        this._captureCookies(res);
        return res.json();
    }

    async login(username, password) {
        const tokenRes = await this.apiGet({ action: "query", meta: "tokens", type: "login", format: "json" });
        const loginToken = tokenRes?.query?.tokens?.logintoken;
        if (!loginToken) throw new Error("No se pudo obtener el login token de MediaWiki");
        const loginRes = await this.apiPost({ action: "login", lgname: username, lgpassword: password, lgtoken: loginToken, format: "json" });
        const status = loginRes?.login?.result;
        if (status !== "Success" && status !== "SuccessWithTwoFactor") {
            throw new Error(`Login fallido: ${status} - ${JSON.stringify(loginRes)}`);
        }
    }

    async fetchPageHtml(title) {
        const normTitle = (title || "").trim().replace(/ /g, "_");
        const json = await this.apiGet({ action: "parse", page: normTitle, prop: "text", redirects: 1, format: "json" });
        if (json.error) throw new Error(JSON.stringify(json.error));
        return json.parse.text["*"];
    }

    // Recorre el HTML de una página y la separa en secciones etiquetadas, replicando la lógica
    // de wiki_scraper.py: encabezados h1-h5 Y bloques colapsables (mw-collapsible div/table), anidados.
    fetchPageSections($, root) {
        const sections = [];

        const collapsibleLabel = ($el) => {
            if ($el.is("table")) {
                const th = $el.find("th").first();
                if (th.length) return th.text().trim();
                const cap = $el.find("caption").first();
                if (cap.length) return cap.text().trim();
                return "";
            }
            for (const child of $el.children().toArray()) {
                const $child = $(child);
                if ($child.hasClass("mw-collapsible-content")) continue;
                const text = $child.text().trim();
                if (text) return text;
            }
            return "";
        };

        const isCollapsible = ($el) => {
            const tag = $el.prop("tagName")?.toLowerCase();
            return (tag === "div" || tag === "table") && $el.hasClass("mw-collapsible");
        };

        const walk = (container, parentSection, level) => {
            let pending = "";
            let currentSection = parentSection;
            let currentLevel = level;

            for (const el of $(container).contents().toArray()) {
                const tag = el.tagName?.toLowerCase();
                const $el = $(el);

                if (tag && /^h[1-5]$/.test(tag)) {
                    if (pending.trim()) {
                        sections.push({ section: currentSection, level: currentLevel, text: pending.trim() });
                        pending = "";
                    }
                    currentLevel = Number(tag[1]);
                    currentSection = $el.text().trim();
                } else if (tag && isCollapsible($el)) {
                    if (pending.trim()) {
                        sections.push({ section: currentSection, level: currentLevel, text: pending.trim() });
                        pending = "";
                    }
                    const label = collapsibleLabel($el);
                    const childSection = label ? `${currentSection} › ${label}`.replace(/^ › /, "") : currentSection;
                    const childLevel = currentLevel + 1;
                    const contentArea = $el.children(".mw-collapsible-content").first();
                    if (contentArea.length) walk(contentArea, childSection, childLevel);
                    else walk($el, childSection, childLevel);
                } else if (tag) {
                    pending += $el.text() + "\n";
                } else if (el.type === "text") {
                    pending += el.data;
                }
            }

            if (pending.trim()) sections.push({ section: currentSection, level: currentLevel, text: pending.trim() });
        };

        walk(root, "", 0);
        if (!sections.length) sections.push({ section: "", level: 0, text: $(root).text() });
        return sections;
    }

    async fetchPageFileLinks(title) {
        const html = await this.fetchPageHtml(title);
        const $ = cheerio.load(html);
        const origin = new URL(this.base).origin;
        const seen = new Set();
        const results = [];

        $("a[href]").each((_, a) => {
            const href = $(a).attr("href");
            if (!href) return;
            if (href.includes("/Archivo:") || href.includes("/File:")) {
                let fileName = $(a).attr("title") || $(a).text().trim() || href.split(":").pop();
                fileName = fileName.replace("Archivo:", "").replace("File:", "").trim();
                const pageUrl = href.startsWith("http") ? href : origin + href;
                if (!seen.has(pageUrl)) {
                    seen.add(pageUrl);
                    results.push({ name: fileName, pageUrl, downloadUrl: null });
                }
            } else if (href.includes("/images/") && href.split("/").pop().includes(".")) {
                const downloadUrl = href.startsWith("http") ? href : origin + href;
                const fileName = decodeURIComponent(href.split("/").pop());
                if (!seen.has(downloadUrl)) {
                    seen.add(downloadUrl);
                    const normalized = fileName.replace(/_/g, " ").toLowerCase();
                    const matched = results.find((r) => r.name.replace(/_/g, " ").toLowerCase() === normalized);
                    if (matched) matched.downloadUrl = downloadUrl;
                    else results.push({ name: fileName, pageUrl: null, downloadUrl });
                }
            }
        });
        return results;
    }

    async resolveFileUrl(pageUrl) {
        try {
            const res = await undiciFetch(pageUrl, { headers: { Cookie: this._cookieHeader() }, dispatcher: insecureAgent });
            const html = await res.text();
            const $ = cheerio.load(html);
            const href = $("a.internal").first().attr("href");
            if (!href) return null;
            const origin = new URL(this.base).origin;
            return href.startsWith("http") ? href : origin + href;
        } catch {
            return null;
        }
    }

    async downloadFile(url) {
        try {
            const res = await undiciFetch(url, { headers: { Cookie: this._cookieHeader() }, dispatcher: insecureAgent });
            if (!res.ok) return null;
            return Buffer.from(await res.arrayBuffer());
        } catch {
            return null;
        }
    }

    async listAllPages(namespace = 0, limit = null, prefix = null) {
        const titles = [];
        let apcontinue;
        for (;;) {
            const params = { action: "query", list: "allpages", apnamespace: String(namespace), aplimit: "500", format: "json" };
            if (prefix) params.apprefix = prefix;
            if (apcontinue) params.apcontinue = apcontinue;
            const json = await this.apiGet(params);
            const pages = json?.query?.allpages || [];
            for (const p of pages) {
                titles.push(p.title.replace(/ /g, "_"));
                if (limit && titles.length >= limit) return titles.slice(0, limit);
            }
            apcontinue = json?.continue?.apcontinue;
            if (!apcontinue) break;
        }
        return titles;
    }
}

// ---------- Extracción de texto de documentos adjuntos ----------

async function extractDocumentText(fileName, buffer) {
    const ext = fileName.split(".").pop()?.toLowerCase();
    try {
        if (ext === "pdf") {
            const parser = new PDFParse({ data: buffer });
            const result = await parser.getText();
            await parser.destroy();
            return result.text;
        }
        if (ext === "docx" || ext === "doc") {
            const { value } = await mammoth.extractRawText({ buffer });
            return value;
        }
        if (ext === "xlsx" || ext === "xls") {
            const wb = XLSX.read(buffer, { type: "buffer" });
            let text = "";
            for (const sheetName of wb.SheetNames) {
                text += `\n--- Hoja: ${sheetName} ---\n`;
                text += XLSX.utils.sheet_to_csv(wb.Sheets[sheetName]);
            }
            return text;
        }
        if (["png", "jpg", "jpeg", "gif", "bmp", "webp"].includes(ext)) {
            // Sin OCR: se guarda solo el nombre como texto mínimo, para que el chunk exista y el
            // chat pueda encontrar y enlazar/mostrar la imagen (no para buscar por su contenido visual).
            return `Imagen adjunta: ${fileName.replace(/[_-]+/g, " ").replace(/\.[a-z0-9]+$/i, "")}`;
        }
        return ""; // otros formatos: sin texto útil para RAG, se omiten
    } catch (err) {
        console.error(`  [FILE] Error procesando ${fileName}: ${err.message}`);
        return "";
    }
}

// ---------- Chunking (idéntico criterio a scripts/ingest-knowledge.mjs) ----------

function chunkText(text, chunkSize, overlap) {
    const paragraphs = text.split(/\n+/).map((p) => p.trim()).filter(Boolean);
    const chunks = [];
    let current = "";
    for (const p of paragraphs) {
        if ((current + "\n" + p).length <= chunkSize) {
            current = current ? current + "\n" + p : p;
        } else {
            if (current) chunks.push(current.trim());
            if (p.length > chunkSize) {
                let start = 0;
                while (start < p.length) {
                    const end = start + chunkSize;
                    chunks.push(p.slice(start, end));
                    start = end - overlap > start ? end - overlap : end;
                }
                current = "";
            } else {
                current = p;
            }
        }
    }
    if (current) chunks.push(current.trim());
    return chunks;
}

async function embed(texts, apiKey) {
    const res = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model: EMBEDDING_MODEL, input: texts }),
    });
    if (!res.ok) throw new Error(`OpenAI embeddings error ${res.status}: ${await res.text()}`);
    const json = await res.json();
    return json.data.map((d) => d.embedding);
}

// ---------- Orquestación por página ----------

async function processPage(session, title, chunkSize, overlap, wikiKey) {
    const $ = cheerio.load(await session.fetchPageHtml(title));
    const $body = $("div.mw-parser-output").first().length ? $("div.mw-parser-output").first() : $("body");
    $body.find("script, style, .mw-editsection, .noprint, .mw-jump-link, #toc").remove();

    const sections = session.fetchPageSections($, $body);

    let fileLinks = [];
    try {
        fileLinks = await session.fetchPageFileLinks(title);
    } catch {
        fileLinks = [];
    }

    const pageChunks = [];
    let chunkIndex = 0;
    for (const sec of sections) {
        for (const text of chunkText(sec.text, chunkSize, overlap)) {
            pageChunks.push({ wiki: wikiKey, page: title, section: sec.section || "Página Principal", level: sec.level, text, fileName: null, fileUrl: null, chunkIndex: chunkIndex++ });
        }
    }

    for (const fl of fileLinks) {
        let downloadUrl = fl.downloadUrl;
        if (!downloadUrl && fl.pageUrl) downloadUrl = await session.resolveFileUrl(fl.pageUrl);
        if (!downloadUrl) continue;
        console.log(`  [FILE] Procesando ${fl.name} de ${title}...`);
        const content = await session.downloadFile(downloadUrl);
        if (!content) continue;
        const fileText = await extractDocumentText(fl.name, content);
        if (!fileText.trim()) continue;
        for (const text of chunkText(fileText, chunkSize, overlap)) {
            pageChunks.push({ wiki: wikiKey, page: title, section: `Archivo: ${fl.name}`, level: 1, text, fileName: fl.name, fileUrl: downloadUrl, chunkIndex: chunkIndex++ });
        }
    }

    return pageChunks;
}

// ---------- Postgres (pgvector) ----------

async function ensureSchema(sql) {
    await sql`CREATE EXTENSION IF NOT EXISTS vector`;
    await sql`
        CREATE TABLE IF NOT EXISTS wiki_chunks (
            id TEXT PRIMARY KEY,
            wiki TEXT NOT NULL,
            page TEXT NOT NULL,
            section TEXT,
            chunk_index INT NOT NULL,
            text TEXT NOT NULL,
            file_name TEXT,
            file_url TEXT,
            embedding vector(1536) NOT NULL,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    `;
    await sql`CREATE INDEX IF NOT EXISTS wiki_chunks_page_idx ON wiki_chunks (wiki, page)`;
    // HNSW: se actualiza incrementalmente con cada INSERT, no requiere reconstruir todo el índice
    // cada vez (a diferencia de ivfflat, que sí necesita re-entrenarse con los datos ya cargados).
    await sql`CREATE INDEX IF NOT EXISTS wiki_chunks_embedding_idx ON wiki_chunks USING hnsw (embedding vector_cosine_ops)`;
}

async function saveChunksForPage(sql, wiki, page, chunks) {
    await sql`DELETE FROM wiki_chunks WHERE wiki = ${wiki} AND page = ${page}`;
    for (const c of chunks) {
        const embeddingLiteral = JSON.stringify(c.embedding);
        await sql`
            INSERT INTO wiki_chunks (id, wiki, page, section, chunk_index, text, file_name, file_url, embedding)
            VALUES (${c.id}, ${c.wiki}, ${c.page}, ${c.section}, ${c.chunkIndex}, ${c.text}, ${c.fileName}, ${c.fileUrl}, ${embeddingLiteral}::vector)
        `;
    }
}

// Dos instalaciones MediaWiki separadas de grupocnet (cada una con su propio login/sesión).
// "operacion" trae por defecto las 3 páginas de ejemplo del proyecto original; "general" queda
// sin páginas por defecto (agrega WIKI_GENERAL_PAGES cuando quieras indexarla también).
// Por ahora restringido a la wiki General únicamente (el login a "operación" está fallando y
// se pausó esa fuente). Para reactivarla, descomenta la entrada "operacion" de abajo.
function resolveWikiSources() {
    return [
        // { key: "operacion", url: process.env.WIKI_OPERACION_URL, pages: process.env.WIKI_OPERACION_PAGES ? process.env.WIKI_OPERACION_PAGES.split(",").map((t) => t.trim()).filter(Boolean) : DEFAULT_PAGES },
        { key: "general", url: process.env.WIKI_GENERAL_URL, pages: process.env.WIKI_GENERAL_PAGES ? process.env.WIKI_GENERAL_PAGES.split(",").map((t) => t.trim()).filter(Boolean) : [] },
    ].filter((s) => s.url);
}

const EMBED_BATCH = 64;

async function embedPageChunks(rawChunks, apiKey) {
    const chunks = rawChunks.map((c) => ({
        id: `${c.wiki}:${c.page}#${c.chunkIndex}`,
        wiki: c.wiki,
        page: c.page,
        section: c.section,
        chunkIndex: c.chunkIndex,
        text: c.text,
        fileName: c.fileName,
        fileUrl: c.fileUrl,
    }));
    for (let i = 0; i < chunks.length; i += EMBED_BATCH) {
        const batch = chunks.slice(i, i + EMBED_BATCH);
        const embeddings = await embed(batch.map((c) => c.text), apiKey);
        batch.forEach((c, j) => (c.embedding = embeddings[j]));
    }
    return chunks;
}

async function main() {
    loadDotEnvIfPresent();
    const apiKey = process.env.OPENAI_API_KEY;
    const username = process.env.WIKI_USERNAME;
    const password = process.env.WIKI_PASSWORD;
    const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (!apiKey) return fail("Falta OPENAI_API_KEY");
    if (!username || !password) return fail("Falta WIKI_USERNAME / WIKI_PASSWORD");
    if (!dbUrl) return fail("Falta DATABASE_URL / POSTGRES_URL");

    const chunkSize = Number(process.env.CHUNK_SIZE || 1000);
    const overlap = Number(process.env.CHUNK_OVERLAP || 200);
    const scrapeAll = String(process.env.WIKI_SCRAPE_ALL || "false").toLowerCase() === "true";
    const namespace = Number(process.env.WIKI_NAMESPACE || 0);
    const limit = process.env.WIKI_LIMIT ? Number(process.env.WIKI_LIMIT) : null;
    const prefix = process.env.WIKI_PREFIX || null;

    const sources = resolveWikiSources();
    if (!sources.length) return fail("No hay ninguna wiki configurada (define WIKI_OPERACION_URL y/o WIKI_GENERAL_URL).");

    const sql = neon(dbUrl);
    console.log("Preparando esquema en Postgres (wiki_chunks)...");
    await ensureSchema(sql);

    let totalChunks = 0;
    let totalPages = 0;
    let totalErrors = 0;

    for (const source of sources) {
        console.log(`\n=== Wiki "${source.key}": ${source.url} ===`);
        const session = new WikiSession(source.url);
        try {
            await session.login(username, password);
        } catch (err) {
            console.error(`  Error de login en "${source.key}": ${err.message} — se omite esta wiki.`);
            continue;
        }

        let titles;
        if (scrapeAll) {
            titles = await session.listAllPages(namespace, limit, prefix);
            console.log(`  Descubiertas ${titles.length} páginas (namespace=${namespace}).`);
        } else {
            titles = source.pages;
        }

        if (!titles.length) {
            console.log(`  Sin páginas configuradas para "${source.key}" — se omite (define WIKI_${source.key.toUpperCase()}_PAGES o WIKI_SCRAPE_ALL=true).`);
            continue;
        }

        for (let i = 0; i < titles.length; i++) {
            const title = titles[i];
            try {
                const rawChunks = await processPage(session, title, chunkSize, overlap, source.key);
                const chunks = rawChunks.length ? await embedPageChunks(rawChunks, apiKey) : [];
                await saveChunksForPage(sql, source.key, title, chunks);
                totalChunks += chunks.length;
                totalPages += 1;
                console.log(`  [${i + 1}/${titles.length}] ${title} -> ${chunks.length} chunk(s) guardado(s) (acumulado: ${totalChunks} chunks / ${totalPages} páginas)`);
            } catch (err) {
                totalErrors += 1;
                console.error(`  [${i + 1}/${titles.length}] Error procesando ${title}: ${err.message}`);
            }
        }
    }

    if (!totalPages) return fail("No se procesó ninguna página. Revisa credenciales y la configuración de páginas por wiki.");
    console.log(`\nListo: ${totalChunks} chunks guardados en Postgres de ${totalPages} página(s) (${totalErrors} error(es)).`);
}

function fail(msg) {
    console.error(msg);
    process.exit(1);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
