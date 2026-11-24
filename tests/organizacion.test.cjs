const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
for(const file of ['problemas','matematicas-extra','porcentajes','magnitudes','ampliacion','lectura-problemas','espacio','retos-calculo','ampliacion-aula','retos-razonamiento'])require('../'+file+'.js');
const lib=require('../organizacion-calculo.js'),ctx=vm.createContext({document:{body:{},getElementById:()=>null},console});
vm.runInContext(fs.readFileSync(path.join(__dirname,'../app.js'),'utf8').replace(/^init\(\);/m,''),ctx);
const power=(b,e)=>e<0?[1n,BigInt(b)**BigInt(-e)]:[BigInt(b)**BigInt(e),1n];
const add=(x,y)=>[x[0]*y[1]+y[0]*x[1],x[1]*y[1]],sub=(x,y)=>[x[0]*y[1]-y[0]*x[1],x[1]*y[1]],mul=(x,y)=>[x[0]*y[0],x[1]*y[1]],div=(x,y)=>[x[0]*y[1],x[1]*y[0]];
let count=0;
for(const kind of Object.keys(lib.defaults))for(let limit=1;limit<=6;limit++)for(let i=0;i<300;i++){
  const cfg={exponentMax:limit,negativeExponents:i%2},op=lib.generate(kind,cfg,NinjaReasoning.rng(i+limit*1000)),d=op.data;
  assert.deepEqual(op,NinjaReasoning.calculation(kind,cfg,NinjaReasoning.rng(i+limit*1000)));
  const p=power(d.base,d.a),q=power(d.base,d.b),r=power(d.base,d.c);
  const expected=kind==='powerAdd'?add(p,q):kind==='powerSub'?sub(p,q):kind==='powerPower'?power(d.base,d.a*d.b):kind==='powerCombinedEasy'?mul(add(p,q),r):add(div(sub(p,q),r),power(d.base,d.d*d.e));
  assert.equal(BigInt(op.answerFraction.numerator)*expected[1],expected[0]*BigInt(op.answerFraction.denominator));
  assert.ok(op.answerDisplay.length<=32);assert.ok(!/undefined|NaN|Infinity/.test(JSON.stringify(op)));
  assert.equal(ctx.isCorrectOperationAnswer(op.answerDisplay,op),true);
  assert.equal(ctx.isCorrectOperationAnswer(`${op.answerFraction.numerator}/${op.answerFraction.denominator}`,op),true);
  assert.equal(ctx.isCorrectOperationAnswer(`${expected[0]+expected[1]}/${expected[1]}`,op),false);
  count++;
}
for(const kind of lib.integer.filter(k=>k.startsWith('signed')))for(let digits=1;digits<=9;digits++)for(let i=0;i<80;i++){
  const op=NinjaReasoning.calculation(kind,{digits},NinjaReasoning.rng(i+digits*200)),d=op.data;
  for(const v of Object.values(d))assert.equal(String(Math.abs(v)).length,digits);
  let n=kind==='signedAdd'?BigInt(d.a)+BigInt(d.b):kind==='signedSub'?BigInt(d.a)-BigInt(d.b):kind==='signedMul'?BigInt(d.a)*BigInt(d.b):kind==='signedDiv'?BigInt(d.a)/BigInt(d.b):kind==='signedCombinedEasy'?BigInt(d.a)+BigInt(d.b)*BigInt(d.c):(BigInt(d.a)-BigInt(d.b))*(BigInt(d.c)+BigInt(d.d))-BigInt(d.p)/BigInt(d.divisor);
  assert.equal(op.answerFraction.numerator,String(n));assert.equal(op.answerFraction.denominator,'1');
  assert.equal(ctx.isCorrectOperationAnswer(op.answerDisplay,op),true);
  if(kind==='signedCombinedEasy')assert.ok(op.explanation.includes(String(BigInt(d.b)*BigInt(d.c))));
  count++;
}
const controls=NinjaCalculationChallenges.controls();
for(const key of Object.keys(NinjaCalculationChallenges.defaults))assert.equal((controls.match(new RegExp('data-op="'+key+'"','g'))||[]).length,1,key);
assert.equal(lib.domain('signedAdd'),'Enteros');assert.equal(lib.domain('mul'),'Naturales');assert.equal(lib.domain('powerPower'),'Potencias');
console.log(`OK: ${count} exact power/integer cases; independent rational references, signed 1-9 digits, input lengths, answer validation, deterministic sequences and unique controls.`);
