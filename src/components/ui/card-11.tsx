import * as React from "react";
import { motion } from "motion/react";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

// Adaptado de "card-11" (originalmente LatestNewsCard, lista con fotos de stock) — se reemplazó por
// completo el diseño de lista por un carrusel, a pedido explícito del usuario: acá lo importante son
// las páginas reales del boletín mensual de "Actualización y Eliminación Información Documentada"
// (imágenes ya re-alojadas en Vercel Blob por /api/sig-actualizaciones, ver ese archivo y
// wiki-images.ts), no una lista de titulares. Los enlaces reales a la wiki quedan como chips debajo.
export interface EnlaceBoletin {
    titulo: string;
    url: string;
    tipo?: "actualizacion" | "eliminacion" | "otro";
}

export interface SigBoletinCardProps {
    title: string;
    subtitle?: string;
    imagenes: string[];
    enlaces: EnlaceBoletin[];
    emptyText?: string;
    className?: string;
}

const TIPO_CHIP: Record<NonNullable<EnlaceBoletin["tipo"]>, string> = {
    actualizacion: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200",
    eliminacion: "bg-red-100 text-red-700 hover:bg-red-200",
    otro: "bg-muted text-muted-foreground hover:bg-accent",
};

export function SigBoletinCard({ title, subtitle, imagenes, enlaces, emptyText, className }: SigBoletinCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className={cn("flex h-full w-full flex-col rounded-xl border bg-card p-6 text-card-foreground shadow-sm", className)}
        >
            <div className="mb-4 flex items-start justify-between gap-2">
                <h2 className="text-lg font-semibold">{title}</h2>
                {subtitle && <span className="shrink-0 text-xs text-muted-foreground">{subtitle}</span>}
            </div>

            {imagenes.length === 0 ? (
                <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">
                    {emptyText ?? "Todavía no hay boletines registrados."}
                </div>
            ) : (
                <Carousel opts={{ loop: imagenes.length > 1 }} className="w-full">
                    <CarouselContent className="-ml-0">
                        {imagenes.map((src, i) => (
                            <CarouselItem key={src} className="pl-0">
                                <a href={src} target="_blank" rel="noopener noreferrer" className="block">
                                    <img
                                        src={src}
                                        alt={`Página ${i + 1} del boletín`}
                                        className="h-72 w-full rounded-lg border bg-muted object-contain"
                                    />
                                </a>
                                <p className="mt-1.5 text-center text-[11px] text-muted-foreground">
                                    Página {i + 1} de {imagenes.length}
                                </p>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    {imagenes.length > 1 && (
                        <>
                            <CarouselPrevious className="left-1 h-7 w-7" />
                            <CarouselNext className="right-1 h-7 w-7" />
                        </>
                    )}
                </Carousel>
            )}

            {enlaces.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                    {enlaces.map((e) => (
                        <a
                            key={e.url}
                            href={e.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn("rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors", TIPO_CHIP[e.tipo ?? "otro"])}
                        >
                            {e.titulo}
                        </a>
                    ))}
                </div>
            )}
        </motion.div>
    );
}

export default SigBoletinCard;
