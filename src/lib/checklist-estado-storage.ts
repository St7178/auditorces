import { neon } from "@neondatabase/serverless";

function sql() {
    const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (!url) throw new Error("DATABASE_URL / POSTGRES_URL no está configurada");
    return neon(url);
}

let ready: Promise<void> | null = null;

async function ensureSchema() {
    if (!ready) {
        const db = sql();
        ready = db`
            CREATE TABLE IF NOT EXISTS checklist_estado (
                id TEXT PRIMARY KEY,
                completado BOOLEAN NOT NULL,
                actualizado_por TEXT,
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

// Un upsert por ítem (no read-modify-write de un blob completo) para que marcar varias casillas
// a la vez, desde distintas personas, nunca se pise entre sí.
export async function setChecklistItemEstado(id: string, completado: boolean, actualizadoPor?: string | null) {
    await ensureSchema();
    const db = sql();
    await db`
        INSERT INTO checklist_estado (id, completado, actualizado_por, updated_at)
        VALUES (${id}, ${completado}, ${actualizadoPor ?? null}, now())
        ON CONFLICT (id) DO UPDATE SET completado = EXCLUDED.completado, actualizado_por = EXCLUDED.actualizado_por, updated_at = now()
    `;
}

export async function getChecklistEstado(): Promise<Record<string, boolean>> {
    await ensureSchema();
    const db = sql();
    const rows = await db`SELECT id, completado FROM checklist_estado`;
    const mapa: Record<string, boolean> = {};
    for (const r of rows as unknown as { id: string; completado: boolean }[]) mapa[r.id] = r.completado;
    return mapa;
}
