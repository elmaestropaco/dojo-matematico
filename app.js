const STORAGE_THEME = "ninja_math_theme";
const STORAGE_HALL = "ninja_math_hall";
const STORAGE_PREFS = "ninja_math_prefs";
const STORAGE_ANALYTICS_CONSENT = "ninja_math_analytics_consent";
const ANALYTICS_ID = "G-5XSQG511V6";

const OPERATION_LABELS = {
  addNoCarry: "Sumas sin llevadas",
  addCarry: "Sumas con llevadas",
  subNoBorrow: "Restas sin llevadas",
  subBorrow: "Restas con llevadas",
  mul: "Multiplicaciones",
  div: "Divisiones",
  divHard: "Divisiones difíciles",
  combined: "Operaciones combinadas (fácil)",
  combinedAdv: "Operaciones combinadas (avanzado)",
  fraction: "Fracciones (operador)",
  percent: "Porcentajes"
};

const SCORE_MIN = 0;
const SCORE_MAX = 250;
const SKIP_PENALTY = 3;
const DECIMAL_SEPARATOR = ",";
const MAX_INPUT_LENGTH = 12;
const EVENT_POOL = [
  "double_points",
  "no_penalty",
  "plus_time",
  "mega_bonus",
  "vertical_only",
  "double_penalty",
  "fail_reset"
];

const state = {
  mode: "single",
  orientation: "vertical",
  muted: false,
  isRunning: false,
  timeLeft: 60,
  gameDuration: 60,
  timerId: null,
  players: [],
  operationsByPlayer: new Map(),
  activeEvent: null,
  eventStartTimeoutId: null,
  eventEndTimeoutId: null,
  eventRouletteTickId: null,
  eventRolling: false,
  operationSettings: {
    addNoCarry: { enabled: false, digits: 2 },
    addCarry: { enabled: false, digits: 2 },
    subNoBorrow: { enabled: false, digits: 2 },
    subBorrow: { enabled: false, digits: 2 },
    mul: { enabled: false, multiplicandMax: 2, factorMax: 2 },
    div: { enabled: false, dividendMax: 2, divisorMax: 2 },
    divHard: { enabled: false, divisorMax: 2, maxDecimals: 2 },
    combined: { enabled: false, digits: 2 },
    combinedAdv: { enabled: false, digits: 2 },
    fraction: { enabled: false, numeratorMax: 2, denominatorMax: 2 },
    percent: { enabled: false, digits: 2 }
  },
  displayMode: "horizontal",
  streaksEnabled: true,
  decimalsEnabled: false,
  decimalPlaces: 1,
  online: null
};

const refs = {
  body: document.body,
  dojoScreen: document.getElementById("dojoScreen"),
  arenaScreen: document.getElementById("arenaScreen"),
  playersWrap: document.getElementById("playersWrap"),
  resultsOverlay: document.getElementById("resultsOverlay"),
  resultsTitle: document.getElementById("resultsTitle"),
  resultsSubtitle: document.getElementById("resultsSubtitle"),
  resultsScores: document.getElementById("resultsScores"),
  matchBadge: document.getElementById("matchBadge"),
  floatingRoomCode: document.getElementById("floatingRoomCode"),
  floatingRoomCodeText: document.getElementById("floatingRoomCodeText"),
  orientationBox: document.getElementById("orientationBox"),
  onlineBox: document.getElementById("onlineBox"),
  onlineHostLobby: document.getElementById("onlineHostLobby"),
  onlineRoomCode: document.getElementById("onlineRoomCode"),
  onlineLobbyPlayers: document.getElementById("onlineLobbyPlayers"),
  onlineLobbyCount: document.getElementById("onlineLobbyCount"),
  copyOnlineCodeBtn: document.getElementById("copyOnlineCodeBtn"),
  startOnlineHostBtn: document.getElementById("startOnlineHostBtn"),
  teacherBox: document.getElementById("teacherBox"),
  teacherDashboard: document.getElementById("teacherDashboard"),
  teacherRoomCode: document.getElementById("teacherRoomCode"),
  teacherClock: document.getElementById("teacherClock"),
  teacherSummary: document.getElementById("teacherSummary"),
  copyTeacherCodeBtn: document.getElementById("copyTeacherCodeBtn"),
  teacherStartBtn: document.getElementById("teacherStartBtn"),
  teacherRace: document.getElementById("teacherRace"),
  teacherGrid: document.getElementById("teacherGrid"),
  joinOnlineBtn: document.getElementById("joinOnlineBtn"),
  muteToggle: document.getElementById("muteToggle"),
  streakToggle: document.getElementById("streakToggle"),
  decimalsToggle: document.getElementById("decimalsToggle"),
  decimalPlacesWrap: document.getElementById("decimalPlacesWrap"),
  decimalPlacesSelect: document.getElementById("decimalPlacesSelect"),
  player1Input: document.getElementById("player1Input"),
  player2Input: document.getElementById("player2Input"),
  timePresetSelect: document.getElementById("timePresetSelect"),
  customTimeWrap: document.getElementById("customTimeWrap"),
  customMinInput: document.getElementById("customMinInput"),
  customSecInput: document.getElementById("customSecInput"),
  displayModeSelect: document.getElementById("displayModeSelect"),
  opsSummary: document.getElementById("opsSummary"),
  opsChips: document.getElementById("opsChips"),
  divisionHint: document.getElementById("divisionHint"),
  helpBtn: document.getElementById("helpBtn"),
  helpDialog: document.getElementById("helpDialog"),
  helpCloseBtn: document.getElementById("helpCloseBtn"),
  hallBody: document.getElementById("hallBody"),
  hallModeFilter: document.getElementById("hallModeFilter"),
  hallTimeFilter: document.getElementById("hallTimeFilter"),
  hallSortFilter: document.getElementById("hallSortFilter"),
  duelLead: document.getElementById("duelLead"),
  duelNinja: document.getElementById("duelNinja"),
  duelLeftName: document.getElementById("duelLeftName"),
  duelRightName: document.getElementById("duelRightName"),
  eventRoulette: document.getElementById("eventRoulette"),
  rouletteWheel: document.getElementById("rouletteWheel"),
  rouletteLabel: document.getElementById("rouletteLabel"),
  wheelCenter: document.getElementById("wheelCenter"),
  startOverlay: document.getElementById("startOverlay"),
  countdownNumber: document.getElementById("countdownNumber"),
  consentBanner: document.getElementById("consentBanner"),
  acceptAnalyticsBtn: document.getElementById("acceptAnalyticsBtn"),
  rejectAnalyticsBtn: document.getElementById("rejectAnalyticsBtn")
};

let audioCtx = null;

init();

function init() {
  applySavedPreferences();
  bindSettingsUI();
  bindKeyboardSupport();
  applySavedTheme();
  initConsentManager();
  syncSettingsUIFromState();
  applyModeDependentUI();
  updateOpsSummary();
  renderHallOfFame();
}

function bindSettingsUI() {
  document.querySelectorAll(".mode-btn").forEach((button) => {
    button.addEventListener("click", () => {
      state.mode = button.dataset.mode;
      setActiveByData(".mode-btn", "mode", state.mode);
      applyModeDependentUI();
      savePreferences();
    });
  });

  document.querySelectorAll(".orientation-btn").forEach((button) => {
    button.addEventListener("click", () => {
      state.orientation = button.dataset.orientation;
      setActiveByData(".orientation-btn", "orientation", state.orientation);
      savePreferences();
    });
  });

  document.querySelectorAll(".op-toggle").forEach((input) => {
    input.addEventListener("change", () => {
      const key = input.dataset.op;
      state.operationSettings[key].enabled = input.checked;
      updateOpsSummary();
      savePreferences();
    });
  });

  document.querySelectorAll(".op-config-select").forEach((select) => {
    select.addEventListener("change", () => {
      const key = select.dataset.settingOp;
      const settingKey = select.dataset.settingKey;
      if (!key || !settingKey || !state.operationSettings[key]) return;
      state.operationSettings[key][settingKey] = Number(select.value);
      updateOpsSummary();
      savePreferences();
    });
  });

  refs.muteToggle.addEventListener("change", () => {
    state.muted = refs.muteToggle.checked;
    savePreferences();
  });

  refs.streakToggle.addEventListener("change", () => {
    state.streaksEnabled = refs.streakToggle.checked;
    repaintPlayers();
    savePreferences();
  });

  refs.decimalsToggle.addEventListener("change", () => {
    state.decimalsEnabled = refs.decimalsToggle.checked;
    refs.decimalPlacesWrap.classList.toggle("hidden", !state.decimalsEnabled);
    updateOpsSummary();
    savePreferences();
  });

  refs.decimalPlacesSelect.addEventListener("change", () => {
    state.decimalPlaces = clamp(Number(refs.decimalPlacesSelect.value), 1, 3);
    updateOpsSummary();
    savePreferences();
  });

  refs.displayModeSelect.addEventListener("change", () => {
    state.displayMode = refs.displayModeSelect.value;
    savePreferences();
  });

  refs.timePresetSelect.addEventListener("change", () => {
    refs.customTimeWrap.classList.toggle("hidden", refs.timePresetSelect.value !== "custom");
    savePreferences();
  });
  refs.customMinInput.addEventListener("change", savePreferences);
  refs.customMinInput.addEventListener("input", savePreferences);
  refs.customSecInput.addEventListener("change", savePreferences);
  refs.customSecInput.addEventListener("input", savePreferences);
  refs.player1Input.addEventListener("change", savePreferences);
  refs.player1Input.addEventListener("input", savePreferences);
  refs.player2Input.addEventListener("change", savePreferences);
  refs.player2Input.addEventListener("input", savePreferences);

  refs.hallModeFilter.addEventListener("change", renderHallOfFame);
  refs.hallTimeFilter.addEventListener("change", renderHallOfFame);
  refs.hallSortFilter.addEventListener("change", renderHallOfFame);

  refs.helpBtn.addEventListener("click", () => refs.helpDialog.showModal());
  refs.helpCloseBtn.addEventListener("click", () => refs.helpDialog.close());

  document.querySelectorAll(".js-theme").forEach((button) => {
    button.addEventListener("click", () => {
      const theme = button.dataset.theme;
      refs.body.dataset.theme = theme === "default" ? "" : theme;
      localStorage.setItem(STORAGE_THEME, theme);
    });
  });

  document.getElementById("startBtn").addEventListener("click", startGame);
  refs.joinOnlineBtn.addEventListener("click", joinOnlineRoom);
  refs.copyOnlineCodeBtn.addEventListener("click", () => copyRoomCode(state.online?.code));
  refs.copyTeacherCodeBtn.addEventListener("click", () => copyRoomCode(state.online?.code));
  refs.floatingRoomCode.addEventListener("click", () => copyRoomCode(state.online?.code));
  refs.startOnlineHostBtn.addEventListener("click", startHostedOnlineRoom);
  refs.teacherStartBtn.addEventListener("click", startHostedOnlineRoom);
  document.getElementById("backBtn").addEventListener("click", goHome);
  document.getElementById("homeBtn").addEventListener("click", goHome);
  document.getElementById("rematchBtn").addEventListener("click", handleRematch);
  document.getElementById("clearHallBtn").addEventListener("click", clearHallOfFame);
}

function applyModeDependentUI() {
  const isDuel = state.mode === "duel";
  const isOnline = state.mode === "online";
  const isTeacher = state.mode === "teacher";
  refs.orientationBox.classList.toggle("hidden", !isDuel);
  refs.player2Input.classList.toggle("hidden", !isDuel);
  refs.onlineBox.classList.toggle("hidden", !isOnline);
  refs.teacherBox.classList.toggle("hidden", !isTeacher);
}

function applySavedTheme() {
  const saved = localStorage.getItem(STORAGE_THEME) || "light";
  refs.body.dataset.theme = saved === "default" ? "" : saved;
}

function initConsentManager() {
  if (!refs.consentBanner || !refs.acceptAnalyticsBtn || !refs.rejectAnalyticsBtn) return;

  const consent = localStorage.getItem(STORAGE_ANALYTICS_CONSENT);
  if (consent === "accepted") {
    loadAnalytics();
    refs.consentBanner.classList.add("hidden");
    return;
  }

  if (consent === "rejected") {
    refs.consentBanner.classList.add("hidden");
    return;
  }

  refs.consentBanner.classList.remove("hidden");
  refs.acceptAnalyticsBtn.addEventListener("click", () => {
    localStorage.setItem(STORAGE_ANALYTICS_CONSENT, "accepted");
    refs.consentBanner.classList.add("hidden");
    loadAnalytics();
  });
  refs.rejectAnalyticsBtn.addEventListener("click", () => {
    localStorage.setItem(STORAGE_ANALYTICS_CONSENT, "rejected");
    refs.consentBanner.classList.add("hidden");
  });
}

function loadAnalytics() {
  if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") return;
  if (window.__analyticsLoaded) return;
  window.__analyticsLoaded = true;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() { window.dataLayer.push(arguments); };

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${ANALYTICS_ID}`;
  script.onload = () => {
    window.gtag("js", new Date());
    window.gtag("config", ANALYTICS_ID);
  };
  document.head.appendChild(script);
}

function syncSettingsUIFromState() {
  setActiveByData(".mode-btn", "mode", state.mode);
  setActiveByData(".orientation-btn", "orientation", state.orientation);
  document.querySelectorAll(".op-toggle").forEach((input) => {
    input.checked = state.operationSettings[input.dataset.op].enabled;
  });
  document.querySelectorAll(".op-config-select").forEach((select) => {
    const key = select.dataset.settingOp;
    const settingKey = select.dataset.settingKey;
    if (!key || !settingKey || !state.operationSettings[key]) return;
    const value = state.operationSettings[key][settingKey];
    if (value !== undefined) select.value = String(value);
  });
  refs.decimalsToggle.checked = state.decimalsEnabled;
  refs.muteToggle.checked = state.muted;
  refs.streakToggle.checked = state.streaksEnabled;
  refs.displayModeSelect.value = state.displayMode;
  refs.decimalPlacesSelect.value = String(state.decimalPlaces);
  refs.decimalPlacesWrap.classList.toggle("hidden", !state.decimalsEnabled);
  refs.customTimeWrap.classList.toggle("hidden", refs.timePresetSelect.value !== "custom");
}

function updateOpsSummary() {
  const enabled = getEnabledOperationKeys();
  const names = enabled.map((k) => OPERATION_LABELS[k]);
  const text = names.length ? names.join(", ") : "ninguna";
  const decimalTag = state.decimalsEnabled ? ` · 🔢 ${state.decimalPlaces} decimales` : "";
  refs.opsSummary.textContent = `🧮 Operaciones (${enabled.length} activas): ${text}${decimalTag}`;
  updateDivisionConfigHint();
  renderOpsChips(enabled);
}

function renderOpsChips(enabledKeys) {
  refs.opsChips.innerHTML = "";
  if (enabledKeys.length === 0) {
    refs.opsChips.innerHTML = "<span class='ops-chip'>🚫 Ninguna activa</span>";
    return;
  }

  enabledKeys.forEach((key) => {
    const configLabel = formatOpConfigLabel(key, state.operationSettings[key]);
    const emoji = key.startsWith("add") ? "➕"
      : key.startsWith("sub") ? "➖"
      : key === "mul" ? "✖️"
      : key === "divHard" ? "🧪"
      : key === "combined" ? "🧩"
      : key === "combinedAdv" ? "🧠"
      : key === "fraction" ? "🍰"
      : key === "percent" ? "📊"
      : "➗";
    const chip = document.createElement("span");
    chip.className = "ops-chip";
    chip.innerHTML = `${emoji} ${escapeHtml(OPERATION_LABELS[key])} · ${escapeHtml(configLabel)}<button class="chip-remove" type="button" data-chip-remove="${key}" aria-label="Quitar ${escapeHtml(OPERATION_LABELS[key])}">✖</button>`;
    refs.opsChips.appendChild(chip);
  });

  refs.opsChips.querySelectorAll("[data-chip-remove]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.getAttribute("data-chip-remove");
      if (!key || !state.operationSettings[key]) return;
      state.operationSettings[key].enabled = false;
      const toggle = document.querySelector(`.op-toggle[data-op="${key}"]`);
      if (toggle) toggle.checked = false;
      updateOpsSummary();
      savePreferences();
    });
  });
}

function formatOpConfigLabel(key, cfg) {
  if (!cfg) return "";
  if (key === "addNoCarry" || key === "addCarry" || key === "subNoBorrow" || key === "subBorrow") {
    return `${cfg.digits} cifra${cfg.digits > 1 ? "s" : ""}`;
  }
  if (key === "mul") return `Multiplicando ${cfg.multiplicandMax} cifras · Factor ${cfg.factorMax} cifras`;
  if (key === "div") return `Dividendo ${cfg.dividendMax} cifras · Divisor ${cfg.divisorMax} cifras`;
  if (key === "divHard") return `Divisor ${cfg.divisorMax} cifras · máx ${cfg.maxDecimals} dec.`;
  if (key === "fraction") return `Numerador ${cfg.numeratorMax} cifras · Denominador ${cfg.denominatorMax} cifras`;
  if (key === "combined" || key === "combinedAdv" || key === "percent") {
    return `${cfg.digits} cifra${cfg.digits > 1 ? "s" : ""}`;
  }
  return "";
}

function updateDivisionConfigHint() {
  if (!refs.divisionHint) return;
  const divCfg = state.operationSettings.div;
  if (!divCfg) return;

  const dividendDigits = clamp(Number(divCfg.dividendMax), 1, 9);
  const divisorDigits = clamp(Number(divCfg.divisorMax), 1, 9);
  const exactPossible = divisorDigits <= dividendDigits;
  const divEnabled = Boolean(divCfg.enabled);

  refs.divisionHint.classList.remove("is-ok", "is-warn");

  if (!divEnabled) {
    refs.divisionHint.textContent = "ℹ️ Activa divisiones para validar si pueden salir resultados enteros exactos.";
    return;
  }

  if (exactPossible) {
    refs.divisionHint.classList.add("is-ok");
    refs.divisionHint.textContent = "✅ Configuración válida: pueden aparecer divisiones exactas (sin decimales).";
    return;
  }

  if (state.decimalsEnabled) {
    refs.divisionHint.classList.add("is-ok");
    refs.divisionHint.textContent = `✅ Sin enteras exactas para esas cifras: cociente decimal con máximo ${state.decimalPlaces} decimales.`;
    return;
  }

  refs.divisionHint.classList.add("is-warn");
  refs.divisionHint.textContent = "⚠️ Con esta combinación no hay enteras exactas. Activa 'decimales'.";
}

function startGame() {
  const enabledKeys = getEnabledOperationKeys();
  if (enabledKeys.length === 0) {
    alert("Activa al menos un tipo de operación para empezar.");
    return;
  }

  if (!ensureDecimalResultModeCompatibility()) return;

  const duration = getSelectedDurationSeconds();
  if (duration < 5) {
    alert("El tiempo mínimo es 5 segundos.");
    return;
  }

  if (state.mode === "online") {
    createOnlineRoom(enabledKeys, duration);
    return;
  }

  if (state.mode === "teacher") {
    createTeacherRoom(enabledKeys, duration);
    return;
  }

  runStartSequence(() => {
    launchGame(enabledKeys, duration);
  });
}

async function createOnlineRoom(enabledKeys, duration) {
  try {
    const ready = await window.NinjaOnline?.init();
    if (!ready) {
      alert("Firebase no está configurado todavía. Revisa firebase-config.js y Realtime Database.");
      return;
    }

    const config = buildOnlineConfig();
    const hostName = safeName(refs.player1Input.value, "Profe");
    const { code } = await window.NinjaOnline.createRoom({
      mode: "duel_online",
      config,
      durationSeconds: duration,
      hostName
    });
    const joined = await window.NinjaOnline.joinRoom(code, hostName);
    attachOnlineSession({
      code,
      playerId: joined.playerId,
      isHost: true,
      playerName: hostName,
      config,
      durationSeconds: duration
    });

    showOnlineHostLobby(code);
  } catch (error) {
    alert(formatOnlineError("No se pudo crear la sala online", error));
  }
}

async function createTeacherRoom(enabledKeys, duration) {
  try {
    const ready = await window.NinjaOnline?.init();
    if (!ready) {
      alert("Firebase no está configurado todavía. Revisa firebase-config.js y Realtime Database.");
      return;
    }

    const config = buildOnlineConfig();
    const hostName = safeName(refs.player1Input.value, "Profe");
    const { code } = await window.NinjaOnline.createRoom({
      mode: "teacher",
      config,
      durationSeconds: duration,
      hostName
    });

    attachOnlineSession({
      code,
      playerId: null,
      isHost: true,
      isTeacher: true,
      playerName: hostName,
      config,
      durationSeconds: duration
    });

    showTeacherDashboard();
  } catch (error) {
    alert(formatOnlineError("No se pudo crear la sala maestro", error));
  }
}

async function startHostedOnlineRoom() {
  if (!state.online?.code || !state.online?.isHost || !window.NinjaOnline?.enabled) return;
  if (state.online.isTeacher && state.online.room?.status === "finished") {
    await resetHostedOnlineRoom();
    return;
  }
  try {
    refs.startOnlineHostBtn.disabled = true;
    refs.teacherStartBtn.disabled = true;
    await window.NinjaOnline.startRoom(state.online.code);
  } catch (error) {
    refs.startOnlineHostBtn.disabled = false;
    refs.teacherStartBtn.disabled = false;
    alert(formatOnlineError("No se pudo empezar la sala", error));
  }
}

async function handleRematch() {
  if ((state.mode === "online" || state.mode === "teacher") && state.online?.code && state.online?.isHost && window.NinjaOnline?.enabled) {
    await resetHostedOnlineRoom();
    return;
  }

  startGame();
}

async function resetHostedOnlineRoom() {
  try {
    const duration = state.online.durationSeconds || state.gameDuration || getSelectedDurationSeconds();
    const config = state.online.config || buildOnlineConfig();
    await window.NinjaOnline.resetRoom(state.online.code, { config, durationSeconds: duration });

    state.online.active = false;
    state.online.currentOperationIndex = 0;
    state.online.correctCount = 0;
    state.online.wrongCount = 0;
    state.isRunning = false;
    stopTimer();
    stopEventSystem();

    refs.body.classList.remove("game-running");
    refs.resultsOverlay.classList.add("hidden");
    refs.arenaScreen.classList.add("hidden");
    refs.teacherDashboard.classList.add("hidden");
    refs.playersWrap.classList.remove("hidden");
    refs.dojoScreen.classList.remove("hidden");
    applyModeDependentUI();
    if (state.online.isTeacher) {
      showTeacherDashboard();
    } else {
      showOnlineHostLobby(state.online.code);
    }
  } catch (error) {
    alert(formatOnlineError("No se pudo preparar la revancha", error));
  }
}

async function copyRoomCode(code) {
  if (!code) return;
  try {
    await navigator.clipboard.writeText(code);
    alert(`Código copiado: ${code}`);
  } catch {
    prompt("Copia el código de sala:", code);
  }
}

function showOnlineHostLobby(code) {
  refs.body.classList.add("online-lobby-running");
  refs.dojoScreen.classList.remove("hidden");
  refs.arenaScreen.classList.add("hidden");
  refs.onlineRoomCode.textContent = code || "------";
  refs.onlineHostLobby.classList.remove("hidden");
  refs.startOnlineHostBtn.disabled = false;
  updateFloatingRoomCode(null);
  if (refs.onlineLobbyPlayers && refs.onlineLobbyPlayers.children.length === 0) {
    refs.onlineLobbyPlayers.innerHTML = "<span class='online-lobby-empty'>Esperando jugadores...</span>";
  }
}

function hideOnlineHostLobby() {
  refs.body.classList.remove("online-lobby-running");
  refs.onlineHostLobby.classList.add("hidden");
  refs.startOnlineHostBtn.disabled = false;
}

function updateFloatingRoomCode(code = state.online?.code) {
  if (!refs.floatingRoomCode || !refs.floatingRoomCodeText) return;
  const isTeacherRoom = state.mode === "teacher";
  const isOnlineArena = state.mode === "online" && state.online?.active;
  const visible = Boolean(code && (isTeacherRoom || isOnlineArena));
  refs.floatingRoomCode.classList.toggle("hidden", !visible);
  refs.floatingRoomCodeText.textContent = code || "------";
}

async function joinOnlineRoom() {
  try {
    const code = prompt("Código de sala:");
    if (!code) return;
    const playerName = safeName(refs.player1Input.value, "Ninja");
    const ready = await window.NinjaOnline?.init();
    if (!ready) {
      alert("Firebase no está configurado todavía. Revisa firebase-config.js y Realtime Database.");
      return;
    }

    const joined = await window.NinjaOnline.joinRoom(code, playerName);
    hideOnlineHostLobby();
    attachOnlineSession({
      code: joined.code,
      playerId: joined.playerId,
      isHost: false,
      playerName
    });
    alert(`Te has unido a la sala ${joined.code}. Espera a que quien creó la sala empiece la partida.`);
  } catch (error) {
    alert(formatOnlineError("No se pudo unir a la sala", error));
  }
}

function formatOnlineError(prefix, error) {
  const message = error?.message || String(error || "Error desconocido");
  if (/permission denied/i.test(message)) {
    return `${prefix}: Permission denied\n\nFirebase ha rechazado la operación. Revisa que hayas publicado en Realtime Database las reglas de firebase/database.rules.json y que la base de datos sea la del proyecto correcto.`;
  }
  return `${prefix}: ${message}`;
}

function ensureDecimalResultModeCompatibility() {
  if (state.decimalsEnabled) return true;

  const needsMode = requiresDecimalResultMode();
  if (!needsMode) return true;

  const accept = confirm("⚠️ La configuración activa puede generar resultados decimales.\n\n¿Quieres activar 'decimales' para esta partida?");
  if (!accept) return false;

  state.decimalsEnabled = true;
  refs.decimalsToggle.checked = true;
  refs.decimalPlacesWrap.classList.toggle("hidden", false);
  updateOpsSummary();
  savePreferences();
  return true;
}

function requiresDecimalResultMode() {
  const divCfg = state.operationSettings.div;
  if (divCfg?.enabled) {
    const dividendDigits = clamp(Number(divCfg.dividendMax), 1, 9);
    const divisorDigits = clamp(Number(divCfg.divisorMax), 1, 9);
    if (divisorDigits > dividendDigits) return true;
  }

  if (state.operationSettings.divHard?.enabled) return true;
  if (state.operationSettings.combinedAdv?.enabled) return true;
  if (state.operationSettings.percent?.enabled) return true;
  return false;
}

function buildOnlineConfig() {
  return {
    operationSettings: clonePlain(state.operationSettings),
    displayMode: state.displayMode,
    streaksEnabled: state.streaksEnabled,
    decimalsEnabled: state.decimalsEnabled,
    decimalPlaces: state.decimalPlaces,
    enabledKeys: getEnabledOperationKeys()
  };
}

function attachOnlineSession(session) {
  detachOnlineSession(false);
  state.online = {
    ...session,
    active: false,
    room: null,
    currentOperationIndex: 0,
    correctCount: 0,
    wrongCount: 0,
    unsubscribe: null
  };
  state.mode = session.isTeacher ? "teacher" : "online";
  setActiveByData(".mode-btn", "mode", state.mode);
  applyModeDependentUI();

  state.online.unsubscribe = window.NinjaOnline.subscribeRoom(session.code, (room) => {
    handleOnlineRoomUpdate(room);
  });
}

function detachOnlineSession(markOffline = true) {
  if (!state.online) return;
  if (typeof state.online.unsubscribe === "function") state.online.unsubscribe();
  if (markOffline && state.online.code && state.online.playerId && window.NinjaOnline?.enabled) {
    window.NinjaOnline.updatePlayer(state.online.code, state.online.playerId, { isConnected: false }).catch(() => {});
  }
  state.online = null;
}

function handleOnlineRoomUpdate(room) {
  if (!state.online || !room) return;
  state.online.room = room;

  if (!state.online.config && room.config) {
    try {
      state.online.config = JSON.parse(room.config);
    } catch {
      state.online.config = {};
    }
  }
  if (!state.online.durationSeconds) state.online.durationSeconds = Number(room.durationSeconds || 60);

  if (room.status === "running" && !state.online.active) {
    if (state.online.isTeacher) startTeacherMonitor(room);
    else launchOnlineGame(room);
  }

  if (state.online.isTeacher) renderTeacherDashboard(room);
  else if (state.online.active) updateOnlineLeaderboard(room);
  else if (room.status === "lobby") renderOnlineLobby(room);

  if (room.status === "finished" && state.online.isTeacher) {
    renderTeacherDashboard(room);
  } else if (room.status === "finished" && state.isRunning) {
    finishGame();
  }
}

function showTeacherDashboard() {
  refs.body.classList.add("game-running");
  refs.resultsOverlay.classList.add("hidden");
  refs.dojoScreen.classList.add("hidden");
  refs.arenaScreen.classList.remove("hidden");
  refs.arenaScreen.classList.add("teacher-mode");
  refs.playersWrap.classList.add("hidden");
  refs.duelLead.classList.add("hidden");
  refs.eventRoulette.classList.add("hidden");
  refs.teacherDashboard.classList.remove("hidden");
  updateFloatingRoomCode();
  refs.matchBadge.textContent = `🧑‍🏫 Sala ${state.online?.code || ""} · esperando alumnos`;
  refs.teacherRoomCode.textContent = `Código ${state.online?.code || "---"}`;
  refs.teacherClock.textContent = "Esperando";
  refs.teacherStartBtn.disabled = false;
  refs.teacherStartBtn.classList.remove("hidden");
  refs.teacherSummary.innerHTML = `
    <div class="teacher-stat-card"><span>👥</span><strong>0</strong><small>ninjas</small></div>
    <div class="teacher-stat-card"><span>✅</span><strong>0</strong><small>aciertos</small></div>
    <div class="teacher-stat-card"><span>🎯</span><strong>0%</strong><small>precisión</small></div>
    <div class="teacher-stat-card"><span>⚡</span><strong>Listo</strong><small>estado</small></div>
  `;
  refs.teacherRace.innerHTML = "";
  refs.teacherGrid.innerHTML = "<div class='teacher-empty'>Esperando ninjas...</div>";
}

function startTeacherMonitor(room) {
  state.online.active = true;
  state.online.teacherCountdown = true;
  refs.teacherStartBtn.classList.add("hidden");
  state.online.startedAt = Number(room.startedAt || Date.now());
  state.gameDuration = Number(room.durationSeconds || state.online.durationSeconds || 60);
  state.timeLeft = state.gameDuration;
  state.isRunning = false;
  stopTimer();
  refs.teacherClock.textContent = "Cuenta atrás";

  runStartSequence(() => {
    if (!state.online?.isTeacher) return;
    state.online.teacherCountdown = false;
    state.online.startedAt = Date.now();
    state.timeLeft = state.gameDuration;
    state.isRunning = true;
    refs.teacherClock.textContent = formatSeconds(state.timeLeft);

    state.timerId = setInterval(() => {
      const elapsed = Math.floor((Date.now() - Number(state.online.startedAt || Date.now())) / 1000);
      state.timeLeft = Math.max(0, state.gameDuration - elapsed);
      refs.teacherClock.textContent = formatSeconds(state.timeLeft);
      if (state.timeLeft <= 0) {
        stopTimer();
        state.isRunning = false;
        if (state.online?.isHost && window.NinjaOnline?.enabled) {
          window.NinjaOnline.finishRoom(state.online.code).catch(() => {});
        }
      }
    }, 1000);
  });
}

function launchOnlineGame(room) {
  hideOnlineHostLobby();
  updateFloatingRoomCode();
  applyOnlineConfig(state.online.config || {});
  state.online.active = true;
  state.online.seed = Number(room.seed || 1);
  state.online.currentOperationIndex = 0;
  state.online.correctCount = 0;
  state.online.wrongCount = 0;

  const totalDuration = Number(room.durationSeconds || state.online.durationSeconds || 60);
  const elapsed = Number(room.startedAt) ? Math.floor((Date.now() - Number(room.startedAt)) / 1000) : 0;
  const duration = Math.max(1, totalDuration - Math.max(0, elapsed));
  runStartSequence(() => {
    launchGame(getEnabledOperationKeys(), duration);
  });
}

function applyOnlineConfig(config) {
  if (config.operationSettings) state.operationSettings = mergeOperationSettings(config.operationSettings);
  if (["horizontal", "vertical", "mixed"].includes(config.displayMode)) state.displayMode = config.displayMode;
  if (typeof config.streaksEnabled === "boolean") state.streaksEnabled = config.streaksEnabled;
  if (typeof config.decimalsEnabled === "boolean") state.decimalsEnabled = config.decimalsEnabled;
  if (Number.isFinite(Number(config.decimalPlaces))) state.decimalPlaces = clamp(Number(config.decimalPlaces), 1, 3);
  syncSettingsUIFromState();
  updateOpsSummary();
}

function mergeOperationSettings(saved) {
  const base = clonePlain(state.operationSettings);
  Object.keys(base).forEach((key) => {
    if (!saved[key]) return;
    base[key] = { ...base[key], ...saved[key] };
  });
  return base;
}

function clonePlain(value) {
  return JSON.parse(JSON.stringify(value));
}

function updateOnlineLeaderboard(room) {
  const players = Object.values(room.players || {}).sort((a, b) => (b.score || 0) - (a.score || 0));
  if (players.length === 0) return;
  refs.matchBadge.textContent = `🌐 Sala ${state.online.code} · ${players.map((p) => `${p.name}: ${p.score || 0}`).join(" · ")}`;
  updateFloatingRoomCode();
}

function renderOnlineLobby(room) {
  if (!state.online?.isHost || !refs.onlineLobbyPlayers) return;
  showOnlineHostLobby(state.online.code);
  updateFloatingRoomCode(null);

  const players = Object.values(room.players || {})
    .sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "es"));
  refs.matchBadge.textContent = `🌐 Sala ${state.online.code} · esperando · ${players.length} jugadores`;
  if (refs.onlineLobbyCount) refs.onlineLobbyCount.textContent = String(players.length);

  if (players.length === 0) {
    refs.onlineLobbyPlayers.innerHTML = "<span class='online-lobby-empty'>Esperando jugadores...</span>";
    return;
  }

  refs.onlineLobbyPlayers.innerHTML = players.map((player, index) => `
    <div class="online-lobby-player">
      <span class="online-lobby-medal">${index === 0 ? "👑" : "🥷"}</span>
      <strong>${escapeHtml(player.name || "Ninja")}</strong>
      <small>${player.isConnected === false ? "desconectado" : "listo"} · ${Number(player.score || 0)} pts</small>
    </div>
  `).join("");
}

function renderTeacherDashboard(room) {
  if (!refs.teacherDashboard || refs.teacherDashboard.classList.contains("hidden")) return;
  const players = Object.entries(room.players || {})
    .map(([id, player]) => ({ id, ...player }))
    .sort((a, b) => (b.score || 0) - (a.score || 0) || (b.operationIndex || 0) - (a.operationIndex || 0));

  refs.teacherRoomCode.textContent = `Código ${state.online?.code || "---"}`;
  const statusText = state.online?.teacherCountdown ? "Cuenta atrás"
    : room.status === "running" ? `En marcha · ${formatSeconds(Math.max(0, state.timeLeft || 0))}`
    : room.status === "finished" ? "Combate terminado"
    : "Esperando";
  refs.teacherClock.textContent = statusText;
  refs.teacherStartBtn.classList.toggle("hidden", room.status !== "lobby" && room.status !== "finished");
  refs.teacherStartBtn.textContent = room.status === "finished" ? "🔄 Revancha" : "⚔️ Empezar sala";
  refs.teacherStartBtn.disabled = false;
  refs.matchBadge.textContent = `🧑‍🏫 Sala ${state.online?.code || ""} · ${players.length} participantes`;
  updateFloatingRoomCode();
  refs.teacherDashboard.classList.toggle("many-players", players.length >= 12);

  const totalCorrect = players.reduce((sum, p) => sum + Number(p.correctCount || 0), 0);
  const totalWrong = players.reduce((sum, p) => sum + Number(p.wrongCount || 0), 0);
  const totalAnswers = totalCorrect + totalWrong;
  const accuracy = totalAnswers ? Math.round((totalCorrect / totalAnswers) * 100) : 0;
  const activePlayers = players.filter((p) => p.isConnected !== false).length;
  const lastAction = players
    .filter((p) => p.lastResult)
    .sort((a, b) => Number(b.lastActionAt || 0) - Number(a.lastActionAt || 0))[0];
  const winner = players[0];
  const lastText = room.status === "finished" && winner
    ? `🏆 ${escapeHtml(winner.name || "Ninja")}`
    : lastAction
    ? `${lastResultIcon(lastAction.lastResult)} ${escapeHtml(lastAction.name || "Ninja")}`
    : (room.status === "running" ? "En juego" : "Esperando");

  refs.teacherSummary.innerHTML = `
    <div class="teacher-stat-card"><span>👥</span><strong>${activePlayers}</strong><small>ninjas</small></div>
    <div class="teacher-stat-card"><span>✅</span><strong>${totalCorrect}</strong><small>aciertos</small></div>
    <div class="teacher-stat-card"><span>🎯</span><strong>${accuracy}%</strong><small>precisión</small></div>
    <div class="teacher-stat-card hot"><span>⚡</span><strong>${lastText}</strong><small>última acción</small></div>
  `;

  if (players.length === 0) {
    refs.teacherRace.innerHTML = "";
    refs.teacherGrid.innerHTML = "<div class='teacher-empty'>Esperando ninjas...</div>";
    return;
  }

  const maxProgress = Math.max(10, ...players.map((p) => Number(p.operationIndex || 0)));
  refs.teacherRace.innerHTML = players.slice(0, 8).map((player, index) => {
    const pct = Math.min(100, ((Number(player.operationIndex || 0) / maxProgress) * 100));
    return `
      <div class="race-lane">
        <span class="race-rank">${index + 1}</span>
        <span class="race-name">${escapeHtml(player.name || "Ninja")}</span>
        <div class="race-track"><span class="race-runner" style="left:${pct}%">🥷</span></div>
        <span class="race-score">${Number(player.score || 0)}</span>
      </div>
    `;
  }).join("");

  refs.teacherGrid.innerHTML = players.map((player, index) => {
    const progressPct = Math.min(100, (Number(player.operationIndex || 0) / maxProgress) * 100);
    const streak = Number(player.streak || 0);
    const medal = index === 0 ? "🏆" : index === 1 ? "🥈" : index === 2 ? "🥉" : "🥷";
    const lastResult = player.lastResult || "waiting";
    const lastClass = lastResult === "correct" ? "ok" : lastResult === "wrong" ? "bad" : lastResult === "skip" ? "skip" : "";
    const lastLabel = player.lastResult
      ? `${lastResultIcon(lastResult)} ${lastResultText(lastResult)}${player.lastAnswer !== undefined ? ` · ${escapeHtml(player.lastAnswer)}` : ""}`
      : "🕹️ Preparado";
    return `
      <article class="teacher-card ${index === 0 ? "leader" : ""} ${lastClass}">
        <div class="teacher-card-top">
          <span class="teacher-medal">${medal}</span>
          <strong>${escapeHtml(player.name || "Ninja")}</strong>
          <span>${Number(player.score || 0)} pts</span>
        </div>
        <div class="teacher-progress"><span style="width:${progressPct}%"></span></div>
        <div class="teacher-last">${lastLabel}</div>
        <div class="teacher-stats">
          <span>✅ ${Number(player.correctCount || 0)}</span>
          <span>❌ ${Number(player.wrongCount || 0)}</span>
          <span>🔥 x${streak}</span>
          <span>📍 ${Number(player.operationIndex || 0)}</span>
        </div>
      </article>
    `;
  }).join("");
}

function lastResultIcon(result) {
  if (result === "correct") return "✅";
  if (result === "wrong") return "❌";
  if (result === "skip") return "⏭️";
  return "🕹️";
}

function lastResultText(result) {
  if (result === "correct") return "Acierto";
  if (result === "wrong") return "Fallo";
  if (result === "skip") return "Saltó";
  return "Listo";
}

function launchGame(enabledKeys, duration) {

  initAudio();
  playGong();
  stopTimer();
  stopEventSystem();
  refs.body.classList.add("game-running");

  state.gameDuration = duration;
  state.timeLeft = duration;
  state.isRunning = true;
  state.operationsByPlayer = new Map();
  refs.eventRoulette.classList.add("hidden");

  refs.resultsOverlay.classList.add("hidden");
  refs.dojoScreen.classList.add("hidden");
  refs.arenaScreen.classList.remove("hidden");
  refs.arenaScreen.classList.remove("teacher-mode");
  refs.teacherDashboard.classList.add("hidden");
  refs.playersWrap.classList.remove("hidden");
  hideOnlineHostLobby();
  updateFloatingRoomCode(state.mode === "online" ? state.online?.code : null);

  state.players = buildPlayersForMode();
  renderArena();
  placeRouletteForMode();
  assignInitialOperations();
  updateTimerStyles();
  refs.matchBadge.textContent = buildMatchBadge(enabledKeys);

  refs.duelLead.classList.toggle("hidden", state.mode !== "duel");
  if (state.mode === "duel") {
    refs.duelLeftName.textContent = state.players[0].name;
    refs.duelRightName.textContent = state.players[1].name;
    updateDuelLeadBar();
  }

  if (state.streaksEnabled && state.mode !== "online") scheduleNextEvent();

  state.timerId = setInterval(() => {
    state.timeLeft -= 1;
    const safeTime = Math.max(0, state.timeLeft);
    if (safeTime > 0 && safeTime <= 10) {
      playFinalCountdownTick(safeTime);
    }
    updateTimerStyles();
    if (state.timeLeft <= 0) finishGame();
  }, 1000);
}

function runStartSequence(onFinish) {
  refs.startOverlay.classList.remove("hidden");
  refs.startOverlay.classList.remove("slash");
  let value = 5;
  refs.countdownNumber.textContent = String(value);
  playStartCountdownTick(value);
  pulseCountdownNumber();
  vibrateDevice(25);

  const id = setInterval(() => {
    value -= 1;
    if (value > 0) {
      refs.countdownNumber.textContent = String(value);
      playStartCountdownTick(value);
      pulseCountdownNumber();
      vibrateDevice(value <= 2 ? 60 : 25);
      return;
    }

    clearInterval(id);
    refs.countdownNumber.textContent = "⚔️";
    refs.startOverlay.classList.add("slash");
    playStartCountdownFinal();
    pulseCountdownNumber();
    vibrateDevice([35, 25, 45]);
    setTimeout(() => {
      refs.startOverlay.classList.add("hidden");
      refs.startOverlay.classList.remove("slash");
      onFinish();
    }, 900);
  }, 600);
}

function getSelectedDurationSeconds() {
  const preset = refs.timePresetSelect.value;
  if (preset !== "custom") return Number(preset);

  const min = clamp(Number(refs.customMinInput.value), 0, 30);
  const sec = clamp(Number(refs.customSecInput.value), 0, 59);
  return (min * 60) + sec;
}

function buildPlayersForMode() {
  const p1 = safeName(refs.player1Input.value, "Ninja");
  if (state.mode === "single" || state.mode === "online") {
    return [{ id: 0, name: p1, score: 0, input: "", streak: 0, color: "red" }];
  }

  const p2 = safeName(refs.player2Input.value, "Ninja Azul");
  return [
    { id: 0, name: p1, score: 0, input: "", streak: 0, color: "red" },
    { id: 1, name: p2, score: 0, input: "", streak: 0, color: "blue" }
  ];
}

function renderArena() {
  refs.playersWrap.innerHTML = "";
  refs.playersWrap.className = "players-wrap";

  if (state.mode === "single" || state.mode === "online") {
    refs.playersWrap.classList.add("single-layout");
  } else {
    refs.playersWrap.classList.add(state.orientation === "face" ? "duel-face" : "duel-vertical");
  }

  state.players.forEach((player, index) => {
    const panel = document.createElement("article");
    panel.className = `player-panel player-${player.color}`;
    panel.dataset.playerId = String(player.id);
    if (state.mode === "duel" && index === 0) panel.classList.add("player-top");

    panel.innerHTML = `
      <div class="player-head">
        <p class="player-name">${escapeHtml(player.name)}</p>
        <div class="player-score" id="score-${player.id}">Puntos: 0</div>
      </div>
      <div class="score-track"><div class="score-ninja" id="scoreNinja-${player.id}">🥷</div></div>
      <div class="score-label">🔴 0 · 🟢 250+</div>
      <div class="streak-badge hidden" id="streak-${player.id}">🔥 Racha x2</div>
      <div class="panel-timer" id="panelTimer-${player.id}">60</div>
      <div class="operation" id="operation-${player.id}">...</div>
      <div class="decimal-hint hidden" id="decimalHint-${player.id}">🔢 Máx 1 dec.</div>
      <div class="event-inline" id="eventInline-${player.id}" aria-live="polite"></div>
      <div class="answer-box" id="answer-${player.id}"></div>
      <div class="numpad" id="numpad-${player.id}"></div>
      <div class="action-row">
        <button class="action-btn clear" type="button" data-action="clear" data-player="${player.id}">C</button>
        <button class="action-btn skip" type="button" data-action="skip" data-player="${player.id}">⏭️ Saltar</button>
        <button class="action-btn submit" type="button" data-action="submit" data-player="${player.id}">🚀 ¡ATACAR!</button>
      </div>
    `;

    refs.playersWrap.appendChild(panel);
    buildNumpad(panel.querySelector(`#numpad-${player.id}`), player.id);
  });

  refs.playersWrap.querySelectorAll("button[data-action], .key-btn").forEach((button) => {
    button.addEventListener("pointerdown", handleButtonAction);
  });

  repaintPlayers();
  updatePanelTimersDisplay();
  clearInlineEvents();
}

function updatePanelTimersDisplay() {
  const safeTime = Math.max(0, state.timeLeft);
  const ratio = clamp(state.timeLeft / Math.max(1, state.gameDuration), 0, 1);
  const countdownProgress = clamp(state.timeLeft / 10, 0, 1);

  refs.playersWrap.querySelectorAll(".panel-timer").forEach((timerEl) => {
    timerEl.textContent = String(safeTime);
    timerEl.classList.toggle("warning", ratio <= 0.33 && ratio > 0.16);
    timerEl.classList.toggle("danger", ratio <= 0.16);
    timerEl.classList.toggle("last-ten", state.timeLeft > 0 && state.timeLeft <= 10);
    timerEl.style.setProperty("--countdown-progress", String(countdownProgress));
  });
}

function showInlineEvents(text) {
  refs.playersWrap.querySelectorAll(".event-inline").forEach((eventEl) => {
    eventEl.textContent = text;
    eventEl.classList.add("active");
  });
}

function clearInlineEvents() {
  refs.playersWrap.querySelectorAll(".event-inline").forEach((eventEl) => {
    eventEl.textContent = "";
    eventEl.classList.remove("active");
  });
}

function placeRouletteForMode() {
  refs.eventRoulette.classList.remove("single-pos", "duel-pos", "fade-out");

  if (state.mode === "single") {
    const panel = refs.playersWrap.querySelector(".player-panel");
    if (panel && refs.eventRoulette.parentElement !== panel) {
      panel.appendChild(refs.eventRoulette);
    }
    refs.eventRoulette.classList.add("single-pos");
    return;
  }

  if (refs.eventRoulette.parentElement !== refs.arenaScreen) {
    refs.arenaScreen.appendChild(refs.eventRoulette);
  }
  refs.eventRoulette.classList.add("duel-pos");
}

function buildNumpad(numpadEl, playerId) {
  const keys = ["7", "8", "9", "4", "5", "6", "1", "2", "3", DECIMAL_SEPARATOR, "0"];
  keys.forEach((key) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "key-btn";
    button.dataset.player = String(playerId);
    button.dataset.key = key;
    button.textContent = key;
    numpadEl.appendChild(button);
  });
}

function handleButtonAction(event) {
  if (!state.isRunning) return;
  event.preventDefault();

  const button = event.currentTarget;
  const playerId = Number(button.dataset.player);
  const player = state.players.find((p) => p.id === playerId);
  if (!player) return;

  const typed = button.dataset.key;
  if (typed !== undefined) {
    if (!appendInputChar(player, typed)) return;
    playSwoosh();
    repaintPlayerInput(player.id);
    return;
  }

  const action = button.dataset.action;
  if (action === "clear") {
    player.input = "";
    repaintPlayerInput(player.id);
    return;
  }

  if (action === "skip") {
    skipCurrentOperation(player.id);
    return;
  }

  if (action === "submit") submitPlayerAnswer(player.id);
}

function skipCurrentOperation(playerId) {
  if (!state.isRunning) return;
  const player = state.players.find((p) => p.id === playerId);
  if (!player) return;
  if (player.score < SKIP_PENALTY) {
    showEventBanner("🚫 ¡No tienes puntos suficientes para saltar!");
    setTimeout(() => {
      clearInlineEvents();
    }, 1200);
    flashPlayer(player.id, false);
    playFail();
    return;
  }

  player.score = Math.max(0, player.score - SKIP_PENALTY);
  player.streak = 0;
  player.input = "";
  flashPlayer(player.id, false);
  playSkip();
  if (state.mode === "online" && state.online?.active) {
    state.online.currentOperationIndex += 1;
    updateOnlinePlayerProgress(player, {
      lastResult: "skip",
      lastAnswer: "saltada",
      lastActionAt: Date.now()
    });
  }
  generateNewOperationForPlayer(player.id, true);
  repaintPlayers();
}

function bindKeyboardSupport() {
  window.addEventListener("keydown", (event) => {
    if (!state.isRunning) return;

    const code = event.code || "";
    const key = event.key || "";
    const isNumpad = code.startsWith("Numpad");
    const playerId = state.mode === "single" ? 0 : (isNumpad ? 1 : 0);
    const player = state.players.find((p) => p.id === playerId);
    if (!player) return;

    const inputKey = extractInputKey(event);
    if (inputKey !== null) {
      event.preventDefault();
      if (!appendInputChar(player, inputKey)) return;
      playSwoosh();
      repaintPlayerInput(player.id);
      return;
    }

    const submitKey = (key === "Enter" && !isNumpad) || code === "NumpadEnter";
    if (submitKey) {
      event.preventDefault();
      submitPlayerAnswer(player.id);
      return;
    }

    const backspaceKey = key === "Backspace" || key === "Delete";
    if (backspaceKey) {
      event.preventDefault();
      player.input = player.input.slice(0, -1);
      repaintPlayerInput(player.id);
    }
  });
}

function appendInputChar(player, char) {
  if (!player || typeof char !== "string") return false;
  if (player.input.length >= MAX_INPUT_LENGTH) return false;

  if (char === DECIMAL_SEPARATOR) {
    if (player.input.includes(DECIMAL_SEPARATOR)) return false;
    if (player.input === "") player.input = `0${DECIMAL_SEPARATOR}`;
    else player.input += DECIMAL_SEPARATOR;
    return true;
  }

  if (!/^[0-9]$/.test(char)) return false;
  player.input += char;
  return true;
}

function extractInputKey(event) {
  const key = event.key || "";
  const code = event.code || "";

  if (/^[0-9]$/.test(key)) return key;

  if (key === DECIMAL_SEPARATOR || key === "." || code === "NumpadDecimal") {
    return DECIMAL_SEPARATOR;
  }

  if (code.startsWith("Numpad")) {
    const match = code.match(/^Numpad([0-9])$/);
    if (match) return match[1];
  }
  return null;
}

function submitPlayerAnswer(playerId) {
  if (!state.isRunning) return;

  const player = state.players.find((p) => p.id === playerId);
  const operation = state.operationsByPlayer.get(playerId);
  if (!player || !operation || player.input === "") return;

  const submittedAnswer = player.input;
  const numericInput = parsePlayerInput(player.input);
  if (Number.isNaN(numericInput)) {
    player.input = "";
    repaintPlayerInput(player.id);
    return;
  }

  if (isCorrectAnswer(numericInput, operation.answer)) {
    player.score += getCorrectPoints(operation);
    player.streak += 1;
    player.input = "";
    flashPlayer(player.id, true);
    playSuccess();
    triggerStreakEffect(player.id);
    if (state.mode === "online" && state.online?.active) {
      state.online.currentOperationIndex += 1;
      state.online.correctCount += 1;
      updateOnlinePlayerProgress(player, {
        lastResult: "correct",
        lastAnswer: submittedAnswer,
        lastActionAt: Date.now()
      });
    }
    generateNewOperationForPlayer(player.id, true);
  } else {
    applyWrongOutcome(player);
    player.streak = 0;
    player.input = "";
    flashPlayer(player.id, false);
    playFail();
    if (state.mode === "online" && state.online?.active) {
      state.online.wrongCount += 1;
      updateOnlinePlayerProgress(player, {
        lastResult: "wrong",
        lastAnswer: submittedAnswer,
        lastActionAt: Date.now()
      });
    }
  }

  repaintPlayers();
}

function assignInitialOperations() {
  if (state.mode === "single" || state.mode === "online") {
    generateNewOperationForPlayer(0, false);
    repaintPlayers();
    return;
  }

  generateNewOperationForPlayer(0, false);
  generateNewOperationForPlayer(1, false);

  let tries = 0;
  while (
    state.operationsByPlayer.get(0)?.signature === state.operationsByPlayer.get(1)?.signature &&
    tries < 25
  ) {
    generateNewOperationForPlayer(1, false);
    tries += 1;
  }

  repaintPlayers();
}

function generateNewOperationForPlayer(playerId, enforceDifferentInDuel) {
  const enabledKeys = getEnabledOperationKeys();
  if (enabledKeys.length === 0) return;

  if (state.mode === "online" && state.online?.active) {
    state.operationsByPlayer.set(playerId, createOnlineOperation(state.online.currentOperationIndex));
    return;
  }

  let operation = createOperation(randomFrom(enabledKeys));

  if (state.mode === "duel" && enforceDifferentInDuel) {
    const otherId = playerId === 0 ? 1 : 0;
    const other = state.operationsByPlayer.get(otherId);
    let tries = 0;

    while (other && operation.signature === other.signature && tries < 40) {
      operation = createOperation(randomFrom(enabledKeys));
      tries += 1;
    }
  }

  state.operationsByPlayer.set(playerId, operation);
}

function createOperation(kind) {
  const cfg = state.operationSettings[kind];
  if (!cfg) return decorateOperation(generateAdditionWithCarry(2));
  if (kind === "combined") return decorateOperation(generateCombinedOperationEasy(cfg.digits));
  if (kind === "combinedAdv") return decorateOperation(generateCombinedOperationAdvanced(cfg.digits));
  if (kind === "fraction") return decorateOperation(generateFractionOperatorOperation(cfg));
  if (kind === "percent") return decorateOperation(generatePercentOperation(cfg.digits));
  if (kind === "divHard") return decorateOperation(generateHardDivision(cfg));

  if (state.decimalsEnabled && ["addNoCarry", "addCarry", "subNoBorrow", "subBorrow", "mul"].includes(kind)) {
    return decorateOperation(generateDecimalOperation(kind, cfg));
  }

  let base;
  if (kind === "addNoCarry") base = generateAdditionNoCarry(cfg.digits);
  else if (kind === "addCarry") base = generateAdditionWithCarry(cfg.digits);
  else if (kind === "subNoBorrow") base = generateSubtractionNoBorrow(cfg.digits);
  else if (kind === "subBorrow") base = generateSubtractionWithBorrow(cfg.digits);
  else if (kind === "mul") base = generateMultiplication(cfg);
  else base = generateDivision(cfg);

  return decorateOperation(base);
}

function createOnlineOperation(index) {
  const enabledKeys = getEnabledOperationKeys();
  const seed = Number(state.online?.seed || 1);
  return withSeededRandom(seed + (index * 9973), () => {
    const kind = randomFrom(enabledKeys);
    return createOperation(kind);
  });
}

function withSeededRandom(seed, callback) {
  const originalRandom = Math.random;
  Math.random = mulberry32(seed);
  try {
    return callback();
  } finally {
    Math.random = originalRandom;
  }
}

function mulberry32(seed) {
  let t = Math.floor(seed) || 1;
  return function seededRandom() {
    t += 0x6D2B79F5;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function updateOnlinePlayerProgress(player, extra = {}) {
  if (!state.online?.code || !state.online?.playerId || !window.NinjaOnline?.enabled) return;
  window.NinjaOnline.updatePlayer(state.online.code, state.online.playerId, {
    name: player.name,
    score: player.score,
    streak: player.streak,
    operationIndex: state.online.currentOperationIndex,
    correctCount: state.online.correctCount,
    wrongCount: state.online.wrongCount,
    isConnected: true,
    ...extra
  }).catch(() => {});
}

function generateDecimalOperation(kind, cfg) {
  const places = clamp(state.decimalPlaces, 1, 3);

  if (kind === "addNoCarry" || kind === "addCarry") {
    const digits = clamp(cfg.digits, 1, 9);
    const a = randomDecimalByDigits(digits, places);
    const b = randomDecimalByDigits(digits, places);
    return { kind: "add", a, b, answer: roundTo(a + b, places) };
  }

  if (kind === "subNoBorrow" || kind === "subBorrow") {
    const digits = clamp(cfg.digits, 1, 9);
    let a = randomDecimalByDigits(digits, places);
    let b = randomDecimalByDigits(digits, places);
    if (a < b) [a, b] = [b, a];
    return { kind: "sub", a, b, answer: roundTo(a - b, places) };
  }

  const a = roundTo(randomDecimalByDigits(clamp(cfg.multiplicandMax, 1, 9), places), places);
  const b = roundTo(randomDecimalByDigits(clamp(cfg.factorMax, 1, 9), places), places);
  return { kind: "mul", a, b, answer: roundTo(a * b, places) };
}

function decorateOperation(base) {
  if (base.expression) {
    const text = `${base.expression} = ?`;
    return {
      ...base,
      html: escapeHtml(text),
      signature: base.signature || `${base.kind}:${escapeHtml(base.expression)}`
    };
  }

  const mode = getEffectiveDisplayMode() === "mixed"
    ? (Math.random() < 0.5 ? "horizontal" : "vertical")
    : getEffectiveDisplayMode();

  const symbol = base.kind === "add" ? "+"
    : base.kind === "sub" ? "-"
    : base.kind === "mul" ? "x"
    : "/";

  const displayA = formatNumberForDisplay(base.a);
  const displayB = formatNumberForDisplay(base.b);
  const horizontal = `${displayA} ${symbol} ${displayB} = ?`;
  const canVertical = base.kind !== "div";

  if (mode === "vertical" && canVertical) {
    return {
      ...base,
      html: `<div class="op-vertical"><span>${escapeHtml(displayA)}</span><span>${symbol} ${escapeHtml(displayB)}</span><span class="line"></span><span class="q">?</span></div>`,
      signature: `${base.kind}:${numericSignature(base.a)}:${numericSignature(base.b)}`
    };
  }

  return {
    ...base,
    html: escapeHtml(horizontal),
    signature: `${base.kind}:${numericSignature(base.a)}:${numericSignature(base.b)}`
  };
}

function generateCombinedOperationEasy(digits) {
  const a = randomNDigits(digits);
  const b = randomNDigits(digits);
  const c = randomNDigits(digits);

  const builders = [
    () => ({ expression: `${a} x ${b} + ${c}`, answer: (a * b) + c }),
    () => ({ expression: `${a} + ${b} x ${c}`, answer: a + (b * c) }),
    () => ({ expression: `${a} x ${b} - ${c}`, answer: Math.max(0, (a * b) - c) }),
    () => ({ expression: `${a} + ${b} - ${c}`, answer: a + b - c }),
    () => ({ expression: `${a} - ${b} + ${c}`, answer: a - b + c })
  ];

  let op = randomFrom(builders)();
  if (op.answer < 0) op = { expression: `${a} x ${b} + ${c}`, answer: (a * b) + c };
  return {
    kind: "combined",
    expression: op.expression,
    answer: roundTo(op.answer, 2),
    signature: `combinedEasy:${op.expression}`
  };
}

function generateCombinedOperationAdvanced(digits) {
  const resultPlaces = state.decimalsEnabled ? clamp(state.decimalPlaces, 1, 3) : 2;
  const a = randomNDigits(digits);
  const b = randomNDigits(digits);
  const c = randomNDigits(digits);
  const d = randomNDigits(digits);
  const e = randomNDigits(digits);
  const f = randomNDigits(digits);

  const diff1 = Math.max(1, Math.abs(c - d));
  const diff2 = Math.max(1, Math.abs(e - f));
  const divA = randomInt(2, 9);
  const divB = randomInt(2, 9);

  const builders = [
    () => ({ expression: `(${a} + ${b}) x (${c} - ${d})`, answer: (a + b) * (c - d) }),
    () => ({ expression: `(${a} - ${b}) x (${c} + ${d})`, answer: (a - b) * (c + d) }),
    () => ({ expression: `(${a} + ${b}) / (${diff1} + ${divA})`, answer: roundTo((a + b) / (diff1 + divA), resultPlaces) }),
    () => ({ expression: `(${a} x ${b}) + (${c} / ${divA})`, answer: roundTo((a * b) + (c / divA), resultPlaces) }),
    () => ({ expression: `(${a} + ${b}) x ${c} - (${d} + ${e})`, answer: ((a + b) * c) - (d + e) }),
    () => ({ expression: `${a} x (${b} + ${c}) - (${d} x ${Math.min(9, e)})`, answer: (a * (b + c)) - (d * Math.min(9, e)) }),
    () => ({ expression: `(${a} + ${b}) x (${diff2}) + (${f} / ${divB})`, answer: roundTo(((a + b) * diff2) + (f / divB), resultPlaces) })
  ];

  let op = randomFrom(builders)();
  if (op.answer < 0) {
    const safeMul = Math.max(1, c - d + 1);
    op = { expression: `(${a} + ${b}) x (${safeMul})`, answer: (a + b) * safeMul };
  }
  return {
    kind: "combinedAdv",
    expression: op.expression,
    answer: roundTo(op.answer, resultPlaces),
    signature: `combinedAdv:${op.expression}`
  };
}

function generateFractionOperatorOperation(cfg) {
  const denMax = clamp(cfg.denominatorMax, 1, 9);
  const numMax = clamp(cfg.numeratorMax, 1, 9);
  const denominator = randomInt(Math.max(2, denMax === 1 ? 2 : 10 ** (denMax - 1)), (10 ** denMax) - 1);
  const numeratorMaxValue = Math.min((10 ** numMax) - 1, denominator - 1);
  const numeratorMinValue = 1;
  const numerator = randomInt(numeratorMinValue, Math.max(numeratorMinValue, numeratorMaxValue));
  const k = randomInt(2, 20);
  const base = denominator * k;
  const answer = (numerator * base) / denominator;

  return {
    kind: "fraction",
    expression: `${numerator}/${denominator} de ${base}`,
    answer: roundTo(answer, 2),
    signature: `fraction:${numerator}/${denominator}:${base}`
  };
}

function generatePercentOperation(digits) {
  const resultPlaces = state.decimalsEnabled ? clamp(state.decimalPlaces, 1, 3) : 2;
  const percent = randomFrom([5, 10, 15, 20, 25, 30, 40, 50, 75]);
  const value = randomNDigits(digits);
  const answer = roundTo((value * percent) / 100, resultPlaces);
  return {
    kind: "percent",
    expression: `${percent}% de ${value}`,
    answer,
    signature: `percent:${percent}:${value}`
  };
}

function generateAdditionNoCarry(digits) {
  if (digits === 1) {
    const a = randomInt(0, 9);
    const b = randomInt(0, 9 - a);
    return { kind: "add", a, b, answer: a + b };
  }

  const cols = [];
  for (let i = 0; i < digits; i += 1) {
    let aDigit = randomInt(0, 9);
    let bDigit = randomInt(0, 9 - aDigit);
    if (i === 0 && aDigit === 0 && bDigit === 0) {
      aDigit = randomInt(1, 8);
      bDigit = randomInt(0, 9 - aDigit);
    }
    cols.push([aDigit, bDigit]);
  }

  const [aDigits, bDigits] = unzipCols(cols);
  const a = Number(aDigits.join(""));
  const b = Number(bDigits.join(""));
  return { kind: "add", a, b, answer: a + b };
}

function generateAdditionWithCarry(digits) {
  let a = randomNDigits(digits);
  let b = randomNDigits(digits);
  let tries = 0;
  while (!hasAdditionCarry(a, b) && tries < 120) {
    a = randomNDigits(digits);
    b = randomNDigits(digits);
    tries += 1;
  }
  return { kind: "add", a, b, answer: a + b };
}

function generateSubtractionNoBorrow(digits) {
  if (digits === 1) {
    const b = randomInt(0, 9);
    const a = randomInt(b, 9);
    return { kind: "sub", a, b, answer: a - b };
  }

  const aDigits = [];
  const bDigits = [];
  for (let i = 0; i < digits; i += 1) {
    let bDigit = randomInt(0, 9);
    let aDigit = randomInt(bDigit, 9);
    if (i === 0 && aDigit === 0) {
      aDigit = randomInt(1, 9);
      bDigit = randomInt(0, aDigit);
    }
    aDigits.push(aDigit);
    bDigits.push(bDigit);
  }

  const a = Number(aDigits.join(""));
  const b = Number(bDigits.join(""));
  return { kind: "sub", a, b, answer: a - b };
}

function generateSubtractionWithBorrow(digits) {
  let a = randomNDigits(digits);
  let b = randomNDigits(digits);
  let tries = 0;
  while ((a < b || !hasSubtractionBorrow(a, b)) && tries < 140) {
    a = randomNDigits(digits);
    b = randomNDigits(digits);
    tries += 1;
  }
  if (a < b) [a, b] = [b, a];
  return { kind: "sub", a, b, answer: a - b };
}

function generateMultiplication(cfg) {
  const a = randomNDigits(clamp(cfg.multiplicandMax, 1, 9));
  const b = randomNDigits(clamp(cfg.factorMax, 1, 9));
  return { kind: "mul", a, b, answer: a * b };
}

function generateDivision(cfg) {
  const dividendDigits = clamp(cfg.dividendMax, 1, 9);
  const divisorDigits = clamp(cfg.divisorMax, 1, 9);
  const dividendMin = minByDigits(dividendDigits);
  const dividendMax = maxByDigits(dividendDigits);
  const divisorMin = minByDigits(divisorDigits);
  const divisorMax = maxByDigits(divisorDigits);
  const exactPossible = divisorDigits <= dividendDigits;
  const places = state.decimalsEnabled ? clamp(state.decimalPlaces, 1, 3) : 0;

  if (state.decimalsEnabled) {
    let decimalTries = 0;
    while (decimalTries < 420) {
      const b = randomInt(divisorMin, divisorMax);
      const core = stripFactors25(b);
      const minMult = Math.ceil(dividendMin / core);
      const maxMult = Math.floor(dividendMax / core);
      if (maxMult < minMult) {
        decimalTries += 1;
        continue;
      }

      const a = core * randomInt(minMult, maxMult);
      if (!isTerminatingDivisionWithinPlaces(a, b, places)) {
        decimalTries += 1;
        continue;
      }

      return { kind: "div", a, b, answer: a / b };
    }
  }

  if (!exactPossible) {
    const a = randomInt(dividendMin, dividendMax);
    const b = randomInt(divisorMin, divisorMax);
    return { kind: "div", a, b, answer: state.decimalsEnabled ? a / b : roundTo(a / b, 2) };
  }

  let tries = 0;
  while (tries < 320) {
    const b = randomInt(divisorMin, divisorMax);
    const minQ = Math.max(1, Math.ceil(dividendMin / b));
    const maxQ = Math.floor(dividendMax / b);
    if (maxQ >= minQ) {
      const answer = randomInt(minQ, maxQ);
      const a = b * answer;
      return { kind: "div", a, b, answer };
    }
    tries += 1;
  }

  const a = randomInt(dividendMin, dividendMax);
  const b = randomInt(divisorMin, divisorMax);
  return { kind: "div", a, b, answer: state.decimalsEnabled ? a / b : roundTo(a / b, 2) };
}

function generateHardDivision(cfg) {
  const maxDecimals = clamp(cfg.maxDecimals, 1, 3);
  const places = randomInt(1, maxDecimals);
  const resultPlaces = state.decimalsEnabled ? clamp(state.decimalPlaces, 1, 3) : maxDecimals;
  const divisor = randomNDigits(clamp(cfg.divisorMax, 1, 9));
  const quotient = roundTo(randomInt(1, 9) + (randomInt(1, (10 ** places) - 1) / (10 ** places)), places);
  const dividend = roundTo(divisor * quotient, maxDecimals + 1);
  const answer = roundTo(dividend / divisor, resultPlaces);
  return {
    kind: "div",
    a: dividend,
    b: divisor,
    answer,
    signature: `divHard:${dividend}:${divisor}:${maxDecimals}`
  };
}

function hasAdditionCarry(a, b) {
  const aDigits = String(a).split("").reverse();
  const bDigits = String(b).split("").reverse();
  const len = Math.max(aDigits.length, bDigits.length);
  let carry = 0;

  for (let i = 0; i < len; i += 1) {
    const sum = Number(aDigits[i] || 0) + Number(bDigits[i] || 0) + carry;
    if (sum >= 10) return true;
    carry = sum >= 10 ? 1 : 0;
  }

  return false;
}

function hasSubtractionBorrow(a, b) {
  const aDigits = String(a).split("").reverse();
  const bDigits = String(b).split("").reverse();
  const len = Math.max(aDigits.length, bDigits.length);
  let borrow = 0;

  for (let i = 0; i < len; i += 1) {
    const top = Number(aDigits[i] || 0) - borrow;
    const bottom = Number(bDigits[i] || 0);
    if (top < bottom) return true;
    borrow = top < bottom ? 1 : 0;
  }

  return false;
}

function unzipCols(cols) {
  const left = [];
  const right = [];
  cols.forEach(([a, b]) => {
    left.push(a);
    right.push(b);
  });
  return [left, right];
}

function randomNDigits(digits) {
  if (digits <= 1) return randomInt(1, 9);
  return randomInt(minByDigits(digits), maxByDigits(digits));
}

function randomDecimalByDigits(digits, places) {
  const intPart = randomNDigits(digits);
  const fracMax = (10 ** places) - 1;
  const fracPart = randomInt(1, fracMax);
  return roundTo(intPart + (fracPart / (10 ** places)), places);
}

function minByDigits(digits) {
  if (digits <= 1) return 1;
  return 10 ** (digits - 1);
}

function maxByDigits(digits) {
  return (10 ** digits) - 1;
}

function stripFactors25(value) {
  let x = Math.max(1, Math.floor(Math.abs(value)));
  while (x % 2 === 0) x /= 2;
  while (x % 5 === 0) x /= 5;
  return x;
}

function isTerminatingDivisionWithinPlaces(a, b, places) {
  const gcd = gcdInt(a, b);
  let reducedDen = Math.floor(Math.abs(b) / gcd);
  let count2 = 0;
  let count5 = 0;

  while (reducedDen % 2 === 0) {
    reducedDen /= 2;
    count2 += 1;
  }
  while (reducedDen % 5 === 0) {
    reducedDen /= 5;
    count5 += 1;
  }

  if (reducedDen !== 1) return false;
  return Math.max(count2, count5) <= places;
}

function gcdInt(a, b) {
  let x = Math.floor(Math.abs(a));
  let y = Math.floor(Math.abs(b));
  while (y !== 0) {
    const t = y;
    y = x % y;
    x = t;
  }
  return Math.max(1, x);
}

function getEnabledOperationKeys() {
  return Object.keys(state.operationSettings).filter((key) => state.operationSettings[key].enabled);
}

function buildMatchBadge(enabledKeys) {
  const modeText = state.mode === "single" ? "👤 Entrenamiento"
    : state.mode === "online" ? `🌐 Sala ${state.online?.code || ""}`
    : "⚔️ Batalla";
  return `${modeText} · ${enabledKeys.length} operaciones activas`;
}

function repaintPlayers() {
  state.players.forEach((player) => {
    repaintPlayerInput(player.id);

    const scoreEl = document.getElementById(`score-${player.id}`);
    if (scoreEl) scoreEl.textContent = `Puntos: ${player.score}`;

    const scoreNinja = document.getElementById(`scoreNinja-${player.id}`);
    if (scoreNinja) {
      const pct = toPercent(player.score, SCORE_MIN, SCORE_MAX);
      scoreNinja.style.left = `${pct}%`;
    }

    const streakEl = document.getElementById(`streak-${player.id}`);
    if (streakEl) {
      const show = state.streaksEnabled && player.streak >= 2;
      streakEl.classList.toggle("hidden", !show);
      streakEl.textContent = `🔥 Racha x${player.streak}`;
    }

    const opEl = document.getElementById(`operation-${player.id}`);
    const op = state.operationsByPlayer.get(player.id);
    if (opEl && op) {
      opEl.classList.remove("pop");
      opEl.offsetHeight;
      opEl.classList.add("pop");
      opEl.innerHTML = op.html;
      fitOperationElement(opEl);
    }

    const decimalHintEl = document.getElementById(`decimalHint-${player.id}`);
    if (decimalHintEl) {
      const show = state.decimalsEnabled;
      decimalHintEl.classList.toggle("hidden", !show);
      decimalHintEl.textContent = `🔢 Máx ${state.decimalPlaces} dec.`;
    }
  });

  if (state.mode === "duel") updateDuelLeadBar();
}

function fitOperationElement(opEl) {
  if (!opEl) return;
  opEl.style.fontSize = "";
  const computed = window.getComputedStyle(opEl);
  let size = Number.parseFloat(computed.fontSize);
  if (!Number.isFinite(size)) return;

  const minSize = refs.body.classList.contains("game-running") ? 15 : 18;
  let attempts = 0;
  while (
    attempts < 18 &&
    size > minSize &&
    (opEl.scrollWidth > opEl.clientWidth || opEl.scrollHeight > opEl.clientHeight)
  ) {
    size -= 2;
    opEl.style.fontSize = `${size}px`;
    attempts += 1;
  }
}

function triggerStreakEffect(playerId) {
  const player = state.players.find((p) => p.id === playerId);
  if (!player || !state.streaksEnabled || player.streak < 2) return;

  const panel = refs.playersWrap.querySelector(`.player-panel[data-player-id="${playerId}"]`);
  if (!panel) return;

  const burst = document.createElement("div");
  burst.className = "streak-burst";
  burst.textContent = `🔥 x${player.streak}`;
  panel.appendChild(burst);
  setTimeout(() => burst.remove(), 720);
}

function updateDuelLeadBar() {
  if (state.players.length < 2) return;
  const diff = state.players[0].score - state.players[1].score;
  const pct = clamp(50 + (diff * 1.5), 0, 100);
  refs.duelNinja.style.left = `${pct}%`;
}

function repaintPlayerInput(playerId) {
  const player = state.players.find((p) => p.id === playerId);
  const answerEl = document.getElementById(`answer-${playerId}`);
  if (!player || !answerEl) return;
  answerEl.textContent = player.input || "_";
}

function flashPlayer(playerId, success) {
  const panel = refs.playersWrap.querySelector(`.player-panel[data-player-id="${playerId}"]`);
  if (!panel) return;

  panel.classList.remove("flash-ok", "flash-err");
  panel.offsetHeight;
  panel.classList.add(success ? "flash-ok" : "flash-err");

  if (!success) {
    const numpad = panel.querySelector(".numpad");
    if (numpad) {
      numpad.classList.remove("shake");
      numpad.offsetHeight;
      numpad.classList.add("shake");
    }
  }
}

function finishGame() {
  state.isRunning = false;
  refs.body.classList.remove("game-running", "online-lobby-running");
  if (state.mode === "online" && state.online?.active) {
    const player = state.players[0];
    if (player) updateOnlinePlayerProgress(player);
    if (state.online.isHost && window.NinjaOnline?.enabled) {
      window.NinjaOnline.finishRoom(state.online.code).catch(() => {});
    }
    state.online.active = false;
  }
  stopTimer();
  stopEventSystem();
  playGong();

  refs.playersWrap.querySelectorAll("button").forEach((button) => {
    button.disabled = true;
  });

  saveResultsToHall();
  showResults();
  renderHallOfFame();
}

function showResults() {
  refs.resultsScores.innerHTML = "";

  if (state.mode === "online") {
    const onlinePlayers = Object.values(state.online?.room?.players || {});
    const scores = (onlinePlayers.length ? onlinePlayers : state.players)
      .map((player) => ({
        name: player.name || "Ninja",
        score: Number(player.score || 0),
        correctCount: Number(player.correctCount || 0),
        wrongCount: Number(player.wrongCount || 0)
      }))
      .sort((a, b) => b.score - a.score || b.correctCount - a.correctCount);

    scores.forEach((player, index) => {
      const row = document.createElement("div");
      row.className = "results-score-item";
      const medal = index === 0 ? "🏆" : index === 1 ? "🥈" : index === 2 ? "🥉" : "🥷";
      row.textContent = `${medal} ${index + 1}. ${player.name}: ${player.score} puntos · ✅ ${player.correctCount} · ❌ ${player.wrongCount}`;
      refs.resultsScores.appendChild(row);
    });

    refs.resultsTitle.textContent = "🌐 ¡PARTIDA ONLINE TERMINADA!";
    refs.resultsSubtitle.textContent = scores[0]
      ? `Ganador/a: ${scores[0].name}. Ranking completo de la sala.`
      : "Ranking sincronizado con la sala.";
  } else if (state.mode === "duel") {
    const scores = [...state.players].sort((a, b) => b.score - a.score);
    state.players.forEach((player) => {
      const row = document.createElement("div");
      row.className = "results-score-item";
      row.textContent = `${player.name}: ${player.score} puntos`;
      refs.resultsScores.appendChild(row);
    });
    if (scores[0].score === scores[1].score) {
      refs.resultsTitle.textContent = "🤝 ¡EMPATE ÉPICO!";
      refs.resultsSubtitle.textContent = "Duelo igualadísimo hasta el final.";
    } else {
      refs.resultsTitle.textContent = `🏆 ¡${scores[0].name.toUpperCase()} GANA!`;
      refs.resultsSubtitle.textContent = "Golpe final perfecto.";
    }
  } else {
    state.players.forEach((player) => {
      const row = document.createElement("div");
      row.className = "results-score-item";
      row.textContent = `${player.name}: ${player.score} puntos`;
      refs.resultsScores.appendChild(row);
    });
    refs.resultsTitle.textContent = "🎯 ¡COMBATE TERMINADO!";
    refs.resultsSubtitle.textContent = "Tu resultado ya está guardado en el Cuadro de los Grandes Maestros.";
  }

  refs.resultsOverlay.classList.remove("hidden");
}

function saveResultsToHall() {
  const hall = readHall();
  const now = new Date();
  const modeLabel = state.mode === "single" ? "Entrenamiento"
    : state.mode === "online" ? "Batalla online"
    : "Batalla";
  const timeLabel = formatSeconds(state.gameDuration);

  state.players.forEach((player) => {
    hall.push({
      name: player.name,
      score: player.score,
      mode: modeLabel,
      time: timeLabel,
      date: now.toLocaleDateString("es-ES"),
      timestamp: now.toISOString()
    });
  });

  writeHall(hall.slice(-200));
}

function readHall() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_HALL) || "[]");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function writeHall(items) {
  localStorage.setItem(STORAGE_HALL, JSON.stringify(items));
}

function applySavedPreferences() {
  const prefs = readPreferences();
  if (!prefs) return;

  if (["single", "duel", "online", "teacher"].includes(prefs.mode)) state.mode = prefs.mode;
  if (prefs.orientation === "vertical" || prefs.orientation === "face") state.orientation = prefs.orientation;
  if (typeof prefs.muted === "boolean") state.muted = prefs.muted;
  if (typeof prefs.streaksEnabled === "boolean") state.streaksEnabled = prefs.streaksEnabled;
  if (typeof prefs.decimalsEnabled === "boolean") state.decimalsEnabled = prefs.decimalsEnabled;
  if (["horizontal", "vertical", "mixed"].includes(prefs.displayMode)) state.displayMode = prefs.displayMode;

  const parsedDecimalPlaces = Number(prefs.decimalPlaces);
  if (Number.isFinite(parsedDecimalPlaces)) {
    state.decimalPlaces = clamp(parsedDecimalPlaces, 1, 3);
  }

  const opSettings = prefs.operationSettings;
  if (opSettings && typeof opSettings === "object") {
    Object.keys(state.operationSettings).forEach((opKey) => {
      const saved = opSettings[opKey];
      if (!saved || typeof saved !== "object") return;

      Object.keys(state.operationSettings[opKey]).forEach((settingKey) => {
        const current = state.operationSettings[opKey][settingKey];
        if (typeof current === "boolean") {
          state.operationSettings[opKey][settingKey] = Boolean(saved[settingKey]);
          return;
        }
        const next = Number(saved[settingKey]);
        if (!Number.isFinite(next)) return;
        state.operationSettings[opKey][settingKey] = sanitizeOpSettingValue(settingKey, next);
      });
    });
  }

  if (typeof prefs.player1Name === "string") refs.player1Input.value = prefs.player1Name.slice(0, 16);
  if (typeof prefs.player2Name === "string") refs.player2Input.value = prefs.player2Name.slice(0, 16);

  const timePreset = String(prefs.timePreset || "");
  if (["60", "120", "180", "custom"].includes(timePreset)) refs.timePresetSelect.value = timePreset;

  const customMinutes = Number(prefs.customMinutes);
  if (Number.isFinite(customMinutes)) refs.customMinInput.value = String(clamp(customMinutes, 0, 30));
  const customSeconds = Number(prefs.customSeconds);
  if (Number.isFinite(customSeconds)) refs.customSecInput.value = String(clamp(customSeconds, 0, 59));
}

function readPreferences() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_PREFS) || "null");
    return data && typeof data === "object" ? data : null;
  } catch {
    return null;
  }
}

function savePreferences() {
  const prefs = {
    mode: state.mode,
    orientation: state.orientation,
    muted: state.muted,
    streaksEnabled: state.streaksEnabled,
    decimalsEnabled: state.decimalsEnabled,
    decimalPlaces: state.decimalPlaces,
    displayMode: state.displayMode,
    operationSettings: state.operationSettings,
    player1Name: refs.player1Input.value || "",
    player2Name: refs.player2Input.value || "",
    timePreset: refs.timePresetSelect.value,
    customMinutes: clamp(Number(refs.customMinInput.value), 0, 30),
    customSeconds: clamp(Number(refs.customSecInput.value), 0, 59)
  };

  localStorage.setItem(STORAGE_PREFS, JSON.stringify(prefs));
}

function sanitizeOpSettingValue(settingKey, value) {
  if (settingKey === "maxDecimals") return clamp(value, 1, 3);
  return clamp(value, 1, 9);
}

function renderHallOfFame() {
  let hall = readHall();

  const modeFilter = refs.hallModeFilter.value;
  const timeFilter = refs.hallTimeFilter.value;
  const sortFilter = refs.hallSortFilter.value;

  if (modeFilter !== "all") {
    hall = hall.filter((r) => r.mode === modeFilter);
  }

  if (timeFilter !== "all") {
    const days = Number(timeFilter);
    const limit = Date.now() - (days * 24 * 60 * 60 * 1000);
    hall = hall.filter((r) => new Date(r.timestamp || r.date).getTime() >= limit);
  }

  if (sortFilter === "score_desc") {
    hall.sort((a, b) => b.score - a.score || new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
  } else {
    hall.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
  }

  refs.hallBody.innerHTML = "";
  if (hall.length === 0) {
    refs.hallBody.innerHTML = "<tr><td colspan='6'>No hay registros para esos filtros.</td></tr>";
    return;
  }

  hall.slice(0, 20).forEach((row, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${index + 1}</td><td>${escapeHtml(row.name)}</td><td>${row.score}</td><td>${escapeHtml(row.mode)}</td><td>${escapeHtml(row.time)}</td><td>${escapeHtml(row.date)}</td>`;
    refs.hallBody.appendChild(tr);
  });
}

function clearHallOfFame() {
  const ok = confirm("¿Quieres borrar el Cuadro de los Grandes Maestros completo?");
  if (!ok) return;
  writeHall([]);
  renderHallOfFame();
}

function goHome() {
  stopTimer();
  stopEventSystem();
  detachOnlineSession();
  state.isRunning = false;
  refs.body.classList.remove("game-running");
  refs.resultsOverlay.classList.add("hidden");
  refs.arenaScreen.classList.add("hidden");
  refs.arenaScreen.classList.remove("teacher-mode");
  updateFloatingRoomCode(null);
  refs.teacherDashboard.classList.add("hidden");
  refs.playersWrap.classList.remove("hidden");
  refs.dojoScreen.classList.remove("hidden");
}

function updateTimerStyles() {
  updatePanelTimersDisplay();
}

function stopTimer() {
  if (state.timerId) {
    clearInterval(state.timerId);
    state.timerId = null;
  }
}

function getCorrectPoints(operation) {
  const base = getBasePoints(operation);
  if (state.activeEvent === "double_points") return base * 2;
  if (state.activeEvent === "mega_bonus") return base + 20;
  return base;
}

function getWrongPenalty() {
  if (state.activeEvent === "no_penalty") return 0;
  if (state.activeEvent === "double_penalty") return 10;
  return 5;
}

function getBasePoints(operation) {
  if (operation?.kind === "combinedAdv") return 20;
  return 10;
}

function applyWrongOutcome(player) {
  if (state.activeEvent === "fail_reset") {
    player.score = 0;
    return;
  }
  player.score = Math.max(0, player.score - getWrongPenalty());
}

function scheduleNextEvent() {
  if (!state.isRunning || !state.streaksEnabled) return;
  const delay = randomInt(7000, 15000);
  state.eventStartTimeoutId = setTimeout(() => {
    triggerRandomEvent();
  }, delay);
}

function triggerRandomEvent() {
  if (!state.isRunning || !state.streaksEnabled || state.activeEvent || state.eventRolling) {
    scheduleNextEvent();
    return;
  }

  const eventType = randomFrom(EVENT_POOL);
  spinRouletteAndApply(eventType);
}

function spinRouletteAndApply(eventType) {
  state.eventRolling = true;
  placeRouletteForMode();
  refs.eventRoulette.classList.remove("fade-out");
  refs.eventRoulette.classList.remove("hidden");
  refs.rouletteLabel.textContent = "Sorteando...";
  refs.wheelCenter.textContent = "🎰";
  refs.rouletteWheel.style.transition = "none";
  refs.rouletteWheel.style.transform = "rotate(0deg)";
  refs.rouletteWheel.offsetHeight;
  refs.rouletteWheel.style.transition = "transform 1.55s cubic-bezier(0.11, 0.76, 0.12, 1)";

  const eventIndex = EVENT_POOL.indexOf(eventType);
  const slice = 360 / EVENT_POOL.length;
  const target = (360 * 6) + (360 - (eventIndex * slice + (slice / 2)));
  refs.rouletteWheel.style.transform = `rotate(${target}deg)`;
  startRouletteTickSound();

  let idx = 0;
  const previewId = setInterval(() => {
    const currentType = EVENT_POOL[idx % EVENT_POOL.length];
    refs.wheelCenter.textContent = eventIcon(currentType);
    refs.rouletteLabel.textContent = eventShortLabel(currentType);
    idx += 1;
  }, 90);

  setTimeout(() => {
    clearInterval(previewId);
    stopRouletteTickSound();
    playRouletteStop();
    applyEventByType(eventType);
    state.eventRolling = false;
    setTimeout(() => refs.eventRoulette.classList.add("fade-out"), 850);
    setTimeout(() => refs.eventRoulette.classList.add("hidden"), 1250);
  }, 1300);
}

function applyEventByType(eventType) {
  refs.wheelCenter.textContent = eventIcon(eventType);
  refs.rouletteLabel.textContent = eventShortLabel(eventType);

  if (eventType === "plus_time") {
    state.timeLeft += 10;
    updateTimerStyles();
    showEventBanner("⏱️ ¡Evento! +10 segundos de tiempo");
    state.eventEndTimeoutId = setTimeout(() => {
      clearInlineEvents();
      scheduleNextEvent();
    }, 2200);
    return;
  }

  state.activeEvent = eventType;

  if (eventType === "double_points") {
    showEventBanner("🎉 ¡Evento! x2 puntos por acierto (8s)");
  } else if (eventType === "no_penalty") {
    showEventBanner("🛡️ ¡Evento! Fallos sin penalización (8s)");
  } else if (eventType === "mega_bonus") {
    showEventBanner("💥 ¡Evento! Mega golpe: +30 por acierto (8s)");
  } else if (eventType === "vertical_only") {
    showEventBanner("🧮 ¡Evento! Operaciones en vertical (8s)");
    refreshOperationDisplays();
  } else if (eventType === "double_penalty") {
    showEventBanner("😵 ¡Evento trampa! Fallo = -10 puntos (8s)");
  } else if (eventType === "fail_reset") {
    showEventBanner("☠️ ¡Evento trampa! Si fallas, puntos a 0 (8s)");
  }

  state.eventEndTimeoutId = setTimeout(() => {
    const ended = state.activeEvent;
    state.activeEvent = null;
    clearInlineEvents();
    if (ended === "vertical_only") refreshOperationDisplays();
    scheduleNextEvent();
  }, 8000);
}

function eventIcon(type) {
  if (type === "double_points") return "🎉";
  if (type === "no_penalty") return "🛡️";
  if (type === "plus_time") return "⏱️";
  if (type === "mega_bonus") return "💥";
  if (type === "vertical_only") return "🧮";
  if (type === "double_penalty") return "😵";
  return "☠️";
}

function eventShortLabel(type) {
  if (type === "double_points") return "x2 puntos";
  if (type === "no_penalty") return "Sin penalización";
  if (type === "plus_time") return "+10s";
  if (type === "mega_bonus") return "+30";
  if (type === "vertical_only") return "Solo vertical";
  if (type === "double_penalty") return "Fallo -10";
  return "Fallo = 0";
}

function stopEventSystem() {
  if (state.eventStartTimeoutId) {
    clearTimeout(state.eventStartTimeoutId);
    state.eventStartTimeoutId = null;
  }
  if (state.eventEndTimeoutId) {
    clearTimeout(state.eventEndTimeoutId);
    state.eventEndTimeoutId = null;
  }
  stopRouletteTickSound();
  state.eventRolling = false;
  state.activeEvent = null;
  clearInlineEvents();
  refs.eventRoulette.classList.remove("fade-out");
  refs.eventRoulette.classList.add("hidden");
  refs.rouletteWheel.style.transition = "none";
  refs.rouletteWheel.style.transform = "rotate(0deg)";
  refs.wheelCenter.textContent = "🎰";
  refs.rouletteLabel.textContent = "Evento";
}

function showEventBanner(text) {
  showInlineEvents(text);
}

function startRouletteTickSound() {
  if (state.muted) return;
  stopRouletteTickSound();
  state.eventRouletteTickId = setInterval(() => {
    tone(940, 0.05, "triangle", 0.018, 0);
  }, 95);
}

function stopRouletteTickSound() {
  if (state.eventRouletteTickId) {
    clearInterval(state.eventRouletteTickId);
    state.eventRouletteTickId = null;
  }
}

function getEffectiveDisplayMode() {
  if (state.activeEvent === "vertical_only") return "vertical";
  return state.displayMode;
}

function refreshOperationDisplays() {
  state.operationsByPlayer.forEach((op, playerId) => {
    const base = {
      kind: op.kind,
      a: op.a,
      b: op.b,
      answer: op.answer,
      expression: op.expression,
      signature: op.signature
    };
    const decorated = decorateOperation(base);
    state.operationsByPlayer.set(playerId, decorated);
  });
  repaintPlayers();
}

function safeName(value, fallback) {
  const text = String(value || "").trim();
  return text || fallback;
}

function formatSeconds(total) {
  const min = Math.floor(total / 60);
  const sec = total % 60;
  return `${min}:${String(sec).padStart(2, "0")}`;
}

function toPercent(value, min, max) {
  const clamped = clamp(value, min, max);
  return ((clamped - min) / (max - min)) * 100;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFrom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function clamp(value, min, max) {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function parsePlayerInput(text) {
  if (typeof text !== "string") return NaN;
  const normalized = text.replace(",", ".");
  return Number(normalized);
}

function isCorrectAnswer(input, answer) {
  if (!state.decimalsEnabled && Number.isInteger(answer)) return input === answer;
  return Math.abs(input - answer) <= getAnswerEpsilon();
}

function roundTo(value, places) {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

function numericSignature(value) {
  return Number.isInteger(value) ? String(value) : roundTo(value, 3).toFixed(3);
}

function formatNumberForDisplay(value) {
  if (Number.isInteger(value)) return String(value);
  const places = state.decimalsEnabled ? state.decimalPlaces : 2;
  const text = state.decimalsEnabled
    ? roundTo(value, places).toFixed(places)
    : roundTo(value, places).toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
  return text.replace(".", DECIMAL_SEPARATOR);
}

function getAnswerEpsilon() {
  const places = Math.max(2, clamp(state.decimalPlaces, 1, 4));
  return 1 / (10 ** places);
}

function setActiveByData(selector, key, value) {
  document.querySelectorAll(selector).forEach((button) => {
    button.classList.toggle("active", button.dataset[key] === value);
  });
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function initAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();
}

function playGong() {
  if (state.muted) return;
  tone(220, 0.4, "sine", 0.1, 0);
  tone(120, 0.6, "sine", 0.12, 0.06);
}

function playSwoosh() {
  if (state.muted) return;
  toneSweep(900, 180, 0.08, "triangle", 0.03);
}

function playTick() {
  if (state.muted) return;
  tone(760, 0.05, "triangle", 0.03, 0);
}

function playStartCountdownTick(value) {
  if (state.muted) return;
  const urgency = value <= 2;
  const base = urgency ? 980 : 740;
  tone(base, 0.07, "triangle", urgency ? 0.06 : 0.045, 0);
  tone(base + 180, 0.05, "sine", urgency ? 0.05 : 0.035, 0.03);
}

function playStartCountdownFinal() {
  if (state.muted) return;
  tone(190, 0.2, "sawtooth", 0.08, 0);
  tone(120, 0.28, "sine", 0.1, 0.04);
  tone(720, 0.08, "triangle", 0.05, 0.09);
}

function pulseCountdownNumber() {
  refs.countdownNumber.classList.remove("vibe");
  refs.countdownNumber.offsetHeight;
  refs.countdownNumber.classList.add("vibe");
}

function vibrateDevice(pattern) {
  if (!("vibrate" in navigator)) return;
  navigator.vibrate(pattern);
}

function playFinalCountdownTick(secondsLeft) {
  if (state.muted) return;
  const urgent = secondsLeft <= 3;
  tone(urgent ? 1220 : 980, 0.08, "square", urgent ? 0.06 : 0.045, 0);
  tone(urgent ? 840 : 700, 0.07, "triangle", urgent ? 0.05 : 0.03, 0.04);
}

function playSuccess() {
  if (state.muted) return;
  tone(860, 0.09, "sine", 0.06, 0);
  tone(1120, 0.11, "sine", 0.06, 0.07);
}

function playFail() {
  if (state.muted) return;
  tone(180, 0.15, "square", 0.05, 0);
  tone(140, 0.2, "square", 0.06, 0.1);
}

function playSkip() {
  if (state.muted) return;
  tone(420, 0.07, "triangle", 0.035, 0);
  tone(300, 0.08, "triangle", 0.03, 0.05);
}

function playRouletteStop() {
  if (state.muted) return;
  tone(520, 0.06, "sine", 0.04, 0);
  tone(760, 0.08, "sine", 0.05, 0.05);
}

function tone(freq, duration, type, gain, delay) {
  if (!audioCtx) return;
  const now = audioCtx.currentTime + delay;
  const osc = audioCtx.createOscillator();
  const amp = audioCtx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  amp.gain.setValueAtTime(0, now);
  amp.gain.linearRampToValueAtTime(gain, now + 0.01);
  amp.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  osc.connect(amp);
  amp.connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + duration + 0.02);
}

function toneSweep(startFreq, endFreq, duration, type, gain) {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const amp = audioCtx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(startFreq, now);
  osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);
  amp.gain.setValueAtTime(gain, now);
  amp.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  osc.connect(amp);
  amp.connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + duration + 0.02);
}
