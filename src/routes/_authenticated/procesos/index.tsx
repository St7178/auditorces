import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { PageHeader } from "@/components/page-header";
import { MAPA_PROCESOS_CES, DOCUMENTOS, CATEGORIA_COLOR } from "@/lib/ces-data";
import { FileText, Link2, KeyRound, ShieldQuestion, LifeBuoy, GraduationCap, ChevronDown, ShieldAlert, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/_authenticated/procesos/")({
    component: ProcesosPage,
    head: () => ({ meta: [{ title: "Procesos CES — CES SIG" }] }),
});

const CATEGORIA_ICONO: Record<string, string> = {
    "Procesos Estratégicos": "https://gycqduihf0vkjbnu.public.blob.vercel-storage.com/Proceso%20Estrategico.png",
    "Procesos Misionales": "https://gycqduihf0vkjbnu.public.blob.vercel-storage.com/Proceso%20Misional.png",
    "Procesos de Apoyo": "https://gycqduihf0vkjbnu.public.blob.vercel-storage.com/Proceso%20de%20apoyo.png",
};

// Conceptos base de la información documentada del SIG, para quien recién entra a la plataforma.
// ejemploCodigo apunta a un documento real (código exacto tal como llega sincronizado) para que "Ver
// ejemplo" no sea un dato inventado — si algún día ese código no está sincronizado, se avisa en vez de
// mostrar algo falso (ver ejemploDoc).
const CONCEPTOS_SIG: Array<{ tipo: string; explicacion: string; detalle?: string[]; ejemploCodigo?: string }> = [
    {
        tipo: "Manual",
        explicacion: "Documento que reúne las directrices generales de un sistema de gestión: para qué existe, cómo está organizado y qué reglas generales aplican a todos los procesos.",
        ejemploCodigo: "M.GI.003.007",
    },
    {
        tipo: "Procedimiento",
        explicacion: "Describe paso a paso cómo se ejecuta una actividad o proceso, quién es responsable de cada paso y qué controles aplican en el camino.",
        ejemploCodigo: "P.GI.001.015",
    },
    {
        tipo: "Instructivo",
        explicacion: "Explica cómo realizar una tarea puntual y específica dentro de un procedimiento, casi siempre con un nivel de detalle técnico u operativo mayor.",
        ejemploCodigo: "I.KM.001.004",
    },
    {
        tipo: "Formato",
        explicacion: "Plantilla en blanco, lista para diligenciar, que estandariza cómo se captura cierta información (por ejemplo, un formato de solicitud o de evaluación).",
        ejemploCodigo: "F.GI.001.003",
    },
    {
        tipo: "Registro",
        explicacion: "Es un formato ya diligenciado: la evidencia de que una actividad efectivamente ocurrió (una lista de asistencia firmada, una evaluación completada, etc.).",
        ejemploCodigo: "R.GH.006.043",
    },
    {
        tipo: "Caracterización",
        explicacion: "Ficha que describe un proceso completo del SIG: su objetivo, alcance, entradas y salidas, responsables, riesgos asociados e indicadores.",
        detalle: [
            "¿Para qué sirve? Para entender de un vistazo cómo funciona un proceso completo, sin tener que leer todos sus documentos por separado.",
            "¿Qué contiene? Objetivo, alcance, dueño del proceso, entradas/proveedor, actividades (ciclo PHVA), salidas/cliente, recursos, requisitos aplicables y riesgos asociados.",
        ],
        ejemploCodigo: "C.AS.003,006",
    },
    {
        tipo: "Política",
        explicacion: "Declaración de intención y dirección de la Alta Dirección sobre un tema del SIG (calidad, seguridad de la información, etc.) — el marco que deben respetar procedimientos e instructivos.",
        ejemploCodigo: "M.SI.001",
    },
];

function ejemploDoc(codigo: string, documentos: typeof DOCUMENTOS) {
    return documentos.find((d) => d.codigo === codigo);
}

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
    // El Excel de origen escribe estas tres secciones de Procesos de Apoyo con variaciones (doble
    // espacio, "GESTION DE GESTIÓN HUMANA" en vez de "GESTIÓN HUMANA") — normalizeKey ya colapsa
    // espacios/tildes, así que estas claves deben coincidir con esa forma normalizada exacta.
    "PROCESOS DE APOYO - GESTION DEL SISTEMA INTEGRADO": "Gestión Sistema Integrado",
    "PROCESOS DE APOYO - GESTION DE GESTION HUMANA": "Gestión Humana",
    "PROCESOS DE APOYO - GESTION JURIDICA": "Gestión Jurídica",
};

function ProcesosPage() {
    const [documentos, setDocumentos] = useState(DOCUMENTOS);
    const [ejemplosAbiertos, setEjemplosAbiertos] = useState<Set<string>>(new Set());
    const toggleEjemplo = (tipo: string) =>
        setEjemplosAbiertos((prev) => {
            const next = new Set(prev);
            if (next.has(tipo)) next.delete(tipo);
            else next.add(tipo);
            return next;
        });

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

            <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs font-medium">
                    🟢 Sistema de Gestión de Calidad (ISO 9001)
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs font-medium">
                    🔵 Seguridad de la Información (ISO/IEC 27001)
                </span>
                <span className="text-xs text-muted-foreground">El SIG de CES está certificado bajo ambas normas.</span>
            </div>

            <Card className="mt-6 border-brand/30 bg-gradient-to-br from-brand-soft to-secondary">
                <CardContent className="p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold text-brand">Cómo acceder al SIG completo (CnetWiki)</h3>
                        <a
                            href="https://wiki.grupocnet.com/index.php/P%C3%A1gina_principal"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand/90"
                        >
                            <Link2 className="h-3.5 w-3.5" /> Ir a CnetWiki
                        </a>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Aquí solo se muestran los registros sincronizados de este proceso. La caracterización completa, políticas, manuales,
                        procedimientos e instructivos originales viven en CnetWiki, el Sistema Integrado de Gestión de Compunet.
                    </p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <div className="flex items-start gap-2">
                            <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                            <div className="text-xs">
                                <div className="font-semibold">Credenciales</div>
                                <div className="text-muted-foreground">Tu usuario de dominio Cnet y la contraseña asignada por la Mesa Integral de Servicios (se personaliza desde "Preferencias → Cambiar Contraseña").</div>
                            </div>
                        </div>
                        <div className="flex items-start gap-2">
                            <ShieldQuestion className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                            <div className="text-xs">
                                <div className="font-semibold">Uso de la información</div>
                                <div className="text-muted-foreground">Es solo para consulta interna. Únicamente formatos, presentaciones y certificaciones se pueden descargar; para enviar algo a un externo se pide "Copia No Controlada" a sistemaintegradodegestion@grupocnet.com.</div>
                            </div>
                        </div>
                        <div className="flex items-start gap-2">
                            <LifeBuoy className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                            <div className="text-xs">
                                <div className="font-semibold">Soporte</div>
                                <div className="text-muted-foreground">Incidentes o solicitudes funcionales sobre CnetWiki se reportan por ticket en SOLMAN.</div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

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
                                const color = CATEGORIA_COLOR[cat.categoria];
                                return (
                                    <AccordionItem key={cat.categoria} value={cat.categoria}>
                                        <AccordionTrigger
                                            className="rounded-lg px-3 hover:no-underline"
                                            style={color ? { backgroundColor: color.bg, color: color.fg } : undefined}
                                        >
                                            <div className="flex flex-1 items-center justify-between pr-3 text-left">
                                                <span className="font-medium">{cat.categoria}</span>
                                                <Badge variant="secondary" className="text-[10px] text-foreground">{docsCategoria.length} documento(s)</Badge>
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

            <div className="mt-10">
                <Link to="/procesos/vulnerabilidades" className="block">
                    <Card className="border-border/60 transition hover:border-brand hover:shadow-lg">
                        <CardContent className="flex items-center gap-4 p-5">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                                <ShieldAlert className="h-5 w-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="font-semibold">Vulnerabilidades CES</div>
                                <div className="text-xs text-muted-foreground">Qué es una vulnerabilidad y dónde consultarlas en la Wiki</div>
                            </div>
                            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                        </CardContent>
                    </Card>
                </Link>
            </div>

            <div className="mt-10">
                <div className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-brand" />
                    <h2 className="text-lg font-semibold">📚 ¿No conoces estos documentos?</h2>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">Centro de Aprendizaje SIG — los tipos de información documentada que vas a encontrar en cada proceso.</p>

                <Card className="mt-4 border-border/60">
                    <CardContent className="p-0">
                        <Accordion type="multiple" className="px-5">
                            {CONCEPTOS_SIG.map((c) => {
                                const ejemplo = c.ejemploCodigo ? ejemploDoc(c.ejemploCodigo, documentos) : undefined;
                                return (
                                    <AccordionItem key={c.tipo} value={c.tipo}>
                                        <AccordionTrigger>
                                            <span className="font-medium">¿Qué es un{c.tipo === "Política" || c.tipo === "Caracterización" ? "a" : ""} {c.tipo}?</span>
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            <p className="text-sm text-muted-foreground">{c.explicacion}</p>
                                            {c.detalle && (
                                                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                                                    {c.detalle.map((d) => (
                                                        <li key={d}>{d}</li>
                                                    ))}
                                                </ul>
                                            )}
                                            {c.ejemploCodigo && (
                                                <div className="mt-3">
                                                    <button
                                                        onClick={() => toggleEjemplo(c.tipo)}
                                                        className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-accent"
                                                    >
                                                        Ver ejemplo <ChevronDown className={`h-3 w-3 transition-transform ${ejemplosAbiertos.has(c.tipo) ? "rotate-180" : ""}`} />
                                                    </button>
                                                    {ejemplosAbiertos.has(c.tipo) && (
                                                        <div className="mt-2 rounded-lg border bg-muted/20 p-3 text-xs">
                                                            {ejemplo ? (
                                                                <>
                                                                    <span className="font-mono text-muted-foreground">{ejemplo.codigo}</span> · <span className="font-medium">{ejemplo.nombre}</span>
                                                                    <div className="mt-0.5 text-muted-foreground">{ejemplo.ubicacion}</div>
                                                                </>
                                                            ) : (
                                                                <span className="text-muted-foreground">Documento de ejemplo no disponible por ahora.</span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </AccordionContent>
                                    </AccordionItem>
                                );
                            })}
                        </Accordion>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
