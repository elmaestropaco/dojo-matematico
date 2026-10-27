const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { validateBank } = require('../banco-problemas/validar-banco.cjs');
const read = file => JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'banco-problemas', file), 'utf8'));
const bank = read('sumas.json');
assert.equal(bank.plantillas.length, 40);
assert.equal(validateBank(bank).length, 40);
assert.ok(bank.plantillas.every(template => template.etiquetas.length === 1 && template.etiquetas[0] === 'suma'));
validateBank(read('plantilla-problema.json'));
const subtractionBank = read('restas.json');
assert.equal(subtractionBank.plantillas.length, 40);
assert.equal(validateBank(subtractionBank).length, 40);
assert.ok(subtractionBank.plantillas.every(template => template.etiquetas.length === 1 && template.etiquetas[0] === 'resta'));
for (const file of ['multiplicaciones.json', 'divisiones.json']) {
  const extra = read(file);
  assert.ok(extra.plantillas.length >= 40);
  assert.equal(validateBank(extra).length, extra.plantillas.length);
}
const combinedBank = read('combinados.json');
assert.equal(combinedBank.plantillas.length, 436);
assert.equal(validateBank(combinedBank).length, 436);
assert.ok(combinedBank.plantillas.every(t => t.etiquetas.length >= 2 && t.enunciadoCompacto));
const templates = [bank, subtractionBank, read('multiplicaciones.json'), read('divisiones.json'), combinedBank].flatMap(b => b.plantillas);
assert.equal(templates.length, 600);
assert.equal(new Set(templates.map(t => t.id)).size, 600);
assert.equal(new Set(templates.map(t => t.enunciado)).size, 600);
const categories = ['suma', 'resta', 'multiplicacion', 'division'];
for (let mask = 1; mask < 16; mask++) {
  const key = categories.filter((_, i) => mask & (1 << i)).sort().join(',');
  assert.equal(templates.filter(t => [...t.etiquetas].sort().join(',') === key).length, 40, key);
}

for (const original of bank.plantillas) {
  for (const endpoint of ['minimo', 'maximo']) {
    const template = structuredClone(original);
    const values = template.ejemplo.valores;
    const computed = {};
    for (const [name, variable] of Object.entries(template.variables)) {
      if (variable.tipo === 'entero') {
        values[name] = variable[endpoint];
        computed[name] = BigInt(values[name]);
      }
    }
    for (const step of template.pasos) computed[step.id] = computed[step.operandos[0]] + computed[step.operandos[1]];
    template.ejemplo.respuesta = String(computed[template.respuesta.valor]);
    const rendered = validateBank({ version: 1, idioma: 'es', plantillas: [template] })[0];
    assert.ok(!/[{}]/.test(rendered.enunciado));
    assert.ok(!/[A-Za-z]\?[A-Za-z]/.test(rendered.enunciado), 'Corrupted accented text');
    if (endpoint === 'minimo') assert.ok(!rendered.enunciado.includes('1 libros'), 'Incorrect singular');
  }
}

for (const mutate of [
  template => { template.enunciado += ' {cajas}'; },
  template => { template.pasos[0].operandos[0] = 'resultado6'; },
  template => { template.pasos[0].operacion = '+'; },
  template => { template.ejemplo.respuesta = '123456'; },
  template => { template.etiquetas = ['resta']; },
  template => { template.variables.cantidadA.maximo = 0; }
]) {
  const template = structuredClone(bank.plantillas[0]);
  mutate(template);
  assert.throws(() => validateBank({ version: 1, idioma: 'es', plantillas: [template] }));
}

const arithmetic = read('plantilla-problema.json');
const template = arithmetic.plantillas[0];
template.etiquetas = ['division'];
template.pasos[0].operacion = 'division';
template.restricciones = [{ tipo: 'division_exacta', izquierda: 'cantidadA', derecha: 'cantidadB' }];
template.ejemplo.valores.cantidadA = 24;
template.ejemplo.valores.cantidadB = 6;
template.ejemplo.respuesta = '4';
validateBank(arithmetic);
template.ejemplo.valores.cantidadA = 25;
assert.throws(() => validateBank(arithmetic));
template.etiquetas = ['multiplicacion'];
template.pasos[0].operacion = 'multiplicacion';
template.restricciones = [];
for (const name of ['cantidadA', 'cantidadB']) {
  template.variables[name].maximo = 999999999;
  template.ejemplo.valores[name] = 999999999;
}
template.ejemplo.respuesta = '999999998000000001';
validateBank(arithmetic);
console.log('OK: 600 unique templates; 40 for every operation subset, editable template, bounds, placeholders, singulars, exact division and large integer products.');
