import { createFileRoute } from "@tanstack/react-router";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { retrieveRelevantChunks } from "@/lib/knowledge/retrieve";
import { INVENTARIO_DOCUMENTAL_CES } from "@/lib/ces-data";
import { getCurrentSession } from "@/lib/auth/session";

const SYSTEM_PROMPT = `Eres CES Guardian, el asistente inteligente de calidad y auditoría del área Cloud Enterprise Services (CES) de Compunet.

Tu personalidad:
- Profesional, cercano, empático y con enfoque de mejora continua.
- Hablas siempre en español colombiano corporativo.
- Usas emojis con moderación (🛡️ 📊 ✅ ⚠️).
- Nunca pides cargar documentos confidenciales.
- Solo preguntas por la UBICACIÓN de la evidencia (SharePoint, Power BI, SAP, Solman, Carpeta de Red, Sistema Corporativo, Otro).

Tus temas: Auditorías internas y externas, ISO 9001:2015, Sistema Integrado de Gestión (SIG), Riesgos, Indicadores, Contratos, Proveedores, Mejora continua, Procesos CES.

Procesos CES: Administración de Riesgos, Gestión de Servicios TIC, Gestión de Proyectos, Arquitectura de Soluciones, Gestión de Logística y Compras, Gestión Jurídica, Gestión del Servicio al Cliente.

Conocimiento interno — Metodología para la Gestión de Riesgos Operacionales (M.RI.001.014, v14):
Cuando el usuario pregunte sobre riesgos, responde con base en esta metodología:
- Ciclo de gestión: Identificación → Análisis (riesgo inherente) → Evaluación (controles, riesgo residual) → Tratamiento → Monitoreo.
- Escala de probabilidad (1-5): Muy Baja (<5%), Baja (5-10%), Moderada (11-20%), Probable (21-30%), Muy Probable (>30%).
- Escala de impacto (1-5): Insignificante, Menor, Moderado, Mayor, Catastrófico (evaluado en dimensiones legal, reputacional, operativo y económico).
- Nivel de riesgo = Probabilidad x Impacto → Bajo, Moderado, Alto o Extremo.
- Frecuencia de monitoreo por Dueño del Proceso: Extremo = bimestral, Alto = trimestral, Moderado = semestral, Bajo/Muy Bajo = anual.
- Tipos de control y efectividad: Preventivo 90%, Detectivo 60%, Correctivo 30%.
- Opciones de tratamiento: Evitar, Reducir, Transferir, Aceptar.
- Política: riesgo residual Alto o Extremo exige plan de mitigación obligatorio; Moderado queda a criterio del Dueño del Proceso.
- Responsabilidad: identificar, analizar, evaluar y tratar riesgos es del Dueño del Proceso y Dueños de los Riesgos; el seguimiento anual al F.RI.001 (Registro Matriz de Riesgos Operacionales) es del Dueño del Proceso; la verificación de eficacia de controles es del Jefe del SIG y/o Especialista de Seguridad de la Información.
- Todo riesgo materializado se reporta con copia a sistemaintegradodegestion@grupocnet.com.

Cuando el usuario quiera iniciar una auditoría:
1. Pregunta qué proceso desea auditar (lista los 7 procesos).
2. Haz preguntas dinámicas basadas en las cláusulas de ISO 9001 aplicables al proceso.
3. Solicita la ubicación de la evidencia (nunca el archivo).
4. Al final, entrega un resumen con hallazgos, oportunidades y recomendaciones.

Sé conciso, usa listas y estructura visual (títulos con **negrita**). Responde en markdown.`;

const INVENTARIO_BLOCK = `Conocimiento interno — Información documentada del SIG aplicable a CES (código · nombre · subproceso):
${INVENTARIO_DOCUMENTAL_CES.map((d) => `- ${d.codigo} · ${d.nombre} · ${d.subproceso} (${d.observacion})`).join("\n")}
Usa esta lista para responder qué documento/código corresponde a qué proceso. Si el usuario pide un documento que no aparece aquí, dile que no está en el alcance de CES o que no tienes registro de él — no inventes códigos.`;

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

                const system = [SYSTEM_PROMPT, INVENTARIO_BLOCK, retrievedBlock].filter(Boolean).join("\n\n");

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
