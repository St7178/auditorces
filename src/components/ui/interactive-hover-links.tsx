import { useMotionValue, motion, useSpring, useTransform, AnimatePresence } from "motion/react";
import React, { useRef, useState } from "react";
import { ArrowRight, ChevronDown } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import type { NavItem } from "@/lib/nav-items";

// Adaptado del template "interactive-hover-links": en vez de fotos de stock (no encajan en un
// portal corporativo), la vista previa que sigue al cursor es una placa con el ícono de la
// sección en el color de marca — mismo espíritu visual, sin imágenes.
interface InteractiveHoverLinksProps {
    groups: { section: string; items: NavItem[] }[];
    onNavigate?: () => void;
}

export function InteractiveHoverLinks({ groups, onNavigate }: InteractiveHoverLinksProps) {
    return (
        <div className="mx-auto w-full max-w-4xl">
            {groups.map((group) => (
                <div key={group.section} className="mb-2">
                    <div className="px-1 pb-1 pt-6 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground first:pt-0">
                        {group.section}
                    </div>
                    {group.items.map((item) => (
                        <NavLink key={item.title} item={item} onNavigate={onNavigate} />
                    ))}
                </div>
            ))}
        </div>
    );
}

function NavLink({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
    const ref = useRef<HTMLAnchorElement | null>(null);
    const navigate = useNavigate();
    const [expandido, setExpandido] = useState(false);
    const tieneHijos = (item.children?.length ?? 0) > 0;

    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseXSpring = useSpring(x);
    const mouseYSpring = useSpring(y);

    const top = useTransform(mouseYSpring, [0.5, -0.5], ["40%", "60%"]);
    const left = useTransform(mouseXSpring, [0.5, -0.5], ["60%", "40%"]);

    const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
        const rect = ref.current!.getBoundingClientRect();
        const xPct = (e.clientX - rect.left) / rect.width - 0.5;
        const yPct = (e.clientY - rect.top) / rect.height - 0.5;
        x.set(xPct);
        y.set(yPct);
    };

    // Click normal → navegación SPA (sin recargar la página) y cierre del overlay. Ctrl/Cmd/click
    // central se dejan pasar tal cual para que "abrir en pestaña nueva" siga funcionando.
    const handleClick = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
        e.preventDefault();
        onNavigate?.();
        void navigate({ to: item.url });
    };

    const Icon = item.icon;

    return (
        <div className="border-b border-border">
            <div className="group relative flex items-center">
                <motion.a
                    href={item.url}
                    ref={ref}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={() => {
                        x.set(0);
                        y.set(0);
                    }}
                    onClick={handleClick}
                    initial="initial"
                    whileHover="whileHover"
                    className="relative flex flex-1 items-center justify-between py-3.5 transition-colors duration-500"
                >
                    <div className="flex items-center gap-3">
                        <Icon className={`h-5 w-5 shrink-0 text-muted-foreground transition-colors duration-500 group-hover:text-brand ${item.iconClassName ?? ""}`} />
                        <motion.span
                            variants={{ initial: { x: 0 }, whileHover: { x: -8 } }}
                            transition={{ type: "spring", staggerChildren: 0.05, delayChildren: 0.15 }}
                            className="relative z-10 block text-2xl font-bold text-foreground/80 transition-colors duration-500 group-hover:text-foreground sm:text-3xl"
                        >
                            {item.title.split("").map((l, i) => (
                                <motion.span
                                    variants={{ initial: { x: 0 }, whileHover: { x: 8 } }}
                                    transition={{ type: "spring" }}
                                    className="inline-block"
                                    key={i}
                                >
                                    {l === " " ? " " : l}
                                </motion.span>
                            ))}
                        </motion.span>
                    </div>

                    <motion.div
                        style={{ top, left, translateX: "-10%", translateY: "-50%" }}
                        variants={{
                            initial: { scale: 0, rotate: "-12.5deg" },
                            whileHover: { scale: 1, rotate: "12.5deg" },
                        }}
                        transition={{ type: "spring" }}
                        className="gradient-brand pointer-events-none absolute z-0 hidden h-20 w-28 items-center justify-center rounded-lg text-white shadow-lg sm:flex"
                    >
                        <Icon className="h-9 w-9" />
                    </motion.div>

                    {/* Solo se muestra en los ítems sin subpágina — en los que sí tienen, esta
                        flecha de hover competía visualmente con el chevron del desplegable. */}
                    {!tieneHijos && (
                        <div className="overflow-hidden">
                            <motion.div
                                variants={{
                                    initial: { x: "100%", opacity: 0 },
                                    whileHover: { x: "0%", opacity: 1 },
                                }}
                                transition={{ type: "spring" }}
                                className="relative z-10 p-2"
                            >
                                <ArrowRight className="size-5 text-foreground sm:size-6" />
                            </motion.div>
                        </div>
                    )}
                </motion.a>

                {/* Botón aparte, fuera del <a>, para no anidar elementos interactivos: despliega
                    las subpáginas sin navegar a la página principal del ítem. */}
                {tieneHijos && (
                    <button
                        onClick={() => setExpandido((v) => !v)}
                        aria-label={expandido ? "Contraer subpáginas" : "Mostrar subpáginas"}
                        className="ml-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
                    >
                        <ChevronDown className={`h-5 w-5 transition-transform duration-300 ${expandido ? "rotate-180" : ""}`} />
                    </button>
                )}
            </div>

            <AnimatePresence initial={false}>
                {tieneHijos && expandido && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        <div className="flex flex-col gap-1 py-1.5 pl-8">
                            {item.children!.map((child) => (
                                <SubLink key={child.url} title={child.title} url={child.url} onNavigate={onNavigate} />
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function SubLink({ title, url, onNavigate }: { title: string; url: string; onNavigate?: () => void }) {
    const navigate = useNavigate();

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
        e.preventDefault();
        onNavigate?.();
        void navigate({ to: url });
    };

    return (
        <a
            href={url}
            onClick={handleClick}
            className="rounded-lg px-2 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
            {title}
        </a>
    );
}
