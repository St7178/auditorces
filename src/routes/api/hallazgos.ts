import { createFileRoute } from "@tanstack/react-router";
import { getHallazgos } from "@/lib/hallazgos-storage";
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
        },
    },
});
