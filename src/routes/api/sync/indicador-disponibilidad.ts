import { createFileRoute } from "@tanstack/react-router";
import { getIndicadorDisponibilidad, saveIndicadorDisponibilidad } from "@/lib/sync-storage";
import { INDICADOR_DISPONIBILIDAD_CES, type IndicadorDisponibilidadCES } from "@/lib/ces-data";

function isIndicadorPayload(body: unknown): body is IndicadorDisponibilidadCES {
    if (!body || typeof body !== "object") return false;
    const b = body as any;
    return Array.isArray(b.tendenciaMensual) && b.detallePorMes && typeof b.detallePorMes === "object";
}

export const Route = createFileRoute("/api/sync/indicador-disponibilidad")({
    server: {
        handlers: {
            GET: async () => {
                let data: IndicadorDisponibilidadCES = INDICADOR_DISPONIBILIDAD_CES;
                try {
                    const stored = await getIndicadorDisponibilidad<IndicadorDisponibilidadCES>();
                    if (stored) data = stored;
                } catch { /* DB no configurada o inalcanzable: se sirve el fallback estático. */ }
                return new Response(JSON.stringify(data), { status: 200, headers: { "Content-Type": "application/json" } });
            },
            POST: async ({ request }) => {
                try {
                    const secret = process.env.SYNC_SECRET;
                    if (secret) {
                        const provided = request.headers.get("x-sync-secret") || request.headers.get("authorization");
                        if (!provided || provided !== secret) return new Response("Unauthorized", { status: 401 });
                    }
                    const body = (await request.json()) as unknown;
                    if (!isIndicadorPayload(body)) {
                        return new Response(JSON.stringify({ error: "Payload inválido: se esperaba { tendenciaMensual: [], detallePorMes: {} }" }), { status: 400, headers: { "Content-Type": "application/json" } });
                    }
                    await saveIndicadorDisponibilidad(body);
                    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } });
                } catch (err: any) {
                    return new Response(JSON.stringify({ error: String(err?.message ?? err) }), { status: 400, headers: { "Content-Type": "application/json" } });
                }
            },
        },
    },
});
