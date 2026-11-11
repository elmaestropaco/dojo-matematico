(function (root) {
  const defaults = {
    scaleTen: { enabled: false, digits: 2, inputPlaces: 1, scalePower: 0, challengeVariant: 0 },
    equivalence: { enabled: false, challengeVariant: 0 },
    integerOrder: { enabled: false, digits: 2, orderCount: 3, orderDirection: 0 },
    absoluteValue: { enabled: false, digits: 2 },
    numberLine: { enabled: false, digits: 2 },
    angles: { enabled: false, angleType: 0 }
  };
  const labels = { scaleTen: 'Multiplicar y dividir por 10, 100 y 1000', equivalence: 'Fracción, decimal y porcentaje', integerOrder: 'Ordenar números enteros', absoluteValue: 'Valor absoluto', numberLine: 'Recta numérica', angles: 'Ángulos que faltan' };
  const bounded = (value, min, max, fallback) => Number.isFinite(Number(value)) ? Math.max(min, Math.min(max, Math.trunc(Number(value)))) : fallback;
  const svg = (label, content) => `<svg class="calculation-diagram" viewBox="0 0 300 120" role="img" aria-label="${label}">${content}</svg>`;
  const text = (x,y,value) => `<text x="${x}" y="${y}" text-anchor="middle">${value}</text>`;
  function generate(kind, cfg = {}, rng = Math.random) {
    if (!defaults[kind]) throw Error('Reto de cálculo desconocido.');
    const pick = (min,max) => min + Math.floor(rng() * (max-min+1));
    const digits = bounded(cfg.digits,1,3,2), limit = 10 ** digits - 1;
    let n, d = 1, expression, explanation, diagram = '', inputHint = 'Escribe solo el número.', answerFormat = 'integer', signedInput = false, requiresFractionInput = false, data;
    if (kind === 'scaleTen') {
      const places = bounded(cfg.inputPlaces,0,3,1), scale = 10 ** places;
      const a = pick(10 ** (digits-1),limit) * scale + (places ? pick(1,scale-1) : 0);
      const power = bounded(cfg.scalePower,0,3,0) || pick(1,3), factor = 10 ** power;
      const variant = bounded(cfg.challengeVariant,0,2,0) || pick(1,2), multiply = variant === 1;
      n = multiply ? a * factor : a; d = multiply ? scale : scale * factor;
      const initial = root.NinjaPercentages.decimal(a,scale);
      expression = `${initial} ${multiply ? '×' : '÷'} ${factor}`;
      explanation = `Al ${multiply ? 'multiplicar' : 'dividir'} por ${factor}, la coma se desplaza ${power} ${power === 1 ? 'posición' : 'posiciones'} hacia la ${multiply ? 'derecha' : 'izquierda'}. ${expression}`;
      inputHint = 'Usa coma decimal. Resultado exacto, sin redondear.'; answerFormat = 'decimal'; data = { a, scale, factor, multiply };
    } else if (kind === 'equivalence') {
      const denominator = [2,4,5,8,10,20,25,40,50,100][pick(0,9)], numerator = pick(1,denominator-1);
      const variant = bounded(cfg.challengeVariant,0,6,0) || pick(1,6);
      const decimal = root.NinjaPercentages.decimal(numerator,denominator), percent = root.NinjaPercentages.decimal(numerator*100,denominator);
      const source = variant <= 2 ? `${numerator}/${denominator}` : variant <= 4 ? decimal : `${percent} %`;
      const target = [null,'decimal','porcentaje','fracción','porcentaje','fracción','decimal'][variant];
      n = numerator * (target === 'porcentaje' ? 100 : 1); d = denominator;
      requiresFractionInput = target === 'fracción'; answerFormat = requiresFractionInput ? 'fraction' : 'decimal';
      expression = `Convierte ${source} en ${target}`;
      explanation = `${numerator}/${denominator} = ${decimal} = ${percent} %. Para pasar de fracción a decimal dividimos; de decimal a porcentaje multiplicamos por 100.`;
      inputHint = requiresFractionInput ? 'Escribe una fracción como 3/4. Se aceptan equivalentes. Tecla F o : para /.' : target === 'porcentaje' ? 'Escribe solo el número del porcentaje, sin %. Usa coma si hace falta.' : 'Escribe el decimal con coma, no una fracción.';
      data = { numerator, denominator, variant, target };
    } else if (kind === 'integerOrder') {
      const count = bounded(cfg.orderCount,3,5,3), descending = bounded(cfg.orderDirection,0,1,0) === 1;
      const numbers = [-pick(1,limit),pick(0,limit)];
      const available = Array.from({length:2*limit+1},(_,i)=>i-limit).filter(n=>!numbers.includes(n));
      while (numbers.length < count) numbers.push(available.splice(pick(0,available.length-1),1)[0]);
      for (let i=numbers.length-1;i>0;i--) { const j=pick(0,i); [numbers[i],numbers[j]]=[numbers[j],numbers[i]]; }
      const sorted = [...numbers].sort((a,b) => descending ? b-a : a-b), position = pick(1,count);
      n = sorted[position-1]; signedInput = true;
      expression = `Ordena de ${descending ? 'mayor a menor' : 'menor a mayor'}: ${numbers.join(' · ')}. ¿Qué número va en la posición ${position}?`;
      explanation = `El orden es ${sorted.join(descending ? ' > ' : ' < ')}. En la posición ${position} está ${n}. En la recta, un número es mayor cuanto más a la derecha se encuentra.`;
      inputHint = 'Escribe solo el número de la posición pedida. Puedes usar −.'; data = { numbers, sorted, position, descending };
    } else if (kind === 'absoluteValue') {
      const value = pick(-limit,limit); n = Math.abs(value);
      expression = `Calcula el valor absoluto: |${value}|`;
      explanation = `El valor absoluto es la distancia hasta el cero, sin signo negativo: |${value}| = ${n}.`;
      inputHint = 'La distancia al cero nunca es negativa.'; data = { value };
    } else if (kind === 'numberLine') {
      const step = digits === 1 ? 1 : (digits === 2 ? [2,5,10] : [10,20,50])[pick(0,2)];
      const start = pick(-limit,limit-6*step), target = pick(1,5); n = start + target*step; signedInput = true;
      expression = '¿Qué número corresponde al punto marcado en esta recta?';
      diagram = svg('Recta numérica con siete marcas igualmente espaciadas y una incógnita', `<path d="M20 50H282m-7 -5 7 5-7 5"/>${Array.from({length:7},(_,i)=>{const x=25+i*40;return `<path d="M${x} 43V57"/>${i===target ? `<circle cx="${x}" cy="50" r="6" fill="#e68a22"/>` : ''}${text(x,82,i===target?'?':start+i*step)}`;}).join('')}`);
      explanation = `Entre marcas consecutivas avanzamos ${step}. El punto está ${target} marcas después de ${start}: ${start} + ${target} × ${step} = ${n}.`;
      inputHint = 'Escribe el número del punto. Las marcas están a la misma distancia.'; data = { step, start, target };
    } else {
      const type = bounded(cfg.angleType,0,4,0) || pick(1,4);
      let a, b = 0, total;
      if (type === 3) { a=5*pick(2,28); b=5*pick(2,34-a/5); total=180; }
      else { total=type===1?90:type===2?180:360; a=5*pick(1,total/5-1); }
      n = total-a-b;
      expression = type===1 ? `Dos ángulos complementarios suman 90°. Uno mide ${a}°. ¿Cuánto mide el otro?` : type===2 ? `Dos ángulos suplementarios suman 180°. Uno mide ${a}°. ¿Cuánto mide el otro?` : type===3 ? `En un triángulo, dos ángulos interiores miden ${a}° y ${b}°. ¿Cuánto mide el tercero?` : `Dos ángulos completan una vuelta de 360°. Uno mide ${a}°. ¿Cuánto mide el otro?`;
      explanation = type===3 ? `Los tres ángulos interiores suman 180°: 180 − ${a} − ${b} = ${n}°.` : `${total} − ${a} = ${n}°. Entre los dos completan ${total}°.`;
      if(type===3) diagram=svg('Triángulo con dos ángulos conocidos y otro desconocido; esquema no a escala',`<path d="M40 90L250 90 135 12Z" fill="#e2f1eb"/>${text(72,80,`${a}°`)}${text(214,80,`${b}°`)}${text(135,39,'?')}${text(150,116,'Esquema no a escala')}`);
      else {
        const angle=a*Math.PI/180, x=150+38*Math.cos(angle), y=60-38*Math.sin(angle);
        const boundary = total === 90 ? '<path d="M150 60V15" stroke-dasharray="3 3"/>' : total === 180 ? '<path d="M105 60H150"/>' : '<circle cx="150" cy="60" r="40" fill="none" stroke="#24665d" stroke-dasharray="3 3"/>';
        diagram=svg('Ángulos con un vértice común; esquema orientativo',`${boundary}<path d="M150 60H195M150 60L${x.toFixed(2)} ${y.toFixed(2)}"/>${text(80,30,`${a}°`)}${text(245,30,'?')}${text(150,116,`Total: ${total}°`)}`);
      }
      inputHint = 'Responde solo con el número de grados, sin °.'; data = { type, a, b, total };
    }
    const answerFraction = root.NinjaUnits.rational(BigInt(n),BigInt(d));
    const answerDisplay = answerFormat === 'fraction' ? `${answerFraction.numerator}/${answerFraction.denominator}` : root.NinjaPercentages.decimal(answerFraction.numerator,answerFraction.denominator);
    if (kind==='scaleTen') explanation += ` = ${answerDisplay}.`;
    const challengeHint = {scaleTen:'Cada potencia de diez cambia el valor de posición de las cifras. Al dividir, el resultado es menor; al multiplicar, es mayor.',equivalence:'Una fracción representa una división. Un porcentaje expresa cuántas partes hay de cada cien.',integerOrder:'Coloca primero los números en la recta. Entre negativos, el que está más cerca de cero es mayor.',absoluteValue:'Piensa cuántas unidades separan ese número del cero. La distancia no tiene signo negativo.',numberLine:'Resta dos números de marcas consecutivas para conocer el paso; después cuenta las marcas hasta el punto.',angles:'Identifica el total: 90°, 180° o 360°. Resta de ese total los ángulos que ya conoces.'}[kind];
    return { kind, challenge:true, challengeHint, expression, diagram, explanation, inputHint, signedInput, requiresFractionInput, answerFormat, answerFraction, answerDisplay, answer:Number(answerFraction.numerator)/Number(answerFraction.denominator), data, signature:`${kind}:${expression}:${JSON.stringify(data)}` };
  }
  function controls() {
    const select = (kind, key, label, options) => `<label>${label}<select class="op-config-select" data-setting-op="${kind}" data-setting-key="${key}">${options.map(([value,text])=>`<option value="${value}">${text}</option>`).join('')}</select></label>`;
    const digits = kind => select(kind,'digits','Cifras',[[1,'1 cifra'],[2,'2 cifras'],[3,'3 cifras']]);
    const fields = {
      scaleTen: digits('scaleTen')+select('scaleTen','inputPlaces','Decimales iniciales',[[0,'Sin decimales'],[1,'1 decimal'],[2,'2 decimales'],[3,'3 decimales']])+select('scaleTen','scalePower','Multiplicar o dividir por',[[0,'10, 100 y 1000'],[1,'10'],[2,'100'],[3,'1000']])+select('scaleTen','challengeVariant','Operación',[[0,'Ambas'],[1,'Multiplicar'],[2,'Dividir']]),
      equivalence: select('equivalence','challengeVariant','Conversión',[[0,'Todas'],[1,'Fracción → decimal'],[2,'Fracción → porcentaje'],[3,'Decimal → fracción'],[4,'Decimal → porcentaje'],[5,'Porcentaje → fracción'],[6,'Porcentaje → decimal']]),
      integerOrder: digits('integerOrder')+select('integerOrder','orderCount','Cantidad de números',[[3,'3 números'],[4,'4 números'],[5,'5 números']])+select('integerOrder','orderDirection','Orden',[[0,'Menor a mayor'],[1,'Mayor a menor']]),
      absoluteValue: digits('absoluteValue'), numberLine: digits('numberLine'),
      angles: select('angles','angleType','Tipo de ángulo',[[0,'Todos'],[1,'Complementarios (90°)'],[2,'Suplementarios (180°)'],[3,'Interiores de un triángulo'],[4,'Vuelta completa (360°)']])
    };
    return Object.entries(labels).map(([key,title])=>`<div class="challenge-config"><label class="challenge-enable"><input class="op-toggle" type="checkbox" data-op="${key}" /> ${title}</label><div class="challenge-fields">${fields[key]}</div></div>`).join('');
  }
  root.NinjaCalculationChallenges = { defaults, labels, generate, controls };
  if (typeof module !== 'undefined') module.exports = root.NinjaCalculationChallenges;
}(globalThis));
