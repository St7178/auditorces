import { createFileRoute } from "@tanstack/react-router";
import { buildAuthorizeUrl } from "@/lib/auth/entra";
import { issueOAuthState } from "@/lib/auth/oauth-state";

export const Route = createFileRoute("/api/auth/login")({
    server: {
        handlers: {
            GET: async () => {
                const state = crypto.randomUUID();
                await issueOAuthState(state);
                return new Response(null, {
                    status: 302,
                    headers: { Location: buildAuthorizeUrl(state) },
                });
            },
        },
    },
});
