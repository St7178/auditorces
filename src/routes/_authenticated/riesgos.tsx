import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { PageHeader } from "@/components/page-header";
import { RIESGOS, METODOLOGIA_RIESGOS, REGISTRO_RIESGOS_CES } from "@/lib/ces-data";
import { ShieldAlert, Sparkles, BookOpen, FileSpreadsheet } from "lucide-react";

export const Route = createFileRoute("/_authenticated/riesgos")({
    component: RiesgosPage,
    head: () => ({ meta: [{ title: "Riesgos Operacionales — CES SIG" }] }),
});

function nivelTone(n: string) {
    if (n === "Crítico") return "bg-red-100 text-red-700";
    if (n === "Alto") return "bg-orange-100 text-orange-700";
    if (n === "Medio") return "bg-amber-100 text-amber-700";
    return "bg-brand-soft text-brand";
}

function RiesgosPage() {
    const desactualizados = RIESGOS.filter((r) => new Date(r.ultimaActualizacion) < new Date("2026-01-01")).length;
    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <PageHeader eyebrow="Administración de Riesgos" title="Riesgos Operacionales" description="Solo se registra la ubicación de la evidencia. No se almacenan matrices ni documentos confidenciales." />

            <Card className="mt-6 border-border/60">
                <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
                            <BookOpen className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="font-semibold">Base metodológica de esta sección</div>
                                <Badge variant="secondary" className="text-[10px]">{METODOLOGIA_RIESGOS.codigo} · v{METODOLOGIA_RIESGOS.version}</Badge>
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {METODOLOGIA_RIESGOS.nombre}, publicada el {METODOLOGIA_RIESGOS.fechaPublicacion}. El ciclo de gestión aplicado es:{" "}
                                <span className="font-medium text-foreground">{METODOLOGIA_RIESGOS.ciclo.join(" → ")}</span>.
                            </p>

                            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                <div>
                                    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Frecuencia de monitoreo</div>
                                    <ul className="mt-1.5 space-y-1 text-xs">
                                        {METODOLOGIA_RIESGOS.frecuenciaMonitoreo.map((f) => (
                                            <li key={f.nivel} className="flex justify-between gap-2">
                                                <span>{f.nivel}</span>
                                                <span className="text-muted-foreground">{f.frecuencia}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div>
                                    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Opciones de tratamiento</div>
                                    <ul className="mt-1.5 space-y-1 text-xs text-muted-foreground">
                                        {METODOLOGIA_RIESGOS.opcionesTratamiento.map((t) => (
                                            <li key={t.opcion}><span className="font-medium text-foreground">{t.opcion}:</span> {t.descripcion}</li>
                                        ))}
                                    </ul>
                                </div>
                                <div>
                                    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tipos de control</div>
                                    <ul className="mt-1.5 space-y-1 text-xs text-muted-foreground">
                                        {METODOLOGIA_RIESGOS.tiposControl.map((c) => (
                                            <li key={c.tipo}><span className="font-medium text-foreground">{c.tipo}</span> ({c.efectividad})</li>
                                        ))}
                                    </ul>
                                </div>
                                <div>
                                    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Políticas clave</div>
                                    <ul className="mt-1.5 space-y-1 text-xs text-muted-foreground">
                                        {METODOLOGIA_RIESGOS.politicas.slice(0, 3).map((p) => (
                                            <li key={p}>{p}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {desactualizados > 0 && (
                <div className="mt-6 flex gap-3 rounded-xl border border-brand/30 bg-brand-soft/50 p-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand text-white">
                        <Sparkles className="h-4 w-4" />
                    </div>
                    <div className="text-sm">
                        <div className="font-semibold text-brand">Recomendación de CES Guardian</div>
                        <div className="text-muted-foreground">{desactualizados} riesgo(s) tienen más de 12 meses sin actualización. Programa una revisión.</div>
                    </div>
                </div>
            )}

            <div className="mt-6 overflow-hidden rounded-2xl border bg-card">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                            <tr>
                                <th className="px-4 py-3 text-left">Riesgo</th>
                                <th className="px-4 py-3 text-left">Nivel</th>
                                <th className="px-4 py-3 text-left">Estado</th>
                                <th className="px-4 py-3 text-left">Responsable</th>
                                <th className="px-4 py-3 text-left">Última actualización</th>
                                <th className="px-4 py-3 text-left">Próx. revisión</th>
                                <th className="px-4 py-3 text-left">Evidencia</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {RIESGOS.map((r) => (
                                <tr key={r.id} className="hover:bg-muted/30">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                                            <div>
                                                <div className="font-medium">{r.nombre}</div>
                                                <div className="text-xs text-muted-foreground">{r.id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3"><Badge className={nivelTone(r.nivel)}>{r.nivel}</Badge></td>
                                    <td className="px-4 py-3 text-muted-foreground">{r.estado}</td>
                                    <td className="px-4 py-3">{r.responsable}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{r.ultimaActualizacion}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{r.proximaRevision}</td>
                                    <td className="px-4 py-3 text-xs text-muted-foreground">{r.evidencia}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="mt-10">
                <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
                        <FileSpreadsheet className="h-4 w-4" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold">Matriz de Riesgos Operacionales — Registro F.RI.001</h2>
                        <p className="text-sm text-muted-foreground">
                            Riesgos formalmente identificados, analizados y tratados según la matriz oficial del área CES (fuente: Matriz de Riesgos Operacionales CES, hoja F.RI.001).
                        </p>
                    </div>
                </div>

                <Card className="mt-4 border-border/60">
                    <CardContent className="p-0">
                        <Accordion type="multiple" className="px-5">
                            {REGISTRO_RIESGOS_CES.map((r) => (
                                <AccordionItem key={r.id} value={r.id}>
                                    <AccordionTrigger>
                                        <div className="flex flex-1 flex-wrap items-center gap-3 pr-3 text-left">
                                            <Badge variant="secondary" className="font-mono text-[10px]">{r.id}</Badge>
                                            <span className="flex-1 font-medium">{r.descripcion}</span>
                                            <Badge className={nivelTone(r.nivelInherente.severidad)}>Inherente: {r.nivelInherente.severidad}</Badge>
                                            <Badge className={nivelTone(r.nivelResidual.severidad)}>Residual: {r.nivelResidual.severidad}</Badge>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <div className="grid gap-6 lg:grid-cols-3">
                                            <div className="lg:col-span-2 space-y-4">
                                                <div className="grid gap-3 sm:grid-cols-2">
                                                    <div>
                                                        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Proceso</div>
                                                        <div className="text-sm">{r.procesoNivel1} {r.procesoNivel2 !== "N/A" ? `/ ${r.procesoNivel2}` : ""}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Contexto</div>
                                                        <div className="text-sm">{r.contexto}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Dueño del proceso</div>
                                                        <div className="text-sm">{r.duenoProceso}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Dueño del riesgo</div>
                                                        <div className="text-sm">{r.duenoRiesgo}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Parte interesada afectada</div>
                                                        <div className="text-sm">{r.parteInteresada}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Identificación / Actualización</div>
                                                        <div className="text-sm">{r.fechaIdentificacion} · {r.fechaActualizacion}</div>
                                                    </div>
                                                </div>

                                                <div>
                                                    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Causa</div>
                                                    <p className="text-sm text-muted-foreground">{r.causaQue}</p>
                                                    <p className="mt-1 text-sm text-muted-foreground">{r.causaPorQue}</p>
                                                </div>
                                                <div>
                                                    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Posible consecuencia</div>
                                                    <p className="text-sm text-muted-foreground">{r.consecuencia}</p>
                                                </div>
                                                <div>
                                                    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Información documentada asociada</div>
                                                    <p className="text-sm text-muted-foreground">{r.infoDocumentada}</p>
                                                </div>

                                                <div>
                                                    <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Controles</div>
                                                    <div className="space-y-3">
                                                        {r.controles.map((c, i) => (
                                                            <div key={i} className="rounded-lg border bg-muted/20 p-3">
                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    <Badge variant="secondary" className="text-[10px]">{c.tipo}</Badge>
                                                                    <span className="text-xs text-muted-foreground">{c.ejecucion} · {c.origen} · {c.frecuencia}</span>
                                                                </div>
                                                                <p className="mt-1.5 text-sm">{c.descripcion}</p>
                                                                <div className="mt-1 text-xs text-muted-foreground">
                                                                    Responsable: <span className="text-foreground">{c.responsable}</span>
                                                                    {c.documentado && <> · Soporte: {c.nombreDocumento}</>}
                                                                </div>
                                                                <div className="mt-2 flex items-center gap-2">
                                                                    <Progress value={c.efectividad * 100} className="h-1.5" />
                                                                    <span className="text-xs font-medium tabular-nums">{Math.round(c.efectividad * 100)}%</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="rounded-xl border bg-muted/20 p-4">
                                                    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Riesgo inherente</div>
                                                    <div className="mt-1 flex items-center justify-between text-sm">
                                                        <span>Impacto</span>
                                                        <span className="font-medium">{r.impacto.calificacion} ({r.impacto.valor})</span>
                                                    </div>
                                                    <div className="mt-1 flex items-center justify-between text-sm">
                                                        <span>Probabilidad</span>
                                                        <span className="font-medium">{r.probabilidad.calificacion} ({r.probabilidad.valor})</span>
                                                    </div>
                                                    <div className="mt-2 flex items-center justify-between border-t pt-2 text-sm">
                                                        <span>Nivel</span>
                                                        <Badge className={nivelTone(r.nivelInherente.severidad)}>{r.nivelInherente.severidad} ({r.nivelInherente.valor})</Badge>
                                                    </div>
                                                </div>

                                                <div className="rounded-xl border bg-muted/20 p-4">
                                                    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Riesgo residual</div>
                                                    <div className="mt-2 flex items-center justify-between text-sm">
                                                        <span>% Mitigación</span>
                                                        <span className="font-medium">{Math.round(r.porcentajeMitigacion * 100)}%</span>
                                                    </div>
                                                    <div className="mt-2 flex items-center justify-between border-t pt-2 text-sm">
                                                        <span>Nivel</span>
                                                        <Badge className={nivelTone(r.nivelResidual.severidad)}>{r.nivelResidual.severidad} ({r.nivelResidual.valor})</Badge>
                                                    </div>
                                                </div>

                                                <div className="text-xs text-muted-foreground">
                                                    <span className="font-semibold text-foreground">Evidencia:</span> {r.evidencia}
                                                </div>
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
