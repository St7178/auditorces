import { createFileRoute } from "@tanstack/react-router";
import { getRiesgos, saveRiesgos } from "@/lib/sync-storage";
import { REGISTRO_RIESGOS_CES } from "@/lib/ces-data";

export const Route = createFileRoute("/api/sync/riesgos")({
    server: {
        handlers: {
            GET: async () => {
                let data: typeof REGISTRO_RIESGOS_CES = REGISTRO_RIESGOS_CES;
                try {
                    const stored = await getRiesgos<typeof REGISTRO_RIESGOS_CES>();
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
                        return new Response(JSON.stringify({ error: "El body debe ser un array de riesgos" }), { status: 400, headers: { "Content-Type": "application/json" } });
                    }
                    await saveRiesgos(body);
                    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } });
                } catch (err: any) {
                    return new Response(JSON.stringify({ error: String(err?.message ?? err) }), { status: 400, headers: { "Content-Type": "application/json" } });
                }
            },
        },
    },
});
