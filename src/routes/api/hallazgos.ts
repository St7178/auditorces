import { createFileRoute } from "@tanstack/react-router";
import { getHallazgos, setMitigacion } from "@/lib/hallazgos-storage";
import { getCurrentSession } from "@/lib/auth/session";

export const Route = createFileRoute("/api/hallazgos")({
    server: {
        handlers: {
            GET: async () => {
                const session = await getCurrentSession();
                if (!session) return new Response("Unauthorized", { status: 401 });

                try {
                    const hallazgos = await getHallazgos();
                    return new Response(JSON.stringify(hallazgos), { status: 200, headers: { "Content-Type": "application/json" } });
                } catch {
                    return new Response(JSON.stringify([]), { status: 200, headers: { "Content-Type": "application/json" } });
                }
            },
            POST: async ({ request }) => {
                const session = await getCurrentSession();
                if (!session) return new Response("Unauthorized", { status: 401 });

                try {
                    const body = (await request.json()) as { id?: string; mitigado?: boolean; comentario?: string | null };
                    if (typeof body.id !== "string" || !body.id || typeof body.mitigado !== "boolean") {
                        return new Response(JSON.stringify({ error: "Se espera { id: string, mitigado: boolean, comentario?: string }" }), { status: 400, headers: { "Content-Type": "application/json" } });
                    }
                    const hallazgo = await setMitigacion(body.id, body.mitigado, body.comentario ?? null);
                    return new Response(JSON.stringify(hallazgo), { status: 200, headers: { "Content-Type": "application/json" } });
                } catch (err: any) {
                    return new Response(JSON.stringify({ error: String(err?.message ?? err) }), { status: 400, headers: { "Content-Type": "application/json" } });
                }
            },
        },
    },
});
