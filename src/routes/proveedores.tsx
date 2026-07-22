import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { PROVEEDORES } from "@/lib/ces-data";
import { Truck } from "lucide-react";

export const Route = createFileRoute("/proveedores")({
    component: ProveedoresPage,
    head: () => ({ meta: [{ title: "Proveedores — CES HUB" }] }),
});

function ProveedoresPage() {
    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <PageHeader eyebrow="Ecosistema" title="Proveedores" description="Proveedores tecnológicos estratégicos del área CES." />
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {PROVEEDORES.map((p) => (
                    <Card key={p.id} className="border-border/60 transition hover:shadow-lg">
                        <CardContent className="p-5">
                            <div className="flex items-start justify-between">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                                    <Truck className="h-5 w-5" />
                                </div>
                                <Badge className={p.estado === "Estratégico" ? "bg-brand-soft text-brand" : "bg-muted text-muted-foreground"}>{p.estado}</Badge>
                            </div>
                            <div className="mt-4 text-base font-semibold">{p.nombre}</div>
                            <div className="mt-0.5 text-xs text-muted-foreground">{p.tipo}</div>
                            <div className="mt-3 rounded-lg border border-dashed p-2 text-xs text-muted-foreground">
                                Última evaluación: <span className="font-medium text-foreground">{p.ultimaEvaluacion}</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
