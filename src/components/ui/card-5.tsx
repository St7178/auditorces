import * as React from "react";
import { motion, type Variants } from "motion/react";
import { cn } from "@/lib/utils";

// Adaptado de "card-5": mismo lenguaje visual (cinta/bookmark con el ícono, número grande +
// etiqueta, botón redondeado) pero sobre fondo blanco en vez del degradado de color del template —
// el color queda reservado a la cinta, el número y el botón, según si la información es negativa
// (roja), de alerta (ámbar) o positiva (verde).
const THEMES = {
    red: { accent: "#dc2626", dot: "rgba(220,38,38,0.12)", button: "bg-red-50 text-red-700 hover:bg-red-100" },
    amber: { accent: "#d97706", dot: "rgba(217,119,6,0.12)", button: "bg-amber-50 text-amber-700 hover:bg-amber-100" },
    green: { accent: "#16a34a", dot: "rgba(22,163,74,0.12)", button: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" },
    gray: { accent: "#64748b", dot: "rgba(100,116,139,0.12)", button: "bg-muted text-muted-foreground hover:bg-muted/70" },
} as const;

export type HighlightCardColor = keyof typeof THEMES;

export interface HighlightCardProps {
    title: string;
    description: string;
    metricValue: string;
    metricLabel: string;
    buttonText: string;
    onButtonClick: () => void;
    icon: React.ReactNode;
    /** "red" = negativo/urgente, "amber" = alerta, "green" = positivo, "gray" = neutral. */
    color?: HighlightCardColor;
    className?: string;
}

const cardVariants: Variants = {
    hidden: { opacity: 0, scale: 0.97 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.35, ease: "easeOut", staggerChildren: 0.08 } },
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
};

export const HighlightCard = React.forwardRef<HTMLDivElement, HighlightCardProps>(
    ({ title, description, metricValue, metricLabel, buttonText, onButtonClick, icon, color = "gray", className }, ref) => {
        const theme = THEMES[color] ?? THEMES.gray;

        return (
            <motion.div
                ref={ref}
                className={cn("relative w-full overflow-hidden rounded-2xl border border-border/60 bg-card p-5 shadow-sm", className)}
                style={{
                    backgroundImage: `radial-gradient(circle at 1px 1px, ${theme.dot} 1px, transparent 0)`,
                    backgroundSize: "16px 16px",
                }}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Cinta/bookmark con el ícono — el único elemento a color sólido de la tarjeta. */}
                <div
                    className="absolute right-5 top-0 h-12 w-9 [clip-path:polygon(0%_0%,100%_0%,100%_100%,50%_75%,0%_100%)]"
                    style={{ backgroundColor: theme.accent }}
                >
                    <div className="absolute inset-0 flex items-center justify-center text-white">{icon}</div>
                </div>

                <div className="flex flex-col">
                    <motion.h3 variants={itemVariants} className="max-w-[75%] text-base font-bold leading-snug tracking-tight text-foreground">
                        {title}
                    </motion.h3>
                    <motion.p variants={itemVariants} className="mt-1 max-w-[85%] text-xs leading-relaxed text-muted-foreground">
                        {description}
                    </motion.p>

                    <motion.div variants={itemVariants} className="my-3.5 h-px w-full bg-border" />

                    <div className="flex items-end justify-between gap-2">
                        <motion.div variants={itemVariants}>
                            <p className="text-2xl font-extrabold tracking-tight" style={{ color: theme.accent }}>{metricValue}</p>
                            <p className="text-[11px] text-muted-foreground">{metricLabel}</p>
                        </motion.div>
                        <motion.button
                            variants={itemVariants}
                            onClick={onButtonClick}
                            className={cn("shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors", theme.button)}
                        >
                            {buttonText}
                        </motion.button>
                    </div>
                </div>
            </motion.div>
        );
    },
);
HighlightCard.displayName = "HighlightCard";
