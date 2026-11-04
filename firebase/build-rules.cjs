const fs = require('node:fs');
const path = require('node:path');
const active = "root.child('secureRooms').child($room).child('schemaVersion').val() === 2 && root.child('secureRooms').child($room).child('expiresAt').val() > now && !root.child('secureRooms').child($room).child('blocked').child(auth.uid).exists()";
const number = max => ({ '.validate': `newData.isNumber() && newData.val() >= 0 && newData.val() <= ${max} && newData.val() % 1 === 0` });
const text = max => ({ '.validate': `newData.isString() && newData.val().length <= ${max}` });
const bool = { '.validate': 'newData.isBoolean()' };
const timestamp = { '.validate': 'newData.isNumber() && newData.val() >= 0 && newData.val() <= now + 120000' };
const rules = { rules: { '.read': false, '.write': false, secureRooms: { '$room': {
  '.read': "auth !== null && data.child('schemaVersion').val() === 2 && (data.child('hostUid').val() === auth.uid || (data.child('expiresAt').val() > now && data.child('players').child(auth.uid).exists() && !data.child('blocked').child(auth.uid).exists()))",
  '.write': "auth !== null && $room.matches(/^[A-Z2-9]{8}$/) && ((!data.exists() && newData.exists() && newData.child('hostUid').val() === auth.uid && newData.child('schemaVersion').val() === 2 && newData.child('status').val() === 'lobby' && !newData.child('players').exists() && !newData.child('blocked').exists()) || (data.child('schemaVersion').val() === 2 && data.child('hostUid').val() === auth.uid))",
  '.validate': "newData.hasChildren(['schemaVersion', 'hostUid', 'mode', 'status', 'seed', 'durationSeconds', 'hostName', 'config', 'createdAt', 'expiresAt']) && (!data.exists() || (newData.child('hostUid').val() === data.child('hostUid').val() && newData.child('createdAt').val() === data.child('createdAt').val()))",
  schemaVersion: { '.validate': 'newData.val() === 2' },
  hostUid: { '.validate': 'newData.isString() && newData.val().length > 0 && newData.val().length <= 128' },
  mode: { '.validate': "newData.val() === 'teacher' || newData.val() === 'duel_online'" },
  status: { '.validate': "newData.val() === 'lobby' || newData.val() === 'running' || newData.val() === 'finished'" },
  seed: number(2147483646), durationSeconds: number(86400), hostName: text(100), config: text(24000),
  createdAt: timestamp, startedAt: timestamp, rematchAt: timestamp,
  expiresAt: { '.validate': 'newData.isNumber() && newData.val() > now && newData.val() <= now + 86400000' },
  blocked: { '$uid': { '.validate': 'newData.val() === true' } },
  players: { '$uid': {
    '.read': `auth !== null && $uid === auth.uid && ${active}`,
    '.write': `auth !== null && $uid === auth.uid && newData.exists() && ${active} && (data.exists() || ((root.child('secureRooms').child($room).child('status').val() === 'lobby' || root.child('secureRooms').child($room).child('status').val() === 'running') && newData.child('score').val() === 0 && newData.child('streak').val() === 0 && newData.child('operationIndex').val() === 0 && newData.child('correctCount').val() === 0 && newData.child('wrongCount').val() === 0 && newData.child('resolvedCount').val() === 0 && newData.child('roundSeed').val() === 0 && newData.child('isConnected').val() === true && newData.child('isFinished').val() === false && !newData.child('learningStatsJSON').exists() && !newData.child('pendingFollowUpFrom').exists() && !newData.child('lastAnswer').exists() && !newData.child('lastResult').exists() && !newData.child('lastActionAt').exists()))`,
    '.validate': "newData.hasChildren(['name', 'score', 'streak', 'operationIndex', 'correctCount', 'wrongCount', 'resolvedCount', 'roundSeed', 'isConnected', 'isFinished', 'lastSeenAt'])",
    name: { '.validate': 'newData.isString() && newData.val().length > 0 && newData.val().length <= 100' },
    score: number(1000000), streak: number(100000), operationIndex: number(100000), correctCount: number(100000), wrongCount: number(100000), resolvedCount: number(100000),
    roundSeed: { '.validate': "newData.isNumber() && ((!data.parent().exists() && newData.val() === 0) || newData.val() === newData.parent().parent().parent().child('seed').val())" },
    isConnected: bool, isFinished: bool, lastSeenAt: timestamp, lastActionAt: timestamp,
    lastAnswer: text(100), lastResult: { '.validate': "newData.isString() && newData.val().matches(/^(correct|wrong|skip|solution|hint|finished|left)$/)" },
    learningStatsJSON: text(16000), pendingFollowUpFrom: number(100000), '$other': { '.validate': false }
  } },
  '$other': { '.validate': false }
} } } };
fs.writeFileSync(path.join(__dirname, 'database.rules.json'), JSON.stringify(rules, null, 2) + '\n');
console.log('Reglas privadas generadas: propietario, participantes por UID, caducidad y validacion.');
