import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { PageHeader } from "@/components/page-header";
import { METODOLOGIA_RIESGOS, REGISTRO_RIESGOS_CES } from "@/lib/ces-data";
import { BookOpen, FileSpreadsheet, ShieldQuestion, GraduationCap, Lightbulb } from "lucide-react";
import { useEffect, useState } from "react";

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

// Centro de Aprendizaje SIG de esta sección — conceptos base de gestión de riesgos, alineados con la
// metodología M.RI.001.014 (METODOLOGIA_RIESGOS) para que las cifras/escalas que menciona coincidan
// con lo que ya se ve en "Base metodológica" más arriba en la página.
const CONCEPTOS_RIESGOS: Array<{ pregunta: string; explicacion: string }> = [
    {
        pregunta: "¿Qué es un Riesgo?",
        explicacion: "Es la posibilidad de que ocurra un evento incierto que, de materializarse, afecte el cumplimiento de los objetivos del proceso o del área CES — puede ser un efecto negativo (amenaza) o, en algunos marcos, una oportunidad.",
    },
    {
        pregunta: "¿Qué es una Amenaza?",
        explicacion: "Es la causa potencial de un evento no deseado: lo que podría hacer que el riesgo se materialice (por ejemplo, un proveedor incumple un SLA, o alguien accede sin autorización a un sistema).",
    },
    {
        pregunta: "¿Qué es una Vulnerabilidad? (más orientado a ISO/IEC 27001)",
        explicacion: "Es una debilidad en un proceso, sistema o control que una amenaza puede aprovechar para materializarse. En seguridad de la información, identificar vulnerabilidades es la base de la valoración de riesgos (numeral 6.1.2 de ISO/IEC 27001).",
    },
    {
        pregunta: "¿Qué es un Control?",
        explicacion: `Es una medida que reduce la probabilidad o el impacto de un riesgo. En CES se clasifican en ${METODOLOGIA_RIESGOS.tiposControl.map((c) => `${c.tipo} (actúa ${c.tipo === "Preventivo" ? "antes, sobre la causa" : c.tipo === "Detectivo" ? "durante, alertando" : "después, corrigiendo"}, efectividad de referencia ${c.efectividad})`).join("; ")}.`,
    },
    {
        pregunta: "¿Qué es una Acción de Tratamiento?",
        explicacion: `Es la decisión sobre qué hacer con un riesgo ya identificado. Las opciones de la metodología CES son: ${METODOLOGIA_RIESGOS.opcionesTratamiento.map((t) => `${t.opcion} (${t.descripcion})`).join("; ")}.`,
    },
    {
        pregunta: "¿Qué es Probabilidad?",
        explicacion: `Qué tan factible es que el riesgo ocurra. La escala de CES va de ${METODOLOGIA_RIESGOS.escalaProbabilidad[4].categoria} (${METODOLOGIA_RIESGOS.escalaProbabilidad[4].rango}) a ${METODOLOGIA_RIESGOS.escalaProbabilidad[0].categoria} (${METODOLOGIA_RIESGOS.escalaProbabilidad[0].rango}).`,
    },
    {
        pregunta: "¿Qué es Impacto?",
        explicacion: `Qué tan grave sería el efecto si el riesgo se materializa. La escala de CES va de ${METODOLOGIA_RIESGOS.escalaImpacto[0].categoria} a ${METODOLOGIA_RIESGOS.escalaImpacto[4].categoria}.`,
    },
    {
        pregunta: "¿Cómo se calcula un riesgo?",
        explicacion: "El nivel de riesgo inherente resulta de combinar Probabilidad × Impacto (antes de aplicar controles). Al aplicar los controles existentes y su efectividad, ese nivel baja al riesgo residual — el que realmente queda vigente y se monitorea.",
    },
    {
        pregunta: "¿Qué es un Riesgo Residual?",
        explicacion: "Es el nivel de riesgo que queda después de aplicar los controles ya implementados. Si el riesgo residual es Alto o Extremo, la metodología exige un plan de mitigación obligatorio; si es Moderado, queda a criterio del Dueño del Proceso.",
    },
];

const SABIAS_QUE = [
    "Un riesgo no siempre se elimina. Muchas veces solo se reduce.",
    "Un riesgo alto no significa que el proceso esté mal.",
    "Todos los integrantes de CES pueden identificar riesgos.",
];

function RiesgosPage() {
    const [registro, setRegistro] = useState(REGISTRO_RIESGOS_CES);

    useEffect(() => {
        let mounted = true;
        fetch("/api/sync/riesgos")
            .then((r) => (r.ok ? r.json() : Promise.reject(r.statusText)))
            .then((data) => mounted && setRegistro(data))
            .catch(() => {
                /* fallback kept */
            });
        return () => {
            mounted = false;
        };
    }, []);

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <PageHeader eyebrow="Administración de Riesgos" title="Riesgos Operacionales" description="Solo se registra la ubicación de la evidencia. No se almacenan matrices ni documentos confidenciales." />

            <Card className="mt-6 border-border/60">
                <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
                            <ShieldQuestion className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                            <div className="font-semibold">¿Qué son los riesgos operacionales?</div>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Son eventos o condiciones inciertas que, de materializarse, afectarían la capacidad del área CES para
                                cumplir sus objetivos, la prestación del servicio a los clientes o los requisitos de las normas que
                                aplican (ISO 9001 e ISO/IEC 27001). Se identifican, analizan, tratan y monitorean siguiendo el ciclo
                                definido en la metodología {METODOLOGIA_RIESGOS.codigo}.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="mt-6 overflow-hidden border-border/60">
                <div className="px-5 pt-5">
                    <div className="font-semibold">¿Cómo identificar un riesgo?</div>
                </div>
                <img
                    src="https://gycqduihf0vkjbnu.public.blob.vercel-storage.com/Imagen%20riesgos%20%281%29.png"
                    alt="Cómo identificar un riesgo"
                    className="mx-auto mt-3 h-auto max-h-96 w-full object-contain"
                />
            </Card>

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
                            {registro.map((r) => (
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

            <div className="mt-10">
                <div className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-brand" />
                    <h2 className="text-lg font-semibold">Centro de Aprendizaje SIG</h2>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">Conceptos base para entender y hablar de riesgos en CES.</p>

                <Card className="mt-4 border-border/60">
                    <CardContent className="p-0">
                        <Accordion type="multiple" className="px-5">
                            {CONCEPTOS_RIESGOS.map((c) => (
                                <AccordionItem key={c.pregunta} value={c.pregunta}>
                                    <AccordionTrigger>
                                        <span className="font-medium">{c.pregunta}</span>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <p className="text-sm text-muted-foreground">{c.explicacion}</p>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </CardContent>
                </Card>

                <Card className="mt-4 border-brand/30 bg-gradient-to-br from-brand-soft to-secondary">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-2 font-semibold text-brand">
                            <Lightbulb className="h-4 w-4" /> ¿Sabías qué?
                        </div>
                        <ul className="mt-3 space-y-2">
                            {SABIAS_QUE.map((s) => (
                                <li key={s} className="flex items-start gap-2 text-sm">
                                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand" /> {s}
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
