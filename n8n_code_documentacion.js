// Pegar este código en el nodo "4. Code: Excel -> Procesos + Documentacion" (Language: JavaScript).
//
// Estructura real detectada en "Listado documentos CES.xlsx":
// - Filas de sección: columna B ("__EMPTY") = "Documentos" -> marcan un nuevo proceso, cuyo nombre
//   está en la columna A (con emoji "📁 " al inicio, que se limpia aquí).
// - Filas de documento: columna B trae "CODIGO Nombre del documento" junto en una sola celda.
// - Columna G ("__EMPTY_5") es la observación; si empieza con "NA" el documento NO aplica al
//   alcance de CES y se descarta (no se sincroniza).

function parseDate(v) {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'number') {
    const base = new Date(Date.UTC(1899, 11, 30));
    base.setUTCDate(base.getUTCDate() + v);
    return base.toISOString().slice(0, 10);
  }
  const d = new Date(String(v).trim());
  if (!isNaN(d.getTime())) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
  return null;
}

function addMonthsIso(startIso, months) {
  if (!startIso) return null;
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

const rows = items.map((item) => item.json || {}).filter((row) => Object.keys(row).length > 0);
if (!rows.length) {
  throw new Error('No se encontraron filas en el Excel');
}

const COL_PROCESO = '📊 INFORMACIÓN DOCUMENTADA CES- PROCESO DEL SIG';

let currentProceso = '-';
const documentos = [];
const hoy = new Date().toISOString().slice(0, 10);

for (const row of rows) {
  const colA = String(row[COL_PROCESO] || '').trim();
  const colB = String(row['__EMPTY'] || '').trim();

  if (colB === 'Documentos') {
    currentProceso = colA.replace(/^📁\s*/, '').trim() || currentProceso;
    continue;
  }

  if (!colB) continue; // fila vacía / separador sin código+nombre

  const match = colB.match(/^(\S+)\s+([\s\S]+)$/);
  const codigo = match ? match[1].trim() : '-';
  const nombreDoc = (match ? match[2] : colB).replace(/\s+/g, ' ').trim();

  const observacion = String(row['__EMPTY_5'] || '').trim();
  const aplica = !/^na\b/i.test(observacion);
  if (!aplica) continue; // fuera del alcance de CES -> no se sincroniza

  const fechaPublicacion = parseDate(row['__EMPTY_1']);
  const proximaRevision = fechaPublicacion ? addMonthsIso(fechaPublicacion, 12) : null;

  documentos.push({
    id: slug(codigo !== '-' ? codigo : nombreDoc),
    codigo,
    nombre: nombreDoc,
    version: String(row['__EMPTY_2'] ?? 'NA').trim() || 'NA',
    responsable: String(row['__EMPTY_3'] ?? 'NA').trim() || 'NA',
    actualizacion: fechaPublicacion || '-',
    proximaRevision: proximaRevision || '-',
    ubicacion: [currentProceso, colA].filter(Boolean).join(' / '),
    estado: proximaRevision && proximaRevision < hoy ? 'Requiere revisión' : 'Vigente'
  });
}

return [{ json: { documentacion: documentos } }];
