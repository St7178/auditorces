import { createServerFn } from "@tanstack/react-start";
import { fetchUsersByDisplayNames, fetchUsersWithJobTitleContaining, fetchGroupMembers, fetchPresences, type GraphProfile } from "@/lib/auth/entra";
import { getCurrentSession } from "@/lib/auth/session";
import { EQUIPO } from "@/lib/ces-data";

export type TeamMember = GraphProfile & { availability?: string | null };

// Server function (no un endpoint REST aparte) porque solo lo consume el loader de /equipo —
// evita el salto de red extra de auto-llamarse vía fetch desde el propio servidor.
export const getCesTeamFromEntra = createServerFn({ method: "GET" }).handler(async (): Promise<TeamMember[]> => {
    const session = await getCurrentSession();
    if (!session) throw new Error("Unauthorized");

    // El roster conocido se busca por nombre exacto (confiable, no depende de cómo esté redactado
    // el cargo en Entra ID); el filtro por jobTitle descubre personas adicionales no catalogadas
    // cuyo cargo sí menciona "CES". Si hay un grupo real de Entra/Teams para CES (ENTRA_CES_GROUP_NAME),
    // su membresía es la fuente más confiable de las tres y se agrega también.
    const groupName = process.env.ENTRA_CES_GROUP_NAME;
    const [roster, porCargo, porGrupo] = await Promise.all([
        fetchUsersByDisplayNames(EQUIPO.map((m) => m.nombre)),
        fetchUsersWithJobTitleContaining("CES").catch(() => []),
        groupName ? fetchGroupMembers(groupName).catch(() => []) : Promise.resolve([]),
    ]);

    const byId = new Map(roster.map((u) => [u.id, u]));
    for (const u of [...porCargo, ...porGrupo]) if (!byId.has(u.id)) byId.set(u.id, u);
    const users = [...byId.values()];

    // Presence.Read.All también requiere consentimiento de admin aparte — si no está concedido,
    // se sigue mostrando el equipo, solo sin el badge de disponibilidad.
    const presences = await fetchPresences(users.map((u) => u.id)).catch(() => new Map());
    return users.map((u) => ({ ...u, availability: presences.get(u.id)?.availability ?? null }));
});
