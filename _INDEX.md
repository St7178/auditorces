# 📚 Índice Central de Documentación: n8n + Auditor Riesgos

**Última actualización**: Julio 22, 2026  
**Status**: ✅ Listo para producción

---

## 🎯 ¿Por dónde empiezo?

### Si eres **Usuario/Coordinador CES**
1. Lee [**RESUMEN_IMPLEMENTACION.md**](RESUMEN_IMPLEMENTACION.md) (5 min)
2. Luego: [**README_N8N.md**](README_N8N.md) (5 min)

### Si eres **Admin n8n / IT**
1. Lee [**RESUMEN_IMPLEMENTACION.md**](RESUMEN_IMPLEMENTACION.md) (5 min)
2. Luego: [**N8N_PASO_A_PASO.md**](N8N_PASO_A_PASO.md) ⭐ (30 min - RECOMENDADO)
3. Referencia: [**N8N_SETUP.md**](N8N_SETUP.md) (detalles técnicos)

### Si eres **Developer**
1. [**ARQUITECTURA.md**](ARQUITECTURA.md) (diagrama completo)
2. [**N8N_SETUP.md**](N8N_SETUP.md) (API reference)
3. [**src/routes/api/riesgos.ts**](src/routes/api/riesgos.ts) (código)

---

## 📄 Documentación por Rol

### 👥 Coordinadora CES (Laura)
| Documento | Propósito | Tiempo |
|-----------|-----------|--------|
| [**RESUMEN_IMPLEMENTACION.md**](RESUMEN_IMPLEMENTACION.md) | Qué se hizo, cómo funciona | 5 min ⭐ |
| [**README_N8N.md**](README_N8N.md) | Guía rápida | 5 min |
| [**N8N_PASO_A_PASO.md**](N8N_PASO_A_PASO.md) | Instrucciones detalladas (pasasela al IT) | 30 min |

**Acciones**:
- Verifica que el flujo esté activo en n8n
- Revisa el dashboard en `/riesgos` diariamente
- Si hay errores, revisa sección Troubleshooting

---

### 🔧 Admin IT / n8n
| Documento | Propósito | Tiempo |
|-----------|-----------|--------|
| [**RESUMEN_IMPLEMENTACION.md**](RESUMEN_IMPLEMENTACION.md) | Overview completo | 5 min |
| [**N8N_PASO_A_PASO.md**](N8N_PASO_A_PASO.md) | ⭐ Guía paso a paso (EMPIEZA AQUÍ) | 30 min |
| [**N8N_VARIABLES_ENTORNO.md**](N8N_VARIABLES_ENTORNO.md) | Cómo obtener y configurar variables | 15 min |
| [**ARQUITECTURA.md**](ARQUITECTURA.md) | Entender componentes | 10 min |
| [**N8N_SETUP.md**](N8N_SETUP.md) | Referencia técnica API | On-demand |

**Acciones**:
1. Crear app en Azure AD (obtener Client ID + Secret)
2. Configurar variables en n8n
3. Importar template `n8n_workflow_template.json`
4. Probar cada nodo
5. Activar workflow con Cron (08:00 AM)
6. Monitorear executions

---

### 💻 Developer
| Documento | Propósito | Tiempo |
|-----------|-----------|--------|
| [**RESUMEN_IMPLEMENTACION.md**](RESUMEN_IMPLEMENTACION.md) | Qué se entregó | 5 min |
| [**ARQUITECTURA.md**](ARQUITECTURA.md) | Diagrama e-2-e | 15 min ⭐ |
| [**N8N_SETUP.md**](N8N_SETUP.md) | API endpoints especificación | 20 min |
| [**src/routes/api/riesgos.ts**](src/routes/api/riesgos.ts) | Código del API | 10 min |
| [**src/routes/riesgos.tsx**](src/routes/riesgos.tsx) | Componente React actualizado | 10 min |

**Acciones**:
- Revisar código de riesgos.ts (en memoria, TODO: migrar a BD)
- Mejorar: Persistencia en PostgreSQL
- Mejorar: Auditoría de cambios (log quién cambió qué)
- Mejorar: Validaciones de negocio
- Mejorar: WebSockets para real-time

---

## 📊 Estructura de archivos entregados

### Documentación (Lee estos primero)

```
RESUMEN_IMPLEMENTACION.md  ← Inicio: qué se hizo
README_N8N.md              ← Quick start
N8N_PASO_A_PASO.md         ← ⭐ GUÍA COMPLETA (30 min)
N8N_SETUP.md               ← Docs técnicas
N8N_VARIABLES_ENTORNO.md   ← Cómo obtener variables
ARQUITECTURA.md            ← Diagrama visual
_INDEX.md                  ← Este archivo
```

### Código (Dev reference)

```
src/routes/api/riesgos.ts  ← Nuevo endpoint (GET/PATCH)
src/routes/riesgos.tsx     ← Actualizado (React Query + API)
```

### Template n8n

```
n8n_workflow_template.json ← Template importable
```

---

## 🔄 Flujo de datos en 30 segundos

```
1. Excel (SharePoint)
2.   ↓ (n8n lee cada día a las 8 AM)
3. n8n Workflow (5 nodos)
4.   ↓ (transforma datos + obtiene token OAuth + envía PATCH)
5. API Auditor (/api/riesgos)
6.   ↓ (valida + actualiza en memoria)
7. Frontend React (riesgos.tsx)
8.   ↓ (usa React Query, cache 60s)
9. Dashboard en vivo 🎉
```

---

## ✅ Checklist de implementación

### Preparación (1 hora)
- [ ] Crear Excel en SharePoint con 8 columnas
- [ ] Ir a Azure Portal
- [ ] Crear App Registration "Auditor n8n Integration"
- [ ] Copiar Client ID + Secret + Tenant ID
- [ ] Guardar variables en lugar seguro

### Configuración n8n (1 hora)
- [ ] Abre cloud.n8n.io
- [ ] Crea New Workflow
- [ ] Importa `n8n_workflow_template.json` OR crea manual
- [ ] Configura variables de entorno en Settings
- [ ] Conecta SharePoint (autentica)
- [ ] Configura Azure AD OAuth
- [ ] Configura HTTP PATCH a Auditor API
- [ ] (Opcional) Configura Slack

### Testing (30 minutos)
- [ ] Ejecuta manualmente cada nodo
- [ ] Verifica respuestas en: Browser DevTools / n8n Logs
- [ ] Comprueba en Auditor: https://auditor-ces.vercel.app/riesgos
- [ ] Revisa que datos se actualizaron
- [ ] Prueba botón "Actualizar datos" en página Riesgos

### Activación (5 minutos)
- [ ] Configura Cron trigger (08:00 AM, lunes-viernes)
- [ ] Activa workflow (checkbox)
- [ ] Monitorea primeira ejecución
- [ ] Configura alertas en n8n (si falla)

### Monitoreo (Daily)
- [ ] Revisa Executions en n8n (debe haber 1 diaria)
- [ ] Abre `/riesgos` en Auditor
- [ ] Verifica timestamp "Última actualización" = HOY
- [ ] Si hay errores, revisa **Troubleshooting** en N8N_PASO_A_PASO.md

---

## 🚀 Flujo de entrada recomendado

### AHORA (0-30 min)
1. Abre **RESUMEN_IMPLEMENTACION.md** (5 min)
2. Abre **README_N8N.md** (5 min)
3. Si eres IT: Abre **N8N_PASO_A_PASO.md** y sigue paso a paso

### HOY (1-2 horas)
1. Prepara Excel en SharePoint
2. Crea credenciales Azure AD
3. Configura n8n (importa template)
4. Prueba flujo manualmente

### MAÑANA
1. Activa workflow automático
2. Monitorea ejecuciones
3. Verifica datos en Auditor

---

## 📞 Soporte

### Errores comunes

| Error | Archivo ayuda |
|-------|----------------|
| 401 Unauthorized | N8N_SETUP.md → Troubleshooting |
| 400 Bad Request | N8N_PASO_A_PASO.md → Nodo 4 |
| No actualiza en Auditor | ARQUITECTURA.md → Capa 4 |
| Variables no aparecen | N8N_VARIABLES_ENTORNO.md → Verificar |

### Contactos

- **Especialista Riesgos**: Johann Steven Toro
- **Coordinadora CES**: Laura Jaramillo
- **Admin IT**: [Tu nombre aquí]
- **Slack Channel**: #auditar-ces-riesgos

---

## 🎯 Próximas fases (Future)

### Fase 2: Mejorar persistencia
- [ ] Migrar datos a PostgreSQL
- [ ] Log de cambios (auditoría)
- [ ] Recuperar histórico

### Fase 3: Validaciones
- [ ] Reglas de negocio (Nivel vs Estado)
- [ ] Validar responsables vs equipo RRHH
- [ ] Alertas automáticas

### Fase 4: Real-time
- [ ] WebSockets (cambios push)
- [ ] Edición simultánea
- [ ] Resolución de conflictos

---

## 📊 KPIs a monitorear post-implementación

```
Diario:
  ✓ n8n executions (debe haber 1+)
  ✓ Success rate (meta: 95%+)
  ✓ Edad datos en Auditor (debe ser HOY)

Semanal:
  ✓ Cantidad de riesgos actualizados
  ✓ Latencia promedio del flujo
  ✓ Errores recurrentes

Mensual:
  ✓ Uptime total
  ✓ Performance mejora
  ✓ Feedback usuarios
```

---

## 💡 Tips

- ✅ Guarda las variables de entorno en un password manager
- ✅ Rota Azure AD secrets cada 6 meses
- ✅ Usa diferentes variables para dev/test/prod
- ✅ Monitorea n8n Executions regularmente
- ✅ Agrupa cambios en Excel antes de sincronizar

---

## 📋 Apéndice: Comando rápidos

### Obtener token OAuth (manual testing)

```bash
curl -X POST "https://login.microsoftonline.com/{TENANT_ID}/oauth2/v2.0/token" \
  -d "grant_type=client_credentials" \
  -d "client_id={CLIENT_ID}" \
  -d "client_secret={CLIENT_SECRET}" \
  -d "scope=api://{AUDIENCE}/.default"
```

### Probar API

```bash
# GET riesgos
curl -H "Authorization: Bearer {TOKEN}" \
  https://auditor-ces.vercel.app/api/riesgos

# UPDATE riesgos
curl -X PATCH \
  -H "Authorization: Bearer {TOKEN}" \
  -H "Content-Type: application/json" \
  -d '[{"id":"R-01","nivel":"Bajo"}]' \
  https://auditor-ces.vercel.app/api/riesgos
```

---

## 🎓 Acerca de este proyecto

**Proyecto**: Auditor CES Hub  
**Componente**: Sincronización automática Matriz Riesgos  
**Tecnologías**: n8n, React, TanStack, Azure AD, SharePoint  
**Estatus**: ✅ Producción  
**Versión**: 1.0  
**Última actualización**: Julio 22, 2026  

---

**¿Preguntas?** Abre una issue en GitHub o contacta a Johann Steven Toro.

