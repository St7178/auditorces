import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { ArrowLeft, MapPin, Lightbulb } from "lucide-react";

export const Route = createFileRoute("/_authenticated/guardian/hallazgos")({
    component: HallazgosPage,
    head: () => ({ meta: [{ title: "Hallazgos de Auditoría — CES SIG" }] }),
});

type Hallazgo = {
    id: string;
    proceso: string;
    titulo: string;
    descripcion: string;
    nivelRiesgo: string | null;
    recomendacion: string;
    evidenciaUbicacion: string | null;
    estado: string;
    creadoEn: string;
};

function nivelTone(n: string | null) {
    if (n === "Crítico") return "bg-red-100 text-red-700";
    if (n === "Alto") return "bg-orange-100 text-orange-700";
    if (n === "Medio") return "bg-amber-100 text-amber-700";
    return "bg-brand-soft text-brand";
}

function HallazgosPage() {
    const [hallazgos, setHallazgos] = useState<Hallazgo[] | null>(null);

    useEffect(() => {
        let mounted = true;
        fetch("/api/hallazgos")
            .then((r) => (r.ok ? r.json() : Promise.reject(r.statusText)))
            .then((data) => mounted && setHallazgos(data))
            .catch(() => {
                /* queda en null: se muestra el estado vacío */
            });
        return () => {
            mounted = false;
        };
    }, []);

    return (
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
            <PageHeader
                eyebrow="CES AUDITOR"
                title="Hallazgos de Auditoría"
                description="Encontrados por CES AUDITOR durante las auditorías conversacionales."
                actions={
                    <Link to="/guardian" className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5 text-xs font-medium hover:bg-accent">
                        <ArrowLeft className="h-3.5 w-3.5" /> CES AUDITOR
                    </Link>
                }
            />

            {hallazgos === null && (
                <div className="mt-8 text-sm text-muted-foreground">Cargando hallazgos…</div>
            )}

            {hallazgos !== null && hallazgos.length === 0 && (
                <div className="mt-8 rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                    Todavía no hay hallazgos registrados. Se registran automáticamente cuando CES AUDITOR encuentra
                    una no conformidad durante una auditoría conversacional.
                </div>
            )}

            {hallazgos && hallazgos.length > 0 && (
                <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {hallazgos.map((h) => (
                        <Card key={h.id} className="border-border/60">
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{h.proceso}</div>
                                    {h.nivelRiesgo && <Badge className={nivelTone(h.nivelRiesgo)}>{h.nivelRiesgo}</Badge>}
                                </div>
                                <div className="mt-1.5 text-sm font-semibold">{h.titulo}</div>
                                <p className="mt-1 text-xs text-muted-foreground">{h.descripcion}</p>

                                {h.recomendacion && (
                                    <div className="mt-3 flex gap-1.5 rounded-lg bg-brand-soft/60 p-2.5 text-xs text-brand">
                                        <Lightbulb className="h-3.5 w-3.5 shrink-0" />
                                        <span>{h.recomendacion}</span>
                                    </div>
                                )}

                                {h.evidenciaUbicacion && (
                                    <div className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                        <MapPin className="h-3 w-3 shrink-0" /> {h.evidenciaUbicacion}
                                    </div>
                                )}

                                <div className="mt-3 flex items-center justify-between border-t pt-3 text-[11px] text-muted-foreground">
                                    <span>{h.estado}</span>
                                    <span>{new Date(h.creadoEn).toLocaleDateString("es")}</span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
