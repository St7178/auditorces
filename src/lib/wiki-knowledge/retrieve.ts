import index from "./index.json";

type WikiChunk = {
    id: string;
    wiki: string;
    page: string;
    section: string;
    chunkIndex: number;
    text: string;
    fileName: string | null;
    fileUrl: string | null;
    embedding: number[];
};
type WikiIndex = { model: string; generatedFrom: string[]; chunks: WikiChunk[] };
type ScoredChunk = WikiChunk & { score: number };

const WIKI_INDEX = index as unknown as WikiIndex;

function cosineSimilarity(a: number[], b: number[]) {
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function embedQuery(query: string, apiKey: string): Promise<number[]> {
    const res = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model: WIKI_INDEX.model || "text-embedding-3-small", input: query }),
    });
    if (!res.ok) throw new Error(`OpenAI embeddings error ${res.status}: ${await res.text()}`);
    const json = await res.json();
    return json.data[0].embedding;
}

async function semanticSearch(query: string, apiKey: string, topK: number): Promise<ScoredChunk[]> {
    if (!WIKI_INDEX.chunks.length) return [];
    const queryEmbedding = await embedQuery(query, apiKey);
    return [...WIKI_INDEX.chunks]
        .map((chunk) => ({ ...chunk, score: cosineSimilarity(queryEmbedding, chunk.embedding) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);
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
 * Complementa la búsqueda semántica cuando el usuario pide un documento por nombre. */
function searchByPageTitle(query: string, topK: number): ScoredChunk[] {
    if (!WIKI_INDEX.chunks.length) return [];
    const queryWords = normalizeText(query).split(" ").filter((w) => w.length > 2 && !STOPWORDS.has(w));
    if (!queryWords.length) return [];

    const scores = new Map<string, number>();
    for (const chunk of WIKI_INDEX.chunks) {
        const target = `${normalizeText(chunk.page)} ${chunk.fileName ? normalizeText(chunk.fileName) : ""}`;
        const targetWords = new Set(target.split(" "));
        const hits = queryWords.filter((kw) => target.includes(kw) || [...targetWords].some((tw) => tw.includes(kw) || kw.includes(tw))).length;
        if (hits > 0) {
            const key = `${chunk.page}::${chunk.fileName || ""}`;
            scores.set(key, Math.max(scores.get(key) || 0, hits));
        }
    }
    if (!scores.size) return [];

    const bestKeys = [...scores.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => k);
    const results: ScoredChunk[] = [];
    const seen = new Set<string>();
    for (const key of bestKeys) {
        const [page, fileName] = key.split("::");
        const matches = WIKI_INDEX.chunks
            .filter((c) => c.page === page && (c.fileName || "") === fileName)
            .sort((a, b) => a.chunkIndex - b.chunkIndex)
            .slice(0, 3);
        for (const m of matches) {
            const seenKey = `${m.page}#${m.chunkIndex}`;
            if (seen.has(seenKey)) continue;
            seen.add(seenKey);
            results.push({ ...m, score: 0 });
        }
    }
    return results;
}

/** Para cada chunk recuperado, agrega los chunks vecinos (±1) de la misma página, evitando
 * respuestas incompletas cuando el contenido relacionado quedó partido en chunks consecutivos. */
function expandWithNeighbors(results: ScoredChunk[]): ScoredChunk[] {
    const want = new Set<string>();
    for (const r of results) {
        if (r.chunkIndex > 0) want.add(`${r.page}#${r.chunkIndex - 1}`);
        want.add(`${r.page}#${r.chunkIndex + 1}`);
    }
    const already = new Set(results.map((r) => `${r.page}#${r.chunkIndex}`));
    const extra: ScoredChunk[] = [];
    for (const chunk of WIKI_INDEX.chunks) {
        const key = `${chunk.page}#${chunk.chunkIndex}`;
        if (want.has(key) && !already.has(key)) {
            already.add(key);
            extra.push({ ...chunk, score: Infinity });
        }
    }
    return [...results, ...extra];
}

/** Combina búsqueda semántica (consulta reescrita + original), búsqueda por título y expansión
 * de vecinos, replicando get_combined_results() de main.py. */
export async function getCombinedResults(original: string, rewritten: string, apiKey: string, topK: number): Promise<ScoredChunk[]> {
    if (!WIKI_INDEX.chunks.length) return [];

    const resultsRewritten = await semanticSearch(rewritten, apiKey, topK);
    const resultsOriginal = original.trim().toLowerCase() !== rewritten.trim().toLowerCase() ? await semanticSearch(original, apiKey, topK) : [];
    const titleResults = searchByPageTitle(original, topK);

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

    combined = expandWithNeighbors(combined);
    return combined.slice(0, topK);
}
