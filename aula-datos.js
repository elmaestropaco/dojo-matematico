(function(root){
  const clean=text=>String(text||'').trim().slice(0,60);
  const safeClone=value=>JSON.parse(JSON.stringify(value,(key,v)=>['__proto__','constructor','prototype'].includes(key)?undefined:v));
  function history(input){
    if(!Array.isArray(input)||input.length>500)throw Error('El historial debe contener como máximo 500 rondas.');
    return input.map(r=>{
      if(!r||typeof r.id!=='string'||r.id.length>200||!Number.isFinite(Date.parse(r.date))||!r.players||typeof r.players!=='object'||Array.isArray(r.players)||Object.keys(r.players).length>200)throw Error('Hay una ronda no válida. No se ha importado nada.');
      const players=Object.create(null);
      for(const [uid,p]of Object.entries(r.players)){
        if(!p||typeof p.name!=='string'||!p.name.trim()||p.name.length>150||uid.length>128||['__proto__','prototype','constructor'].includes(uid))throw Error('Hay un alumno no válido.');
        const count=n=>Number.isFinite(Number(n))?Math.min(1000000,Math.max(0,Math.trunc(Number(n)))):0,stats=Object.create(null);
        for(const [key,s]of Object.entries(p.learningStats||{}).slice(0,64)){if(!/^[A-Za-z0-9_]{1,120}$/.test(key)||['__proto__','constructor','prototype'].includes(key)||!s||typeof s!=='object')continue;stats[key]=Object.fromEntries(['correct','wrong','hints','solutions','skips','assistedCorrect'].map(k=>[k,count(s[k])]));}
        players[uid]={name:p.name,studentId:typeof p.studentId==='string'?p.studentId.slice(0,150):`uid:${uid}`,score:count(p.score),correctCount:count(p.correctCount),wrongCount:count(p.wrongCount),learningStats:stats,isConnected:p.isConnected!==false};
      }
      const teamNames=Array.isArray(r.teamNames)?r.teamNames.slice(0,4).map(n=>clean(n).slice(0,30)):[],teamAssignments=Object.fromEntries(Object.entries(r.teamAssignments||{}).filter(([uid,team])=>Object.hasOwn(players,uid)&&Number.isInteger(team)&&team>=0&&team<4));
      return {id:r.id,date:new Date(r.date).toISOString(),code:clean(r.code),mode:r.mode==='teacher'?'teacher':'duel_online',activity:r.activity==='problemas'?'problemas':'calculo',contents:String(r.contents||'').slice(0,4000),endCondition:['time','unlimited','questions','correct'].includes(r.endCondition)?r.endCondition:'time',goalCount:Math.max(0,Math.min(1000,Math.trunc(Number(r.goalCount))||0)),progressiveEnabled:r.progressiveEnabled===true,teamsEnabled:r.teamsEnabled===true,teamNames,teamAssignments,status:r.status==='finished'?'finished':'running',players};
    });
  }
  function sessions(input){
    if(!Array.isArray(input)||input.length>30)throw Error('El archivo admite como máximo 30 sesiones.');
    return input.map(s=>{if(!s||!clean(s.name)||!s.config||typeof s.config!=='object'||Array.isArray(s.config))throw Error('Hay una sesión no válida.');return{name:clean(s.name),favorite:s.favorite===true,config:root.NinjaSessions.cleanConfig(s.config)};});
  }
  root.NinjaTransfer={history,sessions,safeClone};
  if(typeof module!=='undefined')module.exports=root.NinjaTransfer;
}(globalThis));
