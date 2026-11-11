const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
require('../problemas.js');require('../matematicas-extra.js');require('../porcentajes.js');require('../magnitudes.js');require('../ampliacion.js');require('../lectura-problemas.js');
require('../banco-problemas/espacio-datos.js');const spatial=require('../espacio.js'),engine=global.NinjaProblems;
const rng=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const context=vm.createContext({document:{body:{},getElementById:()=>null},console,NinjaUnits:global.NinjaUnits,NinjaProblems:{normalize:s=>({...s}),compatible:()=>[],generate:()=>null}});
vm.runInContext('globalThis.window=globalThis;',context);
vm.runInContext(fs.readFileSync(path.join(__dirname,'../espacio.js'),'utf8'),context);
vm.runInContext(fs.readFileSync(path.join(__dirname,'../app.js'),'utf8').replace(/^init\(\);/m,'')+'\nglobalThis.gameState=state;',context);
let count=0;
for(const kind of Object.keys(spatial.defaults))for(let digits=1;digits<=3;digits++)for(let unit=0;unit<=2;unit++)for(let i=0;i<200;i++){
  const cfg={digits,spaceUnit:unit},op=spatial.generateCalculation(kind,cfg,rng(i+30)),{a,b,c}=op.data;
  assert.deepEqual(op,spatial.generateCalculation(kind,cfg,rng(i+30)));
  assert.equal(BigInt(op.answerDisplay),BigInt(a)*BigInt(b)*BigInt(c));
  if(kind==='cubeVolume')assert.ok(a===b&&b===c);
  for(const value of [a,b,c])assert.equal(String(value).length,digits);
  assert.equal(op.data.unit,['cm','dm','m'][unit]);assert.equal(op.answerFraction.denominator,'1');
  assert.ok(op.diagram.includes('<svg')&&op.diagram.includes('no a escala'));
  assert.equal(context.isCorrectOperationAnswer(op.answerDisplay,op),true);
  assert.equal(context.isCorrectOperationAnswer(String(op.answer+1),op),false);count++;
}
const seen=new Set();
for(let digits=1;digits<=3;digits++)for(let unit=0;unit<=2;unit++)for(let i=0;i<160;i++){
  const cfg={_family:'espacio',_spaceDigits:digits,_spaceUnit:unit};const op=engine.generate(cfg,i,773),p=op.problem,{a,b,c,variant}=p.data;
  seen.add(p.templateId);assert.deepEqual(op,engine.generate(cfg,i,773));assert.equal(op.answerDisplay,String(BigInt(a)*BigInt(b)*BigInt(c)));
  assert.equal(p.steps.length,p.calculations.length);assert.ok(!/undefined|NaN|Infinity/.test(JSON.stringify(op)));
  assert.equal(p.unit,variant===3?'litros':`${['cm','dm','m'][unit]}³`);if(variant===3)assert.equal(p.data.unit,'dm');
  assert.equal(context.isCorrectOperationAnswer(op.answerDisplay,op),true);assert.ok(context.renderProblem({...op,solutionRevealed:true}).includes(op.answerDisplay));count++;
}
assert.equal(seen.size,40);for(let v=0;v<4;v++)assert.equal(engine.compatible({_family:'espacio',_spaceVariant:v}).length,10);
const state=context.gameState;
for(const kind of Object.keys(spatial.defaults)){
  Object.values(state.operationSettings).forEach(c=>c.enabled=false);state.operationSettings[kind].enabled=true;state.online={seed:42};
  const op=context.createOnlineOperation(12);assert.equal(JSON.stringify(op),JSON.stringify(context.createOnlineOperation(12)));assert.ok(op.challenge&&op.html.includes('spatial-diagram'));
}
state.activity='problemas';state.problemSettings={_family:'espacio',_spaceVariant:3,_spaceDigits:3};
assert.equal(JSON.stringify(context.createOnlineOperation(17)),JSON.stringify(context.createOnlineOperation(17)));
assert.equal(context.sanitizeOpSettingValue('spaceUnit',0),0);
console.log(`OK: ${count} exact volume calculations/problems, dimensions, cubic units, cube equality, layers, dm3/litres, 40 templates and deterministic online.`);
