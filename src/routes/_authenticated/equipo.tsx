import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { PageHeader } from "@/components/page-header";
import { EQUIPO } from "@/lib/ces-data";
import { Mail, MessageSquare, IdCard, AlertTriangle } from "lucide-react";
import { getCesTeamFromEntra } from "@/lib/team.functions";

export const Route = createFileRoute("/_authenticated/equipo")({
    component: EquipoPage,
    loader: async (): Promise<{ entraUsers: Awaited<ReturnType<typeof getCesTeamFromEntra>>; error: string | null }> => {
        try {
            return { entraUsers: await getCesTeamFromEntra(), error: null };
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            console.error("No se pudo cargar el equipo desde Entra ID:", err);
            return { entraUsers: [], error: message };
        }
    },
    head: () => ({ meta: [{ title: "Equipo CES — CES SIG" }] }),
});

function initials(name: string) {
    return name.split(" ").filter(Boolean).slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

function normalizeName(name: string) {
    return name.trim().toLowerCase();
}

const PRESENCE_LABEL: Record<string, { label: string; dot: string }> = {
    Available: { label: "Disponible", dot: "bg-emerald-500" },
    AvailableIdle: { label: "Disponible", dot: "bg-emerald-500" },
    Busy: { label: "Ocupado", dot: "bg-amber-500" },
    BusyIdle: { label: "Ocupado", dot: "bg-amber-500" },
    DoNotDisturb: { label: "No molestar", dot: "bg-red-500" },
    BeRightBack: { label: "Vuelvo enseguida", dot: "bg-amber-500" },
    Away: { label: "Ausente", dot: "bg-amber-400" },
    Offline: { label: "Sin conexión", dot: "bg-muted-foreground/40" },
};

function PresenceBadge({ availability }: { availability?: string | null }) {
    if (!availability) return null;
    const info = PRESENCE_LABEL[availability];
    if (!info) return null;
    return (
        <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
            <span className={`h-1.5 w-1.5 rounded-full ${info.dot}`} /> {info.label}
        </span>
    );
}

function EquipoPage() {
    const { entraUsers, error } = Route.useLoaderData();
    const entraByName = new Map(entraUsers.map((u) => [normalizeName(u.displayName), u]));

    // El directorio Entra ID es la fuente de verdad para nombre, cargo y foto real;
    // EQUIPO solo aporta el contexto CES (clientes/procesos) que Entra no tiene.
    const equipo = EQUIPO.map((m) => {
        const match = entraByName.get(normalizeName(m.nombre));
        return {
            ...m,
            nombre: match?.displayName ?? m.nombre,
            cargo: match?.jobTitle ?? m.cargo,
            mail: match?.mail ?? match?.userPrincipalName ?? null,
            photoUrl: match?.photoUrl ?? null,
            availability: match?.availability ?? null,
            enDirectorio: Boolean(match),
        };
    });

    const knownNames = new Set(EQUIPO.map((m) => normalizeName(m.nombre)));
    const entraOnly = entraUsers.filter((u) => !knownNames.has(normalizeName(u.displayName)));

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <PageHeader eyebrow="Equipo" title="Equipo CES" description="Personas del área Cloud Enterprise Services de Compunet." />

            {error && (
                <div className="mt-6 flex gap-3 rounded-xl border border-amber-300/60 bg-amber-50 p-4 text-amber-900">
                    <AlertTriangle className="h-5 w-5 shrink-0" />
                    <div className="text-sm">
                        <div className="font-semibold">No se pudo conectar con el directorio de Microsoft Entra ID</div>
                        <div className="mt-0.5 text-amber-800/80">
                            Se está mostrando información local de respaldo (sin foto ni cargo actualizado). Detalle: <span className="font-mono text-xs">{error}</span>
                        </div>
                    </div>
                </div>
            )}

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {equipo.map((m) => (
                    <Card key={m.id} className="group overflow-hidden border-border/60 transition hover:shadow-lg">
                        <div className="h-20 bg-gradient-to-br from-brand/80 to-[oklch(0.5_0.14_240)]" style={{ filter: `hue-rotate(${parseInt(m.color) - 152}deg)` }} />
                        <CardContent className="-mt-10 p-5">
                            <Avatar className="h-16 w-16 rounded-2xl border-4 border-card shadow-lg">
                                <AvatarImage src={m.photoUrl ?? undefined} alt={m.nombre} className="object-cover" />
                                <AvatarFallback className="rounded-2xl bg-card text-lg font-bold text-brand">{initials(m.nombre)}</AvatarFallback>
                            </Avatar>
                            <div className="mt-3 text-base font-semibold">{m.nombre}</div>
                            <div className="text-xs text-muted-foreground">{m.cargo}</div>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                                {m.enDirectorio && (
                                    <Badge variant="secondary" className="gap-1 text-[10px]"><IdCard className="h-3 w-3" /> Directorio Entra ID</Badge>
                                )}
                                <PresenceBadge availability={m.availability} />
                            </div>
                            <div className="mt-3 flex flex-wrap gap-1">
                                {m.procesos.slice(0, 2).map((p) => (
                                    <Badge key={p} variant="secondary" className="text-[10px]">{p}</Badge>
                                ))}
                            </div>
                            <div className="mt-3 text-[11px] text-muted-foreground">
                                <span className="font-semibold text-foreground">Clientes:</span> {m.clientes.join(", ")}
                            </div>
                            <div className="mt-4 flex gap-2">
                                <a href={m.mail ? `mailto:${m.mail}` : undefined} className="flex h-8 flex-1 items-center justify-center gap-1 rounded-lg border text-xs hover:bg-accent aria-disabled:pointer-events-none aria-disabled:opacity-50" aria-disabled={!m.mail}>
                                    <Mail className="h-3 w-3" /> Email
                                </a>
                                <button className="flex h-8 flex-1 items-center justify-center gap-1 rounded-lg border text-xs hover:bg-accent"><MessageSquare className="h-3 w-3" /> Chat</button>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {entraOnly.map((u) => (
                    <Card key={u.id} className="group overflow-hidden border-dashed border-border/60 transition hover:shadow-lg">
                        <div className="h-20 bg-gradient-to-br from-muted to-muted/50" />
                        <CardContent className="-mt-10 p-5">
                            <Avatar className="h-16 w-16 rounded-2xl border-4 border-card shadow-lg">
                                <AvatarImage src={u.photoUrl ?? undefined} alt={u.displayName} className="object-cover" />
                                <AvatarFallback className="rounded-2xl bg-card text-lg font-bold text-muted-foreground">{initials(u.displayName)}</AvatarFallback>
                            </Avatar>
                            <div className="mt-3 text-base font-semibold">{u.displayName}</div>
                            <div className="text-xs text-muted-foreground">{u.jobTitle}</div>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                                <Badge variant="secondary" className="gap-1 text-[10px]"><IdCard className="h-3 w-3" /> Directorio Entra ID</Badge>
                                <PresenceBadge availability={u.availability} />
                            </div>
                            <div className="mt-4 flex gap-2">
                                <a href={`mailto:${u.mail ?? u.userPrincipalName}`} className="flex h-8 flex-1 items-center justify-center gap-1 rounded-lg border text-xs hover:bg-accent">
                                    <Mail className="h-3 w-3" /> Email
                                </a>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
