import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

const cardVariants = cva(
    "relative flex flex-col justify-between w-full p-6 overflow-hidden rounded-xl shadow-sm transition-shadow duration-300 ease-in-out group hover:shadow-lg",
    {
        variants: {
            variant: {
                default: "bg-card text-card-foreground border border-border/60",
                red: "bg-red-500/90 text-white",
                blue: "bg-blue-500/90 text-white",
                gray: "bg-secondary text-secondary-foreground",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    },
);

export interface ServiceCardProps extends VariantProps<typeof cardVariants> {
    /** Título de la tarjeta. */
    title: string;
    /** A dónde lleva el enlace "Ver más". */
    href: string;
    /** Imagen decorativa de la esquina — si no se pasa, la tarjeta se ve igual, solo sin imagen. */
    imgSrc?: string;
    imgAlt?: string;
    /** Contenido entre el título y el enlace (ej. el número/KPI de esta tarjeta). */
    children?: React.ReactNode;
    className?: string;
}

const ServiceCard = React.forwardRef<HTMLDivElement, ServiceCardProps>(
    ({ className, variant, title, href, imgSrc, imgAlt, children }, ref) => {
        const navigate = useNavigate();

        // Navegación SPA (sin recargar la página) — ctrl/cmd/click central se dejan pasar tal
        // cual para que "abrir en pestaña nueva" siga funcionando.
        const handleClick = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
            e.preventDefault();
            void navigate({ to: href });
        };

        const cardAnimation = {
            hover: { scale: 1.02, transition: { duration: 0.3 } },
        };
        const imageAnimation = {
            hover: { scale: 1.1, rotate: 3, x: 10, transition: { duration: 0.4 } },
        };
        const arrowAnimation = {
            hover: { x: 5, transition: { duration: 0.3, repeat: Infinity, repeatType: "reverse" as const } },
        };

        return (
            <motion.div
                className={cn(cardVariants({ variant, className }))}
                ref={ref}
                variants={cardAnimation}
                whileHover="hover"
            >
                <div className="relative z-10 flex h-full flex-col">
                    <h3 className="text-lg font-bold tracking-tight">{title}</h3>
                    {children}
                    <a
                        href={href}
                        onClick={handleClick}
                        aria-label={`Ver más de ${title}`}
                        className="mt-auto flex items-center pt-4 text-xs font-semibold tracking-wide group-hover:underline"
                    >
                        VER MÁS
                        <motion.div variants={arrowAnimation}>
                            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                        </motion.div>
                    </a>
                </div>

                {imgSrc && (
                    <motion.img
                        src={imgSrc}
                        alt={imgAlt ?? ""}
                        className="pointer-events-none absolute -bottom-6 -right-6 h-28 w-28 object-contain opacity-90 group-hover:opacity-100"
                        variants={imageAnimation}
                    />
                )}
            </motion.div>
        );
    },
);
ServiceCard.displayName = "ServiceCard";

export { ServiceCard };
