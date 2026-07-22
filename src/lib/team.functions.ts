import { createServerFn } from "@tanstack/react-start";
import { fetchUsersWithJobTitleContaining, type GraphProfile } from "@/lib/auth/entra";
import { getCurrentSession } from "@/lib/auth/session";

// Server function (no un endpoint REST aparte) porque solo lo consume el loader de /equipo —
// evita el salto de red extra de auto-llamarse vía fetch desde el propio servidor.
export const getCesTeamFromEntra = createServerFn({ method: "GET" }).handler(async (): Promise<GraphProfile[]> => {
    const session = await getCurrentSession();
    if (!session) throw new Error("Unauthorized");
    return fetchUsersWithJobTitleContaining("CES");
});
