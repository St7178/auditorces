import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, ArrowUpRight, Building2 } from "lucide-react";
import { lazy, Suspense, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CoverflowCarousel, type CoverflowSlide } from "@/components/ui/coverflow-carousel";
import { ServiceCard } from "@/components/ui/service-card";
import { AnimatedCard, CardBody, CardTitle, CardDescription, CardVisual, MaturityGauge } from "@/components/ui/animated-card-diagram";
import { INDICADORES_REALES, type IndicadorDisponibilidadCES } from "@/lib/ces-data";
import { clasificarContrato, resumenContratos, type Contrato } from "@/lib/contratos";
import { clienteLogo } from "@/lib/cliente-logos";

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
type RiesgoReal = { id: string; descripcion?: string; porcentajeMitigacion?: number; nivelResidual?: { severidad?: string } };
type Recomendacion = { titulo: string; texto: string; nivel: "alta" | "media" | "baja"; to: "/clientes" | "/riesgos" | "/indicadores" };
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
    const [clientes, setClientes] = useState<ClienteConContratos[] | null>(null);
    const [riesgos, setRiesgos] = useState<RiesgoReal[] | null>(null);
    const [proveedoresTotal, setProveedoresTotal] = useState<number | null>(null);
    const [indicadorDisp, setIndicadorDisp] = useState<IndicadorDisponibilidadCES | null>(null);
    const [checklistDef, setChecklistDef] = useState<ChecklistDef | null>(null);
    const [checklistEstado, setChecklistEstado] = useState<Record<string, boolean> | null>(null);

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
                    un solo número, porque acá lo que importa es distinguir esos tres estados reales. */}
                {/* text-black: la imagen decorativa tapa parte del texto en la esquina — con blanco
                    (el color por defecto de la variante "red") "Vencidos" quedaba ilegible ahí. */}
                <ServiceCard title="Contratos" href="/clientes" variant="red" imgSrc={KPI_IMG.contratos} imgAlt="Contratos" className="min-h-[172px] text-black">
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

                <AnimatedCard>
                    <CardVisual>
                        <MaturityGauge percent={nivelMadurez} breakdown={metricasCumplimiento.map((m) => ({ label: m.label, value: m.value }))} />
                    </CardVisual>
                    <CardBody>
                        <CardTitle>Nivel de madurez</CardTitle>
                        <CardDescription>
                            Promedio de riesgos, indicadores y documentación — {metricasConDato.length} de {metricasCumplimiento.length} métricas con dato real. Pasa el mouse para ver el detalle.
                        </CardDescription>
                    </CardBody>
                </AnimatedCard>
            </section>

            {/* Recomendaciones */}
            <section className="mt-8">
                <Card className="border-border/60">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-2">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-[oklch(0.5_0.14_200)] text-white">
                                <Sparkles className="h-4 w-4" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold">Recomendaciones del área CES</h2>
                                <p className="text-xs text-muted-foreground">Señales reales de contratos, riesgos e indicadores sincronizados</p>
                            </div>
                        </div>
                        <div className="mt-4 space-y-3">
                            {recomendaciones.length === 0 && (
                                <div className="text-sm text-muted-foreground">Sin alertas activas por ahora — contratos, riesgos e indicadores dentro de lo esperado.</div>
                            )}
                            {recomendaciones.map((r) => (
                                <Link
                                    key={r.titulo}
                                    to={r.to}
                                    className="flex items-center gap-3 rounded-xl border bg-card p-4 transition hover:border-brand/40 hover:shadow-sm"
                                >
                                    <div className={`mt-0.5 h-2 w-2 shrink-0 self-start rounded-full ${r.nivel === "alta" ? "bg-destructive" : r.nivel === "media" ? "bg-amber-500" : "bg-brand"}`} />
                                    <div className="min-w-0 flex-1">
                                        <div className="text-sm font-semibold">{r.titulo}</div>
                                        <div className="mt-0.5 text-xs text-muted-foreground">{r.texto}</div>
                                    </div>
                                    <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                                </Link>
                            ))}
                        </div>
                    </CardContent>
                </Card>
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
