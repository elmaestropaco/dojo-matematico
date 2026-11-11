(function () {
  const VERSION = '10.12.5', COLLECTION = 'secureRooms', ROOM_LIFETIME = 43200000;
  const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789', scriptLoads = new Map();
  const online = {
    enabled: false, app: null, db: null, auth: null, serverOffset: 0, initializing: null,
    async init() {
      if (this.enabled && this.auth?.currentUser) return true;
      if (this.initializing) return this.initializing;
      this.initializing = (async () => {
        if (!await loadScript('firebase-config.js', true) || !window.NINJA_FIREBASE_CONFIG) return false;
        for (const sdk of ['app', 'auth', 'database']) {
          try { await loadScript(`assets/vendor/firebase-${VERSION}/firebase-${sdk}-compat.js`); }
          catch { await loadScript(`https://www.gstatic.com/firebasejs/${VERSION}/firebase-${sdk}-compat.js`); }
          const service = sdk === 'app' ? 'initializeApp' : sdk;
          if (typeof window.firebase?.[service] !== 'function') throw Error(`No se pudo cargar Firebase ${sdk}. Recarga la app y comprueba que has subido la carpeta assets completa.`);
        }
        this.app = window.firebase.apps?.find(a => a.name === '[DEFAULT]') || window.firebase.initializeApp(window.NINJA_FIREBASE_CONFIG);
        this.auth = window.firebase.auth(this.app);
        try { await this.auth.setPersistence(window.firebase.auth.Auth.Persistence.LOCAL); } catch { /* Use the persistence fallback supported by the browser. */ }
        const restored = await new Promise((resolve, reject) => { let off = () => {}; off = this.auth.onAuthStateChanged(user => { off(); resolve(user); }, reject); });
        if (!restored) await this.auth.signInAnonymously();
        this.db = window.firebase.database(this.app);
        const offset = await this.db.ref('.info/serverTimeOffset').get().catch(() => null);
        this.serverOffset = Number(offset?.val()) || 0; this.enabled = true; return true;
      })();
      try { return await this.initializing; } finally { this.initializing = null; }
    },
    now() { return Date.now() + this.serverOffset; },
    uid() { const uid = this.auth?.currentUser?.uid; if (!uid) throw Error('No hay identidad autenticada. Recarga la app.'); return uid; },
    roomRef(code) { return this.db.ref(`${COLLECTION}/${normalizeRoomCode(code)}`); },
    async createRoom({ mode, config, durationSeconds, hostName }) {
      await requireOnline(this);
      for (let attempt = 0; attempt < 12; attempt++) {
        const code = newRoomCode(), room = { schemaVersion: 2, hostUid: this.uid(), mode, status: 'lobby', seed: randomSeed(), durationSeconds,
          hostName: playerName(hostName || 'Profe'), config: JSON.stringify({...config,teamAssignments:{}}), createdAt: window.firebase.database.ServerValue.TIMESTAMP, expiresAt: this.now() + ROOM_LIFETIME };
        try { await this.roomRef(code).set(room); return { code, room }; }
        catch (error) { if (!permissionDenied(error) || attempt === 11) throw error; }
      }
      throw Error('No se ha podido reservar un código de sala.');
    },
    async joinRoom(code, name) {
      await requireOnline(this);
      const cleanCode = normalizeRoomCode(code), uid = this.uid(), roomRef = this.roomRef(cleanCode), ref = roomRef.child(`players/${uid}`);
      let known;
      try { known = (await roomRef.get()).val(); } catch (error) { if (!permissionDenied(error)) throw error; }
      if (known?.hostUid === uid && known.mode === 'teacher') return { code: cleanCode, playerId: null, isHost: true, isTeacher: true };
      try {
        const own = await ref.get();
        if (own.exists()) await ref.update({ name: playerName(name), isConnected: true, lastSeenAt: this.now() });
        else await ref.set({ name: playerName(name), score: 0, streak: 0, operationIndex: 0, correctCount: 0, wrongCount: 0, resolvedCount: 0,
          roundSeed: 0, isConnected: true, isFinished: false, lastSeenAt: this.now() });
        const room = await this.getRoom(cleanCode);
        // Enrollment does not require exposing the roster to a nonmember.
        await ref.update({ roundSeed: room.seed }); await this.setPresence(cleanCode, uid);
        return { code: cleanCode, playerId: uid, isHost: room.hostUid === uid, isTeacher: false };
      } catch (error) { if (permissionDenied(error)) throw Error('Código incorrecto, sala cerrada o caducada, o acceso retirado por el anfitrión.'); throw error; }
    },
    async startRoom(code) { await requireOnline(this); await this.roomRef(code).update({ status: 'running', startedAt: this.now() + 3000, pausedAt: null, pausedTotal: 0, pausedQuestion: null, pauseRevealed: null, expiresAt: this.now() + ROOM_LIFETIME }); },
    async resetRoom(code, { config, durationSeconds } = {}) {
      await requireOnline(this);
      const ref = this.roomRef(code), snapshot = await ref.get(); if (!snapshot.exists()) throw Error('La sala no existe.');
      let seed = randomSeed(); if (seed === snapshot.val().seed) seed = (seed + 1) % 2147483647;
      const patch = { status: 'lobby', seed, startedAt: null, pausedAt: null, pausedTotal: 0, pausedQuestion: null, pauseRevealed: null, rematchAt: this.now(), expiresAt: this.now() + ROOM_LIFETIME };
      if (Number.isFinite(Number(durationSeconds))) patch.durationSeconds = Number(durationSeconds);
      if (config) patch.config = JSON.stringify(config);
      for (const uid of Object.keys(snapshot.child('players').val() || {})) {
        const cleared = { score: 0, streak: 0, operationIndex: 0, correctCount: 0, wrongCount: 0, resolvedCount: 0, learningStatsJSON: null,
          pendingFollowUpFrom: null, assistedOperationIndex: null, isFinished: false, roundSeed: seed, lastResult: null, lastAnswer: null, lastActionAt: null, lastSeenAt: this.now() };
        for (const [key, value] of Object.entries(cleared)) patch[`players/${uid}/${key}`] = value;
      }
      await ref.update(patch);
    },
    async finishRoom(code) { await requireOnline(this); await this.roomRef(code).update({ status: 'finished', pausedAt:null, pausedQuestion:null, pauseRevealed:null }); },
    async controlRound(code,action,question={}) {
      await requireOnline(this);
      const result=await transactRoom(this,code,room=>{
        if(!room||room.hostUid!==this.uid()||room.status!=='running')return;
        const now=Math.round(this.now());if(now<Number(room.startedAt||0))return;
        if(action==='pause') { if(room.pausedAt)return room;room.pausedAt=now;room.pauseRevealed=false; }
        else if(action==='resume') { if(!room.pausedAt)return room;room.pausedTotal=Math.min(86400000,(Number(room.pausedTotal)||0)+Math.round(Math.max(0,now-room.pausedAt)));delete room.pausedAt;delete room.pausedQuestion;delete room.pauseRevealed;return room; }
        else if(!room.pausedAt)return;
        if(action==='reveal'){
          room.pauseRevealed=true;let q;try{q=JSON.parse(room.pausedQuestion);}catch{q={};}
          for(const p of Object.values(room.players||{}))if(!p.isFinished&&p.operationIndex===q.index&&(q.followUpFrom!==undefined?p.pendingFollowUpFrom===q.followUpFrom:p.pendingFollowUpFrom===undefined||p.pendingFollowUpFrom===null))p.assistedOperationIndex=p.operationIndex;
        }
        else if(action==='pause'||action==='question') {
          room.pausedQuestion=JSON.stringify({index:Math.max(0,Math.min(99999,Math.trunc(Number(question.index))||0)),...(Number.isInteger(question.followUpFrom)&&question.followUpFrom>=0?{followUpFrom:Math.min(99999,question.followUpFrom)}:{})});room.pauseRevealed=false;
        } else return;
        return room;
      });
      if(!result.committed)throw Error('La ronda cambió o todavía está en la cuenta atrás.');
    },
    async setTeams(code,{count=2,names,assignments,reshuffle=false,fillOnly=false}={},expectedSeed) {
      await requireOnline(this);
      const result=await transactRoom(this,code,room=>{
        if(!room||room.hostUid!==this.uid()||(expectedSeed!==undefined&&room.seed!==expectedSeed))return;
        if(room.status==='running'&&!fillOnly)return;
        let cfg;try{cfg=JSON.parse(room.config);}catch{return;}
        const opt=window.NinjaDynamics.options({...cfg,...(fillOnly?{}:{teamCount:count,teamNames:names||cfg.teamNames})});if(!cfg.teamsEnabled)return;
        const current=fillOnly?cfg.teamAssignments||{}:assignments||cfg.teamAssignments||{};
        cfg.teamCount=opt.teamCount;cfg.teamNames=opt.teamNames;cfg.teamAssignments=window.NinjaDynamics.assign(room.players,opt.teamCount,current,reshuffle&&!fillOnly);
        room.config=JSON.stringify(cfg);return room;
      });
      return result.committed;
    },
    async saveLobbyConfig(code,config,expectedSeed) {
      await requireOnline(this);
      const result=await transactRoom(this,code,room=>{if(!room||room.status!=='lobby'||room.seed!==expectedSeed)return;let old={};try{old=JSON.parse(room.config);}catch{}room.config=JSON.stringify({...config,teamAssignments:old.teamAssignments||config.teamAssignments||{}});return room;});
      return result.committed;
    },
    async getRoom(code) { await requireOnline(this); return decodeRoom((await this.roomRef(code).get()).val()); },
    async updatePlayer(code, uid, patch, expectedSeed) {
      await requireOnline(this); if (uid !== this.uid()) throw Error('Solo puedes actualizar tu propio progreso.');
      const wire = { ...patch, lastSeenAt: this.now() };
      if ('learningStats' in wire) { wire.learningStatsJSON = JSON.stringify(cleanStats(wire.learningStats)); delete wire.learningStats; }
      const ref = this.roomRef(code).child(`players/${uid}`);
      if (expectedSeed !== undefined) {
        // The rules compare this seed atomically with the current room, without relying on an SDK cache.
        wire.roundSeed = expectedSeed;
        try { await ref.update(wire); return { committed: true }; }
        catch (error) {
          if (permissionDenied(error)) {
            const current = await ref.get().catch(() => null);
            if (!current?.val()?.name || current.val().roundSeed !== expectedSeed) return { committed: false };
          }
          throw error;
        }
      }
      await ref.update(wire);
    },
    async removePlayer(code, uid) { await requireOnline(this); await this.roomRef(code).update({ [`blocked/${uid}`]: true, [`players/${uid}`]: null }); },
    async allowPlayer(code, uid) { await requireOnline(this); await this.roomRef(code).child(`blocked/${uid}`).remove(); },
    async deleteRoom(code) { await requireOnline(this); await this.roomRef(code).remove(); },
    watchConnection(callback) { const ref = this.db.ref('.info/connected'), listener = snap => callback(snap.val() === true); ref.on('value', listener); return () => ref.off('value', listener); },
    async setPresence(code, uid) {
      await requireOnline(this); if (uid !== this.uid()) throw Error('Identidad de participante incorrecta.');
      const ref = this.roomRef(code).child(`players/${uid}`), snapshot = await ref.get(); if (!snapshot.val()?.name) return;
      await ref.onDisconnect().update({ isConnected: false, lastSeenAt: window.firebase.database.ServerValue.TIMESTAMP });
      await ref.update({ isConnected: true, lastSeenAt: this.now() });
    },
    subscribeRoom(code, callback, onError) {
      if (!this.enabled) throw Error('Firebase no está inicializado.');
      const ref = this.roomRef(code), listener = snap => callback(decodeRoom(snap.val()));
      ref.on('value', listener, error => { if (onError) onError(error); }); return () => ref.off('value', listener);
    }
  };
  function normalizeRoomCode(value) {
    const code = String(value || '').trim().toUpperCase().replace(/[\s-]/g, '');
    if (!/^[A-Z2-9]{8}$/.test(code)) throw Error('Los códigos seguros tienen 8 letras o números. Las salas antiguas de 6 cifras ya no se admiten.'); return code;
  }
  function randomSeed() { const bytes = new Uint32Array(1); window.crypto.getRandomValues(bytes); return bytes[0] % 2147483647; }
  function newRoomCode() {
    let code = ''; const threshold = 256 - 256 % ALPHABET.length;
    while (code.length < 8) { const bytes = new Uint8Array(16); window.crypto.getRandomValues(bytes); for (const byte of bytes) if (byte < threshold && code.length < 8) code += ALPHABET[byte % ALPHABET.length]; }
    return code;
  }
  function playerName(value) {
    const name = String(value || 'Ninja').trim() || 'Ninja';
    const segments = typeof Intl.Segmenter === 'function' ? Array.from(new Intl.Segmenter('es', { granularity: 'grapheme' }).segment(name), s => s.segment) : Array.from(name);
    let text = ''; for (const piece of segments.slice(0, 24)) { if (text.length + piece.length > 100) break; text += piece; } return text || 'Ninja';
  }
  function permissionDenied(error) { return /permission.?denied/i.test(error?.code || '') || /permission denied/i.test(error?.message || ''); }
  function cleanStats(input) {
    const stats = Object.create(null);
    for (const [key, value] of Object.entries(input && typeof input === 'object' ? input : {}).slice(0, 64)) {
      if (!/^[A-Za-z0-9_]{1,120}$/.test(key) || ['__proto__', 'constructor', 'prototype'].includes(key) || !value || typeof value !== 'object') continue;
      stats[key] = {};
      for (const field of ['correct', 'wrong', 'hints', 'solutions', 'skips', 'assistedCorrect']) stats[key][field] = Number.isFinite(Number(value[field])) ? Math.min(100000, Math.max(0, Math.trunc(Number(value[field])))) : 0;
    }
    return stats;
  }
  function decodeRoom(value) {
    if (!value) return null; const room = { ...value, players: {} };
    for (const [uid, raw] of Object.entries(value.players || {})) { let stats = {}; try { stats = JSON.parse(raw.learningStatsJSON || '{}'); } catch { /* Ignore untrusted malformed statistics. */ } room.players[uid] = { ...raw, learningStats: cleanStats(stats) }; delete room.players[uid].learningStatsJSON; }
    return room;
  }
  async function transactRoom(client,code,change) {
    const ref=client.roomRef(code);let listener;
    try {
      const snapshot=await new Promise((resolve,reject)=>{listener=s=>resolve(s);ref.on('value',listener,reject);});
      if(snapshot.val()?.hostUid!==client.uid())throw Error('Solo el anfitrion puede controlar la sala.');
      // Keep the listener until commit: a one-shot read can release the SDK's cached node.
      return await ref.transaction(room=>room?change(room):undefined,undefined,false);
    } finally {if(listener)ref.off('value',listener);}
  }
  async function requireOnline(client) { if (!await client.init()) throw Error('Firebase no está configurado. Revisa firebase-config.js.'); }
  function loadScript(src, optional = false) {
    if (scriptLoads.has(src)) return scriptLoads.get(src);
    const promise = new Promise((resolve, reject) => { const script = document.createElement('script'); script.src = src; script.async = true; script.dataset.dynamicSrc = src;
      script.onload = () => resolve(true); script.onerror = () => optional ? resolve(false) : reject(Error(`No se pudo cargar ${src}`)); document.head.appendChild(script); });
    scriptLoads.set(src, promise); return promise;
  }
  window.NinjaOnline = online;
}());
