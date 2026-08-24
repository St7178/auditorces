import { lazy, Suspense } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

// Spline usa WebGL/canvas — no existe en el servidor. ClientOnly evita que SSR intente renderizarlo, y
// el import perezoso hace que el runtime de Spline (pesado) solo se descargue en el navegador, cuando
// esta tarjeta realmente se muestra, no como parte del bundle general de la app.
const Spline = lazy(() => import("@splinetool/react-spline"));

const SCENE_URL = "https://prod.spline.design/EfiehPHlTt3AM6G7/scene.splinecode";

function AvatarFallback() {
    return (
        <div className="flex h-full w-full items-center justify-center text-brand/40">
            <Sparkles className="h-10 w-10 animate-pulse" />
        </div>
    );
}

export function CesAuditorAvatar({ className }: { className?: string }) {
    return (
        <div className={className}>
            <ClientOnly fallback={<AvatarFallback />}>
                <Suspense fallback={<AvatarFallback />}>
                    <Spline scene={SCENE_URL} />
                </Suspense>
            </ClientOnly>
        </div>
    );
}
