import * as React from "react";
import { motion, type Variants } from "motion/react";
import { FileCheck2, FileMinus2, FileText, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

// Adaptado de "card-11" (LatestNewsCard): mismo layout (encabezado + lista animada con stagger),
// pero sin fotos de stock — cada ítem es una actualización real del SIG (extraída del correo
// mensual de "Actualización y Eliminación Información Documentada" vía el webhook de n8n en
// /api/sig-actualizaciones), así que en vez de una imagen se usa un ícono según el tipo. También se
// quita el ancho fijo (max-w-md del original) para que la tarjeta llene la columna donde se ubique.
export interface NewsItem {
    id: string | number;
    title: string;
    date: string;
    source: string;
    href: string;
    tipo?: "actualizacion" | "eliminacion" | "otro";
}

export interface LatestNewsCardProps {
    title: string;
    viewAllText?: string;
    viewAllHref?: string;
    newsItems: NewsItem[];
    /** Texto del estado vacío — nunca se inventan ítems de ejemplo, solo se explica que no hay datos aún. */
    emptyText?: string;
    className?: string;
}

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants: Variants = {
    hidden: { y: 16, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100, damping: 12 } },
};

const TIPO_INFO: Record<NonNullable<NewsItem["tipo"]>, { icon: React.ReactNode; badge: string }> = {
    actualizacion: { icon: <FileCheck2 className="h-5 w-5" />, badge: "bg-emerald-100 text-emerald-700" },
    eliminacion: { icon: <FileMinus2 className="h-5 w-5" />, badge: "bg-red-100 text-red-700" },
    otro: { icon: <FileText className="h-5 w-5" />, badge: "bg-muted text-muted-foreground" },
};

export function LatestNewsCard({ title, viewAllText, viewAllHref, newsItems, emptyText, className }: LatestNewsCardProps) {
    return (
        <div className={cn("flex h-full w-full flex-col rounded-xl border bg-card p-6 text-card-foreground shadow-sm", className)}>
            <div className="mb-4 flex items-center justify-between gap-2">
                <h2 className="text-lg font-semibold">{title}</h2>
                {viewAllHref && (
                    <a
                        href={viewAllHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-brand hover:underline"
                        aria-label={`Ver todo — ${title}`}
                    >
                        {viewAllText ?? "Ver todo"} <ArrowUpRight className="h-3 w-3" />
                    </a>
                )}
            </div>

            {newsItems.length === 0 ? (
                <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">
                    {emptyText ?? "Todavía no hay actualizaciones registradas."}
                </div>
            ) : (
                <motion.ul className="space-y-1" variants={containerVariants} initial="hidden" animate="visible" aria-label={`${title} list`}>
                    {newsItems.map((item) => {
                        const info = TIPO_INFO[item.tipo ?? "otro"];
                        return (
                            <motion.li key={item.id} variants={itemVariants}>
                                <a
                                    href={item.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-accent"
                                >
                                    <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", info.badge)}>
                                        {info.icon}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="truncate text-sm font-medium leading-tight text-card-foreground">{item.title}</h3>
                                        <p className="mt-0.5 truncate text-xs text-muted-foreground">{item.date} &bull; {item.source}</p>
                                    </div>
                                </a>
                            </motion.li>
                        );
                    })}
                </motion.ul>
            )}
        </div>
    );
}

export default LatestNewsCard;
