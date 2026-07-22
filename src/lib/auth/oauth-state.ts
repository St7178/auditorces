import { getSession, updateSession, clearSession, type SessionConfig } from "@tanstack/react-start/server";

// Sesión corta y de un solo uso: liga el callback de Entra con el intento de login que lo originó (defensa CSRF).
function stateSessionConfig(): SessionConfig {
    return {
        password: process.env.SESSION_SECRET!,
        name: "ces-hub-oauth-state",
        maxAge: 600, // 10 minutos
        cookie: { httpOnly: true, secure: true, sameSite: "lax", path: "/" },
    };
}

export async function issueOAuthState(state: string): Promise<void> {
    await updateSession<{ state: string }>(stateSessionConfig(), { state });
}

export async function consumeOAuthState(): Promise<string | undefined> {
    const session = await getSession<{ state?: string }>(stateSessionConfig());
    const state = session.data?.state;
    await clearSession(stateSessionConfig());
    return state;
}
