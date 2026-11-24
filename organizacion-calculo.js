(function(root){
  const defaults={powerAdd:{enabled:false,exponentMax:3,negativeExponents:0},powerSub:{enabled:false,exponentMax:3,negativeExponents:0},powerPower:{enabled:false,exponentMax:3,negativeExponents:0},powerCombinedEasy:{enabled:false,exponentMax:3,negativeExponents:0},powerCombinedAdv:{enabled:false,exponentMax:3,negativeExponents:0}};
  const labels={powerAdd:'Sumas de potencias',powerSub:'Restas de potencias',powerPower:'Potencia de una potencia',powerCombinedEasy:'Potencias: combinadas fáciles',powerCombinedAdv:'Potencias: combinadas avanzadas'};
  const natural=['addNoCarry','addCarry','subNoBorrow','subBorrow','mul','div','divTables','divisionRemainder','combined','combinedAdv','sqrt','primeFactors','mcm','mcd','missing','compare','round'];
  const integer=['signedAdd','signedSub','signedMul','signedDiv','signedCombinedEasy','signedCombinedAdv','integerOrder','absoluteValue','numberLine'];
  const powers=['power','powerAdd','powerSub','sameBaseMul','sameBaseDiv','powerPower','powerCombinedEasy','powerCombinedAdv','sameBaseMixed','signedPowersCombined'];
  const domain=key=>natural.includes(key)?'Naturales':integer.includes(key)?'Enteros':powers.includes(key)?'Potencias':'Contenidos comunes';
  const op=(a,kind,b)=>root.NinjaMathExtra.calculate(a,kind,b);
  const display=f=>f.denominator==='1'?f.numerator:`${f.numerator}/${f.denominator}`;
  function generate(kind,cfg={},random=Math.random){
    const pick=(a,b)=>a+Math.floor(random()*(b-a+1)),limit=Math.max(1,Math.min(6,Math.trunc(Number(cfg.exponentMax))||3)),negative=Number(cfg.negativeExponents)===1,exp=()=>pick(negative?-limit:0,limit),base=pick(2,9),a=exp(),b=exp(),c=exp(),p=root.NinjaReasoning.power(base,a),q=root.NinjaReasoning.power(base,b),r=root.NinjaReasoning.power(base,c);
    let answerFraction,expression,explanation,data={base,a,b,c},answerFormat;
    if(kind==='powerPower'){
      const e=a*b;answerFraction=root.NinjaReasoning.power(base,e);data.e=e;answerFormat='power';expression=`(${base}^${a})^${b}`;
      explanation=`Al elevar una potencia a otra, multiplicamos los exponentes: (${a}) × (${b}) = ${e}. Resultado: ${base}^${e}${e<0?` = 1/(${base}^${-e})`:e===0?' = 1':''}.`;
    }else if(kind==='powerAdd'||kind==='powerSub'){
      const subtract=kind==='powerSub';answerFraction=op(p,subtract?'resta':'suma',q);expression=`${base}^${a} ${subtract?'−':'+'} ${base}^${b}`;
      explanation=`En una ${subtract?'resta':'suma'} de potencias NO se suman ni restan los exponentes. Calculamos los valores: ${display(p)} ${subtract?'−':'+'} ${display(q)} = ${display(answerFraction)}.`;
    }else if(kind==='powerCombinedEasy'){
      answerFraction=op(op(p,'suma',q),'multiplicacion',r);expression=`(${base}^${a} + ${base}^${b}) × ${base}^${c}`;
      explanation=`Calculamos las potencias y el paréntesis: ${display(p)} + ${display(q)} = ${display(op(p,'suma',q))}. Después multiplicamos por ${display(r)}: ${display(answerFraction)}.`;
    }else{
      const d=pick(1,Math.min(3,limit)),factorLimit=Math.min(limit,Math.floor(6/d)),e=pick(negative?-factorLimit:0,factorLimit),nested=root.NinjaReasoning.power(base,d*e),difference=op(p,'resta',q),quotient=op(difference,'division',r);
      answerFraction=op(quotient,'suma',nested);data={...data,d,e,nestedExponent:d*e};expression=`((${base}^${a} − ${base}^${b}) ÷ ${base}^${c}) + (${base}^${d})^${e}`;
      explanation=`Potencia de potencia: (${d}) × (${e}) = ${d*e}. En el primer paréntesis restamos valores, no exponentes: ${display(difference)}. Dividimos entre ${display(r)}: ${display(quotient)}. Sumamos ${display(nested)}: ${display(answerFraction)}.`;
    }
    return{kind,challenge:true,expression,answerFraction,answer:Number(answerFraction.numerator)/Number(answerFraction.denominator),answerDisplay:answerFormat==='power'?`${base}^${data.e}`:display(answerFraction),answerFormat,signedInput:true,requiresFractionInput:true,inputHint:answerFormat==='power'?'Escribe base^exponente. Tecla P para ^; también sirve el valor exacto si cabe.':'Responde con el valor exacto, como entero o fracción. No sumes exponentes en sumas/restas.',explanation,challengeHint:kind==='powerPower'?'Elevar una potencia a otra multiplica sus exponentes.':'Resuelve primero las potencias, después paréntesis, productos y cocientes, y al final sumas y restas.',data,signature:`${kind}:${expression}`};
  }
  const calc=root.NinjaCalculationChallenges,oldGenerate=calc.generate,baseControls=calc.controls();
  const oldReasoning=root.NinjaReasoning.calculation;root.NinjaReasoning.calculation=(kind,cfg,random)=>Object.hasOwn(defaults,kind)?generate(kind,cfg,random):oldReasoning(kind,cfg,random);
  Object.assign(calc.defaults,defaults);Object.assign(calc.labels,labels);Object.assign(root.NinjaReasoning.defaults,defaults);Object.assign(root.NinjaReasoning.labels,labels);
  calc.generate=(kind,cfg,random)=>Object.hasOwn(defaults,kind)?generate(kind,cfg,random):oldGenerate(kind,cfg,random);
  calc.controls=()=>baseControls+Object.entries(labels).map(([key,label])=>`<div class="challenge-config"><label class="challenge-enable"><input class="op-toggle" type="checkbox" data-op="${key}" /> ${label}</label><div class="challenge-fields"><label>Exponente máximo en valor absoluto<select class="op-config-select" data-setting-op="${key}" data-setting-key="exponentMax">${[1,2,3,4,5,6].map(n=>`<option ${n===3?'selected':''}>${n}</option>`).join('')}</select></label><label>Exponentes<select class="op-config-select" data-setting-op="${key}" data-setting-key="negativeExponents"><option value="0">Positivos y cero</option><option value="1">Positivos y negativos</option></select></label></div></div>`).join('');
  root.NinjaNumberGroups={defaults,labels,natural,integer,powers,domain,generate};
  if(typeof module!=='undefined')module.exports=root.NinjaNumberGroups;
}(globalThis));

function initCalculationGroups(){
  const box=document.getElementById('operationsBox'),outer=document.getElementById('opsDropdown');
  const rows=new Map([...box.querySelectorAll('.op-toggle')].map(toggle=>[toggle.dataset.op,toggle.closest('.op-row,.challenge-config,.measure-card,.spatial-config')||toggle.closest('label')]));
  const legacy=document.createElement('div');legacy.className='hidden';legacy.id='legacyCalculationLayout';
  [...outer.children].filter(n=>n.tagName!=='SUMMARY').forEach(n=>legacy.appendChild(n));
  [...box.children].filter(n=>n.tagName==='DETAILS'&&n!==outer).forEach(n=>legacy.appendChild(n));outer.appendChild(legacy);
  function group(id,title,hint,parent=outer){const details=document.createElement('details');details.className='ops-dropdown number-group';details.id=id;details.innerHTML=`<summary>${title} <span data-number-count></span></summary><p class="hint">${hint}</p>`;parent.appendChild(details);return details;}
  function grid(parent,keys,searchTerms){const div=document.createElement('div');div.className='number-choice-grid learning-calculations';div.dataset.searchTerms=searchTerms;parent.appendChild(div);for(const key of keys){const row=rows.get(key);if(!row)continue;div.appendChild(row);rows.delete(key);}return div;}
  const natural=group('naturalNumbersGroup','🔢 Números naturales','Sumas, restas, productos, divisiones y combinadas. Se conservan tus cifras y opciones actuales.');
  grid(natural,NinjaNumberGroups.natural.slice(0,10),'naturales operaciones básicas');
  const divisionHint=document.getElementById('divisionHint');if(divisionHint)natural.appendChild(divisionHint);
  const moreNatural=group('naturalNumberTools','🧩 Otros retos de naturales','Raíces exactas, divisibilidad, huecos, comparación y redondeo.',natural);
  grid(moreNatural,NinjaNumberGroups.natural.slice(10),'naturales');
  const note=document.createElement('div');note.id='naturalDomainNotice';note.className='domain-notice hidden';note.innerHTML='<p id="naturalDomainText"></p><button id="usePureNaturalsBtn" class="btn-mini" type="button">Usar naturales sin decimales ni negativos</button>';natural.insertBefore(note,natural.querySelector('.number-choice-grid'));
  const integers=group('integerNumbersGroup','➖ Números enteros','Los enteros incluyen positivos, negativos y cero. Las cuatro operaciones y combinadas usan signos aunque el ajuste general de negativos esté apagado.');
  grid(integers,NinjaNumberGroups.integer,'enteros signos positivos negativos');
  for(const select of integers.querySelectorAll('[data-setting-key="digits"]'))if(select.dataset.settingOp.startsWith('signed'))select.innerHTML=Array.from({length:9},(_,i)=>`<option value="${i+1}" ${i===1?'selected':''}>${i+1} cifra${i?'s':''}</option>`).join('');
  const powers=group('powersOperationsGroup','⚡ Operaciones con potencias','Calcular, sumar, restar, multiplicar, dividir, elevar una potencia a otra y resolver combinadas. Sumar/restar valores no es sumar/restar exponentes.');
  grid(powers,NinjaNumberGroups.powers,'potencias exponentes elevado');
  const secondary=group('secondaryCalculationsGroup','🎓 Más retos: álgebra y ESO','Cálculos exactos de 1 a 3 cifras iniciales. Puedes combinarlos con los otros contenidos.');
  const algebra=group('secondaryAlgebraGroup','✏️ Álgebra y ecuaciones','Ecuaciones de primer grado, valor numérico y segundo grado con la fórmula general.',secondary);
  grid(algebra,['linearEquation','algebraValue','quadraticEquation'],'álgebra');
  const scientific=group('secondaryScientificGroup','🔬 Notación científica','Mantisa, exponente y valor decimal, con respuestas exactas.',secondary);
  grid(scientific,['scientificNotation'],'notación científica');
  const ratios=group('secondaryRatiosGroup','⚖️ Razones, proporciones y escalas','Proporcionalidad directa/inversa y paso entre dibujo y realidad.',secondary);
  grid(ratios,['proportion','scaleCalc'],'razones proporciones escalas');
  const tools=group('secondaryToolsGroup','📐 Divisibilidad y Pitágoras','Criterios de divisibilidad y lados de triángulos rectángulos con raíz exacta.',secondary);
  grid(tools,['divisibility','pythagoras'],'');
  const shared=group('sharedCalculationsGroup','📚 Contenidos comunes','Fracciones y decimales no son números naturales. Se mantienen aquí para no duplicar ni confundir las opciones.');
  const fractions=group('sharedFractionsGroup','🍰 Fracciones, decimales y porcentajes','Operador fraccionario, aritmética de fracciones, porcentajes, equivalencias y decimales.',shared);
  grid(fractions,[...rows.keys()].filter(k=>k.startsWith('fraction')||['percent','equivalence','scaleTen','divHard'].includes(k)),'fracciones decimales porcentajes');
  const applied=group('sharedMeasuresGroup','📏 Magnitudes, tiempo y geometría','Conversiones, duraciones, ángulos y volúmenes con sus ajustes habituales.',shared);
  grid(applied,[...rows.keys()],'magnitudes tiempo geometría');
  const conversionHint=document.getElementById('conversionConfigHint');if(conversionHint)applied.appendChild(conversionHint);
  document.getElementById('usePureNaturalsBtn').addEventListener('click',()=>{state.allowNegative=false;state.decimalsEnabled=false;syncSettingsUIFromState();updateOpsSummary();savePreferences();});
  document.getElementById('clearAllOperationsTop').addEventListener('click',clearActiveOperations);
  for(const select of box.querySelectorAll('[data-setting-key="exponentMax"]')){
    select.dataset.settingKey='exponentDigits';
    select.setAttribute('aria-label','Cifras del exponente');select.title='Cifras del exponente: hasta 9, 99 o 999';
    if(select.previousSibling?.nodeType===3)select.previousSibling.textContent='Cifras del exponente';
    select.innerHTML=[1,2,3].map(n=>`<option value="${n}">${n} cifra${n===1?'':'s'} (hasta ${10**n-1})</option>`).join('');
    if(select.dataset.settingOp==='power'){select.innerHTML='<option value="1">Exponente: 0 a 9</option>';select.title='Desarrollar el valor numérico: exponentes de 0 a 9. Para exponentes hasta 999 usa los retos de propiedades de potencias.';}
  }
  const mental=document.createElement('button');mental.id='mentalDefaultsBtn';mental.className='btn-mini';mental.type='button';mental.textContent='🧠 Todo a 1 cifra';
  document.querySelector('.operation-search').appendChild(mental);
  mental.addEventListener('click',()=>{
    for(const cfg of Object.values(state.operationSettings))for(const key of [...NinjaExponentDigits.digitKeys,'exponentDigits','maxDecimals'])if(Object.hasOwn(cfg,key))cfg[key]=1;
    state.decimalPlaces=1;syncSettingsUIFromState();updateOpsSummary();savePreferences();
    document.getElementById('operationClearNotice').textContent='Cifras ajustadas a 1. Se conservan las operaciones marcadas y las demás opciones.';
  });
}

function updateCalculationGroups(){
  const clearNotice=document.getElementById('operationClearNotice');if(clearNotice&&Object.values(state.operationSettings).some(c=>c.enabled))clearNotice.textContent='';
  for(const group of document.querySelectorAll('.number-group')){const count=[...group.querySelectorAll('.op-toggle')].filter(t=>state.operationSettings[t.dataset.op]?.enabled).length;group.querySelector(':scope > summary [data-number-count]').textContent=count?`· ${count} activas`:'';}
  const button=document.getElementById('clearAllOperationsTop');if(button)button.disabled=!Object.values(state.operationSettings).some(c=>c.enabled);
  const notice=document.getElementById('naturalDomainNotice');if(notice){notice.classList.toggle('hidden',!state.allowNegative&&!state.decimalsEnabled);document.getElementById('naturalDomainText').textContent=`Se conservan tus ajustes anteriores: ${[state.allowNegative?'negativos':'',state.decimalsEnabled?'decimales':''].filter(Boolean).join(' y ')}. Para practicar naturales puros puedes apagarlos con este botón. Para trabajar signos, selecciona operaciones del apartado Enteros.`;}
}
