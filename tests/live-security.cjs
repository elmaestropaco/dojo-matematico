const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { spawn } = require('node:child_process');
// Explicit opt-in: only disposable anonymous accounts and a new test room are used.
async function main() {
  if (!process.argv.includes('--live')) throw Error('Usa --live solo para una prueba autorizada en tu proyecto.');
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'dojo-secure-live-'));
  const child = spawn(process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', ['--headless', '--disable-gpu', '--no-first-run', '--remote-debugging-port=0', `--user-data-dir=${profile}`], { windowsHide: true, stdio: 'ignore' });
  let ws, host, code;
  const actors = [];
  try {
    const portFile = path.join(profile, 'DevToolsActivePort'); for (let i = 0; !fs.existsSync(portFile) && i < 100; i++) await new Promise(r => setTimeout(r, 100));
    const [port, endpoint] = fs.readFileSync(portFile, 'utf8').trim().split(/\r?\n/); ws = new WebSocket(`ws://127.0.0.1:${port}${endpoint}`); await new Promise((r, e) => { ws.onopen = r; ws.onerror = e; });
    let next = 0; const pending = new Map();
    ws.onmessage = ({ data }) => { const v = JSON.parse(data), p = pending.get(v.id); if (!p) return; pending.delete(v.id); clearTimeout(p.timer); v.error ? p.reject(Error(JSON.stringify(v.error))) : p.resolve(v.result); };
    const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => { const id = ++next, timer = setTimeout(() => reject(Error('Timeout: ' + method)), 60000); pending.set(id, { resolve, reject, timer }); ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) })); });
    const actor = async () => {
      const { browserContextId } = await send('Target.createBrowserContext');
      const { targetId } = await send('Target.createTarget', { url: 'about:blank', browserContextId });
      const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
      const evaluate = async expression => { const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }, sessionId); if (r.exceptionDetails) throw Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result.value; };
      const value = { evaluate }; actors.push(value);
      await send('Network.enable', {}, sessionId); await send('Network.setBlockedURLs', { urls: ['*fonts.googleapis.com*', '*googletagmanager.com*', '*google-analytics.com*'] }, sessionId);
      await send('Page.navigate', { url: pathToFileURL(path.resolve(__dirname, '../index.html')).href }, sessionId);
      for (let i = 0; i < 200; i++) { if (await evaluate('document.readyState === "complete" && !!window.NinjaOnline')) break; await new Promise(r => setTimeout(r, 100)); }
      assert.equal(await evaluate('NinjaOnline.init()'), true); return value;
    };
    host = await actor();
    code = await host.evaluate(`(async()=>{const room=await NinjaOnline.createRoom({mode:'teacher',config:{activity:'calculo',progressiveEnabled:true,teamsEnabled:true,teamCount:3,teamNames:['Rojo','Azul','Verde'],teamAssignments:{previousRoomUid:0}},durationSeconds:60,hostName:'Prueba de seguridad'});return room.code;})()`);
    const a = await actor(), b = await actor();
    assert.equal(await a.evaluate(`(async()=>{try{await NinjaOnline.getRoom(${JSON.stringify(code)});return false;}catch{return true;}})()`), true);
    const uidA = await a.evaluate(`(async()=>{const joined=await NinjaOnline.joinRoom(${JSON.stringify(code)},'Prueba A 🥷');return joined.playerId;})()`);
    const uidB = await b.evaluate(`(async()=>{const joined=await NinjaOnline.joinRoom(${JSON.stringify(code)},'Prueba B 🌟');return joined.playerId;})()`);
    assert.notEqual(uidA, uidB);
    const first = await a.evaluate(`(async()=>{const code=${JSON.stringify(code)},room=await NinjaOnline.getRoom(code);const result=await NinjaOnline.updatePlayer(code,NinjaOnline.uid(),{score:10,correctCount:1,operationIndex:1,learningStats:{missing:{correct:1}}},room.seed);return {committed:result.committed,score:(await NinjaOnline.getRoom(code)).players[NinjaOnline.uid()].score};})()`);
    assert.deepEqual(first, { committed: true, score: 10 });
    const attacks = await b.evaluate(`(async()=>{const base='secureRooms/'+${JSON.stringify(code)},other=${JSON.stringify(uidA)};const attempts=[()=>NinjaOnline.db.ref(base+'/players/'+other+'/score').set(999),()=>NinjaOnline.db.ref(base+'/hostUid').set(NinjaOnline.uid()),()=>NinjaOnline.db.ref(base).update({status:'finished'}),()=>NinjaOnline.db.ref('secureRooms').get(),()=>NinjaOnline.db.ref('rooms').get()];const denied=[];for(const attempt of attempts){try{await attempt();denied.push(false);}catch{denied.push(true);}}return denied;})()`);
    assert.deepEqual(attacks, [true, true, true, true, true]);
    assert.equal(await host.evaluate(`NinjaOnline.setTeams(${JSON.stringify(code)},{fillOnly:true})`),true);
    const assignments=await host.evaluate(`(async()=>JSON.parse((await NinjaOnline.getRoom(${JSON.stringify(code)})).config).teamAssignments)()`);
    assert.equal(Object.keys(assignments).length,2);assert.notEqual(assignments[uidA],assignments[uidB]);
    await host.evaluate(`NinjaOnline.startRoom(${JSON.stringify(code)})`);await new Promise(r=>setTimeout(r,3200));
    await host.evaluate(`NinjaOnline.controlRound(${JSON.stringify(code)},'pause',{index:1})`);
    assert.equal(await a.evaluate(`(async()=>{const code=${JSON.stringify(code)},room=await NinjaOnline.getRoom(code);try{await NinjaOnline.updatePlayer(code,NinjaOnline.uid(),{score:999,operationIndex:2},room.seed);return false;}catch{return room.pausedAt>0;}})()`),true);
    assert.equal(await b.evaluate(`(async()=>{try{await NinjaOnline.controlRound(${JSON.stringify(code)},'resume');return false;}catch{return true;}})()`),true);
    await host.evaluate(`NinjaOnline.controlRound(${JSON.stringify(code)},'reveal')`);
    assert.equal(await a.evaluate(`(async()=>{const room=await NinjaOnline.getRoom(${JSON.stringify(code)});return room.pauseRevealed&&room.players[NinjaOnline.uid()].assistedOperationIndex===1&&room.players[NinjaOnline.uid()].score===10;})()`),true);
    assert.equal(await host.evaluate(`NinjaOnline.setTeams(${JSON.stringify(code)},{count:2,reshuffle:true})`),false);
    await host.evaluate(`NinjaOnline.controlRound(${JSON.stringify(code)},'resume')`);
    assert.equal(await a.evaluate(`(async()=>{const room=await NinjaOnline.getRoom(${JSON.stringify(code)});return !room.pausedAt&&room.pausedTotal>0;})()`),true);
    console.log('OK: real owner transactions, balanced teams, pause/reveal/resume, progress blocked on server, assistance marker and live redistribution rejected.');
    await host.evaluate(`NinjaOnline.controlRound(${JSON.stringify(code)},'pause',{index:1})`);
    const oldSeed = await a.evaluate(`(async()=>{return (await NinjaOnline.getRoom(${JSON.stringify(code)})).seed;})()`);
    await host.evaluate(`NinjaOnline.resetRoom(${JSON.stringify(code)},{config:{activity:'problemas'},durationSeconds:0})`);
    assert.equal(await a.evaluate(`(async()=>{const r=await NinjaOnline.getRoom(${JSON.stringify(code)});return !r.pausedAt&&r.players[NinjaOnline.uid()].assistedOperationIndex===undefined&&r.pausedTotal===0;})()`),true);
    const afterReset = await a.evaluate(`(async()=>{const code=${JSON.stringify(code)},uid=NinjaOnline.uid(),room=await NinjaOnline.getRoom(code);const stale=await NinjaOnline.updatePlayer(code,uid,{score:999},${oldSeed});const fresh=await NinjaOnline.updatePlayer(code,uid,{score:20,correctCount:2},room.seed);return {stale:stale.committed,fresh:fresh.committed,score:(await NinjaOnline.getRoom(code)).players[uid].score};})()`);
    assert.deepEqual(afterReset, { stale: false, fresh: true, score: 20 });
    await host.evaluate(`NinjaOnline.removePlayer(${JSON.stringify(code)},${JSON.stringify(uidB)})`);
    assert.equal(await b.evaluate(`(async()=>{try{await NinjaOnline.getRoom(${JSON.stringify(code)});return false;}catch{return true;}})()`), true);
    assert.equal(await b.evaluate(`(async()=>{try{await NinjaOnline.joinRoom(${JSON.stringify(code)},'Prueba B');return false;}catch{return true;}})()`), true);
    await host.evaluate(`NinjaOnline.allowPlayer(${JSON.stringify(code)},${JSON.stringify(uidB)})`);
    assert.equal(await b.evaluate(`(async()=>{const result=await NinjaOnline.joinRoom(${JSON.stringify(code)},'Prueba B');return result.playerId===NinjaOnline.uid();})()`), true);
    console.log('OK: tres identidades reales aisladas; sala maestro, entradas, progreso, estadisticas, revancha, semilla antigua rechazada, suplantacion bloqueada, lectura/listado privado y expulsion/reingreso autorizado.');
    await host.evaluate(`NinjaOnline.deleteRoom(${JSON.stringify(code)})`); code = null;
    for (const a of actors) await a.evaluate('NinjaOnline.auth.currentUser?.delete()');
    await send('Browser.close');
  } finally {
    if (ws?.readyState === WebSocket.OPEN) {
      if (code && host) await host.evaluate(`NinjaOnline.deleteRoom(${JSON.stringify(code)})`).catch(() => {});
      for (const a of actors) await a.evaluate('NinjaOnline.auth.currentUser?.delete()').catch(() => {});
    }
    ws?.close(); child.kill();
  }
}
main().catch(e => { console.error(String(e.stack || e.message).replace(/AIza[\w-]+/g, '[API_KEY]')); process.exitCode = 1; });
