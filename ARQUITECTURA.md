# 🏗️ Arquitectura: n8n + Auditor Riesgos CES

## Diagrama general de flujo

```
┌─────────────────────────────────────────────────────────────────────┐
│                         AUDITOR CES RIESGOS                         │
│                       Arquitectura e-2-e                            │
└─────────────────────────────────────────────────────────────────────┘

TIER 1: ORIGEN DE DATOS
═════════════════════════════
┌──────────────────────┐
│     SharePoint       │
│  Matriz_de_Riesgos   │
│    .xlsx (Excel)     │
│                      │
│ Columns:             │
│ • ID                 │
│ • Riesgo             │
│ • Nivel              │
│ • Estado             │
│ • Responsable        │
│ • Últ. Actualiz.     │
│ • Próx. Revisión     │
│ • Evidencia          │
└──────────────────────┘
          ↓
          │ (1. Lectura automática)
          │

TIER 2: ORQUESTACIÓN
═════════════════════════════
┌──────────────────────────────────────────────────┐
│              🔄 N8N WORKFLOW                     │
│                                                  │
│  ┌─────────────────────────────────────────┐   │
│  │ 1. Share Point Reader                    │   │
│  │    Lee archivo Excel                     │   │
│  └─────────────────────────────────────────┘   │
│                    ↓                           │
│  ┌─────────────────────────────────────────┐   │
│  │ 2. Data Transformer (JS)                 │   │
│  │    Convierte columnas → JSON             │   │
│  └─────────────────────────────────────────┘   │
│                    ↓                           │
│  ┌─────────────────────────────────────────┐   │
│  │ 3. Azure AD Token Request                │   │
│  │    POST → OAuth 2.0 (Client Credentials) │   │
│  │    Obtiene: access_token (JWT)           │   │
│  └─────────────────────────────────────────┘   │
│                    ↓                           │
│  ┌─────────────────────────────────────────┐   │
│  │ 4. HTTP PATCH → Auditor API              │   │
│  │    Envía riesgos actualizados            │   │
│  │    Auth: Bearer {{ token }}              │   │
│  └─────────────────────────────────────────┘   │
│                    ↓                           │
│  ┌─────────────────────────────────────────┐   │
│  │ 5. Slack Notification (Opcional)         │   │
│  │    Notifica resultado sync                │   │
│  └─────────────────────────────────────────┘   │
│                                                  │
│ Trigger: Cron (Diario 8:00 AM) o Manual        │
└──────────────────────────────────────────────────┘
          ↓
          │ (2. HTTP PATCH con token)
          │

TIER 3: API & AUTENTICACIÓN
═════════════════════════════
┌────────────────────────────────────────────┐
│       🔐 AUDITOR API (src/routes/api)       │
│                                            │
│  POST /api/riesgos  (no implementado aún) │
│  GET  /api/riesgos  ✅ Lee todos          │
│  PATCH /api/riesgos ✅ Actualiza          │
│                                            │
│  Auth: Entra (Azure AD) + Session Token    │
│  En: memoria (reinicio = reset)           │
│  Validación: ID existe, campos válidos     │
│                                            │
│  Response: 200 { resultados, riesgos }    │
└────────────────────────────────────────────┘
          ↓
          │ (3. Actualiza datos en memoria)
          │

TIER 4: FRONTEND - PERSISTENCIA
═════════════════════════════════
┌────────────────────────────────────┐
│    ⚛️ AUDITOR FRONTEND (React)      │
│                                    │
│  /riesgos ← Route (TanStack)       │
│  ├─ imports RIESGOS desde ces-data │
│  └─ Renderiza tabla (read-only)    │
│                                    │
│  Status: Los cambios se pierden al│
│          recargar Vercel (memoria) │
│                                    │
│  Mejora futura: QueryClient +      │
│  revalidation después de sync      │
└────────────────────────────────────┘
          ↓
          │ (4. Usuario ve datos actualizados)
          │

TIER 5: USUARIO FINAL
═════════════════════════════════
┌────────────────────────────────────┐
│  👤 Laura (Coordinadora CES)        │
│                                    │
│  https://auditor-ces.vercel.app/r  │
│                                    │
│  ✅ Ve matriz actualizada en vivo  │
│  ✅ Cambios reflejados en 5 min    │
│  ✅ Auditoría automática con n8n  │
└────────────────────────────────────┘
```

---

## Componentes internos

### A. Nodo n8n: SharePoint Reader
```
Input: 
  ✓ Credenciales Microsoft
  ✓ Ruta archivo: /sites/CES/...Matriz_de_Riesgos.xlsx

Process:
  → Conecta a SharePoint OneDrive
  → Download archivo Excel
  → Parse contenido

Output:
  [
    { "ID": "R-01", "Riesgo": "...", "Nivel": "...", ... },
    { "ID": "R-02", "Riesgo": "...", "Nivel": "...", ... }
  ]
```

### B. Nodo n8n: Data Transformer
```javascript
Input: Array de objetos Excel

Code:
  return items.map(item => ({
    id: String(item.json['ID']).trim(),
    nombre: String(item.json['Riesgo']).trim(),
    nivel: String(item.json['Nivel']).trim(),
    estado: String(item.json['Estado']).trim(),
    responsable: String(item.json['Responsable']).trim(),
    ultimaActualizacion: item.json['Última actualización'],
    proximaRevision: item.json['Próx. revisión'],
    evidencia: String(item.json['Evidencia']).trim()
  }))

Output: Array JSON limpio
```

### C. Nodo n8n: Azure AD OAuth
```
Request:
  POST https://login.microsoftonline.com/{TENANT_ID}/oauth2/v2.0/token
  Body:
    grant_type: "client_credentials"
    client_id: {{ $env.ENTRA_CLIENT_ID }}
    client_secret: {{ $env.ENTRA_CLIENT_SECRET }}
    scope: "api://..." (depende setup)

Response:
  {
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "token_type": "Bearer",
    "expires_in": 3599
  }

Uso: Token se usa en siguiente nodo (Authorization header)
```

### D. Endpoint API: PATCH /api/riesgos
```
Input:
  [
    { "id": "R-01", "nivel": "Medio", "estado": "Mitigado" },
    { "id": "R-02", "responsable": "Nuevo Responsable" }
  ]

Process:
  1. Verifica autenticación (session JWT)
  2. Para cada riesgo:
     - Busca por ID en array RIESGOS (en memoria)
     - Valida campos
     - Actualiza propiedades
     - Añade a resultados
  3. Retorna resumen + datos actualizados

Output (Success):
  200 OK
  {
    "resultados": [
      { "id": "R-01", "actualizado": true },
      { "id": "R-02", "actualizado": true }
    ],
    "riesgos": [...]
  }

Output (Error):
  400 Bad Request
  { "error": "Error procesando actualización" }
  
  401 Unauthorized
  (No token o session inválida)
```

### E. Frontend: Tabla Riesgos
```
File: src/routes/riesgos.tsx

Import: RIESGOS from "@/lib/ces-data"

Render:
  <table>
    <thead>
      <th>Riesgo</th>
      <th>Nivel</th>
      <th>Estado</th>
      <th>Responsable</th>
      <th>Última actualización</th>
      <th>Próx. revisión</th>
      <th>Evidencia</th>
    </thead>
    <tbody>
      {RIESGOS.map(r => <tr key={r.id}>...)}
    </tbody>
  </table>

Status:
  ⚠️ Actualmente read-only (datos hardcodeados)
  📋 TODO: Recargar datos después de sync n8n
  🔄 TODO: Agregar modo edición manual
```

---

## Diagrama de secuencia temporal

```
HORA        N8N                 AUDITOR API        FRONTED          USUARIO
────────────────────────────────────────────────────────────────────────────

08:00       [CRON TRIGGER]
            └─ Inicia workflow

08:01       [SharePoint Read]
            └─ Descarga Excel

08:02       [Transform Data]
            └─ Mapea columnas

08:03       [Get OAuth Token]
            └─ POST Azure AD
                          │
                          └─→ 200 OK + jwt
                          
08:04       [Send PATCH]
            └─ POST /api/riesgos + jwt
                          │
                          ├─ Valida token ✓
                          ├─ Actualiza RIESGOS array
                          └─→ 200 OK
            
08:05       [Slack Notification]
            └─ "✅ Sincronizado"

            [Usuario F5 refresh]
                                           ┌─→ [Carga new RIESGOS]
                                           │   └─ Renderiza tabla
                                           └───→ [Ve datos frescos]
                                           
                                                 👁️ "¡Actualizado!"
```

---

## Seguridad en capas

```
CAPA 1: AUTENTICACIÓN (OAuth 2.0)
┌─────────────────────────────────────────────┐
│ n8n obtiene token de Azure AD               │
│ Usa Client Credentials (no usuario real)    │
│ Token expira en 1 hora                      │
│ Se regenera en cada workflow run            │
└─────────────────────────────────────────────┘

CAPA 2: TRANSPORTE (TLS/HTTPS)
┌─────────────────────────────────────────────┐
│ n8n → Vercel: Conexión cifrada HTTPS       │
│ SharePoint → n8n: HTTPS (nativo)           │
│ Headers: Authorization + Content-Type      │
└─────────────────────────────────────────────┘

CAPA 3: VALIDACIÓN (API)
┌─────────────────────────────────────────────┐
│ API valida:                                 │
│ ✓ Token válido y no expirado               │
│ ✓ JSON estructura correcta                  │
│ ✓ Campos requeridos presentes              │
│ ✓ Tipos de dato válidos                    │
│ ✓ IDs de riesgos existen                   │
└─────────────────────────────────────────────┘

CAPA 4: AUTORIZACIÓN (Session)
┌─────────────────────────────────────────────┐
│ Frontend: Solo usuarios con sesión activa  │
│ API: Verifica getCurrentSession()          │
│ No hay roles específicos aún (mejorar)     │
└─────────────────────────────────────────────┘
```

---

## Puntos de extensión (TODO)

```
❌ FALTA: Persistencia en BD
   ├─ Actualmente: Almacenamiento en memoria
   ├─ Problema: Cambios se pierden en reinicio
   └─ Solución: Postgresql / MongoDB

❌ FALTA: Histórico de cambios
   ├─ Log de quién cambió qué y cuándo
   ├─ Auditoría completa
   └─ Rollback de cambios

❌ FALTA: Validaciones de negocio
   ├─ Nivel de riesgo compatible con estado
   ├─ Responsable debe existir en equipo
   └─ Reglas de automaticidad

❌ FALTA: Revalidation en frontend
   ├─ React Query si cambios desde API
   ├─ Notificación en tiempo real
   └─ Refres automático de componentes

✅ COMPLETADO: API básica
✅ COMPLETADO: n8n integration
✅ COMPLETADO: Autenticación OAuth
```

---

## Monitoreo y observabilidad

```
📊 MÉTRICAS A TRACKEAR:

1. n8n:
   - Execution time (cuánto tarda cada workflow)
   - Success rate (% ejecuciones exitosas)
   - Errores por nodo (cuál falla más)
   
2. API:
   - Latencia PATCH /api/riesgos
   - Tasa de éxito (200 vs 4xx)
   - Cantidad de riesgos actualizados
   
3. Frontend:
   - Edad de datos (timestamp vs hora actual)
   - Errores de carga
   - Sesiones activas

📈 DASHBOARD RECOMENDADO:
   - Power BI conectado a Vercel logs
   - Datadog / New Relic para APM
   - Slack alerts si syncfalla
```

---

## Roadmap futuro

```
FASE 1 (ACTUAL): MVP Lectura → Sync
├─ ✅ Excel → n8n → API
├─ ✅ Visualización Auditor
└─ ✅ Notificaciones Slack

FASE 2: Mejorar persistencia
├─ [ ] Migrar a PostgreSQL
├─ [ ] Audit trail de cambios
└─ [ ] Endpoint POST para crear riesgos

FASE 3: Validaciones inteligentes
├─ [ ] Reglas de negocio (Nivel vs Estado)
├─ [ ] Integración RRHH (validar responsables)
└─ [ ] Alertas de vencimiento próx. revisión

FASE 4: Real-time
├─ [ ] WebSockets para cambios push
├─ [ ] Multi-usuario edits simultáneos
└─ [ ] Conflictos de versión
```

---

**Diagrama actualizado**: Julio 22, 2026  
**Versión arquitectura**: 1.0  

