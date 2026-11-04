(function (root) {
  const names = ['Perímetro del cuadrado', 'Área del cuadrado', 'Perímetro del rectángulo', 'Área del rectángulo', 'Perímetro del triángulo', 'Área del triángulo', 'Longitud de la circunferencia', 'Área del círculo', 'Perímetro del paralelogramo', 'Área del paralelogramo', 'Perímetro del rombo', 'Área del rombo', 'Perímetro del trapecio', 'Área del trapecio'];
  function compatible(variant, cfg) {
    return cfg._geometryDecimals || cfg._geometryPi === '3' || cfg._newDigits > 1 || (variant !== 6 && variant !== 7);
  }
  function build(t, cfg, rng) {
    const min = 10 ** (cfg._newDigits - 1), max = 10 ** cfg._newDigits - 1;
    const pick = (lo = min, hi = max) => lo + Math.floor(rng() * (hi - lo + 1));
    const even = () => 2 * pick(Math.ceil(min / 2), Math.floor(max / 2));
    let a = pick(), b = pick(), c = pick(), n, d = 1, description, formula, shape;
    const v = t.variant, area = v % 2 === 1, pi = cfg._geometryPi === '3' ? 3 : 314;
    const label = (x, y, text) => `<text x="${x}" y="${y}" text-anchor="middle">${text}</text>`;
    const polygon = points => `<polygon points="${points}"/>`;
    const line = (x1, y1, x2, y2) => `<path d="M${x1} ${y1}L${x2} ${y2}" fill="none" stroke-dasharray="4 3"/>`;
    if (v < 4) {
      if (v < 2) b = a;
      description = v < 2 ? `un cuadrado cuyo lado mide ${a} cm` : `un rectángulo de ${a} cm de base y ${b} cm de altura`;
      n = area ? a * b : 2 * (a + b);
      formula = area ? `${a} × ${b}` : v === 0 ? `4 × ${a}` : `2 × (${a} + ${b})`;
      const scale = Math.min(140 / a, 70 / b), w = Math.max(10, a * scale), h = Math.max(10, b * scale);
      const x = 125 - w / 2, y = 55 - h / 2;
      shape = `<rect x="${x}" y="${y}" width="${w}" height="${h}"/>${label(125, y + h + 18, `${a} cm`)}${label(215, 60, `${b} cm`)}`;
    } else if (v === 4 || v === 5) {
      if (v === 4) {
        c = pick(Math.max(min, Math.abs(a - b) + 1), Math.min(max, a + b - 1));
        description = `un triángulo cuyos tres lados miden ${a} cm, ${b} cm y ${c} cm`;
        n = a + b + c; formula = `${a} + ${b} + ${c}`;
        shape = polygon('55,95 195,95 110,20') + label(125, 115, `${a} cm`) + label(65, 50, `${b} cm`) + label(180, 50, `${c} cm`);
      } else {
        if (!cfg._geometryDecimals) b = even();
        description = `un triángulo de ${a} cm de base y ${b} cm de altura perpendicular a esa base`;
        n = a * b; d = 2; formula = `(${a} × ${b}) ÷ 2`;
        shape = polygon('55,95 195,95 110,20') + line(110, 20, 110, 95) + label(125, 115, `Base: ${a} cm`) + label(160, 63, `h: ${b} cm`);
      }
    } else if (v === 6 || v === 7) {
      if (!cfg._geometryDecimals && pi === 314) {
        const multiple = v === 6 ? 25 : 10;
        const low = Math.ceil(min / multiple), high = Math.floor(max / multiple);
        if (low > high) throw Error('Con estas cifras, permite decimales o usa π = 3.');
        a = multiple * pick(low, high);
      }
      description = `un círculo de ${a} cm de radio. Para este ejercicio, usa π = ${pi === 3 ? '3' : '3,14'}`;
      n = area ? pi * a * a : 2 * pi * a; d = pi === 3 ? 1 : 100;
      formula = area ? `${pi === 3 ? '3' : '3,14'} × ${a} × ${a}` : `2 × ${pi === 3 ? '3' : '3,14'} × ${a}`;
      shape = '<circle cx="115" cy="60" r="42"/>' + line(115, 60, 157, 60) + label(178, 85, `Radio: ${a} cm`);
    } else if (v === 8 || v === 9) {
      if (area) b = pick(min, Math.min(max, a));
      description = area ? `un paralelogramo de ${a} cm de base y ${b} cm de altura perpendicular a la base` : `un paralelogramo cuyos lados contiguos miden ${a} cm y ${b} cm. Los lados opuestos tienen la misma longitud`;
      n = area ? a * b : 2 * (a + b); formula = area ? `${a} × ${b}` : `2 × (${a} + ${b})`;
      shape = polygon('45,95 175,95 205,25 75,25') + label(110, 115, `Base: ${a} cm`) + (area ? line(75, 25, 75, 95) + label(116, 63, `h: ${b} cm`) : label(211, 65, `${b} cm`));
    } else if (v === 10 || v === 11) {
      if (area && !cfg._geometryDecimals) b = even();
      description = area ? `un rombo cuyas diagonales miden ${a} cm y ${b} cm` : `un rombo cuyos cuatro lados miden ${a} cm cada uno`;
      n = area ? a * b : 4 * a; d = area ? 2 : 1; formula = area ? `(${a} × ${b}) ÷ 2` : `4 × ${a}`;
      shape = polygon('125,15 195,65 125,115 55,65') + (area ? line(125, 15, 125, 115) + line(55, 65, 195, 65) + label(125, 134, `Diagonal: ${a} cm`) + label(202, 29, `${b} cm`) : label(186, 35, `${a} cm`));
    } else {
      if (a === b) b = b === max ? b - 1 : b + 1;
      if (a < b) [a, b] = [b, a];
      if (area) {
        if (!cfg._geometryDecimals) c = even();
        description = `un trapecio con dos bases paralelas: la mayor mide ${a} cm y la menor ${b} cm. La altura perpendicular entre ellas es de ${c} cm`;
        n = (a + b) * c; d = 2; formula = `(${a} + ${b}) × ${c} ÷ 2`;
      } else {
        c = pick(Math.max(min, Math.floor((a - b) / 2) + 1), max);
        description = `un trapecio isósceles. Sus bases paralelas miden ${a} cm y ${b} cm, y cada uno de los otros dos lados mide ${c} cm`;
        n = a + b + 2 * c; formula = `${a} + ${b} + ${c} + ${c}`;
      }
      shape = polygon('45,95 205,95 170,25 80,25') + label(125, 115, `${a} cm`) + label(125, 19, `${b} cm`) + (area ? line(80, 25, 80, 95) + label(122, 63, `h: ${c} cm`) : label(47, 57, `${c} cm`) + label(206, 57, `${c} cm`));
    }
    const result = root.NinjaUnits.rational(BigInt(n), BigInt(d));
    const answer = root.NinjaPercentages.decimal(result.numerator, result.denominator), unit = area ? 'cm²' : 'cm';
    const question = v === 6 ? 'la longitud de su circunferencia, en centímetros' : area ? 'su área, en centímetros cuadrados' : 'su perímetro, en centímetros';
    const text = `En la actividad «${t.context}» estudian ${description}. ¿Cuál es ${question}?${v === 6 || v === 7 ? ' Calcula con el valor de π indicado, sin redondear el resultado.' : ''}`;
    const steps = [area ? 'El área mide la superficie interior de la figura.' : 'El perímetro mide la longitud de todo el borde.', v === 5 || v === 13 ? 'Usamos la altura perpendicular, no la longitud de un lado inclinado.' : v === 11 ? 'Multiplicamos las dos diagonales y dividimos entre dos.' : v === 6 || v === 7 ? 'Usamos el radio y el valor de π que indica el enunciado.' : area ? 'Aplicamos la fórmula del área de esta figura.' : 'Sumamos las longitudes de todos los lados.'];
    const diagram = `<svg class="geometry-diagram" viewBox="0 0 250 150" role="img" aria-label="${names[v]}; esquema con medidas, no a escala"><g fill="#d9f0e7" stroke="#24665d" stroke-width="2">${shape.replace(/<text /g, '<text fill="#173c37" stroke="none" font-size="13" ')}</g><text x="125" y="148" text-anchor="middle" font-size="9" fill="#173c37">Esquema no a escala</text></svg>`;
    const compactText = `Estudian ${description}. ¿Cuál es ${question}?${v === 6 || v === 7 ? ' No redondees.' : ''}`;
    return { text, compactText, result, unit, steps, calculations: [area ? 'Superficie interior' : 'Longitud del borde', `${formula} = ${answer} ${unit}`], diagram, measurements: { a, b, c, n, d } };
  }
  root.NinjaGeometry = { names, compatible, build };
  if (typeof module !== 'undefined') module.exports = root.NinjaGeometry;
}(globalThis));
