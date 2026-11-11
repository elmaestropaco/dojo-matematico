(function(root){
  const colors=['#e34d59','#3088d5','#22a67a','#d39b1d'];
  const names=['Equipo Rojo','Equipo Azul','Equipo Verde','Equipo Dorado'];
  const integer=(n,min,max,fallback)=>['number','string'].includes(typeof n)&&Number.isFinite(Number(n))?Math.max(min,Math.min(max,Math.trunc(Number(n)))):fallback;
  function options(cfg={}){cfg=cfg&&typeof cfg==='object'?cfg:{};return {progressiveEnabled:cfg.progressiveEnabled===true,teamsEnabled:cfg.teamsEnabled===true,teamCount:integer(cfg.teamCount,2,4,2),teamNames:names.map((name,i)=>typeof cfg.teamNames?.[i]==='string'?Array.from(cfg.teamNames[i].trim()).slice(0,30).join('')||name:name)};}
  const indexTier=index=>Math.min(3,1+Math.floor(Math.max(0,Number(index)||0)/5));
  function outcome(player,result,assisted=false){
    player.progressLevel=integer(player.progressLevel,1,3,1);
    if(result==='correct'&&!assisted){player.progressClean=(player.progressClean||0)+1;player.progressErrors=0;if(player.progressClean>=3){player.progressLevel=Math.min(3,player.progressLevel+1);player.progressClean=0;}}
    else if(result==='wrong'){player.progressClean=0;player.progressErrors=(player.progressErrors||0)+1;if(player.progressErrors>=2){player.progressLevel=Math.max(1,player.progressLevel-1);player.progressErrors=0;}}
    else {player.progressClean=0;player.progressErrors=0;}
  }
  function calculation(cfg,tier,caps={}){
    const result=JSON.parse(JSON.stringify(cfg));let growth=0;
    for(const key of ['digits','multiplicandMax','factorMax','dividendMax','divisorMax','numeratorMax','denominatorMax'])if(Number.isFinite(result[key])){
      const next=Math.min(caps[key]||9,result[key]+tier-1);growth=Math.max(growth,next-result[key]);result[key]=next;
    }
    return {settings:result,tier:1+growth};
  }
  function problem(cfg,tier){
    const result=JSON.parse(JSON.stringify(cfg));let growth=0;
    const raise=(object,key,cap)=>{if(!Number.isFinite(Number(object?.[key])))return;const old=Number(object[key]),next=Math.min(cap,old+tier-1);object[key]=next;growth=Math.max(growth,next-old);};
    const family=cfg._family||'enteros';
    if(family==='enteros'){for(const key of ['suma','resta','multiplicacion','division'])if(result[key]?.enabled){for(const field of ['minDigits','maxDigits'])raise(result[key],field,9);if(result[key].operandDigits)for(const range of Object.values(result[key].operandDigits))for(const field of ['minDigits','maxDigits'])raise(range,field,9);}}
    else if(family==='fracciones')['_fractionNumerator','_fractionDenominator'].forEach(key=>raise(result,key,3));
    else if(family==='mcmMcd')raise(result,'_theoryDigits',3);
    else if(family==='porcentajes')['_percentageMinDigits','_percentageMaxDigits'].forEach(key=>raise(result,key,9));
    else if(family==='medidas')['_measureMinDigits','_measureMaxDigits'].forEach(key=>raise(result,key,9));
    else if(['horarios','datos','estadistica','investigacion'].includes(family))raise(result,'_literacyLevel',3);
    else if(family==='espacio')raise(result,'_spaceDigits',3);
    else raise(result,'_newDigits',3);
    return {settings:result,tier:1+growth};
  }
  function elapsed(room,now){const end=Number(room?.pausedAt)||now;return Math.max(0,end-Number(room?.startedAt||now)-Number(room?.pausedTotal||0));}
  function assign(players,count,current={},reshuffle=false){
    count=integer(count,2,4,2);const result={},sizes=Array(count).fill(0);
    const active=Object.entries(players||{}).filter(([,p])=>p&&p.isConnected!==false).sort(([a],[b])=>a.localeCompare(b));
    if(!reshuffle)for(const [uid,team]of Object.entries(current||{}))if(Number.isInteger(team)&&team>=0&&team<count){result[uid]=team;if(active.some(([id])=>id===uid))sizes[team]++;}
    for(const [uid]of active)if(result[uid]===undefined){const team=sizes.indexOf(Math.min(...sizes));result[uid]=team;sizes[team]++;}
    return result;
  }
  function standings(room,cfg={}){
    const opt=options(cfg),teams=Array.from({length:opt.teamCount},(_,i)=>({id:i,name:opt.teamNames[i],color:colors[i],total:0,correct:0,wrong:0,members:[]}));
    for(const [uid,p]of Object.entries(room?.players||{})){
      const team=cfg.teamAssignments?.[uid];if(!Number.isInteger(team)||!teams[team]||!p||(p.isConnected===false&&!p.score&&!p.correctCount&&!p.wrongCount))continue;
      teams[team].members.push({uid,name:String(p.name||'Ninja')});teams[team].total+=Math.max(0,Number(p.score)||0);teams[team].correct+=Number(p.correctCount)||0;teams[team].wrong+=Number(p.wrongCount)||0;
    }
    for(const team of teams)team.average=team.members.length?team.total/team.members.length:0;
    return teams.sort((a,b)=>b.average-a.average||a.id-b.id);
  }
  root.NinjaDynamics={options,indexTier,outcome,calculation,problem,elapsed,assign,standings,colors,names};
  if(typeof module!=='undefined')module.exports=root.NinjaDynamics;
}(globalThis));
