import { createFileRoute } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useRef, useState } from "react";
import { BookOpen, Send, Loader2, Lightbulb, ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { GridBackground } from "@/components/ui/grid-background";
import { ChatMarkdown } from "@/components/chat-markdown";
import { Route as AuthenticatedRoute } from "@/routes/_authenticated";

export const Route = createFileRoute("/_authenticated/chat")({
    component: ChatWikiPage,
    head: () => ({
        meta: [
            { title: "Chat Wiki — CES SIG" },
            { name: "description", content: "Asistente que consulta la wiki interna de Compunet." },
        ],
    }),
});

const SUGERENCIAS = [
    "Dame el acta de reunión",
    "Donde está el manual de calidad",
    "Dame el formato de solicitud de vacaciones",
];

function ChatWikiPage() {
    const { user } = AuthenticatedRoute.useRouteContext();
    const firstName = user?.name?.split(" ")[0] ?? "Usuario";
    const userInitials = user?.name
        ? user.name.split(" ").filter(Boolean).slice(0, 2).map((n) => n[0]).join("").toUpperCase()
        : "US";
    const [input, setInput] = useState("");
    const [showTips, setShowTips] = useState(false);
    const { messages, sendMessage, status } = useChat({
        transport: new DefaultChatTransport({ api: "/api/wiki-chat" }),
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
            <div className="mb-4 flex items-start gap-4">
                <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/90 text-brand shadow-sm shadow-slate-200 border border-slate-200">
                    <img src="https://gycqduihf0vkjbnu.public.blob.vercel-storage.com/IA" alt="Chat Wiki" className="h-9 w-9 object-contain" />
                </div>
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <h1 className="truncate text-2xl font-bold">Chat Wiki</h1>
                        <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-semibold text-brand">
                            <span className="h-1.5 w-1.5 rounded-full bg-brand" /> En línea
                        </span>
                    </div>
                    <p className="text-sm text-muted-foreground">Consulta la wiki interna de Compunet (grupocnet) en lenguaje natural</p>
                </div>
            </div>

            <Card className="mb-4 border-amber-300/50 bg-amber-50/60">
                <button
                    onClick={() => setShowTips((v) => !v)}
                    className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
                >
                    <div className="flex items-center gap-2 text-sm font-semibold text-amber-900">
                        <Lightbulb className="h-4 w-4" /> Cómo preguntarle a Chat Wiki
                    </div>
                    <ChevronDown className={`h-4 w-4 text-amber-700 transition-transform ${showTips ? "rotate-180" : ""}`} />
                </button>
                {showTips && (
                    <div className="px-4 pb-4 text-xs leading-relaxed text-amber-900">
                        <ul className="space-y-1.5">
                            <li>
                                <strong>Sé específico:</strong> menciona el nombre del cliente, servicio, tecnología o documento que buscas.
                                El chat busca por significado, no por palabras exactas — entre más concreta la pregunta, mejor encuentra el contenido.
                            </li>
                            <li>
                                <strong>Pide documentos explícitamente:</strong> "dame el procedimiento de...", "qué dice el manual de...", "adjúntame el formato de...".
                            </li>
                            <li>
                                <strong>Evita preguntas muy genéricas</strong> como "qué información tienes" o "dame información" — no tienen un tema
                                concreto para buscar. Pregunta por algo puntual.
                            </li>
                        </ul>
                    </div>
                )}
            </Card>

            <Card className="relative flex flex-1 flex-col overflow-hidden border-border/60 bg-transparent">
                <GridBackground />
                <div className="relative z-10 flex-1 overflow-y-auto px-6 py-6">
                    {empty ? (
                        <div className="mx-auto max-w-2xl">
                            <div className="rounded-2xl border bg-gradient-to-br from-brand-soft to-secondary p-6">
                                <div className="text-sm font-semibold text-brand">Chat Wiki</div>
                                <p className="mt-2 text-sm leading-relaxed">
                                    Hola <strong>{firstName}</strong> 👋<br />
                                    Pregúntame sobre clientes, equipos, procesos, formatos o cualquier página de la wiki interna.
                                </p>
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
                                            {isUser ? userInitials : <BookOpen className="h-4 w-4" />}
                                        </div>
                                        <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${isUser ? "bg-brand text-white" : "bg-muted/60"}`}>
                                            {isUser ? text : <ChatMarkdown text={text} />}
                                        </div>
                                    </div>
                                );
                            })}
                            {loading && (
                                <div className="flex gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-brand text-white">
                                        <BookOpen className="h-4 w-4" />
                                    </div>
                                    <div className="rounded-2xl bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
                                        <Loader2 className="inline h-3 w-3 animate-spin" /> Buscando en la wiki…
                                    </div>
                                </div>
                            )}
                            <div ref={endRef} />
                        </div>
                    )}
                </div>

                <div className="relative z-10 border-t bg-card/70 p-4 backdrop-blur">
                    <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border bg-background p-2 shadow-sm focus-within:border-brand">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
                            }}
                            placeholder="Escribe tu pregunta sobre la wiki…"
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
                        Chat Wiki responde solo con base en el contenido indexado de la wiki interna.
                    </div>
                </div>
            </Card>
        </div>
    );
}
