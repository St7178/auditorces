import { createFileRoute } from "@tanstack/react-router";
import {
    boletinNecesitaImagenes, guardarBoletin, getUltimoBoletin, type EnlaceBoletin, type ImagenBoletin, type TipoActualizacion,
} from "@/lib/sig-actualizaciones-storage";
import { obtenerImagenesDeBoletin } from "@/lib/wiki-images";
import { subirImagenABlob } from "@/lib/blob-upload";

// Forma cruda que trae el nodo "Get many messages" (Microsoft Outlook) de n8n — solo se leen los
// campos que de verdad se usan, el resto del objeto real (mucho más grande) se ignora.
type OutlookMessage = {
    id: string;
    subject?: string;
    receivedDateTime?: string;
    sentDateTime?: string;
    webLink?: string;
    from?: { emailAddress?: { name?: string; address?: string } };
    sender?: { emailAddress?: { name?: string; address?: string } };
    body?: { content?: string; contentType?: string };
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

// "fetch failed" (el mensaje genérico de undici/Node para cualquier error de red) no dice nada por
// sí solo — la causa real (DNS, conexión rechazada, timeout, certificado) vive en err.cause. Se
// desenvuelve para que imagenes_error de verdad sirva para diagnosticar en vez de repetir lo mismo.
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

// Procesa un mensaje: si ya existe con imágenes guardadas, no hace nada (evita volver a loguearse en
// la wiki y redescargar todo cada corrida). Si es nuevo, o existe pero se quedó sin imágenes (ej. un
// error momentáneo), saca los enlaces del cuerpo, va a buscar las imágenes reales del boletín en la
// wiki, las sube a Vercel Blob, y guarda todo junto — incluido el motivo si algo falla, para poder
// diagnosticarlo desde afuera en vez de quedar en silencio.
async function procesarMensaje(mensaje: OutlookMessage): Promise<void> {
    if (!mensaje?.id) return;
    if (!(await boletinNecesitaImagenes(mensaje.id))) return;

    const fecha = mensaje.receivedDateTime ?? mensaje.sentDateTime ?? new Date().toISOString();
    const remitente = mensaje.from?.emailAddress?.name ?? mensaje.sender?.emailAddress?.name ?? null;
    const asunto = mensaje.subject ?? "Actualización SIG";
    const html = mensaje.body?.content ?? "";
    const enlaces = extraerEnlaces(html);

    let imagenes: ImagenBoletin[] = [];
    let imagenesError: string | null = null;
    if (enlaces.length > 0) {
        try {
            const descargadas = await obtenerImagenesDeBoletin(enlaces.map((e) => ({ url: e.url, titulo: e.titulo })));
            for (const img of descargadas) {
                try {
                    const url = await subirImagenABlob(img.nombre, img.buffer, img.contentType);
                    const pagina = enlaces.find((e) => e.url === img.pagina.url);
                    imagenes.push({ url, tipo: pagina?.tipo ?? "otro", pagina: img.pagina.url });
                } catch (err) {
                    imagenesError = `Error subiendo imagen a Blob: ${describirError(err)}`;
                }
            }
        } catch (err) {
            imagenesError = describirError(err);
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
            // Webhook de n8n: Schedule Trigger (diario, 8am) -> Get many messages (Outlook) -> HTTP
            // Request POST acá con el array de mensajes. Mismo secreto compartido que ya usa
            // /api/sync/* — ver SYNC_SECRET en .env.example.
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
