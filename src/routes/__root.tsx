import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
    Outlet,
    Link,
    createRootRouteWithContext,
    useRouter,
    HeadContent,
    Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Search, Bell } from "lucide-react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
            <div className="max-w-md text-center">
                <h1 className="text-7xl font-bold text-foreground">404</h1>
                <h2 className="mt-4 text-xl font-semibold">Página no encontrada</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                    La ruta solicitada no existe en CES HUB.
                </p>
                <div className="mt-6">
                    <Link to="/" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                        Ir al Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
    console.error(error);
    const router = useRouter();
    useEffect(() => {
        reportLovableError(error, { boundary: "tanstack_root_error_component" });
    }, [error]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
            <div className="max-w-md text-center">
                <h1 className="text-xl font-semibold">Ocurrió un error</h1>
                <p className="mt-2 text-sm text-muted-foreground">Intenta recargar la vista.</p>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                    <button
                        onClick={() => { router.invalidate(); reset(); }}
                        className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                    >
                        Reintentar
                    </button>
                    <a href="/" className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent">
                        Dashboard
                    </a>
                </div>
            </div>
        </div>
    );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
    head: () => ({
        meta: [
            { charSet: "utf-8" },
            { name: "viewport", content: "width=device-width, initial-scale=1" },
            { title: "CES HUB — Portal Inteligente de Gestión · Compunet" },
            { name: "description", content: "CES HUB centraliza la operación, el conocimiento y la mejora continua del área Cloud Enterprise Services de Compunet." },
            { name: "author", content: "Compunet · CES" },
            { property: "og:title", content: "CES HUB — Portal Inteligente de Gestión" },
            { property: "og:description", content: "Plataforma empresarial para gestión, auditoría y mejora continua del área CES." },
            { property: "og:type", content: "website" },
            { name: "twitter:card", content: "summary_large_image" },
        ],
        links: [
            { rel: "stylesheet", href: appCss },
            { rel: "preconnect", href: "https://fonts.googleapis.com" },
            { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
            { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" },
            { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
        ],
    }),
    shellComponent: RootShell,
    component: RootComponent,
    notFoundComponent: NotFoundComponent,
    errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
    return (
        <html lang="es">
            <head><HeadContent /></head>
            <body>{children}<Scripts /></body>
        </html>
    );
}

function RootComponent() {
    const { queryClient } = Route.useRouteContext();
    return (
        <QueryClientProvider client={queryClient}>
            <SidebarProvider>
                <div className="flex min-h-screen w-full bg-background">
                    <AppSidebar />
                    <div className="flex flex-1 flex-col min-w-0">
                        <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b bg-card/70 px-4 backdrop-blur-xl sm:px-6">
                            <SidebarTrigger />
                            <div className="hidden sm:flex min-w-0 flex-1 items-center gap-3">
                                <div className="relative w-full max-w-md">
                                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <input
                                        placeholder="Buscar procesos, clientes, riesgos…"
                                        className="h-9 w-full rounded-lg border bg-muted/40 pl-9 pr-3 text-sm outline-none transition focus:border-primary/50 focus:bg-background"
                                    />
                                </div>
                            </div>
                            <div className="ml-auto flex items-center gap-2">
                                <button className="relative flex h-9 w-9 items-center justify-center rounded-lg border bg-card hover:bg-accent">
                                    <Bell className="h-4 w-4" />
                                    <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-primary" />
                                </button>
                                <div className="flex items-center gap-2 rounded-lg border bg-card px-2 py-1">
                                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">LJ</div>
                                    <div className="hidden text-left leading-tight sm:block">
                                        <div className="text-xs font-semibold">Laura Jaramillo</div>
                                        <div className="text-[10px] text-muted-foreground">Calidad CES</div>
                                    </div>
                                </div>
                            </div>
                        </header>
                        <main className="flex-1 min-w-0"><Outlet /></main>
                    </div>
                </div>
                <Toaster richColors position="top-right" />
            </SidebarProvider>
        </QueryClientProvider>
    );
}
