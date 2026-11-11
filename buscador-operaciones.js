function bindOperationSearch() {
  const input=document.getElementById('operationSearch'),box=document.getElementById('operationsBox');
  const clear=document.getElementById('clearOperationSearch'),status=document.getElementById('operationSearchStatus');
  const normalize=value=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es');
  const entries=[...box.querySelectorAll('.op-toggle')].map(toggle=>({toggle,node:toggle.closest('.op-row, .measure-card, .challenge-config, .spatial-config')||toggle.closest('label'),text:normalize(OPERATION_LABELS[toggle.dataset.op]||'')}));
  const groups=[...box.querySelectorAll('details')].filter(group=>entries.some(e=>group.contains(e.node)));
  let previousOpen;
  function filter() {
    const words=normalize(input.value).trim().split(/\s+/).filter(Boolean),searching=words.length>0;
    if(searching&&!previousOpen)previousOpen=new Map(groups.map(group=>[group,group.open]));
    let found=0;
    entries.forEach(entry=>{const matches=!searching||words.every(word=>entry.text.includes(word));entry.node.classList.toggle('operation-filtered-out',!matches);if(matches)found++;});
    groups.forEach(group=>{
      const hasMatch=entries.some(e=>group.contains(e.node)&&!e.node.classList.contains('operation-filtered-out'));
      group.classList.toggle('operation-filtered-out',searching&&!hasMatch);
      if(searching&&hasMatch)group.open=true;
    });
    if(!searching&&previousOpen){previousOpen.forEach((open,group)=>group.open=open);previousOpen=null;}
    clear.disabled=!input.value;
    status.textContent=searching?`${found} de ${entries.length} operaciones. Las seleccionadas se conservan.`:`${entries.length} operaciones disponibles. Busca en todos los grupos.`;
    document.getElementById('operationSearchEmpty').classList.toggle('hidden',!searching||found>0);
  }
  input.addEventListener('input',filter);
  clear.addEventListener('click',()=>{input.value='';filter();input.focus();});
  input.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();input.value='';filter();}});
  filter();
}
