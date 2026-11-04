(function (root) {
  const engine = root.NinjaProblems;
  const previous = { normalize: engine.normalize, compatible: engine.compatible, generate: engine.generate };
  const types = ['parte', 'descuento', 'aumento', 'relacion'];
  const arithmetic = ['multiplicacion', 'suma', 'resta', 'division'];
  const clamp = (value, min, max, fallback) => Math.max(min, Math.min(max, Math.trunc(Number(value)) || fallback));
  function normalize(settings = {}) {
    const low = clamp(settings._percentageMinDigits, 1, 9, 2);
    const base = previous.normalize(settings);
    return { ...base,
      _family: settings._family === 'porcentajes' ? 'porcentajes' : base._family,
      _percentageMinDigits: low,
      _percentageMaxDigits: Math.max(low, clamp(settings._percentageMaxDigits, 1, 9, low)),
      _percentageBasic: settings._percentageBasic !== false,
      _percentageDecimals: settings._percentageDecimals === true,
      _percentagePlaces: clamp(settings._percentagePlaces, 1, 2, 2),
      ...Object.fromEntries(types.map(type => [`_percentage_${type}`, settings[`_percentage_${type}`] !== false])),
      ...Object.fromEntries(arithmetic.map(op => [`_percentage_${op}`, settings[`_percentage_${op}`] === true]))
    };
  }
  function compatible(settings, options = {}) {
    const cfg = normalize(settings);
    if (cfg._family !== 'porcentajes') return previous.compatible(cfg, options);
    const selected = arithmetic.filter(op => cfg[`_percentage_${op}`]);
    const pool = (root.NinjaPercentageProblemBank?.plantillas || []).filter(t => cfg[`_percentage_${t.type}`]);
    const mix = ['combinados', 'mixto'].includes(options.mix) ? options.mix : 'individuales';
    const variants = [];
    for (const t of pool) {
      if (mix !== 'combinados') variants.push({ ...t, categories: [t.type], order: [] });
      if (mix !== 'individuales' && selected.length) variants.push({ ...t, id: `${t.id}-${selected.join('-')}`, categories: [t.type, ...selected], order: selected });
    }
    return variants;
  }
  function random(seed) {
    let x = Number(seed) >>> 0;
    return () => { x += 0x6D2B79F5; let t = Math.imul(x ^ (x >>> 15), x | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  function decimal(numerator, denominator = 1n) {
    let n = BigInt(numerator), d = BigInt(denominator);
    const whole = n / d;
    let remainder = n % d, tail = '';
    while (remainder) {
      remainder *= 10n; tail += remainder / d; remainder %= d;
      if (tail.length > 6) throw Error('El resultado no tiene un decimal exacto corto.');
    }
    return String(whole) + (tail ? ',' + tail : '');
  }
  function generateProblem(t, cfg, rng) {
    const pick = (min, max) => min + Math.floor(rng() * (max - min + 1));
    const min = 10 ** (cfg._percentageMinDigits - 1), max = 10 ** cfg._percentageMaxDigits - 1;
    const scale = 10n ** BigInt(cfg._percentageDecimals ? Math.min(2, cfg._percentagePlaces) : 0);
    let data;
    for (let attempt = 0; attempt < 1000; attempt++) {
      const initial = BigInt(pick(min, max));
      let total = initial;
      const extras = [], compactExtras = [], steps = [], calculations = [];
      for (const op of t.order) {
        let b;
        const before = total;
        if (op === 'multiplicacion') {
          b = BigInt(pick(2, 5)); total *= b;
          extras.push(`Compran ${b} unidades, cada una al precio indicado.`);
          compactExtras.push(`Compran ${b} unidades.`);
          steps.push('Calculamos el precio de todas las unidades');
        } else if (op === 'suma') {
          b = BigInt(pick(1, 9)); total += b;
          extras.push(`Añaden ${b} ${b === 1n ? 'euro' : 'euros'} por la entrega.`);
          compactExtras.push(`La entrega cuesta ${b} €.`);
          steps.push('Sumamos el coste de la entrega');
        } else if (op === 'resta') {
          b = BigInt(pick(1, Math.min(9, Number(total - 1n)) || 1));
          total -= b;
          extras.push(`Usan un vale de ${b} ${b === 1n ? 'euro' : 'euros'}, que restan del importe.`);
          compactExtras.push(`Restan un vale de ${b} €.`);
          steps.push('Restamos el vale');
        } else {
          const divisors = [2n, 3n, 4n, 5n, 6n, 8n].filter(d => total % d === 0n);
          if (!divisors.length) { total = 0n; break; }
          b = divisors[pick(0, divisors.length - 1)]; total /= b;
          extras.push(`Reparten el importe a partes iguales entre ${b} personas. A partir de ahora calculan solo la parte de una persona.`);
          compactExtras.push(`Dividen el importe entre ${b} personas; ahora calculan la parte de una.`);
          steps.push('Calculamos la parte que paga una persona');
        }
        const equation = `${before} ${{ suma: '+', resta: '−', multiplicacion: '×', division: '÷' }[op]} ${b} = ${total}`;
        calculations.push(equation); steps[steps.length - 1] += ': ' + equation + '.';
      }
      if (total <= 0n) continue;
      const candidates = (cfg._percentageBasic ? [10, 20, 25, 50, 75, 100] : Array.from({ length: 100 }, (_, i) => i + 1))
        .filter(p => total * BigInt(p) * scale % 100n === 0n);
      if (!candidates.length) continue;
      const percent = candidates[pick(0, candidates.length - 1)];
      data = { initial, total, extras, compactExtras, steps, calculations, percent }; break;
    }
    if (!data) throw Error('No se puede generar un porcentaje exacto con estos ajustes.');
    const { initial, total, extras, compactExtras, steps, calculations, percent } = data;
    const part = total * BigInt(percent);
    const amount = decimal(part, 100n);
    const euros = n => `${n} ${String(n) === '1' ? 'euro' : 'euros'}`;
    const scene = t.scene;
    const item = initial > 10000n ? `un pedido de ${scene.purpose}` : scene.item;
    let text, question, compactText, compactQuestion;
    if (t.order.length) {
      text = `${scene.intro} preparan la compra de ${item}. El precio de una unidad es de ${euros(initial)}. ${extras.join(' ')}`;
      compactText = `Una unidad cuesta ${initial} €. ${compactExtras.join(' ')}`;
    } else {
      const openings = [
        `${scene.intro} han reservado ${euros(initial)} para ${scene.purpose}.`,
        `${scene.intro} disponen de un presupuesto de ${euros(initial)} para ${scene.purpose}.`,
        `${scene.intro} preparan una compra de ${scene.purpose} con ${euros(initial)}.`,
        `${scene.intro} reúnen ${euros(initial)} para comprar ${scene.purpose}.`
      ];
      text = openings[t.variant]; compactText = `Tienen ${euros(initial)} para ${scene.purpose}.`;
    }
    let numerator = part, denominator = 100n, unit = 'euros';
    if (t.type === 'parte') {
      question = `Quieren pagar el ${percent} % de esa cantidad con los ahorros del grupo. ¿Cuántos euros sacarán de esos ahorros?`;
      compactQuestion = `Pagan el ${percent} % con sus ahorros. ¿Cuántos euros son?`;
      steps.push(`Calculamos la parte correspondiente al ${percent} %: ${total} × ${percent} ÷ 100 = ${amount}.`);
      calculations.push(`${total} × ${percent} ÷ 100 = ${amount}`);
    } else if (t.type === 'relacion') {
      question = `Del importe indicado, pagan ${euros(amount)} con los ahorros del grupo. ¿Qué porcentaje del importe pagan con esos ahorros?`;
      compactQuestion = `De esa cantidad pagan ${amount} € con sus ahorros. ¿Qué porcentaje supone?`;
      numerator = BigInt(percent); denominator = 1n; unit = '%';
      steps.push(`Dividimos la parte entre el total y multiplicamos por 100: ${amount} ÷ ${total} × 100 = ${percent} %.`);
      calculations.push(`${amount} ÷ ${total} × 100 = ${percent} %`);
    } else {
      const discount = t.type === 'descuento';
      if (!t.order.length) {
        text = `${scene.intro} el precio de ${item} es de ${euros(initial)}.`;
        compactText = `El precio de ${item} es de ${euros(initial)}.`;
      }
      question = discount
        ? `Aplican un descuento del ${percent} % sobre ese importe. ¿Cuánto pagarán después del descuento, en euros?`
        : `Ese importe aumenta un ${percent} %. ¿Cuál será el nuevo importe, en euros?`;
      compactQuestion = discount ? `Descuentan el ${percent} % de ese importe. ¿Cuántos euros pagarán?` : `El importe sube un ${percent} %. ¿Cuántos euros pagarán?`;
      steps.push(`Calculamos ${discount ? 'el descuento' : 'el aumento'}: ${total} × ${percent} ÷ 100 = ${amount}.`);
      calculations.push(`${total} × ${percent} ÷ 100 = ${amount}`);
      numerator = total * 100n + (discount ? -part : part);
      const answer = decimal(numerator, 100n), symbol = discount ? '−' : '+';
      steps.push(`${discount ? 'Restamos el descuento al' : 'Sumamos el aumento al'} importe inicial: ${total} ${symbol} ${amount} = ${answer}.`);
      calculations.push(`${total} ${symbol} ${amount} = ${answer}`);
    }
    const answerFraction = root.NinjaMathExtra.fraction(numerator, denominator);
    const answerDisplay = decimal(numerator, denominator);
    return { kind: 'problem', expression: `${text} ${question}`, answer: Number(numerator) / Number(denominator), answerFraction, answerDisplay,
      problem: { templateId: t.id, title: t.title, family: 'porcentajes', category: t.type, categories: t.categories,
        difficulty: t.order.length ? 'avanzada' : cfg._percentageBasic ? 'facil' : 'media',
        text: `${text} ${question}`, compactText: `${compactText} ${compactQuestion}`, steps, calculations, unit,
        values: { initial: String(initial), total: String(total), percent, part: amount },
        decimalPlaces: cfg._percentageDecimals ? Math.min(2, cfg._percentagePlaces) : 0 },
      signature: `problem:${t.id}:${initial}:${total}:${percent}` };
  }
  function generate(settings, index, seed, options = {}) {
    const cfg = normalize(settings);
    if (cfg._family !== 'porcentajes') return previous.generate(cfg, index, seed, options);
    const pool = compatible(cfg, options), rng = random(seed);
    if (!pool.length) throw Error('Marca al menos un tipo de porcentaje. Para combinar, activa también alguna operación adicional.');
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    return generateProblem(pool[index % pool.length], cfg, random(Number(seed) + index * 9973));
  }
  Object.assign(engine, { normalize, compatible, generate });
  root.NinjaPercentages = { decimal, generateProblem };
  if (typeof module !== 'undefined') module.exports = root.NinjaPercentages;
}(globalThis));
