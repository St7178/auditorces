import { createFileRoute } from "@tanstack/react-router";
import { getProveedores, saveProveedores } from "@/lib/sync-storage";
import { PROVEEDORES } from "@/lib/ces-data";

export const Route = createFileRoute("/api/sync/proveedores")({
    server: {
        handlers: {
            GET: async () => {
                let data: typeof PROVEEDORES = PROVEEDORES;
                try {
                    const stored = await getProveedores<typeof PROVEEDORES>();
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
                        return new Response(JSON.stringify({ error: "El body debe ser un array de proveedores" }), { status: 400, headers: { "Content-Type": "application/json" } });
                    }
                    await saveProveedores(body);
                    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } });
                } catch (err: any) {
                    return new Response(JSON.stringify({ error: String(err?.message ?? err) }), { status: 400, headers: { "Content-Type": "application/json" } });
                }
            },
        },
    },
});
