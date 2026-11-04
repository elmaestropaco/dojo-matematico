const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { initializeTestEnvironment, assertSucceeds, assertFails } = require('@firebase/rules-unit-testing');
const { ref, get, set, update, remove } = require('firebase/database');
const CODE = 'ABCDEFGH', ROOM = `secureRooms/${CODE}`;
const room = (hostUid = 'teacher-owner') => ({ schemaVersion: 2, hostUid, mode: 'teacher', status: 'lobby', seed: 123, durationSeconds: 60, hostName: 'Profe', config: '{}', createdAt: Date.now(), expiresAt: Date.now() + 43200000 });
const player = name => ({ name, score: 0, streak: 0, operationIndex: 0, correctCount: 0, wrongCount: 0, resolvedCount: 0, roundSeed: 0, isConnected: true, isFinished: false, lastSeenAt: Date.now() });
let checks = 0;
async function allowed(promise) { await assertSucceeds(promise); checks++; }
async function denied(promise) { await assertFails(promise); checks++; }
async function main() {
  const env = await initializeTestEnvironment({ projectId: 'demo-dojo-security', database: { host: '127.0.0.1', port: 9000, rules: fs.readFileSync(path.resolve(__dirname, '../../firebase/database.rules.json'), 'utf8') } });
  try {
    await env.clearDatabase();
    const host = env.authenticatedContext('teacher-owner').database(), alice = env.authenticatedContext('student-alice').database(), bob = env.authenticatedContext('student-bob').database();
    const outsider = env.authenticatedContext('outsider').database(), guest = env.unauthenticatedContext().database();
    await denied(set(ref(guest, ROOM), room()));
    await denied(set(ref(alice, ROOM), room()));
    await denied(set(ref(host, 'rooms/123456'), room()));
    await denied(set(ref(host, 'secureRooms/123456'), room()));
    await allowed(set(ref(host, ROOM), room()));
    for (const db of [guest, outsider, alice]) { await denied(get(ref(db, ROOM))); await denied(get(ref(db, 'secureRooms'))); await denied(get(ref(db, 'rooms'))); }
    await allowed(get(ref(host, ROOM)));
    await denied(get(ref(host, 'secureRooms')));
    await allowed(get(ref(alice, `${ROOM}/players/student-alice`)));
    await denied(set(ref(alice, `${ROOM}/players/student-bob`), player('Bob')));
    await denied(set(ref(alice, `${ROOM}/players/student-alice`), { ...player('Alice'), score: 100 }));
    await denied(set(ref(alice, `${ROOM}/players/student-alice`), { ...player('Alice'), hostUid: 'student-alice' }));
    await allowed(set(ref(alice, `${ROOM}/players/student-alice`), player('Alice 🥷')));
    await allowed(update(ref(alice, `${ROOM}/players/student-alice`), { roundSeed: 123 }));
    await allowed(get(ref(alice, ROOM)));
    await allowed(update(ref(alice, `${ROOM}/players/student-alice`), { score: 10, correctCount: 1, learningStatsJSON: JSON.stringify({ missing: { correct: 1 } }) }));
    await denied(update(ref(alice, `${ROOM}/players/student-alice`), { score: -5 }));
    await denied(update(ref(alice, `${ROOM}/players/student-alice`), { score: 1.5 }));
    await denied(update(ref(alice, `${ROOM}/players/student-alice`), { learningStatsJSON: 'x'.repeat(16001) }));
    await denied(update(ref(alice, `${ROOM}/players/student-alice`), { learningStats: { missing: { correct: 1 } } }));
    await denied(remove(ref(alice, `${ROOM}/players/student-alice`)));
    for (const patch of [{ status: 'finished' }, { seed: 456 }, { config: '{"tampered":true}' }, { hostUid: 'student-alice' }, { expiresAt: Date.now() + 40000 }, { 'blocked/teacher-owner': true }]) await denied(update(ref(alice, ROOM), patch));
    await denied(update(ref(alice, ROOM), { 'players/student-alice/score': 20, status: 'finished' }));
    assert.equal((await get(ref(host, `${ROOM}/players/student-alice/score`))).val(), 10);
    await denied(update(ref(host, ROOM), { hostUid: 'student-alice' }));
    await denied(update(ref(host, ROOM), { unexpected: 'data' }));
    await denied(update(ref(host, ROOM), { config: 'x'.repeat(24001) }));
    await allowed(update(ref(host, ROOM), { status: 'running', startedAt: Date.now() + 3000 }));
    await allowed(set(ref(bob, `${ROOM}/players/student-bob`), player('Bob 🌟')));
    await allowed(update(ref(bob, `${ROOM}/players/student-bob`), { roundSeed: 123 }));
    await denied(update(ref(alice, `${ROOM}/players/student-bob`), { score: 999 }));
    await denied(update(ref(bob, `${ROOM}/players/student-alice`), { name: 'Impostor' }));
    await allowed(update(ref(host, ROOM), { seed: 456, status: 'lobby', 'players/student-alice/roundSeed': 456, 'players/student-alice/score': 0, 'players/student-alice/correctCount': 0, 'players/student-bob/roundSeed': 456 }));
    await denied(update(ref(alice, `${ROOM}/players/student-alice`), { roundSeed: 123, score: 999 }));
    await allowed(update(ref(alice, `${ROOM}/players/student-alice`), { roundSeed: 456, score: 20, correctCount: 2 }));
    await allowed(update(ref(host, ROOM), { 'blocked/student-alice': true, 'players/student-alice': null }));
    await denied(get(ref(alice, ROOM)));
    await denied(set(ref(alice, `${ROOM}/players/student-alice`), player('Alice')));
    await denied(update(ref(alice, ROOM), { 'blocked/student-alice': null }));
    await allowed(remove(ref(host, `${ROOM}/blocked/student-alice`)));
    await allowed(set(ref(alice, `${ROOM}/players/student-alice`), player('Alice')));
    await allowed(update(ref(alice, `${ROOM}/players/student-alice`), { roundSeed: 456 }));
    await allowed(update(ref(host, ROOM), { status: 'finished' }));
    await denied(set(ref(outsider, `${ROOM}/players/outsider`), player('Late outsider')));
    await allowed(update(ref(alice, `${ROOM}/players/student-alice`), { isFinished: true }));
    await allowed(get(ref(bob, ROOM)));
    await env.withSecurityRulesDisabled(async context => { await set(ref(context.database(), `${ROOM}/expiresAt`), Date.now() - 10000); await set(ref(context.database(), 'rooms/123456'), { players: { old: { name: 'Legacy pupil' } } }); });
    await denied(get(ref(alice, ROOM))); await denied(update(ref(alice, `${ROOM}/players/student-alice`), { score: 30 }));
    await denied(get(ref(host, 'rooms/123456'))); await denied(get(ref(guest, 'rooms/123456')));
    await allowed(get(ref(host, ROOM)));
    await allowed(update(ref(host, ROOM), { expiresAt: Date.now() + 43200000, status: 'lobby' }));
    await allowed(get(ref(alice, ROOM)));
    await denied(update(ref(host, ROOM), { expiresAt: Date.now() + 172800000 }));
    await allowed(remove(ref(host, ROOM)));
    await denied(get(ref(alice, ROOM)));
    console.log(`OK: ${checks} real Realtime Database emulator authorization checks: public access, owner, membership, impersonation, invitations, validation, reset, old seeds, kicks, expiry and legacy rooms.`);
  } finally { await env.cleanup(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
