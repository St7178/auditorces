import { createFileRoute } from "@tanstack/react-router";
import { getClientes, saveClientes } from "@/lib/sync-storage";
import { CLIENTES } from "@/lib/ces-data";

export const Route = createFileRoute("/api/sync/clientes")({
    server: {
        handlers: {
            GET: async () => {
                const stored = await getClientes<typeof CLIENTES>();
                const data = stored ?? CLIENTES;
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
                    await saveClientes(body);
                    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } });
                } catch (err: any) {
                    return new Response(JSON.stringify({ error: String(err?.message ?? err) }), { status: 400, headers: { "Content-Type": "application/json" } });
                }
            },
        },
    },
});
