import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { PageHeader } from "@/components/page-header";
import { PROCESOS, MAPA_PROCESOS_CES, DOCUMENTOS } from "@/lib/ces-data";
import { Workflow, User, Calendar, ClipboardCheck, Gauge, ShieldAlert, FileText, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/_authenticated/procesos")({
    component: ProcesosPage,
    head: () => ({ meta: [{ title: "Procesos CES — CES SIG" }] }),
});

function estadoTone(e: string) {
    if (e === "Al día") return "bg-brand-soft text-brand";
    if (e === "Requiere atención") return "bg-amber-50 text-amber-700";
    return "bg-red-50 text-red-700";
}

function docEstadoTone(e: string) {
    return e === "Vigente" ? "bg-brand-soft text-brand" : "bg-amber-100 text-amber-700";
}

// El nombre de sección tal como llega desde el Excel (ubicacion = "Sección Excel / subproceso").
// No es fuzzy-match: es un mapeo exacto para evitar clasificar mal un documento en un SIG certificado.
function normalizeKey(s: string) {
    return s
        .toUpperCase()
        .normalize("NFD")
        .replace(new RegExp("[\\u0300-\\u036f]", "g"), "")
        .replace(/\s+/g, " ")
        .trim();
}

const SECCION_A_PROCESO: Record<string, string> = {
    "PROCESOS ESTRATEGICOS - PLANEACION ESTRATEGICA": "Planeación Estratégica",
    "PROCESOS ESTRAEGICOS - ADMINISTRACION DE RIESGOS": "Administración de Riesgos",
    "PROCESOS ESTRATEGICOS - ADMINISTRACION DE RIESGOS": "Administración de Riesgos",
    "PROCESOS MISIONALES - ARQUITECTURA DE SOLUCIONES": "Arquitectura de Soluciones",
    "PROCESOS MISIONALES - GESTION DE PROYECTOS": "Gestión de Proyectos",
    "PROCESOS MISIONALES - GESTION DE SERVICIOS DE TIC": "Gestión de Servicios de TIC",
    "PROCESOS MISIONALES - SERVICIO AL CLIENTE": "Gestión de Servicio al Cliente",
    "VENTAS": "Ventas",
    "COMUNICACIONES Y MERCADEO": "Comunicaciones y Mercadeo",
};

function ProcesosPage() {
    const [documentos, setDocumentos] = useState(DOCUMENTOS);

    useEffect(() => {
        let mounted = true;
        fetch("/api/sync/documentacion")
            .then((r) => (r.ok ? r.json() : Promise.reject(r.statusText)))
            .then((data) => mounted && setDocumentos(data))
            .catch(() => {
                /* fallback kept */
            });
        return () => {
            mounted = false;
        };
    }, []);

    const documentosPorProceso = new Map<string, typeof DOCUMENTOS>();
    const otros: typeof DOCUMENTOS = [];
    for (const d of documentos) {
        const seccion = String((d as any).ubicacion || "").split(" / ")[0] || "";
        const proceso = SECCION_A_PROCESO[normalizeKey(seccion)];
        if (proceso) {
            if (!documentosPorProceso.has(proceso)) documentosPorProceso.set(proceso, []);
            documentosPorProceso.get(proceso)!.push(d);
        } else {
            otros.push(d);
        }
    }

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <PageHeader eyebrow="Sistema Integrado de Gestión" title="Procesos CES" description="Procesos del SIG que impactan directamente al área Cloud Enterprise Services." />

            <div className="mt-6 overflow-hidden rounded-2xl border bg-card">
                <img
                    src="https://gycqduihf0vkjbnu.public.blob.vercel-storage.com/711px-MAPA_DE_PROCESOS.jpg"
                    alt="Mapa de Procesos CES"
                    className="mx-auto h-auto max-h-[34rem] w-auto"
                />
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-2">
                {PROCESOS.map((p) => (
                    <Card key={p.id} className="border-border/60 transition hover:shadow-lg">
                        <CardContent className="p-6">
                            <div className="flex items-start gap-4">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                                    <Workflow className="h-6 w-6" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="text-base font-semibold">{p.nombre}</h3>
                                        <Badge className={estadoTone(p.estado)}>{p.estado}</Badge>
                                    </div>
                                    <p className="mt-1 text-sm text-muted-foreground">{p.descripcion}</p>
                                    <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                                        <div className="flex items-center gap-1.5 text-muted-foreground"><User className="h-3 w-3" /> {p.responsable}</div>
                                        <div className="flex items-center gap-1.5 text-muted-foreground"><Calendar className="h-3 w-3" /> Próx: {p.proximaRevision}</div>
                                    </div>
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        <span className="inline-flex items-center gap-1 rounded-lg bg-muted px-2 py-1 text-[11px]"><ClipboardCheck className="h-3 w-3" /> {p.auditorias} auditorías</span>
                                        <span className="inline-flex items-center gap-1 rounded-lg bg-muted px-2 py-1 text-[11px]"><Gauge className="h-3 w-3" /> {p.indicadores} indicadores</span>
                                        <span className="inline-flex items-center gap-1 rounded-lg bg-muted px-2 py-1 text-[11px]"><ShieldAlert className="h-3 w-3" /> {p.riesgos} riesgos</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="mt-10">
                <h2 className="text-lg font-semibold">Documentación por proceso</h2>
                <p className="mt-1 text-sm text-muted-foreground">Registro de documentos del SIG. CES SIG no almacena archivos — solo su ubicación de referencia.</p>

                <Card className="mt-4 border-border/60">
                    <CardContent className="p-0">
                        <Accordion type="multiple" className="px-5">
                            {MAPA_PROCESOS_CES.map((cat) => {
                                const docsCategoria = cat.procesos.flatMap((p) => documentosPorProceso.get(p) || []);
                                return (
                                    <AccordionItem key={cat.categoria} value={cat.categoria}>
                                        <AccordionTrigger>
                                            <div className="flex flex-1 items-center justify-between pr-3 text-left">
                                                <span className="font-medium">{cat.categoria}</span>
                                                <Badge variant="secondary" className="text-[10px]">{docsCategoria.length} documento(s)</Badge>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            <div className="space-y-5">
                                                {cat.procesos.map((proceso) => {
                                                    const docs = documentosPorProceso.get(proceso) || [];
                                                    return (
                                                        <div key={proceso}>
                                                            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{proceso}</div>
                                                            {docs.length === 0 ? (
                                                                <div className="mt-1.5 text-xs text-muted-foreground">Sin documentos sincronizados.</div>
                                                            ) : (
                                                                <div className="mt-2 space-y-1.5">
                                                                    {docs.map((d: any) => (
                                                                        <div key={d.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/20 px-3 py-2 text-xs">
                                                                            <div className="flex min-w-0 items-center gap-2">
                                                                                <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                                                                <span className="truncate font-medium">{d.nombre}</span>
                                                                                <Badge variant="secondary" className="text-[10px]">v{d.version}</Badge>
                                                                            </div>
                                                                            <div className="flex items-center gap-3 text-muted-foreground">
                                                                                <span>{d.responsable}</span>
                                                                                <Badge className={docEstadoTone(d.estado)} style={{ fontSize: "10px", padding: "2px 6px" }}>{d.estado}</Badge>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                );
                            })}

                            {otros.length > 0 && (
                                <AccordionItem value="otros-procesos">
                                    <AccordionTrigger>
                                        <div className="flex flex-1 items-center justify-between pr-3 text-left">
                                            <span className="font-medium">Otros procesos (sin clasificar)</span>
                                            <Badge variant="secondary" className="text-[10px]">{otros.length} documento(s)</Badge>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <div className="space-y-1.5">
                                            {otros.map((d: any) => (
                                                <div key={d.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/20 px-3 py-2 text-xs">
                                                    <div className="flex min-w-0 items-center gap-2">
                                                        <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                                        <span className="truncate font-medium">{d.nombre}</span>
                                                        <Badge variant="secondary" className="text-[10px]">v{d.version}</Badge>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-muted-foreground">
                                                        <span className="truncate">{d.ubicacion}</span>
                                                        <ExternalLink className="h-3 w-3 shrink-0" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            )}
                        </Accordion>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
