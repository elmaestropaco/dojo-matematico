(function (root) {
  const STORAGE = 'ninja_math_learning_rounds_v1';
  const CLEAR_EPOCH = 'ninja_math_learning_clear_epoch_v1';
  let lastCleared = 0;
  let volatileRounds = [];
  const escape = value => String(value ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const count = value => Number.isFinite(Number(value)) ? Math.min(1e9, Math.max(0, Number(value))) : 0;
  function read() {
    let saved = [];
    try { const v = JSON.parse(localStorage.getItem(STORAGE) || '[]'); if (Array.isArray(v)) saved = v.filter(r => r && typeof r.id === 'string' && typeof r.date === 'string' && r.players && typeof r.players === 'object'); } catch { /* Export can still use the in-memory fallback. */ }
    return [...new Map([...saved, ...volatileRounds].map(r => [r.id, r])).values()].sort((a, b) => a.date.localeCompare(b.date)).slice(-500);
  }
  function roundId(code, room) { return `${code}:${room.seed || 0}:${room.startedAt || room.rematchAt || room.createdAt || 0}`; }
  function capture(code, room, config = {}) {
    if (!Number.isFinite(Number(room?.startedAt)) || Number(room?.startedAt) <= 0 || room.status === 'lobby') return;
    let cleared = lastCleared;
    try { cleared = Math.max(cleared, Number(localStorage.getItem(CLEAR_EPOCH)) || 0); } catch { /* Storage may be unavailable. */ }
    if (Number(room.startedAt) <= cleared) return;
    const rounds = read(), id = roundId(code, room), old = rounds.find(r => r.id === id);
    const players = { ...(old?.players || {}) };
    for (const [key, p] of Object.entries(room.players || {})) {
      if (!p || !p.name) continue;
      const previous = players[key], attempts = count(p.correctCount) + count(p.wrongCount);
      if (previous && attempts < count(previous.correctCount) + count(previous.wrongCount)) continue;
      players[key] = { name: String(p.name || 'Ninja'), score: count(p.score), correctCount: count(p.correctCount), wrongCount: count(p.wrongCount), learningStats: p.learningStats || previous?.learningStats || {}, isConnected: p.isConnected !== false };
    }
    const snapshot = { id, code: String(code), date: new Date(room.startedAt).toISOString(), mode: room.mode || 'online', activity: config.activity || 'calculo',
      contents: config.activity === 'problemas' ? config.problemSettings?._family || 'enteros' : (config.enabledKeys || []).join(', '), endCondition: config.endCondition || 'time', goalCount: config.goalCount || 0, status: room.status, players };
    const updated = [...rounds.filter(r => r.id !== id), snapshot].sort((a, b) => a.date.localeCompare(b.date)).slice(-500);
    try { localStorage.setItem(STORAGE, JSON.stringify(updated)); volatileRounds = []; return true; } catch { volatileRounds = updated; return false; }
  }
  function topic(operation) {
    return operation.problem ? `problemas_${operation.problem.family || 'enteros'}_${[...(operation.problem.categories || [operation.problem.category || 'mixto'])].sort().join('_')}` : operation.skillKind || operation.kind || 'calculo';
  }
  function topicLabel(key) {
    const names = { enteros: 'Enteros', suma: 'Sumas', resta: 'Restas', multiplicacion: 'Multiplicaciones', division: 'Divisiones', fracciones: 'Fracciones', mcmMcd: 'MCM y MCD', mcm: 'MCM', mcd: 'MCD', porcentajes: 'Porcentajes', parte: 'Parte de una cantidad', descuento: 'Descuentos', aumento: 'Aumentos', relacion: 'Porcentaje de una parte', medidas: 'Medidas', longitud: 'Longitud', masa: 'Masa', capacidad: 'Capacidad', tiempo: 'Tiempo', razonamiento: 'Razonamiento', geometria: 'Geometría', compras: 'Dinero y compras', proporcionalidad: 'Proporcionalidad', add: 'Sumas', sub: 'Restas', mul: 'Multiplicaciones', div: 'Divisiones', round: 'Redondeo', missing: 'Huecos', compare: 'Comparaciones', power: 'Potencias' };
    if (typeof OPERATION_LABELS !== 'undefined' && OPERATION_LABELS[key]) return OPERATION_LABELS[key];
    if (key.startsWith('problemas_')) return 'Problemas · ' + [...new Set(key.slice(10).split('_').map(k => names[k] || k))].join(' · ');
    return names[key] || key;
  }
  function record(player, operation, result) {
    player.learningStats ||= {};
    const key = topic(operation), row = player.learningStats[key] ||= { correct: 0, wrong: 0, hints: 0, solutions: 0, skips: 0, assistedCorrect: 0 };
    if (result === 'correct') { row.correct++; if (operation.hintStage) row.assistedCorrect++; }
    if (result === 'wrong') row.wrong++;
    if (result === 'hint') row.hints++;
    if (result === 'solution') row.solutions++;
    if (result === 'skip') row.skips++;
  }
  function aggregate(rounds = read()) {
    const all = new Map();
    for (const round of rounds) for (const p of Object.values(round.players || {})) {
      const key = String(p.name).trim().toLocaleLowerCase('es');
      const row = all.get(key) || { name: p.name, rounds: 0, score: 0, correct: 0, wrong: 0, hints: 0, solutions: 0, skips: 0, assisted: 0, topics: {} };
      row.rounds++; row.score += count(p.score); row.correct += count(p.correctCount); row.wrong += count(p.wrongCount);
      for (const [topic, stats] of Object.entries(p.learningStats || {})) {
        const entry = row.topics[topic] ||= { correct: 0, wrong: 0, hints: 0, solutions: 0, skips: 0, assistedCorrect: 0 };
        for (const k of Object.keys(entry)) entry[k] += count(stats[k]);
        row.hints += count(stats.hints); row.solutions += count(stats.solutions); row.skips += count(stats.skips); row.assisted += count(stats.assistedCorrect);
      }
      all.set(key, row);
    }
    return [...all.values()].sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }
  const precision = row => row.correct + row.wrong ? Math.round(row.correct / (row.correct + row.wrong) * 100) + '%' : 'Sin intentos';
  function sheets(rounds = read()) {
    const summary = [['Alumno', 'Rondas', 'Puntos', 'Aciertos', 'Fallos', 'Precisión', 'Pistas', 'Soluciones', 'Saltos', 'Aciertos con pista']];
    const skills = [['Alumno', 'Contenido', 'Aciertos', 'Fallos', 'Precisión', 'Pistas', 'Soluciones', 'Saltos', 'Aciertos con pista']];
    const detail = [['Fecha', 'Sala', 'Modo', 'Actividad', 'Contenidos', 'Alumno', 'Puntos', 'Aciertos', 'Fallos', 'Estado de ronda']];
    for (const row of aggregate(rounds)) {
      summary.push([row.name, row.rounds, row.score, row.correct, row.wrong, precision(row), row.hints, row.solutions, row.skips, row.assisted]);
      for (const [key, t] of Object.entries(row.topics)) skills.push([row.name, topicLabel(key), t.correct, t.wrong, precision(t), t.hints, t.solutions, t.skips, t.assistedCorrect]);
    }
    for (const round of rounds) for (const p of Object.values(round.players || {})) detail.push([round.date, round.code, round.mode === 'teacher' ? 'Maestro' : 'Batalla online', round.activity === 'problemas' ? 'Problemas' : 'Cálculo', String(round.contents || '').split(', ').map(topicLabel).join(', '), p.name, count(p.score), count(p.correctCount), count(p.wrongCount), round.status === 'finished' ? 'Terminada' : 'Parcial']);
    return [{ name: 'Resumen', rows: summary }, { name: 'Por contenido', rows: skills }, { name: 'Rondas', rows: detail }];
  }
  // Uncompressed ZIP is enough for a small, dependency-free XLSX workbook.
  function zip(files) {
    const encoder = new TextEncoder(), entries = [], headers = [];
    let offset = 0;
    const crc = bytes => { let c = -1; for (const b of bytes) { c ^= b; for (let i = 0; i < 8; i++) c = c >>> 1 ^ (c & 1 ? 0xedb88320 : 0); } return (c ^ -1) >>> 0; };
    const header = (size, values) => { const bytes = new Uint8Array(size), view = new DataView(bytes.buffer); for (const [position, value, length] of values) length === 2 ? view.setUint16(position, value, true) : view.setUint32(position, value, true); return bytes; };
    for (const [name, text] of files) {
      const filename = encoder.encode(name), body = encoder.encode(text), checksum = crc(body);
      const local = header(30, [[0, 0x04034b50, 4], [4, 20, 2], [6, 0x800, 2], [14, checksum, 4], [18, body.length, 4], [22, body.length, 4], [26, filename.length, 2]]);
      const central = header(46, [[0, 0x02014b50, 4], [4, 20, 2], [6, 20, 2], [8, 0x800, 2], [16, checksum, 4], [20, body.length, 4], [24, body.length, 4], [28, filename.length, 2], [42, offset, 4]]);
      entries.push(local, filename, body); headers.push(central, filename); offset += local.length + filename.length + body.length;
    }
    const centralSize = headers.reduce((n, a) => n + a.length, 0);
    const end = header(22, [[0, 0x06054b50, 4], [8, files.length, 2], [10, files.length, 2], [12, centralSize, 4], [16, offset, 4]]);
    const result = new Uint8Array(offset + centralSize + 22); let cursor = 0;
    for (const part of [...entries, ...headers, end]) { result.set(part, cursor); cursor += part.length; }
    return result;
  }
  function workbook(rounds = read()) {
    const data = sheets(rounds), ns = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
    const sheetXml = rows => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="${ns}"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols><col min="1" max="2" width="30" customWidth="1"/><col min="3" max="${rows[0].length}" width="18" customWidth="1"/></cols><sheetData>${rows.map((row, index) => `<row r="${index + 1}">${row.map((v, col) => `<c r="${String.fromCharCode(65 + col)}${index + 1}" ${typeof v === 'number' ? '' : 't="inlineStr"'}>${typeof v === 'number' ? `<v>${v}</v>` : `<is><t xml:space="preserve">${escape(v)}</t></is>`}</c>`).join('')}</row>`).join('')}</sheetData><autoFilter ref="A1:${String.fromCharCode(64 + rows[0].length)}${rows.length}"/></worksheet>`;
    return zip([
      ['[Content_Types].xml', `<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>${data.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>`],
      ['_rels/.rels', '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
      ['xl/workbook.xml', `<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="${ns}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${data.map((s, i) => `<sheet name="${s.name}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets></workbook>`],
      ['xl/_rels/workbook.xml.rels', `<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${data.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')}</Relationships>`],
      ...data.map((s, i) => [`xl/worksheets/sheet${i + 1}.xml`, sheetXml(s.rows)])
    ]);
  }
  function printHtml(rounds = read()) {
    const data = sheets(rounds);
    return `<!doctype html><html lang="es"><meta charset="utf-8"><title>Seguimiento del alumnado</title><style>body{font:12px Verdana,sans-serif;color:#163c36;margin:24px}h1{font-size:23px}table{border-collapse:collapse;width:100%;margin:16px 0 30px;table-layout:auto}th,td{border:1px solid #abc7bf;padding:6px;text-align:left;overflow-wrap:anywhere}th{background:#e3f2ec}tr{break-inside:avoid}h2{break-after:avoid}@page{size:A4 landscape;margin:12mm}@media print{button{display:none}}</style><h1>Dojo Matemático · Seguimiento del alumnado</h1><p>Datos guardados en este navegador. ${rounds.length} rondas. Los nombres iguales se agrupan; usa nombres distintos para alumnos distintos.</p><button onclick="window.print()">Imprimir / Guardar como PDF</button>${data.map(s => `<h2>${escape(s.name)}</h2><table><thead><tr>${s.rows[0].map(v => `<th>${escape(v)}</th>`).join('')}</tr></thead><tbody>${s.rows.slice(1).map(r => `<tr>${r.map(v => `<td>${escape(v)}</td>`).join('')}</tr>`).join('')}</tbody></table>`).join('')}</html>`;
  }
  function clear() { localStorage.removeItem(STORAGE); volatileRounds = []; lastCleared = Date.now(); try { localStorage.setItem(CLEAR_EPOCH, String(lastCleared)); } catch { /* The in-memory cutoff still protects this session. */ } }
  root.NinjaLearning = { read, capture, record, aggregate, sheets, workbook, printHtml, clear, topic, topicLabel, precision };
  if (typeof module !== 'undefined') module.exports = root.NinjaLearning;
}(globalThis));
