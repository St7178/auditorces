import { createServerFn } from "@tanstack/react-start";
import { fetchUserCalendarView, type CalendarEvent } from "@/lib/auth/entra";
import { getCurrentSession } from "@/lib/auth/session";

// Buzón fijo de Agenda SIG — por ahora es siempre el mismo, sin importar quién esté logueado.
// Configurable por env var para no requerir un deploy si cambia más adelante.
export const AGENDA_SIG_MAILBOX = process.env.AGENDA_SIG_MAILBOX || "laura.jaramillo@grupocnet.com";

// Server function (como getCesTeamFromEntra) — solo la consume el loader de /cronograma.
export const getAgendaSig = createServerFn({ method: "GET" }).handler(async (): Promise<CalendarEvent[]> => {
    const session = await getCurrentSession();
    if (!session) throw new Error("Unauthorized");

    const now = new Date();
    const start = now.toISOString();
    const end = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString();
    return fetchUserCalendarView(AGENDA_SIG_MAILBOX, start, end);
});
