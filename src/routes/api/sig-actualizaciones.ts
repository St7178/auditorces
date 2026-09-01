import { createFileRoute } from "@tanstack/react-router";
import { existeBoletin, guardarBoletin, getUltimoBoletin, type EnlaceBoletin, type TipoActualizacion } from "@/lib/sig-actualizaciones-storage";

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
// cual vienen en el HTML, nunca se inventa a dónde apuntan. Nota: se intentó traer también las
// imágenes reales de esas páginas (ver historial), pero ni Vercel ni el propio n8n de Compunet
// pueden resolver wiki.grupocnet.com (confirmado: ENOTFOUND desde ambos) — es un dominio interno
// solo alcanzable desde una máquina/VPN con acceso real, así que por ahora esto se queda en
// mostrar los enlaces reales, sin imágenes automáticas.
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

async function procesarMensaje(mensaje: OutlookMessage): Promise<void> {
    if (!mensaje?.id) return;
    if (await existeBoletin(mensaje.id)) return;

    const fecha = mensaje.receivedDateTime ?? mensaje.sentDateTime ?? new Date().toISOString();
    const remitente = mensaje.from?.emailAddress?.name ?? mensaje.sender?.emailAddress?.name ?? null;
    const asunto = mensaje.subject ?? "Actualización SIG";
    const html = mensaje.body?.content ?? "";
    const enlaces = extraerEnlaces(html);

    await guardarBoletin({ id: mensaje.id, asunto, fecha, remitente, enlaces });
}

export const Route = createFileRoute("/api/sig-actualizaciones")({
    server: {
        handlers: {
            // Lectura pública, igual que el resto de /api/sync/* — Cultura SIG la consume desde una
            // página ya protegida por sesión, no hace falta duplicar la verificación acá. Devuelve
            // solo el boletín más reciente (o null si todavía no ha llegado ninguno).
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
