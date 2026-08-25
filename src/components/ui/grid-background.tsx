// Fondo decorativo para la caja de un chat: grilla sutil + resplandor radial magenta/violeta.
// `absolute inset-0` porque vive dentro de un contenedor `relative` ya dimensionado (la tarjeta
// del chat), no ocupa la pantalla completa como en la plantilla original.
export function GridBackground({ className = "" }: { className?: string }) {
    return (
        <div
            aria-hidden
            className={`pointer-events-none absolute inset-0 z-0 ${className}`}
            style={{
                backgroundImage: `
                    linear-gradient(to right, rgba(71,85,105,0.15) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(71,85,105,0.15) 1px, transparent 1px),
                    radial-gradient(circle at 50% 60%, rgba(236,72,153,0.15) 0%, rgba(168,85,247,0.05) 40%, transparent 70%)
                `,
                backgroundSize: "40px 40px, 40px 40px, 100% 100%",
            }}
        />
    );
}
