(function(root){
  function options(value={}){return{multiplicationSymbol:value.multiplicationSymbol==='·'?'·':'x',divisionSymbol:value.divisionSymbol===':'?':':'/'};}
  function text(value,settings={}){
    const symbols=options(settings);
    return String(value).replace(/×/g,symbols.multiplicationSymbol).replace(/÷/g,symbols.divisionSymbol)
      .replace(/(?<=[0-9)])\s*[·]\s*(?=[0-9(+\-−])/g,` ${symbols.multiplicationSymbol} `)
      .replace(/(?<=[0-9)])\s+x\s*(?=[0-9(+\-−])/g,` ${symbols.multiplicationSymbol} `)
      .replace(/^(\s*)x(?=\s+[0-9(\-−])/g,`$1${symbols.multiplicationSymbol}`)
      .replace(/(?<=[0-9)])\s+\/\s+(?=[0-9(+\-−])/g,` ${symbols.divisionSymbol} `);
  }
  function html(markup,settings={}){
    const template=document.createElement('template');template.innerHTML=markup;
    const walker=document.createTreeWalker(template.content,NodeFilter.SHOW_TEXT);let node;
    while((node=walker.nextNode())){
      if(node.parentElement?.closest('script,style'))continue;
      const value=node.nodeValue;
      node.nodeValue=/^\s*\/\s*$/.test(value)&&!node.parentElement?.closest('.fraction-real')?value.replace('/',options(settings).divisionSymbol):text(value,settings);
    }
    return template.innerHTML;
  }
  root.NinjaNotation={options,text,html};if(typeof module!=='undefined')module.exports=root.NinjaNotation;
}(globalThis));

function initNotationControls(){
  for(const [id,key]of [['multiplicationSymbolSelect','multiplicationSymbol'],['divisionSymbolSelect','divisionSymbol']])document.getElementById(id).addEventListener('change',event=>{state[key]=event.target.value;savePreferences();});
}
