import { createFileRoute } from "@tanstack/react-router";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText, convertToModelMessages, tool, stepCountIs, type UIMessage } from "ai";
import { z } from "zod";
import { retrieveRelevantChunks } from "@/lib/knowledge/retrieve";
import { INVENTARIO_DOCUMENTAL_CES, REGISTRO_RIESGOS_CES, INDICADORES, CLIENTES, DOCUMENTOS, MAPA_PROCESOS_CES } from "@/lib/ces-data";
import { getRiesgos, getClientes, getDocumentacion } from "@/lib/sync-storage";
import { saveHallazgo } from "@/lib/hallazgos-storage";
import { getCurrentSession } from "@/lib/auth/session";
import { getValidUserAccessToken, createCalendarEvent } from "@/lib/auth/entra";

const SYSTEM_PROMPT = `Eres CES Guardian (CES AUDITOR), el asistente inteligente de calidad y auditoría del área Cloud Enterprise Services (CES) de Compunet.

Tu personalidad:
- Profesional, cercano, empático y con enfoque de mejora continua.
- Hablas siempre en español colombiano corporativo.
- Usas emojis con moderación (🛡️ 📊 ✅ ⚠️).
- Nunca pides cargar documentos confidenciales.
- Solo preguntas por la UBICACIÓN de la evidencia (SharePoint, Power BI, SAP, Solman, Carpeta de Red, Sistema Corporativo, Otro).

Tus temas: Auditorías internas y externas, ISO 9001:2015, Sistema Integrado de Gestión (SIG), Riesgos, Indicadores, Contratos, Proveedores, Mejora continua, Procesos CES.

HERRAMIENTAS — tienes acceso a los datos REALES y actuales del dashboard mediante herramientas:
- consultarRiesgos, consultarIndicadores, consultarClientes, consultarProcesos, consultarDocumentacion.
Úsalas SIEMPRE que la pregunta dependa de datos actuales (ej. "qué riesgos hay", "cómo van los indicadores", "qué clientes tenemos", "qué documentos existen"). No inventes cifras ni nombres — si necesitas un dato real, consulta la herramienta correspondiente antes de responder.

REGLA CRÍTICA DE ALCANCE — no mezclar procesos: consultarRiesgos y consultarDocumentacion aceptan un parámetro "proceso" que filtra server-side (no es un truco de redacción, el filtro es real). Cuando estés auditando o hablando de UN proceso específico:
- Pasa SIEMPRE ese proceso exacto como parámetro "proceso" en ambas herramientas.
- Cada respuesta trae "total": si total es 0, significa que NO hay riesgos/documentos registrados específicamente para ese proceso — dilo explícitamente ("No tengo riesgos registrados específicamente para Arquitectura de Soluciones en la matriz actual") y sigue la auditoría preguntando directamente al usuario por esa información, en vez de mostrar riesgos o documentos de otro proceso como si aplicaran.
- La matriz de riesgos de CES casi siempre solo clasifica por categoría macro (Procesos Estratégicos/Misionales/de Apoyo), no por proceso específico — así que total:0 en un proceso Misional puntual es NORMAL y esperado, no un error tuyo. Nunca sustituyas con riesgos de otro proceso solo porque "algo" salió en la consulta sin filtro.
- Solo omite el parámetro "proceso" si el usuario pide explícitamente una vista general de TODOS los riesgos/documentos sin filtrar.

CÓMO HACER UNA AUDITORÍA:
1. Pregunta qué proceso desea auditar (o usa consultarProcesos para listarlos).
2. Usa consultarRiesgos, consultarIndicadores y/o consultarDocumentacion — SIEMPRE con el proceso como filtro (ver regla de arriba) — para entender el estado real de ese proceso antes de hacer preguntas. Indicadores no está tagged por proceso todavía, acláralo si lo usas.
3. Haz preguntas dinámicas basadas en las cláusulas de ISO 9001 aplicables al proceso.
4. Solicita la ubicación de la evidencia (nunca el archivo).
5. Cuando identifiques un hallazgo concreto (una no conformidad, riesgo no gestionado, oportunidad de mejora), usa la herramienta proponerHallazgo para registrarlo. Esta herramienta SIEMPRE pide confirmación explícita del usuario antes de guardarse — nunca digas que "ya quedó guardado" hasta que la herramienta confirme que el usuario aprobó.
6. Al final de la auditoría, entrega un resumen con los hallazgos propuestos, oportunidades y recomendaciones.
7. Si el usuario pide agendar una reunión (ej. "agéndame la auditoría de Riesgos el viernes a las 10am"), usa la herramienta agendarReunion. También pide confirmación explícita antes de crearse en el calendario real del usuario. Calcula la fecha/hora exacta en ISO 8601 con zona horaria de Bogotá (UTC-5) a partir de la fecha de hoy que se indica abajo — nunca inventes una fecha sin ancla.

Sé conciso, usa listas y estructura visual (títulos con **negrita**). Responde en markdown.`;

const INVENTARIO_BLOCK = `Conocimiento interno — Información documentada del SIG aplicable a CES (código · nombre · subproceso):
${INVENTARIO_DOCUMENTAL_CES.map((d) => `- ${d.codigo} · ${d.nombre} · ${d.subproceso} (${d.observacion})`).join("\n")}
Usa esta lista para responder qué documento/código corresponde a qué proceso. Si el usuario pide un documento que no aparece aquí, dile que no está en el alcance de CES o que no tienes registro de él — no inventes códigos.`;

function normalize(s: string) {
    return s
        .toLowerCase()
        .normalize("NFD")
        .replace(new RegExp("[\\u0300-\\u036f]", "g"), "")
        .trim();
}

function matchesProceso(haystack: string | null | undefined, proceso: string) {
    if (!haystack) return false;
    return normalize(haystack).includes(normalize(proceso));
}

function lastUserText(messages: UIMessage[]): string {
    const last = [...messages].reverse().find((m) => m.role === "user");
    if (!last) return "";
    return last.parts.map((p) => (p.type === "text" ? p.text : "")).join(" ");
}

export const Route = createFileRoute("/api/chat")({
    server: {
        handlers: {
            POST: async ({ request }) => {
                // El beforeLoad de /_authenticated protege la UI, no este endpoint — se valida la sesión aquí también.
                const session = await getCurrentSession();
                if (!session) return new Response("Unauthorized", { status: 401 });

                const { messages } = (await request.json()) as { messages: UIMessage[] };
                const key = process.env.OPENAI_API_KEY;
                if (!key) return new Response("Missing OPENAI_API_KEY", { status: 500 });

                const openai = createOpenAI({ apiKey: key });

                const query = lastUserText(messages);
                const relevantChunks = query ? await retrieveRelevantChunks(query, key) : [];
                const retrievedBlock = relevantChunks.length
                    ? `Contexto recuperado de la base de conocimiento (usa esto para responder con precisión; si no es relevante, ignóralo):\n${relevantChunks.map((c) => `--- ${c.source} ---\n${c.text}`).join("\n\n")}`
                    : "";

                const fechaHoyBlock = `Fecha y hora actuales (America/Bogota, UTC-5): ${new Date().toLocaleString("es-CO", { timeZone: "America/Bogota", dateStyle: "full", timeStyle: "short" })}.`;
                const system = [SYSTEM_PROMPT, fechaHoyBlock, INVENTARIO_BLOCK, retrievedBlock].filter(Boolean).join("\n\n");

                const tools = {
                    consultarRiesgos: tool({
                        description:
                            "Consulta el registro real y actual de riesgos operacionales de CES, sincronizado desde la Matriz de Riesgos de SharePoint. Pasa 'proceso' SIEMPRE que estés auditando un proceso específico — filtra server-side y NO inventa coincidencias: si no hay riesgos para ese proceso exacto, total sale en 0 y el array viene vacío. En ese caso dilo explícitamente, no muestres riesgos de otros procesos.",
                        inputSchema: z.object({
                            proceso: z.string().optional().describe("Nombre del proceso CES a filtrar (ej. 'Arquitectura de Soluciones'). Omite solo si de verdad quieres TODOS los riesgos sin filtrar."),
                        }),
                        execute: async ({ proceso }) => {
                            const stored = await getRiesgos<typeof REGISTRO_RIESGOS_CES>().catch(() => null);
                            const riesgos = stored ?? REGISTRO_RIESGOS_CES;
                            if (!proceso) return { proceso: null, total: riesgos.length, riesgos };
                            const filtrados = (riesgos as any[]).filter(
                                (r) => matchesProceso(r.procesoNivel1, proceso) || matchesProceso(r.procesoNivel2, proceso),
                            );
                            return { proceso, total: filtrados.length, riesgos: filtrados };
                        },
                    }),
                    consultarIndicadores: tool({
                        description: "Consulta los indicadores de gestión actuales de CES (meta, valor actual, tendencia).",
                        inputSchema: z.object({}),
                        execute: async () => INDICADORES,
                    }),
                    consultarClientes: tool({
                        description: "Consulta el registro real y actual de clientes de CES y sus contratos, sincronizado desde SharePoint.",
                        inputSchema: z.object({}),
                        execute: async () => {
                            const stored = await getClientes<typeof CLIENTES>().catch(() => null);
                            return stored ?? CLIENTES;
                        },
                    }),
                    consultarProcesos: tool({
                        description: "Consulta el mapa de procesos CES (categorías: Estratégicos, Misionales, de Apoyo, y los procesos dentro de cada una).",
                        inputSchema: z.object({}),
                        execute: async () => MAPA_PROCESOS_CES,
                    }),
                    consultarDocumentacion: tool({
                        description:
                            "Consulta el registro real y actual de documentos del SIG (nombre, código, responsable, fecha, tipo), sincronizado desde SharePoint. Pasa 'proceso' SIEMPRE que estés auditando un proceso específico — filtra server-side por el campo tipo/ubicación. Si total sale 0, dilo explícitamente en vez de mostrar documentos de otro proceso.",
                        inputSchema: z.object({
                            proceso: z.string().optional().describe("Nombre del proceso CES a filtrar. Omite solo si de verdad quieres TODOS los documentos sin filtrar."),
                        }),
                        execute: async ({ proceso }) => {
                            const stored = await getDocumentacion<typeof DOCUMENTOS>().catch(() => null);
                            const documentos = stored ?? DOCUMENTOS;
                            if (!proceso) return { proceso: null, total: documentos.length, documentos };
                            const filtrados = (documentos as any[]).filter((d) => matchesProceso(d.ubicacion, proceso));
                            return { proceso, total: filtrados.length, documentos: filtrados };
                        },
                    }),
                    proponerHallazgo: tool({
                        description:
                            "Propone un hallazgo de auditoría (no conformidad, riesgo no gestionado u oportunidad de mejora) para guardarlo en el dashboard. SIEMPRE requiere confirmación explícita del usuario antes de guardarse — úsala en cuanto identifiques un hallazgo concreto durante la auditoría, no esperes al final.",
                        inputSchema: z.object({
                            proceso: z.string().describe("Proceso CES auditado donde se encontró el hallazgo"),
                            titulo: z.string().describe("Título corto del hallazgo"),
                            descripcion: z.string().describe("Descripción detallada de qué se encontró y por qué es un hallazgo"),
                            nivelRiesgo: z.enum(["Bajo", "Medio", "Alto", "Crítico"]).optional().describe("Nivel de riesgo asociado, si aplica"),
                            recomendacion: z.string().describe("Recomendación de tratamiento o acción correctiva"),
                            evidenciaUbicacion: z.string().optional().describe("Ubicación de la evidencia (SharePoint, SAP, Power BI, etc.), nunca el archivo en sí"),
                        }),
                        needsApproval: true,
                        execute: async (input) => {
                            const saved = await saveHallazgo(input);
                            return { guardado: true, hallazgo: saved };
                        },
                    }),
                    agendarReunion: tool({
                        description:
                            "Agenda una reunión real en el calendario de Outlook del usuario logueado (con link de Teams si aplica). SIEMPRE requiere confirmación explícita del usuario antes de crearse.",
                        inputSchema: z.object({
                            titulo: z.string().describe("Título de la reunión"),
                            startIso: z.string().describe("Fecha y hora de inicio en ISO 8601 (ej. 2026-08-01T10:00:00-05:00), calculada a partir de la fecha de hoy"),
                            endIso: z.string().describe("Fecha y hora de fin en ISO 8601"),
                            descripcion: z.string().optional().describe("Agenda o descripción de la reunión"),
                            invitados: z.array(z.string()).optional().describe("Correos de los invitados, si el usuario los menciona"),
                            reunionTeams: z.boolean().optional().describe("Si debe generarse un link de Teams (por defecto sí)"),
                        }),
                        needsApproval: true,
                        execute: async (input) => {
                            const accessToken = await getValidUserAccessToken();
                            const evento = await createCalendarEvent(accessToken, {
                                subject: input.titulo,
                                startIso: input.startIso,
                                endIso: input.endIso,
                                description: input.descripcion,
                                attendeeEmails: input.invitados,
                                isOnlineMeeting: input.reunionTeams,
                            });
                            return { creado: true, evento };
                        },
                    }),
                };

                const result = streamText({
                    model: openai("gpt-4o-mini"),
                    system,
                    messages: await convertToModelMessages(messages),
                    tools,
                    stopWhen: stepCountIs(8),
                });

                return result.toUIMessageStreamResponse({ originalMessages: messages });
            },
        },
    },
});
