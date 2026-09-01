import { neon } from "@neondatabase/serverless";

export type TipoActualizacion = "actualizacion" | "eliminacion" | "otro";

export type EnlaceBoletin = { titulo: string; url: string; tipo: TipoActualizacion };

export type SigBoletin = {
    id: string;
    asunto: string;
    fecha: string;
    remitente: string | null;
    enlaces: EnlaceBoletin[];
};

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
            CREATE TABLE IF NOT EXISTS sig_boletines (
                id TEXT PRIMARY KEY,
                asunto TEXT NOT NULL,
                fecha TIMESTAMPTZ NOT NULL,
                remitente TEXT,
                enlaces JSONB NOT NULL DEFAULT '[]',
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

// Un boletín = un correo de "Actualización y Eliminación Información Documentada". El Schedule
// Trigger de n8n vuelve a traer el mismo correo cada corrida (filtra por asunto/remitente, no "solo
// lo nuevo") — se comprueba esto para no volver a insertar el mismo boletín todos los días.
export async function existeBoletin(id: string): Promise<boolean> {
    await ensureSchema();
    const db = sql();
    const rows = await db`SELECT 1 FROM sig_boletines WHERE id = ${id}`;
    return rows.length > 0;
}

export async function guardarBoletin(b: SigBoletin): Promise<void> {
    await ensureSchema();
    const db = sql();
    await db`
        INSERT INTO sig_boletines (id, asunto, fecha, remitente, enlaces)
        VALUES (${b.id}, ${b.asunto}, ${b.fecha}, ${b.remitente}, ${JSON.stringify(b.enlaces)}::jsonb)
        ON CONFLICT (id) DO NOTHING
    `;
}

// Solo el boletín más reciente — la tarjeta de Cultura SIG muestra "el reporte de este mes", no un
// historial mezclado de todos los boletines guardados.
export async function getUltimoBoletin(): Promise<SigBoletin | null> {
    await ensureSchema();
    const db = sql();
    const rows = await db`
        SELECT id, asunto, fecha, remitente, enlaces
        FROM sig_boletines
        ORDER BY fecha DESC
        LIMIT 1
    `;
    if (!rows.length) return null;
    const r = rows[0] as any;
    return {
        id: r.id,
        asunto: r.asunto,
        fecha: r.fecha,
        remitente: r.remitente,
        enlaces: r.enlaces ?? [],
    };
}
