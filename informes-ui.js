function reportExportOptions(){
  return {insights:{student:document.getElementById('reportStudentFilter').value,topic:document.getElementById('reportTopicFilter').value,status:document.getElementById('reportStatusFilter').value}};
}
function renderContentReports(){
  const rounds=selectedReportRounds(),all=NinjaInsights.build(rounds);
  const populate=(id,entries,title)=>{
    const el=document.getElementById(id),previous=el.value;
    el.innerHTML=`<option value="">${title}</option>`+entries.map(([key,label])=>`<option value="${escapeHtml(key)}">${escapeHtml(label)}</option>`).join('');
    if(entries.some(([key])=>key===previous))el.value=previous;
  };
  populate('reportStudentFilter',[...new Map(all.map(r=>[r.student,r.name]))].sort((a,b)=>a[1].localeCompare(b[1],'es')),'Todo el alumnado');
  populate('reportTopicFilter',[...new Map(all.map(r=>[r.topic,r.content]))].sort((a,b)=>a[1].localeCompare(b[1],'es')),'Todos los contenidos');
  const rows=NinjaInsights.filter(all,reportExportOptions().insights),totals=NinjaInsights.summary(rows),view=document.getElementById('reportViewSelect').value;
  const badge=r=>`<span class="insight-badge" data-status="${r.status}">${escapeHtml(r.label)}</span>`;
  const table=(headers,data)=>`<div class="report-table-wrap" tabindex="0" aria-label="Tabla de seguimiento; desplaza horizontalmente si es necesario"><table><thead><tr>${headers.map(h=>`<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${data.map(cells=>`<tr>${cells.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  let html=`<p>${rounds.length} ${rounds.length===1?'ronda':'rondas'} del periodo · ${totals.length} ${totals.length===1?'alumno':'alumnos'} · ${rows.length} ${rows.length===1?'registro':'registros'} de contenido tras los filtros.</p>`;
  if(!rows.length)html+='<p>No hay datos con estos filtros. El seguimiento recoge las rondas online observadas por el anfitrión en este navegador.</p>';
  else if(view==='summary')html+=table(['Alumno','Rondas','Contenidos','Aciertos','Fallos','Precisión','Para acompañar'],totals.map(r=>[escapeHtml(r.name),r.rounds,r.topics,r.correct,r.wrong,NinjaInsights.percent(r.accuracy),r.review]));
  else if(view==='content')html+=table(['Alumno / contenido','Indicador','Aciertos / fallos','Precisión','Autonomía','Pistas / soluciones / saltos'],rows.map(r=>[`${escapeHtml(r.name)}<br><small>${escapeHtml(r.content)}</small>`,badge(r),`${r.correct} / ${r.wrong}`,NinjaInsights.percent(r.accuracy),NinjaInsights.percent(r.autonomy),`${r.hints} / ${r.solutions} / ${r.skips}`]));
  else {
    const plan=rows.filter(r=>r.status!=='secure');
    html+=plan.map(r=>`<article class="insight-plan"><h4>${escapeHtml(r.name)}</h4><p><strong>${escapeHtml(r.content)}</strong> · ${badge(r)}</p><p>${escapeHtml(r.action)}</p><small>Intentos: ${r.attempts} · Consultas de pistas: ${r.hints} · Soluciones: ${r.solutions} · Saltos: ${r.skips}</small></article>`).join('')||'<p>No hay propuestas pendientes con estos filtros. Mantén algún repaso.</p>';
  }
  document.getElementById('reportsContent').innerHTML=html;
}
