import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { CLIENTES } from "@/lib/ces-data";
import { Building2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/clientes")({
    component: ClientesPage,
    head: () => ({ meta: [{ title: "Clientes — CES HUB" }] }),
});

function ClientesPage() {
    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <PageHeader eyebrow="Relacionamiento" title="Clientes" description="Clientes activos gestionados por el equipo CES." />
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {CLIENTES.map((c) => (
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
                                {c.servicios.map((s) => (
                                    <span key={s} className="rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">{s}</span>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
