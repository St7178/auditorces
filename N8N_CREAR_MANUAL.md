# 🔨 Crear flujo n8n MANUALMENTE - Webhook + SharePoint → Auditor API

**Opción más flexible**: Webhook (sincroniza cuando hay cambios, no a hora fija)

---

## PASO 0: Requisitos previos

✅ Cuenta en **cloud.n8n.io** (o self-hosted)
✅ Acceso a **SharePoint** de tu organización
✅ **Azure AD**: App registrada con credenciales
✅ URL de **Vercel**: `https://auditor-ces.vercel.app`

---

## PASO 1: Ir a n8n y crear workflow

1. Ve a **https://cloud.n8n.io**
2. Haz login
3. Clic en **Workflows** (sidebar izquierdo)
4. Clic en **+ New** (arriba a la derecha)
5. Se abre un canvas en blanco

---

## PASO 2: Agregar Trigger (Webhook)

### 🟢 Opción A: Webhook (RECOMENDADO - trigger automático)

1. Busca en el canvas: **"Webhook"** o **"HTTP"**
2. Selecciona: **Webhook** (el que tiene el icono de gancho)
3. Clic en el nodo para configurar
4. Deja los defaults por ahora (vamos a copiarlo después)

**¿Cómo funciona?**
- n8n te genera una URL pública
- SharePoint notifica a esa URL cuando hay cambios
- El flujo se ejecuta automáticamente

**Ventaja**: No necesitas Cron, es automático
**Desventaja**: Requiere setup de webhook en SharePoint

---

### 🟡 Opción B: Cron / Schedule (trigger por hora/día)

Si prefieres más simple por ahora:

1. Busca: **"Schedule"** o **"Cron"**
2. Selecciona: **Schedule Trigger**
3. Configura:
   - **Trigger type**: Every Day
   - **Time**: 08:00 (8 AM)
   - **Timezone**: America/Bogota (o tu zona)

👉 **Recomendación**: Empieza con Webhook aunque sea más complejo, porque es más eficiente.

---

## PASO 3: Agregar Nodo 1 - Leer SharePoint

1. Debajo del Webhook, haz clic en **➕ (Add node)**
2. Busca: **"SharePoint Online"**
3. Selecciona: **SharePoint Online**
4. Autenticación:
   - Clic en **"Create new credentials"**
   - Conecta tu cuenta Microsoft (será rápido)
   - Clic en **"Connect"**

5. Configura:
   - **Resource**: Select `Files`
   - **Drive**: Selecciona tu sitio SharePoint (ej: "CES")
   - **Folder Path**: Completa la ruta
     ```
     /Documentos compartidos/Operación
     ```
   - **File Name**: `Matriz_de_Riesgos.xlsx`
   - **Get As**: Select `File`
   
6. Clic en **Execute Node** (botón play arriba a la derecha)

✅ Debe mostrar: **"Successfully fetched file"**

---

## PASO 4: Agregar Nodo 2 - Transformar datos

1. Clic en **➕ Add Node** (después del nodo SharePoint)
2. Busca: **"Code"** o **"Execute JavaScript"**
3. Selecciona: **Execute code** (o **Code** dependiendo versión)
4. **Language**: JavaScript
5. **Mode**: Run once (default)
6. En el editor, borra todo y pega esto:

```javascript
// Leer el archivo Excel y convertir a array JSON
const xlsx = require('xlsx');
const fs = require('fs');

// El archivo viene en items[0].binary
const fileBuffer = Buffer.from(items[0].binary.data, 'base64');

// Parsear Excel
const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
const worksheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = xlsx.utils.sheet_to_json(worksheet);

// Mapear columnas de Excel a nuestro JSON
return rows.map(row => ({
  id: String(row['ID'] || row['id']).trim(),
  nombre: String(row['Riesgo'] || row['nombre']).trim(),
  nivel: String(row['Nivel'] || row['nivel']).trim(),
  estado: String(row['Estado'] || row['estado']).trim(),
  responsable: String(row['Responsable'] || row['responsable']).trim(),
  ultimaActualizacion: row['Última actualización'] || row['ultimaActualizacion'],
  proximaRevision: row['Próx. revisión'] || row['proximaRevision'],
  evidencia: String(row['Evidencia'] || row['evidencia']).trim()
}));
```

7. Clic en **Execute Node**

✅ Output debe ser un array JSON limpio con los 8 campos

**Si falla**: 
- Revisa que los nombres de columnas en Excel coincidan exactamente
- O ajusta los nombres en el código (ej: "Última actualización" vs "Ultim. Actualiz.")

---

## PASO 5: Agregar Nodo 3 - Obtener Token OAuth

1. Clic en **➕ Add Node**
2. Busca: **"HTTP Request"**
3. Selecciona: **HTTP Request**
4. Configura:

**Method**: POST

**URL**:
```
https://login.microsoftonline.com/{{ $env.ENTRA_TENANT_ID }}/oauth2/v2.0/token
```

**Headers**:
```
Content-Type: application/x-www-form-urlencoded
```

**Authentication**: None (dejamos custom body)

**Send Body**: ✅ ON

**Body Type**: Form Data Urlencoded

**Body fields** (agregar 4 campos):

| Key | Value |
|-----|-------|
| `grant_type` | `client_credentials` |
| `client_id` | `{{ $env.ENTRA_CLIENT_ID }}` |
| `client_secret` | `{{ $env.ENTRA_CLIENT_SECRET }}` |
| `scope` | `api://{{ $env.AUDITOR_API_AUDIENCE }}/.default` |

(Si no tienes AUDITOR_API_AUDIENCE, prueba con algo genérico)

5. Clic en **Execute Node**

✅ Response debe contener:
```json
{
  "access_token": "eyJ0eXAiOiJKV1Q...",
  "token_type": "Bearer",
  "expires_in": 3599
}
```

**Si falla 401/400**:
- Verifica que las variables de entorno sean correctas
- En n8n: Settings (⚙️) → Environment Variables → agrega:
  ```
  ENTRA_CLIENT_ID = valor
  ENTRA_CLIENT_SECRET = valor
  ENTRA_TENANT_ID = valor
  AUDITOR_API_AUDIENCE = valor (opcional)
  AUDITOR_API_URL = https://auditor-ces.vercel.app
  ```

---

## PASO 6: Agregar Nodo 4 - Enviar PATCH a Auditor API

1. Clic en **➕ Add Node**
2. Busca: **"HTTP Request"** (nuevo nodo)
3. Configura:

**Method**: PATCH

**URL**:
```
{{ $env.AUDITOR_API_URL }}/api/riesgos
```

**Authentication**: None (custom headers)

**Headers**:
```
Content-Type: application/json
Authorization: Bearer {{ nodes['HTTP Request'].json.access_token }}
```

(Ajusta el nombre del nodo si tu nodo de OAuth se llama diferente)

**Send Body**: ✅ ON

**Body Type**: JSON

**Body** (raw):
```json
{{ JSON.stringify(nodes['Execute code'].json.map(item => ({
  id: item.id,
  nombre: item.nombre,
  nivel: item.nivel,
  estado: item.estado,
  responsable: item.responsable,
  ultimaActualizacion: item.ultimaActualizacion,
  proximaRevision: item.proximaRevision,
  evidencia: item.evidencia
}))) }}
```

**Response handler**: Let me handle the response (default)

5. Clic en **Execute Node**

✅ Response esperado (200):
```json
{
  "resultados": [
    { "id": "R-01", "actualizado": true }
  ],
  "riesgos": [...]
}
```

---

## PASO 7: Agregar Nodo 5 - Notificación Slack (OPCIONAL)

1. Clic en **➕ Add Node**
2. Busca: **"Slack"**
3. Selecciona: **Slack**
4. Haz clic en **"Create new credentials"**
   - Selecciona tu workspace Slack
   - Autoriza la app
5. Configura:
   - **Resource**: Message
   - **Channel**: `#auditar-ces-riesgos` (o tu canal)
   - **Text**:
     ```
     ✅ Matriz de Riesgos CES actualizada

     📊 Riesgos sincronizados: {{ nodes['HTTP Request1'].json.resultados.length }}

     🕐 Hora: {{ new Date().toLocaleString('es-CO') }}

     📍 Dashboard: https://auditor-ces.vercel.app/riesgos
     ```

6. Ejecuta para probar

---

## PASO 8: Conectar nodos en el canvas

En el canvas visual, asegúrate que los nodos estén conectados en orden:

```
Webhook
   ↓
SharePoint Read
   ↓
Execute Code (Transform)
   ↓
HTTP Request (OAuth Token)
   ↓
HTTP Request 1 (PATCH API)
   ↓
Slack (Optional)
```

Para conectar: Arrastra la bolita verde que sale del bottom derecho de cada nodo hacia el siguiente.

---

## PASO 9: Configurar Webhook (si elegiste esa opción)

1. Haz clic en el **nodo Webhook**
2. Busca el campo **"Webhook URL"**
3. Copia la URL que se genera (algo como: `https://webhook.n8n.io/...`)
4. Ve a **SharePoint** → Tu sitio CES
5. Ve a **Configuración del sitio** → **Flujos de trabajo** (o Power Automate)
6. Crea un flujo que se dispare cuando se modifique `Matriz_de_Riesgos.xlsx`
7. Agrega una acción: **Send HTTP request to Power Automate**
   - URL: Pega la URL del webhook de n8n
   - Method: POST
   - Body: `{}`

---

## PASO 10: Guardar y probar

1. Arriba a la izquierda, dale un nombre:
   ```
   Sincronizar Matriz Riesgos CES
   ```

2. Clic en **Save**

3. Clic en **Test Flow** (en el canvas)
   - Empieza a ejectuar nodo por nodo
   - Revisa que cada uno funcione (verde = ✅, rojo = ❌)

4. Si todo está verde, el flujo funciona correctamente

---

## PASO 11: Activar el flujo

1. Arriba a la derecha, verás un botón **"Active"** (checkbox)
2. Haz clic para activar ✅
3. El flujo ahora está VIVO

**Webhook**: Se ejecutará automáticamente cuando cambies el Excel
**Cron**: Se ejecutará a la hora programada

---

## ✅ Checklist

- [ ] Webhook o Schedule configurado
- [ ] SharePoint conectado y autentica
- [ ] Transform code funciona (output JSON limpio)
- [ ] OAuth token obtenido (200 OK)
- [ ] PATCH a API retorna 200 + resultados
- [ ] Slack notificación funciona (opcional)
- [ ] Workflow guardado con nombre
- [ ] Workflow ACTIVADO
- [ ] Nodos conectados visualmente en canvas

---

## 🧪 Probar el flujo

### Opción 1: Manual (Ahora)
1. En n8n, clic en **Test Flow**
2. Revisa cada nodo en Logs
3. Verifica resultado en **Auditor** → `/riesgos`

### Opción 2: Cambiar Excel (si es Webhook)
1. Edita una célula en tu Excel SharePoint
2. Guarda
3. n8n debería ejecutarse automáticamente en segundos
4. Revisa **Executions** en n8n
5. Verifica cambios en Auditor

### Opción 3: Esperar hasta mañana (si es Cron)
1. Si configuraste para 08:00 AM
2. Mañana a las 8 AM se ejecutará automáticamente
3. Revisa **Executions** en n8n
4. Verifica cambios en Auditor

---

## 🚨 Troubleshooting por paso

### Paso 3 (SharePoint falla)
```
❌ "Unauthorized" → Reconecta credenciales Microsoft
❌ "File not found" → Verifica ruta exacta en SharePoint
❌ "Access denied" → Comprueba permisos en SharePoint
```

### Paso 4 (Transform falla)
```
❌ "Unexpected token" → Revisa nombres columnas Excel
❌ "Cannot read property" → El Excel no tiene estructura esperada
❌ Fix: Copia EXACTAMENTE los nombres de columnas de tu Excel
```

### Paso 5 (OAuth falla)
```
❌ "401 Unauthorized" → Verifica credentials en Azure AD
❌ "Invalid scope" → Cambia AUDITOR_API_AUDIENCE
❌ Fix: Ve a N8N_VARIABLES_ENTORNO.md para obtener valores correctos
```

### Paso 6 (API falla)
```
❌ "401 Unauthorized" → Token expirado o inválido
❌ "400 Bad Request" → JSON inválido en body
❌ "Connection refused" → Verifica que AUDITOR_API_URL sea correcto
❌ Fix: Prueba con Postman antes: https://www.postman.com/
```

---

## 📊 Esperado después de cada paso

| Paso | Nodo | Output esperado |
|------|------|----------------|
| 3 | SharePoint | `{ "id": "R-01", "binary": {...} }` |
| 4 | Code | `[{ "id": "R-01", "nombre": "...", ... }]` |
| 5 | OAuth | `{ "access_token": "eyJ...", ... }` |
| 6 | PATCH | `{ "resultados": [...], "riesgos": [...] }` |
| 7 | Slack | Message enviado a #auditar-ces-riesgos |

---

## 💾 Variables de entorno necesarias

En n8n: **Settings** (⚙️) → **Environment variables**

```
ENTRA_CLIENT_ID=xxxx-xxxx-xxxx
ENTRA_CLIENT_SECRET=secret-value-aqui
ENTRA_TENANT_ID=xxxx-xxxx-xxxx
AUDITOR_API_AUDIENCE=api://auditor-ces (opcional)
AUDITOR_API_URL=https://auditor-ces.vercel.app
```

---

## 🎯 Próximos pasos

1. ✅ Crear este flujo manualmente
2. ✅ Probar cada nodo
3. ✅ Activar workflow
4. ✅ Verificar en Auditor
5. ✅ Monitorear Executions en n8n

Listo. Ya tienes sincronización automática. 🚀

---

**¿Preguntas?** Revisa N8N_SETUP.md o N8N_TROUBLESHOOTING.md

