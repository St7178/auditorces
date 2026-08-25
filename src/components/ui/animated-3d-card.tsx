import * as React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

// Adaptado de "animated-3d-card": se conserva el efecto que importa (inclinación 3D que sigue al
// mouse + destello diagonal al pasar por encima), pero sin las flourishes decorativas del template
// (patrones SVG rotando, imagen de fondo, texto truncado a 3 líneas) — acá el contenido es de
// verdad información del cliente y no puede recortarse, así que el cuerpo es 100% children libre.
export interface Card3DProps {
    className?: string;
    /** "white" para el caso normal, "red" para clientes con todos los contratos vencidos. */
    variant?: "white" | "red";
    onClick?: () => void;
    children: React.ReactNode;
}

export const Card3D = React.forwardRef<HTMLDivElement, Card3DProps>(
    ({ className, variant = "white", onClick, children }, ref) => {
        const [mousePos, setMousePos] = React.useState({ x: 0, y: 0 });
        const [hovered, setHovered] = React.useState(false);

        // Ángulos chicos a propósito: a mayor inclinación, más se nota el desenfoque que la
        // perspectiva 3D le mete al texto (es un efecto óptico del navegador al proyectar texto
        // plano en un ángulo, no un problema de rendimiento) — con esto casi no se nota y el texto
        // se sigue leyendo bien mientras se mueve el mouse.
        const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            setMousePos({
                x: (x / rect.width - 0.5) * 6,
                y: (y / rect.height - 0.5) * -6,
            });
        };

        return (
            <motion.div
                ref={ref}
                className={cn(
                    "group relative w-full overflow-hidden rounded-2xl border transition-shadow duration-300",
                    variant === "red"
                        ? "border-red-700 bg-red-600 text-white shadow-lg shadow-red-900/30 hover:shadow-xl hover:shadow-red-900/40"
                        : "border-border/60 bg-white text-foreground shadow-sm hover:shadow-xl",
                    onClick && "cursor-pointer",
                    className,
                )}
                onMouseMove={handleMove}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => {
                    setHovered(false);
                    setMousePos({ x: 0, y: 0 });
                }}
                animate={{ rotateX: mousePos.y, rotateY: mousePos.x, z: hovered ? 20 : 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 35, mass: 0.8 }}
                onClick={onClick}
                style={{ transformStyle: "preserve-3d", perspective: "2400px", backfaceVisibility: "hidden" }}
            >
                {/* Destello diagonal que sigue al mouse, mismo mecanismo del template original. */}
                <motion.div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl" style={{ transform: "translateZ(15px)" }}>
                    <motion.div
                        className="absolute -inset-full"
                        animate={{
                            background: hovered
                                ? `linear-gradient(${mousePos.x + 135}deg, transparent 40%, rgba(255,255,255,${variant === "red" ? 0.25 : 0.5}) 50%, transparent 60%)`
                                : "transparent",
                        }}
                        transition={{ duration: 0.3 }}
                    />
                </motion.div>

                <div className="relative z-10 p-5" style={{ transform: "translateZ(20px)", backfaceVisibility: "hidden" }}>
                    {children}
                </div>
            </motion.div>
        );
    },
);
Card3D.displayName = "Card3D";
