import { createFileRoute } from "@tanstack/react-router";
import { getCurrentSession } from "@/lib/auth/session";
import { getChecklistEstado, setChecklistItemEstado } from "@/lib/checklist-estado-storage";

export const Route = createFileRoute("/api/checklist-clientes-estado")({
    server: {
        handlers: {
            GET: async () => {
                const session = await getCurrentSession();
                if (!session) return new Response("Unauthorized", { status: 401 });

                try {
                    const estado = await getChecklistEstado();
                    return new Response(JSON.stringify(estado), { status: 200, headers: { "Content-Type": "application/json" } });
                } catch {
                    // Tabla aún no existe o DB inalcanzable: todo queda sin marcar.
                    return new Response(JSON.stringify({}), { status: 200, headers: { "Content-Type": "application/json" } });
                }
            },
            POST: async ({ request }) => {
                const session = await getCurrentSession();
                if (!session) return new Response("Unauthorized", { status: 401 });

                try {
                    const body = (await request.json()) as { id?: string; completado?: boolean };
                    if (typeof body.id !== "string" || !body.id || typeof body.completado !== "boolean") {
                        return new Response(JSON.stringify({ error: "Se espera { id: string, completado: boolean }" }), { status: 400, headers: { "Content-Type": "application/json" } });
                    }
                    await setChecklistItemEstado(body.id, body.completado, session.email ?? session.name ?? null);
                    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } });
                } catch (err: any) {
                    return new Response(JSON.stringify({ error: String(err?.message ?? err) }), { status: 400, headers: { "Content-Type": "application/json" } });
                }
            },
        },
    },
});
