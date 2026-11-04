(function (root) {
  if (!root.NinjaGeometry && typeof require === 'function') require('./geometria.js');
  const integer = (n, min, max, fallback) => Math.max(min, Math.min(max, Math.trunc(Number(n)) || fallback));
  const pick = (rng, min, max) => min + Math.floor(rng() * (max - min + 1));
  const random = seed => { let x = Number(seed) >>> 0; return () => { x += 0x6D2B79F5; let t = Math.imul(x ^ (x >>> 15), x | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const exact = (n, d = 1n) => root.NinjaUnits.rational(BigInt(n), BigInt(d));
  const decimal = (n, d = 1n) => root.NinjaPercentages.decimal(n, d);
  function newCalculation(kind, cfg = {}, rng = Math.random) {
    const digits = integer(cfg.digits, 1, kind === 'power' ? 3 : 9, 2);
    const number = () => BigInt(pick(rng, 10 ** (digits - 1), 10 ** digits - 1));
    let expression, answer, answerSymbol, explanation, preferredDisplay;
    if (kind === 'missing') {
      const a = number(), b = number(), op = integer(cfg.operator, 0, 4, 0) || pick(rng, 1, 4);
      const hidden = rng() < 0.5;
      const result = op === 1 ? a + b : op === 2 ? a + b : op === 3 ? a * b : a * b;
      const left = op === 2 || op === 4 ? result : a, right = b;
      const total = op === 2 ? a : op === 4 ? a : result;
      const symbol = ['', '+', '−', '×', '÷'][op];
      expression = `${hidden ? '□' : left} ${symbol} ${hidden ? right : '□'} = ${total}`;
      answer = exact(hidden ? left : right);
      explanation = `${left} ${symbol} ${right} = ${total}. El número que falta es ${answer.numerator}.`;
    } else if (kind === 'compare') {
      const a = number(), b = rng() < 0.2 ? a : number();
      let n = a, d = 1n, m = b, e = 1n, left = String(a), right = String(b);
      const variant = integer(cfg.variant, 0, 2, 0);
      if (variant === 1) { d = BigInt(pick(rng, 1, 12)); e = BigInt(pick(rng, 1, 12)); left += '/' + d; right += '/' + e; }
      if (variant === 2) { n *= 100n; m = rng() < 0.2 ? n : n + BigInt(pick(rng, -99, 99)); left += ' m'; right = `${m} cm`; }
      answerSymbol = n * e < m * d ? '<' : n * e > m * d ? '>' : '=';
      expression = `${left} □ ${right}`;
      explanation = variant === 1 ? `Comparamos los productos cruzados: ${a} × ${e} = ${a * e} y ${b} × ${d} = ${b * d}. Por tanto, ${left} ${answerSymbol} ${right}.` : variant === 2 ? `Convertimos a centímetros: ${a} m = ${a * 100n} cm. Por tanto, ${left} ${answerSymbol} ${right}.` : `${left} ${answerSymbol} ${right}. La abertura del signo mira hacia la cantidad mayor.`;
      return { kind, expression, comparison: { left, right }, answerSymbol, answer: 0, explanation, signature: `compare:${expression}` };
    } else if (kind === 'power') {
      const base = number(), exponent = pick(rng, 2, integer(cfg.exponentMax, 2, 5, 3));
      expression = `${base}^${exponent}`; answer = exact(base ** BigInt(exponent));
      explanation = `${Array(exponent).fill(String(base)).join(' × ')} = ${answer.numerator}.`;
      return { kind, expression, htmlExpression: `${base}<sup>${exponent}</sup>`, answerFraction: answer, answerDisplay: answer.numerator, answer: Number(answer.numerator), explanation, signature: `power:${expression}` };
    } else {
      const place = Math.max(-3, Math.min(6, Math.trunc(Number(cfg.place)) || 0));
      const sourcePlaces = place <= 0 ? -place + 1 : 0, scale = 10n ** BigInt(sourcePlaces);
      const n = number() * scale + (sourcePlaces ? BigInt(pick(rng, 0, Number(scale) - 1)) : 0n);
      const quantum = 10n ** BigInt(sourcePlaces + place);
      const rounded = (n + quantum / 2n) / quantum * quantum;
      answer = exact(rounded, scale);
      const names = { '-3': 'milésimas', '-2': 'centésimas', '-1': 'décimas', 0: 'unidades', 1: 'decenas', 2: 'centenas', 3: 'millares', 4: 'decenas de millar', 5: 'centenas de millar', 6: 'millones' };
      expression = `Redondea ${decimal(n, scale)} a las ${names[place]}`;
      const resultText = decimal(rounded, scale), parts = resultText.split(',');
      preferredDisplay = place < 0 ? `${parts[0]},${(parts[1] || '').padEnd(-place, '0')}` : resultText;
      const nextDigit = Number(n / (quantum / 10n) % 10n);
      explanation = `${decimal(n, scale)} → ${preferredDisplay} (${names[place]}). La cifra siguiente es ${nextDigit}: ${nextDigit >= 5 ? 'subimos' : 'conservamos'}.`;
    }
    return { kind, expression, answerFraction: answer, answerDisplay: preferredDisplay ?? decimal(answer.numerator, answer.denominator), answer: Number(answer.numerator) / Number(answer.denominator), explanation, signature: `${kind}:${expression}` };
  }
  const families = { razonamiento: 'Razonamiento', geometria: 'Geometría', compras: 'Dinero y compras', proporcionalidad: 'Proporcionalidad' };
  const contexts = ['La biblioteca', 'El huerto', 'La excursión', 'El taller', 'La feria', 'El club deportivo', 'La fiesta', 'La clase', 'El mercadillo', 'El campamento'];
  const bank = root.NinjaLearningProblemBank?.plantillas || Object.entries(families).flatMap(([family, label]) => contexts.flatMap((context, i) => Array.from({ length: family === 'geometria' ? 14 : 4 }, (_, variant) => ({ id: `${family}-${i + 1}-${variant + 1}`, family, variant, context, title: `${label}: ${context.toLowerCase()}` }))));
  const engine = root.NinjaProblems, previous = { normalize: engine.normalize, compatible: engine.compatible, generate: engine.generate };
  function normalize(settings = {}) {
    const base = previous.normalize(settings);
    const variant = value => Number.isFinite(Number(value)) ? Math.max(-1, Math.min(3, Math.trunc(Number(value)))) : -1;
    return { ...base, _family: families[settings._family] ? settings._family : base._family,
      _newDigits: integer(settings._newDigits, 1, 3, 2), _newDecimals: settings._newDecimals === true,
      _reasonVariant: variant(settings._reasonVariant ?? -1),
      _geometryVariant: Number.isFinite(Number(settings._geometryVariant)) ? Math.max(-1, Math.min(13, Math.trunc(Number(settings._geometryVariant)))) : -1,
      _geometryDecimals: settings._geometryDecimals !== false, _geometryPi: settings._geometryPi === '3' ? '3' : '3,14' };
  }
  function compatible(settings, options = {}) {
    const cfg = normalize(settings);
    if (!families[cfg._family]) return previous.compatible(cfg, options);
    const variant = cfg._family === 'razonamiento' ? cfg._reasonVariant : cfg._family === 'geometria' ? cfg._geometryVariant : -1;
    // Reasoning level is selected by its own control, not by the arithmetic mixing selector.
    return bank.filter(t => t.family === cfg._family && (variant < 0 || t.variant === variant) && (t.family !== 'geometria' || root.NinjaGeometry.compatible(t.variant, cfg))).map(t => ({ ...t, categories: [t.family] }));
  }
  function buildProblem(t, cfg, rng) {
    const max = 10 ** cfg._newDigits - 1, min = 10 ** (cfg._newDigits - 1);
    const a = BigInt(pick(rng, min, max)), b = BigInt(pick(rng, min, max)), small = BigInt(pick(rng, 2, 8));
    let text, compactText, result, unit = '', steps = [], calculations = [], diagram, followUp;
    const intro = `En la actividad «${t.context}»`;
    if (t.family === 'razonamiento') {
      unit = 'libros';
      if (t.variant === 0) {
        text = `${intro} tienen ${a} ${a === 1n ? 'libro' : 'libros'} de cuentos y ${b} ${b === 1n ? 'libro' : 'libros'} de aventuras. Los colocan en una sala con ${small} mesas. ¿Cuántos libros tienen entre los dos tipos?`;
        result = a + b; steps = ['Los datos de las mesas no ayudan a responder la pregunta.', 'Juntamos las dos cantidades de libros.']; calculations = [`Libros: ${a} y ${b}`, `${a} + ${b} = ${result}`];
      } else if (t.variant === 1) {
        text = `${intro} reciben ${b} ${b === 1n ? 'libro' : 'libros'}. Después de recibirlos tienen ${a + b} libros. ¿Cuántos libros tenían antes?`;
        result = a; steps = ['Buscamos la cantidad que había antes de la llegada.', 'Quitamos del total los libros recibidos.']; calculations = [`Total: ${a + b}; recibidos: ${b}`, `${a + b} − ${b} = ${a}`];
      } else if (t.variant === 2) {
        text = `${intro} preparan ${small} cajas con ${a} ${a === 1n ? 'libro' : 'libros'} en cada caja. Primero quieren saber cuántos libros reúnen. ¿Cuántos libros hay entre todas las cajas?`;
        result = a * small; steps = ['Cada caja tiene la misma cantidad.', 'Calculamos el total de las cajas.']; calculations = [`${small} cajas de ${a}`, `${small} × ${a} = ${result}`];
        const secondText = `${intro} tenían ${small} cajas con ${a} ${a === 1n ? 'libro' : 'libros'} cada una: en total, ${result} libros. Entregan ${a} ${a === 1n ? 'libro' : 'libros'} a otra clase. Segunda pregunta: ¿cuántos libros quedan?`;
        followUp = { text: secondText, result: result - a, steps: ['Partimos del total calculado en la pregunta anterior.', 'Restamos los libros entregados.'], calculations: [`Total anterior: ${result}`, `${result} − ${a} = ${result - a}`] };
      } else {
        const reserved = a < b ? a : b;
        text = `${intro} cuentan ${a + b} libros. Apartan ${reserved} para una exposición. El resto se reparte entre ${small} mesas, pero la pregunta es solo por la reserva: ¿cuántos libros han apartado para la exposición?`;
        result = reserved; steps = ['La pregunta pide la reserva, no un reparto.', 'El enunciado ya indica cuántos libros se apartan.']; calculations = [`Reserva: ${reserved}`, `Respuesta = ${reserved}`];
      }
    } else if (t.family === 'geometria') {
      ({text, compactText, result, unit, steps, calculations, diagram} = root.NinjaGeometry.build(t, cfg, rng));
    } else if (t.family === 'compras') {
      unit = 'euros';
      const cents = cfg._newDecimals ? BigInt(pick(rng, 1, 99)) : 0n, price = a * 100n + cents, cost = price * small, paid = cost + b * 100n;
      if (t.variant === 0) { result = cost; text = `${intro} compran ${small} cuadernos a ${decimal(price, 100n)} euros cada uno. ¿Cuánto cuestan en total, en euros?`; calculations = [`Precio: ${decimal(price, 100n)} €`, `${decimal(price, 100n)} × ${small} = ${decimal(result, 100n)}`]; steps = ['Cada cuaderno cuesta lo mismo.', 'Calculamos el coste de todos los cuadernos.']; }
      if (t.variant === 1) { result = b * 100n; text = `${intro} una compra cuesta ${decimal(cost, 100n)} euros y pagan con ${decimal(paid, 100n)} euros. ¿Cuánto cambio deben recibir, en euros?`; calculations = [`Pagado: ${decimal(paid, 100n)}; coste: ${decimal(cost, 100n)}`, `${decimal(paid, 100n)} − ${decimal(cost, 100n)} = ${decimal(result, 100n)}`]; steps = ['El cambio es la parte del pago que sobra.', 'Restamos el coste al dinero entregado.']; }
      if (t.variant === 2) { const saving = BigInt(pick(rng, 1, Number(price > 100n ? 99n : price - 1n))); result = saving * small; text = `${intro} necesitan ${small} cuadernos. En una tienda cada cuaderno cuesta ${decimal(price, 100n)} euros; en otra cuesta ${decimal(price - saving, 100n)} euros. ¿Cuántos euros ahorran en total si compran todos en la segunda tienda?`; calculations = [`${decimal(price, 100n)} − ${decimal(price - saving, 100n)} = ${decimal(saving, 100n)}`, `${decimal(saving, 100n)} × ${small} = ${decimal(result, 100n)}`]; steps = ['Calculamos el ahorro por cuaderno.', 'Calculamos el ahorro por todos los cuadernos.']; if (!cfg._newDecimals) { const extra = b * 100n; result = extra * small; text = `${intro} necesitan ${small} cuadernos. En una tienda cada cuaderno cuesta ${a + b} euros; en otra cuesta ${a} euros. ¿Cuántos euros ahorran en total en la segunda tienda?`; calculations = [`${a + b} − ${a} = ${b}`, `${b} × ${small} = ${b * small}`]; } }
      if (t.variant === 3) { result = b * 100n; text = `${intro} tienen ${decimal(paid, 100n)} euros de presupuesto. Compran ${small} cuadernos a ${decimal(price, 100n)} euros cada uno. ¿Cuántos euros les quedan?`; calculations = [`${decimal(price, 100n)} × ${small} = ${decimal(cost, 100n)}`, `${decimal(paid, 100n)} − ${decimal(cost, 100n)} = ${decimal(result, 100n)}`]; steps = ['Calculamos cuánto gastan.', 'Restamos el gasto al presupuesto.']; }
      result = exact(result, 100n);
    } else {
      const factor = small, rate = a, old = b, newer = b * factor;
      if (t.variant === 0) { unit = 'gramos'; result = rate * newer; text = `${intro} una receta ${rate > 250n ? 'para varias comidas de' : 'para'} ${old} personas necesita ${rate * old} gramos de ${rate < 10n ? 'especias' : 'arroz'}. Preparan la misma cantidad por persona para ${newer} personas. ¿Cuántos gramos necesitan?`; }
      if (t.variant === 1) { unit = 'euros'; result = rate * newer; text = `${intro} ${old} entradas cuestan ${rate * old} euros. Todas las entradas tienen el mismo precio. ¿Cuánto cuestan ${newer} entradas, en euros?`; }
      if (t.variant === 2) { unit = 'centímetros'; result = rate * small; text = `${intro} trabajan con un plano en el que cada centímetro representa ${rate} centímetros reales. Una distancia mide ${small} centímetros en el plano. ¿Cuántos centímetros representa en la realidad?`; }
      if (t.variant === 3) { unit = 'botellas'; result = rate * newer; text = `${intro} preparan ${rate * old} botellas para ${old} equipos, la misma cantidad para cada uno. ¿Cuántas botellas necesitarán para ${newer} equipos manteniendo esa cantidad por equipo?`; }
      steps = t.variant === 2 ? ['Identificamos la equivalencia de la escala.', 'Aplicamos esa equivalencia a toda la distancia.'] : ['Calculamos la cantidad para una persona, entrada o equipo.', 'Multiplicamos por la nueva cantidad.'];
      calculations = [t.variant === 2 ? `1 cm en el plano = ${rate} cm reales` : `${rate * old} ÷ ${old} = ${rate}`, `${rate} × ${t.variant === 2 ? small : newer} = ${result}`];
    }
    const create = (question, value, reasons, equations, suffix = '') => {
      const fraction = typeof value === 'object' ? value : exact(value), answerDisplay = decimal(fraction.numerator, fraction.denominator);
      return { kind: 'problem', expression: question, answer: Number(fraction.numerator) / Number(fraction.denominator), answerFraction: fraction, answerDisplay,
        problem: { templateId: t.id + suffix, title: t.title, family: t.family, category: t.family, categories: [t.family], difficulty: 'media', text: question, compactText: compactText || question, steps: reasons, calculations: equations, unit, diagram },
        signature: `problem:${t.id}:${a}:${b}:${small}${suffix}` };
    };
    if (t.family === 'compras' && a + b > 30n) { text = text.replace(/cuadernos/g, 'lotes de material escolar').replace(/cuaderno/g, 'lote'); steps = steps.map(s => s.replace(/cuadernos/g, 'lotes').replace(/cuaderno/g, 'lote')); }
    const op = create(text, result, steps, calculations);
    if (followUp) op.followUp = create(followUp.text, followUp.result, followUp.steps, followUp.calculations, '-segunda');
    return op;
  }
  function generate(settings, index, seed, options = {}) {
    const cfg = normalize(settings);
    if (!families[cfg._family]) return previous.generate(cfg, index, seed, options);
    const pool = compatible(cfg, options), rng = random(seed);
    if (!pool.length) throw Error('Selecciona una variedad de problema.');
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    return buildProblem(pool[index % pool.length], cfg, random(Number(seed) + index * 9973));
  }
  Object.assign(engine, { normalize, compatible, generate });
  root.NinjaExpansion = { newCalculation, families, bank, buildProblem };
  if (typeof module !== 'undefined') module.exports = root.NinjaExpansion;
}(globalThis));
