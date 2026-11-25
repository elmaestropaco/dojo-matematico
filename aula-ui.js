const DOJO_VERSION='2026.11.25-simbolos';
let classroomMemory={identities:{},sequence:[],cursor:0};
const classroomTabToken=`${Date.now()}-${Math.random().toString(36).slice(2)}`;
function classroomTabKey(session){return session?.playerId?`ninja_math_active_tab_v1:${session.playerId}:${session.code}`:null;}
function ownsClassroomTab(session){try{const key=classroomTabKey(session),lease=key&&JSON.parse(localStorage.getItem(key)||'null');return !lease||lease.token===classroomTabToken||Date.now()-lease.at>90000;}catch{return true;}}
function refreshClassroomTab(session){try{const key=classroomTabKey(session);if(key)localStorage.setItem(key,JSON.stringify({token:classroomTabToken,at:Date.now()}));}catch{}}
function claimClassroomTab(session){if(!ownsClassroomTab(session)&&!confirm('Este alumno ya tiene una pestaña abierta en esta sala. ¿Continuar aquí y dejar la otra pestaña fuera de la partida?'))return false;refreshClassroomTab(session);return true;}
function releaseClassroomTab(session){try{if(ownsClassroomTab(session)){const key=classroomTabKey(session);if(key)localStorage.removeItem(key);}}catch{}}
function classroomIdentity(uid){return classroomMemory.identities[uid]?`class:${classroomMemory.identities[uid]}`:`uid:${uid}`;}
function saveClassroom(){try{localStorage.setItem('ninja_math_classroom_v1',JSON.stringify(classroomMemory));return true;}catch{return false;}}
function classroomNotice(text){document.getElementById('classroomNotice').textContent=text;}
function openClassroom(){renderClassroom();document.getElementById('classroomDialog').showModal();document.getElementById('closeClassroomBtn').focus();}
function renderClassroom(){
  const host=state.online?.isHost===true,players=host?Object.entries(state.online.room?.players||{}):[];
  document.getElementById('classroomRoster').innerHTML=players.length?players.map(([uid,p])=>`<label class="classroom-student"><span>${escapeHtml(p.name)} ${p.isConnected===false?'(sin conexión)':''}</span><input data-identity="${escapeHtml(uid)}" maxlength="32" value="${escapeHtml(classroomMemory.identities[uid]||'')}" placeholder="Ej.: grupoA-07" aria-label="Identificador de ${escapeHtml(p.name)}" /></label>`).join(''):'<p>Abre este panel como anfitrión de una sala para asignar identificadores. La secuencia y las copias también funcionan sin sala.</p>';
  document.querySelectorAll('[data-identity]').forEach(input=>input.addEventListener('change',()=>{const value=input.value.trim();if(value&&!/^[A-Za-z0-9_-]{1,32}$/.test(value)){classroomNotice('Usa letras sin tildes, números, guion o guion bajo para el identificador.');return;}const uid=input.dataset.identity;if(value&&Object.entries(classroomMemory.identities).some(([other,id])=>other!==uid&&id===value&&state.online?.room?.players?.[other]?.isConnected===true)){classroomNotice('Ese identificador ya pertenece a otro alumno conectado.');return;}if(value)classroomMemory.identities[uid]=value;else delete classroomMemory.identities[uid];classroomNotice(saveClassroom()?'Identificador guardado aquí. Se aplicará a nuevas capturas; los informes antiguos no se reasignan por nombre.':'No hay almacenamiento: descarga una copia antes de cerrar.');}));
  const list=sessionLibrary.list();document.getElementById('sequenceSessionSelect').innerHTML=list.map(s=>`<option value="${escapeHtml(s.id)}">${escapeHtml(s.name)}</option>`).join('');
  document.getElementById('classroomSequence').innerHTML=classroomMemory.sequence.map((id,i)=>`<li>${i===classroomMemory.cursor?'▶ ':''}${escapeHtml(list.find(s=>s.id===id)?.name||'Sesión eliminada')} ${i<classroomMemory.cursor?'✓':''}</li>`).join('')||'<li>Guarda sesiones y añádelas en el orden que quieras.</li>';
}
function downloadAula(name,data){const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);}
function prepareTopicPractice(topic){
  if(!canApplySession()){document.getElementById('reportNotice').textContent='Espera al final de la ronda; solo el anfitrión puede cambiar los ajustes de la sala.';return;}
  if(state.operationSettings[topic]){state.activity='calculo';Object.values(state.operationSettings).forEach(c=>c.enabled=false);state.operationSettings[topic].enabled=true;}
  else if(topic.startsWith('problemas_')){
    const applied=topic.match(/^problemas_aplicados_([A-Za-z]+)_v(\d+)$/),parts=topic.slice(10).split('_'),family=applied?applied[1]:parts[0];
    const settings={...state.problemSettings,_family:family,_aulaLevel:1,...(applied?{_aulaVariant:Number(applied[2])}:{})};
    if(['enteros','fracciones'].includes(family))for(const key of ['suma','resta','multiplicacion','division'])settings[key]={...settings[key],enabled:parts.includes(key)};
    const selectedVariant=parts.find(p=>/^v\d+$/.test(p));
    if(selectedVariant){const field=family==='geometria'?'_geometryVariant':family==='espacio'?'_spaceVariant':`_${family}Variant`;settings[field]=Number(selectedVariant.slice(1));}
    const mix=['enteros','fracciones'].includes(family)&&['suma','resta','multiplicacion','division'].filter(k=>parts.includes(k)).length>1?'mixto':'individuales',normalized=NinjaProblems.normalize(settings);
    if(!NinjaProblems.compatible(normalized,{mix}).length){document.getElementById('reportNotice').textContent='Revisa las opciones de este contenido antes de preparar un repaso.';return;}
    state.activity='problemas';state.problemSettings=normalized;state.problemMix=mix;
  }else{document.getElementById('reportNotice').textContent='Este registro antiguo no identifica una actividad concreta.';return;}
  state.endCondition='unlimited';state.progressiveEnabled=false;state.streaksEnabled=false;syncSettingsUIFromState();applyModeDependentUI();updateOpsSummary();savePreferences();
  document.getElementById('reportNotice').textContent='Repaso sin tiempo preparado en los ajustes. No se ha iniciado ni modificado la sala; puedes guardarlo como sesión y usarlo en la siguiente ronda.';
}
function initClassroomTools(){
  window.addEventListener('storage',event=>{if(state.online&&event.key===classroomTabKey(state.online)&&!ownsClassroomTab(state.online)){detachOnlineSession(false);goHome();alert('La partida de este alumno continúa en otra pestaña. Aquí has salido sin desconectarlo.');}});
  try{const v=JSON.parse(localStorage.getItem('ninja_math_classroom_v1')||'null');if(v&&typeof v.identities==='object'&&Array.isArray(v.sequence)){classroomMemory={identities:Object.fromEntries(Object.entries(v.identities||{}).filter(([uid,id])=>uid.length<=128&&typeof id==='string'&&/^[A-Za-z0-9_-]{1,32}$/.test(id)&&!['__proto__','constructor','prototype'].includes(uid))),sequence:v.sequence.filter(id=>typeof id==='string').slice(0,30),cursor:Math.max(0,Math.min(v.sequence.length,Math.trunc(Number(v.cursor))||0))};}}catch{}
  document.getElementById('appVersion').textContent=`Versión ${DOJO_VERSION}`;
  ['classroomHomeBtn','classroomArenaBtn'].forEach(id=>document.getElementById(id).addEventListener('click',openClassroom));
  document.getElementById('closeClassroomBtn').addEventListener('click',()=>document.getElementById('classroomDialog').close());
  document.getElementById('sequenceAddBtn').addEventListener('click',()=>{const id=document.getElementById('sequenceSessionSelect').value;if(!id)return classroomNotice('Guarda primero una sesión.');if(classroomMemory.sequence.length>=30)return classroomNotice('Máximo 30 rondas preparadas.');classroomMemory.sequence.push(id);saveClassroom();renderClassroom();});
  document.getElementById('sequenceClearBtn').addEventListener('click',()=>{if(!confirm('¿Vaciar la secuencia? Las sesiones no se borran.'))return;classroomMemory.sequence=[];classroomMemory.cursor=0;saveClassroom();renderClassroom();});
  document.getElementById('sequenceNextBtn').addEventListener('click',async event=>{
    if(!canApplySession())return classroomNotice('Espera al final de la ronda; solo el anfitrión puede preparar otra.');
    const next=sessionLibrary.list().find(s=>s.id===classroomMemory.sequence[classroomMemory.cursor]);if(!next)return classroomNotice('No queda una sesión disponible. Revisa la secuencia.');
    if(!confirm(`¿Preparar «${next.name}»? No empezará automáticamente.`))return;
    const button=event.currentTarget;button.disabled=true;
    try{loadNamedSession(next);if(state.online?.isHost){if(!await resetHostedOnlineRoom())throw Error('No se pudo preparar la siguiente ronda. La secuencia no ha avanzado.');}classroomMemory.cursor++;saveClassroom();renderClassroom();classroomNotice('Ronda preparada. Cierra este panel y pulsa Empezar cuando estén listos.');}catch(e){classroomNotice(e.message);}finally{button.disabled=false;}
  });
  document.getElementById('exportAulaBtn').addEventListener('click',()=>{if(!confirm('La copia incluye nombres, identificadores y resultados. Guárdala de forma privada. ¿Continuar?'))return;downloadAula('dojo-copia-aula.json',{format:'dojo-aula',version:1,appVersion:DOJO_VERSION,sessions:sessionLibrary.list(),rounds:NinjaLearning.read(),identities:classroomMemory.identities});});
  document.getElementById('importAulaFile').addEventListener('change',async event=>{
    const file=event.target.files[0];if(!file)return;
    try{
      if(state.isRunning||state.online?.room?.status==='running')throw Error('Termina la ronda antes de importar.');
      if(file.size>8000000)throw Error('El archivo supera los 8 MB.');
      const data=JSON.parse(await file.text());if(data.format!=='dojo-aula'||data.version!==1)throw Error('Formato de copia no reconocido.');
      const sessions=NinjaTransfer.sessions(data.sessions),rounds=NinjaTransfer.history(data.rounds);
      if(sessionLibrary.list().length+sessions.length>30)throw Error('La suma supera 30 sesiones. Elimina alguna antes de importar.');
      if(!confirm(`¿Añadir ${sessions.length} sesiones y combinar ${rounds.length} rondas? No se modificarán salas online.`))return;
      for(const s of sessions){const saved=sessionLibrary.save(s.name,s.config);if(s.favorite)sessionLibrary.star(saved.id);}
      const persisted=NinjaLearning.mergeImported(rounds);
      if(data.identities&&typeof data.identities==='object')for(const [uid,id]of Object.entries(data.identities))if(uid.length<=128&&!['__proto__','constructor','prototype'].includes(uid)&&typeof id==='string'&&/^[A-Za-z0-9_-]{1,32}$/.test(id))classroomMemory.identities[uid]=id;
      const saved=saveClassroom();renderNamedSessions();renderClassroom();classroomNotice(persisted&&saved&&sessionLibrary.persistent()?'Copia importada. Rondas con el mismo ID no se duplican.':'Importado con almacenamiento limitado: conserva el archivo y exporta antes de cerrar.');
    }catch(e){classroomNotice(`No se pudo importar: ${e.message}`);}finally{event.target.value='';}
  });
  document.getElementById('practiceErrorsBtn').addEventListener('click',()=>{
    const errors=clonePlain(state.reviewErrors||[]);if(!errors.length)return;
    if(state.online){if(!confirm('¿Salir de la sala y practicar estos errores individualmente? La clasificación guardada no cambia.'))return;goHome();}
    state.reviewReturnSettings={endCondition:state.endCondition,goalCount:state.goalCount,progressiveEnabled:state.progressiveEnabled,streaksEnabled:state.streaksEnabled};
    state.reviewPractice=errors.map(e=>e.operation);state.reviewPracticeIndex=0;state.mode='single';state.progressiveEnabled=false;state.streaksEnabled=false;state.endCondition='questions';state.goalCount=errors.length;
    document.getElementById('reviewDialog').close();launchGame(getEnabledOperationKeys(),0);
  });
}
