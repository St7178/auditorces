# 📋 Guía Paso a Paso: n8n + Auditor CES Riesgos

## Requisitos previos
- ✅ Cuenta en **n8n** (cloud.n8n.io o self-hosted)
- ✅ Acceso a **SharePoint** de tu organización
- ✅ Cuenta de **Azure AD** con credenciales de aplicación (Client ID + Secret)
- ✅ URL de **Vercel** del proyecto Auditor (ej: `https://auditor-ces.vercel.app`)

---

## Paso 1: Preparar archivo Excel en SharePoint

Tu archivo debe tener estas columnas exactamente:

| Columna | Tipo | Ejemplo |
|---------|------|---------|
| **ID** | Texto | R-01 |
| **Riesgo** | Texto | Indisponibilidad de servicio crítico |
| **Nivel** | Selección | Crítico / Alto / Medio / Bajo |
| **Estado** | Texto | En seguimiento / Mitigado |
| **Responsable** | Texto | Andrés Cano |
| **Última actualización** | Fecha | 2026-07-22 |
| **Próx. revisión** | Fecha | 2026-08-22 |
| **Evidencia** | Texto | SharePoint / CES / Riesgos |

📁 **Ubicación recomendada en SharePoint**:
```
/sites/CES/Documentos compartidos/Operación/Matriz_de_Riesgos.xlsx
```

---

## Paso 2: Crear credenciales en Azure AD

1. Ve a **Azure Portal** → `portal.azure.com`
2. Ve a **Azure Active Directory** → **App registrations** → **New registration**
3. Nombre: `Auditor n8n Integration`
4. Selecciona: **Accounts in any organizational directory (Multitenant)**
5. Clic en **Register**
6. Copia el **Application (client) ID** y el **Directory (tenant) ID**
7. Ve a **Certificates & secrets** → **New client secret**
   - Descripción: `n8n workflow`
   - Expira en: `24 months`
8. Copia el **CLIENT SECRET VALUE** (solo aparece una vez)

**Variables de entorno para n8n**:
```
ENTRA_CLIENT_ID = {Application (client) ID}
ENTRA_CLIENT_SECRET = {CLIENT SECRET VALUE}
ENTRA_TENANT_ID = {Directory (tenant) ID}
AUDITOR_API_URL = https://auditor-ces.vercel.app (sin "/" al final)
```

---

## Paso 3: Crear el workflow en n8n

### Opción A: Importar template (Recomendado)
1. En n8n: **Workflows** → **+ New** → **Try a template**
2. Busca o sube `n8n_workflow_template.json` desde el repo
3. Configura las credenciales (pasos abajo)
4. Guarda

### Opción B: Crear manualmente
Ve al paso 4 (Nodo por nodo)

---

## Paso 4: Configurar nodos uno por uno

### 🔴 Nodo 1: Leer Excel de SharePoint

**Tipo**: SharePoint Online

**Pasos**:
1. Haz clic en el nodo
2. **Authenticate** → Conecta tu cuenta Microsoft
3. **Resource** → Select `Files`
4. **Drive** → Selecciona el sitio de SharePoint (ej: "CES")
5. **Folder Path** → `/Documentos compartidos/Operación`
6. **File Name** → `Matriz_de_Riesgos.xlsx`
7. **Get As**: `File`
8. Clic en **Execute Node**

✅ Debe mostrar el contenido del archivo

---

### 🟠 Nodo 2: Transformar Excel → JSON

**Tipo**: Code (JavaScript)

**Script**:
```javascript
// Adapta los nombres de columnas si son diferentes
return items.map(item => ({
  id: String(item.json['ID']).trim(),
  nombre: String(item.json['Riesgo']).trim(),
  nivel: String(item.json['Nivel']).trim(),
  estado: String(item.json['Estado']).trim(),
  responsable: String(item.json['Responsable']).trim(),
  ultimaActualizacion: item.json['Última actualización'],
  proximaRevision: item.json['Próx. revisión'],
  evidencia: String(item.json['Evidencia']).trim()
}));
```

✅ Output debe ser un array de objetos JSON válido

---

### 🟡 Nodo 3: Obtener token OAuth de Azure AD

**Tipo**: HTTP Request

**Configuración**:
- **Method**: POST
- **URL**: 
  ```
  https://login.microsoftonline.com/{{ $env.ENTRA_TENANT_ID }}/oauth2/v2.0/token
  ```
- **Headers**:
  ```
  Content-Type: application/x-www-form-urlencoded
  ```
- **Body** (form-encoded):
  ```
  grant_type=client_credentials
  client_id={{ $env.ENTRA_CLIENT_ID }}
  client_secret={{ $env.ENTRA_CLIENT_SECRET }}
  scope=api://{{ $env.AUDITOR_API_AUDIENCE }}/.default
  ```
  
  ⚠️ Si no conoces `AUDITOR_API_AUDIENCE`, usa:
  ```
  scope={{ $env.AUDITOR_API_AUDIENCE }}/.default
  ```
  
  O simplemente ignora este nodo si usas autenticación diferente.

- **Authentication**: None
- Clic en **Execute Node**

✅ Output: `{ "access_token": "eyJ..." }`

---

### 🟢 Nodo 4: Enviar a Auditor API

**Tipo**: HTTP Request

**Configuración**:
- **Method**: PATCH
- **URL**: 
  ```
  {{ $env.AUDITOR_API_URL }}/api/riesgos
  ```
- **Authentication**: Bearer (Token)
- **Token**: 
  ```
  {{ nodes['Nodo 3'].json.access_token }}
  ```
  
  o si lo obtuviste de otro lado:
  ```
  {{ $env.AUDITOR_API_TOKEN }}
  ```

- **Headers**:
  ```
  Content-Type: application/json
  Accept: application/json
  ```

- **Send Body**: ✅ ON
- **Body Type**: JSON
- **Body** (raw):
  ```json
  {{ JSON.stringify(items.map(item => ({
    id: item.json.id,
    nombre: item.json.nombre,
    nivel: item.json.nivel,
    estado: item.json.estado,
    responsable: item.json.responsable,
    ultimaActualizacion: item.json.ultimaActualizacion,
    proximaRevision: item.json.proximaRevision,
    evidencia: item.json.evidencia
  }))) }}
  ```

✅ Response esperado:
```json
{
  "resultados": [
    { "id": "R-01", "actualizado": true }
  ],
  "riesgos": [...]
}
```

---

### 🔵 Nodo 5: Notificación en Slack (Opcional)

**Tipo**: Slack

**Configuración**:
- **Connect your account** → Slack workspace
- **Resource**: Message
- **Channel**: #auditar (o tu canal)
- **Text**:
  ```
  ✅ Matriz de Riesgos CES actualizada
  
  📊 Riesgos sincronizados: {{ nodes['Nodo 4'].json.resultados.length }}
  
  🕐 Hora: {{ new Date().toLocaleString('es-CO') }}
  
  📍 Auditor: https://auditor-ces.vercel.app/riesgos
  ```

---

## Paso 5: Configurar el Trigger (Automático)

**Tipo**: Cron / Schedule

**Opción 1: Ejecución diaria**
- **Trigger Type**: Cron
- **Cron Expression**: `0 8 * * 1-5` (Lunes-Viernes a las 8:00 AM)
- **TimeZone**: America/Bogota

**Opción 2: Ejecución manual**
- **Trigger Type**: Manual (botón "Execute Workflow")

**Opción 3: Webhook desde SharePoint (Avanzado)**
- Crea un webhook cuando el archivo cambia
- n8n captura el evento automáticamente

---

## Paso 6: Probar el workflow

1. Clic en **Test Flow** o **Execute Workflow**
2. Revisa que cada nodo ejecute sin errores:
   - ✅ Nodo 1: Lee el archivo Excel
   - ✅ Nodo 2: Transforma datos
   - ✅ Nodo 4: Envía a API y obtiene respuesta 200
   - ✅ Nodo 5: Envía mensaje a Slack

3. Ve a tu Auditor en `https://auditor-ces.vercel.app/riesgos`
4. Los datos deben estar actualizados

---

## Paso 7: Activar el workflow

1. Clic en **Active** (arriba a la derecha)
2. Estado debe cambiar a **Active** (verde)
3. El workflow se ejecutará según el schedule configurado

---

## Variables de Entorno en n8n

En n8n: **Settings** → **Environment variables**

Agrega estas variables:
```
ENTRA_CLIENT_ID
ENTRA_CLIENT_SECRET
ENTRA_TENANT_ID
AUDITOR_API_URL
AUDITOR_API_AUDIENCE (opcional)
AUDITOR_API_TOKEN (si no usas OAuth)
```

---

## Troubleshooting

### ❌ Error: 401 Unauthorized
- Verifica que el token sea válido
- Comprueba que Azure AD tiene permisos correctos
- Revisa expiration del client secret

### ❌ Error: 400 Bad Request
- Valida que los campos JSON sean válidos (sin comillas extras)
- Revisa que el JSON sea un array: `[{...}, {...}]`
- Comprueba nombres de columnas en Excel

### ❌ Error: No encuentro el archivo en SharePoint
- Verifica ruta exacta del archivo
- Asegúrate que el nodo 1 tenga permisos de lectura
- Intenta con la ruta completa: `/sites/CES/Documentos compartidos/...`

### ❌ No actualiza en Auditor
- Comprueba que el API token sea válido
- Revisa en Vercel logs: `vercel logs auditor-ces`
- Valida que los IDs de riesgos existan (R-01, R-02, etc.)

---

## Verificar sincronización

**En Auditor**:
1. Ve a `https://auditor-ces.vercel.app/riesgos`
2. Revisa la tabla
3. Debe mostrar datos actualizados con timestamp actual

**En n8n**:
1. Ve al workflow
2. Abre **Executions**
3. Haz clic en la última ejecución
4. Revisa el detalle de cada nodo

---

## Siguientes pasos

✅ Agregar validaciones de datos duplicados
✅ Crear histórico de cambios en DB
✅ Agregar autoaprobación de cambios
✅ Conectar con Power BI para reportes automáticos

---

## Contacto / Soporte

📧 **Contacto Técnico**: Johann Steven Toro - Especialista en Riesgos
📞 **Slack**: #auditar-ces-riesgos
🔗 **Repo**: https://github.com/tusuario/auditor

---

**Última actualización**: Julio 22, 2026
**Versión**: 1.0
