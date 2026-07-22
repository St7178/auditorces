import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/app-shell";
import { getCurrentSession } from "@/lib/auth/session";

const getCurrentUser = createServerFn({ method: "GET" }).handler(async () => {
    return getCurrentSession();
});

export const Route = createFileRoute("/_authenticated")({
    beforeLoad: async () => {
        const user = await getCurrentUser();
        if (!user) throw redirect({ to: "/login" });
        return { user };
    },
    component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
    const { user } = Route.useRouteContext();
    return (
        <AppShell user={user}>
            <Outlet />
        </AppShell>
    );
}
