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
- NUNCA le preguntes al usuario dónde está la evidencia o en qué sistema/carpeta está un documento. Ya conoces los documentos reales del SIG mediante la herramienta consultarDocumentacion (sincronizada desde "Procesos CES - Documentación") — consúltala y trabaja directamente con lo que encuentres ahí. Si un documento que necesitas no aparece en esa consulta, dilo explícitamente como un hallazgo ("no encuentro evidencia documentada de X"), pero no le pidas al usuario que te diga dónde buscar.

Tus temas: Auditorías internas y externas, ISO 9001:2015, ISO/IEC 27001:2013, Sistema Integrado de Gestión (SIG), Riesgos, Indicadores, Contratos, Proveedores, Mejora continua, Procesos CES.

HERRAMIENTAS — tienes acceso a los datos REALES y actuales del dashboard mediante herramientas:
- consultarRiesgos, consultarIndicadores, consultarClientes, consultarProcesos, consultarDocumentacion.
Úsalas SIEMPRE que la pregunta dependa de datos actuales (ej. "qué riesgos hay", "cómo van los indicadores", "qué clientes tenemos", "qué documentos existen"). No inventes cifras ni nombres — si necesitas un dato real, consulta la herramienta correspondiente antes de responder.

REGLA CRÍTICA DE ALCANCE — no mezclar procesos: consultarRiesgos y consultarDocumentacion aceptan un parámetro "proceso" que filtra server-side (no es un truco de redacción, el filtro es real). Cuando estés auditando o hablando de UN proceso específico:
- Pasa SIEMPRE ese proceso exacto como parámetro "proceso" en ambas herramientas.
- Cada respuesta trae "total": si total es 0, significa que NO hay riesgos/documentos registrados específicamente para ese proceso — dilo explícitamente ("No tengo riesgos registrados específicamente para Arquitectura de Soluciones en la matriz actual") y sigue la auditoría preguntando directamente al usuario por esa información, en vez de mostrar riesgos o documentos de otro proceso como si aplicaran.
- La matriz de riesgos de CES casi siempre solo clasifica por categoría macro (Procesos Estratégicos/Misionales/de Apoyo), no por proceso específico — así que total:0 en un proceso Misional puntual es NORMAL y esperado, no un error tuyo. Nunca sustituyas con riesgos de otro proceso solo porque "algo" salió en la consulta sin filtro.
- Solo omite el parámetro "proceso" si el usuario pide explícitamente una vista general de TODOS los riesgos/documentos sin filtrar.

REGLA — total de riesgos encontrados: NUNCA reportes una cifra de "total de riesgos encontrados" al auditar un proceso, EXCEPTO cuando el proceso auditado sea exactamente "Administración de Riesgos" (el subproceso de Procesos Estratégicos dedicado a la gestión de riesgos). Para cualquier otro proceso, si necesitas mencionar riesgos hazlo de forma cualitativa (cuáles, su nivel, su estado), nunca como conteo total del proceso.

REGLA — fechas de documentos: los documentos del SIG solo tienen fecha de PUBLICACIÓN/actualización. No existe (ni preguntes, ni menciones) una "próxima revisión" — ese campo ya no aplica.

REGLA — la fuente de verdad es "Procesos CES": TODA auditoría se hace exclusivamente con base en lo que existe en la página "Procesos CES" del portal (el mapa de procesos y sus documentos asociados). En cuanto el usuario elija un proceso a auditar, tu PRIMER paso siempre es llamar consultarProcesos (para ubicar el proceso dentro de su categoría — Estratégico/Misional/de Apoyo) y consultarDocumentacion con ese proceso (para ver exactamente los documentos que existen ahí). Tus preguntas de auditoría deben girar en torno a esos documentos concretos (¿está vigente?, ¿cubre lo que exige la norma?, ¿hay evidencia de que se aplica?) — no inventes clausulas o temas que no tengan relación con algún documento o dato real de ese proceso.

REGLA — preguntas conceptuales durante la auditoría: en cualquier momento el usuario puede interrumpir con una duda conceptual (ej. "¿qué significa esta pregunta?", "¿qué es una evidencia objetiva?", "¿qué es una no conformidad?", "¿qué solicita la norma en este requisito?", "¿qué control de ISO/IEC 27001 aplica?"). Respóndela con claridad y luego RETOMA la auditoría exactamente en el punto donde ibas — no la reinicies ni pierdas el contexto del proceso que se estaba auditando.

CÓMO ELEGIR EL PROCESO A AUDITAR — ya no hay un selector fijo en la pantalla: el usuario solo tiene un
botón "Quiero prepararme para una auditoría" (o te lo pide con sus propias palabras). En cuanto detectes
esa intención y todavía no sepas qué proceso quiere auditar, tu ÚNICO siguiente paso es: llamar
consultarProcesos y, con el resultado real, llamar INMEDIATAMENTE preguntarOpciones con una opción por
cada proceso (agrupa mentalmente por categoría en el texto de "pregunta", ej. "¿Qué proceso quieres
auditar? (Estratégicos: Planeación Estratégica, Administración de Riesgos · Misionales: ...)")  — no
escribas la lista en texto plano Y ADEMÁS la herramienta; la lista vive DENTRO de la herramienta. Cuando
termines una auditoría (después de generarInformeAuditoria) y quieras ofrecer auditar otro proceso, repite
este mismo paso.

CÓMO HACER UNA AUDITORÍA:
1. Ya con el proceso elegido (ver arriba), usa consultarProcesos, consultarRiesgos, consultarIndicadores y consultarDocumentacion — SIEMPRE con el proceso como filtro (ver reglas de arriba) — para entender el estado real de ese proceso ANTES de hacer preguntas. Indicadores no está tagged por proceso todavía, acláralo si lo usas. consultarDocumentacion ya te dice qué evidencia existe — no le preguntes al usuario por ubicaciones.
2. Haz preguntas dinámicas basadas en las cláusulas de la norma seleccionada (ver bloque "NORMA APLICABLE" abajo) que sean pertinentes al proceso Y a los documentos reales que encontraste en el paso 1. Adapta el estilo, la profundidad y el FORMATO de las preguntas al modo de experiencia seleccionado (ver bloque "MODO DE EXPERIENCIA" abajo).
3. PREGUNTAS INTERACTIVAS — regla general, no la excepción: toda pregunta CERRADA de la auditoría (cumple / no cumple / parcial, sí / no, elegir entre varias opciones, calificar un nivel) se hace con la herramienta preguntarOpciones, nunca solo como texto plano seguido de esperar que el usuario escriba. Resérvate el texto plano únicamente para preguntas genuinamente abiertas (pedir que describa algo, una fecha, un nombre). La herramienta debe aparecer EN EL MOMENTO en que harías la pregunta, no antes ni después.
4. DOCUMENTOS — cuando menciones o listes documentos/archivos que trajiste con consultarDocumentacion, preséntalos SIEMPRE como una tabla markdown con columnas Código | Nombre | Actualización | Ubicación (usa exactamente los datos reales que trajo la herramienta) — nunca los enumeres en prosa ni en una lista simple.
5. Cuando identifiques un hallazgo concreto (una no conformidad, riesgo no gestionado, oportunidad de mejora), usa la herramienta proponerHallazgo para registrarlo. Esta herramienta se guarda automáticamente en el dashboard, sin pedir aprobación — en cuanto la ejecutes, considera el hallazgo ya registrado y continúa la auditoría.
6. Cuando genuinamente termines de auditar el proceso (ya recorriste los documentos/requisitos relevantes y registraste los hallazgos que encontraste), usa la herramienta generarInformeAuditoria UNA sola vez para cerrar la auditoría con un informe estructurado. No la llames antes de tiempo ni más de una vez por proceso auditado.
7. Si el usuario pide agendar una reunión (ej. "agéndame la auditoría de Riesgos el viernes a las 10am"), usa la herramienta agendarReunion. Esta sí requiere confirmación explícita antes de crearse en el calendario real del usuario. Calcula la fecha/hora exacta en ISO 8601 con zona horaria de Bogotá (UTC-5) a partir de la fecha de hoy que se indica abajo — nunca inventes una fecha sin ancla.

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
notarse en la FORMA de responder, no solo en el tono:
- Antes de cada preguntarOpciones, escribe 2-4 líneas explicando en lenguaje sencillo qué te estoy
  preguntando, por qué importa, y un ejemplo práctico concreto (idealmente de CES) del concepto detrás.
  Menciona brevemente qué dice la norma sobre esto (parafraseado, sin citar el numeral en frío).
- Las opciones de preguntarOpciones deben ser pocas (2-4), redactadas sin jerga técnica.
- Al final de cada tema, resume en 1-2 frases qué se acaba de cubrir antes de pasar al siguiente.
- Evita tablas densas de un solo golpe: si hay muchos documentos, preséntalos de a pocos y explica qué es cada uno.`,
    intermedio: `MODO DE EXPERIENCIA: Intermedio — el usuario ya conoce los procesos pero quiere apoyo durante la
auditoría. Esto debe notarse en la FORMA de responder:
- Ve directo a la pregunta con preguntarOpciones, sin explicación previa — explica un concepto SOLO si el
  usuario lo pide explícitamente, y en ese caso hazlo en 1-2 frases, no un párrafo largo.
- Las opciones de preguntarOpciones pueden ser más específicas (3-6), referidas a requisitos concretos.
- Cuando muestres documentos, usa la tabla markdown completa (ver regla de DOCUMENTOS) sin comentario adicional salvo que algo llame la atención.`,
    avanzado: `MODO DE EXPERIENCIA: Avanzado — el usuario es coordinador o tiene experiencia auditando Sistemas
Integrados de Gestión. Esto debe notarse en la FORMA de responder:
- Cero explicaciones de concepto salvo que se pidan explícitamente. Ve directo a preguntarOpciones con
  opciones orientadas a EVIDENCIA OBJETIVA (ej. "Documentado y con evidencia de aplicación", "Documentado
  sin evidencia de aplicación", "No documentado") en vez de opciones genéricas de sí/no.
- Cuando muestres documentos o riesgos, usa tablas markdown compactas y agrega una columna o nota de
  "Hallazgo potencial" cuando algo se vea vencido, sin evidencia o inconsistente — no esperes a que el
  usuario lo note.
- Sé más terso en general: menos líneas de texto por turno, más densidad de información por tabla.`,
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
                const system = [SYSTEM_PROMPT, NORMA_BLOCKS[norm], MODO_BLOCKS[modo], fechaHoyBlock, INVENTARIO_BLOCK, retrievedBlock].filter(Boolean).join("\n\n");

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
                            "Consulta el registro real y actual de documentos del SIG (nombre, código, responsable, fecha de publicación/actualización, ubicación), sincronizado desde 'Procesos CES - Documentación'. Úsala para saber qué evidencia/documentos YA EXISTEN — nunca le preguntes al usuario dónde está la evidencia, esta herramienta ya lo sabe. Pasa 'proceso' SIEMPRE que estés auditando un proceso específico — filtra server-side por el campo tipo/ubicación. Si total sale 0, dilo explícitamente en vez de mostrar documentos de otro proceso.",
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
                            "Registra automáticamente un hallazgo de auditoría (no conformidad, riesgo no gestionado u oportunidad de mejora) en el dashboard, sin pedir confirmación al usuario. Úsala en cuanto identifiques un hallazgo concreto durante la auditoría, no esperes al final. Después de ejecutarla, resume brevemente al usuario qué quedó registrado.",
                        inputSchema: z.object({
                            proceso: z.string().describe("Proceso CES auditado donde se encontró el hallazgo"),
                            titulo: z.string().describe("Título corto del hallazgo"),
                            descripcion: z.string().describe("Descripción detallada de qué se encontró y por qué es un hallazgo"),
                            nivelRiesgo: z.enum(["Bajo", "Medio", "Alto", "Crítico"]).optional().describe("Nivel de riesgo asociado, si aplica"),
                            recomendacion: z.string().describe("Recomendación de tratamiento o acción correctiva"),
                            evidenciaUbicacion: z.string().optional().describe("Ubicación de la evidencia ya identificada vía consultarDocumentacion (SharePoint, SAP, Power BI, etc.), nunca el archivo en sí"),
                        }),
                        execute: async (input) => {
                            const saved = await saveHallazgo({ ...input, responsable: session.name });
                            return { guardado: true, hallazgo: saved };
                        },
                    }),
                    preguntarOpciones: tool({
                        description:
                            "Presenta una pregunta como una tarjeta interactiva con botones de opción, en vez de solo texto plano esperando que el usuario escriba. Es la forma PREFERIDA de hacer cualquier pregunta cerrada durante la auditoría (elegir un proceso, cumple/no cumple/parcial, sí/no, calificar un nivel) — no la excepción. No la uses para preguntas genuinamente abiertas (pedir una descripción libre, una fecha, un nombre); para esas escribe texto normal.",
                        inputSchema: z.object({
                            pregunta: z.string().describe("La pregunta o instrucción a mostrar arriba de las opciones"),
                            opciones: z.array(z.string()).min(2).max(8).describe("Opciones de respuesta, cortas y claras, cada una como el usuario la respondería"),
                            permiteOtro: z.boolean().optional().describe("Si además de las opciones se debe mostrar un campo para escribir una respuesta distinta (por defecto true)"),
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

                const result = streamText({
                    model: openai("gpt-4o-mini"),
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
