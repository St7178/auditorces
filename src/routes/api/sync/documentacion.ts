import { createFileRoute } from "@tanstack/react-router";
import { getDocumentacion, saveDocumentacion } from "@/lib/sync-storage";
import { DOCUMENTOS } from "@/lib/ces-data";

export const Route = createFileRoute("/api/sync/documentacion")({
    server: {
        handlers: {
            GET: async () => {
                let data: typeof DOCUMENTOS = DOCUMENTOS;
                try {
                    const stored = await getDocumentacion<typeof DOCUMENTOS>();
                    if (stored) data = stored;
                } catch {
                    // DB no configurada o inalcanzable: se sirve el fallback estático.
                }
                return new Response(JSON.stringify(data), { status: 200, headers: { "Content-Type": "application/json" } });
            },
            POST: async ({ request }) => {
                try {
                    const secret = process.env.SYNC_SECRET;
                    if (secret) {
                        const provided = request.headers.get("x-sync-secret") || request.headers.get("authorization");
                        if (!provided || provided !== secret) return new Response("Unauthorized", { status: 401 });
                    }
                    const body = (await request.json()) as unknown;
                    if (!Array.isArray(body)) {
                        return new Response(JSON.stringify({ error: "El body debe ser un array de documentos" }), { status: 400, headers: { "Content-Type": "application/json" } });
                    }
                    await saveDocumentacion(body);
                    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } });
                } catch (err: any) {
                    return new Response(JSON.stringify({ error: String(err?.message ?? err) }), { status: 400, headers: { "Content-Type": "application/json" } });
                }
            },
        },
    },
});
