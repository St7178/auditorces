// Helpers compartidos entre /procesos y /procesos/revision para clasificar los documentos reales
// sincronizados (nunca se inventan campos que el archivo de origen no trae).

// El nombre de sección tal como llega desde el Excel (ubicacion = "Sección Excel / subproceso").
// No es fuzzy-match: es un mapeo exacto para evitar clasificar mal un documento en un SIG certificado.
export function normalizeKey(s: string): string {
    return s
        .toUpperCase()
        .normalize("NFD")
        .replace(new RegExp("[\\u0300-\\u036f]", "g"), "")
        .replace(/\s+/g, " ")
        .trim();
}

export const SECCION_A_PROCESO: Record<string, string> = {
    "PROCESOS ESTRATEGICOS - PLANEACION ESTRATEGICA": "Planeación Estratégica",
    "PROCESOS ESTRAEGICOS - ADMINISTRACION DE RIESGOS": "Administración de Riesgos",
    "PROCESOS ESTRATEGICOS - ADMINISTRACION DE RIESGOS": "Administración de Riesgos",
    "PROCESOS MISIONALES - ARQUITECTURA DE SOLUCIONES": "Arquitectura de Soluciones",
    "PROCESOS MISIONALES - GESTION DE PROYECTOS": "Gestión de Proyectos",
    "PROCESOS MISIONALES - GESTION DE SERVICIOS DE TIC": "Gestión de Servicios de TIC",
    "PROCESOS MISIONALES - SERVICIO AL CLIENTE": "Gestión de Servicio al Cliente",
    // El Excel de origen escribe estas tres secciones de Procesos de Apoyo con variaciones (doble
    // espacio, "GESTION DE GESTIÓN HUMANA" en vez de "GESTIÓN HUMANA") — normalizeKey ya colapsa
    // espacios/tildes, así que estas claves deben coincidir con esa forma normalizada exacta.
    "PROCESOS DE APOYO - GESTION DEL SISTEMA INTEGRADO": "Gestión Sistema Integrado",
    "PROCESOS DE APOYO - GESTION DE GESTION HUMANA": "Gestión Humana",
    "PROCESOS DE APOYO - GESTION JURIDICA": "Gestión Jurídica",
};

// "Área" de un documento = el proceso al que pertenece según su ubicación sincronizada — null si no
// calza con ninguna sección conocida (se agrupa aparte, igual que "Otros procesos" en /procesos).
export function procesoDeDocumento(d: { ubicacion?: string | null }): string | null {
    const seccion = String(d.ubicacion || "").split(" / ")[0] || "";
    return SECCION_A_PROCESO[normalizeKey(seccion)] ?? null;
}

export const TIPOS_DOCUMENTO = ["Manual", "Procedimiento", "Instructivo", "Formato", "Registro", "Caracterización", "Política", "Otro"] as const;
export type TipoDocumento = (typeof TIPOS_DOCUMENTO)[number];

// El prefijo del código (antes del primer punto) ya sigue una convención real del SIG — es la misma
// que explica el Centro de Aprendizaje SIG en /procesos (M.GI.003=Manual, P.GI.001=Procedimiento,
// I.KM.001=Instructivo, F.GI.001=Formato, R.GH.006=Registro, C.AS.003=Caracterización). "M." se
// comparte entre Manual y Política — política se distingue porque la palabra aparece en el nombre.
export function tipoDeDocumento(d: { codigo?: string | null; nombre: string }): TipoDocumento {
    const prefix = (d.codigo ?? "").trim().split(".")[0]?.toUpperCase() ?? "";
    if (prefix === "F") return "Formato";
    if (prefix === "P") return "Procedimiento";
    if (prefix === "I") return "Instructivo";
    if (prefix === "R") return "Registro";
    if (prefix === "C") return "Caracterización";
    if (prefix === "M") return /pol[ií]tica/i.test(d.nombre) ? "Política" : "Manual";
    return "Otro";
}

// Antigüedad en años desde la última actualización/publicación (único campo de fecha confiable de
// un documento — no existe una "próxima revisión" real, ver SYSTEM_PROMPT de CES AUDITOR).
export function edadEnAnios(fechaIso: string, hoy: Date = new Date()): number | null {
    const fecha = new Date(fechaIso);
    if (Number.isNaN(fecha.getTime())) return null;
    return (hoy.getTime() - fecha.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
}

export type EstadoRevision = "vigente" | "revision" | "critico";

// <1 año: vigente, no aplica revisión. 1-5 años: requiere revisión. +5 años: revisión urgente.
export function estadoRevision(edad: number | null): EstadoRevision {
    if (edad === null) return "vigente";
    if (edad < 1) return "vigente";
    if (edad <= 5) return "revision";
    return "critico";
}

// Mismo checklist de 4 pasos que usa /procesos/revision — compartido acá para que el Dashboard
// pueda calcular el mismo % de cumplimiento sin duplicar la lista de pasos.
export const PASOS_REVISION = [
    { id: "busqueda", label: "Búsqueda de documentos vencidos" },
    { id: "reunion", label: "Reunión con el responsable" },
    { id: "actualizacion", label: "Actualización de documentos" },
    { id: "publicado", label: "Publicado en el SIG" },
] as const;

type DocumentoConEdad = { id: string; actualizacion?: string | null };

// % de cumplimiento de la Revisión Documental: si ningún documento requiere revisión, 100% (no hay
// nada pendiente); si hay documentos en "revision"/"critico", es el % de pasos del checklist
// (revision:<docId>:<paso>, mismo id que persiste /procesos/revision) ya completados sobre el total
// posible — mismo criterio de "cumplimiento = checklist completado" que ya usa Documentación de clientes.
export function cumplimientoRevisionDocumental(
    documentos: DocumentoConEdad[] | null,
    checklistEstado: Record<string, boolean> | null,
): number | null {
    if (!documentos || documentos.length === 0 || !checklistEstado) return null;
    const pendientes = documentos.filter((d) => estadoRevision(d.actualizacion ? edadEnAnios(d.actualizacion) : null) !== "vigente");
    if (pendientes.length === 0) return 100;
    let completados = 0;
    for (const d of pendientes) {
        for (const p of PASOS_REVISION) {
            if (checklistEstado[`revision:${d.id}:${p.id}`]) completados++;
        }
    }
    return Math.round((completados / (pendientes.length * PASOS_REVISION.length)) * 100);
}
