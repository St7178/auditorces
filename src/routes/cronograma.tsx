import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { CRONOGRAMA } from "@/lib/ces-data";

export const Route = createFileRoute("/cronograma")({
    component: CronPage,
    head: () => ({ meta: [{ title: "Cronograma — CES HUB" }] }),
});

function CronPage() {
    return (
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
            <PageHeader eyebrow="Planeación" title="Cronograma CES" description="Eventos, auditorías, comités y fechas clave del área." />
            <div className="mt-8 space-y-3">
                {CRONOGRAMA.map((e) => (
                    <Card key={e.id} className="border-border/60 transition hover:shadow-md">
                        <CardContent className="flex items-center gap-4 p-4">
                            <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl gradient-brand text-white">
                                <div className="text-[10px] font-semibold uppercase">{new Date(e.fecha).toLocaleDateString("es", { month: "short" })}</div>
                                <div className="text-xl font-bold leading-none">{new Date(e.fecha).getDate()}</div>
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="text-sm font-semibold">{e.evento}</div>
                                <div className="text-xs text-muted-foreground">Responsable · {e.responsable}</div>
                            </div>
                            <Badge variant="secondary">{e.tipo}</Badge>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
