(function(root){
  const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fraction=(n,d=1n)=>root.NinjaMathExtra.fraction(n,d);
  const show=f=>f.denominator==='1'?f.numerator:`${f.numerator}/${f.denominator}`;
  const random=seed=>{let n=Number(seed)>>>0;return()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};};
  function decimal(f){
    let n=BigInt(f.numerator),d=BigInt(f.denominator),sign=n<0n?'-':'';if(n<0n)n=-n;
    let remainder=n%d,tail='';while(remainder&&tail.length<12){remainder*=10n;tail+=remainder/d;remainder%=d;}
    return remainder?show(f):sign+String(n/d)+(tail?','+tail:'');
  }
  function numeric(text){
    text=String(text).replace(',','.');if(!/^-?\d+(?:\.\d+)?$/.test(text)||text.length>48)throw Error('Número no válido.');
    const [whole,tail='']=text.split('.');return fraction(BigInt(whole+tail),10n**BigInt(tail.length));
  }
  function evaluate(expression,asFraction=false){
    const source=String(expression).replace(/\s+/g,''),tokens=source.match(/\d+(?:[.,]\d+)?|[()+\-−×x*\/÷]/g)||[];
    if(tokens.join('')!==source||tokens.length>160)throw Error('Expresión aritmética no admitida.');
    let at=0;const steps=[],text=asFraction?show:decimal;
    function atom(){const token=tokens[at++];if(token==='-'||token==='−')return root.NinjaMathExtra.calculate(fraction(0),'resta',atom());if(token==='+')return atom();if(token==='('){const result=sum();if(tokens[at++]!==')')throw Error('Paréntesis incompleto.');return result;}return numeric(token);}
    function combine(a,op,b){const kind=['+'].includes(op)?'suma':['-','−'].includes(op)?'resta':['×','x','*'].includes(op)?'multiplicacion':'division',result=root.NinjaMathExtra.calculate(a,kind,b);steps.push(`${text(a)} ${kind==='suma'?'+':kind==='resta'?'−':kind==='multiplicacion'?'×':'÷'} ${text(b)} = ${text(result)}`);return result;}
    function product(){let result=atom();while(['×','x','*','/','÷'].includes(tokens[at])){const op=tokens[at++];result=combine(result,op,atom());}return result;}
    function sum(){let result=product();while(['+','-','−'].includes(tokens[at])){const op=tokens[at++];result=combine(result,op,product());}return result;}
    const answer=sum();if(at!==tokens.length)throw Error('Expresión incompleta.');return{answer,steps};
  }
  function arithmetic(op){
    if(['add','sub','mul','div'].includes(op.kind)&&Number.isFinite(op.a)&&Number.isFinite(op.b)){
      const symbol={add:'+',sub:'−',mul:'×',div:'÷'}[op.kind],a=numeric(op.a),b=numeric(op.b),result=evaluate(`(${String(op.a)}) ${symbol} (${String(op.b)})`);
      if(op.kind==='mul'&&a.denominator==='1'&&b.denominator==='1'&&BigInt(a.numerator)>=0n&&BigInt(b.numerator)>=0n){
        const first=BigInt(a.numerator),parts=[...b.numerator].reverse().map((digit,i)=>BigInt(digit)*10n**BigInt(i)).filter(n=>n!==0n);
        result.steps=parts.map(n=>`${first} × ${n} = ${first*n}`);if(parts.length>1)result.steps.push(`${parts.map(n=>first*n).join(' + ')} = ${result.answer.numerator}`);
      }else if(['add','sub'].includes(op.kind)&&a.denominator==='1'&&b.denominator==='1'&&(op.kind==='add'||BigInt(a.numerator)>=BigInt(b.numerator))&&BigInt(a.numerator)>=0n&&BigInt(b.numerator)>=0n){
        const aa=[...a.numerator].reverse(),bb=[...b.numerator].reverse();let carry=0;result.steps=[];
        for(let i=0;i<Math.max(aa.length,bb.length);i++){
          const x=Number(aa[i]||0),y=Number(bb[i]||0),before=carry;
          if(op.kind==='add'){const total=x+y+carry;carry=Math.floor(total/10);result.steps.push(`Columna ${i+1} desde la derecha: ${x} + ${y}${before?' + '+before+' de llevada':''} = ${total}; escribimos ${total%10}${carry?', llevamos '+carry:''}.`);}
          else{let current=x-carry;carry=current<y?1:0;if(carry)current+=10;result.steps.push(`Columna ${i+1} desde la derecha: ${x}${before?' − 1 del préstamo':''}${carry?' + 10 (pedimos una decena)':''} − ${y} = ${current-y}.`);}
        }
        if(carry&&op.kind==='add')result.steps.push(`Escribimos la llevada final ${carry} a la izquierda.`);
      }else if(op.kind==='div'){
        result.steps=[`Escribimos la división como fracción: ${decimal(a)} ÷ ${decimal(b)}.`,`Reducimos y calculamos: ${show(result.answer)} = ${decimal(result.answer)}.`,`Comprobación: ${show(result.answer)} × ${decimal(b)} = ${decimal(a)}.`];
      }else result.steps.unshift(op.kind==='mul'?'Multiplicamos sin redondear; colocamos la coma según los decimales de los factores.':'Alineamos las comas y operamos respetando los signos.');
      result.steps.push(`Resultado exacto: ${decimal(result.answer)}.`);return result;
    }
    if(['combined','combinedAdv'].includes(op.kind))return evaluate(op.expression);
    if(op.operands&&op.expression){const result=evaluate(op.expression.replace(/\d+\/\d+/g,'($&)'),true);result.steps.unshift('Respetamos los paréntesis y la prioridad. En sumas/restas buscamos denominador común; al dividir multiplicamos por la inversa.');return result;}
    if(op.kind==='fraction'){const m=op.expression.match(/^(\d+)\/(\d+) de (\d+)$/);if(m){const result=evaluate(`${m[3]} / ${m[2]} * ${m[1]}`);result.steps.unshift('Dividimos la cantidad entre el denominador y multiplicamos por el numerador.');return result;}}
    if(op.kind==='percent'){const m=op.expression.match(/^(\d+)% de (\d+)$/);if(m){const result=evaluate(`${m[2]} * ${m[1]} / 100`);result.steps.unshift('Un porcentaje es una fracción con denominador 100.');return result;}}
    if(op.kind==='primeFactors'){let n=BigInt(op.answer);const steps=op.primeFactors.map(p=>{const next=n/BigInt(p),line=`${n} ÷ ${p} = ${next}`;n=next;return line;});return{steps:[...steps,`${op.answer} = ${op.primeFactors.join(' × ')}`],answerText:op.primeFactors.join(' × ')};}
    if(op.kind==='mcm'||op.kind==='mcd')return{steps:root.NinjaMathExtra.theorySteps(op.values,op.kind),answerText:op.answerExact};
    if(op.kind==='sqrt')return{steps:[`Buscamos el número no negativo cuyo cuadrado es ${op.answer*op.answer}.`,`${op.answer} × ${op.answer} = ${op.answer*op.answer}; la raíz es ${op.answer}.`],answerText:String(op.answer)};
    return null;
  }
  function plan(keys,quantity,distribution,random=Math.random){
    keys=[...new Set(keys)];quantity=Number(quantity);
    if(!keys.length)throw Error('Selecciona al menos una operación o tipo de problema.');
    if(!Number.isInteger(quantity)||quantity<1||quantity>200)throw Error('La cantidad debe ser un entero entre 1 y 200.');
    if(!['balanced','mixed'].includes(distribution))throw Error('Reparto no válido.');
    const count=distribution==='balanced'?quantity*keys.length:quantity;if(count>200)throw Error(`Has pedido ${count} ejercicios. El máximo por ficha es 200; reduce la cantidad por tipo.`);
    const result=distribution==='balanced'?keys.flatMap(key=>Array(quantity).fill(key)):Array.from({length:count},()=>keys[Math.floor(random()*keys.length)]);
    for(let i=result.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}return result;
  }
  const groups=[
    {label:'Números naturales',keys:['addNoCarry','addCarry','subNoBorrow','subBorrow','mul','div','divTables','divisionRemainder','combined','combinedAdv','sqrt','primeFactors','mcm','mcd','missing','compare','round']},
    {label:'Números enteros',keys:['signedAdd','signedSub','signedMul','signedDiv','signedCombinedEasy','signedCombinedAdv','integerOrder','absoluteValue','numberLine']},
    {label:'Operaciones con potencias',keys:['power','powerAdd','powerSub','sameBaseMul','sameBaseDiv','powerPower','powerCombinedEasy','powerCombinedAdv','sameBaseMixed','signedPowersCombined']},
    {label:'Contenidos comunes',keys:['fraction','fractionAdd','fractionSub','fractionMul','fractionDiv','fractionCombined','fractionGap','fractionCompare','divHard','percent','equivalence','scaleTen','convertLength','convertMass','convertCapacity','convertTime','timeArithmetic','mixedMeasures','angles','cubeVolume','prismVolume']},
    {label:'Álgebra y ESO',keys:['linearEquation','quadraticEquation','algebraValue','scientificNotation','proportion','scaleCalc','divisibility','pythagoras']}
  ];
  function category(key){
    if(key.startsWith('problem:'))return{groupOrder:5,groupLabel:'Problemas',typeOrder:0};
    const kind=key.replace(/^calc:/,'');let index=groups.findIndex(group=>group.keys.includes(kind));if(index<0)index=3;
    const group=groups[index],order=group.keys.indexOf(kind);return{groupOrder:index,groupLabel:group.label,typeOrder:order<0?1000:order};
  }
  function calculationKeys(keys){return keys.map((key,index)=>({key,index,...category(key)})).sort((a,b)=>a.groupOrder-b.groupOrder||a.typeOrder-b.typeOrder||a.index-b.index).map(item=>item.key);}
  function ordered(items){
    return items.map((item,index)=>({...item,...(/^(calc|problem):/.test(item.key||'')?category(item.key):{}),originalIndex:index})).sort((a,b)=>(a.groupOrder??99)-(b.groupOrder??99)||(a.typeOrder??99)-(b.typeOrder??99)||a.originalIndex-b.originalIndex).map((item,index)=>({...item,number:index+1}));
  }
  function layoutDocument(){
    const questions=document.querySelector('.questions');if(!questions)return;
    const cards=[...questions.querySelectorAll('.exercise')],probe=document.createElement('div');
    probe.className='sheet-measure';document.body.appendChild(probe);
    const width=probe.getBoundingClientRect().width,gap=4*96/25.4,max=Number(questions.dataset.maxColumns)||5;
    const widths=new Map();
    for(const card of cards){
      card.style.removeProperty('--question-size');card.style.removeProperty('--screen-size');
      if(card.classList.contains('problem')||card.querySelector('.diagram svg,.diagram table')){widths.set(card,width);continue;}
      const clone=card.cloneNode(true);probe.appendChild(clone);
      const math=clone.querySelector('.math-question,.vertical,.long-division');
      const natural=math?math.getBoundingClientRect().width:width;
      if(natural>width-26&&math){
        const font=parseFloat(getComputedStyle(math).fontSize);card.style.setProperty('--question-size',`${font*(width-28)/natural}px`);
        widths.set(card,width);
      }else widths.set(card,Math.min(width,Math.max(70,natural+26)));
      clone.remove();
    }
    const solutions=[...document.querySelectorAll('.solution-question')];
    for(const item of solutions){
      item.style.removeProperty('--question-size');item.style.removeProperty('--screen-size');
      const clone=item.cloneNode(true);probe.appendChild(clone);const math=clone.querySelector('.math-question,.vertical,.long-division');
      if(math&&math.getBoundingClientRect().width>width-2){const font=parseFloat(getComputedStyle(math).fontSize);item.style.setProperty('--question-size',`${font*(width-4)/math.getBoundingClientRect().width}px`);}
      clone.remove();
    }
    probe.remove();questions.replaceChildren();let row=[],group;
    function flush(){if(!row.length)return;const div=document.createElement('div');div.className='worksheet-row';row.forEach(card=>div.appendChild(card));questions.appendChild(div);row=[];}
    for(const card of cards){
      if(card.dataset.group!==group){flush();group=card.dataset.group;const label=card.dataset.groupLabel;if(label){const heading=document.createElement('h2');heading.className='exercise-group-title';heading.textContent=label;questions.appendChild(heading);}}
      const candidate=[...row,card],needed=Math.max(...candidate.map(c=>widths.get(c)))*candidate.length+gap*(candidate.length-1);
      if(row.length&&(candidate.length>max||needed>width+.5))flush();
      row.push(card);if(card.classList.contains('problem')||widths.get(card)>=width-.5||row.length===max)flush();
    }
    flush();
    if(matchMedia('screen').matches)for(const card of [...cards,...solutions]){
      const math=card.querySelector('.math-question,.vertical,.long-division');if(!math||card.classList.contains('problem'))continue;
      const style=getComputedStyle(card),available=card.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight);
      if(math.scrollWidth>available){const font=parseFloat(getComputedStyle(math).fontSize);card.style.setProperty('--screen-size',`${font*available/math.scrollWidth*.98}px`);}
    }
    document.documentElement.dataset.layoutReady='true';
  }
  const css=`*{box-sizing:border-box}body{margin:0;background:#edf2f0;color:#173c37;font:12pt Verdana,sans-serif}.toolbar{position:sticky;top:0;padding:12px;background:#173c37;color:white;text-align:center}.toolbar button{font:inherit;padding:9px 16px;cursor:pointer}.paper{overflow-wrap:anywhere;background:white;max-width:210mm;margin:16px auto;padding:14mm}h1{font-size:21pt;margin:0 0 8mm}h2{font-size:18pt}h3{font-size:12pt;margin:0 0 3mm}.student-line{display:flex;flex-wrap:wrap;gap:12mm;margin-bottom:7mm}.student-line span{flex:1;min-width:45mm;border-bottom:1px solid #879a94;padding-bottom:2mm}.sheet-id{font-size:9pt;color:#52665e}.worksheet-row{display:flex;gap:4mm;align-items:stretch;break-inside:avoid;page-break-inside:avoid;margin-bottom:4mm}.exercise{flex:1;min-width:0;border:1px solid #a7bdb4;border-radius:2mm;padding:3mm;min-height:28mm;overflow-wrap:anywhere}.exercise.problem{width:100%}.exercise-number{font-weight:bold;font-size:10pt;margin-bottom:3mm}.math-question{font-size:15pt;line-height:1.5}.problem-question{font-size:12pt;line-height:1.65;margin:0}.problem-steps{padding-left:6mm}.problem-steps li{margin:2mm 0}.workspace{height:var(--workspace);margin-top:4mm;background:repeating-linear-gradient(transparent 0,transparent 7.5mm,#d5dfda 7.5mm,#d5dfda 7.7mm)}.vertical{font-variant-numeric:tabular-nums;display:table;min-width:30mm;margin:0 auto;font:19pt Georgia,serif;text-align:right;line-height:1.4}.vertical .bottom{border-bottom:1.5px solid #173c37}.vertical div{padding:0 2mm}.long-division{display:flex;justify-content:center;font-size:18pt;gap:2mm}.divisor{border-left:1.5px solid;padding-left:2mm;min-width:16mm}.divisor div{border-bottom:1.5px solid;padding-bottom:2mm}.divisor small{display:block;min-height:12mm}.fraction-real{display:inline-flex;flex-direction:column;vertical-align:middle;align-items:center;font:inherit;line-height:1.15;margin:0 .12em}.fraction-num{padding:0 .15em .08em;border-bottom:1.2px solid currentColor}.fraction-den{padding:.08em .15em 0}.inline-root-sign{width:.65em;height:1em;vertical-align:-.08em;fill:none;stroke:currentColor;stroke-width:2}.square-root{display:inline-flex;align-items:stretch}.square-root-sign{width:.7em;height:1.4em;fill:none;stroke:currentColor;stroke-width:2}.square-root-value{border-top:1.3px solid;padding:.08em .1em}.math-symbol{font-family:'Cambria Math','DejaVu Sans',serif}.diagram svg,svg.geometry-diagram,svg.calculation-diagram,svg.spatial-diagram{display:block;max-width:100%;width:85mm;height:auto;max-height:45mm;margin:3mm auto}.diagram table,.literacy-table{border-collapse:collapse;width:100%;font-size:10pt;margin:3mm 0}.diagram td,.diagram th,.literacy-table td,.literacy-table th{border:1px solid #63796e;padding:2mm}.literacy-table-compact,.literacy-chart-compact{display:none}.literacy-chart{display:flex;align-items:end;gap:3mm;height:35mm}.literacy-bar{height:var(--bar);background:#318775;min-width:6mm}.solutions{break-before:page;page-break-before:always}.solution-card{break-inside:avoid;page-break-inside:avoid;border-bottom:1px solid #c3d0c9;padding:4mm 0;line-height:1.5;overflow-wrap:anywhere}.solution-card ol{padding-left:6mm}.solution-card li{margin-bottom:2mm}.quadratic-solution{display:grid;justify-items:center;gap:2mm}.solution-question{font-size:10pt;color:#52665e}.solution-card .teaching-explanation{font-size:11pt}.solution-card .problem-review-label{display:none}.answer-final{font-weight:bold}.print-note{font-size:9pt;color:#52665e}@page{size:A4 portrait;margin:14mm}@media print{body{background:white;color:#111}.toolbar{display:none}.paper{max-width:none;padding:0;margin:0}h1,h2,h3{break-after:avoid}a{color:inherit;text-decoration:none}.solutions{break-before:page}*{-webkit-print-color-adjust:exact;print-color-adjust:exact}}@media screen and (max-width:600px){.worksheet-row{flex-direction:column}.paper{padding:5mm;margin:0}.toolbar{position:static}.worksheet-row{gap:2mm}.math-question{font-size:12pt}.vertical{font-size:15pt}}.math-question{white-space:nowrap;overflow-wrap:normal;font-size:var(--question-size,15pt)}.basic-question{font-size:var(--question-size,12pt)}.vertical{font-size:var(--question-size,19pt)}.long-division{font-size:var(--question-size,18pt)}.exercise-group-title{font-size:14pt;margin:7mm 0 3mm;break-after:avoid}.solutions{margin-top:28px;border-top:5px solid #d6e3dc}.solutions>h2{margin-top:0}.sheet-measure{position:absolute;left:-100000px;top:0;width:182mm;visibility:hidden}.sheet-measure .exercise{width:max-content;max-width:none;display:block}.sheet-measure .math-question{width:max-content;font-size:15pt!important;white-space:nowrap}.sheet-measure .basic-question{font-size:12pt!important}.sheet-measure .vertical{font-size:19pt!important}.sheet-measure .long-division{width:max-content;font-size:18pt!important}@media screen{.exercise .math-question,.solution-question .math-question{font-size:var(--screen-size,var(--question-size,15pt))}.exercise .basic-question,.solution-question .basic-question{font-size:var(--screen-size,var(--question-size,12pt))}.exercise .vertical,.solution-question .vertical{font-size:var(--screen-size,var(--question-size,19pt))}.exercise .long-division,.solution-question .long-division{font-size:var(--screen-size,var(--question-size,18pt))}}@media print{main.solutions{break-before:page;page-break-before:always;border:0;margin:0}}`;
  function documentHtml(items,options={}){
    if(!Array.isArray(items)||!items.length||items.length>200)throw Error('Ficha vacía o demasiado grande.');
    items=ordered(items);
    const columns=[1,2,3,4,5].includes(Number(options.columns))?Number(options.columns):5,workspace=Math.max(0,Math.min(6,Number(options.lines)||0))*8;
    const rows=[];let row=[];const flush=()=>{if(row.length){rows.push(`<div class="worksheet-row">${row.join('')}</div>`);row=[];}};
    for(const item of items){const card=`<article class="exercise${item.problem?' problem':''}" data-group="${escape(item.groupOrder??99)}" data-group-label="${escape(item.groupLabel||'')}"><div class="exercise-number">${item.number}.</div>${item.questionHtml}<div class="workspace" style="--workspace:${workspace}mm" aria-hidden="true"></div></article>`;if(item.problem){flush();rows.push(`<div class="worksheet-row">${card}</div>`);}else{row.push(card);if(row.length===columns)flush();}}flush();
    const solutions=options.solutions?`<main class="paper solutions"><h2>Soluciones paso a paso</h2><p class="print-note">${escape(options.title||'Ficha de práctica')} · Las respuestas corresponden a los números de la ficha.</p>${items.map(item=>`<article class="solution-card"><h3>${item.number}. Solución</h3><div class="solution-question">${item.questionHtml}</div>${item.solutionHtml}</article>`).join('')}</main>`:'';
    const layoutScript=`const relayout=${layoutDocument.toString()};relayout();window.addEventListener('beforeprint',relayout);window.addEventListener('afterprint',relayout);window.addEventListener('resize',()=>requestAnimationFrame(relayout));document.fonts?.ready.then(relayout);`;
    return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="worksheet-id" content="${escape(options.id||'')}"><title>${escape(options.title||'Ficha de práctica')}</title><style>${css}</style></head><body><div class="toolbar"><button type="button" onclick="window.print()">Imprimir / Guardar como PDF</button><p>En el diálogo de impresión elige Guardar como PDF. Las soluciones están al final.</p></div><main class="paper"><header><h1>${escape(String(options.title||'Ficha de práctica').slice(0,100))}</h1><div class="student-line"><span>Nombre:</span><span>Fecha:</span></div><p>${items.length} ejercicios · Lee y resuelve. Usa el espacio para tus cálculos.</p><p class="sheet-id">Dojo Matemático · Ficha ${escape(options.id||'')}</p></header><section class="questions" data-max-columns="${columns}" aria-label="Ejercicios">${rows.join('')}</section></main>${solutions}<script>${layoutScript}</script></body></html>`;
  }
  root.NinjaWorksheets={escape,numeric,evaluate,arithmetic,plan,documentHtml,decimal,show,random,ordered,groups,category,calculationKeys};
  if(typeof module!=='undefined')module.exports=root.NinjaWorksheets;
}(globalThis));
