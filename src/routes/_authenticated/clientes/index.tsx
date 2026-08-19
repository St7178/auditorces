import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { CLIENTES } from "@/lib/ces-data";
import { clasificarContrato, resumenContratos } from "@/lib/contratos";
import { Building2, Calendar, AlertTriangle, ClipboardList, ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/clientes/")({
    component: ClientesPage,
    head: () => ({ meta: [{ title: "Clientes — CES SIG" }] }),
});

const CLIENTE_LOGO: Record<string, string> = {
    "CONCONCRETO": "https://gycqduihf0vkjbnu.public.blob.vercel-storage.com/Logo%20Concocreto.png",
    "GRUPO RECORDAR": "https://gycqduihf0vkjbnu.public.blob.vercel-storage.com/Logo%20Grupo%20Recordar.png",
    "INCOLMOTOS": "https://gycqduihf0vkjbnu.public.blob.vercel-storage.com/Logo%20Incolmotos.png",
    "INDUPALMA": "https://gycqduihf0vkjbnu.public.blob.vercel-storage.com/LOGO_INDUPALMA.png",
    "INGENIO CARMELITA": "https://gycqduihf0vkjbnu.public.blob.vercel-storage.com/carmelita.png",
    "INGENIO RISARALDA": "https://gycqduihf0vkjbnu.public.blob.vercel-storage.com/INGENIORISARALDALOGO.png",
    "LEVAPAN": "https://gycqduihf0vkjbnu.public.blob.vercel-storage.com/LevapanLogo.png",
    "NUTRESA": "https://gycqduihf0vkjbnu.public.blob.vercel-storage.com/NUTRESALOGO.png",
    "PROTELA": "https://gycqduihf0vkjbnu.public.blob.vercel-storage.com/PROTELA.png",
    "SURTIALIMENTOS": "https://gycqduihf0vkjbnu.public.blob.vercel-storage.com/SURTIALIAMENTOSLOGO.png",
};

function clienteLogo(nombre: string) {
    return CLIENTE_LOGO[String(nombre || "").trim().toUpperCase()];
}

function estadoTone(e: string) {
    if (e === "Vencido") return "bg-red-100 text-red-700";
    if (e === "Próximo a vencer") return "bg-amber-100 text-amber-700";
    if (e === "En renovación") return "bg-amber-100 text-amber-700";
    if (e === "Vigente") return "bg-brand-soft text-brand";
    return "bg-secondary text-secondary-foreground";
}

function ClientesPage() {
    const [clientes, setClientes] = useState(CLIENTES);

    useEffect(() => {
        let mounted = true;
        fetch("/api/sync/clientes")
            .then((r) => r.ok ? r.json() : Promise.reject(r.statusText))
            .then((data) => mounted && setClientes(data))
            .catch(() => {
                /* fallback kept */
            });
        return () => {
            mounted = false;
        };
    }, []);

    const resumen = resumenContratos(clientes.flatMap((c) => c.contratos || []));

    // Un cliente "Activo" con al menos un contrato vencido es una inconsistencia que vale la pena
    // señalar; si TODOS sus contratos están vencidos, "Activo" ya ni siquiera describe la realidad —
    // en ese caso se reemplaza el badge en vez de solo advertir debajo.
    const clientesConAlgunContratoVencido = new Set(
        clientes.filter((c) => c.estado === "Activo" && (c.contratos || []).some((ct) => clasificarContrato(ct) === "vencido")).map((c) => c.id),
    );
    const clientesConTodoVencido = new Set(
        clientes
            .filter((c) => c.estado === "Activo" && (c.contratos || []).length > 0 && (c.contratos || []).every((ct) => clasificarContrato(ct) === "vencido"))
            .map((c) => c.id),
    );

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <PageHeader
                eyebrow="Relacionamiento"
                title="Clientes"
                description="Clientes activos con contratos asociados gestionados por el equipo CES."
                actions={
                    <Link to="/clientes/documentacion" className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5 text-xs font-medium hover:bg-accent">
                        <ClipboardList className="h-3.5 w-3.5" /> Documentación <ArrowUpRight className="h-3 w-3" />
                    </Link>
                }
            />

            {(resumen.proximos > 0 || resumen.vencidos > 0) && (
                <div className="mt-6 flex gap-3 rounded-xl border border-amber-300/50 bg-amber-50 p-4">
                    <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
                    <div className="text-sm">
                        <div className="font-semibold text-amber-900">Alerta de contratos</div>
                        <div className="text-amber-800">
                            {resumen.proximos > 0 && <>{resumen.proximos} contrato(s) próximo(s) a vencer en los siguientes 60 días. </>}
                            {resumen.vencidos > 0 && <>{resumen.vencidos} contrato(s) ya vencido(s).</>}
                        </div>
                    </div>
                </div>
            )}

            <h2 className="mt-10 text-lg font-semibold">Clientes</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {clientes.map((c) => {
                    const logo = clienteLogo(c.nombre);
                    const todoVencido = clientesConTodoVencido.has(c.id);
                    const algunVencido = clientesConAlgunContratoVencido.has(c.id) && !todoVencido;
                    return (
                    <Card key={c.id} className={`transition hover:shadow-lg ${todoVencido || algunVencido ? "border-red-300/70" : "border-border/60"}`}>
                        <CardContent className="p-5">
                            <div className="flex items-start justify-between">
                                {logo ? (
                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border bg-white p-1.5">
                                        <img src={logo} alt={c.nombre} className="h-full w-full object-contain" />
                                    </div>
                                ) : (
                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-[oklch(0.5_0.14_240)] text-white">
                                        <Building2 className="h-5 w-5" />
                                    </div>
                                )}
                                {todoVencido ? (
                                    <Badge className="bg-red-100 text-red-700">Contratos vencidos</Badge>
                                ) : (
                                    <Badge className={c.estado === "Activo" ? "bg-brand-soft text-brand" : "bg-amber-50 text-amber-700"}>{c.estado}</Badge>
                                )}
                            </div>

                            {algunVencido && (
                                <div className="mt-3 flex items-center gap-1.5 rounded-md bg-red-50 px-2.5 py-1.5 text-[11px] font-medium text-red-700">
                                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> Figura "Activo" pero tiene contrato(s) vencido(s)
                                </div>
                            )}

                            <div className="mt-4 text-base font-semibold">{c.nombre}</div>
                            <div className="mt-0.5 text-xs text-muted-foreground">Responsable · {c.responsable}</div>

                            <div className="mt-3 flex flex-wrap gap-1.5">
                                {c.servicios.map((s: string) => (
                                    <span key={s} className="rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">{s}</span>
                                ))}
                            </div>

                            {c.contratos && c.contratos.length > 0 && (
                                <div className="mt-4 border-t pt-4">
                                    <div className="text-xs font-semibold text-muted-foreground mb-2">Contratos ({c.contratos.length})</div>
                                    <div className="space-y-2">
                                        {c.contratos.map((ct: any) => (
                                            <div key={ct.id} className="rounded-md bg-muted/50 p-2.5 text-xs">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="font-mono text-[10px] text-muted-foreground">{ct.id}</span>
                                                    <Badge className={estadoTone(ct.estado)} style={{ fontSize: "10px", padding: "2px 6px" }}>
                                                        {ct.estado}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center gap-4 text-muted-foreground">
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        <span>{ct.inicio}</span>
                                                    </div>
                                                    <span>→</span>
                                                    <span>{ct.fin}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                    );
                })}
            </div>
        </div>
    );
}
