import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { DOCUMENTOS } from "@/lib/ces-data";
import { BookOpen, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/documentacion")({
    component: DocPage,
    head: () => ({ meta: [{ title: "Documentación — CES HUB" }] }),
});

function DocPage() {
    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <PageHeader eyebrow="Conocimiento" title="Documentación" description="Registro de documentos del SIG. CES HUB no almacena archivos — solo su ubicación de referencia." />
            <div>
                <img src="./src/711px-MAPA_DE_PROCESOS.jpg" alt="CES SIG Logo" className="flex items-center h-85 w-auto justify-center"/>
                </div>
            <div className="mt-8 grid gap-4 lg:grid-cols-2">
                {DOCUMENTOS.map((d) => (
                    <Card key={d.id} className="border-border/60 transition hover:shadow-lg">
                        <CardContent className="p-5">
                            <div className="flex items-start gap-4">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                                    <BookOpen className="h-5 w-5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="truncate text-base font-semibold">{d.nombre}</h3>
                                        <Badge variant="secondary" className="text-[10px]">v{d.version}</Badge>
                                    </div>
                                    <div className="mt-1 text-xs text-muted-foreground">Responsable · {d.responsable}</div>
                                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                                        <div><span className="text-muted-foreground">Actualizado:</span> {d.actualizacion}</div>
                                        <div><span className="text-muted-foreground">Próx. revisión:</span> {d.proximaRevision}</div>
                                    </div>
                                    <div className="mt-3 flex items-center justify-between">
                                        <Badge className={d.estado === "Vigente" ? "bg-brand-soft text-brand" : "bg-amber-100 text-amber-700"}>{d.estado}</Badge>
                                        <a href="#" className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline">
                                            {d.ubicacion} <ExternalLink className="h-3 w-3" />
                                        </a>
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
