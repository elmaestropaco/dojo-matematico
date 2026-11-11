let sessionLibrary;
let sessionCatalog = [];

function bindSessionTools() {
  let storage;
  try { storage = window.localStorage; } catch { storage = { getItem() { throw Error('storage'); }, setItem() { throw Error('storage'); } }; }
  sessionLibrary = NinjaSessions.create(storage);
  const families = { enteros: 'Números enteros: sumas, restas, multiplicaciones y divisiones', fracciones: 'Fracciones', mcmMcd: 'Mínimo común múltiplo y máximo común divisor', porcentajes: 'Porcentajes', medidas: 'Medidas y conversiones', razonamiento: 'Razonamiento', geometria: 'Geometría: áreas y perímetros', compras: 'Dinero y compras', proporcionalidad: 'Proporcionalidad' };
  sessionCatalog = [
    ...Object.entries(OPERATION_LABELS).map(([key, title]) => ({ id: `calc:${key}`, key, title, kind: 'calc', group: 'Cálculo' })),
    ...Object.entries(families).map(([key, title]) => ({ id: `problem:${key}`, key, title, kind: 'problem', group: 'Problemas' })),
    ...Object.entries(NinjaLiteracyProblems.labels).map(([key,title]) => ({ id: `problem:${key}`, key, title, kind: 'problem', group: 'Problemas' })),
    ...Object.entries(NinjaSpatial.labels).map(([key,title]) => ({ id: `problem:${key}`, key, title, kind: 'problem', group: 'Problemas' })),
    ...NinjaGeometry.names.map((title, key) => ({ id: `geo:${key}`, key, title, kind: 'geo', group: 'Problemas de geometría' }))
  ];
  document.getElementById('saveSessionBtn').addEventListener('click', saveNamedSession);
  document.getElementById('sessionNameInput').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); saveNamedSession(); } });
  document.getElementById('activitySearch').addEventListener('input', renderSessionCatalog);
  document.getElementById('favoritesOnly').addEventListener('change', renderSessionCatalog);
  document.getElementById('sessionList').addEventListener('click', e => {
    const button = e.target.closest('button[data-session]'); if (!button) return;
    const session = sessionLibrary.list().find(s => s.id === button.dataset.session); if (!session) return;
    if (button.dataset.action === 'load') loadNamedSession(session);
    if (button.dataset.action === 'star') { sessionLibrary.star(session.id); renderNamedSessions(); sessionNotice('Favoritos actualizados.'); }
    if (button.dataset.action === 'remove' && confirm(`¿Eliminar la sesión «${session.name}»?`)) { sessionLibrary.remove(session.id); renderNamedSessions(); sessionNotice('Sesión eliminada.'); }
  });
  document.getElementById('activityResults').addEventListener('click', e => {
    const button = e.target.closest('button[data-catalog]'); if (!button) return;
    const item = sessionCatalog.find(i => i.id === button.dataset.catalog); if (!item) return;
    if (button.dataset.action === 'star') { sessionLibrary.toggleFavorite(item.id); renderSessionCatalog(); sessionNotice('Favoritos actualizados.'); }
    else chooseCatalogActivity(item);
  });
  renderNamedSessions(); renderSessionCatalog();
  if (!sessionLibrary.persistent()) sessionNotice('No se ha podido leer el almacenamiento del navegador.');
}

function sessionNotice(message) {
  document.getElementById('sessionNotice').textContent = message + (sessionLibrary.persistent() ? '' : ' Sin almacenamiento disponible: estos cambios solo se conservarán mientras esta página siga abierta.');
}
function canApplySession() {
  if (state.isRunning || state.online?.room?.status === 'running') { sessionNotice('Espera a que termine la ronda para aplicar otros ajustes.'); return false; }
  if (state.online && !state.online.isHost) { sessionNotice('Los ajustes de la sala los decide su anfitrión.'); return false; }
  return true;
}
function saveNamedSession() {
  const input = document.getElementById('sessionNameInput'), name = NinjaSessions.cleanName(input.value);
  const previous = sessionLibrary.list().find(s => s.name.toLocaleLowerCase('es') === name.toLocaleLowerCase('es'));
  if (previous && !confirm(`Ya existe «${previous.name}». ¿Actualizar sus ajustes?`)) return;
  try {
    const config = { ...buildOnlineConfig(), timePreset: refs.timePresetSelect.value, customMinutes: Number(refs.customMinInput.value), customSeconds: Number(refs.customSecInput.value) };
    const saved = sessionLibrary.save(name, config, previous?.id);
    input.value = ''; renderNamedSessions(); sessionNotice(`Sesión «${saved.name}» guardada.`);
  } catch (error) { sessionNotice(error.message); }
}
function renderNamedSessions() {
  const sessions = sessionLibrary.list().sort((a,b) => Number(b.favorite) - Number(a.favorite) || a.name.localeCompare(b.name, 'es'));
  document.getElementById('sessionList').innerHTML = sessions.length ? sessions.map(s => `<article class="saved-session"><div><strong>${escapeHtml(s.name)}</strong><small>${s.config.activity === 'problemas' ? '📖 Problemas' : '🧮 Cálculo'} · ${s.config.endCondition === 'unlimited' ? 'Sin tiempo' : ['questions','correct'].includes(s.config.endCondition) ? `${Number(s.config.goalCount) || 10} ${s.config.endCondition === 'correct' ? 'aciertos' : 'preguntas'}` : s.config.timePreset === 'custom' ? formatSeconds(Math.max(0, Number(s.config.customMinutes) || 0)*60 + Math.max(0, Number(s.config.customSeconds) || 0)) : formatSeconds(Number(s.config.timePreset) || 60)}</small></div><div class="session-actions"><button type="button" class="btn-mini" data-session="${escapeHtml(s.id)}" data-action="load">Cargar</button><button type="button" class="btn-mini" data-session="${escapeHtml(s.id)}" data-action="star" aria-label="Favorita: ${escapeHtml(s.name)}" aria-pressed="${s.favorite}">${s.favorite ? '★' : '☆'}</button><button type="button" class="btn-mini session-delete" data-session="${escapeHtml(s.id)}" data-action="remove" aria-label="Eliminar ${escapeHtml(s.name)}">×</button></div></article>`).join('') : '<p class="hint">Todavía no hay sesiones. Prepara tus ajustes y guárdalos con un nombre.</p>';
}
function finishSessionChange(message) {
  syncSettingsUIFromState(); updateOpsSummary();
  try { savePreferences(); } catch { sessionNotice(message + ' No se han podido guardar los últimos ajustes.'); return; }
  sessionNotice(message);
}
function loadNamedSession(session) {
  if (!canApplySession()) return;
  const config = session.config, safe = { ...config, operationSettings: {} };
  for (const [key, defaults] of Object.entries(state.operationSettings)) {
    const source = config.operationSettings?.[key];
    safe.operationSettings[key] = { ...defaults, enabled: source?.enabled === true };
    for (const [field, current] of Object.entries(defaults)) if (field !== 'enabled' && typeof current === 'number' && Number.isFinite(Number(source?.[field]))) safe.operationSettings[key][field] = sanitizeOpSettingValue(field, Number(source[field]));
  }
  applyOnlineConfig(safe);
  refs.timePresetSelect.value = ['60','120','180','custom'].includes(config.timePreset) ? config.timePreset : '60';
  refs.customMinInput.value = String(clamp(Math.trunc(Number(config.customMinutes)) || 0, 0, 30));
  refs.customSecInput.value = String(clamp(Math.trunc(Number(config.customSeconds)) || 0, 0, 59));
  finishSessionChange(`Sesión «${session.name}» cargada. Revisa los ajustes y empieza cuando quieras; el modo y la sala no cambian.`);
}
function renderSessionCatalog() {
  const normalize = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es');
  const words = normalize(document.getElementById('activitySearch').value).split(/\s+/).filter(Boolean);
  const favorites = sessionLibrary.favorites(), only = document.getElementById('favoritesOnly').checked;
  const items = sessionCatalog.filter(item => (!only || favorites.includes(item.id)) && words.every(word => normalize(`${item.title} ${item.group}`).includes(word)));
  document.getElementById('activityResultCount').textContent = `${items.length} actividades`;
  document.getElementById('activityResults').innerHTML = items.length ? items.map(item => `<div class="catalog-item"><button type="button" class="catalog-choice" data-catalog="${item.id}" data-action="choose"><strong>${escapeHtml(item.title)}</strong><small>${item.group} · ${item.kind === 'calc' ? 'Añadir a la selección' : 'Preparar esta familia'}</small></button><button type="button" class="btn-mini" data-catalog="${item.id}" data-action="star" aria-label="Favorita: ${escapeHtml(item.title)}" aria-pressed="${favorites.includes(item.id)}">${favorites.includes(item.id) ? '★' : '☆'}</button></div>`).join('') : '<p class="hint">No hay coincidencias. Prueba otra palabra o desactiva Solo favoritos.</p>';
}
function chooseCatalogActivity(item) {
  if (!canApplySession()) return;
  let target;
  if (item.kind === 'calc') {
    state.activity = 'calculo'; state.operationSettings[item.key].enabled = true;
    target = document.querySelector(`.op-toggle[data-op="${item.key}"]`);
  } else {
    state.activity = 'problemas';
    state.problemSettings = NinjaProblems.normalize({ ...state.problemSettings, _family: item.kind === 'geo' ? 'geometria' : item.key, ...(item.kind === 'geo' ? { _geometryVariant: item.key } : item.key === 'geometria' ? { _geometryVariant: -1 } : {}) });
    target = document.querySelector(item.kind === 'geo' ? '[data-problem-extra="_geometryVariant"]' : '[data-problem-extra="_family"]');
  }
  finishSessionChange(`${item.title}: ajustes preparados. Puedes revisarlos antes de empezar.`);
  for (let parent = target?.parentElement; parent; parent = parent.parentElement) if (parent.tagName === 'DETAILS') parent.open = true;
  target?.focus({ preventScroll: true });
}
