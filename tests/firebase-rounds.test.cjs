const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const root = { secureRooms: { 'ABCDEFGH': { seed: 123, createdAt: Date.now(), status: 'lobby', players: {} } } };
const valueAt = path => path.split('/').filter(Boolean).reduce((v, k) => v?.[k], root);
const setAt = (path, value) => { const keys = path.split('/').filter(Boolean), last = keys.pop(); let node = root; for (const k of keys) node = node[k] ||= {}; if (value === null) delete node[last]; else node[last] = value; };
const snapshot = value => ({ val: () => value, exists: () => value !== undefined && value !== null, child: key => snapshot(value?.[key]) });
let disconnects = 0, connectionListener;
const db = { ref(path) { return {
  child: key => db.ref(path+'/'+key), get: async () => snapshot(valueAt(path)), set: async value => setAt(path, value),
  update: async patch => {
    const own = path.match(/^secureRooms\/([^/]+)\/players\/([^/]+)$/);
    if (own && ('score' in patch || 'roundSeed' in patch)) {
      const current = valueAt(path);
      if (!current?.name || ('roundSeed' in patch && patch.roundSeed !== valueAt(`secureRooms/${own[1]}/seed`))) { const error = Error('Permission denied'); error.code = 'PERMISSION_DENIED'; throw error; }
    }
    for (const [key, value] of Object.entries(patch)) setAt(path + '/' + key, value);
  },
  transaction: async callback => { const value = callback(valueAt(path)); if (value === undefined) return { committed: false }; setAt(path, value); return { committed: true }; },
  onDisconnect: () => ({ update: async () => { disconnects++; } }),
  on: (_, fn) => { connectionListener = fn; }, off: () => { connectionListener = null; }, remove: async () => setAt(path, null)
}; } };
const database = () => db; database.ServerValue = { TIMESTAMP: { '.sv': 'timestamp' } };
const window = { firebase: { database }, crypto: require('node:crypto').webcrypto };
vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname, '..', 'firebase-online.js'), 'utf8'), { window, Date, Math, console });
const api = window.NinjaOnline; api.enabled = true; api.db = db; api.auth={currentUser:{uid:'pupil-paco'}};
(async () => {
  const joined = await api.joinRoom('ABCDEFGH', 'Paco 🥷');
  assert.equal(root.secureRooms['ABCDEFGH'].players[joined.playerId].roundSeed, 123);
  await api.updatePlayer('ABCDEFGH', joined.playerId, { score: 10, correctCount: 1, learningStats: { missing: { correct: 1 } } }, 123);
  assert.equal(root.secureRooms['ABCDEFGH'].players[joined.playerId].score, 10);
  await api.startRoom('ABCDEFGH'); assert.ok(root.secureRooms['ABCDEFGH'].startedAt >= Date.now() + 2900);
  await api.resetRoom('ABCDEFGH', { config: { endCondition: 'correct', goalCount: 5 }, durationSeconds: 0 });
  const p = root.secureRooms['ABCDEFGH'].players[joined.playerId], seed = root.secureRooms['ABCDEFGH'].seed;
  assert.equal(p.score, 0); assert.equal(p.correctCount, 0); assert.equal(p.isFinished, false); assert.equal(p.learningStats, undefined); assert.equal(p.roundSeed, seed);
  const stale = await api.updatePlayer('ABCDEFGH', joined.playerId, { score: 999, correctCount: 99 }, 123);
  assert.equal(stale.committed, false); assert.equal(p.score, 0);
  await api.updatePlayer('ABCDEFGH', joined.playerId, { score: 20, correctCount: 2 }, seed);
  assert.equal(root.secureRooms['ABCDEFGH'].players[joined.playerId].score, 20);
  await api.setPresence('ABCDEFGH', joined.playerId); assert.ok(disconnects >= 2);
  const states = [], off = api.watchConnection(value => states.push(value)); connectionListener(snapshot(false)); connectionListener(snapshot(true)); off();
  assert.deepEqual(states, [false, true]); assert.equal(connectionListener, null);
  const rejoined = await api.joinRoom('ABCDEFGH', 'Paco 🥷'); assert.equal(rejoined.playerId, joined.playerId); assert.equal(Object.keys(root.secureRooms['ABCDEFGH'].players).length, 1);
  await api.removePlayer('ABCDEFGH', joined.playerId); const removed = await api.updatePlayer('ABCDEFGH', joined.playerId, { score: 999 }, seed);
  assert.equal(removed.committed, false); assert.equal(Object.keys(root.secureRooms['ABCDEFGH'].players).length, 0);
  root.secureRooms['ABCDEFGH'].players[joined.playerId] = { isConnected: false };
  const ghost = await api.updatePlayer('ABCDEFGH', joined.playerId, { name: 'Paco', score: 999 }, seed);
  assert.equal(ghost.committed, false);
  await api.setPresence('ABCDEFGH', joined.playerId);
  assert.equal(root.secureRooms['ABCDEFGH'].players[joined.playerId].isConnected, false);
  assert.equal(root.secureRooms['ABCDEFGH'].durationSeconds, 0);
  console.log('OK: Firebase simulated rounds, reset statistics, server-validated seed updates, late updates, reconnection presence, same-name rejoin and removed players.');
})().catch(error => { console.error(error); process.exitCode = 1; });
