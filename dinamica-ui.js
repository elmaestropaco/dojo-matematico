let dynamicsGenerationLevel=1;
function withDynamicsLevel(level,callback){const old=dynamicsGenerationLevel;dynamicsGenerationLevel=level;try{return callback();}finally{dynamicsGenerationLevel=old;}}
function createProgressiveOperation(kind){
  if(!state.progressiveEnabled||!globalThis.NinjaDynamics)return createBaseOperation(kind);
  const tier=dynamicsGenerationLevel,oldProblems=state.problemSettings,oldSettings=state.operationSettings;
  let adjusted;
  if(kind==='problem')adjusted=NinjaDynamics.problem(oldProblems,tier);
  else {
    const caps={};document.querySelectorAll(`[data-setting-op="${kind}"]`).forEach(select=>caps[select.dataset.settingKey]=Math.max(...[...select.options].map(o=>Number(o.value)).filter(Number.isFinite)));
    adjusted=NinjaDynamics.calculation(oldSettings[kind]||{},tier,caps);
  }
  try{
    if(kind==='problem')state.problemSettings=adjusted.settings;else state.operationSettings={...oldSettings,[kind]:adjusted.settings};
    let op=createBaseOperation(kind),actual=adjusted.tier;
    if(op.problem?.family==='estadistica'&&op.problem.templateId.endsWith('-4'))actual=1;
    if(op.problem?.family==='investigacion'&&op.choices)actual=1;
    const stamp=value=>({...value,progressTier:actual,signature:`${value.signature}:nivel${actual}`,...(value.followUp?{followUp:stamp(value.followUp)}:{})});
    op=stamp(op);return op;
  }catch(error){
    // Some problem contexts have quantity limits; never invent an incompatible question.
    if(kind!=='problem')throw error;
    state.problemSettings=oldProblems;return {...createBaseOperation(kind),progressTier:1};
  }finally{state.problemSettings=oldProblems;state.operationSettings=oldSettings;}
}
function dynamicsLevelFor(player){return !state.progressiveEnabled?1:state.mode==='single'?(player?.progressLevel||1):NinjaDynamics.indexTier(state.mode==='online'?state.online?.currentOperationIndex:player?.questionIndex);}
function createOnlineProblem(index){
  const base=state.problemSettings,seed=Number(state.online?.seed||1),tier=state.progressiveEnabled?NinjaDynamics.indexTier(index):1;
  const adjusted=state.progressiveEnabled?NinjaDynamics.problem(base,tier):{settings:base,tier:1};
  let op;try{op=NinjaProblems.generate(adjusted.settings,index,seed,{mix:state.problemMix});}catch{op=NinjaProblems.generate(base,index,seed,{mix:state.problemMix});adjusted.tier=1;}
  if(!state.progressiveEnabled)return decorateOperation(op);
  if(op.problem?.family==='estadistica'&&op.problem.templateId.endsWith('-4')||op.problem?.family==='investigacion'&&op.choices)adjusted.tier=1;
  const stamp=value=>({...value,progressTier:adjusted.tier,signature:`${value.signature}:nivel${adjusted.tier}`,...(value.followUp?{followUp:stamp(value.followUp)}:{})});
  return decorateOperation(stamp(op));
}
function dynamicsOutcome(player,result,operation){if(state.progressiveEnabled&&state.mode==='single')NinjaDynamics.outcome(player,result,Boolean(operation?.hintStage||operation?.solutionRevealed));}
function roundRemaining(room=state.online?.room){return Math.max(0,Math.ceil((Number(room?.durationSeconds||state.gameDuration||60)*1000-NinjaDynamics.elapsed(room,window.NinjaOnline?.now?.()||Date.now()))/1000));}
function initDynamicsUI(){
  document.querySelector('#onlineHostLobby .room-code-actions').appendChild(document.getElementById('teamsSetupBtn'));
  document.querySelector('.results-actions').appendChild(document.getElementById('teamsResultsBtn'));
  const change=()=>{Object.assign(state,NinjaDynamics.options({...state,progressiveEnabled:document.getElementById('progressiveToggle').checked,teamsEnabled:document.getElementById('teamsToggle').checked,teamCount:Number(document.getElementById('teamCountSelect').value)}));syncDynamicsControls();savePreferences();publishDynamicsLobby();};
  ['progressiveToggle','teamsToggle','teamCountSelect'].forEach(id=>document.getElementById(id).addEventListener('change',change));
  document.getElementById('teamNames').addEventListener('change',event=>{if(event.target.dataset.teamName===undefined)return;state.teamNames[Number(event.target.dataset.teamName)]=event.target.value;Object.assign(state,NinjaDynamics.options(state));syncDynamicsControls();savePreferences();publishDynamicsLobby();});
  document.getElementById('pauseRoundBtn').addEventListener('click',()=>changeRoundPause('pause'));
  document.getElementById('resumeRoundBtn').addEventListener('click',()=>changeRoundPause('resume'));
  document.getElementById('revealSharedBtn').addEventListener('click',()=>changeRoundPause('reveal'));
  document.getElementById('sharedPlayerSelect').addEventListener('change',()=>changeRoundPause('question'));
  document.getElementById('leavePauseBtn').addEventListener('click',goHome);
  document.getElementById('roundPauseDialog').addEventListener('cancel',event=>event.preventDefault());
  ['teamsArenaBtn','teamsSetupBtn','teamsResultsBtn'].forEach(id=>document.getElementById(id).addEventListener('click',()=>{renderTeamsDialog();document.getElementById('teamsDialog').showModal();document.getElementById('closeTeamsBtn').focus({preventScroll:true});}));
  document.getElementById('closeTeamsBtn').addEventListener('click',()=>document.getElementById('teamsDialog').close());
  document.getElementById('shuffleTeamsBtn').addEventListener('click',async()=>{
    if(!state.online?.isHost||state.online.room?.status!=='lobby')return;
    try{await NinjaOnline.setTeams(state.online.code,{count:state.teamCount,names:state.teamNames,reshuffle:true},state.online.room.seed);}catch(error){dynamicsNotice(error.message);}
  });
  document.getElementById('teamsRoster').addEventListener('change',async event=>{
    const uid=event.target.dataset.teamUid;if(!uid||!state.online?.isHost||state.online.room?.status!=='lobby')return;
    const cfg=state.online.config||{};
    try{await NinjaOnline.setTeams(state.online.code,{count:cfg.teamCount,names:cfg.teamNames,assignments:{...cfg.teamAssignments,[uid]:Number(event.target.value)}},state.online.room.seed);}catch(error){dynamicsNotice(error.message);}
  });
  document.getElementById('hallProgressFilter').addEventListener('change',renderHallOfFame);
  syncDynamicsControls();
}
function dynamicsNotice(message){document.getElementById('dynamicsNotice').textContent=message;document.getElementById('teamsNotice').textContent=message;}
function publishDynamicsLobby(){if(state.online?.isHost&&state.online.room?.status==='lobby')NinjaOnline.saveLobbyConfig(state.online.code,buildOnlineConfig(),state.online.room.seed).catch(error=>dynamicsNotice(error.message));}
function syncDynamicsControls(){
  if(!document.getElementById('progressiveToggle'))return;
  document.getElementById('progressiveToggle').checked=Boolean(state.progressiveEnabled);
  document.getElementById('streakLabel').textContent=state.progressiveEnabled?'🔥 Rachas visuales (sin ruleta en progresiva)':'🔥 Activar rachas + eventos sorpresa';
  document.getElementById('teamsToggle').checked=Boolean(state.teamsEnabled);
  document.getElementById('teamCountSelect').value=String(state.teamCount||2);
  const onlineMode=['online','teacher'].includes(state.mode);
  document.getElementById('teamSettings').classList.toggle('hidden',!onlineMode);
  document.getElementById('teamDetails').classList.toggle('hidden',!state.teamsEnabled);
  document.getElementById('progressiveRuleHint').textContent=state.mode==='single'?'Individual: 3 aciertos seguidos sin pista suben un nivel; 2 fallos seguidos bajan uno. El cambio se aplica a la siguiente pregunta.':'Competición: nivel 1 en preguntas 1–5; nivel 2 en 6–10; nivel 3 desde la 11. Mismo índice, misma dificultad para todos. No hay adaptación individual.';
  const names=document.getElementById('teamNames');
  if(names.children.length!==(state.teamCount||2))names.innerHTML=Array.from({length:state.teamCount||2},(_,i)=>`<label>Equipo ${i+1}<input data-team-name="${i}" maxlength="30" aria-label="Nombre del equipo ${i+1}" /></label>`).join('');
  names.querySelectorAll('input').forEach((input,i)=>{if(document.activeElement!==input)input.value=state.teamNames?.[i]||NinjaDynamics.names[i];});
  syncDynamicsStatus();
}
function syncDynamicsStatus(){
  const session=state.online,room=session?.room,running=room?.status==='running';
  document.getElementById('pauseRoundBtn')?.classList.toggle('hidden',!session?.isHost||!running||!state.isRunning||isRoundPaused());
  const teams=Boolean(session?.config?.teamsEnabled);
  ['teamsArenaBtn','teamsResultsBtn','teamsSetupBtn'].forEach(id=>document.getElementById(id)?.classList.toggle('hidden',!teams));
  if(!running||!room.pausedAt){document.getElementById('roundPauseDialog')?.close();return;}
  if(session.completedRound===roundKey(room)&&!session.isTeacher)return;
  const dialog=document.getElementById('roundPauseDialog');
  ['hintDialog','reviewDialog','teamsDialog'].forEach(id=>document.getElementById(id)?.close());
  document.getElementById('pauseClock').textContent=state.endCondition==='time'?`Tiempo congelado: ${formatSeconds(roundRemaining(room))}`:'La partida no avanza durante la explicación.';
  document.getElementById('resumeRoundBtn').classList.toggle('hidden',!session.isHost);
  document.getElementById('revealSharedBtn').classList.toggle('hidden',!session.isHost);
  document.getElementById('sharedPlayerWrap').classList.toggle('hidden',!session.isHost);
  const picker=document.getElementById('sharedPlayerSelect'),old=picker.value,roster=Object.entries(room.players||{}).filter(([,p])=>p.isConnected!==false&&!p.isFinished);
  const rosterKey=JSON.stringify(roster.map(([uid,p])=>[uid,p.name,p.operationIndex,p.pendingFollowUpFrom]));
  if(picker.dataset.rosterKey!==rosterKey){picker.innerHTML=roster.map(([uid,p])=>`<option value="${escapeHtml(uid)}">${escapeHtml(p.name||'Ninja')} · pregunta ${Number(p.operationIndex||0)+1}</option>`).join('');if(roster.some(([uid])=>uid===old))picker.value=old;picker.dataset.rosterKey=rosterKey;}
  let q={};try{q=JSON.parse(room.pausedQuestion||'{}');}catch{}
  const key=`${room.seed}:${room.pausedQuestion}:${room.pauseRevealed}:${session.config?.progressiveEnabled}`;
  const board=document.getElementById('sharedQuestion');
  if(board.dataset.questionKey!==key){
    const index=Math.max(0,Math.min(99999,Math.trunc(Number(q.index))||0));
    let op=createOnlineOperation(Number.isInteger(q.followUpFrom)?q.followUpFrom:index);
    if(Number.isInteger(q.followUpFrom)&&op.followUp)op=decorateOperation(op.followUp);
    board.innerHTML=op.problem?renderProblem({...op,solutionRevealed:Boolean(room.pauseRevealed)}):`${op.html}${op.choices?`<ol>${op.choices.map(choice=>`<li>${escapeHtml(choice)}</li>`).join('')}</ol>`:''}${room.pauseRevealed?`<section class="shared-working">${operationSolutionHtml(op)}</section>`:''}`;
    board.dataset.questionKey=key;
  }
  if(!dialog.open){dialog.showModal();document.getElementById('pauseTitle').focus({preventScroll:true});}
}
async function changeRoundPause(action){
  if(!state.online?.isHost)return;
  if(state.online.connected===false){alert('Espera a recuperar la conexión para controlar la ronda.');return;}
  const picker=document.getElementById('sharedPlayerSelect'),room=state.online.room;
  const chosen=room?.players?.[picker.value]||Object.values(room?.players||{}).find(p=>p.isConnected!==false&&!p.isFinished);
  const question={index:Number(chosen?.operationIndex||0),...(Number.isInteger(chosen?.pendingFollowUpFrom)?{followUpFrom:chosen.pendingFollowUpFrom}:{})};
  try{await NinjaOnline.controlRound(state.online.code,action,question);document.getElementById('pauseNotice').textContent='';}catch(error){document.getElementById('pauseNotice').textContent=error.message;dynamicsNotice(error.message);if(!document.getElementById('roundPauseDialog').open)alert(`No se pudo controlar la ronda: ${error.message}`);}
}
function syncDynamicsRoom(room){
  if(!state.online)return;
  const session=state.online,cfg=session.config||{};
  if(room.status==='running'&&session.active||!session.isHost)Object.assign(state,NinjaDynamics.options(cfg));
  state.teamAssignments=cfg.teamAssignments||{};session.seed=Number(room.seed||1);
  if(room.pausedAt&&session.syncedPauseAt!==room.pausedAt&&!session.isTeacher&&state.players[0]){
    const saved=room.players?.[session.playerId],p=state.players[0];
    if(saved){const changed=session.currentOperationIndex!==saved.operationIndex;Object.assign(p,{score:saved.score||0,streak:saved.streak||0,correctCount:saved.correctCount||0,wrongCount:saved.wrongCount||0,resolvedCount:saved.resolvedCount||0,learningStats:clonePlain(saved.learningStats||{})});session.currentOperationIndex=saved.operationIndex||0;session.correctCount=saved.correctCount||0;session.wrongCount=saved.wrongCount||0;
      if(changed){p.input='';let op=createOnlineOperation(session.currentOperationIndex);if(Number.isInteger(saved.pendingFollowUpFrom)){const parent=createOnlineOperation(saved.pendingFollowUpFrom);if(parent.followUp)op=decorateOperation(parent.followUp);}state.operationsByPlayer.set(0,op);}
    }session.syncedPauseAt=room.pausedAt;
  }
  const saved=room.players?.[session.playerId],op=state.operationsByPlayer.get(0);
  if(!session.isTeacher&&op&&Number.isInteger(saved?.assistedOperationIndex)&&saved.assistedOperationIndex===session.currentOperationIndex&&!op.solutionRevealed){op.solutionRevealed=true;state.players[0].input='';state.players[0].streak=0;repaintPlayers();}
  if(room.status==='running'&&state.endCondition==='time'){state.timeLeft=roundRemaining(room);if(session.isTeacher)updateTeacherClockDisplay(state.timeLeft);else updateTimerStyles();}
  if(session.isHost&&cfg.teamsEnabled&&!session.assigningTeams&&Date.now()>(session.teamRetryAt||0)){
    const count=NinjaDynamics.options(cfg).teamCount;
    const missing=Object.entries(room.players||{}).some(([uid,p])=>p.isConnected!==false&&(!Number.isInteger(cfg.teamAssignments?.[uid])||cfg.teamAssignments[uid]<0||cfg.teamAssignments[uid]>=count));
    if(missing){session.assigningTeams=true;NinjaOnline.setTeams(session.code,{fillOnly:true},room.seed).then(ok=>{session.assigningTeams=false;if(ok&&state.online===session)syncDynamicsRoom(session.room);}).catch(error=>{session.assigningTeams=false;session.teamRetryAt=Date.now()+3000;dynamicsNotice(error.message);});}
  }
  colorTeamCards();syncDynamicsStatus();if(document.getElementById('teamsDialog').open)renderTeamsDialog();if(room.status==='finished')appendTeamResults();
}
function teamBoardHtml(room,cfg){
  if(!cfg?.teamsEnabled)return '';
  const teams=NinjaDynamics.standings(room,cfg),max=Math.max(1,...teams.map(t=>t.average));
  const active=teams.filter(t=>t.members.length),leaders=active.filter(t=>t.average===active[0]?.average);
  const outcome=room?.status==='finished'&&leaders.length?`<p class="team-winner">🏆 ${leaders.length>1?'Empate: ': 'Gana: '}${leaders.map(t=>escapeHtml(t.name)).join(' · ')}</p>`:'';
  return outcome+`<div class="team-board">${teams.map((t,i)=>`<article class="team-card" style="--team-color:${t.color}"><h3>${i===0&&t.members.length?'🏆':'🏳️'} ${escapeHtml(t.name)}</h3><strong>${t.average.toLocaleString('es-ES',{maximumFractionDigits:2})}</strong><small>puntos por participante · ${t.total} puntos totales</small><div class="team-meter"><span style="width:${t.average/max*100}%"></span></div><p>🥷 ${t.members.length} · ✅ ${t.correct} · ❌ ${t.wrong}</p><div class="team-member-list">${t.members.map(p=>`<span>${escapeHtml(p.name)}</span>`).join('')}</div></article>`).join('')}</div><p class="hint">Clasificación por media de puntos, no por tamaño del equipo. Los participantes desconectados que ya jugaron conservan su aportación.</p>`;
}
function renderTeamsDialog(){
  const room=state.online?.room,cfg=state.online?.config||{},editable=Boolean(state.online?.isHost&&room?.status==='lobby');
  document.getElementById('teamsBoard').innerHTML=teamBoardHtml(room,cfg)||'<p>Activa los equipos en los ajustes de la sala.</p>';
  document.getElementById('shuffleTeamsBtn').classList.toggle('hidden',!editable);
  const roster=document.getElementById('teamsRoster'),entries=Object.entries(room?.players||{}).filter(([,p])=>p.isConnected!==false),opt=NinjaDynamics.options(cfg);
  roster.classList.toggle('hidden',!editable);
  const signature=JSON.stringify([editable,entries.map(([uid,p])=>[uid,p.name,cfg.teamAssignments?.[uid]]),opt.teamNames,opt.teamCount]);
  if(roster.dataset.signature!==signature){roster.innerHTML=entries.map(([uid,p])=>`<label class="team-roster-row"><span>${escapeHtml(p.name||'Ninja')}</span><select data-team-uid="${escapeHtml(uid)}" ${editable?'':'disabled'} aria-label="Equipo de ${escapeHtml(p.name||'Ninja')}"><option value="-1" disabled>Asignando…</option>${Array.from({length:opt.teamCount},(_,i)=>`<option value="${i}" ${cfg.teamAssignments?.[uid]===i?'selected':''}>${escapeHtml(opt.teamNames[i])}</option>`).join('')}</select></label>`).join('');roster.dataset.signature=signature;}
}
function colorTeamCards(){
  const cfg=state.online?.config;if(!cfg?.teamsEnabled)return;
  refs.teacherGrid.querySelectorAll('.teacher-card').forEach(card=>{const uid=card.querySelector('[data-remove-player]')?.dataset.removePlayer,team=cfg.teamAssignments?.[uid];if(Number.isInteger(team)&&team>=0&&team<4){card.style.boxShadow=`inset 5px 0 0 ${NinjaDynamics.colors[team]}`;const points=card.querySelector('.teacher-points');if(points)points.title=cfg.teamNames?.[team]||NinjaDynamics.names[team];}});
  if(state.online?.isTeacher)fitTeacherGrid();
}
function appendTeamResults(){
  const old=document.getElementById('teamFinalResults');old?.remove();
  if(!state.online?.config?.teamsEnabled)return;
  const section=document.createElement('section');section.id='teamFinalResults';section.innerHTML='<h3>🏆 Clasificación por equipos</h3>'+teamBoardHtml(state.online.room,state.online.config);refs.resultsScores.prepend(section);
}
function updateProgressLabels(){
  state.players.forEach(p=>{const line=document.getElementById(`eventInline-${p.id}`),op=state.operationsByPlayer.get(p.id);if(!line)return;if(state.progressiveEnabled&&op){line.dataset.progress=op.solutionRevealed?`Nivel ${op.progressTier||1} · Solución consultada: sin puntos`:`Nivel ${op.progressTier||1} · +${getBasePoints(op)} puntos por acierto`;}else delete line.dataset.progress;});
}
