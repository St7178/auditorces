import { createFileRoute } from "@tanstack/react-router";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText, generateText, convertToModelMessages, type UIMessage } from "ai";
import { getCombinedResults } from "@/lib/wiki-knowledge/retrieve";
import { getCurrentSession } from "@/lib/auth/session";

// Puerto del backend Python de ChatWikiAI2 (main.py): mismo SYSTEM_PROMPT y pipeline de
// reescritura de consulta + búsqueda híbrida (semántica + título + vecinos), corriendo aquí
// sobre el índice estático de src/lib/wiki-knowledge en vez de FAISS.
const SYSTEM_PROMPT = `Eres CNETWIKI, el asistente de la wiki interna de Compunet (CNet / grupocnet).

REGLAS:
1. Usa el contexto proporcionado para responder. No inventes datos ni URLs.
2. Si la pregunta es sobre un documento, formato o archivo específico (ej: "qué dice el acta...", "dame el excel de..."):
   - Busca en las secciones marcadas como [ARCHIVO: ...] o [Página: ... › Archivo: ...].
   - Si encuentras la información, cítala y menciona el nombre del archivo.
   - Si el contexto tiene una "URL del archivo", inclúyelo obligatoriamente en tu respuesta.
3. Interpreta la intención del usuario con flexibilidad (sinónimos, variantes de redacción).
4. Si el contexto tiene información parcial, responde con lo que hay e indica que puede estar incompleta.
5. Si el contexto proporcionado está vacío o es irrelevante, responde exactamente: "No tengo información sobre ese tema en la wiki."
6. Responde en Markdown: **negrita**, listas con \`-\`, encabezados con \`##\`.`;

const QUERY_EXPAND_PROMPT = `Eres un asistente que genera consultas de búsqueda para una wiki interna de Compunet (CNet / grupocnet).
Dado el historial y la pregunta, genera una consulta de búsqueda semántica que capture bien la intención.
- Si la pregunta pide un documento o formato (acta, informe, plantilla, indicador, procedimiento), incluye ese término en la consulta.
- Mantén términos clave del dominio (nombres de procesos, áreas, secciones).
- Sé conciso: máximo 20 palabras.
- Devuelve SOLO la consulta, sin comillas ni explicaciones.`;

function lastUserText(messages: UIMessage[]): string {
    const last = [...messages].reverse().find((m) => m.role === "user");
    if (!last) return "";
    return last.parts.map((p) => (p.type === "text" ? p.text : "")).join(" ");
}

function historyForPrompt(messages: UIMessage[]) {
    return messages
        .slice(-4)
        .map((m) => ({ role: m.role === "user" ? ("user" as const) : ("assistant" as const), content: m.parts.map((p) => (p.type === "text" ? p.text : "")).join(" ") }))
        .filter((m) => m.content.trim());
}

export const Route = createFileRoute("/api/wiki-chat")({
    server: {
        handlers: {
            POST: async ({ request }) => {
                const session = await getCurrentSession();
                if (!session) return new Response("Unauthorized", { status: 401 });

                const { messages } = (await request.json()) as { messages: UIMessage[] };
                const key = process.env.OPENAI_API_KEY;
                if (!key) return new Response("Missing OPENAI_API_KEY", { status: 500 });

                const openai = createOpenAI({ apiKey: key });
                const query = lastUserText(messages);

                let searchQuery = query;
                if (query) {
                    try {
                        const rewrite = await generateText({
                            model: openai("gpt-4o-mini"),
                            system: QUERY_EXPAND_PROMPT,
                            messages: [...historyForPrompt(messages.slice(0, -1)), { role: "user", content: query }],
                        });
                        searchQuery = rewrite.text.trim() || query;
                    } catch {
                        searchQuery = query;
                    }
                }

                const results = query ? await getCombinedResults(query, searchQuery, key, 6) : [];

                const contextParts: string[] = [];
                for (const r of results) {
                    const pageLabel = r.page.replace(/_/g, " ");
                    let header: string;
                    if (r.fileName) {
                        header = `[ARCHIVO: ${r.fileName} (de la página ${pageLabel})]`;
                        if (r.fileUrl) header += `\nURL del archivo: ${r.fileUrl}`;
                    } else {
                        header = `[Página: ${pageLabel}${r.section ? ` › ${r.section}` : ""}]`;
                    }
                    contextParts.push(`${header}\n${r.text}`);
                }

                const context = contextParts.join("\n\n---\n\n");
                const retrievedBlock = context
                    ? `Contexto recuperado de la wiki interna (usa esto para responder; si el contexto está vacío o es irrelevante, dilo explícitamente):\n${context}`
                    : "Contexto recuperado de la wiki interna: (vacío — no se encontró información relevante).";

                const system = [SYSTEM_PROMPT, retrievedBlock].join("\n\n");

                const result = streamText({
                    model: openai("gpt-4o-mini"),
                    system,
                    messages: await convertToModelMessages(messages),
                });

                return result.toUIMessageStreamResponse({ originalMessages: messages });
            },
        },
    },
});
