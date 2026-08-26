import { Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronRight } from "lucide-react";
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarFooter,
    SidebarMenu,
    SidebarMenuAction,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { NAV } from "@/lib/nav-items";

// El logo y el botón de menú viven en el header de AppShell, no acá — este panel es puramente el
// contenido del menú. En desktop es permanente (siempre visible, reserva su propio espacio — ver
// el ajuste en ui/sidebar.tsx); en mobile sigue siendo un Sheet que se abre con el botón hamburguesa.
export function AppSidebar({ user }: { user: { name: string; jobTitle?: string | null } }) {
    const currentPath = useRouterState({ select: (r) => r.location.pathname });
    const { isMobile, setOpenMobile } = useSidebar();
    // En mobile, navegar debe cerrar el Sheet; en desktop no hay nada que cerrar (es permanente).
    const cerrarSiEsMobile = () => {
        if (isMobile) setOpenMobile(false);
    };
    const userInitials = user.name.split(" ").filter(Boolean).slice(0, 2).map((n) => n[0]).join("").toUpperCase();
    // Ítems expandidos manualmente por el usuario — si el hijo activo cambia, igual se muestra
    // desplegado aunque no esté en este set (ver `abierto` más abajo).
    const [expandidos, setExpandidos] = useState<Set<string>>(new Set());
    const toggleExpandido = (title: string) =>
        setExpandidos((prev) => {
            const next = new Set(prev);
            if (next.has(title)) next.delete(title);
            else next.add(title);
            return next;
        });

    return (
        <Sidebar collapsible="offcanvas">
            <SidebarContent>
                {NAV.map((group) => (
                    <SidebarGroup key={group.section}>
                        <SidebarGroupLabel className="text-[10px] uppercase tracking-wider text-sidebar-foreground/50">
                            {group.section}
                        </SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {group.items.map((item) => {
                                    const active = currentPath === item.url;
                                    const hijoActivo = item.children?.some((c) => c.url === currentPath) ?? false;
                                    const abierto = expandidos.has(item.title) || hijoActivo;
                                    return (
                                        <SidebarMenuItem key={item.title}>
                                            <SidebarMenuButton
                                                asChild
                                                isActive={active}
                                                className={item.highlight ? "font-semibold" : ""}
                                            >
                                                <Link to={item.url} onClick={cerrarSiEsMobile}>
                                                    <item.icon className={item.highlight ? "text-sidebar-primary" : item.iconClassName ?? ""} />
                                                    <span>{item.title}</span>
                                                </Link>
                                            </SidebarMenuButton>
                                            {item.children && (
                                                <>
                                                    <SidebarMenuAction onClick={() => toggleExpandido(item.title)} title={abierto ? "Contraer" : "Expandir"}>
                                                        <ChevronRight className={`transition-transform ${abierto ? "rotate-90" : ""}`} />
                                                    </SidebarMenuAction>
                                                    {abierto && (
                                                        <SidebarMenuSub>
                                                            {item.children.map((c) => (
                                                                <SidebarMenuSubItem key={c.url}>
                                                                    <SidebarMenuSubButton asChild isActive={currentPath === c.url}>
                                                                        <Link to={c.url} onClick={cerrarSiEsMobile}>{c.title}</Link>
                                                                    </SidebarMenuSubButton>
                                                                </SidebarMenuSubItem>
                                                            ))}
                                                        </SidebarMenuSub>
                                                    )}
                                                </>
                                            )}
                                        </SidebarMenuItem>
                                    );
                                })}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                ))}
            </SidebarContent>
            <SidebarFooter className="border-t border-sidebar-border">
                <div className="flex items-center gap-2 px-2 py-2">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src="/api/me/photo" alt={user.name} className="object-cover" />
                        <AvatarFallback className="bg-sidebar-primary/20 text-xs font-semibold text-sidebar-primary">{userInitials}</AvatarFallback>
                    </Avatar>
                    <div className="flex min-w-0 flex-col leading-tight">
                        <span className="truncate text-xs font-medium text-sidebar-foreground">{user.name}</span>
                        <span className="truncate text-[10px] text-sidebar-foreground/60">{user.jobTitle ?? ""}</span>
                    </div>
                </div>
            </SidebarFooter>
        </Sidebar>
    );
}
