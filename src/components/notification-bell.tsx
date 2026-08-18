import { useEffect, useState } from "react";
import { Bell, AlertTriangle, FileText, ShieldAlert, ClipboardList, Lightbulb } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import type { Notificacion } from "@/routes/api/notificaciones";
import { getNotifPrefs, PREFS_CHANGED_EVENT, getReadNotifIds, markNotifRead, READ_CHANGED_EVENT } from "@/lib/notification-prefs";

const TIPO_ICON: Record<Notificacion["tipo"], typeof Bell> = {
    contrato: FileText,
    riesgo: ShieldAlert,
    documento: FileText,
    hallazgo: ClipboardList,
    insight: Lightbulb,
};

const NIVEL_DOT: Record<Notificacion["nivel"], string> = {
    alta: "bg-red-500",
    media: "bg-amber-500",
    baja: "bg-muted-foreground/40",
};

export function NotificationBell() {
    const [notifs, setNotifs] = useState<Notificacion[]>([]);
    const [prefs, setPrefs] = useState(getNotifPrefs());
    const [readIds, setReadIds] = useState(getReadNotifIds());

    useEffect(() => {
        let mounted = true;
        fetch("/api/notificaciones")
            .then((r) => (r.ok ? r.json() : Promise.reject(r.statusText)))
            .then((data) => mounted && setNotifs(data))
            .catch(() => {
                /* sin notificaciones si falla */
            });
        const onPrefsChanged = () => setPrefs(getNotifPrefs());
        const onReadChanged = () => setReadIds(getReadNotifIds());
        window.addEventListener(PREFS_CHANGED_EVENT, onPrefsChanged);
        window.addEventListener(READ_CHANGED_EVENT, onReadChanged);
        return () => {
            mounted = false;
            window.removeEventListener(PREFS_CHANGED_EVENT, onPrefsChanged);
            window.removeEventListener(READ_CHANGED_EVENT, onReadChanged);
        };
    }, []);

    const visibles = notifs.filter((n) => prefs[n.tipo]);
    const sinLeer = visibles.filter((n) => !readIds.has(n.id)).length;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="relative flex h-9 w-9 items-center justify-center rounded-lg border bg-card hover:bg-accent">
                    <Bell className="h-4 w-4" />
                    {sinLeer > 0 && (
                        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-white">
                            {sinLeer > 9 ? "9+" : sinLeer}
                        </span>
                    )}
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notificaciones</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {visibles.length === 0 ? (
                    <div className="px-2 py-4 text-center text-xs text-muted-foreground">Sin novedades por ahora.</div>
                ) : (
                    visibles.slice(0, 8).map((n) => {
                        const Icon = TIPO_ICON[n.tipo] ?? AlertTriangle;
                        const leida = readIds.has(n.id);
                        return (
                            <DropdownMenuItem key={n.id} asChild>
                                <a href={n.href} onClick={() => markNotifRead(n.id)} className={`flex items-start gap-2 py-2 ${leida ? "opacity-60" : ""}`}>
                                    <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${leida ? "bg-muted-foreground/30" : NIVEL_DOT[n.nivel]}`} />
                                    <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                    <span className="min-w-0">
                                        <span className="block truncate text-xs font-medium">{n.titulo}</span>
                                        <span className="block truncate text-[11px] text-muted-foreground">{n.detalle}</span>
                                    </span>
                                </a>
                            </DropdownMenuItem>
                        );
                    })
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
