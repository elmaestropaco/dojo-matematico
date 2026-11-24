const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
require('../problemas.js');require('../matematicas-extra.js');require('../porcentajes.js');require('../magnitudes.js');require('../ampliacion.js');require('../lectura-problemas.js');require('../espacio.js');require('../retos-calculo.js');require('../ampliacion-aula.js');
const lib=require('../retos-razonamiento.js'),engine=global.NinjaProblems,ctx=vm.createContext({document:{body:{},getElementById:()=>null},console});
vm.runInContext(fs.readFileSync(path.join(__dirname,'../app.js'),'utf8').replace(/^init\(\);/m,''),ctx);
let calculations=0,problems=0,negativePowers=0,positivePowers=0;
for(const kind of Object.keys(lib.defaults))for(let setting=1;setting<=6;setting++)for(let i=0;i<200;i++){
  const cfg={digits:(setting-1)%3+1,exponentMax:setting,negativeExponents:i%2},op=lib.calculation(kind,cfg,lib.rng(i+setting*137)),d=op.data;
  assert.deepEqual(op,lib.calculation(kind,cfg,lib.rng(i+setting*137)));
  assert.ok(!/undefined|NaN|Infinity/.test(JSON.stringify(op)));let n,den=1n;
  if(kind==='signedAdd')n=BigInt(d.a)+BigInt(d.b);
  if(kind==='signedSub')n=BigInt(d.a)-BigInt(d.b);
  if(kind==='signedMul')n=BigInt(d.a)*BigInt(d.b);
  if(kind==='signedDiv'){assert.equal(BigInt(d.a)%BigInt(d.b),0n);n=BigInt(d.a)/BigInt(d.b);}
  if(kind==='signedCombinedEasy')n=BigInt(d.a)+BigInt(d.b)*BigInt(d.c);
  if(kind==='signedCombinedAdv'){assert.equal(BigInt(d.p)%BigInt(d.divisor),0n);n=(BigInt(d.a)-BigInt(d.b))*(BigInt(d.c)+BigInt(d.d))-BigInt(d.p)/BigInt(d.divisor);}
  if(kind.startsWith('signed')&&kind!=='signedPowersCombined')for(const value of Object.values(d))assert.equal(String(Math.abs(value)).length,cfg.digits);
  else{
    const exponent=kind==='sameBaseMul'?d.a+d.b:kind==='sameBaseDiv'?d.a-d.b:d.a+d.b-d.c;assert.equal(d.e,exponent);
    if(d.e<0){den=BigInt(d.base)**BigInt(-d.e);n=1n;negativePowers++;}else{n=BigInt(d.base)**BigInt(d.e);positivePowers++;}
    if(kind==='signedPowersCombined'){n+=BigInt(d.integer)*den;assert.ok(Math.abs(d.e)<=setting);assert.ok(op.answerDisplay.length<=32);}
    for(const key of ['a','b','c'])assert.ok(Math.abs(d[key])<=setting);
    if(!cfg.negativeExponents)assert.ok(d.a>=0&&d.b>=0&&d.c>=0&&d.e>=0);
  }
  assert.equal(BigInt(op.answerFraction.numerator)*den,n*BigInt(op.answerFraction.denominator));
  assert.equal(ctx.isCorrectOperationAnswer(op.answerDisplay,op),true);
  assert.equal(ctx.isCorrectOperationAnswer(`${op.answerFraction.numerator}/${op.answerFraction.denominator}`,op),true);
  assert.equal(ctx.isCorrectOperationAnswer(String(n+den)+'/'+String(den),op),false);calculations++;
}
assert.ok(negativePowers>0&&positivePowers>0);
const seen=new Set();
for(const family of Object.keys(lib.families))for(let level=1;level<=3;level++)for(let reading=0;reading<=1;reading++)for(let i=0;i<60;i++){
  const cfg={_family:family,_aulaLevel:level,_aulaReading:reading},op=engine.generate(cfg,i,182),p=op.problem,d=p.data,v=d.v;let n;
  assert.deepEqual(op,engine.generate(cfg,i,182));assert.equal(p.steps.length,p.calculations.length);assert.ok(!/[{}]|undefined|NaN|Infinity/.test(p.text));
  if(family==='patrones')n=v===0?d.start+4*d.b:v===1?d.start+2*d.b:d.start+2*d.b-2*d.down;
  if(family==='combinatoria')n=d.x*d.y*(v===1?d.z:1);
  if(family==='resumenDatos'){const sorted=[...d.values].sort((a,b)=>a-b),counts=new Map();d.values.forEach(x=>counts.set(x,(counts.get(x)||0)+1));n=v===0?sorted[2]:v===2?sorted.at(-1)-sorted[0]:[...counts].sort((a,b)=>b[1]-a[1])[0][0];}
  if(family==='enterosContexto'){n=d.initial+(d.up?d.change:-d.change);assert.ok(op.signedInput);}
  if(family==='porcentajesRetos')n=v===0?d.first*100/(100-d.r1):v===1?d.original*(100-d.r1)*(100-d.r2)/10000:d.increased*100/(100+d.r1);
  if(family==='lecturaVisual'){n=v===0?d.rows*d.cols-d.cutR*d.cutC:v===1?d.values[0]+d.values[2]:d.right+d.up+d.left;assert.ok(p.visualFallback);assert.ok(lib.visual(p,false).includes(p.visualFallback));}
  if(family==='planificacion'){
    const valid=v===0?d.arrivals.filter(x=>x<=d.deadline):v===1?d.slots.filter(([x,y])=>x>=d.start&&y<=d.end&&y-x===d.duration&&(y<=d.busyStart||x>=d.busyEnd)):d.offers.filter(([qty,price])=>qty>=d.need&&price<=d.budget);
    if(v===0)assert.ok(op.answerLabel.includes(String(Math.floor(Math.max(...valid)/60))+':'+String(Math.max(...valid)%60).padStart(2,'0')));
    else assert.equal(valid.length,1);
    assert.equal(op.choices[Number(op.answerDisplay)-1],op.answerLabel);n=Number(op.answerDisplay);
  }
  assert.equal(Number(op.answerDisplay),n);assert.equal(ctx.isCorrectOperationAnswer(op.answerDisplay,op),true);assert.ok(!lib.visual(p,false).includes('<svg'));seen.add(p.templateId);problems++;
}
assert.equal(seen.size,210);assert.equal(lib.bank.length,210);
assert.equal(engine.normalize({_showDrawings:false})._showDrawings,false);
const graph={diagram:'<svg></svg>',data:{days:['Lunes','Martes'],values:[3,8]}};assert.ok(lib.visual(graph,false).includes('Martes: 8'));
assert.equal(lib.visual({diagram:'<table><tr><td>8</td></tr></table>'},false),'<table><tr><td>8</td></tr></table>');
for(const key of Object.keys(lib.defaults))assert.equal((global.NinjaCalculationChallenges.controls().match(new RegExp(`data-op="${key}"`,'g'))||[]).length,1);
const dynamics=require('../dinamica.js');for(const family of Object.keys(lib.families)){assert.equal(dynamics.problem({_family:family,_aulaLevel:1},3).settings._aulaLevel,3);assert.equal(dynamics.problem({_family:family,_aulaLevel:3},3).tier,1);}assert.equal(dynamics.calculation(lib.defaults.sameBaseMul,3).tier,1);
console.log(`OK: ${calculations} exact signed/power calculations; ${problems} problem cases, 210 templates, unique planning solutions, optional diagrams with data fallback and stable online sequences.`);
