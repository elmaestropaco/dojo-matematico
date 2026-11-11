(function (root) {
  const KEY = 'ninja_math_sessions_v1';
  const cleanName = value => String(value || '').trim().replace(/\s+/g, ' ').slice(0, 60);
  function cleanConfig(value) {
    const config = {};
    if (!value || typeof value !== 'object') return config;
    for (const key of ['progressiveEnabled','teamsEnabled','teamCount','teamNames','activity', 'endCondition', 'goalCount', 'problemMix', 'problemSettings', 'operationSettings', 'displayMode', 'streaksEnabled', 'decimalsEnabled', 'decimalPlaces', 'allowNegative', 'penalizeWrong', 'timePreset', 'customMinutes', 'customSeconds']) {
      if (Object.hasOwn(value, key)) config[key] = JSON.parse(JSON.stringify(value[key], (k, v) => ['__proto__', 'constructor', 'prototype'].includes(k) ? undefined : v));
    }
    return config;
  }
  function create(storage) {
    let memory = { version: 1, sessions: [], favorites: [] }, persistent = true;
    try {
      const saved = JSON.parse(storage.getItem(KEY) || 'null');
      if (saved?.version === 1 && Array.isArray(saved.sessions) && Array.isArray(saved.favorites)) {
        memory.sessions = saved.sessions.filter(s => typeof s.id === 'string' && s.id.length < 90 && cleanName(s.name) && s.config && typeof s.config === 'object').slice(0, 30).map(s => ({ id: s.id, name: cleanName(s.name), favorite: s.favorite === true, config: cleanConfig(s.config) }));
        memory.favorites = [...new Set(saved.favorites.filter(s => typeof s === 'string' && /^(calc|problem|geo):[a-zA-Z0-9_-]+$/.test(s)))].slice(0, 80);
      }
    } catch { persistent = false; }
    const copy = value => JSON.parse(JSON.stringify(value));
    function commit() { try { storage.setItem(KEY, JSON.stringify(memory)); persistent = true; } catch { persistent = false; } }
    return {
      list: () => copy(memory.sessions), favorites: () => [...memory.favorites], persistent: () => persistent,
      save(name, config, replaceId) {
        name = cleanName(name); if (!name) throw Error('Escribe un nombre para la sesión.');
        const existing = memory.sessions.find(s => s.id === replaceId);
        if (!existing && memory.sessions.length >= 30) throw Error('Puedes guardar hasta 30 sesiones. Elimina una antes de añadir otra.');
        const session = { id: existing?.id || `${Date.now()}-${Math.random().toString(36).slice(2)}`, name, favorite: existing?.favorite || false, config: cleanConfig(config) };
        if (existing) memory.sessions[memory.sessions.indexOf(existing)] = session; else memory.sessions.push(session);
        commit(); return copy(session);
      },
      remove(id) { memory.sessions = memory.sessions.filter(s => s.id !== id); commit(); },
      star(id) { const session = memory.sessions.find(s => s.id === id); if (session) { session.favorite = !session.favorite; commit(); } },
      toggleFavorite(key) {
        if (!/^(calc|problem|geo):[a-zA-Z0-9_-]+$/.test(key)) return;
        if (memory.favorites.includes(key)) memory.favorites = memory.favorites.filter(k => k !== key);
        else if (memory.favorites.length < 80) memory.favorites.push(key);
        commit();
      }
    };
  }
  root.NinjaSessions = { create, cleanConfig, cleanName, KEY };
  if (typeof module !== 'undefined') module.exports = root.NinjaSessions;
}(globalThis));
