import { neon } from "@neondatabase/serverless";

let ready: Promise<void> | null = null;

function sql() {
    // La integración Vercel↔Neon inyecta POSTGRES_URL (pooled), no DATABASE_URL.
    const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (!url) throw new Error("DATABASE_URL / POSTGRES_URL no está configurada");
    return neon(url);
}

// Perezoso: DATABASE_URL solo existe en tiempo de request en runtimes edge, no a nivel de módulo.
async function ensureTable() {
    if (!ready) {
        const db = sql();
        ready = db`
            CREATE TABLE IF NOT EXISTS sync_blobs (
                key TEXT PRIMARY KEY,
                data JSONB NOT NULL,
                updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
            )
        `.then(() => undefined)
            .catch((err) => {
                ready = null;
                throw err;
            });
    }
    return ready;
}

async function writeBlob(key: string, data: unknown) {
    await ensureTable();
    const db = sql();
    await db`
        INSERT INTO sync_blobs (key, data, updated_at)
        VALUES (${key}, ${JSON.stringify(data)}, now())
        ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = now()
    `;
}

async function readBlob<T>(key: string): Promise<T | null> {
    await ensureTable();
    const db = sql();
    const rows = await db`SELECT data FROM sync_blobs WHERE key = ${key}`;
    if (!rows.length) return null;
    return rows[0].data as T;
}

export async function saveClientes(data: unknown) {
    return writeBlob("clientes", data);
}

export async function getClientes<T>(): Promise<T | null> {
    return readBlob<T>("clientes");
}

export async function saveRiesgos(data: unknown) {
    return writeBlob("riesgos", data);
}

export async function getRiesgos<T>(): Promise<T | null> {
    return readBlob<T>("riesgos");
}

export async function saveDocumentacion(data: unknown) {
    return writeBlob("documentacion", data);
}

export async function getDocumentacion<T>(): Promise<T | null> {
    return readBlob<T>("documentacion");
}

export async function saveChecklistClientes(data: unknown) {
    return writeBlob("checklist-clientes", data);
}

export async function getChecklistClientes<T>(): Promise<T | null> {
    return readBlob<T>("checklist-clientes");
}

export default {
    saveClientes, getClientes, saveRiesgos, getRiesgos, saveDocumentacion, getDocumentacion,
    saveChecklistClientes, getChecklistClientes,
};
