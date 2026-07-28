import { getSession, updateSession, clearSession, type SessionConfig } from "@tanstack/react-start/server";

export type AppSession = {
    oid: string;
    name: string;
    email: string;
    jobTitle?: string | null;
    // Token delegado de Microsoft Graph (Calendars.Read) — se usa para /cronograma. updateSession()
    // hace merge sobre la sesión existente (Object.assign), así que se puede actualizar solo esto.
    msAccessToken?: string;
    msRefreshToken?: string | null;
    msExpiresAt?: number;
};

// No leer process.env a nivel de módulo: en runtimes edge (Cloudflare Workers) el env
// solo existe durante el request. Se construye la config dentro de cada función.
function sessionConfig(): SessionConfig {
    return {
        password: process.env.SESSION_SECRET!,
        name: "ces-hub-session",
        maxAge: 60 * 60 * 8, // 8 horas
        cookie: { httpOnly: true, secure: true, sameSite: "lax", path: "/" },
    };
}

export async function getCurrentSession(): Promise<AppSession | null> {
    const session = await getSession<AppSession>(sessionConfig());
    if (!session.data?.oid) return null;
    return session.data as AppSession;
}

// updateSession() hace merge (Object.assign) sobre los datos existentes de la sesión, no reemplaza
// todo el objeto — por eso acepta un Partial: se puede llamar solo con los campos de token al
// renovarlos, sin tener que releer y re-enviar oid/name/email/jobTitle.
export async function setCurrentSession(data: Partial<AppSession>): Promise<void> {
    await updateSession<AppSession>(sessionConfig(), data as AppSession);
}

export async function destroySession(): Promise<void> {
    await clearSession(sessionConfig());
}
