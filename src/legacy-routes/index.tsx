import { createFileRoute, Link } from "@tanstack/react-router";
import {
    ClipboardList, ShieldAlert, Users, FileText, Truck, Gauge, ListChecks, AlertTriangle,
    Sparkles, ArrowUpRight, TrendingUp,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KPIS_DASHBOARD, RECOMENDACIONES_IA, INDICADORES, CRONOGRAMA } from "@/lib/ces-data";
import {
    ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    RadialBarChart, RadialBar, PolarAngleAxis,
} from "recharts";

export const Route = createFileRoute("/")({
    component: Dashboard,
    head: () => ({
        meta: [
            { title: "Dashboard — CES SIG" },
            { name: "description", content: "Panorama general del área CES: auditorías, riesgos, indicadores y contratos." },
        ],
    }),
});

const iconMap: Record<string, typeof ClipboardList> = {
    clipboard: ClipboardList, shield: ShieldAlert, users: Users, file: FileText,
    truck: Truck, gauge: Gauge, list: ListChecks, alert: AlertTriangle,
};

const cumplimientoData = [
    { mes: "Ene", valor: 84 }, { mes: "Feb", valor: 86 }, { mes: "Mar", valor: 88 },
    { mes: "Abr", valor: 89 }, { mes: "May", valor: 91 }, { mes: "Jun", valor: 93 },
];

function Dashboard() {
    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {/* Hero */}
            <section className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-[oklch(0.25_0.05_220)] via-[oklch(0.28_0.06_200)] to-[oklch(0.35_0.12_155)] p-8 text-white shadow-xl">
                <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/40 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-[oklch(0.5_0.14_240)]/30 blur-3xl" />
                <div className="relative">
                    <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium backdrop-blur">
                        <Sparkles className="h-3.5 w-3.5" /> Portal Inteligente de Gestión CES
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Hola Laura 👋</h1>
                    <p className="mt-2 max-w-2xl text-white/80">
                        Bienvenida al Portal Inteligente de Gestión CES. Centralizamos la operación, el conocimiento y la mejora continua del área.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-3">
                        <Button asChild size="lg" className="rounded-xl bg-white text-slate-900 hover:bg-white/90">
                            <Link to="/guardian"><Sparkles className="mr-2 h-4 w-4" /> Hablar con CES Guardian</Link>
                        </Button>
                        <Button asChild size="lg" variant="secondary" className="rounded-xl bg-white/10 text-white hover:bg-white/20 border-white/20 border">
                            <Link to="/cronograma">Ver cronograma</Link>
                        </Button>
                    </div>
                </div>
            </section>

            {/* KPI grid */}
            <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {KPIS_DASHBOARD.map((k) => {
                    const Icon = iconMap[k.icon];
                    const toneBg = k.tone === "warning" ? "bg-amber-50 text-amber-700" : k.tone === "brand" ? "bg-brand-soft text-brand" : "bg-muted text-muted-foreground";
                    return (
                        <Card key={k.label} className="overflow-hidden border-border/60 transition hover:shadow-lg">
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between">
                                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${toneBg}`}>
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <span className="text-[11px] font-semibold text-muted-foreground">{k.delta}</span>
                                </div>
                                <div className="mt-4 text-3xl font-bold tracking-tight">{k.value}</div>
                                <div className="mt-1 text-xs text-muted-foreground">{k.label}</div>
                            </CardContent>
                        </Card>
                    );
                })}
            </section>

            {/* Charts + IA */}
            <section className="mt-8 grid gap-4 lg:grid-cols-3">
                <Card className="lg:col-span-2 border-border/60">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold">Cumplimiento general SIG</h2>
                                <p className="text-xs text-muted-foreground">Evolución últimos 6 meses</p>
                            </div>
                            <span className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2 py-1 text-xs font-semibold text-brand">
                                <TrendingUp className="h-3 w-3" /> +9 pts
                            </span>
                        </div>
                        <div className="mt-4 h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={cumplimientoData}>
                                    <defs>
                                        <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="oklch(0.62 0.17 152)" stopOpacity={0.4} />
                                            <stop offset="100%" stopColor="oklch(0.62 0.17 152)" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.01 220)" vertical={false} />
                                    <XAxis dataKey="mes" tick={{ fontSize: 12 }} stroke="oklch(0.5 0.02 220)" />
                                    <YAxis domain={[70, 100]} tick={{ fontSize: 12 }} stroke="oklch(0.5 0.02 220)" />
                                    <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid oklch(0.9 0.01 220)" }} />
                                    <Area type="monotone" dataKey="valor" stroke="oklch(0.62 0.17 152)" strokeWidth={2.5} fill="url(#g1)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-border/60">
                    <CardContent className="p-6">
                        <h2 className="text-lg font-semibold">Nivel de madurez</h2>
                        <p className="text-xs text-muted-foreground">SIG · CES</p>
                        <div className="mt-2 h-56">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadialBarChart innerRadius="70%" outerRadius="100%" data={[{ name: "madurez", value: 88, fill: "oklch(0.62 0.17 152)" }]} startAngle={90} endAngle={-270}>
                                    <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                                    <RadialBar background={{ fill: "oklch(0.94 0.01 220)" }} dataKey="value" cornerRadius={20} />
                                </RadialBarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="-mt-32 text-center">
                            <div className="text-4xl font-bold text-brand">88%</div>
                            <div className="text-xs text-muted-foreground">Preparación auditoría</div>
                        </div>
                    </CardContent>
                </Card>
            </section>

            {/* IA + Cronograma */}
            <section className="mt-8 grid gap-4 lg:grid-cols-3">
                <Card className="lg:col-span-2 border-border/60">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-[oklch(0.5_0.14_200)] text-white">
                                    <Sparkles className="h-4 w-4" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold">Recomendaciones de CES Guardian</h2>
                                    <p className="text-xs text-muted-foreground">Análisis inteligente del estado del área</p>
                                </div>
                            </div>
                            <Button asChild variant="ghost" size="sm"><Link to="/guardian">Abrir <ArrowUpRight className="ml-1 h-3 w-3" /></Link></Button>
                        </div>
                        <div className="mt-4 space-y-3">
                            {RECOMENDACIONES_IA.map((r) => (
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

                <Card className="border-border/60">
                    <CardContent className="p-6">
                        <h2 className="text-lg font-semibold">Próximos eventos</h2>
                        <p className="text-xs text-muted-foreground">Cronograma CES</p>
                        <div className="mt-4 space-y-3">
                            {CRONOGRAMA.slice(0, 5).map((e) => (
                                <div key={e.id} className="flex gap-3 rounded-lg border p-3">
                                    <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg bg-brand-soft text-brand">
                                        <div className="text-[10px] font-semibold uppercase">{new Date(e.fecha).toLocaleDateString("es", { month: "short" })}</div>
                                        <div className="-mt-0.5 text-lg font-bold leading-none">{new Date(e.fecha).getDate()}</div>
                                    </div>
                                    <div className="min-w-0">
                                        <div className="truncate text-sm font-semibold">{e.evento}</div>
                                        <div className="text-xs text-muted-foreground">{e.responsable} · {e.tipo}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </section>

            {/* Indicadores mini */}
            <section className="mt-8">
                <div className="mb-4 flex items-end justify-between">
                    <div>
                        <h2 className="text-lg font-semibold">Indicadores clave</h2>
                        <p className="text-xs text-muted-foreground">Seguimiento operativo</p>
                    </div>
                    <Button asChild variant="ghost" size="sm"><Link to="/indicadores">Ver todos <ArrowUpRight className="ml-1 h-3 w-3" /></Link></Button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {INDICADORES.slice(0, 6).map((i) => (
                        <Card key={i.id} className="border-border/60">
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="text-xs font-medium text-muted-foreground">{i.nombre}</div>
                                        <div className="mt-1 text-2xl font-bold">{i.actual}<span className="text-sm font-normal text-muted-foreground">{i.unidad}</span></div>
                                    </div>
                                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${i.actual >= i.meta ? "bg-brand-soft text-brand" : "bg-amber-50 text-amber-700"}`}>
                                        Meta {i.meta}{i.unidad}
                                    </span>
                                </div>
                                <div className="mt-3 h-12">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={i.historico.map((v, idx) => ({ x: idx, v }))}>
                                            <defs>
                                                <linearGradient id={`sp${i.id}`} x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="oklch(0.62 0.17 152)" stopOpacity={0.5} />
                                                    <stop offset="100%" stopColor="oklch(0.62 0.17 152)" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <Area type="monotone" dataKey="v" stroke="oklch(0.62 0.17 152)" strokeWidth={2} fill={`url(#sp${i.id})`} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </section>
        </div>
    );
}
