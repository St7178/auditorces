import { useEffect, useRef, useState } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

// Embed oficial de Spline (web component servido desde su CDN) en vez del paquete @splinetool/runtime
// npm: así el motor 3D nunca entra a nuestro bundle ni corre bajo nuestro control manual — lo maneja
// el propio visor de Spline, que ya trae su fallback (imagen estática) mientras carga. La vía anterior
// (Application a mano) se colgaba en Windows/Chrome sin lanzar ningún error; si esta también fallara,
// el timeout de abajo garantiza que como mucho se vea el ícono estático, nunca una página pegada.
const VIEWER_SCRIPT_SRC = "https://cdn.spline.design/@splinetool/viewer@2.0.5/build/spline-viewer.js";
const SCENE_URL = "https://prod.spline.design/EfiehPHlTt3AM6G7/scene.splinecode";
const CARGA_TIMEOUT_MS = 7000;

export type AvatarEstado = "listening" | "thinking" | "talking";

function AvatarFallback() {
    return (
        <div className="flex h-full w-full items-center justify-center text-brand/60">
            <Sparkles className="h-6 w-6 animate-pulse" />
        </div>
    );
}

function cargarScriptViewer(): Promise<void> {
    if (customElements.get("spline-viewer")) return Promise.resolve();
    const existente = document.querySelector<HTMLScriptElement>(`script[src="${VIEWER_SCRIPT_SRC}"]`);
    if (existente) {
        return new Promise((resolve, reject) => {
            existente.addEventListener("load", () => resolve(), { once: true });
            existente.addEventListener("error", () => reject(new Error("No se pudo cargar spline-viewer.js")), { once: true });
        });
    }
    return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.type = "module";
        script.src = VIEWER_SCRIPT_SRC;
        script.async = true;
        script.addEventListener("load", () => resolve(), { once: true });
        script.addEventListener("error", () => reject(new Error("No se pudo cargar spline-viewer.js")), { once: true });
        document.head.appendChild(script);
    });
}

function SplineAvatar({ estado, className }: { estado: AvatarEstado; className?: string }) {
    const hostRef = useRef<HTMLDivElement>(null);
    // any: es un custom element sin tipos oficiales — su API (setVariable, evento "load") viene de
    // @splinetool/runtime por debajo, igual que la que ya usábamos antes de quitar esa integración.
    const viewerElRef = useRef<any>(null);
    const [estadoCarga, setEstadoCarga] = useState<"cargando" | "listo" | "fallo">("cargando");

    useEffect(() => {
        let cancelado = false;
        let timeoutId: ReturnType<typeof setTimeout> | undefined;

        cargarScriptViewer()
            .then(() => {
                if (cancelado || !hostRef.current) return;
                const el = document.createElement("spline-viewer");
                el.setAttribute("url", SCENE_URL);
                el.style.width = "100%";
                el.style.height = "100%";
                el.style.display = "block";
                el.addEventListener("load", () => {
                    if (cancelado) return;
                    clearTimeout(timeoutId);
                    setEstadoCarga("listo");
                });
                viewerElRef.current = el;
                hostRef.current.appendChild(el);

                // Si en 7s no disparó "load", se asume colgado (fue justo lo que pasó con la vía
                // anterior) y se cae al ícono estático — nunca se deja al usuario esperando un
                // personaje que quizás nunca llegue.
                timeoutId = setTimeout(() => {
                    if (!cancelado) setEstadoCarga((actual) => (actual === "cargando" ? "fallo" : actual));
                }, CARGA_TIMEOUT_MS);
            })
            .catch(() => {
                if (!cancelado) setEstadoCarga("fallo");
            });

        return () => {
            cancelado = true;
            clearTimeout(timeoutId);
            viewerElRef.current?.remove();
            viewerElRef.current = null;
        };
    }, []);

    // Las variables booleanas isListening/isThinking/isTalking ya vienen definidas en la escena (las
    // usa su propia lógica de estados para decidir qué animación mostrar) — acá solo se actualizan
    // según lo que esté haciendo el chat en cada momento.
    useEffect(() => {
        const el = viewerElRef.current;
        if (!el || estadoCarga !== "listo") return;
        try {
            el.setVariable?.("isListening", estado === "listening");
            el.setVariable?.("isThinking", estado === "thinking");
            el.setVariable?.("isTalking", estado === "talking");
        } catch {
            // La escena podría no tener estas variables definidas — no debe romper el chat si falla.
        }
    }, [estado, estadoCarga]);

    return (
        <div className={className}>
            <div ref={hostRef} className="h-full w-full" />
            {estadoCarga !== "listo" && (
                <div className="absolute inset-0">
                    <AvatarFallback />
                </div>
            )}
        </div>
    );
}

export function CesAuditorAvatar({ estado, className }: { estado: AvatarEstado; className?: string }) {
    return (
        <ClientOnly fallback={<div className={className}><AvatarFallback /></div>}>
            <SplineAvatar estado={estado} className={className} />
        </ClientOnly>
    );
}
