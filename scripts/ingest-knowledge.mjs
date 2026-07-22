// Genera src/lib/knowledge/index.json a partir de los .md en src/lib/knowledge/sources/.
// Uso: OPENAI_API_KEY=sk-... npm run ingest:knowledge
// Volver a correr este script cada vez que se agregue o edite un documento fuente.
import { readdir, readFile, writeFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SOURCES_DIR = path.join(__dirname, "..", "src", "lib", "knowledge", "sources");
const OUTPUT_FILE = path.join(__dirname, "..", "src", "lib", "knowledge", "index.json");
const EMBEDDING_MODEL = "text-embedding-3-small";
const CHUNK_SIZE = 1200; // caracteres aprox. por chunk
const CHUNK_OVERLAP = 150;

function loadDotEnvIfPresent() {
    const envPath = path.join(__dirname, "..", ".env");
    if (!existsSync(envPath) || process.env.OPENAI_API_KEY) return;
    const raw = readFileSync(envPath, "utf-8");
    for (const line of raw.split("\n")) {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
        if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
}

// Trocea por párrafos/secciones (líneas en blanco) y agrupa hasta CHUNK_SIZE, con solape entre chunks.
function chunkText(text, source) {
    const paragraphs = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
    const chunks = [];
    let current = "";
    for (const p of paragraphs) {
        if ((current + "\n\n" + p).length > CHUNK_SIZE && current) {
            chunks.push(current);
            current = current.slice(-CHUNK_OVERLAP) + "\n\n" + p;
        } else {
            current = current ? current + "\n\n" + p : p;
        }
    }
    if (current) chunks.push(current);
    return chunks.map((text, i) => ({ id: `${source}#${i}`, source, text }));
}

async function embed(texts, apiKey) {
    const res = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model: EMBEDDING_MODEL, input: texts }),
    });
    if (!res.ok) {
        throw new Error(`OpenAI embeddings error ${res.status}: ${await res.text()}`);
    }
    const json = await res.json();
    return json.data.map((d) => d.embedding);
}

async function main() {
    loadDotEnvIfPresent();
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        console.error("Falta OPENAI_API_KEY (variable de entorno o archivo .env en la raíz del proyecto).");
        process.exit(1);
    }

    const files = (await readdir(SOURCES_DIR)).filter((f) => f.endsWith(".md"));
    if (files.length === 0) {
        console.error(`No se encontraron archivos .md en ${SOURCES_DIR}`);
        process.exit(1);
    }

    let allChunks = [];
    for (const file of files) {
        const text = await readFile(path.join(SOURCES_DIR, file), "utf-8");
        allChunks.push(...chunkText(text, file.replace(/\.md$/, "")));
    }

    console.log(`Generando embeddings para ${allChunks.length} chunks de ${files.length} documento(s)...`);

    // OpenAI acepta batches de input; los partimos de a 64 por seguridad.
    const BATCH = 64;
    for (let i = 0; i < allChunks.length; i += BATCH) {
        const batch = allChunks.slice(i, i + BATCH);
        const embeddings = await embed(batch.map((c) => c.text), apiKey);
        batch.forEach((c, j) => (c.embedding = embeddings[j]));
    }

    const output = {
        model: EMBEDDING_MODEL,
        generatedFrom: files,
        chunks: allChunks,
    };

    await writeFile(OUTPUT_FILE, JSON.stringify(output));
    console.log(`Listo: ${OUTPUT_FILE} (${allChunks.length} chunks).`);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
