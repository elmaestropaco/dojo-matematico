const assert=require('node:assert/strict'),lib=require('../notacion.js'),sessions=require('../sesiones.js');
const dot={multiplicationSymbol:'\u00b7',divisionSymbol:':'},cross={multiplicationSymbol:'x',divisionSymbol:'/'};
assert.deepEqual(lib.options(),cross);assert.deepEqual(lib.options({multiplicationSymbol:'<script>',divisionSymbol:'bad'}),cross);
for(const settings of [dot,cross]){
 const {multiplicationSymbol:m,divisionSymbol:d}=settings;
 assert.equal(lib.text('7 \u00d7 8 \u00f7 2',settings),`7 ${m} 8 ${d} 2`);
 assert.equal(lib.text('(7 + 8) x 2 / 3',settings),`(7 + 8) ${m} 2 ${d} 3`);
 assert.equal(lib.text('x 3',settings),`${m} 3`);
 assert.equal(lib.text('3x^2 + 2x = 5',settings),'3x^2 + 2x = 5');
 assert.equal(lib.text('x = 3/4',settings),'x = 3/4');
 assert.equal(lib.text('1,5 \u00d7 0,2',settings),`1,5 ${m} 0,2`);
 assert.equal(lib.text('1/2 / 3/4',settings),`1/2 ${d} 3/4`);
 assert.equal(lib.text('https://example.com/a/b',settings),'https://example.com/a/b');
 assert.equal(lib.text('Aciertos / fallos',settings),'Aciertos / fallos');
 assert.equal(lib.text('Lunes \u00b7 Martes',settings),'Lunes \u00b7 Martes');
 assert.deepEqual(sessions.cleanConfig(settings),settings);
}
console.log('OK: display-only operator choices, protected fractions/variables/decimals/URLs and saved-session configuration.');
