(function(root){
  const defaults={linearEquation:{enabled:false,digits:1,variant:0,signedValues:0},algebraValue:{enabled:false,digits:1,variant:0,signedValues:0},quadraticEquation:{enabled:false,digits:1,variant:0,signedValues:0},scientificNotation:{enabled:false,digits:1,variant:0,scientificRange:1},proportion:{enabled:false,digits:1,variant:0},scaleCalc:{enabled:false,digits:1,variant:0},divisibility:{enabled:false,digits:1,divisibilityRule:0},pythagoras:{enabled:false,digits:1,variant:0}};
  const labels={linearEquation:'Ecuaciones de primer grado',algebraValue:'Valor numérico de expresiones algebraicas',quadraticEquation:'Ecuaciones de segundo grado: fórmula general',scientificNotation:'Notación científica',proportion:'Proporcionalidad directa e inversa',scaleCalc:'Escalas: dibujo y realidad',divisibility:'Criterios de divisibilidad',pythagoras:'Teorema de Pitágoras'};
  const clamp=(v,min,max,f)=>Number.isFinite(Number(v))?Math.max(min,Math.min(max,Math.trunc(Number(v)))):f;
  const rat=(n,d=1)=>root.NinjaUnits.rational(BigInt(n),BigInt(d));
  const show=f=>f.denominator==='1'?f.numerator:`${f.numerator}/${f.denominator}`;
  function decimal(n,d){
    n=BigInt(n);d=BigInt(d);let remainder=n%d,tail='';
    while(remainder&&tail.length<16){remainder*=10n;tail+=String(remainder/d);remainder%=d;}
    if(remainder)throw Error('Decimal no finito en notación científica.');
    return String(n/d)+(tail?','+tail:'');
  }
  const signed=n=>n<0?`(${n})`:String(n);
  const term=(n,suffix='')=>`${n<0?'−':'+'} ${Math.abs(n)}${suffix}`;
  function generate(kind,cfg={},random=Math.random){
    if(!Object.hasOwn(defaults,kind))throw Error('Reto de ESO desconocido.');
    const digits=clamp(cfg.digits,1,3,1),min=10**(digits-1),max=10**digits-1,pick=(a,b)=>a+Math.floor(random()*(b-a+1)),num=()=>pick(min,max),value=()=>num()*(Number(cfg.signedValues)===1&&pick(0,1)?-1:1),variant=clamp(cfg.variant,0,2,0);
    let expression,explanation,challengeHint,inputHint='Escribe el resultado exacto. Puedes usar coma o fracción.',answerFraction,answerFormat='integer',choices,data;
    if(kind==='linearEquation'){
      const a=num(),x=value(),b=value(),d=a===max?min:a+1;let c;
      if(variant===0){c=a*x+b;expression=`${a}x ${term(b)} = ${c}`;explanation=`Restamos ${signed(b)} en ambos lados: ${a}x = ${c-b}. Dividimos entre ${a}: x = ${x}.`;}
      else if(variant===1){c=a*(x+b);expression=`${a}(x ${term(b)}) = ${c}`;explanation=`Dividimos entre ${a}: x ${term(b)} = ${c/a}. Restamos ${signed(b)}: x = ${x}.`;}
      else{c=(a-d)*x+b;expression=`${a}x ${term(b)} = ${d}x ${term(c)}`;explanation=`Agrupamos las x y los números: (${a} − ${d})x = ${c} − ${signed(b)} = ${c-b}. Dividimos entre ${a-d}: x = ${x}.`;}
      answerFraction=rat(x);data={a,b,c,d,x,variant};challengeHint='Haz la misma operación en ambos lados hasta dejar x sola.';inputHint='Escribe solo el valor de x.';
    }else if(kind==='algebraValue'){
      const a=num(),b=value(),c=value(),x=value();let n;
      expression=variant===0?`${a}x ${term(b)}`:variant===1?`${a}x^2 ${term(b,'x')} ${term(c)}`:`${a}(x ${term(b)}) ${term(-c)}`;
      n=variant===0?BigInt(a)*BigInt(x)+BigInt(b):variant===1?BigInt(a)*BigInt(x)**2n+BigInt(b)*BigInt(x)+BigInt(c):BigInt(a)*(BigInt(x)+BigInt(b))-BigInt(c);
      explanation=`Sustituimos cada x por ${signed(x)}. ${variant===1?`Primero: ${signed(x)}^2 = ${BigInt(x)**2n}. `:variant===2?`Primero el paréntesis: ${x} + (${b}) = ${x+b}. `:''}Después productos y sumas/restas: ${n}.`;
      expression=`Si x = ${x}, calcula ${expression}`;answerFraction=rat(n);data={a,b,c,x,variant};challengeHint='Sustituye x por su valor; conserva los paréntesis si es negativo.';
    }else if(kind==='quadraticEquation'){
      let p=value(),r=value(),q=variant===1?num():1,s=variant===1?num():1;const factor=num();
      if(variant===2){r=p;s=q;}else if(p*s===r*q){r=r===max?min:r+1;if(p*s===r*q)r=-r;}
      const a=BigInt(factor)*BigInt(q)*BigInt(s),b=-BigInt(factor)*(BigInt(p)*BigInt(s)+BigInt(r)*BigInt(q)),c=BigInt(factor)*BigInt(p)*BigInt(r),delta=b*b-4n*a*c,sqrt=BigInt(factor)*BigInt(Math.abs(p*s-r*q)),den=2n*a;
      const roots=[rat(-b+sqrt,den),rat(-b-sqrt,den)];
      expression=`${a}x^2 ${b<0n?'−':'+'} ${b<0n?-b:b}x ${c<0n?'−':'+'} ${c<0n?-c:c} = 0`;
      explanation=`a=${a}, b=${b}, c=${c}. Δ=b^2 − 4ac = (${b})^2 − 4 × ${a} × (${c}) = ${delta}; √Δ=${sqrt}. Fórmula: x=(−b ± √Δ)/(2a). x1=(${-b} + ${sqrt})/${den} = ${show(roots[0])}; x2=(${-b} − ${sqrt})/${den} = ${show(roots[1])}.${delta===0n?' Raíz doble: escribe el mismo valor dos veces.':''}`;
      data={a:String(a),b:String(b),c:String(c),delta:String(delta),sqrt:String(sqrt),roots,variant};answerFormat='roots';answerFraction=null;challengeHint='Identifica a, b y c con su signo. Calcula Δ=b²−4ac y aplica x=(−b±√Δ)/(2a).';inputHint='Escribe las dos raíces separadas por ; (tecla S). Ej.: −2;3/2. Cualquier orden.';
    }else if(kind==='scientificNotation'){
      const coefficient=num(),scale=10**(digits-1),range=clamp(cfg.scientificRange,1,9,1),exponent=pick(-range,range),factor=exponent>=0?rat(10n**BigInt(exponent)):rat(1,10n**BigInt(-exponent)),original=root.NinjaMathExtra.calculate(rat(coefficient,scale),'multiplicacion',factor),decimalText=decimal(original.numerator,original.denominator),mantissa=decimal(coefficient,scale);
      expression=variant===0?`${decimalText} = ${mantissa} × 10^?`:variant===1?`${decimalText} = ? × 10^${exponent}`:`${mantissa} × 10^${exponent} = ?`;
      answerFraction=variant===0?rat(exponent):variant===1?rat(coefficient,scale):original;
      explanation=`${decimalText} = ${mantissa} × 10^${exponent}. La mantisa es al menos 1 y menor que 10. ${exponent>=0?'Multiplicamos':'Dividimos'} por ${10**Math.abs(exponent)}. ${variant===0?`Falta el exponente ${exponent}.`:variant===1?`Falta la mantisa ${mantissa}.`:''}`;
      data={coefficient,scale,exponent,variant};challengeHint='La notación científica es a × 10^n, con 1 ≤ a < 10.';inputHint=variant===0?'Escribe solo el exponente: puede ser negativo.':'Escribe solo el número que falta; usa coma decimal.';
    }else if(kind==='proportion'){
      const a=num(),b=num(),k=pick(2,Math.max(2,max)),inverse=variant===1||(variant===2&&pick(0,1)===1);
      expression=inverse?`Proporcionalidad inversa: ${a} corresponde a ${b*k}. ${a*k} corresponde a ?`:`Proporcionalidad directa: ${a} corresponde a ${b}. ${a*k} corresponde a ?`;
      answerFraction=rat(inverse?b:b*k);explanation=inverse?`El producto se mantiene: ${a} × ${b*k} = ${a*k} × ?. Dividimos ${a*b*k} entre ${a*k}: ${b}.`:`La primera magnitud se multiplica por ${k}; la segunda también: ${b} × ${k} = ${b*k}.`;
      data={a,b,k,inverse};challengeHint=inverse?'En la proporcionalidad inversa el producto de las dos magnitudes es constante.':'En la proporcionalidad directa multiplicamos ambas magnitudes por el mismo factor.';
    }else if(kind==='scaleCalc'){
      const scale=pick(Math.max(2,min),Math.max(2,max)),drawing=num(),real=drawing*scale,toReal=variant===0||(variant===2&&pick(0,1)===1);
      expression=toReal?`Escala 1:${scale}. ${drawing} cm en el dibujo = ? cm reales`:`Escala 1:${scale}. ${real} cm reales = ? cm en el dibujo`;
      answerFraction=rat(toReal?real:drawing);explanation=`Escala 1:${scale}: 1 cm del dibujo representa ${scale} cm reales. ${toReal?`${drawing} × ${scale} = ${real}`:`${real} ÷ ${scale} = ${drawing}`} cm.`;data={scale,drawing,real,toReal};challengeHint='De dibujo a realidad multiplicamos por el denominador de la escala; al volver, dividimos.';
    }else if(kind==='divisibility'){
      const rules=[2,3,4,5,6,8,9,10,11],index=clamp(cfg.divisibilityRule,0,9,0),divisor=index?rules[index-1]:rules[pick(0,8)],n=num(),sum=[...String(n)].reduce((a,c)=>a+Number(c),0),last=n%10,last2=n%100,last3=n%1000,alternating=[...String(n)].reverse().reduce((a,c,i)=>a+(i%2?-1:1)*Number(c),0),remainder=n%divisor;
      const criterion={2:`La última cifra, ${last}, debe ser par.`,3:`La suma de cifras, ${sum}, debe ser múltiplo de 3.`,4:`Las dos últimas cifras, ${last2}, deben formar un múltiplo de 4.`,5:`La última cifra, ${last}, debe ser 0 o 5.`,6:`Debe ser divisible por 2 y por 3: última cifra ${last}, suma ${sum}.`,8:`Las tres últimas cifras, ${last3}, deben formar un múltiplo de 8.`,9:`La suma de cifras, ${sum}, debe ser múltiplo de 9.`,10:`La última cifra, ${last}, debe ser 0.`,11:`La suma alternada de cifras, ${alternating}, debe ser 0 o múltiplo de 11.`}[divisor];
      expression=`¿${n} es divisible por ${divisor}?`;choices=['Sí, es divisible','No, no es divisible'];answerFraction=rat(remainder===0?1:2);explanation=`${criterion} ${remainder===0?'Sí':'No'} es divisible: el resto al dividir ${n} entre ${divisor} es ${remainder}.`;data={n,divisor,remainder};challengeHint=criterion;inputHint='Elige Sí o No y pulsa enviar. Teclado: 1 o 2.';
    }else{
      const triples=[[3,4,5],[5,12,13],[8,15,17],[7,24,25],[20,21,29]],triple=triples[pick(0,4)],factor=num(),[a,b,c]=triple.map(n=>n*factor),hypotenuse=variant===0||(variant===2&&pick(0,1)===1);
      expression=hypotenuse?`Triángulo rectángulo: catetos ${a} y ${b} cm. Hipotenusa = ? cm`:`Triángulo rectángulo: hipotenusa ${c} cm y un cateto ${a} cm. Otro cateto = ? cm`;
      const square=hypotenuse?a*a+b*b:c*c-a*a;answerFraction=rat(hypotenuse?c:b);explanation=`Pitágoras: h^2=a^2+b^2. ${hypotenuse?`h^2=${a}^2+${b}^2=${square}; h=√${square}=${c}`:`b^2=${c}^2−${a}^2=${square}; b=√${square}=${b}`} cm. La longitud positiva es la solución.`;data={a,b,c,factor,hypotenuse};challengeHint='La hipotenusa es el lado opuesto al ángulo recto. Su cuadrado es la suma de los cuadrados de los catetos.';inputHint='Escribe solo la longitud positiva en cm. La raíz es exacta.';
    }
    const answerDisplay=answerFormat==='roots'?data.roots.map(show).join(';'):show(answerFraction);
    return{kind,challenge:true,expression,explanation,challengeHint,inputHint,answerFormat,answerFraction,answerDisplay,answer:answerFraction?Number(answerFraction.numerator)/Number(answerFraction.denominator):null,choices,data,signedInput:true,requiresFractionInput:true,signature:`${kind}:${expression}`};
  }
  function controls(){
    const select=(key,field,title,values)=>`<label>${title}<select class="op-config-select" data-setting-op="${key}" data-setting-key="${field}">${values.map(([value,text])=>`<option value="${value}">${text}</option>`).join('')}</select></label>`;
    const variants={linearEquation:['ax + b = c','Paréntesis','x en ambos lados'],algebraValue:['Expresión lineal','Con x al cuadrado','Con paréntesis'],quadraticEquation:['Dos raíces enteras','Raíces racionales','Raíz doble'],scientificNotation:['Hallar exponente','Hallar mantisa','Calcular valor decimal'],proportion:['Directa','Inversa','Mezcladas'],scaleCalc:['Dibujo a realidad','Realidad a dibujo','Mezcladas'],pythagoras:['Hallar hipotenusa','Hallar cateto','Mezcladas']};
    return Object.entries(labels).map(([key,label])=>`<div class="challenge-config"><label class="challenge-enable"><input class="op-toggle" type="checkbox" data-op="${key}" /> ${label}</label><div class="challenge-fields">${select(key,'digits',key==='pythagoras'?'Cifras del factor de los lados':'Cifras de los datos iniciales',[[1,'1 cifra'],[2,'2 cifras'],[3,'3 cifras']])}${variants[key]?select(key,'variant','Tipo',variants[key].map((v,i)=>[i,v])):''}${['linearEquation','algebraValue','quadraticEquation'].includes(key)?select(key,'signedValues','Valores de x',[[0,'Positivos'],[1,'Positivos y negativos']]):''}${key==='scientificNotation'?select(key,'scientificRange','Exponente entre −n y n',Array.from({length:9},(_,i)=>[i+1,i+1])):''}${key==='divisibility'?select(key,'divisibilityRule','Criterio',[[0,'Todos'],...[2,3,4,5,6,8,9,10,11].map((n,i)=>[i+1,`Divisible por ${n}`])]):''}</div></div>`).join('');
  }
  function parse(value){
    if(!/^-?\d+(?:[,.]\d+|\/\d+)?$/.test(value)||value.length>32)return null;
    if(value.includes('/')){const [n,d]=value.split('/');return BigInt(d)===0n?null:rat(n,d);}
    const [whole,fraction='']=value.replace(',','.').split('.');return rat(whole+fraction,10n**BigInt(fraction.length));
  }
  function correctRoots(text,operation){
    const values=String(text).split(';');if(values.length!==2)return false;const actual=values.map(s=>parse(s.trim())),expected=operation.data.roots;
    const equal=(a,b)=>a&&a.numerator===b.numerator&&a.denominator===b.denominator;
    return Boolean(equal(actual[0],expected[0])&&equal(actual[1],expected[1])||equal(actual[0],expected[1])&&equal(actual[1],expected[0]));
  }
  function appendRoot(text,char){
    const part=text.split(';').at(-1);
    if(/^[0-9]$/.test(char))return text+char;
    if(char===';'&&!text.includes(';')&&parse(part))return text+';';
    if(char==='-'&&!part)return text+'-';
    if(char==='/'&&/^-?\d+$/.test(part))return text+'/';
    if(char===','&&!part.includes(',')&&!part.includes('/'))return text+(part===''?'0,':part==='-'?'0,':',');
    return null;
  }
  const calc=root.NinjaCalculationChallenges,previous=calc.generate,oldControls=calc.controls();
  Object.assign(calc.defaults,defaults);Object.assign(calc.labels,labels);Object.assign(root.NinjaReasoning.defaults,defaults);Object.assign(root.NinjaReasoning.labels,labels);
  calc.generate=(kind,cfg,random)=>Object.hasOwn(defaults,kind)?generate(kind,cfg,random):previous(kind,cfg,random);
  const oldReason=root.NinjaReasoning.calculation;root.NinjaReasoning.calculation=(kind,cfg,random)=>Object.hasOwn(defaults,kind)?generate(kind,cfg,random):oldReason(kind,cfg,random);
  calc.controls=()=>oldControls+controls();
  const oldDomain=root.NinjaNumberGroups.domain;root.NinjaNumberGroups.domain=key=>Object.hasOwn(defaults,key)?'Retos de ESO':oldDomain(key);
  root.NinjaSecondary={defaults,labels,generate,correctRoots,appendRoot,show};
  if(typeof module!=='undefined')module.exports=root.NinjaSecondary;
}(globalThis));
