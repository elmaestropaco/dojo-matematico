const fs = require('node:fs');
const path = require('node:path');
const { genderOf } = require('./lenguaje.cjs');
let changed = 0;
for (const file of ['sumas.json', 'restas.json', 'multiplicaciones.json', 'divisiones.json', 'combinados.json', 'plantilla-problema.json']) {
  const filename = path.join(__dirname, file), bank = JSON.parse(fs.readFileSync(filename, 'utf8'));
  for (const t of bank.plantillas) {
    const original = JSON.stringify(t);
    const units = [...Object.values(t.variables).filter(v => v.tipo === 'concordancia'), t.respuesta.unidad];
    for (const unit of units) {
      unit.genero = genderOf(unit);
      if (!unit.genero) throw Error('Falta el genero de ' + unit.singular);
    }
    for (const field of ['enunciado', 'enunciadoCompacto']) if (t[field]) {
      let text = t[field];
      for (const unit of units) {
        const word = unit.genero === 'femenino' ? 'Cuántas' : 'Cuántos';
        text = text.replace(new RegExp(`cuánt[oa]s ${unit.plural}\\b`, 'giu'), match => (match[0] === 'c' ? word.toLowerCase() : word) + ' ' + unit.plural);
      }
      text = text.replace(/quedan preparados para la actividad/g, 'quedan para la actividad')
        .replace(/ que tenía guardadas/g, ' de su reserva')
        .replace(/se apartan (\{cantidad[A-F]\})/g, 'apartan $1')
        .replace(/Las pegatinas que quedan se reparten/g, 'Reparten la cantidad disponible')
        .replace(/(\{cantidad[A-F]\} \{unidad[A-F]\}) preparad[oa]s sobre/g, '$1 sobre')
        .replace(/\bquedan (\{cantidad[A-F]\} \{unidad[A-F]\})/g, 'tienen todavía $1')
        .replace(/\bllegan (\{cantidad[A-F]\} \{unidad[A-F]\})/g, 'reciben $1')
        .replace(/\bviven (\{cantidad[A-F]\} \{unidad[A-F]\})/g, 'hay $1')
        .replace(/\bse (?:preparan|colocan|venden|utilizan|han utilizado) (\{cantidad[A-F]\})/g, match => match.slice(3))
        .replace(/\bhacen falta (\{cantidad[A-F]\} \{unidad[A-F]\})/g, 'necesitan $1')
        .replace(/(\{cantidad[A-F]\} \{unidad[A-F]\}) iguales/g, '$1 con el mismo contenido')
        .replace(/\b(?:Para|para) preparar /g, match => match[0] === 'P' ? 'Para ' : 'para ')
        .replace(/\. Se reparten por igual entre (\{cantidad[A-F]\} \{unidad[A-F]\})/g, '. Reparten esa cantidad por igual entre $1')
        .replace(/Se repite esa entrega durante (\{cantidad[A-F]\} \{unidad[A-F]\})\./g, 'Reciben esa cantidad cada día durante $1.')
        .replace(/Cada (\S+) recibe esa misma cantidad durante (\{cantidad[A-F]\} \{unidad[A-F]\})\./g, 'Cada $1 recibe esa misma cantidad cada día durante $2.');
      text = text.replace(/En cada mesa hay (\{cantidad[A-F]\} \{unidad[A-F]\}) que comparten su parte por igual\./g, 'En cada mesa reparten su parte por igual entre $1.');
      t[field] = text;
    }
    const overrides = {
      'resta-inicial-005': 'Sam recibe un regalo de {cantidadB} {unidadB}. Después del regalo tiene {cantidadA} {unidadA} en total. ¿Cuántos cromos tenía Sam antes de recibir el regalo?',
      'multiplicacion-003': 'Para una función del colegio colocan {cantidadA} {unidadA} de sillas. En cada fila hay {cantidadB} {unidadB}. ¿Cuántas sillas han colocado en total?',
      'multiplicacion-004': 'Alex compra {cantidadA} {unidadA} de cromos. Cada sobre contiene {cantidadB} {unidadB}. ¿Cuántos cromos ha comprado en total?',
      'division-001': 'Para una fiesta tienen {cantidadA} {unidadA}. Reparten esa cantidad por igual entre {cantidadB} {unidadB}. ¿Cuántos caramelos recibe cada niño?',
      'division-002': 'La maestra quiere guardar {cantidadA} {unidadA} en {cantidadB} {unidadB}, poniendo la misma cantidad en cada caja. ¿Cuántos lápices debe poner en cada caja?',
      'division-004': 'Para una merienda tienen {cantidadA} {unidadA}. Reparten esa cantidad en {cantidadB} {unidadB}, poniendo lo mismo en cada bolsa. ¿Cuántas galletas debe contener cada bolsa?',
      'division-005': 'Sam quiere guardar {cantidadA} {unidadA} en {cantidadB} {unidadB}, poniendo la misma cantidad en cada sobre. ¿Cuántos cromos tendrá cada sobre?',
      'division-006': 'En una actividad han conseguido {cantidadA} {unidadA} para {cantidadB} {unidadB}. La idea es repartir el dinero a partes iguales. ¿Cuántos euros recibe cada amigo?',
      'division-007': 'En una caja hay {cantidadA} {unidadA}. Para guardarlos en bolsas, ponen {cantidadB} {unidadB} en cada bolsa. ¿Cuántas bolsas pueden llenar?',
      'division-008': 'La maestra tiene {cantidadA} {unidadA} y guarda {cantidadB} {unidadB} para otro día. Reparte lo que queda por igual entre {cantidadC} {unidadC}. ¿Cuántos lápices recibe cada niño?',
      'division-009': 'En una caja hay {cantidadA} {unidadA} y en otra hay {cantidadB} {unidadB}. Juntan ambas cantidades y las reparten por igual entre {cantidadC} {unidadC}. ¿Cuántos cromos recibe cada niño?',
      'division-010': 'En un cuento del espacio tienen {cantidadA} {unidadA} de repuesto para {cantidadB} {unidadB}. Quieren enviar la misma cantidad a cada nave. ¿Cuántas piezas recibe cada nave?'
    };
    if (overrides[t.id]) t.enunciado = overrides[t.id];
    if (t.id === 'division-007') t.enunciado = t.enunciado.replace('Para guardarlos en bolsas', 'Para guardar esa cantidad en bolsas');
    if (t.id.includes('-individual-')) {
      let reason;
      if (t.etiquetas.length === 1 && t.etiquetas[0] === 'suma') {
        reason = t.enunciado.includes('segundo grupo') ? 'Sumamos la cantidad del primer grupo y la diferencia' : /al empezar/.test(t.enunciado) ? 'Sumamos la cantidad que queda y la que se utilizó' : t.enunciado.includes('necesitan en total') ? 'Sumamos lo que tienen y lo que todavía necesitan' : 'Sumamos las cantidades';
      }
      if (t.etiquetas.length === 1 && t.etiquetas[0] === 'resta') {
        reason = t.pasos.length > 1 ? 'Restamos la cantidad utilizada por la mañana' : t.enunciado.includes('han utilizado') ? 'Restamos lo que queda a la cantidad inicial' : t.enunciado.includes('antes de recibir') ? 'Restamos el pedido a la cantidad actual' : t.enunciado.includes('primera clase') ? 'Restamos para comparar las dos clases' : t.enunciado.includes('les faltan') ? 'Restamos lo que tienen a lo que necesitan' : 'Restamos la cantidad utilizada a la cantidad inicial';
      }
      if (reason) t.pasos[0].explicacion = t.pasos[0].explicacion.replace(/^[^:]+:/, reason + ':');
    }
    for (const step of t.pasos) if (step.explicacion.startsWith('Multiplicamos por el número de lotes o días:')) {
      const unit = Object.values(t.variables).find(v => v.tipo === 'concordancia' && v.cantidad === step.operandos[1]);
      step.explicacion = step.explicacion.replace('Multiplicamos por el número de lotes o días', unit?.singular === 'día' ? 'Multiplicamos la cantidad diaria por el número de días' : 'Multiplicamos el contenido de un lote por el número de lotes');
    }
    if (JSON.stringify(t) !== original) changed++;
  }
  fs.writeFileSync(filename, JSON.stringify(bank, null, 2) + '\n');
}
console.log(`Revision aplicada a ${changed} plantillas; se conservan cantidades, operaciones y soluciones.`);
