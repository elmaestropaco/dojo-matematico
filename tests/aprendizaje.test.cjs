const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
for (const file of ['datos', 'ampliado-datos', 'porcentajes-datos', 'medidas-datos', 'aprendizaje-datos']) require(`../banco-problemas/${file}.js`);
const engine = require('../problemas.js'); require('../matematicas-extra.js'); require('../porcentajes.js'); require('../magnitudes.js');
const expansion = require('../ampliacion.js');
let storage = {};
global.localStorage = { getItem: k => storage[k] ?? null, setItem: (k, v) => { storage[k] = v; }, removeItem: k => { delete storage[k]; } };
const learning = require('../seguimiento.js');
const ctx = vm.createContext({ document: { body: {}, getElementById: () => null }, console });
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8').replace(/^init\(\);/m, ''), ctx);
const rng = seed => { let s = seed; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; };
let calculations = 0, problems = 0;
function fractionOf(text) { const parts = String(text).split(','); return { n: BigInt(parts.join('')), d: 10n ** BigInt(parts[1]?.length || 0) }; }
for (const kind of ['missing', 'compare', 'power', 'round']) for (let i = 0; i < 1500; i++) {
  const cfg = { digits: i % 3 + 1, variant: i % 3, operator: i % 5, exponentMax: i % 4 + 2, place: i % 7 - 3 };
  const op = expansion.newCalculation(kind, cfg, rng(i + 456));
  assert.deepEqual(op, expansion.newCalculation(kind, cfg, rng(i + 456)));
  assert.ok(!/undefined|NaN|Infinity/.test(JSON.stringify(op)));
  const answer = op.answerSymbol || op.answerDisplay;
  assert.equal(ctx.isCorrectOperationAnswer(answer, op), true);
  if (kind === 'compare') {
    const numeric = text => { const m = text.match(/^(\d+)(?:\/(\d+))?(?: (m|cm))?$/); return { n: BigInt(m[1]) * (m[3] === 'm' ? 100n : 1n), d: BigInt(m[2] || 1) }; };
    const a = numeric(op.comparison.left), b = numeric(op.comparison.right), n = a.n * b.d, m = b.n * a.d;
    assert.equal(op.answerSymbol, n < m ? '<' : n > m ? '>' : '=');
    assert.ok(!ctx.decorateOperation(op).html.includes('= ?'));
  } else {
    assert.equal(ctx.isCorrectOperationAnswer(`${BigInt(op.answerFraction.numerator) + BigInt(op.answerFraction.denominator)}/${op.answerFraction.denominator}`, op), false);
    if (kind === 'missing') {
      const equation = op.expression.replace('□', answer).match(/^(\d+) ([+−×÷]) (\d+) = (\d+)$/);
      const [, left, symbol, right, result] = equation, a = BigInt(left), b = BigInt(right);
      assert.equal(symbol === '+' ? a + b : symbol === '−' ? a - b : symbol === '×' ? a * b : a / b, BigInt(result));
      assert.ok(!ctx.decorateOperation(op).html.endsWith('= ?'));
    }
    if (kind === 'power') { const [a, e] = op.expression.split('^').map(BigInt); assert.equal(BigInt(answer), a ** e); }
    if (kind === 'round') {
      if (cfg.place < 0) assert.equal(op.answerDisplay.split(',')[1].length, -cfg.place);
      const source = fractionOf(op.expression.match(/^Redondea ([\d,]+)/)[1]);
      const exponent = cfg.place, scaled = exponent >= 0 ? 10n ** BigInt(exponent) : 1n;
      const targetD = exponent < 0 ? 10n ** BigInt(-exponent) : 1n;
      const numerator = source.n * targetD, divisor = source.d * scaled;
      const rounded = (numerator * 2n + divisor) / (divisor * 2n) * scaled;
      const out = fractionOf(answer);
      assert.equal(out.n * targetD, rounded * out.d);
    }
  }
  assert.ok(ctx.operationSolutionHtml(op).includes('teaching-explanation'));
  calculations++;
}
for (const variant of [0, 1, 2]) {
  const signs = new Set(Array.from({ length: 300 }, (_, i) => expansion.newCalculation('compare', { variant, digits: 2 }, rng(i * 777 + 1)).answerSymbol));
  assert.deepEqual([...signs].sort(), ['<', '=', '>'].sort());
}
assert.equal(expansion.bank.length, 260);
const allIds = [global.NinjaProblemBank, global.NinjaAdvancedProblemBank, global.NinjaPercentageProblemBank, global.NinjaMeasureProblemBank, global.NinjaLearningProblemBank].flatMap(b => b.plantillas.map(t => t.id));
assert.equal(allIds.length, 1900); assert.equal(new Set(allIds).size, 1900);
for (const family of Object.keys(expansion.families)) for (const digits of [1, 2, 3]) for (const decimals of [false, true]) {
  const cfg = { _family: family, _newDigits: digits, _newDecimals: decimals };
  const count = family === 'geometria' ? 140 : 40;
  assert.equal(engine.compatible(cfg).length, count);
  const seen = new Set();
  for (let i = 0; i < count; i++) {
    const op = engine.generate(cfg, i, 123);
    seen.add(op.problem.templateId);
    assert.deepEqual(op, engine.generate(cfg, i, 123));
    assert.ok(!/undefined|NaN|Infinity|\{\w+\}/.test(op.problem.text));
    assert.equal(ctx.isCorrectOperationAnswer(op.answerDisplay, op), true);
    const html = ctx.renderProblem(op);
    assert.ok(html.includes('Lee y resuelve'));
    assert.ok(!/Sumas|Restas|Multiplicaciones|Combinado ·/.test(html));
    assert.ok(ctx.renderProblem({ ...op, solutionRevealed: true }).includes('problem-review-reading'));
    const t = expansion.bank.find(t => t.id === op.problem.templateId);
    if (family === 'geometria' && t.variant < 4) {
      assert.ok(op.problem.diagram.includes('<svg'));
      const numbers = op.problem.text.match(/\d+/g).map(BigInt);
      const a = numbers[0], b = t.variant < 2 ? a : numbers[1];
      assert.equal(BigInt(op.answerDisplay), t.variant % 2 ? a * b : 2n * (a + b));
      const dimensions = op.problem.diagram.match(/<rect[^>]+width="([\d.]+)" height="([\d.]+)"/);
      assert.equal(Math.sign(Number(dimensions[1]) - Number(dimensions[2])), a < b ? -1 : a > b ? 1 : 0);
    }
    if (family === 'razonamiento' && t.variant === 2) {
      assert.ok(op.followUp && op.followUp.problem.text.includes('Segunda pregunta'));
      assert.equal(ctx.isCorrectOperationAnswer(op.followUp.answerDisplay, op.followUp), true);
    }
    if (family === 'compras' && !decimals) assert.ok(!op.answerDisplay.includes(','));
    if (family === 'compras') {
      const values = op.problem.text.match(/\d+(?:,\d+)?/g).map(fractionOf), cents = value => value.n * 100n / value.d;
      const expected = t.variant === 0 ? values[0].n * cents(values[1]) : t.variant === 1 ? cents(values[1]) - cents(values[0]) : t.variant === 2 ? values[0].n * (cents(values[1]) - cents(values[2])) : cents(values[0]) - values[1].n * cents(values[2]);
      assert.equal(BigInt(op.answerFraction.numerator) * 100n, expected * BigInt(op.answerFraction.denominator));
    }
    if (family === 'proporcionalidad') {
      const values = op.problem.text.match(/\d+/g).map(BigInt);
      const expected = t.variant === 0 || t.variant === 1 ? values[1] / values[0] * values[2] : t.variant === 2 ? values[0] * values[1] : values[0] / values[1] * values[2];
      assert.equal(BigInt(op.answerDisplay), expected);
    }
    problems++;
  }
  assert.equal(seen.size, count);
}
for (const family of ['razonamiento', 'geometria']) for (let variant = 0; variant < 4; variant++) assert.equal(engine.compatible({ _family: family, [family === 'razonamiento' ? '_reasonVariant' : '_geometryVariant']: variant }).length, 10);
const player = { learningStats: {} }, operation = { kind: 'round' };
learning.record(player, operation, 'wrong'); learning.record(player, operation, 'hint'); operation.hintStage = 1; learning.record(player, operation, 'correct');
assert.equal(player.learningStats.round.assistedCorrect, 1);
const config = { activity: 'calculo', enabledKeys: ['round'] };
const room = { seed: 123, startedAt: 1700000000000, mode: 'teacher', status: 'finished', players: { p1: { name: '=Paco 🥷<script>', correctCount: 3, wrongCount: 1, score: 30, learningStats: player.learningStats } } };
learning.capture('123456', room, config); learning.capture('123456', room, config);
assert.equal(learning.read().length, 1);
learning.capture('123456', { ...room, players: { p1: { ...room.players.p1, correctCount: 0, wrongCount: 0, score: 0 } } }, config);
assert.equal(learning.aggregate()[0].score, 30, 'A stale zero update must not erase final statistics');
learning.capture('654321', { ...room, seed: 456, players: { p1: { ...room.players.p1, correctCount: 2, wrongCount: 1, score: 20 } } }, { activity: 'problemas', problemSettings: { _family: 'compras' } });
const summary = learning.aggregate();
assert.equal(summary.length, 1); assert.equal(summary[0].rounds, 2); assert.equal(summary[0].correct, 5); assert.equal(summary[0].wrong, 2);
const workbook = learning.workbook(), html = learning.printHtml();
assert.ok(workbook instanceof Uint8Array && workbook[0] === 0x50 && workbook[1] === 0x4b);
assert.ok(html.includes('&lt;script&gt;') && !html.includes('=Paco 🥷<script>'));
assert.equal(learning.sheets().length, 3);
const setter = global.localStorage.setItem; global.localStorage.setItem = () => { throw Error('Quota exceeded'); };
assert.equal(learning.capture('654322', { ...room, seed: 999 }, config), false);
assert.equal(learning.read().length, 3, 'Quota failures must retain an exportable in-memory round');
global.localStorage.setItem = setter;
const out = path.join(require('node:os').tmpdir(), 'dojo-test-seguimiento.xlsx'); fs.writeFileSync(out, workbook);
learning.clear(); assert.equal(learning.read().length, 0);
learning.capture('123456', room, config); assert.equal(learning.read().length, 0, 'Clearing must survive late updates from old rounds');
storage.ninja_math_learning_rounds_v1 = '[null,{},1]'; assert.equal(learning.read().length, 0);
console.log(`OK: ${calculations} new calculations, ${problems} problems, linked questions, geometry, signs, exact rounding, reports across rooms, stale-round protection and XLSX export. Workbook: ${out}`);
