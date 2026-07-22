import { createStart, createMiddleware, createCsrfMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
    try {
        return await next();
    } catch (error) {
        if (error != null && typeof error === "object" && "statusCode" in error) {
            throw error;
        }
        console.error(error);
        return new Response(renderErrorPage(), {
            status: 500,
            headers: { "content-type": "text/html; charset=utf-8" },
        });
    }
});

// Los server functions (createServerFn) son RPCs same-origin — se validan contra cross-site requests.
// Los server routes (/api/*) ya tienen su propia verificación de sesión/CSRF en cada handler.
const csrfMiddleware = createCsrfMiddleware({
    filter: (ctx) => ctx.handlerType === "serverFn",
});

export const startInstance = createStart(() => ({
    requestMiddleware: [errorMiddleware, csrfMiddleware],
}));
