const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { spawn } = require('node:child_process');
async function main() {
  const root = path.resolve(__dirname, '..'), profile = fs.mkdtempSync(path.join(os.tmpdir(), 'dojo-startup-'));
  const child = spawn(process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', ['--headless', '--disable-gpu', '--no-first-run', '--remote-debugging-port=0', `--user-data-dir=${profile}`], { windowsHide: true, stdio: 'ignore' });
  let ws;
  try {
    const portFile = path.join(profile, 'DevToolsActivePort');
    for (let i = 0; !fs.existsSync(portFile) && i < 100; i++) await new Promise(r => setTimeout(r, 100));
    const [port, endpoint] = fs.readFileSync(portFile, 'utf8').trim().split(/\r?\n/);
    ws = new WebSocket(`ws://127.0.0.1:${port}${endpoint}`); await new Promise((r, reject) => { ws.onopen = r; ws.onerror = reject; });
    let next = 0; const pending = new Map(), errors = [];
    ws.onmessage = ({ data }) => {
      const v = JSON.parse(data);
      if (v.method === 'Runtime.exceptionThrown') errors.push(v.params.exceptionDetails.exception?.description || v.params.exceptionDetails.text);
      const task = pending.get(v.id); if (!task) return; pending.delete(v.id); clearTimeout(task.timer); v.error ? task.reject(Error(JSON.stringify(v.error))) : task.resolve(v.result);
    };
    const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => { const id = ++next, timer = setTimeout(() => { pending.delete(id); reject(Error('Tiempo agotado: ' + method)); }, 60000); pending.set(id, { resolve, reject, timer }); ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) })); });
    const { targetId } = await send('Target.createTarget', { url: 'about:blank' }); const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
    await send('Runtime.enable', {}, sessionId); await send('Page.enable', {}, sessionId);
    await send('Network.enable', {}, sessionId); await send('Network.setBlockedURLs', { urls: ['*fonts.googleapis.com*', '*googletagmanager.com*', '*google-analytics.com*'] }, sessionId);
    const evalJS = async expression => { const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }, sessionId); if (r.exceptionDetails) throw Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result.value; };
    await send('Page.navigate', { url: pathToFileURL(path.join(root, 'index.html')).href }, sessionId);
    for (let i = 0; i < 200; i++) { if (await evalJS('document.readyState === "complete" && typeof state === "object"')) break; await new Promise(r => setTimeout(r, 100)); }
    await evalJS(`document.querySelector('[data-mode="single"]').click();document.querySelector('[data-activity="calculo"]').click();document.querySelector('[data-op="addNoCarry"]').click();document.getElementById('startBtn').click();`);
    for (let i = 0; i < 65; i++) { if (await evalJS('state.isRunning')) break; await new Promise(r => setTimeout(r, 100)); }
    const local = await evalJS(`(()=>{const running=state.isRunning;const op=state.operationsByPlayer.get(0);if(op){state.players[0].input=String(op.answer);submitPlayerAnswer(0);}stopTimer();return {running,score:state.players[0]?.score,firebaseLoaded:typeof window.firebase!=='undefined'};})()`);
    assert.equal(local.running, true); assert.equal(local.score, 10); assert.equal(local.firebaseLoaded, false);
    console.log('OK: index.html directo, inicio real con cuenta atras, teclado y puntuacion local sin Firebase.');
    if (process.argv.includes('--live-auth') || process.argv.includes('--live-room')) {
      const auth = await evalJS(`(async()=>{goHome();try{const ready=await NinjaOnline.init();return {ready,auth:!!NinjaOnline.auth?.currentUser,database:typeof window.firebase?.database,db:!!NinjaOnline.db};}catch(e){return {error:e.code||e.message,database:typeof window.firebase?.database,auth:typeof window.firebase?.auth};}})()`);
      console.log(JSON.stringify({ liveInitialization: auth }));
      if (auth.error) throw Error(auth.error);
      assert.equal(auth.ready, true); assert.equal(auth.database, 'function');
      if (process.argv.includes('--live-room')) {
        const room = await evalJS(`(async()=>{const result=await NinjaOnline.createRoom({mode:'teacher',config:{activity:'calculo'},durationSeconds:60,hostName:'Prueba segura'});const code=result.code;try{const data=await NinjaOnline.getRoom(code);await NinjaOnline.startRoom(code);await NinjaOnline.resetRoom(code,{config:{activity:'problemas'},durationSeconds:0});return {codeLength:code.length,schema:data.schemaVersion,owned:data.hostUid===NinjaOnline.auth.currentUser.uid};}finally{await NinjaOnline.deleteRoom(code);}})()`);
        assert.equal(room.codeLength, 8); assert.equal(room.schema, 2); assert.equal(room.owned, true);
        console.log('OK: sala maestro real, lectura del propietario, inicio y revancha con reglas publicadas; sala de prueba eliminada.');
      }
      await evalJS('NinjaOnline.auth.currentUser.delete()');
    }
    const safeErrors = errors.map(e => String(e).replace(/AIza[\w-]+/g, '[API_KEY]').slice(0, 800));
    if (safeErrors.length) console.log(JSON.stringify({ runtimeErrors: safeErrors }));
    assert.deepEqual(safeErrors, []); await send('Browser.close');
  } finally { ws?.close(); child.kill(); }
}
main().catch(e => { console.error(String(e.message).replace(/AIza[\w-]+/g, '[API_KEY]')); process.exitCode = 1; });
