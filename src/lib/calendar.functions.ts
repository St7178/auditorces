import { createServerFn } from "@tanstack/react-start";
import { getValidUserAccessToken, fetchCalendarView, type CalendarEvent } from "@/lib/auth/entra";
import { getCurrentSession } from "@/lib/auth/session";

// Server function (como getCesTeamFromEntra) — solo la consume el loader de /cronograma.
export const getMisReuniones = createServerFn({ method: "GET" }).handler(async (): Promise<CalendarEvent[]> => {
    const session = await getCurrentSession();
    if (!session) throw new Error("Unauthorized");

    const accessToken = await getValidUserAccessToken();
    const now = new Date();
    const start = now.toISOString();
    const end = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString();
    return fetchCalendarView(accessToken, start, end);
});
