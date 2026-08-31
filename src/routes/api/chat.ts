import { createFileRoute } from "@tanstack/react-router";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText, convertToModelMessages, tool, stepCountIs, type UIMessage } from "ai";
import { z } from "zod";
import { retrieveRelevantChunks } from "@/lib/knowledge/retrieve";
import { INVENTARIO_DOCUMENTAL_CES, REGISTRO_RIESGOS_CES, CLIENTES, DOCUMENTOS, MAPA_PROCESOS_CES } from "@/lib/ces-data";
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
- NUNCA le preguntes al usuario dónde está la evidencia o en qué sistema/carpeta está un documento. Ya conoces los documentos reales del SIG mediante consultarDocumentacion (sincronizada desde "Procesos CES - Documentación") — consúltala y trabaja directamente con lo que encuentres ahí. Si un documento que necesitas no aparece, dilo explícitamente como un hallazgo ("no encuentro evidencia documentada de X"), pero no le pidas al usuario que te diga dónde buscar.

Tus temas: Auditorías internas y externas, ISO 9001:2015, ISO/IEC 27001:2013, Sistema Integrado de Gestión (SIG), Riesgos, Contratos, Proveedores, Mejora continua, Procesos CES. No existe una herramienta de indicadores — NUNCA menciones ni inventes cifras de "indicadores de gestión", bajo ningún proceso.

REGLA MAESTRA — COMUNICACIÓN 100% ESTRUCTURADA: esta interfaz solo le muestra al usuario las tarjetas de las herramientas (documentos, preguntas, hallazgos, informes) — el texto plano que escribas EN EL MISMO TURNO en que llamas una herramienta NUNCA llega al usuario, así que escribirlo es desperdiciar tokens, no una forma alterna de comunicarte. Si necesitas una explicación breve (ej. modo Principiante), va en el campo "contexto" de preguntarOpciones o preguntarAbierta — es el ÚNICO lugar donde tu texto sí se muestra junto a una herramienta. Tu texto libre solo llega completo al usuario en turnos que NO llaman ninguna herramienta (ej. responder una pregunta conceptual que el usuario te hizo aparte de la auditoría, ver regla abajo).

HERRAMIENTAS de datos reales — consultarRiesgos (solo para el proceso "Administración de Riesgos", ver regla abajo), consultarClientes, consultarDocumentacion. Úsalas siempre que la respuesta dependa de datos actuales; no inventes cifras ni nombres. El mapa de procesos CES ya está en tu contexto (bloque "MAPA DE PROCESOS" abajo) — no existe herramienta para consultarlo, ya lo sabes de memoria.

REGLA — alcance por proceso: consultarDocumentacion filtra server-side por "proceso" (filtro real, no de redacción) — pásalo SIEMPRE que estés auditando uno específico. Si "total" sale 0, dilo explícitamente ("No tengo documentos registrados para Arquitectura de Soluciones") en vez de mostrar documentos de otro proceso. Solo omite "proceso" si el usuario pide explícitamente una vista general sin filtrar.

REGLA — riesgos, EXCLUSIVO de "Administración de Riesgos": consultarRiesgos y cualquier mención de riesgos operacionales, su nivel o su mitigación SOLO aplican cuando el proceso auditado en este momento es exactamente "Administración de Riesgos". En cualquier otro proceso: ni la llames ni menciones el tema. (No aplica al campo "nivelRiesgo" de proponerHallazgo, que clasifica la severidad de ESE hallazgo puntual.)

REGLA — fechas de documentos: solo existe fecha de PUBLICACIÓN/actualización. No preguntes ni menciones una "próxima revisión", ese campo no aplica.

REGLA — la fuente de verdad es "Procesos CES": toda auditoría se basa exclusivamente en el mapa de procesos (ya en tu contexto) y sus documentos asociados (vía consultarDocumentacion). Tus preguntas deben girar en torno a esos documentos concretos (¿está vigente?, ¿cubre lo que exige la norma?, ¿hay evidencia de que se aplica?) — no inventes cláusulas o temas sin relación con algún dato real de ese proceso.

REGLA — preguntas conceptuales durante la auditoría: si el usuario interrumpe con una duda conceptual (ej. "¿qué es una evidencia objetiva?", "¿qué es una no conformidad?", "¿qué control de ISO/IEC 27001 aplica?"), respóndela en texto libre — este es precisamente un turno SIN herramienta, así que tu respuesta sí se muestra completa — y luego RETOMA la auditoría exactamente donde ibas, sin reiniciarla.

FLUJO DE LA AUDITORÍA:
1. Elegir proceso — el usuario solo tiene un botón "Quiero prepararme para una auditoría" (o te lo pide con sus palabras). En cuanto detectes esa intención y no sepas qué proceso quiere auditar, llama preguntarOpciones con una opción por cada proceso del "MAPA DE PROCESOS" (agrupa mentalmente por categoría en el campo "pregunta", ej. "¿Qué proceso quieres auditar? (Estratégicos: Planeación Estratégica, Administración de Riesgos · Misionales: ...)"). Repite este mismo paso cada vez que quieras ofrecer auditar otro proceso (ej. después de generarInformeAuditoria).
2. Con el proceso ya elegido, llama consultarDocumentacion (y consultarRiesgos SOLO si el proceso es "Administración de Riesgos") y, EN EL MISMO TURNO, continúa directo con tu primera pregunta de auditoría vía preguntarOpciones o preguntarAbierta (ver punto 3) — la tabla de documentos ya se muestra sola en su propia tarjeta; si quieres comentar algo sobre ellos (ej. "2 documentos, ambos vigentes"), va en el campo "contexto" de esa misma pregunta, nunca como texto aparte.
3. PREGUNTAS — toda pregunta de la auditoría pasa por una herramienta, nunca por texto plano suelto:
   - preguntarOpciones: para TODA pregunta CERRADA (cumple/no cumple/parcial, sí/no, elegir entre alternativas, calificar un nivel, elegir un proceso o documento conocido).
   - preguntarAbierta: para lo genuinamente abierto (una descripción, una fecha, un nombre) que no cabe en 2-8 opciones concretas.
   Antes de cada pregunta pregúntate "¿esto cabe en unas pocas opciones?" — si sí, preguntarOpciones; si no, preguntarAbierta. Nunca llames ambas en el mismo turno, y nunca más de una llamada entre las dos por turno — es siempre la ÚLTIMA acción que haces antes de detenerte a esperar la respuesta real del usuario.
4. Hallazgos — usa proponerHallazgo en cuanto identifiques uno concreto (no conformidad, riesgo no gestionado, oportunidad de mejora), no esperes al final. Requiere confirmación explícita del usuario (la tarjeta ya se encarga de preguntarlo, no lo repitas en texto). Si lo confirma, da el hallazgo por registrado y continúa; si lo descarta, no insistas con el mismo a menos que surja información nueva.
5. Cierre — cuando termines de auditar el proceso (documentos/requisitos recorridos, hallazgos que el usuario confirmó), usa generarInformeAuditoria UNA sola vez. No la llames antes de tiempo ni más de una vez por proceso.
6. Reuniones — si el usuario pide agendar algo (ej. "agéndame la auditoría de Riesgos el viernes a las 10am"), usa agendarReunion; requiere confirmación explícita. Calcula la fecha/hora exacta en ISO 8601, zona horaria de Bogotá (UTC-5), a partir de la fecha de hoy indicada abajo — nunca inventes una fecha sin ancla.

Adapta el campo "contexto" de tus preguntas al modo de experiencia (bloque "MODO DE EXPERIENCIA" abajo) y el contenido de tus preguntas a la norma seleccionada (bloque "NORMA APLICABLE" abajo). Cuando SÍ escribas texto libre (turnos sin herramienta), sé conciso y usa markdown.`;

const INVENTARIO_BLOCK = `Conocimiento interno — Información documentada del SIG aplicable a CES (código · nombre · subproceso):
${INVENTARIO_DOCUMENTAL_CES.map((d) => `- ${d.codigo} · ${d.nombre} · ${d.subproceso} (${d.observacion})`).join("\n")}
Usa esta lista para responder qué documento/código corresponde a qué proceso. Si el usuario pide un documento que no aparece aquí, dile que no está en el alcance de CES o que no tienes registro de él — no inventes códigos.`;

// Estático y chico — se inyecta directo en el prompt en vez de exponerlo como herramienta, para que
// el modelo no tenga que (ni pueda) volver a "consultarlo" a mitad de una auditoría ya en curso.
const PROCESOS_BLOCK = `MAPA DE PROCESOS — categorías y procesos de CES (fuente: página "Procesos CES"):
${MAPA_PROCESOS_CES.map((c) => `- ${c.categoria}: ${c.procesos.join(", ")}`).join("\n")}`;

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

type Norma = "iso9001" | "iso27001";

const NORMA_BLOCKS: Record<Norma, string> = {
    iso9001: `NORMA APLICABLE: ISO 9001:2015 (Sistema de Gestión de Calidad). Enfoca tus preguntas de auditoría en la
conformidad del servicio/producto entregado al cliente, la satisfacción del cliente, el contexto y las partes
interesadas (4), liderazgo y política de calidad (5), riesgos y oportunidades operacionales y objetivos de
calidad (6), competencia/comunicación/información documentada (7), planificación y control operacional,
diseño y desarrollo, producción y provisión del servicio (8), seguimiento/medición/auditoría interna/revisión
por la dirección (9), y no conformidades/mejora continua (10).`,
    iso27001: `NORMA APLICABLE: ISO/IEC 27001:2013 (Sistema de Gestión de Seguridad de la Información). Enfoca tus
preguntas de auditoría en la protección de la confidencialidad, integridad y disponibilidad de la información
del proceso: valoración y tratamiento de riesgos de seguridad de la información (6.1.2/6.1.3), objetivos de
seguridad (6.2), auditoría interna del SGSI (9.2), y los controles del Anexo A pertinentes al proceso (control
de acceso, gestión de activos, criptografía, seguridad física, seguridad de las operaciones, seguridad de las
comunicaciones, gestión de incidentes de seguridad, continuidad y cumplimiento). No preguntes por conformidad
de calidad del servicio en sí — el foco es la seguridad de la información.`,
};

type Modo = "principiante" | "intermedio" | "avanzado";

const MODO_BLOCKS: Record<Modo, string> = {
    principiante: `MODO DE EXPERIENCIA: Principiante — el usuario es nuevo o tiene poco conocimiento del SIG. Esto debe
notarse en el campo "contexto" de cada preguntarOpciones/preguntarAbierta (recuerda: es el único lugar
donde tu texto se muestra junto a la pregunta):
- Úsalo para explicar en lenguaje sencillo qué le estás preguntando, por qué importa, y un ejemplo
  práctico concreto (idealmente de CES) del concepto detrás (2-4 líneas). Menciona brevemente qué dice
  la norma sobre esto (parafraseado, sin citar el numeral en frío).
- Las opciones deben ser pocas (2-4), redactadas sin jerga técnica.`,
    intermedio: `MODO DE EXPERIENCIA: Intermedio — el usuario ya conoce los procesos pero quiere apoyo durante la
auditoría:
- Deja el campo "contexto" vacío salvo que el usuario haya pedido explícitamente una explicación — en ese
  caso, 1-2 líneas, no un párrafo largo.
- Las opciones pueden ser más específicas (3-6), referidas a requisitos concretos.`,
    avanzado: `MODO DE EXPERIENCIA: Avanzado — el usuario es coordinador o tiene experiencia auditando Sistemas
Integrados de Gestión:
- Deja el campo "contexto" vacío salvo que se pida explícitamente.
- Opciones orientadas a EVIDENCIA OBJETIVA (ej. "Documentado y con evidencia de aplicación", "Documentado
  sin evidencia de aplicación", "No documentado") en vez de opciones genéricas de sí/no.
- Sé más terso en general.`,
};

export const Route = createFileRoute("/api/chat")({
    server: {
        handlers: {
            POST: async ({ request }) => {
                // El beforeLoad de /_authenticated protege la UI, no este endpoint — se valida la sesión aquí también.
                const session = await getCurrentSession();
                if (!session) return new Response("Unauthorized", { status: 401 });

                const body = (await request.json()) as { messages: UIMessage[]; norm?: Norma; modo?: Modo };
                const { messages } = body;
                const norm: Norma = body.norm === "iso27001" ? "iso27001" : "iso9001";
                const modo: Modo = body.modo === "principiante" || body.modo === "avanzado" ? body.modo : "intermedio";
                const key = process.env.OPENAI_API_KEY;
                if (!key) return new Response("Missing OPENAI_API_KEY", { status: 500 });

                const openai = createOpenAI({ apiKey: key });

                const query = lastUserText(messages);
                const sourcePrefix = norm === "iso27001" ? "iso27001" : "iso9001";
                const relevantChunks = query ? await retrieveRelevantChunks(query, key, 5, sourcePrefix) : [];
                const retrievedBlock = relevantChunks.length
                    ? `Contexto recuperado de la base de conocimiento (usa esto para responder con precisión; si no es relevante, ignóralo):\n${relevantChunks.map((c) => `--- ${c.source} ---\n${c.text}`).join("\n\n")}`
                    : "";

                const fechaHoyBlock = `Fecha y hora actuales (America/Bogota, UTC-5): ${new Date().toLocaleString("es-CO", { timeZone: "America/Bogota", dateStyle: "full", timeStyle: "short" })}.`;
                const system = [SYSTEM_PROMPT, NORMA_BLOCKS[norm], MODO_BLOCKS[modo], fechaHoyBlock, PROCESOS_BLOCK, INVENTARIO_BLOCK, retrievedBlock].filter(Boolean).join("\n\n");

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
                    consultarClientes: tool({
                        description: "Consulta el registro real y actual de clientes de CES y sus contratos, sincronizado desde SharePoint.",
                        inputSchema: z.object({}),
                        execute: async () => {
                            const stored = await getClientes<typeof CLIENTES>().catch(() => null);
                            return stored ?? CLIENTES;
                        },
                    }),
                    consultarDocumentacion: tool({
                        description:
                            "Consulta el registro real y actual de documentos del SIG (nombre, código, responsable, fecha de publicación/actualización, ubicación), sincronizado desde 'Procesos CES - Documentación'. Úsala para saber qué evidencia/documentos YA EXISTEN — nunca le preguntes al usuario dónde está la evidencia, esta herramienta ya lo sabe. Pasa 'proceso' SIEMPRE que estés auditando un proceso específico. Si total sale 0, dilo explícitamente en vez de mostrar documentos de otro proceso. La tabla se muestra sola en su propia tarjeta — sigue en el MISMO turno con preguntarOpciones/preguntarAbierta (ver REGLA MAESTRA); cualquier comentario sobre los documentos va en el campo 'contexto' de esa pregunta, no como texto aparte.",
                        inputSchema: z.object({
                            proceso: z.string().optional().describe("Nombre del proceso CES a filtrar. Omite solo si de verdad quieres TODOS los documentos sin filtrar."),
                        }),
                        execute: async ({ proceso }) => {
                            const stored = await getDocumentacion<typeof DOCUMENTOS>().catch(() => null);
                            const documentos = (stored ?? DOCUMENTOS).map(({ proximaRevision: _proximaRevision, ...doc }) => doc);
                            if (!proceso) return { proceso: null, total: documentos.length, documentos };
                            const filtrados = documentos.filter((d) => matchesProceso(d.ubicacion, proceso));
                            return { proceso, total: filtrados.length, documentos: filtrados };
                        },
                    }),
                    proponerHallazgo: tool({
                        description:
                            "Propone un hallazgo de auditoría (no conformidad, riesgo no gestionado u oportunidad de mejora) para registrarlo en el dashboard — SIEMPRE requiere confirmación explícita del usuario antes de guardarse (¿está de acuerdo con el hallazgo, lo confirma o lo descarta?). Llámala en cuanto identifiques un hallazgo concreto durante la auditoría, no esperes al final. Si el usuario la descarta, NO insistas con el mismo hallazgo — retómalo solo si el usuario da información nueva que lo justifique de nuevo.",
                        inputSchema: z.object({
                            proceso: z.string().describe("Proceso CES auditado donde se encontró el hallazgo"),
                            titulo: z.string().describe("Título corto del hallazgo"),
                            descripcion: z.string().describe("Descripción detallada de qué se encontró y por qué es un hallazgo"),
                            nivelRiesgo: z.enum(["Bajo", "Medio", "Alto", "Crítico"]).optional().describe("Nivel de riesgo asociado, si aplica"),
                            recomendacion: z.string().describe("Recomendación de tratamiento o acción correctiva"),
                            evidenciaUbicacion: z.string().optional().describe("Ubicación de la evidencia ya identificada vía consultarDocumentacion (SharePoint, SAP, Power BI, etc.), nunca el archivo en sí"),
                        }),
                        needsApproval: true,
                        execute: async (input) => {
                            const saved = await saveHallazgo({ ...input, responsable: session.name });
                            return { guardado: true, hallazgo: saved };
                        },
                    }),
                    preguntarOpciones: tool({
                        description:
                            "Presenta una pregunta CERRADA como una tarjeta interactiva con botones de opción — la ÚNICA forma de hacer preguntas cerradas durante la auditoría (elegir un proceso, cumple/no cumple/parcial, sí/no, calificar un nivel), nunca texto plano. El campo 'contexto' es el ÚNICO lugar donde una explicación tuya se muestra junto a esta pregunta — no la escribas aparte, no se vería.",
                        inputSchema: z.object({
                            contexto: z.string().max(240).optional().describe("Explicación breve opcional antes de la pregunta (2-4 líneas en modo Principiante, vacío en Intermedio/Avanzado salvo que se pida). Único texto tuyo visible junto a esta tarjeta."),
                            pregunta: z.string().max(300).describe("La pregunta a mostrar"),
                            // max(60) es a propósito estricto: cada opción es el texto de un botón, no un
                            // resumen — si el modelo intenta meter una oración larga o varios datos
                            // concatenados, la validación falla y lo obliga a corregirlo antes de mostrarlo.
                            opciones: z.array(z.string().min(1).max(60)).min(2).max(8).describe("Opciones de respuesta CORTAS (máximo ~60 caracteres cada una, como el texto de un botón) — nunca una oración larga ni varios datos concatenados"),
                            permiteOtro: z.boolean().optional().describe("Si además de las opciones se debe mostrar un campo para escribir una respuesta distinta (por defecto true)"),
                        }),
                        execute: async (input) => input,
                    }),
                    preguntarAbierta: tool({
                        description:
                            "Presenta una pregunta genuinamente ABIERTA (una descripción, una fecha, un nombre — algo que no cabe en 2-8 opciones concretas) como una tarjeta con un campo de texto — la ÚNICA forma de hacer preguntas abiertas durante la auditoría, nunca texto plano suelto. El campo 'contexto' es el ÚNICO lugar donde una explicación tuya se muestra junto a esta pregunta.",
                        inputSchema: z.object({
                            contexto: z.string().max(240).optional().describe("Explicación breve opcional antes de la pregunta. Único texto tuyo visible junto a esta tarjeta."),
                            pregunta: z.string().max(300).describe("La pregunta a mostrar"),
                            placeholder: z.string().max(80).optional().describe("Texto de ejemplo dentro del campo de respuesta"),
                        }),
                        execute: async (input) => input,
                    }),
                    generarInformeAuditoria: tool({
                        description:
                            "Cierra la auditoría de un proceso con un informe estructurado (no vuelve a guardar hallazgos, esos ya se guardaron individualmente vía proponerHallazgo — este tool es solo para presentar el cierre). Úsalo UNA vez, cuando termines genuinamente de auditar el proceso.",
                        inputSchema: z.object({
                            proceso: z.string().describe("Proceso CES que se auditó"),
                            resumenEjecutivo: z.string().describe("Resumen breve de qué se revisó y cómo quedó el proceso"),
                            hallazgosRegistrados: z.number().describe("Cantidad de hallazgos registrados durante esta auditoría (0 si no se encontró ninguno)"),
                            recomendaciones: z.array(z.string()).describe("Lista de recomendaciones u oportunidades de mejora, aunque no se hayan registrado como hallazgo"),
                        }),
                        execute: async (input) => input,
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

                // gpt-4o-mini no respetaba de forma consistente reglas de formato con varias
                // instrucciones simultáneas (no repetir documentos, usar preguntarOpciones siempre) —
                // gpt-4.1-mini sigue instrucciones sensiblemente mejor a una fracción del costo de
                // gpt-4o, así que es el punto intermedio entre cumplimiento y gasto de tokens.
                const result = streamText({
                    model: openai("gpt-4.1-mini"),
                    system,
                    messages: await convertToModelMessages(messages),
                    tools,
                    stopWhen: stepCountIs(30),
                });

                return result.toUIMessageStreamResponse({ originalMessages: messages });
            },
        },
    },
});
