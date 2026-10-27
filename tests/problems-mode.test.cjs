const assert = require('node:assert/strict');
require('../banco-problemas/datos.js');
const engine = require('../problemas.js');
assert.equal(globalThis.NinjaProblemBank.plantillas.length, 600);
const categories = ['suma', 'resta', 'multiplicacion', 'division'];
const all = Object.fromEntries(categories.map(key => [key, { enabled: true, difficulty: 'todas', digitMode: 'intervalo', minDigits: 1, maxDigits: 9 }]));
const individualCount = globalThis.NinjaProblemBank.plantillas.filter(t => t.etiquetas.length === 1).length;
assert.equal(engine.compatible(all).length, individualCount);
assert.equal(new Set(Array.from({ length: individualCount }, (_, i) => engine.generate(all, i, 123).problem.templateId)).size, individualCount);
let count = 0;
const digitSum = value => [...String(value)].reduce((sum, digit) => sum + Number(digit), 0);
for (const category of categories) for (const carryMode of (['suma', 'resta'].includes(category) ? ['ambas', 'sin', 'con'] : ['ambas'])) for (const digits of [1, 2, 3, 4, 5, 6, 7, 8, 9]) for (const difficulty of ['facil', 'media', 'avanzada', 'todas']) {
  const settings = Object.fromEntries(categories.map(key => [key, { enabled: key === category, difficulty, minDigits: digits, carryMode }]));
  if (!engine.compatible(settings).length) continue;
  for (let i = 0; i < 25; i++) {
    const op = engine.generate(settings, i, 12345);
    assert.deepEqual(op, engine.generate(settings, i, 12345));
    assert.ok(BigInt(op.answerExact) >= 0n);
    assert.ok(!/[{}]/.test(op.problem.text));
    const template = globalThis.NinjaProblemBank.plantillas.find(t => t.id === op.problem.templateId);
    const values = {};
    for (const [name, variable] of Object.entries(template.variables)) if (variable.tipo === 'entero') {
      const value = Number(op.problem.values[name]);
      assert.equal(String(value).length, digits);
      assert.ok(value >= variable.minimo && value <= variable.maximo);
      values[name] = BigInt(value);
    }
    for (const step of template.pasos) {
      const [a, b] = step.operandos.map(k => values[k]);
      if (step.operacion === 'suma') values[step.id] = a + b;
      if (step.operacion === 'resta') values[step.id] = a - b;
      if (step.operacion === 'multiplicacion') values[step.id] = a * b;
      if (step.operacion === 'division') { assert.equal(a % b, 0n); values[step.id] = a / b; }
      assert.ok(values[step.id] >= 0n);
      if (['suma', 'resta'].includes(category) && carryMode !== 'ambas') {
        const carried = step.operacion === 'suma' ? digitSum(a) + digitSum(b) > digitSum(a + b) : digitSum(a - b) + digitSum(b) > digitSum(a);
        assert.equal(carried, carryMode === 'con');
      }
    }
    assert.equal(String(values[template.respuesta.valor]), op.answerExact);
    count++;
  }
}
assert.equal(engine.hasCarry('suma', 19n, 1n), true);
assert.equal(engine.hasCarry('suma', 12n, 23n), false);
assert.equal(engine.hasCarry('resta', 20n, 1n), true);
assert.equal(engine.hasCarry('resta', 35n, 12n), false);
for (const category of ['multiplicacion', 'division']) {
  const settings = Object.fromEntries(categories.map(key => [key, {
    enabled: key === category, difficulty: 'todas',
    operandDigits: { first: { minDigits: 3, maxDigits: 4 }, second: { minDigits: 1, maxDigits: 1 } }
  }]));
  assert.deepEqual(engine.normalize(settings)[category].operandDigits, settings[category].operandDigits);
  assert.deepEqual(engine.normalize(engine.normalize(settings)), engine.normalize(settings));
  const pool = engine.compatible(settings);
  assert.ok(pool.length > 0);
  for (let seed = 1; seed <= 12; seed++) for (let i = 0; i < pool.length; i++) {
    const op = engine.generate(settings, i, seed);
    const template = globalThis.NinjaProblemBank.plantillas.find(t => t.id === op.problem.templateId);
    for (const [name, variable] of Object.entries(template.variables)) if (variable.tipo === 'entero') {
      const step = template.pasos.find(s => s.operandos.includes(name));
      const range = settings[category].operandDigits[step.operandos.indexOf(name) === 0 ? 'first' : 'second'];
      assert.ok(op.problem.values[name].length >= range.minDigits && op.problem.values[name].length <= range.maxDigits, template.id + ':' + name);
    }
    for (const step of template.pasos.filter(s => s.operacion === 'division')) {
      const [a, b] = step.operandos.map(k => BigInt(op.problem.values[k]));
      assert.equal(a % b, 0n);
    }
  }
}
const migrated = engine.normalize({ division: { enabled: true, minDigits: 3, maxDigits: 5 } });
assert.deepEqual(migrated.division.operandDigits, { first: { minDigits: 3, maxDigits: 5 }, second: { minDigits: 3, maxDigits: 5 } });
assert.equal(engine.compatible({ suma: { enabled: false }, resta: { enabled: false }, division: { enabled: true, operandDigits: { first: { minDigits: 1 }, second: { minDigits: 2 } } } }).length, 0);
assert.equal(engine.compatible({ suma: { enabled: false }, resta: { enabled: true, carryMode: 'con', minDigits: 1 } }).length, 0);
assert.equal(engine.compatible({ suma: { enabled: false }, resta: { enabled: false } }).length, 0);
assert.throws(() => engine.generate({ suma: { enabled: false }, resta: { enabled: false } }, 0, 123));
assert.equal(engine.compatible({ suma: { difficulty: 'avanzada', minDigits: 9 }, resta: { enabled: false } }).length, 0);
for (let i = 0; i < 200; i++) {
  const op = engine.generate(all, i, 456);
  for (const [name, value] of Object.entries(op.problem.values)) if (/^cantidad/.test(name)) assert.ok(String(value).length <= 9);
}
let combinationCount = 0;
for (let mask = 1; mask < 16; mask++) {
  const selected = categories.filter((_, i) => mask & (1 << i));
  const settings = Object.fromEntries(categories.map(key => [key, { enabled: selected.includes(key), minDigits: 1, maxDigits: 3, difficulty: 'todas' }]));
  for (const mix of ['individuales', 'combinados', 'mixto']) {
    const pool = engine.compatible(settings, { mix });
    const expected = globalThis.NinjaProblemBank.plantillas.filter(t => t.etiquetas.every(key => selected.includes(key)) && (t.etiquetas.length === 1 ? mix !== 'combinados' : mix !== 'individuales' && t.etiquetas.length === selected.length));
    assert.equal(pool.length, expected.length);
    if (!pool.length) continue;
    for (let i = 0; i < pool.length * 3; i++) {
      const op = engine.generate(settings, i, 17, { mix });
      assert.ok(op.problem.categories.every(key => selected.includes(key)));
      if (op.problem.categories.length > 1) assert.deepEqual([...op.problem.categories].sort(), [...selected].sort());
      if (mix === 'individuales') assert.equal(op.problem.categories.length, 1);
      if (mix === 'combinados') assert.ok(op.problem.categories.length > 1);
      combinationCount++;
    }
  }
  if (selected.length < 2) continue;
  for (const digits of [1, 2, 3]) for (const carryMode of ['sin', 'con']) {
    const settings = Object.fromEntries(categories.map(key => [key, { enabled: selected.includes(key), minDigits: digits, maxDigits: digits, carryMode, difficulty: 'todas' }]));
    if (!engine.compatible(settings, { mix: 'combinados' }).length) continue;
    for (let i = 0; i < 10; i++) {
      const op = engine.generate(settings, i, 123, { mix: 'combinados' });
      const template = globalThis.NinjaProblemBank.plantillas.find(t => t.id === op.problem.templateId);
      for (const step of template.pasos) if (['suma', 'resta'].includes(step.operacion)) {
        const [a, b] = step.operandos.map(key => BigInt(op.problem.values[key]));
        const carried = step.operacion === 'suma' ? digitSum(a) + digitSum(b) > digitSum(a + b) : digitSum(a - b) + digitSum(b) > digitSum(a);
        assert.equal(carried, carryMode === 'con');
      }
      combinationCount++;
    }
  }
}
console.log(`OK: ${count} individual variants and ${combinationCount} mix/combined variants; operation subsets, carry/borrow, exact divisions and reproducible generation.`);
