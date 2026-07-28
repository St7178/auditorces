import { neon } from "@neondatabase/serverless";

export type Hallazgo = {
    id: string;
    proceso: string;
    titulo: string;
    descripcion: string;
    nivelRiesgo: string | null;
    recomendacion: string;
    evidenciaUbicacion: string | null;
    estado: string;
    creadoEn: string;
};

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
            CREATE TABLE IF NOT EXISTS hallazgos_auditoria (
                id TEXT PRIMARY KEY,
                proceso TEXT NOT NULL,
                titulo TEXT NOT NULL,
                descripcion TEXT NOT NULL,
                nivel_riesgo TEXT,
                recomendacion TEXT NOT NULL,
                evidencia_ubicacion TEXT,
                estado TEXT NOT NULL DEFAULT 'Abierto',
                creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
            )
        `.then(() => undefined)
            .catch((err) => {
                ready = null;
                throw err;
            });
    }
    return ready;
}

export async function saveHallazgo(input: {
    proceso: string;
    titulo: string;
    descripcion: string;
    nivelRiesgo?: string | null;
    recomendacion: string;
    evidenciaUbicacion?: string | null;
}): Promise<Hallazgo> {
    await ensureSchema();
    const db = sql();
    const id = `H-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    const rows = await db`
        INSERT INTO hallazgos_auditoria (id, proceso, titulo, descripcion, nivel_riesgo, recomendacion, evidencia_ubicacion)
        VALUES (${id}, ${input.proceso}, ${input.titulo}, ${input.descripcion}, ${input.nivelRiesgo ?? null}, ${input.recomendacion}, ${input.evidenciaUbicacion ?? null})
        RETURNING id, proceso, titulo, descripcion, nivel_riesgo AS "nivelRiesgo", recomendacion,
                  evidencia_ubicacion AS "evidenciaUbicacion", estado, creado_en AS "creadoEn"
    `;
    return rows[0] as unknown as Hallazgo;
}

export async function getHallazgos(): Promise<Hallazgo[]> {
    await ensureSchema();
    const db = sql();
    const rows = await db`
        SELECT id, proceso, titulo, descripcion, nivel_riesgo AS "nivelRiesgo", recomendacion,
               evidencia_ubicacion AS "evidenciaUbicacion", estado, creado_en AS "creadoEn"
        FROM hallazgos_auditoria
        ORDER BY creado_en DESC
    `;
    return rows as unknown as Hallazgo[];
}
