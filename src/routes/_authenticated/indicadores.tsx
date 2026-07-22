import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { INDICADORES } from "@/lib/ces-data";
import { ResponsiveContainer, LineChart, Line, XAxis, Tooltip, CartesianGrid } from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/indicadores")({
    component: IndicadoresPage,
    head: () => ({ meta: [{ title: "Indicadores — CES HUB" }] }),
});

const trendIcon = { up: TrendingUp, down: TrendingDown, flat: Minus };

function IndicadoresPage() {
    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <PageHeader eyebrow="Medición y análisis" title="Indicadores" description="Seguimiento de disponibilidad, SLA, capacidad, incidentes y satisfacción." />
            <div className="mt-8 grid gap-5 lg:grid-cols-2">
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
