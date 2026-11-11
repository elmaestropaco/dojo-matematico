(function (root) {
  const labels = { espacio: 'Volúmenes y geometría espacial' };
  const calculationLabels = { cubeVolume: 'Volumen de un cubo', prismVolume: 'Volumen de un prisma rectangular' };
  const defaults = { cubeVolume: { enabled: false, digits: 2, spaceUnit: 0 }, prismVolume: { enabled: false, digits: 2, spaceUnit: 0 } };
  const variants = ['Volumen de un cubo', 'Volumen de un prisma rectangular', 'Cubitos por filas y capas', 'Capacidad de un depósito'];
  const contexts = ['La biblioteca', 'El huerto escolar', 'La excursión', 'El taller de dibujo', 'La feria del colegio', 'El club de lectura', 'La fiesta de fin de curso', 'La clase de ciencias', 'El mercadillo escolar', 'El campamento'];
  const bank = root.NinjaSpatialProblemBank?.plantillas || contexts.flatMap((context,i) => variants.map((title,variant) => ({ id:`espacio-${i+1}-${variant+1}`, family:'espacio', variant, context, title:`${title}: ${context.toLowerCase()}` })));
  const bound = (n,min,max,fallback) => Number.isFinite(Number(n)) ? Math.max(min,Math.min(max,Math.trunc(Number(n)))) : fallback;
  const engine = root.NinjaProblems, previous = {normalize:engine.normalize,compatible:engine.compatible,generate:engine.generate};
  const random = seed => {let x=Number(seed)>>>0;return()=>{x+=0x6D2B79F5;let t=Math.imul(x^(x>>>15),x|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};};
  function normalize(settings={}) {
    const cfg=previous.normalize(settings);
    return {...cfg,_family:settings._family==='espacio'?'espacio':cfg._family,_spaceVariant:bound(settings._spaceVariant,-1,3,-1),_spaceDigits:bound(settings._spaceDigits,1,3,2),_spaceUnit:bound(settings._spaceUnit,0,2,0)};
  }
  function compatible(settings,options={}) {
    const cfg=normalize(settings);if(cfg._family!=='espacio')return previous.compatible(cfg,options);
    return bank.filter(t=>cfg._spaceVariant<0||t.variant===cfg._spaceVariant).map(t=>({...t,categories:['espacio']}));
  }
  function shape(a,b,c,unit,cube=false,counters=false) {
    const x=cube?95:65,y=cube?50:60,w=cube?95:145,h=cube?95:75,dx=40,dy=-28;
    const front=`${x},${y} ${x+w},${y} ${x+w},${y+h} ${x},${y+h}`;
    const top=`${x},${y} ${x+dx},${y+dy} ${x+w+dx},${y+dy} ${x+w},${y}`;
    const side=`${x+w},${y} ${x+w+dx},${y+dy} ${x+w+dx},${y+h+dy} ${x+w},${y+h}`;
    const label=(lx,ly,value)=>`<text x="${lx}" y="${ly}" text-anchor="middle">${value}</text>`;
    return `<svg class="spatial-diagram" viewBox="0 0 340 180" role="img" aria-label="${cube?'Cubo':'Prisma rectangular'} con sus medidas; esquema no a escala"><g stroke="#24665d" stroke-width="2"><polygon points="${front}" fill="#d9f0e7"/><polygon points="${top}" fill="#bce0d6"/><polygon points="${side}" fill="#8fc9bc"/></g><g fill="#173c37">${label(x+w/2,160,counters?`Por fila: ${a}`:`Largo: ${a} ${unit}`)}${label(235,24,counters?`Filas: ${b}`:`Ancho: ${b} ${unit}`)}${label(285,105,counters?`Capas: ${c}`:`Alto: ${c} ${unit}`)}<text x="170" y="177" text-anchor="middle" font-size="9">Esquema no a escala</text></g></svg>`;
  }
  function measures(digits,unit,cube,rng) {
    digits=bound(digits,1,3,2);unit=['cm','dm','m'][bound(unit,0,2,0)];
    const number=()=>10**(digits-1)+Math.floor(rng()*(9*10**(digits-1)));
    const a=number(),b=cube?a:number(),c=cube?a:number();
    const n=BigInt(a)*BigInt(b)*BigInt(c);
    return {a,b,c,unit,n};
  }
  function generateCalculation(kind,cfg={},rng=Math.random) {
    if(!defaults[kind])throw Error('Cálculo espacial desconocido.');
    const cube=kind==='cubeVolume',m=measures(cfg.digits,cfg.spaceUnit,cube,rng),{a,b,c,unit,n}=m;
    const expression=cube?`Un cubo tiene aristas de ${a} ${unit}. ¿Cuál es su volumen en ${unit}³?`:`Un prisma rectangular mide ${a} ${unit} de largo, ${b} ${unit} de ancho y ${c} ${unit} de alto. ¿Cuál es su volumen en ${unit}³?`;
    return {kind,challenge:true,expression,diagram:shape(a,b,c,unit,cube),answerFraction:root.NinjaUnits.rational(n,1n),answer:Number(n),answerDisplay:String(n),
      inputHint:`Escribe solo el número. Volumen en ${unit}³.`,challengeHint:'El volumen cuenta unidades cúbicas. Multiplica largo por ancho y por alto; en un cubo las tres medidas son iguales.',
      explanation:`${cube?'Las tres aristas son iguales. ':'Todas las medidas están en la misma unidad. '}${a} × ${b} × ${c} = ${n} ${unit}³.`,
      data:{a,b,c,unit},signature:`${kind}:${a}:${b}:${c}:${unit}`};
  }
  function build(t,cfg,rng) {
    const cube=t.variant===0,m=measures(cfg._spaceDigits,t.variant===3?1:cfg._spaceUnit,cube,rng),{a,b,c,unit,n}=m;
    const intro=`En la actividad «${t.context}»`,output=t.variant===3?'litros':`${unit}³`;
    const description=cube?`estudian un cubo. Cada borde o arista mide ${a} ${unit}`:t.variant===1?`estudian un prisma rectangular de ${a} ${unit} de largo, ${b} ${unit} de ancho y ${c} ${unit} de alto`:t.variant===2?`representan un bloque con cubitos iguales: ${a} en cada fila, ${b} filas por capa y ${c} capas. Cada cubito ocupa 1 ${unit}³`:`estudian un depósito rectangular cuyas medidas interiores son ${a} dm de largo, ${b} dm de ancho y ${c} dm de alto. Cada dm³ equivale a un litro`;
    const question=t.variant===3?'¿Cuántos litros caben si se llena por completo?':`¿Qué volumen ${t.variant===2?'ocupan los cubitos':'tiene la figura'}, en ${unit}³?`;
    const text=`${intro} ${description}. ${question}`;
    const compactText=cube?`Un cubo tiene aristas de ${a} ${unit}. ¿Qué volumen tiene, en ${unit}³?`:t.variant===1?`Un prisma rectangular mide ${a} ${unit} de largo, ${b} ${unit} de ancho y ${c} ${unit} de alto. ¿Qué volumen tiene, en ${unit}³?`:t.variant===2?`Hay ${a} cubitos por fila, ${b} filas por capa y ${c} capas. Cada cubito ocupa 1 ${unit}³. ¿Qué volumen ocupan?`:`Un depósito mide por dentro ${a} dm de largo, ${b} dm de ancho y ${c} dm de alto. Cada dm³ equivale a un litro. ¿Cuántos litros caben?`;
    const steps=t.variant===3?['Calculamos el volumen interior del depósito en decímetros cúbicos.','Convertimos a litros: cada dm³ equivale a un litro.']:t.variant===2?['Calculamos los cubitos de una capa.','Multiplicamos por el número de capas y por el volumen de cada cubito.']:['El volumen cuenta el espacio que ocupa la figura.','Multiplicamos largo por ancho y por alto, en la misma unidad.'];
    const calculations=t.variant===3?[`${a} × ${b} × ${c} = ${n} dm³`,`${n} dm³ = ${n} litros`]:[`${a} × ${b} = ${BigInt(a)*BigInt(b)}${t.variant===2?' cubitos por capa':` ${unit}² de base`}`,`${BigInt(a)*BigInt(b)} × ${c} = ${n} ${output}`];
    return {kind:'problem',expression:text,answer:Number(n),answerFraction:root.NinjaUnits.rational(n,1n),answerDisplay:String(n),inputHint:`Responde solo el número en ${output}.`,
      problem:{templateId:t.id,title:t.title,family:'espacio',category:'espacio',categories:['espacio'],difficulty:cfg._spaceDigits===1?'facil':cfg._spaceDigits===2?'media':'avanzada',text,compactText,steps,calculations,unit:output,diagram:shape(a,b,c,unit,cube,t.variant===2),data:{a,b,c,unit,variant:t.variant}},
      signature:`problem:${t.id}:${a}:${b}:${c}:${unit}`};
  }
  function generate(settings,index,seed,options={}) {
    const cfg=normalize(settings);if(cfg._family!=='espacio')return previous.generate(cfg,index,seed,options);
    const pool=compatible(cfg),rng=random(seed);if(!pool.length)throw Error('Selecciona un tipo de problema espacial.');
    for(let i=pool.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
    return build(pool[index%pool.length],cfg,random(Number(seed)+index*9973));
  }
  const options=list=>list.map(([value,label])=>`<option value="${value}">${label}</option>`).join('');
  function calculationControls() {
    return Object.entries(calculationLabels).map(([key,label])=>`<div class="spatial-config"><label class="challenge-enable"><input class="op-toggle" type="checkbox" data-op="${key}" /> ${label}</label><div class="challenge-fields"><label>Cifras de cada medida<select class="op-config-select" data-setting-op="${key}" data-setting-key="digits">${options([[1,'1 cifra'],[2,'2 cifras'],[3,'3 cifras']])}</select></label><label>Unidad de las medidas<select class="op-config-select" data-setting-op="${key}" data-setting-key="spaceUnit">${options([[0,'Centímetros (cm)'],[1,'Decímetros (dm)'],[2,'Metros (m)']])}</select></label></div></div>`).join('');
  }
  function problemControls() {
    return `<label>Tipo de problema<select data-problem-extra="_spaceVariant"><option value="-1">Todos</option>${variants.map((label,i)=>`<option value="${i}">${label}</option>`).join('')}</select></label><label>Cifras de cada medida<select data-problem-extra="_spaceDigits">${options([[1,'1 cifra'],[2,'2 cifras'],[3,'3 cifras']])}</select></label><label>Unidad (salvo depósitos en litros)<select data-problem-extra="_spaceUnit">${options([[0,'Centímetros (cm)'],[1,'Decímetros (dm)'],[2,'Metros (m)']])}</select></label><p class="hint">40 plantillas con dibujos. El volumen se expresa en unidades cúbicas, no cuadradas. Los depósitos utilizan medidas interiores en dm y respuestas en litros: 1 dm³ = 1 litro. Los datos y resultados son enteros exactos.</p>`;
  }
  Object.assign(engine,{normalize,compatible,generate});
  root.NinjaSpatial={labels,calculationLabels,defaults,variants,bank,shape,generateCalculation,build,calculationControls,problemControls};
  if(typeof module!=='undefined')module.exports=root.NinjaSpatial;
}(globalThis));
