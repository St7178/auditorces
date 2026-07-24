# 📋 Setup n8n: Sync Clientes + Contratos Unificado

## Resumen

Ahora toda la información (clientes y contratos) viene en **un solo endpoint** `/api/sync/clientes`.

El Excel de SharePoint tiene estas columnas:
- **A**: Ciente (nombre del cliente)
- **B**: Cuenta (código o nombre de la cuenta/contrato)
- **C**: Tiempo (M) (duración en meses)
- **D**: Fecha Inicio
- **E**: Fecha Fin
- **F**: Responsable

---

## Paso 1: Preparar Excel en SharePoint

Estructura esperada (con cabeceras en fila 1):

| Ciente | Cuenta | Tiempo (M) | Fecha Inicio | Fecha Fin | Responsable |
|--------|--------|-----------|--------------|-----------|-------------|
| Bancolombia | Cuenta-001 | 24 | 2024-01-01 | 2026-01-01 | Elkin Borja |
| Bancolombia | Cuenta-002 | 12 | 2025-06-01 | 2026-06-01 | Elkin Borja |
| Ecopetrol | Cuenta-001 | 24 | 2025-03-01 | 2027-03-01 | Elkin Borja |

**Ubicación**: `https://tupagina.sharepoint.com/sites/CES/Documentos compartidos/.../Clientes_Contratos.xlsx`

---

## Paso 2: Crear Workflow en n8n

### 2.1 — Nodo Trigger (Cron)

1. Abre [cloud.n8n.io](https://cloud.n8n.io)
2. Crea nuevo workflow: **+ Workflow → Empty Workflow**
3. En canvas, busca **Cron** y añade un nodo
4. Configura:
   - **Interval**: 1
   - **Unit**: days (diario)
   - **Trigger At**: 08:00 (8 AM)

### 2.2 — Nodo 1: SharePoint (Leer Excel)

1. Haz clic en **➕ Add Node**
2. Busca **SharePoint Online** y selecciona
3. Configura:
   - **Authentication**: Autentica con tu cuenta Microsoft
   - **Resource**: File
   - **Operation**: Get file content (binary)
   - **Site**: Selecciona tu sitio CES
   - **Drive**: Documentos compartidos
   - **File Path**: `/Clientes_Contratos.xlsx`
4. Click en **Execute** para probar

**Output**: el Excel como buffer binario

### 2.3 — Nodo 2: Spreadsheet File + Code (Parser Excel → JSON)

> Importante: en n8n no puedes usar `require('xlsx')` dentro de un nodo Code porque está bloqueado por seguridad. Para leer el Excel, usa el nodo nativo `Spreadsheet File`.

#### Paso A — Añadir el nodo `Spreadsheet File`

1. **➕ Add Node** → Busca **Spreadsheet File**
2. Configura:
   - **Operation**: `Read`
   - **File Format**: `Auto Detect` o `Excel`
   - Conecta el nodo de SharePoint al nodo `Spreadsheet File`
3. Ejecuta el nodo para ver que lee el archivo correctamente

#### Paso B — Añadir un nodo `Code` para transformar filas

1. **➕ Add Node** → Busca **Code**
2. Pega este código:

```javascript
function parseDate(v) {
  if (v === null || v === undefined || v === '') return null;

  if (typeof v === 'number') {
    // Excel date serial -> JS date
    const base = new Date(Date.UTC(1899, 11, 30));
    base.setUTCDate(base.getUTCDate() + v);
    return base.toISOString().slice(0, 10);
  }

  if (typeof v === 'string') {
    const trimmed = v.trim();
    if (/^\d+$/.test(trimmed)) {
      const base = new Date(Date.UTC(1899, 11, 30));
      base.setUTCDate(base.getUTCDate() + Number(trimmed));
      return base.toISOString().slice(0, 10);
    }

    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }
  }

  return null;
}

function addMonthsIso(startIso, months) {
  if (!startIso || !months) return null;
  const d = new Date(startIso);
  d.setMonth(d.getMonth() + Number(months));
  return d.toISOString().slice(0, 10);
}

function slug(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function getValue(row, keys) {
  const normalizedKeys = keys.map((k) => k.toLowerCase().trim());
  const matchKey = Object.keys(row).find((key) => normalizedKeys.includes(key.toLowerCase().trim()));
  return matchKey !== undefined ? row[matchKey] : '';
}

const rows = items
  .map((item) => item.json || {})
  .filter((row) => Object.keys(row).length > 0);

if (!rows.length) {
  throw new Error('No se encontraron filas en el Excel');
}

const clientesMap = new Map();

for (const row of rows) {
  const clienteName = String(getValue(row, ['Ciente', 'Cliente', 'cliente', 'Cliente Nombre'])).trim();
  const cuenta = String(getValue(row, ['Cuenta', 'Cuenta ', 'cuenta'])).trim();
  const tiempo = String(getValue(row, ['Tiempo (M)', 'Tiempo', 'tiempo'])).trim();
  const inicioRaw = getValue(row, ['Fecha Inicio', 'Fecha\nInicio', 'Fecha Inicio ', 'Inicio']);
  const finRaw = getValue(row, ['Fecha Fin', 'Fecha\nFin', 'Fecha Fin ', 'Fin']);
  const responsable = String(getValue(row, ['Responsable', 'responsable'])).trim() || '-';

  if (!clienteName) continue;

  const inicio = parseDate(inicioRaw) || null;
  let fin = parseDate(finRaw) || null;
  if (!fin && inicio && tiempo) {
    fin = addMonthsIso(inicio, Number(tiempo));
  }

  let estado = 'Vigente';
  if (fin) {
    const now = new Date();
    const endDate = new Date(fin);
    const diffDays = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) estado = 'Vencido';
    else if (diffDays <= 60) estado = 'Próximo a vencer';
  }

  if (!clientesMap.has(clienteName)) {
    clientesMap.set(clienteName, {
      id: slug(clienteName),
      nombre: clienteName,
      responsable,
      servicios: cuenta ? [cuenta] : [],
      estado: 'Activo',
      contratos: cuenta ? [{ id: cuenta, inicio: inicio || '-', fin: fin || '-', estado }] : []
    });
  } else {
    const existing = clientesMap.get(clienteName);
    if (cuenta) {
      if (!existing.servicios.includes(cuenta)) existing.servicios.push(cuenta);
      existing.contratos.push({ id: cuenta, inicio: inicio || '-', fin: fin || '-', estado });
    }
  }
}

const clientes = Array.from(clientesMap.values());
return [{ json: { clientes } }];
```

3. Ejecuta el nodo

**Resultado esperado**: algo como esto:

```json
[
  {
    "clientes": [
      {
        "id": "bancolombia",
        "nombre": "Bancolombia",
        "responsable": "Elkin Borja",
        "servicios": ["Cuenta-001"],
        "estado": "Activo",
        "contratos": []
      }
    ]
  }
]
```

#### Paso C — Nodo HTTP Request

1. Añade un nodo **HTTP Request**
2. Configura:
   - **Method**: `POST`
   - **URL**: `https://TU_APP/api/sync/clientes`
   - **Headers**: `Content-Type: application/json`
   - **Body**: `{{ $json["clientes"] }}`
3. Ejecuta

Si el nodo HTTP responde `ok = true`, el flujo ya está bien conectado.

---

## Paso 3: Variables de Entorno en n8n (Opcional)

Si quieres proteger con `SYNC_SECRET`:

1. En n8n: **Settings** (⚙️) → **Environment variables**
2. Agregar:
   ```
   SYNC_SECRET=tu-secret-muy-seguro-aqui
   ```
3. En el nodo HTTP, el header usa: `{{ env.SYNC_SECRET }}`
4. En tu app (Vercel/host), define la misma variable: `SYNC_SECRET=tu-secret-muy-seguro-aqui`

---

## Paso 4: Activar Workflow

1. Click en **Save** (arriba)
2. Click en **Activate** (interruptor arriba a la derecha)
3. Verifica en **Execution History** que se ejecuta diariamente

---

## Pruebas Locales (curl)

### Test 1: Leer clientes (GET)
```bash
curl http://localhost:5173/api/sync/clientes
```

### Test 2: Enviar clientes (POST)
```bash
curl -X POST http://localhost:5173/api/sync/clientes \
  -H "Content-Type: application/json" \
  -H "x-sync-secret: tu-secret" \
  -d @clientes.json
```

Donde `clientes.json` contiene:
```json
[
  {
    "id": "bancolombia",
    "nombre": "Bancolombia",
    "responsable": "Elkin Borja",
    "servicios": ["Cuenta-001", "Cuenta-002"],
    "estado": "Activo",
    "contratos": [
      {
        "id": "Cuenta-001",
        "inicio": "2024-01-01",
        "fin": "2026-01-01",
        "estado": "Próximo a vencer"
      },
      {
        "id": "Cuenta-002",
        "inicio": "2025-06-01",
        "fin": "2026-06-01",
        "estado": "Vigente"
      }
    ]
  }
]
```

---

## Solución de Problemas

| Problema | Solución |
|----------|----------|
| Excel no se encuentra | Verifica ruta exacta en SharePoint y permisos |
| Error "No se parsearon clientes" | Revisa que Excel tenga datos en columnas A-F |
| 401 Unauthorized | Verifica `SYNC_SECRET` coincide en n8n y Vercel |
| Campos en blanco | Asegúrate que los nombres de columnas sean exactos (con espacios/saltos de línea) |
| Contratos no agrupan | El Function node agrupa por nombre de cliente, verifica que estén consistentes |

---

## Flujo Completo en n8n

```
[Cron: diario 08:00]
          ↓
[SharePoint: Leer Excel]
          ↓
[Function: Parser Excel → JSON con clientes + contratos]
          ↓
[HTTP POST: /api/sync/clientes]
          ↓
✅ App actualizada con nuevos clientes/contratos
```

---

## Verificar en UI

1. Login en la app
2. Ve a **Clientes CES**
3. Deberías ver:
   - Tarjetas de clientes
   - Dentro de cada tarjeta: sección "Contratos (N)" con fechas y estado
   - Alerta roja si hay contratos "Próximo a vencer"

---

## Notas

- Si agregas/editas el Excel en SharePoint, n8n lo sincroniza automáticamente cada día a las 8 AM
- Para sync inmediato: en n8n UI, click en **Execute node** (▶️)
- La app lee `/api/sync/clientes` cada vez que cargas la página `Clientes CES`
- Fallback: si el sync falla, la app usa datos estáticos de `ces-data.ts`

