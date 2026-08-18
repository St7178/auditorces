import { createFileRoute } from "@tanstack/react-router";
import { getCurrentSession } from "@/lib/auth/session";
import { getValidUserAccessToken } from "@/lib/auth/entra";

// Sirve la foto de perfil real de Microsoft (la misma que usa Teams) del usuario logueado, para que
// cualquier <img>/<AvatarImage src="/api/me/photo" /> en la app la muestre sin tener que pedir un
// token de Graph desde el cliente. "User.Read" (ya usado para el login) alcanza para /me/photo.
export const Route = createFileRoute("/api/me/photo")({
    server: {
        handlers: {
            GET: async () => {
                const session = await getCurrentSession();
                if (!session) return new Response("Unauthorized", { status: 401 });

                try {
                    const token = await getValidUserAccessToken();
                    const res = await fetch("https://graph.microsoft.com/v1.0/me/photo/$value", {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    if (!res.ok) return new Response(null, { status: 404 });
                    const buffer = await res.arrayBuffer();
                    const contentType = res.headers.get("content-type") ?? "image/jpeg";
                    return new Response(buffer, {
                        status: 200,
                        headers: { "Content-Type": contentType, "Cache-Control": "private, max-age=3600" },
                    });
                } catch {
                    // Sin foto en Microsoft, o sin sesión de Graph válida (ej. inició sesión antes de
                    // que existiera este endpoint) — se deja caer al AvatarFallback con iniciales.
                    return new Response(null, { status: 404 });
                }
            },
        },
    },
});
