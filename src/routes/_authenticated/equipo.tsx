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
    if (clientes.length === 0) return null;
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

// Organigrama: "Vicepresidente"/"Gerentes"/"Coordinadores"/"Analistas" son niveles jerárquicos. El
// orden acá define el orden de arriba hacia abajo en la página.
const GRUPO_ORDEN = ["Vicepresidente", "Gerentes", "Coordinadores", "Analistas"] as const;
const GRUPO_INFO: Record<string, { label: string; nota?: string; dot: string }> = {
    Vicepresidente: { label: "Vicepresidente", dot: "bg-fuchsia-500" },
    Gerentes: { label: "Gerentes", dot: "bg-violet-500" },
    Coordinadores: { label: "Coordinadores", dot: "bg-sky-500" },
    Analistas: { label: "Analistas · Colaboradores", dot: "bg-teal-500" },
};

// Vicepresidente y Gerentes muestran siempre "Todos los clientes" (no se limitan a los que aparecen
// como responsables en el archivo sincronizado).
const GRUPOS_TODOS_LOS_CLIENTES = new Set(["Vicepresidente", "Gerentes"]);

// El equipo de Nutresa siempre tiene ese cliente asignado, además de lo que traiga el archivo.
const CLIENTE_FIJO: Record<string, string> = { david: "Nutresa", jonny: "Nutresa", robinson: "Nutresa" };

type DisplayMode = "todos" | "clientes";

function MemberCard({
    nombre, cargo, mail, photoUrl, availability, colorRing, clientes, mode, dashed,
}: {
    nombre: string;
    cargo: string;
    mail: string | null;
    photoUrl: string | null;
    availability?: string | null;
    colorRing?: string;
    clientes: ClienteAsignado[];
    mode: DisplayMode;
    dashed?: boolean;
}) {
    return (
        <Card className={`${dashed ? "border-dashed" : "border-border/60"} transition hover:shadow-lg`}>
            <CardContent className="p-5">
                <div className="flex items-start gap-3">
                    <div className="relative shrink-0">
                        <Avatar
                            className="h-14 w-14 rounded-2xl ring-2 ring-offset-2 ring-offset-card"
                            style={colorRing ? ({ "--tw-ring-color": `oklch(0.65 0.14 ${colorRing})` } as React.CSSProperties) : undefined}
                        >
                            <AvatarImage src={photoUrl ?? undefined} alt={nombre} className="object-cover" />
                            <AvatarFallback className="rounded-2xl bg-brand-soft text-base font-bold text-brand">{initials(nombre)}</AvatarFallback>
                        </Avatar>
                        <PresenceDot availability={availability} />
                    </div>
                    <div className="min-w-0 flex-1 pt-0.5">
                        <div className="truncate text-base font-semibold">{nombre}</div>
                        <div className="truncate text-xs text-muted-foreground">{cargo}</div>
                    </div>
                </div>
                <div className="mt-3 text-xs text-muted-foreground">{mail ?? "Correo no disponible"}</div>

                {mode === "todos" && (
                    <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-semibold text-brand">Todos los clientes</div>
                )}
                {mode === "clientes" && clientes.length > 0 && (
                    <>
                        <div className="mt-3 text-[11px] font-semibold text-foreground">
                            {clientes.length} cliente{clientes.length === 1 ? "" : "s"} asignado{clientes.length === 1 ? "" : "s"}
                        </div>
                        <ClientesTable clientes={clientes} />
                    </>
                )}

                <div className="mt-4 flex gap-2">
                    <a
                        href={mail ? `mailto:${mail}` : undefined}
                        className="flex h-8 flex-1 items-center justify-center gap-1 rounded-lg border text-xs hover:bg-accent aria-disabled:pointer-events-none aria-disabled:opacity-50"
                        aria-disabled={!mail}
                    >
                        <Mail className="h-3 w-3" /> Email
                    </a>
                    <Link to="/clientes" className="flex h-8 flex-1 items-center justify-center gap-1 rounded-lg border text-xs hover:bg-accent">
                        Ir al Cliente <ArrowRight className="h-3 w-3" />
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}

// `rows` son sub-filas dentro de la misma sección que nunca se mezclan entre sí en la cuadrícula
// (p.ej. dentro de "Analistas", el equipo de Nutresa siempre queda en su propia fila, separado de
// los demás), a diferencia de pasar todas las tarjetas juntas a un único grid que las reacomoda
// libremente según el ancho de pantalla.
function OrgSection({ grupo, rows }: { grupo: string; rows: React.ReactNode[][] }) {
    const info = GRUPO_INFO[grupo] ?? { label: grupo, dot: "bg-muted-foreground" };
    return (
        <section className="relative mt-10 first:mt-8">
            <div className="mb-3 flex items-center gap-3">
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${info.dot}`} />
                <h2 className="text-sm font-bold uppercase tracking-wide text-foreground">{info.label}</h2>
                <span className="h-px flex-1 bg-border" />
            </div>
            {info.nota && <p className="mb-3 -mt-1 text-xs text-muted-foreground">{info.nota}</p>}
            {rows.map((row, i) => (
                <div key={i} className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${i > 0 ? "mt-4" : ""}`}>
                    {row}
                </div>
            ))}
        </section>
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
            .catch((err) => {
                // Si esto sale en consola, /equipo se quedó mostrando los clientes de respaldo
                // (EQUIPO.clientes) en vez de los reales del archivo sincronizado.
                console.error("No se pudo cargar /api/sync/clientes para /equipo:", err);
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
        const real = clientesSync
            ? clientesSync
                  .filter((c) => normalizeName(c.responsable) === normalizeName(m.nombre))
                  .map((c) => ({ nombre: c.nombre, activo: c.estado === "Activo" }))
            : m.clientes.map((nombre) => ({ nombre, activo: null as boolean | null }));

        // El equipo de Nutresa (David, Jonny, Robinson) siempre pertenece a Nutresa, la aparezca o no
        // como responsable en el archivo sincronizado — se agrega aparte, sin duplicar si ya está.
        const fijo = CLIENTE_FIJO[m.id];
        if (fijo && !real.some((c) => normalizeName(c.nombre) === normalizeName(fijo))) {
            return [{ nombre: fijo, activo: null }, ...real];
        }
        return real;
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

            {GRUPO_ORDEN.map((grupo) => {
                const miembros = equipo.filter((m) => m.grupo === grupo);
                if (miembros.length === 0) return null;

                const card = (m: (typeof miembros)[number]) => (
                    <MemberCard
                        key={m.id}
                        nombre={m.nombre}
                        cargo={m.cargo}
                        mail={m.mail}
                        photoUrl={m.photoUrl}
                        availability={m.availability}
                        colorRing={m.color}
                        clientes={clientesDe(m)}
                        mode={GRUPOS_TODOS_LOS_CLIENTES.has(grupo) ? "todos" : "clientes"}
                    />
                );

                // Dentro de "Analistas", el equipo de Nutresa (David/Jonny/Robinson) siempre va en su
                // propia fila, arriba, separado del resto — no se mezclan en un mismo grid.
                const rows: (typeof miembros)[] =
                    grupo === "Analistas"
                        ? [miembros.filter((m) => CLIENTE_FIJO[m.id]), miembros.filter((m) => !CLIENTE_FIJO[m.id])].filter((r) => r.length > 0)
                        : [miembros];

                return (
                    <OrgSection key={grupo} grupo={grupo} rows={rows.map((row) => row.map(card))} />
                );
            })}

            {entraOnly.length > 0 && (
                <OrgSection
                    grupo="Otros"
                    rows={[
                        entraOnly.map((u) => (
                            <MemberCard
                                key={u.id}
                                nombre={u.displayName}
                                cargo={u.jobTitle ?? ""}
                                mail={u.mail ?? u.userPrincipalName ?? null}
                                photoUrl={u.photoUrl ?? null}
                                availability={u.availability}
                                clientes={[]}
                                mode="clientes"
                                dashed
                            />
                        )),
                    ]}
                />
            )}
        </div>
    );
}
