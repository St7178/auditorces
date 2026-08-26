import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Mail, ArrowRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// Adaptado de "team-showcase": misma composición (grilla de fotos en 3 columnas escalonadas +
// lista de nombres a la derecha, con dimming cruzado al hacer hover) pero con nuestros datos reales
// en vez de redes sociales — correo, clientes asignados (con detalle expandible) y navegación al
// cliente, usando iconos lucide-react (ya en el proyecto) en vez de react-icons.
export interface TeamMemberCliente {
    nombre: string;
    activo: boolean | null;
}

export interface TeamMember {
    id: string;
    name: string;
    role: string;
    image: string | null;
    initials: string;
    /** Clase Tailwind del punto de presencia (ej. "bg-emerald-500") — null si no aplica. */
    presenceDot?: string | null;
    /** Color del indicador junto al nombre y del glow al hacer hover (oklch/css válido). */
    indicatorColor: string;
    mail: string | null;
    /** "Todos los clientes" / "N clientes asignados" / "Sin clientes asignados". */
    clientesLabel: string;
    /** Detalle expandible — vacío si el rol ya cubre "todos los clientes" (no aplica un listado). */
    clientes: TeamMemberCliente[];
    clienteSearch: Record<string, string>;
}

interface TeamShowcaseProps {
    members: TeamMember[];
}

export function TeamShowcase({ members }: TeamShowcaseProps) {
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    const col1 = members.filter((_, i) => i % 3 === 0);
    const col2 = members.filter((_, i) => i % 3 === 1);
    const col3 = members.filter((_, i) => i % 3 === 2);

    return (
        <div className="flex w-full select-none flex-col items-start gap-8 md:flex-row md:gap-10 lg:gap-14">
            {/* Grilla de fotos */}
            <div className="flex flex-shrink-0 gap-2 overflow-x-auto pb-1 md:gap-3 md:pb-0">
                <div className="flex flex-col gap-2 md:gap-3">
                    {col1.map((m) => (
                        <PhotoCard key={m.id} member={m} className="h-[120px] w-[110px] sm:h-[140px] sm:w-[130px] md:h-[165px] md:w-[155px]" hoveredId={hoveredId} onHover={setHoveredId} />
                    ))}
                </div>
                <div className="mt-[48px] flex flex-col gap-2 sm:mt-[56px] md:mt-[68px] md:gap-3">
                    {col2.map((m) => (
                        <PhotoCard key={m.id} member={m} className="h-[132px] w-[122px] sm:h-[155px] sm:w-[145px] md:h-[182px] md:w-[172px]" hoveredId={hoveredId} onHover={setHoveredId} />
                    ))}
                </div>
                <div className="mt-[22px] flex flex-col gap-2 sm:mt-[26px] md:mt-[32px] md:gap-3">
                    {col3.map((m) => (
                        <PhotoCard key={m.id} member={m} className="h-[125px] w-[115px] sm:h-[146px] sm:w-[136px] md:h-[172px] md:w-[162px]" hoveredId={hoveredId} onHover={setHoveredId} />
                    ))}
                </div>
            </div>

            {/* Lista de nombres */}
            <div className="flex w-full flex-1 flex-col gap-4 pt-0 sm:grid sm:grid-cols-2 md:flex md:flex-col md:gap-5 md:pt-2">
                {members.map((m) => (
                    <MemberRow key={m.id} member={m} hoveredId={hoveredId} onHover={setHoveredId} />
                ))}
            </div>
        </div>
    );
}

function PhotoCard({
    member, className, hoveredId, onHover,
}: {
    member: TeamMember;
    className: string;
    hoveredId: string | null;
    onHover: (id: string | null) => void;
}) {
    const isActive = hoveredId === member.id;
    const isDimmed = hoveredId !== null && !isActive;

    return (
        <div
            className={cn(
                "relative flex-shrink-0 cursor-pointer overflow-hidden rounded-xl transition-opacity duration-400",
                className,
                isDimmed ? "opacity-60" : "opacity-100",
            )}
            onMouseEnter={() => onHover(member.id)}
            onMouseLeave={() => onHover(null)}
        >
            {member.image ? (
                <img
                    src={member.image}
                    alt={member.name}
                    className="h-full w-full object-cover transition-[filter] duration-500"
                    style={{ filter: isActive ? "grayscale(0) brightness(1)" : "grayscale(1) brightness(0.77)" }}
                />
            ) : (
                <div className="flex h-full w-full items-center justify-center bg-brand-soft text-lg font-bold text-brand">
                    {member.initials}
                </div>
            )}
            {member.presenceDot && (
                <span className={cn("absolute bottom-1.5 right-1.5 h-3 w-3 rounded-full border-2 border-background", member.presenceDot)} />
            )}
        </div>
    );
}

function MemberRow({
    member, hoveredId, onHover,
}: {
    member: TeamMember;
    hoveredId: string | null;
    onHover: (id: string | null) => void;
}) {
    const [expanded, setExpanded] = useState(false);
    const isActive = hoveredId === member.id;
    const isDimmed = hoveredId !== null && !isActive;
    const hasClientes = member.clientes.length > 0;

    return (
        <div
            className={cn("cursor-pointer transition-opacity duration-300", isDimmed ? "opacity-50" : "opacity-100")}
            onMouseEnter={() => onHover(member.id)}
            onMouseLeave={() => onHover(null)}
        >
            <div className="flex items-center gap-2.5">
                <span
                    className="h-3 shrink-0 rounded-[5px] transition-all duration-300"
                    style={{ backgroundColor: member.indicatorColor, opacity: isActive ? 1 : 0.3, width: isActive ? "1.25rem" : "1rem" }}
                />
                <span className={cn("truncate text-base font-semibold leading-none tracking-tight transition-colors duration-300 md:text-[18px]", isActive ? "text-foreground" : "text-foreground/80")}>
                    {member.name}
                </span>

                {/* Acciones — mismo mecanismo del template (revelar al hacer hover) pero con
                    nuestras acciones reales: correo, ir al cliente y ver el detalle de clientes. */}
                <div
                    className={cn(
                        "ml-0.5 flex items-center gap-1.5 transition-all duration-200",
                        isActive ? "translate-x-0 opacity-100" : "pointer-events-none -translate-x-2 opacity-0",
                    )}
                >
                    <a
                        href={member.mail ? `mailto:${member.mail}` : undefined}
                        onClick={(e) => e.stopPropagation()}
                        aria-disabled={!member.mail}
                        className="rounded p-1 text-muted-foreground transition-all duration-150 hover:scale-110 hover:bg-foreground/10 hover:text-foreground aria-disabled:pointer-events-none aria-disabled:opacity-40"
                        title={member.mail ?? "Correo no disponible"}
                    >
                        <Mail size={12} />
                    </a>
                    <Link
                        to="/clientes"
                        search={member.clienteSearch}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded p-1 text-muted-foreground transition-all duration-150 hover:scale-110 hover:bg-foreground/10 hover:text-foreground"
                        title="Ir al cliente"
                    >
                        <ArrowRight size={12} />
                    </Link>
                    {hasClientes && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setExpanded((v) => !v);
                            }}
                            className="rounded p-1 text-muted-foreground transition-all duration-150 hover:scale-110 hover:bg-foreground/10 hover:text-foreground"
                            title="Ver clientes asignados"
                        >
                            <ChevronDown size={12} className={cn("transition-transform duration-200", expanded && "rotate-180")} />
                        </button>
                    )}
                </div>
            </div>

            <p className="mt-1.5 pl-[27px] text-[7px] font-medium uppercase tracking-[0.2em] text-muted-foreground md:text-[10px]">
                {member.role}
            </p>
            <p className="pl-[27px] text-[7px] text-muted-foreground/70 md:text-[10px]">{member.clientesLabel}</p>

            {expanded && hasClientes && (
                <div className="ml-[27px] mt-2 max-w-xs overflow-hidden rounded-lg border" onClick={(e) => e.stopPropagation()}>
                    <table className="w-full text-[11px]">
                        <tbody className="divide-y">
                            {member.clientes.map((c) => (
                                <tr key={c.nombre}>
                                    <td className="px-2 py-1.5">{c.nombre}</td>
                                    <td className="px-2 py-1.5 text-right">{c.activo === null ? "⚪" : c.activo ? "🟢" : "🟡"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
