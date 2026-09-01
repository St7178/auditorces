import { neon } from "@neondatabase/serverless";

export type TipoActualizacion = "actualizacion" | "eliminacion" | "otro";

export type EnlaceBoletin = { titulo: string; url: string; tipo: TipoActualizacion };

// Cada imagen queda ligada a la página de la que salió (para saber a qué enlace de la wiki apunta
// cada una en el carrusel), no solo mezcladas en una lista plana de URLs.
export type ImagenBoletin = { url: string; tipo: TipoActualizacion; pagina: string };

export type SigBoletin = {
    id: string;
    asunto: string;
    fecha: string;
    remitente: string | null;
    enlaces: EnlaceBoletin[];
    imagenes: ImagenBoletin[];
    imagenesError: string | null;
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
                imagenes JSONB NOT NULL DEFAULT '[]',
                creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
            )
        `
            // imagenes_error guarda por qué no se pudieron traer las imágenes de la wiki (falta de
            // credenciales, login fallido, etc.) — sin esto, un boletín sin imágenes no dejaba ningún
            // rastro de la causa y quedaba imposible de diagnosticar desde afuera.
            .then(() => db`ALTER TABLE sig_boletines ADD COLUMN IF NOT EXISTS imagenes_error TEXT`)
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
// lo nuevo") — se comprueba esto ANTES de ir a la wiki a buscar imágenes, para no reintentar ese
// trabajo (login + descarga) todos los días con boletines que YA tienen sus imágenes guardadas. Si
// el boletín existe pero quedó sin imágenes (ej. por un error momentáneo), sí se debe reintentar.
export async function boletinNecesitaImagenes(id: string): Promise<boolean> {
    await ensureSchema();
    const db = sql();
    const rows = await db`SELECT imagenes FROM sig_boletines WHERE id = ${id}`;
    if (!rows.length) return true; // no existe todavía: es nuevo, hay que procesarlo
    const imagenes = (rows[0] as any).imagenes;
    return !Array.isArray(imagenes) || imagenes.length === 0;
}

export async function guardarBoletin(b: SigBoletin): Promise<void> {
    await ensureSchema();
    const db = sql();
    await db`
        INSERT INTO sig_boletines (id, asunto, fecha, remitente, enlaces, imagenes, imagenes_error)
        VALUES (${b.id}, ${b.asunto}, ${b.fecha}, ${b.remitente}, ${JSON.stringify(b.enlaces)}::jsonb, ${JSON.stringify(b.imagenes)}::jsonb, ${b.imagenesError})
        ON CONFLICT (id) DO UPDATE SET
            imagenes = EXCLUDED.imagenes,
            imagenes_error = EXCLUDED.imagenes_error
    `;
}

// Solo el boletín más reciente — el carrusel del Dashboard/Cultura muestra "el reporte de este mes",
// no un historial mezclado de todos los boletines guardados.
export async function getUltimoBoletin(): Promise<SigBoletin | null> {
    await ensureSchema();
    const db = sql();
    const rows = await db`
        SELECT id, asunto, fecha, remitente, enlaces, imagenes, imagenes_error AS "imagenesError"
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
        imagenes: r.imagenes ?? [],
        imagenesError: r.imagenesError ?? null,
    };
}
