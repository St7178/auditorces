import { createFileRoute } from "@tanstack/react-router";
import { guardarActualizaciones, getActualizaciones, type NuevaActualizacion, type TipoActualizacion } from "@/lib/sig-actualizaciones-storage";

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

function extraerActualizaciones(mensaje: OutlookMessage): NuevaActualizacion[] {
    if (!mensaje?.id) return [];
    const fecha = mensaje.receivedDateTime ?? mensaje.sentDateTime ?? new Date().toISOString();
    const remitente = mensaje.from?.emailAddress?.name ?? mensaje.sender?.emailAddress?.name ?? null;
    const asunto = mensaje.subject ?? "Actualización SIG";
    const html = mensaje.body?.content ?? "";

    const enlaces = new Set<string>();
    WIKI_LINK_RE.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = WIKI_LINK_RE.exec(html))) enlaces.add(match[1]);

    // Sin enlaces reconocidos en el cuerpo (ej. un formato de correo distinto) — se guarda igual
    // apuntando al correo original en vez de perder el aviso por completo.
    if (enlaces.size === 0) {
        if (!mensaje.webLink) return [];
        return [{
            id: `${mensaje.id}::correo`,
            mensajeId: mensaje.id,
            tipo: "otro",
            titulo: asunto,
            url: mensaje.webLink,
            fecha,
            remitente,
            asunto,
        }];
    }

    return [...enlaces].map((url) => {
        const titulo = tituloDesdeUrl(url);
        return {
            id: `${mensaje.id}::${url}`,
            mensajeId: mensaje.id,
            tipo: normalizeTipo(titulo),
            titulo,
            url,
            fecha,
            remitente,
            asunto,
        };
    });
}

export const Route = createFileRoute("/api/sig-actualizaciones")({
    server: {
        handlers: {
            // Lectura pública, igual que el resto de /api/sync/* — el Dashboard la consume desde una
            // página ya protegida por sesión, no hace falta duplicar la verificación acá.
            GET: async () => {
                try {
                    const items = await getActualizaciones(8);
                    return new Response(JSON.stringify(items), { status: 200, headers: { "Content-Type": "application/json" } });
                } catch {
                    return new Response(JSON.stringify([]), { status: 200, headers: { "Content-Type": "application/json" } });
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
                    const items = mensajes.flatMap(extraerActualizaciones);
                    const guardadas = await guardarActualizaciones(items);
                    return new Response(
                        JSON.stringify({ recibidos: mensajes.length, extraidos: items.length, guardadas }),
                        { status: 200, headers: { "Content-Type": "application/json" } },
                    );
                } catch (err: any) {
                    return new Response(JSON.stringify({ error: String(err?.message ?? err) }), { status: 400, headers: { "Content-Type": "application/json" } });
                }
            },
        },
    },
});
