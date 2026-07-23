// Integración con Microsoft Entra ID (Azure AD) vía llamadas fetch directas a los endpoints
// v2.0 del identity platform — sin SDK, para mantener compatibilidad con runtimes edge (Workers).

const LOGIN_SCOPES = "openid profile email User.Read";

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

export async function exchangeCodeForAccessToken(code: string): Promise<string> {
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
    const json = (await res.json()) as { access_token: string };
    return json.access_token;
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
