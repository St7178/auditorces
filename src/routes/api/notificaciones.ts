import { createFileRoute } from "@tanstack/react-router";
import { getCurrentSession } from "@/lib/auth/session";
import { getRiesgos, getClientes, getDocumentacion } from "@/lib/sync-storage";
import { getHallazgos } from "@/lib/hallazgos-storage";
import { REGISTRO_RIESGOS_CES, CLIENTES, DOCUMENTOS, PROVEEDORES, INDICADORES } from "@/lib/ces-data";

export type Notificacion = {
    id: string;
    tipo: "contrato" | "riesgo" | "documento" | "hallazgo" | "insight";
    nivel: "alta" | "media" | "baja";
    titulo: string;
    detalle: string;
    href: string;
};

function mesesDesde(fechaIso: string): number {
    const entonces = new Date(fechaIso);
    if (isNaN(entonces.getTime())) return 0;
    const ahora = new Date();
    return (ahora.getFullYear() - entonces.getFullYear()) * 12 + (ahora.getMonth() - entonces.getMonth());
}

function diasDesde(fechaIso: string): number {
    const entonces = new Date(fechaIso);
    if (isNaN(entonces.getTime())) return 0;
    return Math.floor((Date.now() - entonces.getTime()) / (1000 * 60 * 60 * 24));
}

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

                    // Insight: el sistema detecta cuándo fue la última actualización real de la matriz
                    // completa (la más reciente entre todos los riesgos), no de un riesgo puntual.
                    const fechas = (riesgos as any[]).map((r) => r.fechaActualizacion).filter(Boolean);
                    if (fechas.length) {
                        const masReciente = fechas.reduce((a, b) => (new Date(a) > new Date(b) ? a : b));
                        const meses = mesesDesde(masReciente);
                        if (meses >= 6) {
                            notifs.push({
                                id: "insight-matriz-riesgos",
                                tipo: "insight",
                                nivel: meses >= 12 ? "alta" : "media",
                                titulo: `Hace ${meses} meses no actualizas la matriz de riesgos`,
                                detalle: `Última actualización registrada: ${masReciente}`,
                                href: "/riesgos",
                            });
                        }
                    }
                } catch {
                    /* sin notificaciones de riesgos si falla */
                }

                try {
                    // Insight: proveedores cuya última evaluación no cayó en el año en curso.
                    const añoActual = new Date().getFullYear();
                    for (const p of PROVEEDORES) {
                        const añoEvaluacion = new Date(p.ultimaEvaluacion).getFullYear();
                        if (añoEvaluacion < añoActual) {
                            notifs.push({
                                id: `insight-proveedor-${p.id}`,
                                tipo: "insight",
                                nivel: "media",
                                titulo: `${p.nombre} no ha sido evaluado este año`,
                                detalle: `Última evaluación: ${p.ultimaEvaluacion}`,
                                href: "/proveedores",
                            });
                        }
                    }
                } catch {
                    /* sin notificaciones de proveedores si falla */
                }

                try {
                    // Insight: indicadores cuyo último valor bajó frente al mes anterior (historico[-1] < historico[-2]).
                    for (const i of INDICADORES) {
                        const h = i.historico;
                        if (h.length >= 2 && h[h.length - 1] < h[h.length - 2]) {
                            notifs.push({
                                id: `insight-indicador-${i.id}`,
                                tipo: "insight",
                                nivel: "media",
                                titulo: `El indicador de ${i.nombre} bajó frente al mes anterior`,
                                detalle: `${h[h.length - 2]}${i.unidad} → ${h[h.length - 1]}${i.unidad}`,
                                href: "/indicadores",
                            });
                        }
                    }
                } catch {
                    /* sin notificaciones de indicadores si falla */
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

                    // Insight: hace cuánto no hay actividad de auditoría real (CES AUDITOR registrando
                    // hallazgos) — es la única señal persistida de que se hizo una autoauditoría.
                    if (hallazgos.length === 0) {
                        notifs.push({
                            id: "insight-autoauditoria",
                            tipo: "insight",
                            nivel: "media",
                            titulo: "Aún no registras ninguna autoauditoría con CES AUDITOR",
                            detalle: "Inicia una conversación en CES AUDITOR para auditar un proceso",
                            href: "/guardian",
                        });
                    } else {
                        const dias = diasDesde(hallazgos[0].creadoEn);
                        if (dias >= 60) {
                            notifs.push({
                                id: "insight-autoauditoria",
                                tipo: "insight",
                                nivel: dias >= 90 ? "alta" : "media",
                                titulo: `Hace ${dias} días no realizas una autoauditoría`,
                                detalle: "Última actividad registrada en CES AUDITOR",
                                href: "/guardian",
                            });
                        }
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
