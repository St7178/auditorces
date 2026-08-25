import { createFileRoute } from "@tanstack/react-router";
import { getHallazgos, setMitigacion, setPaso, type Paso } from "@/lib/hallazgos-storage";
import { getCurrentSession } from "@/lib/auth/session";
import { getValidUserAccessToken, createCalendarEvent } from "@/lib/auth/entra";
import { AGENDA_SIG_MAILBOX } from "@/lib/calendar.functions";

const PASOS_VALIDOS: Paso[] = ["identifico", "agenda", "soluciono"];

export const Route = createFileRoute("/api/hallazgos")({
    server: {
        handlers: {
            GET: async () => {
                const session = await getCurrentSession();
                if (!session) return new Response("Unauthorized", { status: 401 });

                try {
                    const hallazgos = await getHallazgos();
                    return new Response(JSON.stringify(hallazgos), { status: 200, headers: { "Content-Type": "application/json" } });
                } catch {
                    return new Response(JSON.stringify([]), { status: 200, headers: { "Content-Type": "application/json" } });
                }
            },
            // Un solo endpoint POST con tres formas de body, distinguidas por qué campos trae — evita
            // agregar rutas nuevas por cada acción chica sobre un hallazgo.
            POST: async ({ request }) => {
                const session = await getCurrentSession();
                if (!session) return new Response("Unauthorized", { status: 401 });

                try {
                    const body = (await request.json()) as {
                        id?: string;
                        mitigado?: boolean;
                        comentario?: string | null;
                        paso?: Paso;
                        valor?: boolean;
                        agendar?: { titulo?: string; startIso: string; endIso: string };
                    };
                    if (typeof body.id !== "string" || !body.id) {
                        return new Response(JSON.stringify({ error: "Se espera un campo 'id'" }), { status: 400, headers: { "Content-Type": "application/json" } });
                    }

                    if (body.agendar) {
                        const { titulo, startIso, endIso } = body.agendar;
                        if (!startIso || !endIso) {
                            return new Response(JSON.stringify({ error: "Se espera { agendar: { startIso, endIso } }" }), { status: 400, headers: { "Content-Type": "application/json" } });
                        }
                        const accessToken = await getValidUserAccessToken();
                        const evento = await createCalendarEvent(accessToken, {
                            subject: titulo || "Seguimiento de hallazgo de auditoría",
                            startIso,
                            endIso,
                            // Laura (coordinadora de calidad CES) siempre queda invitada a estos
                            // seguimientos de hallazgo, sin importar quién los agende.
                            attendeeEmails: [AGENDA_SIG_MAILBOX],
                        });
                        const hallazgo = await setPaso(body.id, "agenda", true);
                        return new Response(JSON.stringify({ evento, hallazgo }), { status: 200, headers: { "Content-Type": "application/json" } });
                    }

                    if (body.paso) {
                        if (!PASOS_VALIDOS.includes(body.paso) || typeof body.valor !== "boolean") {
                            return new Response(JSON.stringify({ error: "Se espera { id, paso: 'identifico'|'agenda'|'soluciono', valor: boolean }" }), { status: 400, headers: { "Content-Type": "application/json" } });
                        }
                        const hallazgo = await setPaso(body.id, body.paso, body.valor);
                        return new Response(JSON.stringify(hallazgo), { status: 200, headers: { "Content-Type": "application/json" } });
                    }

                    if (typeof body.mitigado !== "boolean") {
                        return new Response(JSON.stringify({ error: "Se espera { id: string, mitigado: boolean, comentario?: string }" }), { status: 400, headers: { "Content-Type": "application/json" } });
                    }
                    const hallazgo = await setMitigacion(body.id, body.mitigado, body.comentario ?? null);
                    return new Response(JSON.stringify(hallazgo), { status: 200, headers: { "Content-Type": "application/json" } });
                } catch (err: any) {
                    return new Response(JSON.stringify({ error: String(err?.message ?? err) }), { status: 400, headers: { "Content-Type": "application/json" } });
                }
            },
        },
    },
});
