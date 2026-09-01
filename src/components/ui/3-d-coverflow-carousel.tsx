import React, { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Adaptado de "3-d-coverflow-carousel" — se conserva la mecánica 3D (perspectiva real con rotateY,
// autoplay, navegación por teclado/swipe) pero el diseño se rehace por completo a pedido explícito
// del usuario: el template original era oscuro, grande, y mostraba el texto superpuesto sobre la
// foto (con object-fit: cover, que recortaba las páginas del boletín porque no tienen la misma
// proporción que las tarjetas). Ahora: tema claro (blanco/gris suave, acento del color de marca de
// la app en vez del dorado del template), tarjetas más chicas, e imagen + texto separados en vez de
// superpuestos — la imagen va completa dentro de su panel (object-fit: contain, nunca se recorta) y
// el texto va debajo, sobre fondo claro, siempre legible.
export interface CarouselItem {
    tag?: string;
    titleLine1: string;
    titleLine2?: string;
    desc?: string;
    img: string;
}

export interface CoverFlowCarouselProps {
    items: CarouselItem[];
    sectionLabel?: string;
    autoplay?: boolean;
    autoplayDelay?: number;
    className?: string;
}

export function CoverFlowCarousel({
    items,
    sectionLabel = "ACTUALIZACIONES SIG",
    autoplay = true,
    autoplayDelay = 5000,
    className = "",
}: CoverFlowCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const touchStartX = useRef(0);
    const total = items.length;

    const nextSlide = useCallback(() => {
        setCurrentIndex((prev) => (prev + 1) % total);
    }, [total]);

    const prevSlide = useCallback(() => {
        setCurrentIndex((prev) => (prev - 1 + total) % total);
    }, [total]);

    const goToSlide = (idx: number) => {
        setCurrentIndex(idx % total);
    };

    useEffect(() => {
        if (!autoplay || isHovered || total <= 1) return;
        const interval = setInterval(nextSlide, autoplayDelay);
        return () => clearInterval(interval);
    }, [autoplay, autoplayDelay, isHovered, nextSlide, total]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowLeft") prevSlide();
            if (e.key === "ArrowRight") nextSlide();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [nextSlide, prevSlide]);

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        const diff = e.changedTouches[0].clientX - touchStartX.current;
        if (Math.abs(diff) > 45) {
            if (diff < 0) nextSlide();
            else prevSlide();
        }
    };

    if (!items || items.length === 0) return null;

    return (
        <section
            className={`relative w-full min-h-[560px] flex items-center justify-center overflow-hidden rounded-3xl border py-10 select-none ${className}`}
            style={{ backgroundColor: "var(--muted)" }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            <div className="relative w-full max-w-4xl mx-auto px-4 z-10 flex flex-col items-center">
                {/* Eyebrow */}
                {sectionLabel && (
                    <div className="flex items-center gap-3 mb-6">
                        <span style={{ width: "28px", height: "1px", background: "linear-gradient(90deg, transparent, var(--brand))" }} />
                        <h3
                            style={{
                                fontSize: "0.7rem",
                                fontWeight: 700,
                                letterSpacing: "0.25em",
                                textTransform: "uppercase",
                                color: "var(--brand)",
                                margin: 0,
                            }}
                        >
                            {sectionLabel}
                        </h3>
                        <span style={{ width: "28px", height: "1px", background: "linear-gradient(90deg, var(--brand), transparent)" }} />
                    </div>
                )}

                {/* 3D Coverflow Stage */}
                <div
                    className="relative w-full h-[420px] flex justify-center items-center mb-6"
                    style={{ perspective: "1200px" }}
                >
                    {items.map((item, idx) => {
                        const offset = (idx - currentIndex + total) % total;

                        let transform = "translateX(0px) scale(0.4) rotateY(0deg)";
                        let opacity = 0;
                        let zIndex = 0;
                        let isCenter = false;

                        if (offset === 0) {
                            isCenter = true;
                            transform = "translateX(0px) scale(1) rotateY(0deg)";
                            opacity = 1;
                            zIndex = 30;
                        } else if (offset === 1) {
                            transform = "translateX(230px) scale(0.82) rotateY(-22deg)";
                            opacity = 0.7;
                            zIndex = 20;
                        } else if (offset === 2) {
                            transform = "translateX(400px) scale(0.66) rotateY(-34deg)";
                            opacity = 0.4;
                            zIndex = 10;
                        } else if (offset === total - 1) {
                            transform = "translateX(-230px) scale(0.82) rotateY(22deg)";
                            opacity = 0.7;
                            zIndex = 20;
                        } else if (offset === total - 2) {
                            transform = "translateX(-400px) scale(0.66) rotateY(34deg)";
                            opacity = 0.4;
                            zIndex = 10;
                        }

                        return (
                            <div
                                key={idx}
                                onClick={() => !isCenter && goToSlide(idx)}
                                style={{
                                    position: "absolute",
                                    width: "270px",
                                    height: "390px",
                                    borderRadius: "16px",
                                    overflow: "hidden",
                                    backgroundColor: "var(--card)",
                                    border: "1px solid var(--border)",
                                    display: "flex",
                                    flexDirection: "column",
                                    transform,
                                    opacity,
                                    zIndex,
                                    transformOrigin: "center center",
                                    transition: "all 700ms cubic-bezier(0.25, 1, 0.5, 1)",
                                    boxShadow: isCenter
                                        ? "0 20px 40px -12px rgba(0,0,0,0.18), 0 0 0 1px var(--border)"
                                        : "0 8px 20px -8px rgba(0,0,0,0.12)",
                                    cursor: isCenter ? "default" : "pointer",
                                }}
                            >
                                {/* Imagen completa, sin recortar — panel claro detrás por si la
                                    imagen no llena el espacio (nunca object-fit: cover). */}
                                <div
                                    style={{
                                        flex: "1 1 auto",
                                        minHeight: 0,
                                        backgroundColor: "var(--muted)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        padding: "8px",
                                    }}
                                >
                                    <img
                                        src={item.img}
                                        alt={item.titleLine1}
                                        style={{
                                            maxWidth: "100%",
                                            maxHeight: "100%",
                                            width: "auto",
                                            height: "auto",
                                            objectFit: "contain",
                                            borderRadius: "4px",
                                        }}
                                    />
                                </div>

                                {/* Texto SIEMPRE debajo de la imagen, nunca superpuesto — fondo
                                    claro, así que el texto queda oscuro y siempre legible. */}
                                <div
                                    style={{
                                        flex: "0 0 auto",
                                        padding: "10px 12px 12px",
                                        textAlign: "center",
                                        opacity: isCenter ? 1 : 0.55,
                                        transition: "opacity 400ms ease",
                                    }}
                                >
                                    {item.tag && (
                                        <div
                                            style={{
                                                fontSize: "0.7rem",
                                                fontWeight: 600,
                                                letterSpacing: "0.05em",
                                                color: "var(--brand)",
                                                marginBottom: "3px",
                                            }}
                                        >
                                            {item.tag}
                                        </div>
                                    )}
                                    <div
                                        style={{
                                            fontSize: "1rem",
                                            fontWeight: 800,
                                            textTransform: "uppercase",
                                            letterSpacing: "0.02em",
                                            color: "var(--foreground)",
                                            lineHeight: 1.15,
                                        }}
                                    >
                                        {item.titleLine1}
                                    </div>
                                    {item.titleLine2 && (
                                        <div
                                            style={{
                                                fontSize: "0.78rem",
                                                fontWeight: 600,
                                                color: "var(--muted-foreground)",
                                                lineHeight: 1.3,
                                                marginTop: "2px",
                                            }}
                                        >
                                            {item.titleLine2}
                                        </div>
                                    )}
                                    {item.desc && (
                                        <p
                                            style={{
                                                fontSize: "0.78rem",
                                                color: "var(--muted-foreground)",
                                                marginTop: "4px",
                                                lineHeight: 1.3,
                                            }}
                                        >
                                            {item.desc}
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Navigation Arrows */}
                {total > 1 && (
                    <>
                        <button
                            onClick={prevSlide}
                            aria-label="Página anterior"
                            style={{
                                position: "absolute",
                                left: "4px",
                                top: "42%",
                                transform: "translateY(-50%)",
                                width: "36px",
                                height: "36px",
                                borderRadius: "50%",
                                backgroundColor: "var(--card)",
                                border: "1px solid var(--border)",
                                color: "var(--foreground)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                                zIndex: 40,
                            }}
                        >
                            <ChevronLeft size={17} strokeWidth={2.5} />
                        </button>

                        <button
                            onClick={nextSlide}
                            aria-label="Página siguiente"
                            style={{
                                position: "absolute",
                                right: "4px",
                                top: "42%",
                                transform: "translateY(-50%)",
                                width: "36px",
                                height: "36px",
                                borderRadius: "50%",
                                backgroundColor: "var(--card)",
                                border: "1px solid var(--border)",
                                color: "var(--foreground)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                                zIndex: 40,
                            }}
                        >
                            <ChevronRight size={17} strokeWidth={2.5} />
                        </button>
                    </>
                )}

                {/* Pagination Dots */}
                {total > 1 && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", zIndex: 30 }}>
                        {items.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => goToSlide(idx)}
                                aria-label={`Ir a la página ${idx + 1}`}
                                style={{
                                    height: "6px",
                                    width: idx === currentIndex ? "22px" : "6px",
                                    borderRadius: "9999px",
                                    backgroundColor: idx === currentIndex ? "var(--brand)" : "var(--border)",
                                    border: "none",
                                    cursor: "pointer",
                                    transition: "all 300ms ease",
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}

export default CoverFlowCarousel;
