import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { EQUIPO } from "@/lib/ces-data";
import { Mail, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/equipo")({
    component: EquipoPage,
    head: () => ({ meta: [{ title: "Equipo CES — CES SIG" }] }),
});

function initials(name: string) {
    return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

function EquipoPage() {
    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <PageHeader eyebrow="Equipo" title="Equipo CES" description="Personas del área Cloud Enterprise Services de Compunet." />
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {EQUIPO.map((m) => (
                    <Card key={m.id} className="group overflow-hidden border-border/60 transition hover:shadow-lg">
                        <div className="h-20 bg-gradient-to-br from-brand/80 to-[oklch(0.5_0.14_240)]" style={{ filter: `hue-rotate(${parseInt(m.color) - 152}deg)` }} />
                        <CardContent className="-mt-10 p-5">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-4 border-card bg-card text-lg font-bold text-brand shadow-lg">
                                {initials(m.nombre)}
                            </div>
                            <div className="mt-3 text-base font-semibold">{m.nombre}</div>
                            <div className="text-xs text-muted-foreground">{m.cargo}</div>
                            <div className="mt-3 flex flex-wrap gap-1">
                                {m.procesos.slice(0, 2).map((p) => (
                                    <Badge key={p} variant="secondary" className="text-[10px]">{p}</Badge>
                                ))}
                            </div>
                            <div className="mt-3 text-[11px] text-muted-foreground">
                                <span className="font-semibold text-foreground">Clientes:</span> {m.clientes.join(", ")}
                            </div>
                            <div className="mt-4 flex gap-2">
                                <button className="flex h-8 flex-1 items-center justify-center gap-1 rounded-lg border text-xs hover:bg-accent"><Mail className="h-3 w-3" /> Email</button>
                                <button className="flex h-8 flex-1 items-center justify-center gap-1 rounded-lg border text-xs hover:bg-accent"><MessageSquare className="h-3 w-3" /> Chat</button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
