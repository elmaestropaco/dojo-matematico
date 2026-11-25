const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
for(const file of fs.readdirSync(root).filter(f=>/\.(js|html|css|md)$/.test(f))){
  const source=fs.readFileSync(path.join(root,file),'utf8');
  assert.ok(!/\ufffd|\u00c3[\u0080-\u00bf]|\u00c2[\u0080-\u00bf]|\u00e2[\u0080-\u00bf]|\u00f0\u0178/.test(source),'Invalid UTF-8 or mojibake: '+file);
}
const source=fs.readFileSync(path.join(root,'fichas-ui.js'),'utf8')+fs.readFileSync(path.join(root,'fichas-pdf.js'),'utf8');
for(const text of ['M\u00e1ximo por fila','Autom\u00e1tico (hasta 5)','autom\u00e1ticamente','N\u00fameros naturales','N\u00fameros enteros','\u00c1lgebra y ESO'])assert.ok(source.includes(text),'Missing correct accented label: '+text);
assert.ok(!/M\?ximo|Autom\?tico|autom\?ticamente|N\?meros|\?lgebra/.test(source),'Corrupted worksheet label');
console.log('OK: UTF-8 source files and all worksheet accent regression labels.');
