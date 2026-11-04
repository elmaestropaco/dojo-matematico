function bindLearningUI() {
  const on = (id, fn) => document.getElementById(id).addEventListener('click', fn);
  document.getElementById('endConditionSelect').addEventListener('change', e => { state.endCondition = e.target.value; syncLearningControls(); savePreferences(); });
  document.getElementById('goalCountInput').addEventListener('change', e => { state.goalCount = clamp(Math.trunc(Number(e.target.value)) || 10, 1, 1000); syncLearningControls(); savePreferences(); });
  on('finishRoundBtn', async () => {
    if (state.online?.isHost && window.NinjaOnline?.enabled) { await window.NinjaOnline.finishRoom(state.online.code).catch(e => alert(formatOnlineError('No se pudo terminar', e))); }
    else finishGame();
  });
  ['reportsHomeBtn', 'reportsArenaBtn', 'reportsResultsBtn'].forEach(id => on(id, showLearningReports));
  on('closeReportsBtn', () => document.getElementById('reportsDialog').close());
  document.getElementById('reportRange').addEventListener('change', renderLearningReports);
  on('exportExcelBtn', () => {
    const bytes = NinjaLearning.workbook(selectedReportRounds()), url = URL.createObjectURL(new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
    const a = document.createElement('a'); a.href = url; a.download = 'dojo-seguimiento.xlsx'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 10000);
  });
  on('exportPdfBtn', () => {
    const win = window.open('', '_blank');
    if (!win) { document.getElementById('reportNotice').textContent = 'El navegador ha bloqueado la ventana. Permite abrirla para imprimir o guardar en PDF.'; return; }
    win.opener = null; win.document.write(NinjaLearning.printHtml(selectedReportRounds())); win.document.close();
  });
  on('clearReportsBtn', () => { if (confirm('¿Borrar el historial de seguimiento de este navegador? Los Excel o PDF descargados no se borran.')) { NinjaLearning.clear(); renderLearningReports(); } });
  on('reviewErrorsBtn', showErrorReview); on('closeReviewBtn', () => document.getElementById('reviewDialog').close());
  on('closeHintBtn', () => document.getElementById('hintDialog').close());
  on('nextHintBtn', () => showProgressiveHint(state.hintPlayerId));
  on('hintSolutionBtn', revealHintSolution);
  syncLearningControls();
}
function syncLearningControls() {
  const picker = document.getElementById('endConditionSelect'); if (!picker) return;
  picker.value = state.endCondition;
  document.getElementById('goalCountInput').value = state.goalCount;
  document.getElementById('goalCountWrap').classList.toggle('hidden', !['questions', 'correct'].includes(state.endCondition));
  document.querySelector('#durationBox .duration-inline').classList.toggle('hidden', state.endCondition !== 'time');
  refs.customTimeWrap.classList.toggle('hidden', state.endCondition !== 'time' || refs.timePresetSelect.value !== 'custom');
  const arena = !refs.arenaScreen.classList.contains('hidden');
  document.getElementById('finishRoundBtn').classList.toggle('hidden', !arena || !state.isRunning || (state.endCondition !== 'unlimited' && !state.online?.isHost));
  document.getElementById('reportsArenaBtn').classList.toggle('hidden', !state.online?.isHost);
  document.getElementById('reportsResultsBtn').classList.toggle('hidden', !state.online?.isHost);
  document.getElementById('reviewErrorsBtn').classList.toggle('hidden', !state.reviewErrors?.length);
  updateConnectionIndicator();
}
function updateConnectionIndicator() {
  const el = document.getElementById('connectionIndicator'); if (!el) return;
  const connected = state.online?.connected;
  el.textContent = !state.online ? '● Local' : connected === false ? '● Sin conexión · reintentando' : connected === true ? '● Conectado' : '● Conectando…';
  el.dataset.status = !state.online ? 'local' : connected === false ? 'offline' : connected === true ? 'online' : 'connecting';
  document.getElementById('finishRoundBtn').disabled = connected === false;
}
function roundKey(room) { return room ? `${room.seed || 0}:${room.startedAt || room.rematchAt || 0}` : ''; }
function learningQuestionText(op) {
  if (op.problem) return op.problem.text;
  if (op.expression) return op.expression;
  const el = document.createElement('div'); el.innerHTML = op.html || ''; return el.textContent;
}
function captureLearningRound(room = state.online?.room) {
  if (!state.online?.isHost || !room) return;
  let config = state.online.config || {};
  try { if (room.config) config = JSON.parse(room.config); } catch { /* Keep the last valid configuration. */ }
  if (NinjaLearning.capture(state.online.code, room, config) === false) document.getElementById('reportNotice').textContent = 'No hay espacio para guardar más historial. Los últimos datos solo se conservan mientras esta página siga abierta. Descarga el Excel antes de salir o actualizar.';
  if (document.getElementById('reportsDialog').open) renderLearningReports();
}
function checkLearningGoal(player) {
  updatePanelTimersDisplay();
  if (!state.isRunning || !['questions', 'correct'].includes(state.endCondition)) return;
  const value = state.endCondition === 'correct' ? player.correctCount || 0 : player.resolvedCount || 0;
  if (value >= state.goalCount) finishGame();
}
function showProgressiveHint(playerId) {
  const op = state.operationsByPlayer.get(playerId), player = state.players.find(p => p.id === playerId);
  if (!op || !player || !state.isRunning) return;
  if ((op.hintStage || 0) >= 2) { state.hintPlayerId = playerId; revealHintSolution(); return; }
  op.hintStage = (op.hintStage || 0) + 1; state.hintPlayerId = playerId;
  NinjaLearning.record(player, op, 'hint');
  const first = op.problem ? 'Busca qué te preguntan, qué datos necesitas y en qué unidad debes responder. No todos los datos tienen por qué servir.' : op.comparison ? 'Decide qué cantidad es mayor. Si hay unidades o fracciones, compáralas en una misma referencia.' : op.kind === 'missing' ? 'Piensa qué número hace verdadera la igualdad. Puedes usar la operación inversa.' : 'Lee el símbolo y la pregunta antes de calcular. Comprueba qué tipo de respuesta se pide.';
  const second = op.problem ? (op.problem.calculations.find(s => /[+−×÷]/.test(s))?.split('=')[0] || op.problem.steps[0]?.split(':')[0]) : op.conversion ? op.conversion.equivalence : op.kind === 'missing' ? 'Prueba el número que has pensado en el hueco y comprueba la igualdad completa.' : op.kind === 'round' ? 'Mira la cifra a la derecha del lugar pedido: desde 5 se sube; por debajo de 5 se conserva.' : op.kind === 'power' ? 'Una potencia repite una multiplicación: la base se usa tantas veces como indica el exponente.' : op.comparison ? 'La abertura del signo mira a la cantidad mayor. Si valen lo mismo, usa =.' : op.kind === 'add' ? 'Separa decenas y unidades. Junta primero las unidades y después las decenas.' : op.kind === 'sub' ? 'Resta primero las unidades y después las decenas; comprueba si necesitas cambiar una decena.' : op.kind === 'mul' ? 'Puedes separar un factor en decenas y unidades y juntar sus productos.' : op.kind === 'div' ? 'Busca qué número, multiplicado por el divisor, da el dividendo.' : 'Resuelve primero los paréntesis, después multiplicaciones y divisiones y al final sumas y restas.';
  document.getElementById('hintReading').innerHTML = `<p>${renderProblemText(learningQuestionText(op))}</p>${op.problem?.diagram || ''}`;
  document.getElementById('hintContent').innerHTML = `<p><strong>Pista ${op.hintStage}:</strong> ${escapeHtml(op.hintStage === 1 ? first : second)}</p>`;
  document.getElementById('nextHintBtn').textContent = op.hintStage === 2 ? 'Ver solución' : 'Siguiente pista';
  if (!document.getElementById('hintDialog').open) document.getElementById('hintDialog').showModal();
  if (state.online?.active) updateOnlinePlayerProgress(player, { lastResult: 'hint', lastActionAt: Date.now() });
}
function revealHintSolution() {
  if (!state.isRunning) { document.getElementById('hintDialog').close(); return; }
  const op = state.operationsByPlayer.get(state.hintPlayerId), player = state.players.find(p => p.id === state.hintPlayerId);
  if (!op || !player) return;
  if (!op.solutionRevealed) NinjaLearning.record(player, op, 'solution');
  op.solutionRevealed = true; player.input = ''; player.streak = 0;
  document.getElementById('hintDialog').close(); repaintPlayers();
}
function showErrorReview() {
  const errors = clonePlain(state.reviewErrors || []), container = document.getElementById('reviewContent');
  container.innerHTML = errors.map((e, i) => `<article class="review-card"><h4>${escapeHtml(e.name)} · Pregunta ${i + 1}</h4><p>${renderProblemText(learningQuestionText(e.operation))}</p>${e.operation.problem?.diagram || ''}<p>Tu respuesta: <strong>${escapeHtml(e.answer)}</strong></p><label>Prueba otra vez <input type="text" maxlength="32" data-review-input="${i}" aria-label="Respuesta al repaso ${i + 1}" /></label><div class="learning-actions"><button type="button" class="btn-mini" data-review-check="${i}">Comprobar</button><button type="button" class="btn-mini" data-review-show="${i}">Ver explicación</button></div><div data-review-message="${i}" role="status"></div></article>`).join('') || '<p>No hay errores para repasar.</p>';
  container.querySelectorAll('[data-review-check]').forEach(b => b.addEventListener('click', () => { const i = b.dataset.reviewCheck; container.querySelector(`[data-review-message="${i}"]`).textContent = isCorrectOperationAnswer(container.querySelector(`[data-review-input="${i}"]`).value.trim(), errors[i].operation) ? '✅ ¡Ahora sí! Sin cambios en la puntuación.' : '🔎 Todavía no. Revisa los datos o consulta la explicación.'; }));
  container.querySelectorAll('[data-review-show]').forEach(b => b.addEventListener('click', () => { const i = b.dataset.reviewShow, op = errors[i].operation; container.querySelector(`[data-review-message="${i}"]`).innerHTML = op.problem ? renderProblem({ ...op, solutionRevealed: true }) : operationSolutionHtml(op); }));
  document.getElementById('reviewDialog').showModal();
}
function selectedReportRounds() {
  const range = document.getElementById('reportRange').value, today = new Date();
  return NinjaLearning.read().filter(r => range === 'all' || (range === 'today' ? new Date(r.date).toDateString() === today.toDateString() : today - new Date(r.date) <= Number(range) * 86400000));
}
function renderLearningReports() {
  const rounds = selectedReportRounds(), rows = NinjaLearning.aggregate(rounds);
  document.getElementById('reportsContent').innerHTML = `<p>${rounds.length} rondas · ${rows.length} alumnos</p><div class="report-table-wrap"><table><thead><tr><th>Alumno</th><th>Rondas</th><th>Aciertos</th><th>Fallos</th><th>Precisión</th><th>Pistas</th><th>Soluciones</th></tr></thead><tbody>${rows.map(r => `<tr><td>${escapeHtml(r.name)}</td><td>${r.rounds}</td><td>${r.correct}</td><td>${r.wrong}</td><td>${NinjaLearning.precision(r)}</td><td>${r.hints}</td><td>${r.solutions}</td></tr>`).join('')}</tbody></table></div>`;
}
function showLearningReports() { renderLearningReports(); if (!document.getElementById('reportsDialog').open) document.getElementById('reportsDialog').showModal(); }
