import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Bell, Palette, Shield, LogOut } from "lucide-react";
import { Route as AuthenticatedRoute } from "@/routes/_authenticated";
import { getNotifPrefs, setNotifPref, type NotifTipo } from "@/lib/notification-prefs";

export const Route = createFileRoute("/_authenticated/configuracion")({
    component: ConfigPage,
    head: () => ({ meta: [{ title: "Configuración — CES SIG" }] }),
});

const NOTIF_ROWS: { tipo: NotifTipo; label: string; desc: string }[] = [
    { tipo: "contrato", label: "Contratos", desc: "Contratos próximos a vencer" },
    { tipo: "riesgo", label: "Riesgos", desc: "Riesgos residuales Altos o Críticos" },
    { tipo: "documento", label: "Documentos", desc: "Documentos que requieren revisión" },
    { tipo: "hallazgo", label: "Hallazgos", desc: "Hallazgos de auditoría abiertos (CES AUDITOR)" },
    { tipo: "insight", label: "Detección automática", desc: "El sistema detecta patrones por su cuenta (matriz sin actualizar, proveedores sin evaluar, indicadores a la baja, etc.)" },
];

function initials(name: string) {
    return name.split(" ").filter(Boolean).slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

function ConfigPage() {
    const { user } = AuthenticatedRoute.useRouteContext();
    const [prefs, setPrefs] = useState(getNotifPrefs());

    // getNotifPrefs() lee localStorage, que no existe en el render de servidor — se sincroniza
    // en el cliente tras montar para evitar un mismatch de hidratación.
    useEffect(() => setPrefs(getNotifPrefs()), []);

    return (
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
            <PageHeader eyebrow="Sistema" title="Configuración" description="Preferencias del portal CES SIG." />
            <div className="mt-8 space-y-4">
                <Card className="border-border/60">
                    <CardContent className="flex items-center gap-4 p-5">
                        <Avatar className="h-11 w-11 rounded-xl">
                            <AvatarImage src="/api/me/photo" alt={user?.name ?? "Perfil"} className="object-cover" />
                            <AvatarFallback className="rounded-xl bg-brand-soft text-sm font-bold text-brand">{user ? initials(user.name) : "?"}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold">{user?.name ?? "Perfil"}</div>
                            <div className="text-xs text-muted-foreground">{user?.jobTitle ?? user?.email}</div>
                            {user?.jobTitle && <div className="text-[11px] text-muted-foreground">{user.email}</div>}
                        </div>
                        <a href="/api/auth/logout" className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-accent">
                            <LogOut className="h-3.5 w-3.5" /> Cerrar sesión
                        </a>
                    </CardContent>
                </Card>

                <Card className="border-border/60">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-4">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft text-brand">
                                <Bell className="h-5 w-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="text-sm font-semibold">Notificaciones</div>
                                <div className="text-xs text-muted-foreground">Qué tipos de alerta aparecen en la campana</div>
                            </div>
                        </div>
                        <div className="mt-4 space-y-3 border-t pt-4">
                            {NOTIF_ROWS.map((row) => (
                                <div key={row.tipo} className="flex items-center gap-4">
                                    <div className="min-w-0 flex-1">
                                        <div className="text-xs font-medium">{row.label}</div>
                                        <div className="text-[11px] text-muted-foreground">{row.desc}</div>
                                    </div>
                                    <Switch
                                        checked={prefs[row.tipo]}
                                        onCheckedChange={(checked) => {
                                            setNotifPref(row.tipo, checked);
                                            setPrefs((p) => ({ ...p, [row.tipo]: checked }));
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-border/60">
                    <CardContent className="flex items-center gap-4 p-5">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft text-brand">
                            <Palette className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold">Apariencia</div>
                            <div className="text-xs text-muted-foreground">Modo claro Compunet · Verde corporativo (aún no configurable)</div>
                        </div>
                        <Switch checked disabled />
                    </CardContent>
                </Card>

                <Card className="border-border/60">
                    <CardContent className="flex items-center gap-4 p-5">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft text-brand">
                            <Shield className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold">Seguridad</div>
                            <div className="text-xs text-muted-foreground">Autenticación con Microsoft Entra ID (SSO Compunet) · Sesión de 8 horas</div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
