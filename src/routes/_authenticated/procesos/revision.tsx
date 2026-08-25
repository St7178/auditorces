import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { PageHeader } from "@/components/page-header";
import { DOCUMENTOS } from "@/lib/ces-data";
import {
    TIPOS_DOCUMENTO, tipoDeDocumento, procesoDeDocumento, edadEnAnios, estadoRevision,
    type EstadoRevision,
} from "@/lib/documentos";
import { ArrowLeft, FileText, AlertTriangle, FolderKanban } from "lucide-react";

export const Route = createFileRoute("/_authenticated/procesos/revision")({
    component: RevisionPage,
    head: () => ({ meta: [{ title: "Revisión Documental — CES SIG" }] }),
});

const PASOS = [
    { id: "busqueda", label: "Búsqueda de documentos vencidos" },
    { id: "reunion", label: "Reunión con el responsable" },
    { id: "actualizacion", label: "Actualización de documentos" },
    { id: "publicado", label: "Publicado en el SIG" },
] as const;

const ESTADO_INFO: Record<EstadoRevision, { label: string; badge: string; texto: string }> = {
    vigente: { label: "Vigentes (< 1 año)", badge: "bg-emerald-50 text-emerald-700", texto: "text-emerald-700" },
    revision: { label: "Requieren revisión (1-5 años)", badge: "bg-amber-50 text-amber-700", texto: "text-amber-700" },
    critico: { label: "Revisión urgente (+5 años)", badge: "bg-red-50 text-red-700", texto: "text-red-700" },
};

function formatEdad(edad: number | null) {
    if (edad === null) return "—";
    if (edad < 1) return `${Math.round(edad * 12)} meses`;
    return `${edad.toFixed(1)} años`;
}

function RevisionPage() {
    const [documentos, setDocumentos] = useState(DOCUMENTOS);
    const [checklist, setChecklist] = useState<Record<string, boolean>>({});
    const [filtroArea, setFiltroArea] = useState("");
    const [filtroResponsable, setFiltroResponsable] = useState("");
    const [filtroEstado, setFiltroEstado] = useState("");

    useEffect(() => {
        let mounted = true;
        fetch("/api/sync/documentacion")
            .then((r) => (r.ok ? r.json() : Promise.reject(r.statusText)))
            .then((data) => mounted && setDocumentos(data))
            .catch(() => { /* fallback kept */ });
        fetch("/api/checklist-clientes-estado")
            .then((r) => (r.ok ? r.json() : Promise.reject(r.statusText)))
            .then((data) => mounted && setChecklist(data))
            .catch(() => { /* todo sin marcar */ });
        return () => {
            mounted = false;
        };
    }, []);

    // Cada documento se enriquece una sola vez con lo que ya sabemos calcular de él (tipo, área,
    // antigüedad) — el resto de la página solo filtra/agrupa sobre esto.
    const enriquecidos = useMemo(
        () =>
            documentos.map((d) => {
                const edad = d.actualizacion ? edadEnAnios(d.actualizacion) : null;
                return {
                    ...d,
                    tipo: tipoDeDocumento(d),
                    area: procesoDeDocumento(d) ?? "Sin clasificar",
                    edad,
                    revision: estadoRevision(edad),
                };
            }),
        [documentos],
    );

    const areas = [...new Set(enriquecidos.map((d) => d.area))].sort((a, b) => a.localeCompare(b, "es"));
    const responsables = [...new Set(enriquecidos.map((d) => d.responsable).filter(Boolean))].sort((a, b) => a.localeCompare(b, "es"));
    const estados = [...new Set(enriquecidos.map((d) => d.estado).filter(Boolean))].sort((a, b) => a.localeCompare(b, "es"));

    const filtrados = enriquecidos.filter((d) =>
        (!filtroArea || d.area === filtroArea)
        && (!filtroResponsable || d.responsable === filtroResponsable)
        && (!filtroEstado || d.estado === filtroEstado),
    );

    const porTipo = TIPOS_DOCUMENTO.map((tipo) => ({ tipo, total: filtrados.filter((d) => d.tipo === tipo).length })).filter((t) => t.total > 0);
    const porRevision: Record<EstadoRevision, typeof filtrados> = { vigente: [], revision: [], critico: [] };
    for (const d of filtrados) porRevision[d.revision].push(d);

    // Solo lo que requiere acción trae el checklist — los vigentes no aplican revisión, no hace
    // falta hacerles seguimiento.
    const pendientes = [...porRevision.critico, ...porRevision.revision].sort((a, b) => (b.edad ?? 0) - (a.edad ?? 0));

    const actualizarPaso = async (docId: string, paso: string, valor: boolean) => {
        const id = `revision:${docId}:${paso}`;
        setChecklist((prev) => ({ ...prev, [id]: valor }));
        await fetch("/api/checklist-clientes-estado", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, completado: valor }),
        }).catch(() => {
            /* queda marcado en pantalla igual; el próximo fetch de la página corregirá si no se guardó */
        });
    };

    return (
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
            <PageHeader
                eyebrow="Procesos CES"
                title="Revisión Documental"
                description="Antigüedad de los documentos del SIG a partir de su última actualización — sin próxima revisión inventada."
                actions={
                    <Link to="/procesos" className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5 text-xs font-medium hover:bg-accent">
                        <ArrowLeft className="h-3.5 w-3.5" /> Procesos CES
                    </Link>
                }
            />

            {/* Filtros */}
            <div className="mt-6 flex flex-wrap items-center gap-2">
                <FolderKanban className="h-4 w-4 text-muted-foreground" />
                <select value={filtroArea} onChange={(e) => setFiltroArea(e.target.value)} className="rounded-lg border bg-card px-2.5 py-1.5 text-xs font-medium outline-none focus:border-brand">
                    <option value="">Todas las áreas</option>
                    {areas.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
                <select value={filtroResponsable} onChange={(e) => setFiltroResponsable(e.target.value)} className="rounded-lg border bg-card px-2.5 py-1.5 text-xs font-medium outline-none focus:border-brand">
                    <option value="">Todos los responsables</option>
                    {responsables.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
                <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} className="rounded-lg border bg-card px-2.5 py-1.5 text-xs font-medium outline-none focus:border-brand">
                    <option value="">Todos los estados</option>
                    {estados.map((e) => <option key={e} value={e}>{e}</option>)}
                </select>
                {(filtroArea || filtroResponsable || filtroEstado) && (
                    <button
                        onClick={() => { setFiltroArea(""); setFiltroResponsable(""); setFiltroEstado(""); }}
                        className="text-xs font-medium text-muted-foreground underline decoration-dotted hover:text-foreground"
                    >
                        Quitar filtros
                    </button>
                )}
            </div>

            {/* Total por tipo de documento */}
            <div className="mt-8">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Total de documentos por tipo</h2>
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {porTipo.map((t) => (
                        <Card key={t.tipo} className="border-border/60">
                            <CardContent className="p-4">
                                <div className="text-2xl font-bold">{t.total}</div>
                                <div className="mt-0.5 text-xs text-muted-foreground">{t.tipo}</div>
                            </CardContent>
                        </Card>
                    ))}
                    {porTipo.length === 0 && (
                        <div className="col-span-full text-sm text-muted-foreground">Ningún documento coincide con los filtros.</div>
                    )}
                </div>
            </div>

            {/* Estado de revisión */}
            <div className="mt-8">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Estado de revisión</h2>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    {(Object.keys(ESTADO_INFO) as EstadoRevision[]).map((k) => (
                        <Card key={k} className="border-border/60">
                            <CardContent className="p-4">
                                <div className={`text-2xl font-bold ${ESTADO_INFO[k].texto}`}>{porRevision[k].length}</div>
                                <div className="mt-0.5 text-xs text-muted-foreground">{ESTADO_INFO[k].label}</div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Documentos que requieren revisión, con checklist de seguimiento */}
            <div className="mt-8">
                <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Pendientes de revisión ({pendientes.length})</h2>
                </div>

                {pendientes.length === 0 ? (
                    <div className="mt-3 rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                        Ningún documento requiere revisión con los filtros actuales.
                    </div>
                ) : (
                    <div className="mt-3 space-y-3">
                        {pendientes.map((d) => (
                            <Card key={d.id} className="border-border/60">
                                <CardContent className="p-4">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-1.5 font-semibold">
                                                <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /> {d.nombre}
                                            </div>
                                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                                                <span className="font-mono">{d.codigo || "—"}</span>
                                                <span>{d.tipo}</span>
                                                <span>{d.area}</span>
                                                <span>Responsable: {d.responsable}</span>
                                                <span>Actualizado: {d.actualizacion}</span>
                                            </div>
                                        </div>
                                        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${ESTADO_INFO[d.revision].badge}`}>
                                            {formatEdad(d.edad)}
                                        </span>
                                    </div>

                                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 border-t pt-3">
                                        {PASOS.map((p) => {
                                            const id = `revision:${d.id}:${p.id}`;
                                            const marcado = Boolean(checklist[id]);
                                            return (
                                                <label key={p.id} className="flex cursor-pointer items-center gap-1.5 text-xs">
                                                    <Checkbox checked={marcado} onCheckedChange={(v) => actualizarPaso(d.id, p.id, v === true)} />
                                                    <span className={marcado ? "text-foreground" : "text-muted-foreground"}>{p.label}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
