(function (root) {
  const categories = ['suma', 'resta', 'multiplicacion', 'division'];
  function normalize(settings = {}) {
    const result = {};
    for (const key of categories) {
      const cfg = settings[key] || {};
      const minDigits = Math.max(1, Math.min(9, Math.trunc(Number(cfg.minDigits)) || 2));
      const maxDigits = cfg.digitMode === 'fijas' ? minDigits : Math.max(minDigits, Math.min(9, Math.trunc(Number(cfg.maxDigits)) || minDigits));
      result[key] = {
        enabled: cfg.enabled === true || (['suma', 'resta'].includes(key) && cfg.enabled !== false),
        difficulty: ['facil', 'media', 'avanzada', 'todas'].includes(cfg.difficulty) ? cfg.difficulty : 'facil',
        digitMode: minDigits === maxDigits ? 'fijas' : 'intervalo',
        minDigits,
        maxDigits,
        carryMode: ['suma', 'resta'].includes(key) && ['sin', 'con'].includes(cfg.carryMode) ? cfg.carryMode : 'ambas'
      };
      if (['multiplicacion', 'division'].includes(key)) {
        result[key].operandDigits = {};
        for (const operand of ['first', 'second']) {
          const range = cfg.operandDigits?.[operand] || { minDigits, maxDigits };
          const low = Math.max(1, Math.min(9, Math.trunc(Number(range.minDigits)) || minDigits));
          result[key].operandDigits[operand] = { minDigits: low, maxDigits: Math.max(low, Math.min(9, Math.trunc(Number(range.maxDigits)) || low)) };
        }
      }
    }
    return result;
  }
  function bounds(variable, config) {
    return { min: Math.max(variable.minimo, 10 ** (config.minDigits - 1)), max: Math.min(variable.maximo, 10 ** config.maxDigits - 1) };
  }
  function variableConfig(template, name, settings) {
    const step = template.pasos.find(s => s.operandos.includes(name));
    const config = settings[step?.operacion || template.etiquetas[0]];
    const range = config.operandDigits?.[step?.operandos.indexOf(name) === 0 ? 'first' : 'second'];
    return range ? { ...config, ...range } : config;
  }
  function carryCompatible(template, settings) {
    const ranges = Object.fromEntries(Object.entries(template.variables).filter(([, v]) => v.tipo === 'entero').map(([name, variable]) => {
      const range = bounds(variable, variableConfig(template, name, settings));
      return [name, { min: BigInt(range.min), max: BigInt(range.max) }];
    }));
    for (const step of template.pasos) {
      const [a, b] = step.operandos.map(key => ranges[key]);
      const carry = settings[step.operacion].carryMode;
      let min, max;
      if (step.operacion === 'resta') {
        if (carry === 'con' && a.max <= 9n && b.max <= 9n) return false;
        min = a.min - b.max; max = a.max - b.min;
      } else if (step.operacion === 'suma') {
        min = a.min + b.min; max = a.max + b.max;
        if (carry === 'con' && max < 10n) return false;
        if (carry === 'sin') {
          const cap = 10n ** BigInt(Math.max(String(a.max).length, String(b.max).length)) - 1n;
          if (max > cap) max = cap;
        }
      } else if (step.operacion === 'multiplicacion') {
        min = a.min * b.min; max = a.max * b.max;
      } else {
        min = b.max > 0n ? (a.min + b.max - 1n) / b.max : 0n;
        max = b.min > 0n ? a.max / b.min : a.max;
      }
      if (max < 0n || min > max) return false;
      ranges[step.id] = { min: min < 0n ? 0n : min, max };
    }
    return true;
  }
  function compatible(settings, options = {}) {
    const normalized = normalize(settings);
    const selected = categories.filter(key => normalized[key].enabled);
    const mix = ['combinados', 'mixto'].includes(options.mix) ? options.mix : 'individuales';
    return (root.NinjaProblemBank?.plantillas || []).filter(template => {
      const combined = template.etiquetas.length > 1;
      if (!template.etiquetas.every(key => normalized[key]?.enabled)) return false;
      if (combined && (mix === 'individuales' || template.etiquetas.length !== selected.length)) return false;
      if (!combined && mix === 'combinados') return false;
      const cfg = normalized[template.etiquetas[0]];
      if (!combined && template.etiquetas[0] === 'resta' && cfg?.carryMode === 'con' && cfg.maxDigits === 1) return false;
      for (const step of template.pasos.filter(s => s.operacion === 'division')) {
        const dividend = template.variables[step.operandos[0]], divisor = template.variables[step.operandos[1]];
        if (dividend?.tipo === 'entero' && divisor?.tipo === 'entero' && bounds(dividend, variableConfig(template, step.operandos[0], normalized)).max < bounds(divisor, variableConfig(template, step.operandos[1], normalized)).min) return false;
      }
      return cfg?.enabled && (combined || cfg.difficulty === 'todas' || (template.dificultad || 'facil') === cfg.difficulty)
        && Object.entries(template.variables).filter(([, v]) => v.tipo === 'entero').every(([name, v]) => {
          const range = bounds(v, variableConfig(template, name, normalized));
          return range.min <= range.max;
        }) && carryCompatible(template, normalized);
    });
  }
  function rng(seed) {
    let value = Number(seed) >>> 0;
    return () => {
      value += 0x6D2B79F5;
      let x = Math.imul(value ^ (value >>> 15), value | 1);
      x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
      return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hasCarry(operation, first, second) {
    let a = BigInt(first), b = BigInt(second), carried = 0n, found = false;
    while (a > 0n || b > 0n) {
      if (operation === 'suma') {
        carried = a % 10n + b % 10n + carried >= 10n ? 1n : 0n;
      } else if (operation === 'resta') {
        carried = a % 10n - carried < b % 10n ? 1n : 0n;
      } else return false;
      if (carried) found = true;
      a /= 10n; b /= 10n;
    }
    return found;
  }
  function withoutCarry(template, values, config, pickInt) {
    const names = Object.keys(template.variables).filter(key => template.variables[key].tipo === 'entero');
    const lengths = Object.fromEntries(names.map(key => [key, String(values[key]).length]));
    if (template.etiquetas[0] === 'resta') lengths.cantidadA = Math.max(...Object.values(lengths));
    const digits = Math.max(...Object.values(lengths));
    const numbers = Object.fromEntries(names.map(key => [key, 0n]));
    for (let column = 0; column < digits; column++) {
      let total = 0;
      const active = names.filter(key => column < lengths[key] && (template.etiquetas[0] !== 'resta' || key !== 'cantidadA'));
      for (let i = active.length - 1; i > 0; i--) { const j = pickInt(0, i); [active[i], active[j]] = [active[j], active[i]]; }
      for (let i = 0; i < active.length; i++) {
        const key = active[i];
        const leading = column === lengths[key] - 1 ? 1 : 0;
        const reserve = active.slice(i + 1).filter(name => column === lengths[name] - 1).length;
        const value = pickInt(leading, 9 - total - reserve);
        numbers[key] += BigInt(value) * 10n ** BigInt(column);
        total += value;
      }
      if (template.etiquetas[0] === 'resta') {
        const leading = column === lengths.cantidadA - 1 ? 1 : 0;
        numbers.cantidadA += BigInt(pickInt(Math.max(total, leading), 9)) * 10n ** BigInt(column);
      }
    }
    for (const key of names) {
      const range = bounds(template.variables[key], config);
      if (numbers[key] < BigInt(range.min) || numbers[key] > BigInt(range.max)) return false;
      values[key] = numbers[key];
    }
    return true;
  }
  function prepareDivisions(template, values, settings, pickInt) {
    for (const step of template.pasos.filter(s => s.operacion === 'division')) {
      const [left, right] = step.operandos;
      const target = 'cantidadA';
      const linear = Object.fromEntries(Object.keys(values).map(key => [key, { scale: key === target ? 1n : 0n, offset: key === target ? 0n : values[key], denominator: 1n }]));
      for (const previous of template.pasos) {
        if (previous.id === step.id) break;
        const [a, b] = previous.operandos.map(key => linear[key]);
        if (previous.operacion === 'suma' || previous.operacion === 'resta') {
          const sign = previous.operacion === 'suma' ? 1n : -1n;
          linear[previous.id] = { scale: a.scale * b.denominator + sign * b.scale * a.denominator, offset: a.offset * b.denominator + sign * b.offset * a.denominator, denominator: a.denominator * b.denominator };
        }
        if (previous.operacion === 'multiplicacion') linear[previous.id] = { scale: a.scale * b.offset + b.scale * a.offset, offset: a.offset * b.offset, denominator: a.denominator * b.denominator };
        if (previous.operacion === 'division') {
          if (b.scale !== 0n || b.offset === 0n) return false;
          linear[previous.id] = { scale: a.scale * b.denominator, offset: a.offset * b.denominator, denominator: a.denominator * b.offset };
        }
      }
      const variable = template.variables[target];
      if (variable?.tipo !== 'entero' || !values[right]) continue;
      const range = bounds(variable, variableConfig(template, target, settings)), divisor = values[right] * linear[left].denominator;
      const { scale, offset } = linear[left];
      if (scale <= 0n) return false;
      let a = scale, b = divisor, inverse = 1n, next = 0n;
      while (b) { const q = a / b; [a, b] = [b, a % b]; [inverse, next] = [next, inverse - q * next]; }
      if (offset % a !== 0n) return false;
      const modulus = divisor / a;
      const positiveMod = value => (value % modulus + modulus) % modulus;
      const residue = positiveMod((-offset / a) * inverse);
      const minimum = BigInt(range.min), maximum = BigInt(range.max);
      const first = minimum + positiveMod(residue - minimum);
      if (first > maximum) return false;
      values[target] = first + modulus * BigInt(pickInt(0, Number((maximum - first) / modulus)));
    }
    return true;
  }
  function generate(settings, index, seed, options = {}) {
    const normalized = normalize(settings);
    const pool = compatible(normalized, options);
    if (!pool.length) throw new Error('No hay problemas compatibles con esas cifras y dificultad.');
    const shuffle = rng(seed);
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(shuffle() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const template = pool[index % pool.length];
    const config = normalized[template.etiquetas[0]];
    const random = rng(Number(seed) + index * 9973);
    const pickInt = (min, max) => min + Math.floor(random() * (max - min + 1));
    let values;
    for (let attempt = 0; attempt < 5000; attempt++) {
      values = {};
      for (const [key, variable] of Object.entries(template.variables)) {
        if (variable.tipo === 'entero') {
          const range = bounds(variable, variableConfig(template, key, normalized));
          const first = String(range.min).length, last = String(range.max).length;
          const digits = pickInt(first, last);
          values[key] = BigInt(pickInt(Math.max(range.min, 10 ** (digits - 1)), Math.min(range.max, 10 ** digits - 1)));
        } else if (variable.tipo === 'texto') values[key] = variable.valores[pickInt(0, variable.valores.length - 1)];
      }
      if (values.nombre1 && values.nombre2 === values.nombre1) {
        const alternatives = template.variables.nombre2.valores.filter(name => name !== values.nombre1);
        if (!alternatives.length) throw new Error('Una comparación necesita dos personajes diferentes.');
        values.nombre2 = alternatives[pickInt(0, alternatives.length - 1)];
      }
      if (template.etiquetas.length === 1 && config.carryMode === 'sin' && !withoutCarry(template, values, config, pickInt)) { values = null; continue; }
      if (!prepareDivisions(template, values, normalized, pickInt)) { values = null; continue; }
      let valid = true;
      for (const step of template.pasos) {
        const [a, b] = step.operandos.map(key => values[key]);
        const carry = normalized[step.operacion].carryMode;
        if (['suma', 'resta'].includes(step.operacion) && carry !== 'ambas' && hasCarry(step.operacion, a, b) !== (carry === 'con')) { valid = false; break; }
        if (step.operacion === 'suma') values[step.id] = a + b;
        if (step.operacion === 'resta') values[step.id] = a - b;
        if (step.operacion === 'multiplicacion') values[step.id] = a * b;
        if (step.operacion === 'division') {
          if (b === 0n || a % b !== 0n) { valid = false; break; }
          values[step.id] = a / b;
        }
      }
      if (!valid) { values = null; continue; }
      for (const rule of template.restricciones) {
        const a = values[rule.izquierda], b = values[rule.derecha];
        if (rule.tipo === 'mayor_o_igual' && a < b) valid = false;
        if (rule.tipo === 'mayor_que' && a <= b) valid = false;
        if (rule.tipo === 'division_exacta' && (b === 0n || a % b !== 0n)) valid = false;
      }
      if (valid && values[template.respuesta.valor] >= 0n) break;
      values = null;
    }
    if (!values) throw new Error('No se pudieron generar cantidades coherentes para este problema.');
    for (const [key, variable] of Object.entries(template.variables)) {
      if (variable.tipo === 'concordancia') values[key] = values[variable.cantidad] === 1n ? variable.singular : variable.plural;
    }
    const render = text => text.replace(/\{([^{}]+)\}/g, (_, key) => typeof values[key] === 'bigint' ? values[key].toLocaleString('es-ES') : values[key]);
    const answerExact = String(values[template.respuesta.valor]);
    const problem = {
      templateId: template.id, title: template.titulo, category: template.etiquetas[0], categories: template.etiquetas, difficulty: template.dificultad || 'facil',
      text: render(template.enunciado), compactText: render(template.enunciadoCompacto || template.enunciado), steps: template.pasos.map(step => render(step.explicacion)),
      calculations: template.pasos.map(step => {
        const symbols = { suma: '+', resta: '-', multiplicacion: '\u00D7', division: '\u00F7' };
        const [a, b] = step.operandos.map(key => values[key].toLocaleString('es-ES'));
        return `${a} ${symbols[step.operacion]} ${b} = ${values[step.id].toLocaleString('es-ES')}`;
      }),
      unit: answerExact === '1' ? template.respuesta.unidad.singular : template.respuesta.unidad.plural,
      values: Object.fromEntries(Object.entries(values).map(([key, value]) => [key, String(value)]))
    };
    return { kind: 'problem', expression: problem.text, answer: Number(answerExact), answerExact, problem, signature: `problem:${template.id}:${JSON.stringify(problem.values)}` };
  }
  const api = { normalize, compatible, generate, hasCarry };
  root.NinjaProblems = api;
  if (typeof module !== 'undefined') module.exports = api;
}(globalThis));
