import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { PROCESOS } from "@/lib/ces-data";
import { Workflow, User, Calendar, ClipboardCheck, Gauge, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/procesos")({
    component: ProcesosPage,
    head: () => ({ meta: [{ title: "Procesos CES — CES SIG" }] }),
});

function estadoTone(e: string) {
    if (e === "Al día") return "bg-brand-soft text-brand";
    if (e === "Requiere atención") return "bg-amber-50 text-amber-700";
    return "bg-red-50 text-red-700";
}

function ProcesosPage() {
    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <PageHeader eyebrow="Sistema Integrado de Gestión" title="Procesos CES" description="Procesos del SIG que impactan directamente al área Cloud Enterprise Services." />
            <div className="mt-8 grid gap-4 lg:grid-cols-2">
                {PROCESOS.map((p) => (
                    <Card key={p.id} className="border-border/60 transition hover:shadow-lg">
                        <CardContent className="p-6">
                            <div className="flex items-start gap-4">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                                    <Workflow className="h-6 w-6" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="text-base font-semibold">{p.nombre}</h3>
                                        <Badge className={estadoTone(p.estado)}>{p.estado}</Badge>
                                    </div>
                                    <p className="mt-1 text-sm text-muted-foreground">{p.descripcion}</p>
                                    <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                                        <div className="flex items-center gap-1.5 text-muted-foreground"><User className="h-3 w-3" /> {p.responsable}</div>
                                        <div className="flex items-center gap-1.5 text-muted-foreground"><Calendar className="h-3 w-3" /> Próx: {p.proximaRevision}</div>
                                    </div>
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        <span className="inline-flex items-center gap-1 rounded-lg bg-muted px-2 py-1 text-[11px]"><ClipboardCheck className="h-3 w-3" /> {p.auditorias} auditorías</span>
                                        <span className="inline-flex items-center gap-1 rounded-lg bg-muted px-2 py-1 text-[11px]"><Gauge className="h-3 w-3" /> {p.indicadores} indicadores</span>
                                        <span className="inline-flex items-center gap-1 rounded-lg bg-muted px-2 py-1 text-[11px]"><ShieldAlert className="h-3 w-3" /> {p.riesgos} riesgos</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
