import { neon } from "@neondatabase/serverless";

export type TipoActualizacion = "actualizacion" | "eliminacion" | "otro";

export type SigActualizacion = {
    id: string;
    mensajeId: string;
    tipo: TipoActualizacion;
    titulo: string;
    url: string;
    fecha: string;
    remitente: string | null;
    asunto: string;
};

const SELECT_COLUMNS = `
    id, mensaje_id AS "mensajeId", tipo, titulo, url, fecha, remitente, asunto
`;

// DATABASE_URL solo existe en tiempo de request en runtimes edge, no a nivel de módulo — igual que
// en sync-storage.ts/hallazgos-storage.ts, se resuelve fresco en cada llamada.
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
            CREATE TABLE IF NOT EXISTS sig_actualizaciones (
                id TEXT PRIMARY KEY,
                mensaje_id TEXT NOT NULL,
                tipo TEXT NOT NULL DEFAULT 'otro',
                titulo TEXT NOT NULL,
                url TEXT NOT NULL,
                fecha TIMESTAMPTZ NOT NULL,
                remitente TEXT,
                asunto TEXT NOT NULL,
                creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
            )
        `
            .then(() => undefined)
            .catch((err) => {
                ready = null;
                throw err;
            });
    }
    return ready;
}

export type NuevaActualizacion = {
    id: string;
    mensajeId: string;
    tipo: TipoActualizacion;
    titulo: string;
    url: string;
    fecha: string;
    remitente: string | null;
    asunto: string;
};

// Idempotente a propósito: el Schedule Trigger de n8n vuelve a traer los mismos correos cada corrida
// (el filtro de Outlook es por asunto/remitente, no "solo los nuevos") — reingestar el mismo id
// (mensaje + enlace) no debe duplicar la fila, así que es un INSERT ... ON CONFLICT DO NOTHING.
export async function guardarActualizaciones(items: NuevaActualizacion[]): Promise<number> {
    if (items.length === 0) return 0;
    await ensureSchema();
    const db = sql();
    let guardadas = 0;
    for (const it of items) {
        const rows = await db`
            INSERT INTO sig_actualizaciones (id, mensaje_id, tipo, titulo, url, fecha, remitente, asunto)
            VALUES (${it.id}, ${it.mensajeId}, ${it.tipo}, ${it.titulo}, ${it.url}, ${it.fecha}, ${it.remitente}, ${it.asunto})
            ON CONFLICT (id) DO NOTHING
            RETURNING id
        `;
        guardadas += rows.length;
    }
    return guardadas;
}

export async function getActualizaciones(limite = 8): Promise<SigActualizacion[]> {
    await ensureSchema();
    const db = sql();
    const rows = await db`
        SELECT ${db.unsafe(SELECT_COLUMNS)}
        FROM sig_actualizaciones
        ORDER BY fecha DESC
        LIMIT ${limite}
    `;
    return rows as unknown as SigActualizacion[];
}
