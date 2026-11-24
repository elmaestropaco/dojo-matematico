const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
for(const f of ['problemas','matematicas-extra','porcentajes','magnitudes','ampliacion','lectura-problemas','espacio','retos-calculo','ampliacion-aula','retos-razonamiento','organizacion-calculo','potencias-cifras'])require('../'+f+'.js');
const ctx=vm.createContext({document:{body:{},getElementById:()=>null},console,NinjaSpatial,NinjaCalculationChallenges});
vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../app.js'),'utf8').replace(/^init\(\);/m,''),ctx);
const defaults=vm.runInContext('state.operationSettings',ctx);
for(const [kind,cfg]of Object.entries(defaults))for(const key of NinjaExponentDigits.digitKeys)if(key in cfg)assert.equal(cfg[key],1,kind+':'+key);
for(const kind of NinjaNumberGroups.powers)assert.equal(defaults[kind].exponentDigits,1,kind);
const pow=(b,e)=>e<0?[1n,BigInt(b)**BigInt(-e)]:[BigInt(b)**BigInt(e),1n];
const add=(x,y)=>[x[0]*y[1]+y[0]*x[1],x[1]*y[1]],sub=(x,y)=>[x[0]*y[1]-y[0]*x[1],x[1]*y[1]],mul=(x,y)=>[x[0]*y[0],x[1]*y[1]],div=(x,y)=>[x[0]*y[1],x[1]*y[0]];
let count=0;
for(const kind of NinjaNumberGroups.powers)for(let digits=1;digits<=3;digits++)for(let negative=0;negative<=1;negative++)for(let seed=0;seed<100;seed++){
  const cfg={digits:1,exponentDigits:digits,negativeExponents:negative},op=NinjaExponentDigits.generate(kind,cfg,NinjaReasoning.rng(seed+917)),d=op.data,max=10**digits-1;
  assert.ok(!/undefined|NaN|Infinity/.test(JSON.stringify(op)));assert.ok(op.answerDisplay.length<=32);
  for(const key of ['a','b','c'])assert.ok(Math.abs(d[key])<=max,kind+key);
  assert.equal(ctx.isCorrectOperationAnswer(op.answerDisplay,op),true);
  assert.equal(ctx.isCorrectOperationAnswer('123456789',op),false);
  if(kind==='power'){const [n,den]=pow(d.base,d.a);assert.equal(op.answerFraction.numerator,String(n));assert.equal(op.answerFraction.denominator,String(den));assert.ok(d.a<=9);}
  else if(op.answerFormat==='power'){
    const e=kind==='power'?d.a:kind==='sameBaseMul'?d.a+d.b:kind==='sameBaseDiv'?d.a-d.b:kind==='powerPower'?d.a*d.b:d.a+d.b-d.c;
    assert.equal(d.e,e);assert.equal(ctx.isCorrectOperationAnswer(d.base+'^'+(e+1),op),false);
    if(op.answerFraction){const [n,den]=pow(d.base,e);assert.equal(op.answerFraction.numerator,String(n));assert.equal(op.answerFraction.denominator,String(den));}
    else assert.equal(ctx.isCorrectOperationAnswer('0',op),false);
  }else{
    let expected;
    if(kind==='signedPowersCombined')expected=mul([BigInt(d.integer+d.other),1n],pow(d.base,d.e));
    else{const p=pow(d.base,d.a),q=pow(d.base,d.b);expected=kind==='powerAdd'?add(p,q):kind==='powerSub'?sub(p,q):kind==='powerCombinedEasy'?mul(add(p,q),pow(d.base,d.c)):add(div(sub(p,q),pow(d.base,d.c)),pow(d.base,d.e));}
    const fraction=op.answerFraction;
    if(op.expression.includes('?'))expected=div(expected,pow(d.base,d.e));
    assert.equal(BigInt(fraction.numerator)*expected[1],expected[0]*BigInt(fraction.denominator),kind);
  }
  count++;
}
for(const digits of [1,2,3]){const op=NinjaExponentDigits.generate('sameBaseMul',{exponentDigits:digits},()=>.999999);assert.equal(op.data.a,10**digits-1);assert.equal(op.data.b,10**digits-1);}
const huge=NinjaExponentDigits.generate('powerPower',{exponentDigits:3},()=>.999999);assert.equal(huge.data.e,998001);assert.equal(huge.answerFraction,null);assert.equal(ctx.isCorrectOperationAnswer('9^998001',huge),true);
console.log(`OK: ${count} power cases, exponent ranges 9/99/999, signs, independent exact answers, symbolic safety, no false zero answers and all calculation digit defaults set to one.`);
