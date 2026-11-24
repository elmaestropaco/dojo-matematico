const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
require('../problemas.js');require('../matematicas-extra.js');require('../porcentajes.js');require('../magnitudes.js');require('../ampliacion.js');require('../lectura-problemas.js');require('../espacio.js');require('../retos-calculo.js');
const lib=require('../ampliacion-aula.js'),engine=global.NinjaProblems;
const ctx=vm.createContext({document:{body:{},getElementById:()=>null},console});
vm.runInContext(fs.readFileSync(path.join(__dirname,'../app.js'),'utf8').replace(/^init\(\);/m,''),ctx);
let calculations=0,problems=0;
for(const kind of Object.keys(lib.defaults))for(let digits=1;digits<=3;digits++)for(let i=0;i<400;i++){
  const cfg={digits,divisorDigits:i%3+1},op=lib.calculation(kind,cfg,lib.rng(i+1)),d=op.data;
  assert.deepEqual(op,lib.calculation(kind,cfg,lib.rng(i+1)));assert.ok(!/undefined|NaN|Infinity/.test(JSON.stringify(op)));
  if(kind==='divisionRemainder'){
    assert.equal(d.q*d.d+d.r,d.n);assert.ok(d.r>=0&&d.r<d.d);assert.equal(String(d.n).length,digits);assert.equal(String(d.d).length,cfg.divisorDigits);
    assert.equal(ctx.isCorrectOperationAnswer(`${d.q}/${d.r}`,op),true);assert.equal(ctx.isCorrectOperationAnswer(`${d.q} R ${d.r}`,op),true);assert.equal(ctx.isCorrectOperationAnswer(`${d.q}/${d.r+1}`,op),false);
  }else if(kind==='fractionCompare')assert.equal(op.answerSymbol,d.a*d.d<d.c*d.b?'<':d.a*d.d>d.c*d.b?'>':'=');
  else {
    const expected=kind==='fractionGap'?d.a*d.factor:kind==='timeArithmetic'?(d.subtract?d.a-d.b:d.a+d.b):d.a*d.factor+d.b;
    assert.equal(Number(op.answerDisplay),expected);assert.equal(ctx.isCorrectOperationAnswer(op.answerDisplay,op),true);
  }
  calculations++;
}
assert.equal(lib.bank.length,180);const seen=new Set();
for(const family of Object.keys(lib.families))for(let level=1;level<=3;level++)for(let reading=0;reading<=1;reading++){
  const cfg={_family:family,_aulaLevel:level,_aulaReading:reading},pool=engine.compatible(cfg);let last=-1;
  for(let i=0;i<pool.length;i++){
    const op=engine.generate(cfg,i,382),p=op.problem,d=p.data,v=d.v,n=Number(op.answerDisplay);
    assert.equal(p.steps.length,p.calculations.length,'Every explanation must have its calculation');
    assert.deepEqual(op,engine.generate(cfg,i,382));assert.ok(!/undefined|NaN|Infinity|\{[^}]+\}|[A-Za-z]\?[A-Za-z]/.test(p.text));
    let expected;
    if(family==='repartos')expected=v===1?d.r:v===2?Math.ceil(d.total/d.b):Math.floor(d.total/d.b);
    if(family==='fraccionSentido')expected=v===0?d.a*d.den:v===1?(d.den-d.num)*d.a:Math.abs(d.num*d.a-d.num*d.q);
    if(family==='geometriaAplicada')expected=v===1?2*(d.width+d.height)-d.b:d.width*d.height-d.cutW*d.cutH;
    if(family==='comprasDecision')expected=v===0?d.price:v===1?Math.floor(d.budget/d.price):d.r;
    if(family==='estimacion'){const round=n=>Math.floor((n+5)/10)*10;expected=v===0?round(d.x)+round(d.y):v===1?round(d.x)*d.b:Math.floor(d.total/d.b);}
    if(family==='inversa')expected=d.total/d.newGroups;
    assert.equal(n,expected);assert.equal(ctx.isCorrectOperationAnswer(op.answerDisplay,op),true);assert.notEqual(v,last);last=v;
    seen.add(p.templateId);problems++;
  }
}
assert.equal(seen.size,180);
const challengeControls=global.NinjaCalculationChallenges.controls();
for(const key of Object.keys(global.NinjaCalculationChallenges.defaults))assert.equal((challengeControls.match(new RegExp(`data-op="${key}"`,'g'))||[]).length,1,key);
require('../sesiones.js');const transfer=require('../aula-datos.js');const learning=require('../seguimiento.js');const insights=require('../informes-contenido.js');
const input=[{id:'r',date:'2026-11-24',players:{a:{name:'Paco',studentId:'class:A01',correctCount:3,wrongCount:0,learningStats:{add:{correct:3}}},b:{name:'Paco',studentId:'class:A02',correctCount:4,wrongCount:1,learningStats:{add:{correct:4,wrong:1}}}}}];
const cleaned=transfer.history(input);assert.equal(insights.summary(insights.build(cleaned)).length,2);
const dynamics=require('../dinamica.js');for(const family of Object.keys(lib.families)){assert.equal(dynamics.problem({_family:family,_aulaLevel:1},3).settings._aulaLevel,3);assert.equal(dynamics.problem({_family:family,_aulaLevel:3},3).tier,1);}
const renamed=structuredClone(cleaned[0]);renamed.id='r2';renamed.players={a:{...renamed.players.a,name:'Nuevo nombre'}};
assert.equal(insights.summary(insights.build([...cleaned,renamed])).find(r=>r.correct===6).rounds,2);
assert.throws(()=>transfer.history([{id:'bad',date:'no'}]));assert.throws(()=>transfer.sessions([{name:'x'}]));
assert.equal(transfer.sessions([{name:'Prueba',config:{activity:'calculo',hostUid:'private',teamAssignments:{private:1}}}])[0].config.hostUid,undefined);
const storage={};global.localStorage={getItem:k=>storage[k]||null,setItem(k,v){storage[k]=v;}};learning.mergeImported(cleaned);assert.equal(learning.read().length,1);learning.mergeImported(cleaned);assert.equal(learning.read().length,1);
const richer=structuredClone(cleaned);richer[0].players.a.correctCount=9;richer[0].players.a.score=90;richer[0].status='finished';learning.mergeImported(richer);learning.mergeImported(cleaned);assert.equal(learning.read()[0].players.a.correctCount,9);assert.equal(learning.read()[0].status,'finished');
const xml=Buffer.from(learning.workbook(cleaned,{insights:{}})).toString('utf8');assert.ok(xml.includes('class:A01')&&xml.includes('class:A02'));
console.log(`OK: ${calculations} new calculations and ${problems} applied problems, all 180 templates, independent references, deterministic alternation, controls, stable report identities and validated transfer.`);
