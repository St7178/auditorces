import { createFileRoute } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithApprovalResponses } from "ai";
import { useEffect, useRef, useState } from "react";
import { Sparkles, Send, Loader2, ShieldCheck, Search, CheckCircle2, XCircle, CalendarPlus, FileCheck2, ClipboardCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ChatMarkdown } from "@/components/chat-markdown";
import { Route as AuthenticatedRoute } from "@/routes/_authenticated";
import { MAPA_PROCESOS_CES, CATEGORIA_COLOR } from "@/lib/ces-data";

const TOOL_LABELS: Record<string, string> = {
    consultarRiesgos: "Riesgos CES",
    consultarIndicadores: "Indicadores CES",
    consultarClientes: "Clientes CES",
    consultarProcesos: "Procesos CES",
    consultarDocumentacion: "Documentación",
};

function ToolPart({ part, onApprove }: { part: any; onApprove: (id: string, approved: boolean) => void }) {
    const toolName = String(part.type).replace(/^tool-/, "");

    if (toolName === "proponerHallazgo") {
        const input = part.input || {};
        if (part.state === "output-available") {
            return (
                <div className="rounded-xl border border-brand/30 bg-brand-soft p-3 text-xs text-brand">
                    <div className="flex items-center gap-1.5 font-semibold">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> Hallazgo guardado automáticamente en el dashboard
                    </div>
                    <div className="mt-1.5 space-y-1 text-brand/90">
                        {input.proceso && <div><strong>Proceso:</strong> {input.proceso}</div>}
                        {input.titulo && <div className="font-semibold">{input.titulo}</div>}
                        {input.nivelRiesgo && <div><strong>Nivel de riesgo:</strong> {input.nivelRiesgo}</div>}
                    </div>
                </div>
            );
        }
        if (part.state === "input-streaming" || part.state === "input-available") {
            return (
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" /> Registrando hallazgo…
                </div>
            );
        }
        return null;
    }

    if (toolName === "generarInformeAuditoria") {
        const input = part.input || {};
        if (part.state === "output-available") {
            return (
                <div className="rounded-xl border border-brand/30 bg-card p-4 text-xs">
                    <div className="flex items-center gap-1.5 font-semibold text-brand">
                        <ClipboardCheck className="h-4 w-4 shrink-0" /> Informe de Auditoría
                    </div>
                    {input.proceso && (
                        <div className="mt-1.5 inline-flex items-center rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-semibold text-brand">
                            Proceso auditado: {input.proceso}
                        </div>
                    )}
                    {input.resumenEjecutivo && <p className="mt-2 text-muted-foreground">{input.resumenEjecutivo}</p>}
                    <div className="mt-2">
                        <strong>Hallazgos registrados:</strong> {input.hallazgosRegistrados ?? 0}
                    </div>
                    {input.recomendaciones?.length > 0 && (
                        <div className="mt-2">
                            <div className="font-semibold">Recomendaciones</div>
                            <ul className="mt-1 list-disc space-y-0.5 pl-4 text-muted-foreground">
                                {input.recomendaciones.map((r: string, i: number) => (
                                    <li key={i}>{r}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            );
        }
        if (part.state === "input-streaming" || part.state === "input-available") {
            return (
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" /> Generando informe de auditoría…
                </div>
            );
        }
        return null;
    }

    if (toolName === "agendarReunion") {
        const input = part.input || {};
        const fmt = (iso?: string) => (iso ? new Date(iso).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" }) : "");
        if (part.state === "approval-requested") {
            return (
                <div className="rounded-xl border border-amber-300/60 bg-amber-50 p-3 text-xs text-amber-900">
                    <div className="flex items-center gap-1.5 font-semibold">
                        <CalendarPlus className="h-3.5 w-3.5" /> Reunión a agendar — requiere tu confirmación
                    </div>
                    <div className="mt-1.5 space-y-1">
                        {input.titulo && <div className="font-semibold">{input.titulo}</div>}
                        {input.startIso && <div><strong>Cuándo:</strong> {fmt(input.startIso)} — {fmt(input.endIso)}</div>}
                        {input.descripcion && <div>{input.descripcion}</div>}
                        {input.invitados?.length > 0 && <div><strong>Invitados:</strong> {input.invitados.join(", ")}</div>}
                        <div><strong>Teams:</strong> {input.reunionTeams === false ? "No" : "Sí"}</div>
                    </div>
                    <div className="mt-2 flex gap-2">
                        <button
                            onClick={() => onApprove(part.approval.id, true)}
                            className="rounded-lg bg-brand px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-brand/90"
                        >
                            Aprobar y agendar
                        </button>
                        <button
                            onClick={() => onApprove(part.approval.id, false)}
                            className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-[11px] font-semibold text-amber-900 hover:bg-amber-100"
                        >
                            Descartar
                        </button>
                    </div>
                </div>
            );
        }
        if (part.state === "output-available") {
            const webLink = part.output?.evento?.webLink;
            return (
                <div className="flex items-center gap-1.5 rounded-lg bg-brand-soft px-3 py-1.5 text-xs text-brand">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> Reunión agendada{input.titulo ? `: ${input.titulo}` : ""}
                    {webLink && (
                        <a href={webLink} target="_blank" rel="noopener noreferrer" className="ml-1 underline">
                            Ver en Outlook
                        </a>
                    )}
                </div>
            );
        }
        if (part.state === "output-denied") {
            return (
                <div className="flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5 text-xs text-muted-foreground">
                    <XCircle className="h-3.5 w-3.5 shrink-0" /> Reunión descartada{input.titulo ? `: ${input.titulo}` : ""}
                </div>
            );
        }
        return null;
    }

    // Herramientas de solo lectura: un indicador mínimo, sin volcar el JSON crudo al chat.
    const label = TOOL_LABELS[toolName] || toolName;
    if (part.state === "output-available") {
        return (
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Search className="h-3 w-3" /> {label} consultado
            </div>
        );
    }
    if (part.state === "input-streaming" || part.state === "input-available") {
        return (
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" /> Consultando {label}…
            </div>
        );
    }
    return null;
}

export const Route = createFileRoute("/_authenticated/guardian")({
    component: GuardianPage,
    head: () => ({
        meta: [
            { title: "CES Guardian IA — CES SIG" },
            { name: "description", content: "Asistente inteligente de calidad y auditoría para el área CES." },
        ],
    }),
});

const MODOS = [
    { id: "principiante", label: "🟢 Principiante" },
    { id: "intermedio", label: "🟡 Intermedio" },
    { id: "avanzado", label: "🔵 Avanzado" },
] as const;

const MODO_ESTILO: Record<(typeof MODOS)[number]["id"], string> = {
    principiante: "border-emerald-300 bg-emerald-100 text-emerald-800",
    intermedio: "border-amber-300 bg-amber-100 text-amber-800",
    avanzado: "border-blue-300 bg-blue-100 text-blue-800",
};

const NORMA_LABEL: Record<"iso9001" | "iso27001", string> = {
    iso9001: "ISO 9001:2015 (Sistema de Gestión de Calidad)",
    iso27001: "ISO/IEC 27001:2013 (Seguridad de la Información)",
};

// Descripción del modo que se muestra en el estado vacío del chat, para que quede claro qué esperar
// antes de iniciar — se recalcula sola cuando cambia `modo` o `norma` porque se arma en el render.
const MODO_INFO: Record<(typeof MODOS)[number]["id"], { titulo: string; ideal: string; puntos: (norma: "iso9001" | "iso27001") => string[] }> = {
    principiante: {
        titulo: "🟢 Modo Principiante",
        ideal: "Ideal para personas nuevas o con poco conocimiento del Sistema Integrado de Gestión.",
        puntos: (norma) => [
            "Explica cada pregunta antes de realizarla.",
            "Utiliza un lenguaje sencillo.",
            "Da ejemplos prácticos.",
            `Explica conceptos de ${NORMA_LABEL[norma]}.`,
            "Indica por qué la pregunta es importante.",
        ],
    },
    intermedio: {
        titulo: "🟡 Modo Intermedio",
        ideal: "Ideal para personas que conocen los procesos, pero requieren apoyo durante la auditoría.",
        puntos: () => [
            "Hace preguntas más directas.",
            "Explica únicamente cuando el usuario lo solicita.",
            "Profundiza en requisitos específicos.",
        ],
    },
    avanzado: {
        titulo: "🔵 Modo Avanzado",
        ideal: "Ideal para coordinadores o personal con experiencia en auditorías y Sistemas Integrados de Gestión.",
        puntos: () => [
            "Realiza una auditoría técnica.",
            "Formula preguntas orientadas a evidencias.",
            "Evalúa el cumplimiento de los requisitos aplicables.",
            "Reduce las explicaciones para hacer la auditoría más ágil.",
        ],
    },
};

// Selector de proceso a auditar, agrupado por categoría igual que en /procesos — se toma directo de
// MAPA_PROCESOS_CES para que nunca quede desincronizado del filtro real que usa el backend. Se usa tanto
// en el estado vacío inicial como al terminar una auditoría (botón "¿Quieres auditar otro proceso?").
function ProcesoPicker({ onPick }: { onPick: (proceso: string) => void }) {
    return (
        <div className="space-y-4">
            {MAPA_PROCESOS_CES.map((cat) => {
                const color = CATEGORIA_COLOR[cat.categoria];
                return (
                    <div key={cat.categoria}>
                        <div
                            className="mb-1.5 inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold"
                            style={color ? { backgroundColor: color.bg, color: color.fg } : undefined}
                        >
                            {cat.categoria}
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                            {cat.procesos.map((p) => (
                                <button
                                    key={p}
                                    onClick={() => onPick(p)}
                                    className="rounded-xl border bg-card p-3 text-left text-sm transition hover:border-brand hover:bg-brand-soft/40"
                                >
                                    <div className="font-medium">{p}</div>
                                    <div className="text-[11px] text-muted-foreground">Iniciar auditoría conversacional</div>
                                </button>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function GuardianPage() {
    const { user } = AuthenticatedRoute.useRouteContext();
    const firstName = user?.name?.split(" ")[0] ?? "Usuario";
    const userInitials = user?.name
        ? user.name.split(" ").filter(Boolean).slice(0, 2).map((n) => n[0]).join("").toUpperCase()
        : "US";
    const [input, setInput] = useState("");
    const [norma, setNorma] = useState<"iso9001" | "iso27001">("iso9001");
    const [modo, setModo] = useState<"principiante" | "intermedio" | "avanzado">("intermedio");
    const { messages, sendMessage, addToolApprovalResponse, status, setMessages, stop } = useChat({
        transport: new DefaultChatTransport({ api: "/api/chat", body: { norm: norma, modo } }),
        sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
    });
    const endRef = useRef<HTMLDivElement>(null);
    const loading = status === "submitted" || status === "streaming";

    const handleApprove = (approvalId: string, approved: boolean) => {
        void addToolApprovalResponse({ id: approvalId, approved });
    };

    // Cambiar de modo a mitad de una auditoría cambia por completo cómo debe preguntar el asistente —
    // seguir la conversación vieja con reglas nuevas quedaría inconsistente, así que se reinicia el chat.
    const handleModoChange = (nuevo: typeof modo) => {
        if (nuevo === modo) return;
        if (messages.length > 0) {
            if (loading) void stop();
            setMessages([]);
        }
        setModo(nuevo);
    };

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, status]);

    const submit = (text?: string) => {
        const t = (text ?? input).trim();
        if (!t || loading) return;
        void sendMessage({ text: t });
        setInput("");
    };

    const empty = messages.length === 0;

    // Cuando el último mensaje del asistente ya cerró la auditoría (generarInformeAuditoria con salida
    // disponible), se vuelve a mostrar el selector de proceso para poder auditar otro sin recargar la página.
    const lastMessage = messages[messages.length - 1];
    const auditoriaFinalizada =
        !loading &&
        lastMessage?.role === "assistant" &&
        lastMessage.parts.some((p: any) => p.type === "tool-generarInformeAuditoria" && p.state === "output-available");

    return (
        <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-5xl flex-col px-4 py-6 sm:px-6">
            {/* Header */}
            <div className="mb-4 flex flex-wrap items-start gap-4">
                <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/90 text-brand shadow-sm shadow-slate-200 border border-slate-200">
                    <Sparkles className="h-7 w-7" />
                    <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-white text-brand shadow-sm shadow-slate-200">
                        <ShieldCheck className="h-3 w-3" />
                    </span>
                </div>
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="truncate text-2xl font-bold">CES AUDITOR</h1>
                        <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-semibold text-brand">
                            <span className="h-1.5 w-1.5 rounded-full bg-brand" /> En línea
                        </span>
                        <span className={`inline-flex items-center gap-1 rounded-full border-2 px-3 py-1 text-xs font-bold shadow-sm ${MODO_ESTILO[modo]}`}>
                            Modo actual: {MODOS.find((m) => m.id === modo)?.label}
                        </span>
                    </div>
                    <p className="text-sm text-muted-foreground">Tu asistente inteligente de calidad y auditoría · SIG</p>
                </div>

                <div className="ml-auto flex flex-wrap items-center gap-2">
                    <div className="flex shrink-0 items-center gap-1.5 rounded-xl border bg-card p-1">
                        {(
                            [
                                { id: "iso9001", label: "ISO 9001" },
                                { id: "iso27001", label: "ISO 27001" },
                            ] as const
                        ).map((n) => (
                            <button
                                key={n.id}
                                onClick={() => setNorma(n.id)}
                                className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                    norma === n.id ? "bg-brand text-white" : "text-muted-foreground hover:bg-muted"
                                }`}
                            >
                                <FileCheck2 className="h-3.5 w-3.5" /> {n.label}
                            </button>
                        ))}
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5 rounded-xl border bg-card p-1">
                        {MODOS.map((m) => (
                            <button
                                key={m.id}
                                onClick={() => handleModoChange(m.id)}
                                aria-pressed={modo === m.id}
                                className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                    modo === m.id
                                        ? "bg-brand text-white ring-2 ring-brand/40 ring-offset-1"
                                        : "text-muted-foreground hover:bg-muted"
                                }`}
                            >
                                {modo === m.id && <CheckCircle2 className="h-3.5 w-3.5" />} {m.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Chat body */}
            <Card className="flex flex-1 flex-col overflow-hidden border-border/60">
                <div className="flex-1 overflow-y-auto px-6 py-6">
                    {empty ? (
                        <div className="mx-auto max-w-2xl">
                            <div className="rounded-2xl border bg-gradient-to-br from-brand-soft to-secondary p-6">
                                <p className="text-sm leading-relaxed">
                                    Hola <strong>{firstName}</strong> 👋, soy CES Auditor. Estoy aquí para ayudarte en la gestión del área CES.<br /><br />
                                    Puedo acompañarte en auditorías, resolver dudas sobre los procesos, explicarte los requisitos de ISO 9001 e ISO/IEC 27001, ayudarte a encontrar información y recomendar mejoras.
                                </p>

                                <div className="mt-4 border-t border-brand/20 pt-4">
                                    <div className="text-sm font-semibold">{MODO_INFO[modo].titulo}</div>
                                    <p className="mt-1 text-sm text-muted-foreground">{MODO_INFO[modo].ideal}</p>
                                    <div className="mt-2 text-xs font-semibold text-foreground">El CES Auditor:</div>
                                    <ul className="mt-1 space-y-1 text-sm">
                                        {MODO_INFO[modo].puntos(norma).map((p) => (
                                            <li key={p} className="flex items-start gap-2">
                                                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand" /> {p}
                                            </li>
                                        ))}
                                    </ul>
                                    <div className="mt-3 text-xs text-muted-foreground">
                                        <strong className="text-foreground">Norma aplicada en esta auditoría:</strong> {NORMA_LABEL[norma]}.
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6">
                                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Antes de iniciar: selecciona el proceso</div>
                                <ProcesoPicker onPick={(p) => submit(`Quiero auditar el proceso: ${p}, con base en los procesos y documentos registrados en Procesos CES.`)} />
                            </div>
                        </div>
                    ) : (
                        <div className="mx-auto max-w-3xl space-y-5">
                            {messages.map((m) => {
                                const text = m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
                                const isUser = m.role === "user";
                                return (
                                    <div key={m.id} className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
                                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${isUser ? "bg-secondary text-secondary-foreground" : "gradient-brand text-white"}`}>
                                            {isUser ? userInitials : <Sparkles className="h-4 w-4" />}
                                        </div>
                                        <div className={`max-w-[80%] space-y-2 rounded-2xl px-4 py-3 text-sm leading-relaxed ${isUser ? "bg-brand text-white" : "bg-muted/60"}`}>
                                            {isUser ? (
                                                text
                                            ) : (
                                                m.parts.map((p, idx) => {
                                                    if (p.type === "text") return p.text ? <ChatMarkdown key={idx} text={p.text} /> : null;
                                                    if (String(p.type).startsWith("tool-")) return <ToolPart key={idx} part={p} onApprove={handleApprove} />;
                                                    return null;
                                                })
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                            {loading && (
                                <div className="flex gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-brand text-white">
                                        <Sparkles className="h-4 w-4" />
                                    </div>
                                    <div className="rounded-2xl bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
                                        <Loader2 className="inline h-3 w-3 animate-spin" /> Analizando…
                                    </div>
                                </div>
                            )}
                            {auditoriaFinalizada && (
                                <div className="rounded-2xl border bg-gradient-to-br from-brand-soft to-secondary p-4">
                                    <div className="mb-3 text-sm font-semibold text-brand">¿Quieres auditar otro proceso?</div>
                                    <ProcesoPicker onPick={(p) => submit(`Quiero auditar el proceso: ${p}, con base en los procesos y documentos registrados en Procesos CES.`)} />
                                </div>
                            )}
                            <div ref={endRef} />
                        </div>
                    )}
                </div>

                {/* Composer */}
                <div className="border-t bg-card/70 p-4 backdrop-blur">
                    <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border bg-background p-2 shadow-sm focus-within:border-brand">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
                            }}
                            placeholder="Escribe tu mensaje a CES Guardian…"
                            rows={1}
                            className="max-h-40 min-h-[40px] flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none"
                        />
                        <button
                            onClick={() => submit()}
                            disabled={loading || !input.trim()}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl gradient-brand text-white transition disabled:opacity-40"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </button>
                    </div>
                    <div className="mx-auto mt-2 max-w-3xl text-center text-[10px] text-muted-foreground">
                        CES AUDITOR nunca almacena documentos confidenciales.
                    </div>
                </div>
            </Card>
        </div>
    );
}
