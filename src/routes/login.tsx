import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getCurrentSession } from "@/lib/auth/session";

const checkExistingSession = createServerFn({ method: "GET" }).handler(async () => {
    return getCurrentSession();
});

export const Route = createFileRoute("/login")({
    beforeLoad: async () => {
        const session = await checkExistingSession();
        if (session) throw redirect({ to: "/" });
    },
    component: LoginPage,
    head: () => ({ meta: [{ title: "Iniciar sesión — CES SIG" }] }),
});

function LoginPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
            <div className="w-full max-w-sm text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/90">
                    <img
                        src="https://gycqduihf0vkjbnu.public.blob.vercel-storage.com/auditor.png"
                        alt="CES AUDITOR Logo"
                        className="h-14 w-14 object-contain"
                    />
                </div>
                <h1 className="mt-6 text-2xl font-bold">CES AUDITOR</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                    Sistema inteligente de auditoría · Cloud Enterprise Services · Compunet
                </p>
                <a
                    href="/api/auth/login"
                    className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                    Iniciar sesión con Microsoft
                </a>
                <p className="mt-4 text-xs text-muted-foreground">
                    Usa tu cuenta corporativa de Compunet (Microsoft Entra ID).
                </p>
            </div>
        </div>
    );
}
