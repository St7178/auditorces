import { neon } from "@neondatabase/serverless";

// El índice de la wiki vive en Postgres (tabla wiki_chunks, pgvector) en vez de un archivo JSON
// estático — con decenas de miles de páginas, un archivo estático no cabe en el bundle de una
// función serverless de Vercel. Ver scripts/ingest-wiki.mjs para cómo se llena esta tabla.

type WikiChunk = {
    id: string;
    wiki: string;
    page: string;
    section: string;
    chunkIndex: number;
    text: string;
    fileName: string | null;
    fileUrl: string | null;
};
type ScoredChunk = WikiChunk & { score: number };

function sql() {
    const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (!url) throw new Error("DATABASE_URL / POSTGRES_URL no está configurada");
    return neon(url);
}

async function embedQuery(query: string, apiKey: string): Promise<number[]> {
    const res = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model: "text-embedding-3-small", input: query }),
    });
    if (!res.ok) throw new Error(`OpenAI embeddings error ${res.status}: ${await res.text()}`);
    const json = await res.json();
    return json.data[0].embedding;
}

async function semanticSearch(query: string, apiKey: string, topK: number): Promise<ScoredChunk[]> {
    const embedding = await embedQuery(query, apiKey);
    const embeddingLiteral = JSON.stringify(embedding);
    const db = sql();
    const rows = await db`
        SELECT id, wiki, page, section, chunk_index AS "chunkIndex", text, file_name AS "fileName", file_url AS "fileUrl",
               1 - (embedding <=> ${embeddingLiteral}::vector) AS score
        FROM wiki_chunks
        ORDER BY embedding <=> ${embeddingLiteral}::vector
        LIMIT ${topK}
    `;
    return rows as unknown as ScoredChunk[];
}

// Stopwords en español para el matching por título (equivalente a _STOPWORDS en main.py).
const STOPWORDS = new Set([
    "de", "la", "el", "en", "un", "una", "los", "las", "del", "al",
    "y", "o", "a", "e", "dame", "me", "da", "dime", "que", "cual",
    "como", "donde", "hay", "por", "para", "con", "su", "sus",
    "es", "son", "fue", "ser", "tiene", "tengo", "quiero", "necesito",
    "busco", "muestra", "muéstrame", "cuales",
]);

function stripAccents(text: string) {
    return text.normalize("NFD").replace(new RegExp("[\\u0300-\\u036f]", "g"), "");
}

function normalizeText(text: string) {
    return stripAccents(text.toLowerCase().replace(/_/g, " ").replace(/-/g, " "))
        .replace(/[^\w\s]/g, " ")
        .split(/\s+/)
        .filter(Boolean)
        .join(" ");
}

/** Busca chunks cuya página o nombre de archivo coincide por palabras clave con la consulta.
 * Complementa la búsqueda semántica cuando el usuario pide un documento por nombre. Filtra en SQL
 * (ILIKE por cada keyword vía unnest) para no traer la tabla completa a memoria, y rankea en JS. */
async function searchByPageTitle(query: string, topK: number): Promise<ScoredChunk[]> {
    const keywords = normalizeText(query).split(" ").filter((w) => w.length > 2 && !STOPWORDS.has(w));
    if (!keywords.length) return [];

    const db = sql();
    const candidates = await db`
        SELECT DISTINCT wc.id, wc.wiki, wc.page, wc.section, wc.chunk_index AS "chunkIndex", wc.text,
               wc.file_name AS "fileName", wc.file_url AS "fileUrl"
        FROM wiki_chunks wc, unnest(${keywords}::text[]) AS kw
        WHERE lower(wc.page) LIKE '%' || kw || '%' OR lower(coalesce(wc.file_name, '')) LIKE '%' || kw || '%'
        LIMIT 500
    `;
    if (!candidates.length) return [];

    const scores = new Map<string, number>();
    for (const chunk of candidates as unknown as WikiChunk[]) {
        const target = `${normalizeText(chunk.page)} ${chunk.fileName ? normalizeText(chunk.fileName) : ""}`;
        const targetWords = new Set(target.split(" "));
        const hits = keywords.filter((kw) => target.includes(kw) || [...targetWords].some((tw) => tw.includes(kw) || kw.includes(tw))).length;
        if (hits > 0) {
            const key = `${chunk.page}::${chunk.fileName || ""}`;
            scores.set(key, Math.max(scores.get(key) || 0, hits));
        }
    }
    if (!scores.size) return [];

    const bestKeys = new Set([...scores.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => k));
    const results: ScoredChunk[] = [];
    const seen = new Set<string>();
    for (const chunk of candidates as unknown as WikiChunk[]) {
        const key = `${chunk.page}::${chunk.fileName || ""}`;
        if (!bestKeys.has(key)) continue;
        const seenKey = `${chunk.page}#${chunk.chunkIndex}`;
        if (seen.has(seenKey)) continue;
        seen.add(seenKey);
        results.push({ ...chunk, score: 0 });
    }
    return results.slice(0, topK * 3);
}

/** Para cada chunk recuperado, agrega los chunks vecinos (±1) de la misma página, evitando
 * respuestas incompletas cuando el contenido relacionado quedó partido en chunks consecutivos. */
async function expandWithNeighbors(results: ScoredChunk[]): Promise<ScoredChunk[]> {
    const wanted: Array<{ page: string; chunkIndex: number }> = [];
    const already = new Set(results.map((r) => `${r.page}#${r.chunkIndex}`));
    for (const r of results) {
        if (r.chunkIndex > 0) wanted.push({ page: r.page, chunkIndex: r.chunkIndex - 1 });
        wanted.push({ page: r.page, chunkIndex: r.chunkIndex + 1 });
    }
    if (!wanted.length) return results;

    const db = sql();
    const extra: ScoredChunk[] = [];
    for (const w of wanted) {
        const key = `${w.page}#${w.chunkIndex}`;
        if (already.has(key)) continue;
        const rows = await db`
            SELECT id, wiki, page, section, chunk_index AS "chunkIndex", text, file_name AS "fileName", file_url AS "fileUrl"
            FROM wiki_chunks WHERE page = ${w.page} AND chunk_index = ${w.chunkIndex}
            LIMIT 1
        `;
        if (rows.length) {
            already.add(key);
            extra.push({ ...(rows[0] as unknown as WikiChunk), score: Infinity });
        }
    }
    return [...results, ...extra];
}

/** Combina búsqueda semántica (consulta reescrita + original), búsqueda por título y expansión
 * de vecinos, replicando get_combined_results() de main.py — ahora contra Postgres en vez de un
 * array en memoria. */
export async function getCombinedResults(original: string, rewritten: string, apiKey: string, topK: number): Promise<ScoredChunk[]> {
    const resultsRewritten = await semanticSearch(rewritten, apiKey, topK);
    const resultsOriginal = original.trim().toLowerCase() !== rewritten.trim().toLowerCase() ? await semanticSearch(original, apiKey, topK) : [];
    const titleResults = await searchByPageTitle(original, topK);

    const seen = new Set<string>();
    let combined: ScoredChunk[] = [];
    for (const r of [...resultsRewritten, ...resultsOriginal]) {
        const key = `${r.page}#${r.chunkIndex}`;
        if (!seen.has(key)) {
            seen.add(key);
            combined.push(r);
        }
    }
    combined.sort((a, b) => b.score - a.score);

    for (const r of titleResults) {
        const key = `${r.page}#${r.chunkIndex}`;
        if (!seen.has(key)) {
            seen.add(key);
            combined.push(r);
        }
    }

    combined = await expandWithNeighbors(combined);
    return combined.slice(0, topK);
}
