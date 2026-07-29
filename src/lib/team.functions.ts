import { createServerFn } from "@tanstack/react-start";
import {
    fetchUsersByDisplayNames,
    fetchUsersWithJobTitleContaining,
    fetchUsersWithDepartment,
    fetchGroupMembers,
    fetchPresences,
    checkGraphDirectoryAccess,
    type GraphProfile,
} from "@/lib/auth/entra";
import { getCurrentSession } from "@/lib/auth/session";
import { EQUIPO } from "@/lib/ces-data";

export type TeamMember = GraphProfile & { availability?: string | null };

// Server function (no un endpoint REST aparte) porque solo lo consume el loader de /equipo —
// evita el salto de red extra de auto-llamarse vía fetch desde el propio servidor.
export const getCesTeamFromEntra = createServerFn({ method: "GET" }).handler(async (): Promise<TeamMember[]> => {
    const session = await getCurrentSession();
    if (!session) throw new Error("Unauthorized");

    // Se prueba el acceso al directorio ANTES de las búsquedas individuales: si "User.Read.All" no
    // está concedido, esto falla con un mensaje claro en vez de que cada búsqueda individual falle
    // en silencio y la página parezca mostrar "nadie encontrado" sin explicar por qué.
    await checkGraphDirectoryAccess();

    // El roster conocido se busca por nombre exacto (confiable, no depende de cómo esté redactado
    // el cargo en Entra ID). "department" es la fuente más correcta para "todo el equipo CES" (es
    // literalmente el campo de departamento en el directorio); jobTitle y el grupo de Entra/Teams
    // son redes de respaldo adicionales por si el departamento no está diligenciado para alguien.
    const groupName = process.env.ENTRA_CES_GROUP_NAME;
    const deptName = process.env.ENTRA_CES_DEPARTMENT || "CES";
    const [roster, porDepto, porCargo, porGrupo] = await Promise.all([
        fetchUsersByDisplayNames(EQUIPO.map((m) => m.nombre)),
        fetchUsersWithDepartment(deptName).catch(() => []),
        fetchUsersWithJobTitleContaining("CES").catch(() => []),
        groupName ? fetchGroupMembers(groupName).catch(() => []) : Promise.resolve([]),
    ]);

    const byId = new Map(roster.map((u) => [u.id, u]));
    for (const u of [...porDepto, ...porCargo, ...porGrupo]) if (!byId.has(u.id)) byId.set(u.id, u);
    const users = [...byId.values()];

    // Presence.Read.All también requiere consentimiento de admin aparte — si no está concedido,
    // se sigue mostrando el equipo, solo sin el badge de disponibilidad.
    const presences = await fetchPresences(users.map((u) => u.id)).catch(() => new Map());
    return users.map((u) => ({ ...u, availability: presences.get(u.id)?.availability ?? null }));
});
