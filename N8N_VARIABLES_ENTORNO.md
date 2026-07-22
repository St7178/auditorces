# Variables de Entorno para n8n → Auditor Riesgos CES

## En n8n Cloud (cloud.n8n.io)

**Ubicación**: Settings (⚙️) → Environment Variables

Agrega estas variables exactamente así:

```env
# Azure AD / Entra Credentials
ENTRA_CLIENT_ID=your-application-client-id-here
ENTRA_CLIENT_SECRET=your-client-secret-value-here
ENTRA_TENANT_ID=your-directory-tenant-id-here

# Auditor API Configuration
AUDITOR_API_URL=https://auditor-ces.vercel.app
AUDITOR_API_AUDIENCE=api://auditor-ces  # Opcional, depende de tu setup Azure

# Opcional: Token pre-generado (si no usas OAuth)
# AUDITOR_API_TOKEN=your-bearer-token-here

# SharePoint Configuration
SHAREPOINT_SITE=https://tupagina.sharepoint.com/sites/CES
SHAREPOINT_DOCUMENT_PATH=/Documentos compartidos/Operación/Matriz_de_Riesgos.xlsx

# Slack Configuration (Opcional)
SLACK_CHANNEL=#auditar-ces-riesgos
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

---

## Paso a paso para obtener cada variable

### 1. ENTRA (Azure AD) - Credentials 

**Ubicación**: Azure Portal → https://portal.azure.com

1. Ve a **Azure Active Directory**
2. Clic en **App Registrations**
3. Haz clic en **New Registration**
4. Rellena:
   - Name: `Auditor n8n Integration`
   - Supported account types: `Accounts in any organizational directory...`
   - Redirect URI: `Web: https://cloud.n8n.io/oauth2/callback` (para n8n cloud)
5. Clic en **Register**

**Obtener valores**:
- Copia el **Application (client) ID** → `ENTRA_CLIENT_ID`
- Copia el **Directory (tenant) ID** → `ENTRA_TENANT_ID`

Luego, crea el Secret:
1. Ve a **Certificates & secrets**
2. Clic en **New client secret**
3. Descripción: `n8n workflow automation`
4. Expires: `24 months` (máximo recomendado)
5. Copia el **Value** (aparece solo una vez) → `ENTRA_CLIENT_SECRET`

⚠️ **IMPORTANTE**: Guarda el secret en un lugar seguro. No vuelverá a aparecer.

---

### 2. AUDITOR_API_URL

**Valor**: Tu URL de Vercel actual

Ejemplo:
```
https://auditor-ces.vercel.app
```

O si tienes dominio custom:
```
https://auditor.tuempresa.com
```

**NO incluyas "/" al final**

---

### 3. AUDITOR_API_AUDIENCE (Opcional)

Este valor depende de cómo esté configurada tu aplicación Azure.

Si no sabes cuál es:
1. Ve a tu aplicación en Azure AD
2. Clic en **Expose an API**
3. El valor debajo de "Application ID URI" es tu AUDITOR_API_AUDIENCE

Ejemplo:
```
api://12345678-1234-1234-1234-123456789012
```

o

```
https://auditor-ces.azurewebsites.net
```

---

### 4. SharePoint Credentials

Estos datos se configuran en el **nodo 1 de n8n** (SharePoint Online)

En n8n: No necesitas variables, solo autentica tu cuenta Microsoft en el nodo.

Pero para referencia, la ruta típica es:
```
https://tupagina.sharepoint.com/sites/CES
```

---

### 5. Slack Webhook (Opcional)

Si quieres notificaciones automáticas en Slack:

1. Ve a tu workspace Slack
2. Ve a **Configuración del espacio de trabajo** → **Aplicaciones y integraciones**
3. Busca **Incoming Webhooks**
4. Clic en **Agregar Nueva Webhook**
5. Selecciona canal: `#auditar-ces-riesgos` (o crea uno)
6. Cpia la **URL de la webhook** → `SLACK_WEBHOOK_URL`

Ejemplo:
```
https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX
```

Y el nombre del canal:
```
SLACK_CHANNEL=#auditar-ces-riesgos
```

---

## Verbicar variables en n8n

Después de agregar las variables, en n8n puedes verificarlas:

1. En cualquier nodo, clic en el campo
2. Escribe `{{ $env.ENTRA_CLIENT_ID }}`
3. Presiona **Test**
4. Debe mostrar el valor sin errores

---

## Usar variables en nodos n8n

### En HTTP Request (nodo de autenticación)

```
URL: https://login.microsoftonline.com/{{ $env.ENTRA_TENANT_ID }}/oauth2/v2.0/token

Body (form-encoded):
grant_type=client_credentials
client_id={{ $env.ENTRA_CLIENT_ID }}
client_secret={{ $env.ENTRA_CLIENT_SECRET }}
scope=api://{{ $env.AUDITOR_API_AUDIENCE }}/.default
```

### En HTTP PATCH (nodo de actualización)

```
URL: {{ $env.AUDITOR_API_URL }}/api/riesgos

Header:
Authorization: Bearer {{ nodes['OAuth Node'].json.access_token }}
```

---

## Rotación de credenciales (Seguridad)

Cada 6 meses o cuando haya cambios de personal:

1. En Azure AD, crea un nuevo Client Secret
2. Actualiza `ENTRA_CLIENT_SECRET` en n8n con el nuevo valor
3. Desactiva el secret antiguo
4. En n8n, agrega una versión anterior como backup y etiquétala

---

## Troubleshshooting de variables

### ❌ "{{ $env.VARIABLE }} shows as text, not value"

- Asegúrate que la variable está configurada en Settings
- No uses comillas: ✅ `{{ $env.ENTRA_CLIENT_ID }}` ❌ `"{{ $env.ENTRA_CLIENT_ID }}"`
- En código JavaScript, usa: `process.env.ENTRA_CLIENT_ID`

### ❌ "401 Unauthorized usando token"

- Verifica que `ENTRA_CLIENT_SECRET` sea la última línea, sin saltos
- Comprueba que TENANT_ID es correcto
- Valida que la aplicación tenga permisos en Azure

### ❌ "Variable no aparece en dropdown"

- Recarga la pestaña del navegador (F5)
- En n8n, clic en Settings → Reload

---

## Seguridad recomendada

✅ **HACER**:
- Usar OAuth 2.0 con Azure AD (más seguro)
- Rotar secrets cada 6 meses
- Auditar permisos en Azure AD
- Usar secrets diferentes para dev, test y producción

❌ **NO HACER**:
- Compartir variables por Slack o email
- Guardar secrets en código o git
- Usar secrets expuestos en logs de n8n
- Usar una sola variable para múltiples ambientes

---

## Checklist final

- [ ] Aplicación registrada en Azure AD con nombre "Auditor n8n Integration"
- [ ] ENTRA_CLIENT_ID copiado
- [ ] ENTRA_CLIENT_SECRET copiado (guardado en lugar seguro)
- [ ] ENTRA_TENANT_ID copiado
- [ ] AUDITOR_API_URL configurado (sin "/" final)
- [ ] AUDITOR_API_AUDIENCE identificado (si aplica)
- [ ] Variables agregadas en n8n Settings → Environment Variables
- [ ] Verificadas las variables con {{ $env.XXX }}
- [ ] Webhook de Slack creado (opcional)
- [ ] Permisos de Azure AD revisados

---

## Referencias

- 📖 [Azure AD - App Registration](https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade)
- 📖 [n8n - Environment Variables](https://docs.n8n.io/hosting/environment-variables/)
- 📖 [n8n - OAuth 2.0 Setup](https://docs.n8n.io/credentials/builtin/oauth2/)
- 📖 [Slack Webhooks](https://api.slack.com/messaging/webhooks)

---

**Última actualización**: Julio 22, 2026  
**Versión configuración**: 1.0

