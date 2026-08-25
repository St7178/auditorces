import { createServerFn } from "@tanstack/react-start";
import { getValidUserAccessToken, fetchCalendarView, type CalendarEvent } from "@/lib/auth/entra";
import { getCurrentSession } from "@/lib/auth/session";

// Correo de quien organiza las reuniones que debe mostrar Agenda SIG — por ahora Laura, sin importar
// quién esté logueado. Configurable por env var para no requerir un deploy si cambia más adelante.
export const AGENDA_SIG_MAILBOX = process.env.AGENDA_SIG_MAILBOX || "laura.jaramillo@grupocnet.com";

// Server function (como getCesTeamFromEntra) — solo la consume el loader de /cronograma.
// Agenda SIG no muestra el calendario de Laura: muestra el calendario del usuario logueado,
// filtrado a solo las reuniones que ella organizó/asignó.
export const getAgendaSig = createServerFn({ method: "GET" }).handler(async (): Promise<CalendarEvent[]> => {
    const session = await getCurrentSession();
    if (!session) throw new Error("Unauthorized");

    const accessToken = await getValidUserAccessToken();
    const now = new Date();
    const start = now.toISOString();
    const end = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString();
    const eventos = await fetchCalendarView(accessToken, start, end);
    return eventos.filter((e) => e.organizerEmail?.toLowerCase() === AGENDA_SIG_MAILBOX.toLowerCase());
});
