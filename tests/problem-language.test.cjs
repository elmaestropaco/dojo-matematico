const assert = require('node:assert/strict');
const { validateBank } = require('../banco-problemas/validar-banco.cjs');
const { genderOf, validateLanguage } = require('../banco-problemas/lenguaje.cjs');
require('../banco-problemas/datos.js');
require('../banco-problemas/ampliado-datos.js');
const engine = require('../problemas.js');
require('../matematicas-extra.js');
const templates = globalThis.NinjaProblemBank.plantillas;
const categories = ['suma','resta','multiplicacion','division'];
assert.equal(genderOf({singular:'mapa'}),'masculino');
assert.equal(genderOf({singular:'día'}),'masculino');
assert.equal(genderOf({singular:'foto'}),'femenino');
let checked = 0;
for (const t of templates) {
  validateLanguage(t);
  for (const number of [1,21]) for (const field of ['enunciado','enunciadoCompacto'].filter(f=>t[f])) {
    const text = t[field].replace(/\{([^{}]+)\}/g, (_, key) => {
      const v=t.variables[key];return v.tipo==='entero'?number:v.tipo==='concordancia'?v[number===1?'singular':'plural']:v.valores[0];
    });
    assert.ok(!/[{}]|undefined|NaN/.test(text));
    for (const v of Object.values(t.variables).filter(v=>v.tipo==='concordancia')) {
      assert.ok(!new RegExp(`(?<!\\d)1 ${v.plural}\\b`, 'u').test(text),t.id+': '+text);
      const wrong=v.genero==='femenino'?'Cuántos':'Cuántas';
      assert.ok(!text.includes(`${wrong} ${v.plural}`),t.id);
    }
    checked++;
  }
  if(t.pasos[0].operacion==='division'&&t.pasos[1]?.operacion==='multiplicacion'){
    assert.ok(t.enunciado.includes('cada día'),t.id);
    assert.ok(t.enunciadoCompacto.includes('cada día'),t.id);
  }
}
const example=structuredClone(templates.find(t=>t.id==='resta-encuadernacion-individual-038'));
example.ejemplo.valores.cantidadA=87;example.ejemplo.valores.cantidadB=71;example.ejemplo.respuesta='16';
const envelope=t=>({version:1,idioma:'es',plantillas:[t]});
assert.ok(validateBank(envelope(example))[0].enunciado.includes('¿Cuántas hojas les faltan?'));
example.enunciado=example.enunciado.replace('Cuántas hojas','Cuántos hojas');
assert.throws(()=>validateBank(envelope(example)),/Concordancia incorrecta/);
const groups=new Map();
for(const t of globalThis.NinjaAdvancedProblemBank.plantillas){const key=t.family+':'+[...t.categories].sort().join(',');if(!groups.has(key))groups.set(key,t);}
for(const t of groups.values())for(const seed of [3,23]){
  const settings={...Object.fromEntries(categories.map(k=>[k,{enabled:t.categories.includes(k)}])),_family:t.family,_fractionNumerator:1,_fractionDenominator:1,_theoryDigits:1,_theoryCount:4,_mcmEnabled:t.categories.includes('mcm'),_mcdEnabled:t.categories.includes('mcd')};
  const options={mix:t.categories.length>1?'combinados':'individuales'};
  for(let i=0;i<engine.compatible(settings,options).length;i++){
    const op=engine.generate(settings,i,seed,options);
    for(const text of [op.problem.text,op.problem.compactText]){
      assert.ok(!/(?<![\d/])1 (minutos|tarjetas|alumnos|unidades|veces)\b/.test(text),op.problem.templateId+': '+text);
      assert.ok(!/[{}]|undefined|NaN/.test(text));checked++;
    }
  }
}
const settings=Object.fromEntries(categories.map(k=>[k,{enabled:k==='suma',difficulty:'todas',minDigits:1,maxDigits:2}]));
for(let seed=1;seed<=30;seed++)for(let i=0;i<40;i++){
  const op=engine.generate(settings,i,seed);
  if(op.problem.values.nombre1&&op.problem.values.nombre2)assert.notEqual(op.problem.values.nombre1,op.problem.values.nombre2);
}
console.log(`OK: ${templates.length} integer and 720 advanced templates; ${checked} language checks, gender, singulars, explicit daily rates, distinct names and the 87/71 sheets regression.`);
