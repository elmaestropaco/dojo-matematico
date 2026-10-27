(function (root) {
  const ops = ['suma', 'resta', 'multiplicacion', 'division'];
  const gcd = (a, b) => { a = BigInt(a); b = BigInt(b); while (b) [a, b] = [b, a % b]; return a < 0n ? -a : a; };
  const lcm = (a, b) => { a = BigInt(a); b = BigInt(b); return a && b ? a / gcd(a, b) * b : 0n; };
  const fold = (values, kind) => values.map(BigInt).reduce(kind === 'mcm' ? lcm : gcd);
  const fraction = (n, d = 1n) => {
    n = BigInt(n); d = BigInt(d);
    if (!d) throw Error('El denominador no puede ser cero.');
    if (d < 0n) { n = -n; d = -d; }
    const g = gcd(n, d);
    return { numerator: String(n / g), denominator: String(d / g) };
  };
  function calculate(a, op, b) {
    const n = BigInt(a.numerator), d = BigInt(a.denominator), m = BigInt(b.numerator), e = BigInt(b.denominator);
    if (op === 'suma') return fraction(n * e + m * d, d * e);
    if (op === 'resta') return fraction(n * e - m * d, d * e);
    if (op === 'multiplicacion') return fraction(n * m, d * e);
    return fraction(n * e, d * m);
  }
  const textFraction = f => f.denominator === '1' ? f.numerator : `${f.numerator}/${f.denominator}`;
  const digits = (n, fallback = 1) => Math.max(1, Math.min(3, Math.trunc(Number(n)) || fallback));
  function random(seed) {
    let x = Number(seed) >>> 0;
    return () => { x += 0x6D2B79F5; let t = Math.imul(x ^ (x >>> 15), x | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  function numbers(places, count, rng = Math.random, excluded = []) {
    const min = 10 ** (digits(places) - 1), max = 10 ** digits(places) - 1;
    const values = new Set();
    while (values.size < count) {
      const n = min + Math.floor(rng() * (max - min + 1));
      if (!excluded.includes(n)) values.add(n);
    }
    return [...values];
  }
  function generateNumberTheory(kind, cfg = {}, rng = Math.random) {
    const values = numbers(cfg.digits, Math.max(2, Math.min(4, Math.trunc(Number(cfg.count)) || 2)), rng);
    const answerExact = String(fold(values, kind));
    return { kind, expression: `${kind.toUpperCase()} (${values.join(', ')})`, values, answer: Number(answerExact), answerExact, signature: `${kind}:${values.join(':')}` };
  }
  function factorization(value) {
    let n = BigInt(value); const parts = [];
    for (let p = 2n; p * p <= n; p++) while (n % p === 0n) { parts.push(String(p)); n /= p; }
    if (n > 1n) parts.push(String(n));
    return parts.join(' × ') || '1';
  }
  function theorySteps(values, kind) {
    const lines = values.map(n => `${n} = ${factorization(n)}`);
    lines.push(kind === 'mcm' ? 'Elegimos todos los factores primos con su mayor exponente.' : 'Elegimos solo los factores primos comunes con su menor exponente. Si no hay factores comunes, el MCD es 1.');
    return [`Descomponemos cada número: ${lines.slice(0, -1).join('; ')}.`, `Calculamos el ${kind.toUpperCase()}: ${lines.at(-1)} ${kind.toUpperCase()} = ${fold(values, kind)}.`];
  }
  const engine = root.NinjaProblems;
  const baseNormalize = engine.normalize, baseCompatible = engine.compatible, baseGenerate = engine.generate;
  function normalize(settings = {}) {
    return { ...baseNormalize(settings),
      _family: ['fracciones', 'mcmMcd'].includes(settings._family) ? settings._family : 'enteros',
      _fractionNumerator: digits(settings._fractionNumerator), _fractionDenominator: digits(settings._fractionDenominator),
      _theoryDigits: digits(settings._theoryDigits, 2), _theoryCount: Math.max(2, Math.min(4, Math.trunc(Number(settings._theoryCount)) || 2)),
      _mcmEnabled: settings._mcmEnabled !== false, _mcdEnabled: settings._mcdEnabled !== false
    };
  }
  function compatible(settings, options = {}) {
    const cfg = normalize(settings);
    if (cfg._family === 'enteros') return baseCompatible(cfg, options);
    const selected = cfg._family === 'fracciones' ? ops.filter(k => cfg[k].enabled) : ['mcm', 'mcd'].filter(k => cfg[`_${k}Enabled`]);
    const mix = ['combinados', 'mixto'].includes(options.mix) ? options.mix : 'individuales';
    return (root.NinjaAdvancedProblemBank?.plantillas || []).filter(t => t.family === cfg._family && t.categories.every(k => selected.includes(k)) &&
      (t.categories.length === 1 ? mix !== 'combinados' : mix !== 'individuales' && t.categories.length === selected.length));
  }
  function generateFractionProblem(t, cfg, rng) {
    const singularUnit = t.scene.unit.replace(/^(litros|kilos|metros)/, word => ({ litros: 'litro', kilos: 'kilo', metros: 'metro' })[word]);
    const quantity = f => `${textFraction(f)} ${f.denominator === '1' ? f.numerator === '1' ? singularUnit : t.scene.unit : 'de ' + singularUnit}`;
    const pickFraction = () => {
      const pick = d => 10 ** (d - 1) + Math.floor(rng() * (9 * 10 ** (d - 1)));
      // Keep the written operands unsimplified so the requested digit counts remain visible.
      return { numerator: String(pick(cfg._fractionNumerator)), denominator: String(pick(cfg._fractionDenominator)) };
    };
    let operands, result, calculations, reasons;
    for (let attempt = 0; attempt < 20000; attempt++) {
      operands = [pickFraction()]; result = operands[0]; calculations = []; reasons = [];
      let valid = true;
      for (const op of t.order) {
        const b = pickFraction(), before = result;
        result = calculate(result, op, b);
        if (BigInt(result.numerator) < 0n) { valid = false; break; }
        operands.push(b);
        const symbol = { suma: '+', resta: '−', multiplicacion: '×', division: '÷' }[op];
        let reason = op === 'suma' || op === 'resta' ? 'Buscamos un denominador común y operamos los numeradores' : op === 'multiplicacion' ? 'Multiplicamos numeradores y denominadores' : 'Multiplicamos por la fracción inversa del divisor';
        const n = BigInt(before.numerator), d = BigInt(before.denominator), m = BigInt(b.numerator), e = BigInt(b.denominator);
        const common = lcm(d, e);
        const rawN = op === 'suma' ? n * (common / d) + m * (common / e) : op === 'resta' ? n * (common / d) - m * (common / e) : op === 'multiplicacion' ? n * m : n * e;
        const rawD = ['suma', 'resta'].includes(op) ? common : op === 'multiplicacion' ? d * e : d * m;
        reasons.push(`${reason}: ${textFraction(before)} ${symbol} ${textFraction(b)} = ${rawN}/${rawD}. Simplificamos: ${textFraction(result)}.`);
        calculations.push(`${textFraction(before)} ${symbol} ${textFraction(b)} = ${rawN}/${rawD} = ${textFraction(result)}`);
      }
      if (valid && textFraction(result).length <= 29) break;
      result = null;
    }
    if (!result) throw Error('No se ha podido generar un problema de fracciones con estos ajustes.');
    const a = operands[0];
    let text = `${t.scene.intro} hay ${quantity(a)}.`;
    let compact = `Hay ${quantity(a)}.`;
    t.order.forEach((op, i) => {
      const b = textFraction(operands[i + 1]);
      const sentence = op === 'suma' ? ` Añaden ${quantity(operands[i + 1])} más.` : op === 'resta' ? ` Utilizan ${quantity(operands[i + 1])}.` : op === 'multiplicacion' ? ` Para la siguiente actividad preparan una cantidad igual a ${b} veces la cantidad anterior.` : ` La cantidad calculada representa ${b} de lo necesario; averiguan la cantidad necesaria.`;
      text += sentence;
      compact += op === 'suma' ? ` Añaden ${b} más.` : op === 'resta' ? ` Utilizan ${b}.` : op === 'multiplicacion' ? ` Después preparan ${b} veces esa cantidad.` : ` Lo calculado es ${b} de lo necesario.`;
    });
    const question = ` ¿Qué cantidad, en ${t.scene.unit}, resulta al terminar?`;
    return { kind: 'problem', expression: text + question, answer: Number(result.numerator) / Number(result.denominator), answerFraction: result,
      problem: { templateId: t.id, title: t.title, family: t.family, category: t.categories[0], categories: t.categories, difficulty: t.order.length > 1 ? 'avanzada' : 'facil', text: text + question, compactText: compact + ` ¿Cuál es la cantidad final, en ${t.scene.unit}?`, steps: reasons, calculations, unit: result.numerator === result.denominator ? singularUnit : t.scene.unit, values: operands },
      signature: `problem:${t.id}:${operands.map(textFraction).join(':')}` };
  }
  function generateTheoryProblem(t, cfg, rng) {
    const min = 10 ** (cfg._theoryDigits - 1), max = 10 ** cfg._theoryDigits - 1;
    // Related periods avoid stories with a first reunion billions of minutes away.
    const target = [12, 18, 24, 36, 48, 60, 72][Math.floor(rng() * 7)] * min;
    const common = 1 + Math.floor(rng() * Math.floor((max - min + 1) / cfg._theoryCount));
    const candidates = [];
    for (let n = min; n <= max; n++) if (t.categories.includes('mcm') ? target % n === 0 : n % common === 0) candidates.push(n);
    for (let i = candidates.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [candidates[i], candidates[j]] = [candidates[j], candidates[i]]; }
    const a = candidates.slice(0, cfg._theoryCount);
    if (a.length !== cfg._theoryCount) throw Error('No hay suficientes datos distintos con estas cifras.');
    const joined = a.join(', '), steps = [], calculations = [];
    const ordinals = ['primera', 'segunda', 'tercera', 'cuarta'];
    const describe = (values, sentence) => values.map((value, index) => sentence(value, ordinals[index])).join(' ');
    const activities = describe(a, (n, order) => `La ${order} actividad se repite cada ${n} minutos.`);
    const collections = values => describe(values, (n, order) => `La ${order} colección tiene ${n} tarjetas.`);
    const list = values => values.length === 1 ? values[0] : values.slice(0, -1).join(', ') + ' y ' + values.at(-1);
    const periods = list(a.map(n => `${n} min`));
    const cards = values => list(values.map(n => `${n} tarjetas`));
    let answer, text, compactText, values = a, unit;
    if (t.categories.length > 1) {
      const time = fold(a, 'mcm'), b = numbers(cfg._theoryDigits, cfg._theoryCount - 1, rng, [Number(time)]);
      const quantities = [time, ...b]; answer = fold(quantities, 'mcd'); values = [...a, ...b];
      text = `${t.scene.intro} organizan ${a.length} actividades. ${activities} Todas empiezan juntas. Hasta que vuelvan a coincidir, una máquina prepara una tarjeta por minuto. Tienen también otras colecciones. ${collections(b)} Reparten por igual las tarjetas de cada colección, incluida la de la máquina, en sobres. Todas deben dar el mismo número de sobres, el máximo posible y sin sobras. ¿Cuántos sobres pueden hacer de cada colección?`;
      compactText = `Las actividades se repiten cada ${periods} y coinciden ahora. Una máquina hace una tarjeta por minuto hasta el reencuentro. Esa colección y otras de ${cards(b)} se reparten por igual en el máximo número común de sobres, sin sobras. ¿Cuántos sobres por colección?`;
      steps.push(...theorySteps(a, 'mcm'), `Al cabo de ${time} minutos, la máquina ha preparado ${time} tarjetas.`, ...theorySteps(quantities, 'mcd'));
      calculations.push(a.map(n => `${n} = ${factorization(n)}`).join('; '), `MCM (${joined}) = ${time}`, `Tarjetas = ${time}`, quantities.map(n => `${n} = ${factorization(n)}`).join('; '), `MCD (${quantities.join(', ')}) = ${answer}`);
    } else if (t.categories[0] === 'mcm') {
      answer = fold(a, 'mcm');
      text = `${t.scene.intro} organizan ${a.length} actividades. ${activities} Todas empiezan ahora al mismo tiempo. ¿Cuántos minutos pasarán hasta que vuelvan a coincidir por primera vez?`;
      compactText = `Las actividades se repiten cada ${periods}. Coinciden ahora. ¿Cuántos minutos pasarán hasta que vuelvan a coincidir?`;
      steps.push(...theorySteps(a, 'mcm')); calculations.push(...steps.map((_, i) => i ? `MCM (${joined}) = ${answer}` : a.map(n => `${n} = ${factorization(n)}`).join('; ')));
    } else {
      answer = fold(a, 'mcd');
      text = `${t.scene.intro} han preparado ${a.length} colecciones de tarjetas. ${collections(a)} Quieren repartir cada colección por igual en sobres. Cada colección debe dar el mismo número de sobres, el máximo posible, y no puede sobrar ninguna tarjeta. ¿Cuántos sobres pueden preparar de cada colección?`;
      compactText = `Tienen colecciones de ${cards(a)}. Reparten cada una por igual en el máximo número de sobres, el mismo para todas y sin sobras. ¿Cuántos sobres por colección?`;
      steps.push(...theorySteps(a, 'mcd')); calculations.push(...steps.map((_, i) => i ? `MCD (${joined}) = ${answer}` : a.map(n => `${n} = ${factorization(n)}`).join('; ')));
    }
    if (t.categories.length === 1 && t.variant === 1) {
      unit = 'centímetros';
      if (t.categories[0] === 'mcm') {
        const strips = describe(a, (n, order) => `Para la ${order} tira usan piezas de ${n} cm de largo.`);
        text = `${t.scene.intro} preparan ${a.length} tiras decorativas. ${strips} En cada tira unen piezas de la medida indicada, una detrás de otra y sin cortarlas. Quieren que todas las tiras midan lo mismo. ¿Cuál es la menor longitud posible de cada tira, en centímetros?`;
        compactText = `Hacen tiras uniendo piezas sin cortarlas: ${a.map((n,i) => `${i ? 'otra' : 'una'} usa piezas de ${n} cm`).join('; ')}. ¿Cuál es la menor longitud común de todas las tiras, en cm?`;
      } else {
        const ribbons = describe(a, (n, order) => `La ${order} cinta mide ${n} cm de largo.`);
        text = `${t.scene.intro} tienen ${a.length} cintas. ${ribbons} Quieren cortarlas en trozos iguales, lo más largos posible, sin desperdiciar nada. ¿Cuántos centímetros debe medir cada trozo?`;
        compactText = `Tienen cintas de ${list(a.map(n => `${n} cm de largo`))}. Las cortan en trozos iguales, lo más largos posible y sin sobras. ¿Cuántos centímetros mide cada trozo?`;
      }
    } else if (t.categories.length === 1 && t.variant === 2) {
      if (t.categories[0] === 'mcm') {
        unit = 'pegatinas por tipo';
        const packs = describe(a, (n, order) => `Las pegatinas de la ${order} clase vienen en paquetes de ${n} unidades.`);
        text = `${t.scene.intro} compran ${a.length} clases de pegatinas. ${packs} Quieren tener la misma cantidad de cada clase, comprando paquetes completos. ¿Cuál es la menor cantidad de pegatinas de cada clase que pueden comprar?`;
        compactText = `Cada clase de pegatinas tiene paquetes distintos: ${list(a.map(n => `${n} unidades por paquete`))}. Compran paquetes enteros hasta tener la misma cantidad de cada clase. ¿Cuál es la menor cantidad por clase?`;
      } else {
        unit = 'alumnos por equipo';
        const groups = describe(a, (n, order) => `La ${order} escuela participa con ${n} alumnos.`);
        text = `${t.scene.intro} organizan un torneo entre ${a.length} escuelas. ${groups} Cada escuela forma equipos sin mezclar alumnos con otras escuelas ni dejar a nadie fuera. Todos los equipos deben tener el mismo tamaño. ¿Cuál es el mayor número posible de alumnos por equipo?`;
        compactText = `Participan escuelas con ${list(a.map(n => `${n} alumnos`))}. Forman equipos sin mezclar escuelas ni dejar a nadie fuera. ¿Cuál es el mayor número de alumnos por equipo, igual para todos?`;
      }
    }
    const answerExact = String(answer);
    return { kind: 'problem', expression: text, answer: Number(answer), answerExact,
      problem: { templateId: t.id, title: t.title, family: t.family, category: t.categories[0], categories: t.categories, difficulty: t.categories.length > 1 ? 'avanzada' : 'media', text, compactText, steps, calculations, unit: unit || (t.categories.length === 1 && t.categories[0] === 'mcm' ? 'minutos' : 'sobres'), values: values.map(String) },
      signature: `problem:${t.id}:${values.join(':')}` };
  }
  function generate(settings, index, seed, options = {}) {
    const cfg = normalize(settings);
    if (cfg._family === 'enteros') return baseGenerate(cfg, index, seed, options);
    const pool = compatible(cfg, options), shuffle = random(seed);
    if (!pool.length) throw Error('Selecciona tipos compatibles. Para combinar necesitas al menos dos.');
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(shuffle() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    const t = pool[index % pool.length], rng = random(Number(seed) + index * 9973);
    return cfg._family === 'fracciones' ? generateFractionProblem(t, cfg, rng) : generateTheoryProblem(t, cfg, rng);
  }
  Object.assign(engine, { normalize, compatible, generate });
  root.NinjaMathExtra = { gcd, lcm, fold, fraction, calculate, generateNumberTheory, factorization, theorySteps, numbers };
  if (typeof module !== 'undefined') module.exports = root.NinjaMathExtra;
}(globalThis));
