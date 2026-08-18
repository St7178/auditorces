import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import type { IndicadorDisponibilidadCES, IndicadorMesCliente } from "@/lib/ces-data";

const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const MESES_ABREV: Record<string, string> = { Ene: "Enero", Feb: "Febrero", Mar: "Marzo", Abr: "Abril", May: "Mayo", Jun: "Junio", Jul: "Julio", Ago: "Agosto", Sep: "Septiembre", Oct: "Octubre", Nov: "Noviembre", Dic: "Diciembre" };

// Rangos de columna (coordenada x, en puntos PDF) observados en "Hoja de Vida y Análisis de
// Indicadores" (F.GI.003), un Excel exportado a PDF. Período Medido ~55-108, Cliente ~108-180,
// Análisis ~180-505, el resto (SI/NO, Acción Correctiva) cae a la derecha y se ignora.
const COL = { periodo: [55, 108], cliente: [108, 180], analisis: [180, 505] } as const;

type Item = { str: string; x: number; y: number };

function colOf(x: number): "periodo" | "cliente" | "analisis" | null {
    if (x >= COL.periodo[0] && x < COL.periodo[1]) return "periodo";
    if (x >= COL.cliente[0] && x < COL.cliente[1]) return "cliente";
    if (x >= COL.analisis[0] && x < COL.analisis[1]) return "analisis";
    return null;
}

function groupRows(items: Item[], yTolerance = 2.5) {
    const sorted = [...items].sort((a, b) => b.y - a.y || a.x - b.x);
    const rows: { y: number; items: Item[] }[] = [];
    for (const it of sorted) {
        const row = rows.find((r) => Math.abs(r.y - it.y) <= yTolerance);
        if (row) row.items.push(it);
        else rows.push({ y: it.y, items: [it] });
    }
    rows.sort((a, b) => b.y - a.y);
    return rows.map((r) => ({ y: r.y, text: r.items.sort((a, b) => a.x - b.x).map((i) => i.str).join(" ").replace(/\s+/g, " ").trim() }));
}

async function getItems(page: any): Promise<Item[]> {
    const content = await page.getTextContent();
    return content.items.filter((it: any) => it.str.trim()).map((it: any) => ({ str: it.str, x: it.transform[4], y: it.transform[5] }));
}

// Texto en orden natural de flujo del PDF (usa el "hasEOL" que trae pdfjs), equivalente a lo que
// entregaría pdf-parse. Sirve para la página 1 (metadatos + tabla de tendencia), donde el layout es
// simple y este orden SÍ es confiable — a diferencia de las tablas de análisis por cliente (páginas
// 2+), donde el orden de extracción no es estable entre distintas exportaciones del mismo Excel.
async function getNaturalText(page: any): Promise<string> {
    const content = await page.getTextContent();
    let text = "";
    for (const it of content.items as any[]) {
        text += it.str;
        if (it.hasEOL) text += "\n";
    }
    return text;
}

function limpiarCodigosConGuion(texto: string) {
    // Los códigos con guion (p.ej. "STEWARD-IT-LINK-001") llegan con espacios porque pdfjs separa cada
    // segmento en un ítem de texto distinto.
    return texto.replace(/([A-Za-z0-9])\s-\s([A-Za-z0-9])/g, "$1-$2");
}

export async function parseIndicadorDisponibilidadFromPdf(buffer: Buffer): Promise<IndicadorDisponibilidadCES> {
    const doc = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;

    // --- Página 1: metadatos del encabezado + tabla de tendencia mensual (texto plano, sin ambigüedad
    //     de columnas ya que son pares "Mes valor meta" simples). ---
    const page1Text = await getNaturalText(await doc.getPage(1));

    const codigoMatch = page1Text.match(/(ID\.[A-Z]{2}\.\d{3}\.\d{3})\s+(.+?)\s+Gestión de Servicios/);
    const codigo = codigoMatch ? codigoMatch[1] : null;
    const nombre = codigoMatch ? codigoMatch[2].trim() : "Disponibilidad Servicio CES";
    // Entre "Creciente" (Tendencia) y "Mensual ... N/A" (Frecuencia/Meta/Tolerancia) se intercala la
    // columna "Fecha en que se debe entregar" (texto variable, puede cruzar un salto de línea).
    const tendFrecMatch = page1Text.match(/(Creciente|Decreciente|Constante)[\s\S]*?(Diaria|Semanal|Mensual|Trimestral|Semestral|Anual)\s+([\d.]+)\s+(\S+)/);
    const tendencia = tendFrecMatch ? tendFrecMatch[1] : null;
    const frecuencia = tendFrecMatch ? tendFrecMatch[2] : null;
    let metaVigente = tendFrecMatch ? parseFloat(tendFrecMatch[3]) : null;
    const propositoMatch = page1Text.match(/Controlar[^\n]+/);
    const proposito = propositoMatch ? propositoMatch[0].trim() : null;
    const fechaPubMatch = page1Text.match(/Fecha de Publicación:\s*\n?(\d{2}-\d{2}-\d{4})/);
    const fechaPublicacion = fechaPubMatch ? fechaPubMatch[1] : null;

    const tendenciaMensual: { mes: string; valor: number; meta: number }[] = [];
    const filaRegex = /^(Ene|Feb|Mar|Abr|May|Jun|Jul|Ago|Sep|Oct|Nov|Dic) ([\d.]+) ([\d.]+)$/gm;
    let m: RegExpExecArray | null;
    while ((m = filaRegex.exec(page1Text)) !== null) {
        tendenciaMensual.push({ mes: MESES_ABREV[m[1]], valor: parseFloat(m[2]), meta: parseFloat(m[3]) });
    }
    if (metaVigente == null && tendenciaMensual.length > 0) metaVigente = tendenciaMensual[0].meta;

    // --- Páginas 2..N: detalle por cliente y mes, usando la posición (x,y) real de cada palabra en vez
    //     de asumir un orden lineal en el texto extraído (que no es confiable en este documento: ver
    //     nota histórica — el mismo Excel exportado dos veces puede intercalar nombre/párrafo de forma
    //     distinta). Columna "cliente" = roster del mes; columna "análisis" = texto, dividido por
    //     "Durante el mes" (único inicio de párrafo confiable); se emparejan en orden de aparición. ---
    const detallePorMes: Record<string, IndicadorMesCliente[]> = {};
    let currentMonth: string | null = null;

    for (let p = 2; p <= doc.numPages; p++) {
        const isFirstContentPage = p === 2;
        const rawItems = await getItems(await doc.getPage(p));
        // La primera página de detalle trae, antes de la tabla, el bloque de instrucciones de análisis
        // ("Análisis: El análisis de los datos..."); cae por encima de y≈430 y no aparece en el resto.
        const items = isFirstContentPage ? rawItems.filter((it) => it.y < 428) : rawItems;

        const byCol: Record<"periodo" | "cliente" | "analisis", Item[]> = { periodo: [], cliente: [], analisis: [] };
        for (const it of items) {
            const c = colOf(it.x);
            if (c) byCol[c].push(it);
        }

        for (const row of groupRows(byCol.periodo)) {
            const found = MESES.find((mes) => row.text.includes(mes));
            if (found) currentMonth = found;
        }
        if (!currentMonth) continue;

        // Nombres de cliente partidos en dos líneas por el ajuste de texto (p.ej. "ZONAMERICA" +
        // "CLÍNICAS") se fusionan: un salto vertical chico (<15, altura de una sola línea) es la misma
        // celda; un salto grande ya es el siguiente cliente (su párrafo ocupa varias líneas de por medio).
        const clienteRowsRaw = groupRows(byCol.cliente);
        const roster: { y: number; text: string }[] = [];
        for (const row of clienteRowsRaw) {
            const prev = roster[roster.length - 1];
            if (prev && prev.y - row.y < 15) prev.text += " " + row.text;
            else roster.push({ y: row.y, text: row.text });
        }
        // Un salto de página a veces duplica al final de la página la fila del primer cliente del mes
        // (fila "congelada" repetida) — si el último nombre coincide con el primero, se descarta.
        if (roster.length > 1 && roster[roster.length - 1].text === roster[0].text) roster.pop();

        const analisisTexto = limpiarCodigosConGuion(groupRows(byCol.analisis).map((r) => r.text).join(" ").replace(/\s+/g, " ")).trim();
        const parrafos = analisisTexto.split(/(?=Durante el mes)/).map((s) => s.trim()).filter(Boolean);

        if (!detallePorMes[currentMonth]) detallePorMes[currentMonth] = [];
        roster.forEach((r, i) => {
            detallePorMes[currentMonth!].push({ cliente: r.text, analisis: parrafos[i] || "Sin análisis disponible para este cliente en este período." });
        });
    }

    return { codigo, nombre, tendencia, frecuencia, metaVigente, proposito, fechaPublicacion, tendenciaMensual, detallePorMes };
}
