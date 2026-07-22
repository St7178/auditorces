# 🚀 n8n + Auditor Riesgos: Quick Reference Card

**Imprimir o guardar en móvil** 📱

---

## ⚡ Inicio rápido (< 5 min)

### URLs importantes
```
Auditor:        https://auditor-ces.vercel.app
Riesgos:        https://auditor-ces.vercel.app/riesgos
n8n Cloud:      https://cloud.n8n.io
Azure Portal:   https://portal.azure.com
```

### Credentials Azure AD
```
Application:    "Auditor n8n Integration"
Required:       Client ID, Client Secret, Tenant ID
Copy to:        n8n Environment Variables
Rotation:       Cada 6 meses
```

### Variables n8n
```
ENTRA_CLIENT_ID         → Azure App Registration
ENTRA_CLIENT_SECRET     → Azure App Secret
ENTRA_TENANT_ID         → Azure Directory ID  
AUDITOR_API_URL         → https://auditor-ces.vercel.app
AUDITOR_API_AUDIENCE    → (opcional)
```

---

## 📋 Estructura Excel SharePoint

**Ruta**: `/Documentos compartidos/Operación/Matriz_de_Riesgos.xlsx`

**Columnas** (en este orden):
```
A: ID                    → R-01, R-02, etc
B: Riesgo               → Texto descripción
C: Nivel                → Crítico, Alto, Medio, Bajo
D: Estado               → En seguimiento, Mitigado, etc
E: Responsable          → Nombre persona
F: Última actualización → YYYY-MM-DD (ej: 2026-07-22)
G: Próx. revisión       → YYYY-MM-DD
H: Evidencia            → SharePoint / SAP / Power BI
```

---

## 🔄 Flujo n8n (5 nodos)

```
┌─ 1. SharePoint Read ────────────────────┐
│   Settings:                             │
│   - Conector: SharePoint Online        │
│   - Archivo: Matriz_de_Riesgos.xlsx    │
└─────────────────┬──────────────────────┘
                  ↓
┌─ 2. Transform (JS Code) ────────────────┐
│   Mapear columnas Excel → JSON          │
│   Output: array [{id, nombre, ...}]    │
└─────────────────┬──────────────────────┘
                  ↓
┌─ 3. OAuth Token ─────────────────────────┐
│   POST login.microsoftonline.com/token  │
│   Obtiene: access_token                 │
└─────────────────┬──────────────────────┘
                  ↓
┌─ 4. HTTP PATCH /api/riesgos ────────────┐
│   Auth: Bearer {{ token }}              │
│   Success: 200 + {resultados, riesgos}│
└─────────────────┬──────────────────────┘
                  ↓
┌─ 5. Slack Notification (Optional) ──────┐
│   "✅ Sincronizado - X riesgos"        │
└─────────────────────────────────────────┘
```

---

## 🔐 API Endpoints

### GET /api/riesgos
```bash
curl -H "Authorization: Bearer TOKEN" \
  https://auditor-ces.vercel.app/api/riesgos
```
**Response**: `{ "riesgos": [...] }`

### PATCH /api/riesgos
```bash
curl -X PATCH \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '[{"id":"R-01","nivel":"Bajo"}]' \
  https://auditor-ces.vercel.app/api/riesgos
```
**Response**: `{ "resultados": [...], "riesgos": [...] }`

---

## ✅ Checklist rápido

### Setup (Día 1)
- [ ] Crear app en Azure AD
- [ ] Copiar credentials
- [ ] Crear Excel en SharePoint
- [ ] Agregar variables en n8n
- [ ] Importar template n8n

### Testing (Día 1)
- [ ] Ejecutar cada nodo manual
- [ ] Verificar token válido
- [ ] Ver datos actualizados
- [ ] Revisar en dashboard

### Production (Día 2)
- [ ] Crear Cron trigger (08:00 AM)
- [ ] Activar workflow
- [ ] Monitorear 1ª ejecución
- [ ] Configurar alertas

---

## 🆘 Troubleshooting rápido

| Error 401 | 400 | Timeout | No actualiza |
|-----------|-----|---------|--------------|
| Token expirado | JSON inválido | n8n lento | API caída |
| ↓ | ↓ | ↓ | ↓ |
| Validar Azure AD | Revisar JSON | Aumentar timeout | Revisar logs |
| Regenerar secret | Test en Postman | Revisar n8n | Vercel status |

**Ver más**: N8N_PASO_A_PASO.md → Troubleshooting

---

## 📊 Performance

| Métrica | Meta | Actual |
|---------|------|--------|
| Ejecución promedio | < 5 min | - |
| Success rate | > 95% | - |
| Latencia API | < 1 seg | - |
| Edad datos | HOY | - |

---

## 📞 Contacts

| Rol | Nombre | Contacto |
|-----|--------|----------|
| Riesgos | Johann Steven Toro | Slack |
| Coordinación | Laura Jaramillo | Slack |
| IT Admin | [Your name] | Slack |
| Slack | #auditar-ces-riesgos | - |

---

## 📚 Documentación completa

1. **RESUMEN_IMPLEMENTACION.md** — Qué se hizo
2. **README_N8N.md** — Resumen ejecutivo
3. **N8N_PASO_A_PASO.md** ⭐ — Guía completa (30 min)
4. **N8N_SETUP.md** — API reference
5. **N8N_VARIABLES_ENTORNO.md** — Cómo obtener variables
6. **ARQUITECTURA.md** — Diagrama
7. **_INDEX.md** — Índice central

---

## 🎯 Datos de la tabla

**Campos sincronizados**:
- ✅ ID (R-01)
- ✅ Nombre (Descripción)
- ✅ Nivel (Crítico/Alto/Medio/Bajo)
- ✅ Estado (En seguimiento, Mitigado, etc)
- ✅ Responsable (Persona asignada)
- ✅ Última actualización (fecha)
- ✅ Próx. revisión (fecha)
- ✅ Evidencia (ubicación)

---

## 💡 Tips n8n

```
✓ Usa {{ $env.VARIABLE }} para secrets
✓ Prueba cada nodo por separado
✓ Revisa "Logs" si hay errores
✓ Aumenta timeout HTTP a 30s
✓ Usa Slack para alertas
✓ Ejecuta manual antes de Cron
✓ Monitorea "Executions" diariamente
```

---

## 🔗 Links rápidos

| Link | Propósito |
|------|-----------|
| https://auditor-ces.vercel.app/riesgos | Dashboard |
| https://cloud.n8n.io | Workflow |
| https://portal.azure.com | Credentials |
| https://tupagina.sharepoint.com/sites/CES | Excel |

---

## 📈 Frecuencia

| Actividad | Frecuencia |
|-----------|-----------|
| n8n Sync | Diaria (08:00 AM) |
| Revisar Auditor | Diaria |
| Revisar n8n Status | Diaria |
| Rotar secrets | Cada 6 meses |
| Actualizar docs | Según cambios |

---

## ✨ Status

**Implementación**: ✅ Completa  
**Testing**: ✅ Listo  
**Producción**: ✅ Ready  
**Última actualización**: Julio 22, 2026  

---

**Guardá este archivo en tu móvil o imprimelo** 📱🖨️

