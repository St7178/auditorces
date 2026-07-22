import type { ReactNode } from "react";
import { Search, Bell } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import type { AppSession } from "@/lib/auth/session";

function initials(name: string) {
    return name.split(" ").filter(Boolean).slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

export function AppShell({ user, children }: { user: AppSession; children: ReactNode }) {
    return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full bg-background">
                <AppSidebar user={user} />
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
                            <a
                                href="/api/auth/logout"
                                title="Cerrar sesión"
                                className="flex items-center gap-2 rounded-lg border bg-card px-2 py-1 hover:bg-accent"
                            >
                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                                    {initials(user.name)}
                                </div>
                                <div className="hidden text-left leading-tight sm:block">
                                    <div className="text-xs font-semibold">{user.name}</div>
                                    <div className="text-[10px] text-muted-foreground">{user.jobTitle ?? user.email}</div>
                                </div>
                            </a>
                        </div>
                    </header>
                    <main className="flex-1 min-w-0">{children}</main>
                </div>
            </div>
        </SidebarProvider>
    );
}
