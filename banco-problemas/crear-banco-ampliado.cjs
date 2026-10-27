const fs = require('node:fs');
const path = require('node:path');
const scenes = [
  ['pintura', 'Colores para un mural', 'En el taller de pintura', 'litros de pintura'],
  ['huerto', 'El riego del huerto', 'En el huerto del colegio', 'litros de agua'],
  ['pan', 'Pan para compartir', 'En la panadería del barrio', 'kilos de harina'],
  ['zumo', 'Una merienda saludable', 'En la cocina del colegio', 'litros de zumo'],
  ['cintas', 'Cintas para decorar', 'En el taller de decoración', 'metros de cinta'],
  ['cocina', 'Una receta para todos', 'En el taller de cocina', 'kilos de arroz'],
  ['barro', 'Figuras de barro', 'En el taller de cerámica', 'kilos de barro'],
  ['acuarela', 'Una tarde de acuarelas', 'En la clase de plástica', 'litros de agua'],
  ['costura', 'Disfraces de teatro', 'En el taller de costura', 'metros de tela'],
  ['refugio', 'Ayuda para los animales', 'En el refugio de animales', 'kilos de pienso'],
  ['granja', 'Cuidamos la granja', 'En la granja escuela', 'kilos de semillas'],
  ['batidos', 'Batidos de fruta', 'En el puesto de batidos', 'litros de leche'],
  ['jardin', 'Flores en el colegio', 'En el jardín del colegio', 'kilos de tierra'],
  ['cometa', 'Cometas de colores', 'En el taller de cometas', 'metros de cuerda'],
  ['deporte', 'Una mañana de deporte', 'En el polideportivo', 'litros de agua'],
  ['museo', 'Preparamos una exposición', 'En el taller del museo', 'metros de papel'],
  ['galletas', 'Galletas para la fiesta', 'En el taller de repostería', 'kilos de masa'],
  ['acuario', 'Cuidamos el acuario', 'En el aula de ciencias', 'litros de agua'],
  ['campamento', 'La cena del campamento', 'En el campamento de verano', 'kilos de pasta'],
  ['fotografia', 'Un álbum de recuerdos', 'En el taller de fotografía', 'metros de cartulina'],
  ['jabones', 'Jabones artesanales', 'En el taller de jabones', 'litros de aceite'],
  ['musica', 'Decoramos el concierto', 'En la escuela de música', 'metros de cinta'],
  ['mercado', 'El mercado del barrio', 'En el puesto del mercado', 'kilos de fruta'],
  ['biblioteca', 'Protegemos los libros', 'En la biblioteca del colegio', 'metros de forro'],
  ['maquetas', 'Maquetas del barrio', 'En el taller de maquetas', 'metros de hilo'],
  ['helados', 'Helados para la feria', 'En el puesto de helados', 'litros de nata'],
  ['chocolate', 'Una taza calentita', 'En la cocina del albergue', 'litros de chocolate'],
  ['recreo', 'Un recreo con juegos', 'En el patio del colegio', 'metros de cuerda'],
  ['semillas', 'Semillas para el futuro', 'En el club de naturaleza', 'kilos de semillas'],
  ['fiesta', 'La fiesta de fin de curso', 'En la sala de fiestas', 'litros de limonada'],
  ['titeres', 'Un escenario de títeres', 'En el taller de títeres', 'metros de tela'],
  ['invernadero', 'Las plantas del invernadero', 'En el invernadero escolar', 'litros de agua'],
  ['mermelada', 'Mermelada para compartir', 'En el taller de conservas', 'kilos de fruta'],
  ['velas', 'Velas para decorar', 'En el taller de velas', 'kilos de cera'],
  ['piscina', 'Preparamos los juegos de agua', 'En la piscina municipal', 'litros de agua'],
  ['encuadernacion', 'Cuadernos hechos a mano', 'En el taller de encuadernación', 'metros de hilo'],
  ['aromaticas', 'Un jardín de plantas aromáticas', 'En el jardín de plantas aromáticas', 'kilos de tierra'],
  ['comparsas', 'La comparsa del colegio', 'En el taller de carnaval', 'metros de cinta'],
  ['sopa', 'La sopa del comedor', 'En la cocina del comedor', 'litros de caldo'],
  ['panales', 'Una visita al colmenar', 'En el taller del colmenar', 'kilos de miel']
].map(([key, title, intro, unit]) => ({ key, title, intro, unit, unitGender: 'masculino', unitSingular: unit.replace(/^(litros|kilos|metros)/, word => ({ litros: 'litro', kilos: 'kilo', metros: 'metro' })[word]) }));
const categories = ['suma', 'resta', 'multiplicacion', 'division'];
const plantillas = [];
for (let mask = 1; mask < 16; mask++) {
  const selected = categories.filter((_, i) => mask & (1 << i));
  scenes.forEach((scene, i) => {
    const order = i % 2 ? [...selected] : ['multiplicacion', 'suma', 'resta', 'division'].filter(k => selected.includes(k));
    plantillas.push({ id: `fracciones-${selected.join('-')}-${scene.key}`, family: 'fracciones', title: scene.title, categories: selected, order, scene });
  });
}
for (const selected of [['mcm'], ['mcd'], ['mcm', 'mcd']]) for (const [index, scene] of scenes.entries()) {
  plantillas.push({ id: `teoria-${selected.join('-')}-${scene.key}`, family: 'mcmMcd', title: scene.title, categories: selected, variant: index % 3, scene });
}
fs.writeFileSync(path.join(__dirname, 'ampliado.json'), JSON.stringify({ version: 1, idioma: 'es', plantillas }, null, 2) + '\n');
console.log(`Banco ampliado creado: ${plantillas.length} plantillas.`);
