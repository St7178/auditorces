import { createFileRoute, Link } from "@tanstack/react-router";
import {
    ShieldAlert, FileText, Truck, Gauge,
    Sparkles, ArrowUpRight,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Route as AuthenticatedRoute } from "@/routes/_authenticated";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { INDICADORES_REALES, type IndicadorDisponibilidadCES } from "@/lib/ces-data";
import { clasificarContrato, resumenContratos, type Contrato } from "@/lib/contratos";
import {
    ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis,
} from "recharts";

type Hallazgo = {
    id: string;
    proceso: string;
    titulo: string;
    descripcion: string;
    nivelRiesgo: string | null;
    recomendacion: string;
    evidenciaUbicacion: string | null;
    estado: string;
    creadoEn: string;
};

type ClienteConContratos = { nombre: string; contratos?: Contrato[] };
type RiesgoReal = { id: string; descripcion?: string; porcentajeMitigacion?: number; nivelResidual?: { severidad?: string } };
type Recomendacion = { titulo: string; texto: string; nivel: "alta" | "media" | "baja" };
type ChecklistItem = { id: string; codigo: string; nombre: string };
type ChecklistDef = { cliente: ChecklistItem[]; interna: ChecklistItem[] };

function nivelTone(n: string | null) {
    if (n === "Crítico") return "bg-red-100 text-red-700";
    if (n === "Alto") return "bg-orange-100 text-orange-700";
    if (n === "Medio") return "bg-amber-100 text-amber-700";
    return "bg-brand-soft text-brand";
}

// Todas nacen de datos reales ya sincronizados — nada de texto de ejemplo. Un contrato próximo a
// vencer o un riesgo con mitigación baja son señales reales; si no hay ninguna, no se inventa nada.
function construirRecomendaciones(clientes: ClienteConContratos[] | null, riesgos: RiesgoReal[] | null, indicador: IndicadorDisponibilidadCES | null): Recomendacion[] {
    const rec: Recomendacion[] = [];

    for (const c of clientes ?? []) {
        for (const ct of c.contratos ?? []) {
            if (clasificarContrato(ct) === "proximo") {
                rec.push({ titulo: `Contrato de ${c.nombre} próximo a vencer`, texto: `Vence el ${ct.fin}.`, nivel: "alta" });
            }
        }
    }

    for (const r of riesgos ?? []) {
        if (typeof r.porcentajeMitigacion === "number" && r.porcentajeMitigacion < 0.7) {
            const severidad = r.nivelResidual?.severidad;
            rec.push({
                titulo: `Riesgo con mitigación baja (${Math.round(r.porcentajeMitigacion * 100)}%)`,
                texto: r.descripcion ?? r.id,
                nivel: severidad === "Alto" || severidad === "Catastrófico" ? "alta" : "media",
            });
        }
    }

    if (indicador) {
        const medido = [...indicador.tendenciaMensual].reverse().find((f) => f.valor > 0);
        if (medido && medido.valor < medido.meta) {
            rec.push({ titulo: `${indicador.nombre} por debajo de meta`, texto: `${medido.mes}: ${medido.valor} vs. meta ${medido.meta}.`, nivel: "alta" });
        }
    }

    return rec;
}

export const Route = createFileRoute("/_authenticated/")({
    component: Dashboard,
    head: () => ({
        meta: [
            { title: "Dashboard — CES SIG" },
            { name: "description", content: "Panorama general del área CES: auditorías, riesgos, indicadores y contratos." },
        ],
    }),
});

function Dashboard() {
    const { user } = AuthenticatedRoute.useRouteContext();
    const firstName = user?.name?.split(" ")[0] ?? "Usuario";
    const [hallazgos, setHallazgos] = useState<Hallazgo[] | null>(null);
    const [clientes, setClientes] = useState<ClienteConContratos[] | null>(null);
    const [riesgos, setRiesgos] = useState<RiesgoReal[] | null>(null);
    const [proveedoresTotal, setProveedoresTotal] = useState<number | null>(null);
    const [indicadorDisp, setIndicadorDisp] = useState<IndicadorDisponibilidadCES | null>(null);
    const [checklistDef, setChecklistDef] = useState<ChecklistDef | null>(null);
    const [checklistEstado, setChecklistEstado] = useState<Record<string, boolean> | null>(null);

    useEffect(() => {
        let mounted = true;
        fetch("/api/hallazgos")
            .then((r) => (r.ok ? r.json() : Promise.reject(r.statusText)))
            .then((data) => mounted && setHallazgos(data))
            .catch(() => {
                /* se deja sin datos: la sección de hallazgos más abajo simplemente no aparece */
            });
        // Los contratos viven dentro de cada cliente sincronizado (mismo archivo real que usa
        // /clientes) — no hay una fuente aparte para "contratos", se derivan de ahí.
        fetch("/api/sync/clientes")
            .then((r) => (r.ok ? r.json() : Promise.reject(r.statusText)))
            .then((data: ClienteConContratos[]) => mounted && setClientes(data))
            .catch(() => {
                /* sin fuente real disponible: la tarjeta de Contratos queda en "—" */
            });
        fetch("/api/sync/riesgos")
            .then((r) => (r.ok ? r.json() : Promise.reject(r.statusText)))
            .then((data: RiesgoReal[]) => mounted && setRiesgos(data))
            .catch(() => {
                /* sin fuente real disponible: la tarjeta de Riesgos queda en "—" */
            });
        fetch("/api/sync/proveedores")
            .then((r) => (r.ok ? r.json() : Promise.reject(r.statusText)))
            .then((data: unknown[]) => mounted && setProveedoresTotal(data.length))
            .catch(() => {
                /* sin fuente real disponible: la tarjeta de Proveedores queda en "—" */
            });
        fetch("/api/sync/indicador-disponibilidad")
            .then((r) => (r.ok ? r.json() : Promise.reject(r.statusText)))
            .then((data: IndicadorDisponibilidadCES) => mounted && setIndicadorDisp(data))
            .catch(() => {
                /* sin fuente real disponible: no entra en las recomendaciones */
            });
        // Mismo checklist real que usa /clientes — reutilizado acá para el % de "Cumplimiento de
        // documentación" en vez de calcularlo con otra fuente distinta.
        fetch("/api/sync/checklist-clientes")
            .then((r) => (r.ok ? r.json() : Promise.reject(r.statusText)))
            .then((data: ChecklistDef) => mounted && setChecklistDef(data))
            .catch(() => {
                /* sin fuente real disponible: el % de documentación queda en "—" */
            });
        fetch("/api/checklist-clientes-estado")
            .then((r) => (r.ok ? r.json() : Promise.reject(r.statusText)))
            .then((data: Record<string, boolean>) => mounted && setChecklistEstado(data))
            .catch(() => {
                /* sin fuente real disponible: el % de documentación queda en "—" */
            });
        return () => {
            mounted = false;
        };
    }, []);

    const contratosTodos = clientes?.flatMap((c) => c.contratos ?? []) ?? null;
    const resumenContratosTotal = contratosTodos ? resumenContratos(contratosTodos) : null;

    // Las 4 tarjetas principales solo muestran cifras con una fuente real detrás — nada de valores
    // de ejemplo. "Indicadores" cuenta los indicadores con sync real conectado (ver INDICADORES_REALES
    // en ces-data.ts), no los de demostración que aún se ven en /indicadores.
    const kpis = [
        { label: "Riesgos", icon: ShieldAlert, tone: "warning" as const, value: riesgos?.length ?? null },
        { label: "Indicadores", icon: Gauge, tone: "brand" as const, value: INDICADORES_REALES.length },
        { label: "Proveedores", icon: Truck, tone: "muted" as const, value: proveedoresTotal },
    ];

    const recomendaciones = construirRecomendaciones(clientes, riesgos, indicadorDisp);

    // Cumplimiento de riesgos: promedio de "porcentajeMitigacion" que ya trae cada riesgo sincronizado.
    const riesgosConMitigacion = riesgos?.filter((r) => typeof r.porcentajeMitigacion === "number") ?? [];
    const cumplimientoRiesgos = riesgosConMitigacion.length > 0
        ? Math.round((riesgosConMitigacion.reduce((sum, r) => sum + (r.porcentajeMitigacion ?? 0), 0) / riesgosConMitigacion.length) * 100)
        : null;

    // Cumplimiento de indicadores: promedio de qué tanto se alcanzó la meta (capado en 100%) en cada
    // mes con medición real (valor > 0) del indicador conectado.
    const mesesMedidos = indicadorDisp?.tendenciaMensual.filter((f) => f.valor > 0) ?? [];
    const cumplimientoIndicadores = mesesMedidos.length > 0
        ? Math.round((mesesMedidos.reduce((sum, f) => sum + Math.min(f.valor / f.meta, 1), 0) / mesesMedidos.length) * 100)
        : null;

    // Cumplimiento de documentación: mismo cálculo que el "Progreso general del checklist" en /clientes.
    const todosLosItems = checklistDef ? [...checklistDef.cliente, ...checklistDef.interna] : [];
    const totalListos = checklistEstado ? todosLosItems.filter((it) => checklistEstado[it.id]).length : 0;
    const cumplimientoDocumentacion = checklistDef && checklistEstado && todosLosItems.length > 0
        ? Math.round((totalListos / todosLosItems.length) * 100)
        : null;

    const metricasCumplimiento = [
        { label: "Riesgos", value: cumplimientoRiesgos, desc: "Mitigación promedio de los riesgos registrados" },
        { label: "Indicadores", value: cumplimientoIndicadores, desc: "Meta alcanzada en los meses con medición real" },
        { label: "Documentación de clientes", value: cumplimientoDocumentacion, desc: "Checklist de entrega de documentación completado" },
    ];
    const metricasConDato = metricasCumplimiento.filter((m) => m.value !== null);
    // "Retroalimentación" de las tres — promedio simple de las que sí tienen dato real todavía.
    const nivelMadurez = metricasConDato.length > 0
        ? Math.round(metricasConDato.reduce((sum, m) => sum + (m.value ?? 0), 0) / metricasConDato.length)
        : null;

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {/* Hero */}
            <section className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-[oklch(0.25_0.05_220)] via-[oklch(0.28_0.06_200)] to-[oklch(0.35_0.12_155)] p-8 text-white shadow-xl">
                <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/40 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-[oklch(0.5_0.14_240)]/30 blur-3xl" />
                <div className="relative">
                    <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium backdrop-blur">
                        <Sparkles className="h-3.5 w-3.5" /> {firstName}
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Informe General SIG</h1>
                    <div className="mt-6 flex flex-wrap gap-3">
                        <Button asChild size="lg" className="rounded-xl bg-white text-slate-900 hover:bg-white/90">
                            <Link to="/guardian"><Sparkles className="mr-2 h-4 w-4" /> Hablar con CES AUDITOR</Link>
                        </Button>
                        <Button asChild size="lg" variant="secondary" className="rounded-xl bg-white/10 text-white hover:bg-white/20 border-white/20 border">
                            <Link to="/cronograma">Ver cronograma</Link>
                        </Button>
                    </div>
                </div>
            </section>

            {/* Indicadores principales */}
            <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {kpis.map((k) => {
                    const toneBg = k.tone === "warning" ? "bg-amber-50 text-amber-700" : k.tone === "brand" ? "bg-brand-soft text-brand" : "bg-muted text-muted-foreground";
                    return (
                        <Card key={k.label} className="overflow-hidden border-border/60 transition hover:shadow-lg">
                            <CardContent className="p-5">
                                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${toneBg}`}>
                                    <k.icon className="h-5 w-5" />
                                </div>
                                <div className="mt-4 text-3xl font-bold tracking-tight">{k.value === null || k.value === undefined ? "—" : k.value}</div>
                                <div className="mt-1 text-xs text-muted-foreground">{k.label}</div>
                            </CardContent>
                        </Card>
                    );
                })}

                {/* Contratos: única tarjeta con desglose (activos/próximos a vencer/vencidos) en vez de
                    un solo número, porque acá lo que importa es distinguir esos tres estados reales. */}
                <Card className="overflow-hidden border-border/60 transition hover:shadow-lg">
                    <CardContent className="p-5">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand">
                            <FileText className="h-5 w-5" />
                        </div>
                        <div className="mt-4 text-3xl font-bold tracking-tight">{resumenContratosTotal ? resumenContratosTotal.total : "—"}</div>
                        <div className="mt-1 text-xs text-muted-foreground">Contratos</div>
                        {resumenContratosTotal && (
                            <div className="mt-2 space-y-1 border-t pt-2 text-[11px]">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Activos</span>
                                    <span className="font-semibold text-brand">{resumenContratosTotal.vigentes}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Próximos a vencer</span>
                                    <span className="font-semibold text-amber-700">{resumenContratosTotal.proximos}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Vencidos</span>
                                    <span className="font-semibold text-destructive">{resumenContratosTotal.vencidos}</span>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </section>

            {/* Cumplimiento SIG */}
            <section className="mt-8 grid gap-4 lg:grid-cols-3">
                <Card className="lg:col-span-2 border-border/60">
                    <CardContent className="p-6">
                        <h2 className="text-lg font-semibold">Cumplimiento SIG</h2>
                        <p className="text-xs text-muted-foreground">Riesgos, indicadores y documentación — basado en lo ya sincronizado</p>
                        <div className="mt-6 space-y-5">
                            {metricasCumplimiento.map((m) => (
                                <div key={m.label}>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="font-medium">{m.label}</span>
                                        <span className="font-semibold">{m.value === null ? "—" : `${m.value}%`}</span>
                                    </div>
                                    <Progress value={m.value ?? 0} className="mt-1.5 h-2" />
                                    <p className="mt-1 text-[11px] text-muted-foreground">{m.desc}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-border/60">
                    <CardContent className="p-6">
                        <h2 className="text-lg font-semibold">Nivel de madurez</h2>
                        <p className="text-xs text-muted-foreground">Promedio de riesgos, indicadores y documentación</p>
                        <div className="mt-2 h-56">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadialBarChart innerRadius="70%" outerRadius="100%" data={[{ name: "madurez", value: nivelMadurez ?? 0, fill: "oklch(0.62 0.17 152)" }]} startAngle={90} endAngle={-270}>
                                    <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                                    <RadialBar background={{ fill: "oklch(0.94 0.01 220)" }} dataKey="value" cornerRadius={20} />
                                </RadialBarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="-mt-32 text-center">
                            <div className="text-4xl font-bold text-brand">{nivelMadurez === null ? "—" : `${nivelMadurez}%`}</div>
                            <div className="text-xs text-muted-foreground">{metricasConDato.length} de {metricasCumplimiento.length} métricas con dato real</div>
                        </div>
                    </CardContent>
                </Card>
            </section>

            {/* Recomendaciones */}
            <section className="mt-8">
                <Card className="border-border/60">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-[oklch(0.5_0.14_200)] text-white">
                                    <Sparkles className="h-4 w-4" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold">Recomendaciones del área CES</h2>
                                    <p className="text-xs text-muted-foreground">Señales reales de contratos, riesgos e indicadores sincronizados</p>
                                </div>
                            </div>
                            <Button asChild variant="ghost" size="sm"><Link to="/guardian">Abrir CES AUDITOR <ArrowUpRight className="ml-1 h-3 w-3" /></Link></Button>
                        </div>
                        <div className="mt-4 space-y-3">
                            {recomendaciones.length === 0 && (
                                <div className="text-sm text-muted-foreground">Sin alertas activas por ahora — contratos, riesgos e indicadores dentro de lo esperado.</div>
                            )}
                            {recomendaciones.map((r) => (
                                <div key={r.titulo} className="flex gap-3 rounded-xl border bg-card p-4 transition hover:border-brand/40 hover:shadow-sm">
                                    <div className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${r.nivel === "alta" ? "bg-destructive" : r.nivel === "media" ? "bg-amber-500" : "bg-brand"}`} />
                                    <div className="min-w-0">
                                        <div className="text-sm font-semibold">{r.titulo}</div>
                                        <div className="mt-0.5 text-xs text-muted-foreground">{r.texto}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </section>

            {/* Hallazgos de auditoría (CES AUDITOR) */}
            {hallazgos && hallazgos.length > 0 && (
                <section className="mt-8">
                    <div className="mb-4 flex items-end justify-between">
                        <div>
                            <h2 className="text-lg font-semibold">Hallazgos de auditoría</h2>
                            <p className="text-xs text-muted-foreground">Encontrados por CES AUDITOR durante las auditorías conversacionales</p>
                        </div>
                        <Button asChild variant="ghost" size="sm"><Link to="/guardian">Ir a CES AUDITOR <ArrowUpRight className="ml-1 h-3 w-3" /></Link></Button>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {hallazgos.slice(0, 6).map((h) => (
                            <Card key={h.id} className="border-border/60">
                                <CardContent className="p-5">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{h.proceso}</div>
                                        {h.nivelRiesgo && <Badge className={nivelTone(h.nivelRiesgo)}>{h.nivelRiesgo}</Badge>}
                                    </div>
                                    <div className="mt-1.5 text-sm font-semibold">{h.titulo}</div>
                                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{h.descripcion}</p>
                                    <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                                        <span>{h.estado}</span>
                                        <span>{new Date(h.creadoEn).toLocaleDateString("es")}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
