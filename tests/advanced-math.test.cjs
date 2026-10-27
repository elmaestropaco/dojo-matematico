const assert = require('node:assert/strict');
require('../banco-problemas/datos.js');
require('../banco-problemas/ampliado-datos.js');
const engine = require('../problemas.js');
const math = require('../matematicas-extra.js');
const bank = globalThis.NinjaAdvancedProblemBank.plantillas;
assert.equal(bank.length, 720);
assert.equal(new Set(bank.map(t => t.id)).size, 720);
const cats = ['suma', 'resta', 'multiplicacion', 'division'];
const refGcd = (a, b) => { while (b) [a, b] = [b, a % b]; return a; };
let generated = 0;
for (const family of ['fracciones', 'mcmMcd']) {
  const keys = family === 'fracciones' ? cats : ['mcm', 'mcd'];
  for (let mask = 1; mask < 2 ** keys.length; mask++) {
    const selected = keys.filter((_, i) => mask & (1 << i));
    const settings = { ...Object.fromEntries(cats.map(k => [k, { enabled: selected.includes(k), difficulty: 'todas' }])), _family: family, _mcmEnabled: selected.includes('mcm'), _mcdEnabled: selected.includes('mcd') };
    const mix = selected.length > 1 ? 'combinados' : 'individuales';
    const pool = engine.compatible(settings, { mix });
    assert.equal(pool.length, 40);
    assert.equal(new Set(Array.from({ length: 40 }, (_, i) => engine.generate(settings, i, 101, { mix }).problem.templateId)).size, 40);
    assert.equal(engine.compatible(settings, { mix: 'mixto' }).length, selected.length > 1 ? (selected.length + 1) * 40 : 40);
    for (const first of [1, 2, 3]) for (const second of [1, 2, 3]) for (let i = 0; i < 40; i++) {
      const cfg = { ...settings, _fractionNumerator: first, _fractionDenominator: second, _theoryDigits: first, _theoryCount: second + 1 };
      const op = engine.generate(cfg, i, 123, { mix });
      assert.deepEqual(op, engine.generate(cfg, i, 123, { mix }));
      assert.deepEqual([...op.problem.categories].sort(), [...selected].sort());
      assert.ok(op.problem.steps.length === op.problem.calculations.length);
      assert.ok(!/[{}]|undefined|NaN|Infinity/.test(op.problem.text));
      if (family === 'fracciones') {
        const template = bank.find(t => t.id === op.problem.templateId);
        let n = BigInt(op.problem.values[0].numerator), d = BigInt(op.problem.values[0].denominator);
        for (const f of op.problem.values) { assert.equal(f.numerator.length, first); assert.equal(f.denominator.length, second); }
        template.order.forEach((key, index) => {
          const b = op.problem.values[index + 1], m = BigInt(b.numerator), e = BigInt(b.denominator);
          if (key === 'suma') { n = n * e + m * d; d *= e; }
          if (key === 'resta') { n = n * e - m * d; d *= e; }
          if (key === 'multiplicacion') { n *= m; d *= e; }
          if (key === 'division') { n *= e; d *= m; }
          const g = refGcd(n, d); n /= g; d /= g;
          assert.ok(n >= 0n);
        });
        assert.equal(n, BigInt(op.answerFraction.numerator)); assert.equal(d, BigInt(op.answerFraction.denominator));
      } else {
        assert.ok(!op.problem.text.includes('respectivamente'), 'Every datum must have an explicit referent and unit');
        for (const ordinal of ['primera','segunda','tercera','cuarta'].slice(0,cfg._theoryCount)) assert.ok(op.problem.text.includes(ordinal));
        const values = op.problem.values.map(BigInt), count = cfg._theoryCount;
        for (const value of values) assert.equal(String(value).length, first);
        assert.equal(new Set(values.slice(0, count)).size, count);
        const lcm = values.slice(0, count).reduce((a,b) => a / refGcd(a,b) * b);
        const expected = selected.length > 1 ? [lcm, ...values.slice(count)].reduce(refGcd) : selected[0] === 'mcm' ? lcm : values.reduce(refGcd);
        assert.equal(String(expected), op.answerExact);
      }
      generated++;
    }
  }
}
for (const digits of [1,2,3]) for (const count of [2,3,4]) for (const kind of ['mcm','mcd']) for (let i=0;i<100;i++) {
  const op = math.generateNumberTheory(kind, { digits, count });
  assert.equal(new Set(op.values).size, count);
  assert.ok(op.values.every(n => String(n).length === digits));
  const values = op.values.map(BigInt), expected = values.reduce(kind === 'mcm' ? (a,b)=>a/refGcd(a,b)*b : refGcd);
  assert.equal(op.answerExact, String(expected));
}
console.log(`OK: ${generated} fraction/theory stories, 1800 MCM/MCD calculations, exact reference arithmetic, all digit/count combinations and deterministic sequences.`);
