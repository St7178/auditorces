import { lazy, Suspense, useEffect } from "react";
import { X } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { NAV } from "@/lib/nav-items";
import type { AppSession } from "@/lib/auth/session";

// Import perezoso: "motion" solo se descarga cuando alguien realmente abre el menú, en vez de
// entrar al bundle principal de cada página del portal.
const InteractiveHoverLinks = lazy(() =>
    import("@/components/ui/interactive-hover-links").then((m) => ({ default: m.InteractiveHoverLinks })),
);

// Los sub-ítems (children) viven dentro de su propia página (ej. "Hallazgos de Auditoría" ya
// tiene un enlace en /guardian) — este menú de pantalla completa solo muestra el nivel principal,
// para no repetir la jerarquía de dos niveles del sidebar anterior.

function initials(name: string) {
    return name.split(" ").filter(Boolean).slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

export function AppNavOverlay({
    open, onClose, user,
}: {
    open: boolean;
    onClose: () => void;
    user: AppSession;
}) {
    // Sin scroll de fondo mientras el menú está abierto, y Escape lo cierra — comportamiento
    // esperado de un overlay de pantalla completa.
    useEffect(() => {
        if (!open) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", onKeyDown);
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onKeyDown);
            document.body.style.overflow = previousOverflow;
        };
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-background">
            <div className="flex items-center justify-between border-b px-4 py-3 sm:px-6">
                <div className="flex items-center gap-3">
                    <img
                        src="https://gycqduihf0vkjbnu.public.blob.vercel-storage.com/logocnet.png"
                        alt="CES SIG"
                        className="h-9 w-9 object-contain"
                    />
                    <div className="flex flex-col leading-tight">
                        <span className="text-sm font-bold">CES SIG</span>
                        <span className="text-[11px] text-muted-foreground">Compunet · Sistema IG</span>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    aria-label="Cerrar menú"
                    className="flex h-9 w-9 items-center justify-center rounded-lg border hover:bg-accent"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
                <Suspense fallback={null}>
                    <InteractiveHoverLinks groups={NAV} onNavigate={onClose} />
                </Suspense>
            </div>

            <div className="flex items-center gap-2 border-t px-4 py-3 sm:px-6">
                <Avatar className="h-8 w-8">
                    <AvatarImage src="/api/me/photo" alt={user.name} className="object-cover" />
                    <AvatarFallback className="bg-brand-soft text-xs font-semibold text-brand">{initials(user.name)}</AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-col leading-tight">
                    <span className="truncate text-xs font-medium">{user.name}</span>
                    <span className="truncate text-[10px] text-muted-foreground">{user.jobTitle ?? user.email}</span>
                </div>
            </div>
        </div>
    );
}
