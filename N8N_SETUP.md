# Integración n8n → Auditor (Riesgos CES)

## Descripción
Este flujo n8n sincroniza la matriz de riesgos desde un archivo Excel en SharePoint hacia la aplicación Auditor en Vercel.

## Campos sincronizados
- **Riesgo**: Nombre e ID del riesgo (R-XX)
- **Nivel**: Crítico, Alto, Medio, Bajo
- **Estado**: En seguimiento, Mitigado, Controlado, etc.
- **Responsable**: Nombre de la persona responsable
- **Última actualización**: Fecha de último cambio (YYYY-MM-DD)
- **Próx. revisión**: Fecha próxima revisión (YYYY-MM-DD)
- **Evidencia**: Ubicación de evidencia (ej: SharePoint, Power BI, SAP)

## Setup n8n

### 1. Autenticación con Vercel API
El endpoint requiere autenticación con Microsoft Entra (Azure AD). Para n8n:

1. Crea una aplicación en **Azure AD** con credenciales de cliente (Client ID + Secret)
2. Obtén un token de acceso usando OAuth 2.0 Client Credentials
3. O usa un usuario de servicio con delegated permissions

**Token OAuth 2.0 - Endpoint**:
```
https://login.microsoftonline.com/{TENANT_ID}/oauth2/v2.0/token
```

**Body**:
```json
{
  "grant_type": "client_credentials",
  "client_id": "{{ $env.ENTRA_CLIENT_ID }}",
  "client_secret": "{{ $env.ENTRA_CLIENT_SECRET }}",
  "scope": "api://{{ VERCEL_API_AUDIENCE }}/.default"
}
```

### 2. Nodos n8n necesarios

**Nodo 1: GET SharePoint (Excel)**
- Conector: SharePoint
- Acción: Get file
- Ubicación: /auditor/Matriz_de_Riesgos.xlsx
- Parse Excel

**Nodo 2: Transform (opcional)**
```javascript
// Mapear columnas Excel → JSON
return items.map(item => ({
  id: item.json['ID'],
  nombre: item.json['Riesgo'],
  nivel: item.json['Nivel'],
  estado: item.json['Estado'],
  responsable: item.json['Responsable'],
  ultimaActualizacion: item.json['Última actualización'],
  proximaRevision: item.json['Próx. revisión'],
  evidencia: item.json['Evidencia']
}));
```

**Nodo 3: HTTP POST → API**
- URL: `https://{TU_DOMINIO_VERCEL}/api/riesgos`
- Método: PATCH
- Authentication: OAuth 2.0 (Bearer token del Nodo 1)
- Headers:
  ```
  Content-Type: application/json
  ```
- Body (raw JSON):
  ```json
  {{ json.stringify(n2.output) }}
  ```

### 3. Trigger de ejecución
- **Scheduer diario** a las 08:00 AM (cada día hábil)
- O **Manual trigger** para pruebas rápidas
- O **Webhook** cuando el archivo en SharePoint cambia

## Respuesta esperada del API

**Éxito (200)**:
```json
{
  "resultados": [
    { "id": "R-01", "actualizado": true },
    { "id": "R-02", "actualizado": true }
  ],
  "riesgos": [
    {
      "id": "R-01",
      "nombre": "Indisponibilidad de servicio crítico",
      "nivel": "Alto",
      "estado": "En seguimiento",
      "responsable": "Andrés Cano",
      "ultimaActualizacion": "2026-07-22",
      "proximaRevision": "2026-08-22",
      "evidencia": "SharePoint / CES / Riesgos"
    }
  ]
}
```

**Error (400)**:
```json
{
  "error": "Error procesando actualización"
}
```

**No autenticado (401)**:
```
Unauthorized
```

## Endpoint disponibles

### GET /api/riesgos
Obtiene la lista actual de riesgos.

**Headers requeridos**:
```
Authorization: Bearer {TOKEN}
```

**Response (200)**:
```json
{
  "riesgos": [...]
}
```

---

### PATCH /api/riesgos
Actualiza uno o múltiples riesgos.

**Headers requeridos**:
```
Content-Type: application/json
Authorization: Bearer {TOKEN}
```

**Body - Actualizar un riesgo**:
```json
{
  "id": "R-01",
  "nivel": "Medio",
  "estado": "Mitigado",
  "ultimaActualizacion": "2026-07-22"
}
```

**Body - Actualizar múltiples**:
```json
[
  { "id": "R-01", "nivel": "Medio" },
  { "id": "R-02", "estado": "Controlado" }
]
```

**Response (200)**:
```json
{
  "resultados": [
    { "id": "R-01", "actualizado": true },
    { "id": "R-02", "actualizado": false, "error": "Riesgo no encontrado" }
  ],
  "riesgos": [...]
}
```

## Ejemplo de flujo completo en n8n

```
[SharePoint Read] 
    ↓
[JavaScript Transform] 
    ↓
[OAuth 2.0 Token] 
    ↓
[HTTP PATCH /api/riesgos] 
    ↓
[Wait/Delay 2s]
    ↓
[Slack Notification] ← Confirmar actualización
```

## Troubleshooting

| Problema | Solución |
|----------|----------|
| 401 Unauthorized | Verificar token de acceso y permisos en Azure AD |
| 400 Bad Request | Validar JSON del body, revisar estructura de campos |
| Timeout | Aumentar timeout en n8n HTTP node (30s+) |
| No actualiza | Verificar que los IDs de riesgos coincidan (R-01, R-02, etc.) |

## Notas importantes

⚠️ **Actualización en tiempo real**: Los cambios se almacenan en memoria. Para persistencia en BD:
- Implementar conexión a PostgreSQL/MongoDB
- Los cambios se perderán al reiniciar Vercel

✅ **Auditoría**: Se recomienda adicionar logging de cambios (quién, cuándo, qué cambió)

✅ **Validación**: El API valida automáticamente:
- Que el riesgo exista
- Que los campos sean válidos
- Responde con array de resultados

## URLs de referencia
- 🌐 **Auditor Vercel**: `https://{TU_DOMINIO_VERCEL}`
- 📊 **Riesgos CES**: `https://{TU_DOMINIO_VERCEL}/riesgos`
- 🔌 **API Riesgos**: `https://{TU_DOMINIO_VERCEL}/api/riesgos`
