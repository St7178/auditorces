import { useEffect, useRef, useState } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import type { Application as SplineApplication } from "@splinetool/runtime";

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
// (no hay una prop oficial para quitarlos vía SDK) — se buscan por nombre y se ocultan si existen. El
// fondo específicamente puede no ser un objeto sino el color de fondo de la escena — eso solo se
// quita desde el editor de Spline (Project Settings → Background → Transparent), no por código.
const OBJETOS_A_OCULTAR = ["Built with Spline", "Watermark", "watermark", "Badge", "Background", "Fondo", "Background Color"];

function SplineCanvas({ estado, className }: { estado: AvatarEstado; className?: string }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const appRef = useRef<SplineApplication | null>(null);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        let disposed = false;
        let app: SplineApplication | null = null;

        (async () => {
            const { Application } = await import("@splinetool/runtime");
            if (disposed || !canvasRef.current) return;

            // El runtime auto-selecciona WebGPU cuando el navegador lo soporta, pero en Windows/Chrome
            // esa vía tiene un bug conocido: el tiempo por frame crece sin parar (ver consola:
            // "requestAnimationFrame handler took Nms y sigue subiendo") hasta colgar la escena sin
            // lanzar ningún error — nunca llega a disparar onLoad. Se fuerza "webgl", el pipeline
            // clásico y estable, para evitar esa vía por completo.
            app = new Application(canvasRef.current, { renderer: "webgl" });
            appRef.current = app;

            await app.load(SCENE_URL);
            if (disposed) return;

            // Diagnóstico: la única forma de saber los nombres reales de los objetos de esta escena en
            // particular es listarlos, ya que findObjectByName exige el nombre exacto.
            console.info("[CesAuditorAvatar] Objetos en la escena:", app.getAllObjects().map((o) => o.name));

            for (const nombre of OBJETOS_A_OCULTAR) {
                const obj = app.findObjectByName(nombre);
                if (obj) obj.visible = false;
            }

            setReady(true);
        })().catch((err) => {
            console.error("[CesAuditorAvatar] Error cargando la escena de Spline:", err);
        });

        return () => {
            disposed = true;
            app?.dispose();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Las variables booleanas isListening/isThinking/isTalking ya vienen definidas en la escena (las
    // usa su propia lógica de estados para decidir qué animación mostrar) — acá solo se actualizan
    // según lo que esté haciendo el chat en cada momento.
    useEffect(() => {
        const app = appRef.current;
        if (!app || !ready) return;
        try {
            app.setVariable("isListening", estado === "listening");
            app.setVariable("isThinking", estado === "thinking");
            app.setVariable("isTalking", estado === "talking");
        } catch {
            // La escena podría no tener estas variables definidas — no debe romper el chat si falla.
        }
    }, [estado, ready]);

    return (
        <div className={className}>
            <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block", background: "transparent" }} />
            {!ready && (
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
            <SplineCanvas estado={estado} className={className} />
        </ClientOnly>
    );
}
