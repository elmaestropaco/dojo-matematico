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
    const percentagesOnly = process.argv.includes('--percentages-only');
    const unitsOnly = process.argv.includes('--units-only');
    const learningOnly = process.argv.includes('--learning-only');
    const controlsOnly = process.argv.includes('--controls-only') || percentagesOnly || unitsOnly || learningOnly;
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
      if(document.querySelectorAll('.problem-categories details.problem-category').length!==4||[...document.querySelectorAll('details.problem-category')].some(e=>e.open))throw Error('Problem categories must start collapsed');
      const firstCategory=document.querySelector('.problem-categories details.problem-category');
      const closedHeight=document.querySelectorAll('.problem-categories details.problem-category')[1].getBoundingClientRect().height;
      firstCategory.querySelector('summary span').click();if(!firstCategory.open)throw Error('Category title does not expand');
      if(document.querySelectorAll('.problem-categories details.problem-category')[1].getBoundingClientRect().height!==closedHeight)throw Error('Closed category stretches with its neighbor');
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
    if (percentagesOnly || process.argv.length === 2) {
      await evaluate(`(() => {
        state.online=null;goHome();hideOnlineHostLobby();state.mode='single';state.activity='problemas';state.problemMix='individuales';syncProblemControls();
        const set=(key,value)=>{const e=document.querySelector('[data-problem-extra="'+key+'"]');if(!e)throw Error('Missing percentage control '+key);if(e.type==='checkbox')e.checked=value;else e.value=String(value);e.dispatchEvent(new Event('change',{bubbles:true}));};
        set('_family','porcentajes');
        const box=document.querySelector('[data-problem-families="porcentajes"]');
        if(box.classList.contains('hidden')||box.querySelector('details').open)throw Error('Percentage controls must be visible and collapsed');
        box.querySelectorAll('details').forEach(d=>d.open=true);
        for(const label of box.querySelectorAll('label:not(#percentagePlacesWrap)'))if(label.classList.contains('hidden'))throw Error('Percentage labels hidden by integer controls');
        set('_percentageMinDigits',4);set('_percentageMinDigits',1);set('_percentageMaxDigits',1);
        if(state.problemSettings._percentageMaxDigits!==1||state.problemSettings._percentageMinDigits!==1)throw Error('Percentage range remained locked');
        set('_percentageDecimals',true);set('_percentagePlaces',1);set('_percentageBasic',false);
        if(document.getElementById('percentagePlacesWrap').classList.contains('hidden'))throw Error('Missing percentage decimals control');
        const cfg=buildOnlineConfig();
        if(cfg.problemSettings._percentagePlaces!==1||readPreferences().problemSettings._family!=='porcentajes')throw Error('Percentage settings not saved/shared');
        set('_family','enteros');applyOnlineConfig(cfg);
        if(state.problemSettings._family!=='porcentajes'||state.problemSettings._percentagePlaces!==1)throw Error('Percentage config lost on room update');
        if(NinjaProblems.compatible(state.problemSettings).length!==160)throw Error('Percentage pool missing');
        for(const op of ['suma','resta','multiplicacion','division'])set('_percentage_'+op,true);
        if(NinjaProblems.compatible(state.problemSettings,{mix:'combinados'}).length!==160)throw Error('Combined percentage pool missing');
        state.mode='teacher';refs.teacherDashboard.classList.remove('hidden');updateTeacherCreatePanel(true);setTeacherConfigExpanded(true);
        if(!refs.teacherConfigMount.querySelector('[data-problem-extra="_percentageBasic"]'))throw Error('Teacher cannot edit percentage settings');
        updateTeacherCreatePanel(false);refs.teacherDashboard.classList.add('hidden');state.mode='single';applyModeDependentUI();
        document.querySelector('[data-mode="online"]').click();
        if(!refs.onlineCreateMount.querySelector('[data-problem-extra="_percentageBasic"]'))throw Error('Online create panel missing percentage settings');
        document.querySelector('[data-mode="single"]').click();
      })()`);
      for(const [width,height] of sizes) {
        await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false},sessionId);
        const errors=await evaluate(`(async()=>{await new Promise(r=>requestAnimationFrame(r));const failures=[];if(document.documentElement.scrollWidth>innerWidth+1)failures.push('page overflow');for(const e of document.querySelectorAll('[data-problem-families="porcentajes"] select')){const b=e.getBoundingClientRect();if(b.right>innerWidth+1||b.left<0)failures.push('percentage control overflow');}return failures;})()`);
        assert.deepEqual(errors,[],`Percentage controls ${width}x${height}`);
        if(width===360){const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true},sessionId);fs.writeFileSync(path.join(work,'percentage-controls-mobile.png'),Buffer.from(shot.data,'base64'));}
      }
      const previews=await evaluate(`(() => {
        globalThis.percentagePreviews=[];
        for(const mix of ['individuales','combinados']){
          const cfg=NinjaProblems.normalize({...state.problemSettings,_family:'porcentajes',_percentageMinDigits:9,_percentageMaxDigits:9,_percentageDecimals:true,_percentagePlaces:2});
          const pool=NinjaProblems.compatible(cfg,{mix});
          for(let i=0;i<pool.length;i++)percentagePreviews.push({cfg,mix,op:NinjaProblems.generate(cfg,i,125,{mix})});
        }
        return percentagePreviews.map((p,i)=>({i,length:p.op.problem.text.length,type:p.op.problem.category,mix:p.mix}));
      })()`);
      const representatives=[];
      for(const mix of ['individuales','combinados'])for(const type of ['parte','descuento','aumento','relacion'])representatives.push(previews.filter(p=>p.mix===mix&&p.type===type).sort((a,b)=>b.length-a.length)[0].i);
      let views=0;
      for(const [width,height] of sizes) {
        await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false},sessionId);
        for(const mode of ['single','duel'])for(const font of ['imprenta','ligada']) {
          await evaluate(`state.online=null;state.activity='problemas';state.mode=${JSON.stringify(mode)};state.problemFont=${JSON.stringify(font)};state.problemSettings=percentagePreviews[0].cfg;state.problemMix='individuales';launchGame(['problem'],180);stopTimer();refs.consentBanner.classList.add('hidden');syncProblemControls();document.fonts.load('400 20px "Escolar Ligada"')`);
          const indexes=width===1366&&mode==='single'&&font==='imprenta'?previews.map(p=>p.i):representatives;
          for(const i of indexes)for(const solution of [false,true]){
            const failures=await evaluate(`(async()=>{
              const preview=percentagePreviews[${i}];state.problemSettings=preview.cfg;state.problemMix=preview.mix;
              state.players.forEach(p=>state.operationsByPlayer.set(p.id,decorateOperation({...preview.op,solutionRevealed:${solution}})));repaintPlayers();
              await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
              const errors=[];
              if(document.documentElement.scrollHeight>innerHeight+2||document.documentElement.scrollWidth>innerWidth+2)errors.push('game page scrolls');
              for(const panel of document.querySelectorAll('.player-panel')){
                const box=panel.getBoundingClientRect();
                for(const q of ['.operation','.numpad','.action-row']){const e=panel.querySelector(q),b=e.getBoundingClientRect();if(b.right>box.right+1||b.bottom>box.bottom+1)errors.push(q+' outside panel');if(e.scrollHeight>e.clientHeight+2||e.scrollWidth>e.clientWidth+2)errors.push(q+' clipped');}
                if(${solution}&&(!panel.querySelector('.problem-review-reading .problem-question')||!panel.querySelector('.problem-final').textContent.includes(preview.op.answerDisplay)))errors.push('question or decimal solution missing');
                if(!panel.querySelector('.decimal-hint').textContent.includes('💯'))errors.push('wrong answer format hint');
              }
              return errors;
            })()`);
            if(failures.length){
              const shot=await send('Page.captureScreenshot',{format:'png'},sessionId);fs.writeFileSync(path.join(work,'percentage-failure.png'),Buffer.from(shot.data,'base64'));
              console.log(path.join(work,'percentage-failure.png'));
              console.log(await evaluate(`[...document.querySelectorAll('.player-panel .operation')].map(e=>({width:e.clientWidth,scrollWidth:e.scrollWidth,height:e.clientHeight,scrollHeight:e.scrollHeight,font:getComputedStyle(e).fontSize,text:e.innerText}))`));
            }
            assert.deepEqual(failures,[],`Percentages ${width}x${height} ${mode} ${font} ${i} solution ${solution}: ${failures.join(', ')}`);
            views++;
          }
          if((width===1366&&mode==='single'&&font==='imprenta')||(width===360&&mode==='duel'&&font==='ligada')){
            const shot=await send('Page.captureScreenshot',{format:'png'},sessionId);fs.writeFileSync(path.join(work,'percentage-solution-'+width+'-'+mode+'.png'),Buffer.from(shot.data,'base64'));
          }
        }
        console.log('Percentage layouts checked: '+width+'x'+height);
      }
      await evaluate(`(() => {
        state.online=null;state.mode='single';state.activity='problemas';state.problemSettings=percentagePreviews[0].cfg;state.problemMix='individuales';launchGame(['problem'],180);stopTimer();
        const op=state.operationsByPlayer.get(0);
        if(!document.querySelector('.numpad [data-key=","]'))throw Error('Percentage decimal key missing');
        state.players[0].input=op.answerDisplay;submitPlayerAnswer(0);
        if(state.players[0].score!==10)throw Error('Exact percentage answer not accepted');
        document.querySelector('.solution-btn').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));refreshOperationDisplays();
        const shown=state.operationsByPlayer.get(0);
        if(!document.querySelector('.problem-final').textContent.includes(shown.answerDisplay))throw Error('Decimal display lost on refresh');
        document.querySelector('.solution-btn').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));
        if(state.players[0].score!==10)throw Error('Percentage assisted answer gave points');
        state.online={seed:42,active:true,currentOperationIndex:0};
        if(JSON.stringify(createOnlineOperation(5))!==JSON.stringify(createOnlineOperation(5)))throw Error('Percentage sequence differs between room participants');
        state.online=null;goHome();
      })()`);
      console.log('OK: '+views+' percentage layouts; all 160 templates, combined variants, both fonts, decimal answers, persistence and room configuration.');
    }
    if (unitsOnly || process.argv.length === 2) {
      await evaluate(`(() => {
        state.online=null;goHome();hideOnlineHostLobby();state.mode='single';state.activity='calculo';applyModeDependentUI();syncSettingsUIFromState();
        Object.values(state.operationSettings).forEach(c=>c.enabled=false);
        const set=(op,key,value)=>{const e=document.querySelector('[data-setting-op="'+op+'"][data-setting-key="'+key+'"]');if(!e)throw Error('Missing unit control');e.value=String(value);e.dispatchEvent(new Event('change',{bubbles:true}));};
        state.operationSettings.convertLength.enabled=true;set('convertLength','digits',2);set('convertLength','from',6);set('convertLength','to',4);
        state.decimalsEnabled=true;state.decimalPlaces=2;syncSettingsUIFromState();updateOpsSummary();savePreferences();
        if(readPreferences().operationSettings.convertLength.from!==6)throw Error('Conversion units not saved');
        state.operationSettings.convertLength.from=0;applySavedPreferences();
        if(state.operationSettings.convertLength.from!==6)throw Error('Conversion source not restored');
        set('convertLength','from',0);savePreferences();state.operationSettings.convertLength.from=2;applySavedPreferences();
        if(state.operationSettings.convertLength.from!==0)throw Error('Random source not restored');
        set('convertLength','from',6);
        const cfg=buildOnlineConfig();state.operationSettings.convertLength.to=0;applyOnlineConfig(cfg);
        if(state.operationSettings.convertLength.to!==4)throw Error('Conversion destination lost online');
        const c=createOperation('convertLength');if(!c.conversion||c.conversion.to!=='m'||!isCorrectOperationAnswer(c.answerDisplay,c))throw Error('Conversion calculation does not work');
        set('convertLength','from',4);set('convertLength','to',4);
        const alert=window.alert;let warned=false;window.alert=()=>warned=true;
        try{if(ensureConversionSettings()!==false||!warned||!document.getElementById('conversionConfigHint').textContent.includes('⚠️'))throw Error('Invalid conversion not blocked');}finally{window.alert=alert;}
        for(const key of Object.keys(NinjaUnits.kinds)){state.operationSettings[key]={enabled:true,digits:9,from:0,to:0};}
        state.online={seed:123,active:true};
        if(JSON.stringify(createOnlineOperation(8))!==JSON.stringify(createOnlineOperation(8)))throw Error('Online unit sequence not reproducible');state.online=null;
        syncSettingsUIFromState();document.querySelector('.conversion-config').open=true;
      })()`);
      for(const [width,height] of sizes){
        await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false},sessionId);
        const errors=await evaluate(`(async()=>{await new Promise(r=>requestAnimationFrame(r));const errors=[];if(document.documentElement.scrollWidth>innerWidth+1)errors.push('horizontal overflow');for(const e of document.querySelectorAll('#measureCalculationRows select')){const b=e.getBoundingClientRect();if(b.right>innerWidth+1||b.left<0)errors.push('unit selector outside viewport');}return errors;})()`);
        assert.deepEqual(errors,[],`Conversion controls ${width}x${height}`);
      }
      let views=0;
      for(const [width,height] of sizes){
        await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false},sessionId);
        for(const mode of ['single','duel'])for(const key of ['convertLength','convertMass','convertCapacity','convertTime'])for(const places of [0,3]){
          await evaluate(`state.online=null;state.activity='calculo';state.mode=${JSON.stringify(mode)};state.decimalsEnabled=${places>0};state.decimalPlaces=${places||1};launchGame([${JSON.stringify(key)}],60);stopTimer();refs.consentBanner.classList.add('hidden')`);
          for(const solution of [false,true]){
            const errors=await evaluate(`(async()=>{state.operationsByPlayer.forEach(op=>op.solutionRevealed=${solution});repaintPlayers();await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));const errors=[];if(document.documentElement.scrollHeight>innerHeight+2||document.documentElement.scrollWidth>innerWidth+2)errors.push('page scrolls');for(const panel of document.querySelectorAll('.player-panel')){const box=panel.getBoundingClientRect();for(const q of ['.operation','.numpad','.action-row']){const e=panel.querySelector(q),b=e.getBoundingClientRect();if(b.right>box.right+1||b.bottom>box.bottom+1||e.scrollHeight>e.clientHeight+2||e.scrollWidth>e.clientWidth+2)errors.push(q+' clipped');}if(${solution}&&!panel.querySelector('.conversion-solution'))errors.push('missing conversion explanation');if(!panel.querySelector('.decimal-hint').textContent.includes('Responde solo'))errors.push('wrong unit hint');}return errors;})()`);
            assert.deepEqual(errors,[],`Conversion ${width}x${height} ${mode} ${key} ${places} solution ${solution}: ${errors.join(', ')}`);views++;
          }
        }
      }
      await evaluate(`(() => {
        state.online=null;goHome();hideOnlineHostLobby();state.mode='single';state.activity='problemas';state.problemMix='individuales';syncProblemControls();
        const set=(key,value)=>{const e=document.querySelector('[data-problem-extra="'+key+'"]');if(e.type==='checkbox')e.checked=value;else e.value=String(value);e.dispatchEvent(new Event('change',{bubbles:true}));};
        set('_family','medidas');set('_measureMinDigits',9);set('_measureMinDigits',1);set('_measureMaxDigits',1);
        if(state.problemSettings._measureMaxDigits!==1||state.problemSettings._measureMinDigits!==1)throw Error('Measure range remained locked');
        set('_measureDecimals',true);set('_measurePlaces',3);set('_measure_longitudFrom',4);set('_measure_longitudTo',6);
        const cfg=buildOnlineConfig();set('_family','enteros');applyOnlineConfig(cfg);
        if(state.problemSettings._family!=='medidas'||state.problemSettings._measure_longitudTo!==6||readPreferences().problemSettings._measurePlaces!==3)throw Error('Measure config lost');
        const box=document.querySelector('[data-problem-families="medidas"]');box.querySelectorAll('details').forEach(d=>d.open=true);
        state.mode='teacher';refs.teacherDashboard.classList.remove('hidden');updateTeacherCreatePanel(true);setTeacherConfigExpanded(true);
        if(!refs.teacherConfigMount.querySelector('[data-problem-extra="_measure_longitudFrom"]'))throw Error('Teacher measure settings missing');
        updateTeacherCreatePanel(false);refs.teacherDashboard.classList.add('hidden');state.mode='single';applyModeDependentUI();
        document.querySelector('[data-mode="online"]').click();
        if(!refs.onlineCreateMount.querySelector('[data-problem-extra="_measure_longitudFrom"]'))throw Error('Online measure settings missing');
        document.querySelector('[data-mode="single"]').click();
        for(const kind of ['longitud','masa','capacidad','tiempo']){set('_measure_'+kind+'From',0);set('_measure_'+kind+'To',0);}
        for(const op of ['suma','resta','multiplicacion','division'])set('_measure_'+op,true);
      })()`);
      for(const [width,height] of sizes){
        await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false},sessionId);
        const errors=await evaluate(`(async()=>{await new Promise(r=>requestAnimationFrame(r));const errors=[];if(document.documentElement.scrollWidth>innerWidth+1)errors.push('horizontal overflow');for(const e of document.querySelectorAll('[data-problem-families="medidas"] select')){const b=e.getBoundingClientRect();if(b.right>innerWidth+1||b.left<0)errors.push('measure selector outside viewport');}return errors;})()`);
        assert.deepEqual(errors,[],`Measure controls ${width}x${height}`);
        if(width===360){const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true},sessionId);fs.writeFileSync(path.join(work,'measure-controls-mobile.png'),Buffer.from(shot.data,'base64'));}
      }
      const previews=await evaluate(`(() => {
        globalThis.measurePreviews=[];
        for(const mix of ['individuales','combinados']){
          const cfg=NinjaProblems.normalize({...state.problemSettings,_family:'medidas',_measureMinDigits:9,_measureMaxDigits:9,_measureDecimals:true,_measurePlaces:3});
          const pool=NinjaProblems.compatible(cfg,{mix});
          for(let i=0;i<pool.length;i++)measurePreviews.push({cfg,mix,op:NinjaProblems.generate(cfg,i,125,{mix})});
        }
        return measurePreviews.map((p,i)=>({i,length:p.op.problem.text.length,type:p.op.problem.category,mix:p.mix}));
      })()`);
      const representatives=[];
      for(const mix of ['individuales','combinados'])for(const type of ['longitud','masa','capacidad','tiempo'])representatives.push(previews.filter(p=>p.mix===mix&&p.type===type).sort((a,b)=>b.length-a.length)[0].i);
      for(const [width,height] of sizes){
        await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false},sessionId);
        for(const mode of ['single','duel'])for(const font of ['imprenta','ligada']){
          await evaluate(`state.online=null;state.activity='problemas';state.mode=${JSON.stringify(mode)};state.problemFont=${JSON.stringify(font)};state.problemSettings=measurePreviews[0].cfg;state.problemMix='individuales';launchGame(['problem'],180);stopTimer();refs.consentBanner.classList.add('hidden');syncProblemControls();document.fonts.load('400 20px "Escolar Ligada"')`);
          const indexes=width===1366&&mode==='single'&&font==='imprenta'?previews.map(p=>p.i):representatives;
          for(const i of indexes)for(const solution of [false,true]){
            const errors=await evaluate(`(async()=>{const preview=measurePreviews[${i}];state.problemSettings=preview.cfg;state.problemMix=preview.mix;state.players.forEach(p=>state.operationsByPlayer.set(p.id,decorateOperation({...preview.op,solutionRevealed:${solution}})));repaintPlayers();await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));const errors=[];if(document.documentElement.scrollHeight>innerHeight+2||document.documentElement.scrollWidth>innerWidth+2)errors.push('page scrolls');for(const panel of document.querySelectorAll('.player-panel')){const box=panel.getBoundingClientRect();for(const q of ['.operation','.numpad','.action-row']){const e=panel.querySelector(q),b=e.getBoundingClientRect();if(b.right>box.right+1||b.bottom>box.bottom+1||e.scrollHeight>e.clientHeight+2||e.scrollWidth>e.clientWidth+2)errors.push(q+' clipped');}if(${solution}&&(!panel.querySelector('.problem-question')||!panel.querySelector('.problem-final').textContent.includes(preview.op.answerDisplay)))errors.push('missing reading or answer');}return errors;})()`);
            if(errors.length){const shot=await send('Page.captureScreenshot',{format:'png'},sessionId);fs.writeFileSync(path.join(work,'measure-failure.png'),Buffer.from(shot.data,'base64'));console.log(path.join(work,'measure-failure.png'));}
            assert.deepEqual(errors,[],`Measure ${width}x${height} ${mode} ${font} ${i} solution ${solution}: ${errors.join(', ')}`);views++;
          }
          if((width===1366&&mode==='single'&&font==='imprenta')||(width===360&&mode==='duel'&&font==='ligada')){const shot=await send('Page.captureScreenshot',{format:'png'},sessionId);fs.writeFileSync(path.join(work,'measure-solution-'+width+'-'+mode+'.png'),Buffer.from(shot.data,'base64'));}
        }
        console.log('Measure layouts checked: '+width+'x'+height);
      }
      await evaluate(`(() => {
        state.online=null;state.activity='calculo';state.mode='single';state.decimalsEnabled=true;state.decimalPlaces=2;
        state.operationSettings.convertLength={enabled:true,digits:2,from:6,to:4};launchGame(['convertLength'],60);stopTimer();
        const op=state.operationsByPlayer.get(0);for(const key of op.answerDisplay)window.dispatchEvent(new KeyboardEvent('keydown',{key}));window.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',code:'Enter'}));
        if(state.players[0].score!==10)throw Error('Conversion physical keyboard answer failed');
        document.querySelector('.solution-btn').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));refreshOperationDisplays();
        if(!document.querySelector('.conversion-solution'))throw Error('Conversion lost on refresh');
        document.querySelector('.solution-btn').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));if(state.players[0].score!==10)throw Error('Assisted conversion awarded points');
        state.activity='problemas';state.problemSettings=measurePreviews[0].cfg;state.problemMix='individuales';launchGame(['problem'],180);stopTimer();
        state.players[0].input=state.operationsByPlayer.get(0).answerDisplay;submitPlayerAnswer(0);if(state.players[0].score!==10)throw Error('Measure problem answer failed');
        state.online={seed:42,active:true};if(JSON.stringify(createOnlineOperation(5))!==JSON.stringify(createOnlineOperation(5)))throw Error('Measure room sequence differs');state.online=null;goHome();
      })()`);
      console.log('OK: '+views+' unit/measure layouts, all 160 templates, both fonts, exact answers, keyboard, persistence and online/teacher settings.');
    }
    if (learningOnly || process.argv.length === 2) {
      const previews = await evaluate(`(() => {
        globalThis.learningPreviews=[];
        for(const family of Object.keys(NinjaExpansion.families)){
          const cfg=NinjaProblems.normalize({_family:family,_newDigits:3,_newDecimals:true});
          for(let i=0;i<NinjaProblems.compatible(cfg).length;i++){const op=NinjaProblems.generate(cfg,i,123);learningPreviews.push({cfg,op});if(op.followUp)learningPreviews.push({cfg,op:op.followUp});}
        }
        return learningPreviews.map((p,i)=>({i,family:p.op.problem.family,template:p.op.problem.templateId,length:p.op.problem.text.length}));
      })()`);
      const representatives=Object.keys({razonamiento:1,geometria:1,compras:1,proporcionalidad:1}).flatMap(f=>previews.filter(p=>p.family===f).sort((a,b)=>b.length-a.length).slice(0,2).map(p=>p.i));
      for(let v=1;v<=14;v++){const p=previews.find(p=>p.family==='geometria'&&p.template.endsWith('-'+v));if(p&&!representatives.includes(p.i))representatives.push(p.i);}
      let views=0;
      for(const [width,height] of sizes){
        await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false},sessionId);
        for(const mode of ['single','duel'])for(const font of ['imprenta','ligada']){
          await evaluate(`state.online=null;state.endCondition='time';state.activity='problemas';state.mode=${JSON.stringify(mode)};state.problemFont=${JSON.stringify(font)};state.problemSettings=learningPreviews[0].cfg;state.problemMix='individuales';launchGame(['problem'],180);stopTimer();refs.consentBanner.classList.add('hidden');syncProblemControls();document.fonts.load('400 20px "Escolar Ligada"')`);
          const indexes=width===1366&&mode==='single'&&font==='imprenta'?previews.map(p=>p.i):representatives;
          for(const i of indexes)for(const solution of [false,true]){
            const errors=await evaluate(`(async()=>{const preview=learningPreviews[${i}];state.problemSettings=preview.cfg;state.players.forEach(p=>state.operationsByPlayer.set(p.id,decorateOperation({...preview.op,solutionRevealed:${solution}})));repaintPlayers();await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));const errors=[];if(document.documentElement.scrollHeight>innerHeight+2||document.documentElement.scrollWidth>innerWidth+2)errors.push('page scrolls');for(const panel of document.querySelectorAll('.player-panel')){const box=panel.getBoundingClientRect();for(const q of ['.operation','.numpad','.action-row']){const e=panel.querySelector(q),b=e.getBoundingClientRect();if(b.right>box.right+1||b.bottom>box.bottom+1||e.scrollHeight>e.clientHeight+2||e.scrollWidth>e.clientWidth+2)errors.push(q+' clipped');}if(!${solution}&&panel.querySelector('.problem-kicker')&&!panel.querySelector('.problem-kicker').textContent.includes('Lee y resuelve'))errors.push('operation leaked');}return errors;})()`);
            if(errors.length){const shot=await send('Page.captureScreenshot',{format:'png'},sessionId);fs.writeFileSync(path.join(work,'learning-failure.png'),Buffer.from(shot.data,'base64'));console.log(path.join(work,'learning-failure.png'));}
            assert.deepEqual(errors,[],`Learning ${width}x${height} ${mode} ${font} ${i} solution ${solution}: ${errors.join(', ')}`); views++;
          }
        }
        for(const mode of ['single','duel'])for(const key of ['missing','compare','power','round'])for(const solution of [false,true]){
          const errors=await evaluate(`(async()=>{state.online=null;state.endCondition='time';state.mode=${JSON.stringify(mode)};state.activity='calculo';Object.values(state.operationSettings).forEach(c=>c.enabled=false);state.operationSettings[${JSON.stringify(key)}]={...state.operationSettings[${JSON.stringify(key)}],enabled:true,digits:${key==='round'?6:3},operator:3,variant:1,exponentMax:5,place:-3};launchGame([${JSON.stringify(key)}],60);stopTimer();state.operationsByPlayer.forEach(op=>op.solutionRevealed=${solution});repaintPlayers();await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));const errors=[];for(const panel of document.querySelectorAll('.player-panel')){const box=panel.getBoundingClientRect();for(const q of ['.operation','.numpad','.action-row']){const e=panel.querySelector(q),b=e.getBoundingClientRect();if(b.right>box.right+1||b.bottom>box.bottom+1||e.scrollHeight>e.clientHeight+2||e.scrollWidth>e.clientWidth+2)errors.push(q+' clipped');}if(${JSON.stringify(key)}==='compare'&&panel.querySelectorAll('.numpad [data-key]').length!==3)errors.push('comparison keypad missing');}return errors;})()`);
          if(errors.length){const shot=await send('Page.captureScreenshot',{format:'png'},sessionId);fs.writeFileSync(path.join(work,'calculation-failure.png'),Buffer.from(shot.data,'base64'));console.log(path.join(work,'calculation-failure.png'));console.log(await evaluate(`[...document.querySelectorAll('.player-panel .operation')].map(e=>({width:e.clientWidth,height:e.clientHeight,sw:e.scrollWidth,sh:e.scrollHeight,text:e.innerText,font:getComputedStyle(e).fontSize}))`));}
          assert.deepEqual(errors,[],`New calculation ${width}x${height} ${mode} ${key} solution ${solution}`);views++;
        }
        console.log('Learning layouts checked: '+width+'x'+height);
      }
      await evaluate(`(async()=>{
        state.online=null;goHome();hideOnlineHostLobby();state.mode='single';state.endCondition='unlimited';state.activity='calculo';state.operationSettings.missing={enabled:true,digits:1,operator:1};Object.entries(state.operationSettings).forEach(([k,c])=>c.enabled=k==='missing');
        launchGame(['missing'],0);state.timeLeft=1;await new Promise(r=>setTimeout(r,1100));if(!state.isRunning||state.timeLeft!==1)throw Error('Untimed game finished or counted down');stopTimer();
        state.endCondition='correct';state.goalCount=2;launchGame(['missing'],0);stopTimer();
        if(!document.getElementById('finishRoundBtn').classList.contains('hidden'))throw Error('A pupil can bypass a goal with Finish');
        state.players[0].input='-1';submitPlayerAnswer(0);if(state.reviewErrors.length!==1||state.players[0].wrongCount!==1)throw Error('Wrong answer not recorded');
        for(let i=0;i<2;i++){state.players[0].input=state.operationsByPlayer.get(0).answerDisplay;submitPlayerAnswer(0);}
        if(state.isRunning||refs.resultsOverlay.classList.contains('hidden')||state.players[0].correctCount!==2)throw Error('Correct-answer goal did not finish');
        const score=state.players[0].score,err=state.reviewErrors[0];document.getElementById('reviewErrorsBtn').click();
        document.querySelector('[data-review-input="0"]').value=err.operation.answerDisplay;document.querySelector('[data-review-check="0"]').click();
        if(!document.querySelector('[data-review-message="0"]').textContent.includes('Ahora sí')||state.players[0].score!==score)throw Error('Error review failed or changed score');document.getElementById('closeReviewBtn').click();
        state.endCondition='questions';state.goalCount=1;state.activity='problemas';state.problemSettings=NinjaProblems.normalize({_family:'geometria',_geometryVariant:1,_newDigits:1});launchGame(['problem'],0);stopTimer();
        document.querySelector('.hint-btn').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));if(!document.getElementById('hintDialog').open||state.operationsByPlayer.get(0).hintStage!==1)throw Error('First hint failed');
        document.getElementById('nextHintBtn').click();if(state.operationsByPlayer.get(0).hintStage!==2)throw Error('Second hint failed');document.getElementById('nextHintBtn').click();
        if(!state.operationsByPlayer.get(0).solutionRevealed||!document.querySelector('.problem-review-reading'))throw Error('Hint solution lost reading');
        document.querySelector('.solution-btn').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));if(state.isRunning||state.players[0].score!==0||state.players[0].resolvedCount!==1)throw Error('Assisted question goal failed');
        state.endCondition='time';launchGame(['problem'],60);stopTimer();showProgressiveHint(0);await finishGame();if(document.getElementById('hintDialog').open)throw Error('Expired game left the hint dialog covering results');
        state.endCondition='unlimited';state.activity='calculo';state.operationSettings.compare={enabled:true,digits:1,variant:0};Object.entries(state.operationSettings).forEach(([k,c])=>c.enabled=k==='compare');launchGame(['compare'],0);stopTimer();
        let op=state.operationsByPlayer.get(0);window.dispatchEvent(new KeyboardEvent('keydown',{key:op.answerSymbol}));window.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter'}));if(state.players[0].score!==10)throw Error('Physical comparison key failed');
        op=state.operationsByPlayer.get(0);document.querySelector('.numpad [data-key="'+op.answerSymbol+'"]').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));document.querySelector('[data-action="submit"]').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));if(state.players[0].score!==20)throw Error('Tactile comparison key failed');
        state.activity='problemas';state.problemSettings=NinjaProblems.normalize({_family:'razonamiento',_reasonVariant:2,_newDigits:1});launchGame(['problem'],0);stopTimer();
        op=state.operationsByPlayer.get(0);const next=op.followUp;state.players[0].input=op.answerDisplay;submitPlayerAnswer(0);if(state.operationsByPlayer.get(0).signature!==next.signature)throw Error('Linked question lost its context');
        goHome();state.mode='single';state.endCondition='questions';state.goalCount=17;syncLearningControls();savePreferences();const cfg=buildOnlineConfig();state.endCondition='time';applyOnlineConfig(cfg);if(state.endCondition!=='questions'||state.goalCount!==17)throw Error('Goal config lost online');
        applySavedPreferences();if(state.endCondition!=='questions'||state.goalCount!==17)throw Error('Goal preference lost');
      })()`);
      await evaluate(`(async()=>{
        globalThis.savedOnline={...NinjaOnline};NinjaOnline.enabled=true;globalThis.finishCalls=0;globalThis.mockRoom={mode:'teacher',seed:456,startedAt:Date.now()-5000,status:'running',config:JSON.stringify({activity:'calculo',endCondition:'correct',goalCount:2}),players:{p1:{name:'Paco 🥷',score:10,correctCount:1,wrongCount:0,operationIndex:1,roundSeed:456}}};
        NinjaOnline.updatePlayer=async(code,id,patch)=>{Object.assign(mockRoom.players[id],patch);};NinjaOnline.getRoom=async()=>mockRoom;NinjaOnline.finishRoom=async()=>{finishCalls++;};
        state.mode='online';state.activity='calculo';state.endCondition='correct';state.goalCount=2;Object.entries(state.operationSettings).forEach(([k,c])=>c.enabled=k==='missing');
        state.online={code:'123456',playerId:'p1',isHost:false,isTeacher:false,active:true,seed:456,currentOperationIndex:1,correctCount:1,wrongCount:0,room:mockRoom,config:{activity:'calculo',endCondition:'correct',goalCount:2}};
        launchGame(['missing'],0);stopTimer();state.players[0].input=state.operationsByPlayer.get(0).answerDisplay;submitPlayerAnswer(0);await new Promise(r=>setTimeout(r,800));
        if(state.isRunning||finishCalls||!mockRoom.players.p1.isFinished)throw Error('Student goal incorrectly closed room or lost completion');handleOnlineRoomUpdate(mockRoom);if(state.isRunning)throw Error('Completed goal restarted on room update');
        state.online.connected=false;updateConnectionIndicator();if(!document.getElementById('connectionIndicator').textContent.includes('Sin conexión'))throw Error('Offline indicator missing');
        const offlineScore=state.players[0].score;state.isRunning=true;state.players[0].input=state.operationsByPlayer.get(0).answerDisplay;submitPlayerAnswer(0);state.isRunning=false;if(state.players[0].score!==offlineScore)throw Error('Offline answer changed score');
        state.online.connected=true;updateConnectionIndicator();if(!document.getElementById('connectionIndicator').textContent.includes('Conectado'))throw Error('Reconnect indicator missing');
        state.online.isHost=true;mockRoom.players.p2={name:'Ana 🌟',score:20,correctCount:2,wrongCount:1,isFinished:false};handleOnlineRoomUpdate(mockRoom);if(finishCalls)throw Error('Room closed before all reached goal');mockRoom.players.p2.isFinished=true;handleOnlineRoomUpdate(mockRoom);if(finishCalls!==1)throw Error('Room did not finish after all completed');
        NinjaLearning.clear();mockRoom.startedAt=Date.now()+1;mockRoom.status='finished';captureLearningRound(mockRoom);captureLearningRound(mockRoom);if(NinjaLearning.read().length!==1)throw Error('Duplicate round in report');
        captureLearningRound({...mockRoom,seed:457,startedAt:mockRoom.startedAt+1000,mode:'duel_online'});if(NinjaLearning.read().length!==2||NinjaLearning.aggregate()[0].rounds!==2)throw Error('Multi-round report lost pupils');
        showLearningReports();if(!document.getElementById('reportsDialog').open||!document.getElementById('reportsContent').textContent.includes('Paco'))throw Error('Report dialog missing pupils');
        if(NinjaLearning.workbook()[0]!==80||!NinjaLearning.printHtml().includes('Guardar como PDF'))throw Error('Report export failed');
        document.getElementById('closeReportsBtn').click();
        mockRoom.status='running';state.activity='problemas';state.endCondition='unlimited';state.problemSettings=NinjaProblems.normalize({_family:'razonamiento',_reasonVariant:2,_newDigits:1});state.online.active=true;state.online.currentOperationIndex=0;state.online.seed=456;state.online.correctCount=0;state.online.wrongCount=0;mockRoom.players.p1={name:'Paco 🥷',score:0,correctCount:0,wrongCount:0,operationIndex:0};
        launchGame(['problem'],0);stopTimer();const parent=state.operationsByPlayer.get(0),expectedNext=parent.followUp.signature;state.players[0].input=parent.answerDisplay;submitPlayerAnswer(0);
        if(mockRoom.players.p1.pendingFollowUpFrom!==0)throw Error('Linked question resume index not saved');launchGame(['problem'],0);stopTimer();if(state.operationsByPlayer.get(0).signature!==expectedNext||state.players[0].score!==10)throw Error('Rejoin lost linked question or score');
        Object.assign(NinjaOnline,savedOnline);state.online=null;state.endCondition='time';state.goalCount=10;goHome();hideOnlineHostLobby();
      })()`);
      await send('Emulation.setDeviceMetricsOverride',{width:1366,height:768,deviceScaleFactor:1,mobile:false},sessionId);
      await evaluate('showLearningReports();new Promise(r=>requestAnimationFrame(r))');
      const reportShot=await send('Page.captureScreenshot',{format:'png'},sessionId);fs.writeFileSync(path.join(work,'learning-report.png'),Buffer.from(reportShot.data,'base64'));
      await evaluate(`document.getElementById('reportsDialog').close();state.mode='single';state.activity='problemas';state.endCondition='unlimited';state.problemSettings=NinjaProblems.normalize({_family:'geometria',_geometryVariant:3,_newDigits:2});launchGame(['problem'],0);stopTimer();new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))`);
      const geometryShot=await send('Page.captureScreenshot',{format:'png'},sessionId);fs.writeFileSync(path.join(work,'learning-geometry.png'),Buffer.from(geometryShot.data,'base64'));
      await evaluate(`goHome();state.endCondition='time';syncLearningControls()`);
      const {targetId:pdfTarget}=await send('Target.createTarget',{url:'about:blank'});
      const {sessionId:pdfSession}=await send('Target.attachToTarget',{targetId:pdfTarget,flatten:true});
      const {frameTree}=await send('Page.getFrameTree',{},pdfSession);
      const reportHtml=await evaluate('NinjaLearning.printHtml()');
      await send('Page.setDocumentContent',{frameId:frameTree.frame.id,html:reportHtml},pdfSession);
      const pdf=await send('Page.printToPDF',{landscape:true,printBackground:true},pdfSession);
      assert.ok(Buffer.from(pdf.data,'base64').length>1000);fs.writeFileSync(path.join(work,'seguimiento.pdf'),Buffer.from(pdf.data,'base64'));await send('Target.closeTarget',{targetId:pdfTarget});
      console.log('OK: '+views+' learning layouts, goals, untimed, progressive hints, error review, comparison keyboards, linked questions, connection indicators, multi-round reports, XLSX and printed PDF.');
    }
    for (const [width,height] of sizes) {
      await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false},sessionId);
      const errors=await evaluate(`(async()=>{
        goHome();state.mode='online';state.online={code:'W8K7N9X2',isHost:true,isTeacher:false,active:false};
        showOnlineHostLobby('W8K7N9X2',true);
        await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
        const e=refs.onlineRoomCode,b=e.getBoundingClientRect(),parent=e.parentElement.getBoundingClientRect(),errors=[];
        if(e.scrollWidth>e.clientWidth+2||b.right>parent.right+1||b.left<parent.left-1)errors.push('eight-character room code clipped');
        if(document.documentElement.scrollWidth>innerWidth+2)errors.push('lobby horizontal scroll');
        goHome();return errors;
      })()`);
      assert.deepEqual(errors,[],`Room code ${width}x${height}`);
    }
    let teacherViews = 0;
    for(const [width,height] of [[360,740],[768,1024],[1024,768],[1366,768],[1920,1080]]) {
      await send('Emulation.setDeviceMetricsOverride', {width,height,deviceScaleFactor:1,mobile:false},sessionId);
      for(const count of [0,1,4,12,20,30,40,60].filter(n=>width>=768||n<=30)) for(const phase of ['lobby','running','finished']) {
        const errors=await evaluate(`(async()=>{
          goHome();state.mode='teacher';state.timeLeft=90;state.isRunning=${phase === 'running'};
          state.online={code:'W8K7N9X2',isTeacher:true,isHost:true,active:true,teacherResultsShown:true,durationSeconds:120};
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
