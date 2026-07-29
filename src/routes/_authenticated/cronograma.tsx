import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { getMisReuniones } from "@/lib/calendar.functions";
import { AlertTriangle, Video } from "lucide-react";
import type { CalendarEvent } from "@/lib/auth/entra";

export const Route = createFileRoute("/_authenticated/cronograma")({
    component: CronPage,
    loader: async (): Promise<{ reuniones: CalendarEvent[]; error: string | null }> => {
        try {
            return { reuniones: await getMisReuniones(), error: null };
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            console.error("No se pudo cargar el calendario desde Microsoft Graph:", err);
            return { reuniones: [], error: message };
        }
    },
    head: () => ({ meta: [{ title: "Cronograma — CES SIG" }] }),
});

function formatFechaHora(iso: string) {
    const d = new Date(iso);
    return {
        dia: d.toLocaleDateString("es", { day: "2-digit", month: "short" }),
        hora: d.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" }),
    };
}

function CronPage() {
    const { reuniones, error } = Route.useLoaderData();

    return (
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
            <PageHeader eyebrow="Planeación" title="Cronograma CES" />

            <div className="mt-8">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Tus próximas reuniones (Outlook)</h2>

                {error && (
                    <div className="mt-3 flex gap-3 rounded-xl border border-amber-300/60 bg-amber-50 p-4 text-amber-900">
                        <AlertTriangle className="h-5 w-5 shrink-0" />
                        <div className="text-sm">
                            <div className="font-semibold">No se pudo cargar tu calendario de Microsoft</div>
                            <div className="mt-0.5 text-amber-800/80">
                                Si acabas de agregar esta función, cierra sesión y vuelve a iniciarla para autorizar el acceso al calendario.
                                Detalle: <span className="font-mono text-xs">{error}</span>
                            </div>
                        </div>
                    </div>
                )}

                {!error && reuniones.length === 0 && (
                    <div className="mt-3 text-sm text-muted-foreground">No tienes reuniones en los próximos 14 días.</div>
                )}

                {reuniones.length > 0 && (
                    <div className="mt-3 space-y-3">
                        {reuniones.map((r) => {
                            const { dia, hora } = formatFechaHora(r.start);
                            return (
                                <Card key={r.id} className="border-border/60 transition hover:shadow-md">
                                    <CardContent className="flex items-center gap-4 p-4">
                                        <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-brand-soft text-brand">
                                            <div className="text-[10px] font-semibold uppercase">{dia}</div>
                                            <div className="text-xs font-bold leading-none">{hora}</div>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="truncate text-sm font-semibold">{r.subject}</div>
                                            {r.organizer && <div className="text-xs text-muted-foreground">Organiza · {r.organizer}</div>}
                                        </div>
                                        {r.isOnlineMeeting && r.joinUrl && (
                                            <a
                                                href={r.joinUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex h-8 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium hover:bg-accent"
                                            >
                                                <Video className="h-3.5 w-3.5" /> Unirse
                                            </a>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
