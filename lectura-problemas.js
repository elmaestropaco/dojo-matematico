(function (root) {
  const labels = { horarios: 'Horarios y duración', datos: 'Tablas y gráficos', estadistica: 'Media y probabilidad', investigacion: 'Investiga y razona' };
  const variants = {
    horarios: ['Cuánto dura', 'Hora de llegada', 'Hora de salida', 'Cambio de día'],
    datos: ['Leer una tabla', 'Comparar datos', 'Reunir datos', 'Leer un gráfico'],
    estadistica: ['Media de tres datos', 'Media de cuatro datos', 'Probabilidad con bolas', 'Probabilidad con un dado'],
    investigacion: ['Encontrar un dato inicial', '¿Hay datos suficientes?', 'Detectar un error', 'Elegir los datos necesarios']
  };
  const contexts = ['La biblioteca', 'El huerto escolar', 'La excursión', 'El taller de dibujo', 'La feria del colegio', 'El club de lectura', 'La fiesta de fin de curso', 'La clase de ciencias', 'El mercadillo escolar', 'El campamento'];
  const bank = root.NinjaLiteracyProblemBank?.plantillas || Object.keys(labels).flatMap(family => contexts.flatMap((context,i) => variants[family].map((title,variant)=>({id:`${family}-${i+1}-${variant+1}`,family,variant,context,title:`${title}: ${context.toLowerCase()}`}))));
  const engine=root.NinjaProblems, previous={normalize:engine.normalize,compatible:engine.compatible,generate:engine.generate};
  const bound=(value,min,max,fallback)=>Number.isFinite(Number(value))?Math.max(min,Math.min(max,Math.trunc(Number(value)))):fallback;
  const seeded=seed=>{let x=Number(seed)>>>0;return()=>{x+=0x6D2B79F5;let t=Math.imul(x^(x>>>15),x|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};};
  const clock=minutes=>`${Math.floor(((minutes%1440)+1440)%1440/60)}:${String(((minutes%60)+60)%60).padStart(2,'0')}`;
  function normalize(settings={}) {
    const cfg=previous.normalize(settings);
    return {...cfg,_family:labels[settings._family]?settings._family:cfg._family,_literacyLevel:bound(settings._literacyLevel,1,3,1),_literacyDecimals:settings._literacyDecimals===true,...Object.fromEntries(Object.keys(labels).map(f=>[`_${f}Variant`,bound(settings[`_${f}Variant`],-1,3,-1)]))};
  }
  function compatible(settings,options={}) {
    const cfg=normalize(settings);if(!labels[cfg._family])return previous.compatible(cfg,options);
    return bank.filter(t=>t.family===cfg._family&&(cfg[`_${cfg._family}Variant`]<0||t.variant===cfg[`_${cfg._family}Variant`])).map(t=>({...t,categories:[t.family]}));
  }
  function build(t,cfg,rng) {
    const pick=(a,b)=>a+Math.floor(rng()*(b-a+1));
    const shuffle=list=>{list=[...list];for(let i=list.length-1;i>0;i--){const j=pick(0,i);[list[i],list[j]]=[list[j],list[i]];}return list;};
    const level=cfg._literacyLevel, min=10**(level-1), max=10**level-1;
    let question,compact,unit='',n,d=1,steps=[],calculations=[],diagram='',choices,correctLabel,requiresFractionInput=false,data;
    const intro=`En la actividad «${t.context}»`;
    function choose(options,label) { choices=shuffle([...new Set(options)]);correctLabel=label;n=choices.indexOf(label)+1;unit=''; }
    if(t.family==='horarios') {
      const step=level===1?15:level===2?5:1;
      const start=t.variant===3?22*60+pick(0,Math.floor(119/step))*step:8*60+pick(0,Math.floor(540/step))*step;
      const duration=t.variant===3?1440-start+pick(1,Math.floor(120/step))*step:pick(1,Math.floor(180/step))*step;
      const end=start+duration;
      if(t.variant===0||t.variant===3) {n=duration;unit='minutos';question=`${intro} una sesión empieza a las ${clock(start)} y termina a las ${clock(end)}${t.variant===3?' del día siguiente':' del mismo día'}. ¿Cuántos minutos dura?`;}
      if(t.variant===1) {question=`${intro} salen a las ${clock(start)} para una visita que dura ${duration} ${duration===1?'minuto':'minutos'}. ¿A qué hora termina la visita?`;choose([clock(end),clock(end+step),clock(end-step)],clock(end));}
      if(t.variant===2) {question=`${intro} una visita dura ${duration} ${duration===1?'minuto':'minutos'} y termina a las ${clock(end)}. ¿A qué hora empezó?`;choose([clock(start),clock(start+step),clock(start-step)],clock(start));}
      steps=['Expresamos las horas en minutos desde el inicio del primer día.','Usamos la duración o calculamos la diferencia entre final e inicio.'];
      calculations=[`${clock(start)} = ${start} min; ${clock(end)}${end>=1440?' del día siguiente':''} = ${end} min`,t.variant===1?`${start} + ${duration} = ${end} min → ${clock(end)}`:t.variant===2?`${end} − ${duration} = ${start} min → ${clock(start)}`:`${end} − ${start} = ${duration} min`];
      data={start,end,duration,variant:t.variant};
    } else if(t.family==='datos') {
      const days=['Lunes','Martes','Miércoles','Jueves','Viernes'].slice(0,level===1?3:level===2?4:5);
      const remaining=Array.from({length:max-min+1},(_,i)=>i+min),values=days.map(()=>remaining.splice(pick(0,remaining.length-1),1)[0]);
      const selected=pick(0,days.length-1),other=(selected+1)%days.length;
      if(t.variant===0){n=values[selected];question=`${intro} consultan los préstamos diarios de una biblioteca. Mira la tabla. ¿Cuántos libros se prestaron el ${days[selected].toLowerCase()}?`;}
      if(t.variant===1){const high=values[selected]>values[other]?selected:other,low=high===selected?other:selected;n=values[high]-values[low];question=`${intro} consultan la tabla de préstamos de una biblioteca. ¿Cuántos libros más se prestaron el ${days[high].toLowerCase()} que el ${days[low].toLowerCase()}?`;}
      if(t.variant===2){n=values.reduce((a,b)=>a+b,0);question=`${intro} reúnen los préstamos diarios de una biblioteca. ¿Cuántos libros se prestaron en total durante los ${days.length} días de la tabla?`;}
      if(t.variant===3){n=Math.max(...values);question=`${intro} muestran en el gráfico los préstamos diarios de una biblioteca. ¿Cuántos libros corresponden al día con más préstamos?`;}
      unit='libros';
      if(t.variant<3)diagram=`<table class="literacy-table literacy-table-full"><caption>Libros prestados</caption><thead><tr><th scope="col">Día</th><th scope="col">Libros</th></tr></thead><tbody>${days.map((day,i)=>`<tr><th scope="row">${day}</th><td>${values[i]}</td></tr>`).join('')}</tbody></table><table class="literacy-table literacy-table-compact"><caption>Libros prestados</caption><thead><tr>${days.map(day=>`<th scope="col"><abbr title="${day}">${day.slice(0,3)}</abbr></th>`).join('')}</tr></thead><tbody><tr>${values.map(v=>`<td>${v}</td>`).join('')}</tr></tbody></table>`;
      else {const top=Math.max(...values),width=270/days.length;diagram=`<svg class="literacy-chart" viewBox="0 0 320 150" role="img" aria-label="Libros prestados: ${days.map((day,i)=>`${day}, ${values[i]}`).join('; ')}"><path d="M25 15V117H310" stroke="#24665d" fill="none"/>${days.map((day,i)=>{const h=values[i]/top*80,x=35+i*width;return `<rect x="${x}" y="${116-h}" width="${width-12}" height="${h}" rx="3" fill="#43a995"/><text x="${x+(width-12)/2}" y="${110-h}" text-anchor="middle">${values[i]}</text><text x="${x+(width-12)/2}" y="138" text-anchor="middle">${day.slice(0,3)}</text>`;}).join('')}</svg>`;}
      steps=['Leemos las etiquetas de la tabla o del gráfico.','Respondemos solo a lo que pregunta el enunciado.'];
      calculations=[days.map((day,i)=>`${day}: ${values[i]}`).join('; '),t.variant===0?`${days[selected]} = ${n} libros`:t.variant===1?`${Math.max(values[selected],values[other])} − ${Math.min(values[selected],values[other])} = ${n} libros`:t.variant===2?`${values.join(' + ')} = ${n} libros`:`Mayor cantidad = ${n} libros`];
      data={days,values,selected,other,variant:t.variant};
    } else if(t.family==='estadistica') {
      if(t.variant<2){
        const mean=level===1?pick(3,9):level===2?pick(10,30):pick(20,60),offset=pick(1,Math.min(mean-1,Math.max(1,Math.floor(mean/3))));
        const values=shuffle(t.variant===0?[mean-offset,mean,mean+offset]:[mean-offset,mean+offset,mean,mean+(cfg._literacyDecimals?1:0)]);
        n=values.reduce((a,b)=>a+b,0);d=values.length;unit='minutos';
        question=`${intro} registran cuánto tiempo dedican a leer durante ${values.length} días: ${values.map(v=>`${v} ${v===1?'minuto':'minutos'}`).join(', ')}. ¿Cuántos minutos leen de media cada día?`;
        steps=['Reunimos los minutos de todos los días.','Repartimos el total entre la cantidad de días.'];calculations=[`${values.join(' + ')} = ${n} minutos`,`${n} ÷ ${d} = ${root.NinjaPercentages.decimal(n,d)} minutos`];data={values,variant:t.variant};
      } else if(t.variant===2){
        const total=[4,5,8,10,20][pick(0,level===1?1:4)],red=pick(1,total-1);n=red;d=total;requiresFractionInput=true;
        question=`${intro} meten en una bolsa ${red} ${red===1?'bola roja':'bolas rojas'} y ${total-red} ${total-red===1?'bola azul':'bolas azules'}, todas del mismo tamaño. Sacan una sin mirar. ¿Cuál es la probabilidad de que sea roja? Responde con una fracción.`;
        steps=['Contamos las bolas rojas, que son los casos favorables.','Comparamos los casos favorables con todas las bolas.'];calculations=[`Rojas: ${red}; total: ${red} + ${total-red} = ${total}`,`Probabilidad = ${red}/${total}`];data={red,total};
      } else {
        const threshold=pick(1,5);n=6-threshold;d=6;requiresFractionInput=true;
        question=`${intro} lanzan un dado equilibrado con las caras del 1 al 6. ¿Cuál es la probabilidad de obtener un número mayor que ${threshold}? Responde con una fracción.`;
        steps=['Buscamos las caras cuyo número es mayor que el indicado.','Hay seis resultados igualmente posibles.'];calculations=[`Caras favorables: ${Array.from({length:n},(_,i)=>threshold+1+i).join(', ')}`,`Probabilidad = ${n}/6`];data={threshold};
      }
    } else {
      const a=pick(min,max),b=pick(min,max),groups=pick(2,9);
      if(t.variant===0){n=a;unit='pegatinas';question=`${intro} reciben ${b} ${b===1?'pegatina nueva':'pegatinas nuevas'}. Ahora tienen ${a+b} pegatinas. ¿Cuántas pegatinas tenían antes de esa entrega?`;steps=['El total incluye las pegatinas nuevas.','Quitamos del total las que acaban de llegar.'];calculations=[`Total: ${a+b}; nuevas: ${b}`,`${a+b} − ${b} = ${a}`];}
      if(t.variant===1){
        const enough=pick(0,1)===1;
        question=enough?`${intro} preparan ${groups} cajas con ${a} ${a===1?'lápiz':'lápices'} en cada una. ¿Cuántos lápices hay entre todas las cajas?`:`${intro} preparan ${groups} cajas de lápices. Todas tienen la misma cantidad, pero no dicen cuántos lápices hay en cada caja. ¿Cuántos lápices hay entre todas las cajas?`;
        const label=enough?`${groups*a} lápices`:'No se puede saber';choose([`${groups*a} lápices`,`${groups+a} lápices`,'No se puede saber'],label);
        steps=['Comprobamos qué datos hacen falta para conocer el total.','Necesitamos la cantidad de cajas y los lápices por caja.'];calculations=[`${groups} cajas${enough?`; ${a} por caja`:': falta la cantidad por caja'}`,enough?`${groups} × ${a} = ${groups*a} lápices`:'No se puede saber: falta un dato'];data={a,b,groups,enough,variant:t.variant};
      }
      if(t.variant===2){
        question=`${intro} colocan ${groups} cajas con ${a} ${a===1?'pincel':'pinceles'} en cada una. Un compañero escribe «${groups} + ${a} = ${groups+a}» para calcular el total. ¿Qué debe corregir?`;
        choose(['Debe multiplicar las cajas por los pinceles de cada caja.','Debe restar los pinceles a las cajas.','No debe corregir nada.'],'Debe multiplicar las cajas por los pinceles de cada caja.');
        steps=['Cada caja repite la misma cantidad de pinceles.','Una suma de cajas y pinceles no representa el total.'];calculations=[`${groups} grupos de ${a} pinceles`,`${groups} × ${a} = ${groups*a} pinceles`];
      }
      if(t.variant===3){
        question=`${intro} guardan ${a} ${a===1?'libro':'libros'} de cuentos y ${b} ${b===1?'libro':'libros'} de aventuras en una sala con ${groups} mesas. Quieren saber cuántos libros tienen. ¿Qué datos necesitan?`;
        choose(['Los libros de cuentos y los de aventuras.','Las mesas y los libros de cuentos.','Solo la cantidad de mesas.'],'Los libros de cuentos y los de aventuras.');
        steps=['La pregunta pide la cantidad de libros, no la de mesas.','Solo necesitamos las dos cantidades de libros.'];calculations=[`Cuentos: ${a}; aventuras: ${b}`,`${a} + ${b} = ${a+b} libros`];
      }
      data ||= {a,b,groups,variant:t.variant};
    }
    compact=question.startsWith(intro+' ')?question.slice(intro.length+1):question;
    compact=compact[0].toLocaleUpperCase('es')+compact.slice(1);
    if(t.family==='estadistica'&&t.variant===2)compact=`En una bolsa hay ${data.red} ${data.red===1?'bola roja':'bolas rojas'} y ${data.total-data.red} ${data.total-data.red===1?'azul':'azules'}, todas iguales. Sacan una al azar. ¿Qué probabilidad hay de que sea roja? Responde con una fracción.`;
    const answerFraction=root.NinjaUnits.rational(BigInt(n),BigInt(d));
    const answerDisplay=requiresFractionInput?`${answerFraction.numerator}/${answerFraction.denominator}`:root.NinjaPercentages.decimal(answerFraction.numerator,answerFraction.denominator);
    return {kind:'problem',expression:question,answer:Number(answerFraction.numerator)/Number(answerFraction.denominator),answerFraction,answerDisplay,choices,answerLabel:correctLabel,requiresFractionInput,answerFormat:requiresFractionInput?'fraction':undefined,
      problem:{templateId:t.id,title:t.title,family:t.family,category:t.family,categories:[t.family],difficulty:level===1?'facil':level===2?'media':'avanzada',text:question,compactText:compact||question,steps,calculations,unit,diagram,data},
      signature:`problem:${t.id}:${JSON.stringify(data)}`};
  }
  function generate(settings,index,seed,options={}) {
    const cfg=normalize(settings);if(!labels[cfg._family])return previous.generate(cfg,index,seed,options);
    const pool=compatible(cfg),rng=seeded(seed);if(!pool.length)throw Error('Selecciona un tipo de problema.');
    for(let i=pool.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
    return build(pool[index%pool.length],cfg,seeded(Number(seed)+index*9973));
  }
  function controls() {
    return `<label>Nivel<select data-problem-extra="_literacyLevel"><option value="1">Iniciación</option><option value="2">Intermedio</option><option value="3">Avanzado</option></select></label>${Object.keys(labels).map(f=>`<label data-problem-families="${f}">Tipo de problema<select data-problem-extra="_${f}Variant"><option value="-1">Todos</option>${variants[f].map((label,i)=>`<option value="${i}">${label}</option>`).join('')}</select></label>`).join('')}<label data-problem-families="estadistica"><input type="checkbox" data-problem-extra="_literacyDecimals" /> Permitir medias con decimales exactos</label><p class="hint">40 plantillas por familia. Se responden números, fracciones u opciones, según la pregunta. Los niveles ajustan cantidades y horarios, no la velocidad de lectura. Estas familias no usan el selector de mezcla de operaciones.</p>`;
  }
  Object.assign(engine,{normalize,compatible,generate});
  root.NinjaLiteracyProblems={labels,variants,bank,build,controls,clock};
  if(typeof module!=='undefined')module.exports=root.NinjaLiteracyProblems;
}(globalThis));
