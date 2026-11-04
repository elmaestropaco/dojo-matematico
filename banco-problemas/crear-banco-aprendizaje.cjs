const fs = require('node:fs');
const path = require('node:path');
require('../problemas.js'); require('../matematicas-extra.js'); require('../porcentajes.js'); require('../magnitudes.js');
const extension = require('../ampliacion.js');
fs.writeFileSync(path.join(__dirname, 'aprendizaje.json'), JSON.stringify({ version: 1, idioma: 'es', plantillas: extension.bank }, null, 2) + '\n');
console.log(`Creadas ${extension.bank.length} plantillas de aprendizaje. Compila el banco para publicarlas.`);
