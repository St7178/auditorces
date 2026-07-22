import { createFileRoute } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useRef, useState } from "react";
import { Sparkles, Send, Loader2, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/guardian")({
    component: GuardianPage,
    head: () => ({
        meta: [
            { title: "CES Guardian IA — CES HUB" },
            { name: "description", content: "Asistente inteligente de calidad y auditoría para el área CES." },
        ],
    }),
});

const SUGERENCIAS = [
    "Quiero iniciar una auditoría",
    "¿Qué riesgos debo revisar esta semana?",
    "Ayúdame a preparar la auditoría del SIG",
    "Explícame la cláusula 8.1 de ISO 9001",
];

const PROCESOS_AUDITABLES = [
    "Administración de Riesgos",
    "Gestión de Servicios TIC",
    "Gestión de Proyectos",
    "Arquitectura de Soluciones",
    "Gestión de Logística y Compras",
    "Gestión Jurídica",
    "Gestión del Servicio al Cliente",
];

function renderMarkdown(text: string) {
    const html = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/`([^`]+)`/g, "<code class='rounded bg-muted px-1 py-0.5 text-xs'>$1</code>")
        .replace(/^\s*[-*]\s+(.+)$/gm, "<li>$1</li>")
        .replace(/(<li>[\s\S]+?<\/li>)/g, "<ul class='ml-4 list-disc space-y-1'>$1</ul>")
        .replace(/\n\n/g, "<br/><br/>")
        .replace(/\n/g, "<br/>");
    return { __html: html };
}

function GuardianPage() {
    const [input, setInput] = useState("");
    const { messages, sendMessage, status } = useChat({
        transport: new DefaultChatTransport({ api: "/api/chat" }),
    });
    const endRef = useRef<HTMLDivElement>(null);
    const loading = status === "submitted" || status === "streaming";

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

    return (
        <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-5xl flex-col px-4 py-6 sm:px-6">
            {/* Header */}
            <div className="mb-4 flex items-start gap-4">
                <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl gradient-brand text-white shadow-lg shadow-brand/30">
                    <Sparkles className="h-7 w-7" />
                    <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-white text-brand">
                        <ShieldCheck className="h-3 w-3" />
                    </span>
                </div>
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <h1 className="truncate text-2xl font-bold">CES AUDITOR</h1>
                        <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-semibold text-brand">
                            <span className="h-1.5 w-1.5 rounded-full bg-brand" /> En línea
                        </span>
                    </div>
                    <p className="text-sm text-muted-foreground">Tu asistente inteligente de calidad y auditoría · ISO 9001:2015 · SIG</p>
                </div>
            </div>

            {/* Chat body */}
            <Card className="flex flex-1 flex-col overflow-hidden border-border/60">
                <div className="flex-1 overflow-y-auto px-6 py-6">
                    {empty ? (
                        <div className="mx-auto max-w-2xl">
                            <div className="rounded-2xl border bg-gradient-to-br from-brand-soft to-secondary p-6">
                                <div className="text-sm font-semibold text-brand">CES AUDITOR</div>
                                <p className="mt-2 text-sm leading-relaxed">
                                    Hola <strong>Laura</strong> 👋<br />
                                    Estoy aquí para ayudarte a mantener CES preparado para auditorías internas y externas.<br /><br />
                                    Puedo ayudarte con:
                                </p>
                                <ul className="mt-3 grid gap-1.5 text-sm sm:grid-cols-2">
                                    {["Auditorías", "Riesgos", "Indicadores", "Contratos", "Proveedores", "Mejora continua", "ISO 9001", "Sistema Integrado de Gestión"].map((t) => (
                                        <li key={t} className="flex items-center gap-2">
                                            <span className="h-1.5 w-1.5 rounded-full bg-brand" /> {t}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="mt-6">
                                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Iniciar auditoría</div>
                                <div className="grid gap-2 sm:grid-cols-2">
                                    {PROCESOS_AUDITABLES.map((p) => (
                                        <button
                                            key={p}
                                            onClick={() => submit(`Quiero auditar el proceso: ${p}`)}
                                            className="rounded-xl border bg-card p-3 text-left text-sm transition hover:border-brand hover:bg-brand-soft/40"
                                        >
                                            <div className="font-medium">{p}</div>
                                            <div className="text-[11px] text-muted-foreground">Iniciar auditoría conversacional</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-6">
                                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sugerencias</div>
                                <div className="flex flex-wrap gap-2">
                                    {SUGERENCIAS.map((s) => (
                                        <button key={s} onClick={() => submit(s)} className="rounded-full border bg-card px-3 py-1.5 text-xs hover:border-brand hover:text-brand">
                                            {s}
                                        </button>
                                    ))}
                                </div>
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
                                            {isUser ? "LJ" : <Sparkles className="h-4 w-4" />}
                                        </div>
                                        <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${isUser ? "bg-brand text-white" : "bg-muted/60"}`}>
                                            {isUser ? text : <div dangerouslySetInnerHTML={renderMarkdown(text)} />}
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
