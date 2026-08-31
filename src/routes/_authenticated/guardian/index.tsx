import { createFileRoute, Link } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithApprovalResponses, type UIMessage } from "ai";
import { useEffect, useRef, useState } from "react";
import {
    Sparkles, Send, Loader2, ShieldCheck, Search, CheckCircle2, XCircle, CalendarPlus, FileCheck2,
    ClipboardCheck, ClipboardList, MessageSquarePlus, MessagesSquare, FileText, ListChecks,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { GridBackground } from "@/components/ui/grid-background";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ChatMarkdown } from "@/components/chat-markdown";
import { Route as AuthenticatedRoute } from "@/routes/_authenticated";

const TOOL_LABELS: Record<string, string> = {
    consultarRiesgos: "Riesgos CES",
    consultarClientes: "Clientes CES",
};

// Campo de respuesta libre bajo las opciones de preguntarOpciones — colapsado hasta que se necesita,
// para que el caso común (elegir un botón) no compita visualmente con un input de texto.
function OtraRespuesta({ onSubmit, disabled }: { onSubmit: (text: string) => void; disabled: boolean }) {
    const [abierto, setAbierto] = useState(false);
    const [texto, setTexto] = useState("");

    if (!abierto) {
        return (
            <button
                disabled={disabled}
                onClick={() => setAbierto(true)}
                className="mt-2 text-[11px] font-medium text-muted-foreground underline decoration-dotted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
                Escribir otra respuesta
            </button>
        );
    }

    const enviar = () => {
        const t = texto.trim();
        if (!t) return;
        onSubmit(t);
        setTexto("");
        setAbierto(false);
    };

    return (
        <div className="mt-2 flex items-center gap-1.5">
            <input
                autoFocus
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") enviar(); }}
                disabled={disabled}
                placeholder="Escribe tu respuesta…"
                className="min-w-0 flex-1 rounded-lg border bg-background px-2.5 py-1.5 text-xs outline-none focus:border-brand disabled:opacity-50"
            />
            <button
                onClick={enviar}
                disabled={disabled || !texto.trim()}
                className="rounded-lg bg-brand px-2.5 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
            >
                Enviar
            </button>
        </div>
    );
}

function ToolPart({
    part, onApprove, onOption, interactive,
}: {
    part: any;
    onApprove: (id: string, approved: boolean) => void;
    onOption: (text: string) => void;
    interactive: boolean;
}) {
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

    if (toolName === "preguntarOpciones") {
        const input = part.input || {};
        if (part.state !== "output-available" && part.state !== "input-available") {
            return (
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" /> Preparando pregunta…
                </div>
            );
        }
        // Filtro de seguridad: una opción es el texto de un botón, no un párrafo — si el modelo
        // manda algo desproporcionado (viola el max(60) del schema, o llega a medio transmitir),
        // se descarta en vez de renderizar un botón gigante con contenido ilegible.
        const opciones: string[] = (Array.isArray(input.opciones) ? input.opciones : []).filter(
            (op: unknown): op is string => typeof op === "string" && op.length > 0 && op.length <= 80,
        );
        return (
            <div className="rounded-xl border border-brand/30 bg-card p-3.5 text-sm">
                <div className="flex items-start gap-1.5 font-medium text-foreground">
                    <ListChecks className="mt-0.5 h-4 w-4 shrink-0 text-brand" /> {input.pregunta}
                </div>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {opciones.map((op: string) => (
                        <button
                            key={op}
                            disabled={!interactive}
                            onClick={() => onOption(op)}
                            className="rounded-lg border border-brand/40 bg-brand-soft px-3 py-1.5 text-xs font-semibold text-brand transition hover:bg-brand hover:text-white disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-brand-soft disabled:hover:text-brand"
                        >
                            {op}
                        </button>
                    ))}
                </div>
                {input.permiteOtro !== false && (
                    <OtraRespuesta onSubmit={onOption} disabled={!interactive} />
                )}
            </div>
        );
    }

    if (toolName === "consultarDocumentacion") {
        if (part.state === "input-streaming" || part.state === "input-available") {
            return (
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" /> Consultando Documentación…
                </div>
            );
        }
        if (part.state !== "output-available") return null;
        const documentos: any[] = Array.isArray(part.output?.documentos) ? part.output.documentos : [];
        if (documentos.length === 0) {
            return (
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <FileText className="h-3 w-3" /> Documentación consultada — sin documentos{part.output?.proceso ? ` para ${part.output.proceso}` : ""}.
                </div>
            );
        }
        return (
            <div className="overflow-hidden rounded-xl border">
                <div className="flex items-center gap-1.5 border-b bg-muted/40 px-3 py-2 text-[11px] font-semibold text-muted-foreground">
                    <FileText className="h-3.5 w-3.5" /> Documentos encontrados{part.output?.proceso ? ` · ${part.output.proceso}` : ""} ({documentos.length})
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-[11px]">
                        <thead className="bg-muted/20 text-[10px] uppercase tracking-wide text-muted-foreground">
                            <tr>
                                <th className="px-3 py-1.5 text-left">Código</th>
                                <th className="px-3 py-1.5 text-left">Nombre</th>
                                <th className="px-3 py-1.5 text-left">Actualización</th>
                                <th className="px-3 py-1.5 text-left">Ubicación</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {documentos.map((d, i) => (
                                <tr key={d.codigo ?? i}>
                                    <td className="whitespace-nowrap px-3 py-1.5 font-mono text-muted-foreground">{d.codigo ?? "—"}</td>
                                    <td className="px-3 py-1.5 font-medium">{d.nombre ?? "—"}</td>
                                    <td className="whitespace-nowrap px-3 py-1.5 text-muted-foreground">{d.actualizacion ?? "—"}</td>
                                    <td className="px-3 py-1.5 text-muted-foreground">{d.ubicacion ?? "—"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
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

export const Route = createFileRoute("/_authenticated/guardian/")({
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

// Fondo de la tarjeta de bienvenida en el estado vacío del chat — cambia con el modo para que se sienta
// como "entrar" a ese modo, no solo un badge chico.
const MODO_TARJETA: Record<(typeof MODOS)[number]["id"], string> = {
    principiante: "border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100/70",
    intermedio: "border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100/70",
    avanzado: "border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/70",
};

const MODO_DIVISOR: Record<(typeof MODOS)[number]["id"], string> = {
    principiante: "border-emerald-300/50",
    intermedio: "border-amber-300/50",
    avanzado: "border-blue-300/50",
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

// Frase que dispara, del lado del backend, el flujo de elegir proceso vía preguntarOpciones con el
// mapa de procesos ya inyectado en el prompt (ver SYSTEM_PROMPT/PROCESOS_BLOCK en api/chat.ts).
const MENSAJE_PREPARAR_AUDITORIA = "Quiero prepararme para una auditoría. Ayúdame a elegir qué proceso auditar.";

// El modelo a veces repite en texto plano la misma lista de procesos que ya viene en la tarjeta de
// preguntarOpciones (a pesar de que el prompt se lo pide explícitamente) — como esto no se puede
// garantizar solo con instrucciones, se detecta acá el turno del selector de proceso (el mensaje de
// usuario inmediatamente anterior es exactamente MENSAJE_PREPARAR_AUDITORIA) para ocultar cualquier
// texto que lo acompañe y dejar únicamente la tarjeta con los botones.
function textoPrevioUsuario(messages: UIMessage[], idx: number): string {
    for (let i = idx - 1; i >= 0; i--) {
        if (messages[i].role === "user") {
            return messages[i].parts.map((p) => (p.type === "text" ? p.text : "")).join("");
        }
    }
    return "";
}

// Mismo problema, un paso más adelante: al arrancar una auditoría, el modelo a veces también repite
// en texto los documentos que consultarDocumentacion ya muestra en su propia tarjeta, justo antes de
// la primera pregunta con preguntarOpciones. Cuando un mismo mensaje trae AMBAS herramientas (la
// tabla de documentos y la tarjeta de la pregunta), ese texto siempre es prescindible — las dos
// tarjetas ya dicen todo lo que hace falta — así que se oculta y solo quedan las tarjetas.
function debeOcultarTextoLibre(messages: UIMessage[], idx: number): boolean {
    const m = messages[idx];
    if (m.role !== "assistant") return false;
    if (textoPrevioUsuario(messages, idx).trim() === MENSAJE_PREPARAR_AUDITORIA) return true;
    const tieneDocumentos = m.parts.some((p: any) => p.type === "tool-consultarDocumentacion" && p.state === "output-available");
    const tieneOpciones = m.parts.some((p: any) => p.type === "tool-preguntarOpciones");
    return tieneDocumentos && tieneOpciones;
}

// Tercer (y cuarto) patrón de duplicación, más sutiles: el texto que antecede a la PRIMERA
// preguntarOpciones puede ser legítimo (la explicación del modo Principiante), pero nada de lo que
// venga después lo es — ni texto repitiendo las opciones, ni (a veces) una segunda llamada a
// preguntarOpciones casi idéntica en el mismo mensaje. El turno debe terminar en esa primera
// tarjeta, así que se recorta TODO lo que venga después de ella (no solo el texto), dejando intacto
// lo que la antecede.
function recortarTextoTrasOpciones(parts: readonly any[]): any[] {
    const idxPrimeraPregunta = parts.findIndex((p: any) => p.type === "tool-preguntarOpciones");
    if (idxPrimeraPregunta === -1) return parts as any[];
    return parts.filter((_, i) => i <= idxPrimeraPregunta);
}

// El backend no emite una señal explícita de "en qué fase va la auditoría" — se infiere del lado del
// cliente con señales ya disponibles (si hay conversación, si ya se guardó algún hallazgo, si ya se
// generó el informe final). Es aproximado a propósito: sirve como indicador visual de progreso, no
// como una máquina de estados que gobierne el flujo real de la conversación.
const PASOS = [
    { id: "proceso", label: "Proceso" },
    { id: "preguntas", label: "Preguntas" },
    { id: "hallazgos", label: "Hallazgos" },
    { id: "informe", label: "Informe" },
] as const;

function Stepper({ pasoActualIndex, onStepClick }: { pasoActualIndex: number; onStepClick: (idx: number) => void }) {
    return (
        <div className="mb-5 flex items-center gap-1.5">
            {PASOS.map((p, i) => {
                const alcanzado = i <= pasoActualIndex;
                const actual = i === pasoActualIndex;
                const completado = alcanzado && i < pasoActualIndex;
                return (
                    <div key={p.id} className="flex flex-1 items-center gap-1.5 last:flex-none">
                        <button
                            onClick={() => alcanzado && onStepClick(i)}
                            disabled={!alcanzado}
                            className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                                actual
                                    ? "border-brand bg-brand text-white shadow-sm"
                                    : alcanzado
                                    ? "cursor-pointer border-brand/40 bg-brand-soft text-brand hover:bg-brand/10"
                                    : "cursor-default border-border bg-muted/30 text-muted-foreground"
                            }`}
                        >
                            {completado ? (
                                <CheckCircle2 className="h-3.5 w-3.5" />
                            ) : (
                                <span className={`h-1.5 w-1.5 rounded-full ${actual ? "animate-pulse bg-white" : alcanzado ? "bg-brand" : "bg-muted-foreground/40"}`} />
                            )}
                            {p.label}
                        </button>
                        {i < PASOS.length - 1 && <div className={`h-0.5 flex-1 rounded ${i < pasoActualIndex ? "bg-brand/40" : "bg-border"}`} />}
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
    // Historial de chats de esta sesión (no se persiste — solo para poder ver/volver a conversaciones
    // anteriores mientras la pestaña siga abierta; se pierde al recargar, y eso está bien por ahora).
    const [chats, setChats] = useState<{ id: string; title: string; messages: UIMessage[] }[]>([]);
    const { messages, sendMessage, addToolApprovalResponse, status, setMessages, stop } = useChat({
        transport: new DefaultChatTransport({ api: "/api/chat", body: { norm: norma, modo } }),
        sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
    });
    const endRef = useRef<HTMLDivElement>(null);
    const historialRef = useRef<HTMLDivElement>(null);
    const primerHallazgoRef = useRef<HTMLDivElement | null>(null);
    const [historialAbierto, setHistorialAbierto] = useState(false);
    const loading = status === "submitted" || status === "streaming";

    const handleApprove = (approvalId: string, approved: boolean) => {
        void addToolApprovalResponse({ id: approvalId, approved });
    };

    // Reinicia la conversación activa, guardándola primero en el historial de la sesión si tenía algo.
    const reiniciarChat = () => {
        if (loading) void stop();
        if (messages.length > 0) {
            const primerMensaje = messages.find((m) => m.role === "user");
            const texto = primerMensaje?.parts.find((p): p is { type: "text"; text: string } => p.type === "text")?.text ?? "Conversación";
            setChats((prev) => [...prev, { id: crypto.randomUUID(), title: texto.length > 42 ? `${texto.slice(0, 42)}…` : texto, messages }]);
        }
        setMessages([]);
        setInput("");
        setHistorialAbierto(false);
        primerHallazgoRef.current = null;
    };

    // Vuelve a mostrar una conversación anterior de esta sesión (la quita de la lista para no
    // duplicarla mientras está activa — si se inicia otro chat nuevo, vuelve a archivarse).
    const abrirChatAnterior = (id: string) => {
        const chat = chats.find((c) => c.id === id);
        if (!chat) return;
        if (loading) void stop();
        if (messages.length > 0) reiniciarChat();
        setChats((prev) => prev.filter((c) => c.id !== id));
        setMessages(chat.messages);
    };

    // Cambiar de modo o de norma a mitad de una auditoría cambia por completo cómo debe preguntar el
    // asistente y bajo qué norma — seguir la conversación vieja con reglas nuevas quedaría
    // inconsistente (las respuestas ya dadas no se re-evalúan), así que se reinicia el chat.
    const handleModoChange = (nuevo: typeof modo) => {
        if (nuevo === modo) return;
        if (messages.length > 0) reiniciarChat();
        setModo(nuevo);
    };

    const handleNormaChange = (nueva: typeof norma) => {
        if (nueva === norma) return;
        if (messages.length > 0) reiniciarChat();
        setNorma(nueva);
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

    // Progreso aproximado de la auditoría, solo para el stepper visual (ver comentario junto a PASOS).
    const hallazgosCount = messages.reduce(
        (acc, m) => acc + m.parts.filter((p: any) => p.type === "tool-proponerHallazgo" && p.state === "output-available").length,
        0,
    );
    let pasoActualIndex = 0;
    if (!empty) pasoActualIndex = 1;
    if (hallazgosCount > 0) pasoActualIndex = 2;
    if (auditoriaFinalizada) pasoActualIndex = 3;

    const irAPaso = (idx: number) => {
        setHistorialAbierto(true);
        setTimeout(() => {
            const destino = idx === 2 && primerHallazgoRef.current ? primerHallazgoRef.current : historialRef.current;
            destino?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
    };

    return (
        <div className="relative mx-auto flex h-[calc(100vh-4rem)] max-w-5xl flex-col px-4 py-6 sm:px-6">
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
                    <button
                        onClick={reiniciarChat}
                        disabled={empty}
                        className="flex shrink-0 items-center gap-1.5 rounded-xl border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <MessageSquarePlus className="h-3.5 w-3.5" /> Nuevo chat
                    </button>
                    <Link
                        to="/guardian/hallazgos"
                        className="flex shrink-0 items-center gap-1.5 rounded-xl border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-accent"
                    >
                        <ClipboardList className="h-3.5 w-3.5" /> Hallazgos de Auditoría
                    </Link>
                    <div className="flex shrink-0 items-center gap-1.5 rounded-xl border bg-card p-1">
                        {(
                            [
                                { id: "iso9001", label: "ISO 9001" },
                                { id: "iso27001", label: "ISO 27001" },
                            ] as const
                        ).map((n) => (
                            <button
                                key={n.id}
                                onClick={() => handleNormaChange(n.id)}
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

            {/* Historial de chats de esta sesión — visual únicamente, no persiste al recargar. */}
            {chats.length > 0 && (
                <div className="mb-4 flex flex-wrap items-center gap-1.5">
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
                        <MessagesSquare className="h-3.5 w-3.5" /> Chats de hoy:
                    </span>
                    {chats.map((c) => (
                        <button
                            key={c.id}
                            onClick={() => abrirChatAnterior(c.id)}
                            className="max-w-[220px] truncate rounded-full border bg-card px-3 py-1 text-[11px] font-medium text-muted-foreground transition hover:border-brand/40 hover:text-foreground"
                            title={c.title}
                        >
                            {c.title}
                        </button>
                    ))}
                </div>
            )}

            {/* Chat body */}
            <Card className="relative flex flex-1 flex-col overflow-hidden border-border/60 bg-transparent">
                <GridBackground />
                <div className="relative z-10 flex-1 overflow-y-auto px-6 py-6">
                    {empty ? (
                        <div className="mx-auto max-w-2xl">
                            <div className={`rounded-2xl border p-6 transition-colors ${MODO_TARJETA[modo]}`}>
                                <p className="text-sm leading-relaxed">
                                    Hola <strong>{firstName}</strong> 👋, soy CES Auditor. Estoy aquí para ayudarte en la gestión del área CES.<br /><br />
                                    Puedo acompañarte en auditorías, resolver dudas sobre los procesos, explicarte los requisitos, ayudarte a encontrar información y recomendar mejoras.
                                </p>

                                <div className={`mt-4 border-t pt-4 ${MODO_DIVISOR[modo]}`}>
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

                            <div className="mt-6 flex justify-center">
                                <button
                                    onClick={() => submit(MENSAJE_PREPARAR_AUDITORIA)}
                                    className="flex items-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand/90"
                                >
                                    <Sparkles className="h-4 w-4" /> Quiero prepararme para una auditoría
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="mx-auto max-w-3xl">
                            <Stepper pasoActualIndex={pasoActualIndex} onStepClick={irAPaso} />

                            {/* Tarjeta del paso actual: el turno más reciente, grande y al centro, en vez
                                de un feed que crece sin fin — el historial completo sigue disponible abajo. */}
                            {(() => {
                                if (loading && lastMessage?.role === "user") {
                                    return (
                                        <div className="rounded-2xl border border-brand/30 bg-card p-6 shadow-sm">
                                            <div className="flex items-center gap-2">
                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl gradient-brand text-white">
                                                    <Sparkles className="h-4 w-4" />
                                                </div>
                                                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Pensando…
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }
                                if (!lastMessage || lastMessage.role !== "assistant") return null;
                                const ultimoAsistente = lastMessage;
                                const ultimoUsuario = [...messages].reverse().find((m) => m.role === "user");
                                const textoUltimoUsuario = ultimoUsuario?.parts.map((p) => (p.type === "text" ? p.text : "")).join("") ?? "";
                                // Ver debeOcultarTextoLibre: el selector de proceso y el primer turno de
                                // auditoría (documentos + primera pregunta) se quedan solo con las tarjetas.
                                const ocultarTexto = debeOcultarTextoLibre(messages, messages.length - 1);
                                const partesAMostrar = ocultarTexto
                                    ? ultimoAsistente.parts.filter((p) => String(p.type).startsWith("tool-"))
                                    : recortarTextoTrasOpciones(ultimoAsistente.parts);
                                return (
                                    <>
                                        {textoUltimoUsuario && !ocultarTexto && (
                                            <div className="mb-2 truncate text-xs font-medium text-muted-foreground">
                                                Tu respuesta: <span className="text-foreground">{textoUltimoUsuario}</span>
                                            </div>
                                        )}
                                        <div className="rounded-2xl border border-brand/30 bg-card p-5 shadow-sm sm:p-6">
                                            <div className="mb-3 flex items-center gap-2">
                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl gradient-brand text-white">
                                                    <Sparkles className="h-4 w-4" />
                                                </div>
                                                <span className="text-xs font-semibold text-muted-foreground">CES Auditor</span>
                                            </div>
                                            <div className="space-y-3 text-sm leading-relaxed">
                                                {partesAMostrar.map((p, idx) => {
                                                    if (p.type === "text") return p.text ? <ChatMarkdown key={idx} text={p.text} /> : null;
                                                    if (String(p.type).startsWith("tool-")) {
                                                        return (
                                                            <ToolPart
                                                                key={idx}
                                                                part={p}
                                                                onApprove={handleApprove}
                                                                onOption={(t) => submit(t)}
                                                                interactive={!loading}
                                                            />
                                                        );
                                                    }
                                                    return null;
                                                })}
                                                {loading && (
                                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                        <Loader2 className="h-3 w-3 animate-spin" /> Escribiendo…
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        {auditoriaFinalizada && (
                                            <div className="mt-4 flex justify-center">
                                                <button
                                                    onClick={() => submit(MENSAJE_PREPARAR_AUDITORIA)}
                                                    className="flex items-center gap-2 rounded-xl border border-brand/40 bg-brand-soft px-5 py-2.5 text-sm font-semibold text-brand transition hover:bg-brand hover:text-white"
                                                >
                                                    <Sparkles className="h-4 w-4" /> Auditar otro proceso
                                                </button>
                                            </div>
                                        )}
                                    </>
                                );
                            })()}

                            {/* Historial completo — nada se pierde, solo se colapsa por defecto para que
                                el paso actual sea lo protagonista en vez de un feed interminable. */}
                            <div className="mt-6">
                                <button
                                    onClick={() => setHistorialAbierto((v) => !v)}
                                    className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition hover:text-foreground"
                                >
                                    <MessagesSquare className="h-3.5 w-3.5" />
                                    {historialAbierto ? "Ocultar conversación completa" : `Ver conversación completa (${messages.length})`}
                                </button>

                                {historialAbierto && (
                                    <div ref={historialRef} className="mt-3 space-y-5 border-t pt-4">
                                        {messages.map((m, mIdx) => {
                                            const text = m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
                                            const isUser = m.role === "user";
                                            const esUltimoMensaje = mIdx === messages.length - 1;
                                            const tieneHallazgo = m.parts.some((p: any) => p.type === "tool-proponerHallazgo" && p.state === "output-available");
                                            // Mismo criterio que en la tarjeta del paso actual (ver debeOcultarTextoLibre).
                                            const ocultarTexto = debeOcultarTextoLibre(messages, mIdx);
                                            const partesAMostrar = ocultarTexto
                                                ? m.parts.filter((p) => String(p.type).startsWith("tool-"))
                                                : recortarTextoTrasOpciones(m.parts);
                                            return (
                                                <div
                                                    key={m.id}
                                                    ref={(el) => {
                                                        if (tieneHallazgo && el && !primerHallazgoRef.current) primerHallazgoRef.current = el;
                                                    }}
                                                    className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}
                                                >
                                                    {isUser ? (
                                                        <Avatar className="h-9 w-9 shrink-0 rounded-xl">
                                                            <AvatarImage src="/api/me/photo" alt={user?.name ?? "Tú"} className="object-cover" />
                                                            <AvatarFallback className="rounded-xl bg-secondary text-secondary-foreground">{userInitials}</AvatarFallback>
                                                        </Avatar>
                                                    ) : (
                                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl gradient-brand text-white">
                                                            <Sparkles className="h-4 w-4" />
                                                        </div>
                                                    )}
                                                    <div className={`max-w-[80%] space-y-2 rounded-2xl px-4 py-3 text-sm leading-relaxed ${isUser ? "bg-brand text-white" : "bg-muted/60"}`}>
                                                        {isUser ? (
                                                            text
                                                        ) : (
                                                            partesAMostrar.map((p, idx) => {
                                                                if (p.type === "text") return p.text ? <ChatMarkdown key={idx} text={p.text} /> : null;
                                                                if (String(p.type).startsWith("tool-")) {
                                                                    return (
                                                                        <ToolPart
                                                                            key={idx}
                                                                            part={p}
                                                                            onApprove={handleApprove}
                                                                            onOption={(t) => submit(t)}
                                                                            interactive={esUltimoMensaje && !loading}
                                                                        />
                                                                    );
                                                                }
                                                                return null;
                                                            })
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                            <div ref={endRef} />
                        </div>
                    )}
                </div>

                {/* Composer */}
                <div className="relative z-10 border-t bg-card/70 p-4 backdrop-blur">
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
