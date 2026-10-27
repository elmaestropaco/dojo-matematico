const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { validateLanguage } = require('./lenguaje.cjs');

const OPERATIONS = ['suma', 'resta', 'multiplicacion', 'division'];
const NUMBER_NAME = /^cantidad[A-F]$/;
const WORD_NAME = /^(nombre[12]|lugar)$/;
const UNIT_NAME = /^unidad[A-F]$/;
const RESULT_NAME = /^resultado[1-6]$/;

function fields(value, allowed, required = allowed) {
  assert.ok(value && typeof value === 'object' && !Array.isArray(value), 'Se esperaba un objeto');
  for (const key of Object.keys(value)) assert.ok(allowed.includes(key), `Campo desconocido: ${key}`);
  for (const key of required) assert.ok(Object.hasOwn(value, key), `Falta el campo: ${key}`);
}

function nonempty(value, label) {
  assert.ok(typeof value === 'string' && value.trim(), `${label}: debe ser texto no vacio`);
}

function placeholders(text, available) {
  nonempty(text, 'Texto');
  for (const match of text.matchAll(/\{([^{}]+)\}/g)) {
    assert.ok(available.has(match[1]), `Variable desconocida o no disponible: {${match[1]}}`);
  }
  assert.ok(!/[{}]/.test(text.replace(/\{[^{}]+\}/g, '')), 'Llaves incompletas o anidadas');
}

function validateTemplate(template) {
  const required = ['id', 'titulo', 'etiquetas', 'enunciado', 'variables', 'pasos', 'respuesta', 'restricciones', 'ejemplo'];
  fields(template, [...required, 'dificultad', 'enunciadoCompacto'], required);
  if (template.dificultad !== undefined) assert.ok(['facil', 'media', 'avanzada'].includes(template.dificultad), 'Dificultad desconocida');
  assert.match(template.id, /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/, 'ID no valido');
  nonempty(template.titulo, 'Titulo');
  assert.ok(Array.isArray(template.etiquetas) && template.etiquetas.length, 'Faltan etiquetas');
  assert.equal(new Set(template.etiquetas).size, template.etiquetas.length, 'Etiquetas repetidas');
  for (const tag of template.etiquetas) assert.ok(OPERATIONS.includes(tag), `Etiqueta desconocida: ${tag}`);
  assert.ok(template.variables && typeof template.variables === 'object' && !Array.isArray(template.variables), 'Faltan variables');
  const numeric = new Set();
  for (const [name, variable] of Object.entries(template.variables)) {
    if (variable.tipo === 'entero') {
      assert.match(name, NUMBER_NAME, `Nombre de cantidad no permitido: ${name}`);
      fields(variable, ['tipo', 'descripcion', 'minimo', 'maximo']);
      nonempty(variable.descripcion, name);
      assert.ok(Number.isInteger(variable.minimo) && Number.isInteger(variable.maximo), `${name}: limites enteros`);
      assert.ok(variable.minimo >= 1 && variable.maximo <= 999999999 && variable.minimo <= variable.maximo, `${name}: limites no validos`);
      numeric.add(name);
    } else if (variable.tipo === 'texto') {
      assert.match(name, WORD_NAME, `Nombre de texto no permitido: ${name}`);
      fields(variable, ['tipo', 'valores']);
      assert.ok(Array.isArray(variable.valores) && variable.valores.length, `${name}: faltan valores`);
      variable.valores.forEach(value => { nonempty(value, name); assert.ok(!/[{}]/.test(value), 'Las palabras no pueden contener variables'); });
    } else if (variable.tipo === 'concordancia') {
      assert.match(name, UNIT_NAME, `Nombre de concordancia no permitido: ${name}`);
      fields(variable, ['tipo', 'cantidad', 'singular', 'plural', 'genero'], ['tipo', 'cantidad', 'singular', 'plural']);
      nonempty(variable.singular, name);
      nonempty(variable.plural, name);
      assert.equal(template.variables[variable.cantidad]?.tipo, 'entero', `${name}: debe referirse a una cantidad declarada`);
    } else throw new Error(`${name}: tipo de variable desconocido`);
  }
  placeholders(template.enunciado, new Set(Object.keys(template.variables)));
  if (template.enunciadoCompacto !== undefined) placeholders(template.enunciadoCompacto, new Set(Object.keys(template.variables)));
  fields(template.ejemplo, ['valores', 'respuesta']);
  fields(template.ejemplo.valores, Object.entries(template.variables).filter(([, v]) => v.tipo !== 'concordancia').map(([name]) => name));
  const values = {};
  for (const [name, variable] of Object.entries(template.variables)) {
    const value = template.ejemplo.valores[name];
    if (variable.tipo === 'entero') {
      assert.ok(Number.isInteger(value) && value >= variable.minimo && value <= variable.maximo, `${name}: ejemplo fuera de limites`);
      values[name] = BigInt(value);
    } else if (variable.tipo === 'texto') {
      assert.ok(variable.valores.includes(value), `${name}: palabra no incluida en valores`);
      values[name] = value;
    }
  }
  for (const [name, variable] of Object.entries(template.variables)) {
    if (variable.tipo === 'concordancia') values[name] = values[variable.cantidad] === 1n ? variable.singular : variable.plural;
  }
  assert.ok(Array.isArray(template.pasos) && template.pasos.length >= 1 && template.pasos.length <= 6, 'Debe haber de 1 a 6 pasos');
  const usedOperations = new Set();
  const resultIds = new Set();
  const explanations = [];
  const render = text => text.replace(/\{([^{}]+)\}/g, (_, name) => String(values[name]));
  for (const step of template.pasos) {
    fields(step, ['id', 'operacion', 'operandos', 'explicacion']);
    assert.match(step.id, RESULT_NAME, 'ID de paso no permitido');
    assert.ok(!resultIds.has(step.id), 'Resultado repetido');
    assert.ok(OPERATIONS.includes(step.operacion), 'Operacion desconocida');
    assert.ok(Array.isArray(step.operandos) && step.operandos.length === 2, 'Cada paso necesita dos operandos');
    for (const ref of step.operandos) assert.ok(numeric.has(ref), `Operando desconocido, textual o futuro: ${ref}`);
    const [a, b] = step.operandos.map(ref => values[ref]);
    if (step.operacion === 'suma') values[step.id] = a + b;
    if (step.operacion === 'resta') values[step.id] = a - b;
    if (step.operacion === 'multiplicacion') values[step.id] = a * b;
    if (step.operacion === 'division') {
      assert.ok(b !== 0n && a % b === 0n, 'La division del ejemplo debe ser exacta');
      values[step.id] = a / b;
    }
    resultIds.add(step.id);
    numeric.add(step.id);
    usedOperations.add(step.operacion);
    placeholders(step.explicacion, new Set(Object.keys(values)));
    explanations.push(render(step.explicacion));
  }
  assert.deepEqual([...usedOperations].sort(), [...template.etiquetas].sort(), 'Las etiquetas no coinciden con las operaciones de los pasos');
  fields(template.respuesta, ['valor', 'unidad']);
  fields(template.respuesta.unidad, ['singular', 'plural', 'genero'], ['singular', 'plural']);
  nonempty(template.respuesta.unidad.singular, 'Unidad singular');
  nonempty(template.respuesta.unidad.plural, 'Unidad plural');
  assert.equal(template.respuesta.valor, template.pasos.at(-1).id, 'La respuesta debe ser el resultado del ultimo paso');
  assert.match(template.ejemplo.respuesta, /^\d+$/, 'La respuesta del ejemplo debe ser un entero no negativo escrito como texto');
  const answer = values[template.respuesta.valor];
  assert.ok(answer >= 0n, 'La respuesta final no puede ser negativa en formato 1');
  assert.equal(answer, BigInt(template.ejemplo.respuesta), 'Respuesta incorrecta en el ejemplo');
  assert.ok(Array.isArray(template.restricciones), 'Restricciones debe ser una lista');
  for (const rule of template.restricciones) {
    fields(rule, ['tipo', 'izquierda', 'derecha']);
    assert.ok(numeric.has(rule.izquierda) && numeric.has(rule.derecha), 'Referencia desconocida en restriccion');
    const a = values[rule.izquierda], b = values[rule.derecha];
    if (rule.tipo === 'mayor_o_igual') assert.ok(a >= b, 'No se cumple mayor_o_igual');
    else if (rule.tipo === 'mayor_que') assert.ok(a > b, 'No se cumple mayor_que');
    else if (rule.tipo === 'division_exacta') assert.ok(b !== 0n && a % b === 0n, 'No se cumple division_exacta');
    else throw new Error(`Restriccion desconocida: ${rule.tipo}`);
  }
  for (const step of template.pasos.filter(step => step.operacion === 'division')) {
    assert.ok(template.restricciones.some(rule => rule.tipo === 'division_exacta' && rule.izquierda === step.operandos[0] && rule.derecha === step.operandos[1]), 'Cada division necesita una restriccion division_exacta para sus operandos');
  }
  validateLanguage(template);
  return { id: template.id, enunciado: render(template.enunciado), explicaciones: explanations, respuesta: `${answer} ${answer === 1n ? template.respuesta.unidad.singular : template.respuesta.unidad.plural}` };
}

function validateBank(bank) {
  fields(bank, ['version', 'idioma', 'plantillas']);
  assert.equal(bank.version, 1, 'Version no soportada');
  assert.equal(bank.idioma, 'es', 'Idioma no soportado');
  assert.ok(Array.isArray(bank.plantillas) && bank.plantillas.length > 0, 'El banco esta vacio');
  const ids = new Set();
  return bank.plantillas.map(template => {
    try {
      assert.ok(!ids.has(template.id), 'ID duplicado');
      ids.add(template.id);
      return validateTemplate(template);
    } catch (error) { throw new Error(`${template.id || '(sin id)'}: ${error.message}`); }
  });
}

if (require.main === module) {
  try {
    const file = process.argv[2] || path.join(__dirname, 'sumas.json');
    const results = validateBank(JSON.parse(fs.readFileSync(file, 'utf8')));
    for (const result of results) {
      console.log(`\n${result.id}\n${result.enunciado}`);
      result.explicaciones.forEach(text => console.log(`  ${text}`));
      console.log(`  Respuesta: ${result.respuesta}`);
    }
    console.log(`\nOK: ${results.length} plantillas y ejemplos validados.`);
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}

module.exports = { validateBank };
