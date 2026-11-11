const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
for(const file of ['datos','ampliado-datos','porcentajes-datos','medidas-datos','aprendizaje-datos','lectura-datos','espacio-datos'])require('../banco-problemas/'+file+'.js');
const engine=require('../problemas.js');require('../matematicas-extra.js');require('../porcentajes.js');require('../magnitudes.js');require('../ampliacion.js');const literacy=require('../lectura-problemas.js');
const context=vm.createContext({document:{body:{},getElementById:()=>null},console});
vm.runInContext(fs.readFileSync(path.join(__dirname,'../app.js'),'utf8').replace(/^init\(\);/m,'')+'\nglobalThis.gameState=state;',context);
let count=0,choices=0;const seen=new Set();
for(const family of Object.keys(literacy.labels))for(let level=1;level<=3;level++)for(const decimals of [false,true])for(let i=0;i<160;i++){
  const cfg={_family:family,_literacyLevel:level,_literacyDecimals:decimals};
  const op=engine.generate(cfg,i,331),p=op.problem,data=p.data,t=literacy.bank.find(t=>t.id===p.templateId);
  seen.add(t.id);assert.deepEqual(op,engine.generate(cfg,i,331));assert.equal(p.steps.length,p.calculations.length);
  assert.equal(context.isCorrectOperationAnswer(op.answerDisplay,op),true);assert.ok(!/undefined|NaN|Infinity|\b1 (?:minutos|libros|bolas)\b/.test(p.text));
  assert.ok(context.renderProblem(op).includes('Lee y resuelve'));assert.ok(context.renderProblem({...op,solutionRevealed:true}).includes(op.answerLabel||op.answerDisplay));
  const n=BigInt(op.answerFraction.numerator),d=BigInt(op.answerFraction.denominator);
  if(op.choices){choices++;assert.equal(op.choices[Number(n)-1],op.answerLabel);assert.equal(new Set(op.choices).size,op.choices.length);assert.ok(op.choices.length>=2);}
  if(family==='horarios'){
    const start=Math.floor(data.start/60)*60+data.start%60,end=Math.floor(data.end/60)*60+data.end%60;
    assert.equal(end-start,data.duration);
    if(t.variant===0||t.variant===3)assert.equal(Number(n),end-start);
    else assert.equal(op.answerLabel,literacy.clock(t.variant===1?end:start));
    if(t.variant===3)assert.ok(data.start<1440&&data.end>1440&&p.text.includes('día siguiente'));
  }
  if(family==='datos'){
    const expected=t.variant===0?data.values[data.selected]:t.variant===1?Math.abs(data.values[data.selected]-data.values[data.other]):t.variant===2?data.values.reduce((a,b)=>a+b,0):Math.max(...data.values);
    assert.equal(Number(n),expected);assert.equal(new Set(data.values).size,data.values.length);assert.ok(p.diagram.includes(t.variant===3?'<svg':'<table'));
  }
  if(family==='estadistica'){
    if(t.variant<2){assert.equal(n*BigInt(data.values.length),BigInt(data.values.reduce((a,b)=>a+b,0))*d);if(!decimals)assert.equal(d,1n);}
    else {const total=t.variant===2?data.total:6,favorable=t.variant===2?data.red:6-data.threshold;assert.equal(n*BigInt(total),BigInt(favorable)*d);assert.ok(op.requiresFractionInput);assert.equal(context.isCorrectOperationAnswer(`${n*3n}/${d*3n}`,op),true);}
  }
  if(family==='investigacion'){
    if(t.variant===0)assert.equal(Number(n),data.a);
    if(t.variant===1)assert.equal(op.answerLabel,data.enough?`${data.groups*data.a} lápices`:'No se puede saber');
    if(t.variant===2)assert.equal(op.answerLabel,'Debe multiplicar las cajas por los pinceles de cada caja.');
    if(t.variant===3)assert.equal(op.answerLabel,'Los libros de cuentos y los de aventuras.');
  }
  count++;
}
assert.equal(seen.size,160);assert.equal(literacy.bank.length,160);
for(const f of Object.keys(literacy.labels))for(let variant=0;variant<4;variant++)assert.equal(engine.compatible({_family:f,[`_${f}Variant`]:variant}).length,10);
const ids=[global.NinjaProblemBank,global.NinjaAdvancedProblemBank,global.NinjaPercentageProblemBank,global.NinjaMeasureProblemBank,global.NinjaLearningProblemBank,global.NinjaLiteracyProblemBank,global.NinjaSpatialProblemBank].flatMap(b=>b.plantillas.map(t=>t.id));assert.equal(ids.length,2100);assert.equal(new Set(ids).size,2100);
console.log(`OK: ${count} literacy problems, ${choices} choice questions, 160 templates, clocks, midnight, tables/charts, exact means, probability fractions, inverse/insufficient/error tasks and 2100 unique templates.`);
