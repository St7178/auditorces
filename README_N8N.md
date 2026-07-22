# 🚀 Integración n8n → Auditor: Sincronización Matriz Riesgos CES

## Resumen rápido

Este setup permite que **n8n** lea automáticamente la matriz de riesgos desde un Excel en **SharePoint** y la sincronice con la aplicación **Auditor** (Vercel) en tiempo real.

```
SharePoint (Excel) → n8n → Auditor API → Dashboard en Vivo
```

---

## 📁 Archivos de configuración

| Archivo | Descripción | Para quién |
|---------|---------|---------|
| **N8N_PASO_A_PASO.md** | Guía completa en español (EMPIEZA AQUÍ) | Equipo CES |
| **N8N_SETUP.md** | Documentación técnica del API | Developers |
| **n8n_workflow_template.json** | Template importable en n8n | n8n Admin |
| **src/routes/api/riesgos.ts** | Endpoint para actualizar riesgos | Backend |

---

## ⚡ Inicio rápido (5 minutos)

### 1️⃣ Preparar Excel en SharePoint
```
Columnas requeridas:
ID | Riesgo | Nivel | Estado | Responsable | Última actualización | Próx. revisión | Evidencia
```

### 2️⃣ Crear credenciales Azure AD
```bash
ENTRA_CLIENT_ID = "xxxx-xxxx-xxxx"
ENTRA_CLIENT_SECRET = "client-secret-value"
ENTRA_TENANT_ID = "xxxx-xxxx-xxxx"
AUDITOR_API_URL = "https://auditor-ces.vercel.app"
```

### 3️⃣ Importar workflow en n8n
- Abre n8n: `cloud.n8n.io`
- **Workflows** → Nuevo → Importar `n8n_workflow_template.json`
- Configura SharePoint + Token Azure
- Activa ✅

### 4️⃣ Verificar en Auditor
```
https://auditor-ces.vercel.app/riesgos
```

---

## 🔌 Endpoints disponibles

### GET /api/riesgos
Obtiene lista actual de riesgos.

```bash
curl -H "Authorization: Bearer {TOKEN}" \
  https://auditor-ces.vercel.app/api/riesgos
```

### PATCH /api/riesgos
Actualiza uno o múltiples riesgos.

```bash
curl -X PATCH \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {TOKEN}" \
  -d '[{"id":"R-01","nivel":"Medio","estado":"Mitigado"}]' \
  https://auditor-ces.vercel.app/api/riesgos
```

---

## 📊 Estructura de datos

**Un riesgo contiene**:
```typescript
{
  id: string;              // R-01, R-02, etc
  nombre: string;          // Nombre del riesgo
  nivel: "Bajo" | "Medio" | "Alto" | "Crítico";
  estado: string;          // En seguimiento, Mitigado, etc
  responsable: string;     // Nombre asignado
  ultimaActualizacion: string; // YYYY-MM-DD
  proximaRevision: string;     // YYYY-MM-DD
  evidencia: string;       // SharePoint / SAP / Power BI, etc
}
```

---

## 🔄 Flujo de sincronización

```
1. n8n Lee Excel SharePoint
   ↓
2. Transforma columnas a JSON
   ↓
3. Obtiene token OAuth de Azure AD
   ↓
4. Envía PATCH /api/riesgos
   ↓
5. API actualiza en memoria
   ↓
6. Dashboard Auditor refleja cambios
   ↓
7. Slack notifica los resulados (opcional)
```

**Frecuencia sugerida**: Diaria a las 8:00 AM (configurable)

---

## 🔐 Seguridad

- ✅ Autenticación: OAuth 2.0 con Microsoft Entra (Azure AD)
- ✅ Autorización: Solo usuarios autenticados pueden hacer cambios
- ✅ Transporte: HTTPS en Vercel
- ✅ Validación: API valida estructura de datos antes de actualizar

---

## 📋 Checklist de implementación

- [ ] Crear archivo Excel en SharePoint con estructura correcta
- [ ] Crear Application en Azure AD y obtener Client ID + Secret
- [ ] Configurar variables de entorno en n8n
- [ ] Importar workflow template en n8n
- [ ] Probar lectura del archivo Excel
- [ ] Probar autenticación Azure AD
- [ ] Probar PATCH a /api/riesgos
- [ ] Configurar schedule (diario a las 8:00 AM)
- [ ] Probar notificación en Slack (opcional)
- [ ] Activar workflow en n8n

---

## 🚨 Monitoreo

**En n8n**:
- Revisa "Executions" del workflow después de cada ejecución
- Activa alertas para fallos

**En Auditor**:
- Ve a `/riesgos` y verifica timestamp "Última actualización"
- Los cambios deben reflejarse en máximo 5 minutos

**En Slack** (si está configurado):
- Recibirás notificación cada vez que se sincronice
- Formato: `✅ Matriz de Riesgos CES actualizada - X riesgos sincronizados`

---

## 📚 Documentación detallada

- **Guía paso a paso**: [N8N_PASO_A_PASO.md](N8N_PASO_A_PASO.md) ← EMPIEZA AQUÍ
- **Docs técnicas**: [N8N_SETUP.md](N8N_SETUP.md)
- **Template n8n**: [n8n_workflow_template.json](n8n_workflow_template.json)
- **API Code**: [src/routes/api/riesgos.ts](src/routes/api/riesgos.ts)

---

## 🆘 Troubleshooting rápido

| Error | Solución |
|-------|----------|
| 401 Unauthorized | Verifica token Azure AD |
| 400 Bad Request | Valida JSON del body |
| Timeout | Aumenta timeout HTTP a 30s |
| "Riesgo no encontrado" | Verifica que ID (R-01) exista |

---

## 🎯 Próximos pasos

1. Lee: **N8N_PASO_A_PASO.md** (guía completa)
2. Ejecuta: Importa workflow en n8n
3. Verifica: Sincronización automática en Auditor
4. Monitorea: Slack notifications

---

## 📧 Contacto

**Especialista en Riesgos**: Johann Steven Toro  
**Coordinadora CES**: Laura Jaramillo  
**Slack**: #auditar-ces-riesgos

---

**Versión**: 1.0  
**Última actualización**: Julio 22, 2026  
**Status**: ✅ Producción lista

