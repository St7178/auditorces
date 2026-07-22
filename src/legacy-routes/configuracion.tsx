import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { Switch } from "@/components/ui/switch";
import { Bell, Palette, Shield, User } from "lucide-react";

export const Route = createFileRoute("/configuracion")({
    component: ConfigPage,
    head: () => ({ meta: [{ title: "Configuración — CES SIG" }] }),
});

const secciones = [
    { icon: User, titulo: "Perfil", desc: "Datos de Laura Jaramillo · Coord. Calidad CES" },
    { icon: Bell, titulo: "Notificaciones", desc: "Alertas de riesgos, contratos e indicadores" },
    { icon: Palette, titulo: "Apariencia", desc: "Modo claro Compunet · Verde corporativo" },
    { icon: Shield, titulo: "Seguridad", desc: "Autenticación corporativa Compunet SSO" },
];

function ConfigPage() {
    return (
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
            <PageHeader eyebrow="Sistema" title="Configuración" description="Preferencias del portal CES SIG." />
            <div className="mt-8 space-y-4">
                {secciones.map((s) => (
                    <Card key={s.titulo} className="border-border/60">
                        <CardContent className="flex items-center gap-4 p-5">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft text-brand">
                                <s.icon className="h-5 w-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="text-sm font-semibold">{s.titulo}</div>
                                <div className="text-xs text-muted-foreground">{s.desc}</div>
                            </div>
                            <Switch defaultChecked />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
