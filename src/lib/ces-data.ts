export const CURRENT_USER = { nombre: "Laura", nombreCompleto: "Laura Jaramillo", cargo: "Coordinadora de Calidad CES" };

export const EQUIPO = [
    { id: "andres", nombre: "Andrés Cano", cargo: "Líder Técnico de Servicios TIC", clientes: ["Ecopetrol", "Bancolombia"], procesos: ["Gestión de Servicios TIC"], color: "152" },
    { id: "cristian", nombre: "Cristian Rua", cargo: "Arquitecto de Soluciones Cloud", clientes: ["Grupo Éxito"], procesos: ["Arquitectura de Soluciones"], color: "200" },
    { id: "david", nombre: "David Oliveros", cargo: "Ingeniero de Servicios", clientes: ["ISA", "EPM"], procesos: ["Gestión de Servicios TIC"], color: "260" },
    { id: "elkin", nombre: "Elkin Borja", cargo: "Gerente CES", clientes: ["Todos"], procesos: ["Todos"], color: "40" },
    { id: "natalia", nombre: "Natalia Gallego", cargo: "PMO CES", clientes: ["Suramericana"], procesos: ["Gestión de Proyectos"], color: "300" },
    { id: "johann", nombre: "Johann Steven Toro", cargo: "Especialista en Riesgos", clientes: ["Nutresa"], procesos: ["Administración de Riesgos"], color: "10" },
    { id: "jonny", nombre: "Jonny Marín", cargo: "Ingeniero de Servicios", clientes: ["Argos"], procesos: ["Gestión de Servicios TIC"], color: "180" },
    { id: "juan", nombre: "Juan Camilo Galeano", cargo: "Arquitecto Cloud", clientes: ["Bancolombia"], procesos: ["Arquitectura de Soluciones"], color: "220" },
    { id: "julio", nombre: "Julio César Calle", cargo: "Líder Comercial CES", clientes: ["Nuevos negocios"], procesos: ["Gestión del Servicio al Cliente"], color: "90" },
    { id: "laura", nombre: "Laura Jaramillo", cargo: "Coordinadora de Calidad CES", clientes: ["Todos"], procesos: ["Todos"], color: "152" },
    { id: "lina", nombre: "Lina Castañeda", cargo: "Analista de Contratos", clientes: ["Legal & Compras"], procesos: ["Gestión Jurídica"], color: "330" },
    { id: "robinson", nombre: "Robinson", cargo: "Ingeniero de Soporte", clientes: ["EPM"], procesos: ["Gestión de Servicios TIC"], color: "70" },
    { id: "yuliana", nombre: "Yuliana", cargo: "Analista de Indicadores", clientes: ["Reportería"], procesos: ["Gestión de Servicios TIC"], color: "280" },
];

export const PROCESOS = [
    { id: "riesgos", nombre: "Administración de Riesgos", responsable: "Johann Steven Toro", estado: "Al día", ultimaRevision: "2026-04-12", proximaRevision: "2026-10-12", auditorias: 2, indicadores: 3, riesgos: 8, descripcion: "Identificación, evaluación y tratamiento de riesgos operacionales del área CES." },
    { id: "servicios", nombre: "Gestión de Servicios TIC", responsable: "Andrés Cano", estado: "Al día", ultimaRevision: "2026-05-20", proximaRevision: "2026-11-20", auditorias: 4, indicadores: 6, riesgos: 12, descripcion: "Operación, monitoreo y mejora continua de los servicios TIC gestionados por CES." },
    { id: "proyectos", nombre: "Gestión de Proyectos", responsable: "Natalia Gallego", estado: "Requiere atención", ultimaRevision: "2025-11-08", proximaRevision: "2026-08-01", auditorias: 3, indicadores: 4, riesgos: 5, descripcion: "Planeación, ejecución y control de proyectos Cloud Enterprise." },
    { id: "arquitectura", nombre: "Arquitectura de Soluciones", responsable: "Cristian Rua", estado: "Al día", ultimaRevision: "2026-06-01", proximaRevision: "2026-12-01", auditorias: 1, indicadores: 2, riesgos: 4, descripcion: "Diseño de arquitecturas Cloud, híbridas y on-prem para clientes CES." },
    { id: "cliente", nombre: "Gestión del Servicio al Cliente", responsable: "Julio César Calle", estado: "Al día", ultimaRevision: "2026-05-30", proximaRevision: "2026-11-30", auditorias: 2, indicadores: 5, riesgos: 3, descripcion: "Relacionamiento, satisfacción y experiencia del cliente." },
    { id: "logistica", nombre: "Gestión de Logística y Compras", responsable: "Lina Castañeda", estado: "Atrasado", ultimaRevision: "2025-09-15", proximaRevision: "2026-07-15", auditorias: 1, indicadores: 2, riesgos: 6, descripcion: "Adquisición de bienes y servicios necesarios para la operación CES." },
    { id: "juridica", nombre: "Gestión Jurídica", responsable: "Lina Castañeda", estado: "Al día", ultimaRevision: "2026-06-10", proximaRevision: "2026-12-10", auditorias: 1, indicadores: 1, riesgos: 2, descripcion: "Contratos, cumplimiento normativo y gestión legal del área CES." },
];

export const RIESGOS = [
    { id: "R-01", nombre: "Indisponibilidad de servicio crítico", nivel: "Alto", estado: "En seguimiento", responsable: "Andrés Cano", ultimaActualizacion: "2026-06-20", proximaRevision: "2026-08-20", evidencia: "SharePoint / CES / Riesgos" },
    { id: "R-02", nombre: "Fuga de información cliente", nivel: "Crítico", estado: "En seguimiento", responsable: "Johann Steven Toro", ultimaActualizacion: "2026-06-15", proximaRevision: "2026-07-30", evidencia: "SharePoint / Seguridad" },
    { id: "R-03", nombre: "Incumplimiento SLA proveedor Cloud", nivel: "Medio", estado: "Mitigado", responsable: "Cristian Rua", ultimaActualizacion: "2026-05-10", proximaRevision: "2026-11-10", evidencia: "Power BI / SLA" },
    { id: "R-04", nombre: "Rotación de personal clave", nivel: "Medio", estado: "En seguimiento", responsable: "Elkin Borja", ultimaActualizacion: "2025-05-20", proximaRevision: "2026-05-20", evidencia: "SharePoint / RRHH" },
    { id: "R-05", nombre: "Obsolescencia tecnológica", nivel: "Bajo", estado: "En seguimiento", responsable: "Cristian Rua", ultimaActualizacion: "2026-06-01", proximaRevision: "2026-12-01", evidencia: "Solman" },
    { id: "R-06", nombre: "Retrasos en aprovisionamiento", nivel: "Medio", estado: "En seguimiento", responsable: "Lina Castañeda", ultimaActualizacion: "2025-08-01", proximaRevision: "2026-08-01", evidencia: "SAP / Compras" },
];

export const INDICADORES = [
    { id: "IND-01", nombre: "Disponibilidad de servicios", meta: 99.5, actual: 99.7, unidad: "%", tendencia: "up", historico: [99.2, 99.4, 99.6, 99.5, 99.7, 99.7] },
    { id: "IND-02", nombre: "Cumplimiento de SLA", meta: 95, actual: 96.8, unidad: "%", tendencia: "up", historico: [93, 94, 95, 96, 96.5, 96.8] },
    { id: "IND-03", nombre: "Capacidad utilizada", meta: 80, actual: 72, unidad: "%", tendencia: "flat", historico: [68, 70, 71, 73, 72, 72] },
    { id: "IND-04", nombre: "Incidentes críticos", meta: 3, actual: 2, unidad: "n°", tendencia: "down", historico: [5, 4, 3, 3, 2, 2] },
    { id: "IND-05", nombre: "Cambios exitosos", meta: 95, actual: 98, unidad: "%", tendencia: "up", historico: [92, 94, 95, 97, 97, 98] },
    { id: "IND-06", nombre: "Satisfacción del cliente", meta: 4.5, actual: 4.7, unidad: "/5", tendencia: "up", historico: [4.3, 4.4, 4.5, 4.6, 4.6, 4.7] },
];

export const CLIENTES = [
    { id: "c1", nombre: "Bancolombia", responsable: "Andrés Cano", servicios: ["Cloud AWS", "Monitoreo 24/7"], estado: "Activo" },
    { id: "c2", nombre: "Ecopetrol", responsable: "Andrés Cano", servicios: ["Arquitectura Cloud", "Migración"], estado: "Activo" },
    { id: "c3", nombre: "Grupo Éxito", responsable: "Cristian Rua", servicios: ["Diseño Cloud"], estado: "Activo" },
    { id: "c4", nombre: "ISA", responsable: "David Oliveros", servicios: ["Soporte L2/L3"], estado: "Activo" },
    { id: "c5", nombre: "EPM", responsable: "Robinson", servicios: ["Soporte L2"], estado: "Activo" },
    { id: "c6", nombre: "Suramericana", responsable: "Natalia Gallego", servicios: ["Proyectos TIC"], estado: "En renovación" },
    { id: "c7", nombre: "Nutresa", responsable: "Johann Steven Toro", servicios: ["Consultoría Riesgos"], estado: "Activo" },
    { id: "c8", nombre: "Argos", responsable: "Jonny Marín", servicios: ["Servicios TIC"], estado: "Activo" },
];

export const PROVEEDORES = [
    { id: "p1", nombre: "AWS", tipo: "Cloud Hyperscaler", estado: "Estratégico", ultimaEvaluacion: "2026-03-01" },
    { id: "p2", nombre: "Microsoft Azure", tipo: "Cloud Hyperscaler", estado: "Estratégico", ultimaEvaluacion: "2026-02-15" },
    { id: "p3", nombre: "VMware", tipo: "Virtualización", estado: "Activo", ultimaEvaluacion: "2025-05-20" },
    { id: "p4", nombre: "Cisco", tipo: "Networking", estado: "Activo", ultimaEvaluacion: "2026-01-10" },
    { id: "p5", nombre: "Red Hat", tipo: "Software", estado: "Activo", ultimaEvaluacion: "2026-04-01" },
    { id: "p6", nombre: "Fortinet", tipo: "Seguridad", estado: "Activo", ultimaEvaluacion: "2026-05-05" },
];

export const CONTRATOS = [
    { id: "CT-001", cliente: "Bancolombia", proveedor: "-", inicio: "2024-01-01", vencimiento: "2026-08-15", responsable: "Elkin Borja", estado: "Próximo a vencer", ubicacion: "SharePoint / Contratos" },
    { id: "CT-002", cliente: "Ecopetrol", proveedor: "-", inicio: "2025-03-01", vencimiento: "2027-03-01", responsable: "Elkin Borja", estado: "Vigente", ubicacion: "SharePoint / Contratos" },
    { id: "CT-003", cliente: "-", proveedor: "VMware", inicio: "2024-06-01", vencimiento: "2026-07-25", responsable: "Lina Castañeda", estado: "Próximo a vencer", ubicacion: "SAP" },
    { id: "CT-004", cliente: "-", proveedor: "AWS", inicio: "2025-01-01", vencimiento: "2028-01-01", responsable: "Cristian Rua", estado: "Vigente", ubicacion: "Portal AWS" },
    { id: "CT-005", cliente: "Suramericana", proveedor: "-", inicio: "2023-09-01", vencimiento: "2026-09-01", responsable: "Natalia Gallego", estado: "En renovación", ubicacion: "SharePoint / Contratos" },
];

export const DOCUMENTOS = [
    { id: "D-01", nombre: "Manual de Calidad CES", version: "3.2", responsable: "Laura Jaramillo", actualizacion: "2026-04-10", proximaRevision: "2027-04-10", ubicacion: "SharePoint / SIG", estado: "Vigente" },
    { id: "D-02", nombre: "Matriz de Riesgos CES", version: "2.5", responsable: "Johann Steven Toro", actualizacion: "2025-06-01", proximaRevision: "2026-06-01", ubicacion: "SharePoint / Riesgos", estado: "Requiere revisión" },
    { id: "D-03", nombre: "Procedimiento Gestión de Incidentes", version: "1.8", responsable: "Andrés Cano", actualizacion: "2026-05-01", proximaRevision: "2027-05-01", ubicacion: "SharePoint / Procesos", estado: "Vigente" },
    { id: "D-04", nombre: "Política de Seguridad de la Información", version: "4.0", responsable: "Elkin Borja", actualizacion: "2026-01-15", proximaRevision: "2027-01-15", ubicacion: "SharePoint / SIG", estado: "Vigente" },
    { id: "D-05", nombre: "Plan de Continuidad del Servicio", version: "2.1", responsable: "Andrés Cano", actualizacion: "2025-10-20", proximaRevision: "2026-10-20", ubicacion: "SharePoint / SIG", estado: "Vigente" },
];

export const CRONOGRAMA = [
    { id: "CR-01", evento: "Auditoría interna SIG", fecha: "2026-07-29", responsable: "Laura Jaramillo", tipo: "Auditoría" },
    { id: "CR-02", evento: "Revisión matriz de riesgos", fecha: "2026-07-15", responsable: "Johann Steven Toro", tipo: "Revisión" },
    { id: "CR-03", evento: "Reunión mensual de indicadores", fecha: "2026-07-05", responsable: "Yuliana", tipo: "Comité" },
    { id: "CR-04", evento: "Renovación contrato Bancolombia", fecha: "2026-08-15", responsable: "Elkin Borja", tipo: "Contrato" },
    { id: "CR-05", evento: "Capacitación ISO 9001", fecha: "2026-08-01", responsable: "Laura Jaramillo", tipo: "Formación" },
];

export const KPIS_DASHBOARD = [
    { label: "Auditorías pendientes", value: 3, delta: "+1", tone: "warning" as const, icon: "clipboard" },
    { label: "Riesgos en seguimiento", value: 6, delta: "-2", tone: "brand" as const, icon: "shield" },
    { label: "Clientes activos", value: 8, delta: "+1", tone: "brand" as const, icon: "users" },
    { label: "Contratos por vencer", value: 2, delta: "60d", tone: "warning" as const, icon: "file" },
    { label: "Proveedores registrados", value: 6, delta: "=", tone: "muted" as const, icon: "truck" },
    { label: "Indicadores activos", value: 6, delta: "+0", tone: "brand" as const, icon: "gauge" },
    { label: "Acciones pendientes", value: 12, delta: "+3", tone: "warning" as const, icon: "list" },
    { label: "Hallazgos abiertos", value: 4, delta: "-1", tone: "brand" as const, icon: "alert" },
];

// Conocimiento interno: base metodológica sobre la que se construye la sección de Riesgos.
// Fuente: M.RI.001.014 "Metodología para la Gestión de Riesgos Operacionales" (v14, 28-08-2024).
// No se almacena el documento — solo los criterios de la metodología que rigen la gestión de riesgos en CES.
export const METODOLOGIA_RIESGOS = {
    codigo: "M.RI.001.014",
    nombre: "Metodología para la Gestión de Riesgos Operacionales",
    version: 14,
    fechaPublicacion: "2024-08-28",
    ciclo: ["Identificación", "Análisis", "Evaluación", "Tratamiento", "Monitoreo"],
    escalaProbabilidad: [
        { calificacion: 5, categoria: "Muy Probable", rango: "> 30%" },
        { calificacion: 4, categoria: "Probable", rango: "21% - 30%" },
        { calificacion: 3, categoria: "Moderada", rango: "11% - 20%" },
        { calificacion: 2, categoria: "Baja", rango: "5% - 10%" },
        { calificacion: 1, categoria: "Muy Baja", rango: "< 5%" },
    ],
    escalaImpacto: [
        { calificacion: 5, categoria: "Catastrófico" },
        { calificacion: 4, categoria: "Mayor" },
        { calificacion: 3, categoria: "Moderado" },
        { calificacion: 2, categoria: "Menor" },
        { calificacion: 1, categoria: "Insignificante" },
    ],
    frecuenciaMonitoreo: [
        { nivel: "Extremo", color: "Rojo", frecuencia: "Bimestral" },
        { nivel: "Alto", color: "Naranja", frecuencia: "Trimestral" },
        { nivel: "Moderado", color: "Amarillo", frecuencia: "Semestral" },
        { nivel: "Bajo y Muy Bajo", color: "Verde", frecuencia: "Anual" },
    ],
    opcionesTratamiento: [
        { opcion: "Evitar", descripcion: "Minimizar al máximo la probabilidad de que el riesgo se llegue a presentar." },
        { opcion: "Reducir", descripcion: "Cuando el riesgo no puede ser evitado, reducirlo al mínimo nivel posible." },
        { opcion: "Transferir", descripcion: "El riesgo se comparte con alguien más (ej. seguro, pago fijo)." },
        { opcion: "Aceptar", descripcion: "Riesgos aceptados por la organización que requieren seguimiento y control continuo." },
    ],
    tiposControl: [
        { tipo: "Preventivo", efectividad: "90%", descripcion: "Actúa sobre las causas, disminuye la probabilidad." },
        { tipo: "Detectivo", efectividad: "60%", descripcion: "Alarma que detecta una situación poco común." },
        { tipo: "Correctivo", efectividad: "30%", descripcion: "Corrige deficiencias tras la materialización del riesgo." },
    ],
    politicas: [
        "Riesgo residual Alto o Extremo → plan de mitigación obligatorio.",
        "Riesgo residual Moderado → a criterio del Dueño del Proceso.",
        "Todo control debe tener soporte que evidencie su eficacia.",
        "Todo riesgo materializado se reporta al Dueño del Proceso con copia a sistemaintegradodegestion@grupocnet.com.",
    ],
    responsables: {
        identificacionAnalisisEvaluacionTratamiento: "Dueño del Proceso y Dueños de los Riesgos",
        verificacionEficaciaControles: "Jefe del Sistema Integrado de Gestión y/o Especialista de Seguridad de la Información",
        seguimientoAnual: "Dueño del Proceso, mínimo una vez al año, sobre el F.RI.001 Registro Matriz de Riesgos Operacionales",
    },
};

// Registro oficial de la Matriz de Riesgos Operacionales (F.RI.001) del área CES.
// Fuente: "Matriz_de_Riesgos_Operacionales _CES 2.xlsx", hoja F.RI.001.
// Solo se transcriben los riesgos con datos diligenciados (las demás filas de la matriz son plantilla vacía).
export const REGISTRO_RIESGOS_CES = [
    {
        id: "R-CES-001",
        fechaIdentificacion: "2024-12-12",
        fechaActualizacion: "2025-04-23",
        procesoNivel1: "Procesos Misionales",
        procesoNivel2: "N/A",
        infoDocumentada: "M.OS.402.005 Manual de Gestión de Servicios TI",
        duenoProceso: "Gerente de Operaciones CES",
        duenoRiesgo: "Coordinador de Servicios CES",
        descripcion: "Fallos en la plataforma o servicios crítico que soportan la operación 24/7, afectando servicios internos y externos.",
        contexto: "Interno / Externo",
        parteInteresada: "Trabajadores / Clientes",
        causaQue: "Fallos técnicos, configuraciones incorrectas, falta de mantenimiento preventivo, obsolescencia de hardware y software.",
        causaPorQue: "Actualizaciones de sistema operativo, actualizaciones de aplicación, fallos de potencia eléctrica y fallas de comunicación.",
        causaQuien: "Gerente de Operaciones CES, Coordinador de Servicios CES, especialistas CES y analistas CES.",
        consecuencia: "Indisponibilidad del servicio a los clientes.",
        impacto: { tipo: "Operativo", calificacion: "Mayor", valor: 4 },
        probabilidad: { calificacion: "Muy baja", valor: 1 },
        nivelInherente: { valor: 4, severidad: "Moderado" },
        controles: [
            { descripcion: "Entrega de los informes de gestión del periodo inmediatamente anterior durante los primeros días de cada mes.", responsable: "Coordinador Control Interno Servicios TI", tipo: "Preventivo", ejecucion: "Manual", origen: "Obligatorio", documentado: true, nombreDocumento: "Informes de Gestión (ruta compartida)", frecuencia: "Mensual", efectividad: 0.76 },
            { descripcion: "Envío automatizado de correo electrónico al cliente, programado para los primeros días de cada mes, adjuntando los informes correspondientes.", responsable: "Coordinador de proyectos CES", tipo: "Preventivo", ejecucion: "Semi Automática", origen: "Voluntario", documentado: false, nombreDocumento: "N/A", frecuencia: "Mensual", efectividad: 0.62 },
            { descripcion: "Reuniones mensuales con los clientes para revisar y concluir las actividades del mes, adjuntando el acta de la reunión como evidencia.", responsable: "Coordinador CES", tipo: "Preventivo", ejecucion: "Manual", origen: "Voluntario", documentado: true, nombreDocumento: "Acta de reunión", frecuencia: "Mensual", efectividad: 0.66 },
        ],
        porcentajeMitigacion: 0.684,
        nivelResidual: { severidad: "Alto", valor: 4 },
        evidencia: "SharePoint / ProyectosCES / General CES / 4. Administración de riesgos Operacionales",
    },
    {
        id: "R-CES-002",
        fechaIdentificacion: "2024-12-12",
        fechaActualizacion: "2025-04-23",
        procesoNivel1: "Procesos Misionales",
        procesoNivel2: "N/A",
        infoDocumentada: "M.OS.401.007 Manual de Operación del Servicio · M.AM.400.003 Manual de Disponibilidad",
        duenoProceso: "Gerente de Operaciones CES",
        duenoRiesgo: "Coordinador de Servicios CES",
        descripcion: "Fallas en los procesos de cumplimiento de los Acuerdos de Niveles de Servicio (ANS) en el área CES, manifestadas en demoras o incumplimientos en los tiempos de respuesta, resolución o calidad del servicio acordados contractualmente con los clientes.",
        contexto: "Interno / Externo",
        parteInteresada: "Clientes",
        causaQue: "Registro incompleto o incorrecto de tickets en la herramienta de gestión (SAP Solution Manager). Demoras en el escalamiento de solicitudes a los niveles adecuados de soporte. Configuración inadecuada o desactualización de los ANS en los sistemas de gestión.",
        causaPorQue: "Procesos manuales o falta de controles automatizados para validar la información ingresada. Descoordinación entre los equipos responsables de la configuración y la operación del servicio.",
        causaQuien: "Gerente de Operaciones CES, Coordinador de Servicios CES, especialistas CES y analistas CES.",
        consecuencia: "Incumplimiento de los tiempos establecidos en los contratos, penalizaciones contractuales, pérdida de confianza por parte de los clientes y deterioro de la reputación empresarial.",
        impacto: { tipo: "Operativo", calificacion: "Mayor", valor: 4 },
        probabilidad: { calificacion: "Baja", valor: 2 },
        nivelInherente: { valor: 8, severidad: "Alto" },
        controles: [
            { descripcion: "Medición del indicador de Disponibilidad del Servicio CES.", responsable: "Coordinador Control Interno Servicios TI", tipo: "Correctivo", ejecucion: "Manual", origen: "Obligatorio", documentado: true, nombreDocumento: "M.AM.400.003 Manual de Disponibilidad", frecuencia: "Mensual", efectividad: 0.64 },
            { descripcion: "Envío automatizado al cliente durante los primeros días del mes, informando el cumplimiento del indicador de disponibilidad.", responsable: "Coordinador CES", tipo: "Preventivo", ejecucion: "Semi Automática", origen: "Voluntario", documentado: false, nombreDocumento: "N/A", frecuencia: "Mensual", efectividad: 0.62 },
            { descripcion: "Reuniones mensuales con los clientes para revisar el indicador de disponibilidad y garantizar su cumplimiento.", responsable: "Coordinador CES", tipo: "Preventivo", ejecucion: "Manual", origen: "Voluntario", documentado: true, nombreDocumento: "Acta de reunión", frecuencia: "Mensual", efectividad: 0.66 },
        ],
        porcentajeMitigacion: 0.64,
        nivelResidual: { severidad: "Alto", valor: 2.88 },
        evidencia: "SharePoint / ProyectosCES / General CES / 4. Administración de riesgos Operacionales",
    },
];

// Conocimiento interno: inventario de información documentada del SIG que SÍ aplica al alcance de CES.
// Fuente: "Información documentada a revisar" (registro de control documental por proceso del SIG).
// Solo se listan los documentos marcados como aplicables a CES; el resto (NA) se omite por brevedad.
export const INVENTARIO_DOCUMENTAL_CES = [
    { subproceso: "Planeación Estratégica", codigo: "Anexo 1 M.PE.002 V2", nombre: "Seguimiento a las necesidades y Expectativas", observacion: "Está en el alcance de CES" },
    { subproceso: "Administración de Riesgos", codigo: "F.RI.001.006", nombre: "Matriz de riesgos Operacionales", observacion: "Está en el alcance de CES" },
    { subproceso: "Administración de Riesgos", codigo: "M.RI.001.016", nombre: "Metodología para la gestión de riesgos operacionales", observacion: "Aplica para identificación, medición, control y monitoreo de riesgos operacionales y gestión de oportunidades" },
    { subproceso: "Ventas", codigo: "P.VE.400.015", nombre: "Preventa servicios y soluciones", observacion: "Aplica" },
    { subproceso: "Ventas", codigo: "F.VE.001.008", nombre: "Hoja de Control", observacion: "Aplica, no presenta cambios" },
    { subproceso: "Ventas", codigo: "F.VE.461.005", nombre: "Propuesta Servicios de Infraestructura CES", observacion: "Aplica, no presenta cambios" },
    { subproceso: "Ventas", codigo: "P.VE.401.001", nombre: "Entrega Formal de servicios y soluciones a gestión de proyectos", observacion: "Aplica, no presenta cambios" },
    { subproceso: "Gestión Continuidad Servicios TI", codigo: "F.CS.405.004", nombre: "Formato Estrategia de Backup", observacion: "Aplica, no presenta cambios" },
    { subproceso: "Gestión Continuidad Servicios TI", codigo: "I.CS.442.001", nombre: "Diligenciamiento Estrategia de Backup", observacion: "Aplica, es informativo, no es documento propio de CES" },
    { subproceso: "Gestión Continuidad Servicios TI", codigo: "M.CS.400.004", nombre: "Manual de gestión de copias de respaldo", observacion: "Aplica, no presenta cambios" },
    { subproceso: "Servicio al Cliente", codigo: "C.SC.001.013", nombre: "Caracterización de gestión de servicio al cliente", observacion: "Aplica, no presenta cambios" },
    { subproceso: "Servicio al Cliente", codigo: "F.SC.001.013", nombre: "Cuestionario de experiencia de clientes B2B", observacion: "Aplica" },
    { subproceso: "Servicio al Cliente", codigo: "F.SC.002.001", nombre: "Cuestionario Satisfacción atención a quejas", observacion: "Aplica" },
    { subproceso: "Servicio al Cliente", codigo: "F.SC.003.001", nombre: "Resultados Encuesta experiencia del cliente", observacion: "Aplica" },
    { subproceso: "Servicio al Cliente", codigo: "P.SC.001.020", nombre: "Experiencia del cliente", observacion: "Aplica" },
    { subproceso: "Gestión de Servicios de TIC", codigo: "C.GS.001.009", nombre: "Caracterización gestión de servicios de TIC", observacion: "Aplica" },
    { subproceso: "Gestión de Servicios de TIC", codigo: "C.OS.001.010", nombre: "Caracterización operación del servicio", observacion: "Aplica" },
    { subproceso: "Gestión de Servicios de TIC", codigo: "F.OS.414.001", nombre: "Acta de entrega de servicios por finalización de contrato", observacion: "Aplica" },
    { subproceso: "Gestión de Servicios de TIC", codigo: "M.OS.401.007", nombre: "Manual de operación del Servicio", observacion: "Aplica" },
    { subproceso: "Gestión de Servicios de TIC", codigo: "M.OS.402.006", nombre: "Manual de gestión de Servicios TI", observacion: "Aplica" },
    { subproceso: "Gestión de Servicios de TIC", codigo: "P.OS.416.012", nombre: "Terminación de Contrato Servicios Especializados", observacion: "Aplica" },
    { subproceso: "Gestión de Servicios de TIC", codigo: "F.OS.413.007", nombre: "Reporte de incidentes", observacion: "Aplica" },
    { subproceso: "Gestión de Servicios de TIC", codigo: "P.OS.483.009", nombre: "Gestión de incidentes", observacion: "Aplica" },
    { subproceso: "Gestión de Servicios de TIC", codigo: "I.OS.435.001", nombre: "Monitoreo con UIM", observacion: "Aplica" },
    { subproceso: "Gestión de Servicios de TIC", codigo: "P.OS.019.007", nombre: "Gestión de eventos", observacion: "Aplica" },
    { subproceso: "Gestión de Servicios de TIC", codigo: "F.CM.400.004", nombre: "Solicitud de ventanas a clientes", observacion: "Aplica" },
    { subproceso: "Gestión de Servicios de TIC", codigo: "F.GE.400.001", nombre: "Checklist Upgrade de Servidores", observacion: "Aplica" },
    { subproceso: "Gestión de Servicios de TIC", codigo: "F.GE.406.001", nombre: "Diagrama de Red", observacion: "Aplica" },
    { subproceso: "Gestión de Servicios de TIC", codigo: "F.GE.409.002", nombre: "Formato Diagrama de Servicio CES", observacion: "Aplica" },
    { subproceso: "Gestión de Servicios de TIC", codigo: "F.GE.410.001", nombre: "Gestión de ventanas de actualizaciones Sistema Operativo", observacion: "Aplica" },
    { subproceso: "Gestión de Servicios de TIC", codigo: "P.GE.021.012", nombre: "Gestión de la entrega", observacion: "Aplica" },
    { subproceso: "Gestión de Servicios de TIC", codigo: "C.KM.001.011", nombre: "Caracterización gestión del conocimiento", observacion: "Aplica" },
    { subproceso: "Gestión de Servicios de TIC", codigo: "I.KM.001.003", nombre: "Manejo de la KDB en Solution Manager", observacion: "Aplica" },
    { subproceso: "Gestión de Servicios de TIC", codigo: "F.SI.001.013", nombre: "Control de Software Compunet", observacion: "Aplica" },
    { subproceso: "Gestión de Servicios de TIC", codigo: "F.CN.002.002", nombre: "Cronograma pruebas de continuidad de seguridad de la información", observacion: "Aplica" },
    { subproceso: "Gestión de Servicios de TIC", codigo: "M.AM.400.004", nombre: "Manual de disponibilidad", observacion: "Aplica" },
    { subproceso: "Gestión de Servicios de TIC", codigo: "F.CP.400.004", nombre: "Checklist Desmonte de servidores", observacion: "Aplica" },
    { subproceso: "Gestión de Servicios de TIC", codigo: "I.CP.417.005", nombre: "Borrado definitivo de la información en los almacenamientos", observacion: "Aplica" },
    { subproceso: "Gestión de Servicios de TIC", codigo: "M.CP.400.007", nombre: "Manual de procedimientos para la gestión de la capacidad de la infraestructura", observacion: "Aplica" },
    { subproceso: "Gestión de Servicios de TIC", codigo: "P.CP.400.007", nombre: "Devolución de recursos de infraestructura", observacion: "Aplica" },
    { subproceso: "Arquitectura de Soluciones", codigo: "C.AS.003.003", nombre: "Caracterización arquitectura de Soluciones", observacion: "Aplica, no presenta cambios" },
    { subproceso: "Arquitectura de Soluciones", codigo: "F.AS.403.006", nombre: "Levantamiento de información Servicios especializados", observacion: "Aplica, no presenta cambios" },
    { subproceso: "Arquitectura de Soluciones", codigo: "F.AS.404.002", nombre: "Matriz Financiera Servicios CES", observacion: "Aplica, no presenta cambios" },
    { subproceso: "Arquitectura de Soluciones", codigo: "F.AS.405.001", nombre: "Estructuración Financiera de Servicios CES", observacion: "Aplica, no presenta cambios" },
    { subproceso: "Gestión de Proyectos", codigo: "C.GP.001.011", nombre: "Caracterización gestión de proyectos", observacion: "Aplica, no hay cambios" },
    { subproceso: "Gestión de Proyectos", codigo: "F.GP.401.006", nombre: "Acta de entrega de Servicios", observacion: "Aplica, no hay cambios" },
    { subproceso: "Gestión de Proyectos", codigo: "F.GP.406.014", nombre: "Control Entrega Documentación Clientes", observacion: "Aplica, presenta cambios: agregar nuevos documentos" },
    { subproceso: "Gestión de Proyectos", codigo: "F.GP.407.014", nombre: "Requisición de servidores Windows y Linux", observacion: "Aplica, no hay cambios" },
    { subproceso: "Gestión de Proyectos", codigo: "F.GP.409.001", nombre: "Plan de gestión del proyecto CES", observacion: "Aplica, no hay cambios" },
];

export const RECOMENDACIONES_IA = [
    { titulo: "Matriz de riesgos desactualizada", texto: "La matriz de riesgos tiene más de 12 meses sin actualización. Se recomienda revisarla antes del 30 de julio.", nivel: "alta" },
    { titulo: "Evaluación de proveedor VMware", texto: "La evaluación del proveedor VMware supera los 12 meses. Programa una nueva evaluación.", nivel: "media" },
    { titulo: "Contratos próximos a vencer", texto: "2 contratos vencen en los próximos 60 días (Bancolombia, VMware).", nivel: "alta" },
    { titulo: "Indicador sin seguimiento", texto: "El indicador de Capacidad se mantiene estable pero sin comentarios de análisis en el último mes.", nivel: "baja" },
    { titulo: "Auditoría interna próxima", texto: "La auditoría interna SIG está programada en 20 días. Prepara la documentación.", nivel: "alta" },
];
