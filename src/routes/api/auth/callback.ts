import { createFileRoute } from "@tanstack/react-router";
import { exchangeCodeForAccessToken, fetchGraphMe } from "@/lib/auth/entra";
import { consumeOAuthState } from "@/lib/auth/oauth-state";
import { setCurrentSession } from "@/lib/auth/session";

export const Route = createFileRoute("/api/auth/callback")({
    server: {
        handlers: {
            GET: async ({ request }) => {
                const url = new URL(request.url);
                const error = url.searchParams.get("error");
                if (error) {
                    return new Response(`Entra devolvió un error: ${error} — ${url.searchParams.get("error_description") ?? ""}`, { status: 400 });
                }

                const code = url.searchParams.get("code");
                const state = url.searchParams.get("state");
                const expectedState = await consumeOAuthState();
                if (!code || !state || !expectedState || state !== expectedState) {
                    return new Response("Solicitud de login inválida o expirada. Intenta iniciar sesión de nuevo.", { status: 400 });
                }

                const accessToken = await exchangeCodeForAccessToken(code);
                const profile = await fetchGraphMe(accessToken);

                await setCurrentSession({
                    oid: profile.id,
                    name: profile.displayName,
                    email: profile.mail ?? profile.userPrincipalName,
                    jobTitle: profile.jobTitle,
                });

                return new Response(null, { status: 302, headers: { Location: "/" } });
            },
        },
    },
});
