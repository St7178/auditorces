import { lazy, Suspense, useEffect, useState } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import type { Application } from "@splinetool/runtime";

// Spline usa WebGL/canvas — no existe en el servidor. ClientOnly evita que SSR intente renderizarlo, y
// el import perezoso hace que el runtime de Spline (pesado) solo se descargue en el navegador, cuando
// esta tarjeta realmente se muestra, no como parte del bundle general de la app.
const Spline = lazy(() => import("@splinetool/react-spline"));

const SCENE_URL = "https://prod.spline.design/EfiehPHlTt3AM6G7/scene.splinecode";

export type AvatarEstado = "listening" | "thinking" | "talking";

function AvatarFallback() {
    return (
        <div className="flex h-full w-full items-center justify-center text-brand/40">
            <Sparkles className="h-6 w-6 animate-pulse" />
        </div>
    );
}

// Nombres de objeto conocidos para el watermark/fondo que Spline hornea DENTRO de la escena exportada
// (no hay una prop oficial para quitarlos vía SDK) — se buscan por nombre y se ocultan si existen. Si
// el nombre real del proyecto no calza con ninguno de estos, simplemente no se oculta nada, no rompe.
// El fondo específicamente puede no ser un objeto sino el color de fondo de la escena — eso solo se
// quita desde el editor de Spline (Project Settings → Background → Transparent), no por código.
const OBJETOS_A_OCULTAR = ["Built with Spline", "Watermark", "watermark", "Badge", "Background", "Fondo", "Background Color"];

export function CesAuditorAvatar({ estado, className }: { estado: AvatarEstado; className?: string }) {
    const [app, setApp] = useState<Application | null>(null);

    // Las variables booleanas isListening/isThinking/isTalking ya vienen definidas en la escena (las
    // usa su propia lógica de estados para decidir qué animación mostrar) — acá solo se actualizan
    // según lo que esté haciendo el chat en cada momento.
    useEffect(() => {
        if (!app) return;
        try {
            app.setVariable("isListening", estado === "listening");
            app.setVariable("isThinking", estado === "thinking");
            app.setVariable("isTalking", estado === "talking");
        } catch {
            // La escena podría no tener estas variables definidas — no debe romper el chat si falla.
        }
    }, [app, estado]);

    return (
        <ClientOnly fallback={<div className={className}><AvatarFallback /></div>}>
            <Suspense fallback={<div className={className}><AvatarFallback /></div>}>
                <Spline
                    scene={SCENE_URL}
                    className={className}
                    style={{ background: "transparent" }}
                    onLoad={(loadedApp) => {
                        // Log de diagnóstico: la API de Spline no permite listar los objetos de la escena,
                        // solo buscarlos por nombre exacto — así que si el watermark/fondo sigue apareciendo,
                        // esto dice en la consola cuáles de los nombres conocidos SÍ existen en esta escena
                        // en particular, para poder agregar el nombre real si no está en la lista.
                        const encontrados = OBJETOS_A_OCULTAR.filter((nombre) => {
                            const obj = loadedApp.findObjectByName(nombre);
                            if (!obj) return false;
                            obj.visible = false;
                            return true;
                        });
                        if (encontrados.length > 0) {
                            console.info("[CesAuditorAvatar] Objetos ocultados:", encontrados);
                        } else {
                            console.warn("[CesAuditorAvatar] Ningún objeto conocido de watermark/fondo se encontró en la escena. Revisa los nombres reales en el editor de Spline y agrégalos a OBJETOS_A_OCULTAR.");
                        }
                        setApp(loadedApp);
                    }}
                />
            </Suspense>
        </ClientOnly>
    );
}
