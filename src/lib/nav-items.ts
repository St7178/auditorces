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
    MessagesSquare,
    Settings,
    Landmark,
    type LucideIcon,
} from "lucide-react";

export type NavItem = {
    title: string;
    url: string;
    icon: LucideIcon;
    highlight?: boolean;
    iconClassName?: string;
    children?: { title: string; url: string }[];
};

export const NAV: { section: string; items: NavItem[] }[] = [
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
                children: [
                    { title: "Vulnerabilidades CES", url: "/procesos/vulnerabilidades" },
                    { title: "Revisión Documental", url: "/procesos/revision" },
                ],
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
            { title: "Wiki CES", url: "/chat", icon: MessagesSquare, iconClassName: "text-sidebar-primary" },
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
