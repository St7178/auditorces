import { type ReactNode, useState } from "react";
import { Menu, Search } from "lucide-react";
import { AppNavOverlay } from "@/components/app-nav-overlay";
import { NotificationBell } from "@/components/notification-bell";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import type { AppSession } from "@/lib/auth/session";

function initials(name: string) {
    return name.split(" ").filter(Boolean).slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

export function AppShell({ user, children }: { user: AppSession; children: ReactNode }) {
    const [menuAbierto, setMenuAbierto] = useState(false);

    return (
        <div className="min-h-screen w-full bg-background">
            <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b bg-card/70 px-4 backdrop-blur-xl sm:px-6">
                <button
                    onClick={() => setMenuAbierto(true)}
                    aria-label="Abrir menú"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border hover:bg-accent"
                >
                    <Menu className="h-4 w-4" />
                </button>
                <img
                    src="https://gycqduihf0vkjbnu.public.blob.vercel-storage.com/logocnet.png"
                    alt="CES SIG"
                    className="h-8 w-8 shrink-0 object-contain"
                />
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
                    <NotificationBell />
                    <a
                        href="/api/auth/logout"
                        title="Cerrar sesión"
                        className="flex items-center gap-2 rounded-lg border bg-card px-2 py-1 hover:bg-accent"
                    >
                        <Avatar className="h-7 w-7">
                            <AvatarImage src="/api/me/photo" alt={user.name} className="object-cover" />
                            <AvatarFallback className="bg-primary/15 text-xs font-bold text-primary">{initials(user.name)}</AvatarFallback>
                        </Avatar>
                        <div className="hidden text-left leading-tight sm:block">
                            <div className="text-xs font-semibold">{user.name}</div>
                            <div className="text-[10px] text-muted-foreground">{user.jobTitle ?? user.email}</div>
                        </div>
                    </a>
                </div>
            </header>
            <main className="min-w-0">{children}</main>

            <AppNavOverlay open={menuAbierto} onClose={() => setMenuAbierto(false)} user={user} />
        </div>
    );
}
