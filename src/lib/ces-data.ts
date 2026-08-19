export const CURRENT_USER = { nombre: "Laura", nombreCompleto: "Laura Jaramillo", cargo: "Coordinadora de Calidad CES" };

// `nombre` debe coincidir EXACTO (mod. mayúsculas/tildes, ver normalizeName en equipo.tsx) con el
// displayName real en Entra ID — si no calza, el cruce en /equipo falla en silencio y muestra el
// cargo/foto de respaldo en vez de los datos reales. Verificado contra el directorio real el 2026-08-18.
// `cargo` queda como el jobTitle real de Entra (solo se usa si Entra no responde).
// `grupo` organiza /equipo en formato organigrama: "Vicepresidente"/"Gerentes"/"Coordinadores"/
// "Analistas" son niveles jerárquicos (ver GRUPO_ORDEN en equipo.tsx). El orden de este array define
// el orden de las tarjetas dentro de cada sección — David/Jonny/Robinson (equipo Nutresa) van primero
// dentro de "Analistas" a propósito.
export const EQUIPO = [
    { id: "andres", nombre: "Andres Cano", cargo: "Coordinador Servicios CES", clientes: ["Ecopetrol", "Bancolombia"], procesos: ["Gestión de Servicios TIC"], color: "152", grupo: "Coordinadores" },
    { id: "cristian", nombre: "Cristian Rua Sierra", cargo: "Gerente de Operaciones TI", clientes: ["Todos"], procesos: ["Arquitectura de Soluciones"], color: "200", grupo: "Gerentes" },
    { id: "juan", nombre: "Juan Camilo Galeano Velez", cargo: "Vicepresidente de Operaciones TI", clientes: ["Todos"], procesos: ["Arquitectura de Soluciones"], color: "220", grupo: "Vicepresidente" },
    { id: "julio", nombre: "Julio Cesar Calle Zarate", cargo: "Gerente de Plataformas TI", clientes: ["Todos"], procesos: ["Gestión del Servicio al Cliente"], color: "90", grupo: "Gerentes" },
    { id: "elkin", nombre: "Elkin Borja", cargo: "Coordinador Servicios CES", clientes: ["Todos"], procesos: ["Todos"], color: "40", grupo: "Coordinadores" },
    { id: "lina", nombre: "Lina Maria Castañeda De Los Rios", cargo: "Coordinadora Servicios Iaas en Sitio", clientes: ["Legal & Compras"], procesos: ["Gestión Jurídica"], color: "330", grupo: "Coordinadores" },
    { id: "yuliana", nombre: "Yuliana Arbelaez", cargo: "Coordinador de Servicios IaaS", clientes: ["Reportería"], procesos: ["Gestión de Servicios TIC"], color: "280", grupo: "Coordinadores" },
    { id: "david", nombre: "David Alejandro Oliveros", cargo: "Analista CES", clientes: ["Nutresa"], procesos: ["Gestión de Servicios TIC"], color: "260", grupo: "Analistas" },
    { id: "jonny", nombre: "Jonny Marin", cargo: "Analista de Servicios Iaas en Sitio", clientes: ["Nutresa"], procesos: ["Gestión de Servicios TIC"], color: "180", grupo: "Analistas" },
    { id: "robinson", nombre: "Robinson Stiven Ramirez Herrera", cargo: "Analista CES", clientes: ["Nutresa"], procesos: ["Gestión de Servicios TIC"], color: "70", grupo: "Analistas" },
    { id: "natalia", nombre: "Natalia Gallego Gomez", cargo: "Analista CES", clientes: [], procesos: ["Gestión de Proyectos"], color: "300", grupo: "Analistas" },
    { id: "johann", nombre: "Johann Steven Toro Aguirre", cargo: "Analista Servicios Cloud", clientes: [], procesos: ["Administración de Riesgos"], color: "10", grupo: "Analistas" },
    { id: "laura", nombre: "Laura Estefania Jaramillo Muñoz", cargo: "Analista de Gestion CES", clientes: [], procesos: ["Todos"], color: "152", grupo: "Analistas" },
];

// Mapa oficial de procesos del SIG. Se usa para agrupar la documentación sincronizada
// desde SharePoint y los riesgos sincronizados, en /procesos.
export const MAPA_PROCESOS_CES = [
    { categoria: "Procesos Estratégicos", procesos: ["Planeación Estratégica", "Administración de Riesgos"] },
    { categoria: "Procesos Misionales", procesos: ["Arquitectura de Soluciones", "Gestión de Proyectos", "Gestión de Servicios de TIC", "Gestión de Servicio al Cliente"] },
    { categoria: "Procesos de Apoyo", procesos: ["Gestión de la Información", "Gestión Sistema Integrado", "Gestión Humana", "Gestión de Logística y Compras", "Gestión Jurídica", "Gestión Financiera"] },
];

// Colores por categoría de proceso — usados en /procesos (acordeones de documentos) y en /guardian
// (selector de proceso a auditar) para que ambas pantallas se lean como el mismo sistema visual.
export const CATEGORIA_COLOR: Record<string, { bg: string; fg: string }> = {
    "Procesos Estratégicos": { bg: "#2596be", fg: "#ffffff" },
    "Procesos Misionales": { bg: "#9DDB58", fg: "#1a2e05" },
    "Procesos de Apoyo": { bg: "#B4D8F5", fg: "#0c2a43" },
};

export const RIESGOS = [
    { id: "R-01", nombre: "Indisponibilidad de servicio crítico", nivel: "Alto", estado: "En seguimiento", responsable: "Andrés Cano", ultimaActualizacion: "2026-06-20", proximaRevision: "2026-08-20", evidencia: "SharePoint / CES / Riesgos" },
    { id: "R-02", nombre: "Fuga de información cliente", nivel: "Crítico", estado: "En seguimiento", responsable: "Johann Steven Toro", ultimaActualizacion: "2026-06-15", proximaRevision: "2026-07-30", evidencia: "SharePoint / Seguridad" },
    { id: "R-03", nombre: "Incumplimiento SLA proveedor Cloud", nivel: "Medio", estado: "Mitigado", responsable: "Cristian Rua", ultimaActualizacion: "2026-05-10", proximaRevision: "2026-11-10", evidencia: "Power BI / SLA" },
    { id: "R-04", nombre: "Rotación de personal clave", nivel: "Medio", estado: "En seguimiento", responsable: "Elkin Borja", ultimaActualizacion: "2025-05-20", proximaRevision: "2026-05-20", evidencia: "SharePoint / RRHH" },
    { id: "R-05", nombre: "Obsolescencia tecnológica", nivel: "Bajo", estado: "En seguimiento", responsable: "Cristian Rua", ultimaActualizacion: "2026-06-01", proximaRevision: "2026-12-01", evidencia: "Solman" },
    { id: "R-06", nombre: "Retrasos en aprovisionamiento", nivel: "Medio", estado: "En seguimiento", responsable: "Lina Castañeda", ultimaActualizacion: "2025-08-01", proximaRevision: "2026-08-01", evidencia: "SAP / Compras" },
];

// Indicador real conectado a SharePoint (Disponibilidad_del_Servicio_CES.pdf, código F.GI.003) vía
// n8n: descarga el PDF, extrae el texto y hace POST a /api/sync/indicador-disponibilidad. El PDF es
// una "Hoja de Vida y Análisis de Indicadores" (Excel exportado a PDF) con la tendencia mensual y el
// análisis por cliente de cada mes. Este es el fallback estático — datos reales extraídos el
// 2026-08-18 del PDF vigente, se sobrescribe por completo en cada sync.
export type IndicadorMesCliente = { cliente: string; analisis: string };
export type IndicadorDisponibilidadCES = {
    codigo: string | null;
    nombre: string;
    tendencia: string | null;
    frecuencia: string | null;
    metaVigente: number | null;
    proposito: string | null;
    fechaPublicacion: string | null;
    tendenciaMensual: { mes: string; valor: number; meta: number }[];
    detallePorMes: Record<string, IndicadorMesCliente[]>;
};

export const INDICADOR_DISPONIBILIDAD_CES: IndicadorDisponibilidadCES = {
        "codigo": "ID.AM.001.004",
        "nombre": "Disponibilidad Servicio CES",
        "tendencia": "Creciente",
        "frecuencia": "Mensual",
        "metaVigente": 718.56,
        "proposito": "Controlar la disponibilidad de nuestros servicios CES",
        "fechaPublicacion": "30-05-2026",
        "tendenciaMensual": [
            {
                "mes": "Enero",
                "valor": 720,
                "meta": 718.56
            },
            {
                "mes": "Febrero",
                "valor": 720,
                "meta": 718.56
            },
            {
                "mes": "Marzo",
                "valor": 720,
                "meta": 718.56
            },
            {
                "mes": "Abril",
                "valor": 720,
                "meta": 718.56
            },
            {
                "mes": "Mayo",
                "valor": 720,
                "meta": 718.56
            },
            {
                "mes": "Junio",
                "valor": 720,
                "meta": 718.56
            },
            {
                "mes": "Julio",
                "valor": 0,
                "meta": 718.56
            },
            {
                "mes": "Agosto",
                "valor": 0,
                "meta": 718.56
            },
            {
                "mes": "Septiembre",
                "valor": 0,
                "meta": 718.56
            },
            {
                "mes": "Octubre",
                "valor": 0,
                "meta": 718.56
            },
            {
                "mes": "Noviembre",
                "valor": 0,
                "meta": 718.56
            },
            {
                "mes": "Diciembre",
                "valor": 0,
                "meta": 718.56
            }
        ],
        "detallePorMes": {
            "Enero": [
                {
                    "cliente": "Protela",
                    "analisis": "Durante el mes, se realiza constante acompañamiento al cliente referente a las pruebas de NOW virtualizado en datacenter Wave. Los servidores no presentaron cambios en su configuración que afectaran su funcionamiento. Se continúa realizando monitoreo constante para garantizar la estabilidad y disponibilidad de los servicios."
                },
                {
                    "cliente": "Ingenio Risaralda",
                    "analisis": "Durante el mes, se realiza instalacion de VMWareTools, el cual se ejecuta de manera correcta. Los servidores no presentaron cambios en su configuración que afectaran su funcionamiento. Se continúa realizando monitoreo constante para garantizar la estabilidad y disponibilidad de los servicios."
                },
                {
                    "cliente": "Indupalma",
                    "analisis": "Durante el mes, los servidores no presentaron cambios en su configuración que afectaran su funcionamiento. Se continúa realizando monitoreo constante para garantizar la estabilidad y disponibilidad de los servicios."
                },
                {
                    "cliente": "Levapan",
                    "analisis": "Durante el mes, se realiza instalacion de VMWareTools, el cual se ejecuta de manera correcta. Los servidores no presentaron cambios en su configuración que afectaran su funcionamiento. Se continúa realizando monitoreo constante para garantizar la estabilidad y disponibilidad de los servicios."
                },
                {
                    "cliente": "Incolmotos",
                    "analisis": "Durante el mes, se finalizo con la configuración e implementación del CRD, los demas servidores no presentaron cambios en su configuración que afectaran su funcionamiento. Se continúa realizando monitoreo constante para garantizar la estabilidad y disponibilidad de los servicios."
                },
                {
                    "cliente": "Grupo Recordar",
                    "analisis": "Durante el mes, se realiza certificacion del canal por parte del proveedor a solicitud del cliente. Los servidores no presentaron cambios en su configuración que afectaran su funcionamiento. Se continúa realizando monitoreo constante para garantizar la estabilidad y disponibilidad de los servicios."
                },
                {
                    "cliente": "Conconcreto",
                    "analisis": "Durante el mes, se realiza instalacion de VMWareTools, el cual se ejecuta de manera correcta. Los servidores no presentaron cambios en su configuración que afectaran su funcionamiento. Se continúa realizando monitoreo constante para garantizar la estabilidad y disponibilidad de los servicios."
                },
                {
                    "cliente": "Cobo Medical",
                    "analisis": "Durante el mes, se realiza instalacion de VMWareTools, el cual se ejecuta de manera correcta. Los servidores no presentaron cambios en su configuración que afectaran su funcionamiento. Se continúa realizando monitoreo constante para garantizar la estabilidad y disponibilidad de los servicios."
                },
                {
                    "cliente": "Andes",
                    "analisis": "Durante el mes, se realiza instalacion de VMWareTools, el cual se ejecuta de manera correcta, adicional se realiza acompañamiento al cliente y su proveedor para migracion de los servicios en los servidores actuales a unos nuevos servidores en Wave. Se continúa realizando monitoreo constante para garantizar la estabilidad y disponibilidad de los servicios."
                }
            ],
            "Febrero": [
                {
                    "cliente": "LUMIRA",
                    "analisis": "Durante el mes, los servidores no presentaron cambios en su configuración que afectaran su funcionamiento. Se continúa realizando monitoreo constante para garantizar la estabilidad y disponibilidad de los servicios."
                },
                {
                    "cliente": "Protela",
                    "analisis": "Durante el mes, se realiza acompañamiento en la reconfiguracion del HADR NOW, se realiza seguimiento tanto en hardware como en recursos y funcionamiento del servidor PTADBSBOG09, adicional se realiza aumento en modo prestamo sobre el servidor de pruebas de aplicacion en Etix, 24 gb de ramy 10 core adicionales. Los demas servidores no presentaron cambios en su configuración que afectaran su funcionamiento. Se continúa realizando monitoreo constante para garantizar la estabilidad y disponibilidad de los servicios."
                },
                {
                    "cliente": "Ingenio Risaralda",
                    "analisis": "Durante el mes, los servidores no presentaron cambios en su configuración que afectaran su funcionamiento. Se continúa realizando monitoreo constante para garantizar la estabilidad y disponibilidad de los servicios."
                },
                {
                    "cliente": "Indupalma",
                    "analisis": "Durante el mes, los servidores no presentaron cambios en su configuración que afectaran su funcionamiento. Se continúa realizando monitoreo constante para garantizar la estabilidad y disponibilidad de los servicios."
                },
                {
                    "cliente": "Levapan",
                    "analisis": "Durante el mes, los servidores no presentaron cambios en su configuración que afectaran su funcionamiento. Se continúa realizando monitoreo constante para garantizar la estabilidad y disponibilidad de los servicios."
                },
                {
                    "cliente": "Incolmotos",
                    "analisis": "Durante el mes se presento afectación de los canales de internet por falla en la última milla, los servidores no presentaron cambios en su configuración que afectaran su funcionamiento. Se continúa realizando monitoreo constante para garantizar la estabilidad y disponibilidad de los servicios."
                },
                {
                    "cliente": "Grupo Recordar",
                    "analisis": "Durante el mes, los servidores no presentaron cambios en su configuración que afectaran su funcionamiento. Se continúa realizando monitoreo constante para garantizar la estabilidad y disponibilidad de los servicios."
                },
                {
                    "cliente": "Conconcreto",
                    "analisis": "Durante el mes, los servidores no presentaron cambios en su configuración que afectaran su funcionamiento. Se continúa realizando monitoreo constante para garantizar la estabilidad y disponibilidad de los servicios."
                },
                {
                    "cliente": "Cobo Medical",
                    "analisis": "Durante el mes, los servidores no presentaron cambios en su configuración que afectaran su funcionamiento. Se continúa realizando monitoreo constante para garantizar la estabilidad y disponibilidad de los servicios."
                },
                {
                    "cliente": "Andes",
                    "analisis": "Durante el mes, los servidores no presentaron cambios en su configuración que afectaran su funcionamiento. Se continúa realizando monitoreo constante para garantizar la estabilidad y disponibilidad de los servicios."
                }
            ],
            "Marzo": [
                {
                    "cliente": "Protela",
                    "analisis": "Durante el mes se presenta afectacion de los canales de comunicación de Claro en Datacenter Triara, el proveedor informa que se realiza conmutación de trafico hacia el RBACKENDTRIARA2, estabilizando servicios. Se esta validando en conjunto con area de COEX, los flapeos presentados sobre la sesión BGP del RBACKENDTRIARA1, dicho incidente se soluciona de manera efectiva. Se realiza constante monitoreo."
                },
                {
                    "cliente": "Ingenio Risaralda",
                    "analisis": "Durante el mes, los servidores no presentaron cambios en su configuración que afectaran su funcionamiento. Se continúa realizando monitoreo constante para garantizar la estabilidad y disponibilidad de los servicios."
                },
                {
                    "cliente": "Indupalma",
                    "analisis": "Durante el mes, los servidores no presentaron cambios en su configuración que afectaran su funcionamiento. Se continúa realizando monitoreo constante para garantizar la estabilidad y disponibilidad de los servicios."
                },
                {
                    "cliente": "Levapan",
                    "analisis": "Durante el mes, los servidores no presentaron cambios en su configuración que afectaran su funcionamiento. Se continúa realizando monitoreo constante para garantizar la estabilidad y disponibilidad de los servicios."
                },
                {
                    "cliente": "Incolmotos",
                    "analisis": "Durante el mes se presento afectación de los canales de internet por falla en la última milla, los servidores no presentaron cambios en su configuración que afectaran su funcionamiento. Se continúa realizando monitoreo constante para garantizar la estabilidad y disponibilidad de los servicios."
                },
                {
                    "cliente": "Grupo Recordar",
                    "analisis": "Durante el mes, los servidores no presentaron cambios en su configuración que afectaran su funcionamiento. Se continúa realizando monitoreo constante para garantizar la estabilidad y disponibilidad de los servicios."
                },
                {
                    "cliente": "Conconcreto",
                    "analisis": "Durante el mes, los servidores no presentaron cambios en su configuración que afectaran su funcionamiento. Se continúa realizando monitoreo constante para garantizar la estabilidad y disponibilidad de los servicios."
                },
                {
                    "cliente": "Cobo Medical",
                    "analisis": "Durante el mes se finalizan los servicios del cliente por terminacion del contrato. El dia 31 de marzo se ejecuta ultimo backup de la data de los servidores los cuales seran entregados al cliente por medio de una cinta."
                },
                {
                    "cliente": "Andes",
                    "analisis": "Durante el mes, se realiza de manera exitosa la migracion de los servicios a los nuevos servidores para solucionar incidente de fuga de datos desde la app SAP Business One. Se continúa realizando monitoreo constante para garantizar la estabilidad y disponibilidad de los servicios."
                },
                {
                    "cliente": "LUMIRA",
                    "analisis": "Durante el mes, los servidores no presentaron cambios en su configuración que afectaran su funcionamiento. Se continúa realizando monitoreo constante para garantizar la estabilidad y disponibilidad de los servicios."
                },
                {
                    "cliente": "ZONAMERICA CLÍNICAS",
                    "analisis": "Durante el mes, se realiza de manera exitosa la migracion de los servicios a DataCenter WaveDC, en su totalidad son 38 servidores. Se continúa realizando monitoreo constante para garantizar la estabilidad y disponibilidad de los servicios."
                },
                {
                    "cliente": "ZONAMERICA ZACO",
                    "analisis": "Durante el mes, se realiza de manera exitosa la migracion de los servicios a DataCenter WaveDC, en su totalidad son 15 servidores. Se continúa realizando monitoreo constante para garantizar la estabilidad y disponibilidad de los servicios."
                }
            ],
            "Abril": [
                {
                    "cliente": "Protela",
                    "analisis": "Durante el mes, los servidores no presentaron cambios en su configuración que afectaran su funcionamiento. Se continúa realizando monitoreo constante para garantizar la estabilidad y disponibilidad de los servicios."
                },
                {
                    "cliente": "Ingenio Risaralda",
                    "analisis": "Durante el mes, los servidores no presentaron cambios en su configuración que afectaran su funcionamiento. Se continúa realizando monitoreo constante para garantizar la estabilidad y disponibilidad de los servicios."
                },
                {
                    "cliente": "Indupalma",
                    "analisis": "Durante el mes, los servidores no presentaron cambios en su configuración que afectaran su funcionamiento. Se continúa realizando monitoreo constante para garantizar la estabilidad y disponibilidad de los servicios."
                },
                {
                    "cliente": "Levapan",
                    "analisis": "Durante el mes, los servidores no presentaron cambios en su configuración que afectaran su funcionamiento. Se continúa realizando monitoreo constante para garantizar la estabilidad y disponibilidad de los servicios."
                },
                {
                    "cliente": "Incolmotos",
                    "analisis": "Durante el mes se presento afectacion debido a que la ejecucion del backup genero incidente sobre el servidor navision. Se continúa realizando monitoreo constante para garantizar la estabilidad y disponibilidad de los servicios."
                },
                {
                    "cliente": "Grupo Recordar",
                    "analisis": "Durante el mes, los servidores no presentaron cambios en su configuración que afectaran su funcionamiento. Se continúa realizando monitoreo constante para garantizar la estabilidad y disponibilidad de los servicios."
                },
                {
                    "cliente": "Conconcreto",
                    "analisis": "Durante el mes, los servidores no presentaron cambios en su configuración que afectaran su funcionamiento. Se continúa realizando monitoreo constante para garantizar la estabilidad y disponibilidad de los servicios."
                },
                {
                    "cliente": "Andes",
                    "analisis": "Durante el mes, los servidores no presentaron cambios en su configuración que afectaran su funcionamiento. Se continúa realizando monitoreo constante para garantizar la estabilidad y disponibilidad de los servicios."
                },
                {
                    "cliente": "LUMIRA",
                    "analisis": "Durante el mes, los servidores no presentaron cambios en su configuración que afectaran su funcionamiento. Se continúa realizando monitoreo constante para garantizar la estabilidad y disponibilidad de los servicios."
                },
                {
                    "cliente": "ZONAMERICA CLÍNICAS",
                    "analisis": "Durante el mes se realizó la ampliación de 4 GB adicionales de memoria RAM al servidor STEWARD-IT-LINK-001. Adicionalmente, se efectuó el reinicio de varios servidores por solicitud del cliente, debido a incidentes de lentitud presentados en los servicios. De manera interna, se ejecutaron procesos de independización de datastore posteriores a la migración, lo cual permitió solucionar el incidente de lentitud constante en los servidores. Asimismo,"
                },
                {
                    "cliente": "ZONAMERICA ZACO",
                    "analisis": "Durante el mes, los servidores no presentaron cambios en su configuración que afectaran su funcionamiento. Se continúa realizando monitoreo constante para garantizar la estabilidad y disponibilidad de los servicios."
                }
            ],
            "Mayo": [
                {
                    "cliente": "Ingenio Risaralda",
                    "analisis": "Durante el mes, los servidores no presentaron cambios en su configuración que afectaran su funcionamiento. Se continúa realizando monitoreo constante para garantizar la estabilidad y disponibilidad de los servicios."
                },
                {
                    "cliente": "Indupalma",
                    "analisis": "Durante el mes, los servidores no presentaron cambios en su configuración que afectaran su funcionamiento. Se continúa realizando monitoreo constante para garantizar la estabilidad y disponibilidad de los servicios."
                },
                {
                    "cliente": "Levapan",
                    "analisis": "Durante el mes, los servidores no presentaron cambios en su configuración que afectaran su funcionamiento. Se continúa realizando monitoreo constante para garantizar la estabilidad y disponibilidad de los servicios."
                },
                {
                    "cliente": "Incolmotos",
                    "analisis": "Durante el mes se presenta bloqueo en servidor PSR, fallo en backup bloquea el servidor. Se continúa realizando monitoreo constante para garantizar la estabilidad y disponibilidad de los servicios."
                },
                {
                    "cliente": "Grupo Recordar",
                    "analisis": "Durante el mes, los servidores no presentaron cambios en su configuración que afectaran su funcionamiento. Se continúa realizando monitoreo constante para garantizar la estabilidad y disponibilidad de los servicios."
                },
                {
                    "cliente": "Conconcreto",
                    "analisis": "Durante el mes, los servidores no presentaron cambios en su configuración que afectaran su funcionamiento. Se continúa realizando monitoreo constante para garantizar la estabilidad y disponibilidad de los servicios."
                },
                {
                    "cliente": "Andes",
                    "analisis": "Durante el mes, los servidores no presentaron cambios en su configuración que afectaran su funcionamiento. Se continúa realizando monitoreo constante para garantizar la estabilidad y disponibilidad de los servicios."
                },
                {
                    "cliente": "LUMIRA",
                    "analisis": "Durante el mes, los servidores no presentaron cambios en su configuración que afectaran su funcionamiento. Se continúa realizando monitoreo constante para garantizar la estabilidad y disponibilidad de los servicios."
                },
                {
                    "cliente": "ZONAMERICA CLÍNICAS",
                    "analisis": "Durante el mes se presenta falla en la base de datos de Prueba BDSWDT, dicho caso es escalado al DBS quien soluciona dicho incidente. Adicional se realiza aumento de 100 GB a la unidad C del servidor STEWARD-001-011 con IP 10.74.23.20 ya que la unidad estaba completamente llena y genero bloqueos sobre el servidor. Se continúa realizando monitoreo constante para garantizar la estabilidad y disponibilidad de los servicios."
                },
                {
                    "cliente": "ZONAMERICA ZACO",
                    "analisis": "Durante el mes se realiza entrega del servidor ZA-COL-TEC-0009 para pruebas de dominio, el servidor productivo ZA-COL-TEC-0008 fue desconectado ya que estaba presentando inconvenientes de dominio y el servidor 0009 es para solucionar dicho inconveniente. Los demas servidores no presentaron cambios en su configuracion. Se realiza constante monitoreo."
                },
                {
                    "cliente": "Surtialimentos",
                    "analisis": "Durante el mes, los servidores no presentaron cambios en su configuración que afectaran su funcionamiento. Se continúa realizando monitoreo constante para garantizar la estabilidad y disponibilidad de los servicios."
                },
                {
                    "cliente": "Protela",
                    "analisis": "Durante el mes, los servidores no presentaron cambios en su configuración que afectaran su funcionamiento. Se continúa realizando monitoreo constante para garantizar la estabilidad y disponibilidad de los servicios."
                }
            ],
            "Junio": [
                {
                    "cliente": "Ingenio Risaralda",
                    "analisis": "Durante el mes, los servidores no presentaron cambios en su configuración que afectaran su funcionamiento. Se continúa realizando monitoreo constante para garantizar la estabilidad y disponibilidad de los servicios."
                },
                {
                    "cliente": "Indupalma",
                    "analisis": "Durante el mes, los servidores no presentaron cambios en su configuración que afectaran su funcionamiento. Se continúa realizando monitoreo constante para garantizar la estabilidad y disponibilidad de los servicios."
                },
                {
                    "cliente": "Levapan",
                    "analisis": "Durante el mes, los servidores no presentaron cambios en su configuración que afectaran su funcionamiento. Se continúa realizando monitoreo constante para garantizar la estabilidad y disponibilidad de los servicios."
                },
                {
                    "cliente": "Incolmotos",
                    "analisis": "Durante el mes se presenta afectacion en las replicas las cuales bloqueaban el ingreso a los servidores. Se continúa realizando monitoreo constante para garantizar la estabilidad y disponibilidad de los servicios."
                },
                {
                    "cliente": "Grupo Recordar",
                    "analisis": "Durante el mes, los servidores no presentaron cambios en su configuración que afectaran su funcionamiento. Se continúa realizando monitoreo constante para garantizar la estabilidad y disponibilidad de los servicios."
                },
                {
                    "cliente": "Conconcreto",
                    "analisis": "Durante el mes, los servidores no presentaron cambios en su configuración que afectaran su funcionamiento. Se continúa realizando monitoreo constante para garantizar la estabilidad y disponibilidad de los servicios."
                },
                {
                    "cliente": "Andes",
                    "analisis": "Durante el mes, los servidores no presentaron cambios en su configuración que afectaran su funcionamiento. Se continúa realizando monitoreo constante para garantizar la estabilidad y disponibilidad de los servicios."
                },
                {
                    "cliente": "LUMIRA",
                    "analisis": "Durante el mes, los servidores no presentaron cambios en su configuración que afectaran su funcionamiento. Se continúa realizando monitoreo constante para garantizar la estabilidad y disponibilidad de los servicios."
                },
                {
                    "cliente": "ZONAMERICA CLÍNICAS",
                    "analisis": "Durante el mes se realizo un aumento de 200 GB al servidor de base de datos N1-SWD-PCA1. Los demas servidores no presentaron cambios en su configuración que afectaran su funcionamiento. Se continúa realizando monitoreo constante para garantizar la estabilidad y disponibilidad de los servicios."
                },
                {
                    "cliente": "ZONAMERICA ZACO",
                    "analisis": "Durante el mes se solicito restauracion de informacion del usuario jramirez, la cual se ejecuta de manera exitosa, adicional se realiza eliminacion del servidor ZA-COL-TEC-0008 el cual fue reemplazado por el servidor ZA-COL-TEC-0009. Se continúa realizando monitoreo constante para garantizar la estabilidad y disponibilidad de los servicios."
                },
                {
                    "cliente": "Surtialimentos",
                    "analisis": "Durante el mes, los servidores no presentaron cambios en su configuración que afectaran su funcionamiento. Se continúa realizando monitoreo constante para garantizar la estabilidad y disponibilidad de los servicios."
                }
            ]
        }
    };

// Indicadores con sync real conectado (a diferencia de los "demo" en INDICADORES, que son ejemplo
// hasta que se conecten a su propia fuente) — cuenta el KPI "Indicadores" del dashboard. Agregar el id
// acá cuando se conecte un indicador nuevo del mismo modo que Disponibilidad Servicio CES.
export const INDICADORES_REALES = ["disponibilidad-servicio-ces"];

export const INDICADORES = [
    { id: "IND-01", nombre: "Disponibilidad de servicios", meta: 99.5, actual: 99.7, unidad: "%", tendencia: "up", historico: [99.2, 99.4, 99.6, 99.5, 99.7, 99.7] },
    { id: "IND-02", nombre: "Cumplimiento de SLA", meta: 95, actual: 96.8, unidad: "%", tendencia: "up", historico: [93, 94, 95, 96, 96.5, 96.8] },
    { id: "IND-03", nombre: "Capacidad utilizada", meta: 80, actual: 72, unidad: "%", tendencia: "flat", historico: [68, 70, 71, 73, 72, 72] },
    { id: "IND-04", nombre: "Incidentes críticos", meta: 3, actual: 2, unidad: "n°", tendencia: "down", historico: [5, 4, 3, 3, 2, 2] },
    { id: "IND-05", nombre: "Cambios exitosos", meta: 95, actual: 98, unidad: "%", tendencia: "up", historico: [92, 94, 95, 97, 97, 98] },
    { id: "IND-06", nombre: "Satisfacción del cliente", meta: 4.5, actual: 4.7, unidad: "/5", tendencia: "up", historico: [4.3, 4.4, 4.5, 4.6, 4.6, 4.7] },
];

export const CLIENTES = [
    { id: "c1", nombre: "Bancolombia", responsable: "Andrés Cano", servicios: ["Cloud AWS", "Monitoreo 24/7"], estado: "Activo", contratos: [{ id: "CT-001", inicio: "2024-01-01", fin: "2026-08-15", estado: "Próximo a vencer" }] },
    { id: "c2", nombre: "Ecopetrol", responsable: "Andrés Cano", servicios: ["Arquitectura Cloud", "Migración"], estado: "Activo", contratos: [{ id: "CT-002", inicio: "2025-03-01", fin: "2027-03-01", estado: "Vigente" }] },
    { id: "c3", nombre: "Grupo Éxito", responsable: "Cristian Rua", servicios: ["Diseño Cloud"], estado: "Activo", contratos: [] },
    { id: "c4", nombre: "ISA", responsable: "David Oliveros", servicios: ["Soporte L2/L3"], estado: "Activo", contratos: [] },
    { id: "c5", nombre: "EPM", responsable: "Robinson", servicios: ["Soporte L2"], estado: "Activo", contratos: [] },
    { id: "c6", nombre: "Suramericana", responsable: "Natalia Gallego", servicios: ["Proyectos TIC"], estado: "En renovación", contratos: [{ id: "CT-005", inicio: "2023-09-01", fin: "2026-09-01", estado: "En renovación" }] },
    { id: "c7", nombre: "Nutresa", responsable: "Johann Steven Toro", servicios: ["Consultoría Riesgos"], estado: "Activo", contratos: [] },
    { id: "c8", nombre: "Argos", responsable: "Jonny Marín", servicios: ["Servicios TIC"], estado: "Activo", contratos: [] },
];

// Checklist de entrega de documentación por cliente (fallback estático — se sobrescribe por completo
// cada vez que corre el flujo de n8n contra "Control_Entrega_Documentación_Clientes.xlsx", hoja "CES").
// No está atado a un cliente específico: es la lista estándar de documentos que debe entregarse en
// todo cierre de implementación CES, dividida en lo que se entrega al cliente vs. lo interno de CES.
// Los `id` son slugs de "código + nombre" (deterministas) — NO posicionales — para que si un nuevo
// sync reordena o agrega/quita filas, el estado marcado (ver checklist-clientes-estado) siga apuntando
// al documento correcto en vez de desplazarse.
export const CHECKLIST_DOCUMENTACION_CLIENTES = {
    cliente: [
        { id: "cliente-f-ge-406-f-ge-407-diagrama-de-red-version-cliente-y-version-cnet", codigo: "F.GE.406 - F.GE.407", nombre: "Diagrama de Red Versión Cliente y Versión Cnet" },
        { id: "cliente-f-cs-405-formato-estrategia-de-backup", codigo: "F.CS.405", nombre: "Formato Estrategia de Backup" },
        { id: "cliente-f-ge-409-diagrama-de-servicios-ces", codigo: "F.GE.409", nombre: "Diagrama de Servicios CES" },
        { id: "cliente-anexo-contactos-y-escalamientos-servicios-ti", codigo: "Anexo", nombre: "Contactos y Escalamientos Servicios TI" },
        { id: "cliente-m-os-401-manual-operacion-del-servicio", codigo: "M.OS.401", nombre: "Manual Operación del Servicio" },
        { id: "cliente-f-gp-401-acta-de-entrega-de-servicios", codigo: "F.GP.401", nombre: "Acta de Entrega de Servicios" },
        { id: "cliente-i-os-401-registro-de-solicitudes-en-la-mesa-integral-de-servicios-solman-7-2", codigo: "I.OS.401", nombre: "Registro de Solicitudes en la Mesa Integral de Servicios SOLMAN 7,2" },
        { id: "cliente-f-ve-011-008-hoja-de-control", codigo: "F.VE.011.008", nombre: "Hoja de control" },
    ],
    interna: [
        { id: "interna-f-gp-401-acta-de-entrega-del-servicio-firmada-por-el-cliente", codigo: "F.GP.401", nombre: "Acta de entrega del Servicio firmada por el cliente" },
        { id: "interna-f-gp-403-verificacion-de-instalacion-de-servicios-de-red", codigo: "F.GP.403", nombre: "Verificación de Instalación de Servicios de Red" },
        { id: "interna-anexo-1-y-2-anexos-del-contrato-de-servicios-formato-no-editable", codigo: "Anexo 1 y 2", nombre: "Anexos del contrato de Servicios (formato no editable)" },
        { id: "interna-f-ve-461-propuesta-servicios-de-infraestructura-ces", codigo: "F.VE.461", nombre: "Propuesta Servicios de Infraestructura CES" },
        { id: "interna-na-email-con-premisas-comerciales", codigo: "NA", nombre: "Email con Premisas Comerciales" },
        { id: "interna-na-autorizacion-vicepresidencia-de-servicios-y-operaciones-de-ti-de-inicio-sin-contrato", codigo: "NA", nombre: "Autorización Vicepresidencia de Servicios y Operaciones de TI de inicio sin contrato" },
        { id: "interna-na-presentacion-del-proyecto", codigo: "NA", nombre: "Presentación del Proyecto" },
        { id: "interna-na-levantamiento-de-informacion", codigo: "NA", nombre: "Levantamiento de información" },
        { id: "interna-na-contactos-nombre-cargo-numero-fijo-celular-correo-electronico-y-direccion-exacta-del-cliente", codigo: "NA", nombre: "Contactos (Nombre, cargo, número fijo, celular, correo electrónico y dirección exacta del cliente)" },
        { id: "interna-na-solicitud-a-la-mis-para-creacion-del-cliente-e-inicio-de-informes-de-gestion", codigo: "NA", nombre: "Solicitud a la MIS para creación del cliente e inicio de informes de gestión" },
        { id: "interna-na-creacion-del-cliente-en-solution-manager", codigo: "NA", nombre: "Creación del Cliente en Solution Manager" },
        { id: "interna-na-validacion-capacitacion-al-cliente-mis", codigo: "NA", nombre: "Validación Capacitación al Cliente MIS" },
    ],
};

export const PROVEEDORES = [
    { id: "p1", nombre: "AWS", tipo: "Cloud Hyperscaler", estado: "Estratégico", ultimaEvaluacion: "2026-03-01" },
    { id: "p2", nombre: "Microsoft Azure", tipo: "Cloud Hyperscaler", estado: "Estratégico", ultimaEvaluacion: "2026-02-15" },
    { id: "p3", nombre: "VMware", tipo: "Virtualización", estado: "Activo", ultimaEvaluacion: "2025-05-20" },
    { id: "p4", nombre: "Cisco", tipo: "Networking", estado: "Activo", ultimaEvaluacion: "2026-01-10" },
    { id: "p5", nombre: "Red Hat", tipo: "Software", estado: "Activo", ultimaEvaluacion: "2026-04-01" },
    { id: "p6", nombre: "Fortinet", tipo: "Seguridad", estado: "Activo", ultimaEvaluacion: "2026-05-05" },
];



export const DOCUMENTOS = [
    { id: "D-01", codigo: "M.CA.001", nombre: "Manual de Calidad CES", version: "3.2", responsable: "Laura Jaramillo", actualizacion: "2026-04-10", proximaRevision: "2027-04-10", ubicacion: "SharePoint / SIG", estado: "Vigente" },
    { id: "D-02", codigo: "F.RI.001", nombre: "Matriz de Riesgos CES", version: "2.5", responsable: "Johann Steven Toro", actualizacion: "2025-06-01", proximaRevision: "2026-06-01", ubicacion: "SharePoint / Riesgos", estado: "Requiere revisión" },
    { id: "D-03", codigo: "P.OS.483", nombre: "Procedimiento Gestión de Incidentes", version: "1.8", responsable: "Andrés Cano", actualizacion: "2026-05-01", proximaRevision: "2027-05-01", ubicacion: "SharePoint / Procesos", estado: "Vigente" },
    { id: "D-04", codigo: "M.SI.001", nombre: "Política de Seguridad de la Información", version: "4.0", responsable: "Elkin Borja", actualizacion: "2026-01-15", proximaRevision: "2027-01-15", ubicacion: "SharePoint / SIG", estado: "Vigente" },
    { id: "D-05", codigo: "M.CS.400", nombre: "Plan de Continuidad del Servicio", version: "2.1", responsable: "Andrés Cano", actualizacion: "2025-10-20", proximaRevision: "2026-10-20", ubicacion: "SharePoint / SIG", estado: "Vigente" },
];

export const CRONOGRAMA = [
    { id: "CR-01", evento: "Auditoría interna SIG", fecha: "2026-07-29", responsable: "Laura Jaramillo", tipo: "Auditoría" },
    { id: "CR-02", evento: "Revisión matriz de riesgos", fecha: "2026-07-15", responsable: "Johann Steven Toro", tipo: "Revisión" },
    { id: "CR-03", evento: "Reunión mensual de indicadores", fecha: "2026-07-05", responsable: "Yuliana", tipo: "Comité" },
    { id: "CR-04", evento: "Renovación contrato Bancolombia", fecha: "2026-08-15", responsable: "Elkin Borja", tipo: "Contrato" },
    { id: "CR-05", evento: "Capacitación ISO 9001", fecha: "2026-08-01", responsable: "Laura Jaramillo", tipo: "Formación" },
];

export const KPIS_DASHBOARD = [
    // Aún no hay una fuente real para "auditorías pendientes" (eso lo reportará CES AUDITOR desde el
    // chat cuando exista ese seguimiento) — se deja sin valor en vez de mostrar una cifra inventada.
    { label: "Auditorías pendientes", value: null as number | null, delta: "", tone: "muted" as const, icon: "clipboard" },
    { label: "Riesgos en seguimiento", value: 6, delta: "-2", tone: "brand" as const, icon: "shield" },
    { label: "Clientes activos", value: 8, delta: "+1", tone: "brand" as const, icon: "users" },
    { label: "Contratos por vencer", value: 2, delta: "60d", tone: "warning" as const, icon: "file" },
    { label: "Proveedores registrados", value: 6, delta: "=", tone: "muted" as const, icon: "truck" },
    { label: "Indicadores activos", value: 6, delta: "+0", tone: "brand" as const, icon: "gauge" },
    // "Hallazgos pendientes" y "Hallazgos abiertos" se sobrescriben en el dashboard con datos reales
    // de /api/hallazgos (lo que CES AUDITOR va registrando en el chat) — estos son solo el fallback.
    { label: "Hallazgos pendientes", value: 0, delta: "", tone: "warning" as const, icon: "list" },
    { label: "Hallazgos abiertos", value: 0, delta: "", tone: "brand" as const, icon: "alert" },
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
    { titulo: "Matriz de riesgos desactualizada", texto: "Se recomienda revisar la matriz de riesgos periódicamente para mantenerla actualizada.", nivel: "alta" },
    { titulo: "Evaluación de proveedor VMware", texto: "La evaluación del proveedor VMware supera los 12 meses. Programa una nueva evaluación.", nivel: "media" },
    { titulo: "Contratos próximos a vencer", texto: "2 contratos vencen en los próximos 60 días (Bancolombia, VMware).", nivel: "alta" },
    { titulo: "Indicador sin seguimiento", texto: "El indicador de Capacidad se mantiene estable pero sin comentarios de análisis en el último mes.", nivel: "baja" },
];
