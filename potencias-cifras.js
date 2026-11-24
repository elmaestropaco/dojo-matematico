(function(root){
  const keys=root.NinjaNumberGroups.powers;
  const digitKeys=['digits','multiplicandMax','factorMax','dividendMax','divisorMax','divisorDigits','numeratorMax','denominatorMax'];
  for(const api of [root.NinjaCalculationChallenges,root.NinjaReasoning,root.NinjaAula,root.NinjaSpatial])for(const cfg of Object.values(api.defaults))for(const key of digitKeys)if(Object.hasOwn(cfg,key))cfg[key]=1;
  for(const key of keys)if(root.NinjaCalculationChallenges.defaults[key])root.NinjaCalculationChallenges.defaults[key].exponentDigits=1;
  const power=(base,e)=>e<0?{numerator:'1',denominator:String(BigInt(base)**BigInt(-e))}:{numerator:String(BigInt(base)**BigInt(e)),denominator:'1'};
  function generate(kind,cfg={},random=Math.random){
    const digits=kind==='power'?1:Math.max(1,Math.min(3,Math.trunc(Number(cfg.exponentDigits))||1)),max=10**digits-1;
    const pick=(a,b)=>a+Math.floor(random()*(b-a+1)),negative=Number(cfg.negativeExponents)===1;
    const baseDigits=Math.max(1,Math.min(3,Math.trunc(Number(cfg.digits))||1));
    const exp=()=>pick(negative?-max:0,max),base=kind==='power'?pick(10**(baseDigits-1),10**baseDigits-1):pick(2,9);
    let a=exp(),b=exp(),c=exp(),e,expression,explanation,answerFraction,answerDisplay,answerFormat='power',data={base,a,b,c};
    if(kind==='power'){
      a=pick(0,max);e=a;expression=`${base}^${a}`;answerFormat='integer';answerFraction=power(base,e);explanation=`La base es ${base} y el exponente es ${a}. ${a===0?'Toda base no nula elevada a cero vale 1.':'El exponente indica cuántas veces se multiplica la base por sí misma.'} Resultado: ${answerFraction.numerator}.`;
    }else if(['sameBaseMul','sameBaseDiv','sameBaseMixed','powerPower'].includes(kind)){
      if(kind==='sameBaseMul'){e=a+b;expression=`${base}^${a} × ${base}^${b}`;explanation=`Misma base: sumamos exponentes. ${a} + (${b}) = ${e}.`;}
      if(kind==='sameBaseDiv'){if(!negative&&a<b)[a,b]=[b,a];e=a-b;expression=`${base}^${a} ÷ ${base}^${b}`;explanation=`Misma base: restamos exponentes. ${a} − (${b}) = ${e}.`;}
      if(kind==='sameBaseMixed'){if(!negative)c=pick(0,Math.min(max,a+b));e=a+b-c;expression=`(${base}^${a} × ${base}^${b}) ÷ ${base}^${c}`;explanation=`Sumamos al multiplicar y restamos al dividir: ${a} + (${b}) − (${c}) = ${e}.`;}
      if(kind==='powerPower'){e=a*b;expression=`(${base}^${a})^${b}`;explanation=`Potencia de una potencia: multiplicamos exponentes. (${a}) × (${b}) = ${e}.`;}
    }else if(kind==='signedPowersCombined'){
      if(!negative)c=pick(0,Math.min(max,a+b));e=a+b-c;
      const integer=-pick(1,9),other=pick(1,9),coefficient=integer+other;
      expression=`(${integer} + ${other}) × ((${base}^${a} × ${base}^${b}) ÷ ${base}^${c}) = ? × ${base}^${e}`;
      answerFraction={numerator:String(coefficient),denominator:'1'};answerFormat='integer';
      explanation=`Dentro del paréntesis: ${integer} + ${other} = ${coefficient}. Las potencias dan ${base}^${e}, porque ${a} + (${b}) − (${c}) = ${e}. Falta el coeficiente ${coefficient}.`;
      data={...data,integer,other,coefficient};
    }else{
      // Close exponents keep the coefficient small even with three-digit exponents.
      const low=pick(negative?-max:0,max),delta=pick(0,Math.min(2,max-low));a=low;b=low+delta;
      const subtract=kind==='powerSub'||kind==='powerCombinedAdv';let coefficient=1+(subtract?-1:1)*base**delta;
      if(kind==='powerCombinedEasy')e=low+c;
      else if(kind==='powerCombinedAdv'){c=negative?pick(Math.max(-max,low-max),Math.min(max,low+max)):pick(0,low);e=low-c;coefficient++;}
      else e=low;
      expression=kind==='powerCombinedEasy'?`(${base}^${a} + ${base}^${b}) × ${base}^${c}`:kind==='powerCombinedAdv'?`((${base}^${a} − ${base}^${b}) ÷ ${base}^${c}) + (${base}^${e})^1`:`${base}^${a} ${subtract?'−':'+'} ${base}^${b}`;
      // For small values keep the original numerical exercise; otherwise ask for the coefficient.
      const factor=power(base,e),n=BigInt(coefficient)*BigInt(factor.numerator),d=BigInt(factor.denominator);
      const exact=root.NinjaUnits.rational(n,d),text=exact.denominator==='1'?exact.numerator:`${exact.numerator}/${exact.denominator}`;
      const coefficientQuestion=digits>1||text.length>32;
      answerFraction=coefficientQuestion?{numerator:String(coefficient),denominator:'1'}:exact;answerFormat='integer';
      if(coefficientQuestion)expression+=` = ? × ${base}^${e}`;
      explanation=`Sacamos el factor común ${base}^${low}: ${base}^${a} ${subtract?'−':'+'} ${base}^${b} = (1 ${subtract?'−':'+'} ${base}^${delta}) × ${base}^${low}. ${kind==='powerCombinedAdv'?`Al dividir restamos ${c} al exponente y después sumamos otra copia de ${base}^${e}. `:kind==='powerCombinedEasy'?`Al multiplicar sumamos ${c} al exponente. `:''}${coefficientQuestion?`El coeficiente que falta es ${coefficient}.`:`Resultado exacto: ${text}.`}`;
      data={...data,coefficient,coefficientQuestion,low,delta};
    }
    data={...data,a,b,c,e};
    if(answerFormat==='power'){
      // Do not expand a power of a power with up to 998001 factors.
      answerFraction=base===1?{numerator:'1',denominator:'1'}:Math.abs(e)<=64?power(base,e):null;answerDisplay=`${base}^${e}`;explanation+=` Resultado: ${answerDisplay}.`;
    }else answerDisplay=answerFraction.denominator==='1'?answerFraction.numerator:`${answerFraction.numerator}/${answerFraction.denominator}`;
    const numeric=answerFraction?Number(answerFraction.numerator)/Number(answerFraction.denominator):NaN;
    return{kind,challenge:true,expression,explanation,answerFraction,answerDisplay,answer:Number.isFinite(numeric)?numeric:null,answerFormat,data,signedInput:true,requiresFractionInput:true,inputHint:answerFormat==='power'?'Responde base^exponente (por ejemplo 3^174). Tecla P para ^.':expression.includes('?')?'Escribe solo el número que falta en el hueco.':'Responde con el valor exacto, como entero o fracción.',challengeHint:answerFormat==='power'?'Misma base: el producto suma exponentes y el cociente los resta. Potencia de potencia: los multiplica.':'Calcula potencias y paréntesis antes de productos, divisiones, sumas y restas.',signature:`${kind}:${expression}`};
  }
  const calc=root.NinjaCalculationChallenges,oldGenerate=calc.generate,oldReason=root.NinjaReasoning.calculation,oldExpansion=root.NinjaExpansion.newCalculation;
  const use=cfg=>cfg&&Number(cfg.exponentDigits)>=1;
  calc.generate=(kind,cfg,random)=>keys.includes(kind)&&use(cfg)?generate(kind,cfg,random):oldGenerate(kind,cfg,random);
  root.NinjaReasoning.calculation=(kind,cfg,random)=>keys.includes(kind)&&use(cfg)?generate(kind,cfg,random):oldReason(kind,cfg,random);
  root.NinjaExpansion.newCalculation=(kind,cfg,random)=>kind==='power'&&use(cfg)?generate(kind,cfg,random):oldExpansion(kind,cfg,random);
  root.NinjaExponentDigits={generate,digitKeys};
  if(typeof module!=='undefined')module.exports=root.NinjaExponentDigits;
}(globalThis));
