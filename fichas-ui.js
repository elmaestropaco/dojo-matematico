let worksheetDraft=null,worksheetEntries=[];
const sheetEl=id=>document.getElementById(id);
const sheetClone=value=>JSON.parse(JSON.stringify(value));
function initWorksheetUI(){
  const dialog=document.createElement('dialog');dialog.id='worksheetDialog';dialog.className='learning-dialog worksheet-dialog';dialog.setAttribute('aria-labelledby','worksheetTitle');
  dialog.innerHTML=`<div class="sheet-heading"><div><span class="section-eyebrow">PRACTICA TAMBIÉN EN PAPEL</span><h3 id="worksheetTitle">📄 Generador de fichas PDF</h3></div><button id="sheetClose" class="btn-mini" type="button">Cerrar</button></div>
    <p>Prepara ejercicios nuevos sin cambiar tu partida. Al imprimir, elige <strong>Guardar como PDF</strong>. Todo se genera en este navegador.</p>
    <div class="sheet-options"><label>Título de la ficha<input id="sheetName" maxlength="100" value="Mi entrenamiento matemático"></label><label>Contenido<select id="sheetSource"><option value="calculo">Cálculo</option><option value="problemas">Problemas</option><option value="ambos">Cálculo y problemas</option></select></label><label>Reparto<select id="sheetDistribution"><option value="balanced">Misma cantidad de cada tipo</option><option value="mixed">Mixto aleatorio (cantidad total)</option></select></label><label><span id="sheetQuantityLabel">Ejercicios de cada tipo</span><input id="sheetQuantity" type="number" min="1" max="200" step="1" value="5"></label><label>Formato de operaciones<select id="sheetFormat"><option value="horizontal">Horizontal</option><option value="vertical">Vertical</option><option value="mixed">Mezclado</option></select></label><label>Ejercicios por fila<select id="sheetColumns"><option value="1">1</option><option value="2" selected>2</option><option value="3">3</option></select></label><label>Renglones para resolver<select id="sheetLines"><option value="0">Sin renglones extra</option><option value="2" selected>2</option><option value="4">4</option><option value="6">6</option></select></label><label class="sheet-check"><input id="sheetSolutions" type="checkbox" checked> Añadir soluciones con pasos al final</label></div>
    <p class="hint">Vertical se aplica a sumas, restas, multiplicaciones y divisiones básicas. Fracciones, ecuaciones y otros retos conservan su notación. Máximo: 200 ejercicios por ficha.</p>
    <details class="sheet-extra"><summary>🔢 Decimales y signos en cálculo</summary><div class="sheet-options"><label class="sheet-check"><input id="sheetDecimals" type="checkbox"> Activar decimales</label><label>Decimales<select id="sheetPlaces"><option>1</option><option>2</option><option>3</option></select></label><label class="sheet-check"><input id="sheetNegative" type="checkbox"> Permitir negativos en operaciones básicas</label></div><p class="hint">Los retos de enteros tienen sus propios signos. Las soluciones son exactas y no se redondean; un producto decimal puede necesitar más cifras decimales.</p></details>
    <details id="sheetProblemOptions" class="sheet-extra hidden"><summary>📖 Ajustes de problemas</summary><div class="sheet-options"><label>Cifras mínimas<input id="sheetProblemMin" type="number" min="1" max="9" value="1"></label><label>Cifras máximas<input id="sheetProblemMax" type="number" min="1" max="9" value="1"></label><label>Dificultad<select id="sheetDifficulty"><option value="facil">Fácil</option><option value="media">Media</option><option value="avanzada">Avanzada</option></select></label><label>Llevadas / préstamos<select id="sheetCarry"><option value="ambas">Con y sin llevadas</option><option value="sin">Sin llevadas</option><option value="con">Con llevadas</option></select></label><label class="sheet-check"><input id="sheetDrawings" type="checkbox" checked> Incluir dibujos opcionales</label><label>Fracciones: tipos de problema<select id="sheetProblemMix"><option value="individuales">Individuales</option><option value="combinados">Combinados</option><option value="mixto">Individuales y combinados</option></select></label></div><p>Operaciones para problemas combinados y fracciones:</p><div class="sheet-combine">${['suma','resta','multiplicacion','division'].map((key,i)=>`<label class="sheet-check"><input type="checkbox" data-sheet-combine="${key}" ${i<2?'checked':''}> ${['Sumas','Restas','Multiplicaciones','Divisiones'][i]}</label>`).join('')}</div><p class="hint">Las familias con niveles (lectura, razonamiento…) usan un nivel de 1 a 3. Las cifras de fracciones y geometría se limitan a las admitidas por su banco. Figuras y otras opciones parten de tus ajustes de Problemas.</p></details>
    <div class="sheet-selection-actions"><button id="sheetLoadGame" class="btn-mini" type="button">📥 Cargar selección y ajustes de la partida</button><button id="sheetSelectVisible" class="btn-mini" type="button">Marcar resultados</button><button id="sheetClearTypes" class="btn-mini" type="button">Quitar todos los tipos</button></div><label class="sheet-search-label">🔎 Buscar tipos<input id="sheetSearch" type="search" placeholder="Sumas, fracciones, ecuaciones, geometría…"></label><div id="sheetCatalog"></div><p id="sheetSummary" class="hint" aria-live="polite"></p><p id="sheetNotice" class="sheet-notice" role="status"></p>
    <div class="sheet-main-actions"><button id="sheetGenerate" class="btn-main" type="button">✨ Generar vista previa</button><button id="sheetPrint" class="btn-mini" type="button" disabled>📄 Imprimir / Guardar PDF</button><button id="sheetNewTab" class="btn-mini" type="button" disabled>Abrir ficha en otra pestaña</button></div><div id="sheetPreviewWrap" class="hidden"><p class="hint">La ficha impresa se adapta a A4. Las soluciones comienzan en una página nueva al final.</p><iframe id="sheetPreview" title="Vista previa de la ficha imprimible"></iframe></div>`;
  document.body.appendChild(dialog);
  sheetEl('worksheetHomeBtn').addEventListener('click',()=>{if(!worksheetDraft)loadWorksheetFromGame();dialog.showModal();});
  sheetEl('sheetClose').addEventListener('click',()=>dialog.close());
  sheetEl('sheetLoadGame').addEventListener('click',()=>{loadWorksheetFromGame();sheetEl('sheetNotice').textContent='Selección y ajustes de la partida cargados. La partida no ha cambiado.';});
  sheetEl('sheetSearch').addEventListener('input',filterWorksheetCatalog);
  sheetEl('sheetSource').addEventListener('change',filterWorksheetCatalog);
  dialog.addEventListener('change',event=>{
    const input=event.target;
    if(input.id==='sheetSearch')return;
    if(input.dataset.sheetPick){input.checked?worksheetDraft.selected.add(input.dataset.sheetPick):worksheetDraft.selected.delete(input.dataset.sheetPick);}
    if(input.dataset.sheetField){const [kind,field]=input.dataset.sheetField.split(':');worksheetDraft.settings[kind][field]=Number(input.value);}
    if(input.dataset.sheetVariant)worksheetDraft.problemVariants[input.dataset.sheetVariant]=Number(input.value);
    if(input.id==='sheetProblemMin'&&Number(input.value)>Number(sheetEl('sheetProblemMax').value))sheetEl('sheetProblemMax').value=input.value;
    if(input.id==='sheetProblemMax'&&Number(input.value)<Number(sheetEl('sheetProblemMin').value))sheetEl('sheetProblemMin').value=input.value;
    invalidateWorksheet();updateWorksheetSummary();
  });
  dialog.addEventListener('input',event=>{if(event.target.id==='sheetName'||event.target.id==='sheetQuantity'){invalidateWorksheet();updateWorksheetSummary();}});
  sheetEl('sheetClearTypes').addEventListener('click',()=>{worksheetDraft.selected.clear();sheetEl('sheetCatalog').querySelectorAll('[data-sheet-pick]').forEach(e=>e.checked=false);invalidateWorksheet();updateWorksheetSummary();});
  sheetEl('sheetSelectVisible').addEventListener('click',()=>{for(const entry of worksheetEntries.filter(worksheetEntryMatches)){worksheetDraft.selected.add(entry.id);sheetEl(entry.checkbox).checked=true;}invalidateWorksheet();updateWorksheetSummary();});
  sheetEl('sheetGenerate').addEventListener('click',generateWorksheet);
  sheetEl('sheetPrint').addEventListener('click',()=>{if(!worksheetDraft?.html)return;try{const win=sheetEl('sheetPreview').contentWindow;win.focus();win.print();}catch{sheetEl('sheetNotice').textContent='Abre la ficha en otra pestaña para imprimirla.';}});
  sheetEl('sheetNewTab').addEventListener('click',()=>{if(!worksheetDraft?.html)return;const win=window.open('','_blank');if(!win){sheetEl('sheetNotice').textContent='El navegador ha bloqueado la pestaña. Permite ventanas emergentes para esta página.';return;}win.opener=null;win.document.write(worksheetDraft.html);win.document.close();});
  sheetEl('sheetPreview').addEventListener('load',()=>{
    const id=sheetEl('sheetPreview').contentDocument?.querySelector('meta[name="worksheet-id"]')?.content;
    if(worksheetDraft?.html&&id===worksheetDraft.id){sheetEl('sheetPrint').disabled=false;sheetEl('sheetNewTab').disabled=false;}
  });
}
function loadWorksheetFromGame(){
  worksheetDraft={selected:new Set(),settings:sheetClone(state.operationSettings),problemSettings:sheetClone(state.problemSettings),problemVariants:{},html:null};
  sheetEl('sheetSource').value=state.activity;sheetEl('sheetFormat').value=state.displayMode==='mixed'?'mixed':state.displayMode;sheetEl('sheetDecimals').checked=state.decimalsEnabled;sheetEl('sheetPlaces').value=String(state.decimalPlaces);sheetEl('sheetNegative').checked=state.allowNegative;
  sheetEl('sheetDrawings').checked=state.problemSettings._showDrawings!==false;
  for(const key of getEnabledOperationKeys())worksheetDraft.selected.add('calc:'+key);
  const family=state.problemSettings._family||'enteros';
  if(family==='enteros'){if(state.problemMix==='combinados')worksheetDraft.selected.add('problem:combinados');else for(const key of ['suma','resta','multiplicacion','division'])if(state.problemSettings[key]?.enabled)worksheetDraft.selected.add('problem:'+key);}
  else worksheetDraft.selected.add('problem:'+family);
  sheetEl('sheetProblemMix').value=state.problemMix;
  const first=['suma','resta','multiplicacion','division'].find(key=>state.problemSettings[key]?.enabled)||'suma',initial=state.problemSettings[first];sheetEl('sheetProblemMin').value=initial?.minDigits||1;sheetEl('sheetProblemMax').value=initial?.maxDigits||1;sheetEl('sheetDifficulty').value=initial?.difficulty==='todas'?'facil':initial?.difficulty||'facil';sheetEl('sheetCarry').value=initial?.carryMode||'ambas';
  for(const e of document.querySelectorAll('[data-sheet-combine]'))e.checked=Boolean(state.problemSettings[e.dataset.sheetCombine]?.enabled);
  renderWorksheetCatalog();invalidateWorksheet();filterWorksheetCatalog();
}
function worksheetVariant(key){
  const family=key.slice(8);
  if(family==='geometria')return{field:'_geometryVariant',labels:NinjaGeometry.names};
  if(NinjaReasoning.variants?.[family])return{field:'_aulaVariant',labels:NinjaReasoning.variants[family]};
  if(NinjaAula.variants?.[family])return{field:'_aulaVariant',labels:NinjaAula.variants[family]};
  if(NinjaLiteracyProblems.variants?.[family])return{field:`_${family}Variant`,labels:NinjaLiteracyProblems.variants[family]};
  if(family==='espacio')return{field:'_spaceVariant',labels:NinjaSpatial.variants};return null;
}
function renderWorksheetCatalog(){
  const esc=NinjaWorksheets.escape,groups=new Map();worksheetEntries=[];
  const add=(id,label,group)=>{const entry={id,label,group,checkbox:'sheet-pick-'+id.replace(':','-')};worksheetEntries.push(entry);if(!groups.has(group))groups.set(group,[]);groups.get(group).push(entry);};
  Object.entries(OPERATION_LABELS).forEach(([key,label])=>add('calc:'+key,label,'Cálculo · '+NinjaNumberGroups.domain(key)));
  ['suma','resta','multiplicacion','division','combinados'].forEach((key,i)=>add('problem:'+key,['Problemas de sumas','Problemas de restas','Problemas de multiplicaciones','Problemas de divisiones','Problemas combinados'][i],'Problemas · Operaciones'));
  for(const option of document.querySelector('[data-problem-extra="_family"]').options)if(option.value!=='enteros')add('problem:'+option.value,option.textContent,'Problemas · Banco completo');
  const fieldNames={digits:'Cifras',multiplicandMax:'Cifras del multiplicando',factorMax:'Cifras del factor',dividendMax:'Cifras del dividendo',divisorMax:'Cifras del divisor',numeratorMax:'Cifras del numerador',denominatorMax:'Cifras del denominador',divisorDigits:'Cifras del divisor',exponentDigits:'Cifras del exponente',variant:'Tipo',signedValues:'Valores con signo',negativeExponents:'Exponentes',count:'Cantidad de números',from:'De',to:'A',scientificRange:'Exponente máximo absoluto',divisibilityRule:'Criterio'};
  sheetEl('sheetCatalog').innerHTML=[...groups].map(([group,entries],i)=>`<details class="sheet-group" data-sheet-group="${i}"><summary>${esc(group)} <span class="sheet-group-count"></span></summary><div class="sheet-catalog-grid">${entries.map(entry=>{
    let fields='';const key=entry.id.slice(entry.id.indexOf(':')+1);
    if(entry.id.startsWith('calc:'))for(const select of document.querySelectorAll(`[data-setting-op="${key}"]`)){
      const field=select.dataset.settingKey,title=fieldNames[field]||select.getAttribute('aria-label')||field;
      fields+=`<label>${esc(title)}<select data-sheet-field="${esc(key+':'+field)}">${[...select.options].map(o=>`<option value="${esc(o.value)}" ${Number(o.value)===Number(worksheetDraft.settings[key][field])?'selected':''}>${esc(o.textContent)}</option>`).join('')}</select></label>`;
    }
    else{const variant=worksheetVariant(entry.id);if(variant){worksheetDraft.problemVariants[entry.id]=Number(worksheetDraft.problemSettings[variant.field]??-1);fields=`<label>Variedad<select data-sheet-variant="${esc(entry.id)}"><option value="-1">Todas</option>${variant.labels.map((v,i)=>`<option value="${i}" ${worksheetDraft.problemVariants[entry.id]===i?'selected':''}>${esc(v)}</option>`).join('')}</select></label>`;}}
    return`<article class="sheet-type" data-sheet-entry="${esc(entry.id)}"><label class="sheet-check"><input id="${entry.checkbox}" type="checkbox" data-sheet-pick="${esc(entry.id)}" ${worksheetDraft.selected.has(entry.id)?'checked':''}> ${esc(entry.label)}</label>${fields?`<details><summary>Ajustes de este tipo</summary><div class="sheet-type-fields">${fields}</div></details>`:''}</article>`;
  }).join('')}</div></details>`).join('');
}
function worksheetEntryMatches(entry){
  const source=sheetEl('sheetSource').value;if(source!=='ambos'&&!entry.id.startsWith(source==='calculo'?'calc:':'problem:'))return false;
  const norm=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(),words=norm(sheetEl('sheetSearch').value).trim().split(/\s+/).filter(Boolean),text=norm(entry.label+' '+entry.group);return words.every(w=>text.includes(w));
}
function filterWorksheetCatalog(){
  if(!worksheetDraft)return;
  for(const entry of worksheetEntries)sheetEl(entry.checkbox).closest('.sheet-type').classList.toggle('hidden',!worksheetEntryMatches(entry));
  for(const group of sheetEl('sheetCatalog').children){const visible=[...group.querySelectorAll('.sheet-type')].some(e=>!e.classList.contains('hidden'));group.classList.toggle('hidden',!visible);if(visible&&sheetEl('sheetSearch').value.trim())group.open=true;}
  sheetEl('sheetProblemOptions').classList.toggle('hidden',sheetEl('sheetSource').value==='calculo');updateWorksheetSummary();
}
function selectedWorksheetKeys(){const source=sheetEl('sheetSource').value;return[...worksheetDraft.selected].filter(key=>source==='ambos'||key.startsWith(source==='calculo'?'calc:':'problem:'));}
function invalidateWorksheet(){if(!worksheetDraft)return;worksheetDraft.html=null;worksheetDraft.items=[];worksheetDraft.id=null;sheetEl('sheetPrint').disabled=true;sheetEl('sheetNewTab').disabled=true;sheetEl('sheetPreviewWrap').classList.add('hidden');sheetEl('sheetPreview').srcdoc='';sheetEl('sheetNotice').textContent='';}
function updateWorksheetSummary(){
  if(!worksheetDraft)return;const quantity=Number(sheetEl('sheetQuantity').value),keys=selectedWorksheetKeys(),balanced=sheetEl('sheetDistribution').value==='balanced',total=balanced?quantity*keys.length:quantity;
  sheetEl('sheetQuantityLabel').textContent=balanced?'Ejercicios de cada tipo':'Ejercicios en total';sheetEl('sheetSummary').textContent=`${keys.length} tipos seleccionados · ${balanced?`${quantity} por tipo = ${total}`:total} ejercicios. ${total>200?'⚠️ Reduce la cantidad: máximo 200.':''}`;
  for(const group of sheetEl('sheetCatalog').children){const count=[...group.querySelectorAll('[data-sheet-pick]')].filter(e=>e.checked).length;group.querySelector('.sheet-group-count').textContent=count?`· ${count} seleccionados`:'';}
}
function worksheetProblemConfig(id){
  const base=sheetClone(worksheetDraft.problemSettings),key=id.slice(8),low=Number(sheetEl('sheetProblemMin').value),high=Number(sheetEl('sheetProblemMax').value);
  if(!Number.isInteger(low)||!Number.isInteger(high)||low<1||high>9||high<low)throw Error('Revisa las cifras mínima y máxima de problemas (1 a 9).');
  const difficulty=sheetEl('sheetDifficulty').value,level=['facil','media','avanzada'].indexOf(difficulty)+1,classic=['suma','resta','multiplicacion','division'],combined=new Set([...document.querySelectorAll('[data-sheet-combine]:checked')].map(e=>e.dataset.sheetCombine));
  for(const op of classic){const enabled=classic.includes(key)?op===key:combined.has(op);base[op]={...base[op],enabled,difficulty,minDigits:low,maxDigits:high,digitMode:low===high?'fijas':'intervalo',carryMode:sheetEl('sheetCarry').value,operandDigits:{first:{minDigits:low,maxDigits:high},second:{minDigits:low,maxDigits:high}}};}
  if((key==='combinados'||key==='fracciones'&&sheetEl('sheetProblemMix').value==='combinados')&&combined.size<2)throw Error('Elige al menos dos operaciones para los problemas combinados.');
  base._family=classic.includes(key)||key==='combinados'?'enteros':key;base._showDrawings=sheetEl('sheetDrawings').checked;base._aulaLevel=level;base._literacyLevel=level;
  for(const field of ['_newDigits','_fractionNumerator','_fractionDenominator','_theoryDigits','_spaceDigits'])base[field]=Math.min(3,high);
  base._percentageMinDigits=low;base._percentageMaxDigits=high;base._measureMinDigits=low;base._measureMaxDigits=high;
  const variant=worksheetVariant(id);if(variant)base[variant.field]=worksheetDraft.problemVariants[id]??-1;
  const mix=classic.includes(key)?'individuales':key==='combinados'?'combinados':sheetEl('sheetProblemMix').value;
  const config=NinjaProblems.normalize(base);if(!NinjaProblems.compatible(config,{mix}).length)throw Error(`No hay problemas compatibles para ${worksheetEntries.find(e=>e.id===id)?.label}. Revisa cifras, llevadas y operaciones seleccionadas.`);
  return{config,mix};
}
function worksheetCalculation(key,seed){
  const snapshot={operationSettings:state.operationSettings,displayMode:state.displayMode,decimalsEnabled:state.decimalsEnabled,decimalPlaces:state.decimalPlaces,allowNegative:state.allowNegative,activity:state.activity,activeEvent:state.activeEvent};
  try{
    state.operationSettings=worksheetDraft.settings;state.displayMode='horizontal';state.decimalsEnabled=sheetEl('sheetDecimals').checked;state.decimalPlaces=Number(sheetEl('sheetPlaces').value);state.allowNegative=sheetEl('sheetNegative').checked;state.activity='calculo';state.activeEvent=null;
    if(key==='div'&&!state.decimalsEnabled&&state.operationSettings.div.divisorMax>state.operationSettings.div.dividendMax)throw Error('Estas cifras de dividendo y divisor requieren activar decimales o aumentar el dividendo.');
    return withSeededRandom(seed,()=>{
      for(let attempt=0;attempt<30;attempt++){
        let op;
        if(state.decimalsEnabled&&['addNoCarry','addCarry','subNoBorrow','subBorrow'].includes(key)){
          const scale=10**state.decimalPlaces,digits=state.operationSettings[key].digits+state.decimalPlaces;
          const raw=key==='addNoCarry'?generateAdditionNoCarry(digits):key==='addCarry'?generateAdditionWithCarry(digits):key==='subNoBorrow'?generateSubtractionNoBorrow(digits):generateSubtractionWithBorrow(digits);
          const base={...raw,a:raw.a/scale,b:raw.b/scale,answer:raw.answer/scale};op=decorateOperation(state.allowNegative?withNegativeOperands(base):base);
        }else op=createBaseOperation(key);
        op.skillKind=key;
        if(['div','divHard'].includes(op.kind)&&Number.isFinite(op.a)&&Number.isFinite(op.b)){
          const places=key==='divHard'?worksheetDraft.settings[key].maxDecimals:state.decimalsEnabled?state.decimalPlaces:0;
          if(!isTerminatingDivisionWithinPlaces(Math.abs(op.a),Math.abs(op.b),places))continue;
        }
        return op;
      }
      throw Error('No se ha encontrado una división exacta con esas cifras y decimales.');
    });
  }finally{Object.assign(state,snapshot);}
}
function worksheetQuestion(op,format){
  const esc=NinjaWorksheets.escape;
  if(op.problem){const p=op.problem,diagram=NinjaReasoning.visual(p,sheetEl('sheetDrawings').checked);return`<p class="problem-question">${renderProblemText(p.text)}</p><div class="diagram">${diagram}</div>${op.choices?`<ol>${op.choices.map(s=>`<li>${esc(s)}</li>`).join('')}</ol>`:''}${op.followUp?.problem?`<p class="problem-question">b) ${renderProblemText(op.followUp.problem.text)}</p>`:''}`;}
  if(['add','sub','mul','div'].includes(op.kind)&&Number.isFinite(op.a)&&Number.isFinite(op.b)){
    const a=String(op.a).replace('.',','),b=String(op.b).replace('.',','),operand=op.b<0?`(${b})`:b,symbol={add:'+',sub:'−',mul:'×',div:'÷'}[op.kind];
    if(format==='vertical'&&op.kind==='div')return`<div class="long-division"><span>${esc(a)}</span><div class="divisor"><div>${esc(operand)}</div><small></small></div></div>`;
    if(format==='vertical'){
      const places=Math.max((a.split(',')[1]||'').length,(b.split(',')[1]||'').length),alignedA=op.a.toFixed(places).replace('.',','),alignedB=op.b.toFixed(places).replace('.',',');
      return`<div class="vertical"><div>${esc(alignedA)}</div><div class="bottom">${symbol} ${esc(alignedB)}</div><div>?</div></div>`;
    }
    return`<div class="math-question">${esc(a)} ${symbol} ${esc(operand)} = ______</div>`;
  }
  const question=op.htmlExpression?`${op.htmlExpression} = ?`:renderProblemText(op.expression||'')+(op.expression?.includes('?')||op.kind==='quadraticEquation'||op.kind==='linearEquation'||op.comparison?'':' = ?');
  const instruction=op.answerFormat==='roots'?'Halla las dos raíces reales (o indica la raíz doble).':op.answerFormat==='power'?'Expresa el resultado como una potencia con la misma base.':op.primeFactors?'Escribe el producto de factores primos.':op.answerFormat==='remainder'?'Indica cociente y resto.':op.comparison?'Escribe <, = o >.':op.inputHint?.replace(/Tecla.*$/i,'').replace(/tecla.*$/i,'')||'';
  return`<div class="math-question">${question}</div>${op.diagram?`<div class="diagram">${op.diagram}</div>`:''}${op.choices?`<ol>${op.choices.map(s=>`<li>${esc(s)}</li>`).join('')}</ol>`:''}${instruction?`<p class="print-note">${esc(instruction)}</p>`:''}`;
}
function worksheetSolution(op){
  if(op.problem){const p=op.problem,answer=op.answerLabel??op.answerDisplay??(op.answerFraction?NinjaWorksheets.show(op.answerFraction):op.answerExact??op.answer);return`<ol class="problem-steps">${p.steps.map((s,i)=>`<li>${renderProblemText(s)}${p.calculations[i]?`<div>${renderProblemText(p.calculations[i])}</div>`:''}</li>`).join('')}</ol><p class="answer-final">Respuesta: ${renderProblemText(String(answer))} ${escapeHtml(p.unit||'')}</p>${op.followUp?.problem?`<h4>Apartado b)</h4>${worksheetSolution(op.followUp)}`:''}`;}
  const exact=NinjaWorksheets.arithmetic(op);
  if(exact){
    const simplification=op.unsimplifiedAnswer&&exact.answer?`<p>Antes de simplificar: ${renderProblemText(NinjaWorksheets.show(op.unsimplifiedAnswer))}. Fracción simplificada: ${renderProblemText(NinjaWorksheets.show(exact.answer))}.</p>`:'';
    return`<ol>${exact.steps.map(s=>`<li>${renderProblemText(s)}</li>`).join('')}</ol>${simplification}<p class="answer-final">Resultado: ${renderProblemText(exact.answer?(op.operands?NinjaWorksheets.show(exact.answer):NinjaWorksheets.decimal(exact.answer)):exact.answerText)}</p>`;
  }
  if(op.explanation||op.answerFraction||op.conversion)return operationSolutionHtml(op);
  throw Error('Este ejercicio no tiene una solución explicada disponible.');
}
function generateWorksheet(){
  try{
    const seed=crypto.getRandomValues(new Uint32Array(1))[0],random=NinjaWorksheets.random(seed),plan=NinjaWorksheets.plan(selectedWorksheetKeys(),Number(sheetEl('sheetQuantity').value),sheetEl('sheetDistribution').value,random),seen=new Set(),problemConfigs=new Map();
    for(const key of new Set(plan))if(key.startsWith('problem:'))problemConfigs.set(key,worksheetProblemConfig(key));
    const items=plan.map((key,index)=>{
      let op;
      for(let attempt=0;attempt<12;attempt++){
        const questionSeed=(seed+index*9973+attempt*7919)>>>0;
        if(key.startsWith('calc:'))op=worksheetCalculation(key.slice(5),questionSeed);
        else{const {config,mix}=problemConfigs.get(key);op=NinjaProblems.generate(config,index,questionSeed,{mix});}
        const signature=op.signature||JSON.stringify(op);if(!seen.has(signature)||attempt===11){seen.add(signature);break;}
      }
      const format=sheetEl('sheetFormat').value==='mixed'?(random()<.5?'horizontal':'vertical'):sheetEl('sheetFormat').value;
      return{number:index+1,key,problem:Boolean(op.problem),questionHtml:worksheetQuestion(op,format),solutionHtml:worksheetSolution(op)};
    });
    const options={title:sheetEl('sheetName').value,columns:Number(sheetEl('sheetColumns').value),lines:Number(sheetEl('sheetLines').value),solutions:sheetEl('sheetSolutions').checked,id:seed.toString(36).toUpperCase()};
    worksheetDraft.html=NinjaWorksheets.documentHtml(items,options);worksheetDraft.items=items;worksheetDraft.id=options.id;sheetEl('sheetPrint').disabled=true;sheetEl('sheetNewTab').disabled=true;sheetEl('sheetPreview').srcdoc=worksheetDraft.html;sheetEl('sheetPreviewWrap').classList.remove('hidden');
    sheetEl('sheetNotice').textContent=`Ficha preparada: ${items.length} ejercicios${options.solutions?' y sus soluciones al final':''}. Pulsa Imprimir / Guardar PDF. Con cantidades altas pueden repetirse ejercicios.`;
  }catch(error){invalidateWorksheet();sheetEl('sheetNotice').textContent=error.message||'No se ha podido generar la ficha. Revisa los ajustes.';}
}
