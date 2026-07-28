import { getCurrentSession, setCurrentSession } from "@/lib/auth/session";

const LOGIN_SCOPES = "openid profile email offline_access User.Read Calendars.Read";

function entraConfig() {
    const tenantId = process.env.ENTRA_TENANT_ID;
    const clientId = process.env.ENTRA_CLIENT_ID;
    const clientSecret = process.env.ENTRA_CLIENT_SECRET;
    const redirectUri = process.env.ENTRA_REDIRECT_URI;
    if (!tenantId || !clientId || !clientSecret || !redirectUri) {
        throw new Error("Faltan variables de entorno ENTRA_TENANT_ID/ENTRA_CLIENT_ID/ENTRA_CLIENT_SECRET/ENTRA_REDIRECT_URI");
    }
    return { tenantId, clientId, clientSecret, redirectUri };
}

export function buildAuthorizeUrl(state: string): string {
    const { tenantId, clientId, redirectUri } = entraConfig();
    const url = new URL(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize`);
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("response_mode", "query");
    url.searchParams.set("scope", LOGIN_SCOPES);
    url.searchParams.set("state", state);
    return url.toString();
}

export function buildLogoutUrl(postLogoutRedirectUri: string): string {
    const { tenantId } = entraConfig();
    const url = new URL(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/logout`);
    url.searchParams.set("post_logout_redirect_uri", postLogoutRedirectUri);
    return url.toString();
}

export type UserTokens = {
    accessToken: string;
    refreshToken: string | null;
    expiresAt: number; // epoch ms
};

export async function exchangeCodeForAccessToken(code: string): Promise<UserTokens> {
    const { tenantId, clientId, clientSecret, redirectUri } = entraConfig();
    const res = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: "authorization_code",
            code,
            redirect_uri: redirectUri,
            scope: LOGIN_SCOPES,
        }),
    });
    if (!res.ok) throw new Error(`Entra token exchange failed (${res.status}): ${await res.text()}`);
    const json = (await res.json()) as { access_token: string; refresh_token?: string; expires_in: number };
    return { accessToken: json.access_token, refreshToken: json.refresh_token ?? null, expiresAt: Date.now() + json.expires_in * 1000 };
}

// El access token del usuario expira ~1h; el refresh token permite renovarlo sin pedirle que
// vuelva a loguearse mientras dure su sesión de 8h en la app.
export async function refreshUserAccessToken(refreshToken: string): Promise<UserTokens> {
    const { tenantId, clientId, clientSecret } = entraConfig();
    const res = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: "refresh_token",
            refresh_token: refreshToken,
            scope: LOGIN_SCOPES,
        }),
    });
    if (!res.ok) throw new Error(`Entra token refresh failed (${res.status}): ${await res.text()}`);
    const json = (await res.json()) as { access_token: string; refresh_token?: string; expires_in: number };
    return { accessToken: json.access_token, refreshToken: json.refresh_token ?? refreshToken, expiresAt: Date.now() + json.expires_in * 1000 };
}

export type CalendarEvent = {
    id: string;
    subject: string;
    start: string;
    end: string;
    organizer: string | null;
    isOnlineMeeting: boolean;
    joinUrl: string | null;
    webLink: string;
};

export async function fetchCalendarView(accessToken: string, startIso: string, endIso: string): Promise<CalendarEvent[]> {
    const url =
        `https://graph.microsoft.com/v1.0/me/calendarView?startDateTime=${encodeURIComponent(startIso)}&endDateTime=${encodeURIComponent(endIso)}` +
        `&$select=id,subject,start,end,organizer,isOnlineMeeting,onlineMeeting,webLink&$orderby=start/dateTime&$top=50`;
    const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}`, Prefer: 'outlook.timezone="America/Bogota"' },
    });
    if (!res.ok) throw new Error(`Graph /me/calendarView failed (${res.status}): ${await res.text()}`);
    const json = (await res.json()) as {
        value: Array<{
            id: string;
            subject: string;
            start: { dateTime: string };
            end: { dateTime: string };
            organizer?: { emailAddress?: { name?: string } };
            isOnlineMeeting: boolean;
            onlineMeeting?: { joinUrl?: string };
            webLink: string;
        }>;
    };
    return json.value.map((e) => ({
        id: e.id,
        subject: e.subject || "(Sin título)",
        start: e.start.dateTime,
        end: e.end.dateTime,
        organizer: e.organizer?.emailAddress?.name ?? null,
        isOnlineMeeting: e.isOnlineMeeting,
        joinUrl: e.onlineMeeting?.joinUrl ?? null,
        webLink: e.webLink,
    }));
}

export type GraphProfile = {
    id: string;
    displayName: string;
    mail: string | null;
    userPrincipalName: string;
    jobTitle: string | null;
    photoUrl?: string | null;
};

export async function fetchGraphMe(accessToken: string): Promise<GraphProfile> {
    const res = await fetch(
        "https://graph.microsoft.com/v1.0/me?$select=id,displayName,mail,userPrincipalName,jobTitle",
        { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    if (!res.ok) throw new Error(`Graph /me failed (${res.status}): ${await res.text()}`);
    return res.json();
}

// Token de aplicación (client credentials) — para operaciones que leen todo el directorio
// (fuera del contexto de un usuario con sesión), como listar el equipo CES en /equipo.
// Requiere el permiso de aplicación "User.Read.All" en Microsoft Graph con consentimiento de admin.
let cachedAppToken: { token: string; expiresAt: number } | null = null;

export async function getGraphAppToken(): Promise<string> {
    if (cachedAppToken && cachedAppToken.expiresAt > Date.now() + 30_000) {
        return cachedAppToken.token;
    }
    const { tenantId, clientId, clientSecret } = entraConfig();
    const res = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: "client_credentials",
            scope: "https://graph.microsoft.com/.default",
        }),
    });
    if (!res.ok) throw new Error(`Entra app token failed (${res.status}): ${await res.text()}`);
    const json = (await res.json()) as { access_token: string; expires_in: number };
    cachedAppToken = { token: json.access_token, expiresAt: Date.now() + json.expires_in * 1000 };
    return cachedAppToken.token;
}

function escapeODataStringLiteral(value: string): string {
    return value.replace(/'/g, "''");
}

// Devuelve la foto de perfil como data URI, o null si el usuario no tiene una (Graph responde 404).
async function fetchUserPhoto(userId: string, token: string): Promise<string | null> {
    const res = await fetch(`https://graph.microsoft.com/v1.0/users/${userId}/photo/$value`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") ?? "image/jpeg";
    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    return `data:${contentType};base64,${base64}`;
}

// $filter=contains(...) es una "advanced query" en Graph: exige el header ConsistencyLevel: eventual
// y el parámetro $count=true, aunque no se use el conteo directamente.
export async function fetchUsersWithJobTitleContaining(term: string): Promise<GraphProfile[]> {
    const token = await getGraphAppToken();
    const filter = `contains(jobTitle,'${escapeODataStringLiteral(term)}')`;
    const url =
        `https://graph.microsoft.com/v1.0/users?$filter=${encodeURIComponent(filter)}` +
        `&$select=id,displayName,mail,userPrincipalName,jobTitle&$count=true&$top=999`;
    const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}`, ConsistencyLevel: "eventual" },
    });
    if (!res.ok) throw new Error(`Graph /users failed (${res.status}): ${await res.text()}`);
    const json = (await res.json()) as { value: GraphProfile[] };

    const users = await Promise.all(
        json.value.map(async (u) => ({ ...u, photoUrl: await fetchUserPhoto(u.id, token).catch(() => null) })),
    );
    return users;
}

// Busca cada nombre por coincidencia exacta de displayName. A diferencia del filtro por jobTitle,
// no depende de que el cargo real en Entra ID contenga la palabra "CES" (la mayoría no la contiene),
// así que es la forma confiable de traer nombre, cargo y foto reales del roster conocido de CES.
export async function fetchUsersByDisplayNames(names: string[]): Promise<GraphProfile[]> {
    const token = await getGraphAppToken();

    const results = await Promise.all(
        names.map(async (name) => {
            const filter = `displayName eq '${escapeODataStringLiteral(name)}'`;
            const url =
                `https://graph.microsoft.com/v1.0/users?$filter=${encodeURIComponent(filter)}` +
                `&$select=id,displayName,mail,userPrincipalName,jobTitle&$top=1`;
            const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) return null;
            const json = (await res.json()) as { value: GraphProfile[] };
            return json.value[0] ?? null;
        }),
    );

    const found = results.filter((u): u is GraphProfile => u !== null);
    return Promise.all(found.map(async (u) => ({ ...u, photoUrl: await fetchUserPhoto(u.id, token).catch(() => null) })));
}

// Token delegado (Calendars.Read) del usuario logueado, renovándolo con el refresh token si ya
// expiró. Si el usuario inició sesión antes de agregar este scope, no habrá msRefreshToken todavía
// — por eso el error pide volver a loguearse en vez de fallar en silencio.
export async function getValidUserAccessToken(): Promise<string> {
    const session = await getCurrentSession();
    if (!session?.msAccessToken) {
        throw new Error("No hay sesión de Microsoft con acceso al calendario. Cierra sesión y vuelve a iniciarla.");
    }
    if (session.msExpiresAt && session.msExpiresAt > Date.now() + 30_000) {
        return session.msAccessToken;
    }
    if (!session.msRefreshToken) {
        throw new Error("La sesión de Microsoft expiró y no se puede renovar. Cierra sesión y vuelve a iniciarla.");
    }
    const refreshed = await refreshUserAccessToken(session.msRefreshToken);
    await setCurrentSession({
        msAccessToken: refreshed.accessToken,
        msRefreshToken: refreshed.refreshToken,
        msExpiresAt: refreshed.expiresAt,
    });
    return refreshed.accessToken;
}

// Requiere el permiso de aplicación "Group.Read.All" con consentimiento de admin. Busca el grupo
// por nombre exacto y devuelve sus miembros con foto — misma forma que fetchUsersByDisplayNames,
// para poder mezclarlos en team.functions.ts sin distinguir la fuente.
export async function fetchGroupMembers(groupDisplayName: string): Promise<GraphProfile[]> {
    const token = await getGraphAppToken();
    const groupFilter = `displayName eq '${escapeODataStringLiteral(groupDisplayName)}'`;
    const groupRes = await fetch(
        `https://graph.microsoft.com/v1.0/groups?$filter=${encodeURIComponent(groupFilter)}&$select=id`,
        { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!groupRes.ok) throw new Error(`Graph /groups failed (${groupRes.status}): ${await groupRes.text()}`);
    const groupJson = (await groupRes.json()) as { value: Array<{ id: string }> };
    const groupId = groupJson.value[0]?.id;
    if (!groupId) return [];

    const membersRes = await fetch(
        `https://graph.microsoft.com/v1.0/groups/${groupId}/members?$select=id,displayName,mail,userPrincipalName,jobTitle&$top=999`,
        { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!membersRes.ok) throw new Error(`Graph /groups/members failed (${membersRes.status}): ${await membersRes.text()}`);
    const membersJson = (await membersRes.json()) as { value: GraphProfile[] };

    return Promise.all(
        membersJson.value.map(async (u) => ({ ...u, photoUrl: await fetchUserPhoto(u.id, token).catch(() => null) })),
    );
}

export type PresenceStatus = { userId: string; availability: string; activity: string };

// Requiere el permiso de aplicación "Presence.Read.All" con consentimiento de admin. Un solo
// request por lote (máx. 650 ids) en vez de uno por usuario.
export async function fetchPresences(userIds: string[]): Promise<Map<string, PresenceStatus>> {
    if (!userIds.length) return new Map();
    const token = await getGraphAppToken();
    const res = await fetch("https://graph.microsoft.com/v1.0/communications/getPresencesByUserId", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ ids: userIds }),
    });
    if (!res.ok) throw new Error(`Graph presence failed (${res.status}): ${await res.text()}`);
    const json = (await res.json()) as { value: Array<{ id: string; availability: string; activity: string }> };
    return new Map(json.value.map((p) => [p.id, { userId: p.id, availability: p.availability, activity: p.activity }]));
}

export type NewMeeting = {
    subject: string;
    startIso: string;
    endIso: string;
    description?: string;
    attendeeEmails?: string[];
    isOnlineMeeting?: boolean;
};

export type CreatedMeeting = { id: string; webLink: string; joinUrl: string | null };

// Requiere el scope delegado "Calendars.ReadWrite" (token del usuario logueado, no de aplicación).
export async function createCalendarEvent(accessToken: string, meeting: NewMeeting): Promise<CreatedMeeting> {
    const res = await fetch("https://graph.microsoft.com/v1.0/me/events", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({
            subject: meeting.subject,
            body: { contentType: "text", content: meeting.description ?? "" },
            start: { dateTime: meeting.startIso, timeZone: "America/Bogota" },
            end: { dateTime: meeting.endIso, timeZone: "America/Bogota" },
            attendees: (meeting.attendeeEmails ?? []).map((email) => ({ emailAddress: { address: email }, type: "required" })),
            isOnlineMeeting: meeting.isOnlineMeeting ?? true,
            onlineMeetingProvider: meeting.isOnlineMeeting === false ? undefined : "teamsForBusiness",
        }),
    });
    if (!res.ok) throw new Error(`Graph create event failed (${res.status}): ${await res.text()}`);
    const json = (await res.json()) as { id: string; webLink: string; onlineMeeting?: { joinUrl?: string } };
    return { id: json.id, webLink: json.webLink, joinUrl: json.onlineMeeting?.joinUrl ?? null };
}
