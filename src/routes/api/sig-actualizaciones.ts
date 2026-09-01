import { createFileRoute } from "@tanstack/react-router";
import {
    boletinNecesitaImagenes, guardarBoletin, getUltimoBoletin, type EnlaceBoletin, type ImagenBoletin, type TipoActualizacion,
} from "@/lib/sig-actualizaciones-storage";
import { subirImagenABlob } from "@/lib/blob-upload";

// "wiki.grupocnet.com" es un nombre interno de la red de Compunet — NO resuelve desde la red pública
// donde corren las funciones de Vercel (confirmado en producción: ENOTFOUND). n8n sí corre dentro de
// esa red, así que es n8n quien entra a la wiki, hace login y descarga las imágenes (ver el Code node
// documentado en el flujo) — acá solo se reciben esas imágenes ya en base64 para subirlas a Vercel
// Blob. Este endpoint YA NO intenta alcanzar la wiki por su cuenta.
type ImagenWikiEntrante = { pagina: string; nombre?: string; contentType?: string; base64: string };

// Forma cruda que trae el nodo "Get many messages" (Microsoft Outlook) de n8n, más el campo
// "imagenesWiki" que agrega el Code node nuevo del flujo (ver instrucciones de integración).
type OutlookMessage = {
    id: string;
    subject?: string;
    receivedDateTime?: string;
    sentDateTime?: string;
    webLink?: string;
    from?: { emailAddress?: { name?: string; address?: string } };
    sender?: { emailAddress?: { name?: string; address?: string } };
    body?: { content?: string; contentType?: string };
    imagenesWiki?: ImagenWikiEntrante[];
};

// El boletín mensual "Actualización y Eliminación Información Documentada" enlaza siempre a páginas
// reales de la wiki (ej. ".../index.php/Actualizaciones_Julio_2026") — se extraen esos enlaces tal
// cual vienen en el HTML, nunca se inventa a dónde apuntan.
const WIKI_LINK_RE = /href="(https?:\/\/wiki\.grupocnet\.com\/index\.php\/[^"]+)"/gi;

function tituloDesdeUrl(url: string): string {
    const slug = decodeURIComponent(url.split("/index.php/")[1] ?? url);
    return slug.replace(/_/g, " ").trim();
}

function normalizeTipo(titulo: string): TipoActualizacion {
    const t = titulo.toLowerCase();
    if (t.startsWith("actualizacion") || t.startsWith("actualización")) return "actualizacion";
    if (t.startsWith("eliminacion") || t.startsWith("eliminación")) return "eliminacion";
    return "otro";
}

function describirError(err: unknown): string {
    const e = err as any;
    const partes = [e?.message ?? String(e)];
    let cause = e?.cause;
    let vueltas = 0;
    while (cause && vueltas < 3) {
        partes.push(`causa: ${cause?.code ?? cause?.message ?? String(cause)}`);
        cause = cause?.cause;
        vueltas++;
    }
    return partes.join(" — ");
}

function extraerEnlaces(html: string): EnlaceBoletin[] {
    const enlaces = new Set<string>();
    WIKI_LINK_RE.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = WIKI_LINK_RE.exec(html))) enlaces.add(match[1]);
    return [...enlaces].map((url) => {
        const titulo = tituloDesdeUrl(url);
        return { titulo, url, tipo: normalizeTipo(titulo) };
    });
}

// Procesa un mensaje: si ya existe con imágenes guardadas, no hace nada. Si es nuevo, o existe pero
// se quedó sin imágenes (ej. n8n aún no mandaba "imagenesWiki" cuando llegó por primera vez), saca
// los enlaces del cuerpo y sube a Vercel Blob las imágenes que YA vinieron descargadas desde n8n.
async function procesarMensaje(mensaje: OutlookMessage): Promise<void> {
    if (!mensaje?.id) return;
    if (!(await boletinNecesitaImagenes(mensaje.id))) return;

    const fecha = mensaje.receivedDateTime ?? mensaje.sentDateTime ?? new Date().toISOString();
    const remitente = mensaje.from?.emailAddress?.name ?? mensaje.sender?.emailAddress?.name ?? null;
    const asunto = mensaje.subject ?? "Actualización SIG";
    const html = mensaje.body?.content ?? "";
    const enlaces = extraerEnlaces(html);

    const entrantes = Array.isArray(mensaje.imagenesWiki) ? mensaje.imagenesWiki : [];
    let imagenes: ImagenBoletin[] = [];
    let imagenesError: string | null = null;

    if (entrantes.length === 0 && enlaces.length > 0) {
        imagenesError = "n8n todavía no envió 'imagenesWiki' para este boletín — falta el paso de descarga en el flujo.";
    }

    for (const img of entrantes) {
        try {
            const buffer = Buffer.from(img.base64, "base64");
            const url = await subirImagenABlob(img.nombre || "imagen.jpg", buffer, img.contentType || "image/jpeg");
            const pagina = enlaces.find((e) => e.url === img.pagina);
            imagenes.push({ url, tipo: pagina?.tipo ?? "otro", pagina: img.pagina });
        } catch (err) {
            imagenesError = `Error subiendo imagen a Blob: ${describirError(err)}`;
        }
    }

    await guardarBoletin({ id: mensaje.id, asunto, fecha, remitente, enlaces, imagenes, imagenesError });
}

export const Route = createFileRoute("/api/sig-actualizaciones")({
    server: {
        handlers: {
            // Lectura pública, igual que el resto de /api/sync/* — el Dashboard/Cultura la consume
            // desde una página ya protegida por sesión, no hace falta duplicar la verificación acá.
            // Devuelve solo el boletín más reciente (o null si todavía no ha llegado ninguno).
            GET: async () => {
                const headers = { "Content-Type": "application/json", "Cache-Control": "no-store" };
                try {
                    const boletin = await getUltimoBoletin();
                    return new Response(JSON.stringify(boletin), { status: 200, headers });
                } catch {
                    return new Response(JSON.stringify(null), { status: 200, headers });
                }
            },
            // Webhook de n8n: Schedule Trigger (diario, 8am) -> Get many messages (Outlook) -> Code
            // node que entra a la wiki y descarga las imágenes (dentro de la red de Compunet, donde
            // n8n sí puede resolver wiki.grupocnet.com) -> HTTP Request POST acá. Mismo secreto
            // compartido que ya usa /api/sync/* — ver SYNC_SECRET en .env.example.
            POST: async ({ request }) => {
                try {
                    const secret = process.env.SYNC_SECRET;
                    if (secret) {
                        const provided = request.headers.get("x-sync-secret") || request.headers.get("authorization");
                        if (!provided || provided !== secret) return new Response("Unauthorized", { status: 401 });
                    }

                    const body = await request.json();
                    const mensajes: OutlookMessage[] = Array.isArray(body) ? body : Array.isArray(body?.items) ? body.items : [];
                    for (const mensaje of mensajes) {
                        await procesarMensaje(mensaje);
                    }
                    return new Response(JSON.stringify({ recibidos: mensajes.length }), { status: 200, headers: { "Content-Type": "application/json" } });
                } catch (err: any) {
                    return new Response(JSON.stringify({ error: String(err?.message ?? err) }), { status: 400, headers: { "Content-Type": "application/json" } });
                }
            },
        },
    },
});
