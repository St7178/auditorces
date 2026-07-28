import { createFileRoute } from "@tanstack/react-router";
import { getCurrentSession } from "@/lib/auth/session";
import { getRiesgos, getClientes, getDocumentacion } from "@/lib/sync-storage";
import { getHallazgos } from "@/lib/hallazgos-storage";
import { REGISTRO_RIESGOS_CES, CLIENTES, DOCUMENTOS } from "@/lib/ces-data";

export type Notificacion = {
    id: string;
    tipo: "contrato" | "riesgo" | "documento" | "hallazgo";
    nivel: "alta" | "media" | "baja";
    titulo: string;
    detalle: string;
    href: string;
};

export const Route = createFileRoute("/api/notificaciones")({
    server: {
        handlers: {
            GET: async () => {
                const session = await getCurrentSession();
                if (!session) return new Response("Unauthorized", { status: 401 });

                const notifs: Notificacion[] = [];

                try {
                    const clientes = (await getClientes<typeof CLIENTES>().catch(() => null)) ?? CLIENTES;
                    for (const c of clientes as any[]) {
                        for (const ct of c.contratos || []) {
                            if (ct.estado === "Próximo a vencer") {
                                notifs.push({
                                    id: `contrato-${ct.id}`,
                                    tipo: "contrato",
                                    nivel: "media",
                                    titulo: `Contrato ${ct.id} próximo a vencer`,
                                    detalle: `${c.nombre} · vence ${ct.fin}`,
                                    href: "/clientes",
                                });
                            }
                        }
                    }
                } catch {
                    /* sin notificaciones de contratos si falla */
                }

                try {
                    const riesgos = (await getRiesgos<typeof REGISTRO_RIESGOS_CES>().catch(() => null)) ?? REGISTRO_RIESGOS_CES;
                    for (const r of riesgos as any[]) {
                        const severidad = r.nivelResidual?.severidad;
                        if (severidad === "Alto" || severidad === "Crítico") {
                            notifs.push({
                                id: `riesgo-${r.id}`,
                                tipo: "riesgo",
                                nivel: severidad === "Crítico" ? "alta" : "media",
                                titulo: `Riesgo residual ${severidad.toLowerCase()}`,
                                detalle: `${r.id} · ${r.descripcion?.slice(0, 80) ?? ""}`,
                                href: "/riesgos",
                            });
                        }
                    }
                } catch {
                    /* sin notificaciones de riesgos si falla */
                }

                try {
                    const documentos = (await getDocumentacion<typeof DOCUMENTOS>().catch(() => null)) ?? DOCUMENTOS;
                    for (const d of documentos as any[]) {
                        if (d.estado === "Requiere revisión") {
                            notifs.push({
                                id: `documento-${d.id}`,
                                tipo: "documento",
                                nivel: "baja",
                                titulo: "Documento requiere revisión",
                                detalle: d.nombre,
                                href: "/procesos",
                            });
                        }
                    }
                } catch {
                    /* sin notificaciones de documentos si falla */
                }

                try {
                    const hallazgos = await getHallazgos();
                    for (const h of hallazgos.filter((x) => x.estado === "Abierto").slice(0, 10)) {
                        notifs.push({
                            id: `hallazgo-${h.id}`,
                            tipo: "hallazgo",
                            nivel: h.nivelRiesgo === "Crítico" || h.nivelRiesgo === "Alto" ? "alta" : "media",
                            titulo: `Hallazgo abierto: ${h.titulo}`,
                            detalle: h.proceso,
                            href: "/",
                        });
                    }
                } catch {
                    /* sin notificaciones de hallazgos si falla (tabla puede no existir aún) */
                }

                const orden = { alta: 0, media: 1, baja: 2 };
                notifs.sort((a, b) => orden[a.nivel] - orden[b.nivel]);

                return new Response(JSON.stringify(notifs), { status: 200, headers: { "Content-Type": "application/json" } });
            },
        },
    },
});
