(function () {
  const CONFIG_PATH = "firebase-config.js";
  const FIREBASE_APP_URL = "https://www.gstatic.com/firebasejs/10.12.5/firebase-app-compat.js";
  const FIREBASE_DB_URL = "https://www.gstatic.com/firebasejs/10.12.5/firebase-database-compat.js";

  const online = {
    enabled: false,
    app: null,
    db: null,
    async init() {
      if (this.enabled) return true;
      const hasConfig = await loadOptionalScript(CONFIG_PATH);
      if (!hasConfig || !window.NINJA_FIREBASE_CONFIG) return false;

      await loadRequiredScript(FIREBASE_APP_URL);
      await loadRequiredScript(FIREBASE_DB_URL);

      this.app = window.firebase.initializeApp(window.NINJA_FIREBASE_CONFIG);
      this.db = window.firebase.database();
      this.enabled = true;
      return true;
    },
    async createRoom({ mode, config, durationSeconds, hostName }) {
      await requireOnline(this);
      const code = await createUniqueRoomCode(this.db);
      const room = {
        mode,
        status: "lobby",
        seed: Math.floor(Math.random() * 2147483647),
        durationSeconds,
        hostName: hostName || "",
        config: JSON.stringify(config || {}),
        createdAt: Date.now()
      };
      await this.db.ref(`rooms/${code}`).set(room);
      return { code, room };
    },
    async joinRoom(code, playerName) {
      await requireOnline(this);
      const cleanCode = normalizeRoomCode(code);
      const roomSnap = await this.db.ref(`rooms/${cleanCode}`).get();
      if (!roomSnap.exists()) throw new Error("La sala no existe.");

      const safePlayerName = truncateGraphemes(String(playerName || "Ninja").trim() || "Ninja", 24);
      const playerId = playerKeyFromName(safePlayerName);
      const playerRef = this.db.ref(`rooms/${cleanCode}/players/${playerId}`);
      const playerSnap = await playerRef.get();

      if (playerSnap.exists()) {
        await playerRef.update({
          name: safePlayerName,
          isConnected: true,
          lastSeenAt: Date.now()
        });
        return { code: cleanCode, playerId };
      }

      const player = {
        name: safePlayerName,
        score: 0,
        streak: 0,
        operationIndex: 0,
        correctCount: 0,
        wrongCount: 0,
        isConnected: true,
        lastSeenAt: Date.now()
      };
      await playerRef.set(player);
      return { code: cleanCode, playerId };
    },
    async startRoom(code) {
      await requireOnline(this);
      await this.db.ref(`rooms/${normalizeRoomCode(code)}`).update({
        status: "running",
        startedAt: Date.now()
      });
    },
    async resetRoom(code, { config, durationSeconds } = {}) {
      await requireOnline(this);
      const cleanCode = normalizeRoomCode(code);
      const roomSnap = await this.db.ref(`rooms/${cleanCode}`).get();
      if (!roomSnap.exists()) throw new Error("La sala no existe.");

      const updates = {
        status: "lobby",
        seed: Math.floor(Math.random() * 2147483647),
        startedAt: null,
        rematchAt: Date.now()
      };
      if (Number.isFinite(Number(durationSeconds))) updates.durationSeconds = Number(durationSeconds);
      if (config) updates.config = JSON.stringify(config);

      const players = roomSnap.child("players").val() || {};
      Object.keys(players).forEach((playerId) => {
        updates[`players/${playerId}/score`] = 0;
        updates[`players/${playerId}/streak`] = 0;
        updates[`players/${playerId}/operationIndex`] = 0;
        updates[`players/${playerId}/correctCount`] = 0;
        updates[`players/${playerId}/wrongCount`] = 0;
        updates[`players/${playerId}/lastResult`] = null;
        updates[`players/${playerId}/lastAnswer`] = null;
        updates[`players/${playerId}/lastActionAt`] = null;
        updates[`players/${playerId}/lastSeenAt`] = Date.now();
      });

      await this.db.ref(`rooms/${cleanCode}`).update(updates);
    },
    async finishRoom(code) {
      await requireOnline(this);
      await this.db.ref(`rooms/${normalizeRoomCode(code)}`).update({
        status: "finished"
      });
    },
    async getRoom(code) {
      await requireOnline(this);
      const snap = await this.db.ref(`rooms/${normalizeRoomCode(code)}`).get();
      return snap.val();
    },
    async updatePlayer(code, playerId, patch) {
      await requireOnline(this);
      await this.db.ref(`rooms/${normalizeRoomCode(code)}/players/${playerId}`).update({
        ...patch,
        lastSeenAt: Date.now()
      });
    },
    subscribeRoom(code, callback) {
      if (!this.enabled) throw new Error("Firebase no está inicializado.");
      const ref = this.db.ref(`rooms/${normalizeRoomCode(code)}`);
      ref.on("value", (snap) => callback(snap.val()));
      return () => ref.off();
    }
  };

  window.NinjaOnline = online;

  function normalizeRoomCode(code) {
    return String(code || "").trim().toUpperCase();
  }

  function truncateGraphemes(value, maxLength) {
    return Array.from(String(value || "")).slice(0, maxLength).join("");
  }

  function playerKeyFromName(name) {
    const normalized = String(name || "Ninja").trim().toLocaleLowerCase("es");
    let hash = 5381;
    for (const char of Array.from(normalized)) {
      hash = ((hash << 5) + hash) + char.codePointAt(0);
      hash >>>= 0;
    }
    return `p_${hash.toString(36)}`;
  }

  async function requireOnline(client) {
    const ready = await client.init();
    if (!ready) throw new Error("Firebase no está configurado. Revisa firebase-config.js.");
  }

  async function createUniqueRoomCode(db) {
    for (let i = 0; i < 20; i += 1) {
      const code = String(Math.floor(100000 + Math.random() * 900000));
      const snap = await db.ref(`rooms/${code}`).get();
      if (!snap.exists()) return code;
    }
    throw new Error("No se pudo crear un código de sala único.");
  }

  function loadOptionalScript(src) {
    return loadScript(src, true);
  }

  function loadRequiredScript(src) {
    return loadScript(src, false);
  }

  function loadScript(src, optional) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[data-dynamic-src="${src}"]`)) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.dataset.dynamicSrc = src;
      script.onload = () => resolve(true);
      script.onerror = () => optional ? resolve(false) : reject(new Error(`No se pudo cargar ${src}`));
      document.head.appendChild(script);
    });
  }
}());
