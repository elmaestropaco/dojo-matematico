const assert = require('node:assert/strict');
const feminine = new Set('canica ficha silla semilla magdalena pelota pera partitura postal botella manta entrada cuenta medalla maceta piedra máscara hoja lámina etiqueta caja bolsa fila página foto pegatina pieza galleta nave clase mesa persona zona linterna taza'.split(' '));
const masculine = new Set('libro cromo kilómetro cuaderno euro metro habitante pincel globo frasco bocadillo tornillo banderín mapa muñeco tarro lápiz sobre día lote paquete botón folio caramelo niño estante amigo grupo equipo puesto saco imán panel'.split(' '));
const escape = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function genderOf(unit) {
  if (unit.genero) return unit.genero;
  const noun = unit.singular.split(' ')[0];
  return feminine.has(noun) ? 'femenino' : masculine.has(noun) ? 'masculino' : null;
}
function validateLanguage(template) {
  const units = [...Object.values(template.variables).filter(v => v.tipo === 'concordancia'), template.respuesta.unidad];
  const texts = [template.enunciado, template.enunciadoCompacto].filter(Boolean);
  for (const unit of units) {
    const gender = genderOf(unit);
    assert.ok(gender, `Indica genero (femenino o masculino) para la unidad ${unit.singular}`);
    assert.ok(['femenino', 'masculino'].includes(gender), 'Genero no valido');
    const known = genderOf({ singular: unit.singular });
    if (known) assert.equal(gender, known, `Genero incorrecto para ${unit.singular}`);
    const wrong = gender === 'femenino' ? 'cuántos' : 'cuántas';
    for (const text of texts) assert.ok(!new RegExp(`\\b${wrong}\\s+${escape(unit.plural)}\\b`, 'iu').test(text), `Concordancia incorrecta: ${wrong} ${unit.plural}`);
    if (gender === 'femenino') for (const text of texts) assert.ok(!new RegExp(`${escape(unit.plural)} quedan preparados`, 'u').test(text), `Concordancia incorrecta: ${unit.plural} preparados`);
  }
  for (const [name, variable] of Object.entries(template.variables)) {
    if (variable.tipo !== 'entero' || variable.minimo > 1) continue;
    for (const text of texts) assert.ok(!new RegExp(`(?:quedan|llegan|viven|se preparan|se colocan|se venden|se utilizan|se apartan|se han utilizado|hacen falta) \\{${name}\\}`, 'iu').test(text), `La frase con {${name}} debe admitir tambien la cantidad 1`);
  }
}
module.exports = { genderOf, validateLanguage };
