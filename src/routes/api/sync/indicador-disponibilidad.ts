import { createFileRoute } from "@tanstack/react-router";
import { getIndicadorDisponibilidad, saveIndicadorDisponibilidad } from "@/lib/sync-storage";
import { INDICADOR_DISPONIBILIDAD_CES, type IndicadorDisponibilidadCES } from "@/lib/ces-data";
import { parseIndicadorDisponibilidadFromPdf } from "@/lib/indicador-disponibilidad-parser";

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
                    // n8n envía el PDF crudo (Download file -> HTTP Request con el binario tal cual) — el
                    // parseo (con la posición x/y real de cada palabra) se hace acá, no en n8n, porque el
                    // orden del texto que entrega pdf-parse para este documento no es estable entre
                    // distintas exportaciones del mismo Excel y rompía el emparejamiento cliente↔párrafo.
                    const contentType = request.headers.get("content-type") || "";
                    if (contentType.includes("pdf") || contentType.includes("octet-stream")) {
                        const buffer = Buffer.from(await request.arrayBuffer());
                        const parsed = await parseIndicadorDisponibilidadFromPdf(buffer);
                        await saveIndicadorDisponibilidad(parsed);
                        return new Response(JSON.stringify({ ok: true, resumen: Object.fromEntries(Object.entries(parsed.detallePorMes).map(([mes, arr]) => [mes, arr.length])) }), { status: 200, headers: { "Content-Type": "application/json" } });
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
