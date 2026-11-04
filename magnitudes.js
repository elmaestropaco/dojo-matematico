(function (root) {
  const unit = (symbol, singular, plural, factor) => ({ symbol, singular, plural, factor: String(factor) });
  const units = {
    longitud: [unit('km', 'kilómetro', 'kilómetros', 1000000), unit('hm', 'hectómetro', 'hectómetros', 100000), unit('dam', 'decámetro', 'decámetros', 10000), unit('m', 'metro', 'metros', 1000), unit('dm', 'decímetro', 'decímetros', 100), unit('cm', 'centímetro', 'centímetros', 10), unit('mm', 'milímetro', 'milímetros', 1)],
    masa: [unit('kg', 'kilogramo', 'kilogramos', 1000000), unit('hg', 'hectogramo', 'hectogramos', 100000), unit('dag', 'decagramo', 'decagramos', 10000), unit('g', 'gramo', 'gramos', 1000), unit('dg', 'decigramo', 'decigramos', 100), unit('cg', 'centigramo', 'centigramos', 10), unit('mg', 'miligramo', 'miligramos', 1)],
    capacidad: [unit('kL', 'kilolitro', 'kilolitros', 1000000), unit('hL', 'hectolitro', 'hectolitros', 100000), unit('daL', 'decalitro', 'decalitros', 10000), unit('L', 'litro', 'litros', 1000), unit('dL', 'decilitro', 'decilitros', 100), unit('cL', 'centilitro', 'centilitros', 10), unit('mL', 'mililitro', 'mililitros', 1)],
    tiempo: [unit('sem', 'semana', 'semanas', 604800), unit('d', 'día', 'días', 86400), unit('h', 'hora', 'horas', 3600), unit('min', 'minuto', 'minutos', 60), unit('s', 'segundo', 'segundos', 1)]
  };
  const basic = { longitud: ['km', 'm', 'cm'], masa: ['kg', 'g'], capacidad: ['L', 'mL'], tiempo: ['h', 'min', 's'] };
  const kinds = { convertLength: 'longitud', convertMass: 'masa', convertCapacity: 'capacidad', convertTime: 'tiempo' };
  const labels = { longitud: 'Longitud', masa: 'Masa', capacidad: 'Capacidad', tiempo: 'Tiempo' };
  const arithmetic = ['suma', 'resta', 'multiplicacion', 'division'];
  const clamp = (v, low, high, fallback) => Number.isFinite(Number(v)) ? Math.max(low, Math.min(high, Math.trunc(Number(v)))) : fallback;
  const gcd = (a, b) => { while (b) [a, b] = [b, a % b]; return a; };
  const rational = (n, d = 1n) => { const g = gcd(n < 0n ? -n : n, d); return { numerator: String(n / g), denominator: String(d / g) }; };
  function decimal(value) {
    let n = BigInt(value.numerator), d = BigInt(value.denominator), remainder = n % d, tail = '';
    const whole = n / d;
    while (remainder) { remainder *= 10n; tail += remainder / d; remainder %= d; if (tail.length > 3) throw Error('La conversión necesita más de tres decimales o no es exacta.'); }
    return String(whole) + (tail ? ',' + tail : '');
  }
  const fits = (f, places) => BigInt(f.numerator) * 10n ** BigInt(places) % BigInt(f.denominator) === 0n;
  function convert(value, from, to) {
    return rational(BigInt(value.numerator) * BigInt(from.factor), BigInt(value.denominator) * BigInt(to.factor));
  }
  function normalizeConversion(cfg = {}, kind = 'longitud') {
    const limit = units[kind].length;
    return { digits: clamp(cfg.digits, 1, 9, 2), minDigits: clamp(cfg.minDigits ?? cfg.digits, 1, 9, 2), maxDigits: clamp(cfg.maxDigits ?? cfg.digits, 1, 9, 2),
      from: clamp(cfg.from, 0, limit, 0), to: clamp(cfg.to, 0, limit, 0), basic: cfg.basic === true };
  }
  function pairs(kind, cfg = {}, places = 0) {
    const c = normalizeConversion(cfg, kind), list = units[kind];
    const min = 10n ** BigInt(c.minDigits - 1), max = 10n ** BigInt(Math.max(c.minDigits, c.maxDigits)) - 1n;
    const choices = [];
    for (let i = 0; i < list.length; i++) for (let j = 0; j < list.length; j++) {
      if (i === j || (c.from && c.from !== i + 1) || (c.to && c.to !== j + 1)) continue;
      if (c.basic && (!basic[kind].includes(list[i].symbol) || !basic[kind].includes(list[j].symbol))) continue;
      const ratio = rational(BigInt(list[i].factor), BigInt(list[j].factor));
      const d = BigInt(ratio.denominator), multiple = d / gcd(d, 10n ** BigInt(places));
      const first = (min + multiple - 1n) / multiple * multiple;
      if (first <= max) choices.push({ from: list[i], to: list[j], first, multiple, count: (max - first) / multiple + 1n });
    }
    return choices;
  }
  function generateConversion(kind, cfg = {}, places = 0, rng = Math.random) {
    const pool = pairs(kind, cfg, places);
    if (!pool.length) throw Error('No hay conversiones exactas con esas unidades, cifras y decimales. Cambia las unidades, aumenta las cifras o permite decimales.');
    const pair = pool[Math.floor(rng() * pool.length)];
    const initial = pair.first + BigInt(Math.floor(rng() * Number(pair.count))) * pair.multiple;
    const answerFraction = convert(rational(initial), pair.from, pair.to), answerDisplay = decimal(answerFraction);
    const fromFactor = BigInt(pair.from.factor), toFactor = BigInt(pair.to.factor);
    const multiplier = fromFactor >= toFactor ? fromFactor / toFactor : toFactor / fromFactor;
    const equation = `${initial} ${fromFactor >= toFactor ? '×' : '÷'} ${multiplier} = ${answerDisplay} ${pair.to.symbol}`;
    const equivalence = fromFactor >= toFactor ? `1 ${pair.from.symbol} = ${multiplier} ${pair.to.symbol}` : `${multiplier} ${pair.from.symbol} = 1 ${pair.to.symbol}`;
    return { kind: Object.keys(kinds).find(k => kinds[k] === kind), expression: `${initial} ${pair.from.symbol} → ${pair.to.symbol}`,
      answer: Number(answerFraction.numerator) / Number(answerFraction.denominator), answerFraction, answerDisplay,
      conversion: { family: kind, initial: String(initial), from: pair.from.symbol, to: pair.to.symbol, equation, equivalence, decimalPlaces: places },
      signature: `conversion:${kind}:${initial}:${pair.from.symbol}:${pair.to.symbol}` };
  }
  function random(seed) {
    let x = Number(seed) >>> 0;
    return () => { x += 0x6D2B79F5; let t = Math.imul(x ^ (x >>> 15), x | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const engine = root.NinjaProblems;
  const previous = { normalize: engine.normalize, compatible: engine.compatible, generate: engine.generate };
  function normalize(settings = {}) {
    const base = previous.normalize(settings), low = clamp(settings._measureMinDigits, 1, 9, 2);
    return { ...base, _family: settings._family === 'medidas' ? 'medidas' : base._family,
      _measureMinDigits: low, _measureMaxDigits: Math.max(low, clamp(settings._measureMaxDigits, 1, 9, low)),
      _measureDecimals: settings._measureDecimals === true, _measurePlaces: clamp(settings._measurePlaces, 1, 3, 2),
      ...Object.fromEntries(Object.keys(units).flatMap(k => [[`_measure_${k}`, settings[`_measure_${k}`] !== false], [`_measure_${k}From`, clamp(settings[`_measure_${k}From`], 0, units[k].length, 0)], [`_measure_${k}To`, clamp(settings[`_measure_${k}To`], 0, units[k].length, 0)]])),
      ...Object.fromEntries(arithmetic.map(k => [`_measure_${k}`, settings[`_measure_${k}`] === true])) };
  }
  const settingsFor = (cfg, kind) => ({ minDigits: cfg._measureMinDigits, maxDigits: cfg._measureMaxDigits, from: cfg[`_measure_${kind}From`], to: cfg[`_measure_${kind}To`] });
  function compatible(settings, options = {}) {
    const cfg = normalize(settings);
    if (cfg._family !== 'medidas') return previous.compatible(cfg, options);
    const selected = arithmetic.filter(k => cfg[`_measure_${k}`]), places = cfg._measureDecimals ? cfg._measurePlaces : 0;
    const mix = ['combinados', 'mixto'].includes(options.mix) ? options.mix : 'individuales';
    const selectedKinds = Object.keys(units).filter(k => cfg[`_measure_${k}`]);
    if (selectedKinds.some(k => !pairs(k, settingsFor(cfg, k), places).length)) return [];
    const allowed = new Set(selectedKinds);
    return (root.NinjaMeasureProblemBank?.plantillas || []).flatMap(t => {
      if (!allowed.has(t.type)) return [];
      const variants = [];
      if (mix !== 'combinados') variants.push({ ...t, categories: [t.type], order: [] });
      if (mix !== 'individuales' && selected.length) variants.push({ ...t, id: `${t.id}-${selected.join('-')}`, categories: [t.type, ...selected], order: selected });
      return variants;
    });
  }
  function generateProblem(t, cfg, rng) {
    const places = cfg._measureDecimals ? cfg._measurePlaces : 0, scale = 10n ** BigInt(places);
    for (let attempt = 0; attempt < 500; attempt++) {
      const conversion = generateConversion(t.type, settingsFor(cfg, t.type), places, rng);
      const from = units[t.type].find(u => u.symbol === conversion.conversion.from), to = units[t.type].find(u => u.symbol === conversion.conversion.to);
      const quantity = (value, u) => `${value} ${value === '1' ? u.singular : u.plural}`;
      const initialQuantity = quantity(conversion.conversion.initial, from);
      const starts = {
        longitud: `${t.scene.intro} preparan una cinta de ${initialQuantity} para decorar.`,
        masa: `${t.scene.intro} reúnen ${initialQuantity} de papel para una actividad de reciclaje.`,
        capacidad: `${t.scene.intro} tienen ${initialQuantity} de agua para una actividad.`,
        tiempo: `${t.scene.intro} reservan ${initialQuantity} para una actividad del grupo.`
      };
      const physical = BigInt(conversion.conversion.initial) * BigInt(from.factor);
      const large = physical > ({ longitud: 10000000n, masa: 1000000000n, capacidad: 1000000000n, tiempo: 1000000n })[t.type];
      if (large) starts[t.type] = `${t.scene.intro} estudian datos acumulados de una red de centros: ${initialQuantity} ${t.type === 'longitud' ? 'de cinta utilizada' : t.type === 'masa' ? 'de papel recogido' : t.type === 'capacidad' ? 'de agua reservada' : 'de uso conjunto de sus equipos'}.`;
      const compactStarts = { longitud: `La cinta mide ${initialQuantity}.`, masa: `Tienen ${initialQuantity} de papel.`, capacidad: `Tienen ${initialQuantity} de agua.`, tiempo: `Disponen de ${initialQuantity} para una actividad.` };
      if (large) compactStarts[t.type] = `${{ longitud: 'Longitud conjunta de cintas', masa: 'Total de papel recogido', capacidad: 'Reserva conjunta de agua', tiempo: 'Tiempo conjunto de uso de equipos' }[t.type]}: ${initialQuantity}.`;
      let total = BigInt(conversion.answerFraction.numerator) * scale / BigInt(conversion.answerFraction.denominator);
      const steps = [`Convertimos a ${to.plural} usando ${conversion.conversion.equivalence}: ${conversion.conversion.equation}.`], calculations = [conversion.conversion.equation], extras = [], compactExtras = [], operands = [];
      let valid = true;
      for (const op of t.order) {
        const before = total;
        let operand;
        if (op === 'suma') {
          operand = BigInt(1 + Math.floor(rng() * 9)) * scale; total += operand;
        } else if (op === 'resta') {
          if (total <= 1n) { valid = false; break; }
          operand = 1n + BigInt(Math.floor(rng() * Number(total - 1n < scale * 9n ? total - 1n : scale * 9n))); total -= operand;
        } else if (op === 'multiplicacion') {
          operand = BigInt(2 + Math.floor(rng() * 4)); total *= operand;
        } else {
          const divisors = [2n, 3n, 4n, 5n, 6n, 7n, 8n, 9n].filter(d => total % d === 0n);
          if (!divisors.length) { valid = false; break; }
          operand = divisors[Math.floor(rng() * divisors.length)]; total /= operand;
        }
        const b = ['suma', 'resta'].includes(op) ? decimal(rational(operand, scale)) : String(operand);
        const q = quantity(b, to), description = {
          longitud: { suma: `Unen otra cinta de ${q}.`, resta: `Cortan y retiran ${q} de cinta.`, multiplicacion: `Usan esa longitud como medida de un tramo y forman una tira con ${b} tramos iguales.`, division: `Dividen la tira en ${b} partes iguales.` },
          masa: { suma: `Añaden ${q} de papel.`, resta: `Retiran ${q} de papel.`, multiplicacion: `Para otro grupo preparan ${b} bolsas, con la cantidad calculada en cada una, y reúnen su contenido.`, division: `Reparten el papel por igual en ${b} bolsas.` },
          capacidad: { suma: `Añaden ${q} de agua.`, resta: `Utilizan ${q} de agua.`, multiplicacion: `Preparan una nueva reserva para ${b} recipientes, con la cantidad calculada en cada uno.`, division: `Reparten el agua por igual en ${b} recipientes.` },
          tiempo: { suma: `Amplían el tiempo disponible en ${q}.`, resta: `Restan ${q} por una pausa.`, multiplicacion: `Planifican ${b} actividades de esa duración y calculan el tiempo de todas juntas.`, division: `Reparten el tiempo por igual entre ${b} turnos.` }
        }[t.type][op];
        extras.push(description);
        const compact = op === 'suma' ? `Añaden ${q}.` : op === 'resta' ? `Restan ${q}.` : op === 'multiplicacion' ? `Calculan el total de ${b} ${t.type === 'tiempo' ? 'actividades' : 'lotes'} de esa misma ${t.type === 'tiempo' ? 'duración' : 'cantidad'}.` : `Reparten el total en ${b} partes iguales.`;
        compactExtras.push(compact); operands.push({ operation: op, value: b });
        const equation = `${decimal(rational(before, scale))} ${{ suma: '+', resta: '−', multiplicacion: '×', division: '÷' }[op]} ${b} = ${decimal(rational(total, scale))} ${to.symbol}`;
        steps.push(`${{ suma: 'Sumamos', resta: 'Restamos', multiplicacion: 'Multiplicamos', division: 'Dividimos' }[op]} con todas las medidas en ${to.plural}: ${equation}.`); calculations.push(equation);
      }
      if (!valid) continue;
      const divided = t.order.includes('division');
      const questions = {
        longitud: `¿${large ? 'Cuál es la longitud ' + (divided ? 'de cada parte' : 'total') : 'Cuánto mide ' + (divided ? 'cada parte' : 'la cinta final')}, en ${to.plural}?`,
        masa: `¿Cuál es la masa ${divided ? 'de papel en cada bolsa' : 'total de papel'}, en ${to.plural}?`,
        capacidad: `¿Cuánta agua ${divided ? 'hay en cada recipiente' : 'tienen al final'}, en ${to.plural}?`,
        tiempo: `¿Cuánto tiempo ${divided ? 'dura cada turno' : 'tienen en total'}, en ${to.plural}?`
      };
      const text = [starts[t.type], ...extras, questions[t.type]].join(' '), compactText = [compactStarts[t.type], ...compactExtras, questions[t.type]].join(' ');
      const answerFraction = rational(total, scale), answerDisplay = decimal(answerFraction);
      return { kind: 'problem', expression: text, answer: Number(total) / Number(scale), answerFraction, answerDisplay,
        conversion: { ...conversion.conversion },
        problem: { templateId: t.id, title: t.title, family: 'medidas', category: t.type, categories: t.categories, difficulty: t.order.length ? 'avanzada' : 'facil',
          text, compactText, steps, calculations, unit: to.symbol, decimalPlaces: places,
          values: { initial: conversion.conversion.initial, from: from.symbol, to: to.symbol, operands } },
        signature: `problem:${t.id}:${conversion.signature}:${operands.map(o => o.value).join(':')}` };
    }
    throw Error('No se puede combinar esta conversión con esos ajustes. Aumenta las cifras o permite decimales.');
  }
  function generate(settings, index, seed, options = {}) {
    const cfg = normalize(settings);
    if (cfg._family !== 'medidas') return previous.generate(cfg, index, seed, options);
    const pool = compatible(cfg, options), rng = random(seed);
    if (!pool.length) throw Error('No hay problemas compatibles. Revisa unidades y cifras; para combinar, activa una operación adicional.');
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    return generateProblem(pool[index % pool.length], cfg, random(Number(seed) + index * 9973));
  }
  Object.assign(engine, { normalize, compatible, generate });
  root.NinjaUnits = { units, basic, kinds, labels, pairs, convert, rational, decimal, fits, generateConversion, generateProblem, normalizeConversion };
  if (typeof module !== 'undefined') module.exports = root.NinjaUnits;
}(globalThis));
