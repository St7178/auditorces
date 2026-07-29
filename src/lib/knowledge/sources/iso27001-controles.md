# Norma NTC-ISO/IEC 27001:2013 — Sistema de Gestión de Seguridad de la Información (Grupo Compunet)

## ¿Por qué Compunet implementa ISO/IEC 27001?

ISO/IEC 27001 es la norma internacional que especifica los requisitos para establecer, implementar, mantener y
mejorar continuamente un Sistema de Gestión de Seguridad de la Información (SGSI). Compunet la implementa junto
con ISO 9001 dentro del mismo Sistema Integrado de Gestión (SIG), porque el servicio CES (Cloud Enterprise
Service) maneja información e infraestructura crítica de clientes (plataformas SAP, centros de cómputo,
recuperación de desastres) y necesita demostrar que preserva la confidencialidad, integridad y disponibilidad
de esa información mediante la aplicación de un proceso de gestión de riesgos.

## Estructura de alto nivel

Como toda norma ISO de sistemas de gestión moderna, comparte la misma estructura de alto nivel que ISO 9001
(numerales 4 a 10), lo que permite auditar ambos sistemas de forma integrada dentro de una misma
caracterización de proceso. La diferencia central frente a ISO 9001 es que el objeto del sistema no es la
calidad del producto/servicio sino la seguridad de la información: confidencialidad, integridad y
disponibilidad.

## Numerales (cláusulas del sistema de gestión)

1. Objeto y campo de aplicación
2. Referencias normativas
3. Términos y definiciones
4. Contexto de la organización
5. Liderazgo
6. Planificación
7. Soporte
8. Operación
9. Evaluación del desempeño
10. Mejora

### 4. Contexto de la organización
Igual que en ISO 9001: comprensión de la organización y su contexto, comprensión de las necesidades y
expectativas de las partes interesadas, determinación del alcance del SGSI, y el SGSI mismo como sistema que
debe establecerse, implementarse, mantenerse y mejorarse continuamente.

### 5. Liderazgo
La alta dirección debe demostrar liderazgo estableciendo una política de seguridad de la información apropiada
al propósito de la organización, que incluya objetivos de seguridad de la información (o el marco para
establecerlos) y el compromiso de cumplir los requisitos aplicables y de mejora continua del SGSI. También
asigna roles, responsabilidades y autoridades pertinentes a la seguridad de la información.

### 6. Planificación
- **6.1.1 Generalidades**: al planificar el SGSI se deben determinar los riesgos y oportunidades que es
  necesario tratar, para asegurar que el sistema logre sus resultados previstos, prevenir o reducir efectos
  indeseados, y lograr la mejora continua.
- **6.1.2 Valoración de riesgos de la seguridad de la información**: proceso formal y repetible que debe:
  establecer criterios de riesgo (incluida la aceptación de riesgo); identificar los riesgos asociados a la
  pérdida de confidencialidad, integridad y disponibilidad, e identificar a los dueños de cada riesgo; analizar
  consecuencias potenciales y probabilidad realista de que ocurran, determinando niveles de riesgo; y evaluar
  esos riesgos comparándolos contra los criterios establecidos, priorizándolos para tratamiento. Debe
  conservarse información documentada de todo el proceso.
- **6.1.3 Tratamiento de riesgos de la seguridad de la información**: seleccionar opciones de tratamiento,
  determinar los controles necesarios, **compararlos contra el Anexo A** para verificar que no se omitió
  ningún control necesario, producir una **Declaración de Aplicabilidad** (los controles del Anexo A que
  aplican o no y por qué), formular un plan de tratamiento de riesgos, y obtener de los dueños de los riesgos
  la aprobación del plan y la aceptación de los riesgos residuales.
- **6.2 Objetivos de seguridad de la información**: deben ser coherentes con la política, medibles cuando sea
  posible, tener en cuenta los riesgos valorados, comunicarse y actualizarse.

### 7. Soporte
Recursos, competencia del personal cuyo trabajo afecta el desempeño de la seguridad de la información, toma de
conciencia (política, contribución individual, implicaciones de la no conformidad), comunicación interna y
externa pertinente al SGSI, e información documentada (creación/actualización, control de distribución, acceso,
almacenamiento, control de cambios, retención y disposición).

### 8. Operación
- **8.1 Planificación y control operacional**: implementar y controlar los procesos para cumplir los
  requisitos de seguridad de la información y los objetivos del 6.2; controlar cambios planificados y revisar
  consecuencias de cambios no previstos; asegurar que los procesos contratados externamente estén controlados.
- **8.2 Valoración de riesgos de la SI**: se debe repetir a intervalos planificados o cuando ocurran cambios
  significativos — la valoración de riesgos **no es un evento único**, es continua.
- **8.3 Tratamiento de riesgos de la SI**: implementar el plan de tratamiento y conservar evidencia documentada
  de los resultados.

### 9. Evaluación del desempeño
- **9.1 Seguimiento, medición, análisis y evaluación**: determinar qué medir (incluidos procesos y controles de
  SI), métodos, cuándo, quién, y conservar evidencia documentada de los resultados.
- **9.2 Auditoría interna**: la organización debe llevar a cabo auditorías internas a intervalos planificados
  para verificar que el SGSI es conforme con los requisitos propios de la organización y con la Norma, y que
  está implementado y mantenido eficazmente. Requiere: programa(s) de auditoría (frecuencia, métodos,
  responsabilidades, planificación e informes, considerando la importancia de los procesos y resultados de
  auditorías previas); criterios y alcance definidos para cada auditoría; auditores objetivos e imparciales;
  resultados informados a la dirección pertinente; y evidencia documentada del programa y de los resultados.
- **9.3 Revisión por la dirección**: a intervalos planificados, considerando entre otros los resultados de la
  valoración de riesgos y el estado del plan de tratamiento de riesgos.

### 10. Mejora
No conformidades y acciones correctivas (reaccionar, evaluar la necesidad de eliminar la causa, implementar
acciones, revisar su eficacia); y mejora continua de la conveniencia, adecuación y eficacia del SGSI.

## Anexo A — Objetivos de control y controles de referencia

El Anexo A contiene 14 dominios (A.5 a A.18) con objetivos de control y controles. No son exhaustivos: son el
punto de partida obligatorio para comparar contra el tratamiento de riesgos (6.1.3), y cualquier exclusión debe
quedar justificada en la Declaración de Aplicabilidad. Resumen por dominio:

- **A.5 Políticas de la seguridad de la información**: políticas para la SI aprobadas por la dirección,
  publicadas y comunicadas; revisión periódica.
- **A.6 Organización de la seguridad de la información**: roles y responsabilidades, separación de deberes,
  contacto con autoridades y grupos de interés especial, seguridad de la información en gestión de proyectos;
  política de dispositivos móviles y teletrabajo.
- **A.7 Seguridad de los recursos humanos**: selección de personal, términos y condiciones del empleo;
  responsabilidades de la dirección, toma de conciencia/educación/formación, proceso disciplinario durante el
  empleo; responsabilidades de terminación o cambio de empleo.
- **A.8 Gestión de activos**: inventario y propiedad de los activos, uso aceptable, devolución de activos;
  clasificación de la información, etiquetado, manejo de activos; manejo de medios removibles, disposición y
  transferencia física de medios.
- **A.9 Control de acceso**: política de control de acceso y acceso a redes; gestión de acceso de usuarios
  (registro/cancelación, suministro, gestión de derechos privilegiados y de información secreta de
  autenticación, revisión y retiro/ajuste de derechos de acceso); responsabilidades del usuario sobre su
  información de autenticación; restricción de acceso a sistemas y aplicaciones, procedimientos de ingreso
  seguro, gestión de contraseñas, control de acceso a códigos fuente.
- **A.10 Criptografía**: política sobre el uso de controles criptográficos y gestión de llaves criptográficas.
- **A.11 Seguridad física y del entorno**: perímetros y controles de acceso físico, seguridad de oficinas,
  protección contra amenazas externas/ambientales, áreas de despacho/carga; ubicación y protección de equipos,
  servicios de suministro, seguridad del cableado, mantenimiento, retiro y disposición segura de equipos,
  política de escritorio y pantalla limpia.
- **A.12 Seguridad de las operaciones**: procedimientos operacionales documentados, gestión de cambios y de
  capacidad, separación de ambientes de desarrollo/pruebas/operación; protección contra código malicioso;
  copias de respaldo; registro y seguimiento de eventos, protección de logs, sincronización de relojes; control
  de software operacional; gestión de vulnerabilidades técnicas y restricciones de instalación de software;
  consideraciones sobre auditorías de sistemas de información (minimizar interrupciones al negocio).
- **A.13 Seguridad de las comunicaciones**: controles y seguridad de redes, separación en redes; políticas y
  acuerdos de transferencia de información, mensajería electrónica, acuerdos de confidencialidad/no divulgación.
- **A.14 Adquisición, desarrollo y mantenimiento de sistemas**: requisitos de seguridad en nuevos sistemas,
  seguridad de servicios de aplicaciones en redes públicas y protección de transacciones; política de
  desarrollo seguro, control de cambios, revisión técnica tras cambios de plataforma, restricciones a cambios
  en paquetes de software, principios de construcción segura, ambiente de desarrollo seguro, supervisión del
  desarrollo contratado externamente, pruebas de seguridad y de aceptación; protección de datos de prueba.
- **A.15 Relaciones con los proveedores**: política de seguridad de la información para proveedores, tratamiento
  de la seguridad en los acuerdos, cadena de suministro de TI/comunicaciones; seguimiento, revisión y auditoría
  de los servicios prestados por proveedores, gestión de cambios en dichos servicios.
- **A.16 Gestión de incidentes de seguridad de la información**: responsabilidades y procedimientos, reporte de
  eventos y de debilidades de seguridad, evaluación y decisión sobre eventos, respuesta a incidentes,
  aprendizaje obtenido de incidentes previos, recolección de evidencia.
- **A.17 Aspectos de seguridad de la información de la gestión de continuidad de negocio**: planificación,
  implementación, verificación y revisión periódica de la continuidad de la seguridad de la información;
  redundancia de instalaciones de procesamiento de información.
- **A.18 Cumplimiento**: identificación de legislación y requisitos contractuales aplicables, derechos de
  propiedad intelectual, protección de registros, privacidad y protección de datos personales, reglamentación
  de controles criptográficos; revisión independiente de la seguridad de la información, cumplimiento con
  políticas/normas de seguridad, revisión del cumplimiento técnico.

## Relación con los procesos CES

Cada caracterización de proceso de Compunet referencia, además de la Matriz de Riesgos Operacionales, la
**Matriz de Riesgos de Seguridad de la Información** aplicable a ese proceso — son registros de riesgo
distintos, aunque ambos siguen el mismo ciclo de identificación → análisis → evaluación → tratamiento →
monitoreo. Cuando la auditoría se hace bajo el enfoque de ISO/IEC 27001, el foco no es la conformidad del
servicio prestado al cliente (como en ISO 9001), sino la protección de la información dentro de ese proceso:
control de acceso, manejo de activos de información, gestión de cambios, copias de respaldo, gestión de
incidentes de seguridad, y los controles del Anexo A pertinentes al alcance del proceso auditado.
