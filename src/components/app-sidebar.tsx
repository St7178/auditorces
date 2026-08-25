import { Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import {
    LayoutDashboard,
    Users,
    Sparkles,
    Workflow,
    ShieldAlert,
    Gauge,
    Building2,
    Truck,
    Calendar,
    FileText,
    Settings,
    ChevronRight,
    Landmark,
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
    SidebarMenuAction,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

type NavItem = {
    title: string;
    url: string;
    icon: typeof LayoutDashboard;
    highlight?: boolean;
    children?: { title: string; url: string }[];
};

const nav: { section: string; items: NavItem[] }[] = [
    {
        section: "🏠 Inicio", items: [
            { title: "Dashboard", url: "/", icon: LayoutDashboard },
            {
                title: "CES AUDITOR", url: "/guardian", icon: Sparkles, highlight: true,
                children: [{ title: "Hallazgos de Auditoría", url: "/guardian/hallazgos" }],
            },
        ]
    },
    {
        section: "👥 Gestión CES", items: [
            { title: "Equipo CES", url: "/equipo", icon: Users },
            {
                title: "Procesos CES", url: "/procesos", icon: Workflow,
                children: [{ title: "Vulnerabilidades CES", url: "/procesos/vulnerabilidades" }],
            },
            { title: "Riesgos CES", url: "/riesgos", icon: ShieldAlert },
            { title: "Indicadores CES", url: "/indicadores", icon: Gauge },
            {
                title: "Clientes CES", url: "/clientes", icon: Building2,
                children: [{ title: "Documentación", url: "/clientes/documentacion" }],
            },
            { title: "Proveedores CES", url: "/proveedores", icon: Truck },
        ]
    },
    {
        section: "📚 Conocimiento", items: [
            { title: "Wiki CES", url: "/chat", icon: Sparkles },
            { title: "Normas CES", url: "/normas", icon: FileText },
            {
                title: "Cultura SIG", url: "/cultura", icon: Landmark,
                children: [
                    { title: "📜 Políticas", url: "/cultura/politicas" },
                    { title: "🎯 Objetivos", url: "/cultura/objetivos" },
                    { title: "📖 Conceptos", url: "/cultura/conceptos" },
                ],
            },
            { title: "Agenda SIG", url: "/cronograma", icon: Calendar },
        ]
    },
    {
        section: "⚙️ Sistema", items: [
            { title: "Configuración", url: "/configuracion", icon: Settings },
        ]
    },
];

export function AppSidebar({ user }: { user: { name: string; jobTitle?: string | null } }) {
    const currentPath = useRouterState({ select: (r) => r.location.pathname });
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
        <Sidebar collapsible="icon">
            <SidebarHeader className="border-b border-sidebar-border">
                <div className="flex items-center gap-3 px-2 py-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                        <img
                            src="https://gycqduihf0vkjbnu.public.blob.vercel-storage.com/logocnet.png"
                            alt="CES SIG Logo"
                            className="h-10 w-10 object-contain"
                        />
                    </div>
                    <div className="flex min-w-0 flex-col leading-tight group-data-[collapsible=icon]:hidden">
                        <span className="truncate text-sm font-bold text-sidebar-foreground">CES SIG</span>
                        <span className="truncate text-[11px] text-sidebar-foreground/60">Compunet · Sistema IG</span>
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
                                    const hijoActivo = item.children?.some((c) => c.url === currentPath) ?? false;
                                    const abierto = expandidos.has(item.title) || hijoActivo;
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
                                                                        <Link to={c.url}>{c.title}</Link>
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
                <div className="flex items-center gap-2 px-2 py-2 group-data-[collapsible=icon]:hidden">
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
