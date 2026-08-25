import * as React from "react";
import { cn } from "@/lib/utils";

// Cascarón de tarjeta con hover, del template original — genuinamente reutilizable, sin cambios de
// fondo salvo permitir que el ancho lo defina quien la use (acá vive dentro de una grilla, no en un
// tamaño fijo de 356px como el demo).
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export function AnimatedCard({ className, ...props }: CardProps) {
    return (
        <div
            className={cn(
                "group/animated-card relative w-full overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm",
                className,
            )}
            {...props}
        />
    );
}

export function CardBody({ className, ...props }: CardProps) {
    return <div className={cn("flex flex-col space-y-1.5 border-t border-border/60 p-4", className)} {...props} />;
}

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

export function CardTitle({ className, ...props }: CardTitleProps) {
    return <h3 className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />;
}

interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

export function CardDescription({ className, ...props }: CardDescriptionProps) {
    return <p className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

export function CardVisual({ className, ...props }: CardProps) {
    return <div className={cn("h-[180px] w-full overflow-hidden", className)} {...props} />;
}

// Reemplaza al "Visual2" del template (que mostraba datos y nombres de tecnología inventados): acá
// el aro muestra el nivel de madurez real, coloreado según qué tan bueno es el valor (verde = bueno,
// ámbar = regular, rojo = malo), y al pasar el mouse revela el desglose real detrás del promedio en
// vez de una animación de relleno falsa. Exportado porque "Cumplimiento SIG" usa el mismo criterio
// de color para sus barras y el mismo fondo ambiental para hacer pareja visual con esta tarjeta.
export function colorDeMadurez(percent: number | null) {
    if (percent === null) return { main: "#94a3b8", soft: "#cbd5e1" }; // gris: sin dato real todavía
    if (percent >= 80) return { main: "#16a34a", soft: "#4ade80" }; // verde: bueno
    if (percent >= 50) return { main: "#d97706", soft: "#fbbf24" }; // ámbar: regular
    return { main: "#dc2626", soft: "#f87171" }; // rojo: malo
}

export interface MaturityGaugeProps {
    percent: number | null;
    breakdown: { label: string; value: number | null }[];
}

export function MaturityGauge({ percent, breakdown }: MaturityGaugeProps) {
    const [hovered, setHovered] = React.useState(false);
    const { main, soft } = colorDeMadurez(percent);
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const dashoffset = circumference - ((percent ?? 0) / 100) * circumference;
    const conDato = breakdown.filter((b): b is { label: string; value: number } => b.value !== null);

    return (
        <div
            className="group/gauge relative h-[180px] w-full overflow-hidden rounded-t-lg"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <CardAmbientBackground color={main} />

            <div
                className="absolute inset-0 z-[7] flex items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.6,0.6,0,1)] group-hover/gauge:-translate-y-6 group-hover/gauge:scale-105"
            >
                <div className="relative flex h-[120px] w-[120px] items-center justify-center">
                    <svg width="120" height="120" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r={radius} stroke="currentColor" strokeWidth="10" fill="transparent" className="text-muted-foreground/20" />
                        <circle
                            cx="50"
                            cy="50"
                            r={radius}
                            stroke={main}
                            strokeWidth="14"
                            fill="transparent"
                            strokeDasharray={circumference}
                            strokeDashoffset={dashoffset}
                            strokeLinecap="round"
                            transform="rotate(-90 50 50)"
                            style={{ transition: "stroke-dashoffset 0.6s cubic-bezier(0.6,0.6,0,1), stroke 0.4s" }}
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold" style={{ color: main }}>{percent === null ? "—" : `${percent}%`}</span>
                    </div>
                </div>
            </div>

            {/* Desglose real que hay detrás del promedio — aparece al pasar el mouse. */}
            <div className="pointer-events-none absolute inset-x-0 bottom-3 z-[7] flex flex-wrap items-center justify-center gap-1.5 px-3 opacity-0 transition-opacity duration-500 ease-[cubic-bezier(0.6,0.6,0,1)] group-hover/gauge:opacity-100">
                {conDato.length === 0 ? (
                    <span className="text-[11px] text-muted-foreground">Sin datos reales todavía</span>
                ) : (
                    conDato.map((b) => (
                        <span key={b.label} className="flex items-center gap-1 rounded-full border bg-card/90 px-2 py-1 text-[10px] backdrop-blur-sm">
                            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: hovered ? main : soft }} />
                            {b.label}: <strong>{b.value}%</strong>
                        </span>
                    ))
                )}
            </div>
        </div>
    );
}

// Fondo ambiental compartido (resplandor radial + grilla sutil) — mismo color que el aro de arriba,
// para que cualquier tarjeta que lo use haga pareja visual con "Nivel de madurez". `id` único vía
// useId() porque puede haber más de una instancia en la misma página (dos <radialGradient> con el
// mismo id en el DOM no son válidos).
export function CardAmbientBackground({ color, className }: { color: string; className?: string }) {
    const gradientId = React.useId();
    return (
        <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
            <div className="absolute inset-0 z-[5] flex h-full w-full items-center justify-center">
                <svg width="100%" height="100%" viewBox="0 0 356 180" fill="none" preserveAspectRatio="xMidYMid slice">
                    <rect width="356" height="180" fill={`url(#${gradientId})`} />
                    <defs>
                        <radialGradient id={gradientId} cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(178 98) rotate(90) scale(98 178)">
                            <stop stopColor={color} stopOpacity="0.25" />
                            <stop offset="0.34" stopColor={color} stopOpacity="0.15" />
                            <stop offset="1" stopOpacity="0" />
                        </radialGradient>
                    </defs>
                </svg>
            </div>
            <div className="absolute inset-0 z-[4] h-full w-full bg-transparent bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:20px_20px] bg-center opacity-40 [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_60%,transparent_100%)]" />
        </div>
    );
}
