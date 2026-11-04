const assert = require('node:assert/strict');
require('../problemas.js'); require('../matematicas-extra.js'); require('../porcentajes.js'); require('../magnitudes.js');
const geometry = require('../geometria.js');
const expansion = require('../ampliacion.js');
const engine = global.NinjaProblems;
let count = 0;
for (let variant = 0; variant < 14; variant++) for (let digits = 1; digits <= 3; digits++) for (const decimals of [false, true]) for (const pi of ['3', '3,14']) {
  const cfg = engine.normalize({ _family: 'geometria', _geometryVariant: variant, _newDigits: digits, _geometryDecimals: decimals, _geometryPi: pi });
  const possible = geometry.compatible(variant, cfg);
  assert.equal(engine.compatible(cfg).length, possible ? 10 : 0);
  if (!possible) continue;
  for (let i = 0; i < 100; i++) {
    let seed = i + 1;
    const rng = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
    const built = geometry.build({variant, context: 'La clase'}, cfg, rng);
    const {a,b,c} = built.measurements;
    const p = pi === '3' ? 3n : 314n, scale = pi === '3' ? 1n : 100n;
    const x = BigInt(a), y = BigInt(b), z = BigInt(c);
    const numerators = [4n*x,x*x,2n*(x+y),x*y,x+y+z,x*y,2n*p*x,p*x*x,2n*(x+y),x*y,4n*x,x*y,x+y+2n*z,(x+y)*z];
    const denominator = [5,11,13].includes(variant) ? 2n : [6,7].includes(variant) ? scale : 1n;
    assert.equal(BigInt(built.result.numerator)*denominator,numerators[variant]*BigInt(built.result.denominator));
    if (!decimals) assert.equal(BigInt(built.result.denominator),1n);
    for (const n of variant < 2 || [6,7,10].includes(variant) ? [a] : [a,b]) assert.equal(String(n).length,digits);
    if (variant === 4) assert.ok(a+b>c && a+c>b && b+c>a);
    if (variant === 12) assert.ok(a>b && 2*c>a-b);
    if (variant === 13) assert.ok(a>b && c>0);
    assert.ok(built.diagram.includes('no a escala'));
    assert.equal(built.steps.length,built.calculations.length);
    assert.ok(!/undefined|NaN|Infinity|\ufffd/.test(JSON.stringify(built)));
    count++;
  }
}
for (let v=0;v<14;v++) {
  const cfg=engine.normalize({_family:'geometria',_geometryVariant:v});
  for(let i=0;i<10;i++) {
    const op=engine.generate(cfg,i,912);
    assert.deepEqual(op,engine.generate(cfg,i,912));
    assert.equal(op.problem.calculations.length,2);
    assert.ok(op.problem.diagram.includes('<svg'));
  }
}
assert.equal(expansion.bank.filter(t=>t.family==='geometria').length,140);
console.log(`OK: ${count} geometric problems, 14 structures, exact independent answers, integer restrictions, valid dimensions, SVG and seeded online generation.`);
