const assert=require('node:assert/strict');require('../problemas.js');require('../matematicas-extra.js');const sheets=require('../fichas-pdf.js');
for(let seed=0;seed<100;seed++){
 const keys=['calc:addNoCarry','calc:mul','problem:suma'],plan=sheets.plan(keys,7,'balanced',sheets.random(seed));assert.equal(plan.length,21);keys.forEach(k=>assert.equal(plan.filter(v=>v===k).length,7));assert.deepEqual(plan,sheets.plan(keys,7,'balanced',sheets.random(seed)));
 const mixed=sheets.plan(keys,17,'mixed',sheets.random(seed));assert.equal(mixed.length,17);mixed.forEach(k=>assert.ok(keys.includes(k)));
}
for(const args of [[[],1,'balanced'],[['a'],0,'mixed'],[['a'],1.5,'mixed'],[['a','b'],101,'balanced'],[['a'],201,'mixed']])assert.throws(()=>sheets.plan(...args));
for(const [expression,n,d]of [['999999999 * 999999999','999999998000000001','1'],['1,3 * 1,4','91','50'],['(1/2) / (3/4)','2','3'],['-(5+3) * -2','16','1'],['324-178','146','1'],['8 * 5 / 100','2','5']]){const result=sheets.evaluate(expression);assert.equal(result.answer.numerator,n);assert.equal(result.answer.denominator,d);assert.ok(result.steps.length);}
for(const expression of ['1/0','globalThis.alert(1)','1;2','NaN','1e99','(1+2','2**3'])assert.throws(()=>sheets.evaluate(expression));
assert.equal(sheets.decimal(sheets.numeric('-0,125')),'-0,125');assert.equal(sheets.decimal({numerator:'1',denominator:'3'}),'1/3');
let cases=0;
for(let a=0;a<80;a++)for(let b=0;b<40;b++)for(const kind of ['add','sub','mul','div']){if(kind==='div'&&!b)continue;const result=sheets.arithmetic({kind,a,b});const expected=kind==='add'?NinjaMathExtra.fraction(a+b):kind==='sub'?NinjaMathExtra.fraction(a-b):kind==='mul'?NinjaMathExtra.fraction(BigInt(a)*BigInt(b)):NinjaMathExtra.fraction(a,b);assert.deepEqual(result.answer,expected);assert.ok(result.steps.length);cases++;}
const big=sheets.arithmetic({kind:'mul',a:999999999,b:999999999});assert.equal(big.answer.numerator,'999999998000000001');assert.ok(big.steps.some(s=>s.includes('999999998000000001')));
const fractions=sheets.arithmetic({kind:'fractionDiv',expression:'1/2 / 3/4',operands:[{},{}]});assert.deepEqual(fractions.answer,{numerator:'2',denominator:'3'});
const items=[{number:1,problem:false,questionHtml:'12 + 9 = ?',solutionHtml:'21'},{number:2,problem:true,questionHtml:'¿Cuántos quedan?',solutionHtml:'42'}];
const html=sheets.documentHtml(items,{title:'</title><script>alert(1)</script>',columns:3,solutions:true});assert.ok(html.includes('&lt;script&gt;'));assert.ok(!html.includes('<script>alert'));assert.ok(html.indexOf('class="paper solutions"')>html.indexOf('class="questions"'));assert.ok(html.includes('break-before:page'));assert.ok(html.includes('size:A4'));assert.ok(html.includes('2. Solución'));
assert.ok(!sheets.documentHtml(items,{solutions:false}).includes('class="paper solutions"'));assert.throws(()=>sheets.documentHtml([]));
const sorted=sheets.ordered([{groupOrder:1,typeOrder:0,key:'integer'},{groupOrder:0,typeOrder:2,key:'mul'},{groupOrder:0,typeOrder:1,key:'add'}]);assert.deepEqual(sorted.map(i=>i.key),['add','mul','integer']);assert.deepEqual(sorted.map(i=>i.number),[1,2,3]);
assert.ok(html.includes('</section></main><main class="paper solutions">'));assert.ok(html.includes('data-max-columns="3"'));
console.log(`OK: ${cases} exact basic calculations, large products, fractions, decimal arithmetic, carry/borrow steps, balanced/random distribution, bounded sheets, safe titles and separate final solutions.`);
