import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { PageHeader } from "@/components/page-header";
import { EQUIPO, CLIENTES } from "@/lib/ces-data";
import { Mail, ArrowRight, AlertTriangle } from "lucide-react";
import { getCesTeamFromEntra } from "@/lib/team.functions";
import { useEffect, useState } from "react";

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

const PRESENCE_INFO: Record<string, { label: string; dot: string }> = {
    Available: { label: "Disponible", dot: "bg-emerald-500" },
    AvailableIdle: { label: "Disponible (inactivo)", dot: "bg-emerald-500" },
    Busy: { label: "Ocupado", dot: "bg-red-500" },
    BusyIdle: { label: "Ocupado (inactivo)", dot: "bg-red-500" },
    DoNotDisturb: { label: "No molestar", dot: "bg-red-600" },
    BeRightBack: { label: "Vuelvo enseguida", dot: "bg-amber-500" },
    Away: { label: "Ausente", dot: "bg-amber-400" },
    Offline: { label: "Sin conexión", dot: "bg-muted-foreground/50" },
};

function PresenceDot({ availability }: { availability?: string | null }) {
    const info = availability ? PRESENCE_INFO[availability] : undefined;
    if (!info) return null;
    return (
        <span
            title={info.label}
            className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-card ${info.dot}`}
        />
    );
}

// Sin quitar tildes, "Andrés Cano" (roster) y "Andres Cano" (displayName real en Entra) no
// calzaban y el cruce fallaba en silencio — quedaba mostrando el cargo/foto de respaldo.
function normalizeName(name: string) {
    return name
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(new RegExp("[\\u0300-\\u036f]", "g"), "");
}

// Un cliente se considera "al día" (🟢) si su estado es Activo; cualquier otro estado (En renovación,
// etc.) se muestra en amarillo — mismo criterio que ya usa /clientes.
type ClienteAsignado = { nombre: string; activo: boolean | null };

function ClientesTable({ clientes }: { clientes: ClienteAsignado[] }) {
    if (clientes.length === 0) {
        return <div className="mt-2 text-[11px] text-muted-foreground">Sin clientes asignados.</div>;
    }
    return (
        <div className="mt-2 overflow-hidden rounded-lg border">
            <table className="w-full text-[11px]">
                <tbody className="divide-y">
                    {clientes.map((c) => (
                        <tr key={c.nombre}>
                            <td className="px-2 py-1.5">{c.nombre}</td>
                            <td className="px-2 py-1.5 text-right">
                                {c.activo === null ? "⚪" : c.activo ? "🟢" : "🟡"}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function EquipoPage() {
    const { entraUsers, error } = Route.useLoaderData();
    const entraByName = new Map(entraUsers.map((u) => [normalizeName(u.displayName), u]));
    const [clientesSync, setClientesSync] = useState<typeof CLIENTES | null>(null);

    useEffect(() => {
        let mounted = true;
        fetch("/api/sync/clientes")
            .then((r) => (r.ok ? r.json() : Promise.reject(r.statusText)))
            .then((data) => mounted && setClientesSync(data))
            .catch(() => {
                /* fallback: se usa la lista estática de EQUIPO.clientes */
            });
        return () => {
            mounted = false;
        };
    }, []);

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

    // Cliente asignado por persona: se cruza el nombre (ya fusionado con Entra) contra el campo
    // `responsable` de los clientes reales sincronizados. Solo se cae a EQUIPO.clientes (demo) si la
    // sincronización todavía no cargó — si ya cargó pero esta persona no es responsable de ningún
    // cliente real, eso es un dato real ("0 asignados"), no un motivo para mostrar el fallback.
    function clientesDe(m: (typeof equipo)[number]): ClienteAsignado[] {
        if (clientesSync) {
            return clientesSync
                .filter((c) => normalizeName(c.responsable) === normalizeName(m.nombre))
                .map((c) => ({ nombre: c.nombre, activo: c.estado === "Activo" }));
        }
        return m.clientes.map((nombre) => ({ nombre, activo: null }));
    }

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
                {equipo.map((m) => {
                    const clientes = clientesDe(m);
                    return (
                        <Card key={m.id} className="border-border/60 transition hover:shadow-lg">
                            <CardContent className="p-5">
                                <div className="flex items-start gap-3">
                                    <div className="relative shrink-0">
                                        <Avatar className="h-14 w-14 rounded-2xl ring-2 ring-offset-2 ring-offset-card" style={{ "--tw-ring-color": `oklch(0.65 0.14 ${m.color})` } as React.CSSProperties}>
                                            <AvatarImage src={m.photoUrl ?? undefined} alt={m.nombre} className="object-cover" />
                                            <AvatarFallback className="rounded-2xl bg-brand-soft text-base font-bold text-brand">{initials(m.nombre)}</AvatarFallback>
                                        </Avatar>
                                        <PresenceDot availability={m.availability} />
                                    </div>
                                    <div className="min-w-0 flex-1 pt-0.5">
                                        <div className="truncate text-base font-semibold">{m.nombre}</div>
                                        <div className="truncate text-xs text-muted-foreground">{m.cargo}</div>
                                    </div>
                                </div>
                                <div className="mt-3 text-xs text-muted-foreground">{m.mail ?? "Correo no disponible"}</div>

                                <div className="mt-3 text-[11px] font-semibold text-foreground">{clientes.length} cliente{clientes.length === 1 ? "" : "s"} asignado{clientes.length === 1 ? "" : "s"}</div>
                                <ClientesTable clientes={clientes} />

                                <div className="mt-4 flex gap-2">
                                    <a href={m.mail ? `mailto:${m.mail}` : undefined} className="flex h-8 flex-1 items-center justify-center gap-1 rounded-lg border text-xs hover:bg-accent aria-disabled:pointer-events-none aria-disabled:opacity-50" aria-disabled={!m.mail}>
                                        <Mail className="h-3 w-3" /> Email
                                    </a>
                                    <Link to="/clientes" className="flex h-8 flex-1 items-center justify-center gap-1 rounded-lg border text-xs hover:bg-accent">
                                        Ir al Cliente <ArrowRight className="h-3 w-3" />
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}

                {entraOnly.map((u) => (
                    <Card key={u.id} className="border-dashed border-border/60 transition hover:shadow-lg">
                        <CardContent className="p-5">
                            <div className="flex items-start gap-3">
                                <div className="relative shrink-0">
                                    <Avatar className="h-14 w-14 rounded-2xl">
                                        <AvatarImage src={u.photoUrl ?? undefined} alt={u.displayName} className="object-cover" />
                                        <AvatarFallback className="rounded-2xl bg-muted text-base font-bold text-muted-foreground">{initials(u.displayName)}</AvatarFallback>
                                    </Avatar>
                                    <PresenceDot availability={u.availability} />
                                </div>
                                <div className="min-w-0 flex-1 pt-0.5">
                                    <div className="truncate text-base font-semibold">{u.displayName}</div>
                                    <div className="truncate text-xs text-muted-foreground">{u.jobTitle}</div>
                                </div>
                            </div>
                            <div className="mt-3 text-xs text-muted-foreground">{u.mail ?? u.userPrincipalName ?? "Correo no disponible"}</div>
                            <div className="mt-3 text-[11px] font-semibold text-foreground">0 clientes asignados</div>
                            <div className="mt-4 flex gap-2">
                                <a href={`mailto:${u.mail ?? u.userPrincipalName}`} className="flex h-8 flex-1 items-center justify-center gap-1 rounded-lg border text-xs hover:bg-accent">
                                    <Mail className="h-3 w-3" /> Email
                                </a>
                                <Link to="/clientes" className="flex h-8 flex-1 items-center justify-center gap-1 rounded-lg border text-xs hover:bg-accent">
                                    Ir al Cliente <ArrowRight className="h-3 w-3" />
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
