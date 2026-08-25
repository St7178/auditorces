import React, { useId } from "react";
import { motion, useMotionValue, useMotionTemplate, useAnimationFrame, type MotionValue } from "motion/react";

// Adaptado de "the-infinite-grid": acá es solo el fondo (absolute inset-0), pensado para vivir
// dentro de un contenedor `relative` ya dimensionado — no impone su propio alto como el original
// (que era h-screen), para no cambiar el tamaño de la tarjeta que lo usa.
export function InteractiveGridBackground({ className = "" }: { className?: string }) {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const { left, top } = e.currentTarget.getBoundingClientRect();
        mouseX.set(e.clientX - left);
        mouseY.set(e.clientY - top);
    };

    const gridOffsetX = useMotionValue(0);
    const gridOffsetY = useMotionValue(0);

    useAnimationFrame(() => {
        gridOffsetX.set((gridOffsetX.get() + 0.5) % 40);
        gridOffsetY.set((gridOffsetY.get() + 0.5) % 40);
    });

    const maskImage = useMotionTemplate`radial-gradient(300px circle at ${mouseX}px ${mouseY}px, black, transparent)`;
    const patternId = useId();

    return (
        <div onMouseMove={handleMouseMove} className={`absolute inset-0 overflow-hidden ${className}`}>
            <div className="absolute inset-0 z-0 opacity-[0.08]">
                <GridPattern id={`${patternId}-base`} offsetX={gridOffsetX} offsetY={gridOffsetY} />
            </div>
            <motion.div className="absolute inset-0 z-0 opacity-50" style={{ maskImage, WebkitMaskImage: maskImage }}>
                <GridPattern id={`${patternId}-spot`} offsetX={gridOffsetX} offsetY={gridOffsetY} />
            </motion.div>

            <div className="pointer-events-none absolute inset-0 z-0">
                <div className="absolute -right-[10%] -top-[40%] h-[80%] w-[45%] rounded-full bg-orange-500/30 blur-[100px]" />
                <div className="absolute right-[10%] -top-[25%] h-[45%] w-[22%] rounded-full bg-brand/35 blur-[90px]" />
                <div className="absolute -left-[10%] -bottom-[45%] h-[80%] w-[45%] rounded-full bg-blue-500/30 blur-[100px]" />
            </div>
        </div>
    );
}

function GridPattern({ id, offsetX, offsetY }: { id: string; offsetX: MotionValue<number>; offsetY: MotionValue<number> }) {
    return (
        <svg className="h-full w-full">
            <defs>
                <motion.pattern id={id} width="40" height="40" patternUnits="userSpaceOnUse" x={offsetX} y={offsetY}>
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" className="text-muted-foreground" />
                </motion.pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#${id})`} />
        </svg>
    );
}
