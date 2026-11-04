const fs = require('node:fs');
const path = require('node:path');
const contexts = [
  ['costura', 'En el taller de costura'], ['huerto', 'En el huerto del colegio'], ['biblioteca', 'En la biblioteca'], ['pintura', 'En el taller de pintura'],
  ['teatro', 'En el grupo de teatro'], ['cocina', 'En el taller de cocina'], ['deporte', 'En el club de deporte'], ['campamento', 'En el campamento'],
  ['ciencia', 'En la clase de ciencias'], ['manualidades', 'En el taller de manualidades'], ['musica', 'En la escuela de música'], ['jardin', 'En el jardín del colegio'],
  ['reciclaje', 'En el taller de reciclaje'], ['fiesta', 'En la fiesta del colegio'], ['excursion', 'En la salida de la clase'], ['robotica', 'En el taller de robótica'],
  ['astronomia', 'En el club de astronomía'], ['lectura', 'En el club de lectura'], ['ceramica', 'En el taller de cerámica'], ['cometas', 'En el taller de cometas'],
  ['granja', 'En la granja escuela'], ['museo', 'En el taller del museo'], ['acuario', 'En el taller del acuario'], ['solidaridad', 'En la jornada solidaria'],
  ['fotografia', 'En el taller de fotografía'], ['cine', 'En el taller de cine'], ['radio', 'En el taller de radio escolar'], ['circo', 'En el taller de circo'],
  ['danza', 'En la escuela de danza'], ['ajedrez', 'En el club de ajedrez'], ['naturaleza', 'En el aula de naturaleza'], ['verano', 'En la escuela de verano'],
  ['inventos', 'En el taller de inventos'], ['papel', 'En el taller de papel'], ['decoracion', 'En el taller de decoración'], ['artesania', 'En el taller de artesanía'],
  ['barrio', 'En el centro cultural del barrio'], ['familias', 'En la jornada de las familias'], ['cooperativa', 'En la cooperativa escolar'], ['convivencia', 'En la jornada de convivencia']
];
const labels = { longitud: 'Longitud', masa: 'Masa', capacidad: 'Capacidad', tiempo: 'Tiempo' };
const plantillas = Object.entries(labels).flatMap(([type, label]) => contexts.map(([key, intro]) => ({ id: `medidas-${type}-${key}`, family: 'medidas', type, title: `${label}: ${intro}`, scene: { key, intro } })));
fs.writeFileSync(path.join(__dirname, 'medidas.json'), JSON.stringify({ version: 1, idioma: 'es', plantillas }, null, 2) + '\n');
console.log(`Creadas ${plantillas.length} plantillas de medidas. Compila el banco para publicarlas.`);
