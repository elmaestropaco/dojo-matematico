function initAccessibility(){
  let settings={board:false,reduced:false};
  try{const saved=JSON.parse(localStorage.getItem('ninja_math_accessibility_v1')||'null');if(saved&&typeof saved==='object')settings={board:saved.board===true,reduced:saved.reduced===true};}catch{}
  const dialog=document.getElementById('accessibilityDialog'),board=document.getElementById('boardModeToggle'),reduced=document.getElementById('reduceMotionToggle');
  const apply=()=>{
    document.body.dataset.board=String(settings.board);document.body.dataset.reducedMotion=String(settings.reduced);
    board.checked=settings.board;reduced.checked=settings.reduced;
    ['accessibilityBtn','accessibilityArenaBtn'].forEach(id=>document.getElementById(id).setAttribute('aria-pressed',String(settings.board)));
    requestAnimationFrame(()=>{fitTeacherGrid();document.querySelectorAll('.operation').forEach(fitOperationElement);});
  };
  const save=()=>{settings={board:board.checked,reduced:reduced.checked};apply();try{localStorage.setItem('ninja_math_accessibility_v1',JSON.stringify(settings));document.getElementById('accessibilityNotice').textContent='Preferencias guardadas en este dispositivo.';}catch{document.getElementById('accessibilityNotice').textContent='No se pueden guardar las preferencias. Se mantienen mientras esta página siga abierta.';}};
  [board,reduced].forEach(control=>control.addEventListener('change',save));
  ['accessibilityBtn','accessibilityArenaBtn'].forEach(id=>document.getElementById(id).addEventListener('click',()=>{dialog.showModal();document.getElementById('closeAccessibilityBtn').focus({preventScroll:true});}));
  document.getElementById('closeAccessibilityBtn').addEventListener('click',()=>dialog.close());
  document.getElementById('fullscreenBtn').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();else throw Error('unsupported');}catch{document.getElementById('accessibilityNotice').textContent='El navegador no permite activar pantalla completa aquí. Puedes probar su opción de pantalla completa.';}});
  document.addEventListener('fullscreenchange',()=>document.getElementById('fullscreenBtn').textContent=document.fullscreenElement?'Salir de pantalla completa':'Pantalla completa');
  apply();
}
