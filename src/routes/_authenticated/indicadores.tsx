import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { INDICADORES, INDICADOR_DISPONIBILIDAD_CES, type IndicadorDisponibilidadCES } from "@/lib/ces-data";
import {
    ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
    BarChart, Bar, ReferenceLine,
} from "recharts";
import { TrendingUp, TrendingDown, Minus, Radar, Satellite } from "lucide-react";

export const Route = createFileRoute("/_authenticated/indicadores")({
    component: IndicadoresPage,
    head: () => ({ meta: [{ title: "Indicadores — CES SIG" }] }),
});

const trendIcon = { up: TrendingUp, down: TrendingDown, flat: Minus };

const MESES_ORDEN = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

// Medidor tipo velocímetro (semicírculo + aguja), dibujado a mano en SVG porque Recharts no trae un
// gauge con aguja nativo. Convención de ángulos: 180° = extremo izquierdo, 90° = arriba, 0° = extremo
// derecho (coordenadas polares estándar, con "y" restando el seno porque el SVG crece hacia abajo).
function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
}

function arcoBanda(cx: number, cy: number, r: number, desde: number, hasta: number) {
    const start = polarToCartesian(cx, cy, r, desde);
    const end = polarToCartesian(cx, cy, r, hasta);
    return `M ${start.x} ${start.y} A ${r} ${r} 0 0 1 ${end.x} ${end.y}`;
}

const BANDAS_MEDIDOR = [
    { desde: 180, hasta: 135, color: "#ef4444" },
    { desde: 135, hasta: 90, color: "#f97316" },
    { desde: 90, hasta: 45, color: "#eab308" },
    { desde: 45, hasta: 0, color: "#22c55e" },
];

function Medidor({ valorActual, meta, mes, cumple }: { valorActual: number; meta: number; mes: string; cumple: boolean }) {
    const cx = 100;
    const cy = 100;
    const r = 80;
    const grosor = 22;
    const porcentaje = meta > 0 ? (valorActual / meta) * 100 : 0;
    const clamped = Math.max(0, Math.min(100, porcentaje));
    const anguloAguja = -90 + (clamped / 100) * 180;

    return (
        <div className="flex flex-col items-center">
            <svg viewBox="0 0 200 132" className="w-full max-w-[240px]">
                {BANDAS_MEDIDOR.map((b) => (
                    <path key={b.color} d={arcoBanda(cx, cy, r, b.desde, b.hasta)} stroke={b.color} strokeWidth={grosor} fill="none" />
                ))}
                <g style={{ transform: `rotate(${anguloAguja}deg)`, transformOrigin: `${cx}px ${cy}px`, transition: "transform 0.4s ease" }}>
                    <polygon points={`${cx - 4},${cy} ${cx + 4},${cy} ${cx},${cy - r + grosor + 8}`} fill="oklch(0.32 0.02 250)" />
                </g>
                <circle cx={cx} cy={cy} r={9} fill="oklch(0.32 0.02 250)" />
            </svg>
            <div className="-mt-2 text-center">
                <div className={`text-3xl font-bold ${cumple ? "text-brand" : "text-amber-600"}`}>{valorActual.toFixed(0)}</div>
                <div className="text-xs text-muted-foreground">de {meta.toFixed(2)} meta · {mes}</div>
                <div className={`mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${cumple ? "bg-brand-soft text-brand" : "bg-amber-50 text-amber-700"}`}>
                    {cumple ? "Cumple" : "Alerta"}
                </div>
            </div>
        </div>
    );
}

function DisponibilidadCard() {
    const [data, setData] = useState<IndicadorDisponibilidadCES>(INDICADOR_DISPONIBILIDAD_CES);
    const [mes, setMes] = useState<string>("Todos");

    useEffect(() => {
        let mounted = true;
        fetch("/api/sync/indicador-disponibilidad")
            .then((r) => (r.ok ? r.json() : Promise.reject(r.statusText)))
            .then((d) => mounted && setData(d))
            .catch(() => {
                /* fallback estático se mantiene */
            });
        return () => {
            mounted = false;
        };
    }, []);

    const filaMes = mes === "Todos" ? null : data.tendenciaMensual.find((f) => f.mes === mes);
    const meta = data.metaVigente ?? 0;
    const valorActual = filaMes?.valor ?? 0;
    const cumple = filaMes ? valorActual >= meta : null;
    const clientesDelMes = mes !== "Todos" ? data.detallePorMes[mes] ?? [] : [];
    // Meses seleccionables: cualquier mes con detalle por cliente o con un valor medido (>0) en la
    // tendencia — así el selector siempre refleja lo que el PDF realmente trae, sin una lista fija que
    // se desactualiza cada vez que se agrega un mes nuevo.
    const mesesDisponibles = MESES_ORDEN.filter((m) => {
        const tieneDetalle = (data.detallePorMes[m]?.length ?? 0) > 0;
        const valorMedido = data.tendenciaMensual.find((f) => f.mes === m)?.valor ?? 0;
        return tieneDetalle || valorMedido > 0;
    });

    return (
        <Card className="border-border/60">
            <CardContent className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{data.codigo ?? "ID.AM.001.004"}</span>
                            <span className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand">
                                <Satellite className="h-3 w-3" /> Real · SharePoint
                            </span>
                        </div>
                        <h3 className="mt-1 text-lg font-semibold">{data.nombre}</h3>
                        <p className="mt-1 text-xs text-muted-foreground">{data.proposito} · Tendencia {data.tendencia?.toLowerCase()} · Frecuencia {data.frecuencia?.toLowerCase()} · Meta vigente {meta.toFixed(2)}</p>
                    </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                    {mesesDisponibles.map((m) => (
                        <button
                            key={m}
                            onClick={() => setMes(m)}
                            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                                mes === m ? "border-brand bg-brand text-white" : "border-border/60 bg-transparent text-muted-foreground hover:border-brand/50 hover:text-brand"
                            }`}
                        >
                            {m}
                        </button>
                    ))}
                    <button
                        onClick={() => setMes("Todos")}
                        className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                            mes === "Todos" ? "border-brand bg-brand text-white" : "border-border/60 bg-transparent text-muted-foreground hover:border-brand/50 hover:text-brand"
                        }`}
                    >
                        Todos
                    </button>
                </div>

                {mes === "Todos" ? (
                    <div className="mt-6 h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.tendenciaMensual.map((f) => ({ mes: f.mes.slice(0, 3), valor: f.valor }))}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(0.94 0.01 220)" />
                                <XAxis dataKey="mes" tick={{ fontSize: 12 }} stroke="oklch(0.5 0.02 220)" />
                                <YAxis tick={{ fontSize: 12 }} stroke="oklch(0.5 0.02 220)" domain={[0, "auto"]} />
                                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                                <ReferenceLine y={meta} stroke="oklch(0.7 0.15 60)" strokeDasharray="4 4" label={{ value: "Meta", fontSize: 11, fill: "oklch(0.6 0.15 60)" }} />
                                <Bar dataKey="valor" fill="oklch(0.62 0.17 152)" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                        {mesesDisponibles.length < 12 && (
                            <p className="mt-2 text-center text-xs text-muted-foreground">
                                {MESES_ORDEN.filter((m) => !mesesDisponibles.includes(m)).join(", ")} aún no {mesesDisponibles.length === 11 ? "tiene" : "tienen"} medición registrada en el PDF de origen.
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="mt-6 grid gap-6 md:grid-cols-[minmax(0,240px)_1fr]">
                        <Medidor valorActual={valorActual} meta={meta} mes={mes} cumple={!!cumple} />

                        <div>
                            <h4 className="text-sm font-semibold">Análisis por cliente · {mes}</h4>
                            <div className="mt-2 max-h-80 space-y-3 overflow-y-auto pr-1">
                                {clientesDelMes.length === 0 && (
                                    <p className="text-sm text-muted-foreground">Sin detalle por cliente para este mes.</p>
                                )}
                                {clientesDelMes.map((c) => (
                                    <div key={c.cliente} className="rounded-lg border border-border/60 p-3">
                                        <div className="text-xs font-semibold text-brand">{c.cliente}</div>
                                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{c.analisis}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function IndicadoresPage() {
    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <PageHeader eyebrow="Medición y análisis" title="Indicadores" description="Seguimiento de disponibilidad, SLA, capacidad, incidentes y satisfacción." />

            <div className="mt-8">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                    <Radar className="h-4 w-4" /> Indicador conectado a SharePoint
                </div>
                <DisponibilidadCard />
            </div>

            <div className="mt-10 mb-3 text-sm font-semibold text-muted-foreground">Otros indicadores (demo)</div>
            <div className="grid gap-5 lg:grid-cols-2">
                {INDICADORES.map((i) => {
                    const Icon = trendIcon[i.tendencia as keyof typeof trendIcon];
                    const ok = i.actual >= i.meta;
                    return (
                        <Card key={i.id} className="border-border/60">
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{i.id}</div>
                                        <h3 className="mt-1 text-base font-semibold">{i.nombre}</h3>
                                    </div>
                                    <div className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${ok ? "bg-brand-soft text-brand" : "bg-amber-50 text-amber-700"}`}>
                                        <Icon className="h-3.5 w-3.5" /> {ok ? "Cumple" : "Alerta"}
                                    </div>
                                </div>
                                <div className="mt-4 flex items-end justify-between">
                                    <div>
                                        <div className="text-4xl font-bold tracking-tight">{i.actual}<span className="text-lg font-normal text-muted-foreground">{i.unidad}</span></div>
                                        <div className="text-xs text-muted-foreground">Meta {i.meta}{i.unidad}</div>
                                    </div>
                                    <div className="h-20 w-40">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={i.historico.map((v, idx) => ({ x: `M${idx + 1}`, v }))}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(0.94 0.01 220)" />
                                                <XAxis dataKey="x" hide />
                                                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                                                <Line type="monotone" dataKey="v" stroke="oklch(0.62 0.17 152)" strokeWidth={2.5} dot={{ r: 3 }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
