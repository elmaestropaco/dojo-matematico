const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
for(const f of ['problemas','matematicas-extra','porcentajes','magnitudes','ampliacion','lectura-problemas','espacio','retos-calculo','ampliacion-aula','retos-razonamiento','organizacion-calculo','potencias-cifras'])require('../'+f+'.js');
const lib=require('../calculo-eso.js'),ctx=vm.createContext({document:{body:{},getElementById:()=>null},console,NinjaSecondary:lib});
vm.runInContext(fs.readFileSync(path.join(__dirname,'../app.js'),'utf8').replace(/^init\(\);/m,''),ctx);
let count=0;const outcomes=new Set(),rules=new Set();
for(const kind of Object.keys(lib.defaults))for(let digits=1;digits<=3;digits++)for(let variant=0;variant<=2;variant++)for(let signs=0;signs<=1;signs++)for(let seed=0;seed<100;seed++){
  const cfg={digits,variant,signedValues:signs,scientificRange:9,divisibilityRule:seed%10},op=lib.generate(kind,cfg,NinjaReasoning.rng(seed+311)),d=op.data;
  assert.deepEqual(op,lib.generate(kind,cfg,NinjaReasoning.rng(seed+311)));assert.ok(!/undefined|NaN|Infinity/.test(JSON.stringify(op)));assert.ok(op.answerDisplay.length<=32);assert.equal(ctx.isCorrectOperationAnswer(op.answerDisplay,op),true,kind);
  let n,den=1n;
  if(kind==='quadraticEquation'){
    const a=BigInt(d.a),b=BigInt(d.b),c=BigInt(d.c);assert.notEqual(a,0n);assert.equal(BigInt(d.delta),b*b-4n*a*c);assert.equal(BigInt(d.sqrt)**2n,BigInt(d.delta));
    for(const r of d.roots){const p=BigInt(r.numerator),q=BigInt(r.denominator);assert.equal(a*p*p+b*p*q+c*q*q,0n);if(!signs)assert.ok(p>0n);}
    assert.equal(d.delta==='0',variant===2);assert.equal(lib.correctRoots(op.answerDisplay.split(';').reverse().join(';'),op),true);
    const equivalent=d.roots.map(r=>`${BigInt(r.numerator)*2n}/${BigInt(r.denominator)*2n}`).join(';');assert.equal(lib.correctRoots(equivalent,op),true);
    for(const wrong of ['0','0;0','1/0;2','1;2;3','NaN;2'])assert.equal(lib.correctRoots(wrong,op),false);
    assert.ok(op.explanation.includes('x=(−b ± √Δ)/(2a)'));count++;continue;
  }
  if(kind==='linearEquation'){n=BigInt(d.x);assert.equal(d.variant===0?BigInt(d.a)*n+BigInt(d.b):d.variant===1?BigInt(d.a)*(n+BigInt(d.b)):(BigInt(d.a)-BigInt(d.d))*n+BigInt(d.b),BigInt(d.c));}
  if(kind==='algebraValue')n=d.variant===0?BigInt(d.a)*BigInt(d.x)+BigInt(d.b):d.variant===1?BigInt(d.a)*BigInt(d.x)**2n+BigInt(d.b)*BigInt(d.x)+BigInt(d.c):BigInt(d.a)*(BigInt(d.x)+BigInt(d.b))-BigInt(d.c);
  if(kind==='scientificNotation'){
    assert.ok(d.coefficient/d.scale>=1&&d.coefficient/d.scale<10);assert.ok(Math.abs(d.exponent)<=9);
    if(d.variant===0)n=BigInt(d.exponent);else{n=BigInt(d.coefficient);den=BigInt(d.scale);if(d.variant===2){if(d.exponent<0)den*=10n**BigInt(-d.exponent);else n*=10n**BigInt(d.exponent);}}
  }
  if(kind==='proportion')n=BigInt(d.inverse?d.b:d.b*d.k);
  if(kind==='scaleCalc')n=BigInt(d.toReal?d.real:d.drawing);
  if(kind==='divisibility'){n=d.n%d.divisor===0?1n:2n;outcomes.add(Number(n));rules.add(d.divisor);assert.equal(d.remainder,d.n%d.divisor);}
  if(kind==='pythagoras'){assert.equal(BigInt(d.a)**2n+BigInt(d.b)**2n,BigInt(d.c)**2n);n=BigInt(d.hypotenuse?d.c:d.b);}
  assert.equal(BigInt(op.answerFraction.numerator)*den,n*BigInt(op.answerFraction.denominator),kind);assert.equal(ctx.isCorrectOperationAnswer(`${n+den}/${den}`,op),false,kind);count++;
}
assert.equal(outcomes.size,2);assert.equal(rules.size,9);
let input='';for(const char of '-1/2;-0,5')input=lib.appendRoot(input,char);assert.equal(input,'-1/2;-0,5');assert.equal(lib.appendRoot(input,';'),null);assert.equal(lib.appendRoot('1/0',';'),null);
const controls=NinjaCalculationChallenges.controls();for(const key of Object.keys(lib.defaults)){assert.equal((controls.match(new RegExp('data-op="'+key+'"','g'))||[]).length,1);assert.equal(lib.defaults[key].digits,1);}
console.log(`OK: ${count} exact secondary calculations; polynomial substitution, formula/discriminant, two roots in either order, equivalent fractions, divisibility criteria, Pythagorean triples, scientific notation, scales and deterministic sequences.`);
