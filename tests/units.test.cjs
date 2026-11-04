const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
for (const file of ['datos', 'ampliado-datos', 'porcentajes-datos', 'medidas-datos']) require(`../banco-problemas/${file}.js`);
const engine = require('../problemas.js');
require('../matematicas-extra.js');
require('../porcentajes.js');
const api = require('../magnitudes.js');
const bank = globalThis.NinjaMeasureProblemBank.plantillas;
const kinds = Object.keys(api.units), operations = ['suma', 'resta', 'multiplicacion', 'division'];
const context = vm.createContext({ document: { body: {}, getElementById: () => null }, console });
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8').replace(/^init\(\);/m, '') + '\nglobalThis.testState=state;', context);
context.NinjaUnits = api;
assert.equal(bank.length, 160);
assert.equal(new Set(bank.map(t => t.id)).size, 160);
for (const kind of kinds) assert.equal(bank.filter(t => t.type === kind).length, 40);
const refFactors = {
  longitud: { km: 1000000n, hm: 100000n, dam: 10000n, m: 1000n, dm: 100n, cm: 10n, mm: 1n },
  masa: { kg: 1000000n, hg: 100000n, dag: 10000n, g: 1000n, dg: 100n, cg: 10n, mg: 1n },
  capacidad: { kL: 1000000n, hL: 100000n, daL: 10000n, L: 1000n, dL: 100n, cL: 10n, mL: 1n },
  tiempo: { sem: 604800n, d: 86400n, h: 3600n, min: 60n, s: 1n }
};
function parse(text) {
  const [whole, tail = ''] = String(text).split(',');
  return { n: BigInt(whole + tail), d: 10n ** BigInt(tail.length) };
}
function refGcd(a, b) { while (b) [a, b] = [b, a % b]; return a; }
function random(seed) { let s = seed; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }
let calculations = 0, problems = 0;
for (const kind of kinds) {
  for (let digits = 1; digits <= 9; digits++) for (let places = 0; places <= 3; places++) {
    for (let from = 1; from <= api.units[kind].length; from++) for (let to = 1; to <= api.units[kind].length; to++) {
      const cfg = { digits, from, to }, pool = api.pairs(kind, cfg, places);
      if (from === to) { assert.equal(pool.length, 0); continue; }
      const source = api.units[kind][from - 1], target = api.units[kind][to - 1];
      const sourceFactor = refFactors[kind][source.symbol], targetFactor = refFactors[kind][target.symbol];
      const needed = targetFactor / refGcd(sourceFactor * 10n ** BigInt(places), targetFactor);
      const min = 10n ** BigInt(digits - 1), max = 10n ** BigInt(digits) - 1n;
      const possible = (min + needed - 1n) / needed * needed <= max;
      assert.equal(pool.length > 0, possible);
      if (!possible) { assert.throws(() => api.generateConversion(kind, cfg, places)); continue; }
      const op = api.generateConversion(kind, cfg, places, random(120 + from * 11 + to));
      const initial = BigInt(op.conversion.initial), f = op.answerFraction;
      assert.equal(String(initial).length, digits);
      assert.equal(BigInt(f.numerator) * targetFactor, initial * sourceFactor * BigInt(f.denominator));
      assert.ok(api.fits(f, places));
      assert.equal(context.isCorrectOperationAnswer(op.answerDisplay, op), true);
      assert.equal(context.isCorrectOperationAnswer(op.answerDisplay.replace(',', '.'), op), true);
      assert.equal(context.isCorrectOperationAnswer(op.answerDisplay + '1', op), false);
      const decorated = context.decorateOperation(op);
      assert.ok(decorated.html.includes(source.symbol) && decorated.html.includes(target.symbol));
      const solution = context.operationSolutionHtml(op);
      assert.ok(solution.includes(op.answerDisplay) && solution.includes(op.conversion.equivalence));
      assert.deepEqual(api.convert(api.convert(api.rational(initial), source, target), target, source), api.rational(initial));
      calculations++;
    }
  }
}
const examples = [
  ['masa', 'kg', 'g', 2, '2000'], ['longitud', 'cm', 'm', 75, '0,75'], ['capacidad', 'L', 'mL', 3, '3000'],
  ['tiempo', 'h', 'min', 2, '120'], ['tiempo', 'd', 'h', 2, '48'], ['tiempo', 'sem', 'd', 2, '14'], ['tiempo', 's', 'min', 3, '0,05']
];
for (const [kind, from, to, initial, result] of examples) {
  const source = api.units[kind].find(u => u.symbol === from), target = api.units[kind].find(u => u.symbol === to);
  assert.equal(api.decimal(api.convert(api.rational(BigInt(initial)), source, target)), result);
}
assert.throws(() => api.decimal(api.rational(1n, 60n)));
const seen = new Set();
for (const kind of kinds) for (let mask = 0; mask < 16; mask++) for (const places of [0, 1, 2, 3]) for (const digits of [1, 2, 3, 9]) {
  const selected = operations.filter((_, i) => mask & (1 << i));
  const cfg = { _family: 'medidas', _measureMinDigits: digits, _measureMaxDigits: digits, _measureDecimals: places > 0, _measurePlaces: places || 2,
    ...Object.fromEntries(kinds.map(k => [`_measure_${k}`, k === kind])),
    ...Object.fromEntries(operations.map(k => [`_measure_${k}`, selected.includes(k)])) };
  const mix = mask ? 'combinados' : 'individuales';
  assert.equal(engine.compatible(cfg, { mix }).length, 40);
  assert.equal(engine.compatible(cfg, { mix: 'mixto' }).length, mask ? 80 : 40);
  const seed = 123 + digits * 99 + places * 777 + mask * 13;
  for (let i = 0; i < 8; i++) {
    const op = engine.generate(cfg, i, seed, { mix }), p = op.problem, v = p.values;
    assert.deepEqual(op, engine.generate(cfg, i, seed, { mix }));
    seen.add(p.templateId.split('-suma')[0].split('-resta')[0].split('-multiplicacion')[0].split('-division')[0]);
    assert.equal(v.initial.length, digits);
    assert.deepEqual(p.categories, [kind, ...selected]);
    assert.equal(p.steps.length, p.calculations.length);
    assert.ok(!/[{}]|undefined|NaN|Infinity/.test(p.text + p.compactText + p.steps.join('')));
    assert.ok(!/(?<![\d,])1 (metros|gramos|litros|horas|minutos|segundos|semanas|días)\b/.test(p.text));
    let n = BigInt(v.initial) * refFactors[kind][v.from], d = refFactors[kind][v.to];
    for (const operand of v.operands) {
      const b = parse(operand.value);
      if (operand.operation === 'suma') { n = n * b.d + b.n * d; d *= b.d; }
      if (operand.operation === 'resta') { n = n * b.d - b.n * d; d *= b.d; }
      if (operand.operation === 'multiplicacion') { n *= b.n; d *= b.d; }
      if (operand.operation === 'division') { n *= b.d; d *= b.n; }
      assert.ok(n >= 0n);
      assert.equal(n * 10n ** BigInt(places) % d, 0n);
    }
    assert.equal(BigInt(op.answerFraction.numerator) * d, n * BigInt(op.answerFraction.denominator));
    assert.ok(api.fits(op.answerFraction, places));
    assert.equal(context.isCorrectOperationAnswer(op.answerDisplay, op), true);
    const html = context.renderProblem({ ...op, solutionRevealed: true });
    assert.ok(html.includes(`>${op.answerDisplay} ${p.unit}</strong>`));
    problems++;
  }
}
assert.equal(seen.size, 160);
assert.equal(engine.compatible({ _family: 'medidas' }, { mix: 'combinados' }).length, 0);
assert.equal(engine.compatible({ _family: 'medidas', _measure_longitudFrom: 4, _measure_longitudTo: 4 }).length, 0);
for (const kind of kinds) {
  const cfg = { _family: 'medidas', ...Object.fromEntries(kinds.map(k => [`_measure_${k}`, k === kind])) };
  assert.equal(new Set(Array.from({ length: 40 }, (_, i) => engine.generate(cfg, i, 321).problem.templateId)).size, 40);
}
for (const key of Object.keys(api.kinds)) {
  context.testState.operationSettings[key] = { enabled: true, digits: 2, from: 0, to: 0 };
  const op = context.createOperation(key);
  assert.equal(op.kind, key);
  assert.ok(context.isCorrectOperationAnswer(op.answerDisplay, op));
}
for (const family of ['enteros', 'fracciones', 'mcmMcd', 'porcentajes']) assert.ok(engine.generate({ _family: family }, 0, 1).problem);
console.log(`OK: ${calculations} exact unit conversions, ${problems} measure problems, all 160 templates, 15 arithmetic combinations, 1-9 digits, 0-3 decimals and previous families.`);
