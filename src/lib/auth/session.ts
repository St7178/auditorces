import { getSession, updateSession, clearSession, type SessionConfig } from "@tanstack/react-start/server";

export type AppSession = {
    oid: string;
    name: string;
    email: string;
    jobTitle?: string | null;
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

export async function setCurrentSession(data: AppSession): Promise<void> {
    await updateSession<AppSession>(sessionConfig(), data);
}

export async function destroySession(): Promise<void> {
    await clearSession(sessionConfig());
}
