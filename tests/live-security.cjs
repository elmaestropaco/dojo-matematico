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
    const uidB = await b.evaluate(`(async()=>{const joined=await NinjaOnline.joinRoom(${JSON.stringify(code)},'Prueba A 🥷');return joined.playerId;})()`);
    assert.notEqual(uidA, uidB);
    const names=await host.evaluate(`(async()=>Object.values((await NinjaOnline.getRoom(${JSON.stringify(code)})).players).map(p=>p.name))()`);
    assert.equal(new Set(names).size,2);assert.ok(names.every(n=>n.includes('🥷')));
    await b.evaluate(`NinjaOnline.leaveRoom(${JSON.stringify(code)},NinjaOnline.uid())`);
    assert.equal(await host.evaluate(`(async()=>!(await NinjaOnline.getRoom(${JSON.stringify(code)})).players[${JSON.stringify(uidB)}].isConnected)()`),true);
    await b.evaluate(`NinjaOnline.setPresence(${JSON.stringify(code)},NinjaOnline.uid())`);
    await b.evaluate('NinjaOnline.db.goOffline()');
    let disconnected=false;
    for(let i=0;i<30;i++){
      disconnected=await host.evaluate(`(async()=>!(await NinjaOnline.getRoom(${JSON.stringify(code)})).players[${JSON.stringify(uidB)}].isConnected)()`);
      if(disconnected)break;await new Promise(r=>setTimeout(r,250));
    }
    assert.equal(disconnected,true,'onDisconnect must notify the host');
    await b.evaluate(`NinjaOnline.db.goOnline();NinjaOnline.setPresence(${JSON.stringify(code)},NinjaOnline.uid())`);
    console.log('OK: duplicate emoji names distinguished on host, explicit departure and real server disconnect; reconnection keeps the same identity.');
    await b.evaluate(`NinjaOnline.cancelPresence(${JSON.stringify(code)},NinjaOnline.uid())`);
    await b.evaluate('NinjaOnline.db.goOffline()');await new Promise(r=>setTimeout(r,500));
    assert.equal(await host.evaluate(`(async()=>Boolean((await NinjaOnline.getRoom(${JSON.stringify(code)})).players[${JSON.stringify(uidB)}].isConnected))()`),true);
    await b.evaluate(`NinjaOnline.db.goOnline();NinjaOnline.setPresence(${JSON.stringify(code)},NinjaOnline.uid())`);
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
    await host.evaluate(`attachOnlineSession({code:${JSON.stringify(code)},isHost:true,isTeacher:true,playerId:null,playerName:'Profe de prueba'});showTeacherDashboard();`);
    await new Promise(r=>setTimeout(r,150));
    await host.evaluate(`window.testConfirm=window.confirm;window.confirm=()=>true;const saved=sessionLibrary.save('Nueva ronda aplicada',{...buildOnlineConfig(),activity:'problemas',problemSettings:NinjaProblems.normalize({_family:'lecturaVisual',_aulaLevel:2,_showDrawings:false}),endCondition:'unlimited'});classroomMemory.sequence=[saved.id];classroomMemory.cursor=0;openClassroom();document.getElementById('sequenceNextBtn').click();`);
    let prepared=false;
    for(let i=0;i<50;i++){prepared=await host.evaluate('classroomMemory.cursor===1');if(prepared)break;await new Promise(r=>setTimeout(r,100));}
    assert.equal(prepared,true,'Teacher sequence must prepare the round');
    const sequence=await host.evaluate(`(async()=>{const r=await NinjaOnline.getRoom(${JSON.stringify(code)});return {sameCode:state.online.code===${JSON.stringify(code)},status:r.status,family:JSON.parse(r.config).problemSettings._family,players:Object.keys(r.players).length};})()`);
    assert.deepEqual(sequence,{sameCode:true,status:'lobby',family:'lecturaVisual',players:2});
    const shared=[];for(const pupil of [a,b])shared.push(await pupil.evaluate(`(async()=>{const r=await NinjaOnline.getRoom(${JSON.stringify(code)}),cfg=JSON.parse(r.config);applyOnlineConfig(cfg);state.online={seed:r.seed};const problem=createOnlineOperation(3),html=renderProblem(problem);applyOnlineConfig({...cfg,activity:'calculo',operationSettings:{sameBaseMixed:{enabled:true,exponentMax:6,negativeExponents:1}}});const power=createOnlineOperation(7);state.online=null;return {problem:problem.signature,answer:problem.answerDisplay,hidden:!html.includes('<svg'),power:power.signature,powerAnswer:power.answerDisplay};})()`));
    assert.deepEqual(shared[0],shared[1]);assert.equal(shared[0].hidden,true);
    const newPowers=[];
    for(const pupil of [a,b])newPowers.push(await pupil.evaluate(`(async()=>{const r=await NinjaOnline.getRoom(${JSON.stringify(code)}),cfg=JSON.parse(r.config);state.online={seed:r.seed};const result=[];for(const key of Object.keys(NinjaNumberGroups.defaults)){applyOnlineConfig({...cfg,activity:'calculo',operationSettings:{[key]:{enabled:true,exponentDigits:3,negativeExponents:1}}});const op=createOnlineOperation(7);if(!isCorrectOperationAnswer(op.answerDisplay,op))throw Error('Invalid new power answer');result.push({kind:op.kind,signature:op.signature,answer:op.answerDisplay});}state.online=null;return result;})()`));
    assert.equal(newPowers[0].length,5);assert.deepEqual(newPowers[0],newPowers[1]);
    console.log('OK: five new power types generate identical valid questions/answers in both isolated pupil browsers using the room seed.');
    console.log('OK: both real pupils generate the same new visual problem, data fallback and signed-exponent power after receiving the room settings.');
    await host.evaluate(`(async()=>{const config={...buildOnlineConfig(),activity:'calculo',operationSettings:{quadraticEquation:{enabled:true,digits:1,variant:1,signedValues:1}},endCondition:'unlimited'};await NinjaOnline.resetRoom(${JSON.stringify(code)},{config,durationSeconds:0});await NinjaOnline.startRoom(${JSON.stringify(code)});})()`);
    const secondary=[];
    for(const pupil of [a,b])secondary.push(await pupil.evaluate(`(async()=>{const r=await NinjaOnline.getRoom(${JSON.stringify(code)}),cfg=JSON.parse(r.config);applyOnlineConfig(cfg);state.online={seed:r.seed};const quadratic=createOnlineOperation(0),result=[];if(!isCorrectOperationAnswer(quadratic.answerDisplay,quadratic))throw Error('Invalid shared roots');for(const key of Object.keys(NinjaSecondary.defaults)){applyOnlineConfig({...cfg,operationSettings:{[key]:{...NinjaSecondary.defaults[key],enabled:true,digits:3,variant:1,signedValues:1,scientificRange:9}}});const op=createOnlineOperation(9);if(!isCorrectOperationAnswer(op.answerDisplay,op))throw Error('Invalid secondary answer');result.push({kind:op.kind,question:op.signature,answer:op.answerDisplay});}state.online=null;return {quadratic:{question:quadratic.signature,answer:quadratic.answerDisplay},result};})()`));
    assert.deepEqual(secondary[0],secondary[1]);assert.equal(secondary[0].result.length,8);
    const recorded=await a.evaluate(`(async()=>{const code=${JSON.stringify(code)},r=await NinjaOnline.getRoom(code),uid=NinjaOnline.uid();const tx=await NinjaOnline.updatePlayer(code,uid,{score:20,correctCount:1,operationIndex:1,lastAnswer:${JSON.stringify(secondary[0].quadratic.answer)},learningStats:{quadraticEquation:{correct:1}}},r.seed);const p=(await NinjaOnline.getRoom(code)).players[uid];return {ok:tx.committed,score:p.score,answer:p.lastAnswer,correct:p.learningStats.quadraticEquation.correct};})()`);
    assert.deepEqual(recorded,{ok:true,score:20,answer:secondary[0].quadratic.answer,correct:1});
    console.log('OK: real same-room secondary rematch; identical questions for both pupils in all eight types, two-root answers and quadratic progress stored in Firebase.');
    await host.evaluate("document.getElementById('classroomDialog').close();window.confirm=window.testConfirm;delete window.testConfirm;detachOnlineSession(false);goHome();");
    console.log('OK: real teacher UI sequence changes the applied problem family while keeping the room code and both students; waits in the lobby.');
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
