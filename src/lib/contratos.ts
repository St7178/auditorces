// El archivo sincronizado (SharePoint → n8n) ya trae el campo `estado` de cada contrato como
// "Vigente" o "Vencido" — no hace falta ni conviene recalcularlo con fechas, esos valores ya están
// verificados contra la fecha real. Lo único que SÍ calculamos acá es "próximo a vencer": un
// contrato "Vigente" cuyo fin cae dentro de los próximos N días. (El fallback estático viejo usa
// literalmente "Próximo a vencer" como estado — se respeta igual si aparece.)
export type Contrato = { id: string; inicio: string; fin: string; estado: string };

export type ClasificacionContrato = "vencido" | "proximo" | "vigente";

export function clasificarContrato(ct: Contrato, diasProximo = 60, hoy: Date = new Date()): ClasificacionContrato {
    if (ct.estado === "Vencido") return "vencido";
    if (ct.estado === "Próximo a vencer") return "proximo";
    if (ct.estado === "Vigente") {
        const fin = new Date(ct.fin);
        if (!Number.isNaN(fin.getTime())) {
            const dias = (fin.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24);
            if (dias >= 0 && dias <= diasProximo) return "proximo";
        }
    }
    return "vigente";
}

export function resumenContratos(contratos: Contrato[], diasProximo = 60, hoy: Date = new Date()) {
    let vigentes = 0;
    let proximos = 0;
    let vencidos = 0;
    for (const ct of contratos) {
        const c = clasificarContrato(ct, diasProximo, hoy);
        if (c === "vencido") vencidos++;
        else if (c === "proximo") proximos++;
        else vigentes++;
    }
    return { total: contratos.length, vigentes, proximos, vencidos };
}
