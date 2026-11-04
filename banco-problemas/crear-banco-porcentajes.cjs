const fs = require('node:fs');
const path = require('node:path');

// Each context supplies complete noun phrases; no inferred gender agreement.
const scenes = [
  ['papeleria', 'En la papelería del barrio', 'una mochila', 'material escolar'],
  ['libreria', 'En la librería de la plaza', 'un libro de aventuras', 'libros para la biblioteca'],
  ['deporte', 'En la tienda de deportes', 'un balón', 'material deportivo'],
  ['juguetes', 'En la juguetería', 'un juego de mesa', 'juegos para el aula'],
  ['musica', 'En la tienda de música', 'una flauta', 'instrumentos para la clase'],
  ['bicicletas', 'En el taller de bicicletas', 'un casco', 'cascos para una salida'],
  ['pintura', 'En la tienda de pintura', 'un estuche de pinceles', 'pintura para un mural'],
  ['jardin', 'En el centro de jardinería', 'una regadera', 'plantas para el patio'],
  ['teatro', 'En el taller de teatro', 'un disfraz', 'vestuario para la función'],
  ['costura', 'En la mercería', 'un costurero', 'tela para disfraces'],
  ['ceramica', 'En el taller de cerámica', 'una caja de herramientas', 'barro para modelar'],
  ['fotografia', 'En la tienda de fotografía', 'un álbum', 'fotos para una exposición'],
  ['informatica', 'En la tienda de informática', 'un teclado', 'equipos para el aula'],
  ['campamento', 'En la tienda de acampada', 'una linterna', 'material para el campamento'],
  ['natacion', 'En la tienda de la piscina', 'unas gafas de natación', 'material de natación'],
  ['patinaje', 'En la tienda de patinaje', 'un par de patines', 'protecciones para patinar'],
  ['excursion', 'En la oficina de excursiones', 'una entrada para el parque', 'entradas para una visita'],
  ['museo', 'En la tienda del museo', 'un puzle', 'recuerdos de la visita'],
  ['ciencia', 'En la tienda de ciencias', 'una lupa', 'material para experimentos'],
  ['astronomia', 'En la tienda del planetario', 'un mapa del cielo', 'material de astronomía'],
  ['ajedrez', 'En el club de ajedrez', 'un tablero', 'tableros para el torneo'],
  ['cometas', 'En el taller de cometas', 'una cometa', 'material para hacer cometas'],
  ['robots', 'En el taller de robótica', 'un pequeño robot', 'piezas de robótica'],
  ['huerto', 'En la cooperativa del huerto', 'una pala', 'semillas para el huerto'],
  ['cocina', 'En la tienda de cocina', 'un molde', 'utensilios para cocinar'],
  ['panaderia', 'En la panadería', 'una bandeja de magdalenas', 'pan para la merienda'],
  ['fruteria', 'En la frutería', 'una cesta de fruta', 'fruta para una fiesta'],
  ['mercado', 'En el mercado del barrio', 'una cesta de productos', 'alimentos para una actividad'],
  ['refugio', 'En la tienda de animales', 'un transportín', 'comida para el refugio'],
  ['acuario', 'En la tienda de acuarios', 'un filtro', 'material para cuidar el acuario'],
  ['radio', 'En el taller de radio escolar', 'un micrófono', 'material de grabación'],
  ['cine', 'En el taller de cine', 'un trípode', 'material para un cortometraje'],
  ['encuadernacion', 'En el taller de encuadernación', 'un cuaderno artesanal', 'papel para hacer cuadernos'],
  ['comic', 'En la tienda de cómics', 'un cómic', 'cómics para un rincón de lectura'],
  ['manualidades', 'En la tienda de manualidades', 'un estuche de rotuladores', 'material para decorar la clase'],
  ['fiesta', 'En la tienda de celebraciones', 'una guirnalda', 'adornos para la fiesta'],
  ['calzado', 'En la zapatería', 'un par de zapatillas', 'calzado para una actividad'],
  ['ropa', 'En la tienda de ropa', 'una camiseta', 'camisetas para el equipo'],
  ['viaje', 'En la tienda de equipaje', 'una maleta', 'equipaje para un viaje'],
  ['solidaridad', 'En el mercadillo solidario', 'una pulsera artesanal', 'material para una campaña solidaria']
].map(([key, intro, item, purpose]) => ({ key, intro, item, purpose }));
const titles = { parte: 'Calcula una parte', descuento: 'Precio con descuento', aumento: 'Precio después de un aumento', relacion: 'Qué porcentaje representa' };
const templates = Object.entries(titles).flatMap(([type, title]) => scenes.map((scene, i) => ({
  id: `porcentajes-${type}-${scene.key}`, family: 'porcentajes', type,
  title: `${title}: ${scene.purpose}`, variant: i % 4, scene
})));
const bank = { version: 1, idioma: 'es', plantillas: templates };
fs.writeFileSync(path.join(__dirname, 'porcentajes.json'), JSON.stringify(bank, null, 2) + '\n');
console.log(`Creadas ${templates.length} plantillas de porcentajes. Compila el banco para publicarlas.`);
