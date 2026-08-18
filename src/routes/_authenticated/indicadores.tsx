import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { INDICADORES, INDICADOR_DISPONIBILIDAD_CES, type IndicadorDisponibilidadCES } from "@/lib/ces-data";
import {
    ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
    RadialBarChart, RadialBar, PolarAngleAxis, BarChart, Bar, ReferenceLine,
} from "recharts";
import { TrendingUp, TrendingDown, Minus, Radar, Satellite } from "lucide-react";

export const Route = createFileRoute("/_authenticated/indicadores")({
    component: IndicadoresPage,
    head: () => ({ meta: [{ title: "Indicadores — CES SIG" }] }),
});

const trendIcon = { up: TrendingUp, down: TrendingDown, flat: Minus };

const MESES_CON_DATOS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio"];

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
    const porcentaje = meta > 0 ? Math.min(100, (valorActual / meta) * 100) : 0;
    const cumple = filaMes ? valorActual >= meta : null;
    const clientesDelMes = mes !== "Todos" ? data.detallePorMes[mes] ?? [] : [];

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
                    {MESES_CON_DATOS.map((m) => (
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
                        <p className="mt-2 text-center text-xs text-muted-foreground">Julio–Diciembre aún no tienen medición registrada en el PDF de origen.</p>
                    </div>
                ) : (
                    <div className="mt-6 grid gap-6 md:grid-cols-[minmax(0,220px)_1fr]">
                        <div>
                            <div className="h-44">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadialBarChart innerRadius="70%" outerRadius="100%" data={[{ name: "disponibilidad", value: porcentaje, fill: cumple ? "oklch(0.62 0.17 152)" : "oklch(0.7 0.19 40)" }]} startAngle={90} endAngle={-270}>
                                        <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                                        <RadialBar background={{ fill: "oklch(0.94 0.01 220)" }} dataKey="value" cornerRadius={20} />
                                    </RadialBarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="-mt-24 text-center">
                                <div className={`text-3xl font-bold ${cumple ? "text-brand" : "text-amber-600"}`}>{valorActual.toFixed(0)}</div>
                                <div className="text-xs text-muted-foreground">de {meta.toFixed(2)} meta · {mes}</div>
                                <div className={`mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${cumple ? "bg-brand-soft text-brand" : "bg-amber-50 text-amber-700"}`}>
                                    {cumple ? "Cumple" : "Alerta"}
                                </div>
                            </div>
                        </div>

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
