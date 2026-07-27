import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { PageHeader } from "@/components/page-header";
import { MAPA_PROCESOS_CES, DOCUMENTOS } from "@/lib/ces-data";
import { FileText } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/_authenticated/procesos")({
    component: ProcesosPage,
    head: () => ({ meta: [{ title: "Procesos CES — CES SIG" }] }),
});

const CATEGORIA_ICONO: Record<string, string> = {
    "Procesos Estratégicos": "https://gycqduihf0vkjbnu.public.blob.vercel-storage.com/Proceso%20Estrategico.png",
    "Procesos Misionales": "https://gycqduihf0vkjbnu.public.blob.vercel-storage.com/Proceso%20Misional.png",
    "Procesos de Apoyo": "https://gycqduihf0vkjbnu.public.blob.vercel-storage.com/Proceso%20de%20apoyo.png",
};

// Ubicacion llega como "Sección Excel / subproceso" — solo se muestra la parte de después del "/"
// (la sección ya está implícita en el acordeón que agrupa por proceso).
function tipoDocumento(ubicacion: string) {
    const idx = ubicacion.indexOf("/");
    return idx === -1 ? ubicacion : ubicacion.slice(idx + 1).trim();
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
            <PageHeader eyebrow="Sistema Integrado de Gestión" title="Procesos CES" description="Cloud Enterprise Services." />

            <div className="mt-6 overflow-hidden rounded-2xl border bg-card">
                <img
                    src="https://gycqduihf0vkjbnu.public.blob.vercel-storage.com/711px-MAPA_DE_PROCESOS.jpg"
                    alt="Mapa de Procesos CES"
                    className="mx-auto h-auto max-h-[34rem] w-auto"
                />
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-3">
                {MAPA_PROCESOS_CES.map((cat) => {
                    const docsCategoria = cat.procesos.flatMap((p) => documentosPorProceso.get(p) || []);
                    return (
                        <Card key={cat.categoria} className="border-border/60 transition hover:shadow-lg">
                            <CardContent className="p-6">
                                <div className="flex items-start gap-4">
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-soft p-2">
                                        <img src={CATEGORIA_ICONO[cat.categoria]} alt={cat.categoria} className="h-full w-full object-contain" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="text-base font-semibold">{cat.categoria}</h3>
                                        <ul className="mt-2 space-y-1">
                                            {cat.procesos.map((p) => (
                                                <li key={p} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                                                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand/50" />
                                                    <span>{p}</span>
                                                </li>
                                            ))}
                                        </ul>
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            <span className="inline-flex items-center gap-1 rounded-lg bg-muted px-2 py-1 text-[11px]"><FileText className="h-3 w-3" /> {docsCategoria.length} documentos</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <div className="mt-10">
                <h2 className="text-lg font-semibold">Documentación por proceso</h2>
                <p className="mt-1 text-sm text-muted-foreground">Registro de documentos del SIG. CES SIG no almacena archivos — solo nombres de los documentos.</p>

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
                                                                <div className="mt-2 overflow-hidden rounded-xl border">
                                                                    <div className="overflow-x-auto">
                                                                        <table className="w-full text-xs">
                                                                            <thead className="bg-muted/40 text-[10px] uppercase tracking-wide text-muted-foreground">
                                                                                <tr>
                                                                                    <th className="px-3 py-2 text-left">Documento</th>
                                                                                    <th className="px-3 py-2 text-left">Código</th>
                                                                                    <th className="px-3 py-2 text-left">Elaborado por</th>
                                                                                    <th className="px-3 py-2 text-left">Fecha de publicación</th>
                                                                                    <th className="px-3 py-2 text-left">Tipo de documento</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody className="divide-y">
                                                                                {docs.map((d: any) => (
                                                                                    <tr key={d.id} className="hover:bg-muted/20">
                                                                                        <td className="px-3 py-2">
                                                                                            <div className="flex items-center gap-1.5 font-medium">
                                                                                                <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                                                                                {d.nombre}
                                                                                            </div>
                                                                                        </td>
                                                                                        <td className="px-3 py-2 font-mono text-muted-foreground">{d.codigo || "-"}</td>
                                                                                        <td className="px-3 py-2 text-muted-foreground">{d.responsable}</td>
                                                                                        <td className="px-3 py-2 text-muted-foreground">{d.actualizacion}</td>
                                                                                        <td className="px-3 py-2 text-muted-foreground">{tipoDocumento(d.ubicacion)}</td>
                                                                                    </tr>
                                                                                ))}
                                                                            </tbody>
                                                                        </table>
                                                                    </div>
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
                                        <div className="overflow-hidden rounded-xl border">
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-xs">
                                                    <thead className="bg-muted/40 text-[10px] uppercase tracking-wide text-muted-foreground">
                                                        <tr>
                                                            <th className="px-3 py-2 text-left">Documento</th>
                                                            <th className="px-3 py-2 text-left">Código</th>
                                                            <th className="px-3 py-2 text-left">Elaborado por</th>
                                                            <th className="px-3 py-2 text-left">Fecha de publicación</th>
                                                            <th className="px-3 py-2 text-left">Tipo de documento</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y">
                                                        {otros.map((d: any) => (
                                                            <tr key={d.id} className="hover:bg-muted/20">
                                                                <td className="px-3 py-2">
                                                                    <div className="flex items-center gap-1.5 font-medium">
                                                                        <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                                                        {d.nombre}
                                                                    </div>
                                                                </td>
                                                                <td className="px-3 py-2 font-mono text-muted-foreground">{d.codigo || "-"}</td>
                                                                <td className="px-3 py-2 text-muted-foreground">{d.responsable}</td>
                                                                <td className="px-3 py-2 text-muted-foreground">{d.actualizacion}</td>
                                                                <td className="px-3 py-2 text-muted-foreground">{tipoDocumento(d.ubicacion)}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
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
