const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
require('../problemas.js');require('../matematicas-extra.js');require('../porcentajes.js');require('../magnitudes.js');
const challenges=require('../retos-calculo.js');
const context=vm.createContext({document:{body:{},getElementById:()=>null},console,NinjaUnits:global.NinjaUnits,NinjaPercentages:global.NinjaPercentages});
vm.runInContext(fs.readFileSync(path.join(__dirname,'../retos-calculo.js'),'utf8'),context);
vm.runInContext(fs.readFileSync(path.join(__dirname,'../app.js'),'utf8').replace(/^init\(\);/m,'')+'\nglobalThis.gameState=state;',context);
const rng=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
let count=0;
for(const kind of Object.keys(challenges.defaults))for(let i=0;i<1200;i++) {
  const cfg={digits:i%3+1,inputPlaces:i%4,scalePower:i%4,challengeVariant:i%7,orderCount:i%3+3,orderDirection:i%2,angleType:i%5};
  const op=challenges.generate(kind,cfg,rng(i+15)),data=op.data;
  assert.deepEqual(op,challenges.generate(kind,cfg,rng(i+15)));
  assert.ok(!/undefined|NaN|Infinity/.test(JSON.stringify(op)));
  assert.equal(context.isCorrectOperationAnswer(op.answerDisplay,op),true);
  const n=BigInt(op.answerFraction.numerator),d=BigInt(op.answerFraction.denominator);
  if(kind==='scaleTen')assert.equal(n*BigInt(data.multiply?data.scale:data.scale*data.factor),BigInt(data.multiply?data.a*data.factor:data.a)*d);
  if(kind==='equivalence') {
    assert.equal(n*BigInt(data.denominator),BigInt(data.numerator*(data.target==='porcentaje'?100:1))*d);
    if(op.answerFormat==='fraction') { assert.equal(context.isCorrectOperationAnswer(String(op.answer),op),false);assert.equal(context.isCorrectOperationAnswer(`${n*2n}/${d*2n}`,op),true); }
    else assert.equal(context.isCorrectOperationAnswer(`${n}/${d}`,op),false);
  }
  if(kind==='integerOrder') {const sorted=[...data.numbers].sort((a,b)=>data.descending?b-a:a-b);assert.equal(Number(n),sorted[data.position-1]);assert.equal(new Set(sorted).size,cfg.orderCount);assert.ok(sorted.some(n=>n<0)&&sorted.some(n=>n>=0));}
  if(kind==='absoluteValue')assert.equal(Number(n),Math.abs(data.value));
  if(kind==='numberLine'){assert.equal(Number(n),data.start+data.target*data.step);assert.ok(op.diagram.includes('circle'));assert.ok(Math.abs(Number(n))<=10**cfg.digits-1);}
  if(kind==='angles'){assert.equal(Number(n)+data.a+data.b,data.total);assert.ok(Number(n)>0);if(data.type===3)assert.ok(data.a>0&&data.b>0&&Number(n)<180);}
  assert.equal(context.isCorrectOperationAnswer(String(op.answer+0.000001).replace('.',','),op),false);
  count++;
}
const state=context.gameState;
for(const kind of Object.keys(challenges.defaults)) {
  Object.values(state.operationSettings).forEach(c=>c.enabled=false);state.operationSettings[kind].enabled=true;
  state.online={seed:54321};const op=context.createOnlineOperation(9);
  assert.equal(JSON.stringify(op),JSON.stringify(context.createOnlineOperation(9)));
  assert.ok(op.challenge&&op.html&&!op.html.includes('undefined'));
  if(op.signedInput){const player={id:0,input:''};state.operationsByPlayer.set(0,op);state.allowNegative=false;assert.equal(context.appendInputChar(player,'-'),true);}
}
for(const inputPlaces of [0,1,2,3]) {assert.equal(context.sanitizeOpSettingValue('inputPlaces',inputPlaces),inputPlaces);assert.equal(context.sanitizeOpSettingValue('challengeVariant',6),6);}
console.log(`OK: ${count} exact challenges, six conversion directions, integers, valid angles, diagrams, strict answer format, signed keyboard and deterministic online generation.`);
