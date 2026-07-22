import { createFileRoute } from "@tanstack/react-router";
import { getCurrentSession } from "@/lib/auth/session";
import { RIESGOS } from "@/lib/ces-data";

interface RiesgoUpdate {
    id: string;
    nombre?: string;
    nivel?: "Bajo" | "Medio" | "Alto" | "Crítico";
    estado?: string;
    responsable?: string;
    ultimaActualizacion?: string;
    proximaRevision?: string;
    evidencia?: string;
}

// En memoria - para producción usar BD
let riesgosActualizados = JSON.parse(JSON.stringify(RIESGOS));

export const Route = createFileRoute("/api/riesgos")({
    server: {
        handlers: {
            // GET: obtener todos los riesgos
            GET: async () => {
                const session = await getCurrentSession();
                if (!session) return new Response("Unauthorized", { status: 401 });

                return new Response(JSON.stringify({ riesgos: riesgosActualizados }), {
                    status: 200,
                    headers: { "Content-Type": "application/json" },
                });
            },

            // PATCH: actualizar uno o múltiples riesgos
            PATCH: async ({ request }) => {
                const session = await getCurrentSession();
                if (!session) return new Response("Unauthorized", { status: 401 });

                try {
                    const body = await request.json();
                    const updates: RiesgoUpdate[] = Array.isArray(body) ? body : [body];

                    const resultados: { id: string; actualizado: boolean; error?: string }[] = [];

                    for (const update of updates) {
                        const riesgo = riesgosActualizados.find((r: any) => r.id === update.id);
                        if (!riesgo) {
                            resultados.push({ id: update.id, actualizado: false, error: "Riesgo no encontrado" });
                            continue;
                        }

                        // Actualizar campos
                        if (update.nombre) riesgo.nombre = update.nombre;
                        if (update.nivel) riesgo.nivel = update.nivel;
                        if (update.estado) riesgo.estado = update.estado;
                        if (update.responsable) riesgo.responsable = update.responsable;
                        if (update.ultimaActualizacion) riesgo.ultimaActualizacion = update.ultimaActualizacion;
                        if (update.proximaRevision) riesgo.proximaRevision = update.proximaRevision;
                        if (update.evidencia) riesgo.evidencia = update.evidencia;

                        resultados.push({ id: update.id, actualizado: true });
                    }

                    return new Response(JSON.stringify({ resultados, riesgos: riesgosActualizados }), {
                        status: 200,
                        headers: { "Content-Type": "application/json" },
                    });
                } catch (error) {
                    return new Response(JSON.stringify({ error: "Error procesando actualización" }), {
                        status: 400,
                        headers: { "Content-Type": "application/json" },
                    });
                }
            },
        },
    },
});
