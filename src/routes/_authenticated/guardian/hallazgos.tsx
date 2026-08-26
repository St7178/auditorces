import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { ArrowLeft, MapPin, Lightbulb, User, CalendarDays, CalendarPlus, Check, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/_authenticated/guardian/hallazgos")({
    component: HallazgosPage,
    head: () => ({ meta: [{ title: "Hallazgos de Auditoría — CES SIG" }] }),
});

type Hallazgo = {
    id: string;
    proceso: string;
    titulo: string;
    descripcion: string;
    nivelRiesgo: string | null;
    recomendacion: string;
    evidenciaUbicacion: string | null;
    estado: string;
    creadoEn: string;
    mitigado: boolean | null;
    comentarioMitigacion: string | null;
    responsable: string | null;
    pasoIdentifico: boolean;
    pasoAgenda: boolean;
    pasoSoluciono: boolean;
};

type Paso = "identifico" | "agenda" | "soluciono";
const PASOS: { id: Paso; label: string }[] = [
    { id: "identifico", label: "Identificó" },
    { id: "agenda", label: "Agendó" },
    { id: "soluciono", label: "Solucionó" },
];

// Checklist de seguimiento — independiente del control de mitigación con comentario obligatorio:
// esto es solo un tablero visual de en qué paso va el seguimiento del hallazgo.
function SeguimientoChecklist({
    hallazgo, onToggle,
}: {
    hallazgo: Hallazgo;
    onToggle: (paso: Paso, valor: boolean) => void;
}) {
    const marcados = PASOS.filter((p) => (p.id === "identifico" ? hallazgo.pasoIdentifico : p.id === "agenda" ? hallazgo.pasoAgenda : hallazgo.pasoSoluciono)).length;
    const pct = Math.round((marcados / PASOS.length) * 100);

    return (
        <div className="mt-3 border-t pt-3">
            <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-muted-foreground">Seguimiento</span>
                <span className="text-[11px] font-bold text-foreground">{pct}%</span>
            </div>
            <div className="flex flex-wrap gap-3">
                {PASOS.map((p) => {
                    const marcado = p.id === "identifico" ? hallazgo.pasoIdentifico : p.id === "agenda" ? hallazgo.pasoAgenda : hallazgo.pasoSoluciono;
                    return (
                        <label key={p.id} className="flex cursor-pointer items-center gap-1.5 text-xs">
                            <span
                                onClick={() => onToggle(p.id, !marcado)}
                                className={`flex h-4 w-4 items-center justify-center rounded border transition ${
                                    marcado ? "border-brand bg-brand text-white" : "border-muted-foreground/40"
                                }`}
                            >
                                {marcado && <Check className="h-3 w-3" />}
                            </span>
                            <span className={marcado ? "text-foreground" : "text-muted-foreground"}>{p.label}</span>
                        </label>
                    );
                })}
            </div>
        </div>
    );
}

// Formulario mínimo para agendar el seguimiento — al confirmarse crea la reunión real en Outlook
// (con Laura invitada, para que aparezca en Agenda SIG) y marca "Agendó" solo.
function AgendarReunion({
    hallazgo, onAgendado,
}: {
    hallazgo: Hallazgo;
    onAgendado: (hallazgo: Hallazgo) => void;
}) {
    const [abierto, setAbierto] = useState(false);
    const [fecha, setFecha] = useState("");
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [enlace, setEnlace] = useState<string | null>(null);

    const agendar = async () => {
        if (!fecha) {
            setError("Elige fecha y hora.");
            return;
        }
        const start = new Date(fecha);
        const end = new Date(start.getTime() + 60 * 60 * 1000);
        setGuardando(true);
        setError(null);
        try {
            const res = await fetch("/api/hallazgos", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: hallazgo.id,
                    agendar: { titulo: `Seguimiento: ${hallazgo.titulo}`, startIso: start.toISOString(), endIso: end.toISOString() },
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error ?? "No se pudo agendar");
            onAgendado(data.hallazgo);
            setEnlace(data.evento?.webLink ?? null);
            setAbierto(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo agendar. Intenta de nuevo.");
        } finally {
            setGuardando(false);
        }
    };

    if (!abierto) {
        return (
            <div className="mt-3 space-y-1.5">
                {enlace && (
                    <a
                        href={enlace}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 rounded-lg bg-brand-soft px-2.5 py-1.5 text-[11px] font-semibold text-brand hover:bg-brand/10"
                    >
                        <Check className="h-3.5 w-3.5" /> Reunión agendada — Ver en Outlook <ExternalLink className="h-3 w-3" />
                    </a>
                )}
                <button
                    onClick={() => setAbierto(true)}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold text-muted-foreground hover:bg-accent"
                >
                    <CalendarPlus className="h-3.5 w-3.5" /> {hallazgo.pasoAgenda ? "Agendar otra reunión" : "Agendar reunión de seguimiento"}
                </button>
            </div>
        );
    }

    return (
        <div className="mt-3 rounded-lg border p-2.5">
            <input
                type="datetime-local"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full rounded-md border bg-background px-2 py-1.5 text-xs outline-none focus:border-brand"
            />
            {error && <div className="mt-1 text-[11px] text-destructive">{error}</div>}
            <div className="mt-1.5 flex justify-end gap-1.5">
                <button onClick={() => { setAbierto(false); setError(null); }} className="rounded-md border px-2.5 py-1 text-[11px] font-medium hover:bg-accent">
                    Cancelar
                </button>
                <button
                    onClick={agendar}
                    disabled={guardando}
                    className="rounded-md bg-brand px-2.5 py-1 text-[11px] font-semibold text-white transition hover:bg-brand/90 disabled:opacity-50"
                >
                    {guardando ? "Agendando…" : "Agendar"}
                </button>
            </div>
        </div>
    );
}

function nivelTone(n: string | null) {
    if (n === "Crítico") return "bg-red-100 text-red-700";
    if (n === "Alto") return "bg-orange-100 text-orange-700";
    if (n === "Medio") return "bg-amber-100 text-amber-700";
    return "bg-brand-soft text-brand";
}

// El botón "Sí" siempre exige un comentario antes de guardar (obligatorio, verificado también en el
// servidor) — "No" se guarda directo, ya que no hay nada que explicar.
function MitigacionControl({
    hallazgo, onUpdate,
}: {
    hallazgo: Hallazgo;
    onUpdate: (id: string, mitigado: boolean, comentario: string | null) => Promise<void>;
}) {
    const [editando, setEditando] = useState(false);
    const [borrador, setBorrador] = useState(hallazgo.comentarioMitigacion ?? "");
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const marcarNo = async () => {
        setGuardando(true);
        setError(null);
        try {
            await onUpdate(hallazgo.id, false, null);
            setEditando(false);
        } catch {
            setError("No se pudo guardar. Intenta de nuevo.");
        } finally {
            setGuardando(false);
        }
    };

    const iniciarSi = () => {
        setBorrador(hallazgo.comentarioMitigacion ?? "");
        setError(null);
        setEditando(true);
    };

    const guardarSi = async () => {
        if (!borrador.trim()) {
            setError("Cuéntanos cómo se mitigó antes de guardar — es obligatorio.");
            return;
        }
        setGuardando(true);
        setError(null);
        try {
            await onUpdate(hallazgo.id, true, borrador.trim());
            setEditando(false);
        } catch {
            setError("No se pudo guardar. Intenta de nuevo.");
        } finally {
            setGuardando(false);
        }
    };

    return (
        <div className="mt-3 border-t pt-3">
            <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-muted-foreground">¿Se mitigó?</span>
                <div className="flex gap-1.5">
                    <button
                        onClick={iniciarSi}
                        disabled={guardando}
                        className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition ${
                            hallazgo.mitigado === true ? "bg-brand text-white" : "border text-muted-foreground hover:bg-accent"
                        }`}
                    >
                        Sí
                    </button>
                    <button
                        onClick={marcarNo}
                        disabled={guardando}
                        className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition ${
                            hallazgo.mitigado === false ? "bg-destructive text-white" : "border text-muted-foreground hover:bg-accent"
                        }`}
                    >
                        No
                    </button>
                </div>
            </div>

            {hallazgo.mitigado === true && !editando && (
                <div className="mt-2 rounded-lg bg-brand-soft/60 p-2.5 text-xs text-brand">
                    <div className="font-semibold">Cómo se mitigó</div>
                    <p className="mt-0.5 whitespace-pre-wrap">{hallazgo.comentarioMitigacion}</p>
                    <button onClick={iniciarSi} className="mt-1.5 text-[11px] font-medium underline">Editar</button>
                </div>
            )}

            {editando && (
                <div className="mt-2">
                    <textarea
                        value={borrador}
                        onChange={(e) => setBorrador(e.target.value)}
                        placeholder="Describe cómo se mitigó este hallazgo (obligatorio)…"
                        rows={3}
                        className="w-full rounded-lg border p-2 text-xs outline-none focus:border-brand"
                    />
                    <div className="mt-1.5 flex items-center justify-between gap-2">
                        {error ? <span className="text-[11px] text-destructive">{error}</span> : <span />}
                        <div className="ml-auto flex shrink-0 gap-1.5">
                            <button
                                onClick={() => { setEditando(false); setError(null); }}
                                className="rounded-md border px-2.5 py-1 text-[11px] font-medium hover:bg-accent"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={guardarSi}
                                disabled={guardando}
                                className="rounded-md bg-brand px-2.5 py-1 text-[11px] font-semibold text-white transition hover:bg-brand/90 disabled:opacity-50"
                            >
                                {guardando ? "Guardando…" : "Guardar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function HallazgosPage() {
    const [hallazgos, setHallazgos] = useState<Hallazgo[] | null>(null);

    useEffect(() => {
        let mounted = true;
        fetch("/api/hallazgos")
            .then((r) => (r.ok ? r.json() : Promise.reject(r.statusText)))
            .then((data) => mounted && setHallazgos(data))
            .catch(() => {
                /* queda en null: se muestra el estado vacío */
            });
        return () => {
            mounted = false;
        };
    }, []);

    // Optimista: se refleja de inmediato en pantalla; si el servidor rechaza el cambio, se revierte.
    const actualizarMitigacion = async (id: string, mitigado: boolean, comentario: string | null) => {
        const anteriores = hallazgos;
        setHallazgos((prev) => prev?.map((h) => (h.id === id ? { ...h, mitigado, comentarioMitigacion: comentario } : h)) ?? prev);
        const res = await fetch("/api/hallazgos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, mitigado, comentario }),
        });
        if (!res.ok) {
            setHallazgos(anteriores);
            throw new Error("No se pudo actualizar la mitigación");
        }
    };

    const actualizarPaso = async (id: string, paso: Paso, valor: boolean) => {
        const anteriores = hallazgos;
        setHallazgos((prev) => prev?.map((h) => (h.id === id ? { ...h, [paso === "identifico" ? "pasoIdentifico" : paso === "agenda" ? "pasoAgenda" : "pasoSoluciono"]: valor } : h)) ?? prev);
        const res = await fetch("/api/hallazgos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, paso, valor }),
        });
        if (!res.ok) setHallazgos(anteriores);
    };

    const marcarAgendado = (actualizado: Hallazgo) => {
        setHallazgos((prev) => prev?.map((h) => (h.id === actualizado.id ? actualizado : h)) ?? prev);
    };

    return (
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
            <PageHeader
                eyebrow="CES AUDITOR"
                title="Hallazgos de Auditoría"
                description="Encontrados por CES AUDITOR durante las auditorías conversacionales."
                actions={
                    <Link to="/guardian" className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5 text-xs font-medium hover:bg-accent">
                        <ArrowLeft className="h-3.5 w-3.5" /> CES AUDITOR
                    </Link>
                }
            />

            {hallazgos === null && (
                <div className="mt-8 text-sm text-muted-foreground">Cargando hallazgos…</div>
            )}

            {hallazgos !== null && hallazgos.length === 0 && (
                <div className="mt-8 rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                    Todavía no hay hallazgos registrados. Se registran automáticamente cuando CES AUDITOR encuentra
                    una no conformidad durante una auditoría conversacional.
                </div>
            )}

            {hallazgos && hallazgos.length > 0 && (
                <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {hallazgos.map((h) => (
                        <Card key={h.id} className="border-border/60">
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{h.proceso}</div>
                                    {h.nivelRiesgo && <Badge className={nivelTone(h.nivelRiesgo)}>{h.nivelRiesgo}</Badge>}
                                </div>
                                <div className="mt-1.5 text-sm font-semibold">{h.titulo}</div>
                                <p className="mt-1 text-xs text-muted-foreground">{h.descripcion}</p>

                                {h.recomendacion && (
                                    <div className="mt-3 flex gap-1.5 rounded-lg bg-brand-soft/60 p-2.5 text-xs text-brand">
                                        <Lightbulb className="h-3.5 w-3.5 shrink-0" />
                                        <span>{h.recomendacion}</span>
                                    </div>
                                )}

                                {h.evidenciaUbicacion && (
                                    <div className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                        <MapPin className="h-3 w-3 shrink-0" /> {h.evidenciaUbicacion}
                                    </div>
                                )}

                                <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                                    <span>{h.estado}</span>
                                    <span className={`flex items-center gap-1 ${h.responsable ? "font-semibold text-orange-600" : ""}`}>
                                        <User className="h-3 w-3" /> {h.responsable ?? "—"}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <CalendarDays className="h-3 w-3" /> {new Date(h.creadoEn).toLocaleDateString("es")}
                                    </span>
                                </div>

                                <SeguimientoChecklist hallazgo={h} onToggle={(paso, valor) => actualizarPaso(h.id, paso, valor)} />
                                <AgendarReunion hallazgo={h} onAgendado={marcarAgendado} />

                                <MitigacionControl hallazgo={h} onUpdate={actualizarMitigacion} />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
