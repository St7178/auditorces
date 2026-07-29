import index from "./index.json";

type KnowledgeChunk = { id: string; source: string; text: string; embedding: number[] };
type KnowledgeIndex = { model: string; generatedFrom: string[]; chunks: KnowledgeChunk[] };

const KNOWLEDGE_INDEX = index as KnowledgeIndex;

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
        body: JSON.stringify({ model: KNOWLEDGE_INDEX.model || "text-embedding-3-small", input: query }),
    });
    if (!res.ok) throw new Error(`OpenAI embeddings error ${res.status}: ${await res.text()}`);
    const json = await res.json();
    return json.data[0].embedding;
}

/**
 * Recupera los `topK` fragmentos de la base de conocimiento más relevantes para `query`.
 * Devuelve [] si el índice aún no fue generado (ver scripts/ingest-knowledge.mjs) o si falla el embedding.
 * `sourcePrefix`, si se indica, restringe la búsqueda a los chunks cuyo `source` empiece con ese texto
 * (ej. "iso27001" para priorizar la norma seleccionada en el chat, ver src/lib/knowledge/sources/*.md).
 */
export async function retrieveRelevantChunks(
    query: string,
    apiKey: string,
    topK = 5,
    sourcePrefix?: string,
): Promise<KnowledgeChunk[]> {
    if (KNOWLEDGE_INDEX.chunks.length === 0) return [];
    const pool = sourcePrefix ? KNOWLEDGE_INDEX.chunks.filter((c) => c.source.startsWith(sourcePrefix)) : KNOWLEDGE_INDEX.chunks;
    if (pool.length === 0) return [];
    try {
        const queryEmbedding = await embedQuery(query, apiKey);
        return [...pool]
            .map((chunk) => ({ chunk, score: cosineSimilarity(queryEmbedding, chunk.embedding) }))
            .sort((a, b) => b.score - a.score)
            .slice(0, topK)
            .map((r) => r.chunk);
    } catch (err) {
        console.error("retrieveRelevantChunks failed:", err);
        return [];
    }
}
