// Genera src/lib/wiki-knowledge/index.json a partir de páginas de una wiki MediaWiki interna.
// Puerto a Node del backend Python de ChatWikiAI2 (wiki_scraper.py + document_processor.py + vector_store.py),
// pero sin FAISS: usa el mismo patrón de índice estático + cosine similarity que scripts/ingest-knowledge.mjs.
//
// Uso: npm run ingest:wiki
// Requiere en .env: WIKI_USERNAME, WIKI_PASSWORD, OPENAI_API_KEY, y al menos una de:
//   WIKI_OPERACION_URL (por defecto indexa 3 páginas de ejemplo — ver DEFAULT_PAGES)
//   WIKI_GENERAL_URL   (sin páginas por defecto — define WIKI_GENERAL_PAGES para activarla)
// Opcionales por wiki: WIKI_OPERACION_PAGES / WIKI_GENERAL_PAGES (coma-separado, sobreescribe el default).
// Opcionales globales: WIKI_SCRAPE_ALL=true (indexa TODAS las páginas del namespace en cada wiki
//             configurada, ignorando las listas de páginas), WIKI_LIMIT, WIKI_PREFIX, WIKI_NAMESPACE (default 0).
//
// Volver a correr cada vez que cambie contenido relevante en la wiki (no hay reindexado automático).
import { writeFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as cheerio from "cheerio";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import XLSX from "xlsx";
import { Agent, fetch as undiciFetch } from "undici";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_FILE = path.join(__dirname, "..", "src", "lib", "wiki-knowledge", "index.json");
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
        return ""; // imágenes y otros formatos: sin texto útil para RAG, se omiten
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

// Dos instalaciones MediaWiki separadas de grupocnet (cada una con su propio login/sesión).
// "operacion" trae por defecto las 3 páginas de ejemplo del proyecto original; "general" queda
// sin páginas por defecto (agrega WIKI_GENERAL_PAGES cuando quieras indexarla también).
function resolveWikiSources() {
    return [
        { key: "operacion", url: process.env.WIKI_OPERACION_URL, pages: process.env.WIKI_OPERACION_PAGES ? process.env.WIKI_OPERACION_PAGES.split(",").map((t) => t.trim()).filter(Boolean) : DEFAULT_PAGES },
        { key: "general", url: process.env.WIKI_GENERAL_URL, pages: process.env.WIKI_GENERAL_PAGES ? process.env.WIKI_GENERAL_PAGES.split(",").map((t) => t.trim()).filter(Boolean) : [] },
    ].filter((s) => s.url);
}

async function main() {
    loadDotEnvIfPresent();
    const apiKey = process.env.OPENAI_API_KEY;
    const username = process.env.WIKI_USERNAME;
    const password = process.env.WIKI_PASSWORD;
    if (!apiKey) return fail("Falta OPENAI_API_KEY");
    if (!username || !password) return fail("Falta WIKI_USERNAME / WIKI_PASSWORD");

    const chunkSize = Number(process.env.CHUNK_SIZE || 1000);
    const overlap = Number(process.env.CHUNK_OVERLAP || 200);
    const scrapeAll = String(process.env.WIKI_SCRAPE_ALL || "false").toLowerCase() === "true";
    const namespace = Number(process.env.WIKI_NAMESPACE || 0);
    const limit = process.env.WIKI_LIMIT ? Number(process.env.WIKI_LIMIT) : null;
    const prefix = process.env.WIKI_PREFIX || null;

    const sources = resolveWikiSources();
    if (!sources.length) return fail("No hay ninguna wiki configurada (define WIKI_OPERACION_URL y/o WIKI_GENERAL_URL).");

    let allRawChunks = [];
    const generatedFrom = [];

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

        for (const title of titles) {
            console.log(`  Procesando página: ${title}`);
            try {
                const pageChunks = await processPage(session, title, chunkSize, overlap, source.key);
                allRawChunks.push(...pageChunks);
                console.log(`    -> ${pageChunks.length} chunk(s)`);
            } catch (err) {
                console.error(`    Error procesando ${title}: ${err.message}`);
            }
        }
        generatedFrom.push(...titles.map((t) => `${source.key}:${t}`));
    }

    if (!allRawChunks.length) return fail("No se generó ningún chunk. Revisa credenciales y la configuración de páginas por wiki.");

    const chunks = allRawChunks.map((c) => ({
        id: `${c.wiki}:${c.page}#${c.chunkIndex}`,
        wiki: c.wiki,
        page: c.page,
        section: c.section,
        chunkIndex: c.chunkIndex,
        text: c.text,
        fileName: c.fileName,
        fileUrl: c.fileUrl,
    }));

    console.log(`\nGenerando embeddings para ${chunks.length} chunk(s)...`);
    const BATCH = 64;
    for (let i = 0; i < chunks.length; i += BATCH) {
        const batch = chunks.slice(i, i + BATCH);
        const embeddings = await embed(batch.map((c) => c.text), apiKey);
        batch.forEach((c, j) => (c.embedding = embeddings[j]));
    }

    const output = { model: EMBEDDING_MODEL, generatedFrom, chunks };
    await writeFile(OUTPUT_FILE, JSON.stringify(output));
    console.log(`Listo: ${OUTPUT_FILE} (${chunks.length} chunks de ${generatedFrom.length} página(s) en ${sources.length} wiki(s)).`);
}

function fail(msg) {
    console.error(msg);
    process.exit(1);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
