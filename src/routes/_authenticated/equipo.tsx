import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { EQUIPO, CLIENTES } from "@/lib/ces-data";
import { AlertTriangle } from "lucide-react";
import { getCesTeamFromEntra } from "@/lib/team.functions";
import { normalizeName } from "@/lib/normalize-name";
import { useEffect, useState } from "react";
import { TeamShowcase, type TeamMember, type TeamMemberCliente } from "@/components/ui/team-showcase";

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

const PRESENCE_DOT: Record<string, string> = {
    Available: "bg-emerald-500",
    AvailableIdle: "bg-emerald-500",
    Busy: "bg-red-500",
    BusyIdle: "bg-red-500",
    DoNotDisturb: "bg-red-600",
    BeRightBack: "bg-amber-500",
    Away: "bg-amber-400",
    Offline: "bg-muted-foreground/50",
};

// Organigrama: "Vicepresidente"/"Gerentes"/"Coordinadores"/"Analistas" son niveles jerárquicos. El
// orden acá define el orden de arriba hacia abajo en la página.
const GRUPO_ORDEN = ["Vicepresidente", "Gerentes", "Coordinadores", "Analistas"] as const;
const GRUPO_INFO: Record<string, { label: string; dot: string }> = {
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

// Cada bloque del organigrama (Vicepresidente/Gerentes/...) es su propia "team-showcase": grilla de
// fotos + lista de nombres, con el dimming cruzado del template acotado a ese grupo — así inventamos
// la jerarquía encima del diseño original en vez de mezclar a todo el equipo en una sola grilla.
function OrgSection({ grupo, rows }: { grupo: string; rows: TeamMember[][] }) {
    const info = GRUPO_INFO[grupo] ?? { label: grupo, dot: "bg-muted-foreground" };
    return (
        <section className="relative mt-12 first:mt-8">
            <div className="mb-5 flex items-center gap-3">
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${info.dot}`} />
                <h2 className="text-sm font-bold uppercase tracking-wide text-foreground">{info.label}</h2>
                <span className="h-px flex-1 bg-border" />
            </div>
            {rows.map((row, i) => (
                <div key={i} className={i > 0 ? "mt-10" : ""}>
                    <TeamShowcase members={row} />
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
    function clientesDe(m: (typeof equipo)[number]): TeamMemberCliente[] {
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

    function toMember(id: string, nombre: string, cargo: string, mail: string | null, photoUrl: string | null, availability: string | null | undefined, color: string | undefined, clientes: TeamMemberCliente[], mode: DisplayMode): TeamMember {
        const clientesLabel =
            mode === "todos"
                ? "Todos los clientes"
                : clientes.length === 0
                    ? "Sin clientes asignados"
                    : `${clientes.length} cliente${clientes.length === 1 ? "" : "s"} asignado${clientes.length === 1 ? "" : "s"}`;
        return {
            id,
            name: nombre,
            role: cargo,
            image: photoUrl,
            initials: initials(nombre),
            presenceDot: availability ? PRESENCE_DOT[availability] ?? null : null,
            indicatorColor: color ? `oklch(0.65 0.14 ${color})` : "var(--muted-foreground)",
            mail,
            clientesLabel,
            clientes: mode === "todos" ? [] : clientes,
            clienteSearch: mode === "todos" ? {} : { responsable: nombre },
        };
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

                const mode: DisplayMode = GRUPOS_TODOS_LOS_CLIENTES.has(grupo) ? "todos" : "clientes";

                // Dentro de "Analistas", el equipo de Nutresa (David/Jonny/Robinson) siempre va en su
                // propia fila, arriba, separado del resto — no se mezclan en una misma showcase.
                const gruposDeMiembros: (typeof miembros)[] =
                    grupo === "Analistas"
                        ? [miembros.filter((m) => CLIENTE_FIJO[m.id]), miembros.filter((m) => !CLIENTE_FIJO[m.id])].filter((r) => r.length > 0)
                        : [miembros];

                const rows: TeamMember[][] = gruposDeMiembros.map((fila) =>
                    fila.map((m) => toMember(m.id, m.nombre, m.cargo, m.mail, m.photoUrl, m.availability, m.color, clientesDe(m), mode)),
                );

                return <OrgSection key={grupo} grupo={grupo} rows={rows} />;
            })}

            {entraOnly.length > 0 && (
                <OrgSection
                    grupo="Otros"
                    rows={[
                        entraOnly.map((u) =>
                            toMember(u.id, u.displayName, u.jobTitle ?? "", u.mail ?? u.userPrincipalName ?? null, u.photoUrl ?? null, u.availability, undefined, [], "clientes"),
                        ),
                    ]}
                />
            )}
        </div>
    );
}
