import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Sparkles, ArrowUpRight, Building2, AlertTriangle, AlertCircle, CheckCircle2, User } from "lucide-react";
import { lazy, Suspense, useEffect, useState, type ReactNode } from "react";
import { Progress } from "@/components/ui/progress";
import { CoverflowCarousel, type CoverflowSlide } from "@/components/ui/coverflow-carousel";
import { ServiceCard } from "@/components/ui/service-card";
import { HighlightCard, type HighlightCardColor } from "@/components/ui/card-5";
import { Badge } from "@/components/ui/badge";
import {
    AnimatedCard, CardBody, CardTitle, CardDescription, CardVisual, MaturityGauge, CardAmbientBackground, colorDeMadurez,
} from "@/components/ui/animated-card-diagram";
import { INDICADORES_REALES, type IndicadorDisponibilidadCES } from "@/lib/ces-data";
import { clasificarContrato, resumenContratos, type Contrato } from "@/lib/contratos";
import { clienteLogo } from "@/lib/cliente-logos";
import { cumplimientoRevisionDocumental } from "@/lib/documentos";

// Perezoso: "motion" queda en su propio chunk en vez de ir dentro del bundle de esta ruta.
const InteractiveGridBackground = lazy(() =>
    import("@/components/ui/interactive-grid-background").then((m) => ({ default: m.InteractiveGridBackground })),
);

type ClienteConContratos = { id?: string; nombre: string; estado?: string; contratos?: Contrato[] };

const KPI_IMG = {
    riesgos: "https://gycqduihf0vkjbnu.public.blob.vercel-storage.com/Alertas",
    indicadores: "https://gycqduihf0vkjbnu.public.blob.vercel-storage.com/Indicadores",
    clientes: "https://gycqduihf0vkjbnu.public.blob.vercel-storage.com/Clientes",
    proveedores: "https://gycqduihf0vkjbnu.public.blob.vercel-storage.com/Proveedores",
    contratos: "https://gycqduihf0vkjbnu.public.blob.vercel-storage.com/Contratos",
};

// Cara simplificada para el carrusel del Dashboard: a diferencia de /clientes, acá solo se muestra
// nombre + logo — sin responsable ni el tono "Contratos vencidos" (esa señal de alerta vive
// exclusivamente en /clientes, no en este resumen general).
function ClienteFaceSimple({ nombre, logo }: { nombre: string; logo?: string }) {
    return (
        <div className="flex flex-col items-center justify-center gap-3 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white p-2 shadow-sm">
                {logo ? (
                    <img src={logo} alt={nombre} className="h-full w-full object-contain" />
                ) : (
                    <Building2 className="h-7 w-7 text-slate-900" />
                )}
            </div>
            <div className="px-2 text-base font-semibold leading-tight">{nombre}</div>
        </div>
    );
}
// Mismo criterio de color que "Nivel de madurez" (colorDeMadurez): ≥80% bueno, 50-79% regular, <50%
// malo — así las dos tarjetas hablan el mismo idioma visual.
function estadoCumplimiento(value: number | null) {
    if (value === null) return { label: "Sin dato", badgeClass: "border-transparent bg-muted text-muted-foreground", barClass: "bg-muted-foreground/30" };
    if (value >= 80) return { label: "Bueno", badgeClass: "border-transparent bg-emerald-100 text-emerald-700", barClass: "bg-emerald-500" };
    if (value >= 50) return { label: "Regular", badgeClass: "border-transparent bg-amber-100 text-amber-700", barClass: "bg-amber-500" };
    return { label: "Malo", badgeClass: "border-transparent bg-red-100 text-red-700", barClass: "bg-red-500" };
}

// La barra arranca en 0 y sube al valor real un instante después de montarse (con un pequeño
// desfase por fila) para que el relleno se vea animado en vez de aparecer ya lleno.
function ComplianceRow({ label, value, desc, delay }: { label: string; value: number | null; desc: string; delay: number }) {
    const [visible, setVisible] = useState(false);
    const [animado, setAnimado] = useState(0);
    useEffect(() => {
        const t1 = setTimeout(() => setVisible(true), delay);
        const t2 = setTimeout(() => setAnimado(value ?? 0), delay + 150);
        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
        };
    }, [value, delay]);

    const estado = estadoCumplimiento(value);
    return (
        <div className={`transition-all duration-500 ease-out ${visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`}>
            <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{label}</span>
                <Badge className={estado.badgeClass}>{estado.label}</Badge>
            </div>
            <Progress value={animado} indicatorClassName={estado.barClass} className="mt-1.5 h-2.5" />
            <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>{desc}</span>
                <span className="font-semibold text-foreground">{value === null ? "—" : `${value}%`}</span>
            </div>
        </div>
    );
}

type RiesgoReal = { id: string; descripcion?: string; porcentajeMitigacion?: number; nivelResidual?: { severidad?: string } };
type HallazgoDashboard = { id: string; titulo: string; proceso: string; responsable: string | null; pasoIdentifico: boolean; pasoAgenda: boolean; pasoSoluciono: boolean };

// % de seguimiento de un hallazgo puntual: cuántos de los 3 pasos (identificó/agendó/solucionó) ya
// están marcados — mismo checklist que se marca en /guardian/hallazgos.
function pctSeguimientoHallazgo(h: HallazgoDashboard): number {
    const pasos = [h.pasoIdentifico, h.pasoAgenda, h.pasoSoluciono];
    return Math.round((pasos.filter(Boolean).length / pasos.length) * 100);
}
type Recomendacion = { titulo: string; texto: string; nivel: "alta" | "media" | "baja"; to: "/clientes" | "/riesgos" | "/indicadores" };

// "alta" = negativo/urgente (rojo), "media" = alerta (ámbar), "baja" = positivo (verde) — mismo
// criterio de color que ya usaba la lista de recomendaciones, ahora aplicado a la tarjeta destacada.
const NIVEL_INFO: Record<Recomendacion["nivel"], { color: HighlightCardColor; icon: ReactNode; label: string }> = {
    alta: { color: "red", icon: <AlertTriangle className="h-5 w-5" />, label: "Alta" },
    media: { color: "amber", icon: <AlertCircle className="h-5 w-5" />, label: "Media" },
    baja: { color: "green", icon: <CheckCircle2 className="h-5 w-5" />, label: "Baja" },
};
type ChecklistItem = { id: string; codigo: string; nombre: string };
type ChecklistDef = { cliente: ChecklistItem[]; interna: ChecklistItem[] };

// Todas nacen de datos reales ya sincronizados — nada de texto de ejemplo. Un contrato próximo a
// vencer o un riesgo con mitigación baja son señales reales; si no hay ninguna, no se inventa nada.
function construirRecomendaciones(clientes: ClienteConContratos[] | null, riesgos: RiesgoReal[] | null, indicador: IndicadorDisponibilidadCES | null): Recomendacion[] {
    const rec: Recomendacion[] = [];

    for (const c of clientes ?? []) {
        for (const ct of c.contratos ?? []) {
            if (clasificarContrato(ct) === "proximo") {
                rec.push({ titulo: `Contrato de ${c.nombre} próximo a vencer`, texto: `Vence el ${ct.fin}.`, nivel: "alta", to: "/clientes" });
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
                to: "/riesgos",
            });
        }
    }

    if (indicador) {
        const medido = [...indicador.tendenciaMensual].reverse().find((f) => f.valor > 0);
        if (medido && medido.valor < medido.meta) {
            rec.push({ titulo: `${indicador.nombre} por debajo de meta`, texto: `${medido.mes}: ${medido.valor} vs. meta ${medido.meta}.`, nivel: "alta", to: "/indicadores" });
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
    const navigate = useNavigate();
    const [clientes, setClientes] = useState<ClienteConContratos[] | null>(null);
    const [riesgos, setRiesgos] = useState<RiesgoReal[] | null>(null);
    const [proveedoresTotal, setProveedoresTotal] = useState<number | null>(null);
    const [indicadorDisp, setIndicadorDisp] = useState<IndicadorDisponibilidadCES | null>(null);
    const [checklistDef, setChecklistDef] = useState<ChecklistDef | null>(null);
    const [checklistEstado, setChecklistEstado] = useState<Record<string, boolean> | null>(null);
    const [documentos, setDocumentos] = useState<{ id: string; actualizacion?: string | null }[] | null>(null);
    const [hallazgos, setHallazgos] = useState<HallazgoDashboard[] | null>(null);

    useEffect(() => {
        let mounted = true;
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
        // Mismos datos que usa /procesos/revision — reutilizados acá para el % de "Revisión
        // Documental" en Cumplimiento SIG / Nivel de madurez.
        fetch("/api/sync/documentacion")
            .then((r) => (r.ok ? r.json() : Promise.reject(r.statusText)))
            .then((data: { id: string; actualizacion?: string | null }[]) => mounted && setDocumentos(data))
            .catch(() => {
                /* sin fuente real disponible: el % de revisión documental queda en "—" */
            });
        // Mismos hallazgos que gestiona /guardian/hallazgos — reutilizados acá para el % de
        // seguimiento (identificó/agendó/solucionó) en Cumplimiento SIG y el detalle por hallazgo.
        fetch("/api/hallazgos")
            .then((r) => (r.ok ? r.json() : Promise.reject(r.statusText)))
            .then((data: HallazgoDashboard[]) => mounted && setHallazgos(data))
            .catch(() => {
                /* sin fuente real disponible: el % de hallazgos queda en "—" */
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
        { label: "Riesgos", href: "/riesgos", variant: "red" as const, imgSrc: KPI_IMG.riesgos, value: riesgos?.length ?? null },
        { label: "Indicadores", href: "/indicadores", variant: "blue" as const, imgSrc: KPI_IMG.indicadores, value: INDICADORES_REALES.length },
        { label: "Clientes", href: "/clientes", variant: "gray" as const, imgSrc: KPI_IMG.clientes, value: clientes?.length ?? null },
        { label: "Proveedores", href: "/proveedores", variant: "default" as const, imgSrc: KPI_IMG.proveedores, value: proveedoresTotal },
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

    // Cumplimiento de revisión documental: mismo checklist de 4 pasos que /procesos/revision, 100%
    // si ningún documento requiere revisión todavía.
    const cumplimientoRevision = cumplimientoRevisionDocumental(documentos, checklistEstado);

    // Cumplimiento de hallazgos: % de pasos de seguimiento (identificó/agendó/solucionó) ya marcados
    // sobre el total posible en todos los hallazgos registrados.
    const cumplimientoHallazgos = hallazgos && hallazgos.length > 0
        ? Math.round((hallazgos.reduce((sum, h) => sum + [h.pasoIdentifico, h.pasoAgenda, h.pasoSoluciono].filter(Boolean).length, 0) / (hallazgos.length * 3)) * 100)
        : null;

    const metricasCumplimiento = [
        { label: "Riesgos", value: cumplimientoRiesgos, desc: "Mitigación promedio de los riesgos registrados" },
        { label: "Indicadores", value: cumplimientoIndicadores, desc: "Meta alcanzada en los meses con medición real" },
        { label: "Documentación de clientes", value: cumplimientoDocumentacion, desc: "Checklist de entrega de documentación completado" },
        { label: "Revisión Documental", value: cumplimientoRevision, desc: "Checklist de revisión completado en los documentos pendientes" },
        {
            label: "Hallazgos de auditoría",
            value: cumplimientoHallazgos,
            desc: hallazgos && hallazgos.length > 0 ? `Seguimiento completado en ${hallazgos.length} hallazgo${hallazgos.length === 1 ? "" : "s"} registrado${hallazgos.length === 1 ? "" : "s"}` : "Seguimiento de hallazgos registrados por CES AUDITOR",
        },
    ];
    const metricasConDato = metricasCumplimiento.filter((m) => m.value !== null);
    // "Retroalimentación" de las tres — promedio simple de las que sí tienen dato real todavía.
    const nivelMadurez = metricasConDato.length > 0
        ? Math.round(metricasConDato.reduce((sum, m) => sum + (m.value ?? 0), 0) / metricasConDato.length)
        : null;

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {/* Hero — mismo tamaño de siempre (p-8, dos líneas de contenido), solo cambia el fondo:
                grilla animada con foco que sigue el cursor, adaptada de "the-infinite-grid". */}
            <section className="relative overflow-hidden rounded-3xl border bg-background p-8 shadow-xl">
                <Suspense fallback={null}>
                    <InteractiveGridBackground />
                </Suspense>
                <div className="relative z-10">
                    <div className="mb-3 inline-flex items-center gap-2 rounded-full border bg-card/80 px-3 py-1 text-[11px] font-medium backdrop-blur">
                        <Sparkles className="h-3.5 w-3.5 text-brand" /> Área CES
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-foreground drop-shadow-sm sm:text-4xl">Informe General SIG</h1>
                </div>
            </section>

            {/* Indicadores principales */}
            <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {kpis.map((k) => (
                    <ServiceCard key={k.label} title={k.label} href={k.href} variant={k.variant} imgSrc={k.imgSrc} imgAlt={k.label} className="min-h-[172px]">
                        <div className="mt-3 text-4xl font-extrabold tracking-tight">{k.value === null || k.value === undefined ? "—" : k.value}</div>
                    </ServiceCard>
                ))}

                {/* Contratos: única tarjeta con desglose (activos/próximos a vencer/vencidos) en vez de
                    un solo número, porque acá lo que importa es distinguir esos tres estados reales.
                    Texto blanco (el default de la variante "red") — la imagen ya quedó bastante
                    tenue (imgClassName) para no competir con el texto encima. */}
                <ServiceCard
                    title="Contratos"
                    href="/clientes"
                    variant="red"
                    imgSrc={KPI_IMG.contratos}
                    imgAlt="Contratos"
                    imgClassName="opacity-[0.18] group-hover:opacity-30"
                    className="min-h-[172px] text-white"
                >
                    <div className="mt-3 text-4xl font-extrabold tracking-tight">{resumenContratosTotal ? resumenContratosTotal.total : "—"}</div>
                    {resumenContratosTotal && (
                        <div className="mt-2 space-y-1 text-[11px]">
                            <div className="flex items-center justify-between">
                                <span className="opacity-80">Activos</span>
                                <span className="font-semibold">{resumenContratosTotal.vigentes}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="opacity-80">Próximos a vencer</span>
                                <span className="font-semibold">{resumenContratosTotal.proximos}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="opacity-80">Vencidos</span>
                                <span className="font-semibold">{resumenContratosTotal.vencidos}</span>
                            </div>
                        </div>
                    )}
                </ServiceCard>
            </section>

            {/* Cumplimiento SIG */}
            <section className="mt-8 grid gap-4 lg:grid-cols-3">
                {/* Mismo fondo ambiental (resplandor + grilla) que "Nivel de madurez", en el mismo
                    color, para que ambas tarjetas hagan pareja visual — ver CardAmbientBackground. */}
                <AnimatedCard className="lg:col-span-2">
                    <CardAmbientBackground color={colorDeMadurez(nivelMadurez).main} />
                    <div className="relative z-10 p-6">
                        <h2 className="text-lg font-semibold">Cumplimiento SIG</h2>
                        <p className="text-xs text-muted-foreground">Riesgos, indicadores, documentación, revisión documental y hallazgos — basado en lo ya sincronizado</p>
                        <div className="mt-6 space-y-5">
                            {metricasCumplimiento.map((m, i) => (
                                <ComplianceRow key={m.label} label={m.label} value={m.value} desc={m.desc} delay={i * 120} />
                            ))}
                        </div>
                    </div>
                </AnimatedCard>

                <AnimatedCard>
                    <CardVisual>
                        <MaturityGauge percent={nivelMadurez} breakdown={metricasCumplimiento.map((m) => ({ label: m.label, value: m.value }))} />
                    </CardVisual>
                    <CardBody>
                        <CardTitle>Nivel de madurez</CardTitle>
                        <CardDescription>
                            Promedio de las {metricasCumplimiento.length} métricas de Cumplimiento SIG — {metricasConDato.length} de {metricasCumplimiento.length} con dato real. Pasa el mouse para ver el detalle.
                        </CardDescription>
                    </CardBody>
                </AnimatedCard>
            </section>

            {/* Seguimiento de Hallazgos — total y % de seguimiento (identificó/agendó/solucionó) de
                cada hallazgo registrado por CES AUDITOR; el promedio de estos % ya alimenta
                "Hallazgos de auditoría" en Cumplimiento SIG / Nivel de madurez arriba. */}
            <section className="mt-8">
                <div className="flex items-center justify-between gap-2">
                    <div>
                        <h2 className="text-lg font-semibold">Seguimiento de Hallazgos</h2>
                        <p className="text-xs text-muted-foreground">
                            {hallazgos === null ? "Cargando…" : `${hallazgos.length} hallazgo${hallazgos.length === 1 ? "" : "s"} registrado${hallazgos.length === 1 ? "" : "s"} por CES AUDITOR`}
                        </p>
                    </div>
                    <Link to="/guardian/hallazgos" className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-brand hover:underline">
                        Ver todos <ArrowUpRight className="h-3 w-3" />
                    </Link>
                </div>

                {hallazgos !== null && hallazgos.length === 0 && (
                    <div className="mt-4 rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                        Todavía no hay hallazgos registrados.
                    </div>
                )}

                {hallazgos !== null && hallazgos.length > 0 && (
                    <div className="mt-4 space-y-2">
                        {hallazgos.map((h) => {
                            const pct = pctSeguimientoHallazgo(h);
                            const estado = estadoCumplimiento(pct);
                            return (
                                <div key={h.id} className="flex items-center gap-3 rounded-lg border bg-card p-3">
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate text-sm font-medium">{h.titulo}</div>
                                        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                                            <span className="truncate">{h.proceso}</span>
                                            <span className={`flex items-center gap-1 ${h.responsable ? "font-semibold text-orange-600" : ""}`}>
                                                <User className="h-3 w-3" /> {h.responsable ?? "—"}
                                            </span>
                                        </div>
                                    </div>
                                    <Progress value={pct} indicatorClassName={estado.barClass} className="h-2 w-24 shrink-0 sm:w-32" />
                                    <span className="w-9 shrink-0 text-right text-xs font-semibold">{pct}%</span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* Recomendaciones */}
            <section className="mt-8">
                <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-[oklch(0.5_0.14_200)] text-white">
                        <Sparkles className="h-4 w-4" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold">Recomendaciones del área CES</h2>
                        <p className="text-xs text-muted-foreground">Señales reales de contratos, riesgos e indicadores sincronizados</p>
                    </div>
                </div>

                {recomendaciones.length === 0 ? (
                    <div className="mt-4 rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                        Sin alertas activas por ahora — contratos, riesgos e indicadores dentro de lo esperado.
                    </div>
                ) : (
                    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {recomendaciones.map((r) => {
                            const info = NIVEL_INFO[r.nivel];
                            return (
                                <HighlightCard
                                    key={r.titulo}
                                    title={r.titulo}
                                    description={r.texto}
                                    metricValue={info.label}
                                    metricLabel="Nivel de prioridad"
                                    buttonText="Ver más"
                                    onButtonClick={() => navigate({ to: r.to })}
                                    icon={info.icon}
                                    color={info.color}
                                />
                            );
                        })}
                    </div>
                )}
            </section>

            {/* Clientes — resumen visual simple (solo nombre + logo, sin filtros ni el tono de alerta
                de "Contratos vencidos"); ese detalle completo vive en /clientes. */}
            {clientes && clientes.length > 0 && (
                <section className="mt-8">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">Clientes</h2>
                        <Link to="/clientes" className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline">
                            Ver todos <ArrowUpRight className="h-3 w-3" />
                        </Link>
                    </div>
                    <div className="mt-2">
                        <CoverflowCarousel
                            slides={clientes.map((c, i): CoverflowSlide => ({
                                face: <ClienteFaceSimple nombre={c.nombre} logo={clienteLogo(c.nombre)} />,
                                tone: i % 2 === 0 ? "light" : "dark",
                                title: c.nombre,
                            }))}
                            showPagination
                            showNavigation
                            label="Clientes CES"
                        />
                    </div>
                </section>
            )}
        </div>
    );
}
