const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { spawn } = require('node:child_process');

async function main() {
  const root = path.resolve(__dirname, '..');
  const chrome = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  if (!fs.existsSync(chrome)) throw new Error('Set CHROME_PATH to a Chromium browser executable.');
  const work = fs.mkdtempSync(path.join(os.tmpdir(), 'ninja-smoke-'));
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8')
    .replace('<head>', `<head><base href="${pathToFileURL(root + path.sep).href}">`)
    .replace(/<link[^>]+href="https:\/\/fonts[^>]+>/g, '');
  const preview = path.join(work, 'preview.html');
  fs.writeFileSync(preview, html);
  const browser = spawn(chrome, ['--headless', '--disable-gpu', '--no-first-run', '--allow-file-access-from-files', '--remote-debugging-port=0', `--user-data-dir=${work}`], { windowsHide: true, stdio: 'ignore' });
  let socket;
  try {
    const portFile = path.join(work, 'DevToolsActivePort');
    for (let i = 0; !fs.existsSync(portFile) && i < 100; i++) await new Promise(r => setTimeout(r, 100));
    const [port, endpoint] = fs.readFileSync(portFile, 'utf8').trim().split(/\r?\n/);
    socket = new WebSocket(`ws://127.0.0.1:${port}${endpoint}`);
    await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
    let nextId = 0;
    const pending = new Map();
    socket.onmessage = ({ data }) => {
      const response = JSON.parse(data);
      const waiter = pending.get(response.id);
      if (!waiter) return;
      pending.delete(response.id);
      clearTimeout(waiter.timeout);
      if (response.error) waiter.reject(new Error(JSON.stringify(response.error)));
      else waiter.resolve(response.result);
    };
    const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
      const id = ++nextId;
      const timeout = setTimeout(() => { pending.delete(id); reject(new Error(`Timeout: ${method}`)); }, 10000);
      pending.set(id, { resolve, reject, timeout });
      socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
    });
    const { targetId } = await send('Target.createTarget', { url: pathToFileURL(preview).href });
    const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
    const evaluate = async expression => {
      const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }, sessionId);
      if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
      return result.result.value;
    };
    for (let i = 0; i < 100; i++) {
      if (await evaluate('typeof launchGame === "function" && document.readyState === "complete"')) break;
      await new Promise(r => setTimeout(r, 100));
    }
    const sizes = [[360, 740], [390, 844], [768, 1024], [1366, 768], [1920, 1080]];
    const controlsOnly = process.argv.includes('--controls-only');
    const advancedOnly = process.argv.includes('--advanced-only');
    const calculationsOnly = process.argv.includes('--calculations-only');
    const integerOnly = process.argv.includes('--integer-only');
    const teacherOnly = process.argv.includes('--teacher-only');
    await evaluate(`{const style=document.createElement('style');style.textContent='*,*::before,*::after{animation:none!important;transition:none!important}';document.head.appendChild(style);}`);
    for (const [width, height] of (controlsOnly || advancedOnly || integerOnly || teacherOnly ? [] : sizes)) {
      await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false }, sessionId);
      for (const mode of ['single', 'duel']) for (const activity of ['fractions', 'factors', 'mixed', 'mcm', 'mcd']) {
        await evaluate(`
          stopTimer(); stopEventSystem();
          state.mode=${JSON.stringify(mode)};state.online=null;state.orientation='vertical';
          state.muted=true;state.streaksEnabled=false;state.allowNegative=true;
          Object.values(state.operationSettings).forEach(c=>c.enabled=false);
          state.operationSettings.fractionCombined={enabled:${['fractions','mixed'].includes(activity)},numeratorMax:3,denominatorMax:3};
          state.operationSettings.primeFactors={enabled:${['factors','mixed'].includes(activity)},digits:3};
          if(${['mcm','mcd'].includes(activity)})state.operationSettings[${JSON.stringify(activity)}]={enabled:true,digits:3,count:4};
          launchGame(getEnabledOperationKeys(),60);stopTimer();refs.consentBanner.classList.add('hidden');
        `);
        await evaluate('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');
        for (const phase of ['question', 'solution']) {
        if (phase === 'solution') {
          await evaluate('state.operationsByPlayer.forEach(op=>op.solutionRevealed=true);repaintPlayers();new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');
        }
        const result = await evaluate(`(() => {
          const failures=[];
          for(const panel of document.querySelectorAll('.player-panel')) {
            const box=panel.getBoundingClientRect();
            if(box.right>innerWidth+1||box.bottom>innerHeight+1)failures.push('panel outside viewport');
            for(const q of ['.operation','.answer-box','.numpad','.action-row','.solution-btn']) {
              const e=panel.querySelector(q),b=e.getBoundingClientRect();
              if(b.right>box.right+1||b.bottom>box.bottom+1)failures.push(q+' outside panel');
              if(e.scrollHeight>e.clientHeight+2||e.scrollWidth>e.clientWidth+2)failures.push(q+' clipped '+e.clientWidth+'/'+e.scrollWidth+' x '+e.clientHeight+'/'+e.scrollHeight);
            }
            const pad=panel.querySelector('.numpad');
            if(${['fractions','mixed'].includes(activity)} && pad.querySelectorAll('[data-key="/"]').length!==1)failures.push('missing fraction key');
            if(${['factors','mixed'].includes(activity)} && pad.querySelectorAll('[data-key="x"]').length!==1)failures.push('missing product key');
            const p=pad.getBoundingClientRect(),a=panel.querySelector('.action-row').getBoundingClientRect();
            if(Math.min(p.bottom,a.bottom)-Math.max(p.top,a.top)>1)failures.push('keypad overlaps actions');
          }
          return failures;
        })()`);
        assert.deepEqual(result, [], `${width}x${height} ${mode} ${activity} ${phase}: ${result.join(', ')}`);
        }
      }
    }
    await evaluate(`
      document.querySelector('[data-activity="problemas"]').click();
      if(state.activity!=='problemas'||refs.problemsBox.classList.contains('hidden')||!refs.operationsBox.classList.contains('hidden'))throw Error('Problem controls not separated');
      if(!buildOnlineConfig().problemSettings||buildOnlineConfig().activity!=='problemas')throw Error('Missing problem room config');
      refs.problemMixSelect.value='combinados';refs.problemMixSelect.dispatchEvent(new Event('change',{bubbles:true}));
      if(buildOnlineConfig().problemMix!=='combinados'||state.problemMix!=='combinados')throw Error('Problem mix not synchronized');
      refs.problemMixSelect.value='individuales';refs.problemMixSelect.dispatchEvent(new Event('change',{bubbles:true}));
      savePreferences();if(readPreferences().activity!=='problemas')throw Error('Problem preferences not persisted');
      if(document.querySelectorAll('details.problem-category').length!==4||[...document.querySelectorAll('details.problem-category')].some(e=>e.open))throw Error('Problem categories must start collapsed');
      const firstCategory=document.querySelector('details.problem-category');
      const closedHeight=document.querySelectorAll('details.problem-category')[1].getBoundingClientRect().height;
      firstCategory.querySelector('summary span').click();if(!firstCategory.open)throw Error('Category title does not expand');
      if(document.querySelectorAll('details.problem-category')[1].getBoundingClientRect().height!==closedHeight)throw Error('Closed category stretches with its neighbor');
      firstCategory.querySelector('summary span').click();if(firstCategory.open)throw Error('Category title does not collapse');
      const min=document.querySelector('[data-problem-kind="suma"][data-problem-key="minDigits"]');
      const max=document.querySelector('[data-problem-kind="suma"][data-problem-key="maxDigits"]');
      min.value='9';min.dispatchEvent(new Event('change',{bubbles:true}));
      min.value='1';min.dispatchEvent(new Event('change',{bubbles:true}));
      if(max.disabled)throw Error('Max digits remained locked after 9 to 1');
      max.value='1';max.dispatchEvent(new Event('change',{bubbles:true}));
      if(state.problemSettings.suma.minDigits!==1||state.problemSettings.suma.maxDigits!==1)throw Error('Equal range did not set fixed digits');
      if(document.querySelector('[data-problem-key="digitMode"]'))throw Error('Redundant digit mode selector remains');
      max.value='4';max.dispatchEvent(new Event('change',{bubbles:true}));
      if(state.problemSettings.suma.digitMode!=='intervalo'||state.problemSettings.suma.maxDigits!==4)throw Error('Cannot edit maximum digits');
      document.querySelector('[data-problem-kind="suma"][data-problem-carry="sin"]').click();
      if(state.problemSettings.suma.carryMode!=='sin')throw Error('Carry button ignored');
      for(const kind of ['multiplicacion','division']) {
        const enabled=document.querySelector('[data-problem-kind="'+kind+'"][data-problem-key="enabled"]');
        enabled.click();
        const edit=(operand,key,value)=>{const e=document.querySelector('[data-problem-kind="'+kind+'"][data-problem-operand="'+operand+'"][data-problem-key="'+key+'"]');if(e.disabled)throw Error('Operand control disabled');e.value=String(value);e.dispatchEvent(new Event('change',{bubbles:true}));};
        edit('first','minDigits',3);edit('first','maxDigits',4);edit('second','maxDigits',1);
        const ranges=state.problemSettings[kind].operandDigits;
        if(ranges.first.minDigits!==3||ranges.first.maxDigits!==4||ranges.second.minDigits!==1||ranges.second.maxDigits!==1)throw Error('Operand ranges not independent');
        if(JSON.stringify(readPreferences().problemSettings[kind].operandDigits)!==JSON.stringify(ranges))throw Error('Operand ranges not saved');
        if(JSON.stringify(buildOnlineConfig().problemSettings[kind].operandDigits)!==JSON.stringify(ranges))throw Error('Operand ranges missing from room config');
        edit('second','minDigits',9);edit('second','minDigits',1);edit('second','maxDigits',1);
        if(state.problemSettings[kind].operandDigits.second.maxDigits!==1)throw Error('Operand maximum remained locked');
      }
      state.timeLeft=170;updatePanelTimersDisplay();
      if([...document.querySelectorAll('.panel-timer')].some(e=>e.textContent!=='2:50'))throw Error('Timer is not minutes:seconds');
    `);
    await evaluate(`(async()=>{const font=refs.problemFontSelect;font.value='ligada';font.dispatchEvent(new Event('change',{bubbles:true}));await document.fonts.load('400 20px "Escolar Ligada"');if(!document.fonts.check('400 20px "Escolar Ligada"'))throw Error('Local school font did not load');if(readPreferences().problemFont!=='ligada')throw Error('Font preference not saved');refs.problemFontBtn.click();if(state.problemFont!=='imprenta')throw Error('In-game font toggle failed');})()`);
    await evaluate(`goHome();document.querySelectorAll('details.problem-category').forEach(e=>e.open=true)`);
    for (const [width, height] of sizes) {
      await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false }, sessionId);
      const errors = await evaluate(`(async()=>{
        await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
        const errors=[];
        if(document.documentElement.scrollWidth>innerWidth+1)errors.push('horizontal page overflow');
        for(const control of document.querySelectorAll('[data-problem-operand]')) {
          const box=control.getBoundingClientRect(),parent=control.closest('fieldset').getBoundingClientRect();
          if(box.left<parent.left||box.right>parent.right+1||box.right>innerWidth+1)errors.push('operand control outside its group');
        }
        return errors;
      })()`);
      assert.deepEqual(errors, [], `Problem controls ${width}x${height}: ${errors.join(', ')}`);
      if (width === 360) {
        const screenshot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true }, sessionId);
        fs.writeFileSync(path.join(work, 'problem-controls-mobile.png'), Buffer.from(screenshot.data, 'base64'));
      }
    }
    await evaluate(`document.querySelectorAll('details.problem-category').forEach(e=>e.open=false)`);
    await evaluate(`(() => {
      if(document.getElementById('gameOptionsBox').open||document.querySelector('.hall-archive').open)throw Error('Secondary options must start collapsed');
      const set=(key,value)=>{const e=document.querySelector('[data-problem-extra="'+key+'"]');if(e.type==='checkbox')e.checked=value;else e.value=String(value);e.dispatchEvent(new Event('change',{bubbles:true}));};
      set('_family','fracciones');set('_fractionNumerator',3);set('_fractionDenominator',2);
      refs.problemMixSelect.value='combinados';refs.problemMixSelect.dispatchEvent(new Event('change',{bubbles:true}));
      if(NinjaProblems.compatible(state.problemSettings,{mix:state.problemMix}).length!==40)throw Error('Fraction combined controls did not select 40 templates');
      if(document.querySelector('.problem-categories').classList.contains('hidden'))throw Error('Fraction operation types missing');
      if(readPreferences().problemSettings._fractionDenominator!==2)throw Error('Fraction digit settings not saved');
      const fractionConfig=buildOnlineConfig();state.problemSettings._family='enteros';applyOnlineConfig(fractionConfig);
      if(state.problemSettings._family!=='fracciones')throw Error('Fraction family lost in room settings');
      set('_family','mcmMcd');set('_theoryDigits',3);set('_theoryCount',4);
      if(!document.querySelector('.problem-categories').classList.contains('hidden'))throw Error('Integer operation controls visible in MCM/MCD');
      if(NinjaProblems.compatible(state.problemSettings,{mix:'combinados'}).length!==40)throw Error('Missing combined MCM/MCD pool');
      if(buildOnlineConfig().problemSettings._theoryCount!==4)throw Error('MCM/MCD count not shared');
      state.mode='teacher';refs.teacherDashboard.classList.remove('hidden');updateTeacherCreatePanel(true);setTeacherConfigExpanded(true);
      if(!refs.teacherConfigMount.querySelector('[data-problem-extra="_family"]')||refs.teacherConfigPanel.classList.contains('hidden'))throw Error('New settings not editable in teacher panel');
      set('_family','fracciones');
      updateTeacherCreatePanel(false);refs.teacherDashboard.classList.add('hidden');state.mode='single';applyModeDependentUI();
      document.querySelector('[data-mode="online"]').click();
      if(!refs.onlineCreateMount.contains(document.getElementById('startBtn'))||!refs.onlineCreateMount.contains(refs.problemsBox))throw Error('Online create panel lost controls');
      document.querySelector('[data-mode="single"]').click();set('_family','enteros');
      refs.problemMixSelect.value='individuales';refs.problemMixSelect.dispatchEvent(new Event('change',{bubbles:true}));
      document.querySelector('[data-activity="calculo"]').click();
      const enabled=document.querySelector('[data-op="mcm"]');enabled.click();
      for(const [key,value] of [['digits',3],['count',4]]){const e=document.querySelector('[data-setting-op="mcm"][data-setting-key="'+key+'"]');e.value=String(value);e.dispatchEvent(new Event('change',{bubbles:true}));}
      const mcm=createOperation('mcm');if(mcm.values.length!==4||mcm.values.some(n=>String(n).length!==3))throw Error('MCM calculation controls ignored');
      if(!isCorrectOperationAnswer(mcm.answerExact,mcm)||isCorrectOperationAnswer(mcm.answerExact+',1',mcm))throw Error('MCM exact answer validation failed');
      enabled.click();document.querySelector('[data-activity="problemas"]').click();
      state.problemSettings=NinjaProblems.normalize({...state.problemSettings,_family:'fracciones'});state.problemMix='individuales';
      launchGame(['problem'],180);stopTimer();
      const op=state.operationsByPlayer.get(0),f=op.answerFraction;
      if(!document.querySelector('.numpad [data-key="/"]'))throw Error('Fraction story keypad missing /');
      state.players[0].input=(BigInt(f.numerator)*2n)+'/'+(BigInt(f.denominator)*2n);submitPlayerAnswer(0);
      if(state.players[0].score!==10)throw Error('Fraction story equivalent answer rejected');
      goHome();state.problemSettings._family='enteros';syncProblemControls();refs.consentBanner.classList.add('hidden');
    })()`);
    const representativeIndexes = await evaluate(`(() => {
      globalThis.problemPreviews={};const groups=new Map();
      NinjaProblemBank.plantillas.forEach((t,index)=>{const key=[...t.etiquetas].sort().join(',');if(!groups.has(key))groups.set(key,[]);groups.get(key).push({t,index});});
      const indexes=new Set();
      for(const items of groups.values()) {
        const target=items[0].t,settings=NinjaProblems.normalize(Object.fromEntries(['suma','resta','multiplicacion','division'].map(k=>[k,{enabled:target.etiquetas.includes(k),difficulty:'todas',minDigits:1,maxDigits:9}])));
        const options={mix:target.etiquetas.length>1?'combinados':'individuales'},pool=NinjaProblems.compatible(settings,options);
        for(let i=0;i<pool.length;i++){const op=NinjaProblems.generate(settings,i,123,options);problemPreviews[op.problem.templateId]={op,settings,mix:options.mix};}
        const longest=[...items].sort((a,b)=>b.t.enunciado.length-a.t.enunciado.length);
        indexes.add(longest[0].index);indexes.add(longest[1].index);
        indexes.add([...items].sort((a,b)=>b.t.pasos.length-a.t.pasos.length)[0].index);
      }
      if(Object.keys(problemPreviews).length!==600)throw Error('Missing generated preview');
      return [...indexes];
    })()`);
    let problemViews = 0;
    for (const [width, height] of (controlsOnly || advancedOnly || calculationsOnly || teacherOnly ? [] : sizes)) {
      await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false }, sessionId);
      for (const mode of ['single', 'duel']) {
        await evaluate(`
          state.activity='problemas';state.mode=${JSON.stringify(mode)};state.online=null;
          state.problemMix='mixto';state.problemSettings=NinjaProblems.normalize(Object.fromEntries(['suma','resta','multiplicacion','division'].map(key=>[key,{enabled:true,difficulty:'todas',minDigits:1,maxDigits:9}])));
          launchGame(['problem'],180);stopTimer();
        `);
        for (const font of ['imprenta', 'ligada']) {
        await evaluate(`state.problemFont=${JSON.stringify(font)};syncProblemControls();document.fonts.load('400 20px "Escolar Ligada"')`);
        const indexes = width === 1366 && mode === 'single' ? Array.from({length:600}, (_,i)=>i) : representativeIndexes;
        for (const index of indexes) for (const solution of [false, true]) {
          const failures = await evaluate(`(async()=>{
            const target=NinjaProblemBank.plantillas[${index}];
            const preview=problemPreviews[target.id],generated=preview.op;
            state.problemSettings=preview.settings;state.problemMix=preview.mix;
            state.players.forEach(p=>state.operationsByPlayer.set(p.id,decorateOperation(generated)));
            state.operationsByPlayer.forEach(op=>op.solutionRevealed=${solution});
            repaintPlayers();await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
            const errors=[];
            for(const panel of document.querySelectorAll('.player-panel')) {
              if(${solution} && (!panel.querySelector('.problem-review-reading .problem-question') || !panel.querySelector('.problem-review-working .problem-final')))errors.push('question or solution missing from review');
              const box=panel.getBoundingClientRect();
              for(const q of ['.operation','.numpad','.action-row']){
                const e=panel.querySelector(q),b=e.getBoundingClientRect();
                if(b.right>box.right+1||b.bottom>box.bottom+1)errors.push(q+' outside panel');
                if(e.scrollHeight>e.clientHeight+2||e.scrollWidth>e.clientWidth+2)errors.push(q+' clipped');
              }
            }
            return errors;
          })()`);
          assert.deepEqual(failures, [], `Problems ${width}x${height} ${mode} ${font} template ${index} solution ${solution}: ${failures.join(', ')}`);
          problemViews++;
        }
        }
      }
    }
    let advancedViews = 0;
    if (!controlsOnly && !calculationsOnly && !integerOnly && !teacherOnly) {
      const examples = await evaluate(`(() => {
        globalThis.advancedPreviews={};const groups=new Map();
        for(const t of NinjaAdvancedProblemBank.plantillas){const key=t.family+':'+[...t.categories].sort().join(',');if(!groups.has(key))groups.set(key,[]);groups.get(key).push(t);}
        const representatives=[];
        for(const items of groups.values()){
          const t=items[0],settings=NinjaProblems.normalize({...Object.fromEntries(['suma','resta','multiplicacion','division'].map(k=>[k,{enabled:t.categories.includes(k),difficulty:'todas'}])),_family:t.family,_fractionNumerator:3,_fractionDenominator:3,_theoryDigits:3,_theoryCount:4,_mcmEnabled:t.categories.includes('mcm'),_mcdEnabled:t.categories.includes('mcd')});
          const mix=t.categories.length>1?'combinados':'individuales',pool=NinjaProblems.compatible(settings,{mix});
          const generated=[];
          for(let i=0;i<pool.length;i++){const op=NinjaProblems.generate(settings,i,123,{mix});advancedPreviews[op.problem.templateId]={op,settings,mix};generated.push(op);}
          generated.sort((a,b)=>b.problem.text.length-a.problem.text.length);representatives.push(generated[0].problem.templateId);
        }
        return representatives;
      })()`);
      for (const [width, height] of sizes) {
        await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false }, sessionId);
        for (const mode of ['single','duel']) for (const font of ['imprenta','ligada']) {
          const ids = width === 1366 && mode === 'single' ? await evaluate('Object.keys(advancedPreviews)') : examples;
          await evaluate(`state.mode=${JSON.stringify(mode)};state.online=null;state.activity='problemas';state.problemFont=${JSON.stringify(font)};state.problemSettings=Object.values(advancedPreviews)[0].settings;state.problemMix='individuales';launchGame(['problem'],180);stopTimer();`);
          for (const id of ids) for (const solution of [false,true]) {
            const errors = await evaluate(`(async()=>{
              const preview=advancedPreviews[${JSON.stringify(id)}];state.problemSettings=preview.settings;state.problemMix=preview.mix;syncProblemControls();
              state.players.forEach(p=>{state.operationsByPlayer.set(p.id,decorateOperation(preview.op));const pad=document.getElementById('answer-'+p.id).closest('.player-panel').querySelector('.numpad');pad.innerHTML='';buildNumpad(pad,p.id);});
              state.operationsByPlayer.forEach(op=>op.solutionRevealed=${solution});repaintPlayers();await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
              const errors=[];
              for(const panel of document.querySelectorAll('.player-panel')){
                if(${solution} && (!panel.querySelector('.problem-review-reading .problem-question') || !panel.querySelector('.problem-review-working .problem-final')))errors.push('question or solution missing from review');
                const box=panel.getBoundingClientRect();
                for(const q of ['.operation','.numpad','.action-row']){const e=panel.querySelector(q),b=e.getBoundingClientRect();if(b.bottom>box.bottom+1||b.right>box.right+1||e.scrollHeight>e.clientHeight+2||e.scrollWidth>e.clientWidth+2)errors.push(q+' clipped '+e.scrollWidth+'/'+e.clientWidth+' x '+e.scrollHeight+'/'+e.clientHeight);}
                if(preview.op.answerFraction&&!panel.querySelector('[data-key="/"]'))errors.push('missing fraction key');
              }
              if(preview.op.answerFraction){const f=preview.op.answerFraction;if(!isCorrectOperationAnswer((BigInt(f.numerator)*2n)+'/'+(BigInt(f.denominator)*2n),preview.op))errors.push('equivalent answer rejected');}
              return errors;
            })()`);
            assert.deepEqual(errors, [], `Advanced ${width}x${height} ${mode} ${font} ${id} solution ${solution}: ${errors.join(', ')}`);
            advancedViews++;
          }
        }
        console.log(`Advanced layouts checked: ${width}x${height}`);
      }
    }
    await send('Emulation.setDeviceMetricsOverride', { width: 1366, height: 768, deviceScaleFactor: 1, mobile: false }, sessionId);
    await evaluate(`state.problemSettings=NinjaProblems.normalize(Object.fromEntries(['suma','resta','multiplicacion','division'].map(k=>[k,{enabled:true,difficulty:'todas',minDigits:1,maxDigits:3}])));state.problemMix='mixto';`);
    await evaluate(`state.activity='problemas';state.mode='single';state.online=null;launchGame(['problem'],180);stopTimer();new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))`);
    const problemScreenshot = await send('Page.captureScreenshot', { format: 'png' }, sessionId);
    fs.writeFileSync(path.join(work, 'problems-game.png'), Buffer.from(problemScreenshot.data, 'base64'));
    await evaluate(`state.operationsByPlayer.forEach(op=>op.solutionRevealed=true);repaintPlayers();new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))`);
    const reviewScreenshot = await send('Page.captureScreenshot', { format: 'png' }, sessionId);
    fs.writeFileSync(path.join(work, 'problems-review.png'), Buffer.from(reviewScreenshot.data, 'base64'));
    await evaluate(`goHome();syncProblemControls();new Promise(r=>requestAnimationFrame(r))`);
    const configScreenshot = await send('Page.captureScreenshot', { format: 'png' }, sessionId);
    fs.writeFileSync(path.join(work, 'problems-config.png'), Buffer.from(configScreenshot.data, 'base64'));
    await evaluate(`
      state.activity='problemas';state.mode='single';state.online=null;
      launchGame(['problem'],180);stopTimer();
      state.players[0].input=state.operationsByPlayer.get(0).answerExact;submitPlayerAnswer(0);
      if(state.players[0].score!==10)throw Error('Problem answer not accepted');
      document.querySelector('.solution-btn').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));
      if(!document.querySelector('.problem-steps'))throw Error('Missing problem solution steps');
      refreshOperationDisplays();
      if(!state.operationsByPlayer.get(0).problem||!state.operationsByPlayer.get(0).solutionRevealed)throw Error('Problem lost on refresh');
      document.querySelector('.solution-btn').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));
      if(state.players[0].score!==10)throw Error('Problem solution gave points');
      state.online={seed:42,active:true,currentOperationIndex:0};
      if(JSON.stringify(createOnlineOperation(5))!==JSON.stringify(createOnlineOperation(5)))throw Error('Problem online sequence differs');
      state.activity='calculo';
      state.online=null;
      state.mode='single';state.allowNegative=false;
      launchGame(['fractionCombined'],60);stopTimer();
      state.operationsByPlayer.set(0,decorateOperation({kind:'fractionAdd',expression:'1/2 + 1/4',answer:0.75,answerFraction:{numerator:'3',denominator:'4'}}));
      repaintPlayers();
      for(const key of ['6','f','8']) window.dispatchEvent(new KeyboardEvent('keydown',{key,code:key==='f'?'KeyF':'Digit'+key}));
      window.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',code:'Enter'}));
      if(state.players[0].score!==10)throw Error('Equivalent fraction keyboard submission failed');
      document.querySelector('.solution-btn').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));
      refreshOperationDisplays();
      if(!state.operationsByPlayer.get(0).solutionRevealed)throw Error('Lost assisted state');
      document.querySelector('.solution-btn').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));
      if(state.players[0].score!==10)throw Error('Assisted answer awarded points');
      state.operationsByPlayer.set(0,decorateOperation({kind:'primeFactors',expression:'12',answer:12,primeFactors:[2,2,3]}));
      for(const key of ['4','x','3']) window.dispatchEvent(new KeyboardEvent('keydown',{key}));
      window.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',code:'Enter'}));
      if(state.players[0].score!==10)throw Error('Composite factor accepted');
      for(const key of ['3','x','2','*','2']) window.dispatchEvent(new KeyboardEvent('keydown',{key}));
      window.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',code:'Enter'}));
      if(state.players[0].score!==20)throw Error('Prime product keyboard submission failed');
      state.online={code:'123456',isHost:false,isTeacher:false,active:false,room:{status:'finished'},durationSeconds:60};
      state.mode='online';refs.resultsOverlay.classList.remove('hidden');
      handleOnlineRoomUpdate({status:'lobby',durationSeconds:60,rematchAt:123,config:JSON.stringify({operationSettings:{fractionAdd:{enabled:true,numeratorMax:2,denominatorMax:2}}}),players:{}});
      if(!refs.resultsOverlay.classList.contains('hidden'))throw Error('Rematch results overlay still visible');
      if(refs.onlineHostLobby.classList.contains('hidden'))throw Error('Rematch lobby missing');
      if(state.online.active||state.isRunning)throw Error('Rematch did not reset running state');
    `);
    let teacherViews = 0;
    for(const [width,height] of [[360,740],[768,1024],[1024,768],[1366,768],[1920,1080]]) {
      await send('Emulation.setDeviceMetricsOverride', {width,height,deviceScaleFactor:1,mobile:false},sessionId);
      for(const count of [0,1,4,12,20,30,40,60].filter(n=>width>=768||n<=30)) for(const phase of ['lobby','running','finished']) {
        const errors=await evaluate(`(async()=>{
          goHome();state.mode='teacher';state.timeLeft=90;state.isRunning=${phase === 'running'};
          state.online={code:'123456',isTeacher:true,isHost:true,active:true,teacherResultsShown:true,durationSeconds:120};
          showTeacherDashboard();
          const names=['María del Carmen 🦊🌈','Alejandro Fernández ⚡','Valentina Rodríguez 🐱','NinjaSinEspaciosLargoooo🥷'];
          const players=Object.fromEntries(Array.from({length:${count}},(_,i)=>['p'+i,{id:'p'+i,name:names[i%4]+i,score:200-i,correctCount:20-i%10,wrongCount:i%5,operationIndex:20-i%10,isConnected:true,lastResult:i%2?'wrong':'correct',lastAnswer:'15/8',lastActionAt:100+i}]));
          const room={status:${JSON.stringify(phase)},durationSeconds:120,players};state.online.room=room;renderTeacherDashboard(room);
          await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));fitTeacherGrid();
          const errors=[],grid=refs.teacherGrid,box=grid.getBoundingClientRect();
          if(grid.children.length!==${count})errors.push('missing student cards');
          if(grid.scrollHeight>grid.clientHeight+2||grid.scrollWidth>grid.clientWidth+2)errors.push('grid scroll '+grid.scrollHeight+'/'+grid.clientHeight);
          if(box.bottom>innerHeight+1)errors.push('grid outside viewport');
          for(const card of grid.children){
            const b=card.getBoundingClientRect(),name=card.querySelector('.teacher-student-name'),stats=card.querySelector('.teacher-stats');
            if(b.bottom>box.bottom+1||b.right>box.right+1)errors.push('card outside grid');
            if(card.scrollHeight>card.clientHeight+2||card.scrollWidth>card.clientWidth+2)errors.push('card clipped '+card.scrollHeight+'/'+card.clientHeight);
            if(name.textContent!==name.title||getComputedStyle(name).webkitLineClamp!=='none')errors.push('name truncated');
            if(name.getBoundingClientRect().bottom>stats.getBoundingClientRect().top+1)errors.push('name overlaps statistics');
            if(stats.getBoundingClientRect().bottom>b.bottom+1)errors.push('statistics clipped');
          }
          return errors.slice(0,6);
        })()`);
        assert.deepEqual(errors,[],`Teacher ${width}x${height} ${count} ${phase}: ${errors.join(', ')}`);
        teacherViews++;
        if(width===1366&&count===30&&phase==='running'){
          const shot=await send('Page.captureScreenshot',{format:'png'},sessionId);fs.writeFileSync(path.join(work,'teacher-30.png'),Buffer.from(shot.data,'base64'));
        }
      }
    }
    await evaluate(`(() => {
      const room=state.online.room;room.status='running';state.isRunning=true;state.online.teacherResultsShown=false;
      Object.values(room.players).forEach(p=>{p.score=0;p.correctCount=0;p.wrongCount=0;p.operationIndex=0;p.lastResult='';});
      renderTeacherDashboard(room);
      if(!refs.teacherSummary.textContent.includes('0'))throw Error('Rematch stats did not reset');
      const p=Object.values(room.players)[0];p.score=10;p.correctCount=1;p.operationIndex=1;renderTeacherDashboard(room);
      if(!refs.teacherGrid.querySelector('.teacher-points').textContent.includes('10'))throw Error('Rematch points did not update');
      const old=refs.teacherGrid.children.length;p.isConnected=false;renderTeacherDashboard(room);
      if(refs.teacherGrid.children.length!==old-1)throw Error('Disconnected student remains visible');
      room.status='finished';state.online.teacherResultsShown=false;renderTeacherDashboard(room);
      if(refs.resultsOverlay.classList.contains('hidden')||!refs.resultsScores.querySelector('.teacher-podium'))throw Error('Teacher podium missing');
      goHome();
    })()`);
    console.log('OK: '+teacherViews+' teacher views, full names, all cards without scrolling, rematch, disconnects and podium.');
    const screenshot = await send('Page.captureScreenshot', { format: 'png' }, sessionId);
    fs.writeFileSync(path.join(work, 'fractions.png'), Buffer.from(screenshot.data, 'base64'));
    console.log(controlsOnly || advancedOnly || teacherOnly ? 'OK: problem controls on five sizes, independent operand ranges, persistence, room config and keyboard regressions.' : `OK: ${integerOnly ? 0 : 100} calculation views and ${problemViews} integer problem views; both fonts, independent operand ranges, carry buttons and online sequence.`);
    if(advancedViews) console.log(`OK: ${advancedViews} advanced problem views, all 720 new templates on desktop and 18 operation subsets on five sizes.`);
    console.log(`Screenshot: ${path.join(work, 'fractions.png')}`);
    await send('Browser.close');
  } finally {
    if (socket) socket.close();
    browser.kill();
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
