import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { METODOLOGIA_RIESGOS } from "@/lib/ces-data";
import { ShieldAlert, Sparkles, BookOpen, RotateCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

export const Route = createFileRoute("/riesgos")({
    component: RiesgosPage,
    head: () => ({ meta: [{ title: "Riesgos Operacionales — CES SIG" }] }),
});

interface Riesgo {
    id: string;
    nombre: string;
    nivel: "Bajo" | "Medio" | "Alto" | "Crítico";
    estado: string;
    responsable: string;
    ultimaActualizacion: string;
    proximaRevision: string;
    evidencia: string;
}

function nivelTone(n: string) {
    if (n === "Crítico") return "bg-red-100 text-red-700";
    if (n === "Alto") return "bg-orange-100 text-orange-700";
    if (n === "Medio") return "bg-amber-100 text-amber-700";
    return "bg-brand-soft text-brand";
}

async function fetchRiesgos(): Promise<Riesgo[]> {
    const response = await fetch("/api/riesgos");
    if (!response.ok) throw new Error("Error fetching riesgos");
    const data = await response.json();
    return data.riesgos || [];
}

function RiesgosPage() {
    const [isRefetching, setIsRefetching] = useState(false);
    
    const { data: RIESGOS = [], isLoading, refetch } = useQuery({
        queryKey: ["riesgos"],
        queryFn: fetchRiesgos,
        staleTime: 60000, // Revalida cada 60s
        gcTime: 5 * 60 * 1000, // Cache 5 minutos
    });

    const handleRefresh = async () => {
        setIsRefetching(true);
        await refetch();
        setIsRefetching(false);
    };

    const desactualizados = RIESGOS.filter((r) => new Date(r.ultimaActualizacion) < new Date("2026-01-01")).length;
    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <PageHeader eyebrow="Administración de Riesgos" title="Riesgos Operacionales" description="Solo se registra la ubicación de la evidencia. No se almacenan matrices ni documentos confidenciales." />
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={isRefetching || isLoading}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-50 transition-opacity"
                    title="Sincronizar con n8n"
                >
                    <RotateCw className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
                    {isRefetching ? "Sincronizando..." : "Actualizar datos"}
                </button>
            </div>

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

            {isLoading && (
                <div className="mt-6 flex items-center justify-center py-8">
                    <div className="text-sm text-muted-foreground">Cargando matriz de riesgos...</div>
                </div>
            )}

            {!isLoading && (
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
            )}
        </div>
    );
}
