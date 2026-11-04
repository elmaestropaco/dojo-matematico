const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
require('../banco-problemas/datos.js');
require('../banco-problemas/ampliado-datos.js');
require('../banco-problemas/porcentajes-datos.js');
const engine = require('../problemas.js');
require('../matematicas-extra.js');
require('../porcentajes.js');

const types = ['parte', 'descuento', 'aumento', 'relacion'];
const operations = ['suma', 'resta', 'multiplicacion', 'division'];
const bank = globalThis.NinjaPercentageProblemBank.plantillas;
assert.equal(bank.length, 160);
assert.equal(new Set(bank.map(t => t.id)).size, 160);
assert.equal(new Set(bank.map(t => t.scene.key)).size, 40);
for (const type of types) assert.equal(bank.filter(t => t.type === type).length, 40);

const context = vm.createContext({ document: { body: {}, getElementById: () => null }, console });
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8').replace(/^init\(\);/m, ''), context);
const allSeen = new Set();
let generated = 0;
const parse = text => {
  const [whole, tail = ''] = String(text).split(',');
  return [BigInt(whole + tail), 10n ** BigInt(tail.length)];
};
for (const basic of [true, false]) for (const places of [0, 1, 2]) for (let digits = 1; digits <= 9; digits++) {
  for (let mask = 0; mask < 16; mask++) {
    const selected = operations.filter((_, i) => mask & (1 << i));
    const cfg = { _family: 'porcentajes', _percentageMinDigits: digits, _percentageMaxDigits: digits,
      _percentageBasic: basic, _percentageDecimals: places > 0, _percentagePlaces: places || 2,
      ...Object.fromEntries(operations.map(op => [`_percentage_${op}`, selected.includes(op)])) };
    const mix = mask ? 'combinados' : 'individuales';
    assert.equal(engine.compatible(cfg, { mix }).length, 160);
    assert.equal(engine.compatible(cfg, { mix: 'mixto' }).length, mask ? 320 : 160);
    const seed = 1000 + digits * 991 + mask * 13 + places * 777 + (basic ? 10000 : 0);
    for (let i = 0; i < 16; i++) {
      const op = engine.generate(cfg, i, seed, { mix });
      assert.deepEqual(op, engine.generate(cfg, i, seed, { mix }));
      const p = op.problem, v = p.values;
      allSeen.add(p.templateId.split('-multiplicacion')[0].split('-suma')[0].split('-resta')[0].split('-division')[0]);
      assert.equal(v.initial.length, digits);
      assert.ok(p.categories.includes(p.category));
      assert.deepEqual(p.categories.filter(k => operations.includes(k)).sort(), [...selected].sort());
      assert.equal(p.steps.length, p.calculations.length);
      assert.ok(p.text.includes('?') && p.compactText.includes('?'));
      assert.ok(!/[{}]|undefined|NaN|Infinity|Cuántos hojas/.test(p.text + p.steps.join(' ')));
      assert.ok(!/(?<![\d,])1 euros\b/.test(p.text), p.text);
      assert.ok(op.answer >= 0);
      assert.ok(op.answerDisplay.split(',')[1]?.length <= places || !op.answerDisplay.includes(','));
      assert.ok(v.part.split(',')[1]?.length <= places || !v.part.includes(','));
      if (basic) assert.ok([10, 20, 25, 50, 75, 100].includes(v.percent));
      else assert.ok(v.percent >= 1 && v.percent <= 100);
      let total = BigInt(v.initial);
      for (let j = 0; j < selected.length; j++) {
        const equation = p.calculations[j].match(/^(\d+) ([+−×÷]) (\d+) = (\d+)$/);
        assert.ok(equation, p.calculations[j]);
        const [, a, symbol, b, result] = equation;
        assert.equal(BigInt(a), total);
        const operand = BigInt(b);
        if (symbol === '+') total += operand;
        if (symbol === '−') total -= operand;
        if (symbol === '×') total *= operand;
        if (symbol === '÷') { assert.equal(total % operand, 0n); total /= operand; }
        assert.equal(BigInt(result), total);
      }
      assert.equal(total, BigInt(v.total));
      const part = total * BigInt(v.percent), [partN, partD] = parse(v.part);
      assert.equal(partN * 100n, part * partD);
      const expectedN = p.category === 'parte' ? part : p.category === 'descuento' ? total * 100n - part : p.category === 'aumento' ? total * 100n + part : BigInt(v.percent) * 100n;
      assert.equal(BigInt(op.answerFraction.numerator) * 100n, expectedN * BigInt(op.answerFraction.denominator));
      assert.equal(context.isCorrectOperationAnswer(op.answerDisplay, op), true);
      assert.equal(context.isCorrectOperationAnswer(op.answerDisplay.replace(',', '.'), op), true);
      assert.equal(context.isCorrectOperationAnswer(`${op.answerFraction.numerator}/${op.answerFraction.denominator}`, op), true);
      assert.equal(context.isCorrectOperationAnswer(String(op.answer + 0.0001), op), false);
      const html = context.renderProblem({ ...op, solutionRevealed: true });
      assert.ok(html.includes('problem-review-reading') && html.includes('problem-final'));
      assert.ok(html.includes(`>${op.answerDisplay} ${p.unit}</strong>`));
      generated++;
    }
  }
}
for (const type of types) {
  const cfg = { _family: 'porcentajes', ...Object.fromEntries(types.map(k => [`_percentage_${k}`, k === type])) };
  assert.equal(engine.compatible(cfg).length, 40);
  const ids = new Set(Array.from({ length: 40 }, (_, i) => engine.generate(cfg, i, 101).problem.templateId));
  assert.equal(ids.size, 40);
}
assert.equal(engine.compatible({ _family: 'porcentajes' }, { mix: 'combinados' }).length, 0);
assert.equal(engine.compatible({ _family: 'porcentajes', ...Object.fromEntries(types.map(k => [`_percentage_${k}`, false])) }).length, 0);
assert.throws(() => engine.generate({ _family: 'porcentajes' }, 0, 1, { mix: 'combinados' }));
assert.equal(allSeen.size, 160);
for (const family of ['enteros', 'fracciones', 'mcmMcd']) {
  assert.equal(engine.normalize({ _family: family })._family, family);
  assert.ok(engine.generate({ _family: family }, 0, 1).problem);
}
const ranged = { _family: 'porcentajes', _percentageMinDigits: 1, _percentageMaxDigits: 9 };
for (let i = 0; i < 50; i++) assert.ok(engine.generate(ranged, i, 45).problem.values.initial.length <= 9);
assert.equal(engine.normalize({ _percentagePlaces: 3 })._percentagePlaces, 2);
console.log(`OK: ${generated} exact percentage problems, all 160 templates, four types, 15 arithmetic combinations, 1-9 digits, decimal limits, answer validation and existing families.`);
