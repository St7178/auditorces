import { createFileRoute } from "@tanstack/react-router";
import { getChecklistClientes, saveChecklistClientes } from "@/lib/sync-storage";
import { CHECKLIST_DOCUMENTACION_CLIENTES } from "@/lib/ces-data";

function isChecklistPayload(body: unknown): body is { cliente: unknown[]; interna: unknown[] } {
    if (!body || typeof body !== "object") return false;
    const b = body as any;
    return Array.isArray(b.cliente) && Array.isArray(b.interna);
}

export const Route = createFileRoute("/api/sync/checklist-clientes")({
    server: {
        handlers: {
            GET: async () => {
                let data: typeof CHECKLIST_DOCUMENTACION_CLIENTES = CHECKLIST_DOCUMENTACION_CLIENTES;
                try {
                    const stored = await getChecklistClientes<typeof CHECKLIST_DOCUMENTACION_CLIENTES>();
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
                    if (!isChecklistPayload(body)) {
                        return new Response(
                            JSON.stringify({ error: "El body debe ser { cliente: [...], interna: [...] }" }),
                            { status: 400, headers: { "Content-Type": "application/json" } },
                        );
                    }
                    // Reemplazo completo: el checklist solo cambia (se agregan o quitan items) cuando
                    // corre el flujo de n8n y vuelve a leer el Excel desde SharePoint.
                    await saveChecklistClientes(body);
                    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } });
                } catch (err: any) {
                    return new Response(JSON.stringify({ error: String(err?.message ?? err) }), { status: 400, headers: { "Content-Type": "application/json" } });
                }
            },
        },
    },
});
