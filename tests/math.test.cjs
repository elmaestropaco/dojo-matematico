const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const context = vm.createContext({
  document: { body: {}, getElementById: () => null },
  console
});
vm.runInContext(source.replace(/^init\(\);/m, '') + '\nglobalThis.gameState = state;', context);
const state = context.gameState;
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'problemas.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'matematicas-extra.js'), 'utf8'), context);
const fraction = (n, d) => ({ numerator: String(n), denominator: String(d) });
const teachingProblem = { answerExact: '5', solutionRevealed: true, problem: {
  title: 'Lectura y explicacion', text: 'Hay 2 libros y llegan 3. Cuantos hay?', compactText: 'Hay 2 libros y llegan 3. Cuantos hay?',
  categories: ['suma'], category: 'suma', difficulty: 'facil', steps: ['Sumamos: 2 + 3 = 5.'], calculations: ['2 + 3 = 5'], unit: 'libros'
} };
const teachingHtml = context.renderProblem(teachingProblem);
assert.ok(teachingHtml.includes(teachingProblem.problem.text));
assert.ok(teachingHtml.includes('problem-review-reading') && teachingHtml.includes('problem-steps'));
assert.ok(teachingHtml.includes('2 + 3 = 5'));

for (const [operator, expected] of [['+', '5/6'], ['-', '1/6'], ['x', '1/6'], ['/', '3/2']]) {
  const result = context.calculateFraction(fraction(1, 2), operator, fraction(1, 3));
  assert.equal(`${result.numerator}/${result.denominator}`, expected);
}
assert.equal(context.simplifyFraction(0, 8).denominator, '1');
assert.equal(context.simplifyFraction(2, -4).numerator, '-1');
assert.throws(() => context.simplifyFraction(1, 0));
const exampleRaw = context.calculateFractionBeforeSimplifying(fraction(9, 6), '+', fraction(3, 8));
assert.equal(`${exampleRaw.numerator}/${exampleRaw.denominator}`, '45/24');
const example = {
  answerFraction: context.calculateFraction(fraction(9, 6), '+', fraction(3, 8)),
  unsimplifiedAnswer: exampleRaw
};
assert.equal(`${example.answerFraction.numerator}/${example.answerFraction.denominator}`, '15/8');
for (const answer of ['45/24', '15/8', '90/48']) assert.equal(context.isCorrectOperationAnswer(answer, example), true);
assert.ok(context.operationSolutionHtml(example).includes('Resultado'));
assert.ok(context.operationSolutionHtml(example).includes('Simplificada'));

const operation = { answerFraction: fraction(1, 3), answer: 1 / 3 };
for (const value of ['1/3', '2/6', '1000000000000000000/3000000000000000000']) {
  assert.equal(context.isCorrectOperationAnswer(value, operation), true);
}
for (const value of ['0,333', '1/0', '1/', '-', '', 'NaN', '1/3/4', '1,2/3']) {
  assert.equal(context.isCorrectOperationAnswer(value, operation), false);
}
assert.equal(context.isCorrectOperationAnswer('0,5', { answerFraction: fraction(1, 2) }), true);
assert.equal(context.isCorrectOperationAnswer('-2/4', { answerFraction: fraction(-1, 2) }), true);
for (const value of ['-', '', '1/0', '1/', '1/2/3']) assert.ok(Number.isNaN(context.parsePlayerInput(value)));
assert.equal(context.parsePlayerInput('12,75'), 12.75);
assert.equal(context.parsePlayerInput('3/4'), 0.75);

const player = { input: '' };
for (const char of '12/345') assert.equal(context.appendInputChar(player, char), true);
assert.equal(context.appendInputChar(player, '/'), false);
assert.equal(context.appendInputChar(player, ','), false);
assert.equal(context.extractInputKey({ code: 'NumpadDivide', key: '/' }), '/');
for (const key of ['f', 'F', ':']) assert.equal(context.extractInputKey({ key }), '/');
for (const key of ['x', 'X', '*', '\u00d7', '\u00b7']) assert.equal(context.extractInputKey({ key }), 'x');
for (const text of ['2x2x3', '3x2x2', '2 * 3 * 2', '2\u00d72\u00d73']) {
  assert.equal(context.isCorrectPrimeFactorization(text, 12), true);
}
for (const text of ['4x3', '12', '1x2x2x3', '2x2', '2x', '2^2x3', '0x12', '-2x-2x3', '999999999999999999999999999x2']) {
  assert.equal(context.isCorrectPrimeFactorization(text, 12), false);
}
for (const digits of [1, 2, 3]) for (let i = 0; i < 500; i++) {
  const op = context.generatePrimeFactorization(digits);
  assert.equal(String(op.answer).length, digits);
  assert.ok(op.primeFactors.length >= 2);
  assert.ok(op.primeFactors.every(context.isPrimeInteger));
  assert.equal(op.primeFactors.reduce((product, n) => product * n, 1), op.answer);
  assert.equal(context.isCorrectOperationAnswer([...op.primeFactors].reverse().join('x'), op), true);
}
const factorPlayer = { id: 0, input: '2' };
state.operationsByPlayer.set(0, context.generatePrimeFactorization(2));
assert.equal(context.appendInputChar(factorPlayer, 'x'), true);
assert.equal(context.appendInputChar(factorPlayer, 'x'), false);
assert.equal(context.appendInputChar(factorPlayer, '3'), true);

let generated = 0;
for (const negatives of [false, true]) {
  state.allowNegative = negatives;
  for (const numeratorMax of [1, 2, 3]) for (const denominatorMax of [1, 2, 3]) {
    for (const kind of ['fractionAdd', 'fractionSub', 'fractionMul', 'fractionDiv', 'fractionCombined']) {
      for (let sample = 0; sample < 60; sample++) {
        const op = context.generateFractionArithmetic(kind, { numeratorMax, denominatorMax });
        assert.ok(Number.isFinite(op.answer));
        if (!negatives) assert.ok(op.answer >= 0);
        for (const f of op.operands) {
          assert.equal(f.numerator.replace('-', '').length, numeratorMax);
          assert.equal(f.denominator.length, denominatorMax);
          assert.ok(Number(f.denominator) > 0);
        }
        // Independently evaluate the generated arithmetic and its precedence.
        const expected = vm.runInNewContext(op.expression.replaceAll('x', '*'));
        assert.ok(Math.abs(op.answer - expected) <= 1e-8 * Math.max(1, Math.abs(expected)));
        const exact = `${op.answerFraction.numerator}/${op.answerFraction.denominator}`;
        assert.equal(context.isCorrectOperationAnswer(`${op.unsimplifiedAnswer.numerator}/${op.unsimplifiedAnswer.denominator}`, op), true);
        assert.equal(context.isCorrectOperationAnswer(exact, op), true);
        assert.equal(context.isCorrectOperationAnswer(`${BigInt(op.answerFraction.numerator) * 2n}/${BigInt(op.answerFraction.denominator) * 2n}`, op), true);
        assert.equal(context.isCorrectOperationAnswer(`${BigInt(op.answerFraction.numerator) + 1n}/${op.answerFraction.denominator}`, op), false);
        assert.ok(context.decorateOperation(op).html.includes('fraction-real'));
        generated++;
      }
    }
  }
}
state.allowNegative = false;
for (const key of Object.keys(state.operationSettings)) {
  for (let i = 0; i < 30; i++) assert.ok(Number.isFinite(context.createOperation(key).answer), key);
}
for (const digits of [1, 2, 3]) for (let i = 0; i < 100; i++) {
  const op = context.generateExactSquareRoot(digits);
  assert.equal(String(op.answer * op.answer).length, digits);
}
Object.values(state.operationSettings).forEach(cfg => cfg.enabled = false);
state.operationSettings.fractionCombined.enabled = true;
state.online = { seed: 12345 };
assert.equal(JSON.stringify(context.createOnlineOperation(8)), JSON.stringify(context.createOnlineOperation(8)));
assert.equal(context.mergeOperationSettings({ mul: { enabled: true } }).fractionCombined.enabled, false);
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
for (const key of Object.keys(state.operationSettings)) {
  assert.ok(html.includes(`data-op="${key}"`), `Missing operation selector: ${key}`);
}
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
assert.equal(new Set(ids).size, ids.length, 'Duplicate HTML IDs');
for (const match of source.matchAll(/document\.getElementById\("([^"]+)"\)/g)) {
  assert.ok(ids.includes(match[1]), `Missing DOM element: ${match[1]}`);
}
console.log(`OK: ${generated} fraction operations, 1500 prime factorizations, keyboard shortcuts, exact answers, existing modes, roots and online generation.`);
