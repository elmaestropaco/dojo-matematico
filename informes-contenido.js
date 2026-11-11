(function(root){
  const count=value=>Number.isFinite(Number(value))?Math.min(1e9,Math.max(0,Number(value))):0;
  const normalizeName=value=>String(value||'Ninja').trim().toLocaleLowerCase('es');
  const statuses={review:'Conviene repasar',supported:'Con apoyo',building:'Consolidando',few:'Pocos datos',secure:'Práctica sólida'};
  function assess(row){
    const attempts=row.correct+row.wrong,outcomes=row.correct+row.solutions+row.skips,observations=attempts+row.solutions+row.skips;
    const accuracy=attempts?row.correct/attempts:null,assisted=Math.min(row.correct,row.assistedCorrect),help=outcomes?(assisted+row.solutions)/outcomes:0;
    const autonomy=outcomes?Math.max(0,row.correct-assisted)/outcomes:null;
    let status,priority,action;
    if(observations<5){status='few';priority=3;action='Registrar más práctica antes de sacar conclusiones; empezar con algunas preguntas sin tiempo.';}
    else if(attempts>=5&&accuracy<0.65){status='review';priority=0;action='Revisar un ejemplo juntos y practicar sin tiempo con una dificultad adecuada; comprobar después otra tanda.';}
    else if(help>=0.5||row.skips>=3&&row.skips>=row.correct){status='supported';priority=1;action='Practicar con ejemplos guiados y retirar las ayudas poco a poco; revisar también los saltos y la lectura del enunciado.';}
    else if(attempts<5){status='few';priority=3;action='Registrar al menos cinco intentos para valorar la precisión; revisar las ayudas por separado.';}
    else if(accuracy>=0.85&&help<=0.25){status='secure';priority=4;action='Mantener algún repaso; el docente puede proponer un reto algo mayor si lo considera adecuado.';}
    else {status='building';priority=2;action='Practicar algunas preguntas más con la misma dificultad y revisar los errores concretos.';}
    return {attempts,observations,accuracy,autonomy,status,label:statuses[status],priority,action};
  }
  function build(rounds=[]){
    const all=new Map();
    for(const round of rounds)for(const player of Object.values(round.players||{})){
      if(!player||typeof player.name!=='string')continue;
      const name=player.name.trim()||'Ninja',student=normalizeName(name),stats=player.learningStats&&typeof player.learningStats==='object'?player.learningStats:{};
      let totalCorrect=0,totalWrong=0,entries=0;
      const add=(key,values)=>{
        if(['__proto__','constructor','prototype'].includes(key))return;
        const id=JSON.stringify([student,key]),row=all.get(id)||{student,name,topic:key,content:key==='sin_desglose'?'Sin desglose de contenido (histórico)':root.NinjaLearning.topicLabel(key),correct:0,wrong:0,hints:0,solutions:0,skips:0,assistedCorrect:0,roundIds:new Set(),lastDate:''};
        for(const field of ['correct','wrong','hints','solutions','skips','assistedCorrect'])row[field]+=count(values[field]);
        row.roundIds.add(round.id);if(Number.isFinite(Date.parse(round.date))&&round.date>row.lastDate)row.lastDate=round.date;all.set(id,row);
      };
      for(const [key,values]of Object.entries(stats)){if(!values||typeof values!=='object'||['__proto__','constructor','prototype'].includes(key))continue;entries++;totalCorrect+=count(values.correct);totalWrong+=count(values.wrong);add(key,values);}
      const correct=Math.max(0,count(player.correctCount)-totalCorrect),wrong=Math.max(0,count(player.wrongCount)-totalWrong);
      if(!entries||correct||wrong)add('sin_desglose',{correct,wrong});
    }
    return [...all.values()].map(row=>({...row,rounds:row.roundIds.size,roundIds:[...row.roundIds],...assess(row)})).sort((a,b)=>a.priority-b.priority||a.name.localeCompare(b.name,'es')||a.content.localeCompare(b.content,'es'));
  }
  const filter=(rows,options={})=>rows.filter(row=>(!options.student||row.student===options.student)&&(!options.topic||row.topic===options.topic)&&(!options.status||row.status===options.status));
  const percent=value=>value===null?'Sin datos':Math.round(value*100)+'%';
  function summary(rows){
    const map=new Map();for(const row of rows){const item=map.get(row.student)||{name:row.name,correct:0,wrong:0,hints:0,solutions:0,skips:0,assistedCorrect:0,topics:0,review:0,secure:0,roundIds:new Set()};for(const field of ['correct','wrong','hints','solutions','skips','assistedCorrect'])item[field]+=row[field];item.topics++;if(['review','supported'].includes(row.status))item.review++;if(row.status==='secure')item.secure++;row.roundIds.forEach(id=>item.roundIds.add(id));map.set(row.student,item);}
    return [...map.values()].map(row=>({...row,rounds:row.roundIds.size,accuracy:row.correct+row.wrong?row.correct/(row.correct+row.wrong):null})).sort((a,b)=>a.name.localeCompare(b.name,'es'));
  }
  function sheets(rounds,options={}){
    const rows=filter(build(rounds),options),totals=summary(rows);
    const overview=[['Alumno','Rondas con datos','Contenidos','Aciertos','Fallos (intentos)','Precisión registrada','Contenidos para acompañar','Práctica sólida'],...totals.map(r=>[r.name,r.rounds,r.topics,r.correct,r.wrong,percent(r.accuracy),r.review,r.secure])];
    const detail=[['Alumno','Contenido','Rondas','Aciertos','Fallos (intentos)','Precisión','Autonomía registrada','Pistas (consultas)','Soluciones individuales','Saltos','Aciertos con pista','Indicador orientativo','Siguiente paso'],...rows.map(r=>[r.name,r.content,r.rounds,r.correct,r.wrong,percent(r.accuracy),percent(r.autonomy),r.hints,r.solutions,r.skips,r.assistedCorrect,r.label,r.action])];
    const plan=[['Alumno','Contenido','Indicador orientativo','Intentos','Pistas','Soluciones','Saltos','Propuesta para revisar con el docente'],...rows.filter(r=>r.status!=='secure').map(r=>[r.name,r.content,r.label,r.attempts,r.hints,r.solutions,r.skips,r.action])];
    const origins=[['Fecha','Alumno','Sala','Dificultad','Aciertos totales de ronda','Fallos totales de ronda','Puntos totales de ronda (no por contenido)','Estado de ronda']];
    const selectedRounds=new Map();
    for(const row of rows){const ids=selectedRounds.get(row.student)||new Set();row.roundIds.forEach(id=>ids.add(id));selectedRounds.set(row.student,ids);}
    for(const round of rounds)for(const p of Object.values(round.players||{})){if(!p||typeof p.name!=='string')continue;if(selectedRounds.get(normalizeName(p.name))?.has(round.id))origins.push([round.date,p.name,round.code,round.progressiveEnabled?'Progresiva':'Fija',count(p.correctCount),count(p.wrongCount),count(p.score),round.status==='finished'?'Terminada':'Parcial']);}
    return [{name:'Resumen de practica',rows:overview},{name:'Por contenido',rows:detail},{name:'Plan de repaso',rows:plan},{name:'Rondas de origen',rows:origins}];
  }
  root.NinjaInsights={build,assess,filter,summary,sheets,statuses,percent,normalizeName};
  if(typeof module!=='undefined')module.exports=root.NinjaInsights;
}(globalThis));
