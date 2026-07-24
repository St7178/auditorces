import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { CLIENTES } from "@/lib/ces-data";
import { Building2, Calendar, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/_authenticated/clientes")({
    component: ClientesPage,
    head: () => ({ meta: [{ title: "Clientes — CES SIG" }] }),
});

function estadoTone(e: string) {
    if (e === "Próximo a vencer") return "bg-amber-100 text-amber-700";
    if (e === "En renovación") return "bg-amber-100 text-amber-700";
    if (e === "Vigente") return "bg-brand-soft text-brand";
    return "bg-secondary text-secondary-foreground";
}

function ClientesPage() {
    const [clientes, setClientes] = useState(CLIENTES);

    useEffect(() => {
        let mounted = true;
        fetch("/api/sync/clientes")
            .then((r) => r.ok ? r.json() : Promise.reject(r.statusText))
            .then((data) => mounted && setClientes(data))
            .catch(() => {
                /* fallback kept */
            });
        return () => {
            mounted = false;
        };
    }, []);

    const contratosPorVencer = clientes.flatMap((c) => c.contratos || []).filter((ct) => ct.estado === "Próximo a vencer").length;

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <PageHeader eyebrow="Relacionamiento" title="Clientes" description="Clientes activos con contratos asociados gestionados por el equipo CES." />
            
            {contratosPorVencer > 0 && (
                <div className="mt-6 flex gap-3 rounded-xl border border-amber-300/50 bg-amber-50 p-4">
                    <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
                    <div className="text-sm">
                        <div className="font-semibold text-amber-900">Alerta de contratos</div>
                        <div className="text-amber-800">{contratosPorVencer} contrato(s) próximo(s) a vencer en los siguientes 60 días.</div>
                    </div>
                </div>
            )}

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {clientes.map((c) => (
                    <Card key={c.id} className="border-border/60 transition hover:shadow-lg">
                        <CardContent className="p-5">
                            <div className="flex items-start justify-between">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-[oklch(0.5_0.14_240)] text-white">
                                    <Building2 className="h-5 w-5" />
                                </div>
                                <Badge className={c.estado === "Activo" ? "bg-brand-soft text-brand" : "bg-amber-50 text-amber-700"}>{c.estado}</Badge>
                            </div>
                            
                            <div className="mt-4 text-base font-semibold">{c.nombre}</div>
                            <div className="mt-0.5 text-xs text-muted-foreground">Responsable · {c.responsable}</div>
                            
                            <div className="mt-3 flex flex-wrap gap-1.5">
                                {c.servicios.map((s: string) => (
                                    <span key={s} className="rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">{s}</span>
                                ))}
                            </div>

                            {c.contratos && c.contratos.length > 0 && (
                                <div className="mt-4 border-t pt-4">
                                    <div className="text-xs font-semibold text-muted-foreground mb-2">Contratos ({c.contratos.length})</div>
                                    <div className="space-y-2">
                                        {c.contratos.map((ct: any) => (
                                            <div key={ct.id} className="rounded-md bg-muted/50 p-2.5 text-xs">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="font-mono text-[10px] text-muted-foreground">{ct.id}</span>
                                                    <Badge className={estadoTone(ct.estado)} style={{ fontSize: "10px", padding: "2px 6px" }}>
                                                        {ct.estado}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center gap-4 text-muted-foreground">
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        <span>{ct.inicio}</span>
                                                    </div>
                                                    <span>→</span>
                                                    <span>{ct.fin}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
