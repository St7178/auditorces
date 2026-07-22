import { Link, useRouterState } from "@tanstack/react-router";
import {
    LayoutDashboard,
    Users,
    Sparkles,
    Workflow,
    ShieldAlert,
    Gauge,
    Building2,
    Truck,
    FileText,
    BookOpen,
    Calendar,
    MessagesSquare,
    Settings,
} from "lucide-react";
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarFooter,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";

const nav = [
    {
        section: "Principal", items: [
            { title: "Dashboard", url: "/", icon: LayoutDashboard },
            { title: "CES AUDITOR", url: "/guardian", icon: Sparkles, highlight: true },
        ]
    },
    {
        section: "Gestión CES", items: [
            { title: "Equipo CES", url: "/equipo", icon: Users },
            { title: "Procesos CES", url: "/procesos", icon: Workflow },
            { title: "Riesgos CES", url: "/riesgos", icon: ShieldAlert },
            { title: "Indicadores CES", url: "/indicadores", icon: Gauge },
        ]
    },
    {
        section: "Relacionamiento", items: [
            { title: "Clientes CES", url: "/clientes", icon: Building2 },
            { title: "Proveedores CES", url: "/proveedores", icon: Truck },
            { title: "Contratos CES", url: "/contratos", icon: FileText },
        ]
    },
    {
        section: "Conocimiento", items: [
            { title: "Documentación", url: "/documentacion", icon: BookOpen },
            { title: "Cronograma", url: "/cronograma", icon: Calendar },
            { title: "Chat del Equipo", url: "/chat", icon: MessagesSquare },
        ]
    },
    {
        section: "Sistema", items: [
            { title: "Configuración", url: "/configuracion", icon: Settings },
        ]
    },
];

export function AppSidebar() {
    const currentPath = useRouterState({ select: (r) => r.location.pathname });

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader className="border-b border-sidebar-border">
                <div className="flex items-center gap-3 px-2 py-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-black/20">
                        <Sparkles className="h-5 w-5" />
                    </div>
                    <div className="flex min-w-0 flex-col leading-tight group-data-[collapsible=icon]:hidden">
                        <span className="truncate text-sm font-bold text-sidebar-foreground">CES SIG</span>
                        <span className="truncate text-[11px] text-sidebar-foreground/60">Compunet · CES</span>
                    </div>
                </div>
            </SidebarHeader>
            <SidebarContent>
                {nav.map((group) => (
                    <SidebarGroup key={group.section}>
                        <SidebarGroupLabel className="text-[10px] uppercase tracking-wider text-sidebar-foreground/50">
                            {group.section}
                        </SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {group.items.map((item) => {
                                    const active = currentPath === item.url;
                                    return (
                                        <SidebarMenuItem key={item.title}>
                                            <SidebarMenuButton
                                                asChild
                                                isActive={active}
                                                className={item.highlight ? "font-semibold" : ""}
                                            >
                                                <Link to={item.url}>
                                                    <item.icon className={item.highlight ? "text-sidebar-primary" : ""} />
                                                    <span>{item.title}</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    );
                                })}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                ))}
            </SidebarContent>
            <SidebarFooter className="border-t border-sidebar-border">
                <div className="flex items-center gap-2 px-2 py-2 group-data-[collapsible=icon]:hidden">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-primary/20 text-xs font-semibold text-sidebar-primary">
                        LJ
                    </div>
                    <div className="flex min-w-0 flex-col leading-tight">
                        <span className="truncate text-xs font-medium text-sidebar-foreground">Laura Jaramillo</span>
                        <span className="truncate text-[10px] text-sidebar-foreground/60">Coord. Calidad CES</span>
                    </div>
                </div>
            </SidebarFooter>
        </Sidebar>
    );
}
