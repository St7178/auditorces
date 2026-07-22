import { createFileRoute } from "@tanstack/react-router";
import { destroySession } from "@/lib/auth/session";

export const Route = createFileRoute("/api/auth/logout")({
    server: {
        handlers: {
            GET: async () => {
                await destroySession();
                return new Response(null, { status: 302, headers: { Location: "/login" } });
            },
        },
    },
});
