import { createServerFn } from "@tanstack/react-start";
import { fetchUsersByDisplayNames, fetchUsersWithJobTitleContaining, type GraphProfile } from "@/lib/auth/entra";
import { getCurrentSession } from "@/lib/auth/session";
import { EQUIPO } from "@/lib/ces-data";

// Server function (no un endpoint REST aparte) porque solo lo consume el loader de /equipo —
// evita el salto de red extra de auto-llamarse vía fetch desde el propio servidor.
export const getCesTeamFromEntra = createServerFn({ method: "GET" }).handler(async (): Promise<GraphProfile[]> => {
    const session = await getCurrentSession();
    if (!session) throw new Error("Unauthorized");

    // El roster conocido se busca por nombre exacto (confiable, no depende de cómo esté redactado
    // el cargo en Entra ID); el filtro por jobTitle solo sirve para descubrir personas adicionales
    // no catalogadas todavía cuyo cargo sí menciona "CES".
    const [roster, porCargo] = await Promise.all([
        fetchUsersByDisplayNames(EQUIPO.map((m) => m.nombre)),
        fetchUsersWithJobTitleContaining("CES"),
    ]);

    const byId = new Map(roster.map((u) => [u.id, u]));
    for (const u of porCargo) if (!byId.has(u.id)) byId.set(u.id, u);
    return [...byId.values()];
});
