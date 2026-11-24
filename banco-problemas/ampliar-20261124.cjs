const fs=require('node:fs'),path=require('node:path');
// Idempotent addition of reviewed, editable stories; numbers remain placeholders.
const stories={
  sumas:[
    ['Mensajes del colegio','mensaje','mensajes','masculino','El lunes el colegio recibe {cantidadA} {unidadA} en su buzón. El martes recibe {cantidadB} {unidadB} más. ¿Cuántos mensajes recibe entre los dos días?'],
    ['Semillas para el huerto','semilla','semillas','femenino','La clase guarda {cantidadA} {unidadA} para el huerto. Otra clase trae {cantidadB} {unidadB} para plantarlas juntas. ¿Cuántas semillas tienen ahora?'],
    ['Fotos de la excursión','foto','fotos','femenino','En la excursión, un grupo hace {cantidadA} {unidadA} por la mañana y {cantidadB} {unidadB} por la tarde. ¿Cuántas fotos hace durante el día?'],
    ['Piedras del camino','piedra','piedras','femenino','Para decorar un camino del huerto, el grupo recoge {cantidadA} {unidadA} lisas y {cantidadB} {unidadB} rugosas. ¿Cuántas piedras recoge en total?'],
    ['Entradas del teatro','entrada','entradas','femenino','El colegio vende {cantidadA} {unidadA} para una obra de teatro por internet y {cantidadB} {unidadB} en la puerta. ¿Cuántas entradas vende en total?'],
    ['Vasos para la merienda','vaso','vasos','masculino','En una mesa hay {cantidadA} {unidadA} para la merienda. Traen {cantidadB} {unidadB} de otra clase. ¿Cuántos vasos hay ahora en la mesa?'],
    ['Dibujos para el mural','dibujo','dibujos','masculino','Para un mural, una clase prepara {cantidadA} {unidadA} de animales y {cantidadB} {unidadB} de plantas. ¿Cuántos dibujos prepara para el mural?'],
    ['Marcapáginas solidarios','marcapáginas','marcapáginas','masculino','Un grupo prepara {cantidadA} {unidadA} para una feria. Otro grupo prepara {cantidadB} {unidadB}. ¿Cuántos marcapáginas reúnen entre los dos grupos?'],
    ['Cuentos para leer','cuento','cuentos','masculino','En el rincón de lectura hay {cantidadA} {unidadA}. La biblioteca presta a la clase {cantidadB} {unidadB} más. ¿Cuántos cuentos hay ahora en el rincón?'],
    ['Tapones recogidos','tapón','tapones','masculino','En una campaña de reciclaje, una clase recoge {cantidadA} {unidadA} y otra recoge {cantidadB} {unidadB}. ¿Cuántos tapones reúnen entre las dos clases?']
  ],
  restas:[
    ['Hojas para encuadernar','hoja','hojas','femenino','El taller tiene {cantidadA} {unidadA} de papel. Usa {cantidadB} {unidadB} para hacer cuadernos. ¿Cuántas hojas le quedan?'],
    ['Plantas que faltan','planta','plantas','femenino','Para completar el huerto necesitan {cantidadA} {unidadA}. La clase ya ha plantado {cantidadB} {unidadB}. ¿Cuántas plantas les faltan para completar el huerto?'],
    ['Entradas disponibles','entrada','entradas','femenino','Para una función hay {cantidadA} {unidadA} a la venta. El teatro ya ha vendido {cantidadB} {unidadB}. ¿Cuántas entradas quedan por vender?'],
    ['Piezas del puzle','pieza','piezas','femenino','Un puzle tiene {cantidadA} {unidadA}. El grupo ya ha colocado {cantidadB} {unidadB}. ¿Cuántas piezas quedan por colocar?'],
    ['Libros que faltan por ordenar','libro','libros','masculino','Hay que ordenar {cantidadA} {unidadA} en la biblioteca. La clase ya ha ordenado {cantidadB} {unidadB}. ¿Cuántos libros quedan por ordenar?'],
    ['Pulseras de la feria','pulsera','pulseras','femenino','Un puesto de la feria prepara {cantidadA} {unidadA}. Durante la mañana vende {cantidadB} {unidadB}. ¿Cuántas pulseras le quedan para la tarde?'],
    ['Pelotas prestadas','pelota','pelotas','femenino','En el armario de deportes hay {cantidadA} {unidadA}. La maestra presta {cantidadB} {unidadB} para el recreo. ¿Cuántas pelotas quedan en el armario?'],
    ['Sobres por preparar','sobre','sobres','masculino','El colegio tiene que preparar {cantidadA} {unidadA} para las familias. Ya ha preparado {cantidadB} {unidadB}. ¿Cuántos sobres le quedan por preparar?'],
    ['Pegatinas del álbum','pegatina','pegatinas','femenino','Para completar un álbum necesitan {cantidadA} {unidadA}. En el álbum ya hay {cantidadB} {unidadB}. ¿Cuántas pegatinas les faltan?'],
    ['Tizas que quedan','tiza','tizas','femenino','Para dibujar en el patio hay {cantidadA} {unidadA}. El grupo gasta {cantidadB} {unidadB}. ¿Cuántas tizas quedan sin gastar?']
  ],
  multiplicaciones:[
    ['Semillas en macetas','maceta','macetas','femenino','semilla','semillas','femenino','Para un experimento preparan {cantidadA} {unidadA}. En cada maceta ponen {cantidadB} {unidadB}. ¿Cuántas semillas utilizan en total?'],
    ['Fotos de cada equipo','equipo','equipos','masculino','foto','fotos','femenino','En una salida participan {cantidadA} {unidadA}. Cada equipo elige {cantidadB} {unidadB} para el mural. ¿Cuántas fotos eligen entre todos los equipos?'],
    ['Botellas para las cajas','caja','cajas','femenino','botella','botellas','femenino','Para una jornada deportiva preparan {cantidadA} {unidadA}. En cada caja guardan {cantidadB} {unidadB} de agua. ¿Cuántas botellas guardan en total?'],
    ['Hojas en cuadernos','cuaderno','cuadernos','masculino','hoja','hojas','femenino','En el taller hacen {cantidadA} {unidadA} iguales. Cada cuaderno lleva {cantidadB} {unidadB}. ¿Cuántas hojas necesitan para todos los cuadernos?'],
    ['Cuentas de las pulseras','pulsera','pulseras','femenino','cuenta','cuentas','femenino','Para una feria hacen {cantidadA} {unidadA}. En cada pulsera colocan {cantidadB} {unidadB} de colores. ¿Cuántas cuentas utilizan en total?'],
    ['Tizas en estuches','estuche','estuches','masculino','tiza','tizas','femenino','La clase prepara {cantidadA} {unidadA} para dibujar en el patio. Guarda {cantidadB} {unidadB} en cada estuche. ¿Cuántas tizas guarda en total?'],
    ['Libros en carros','carro','carros','masculino','libro','libros','masculino','La biblioteca utiliza {cantidadA} {unidadA} para llevar libros a las aulas. En cada carro coloca {cantidadB} {unidadB}. ¿Cuántos libros lleva en total?'],
    ['Tarjetas de cada mesa','mesa','mesas','femenino','tarjeta','tarjetas','femenino','Para un juego preparan {cantidadA} {unidadA}. Dejan {cantidadB} {unidadB} en cada mesa. ¿Cuántas tarjetas reparten en total?'],
    ['Banderines para los equipos','equipo','equipos','masculino','banderín','banderines','masculino','En una fiesta participan {cantidadA} {unidadA}. Cada equipo hace {cantidadB} {unidadB} para decorar. ¿Cuántos banderines hacen entre todos?'],
    ['Pegatinas en sobres','sobre','sobres','masculino','pegatina','pegatinas','femenino','Para un intercambio preparan {cantidadA} {unidadA}. Ponen {cantidadB} {unidadB} en cada sobre. ¿Cuántas pegatinas reparten en total?']
  ],
  divisiones:[
    ['Semillas por maceta','semilla','semillas','femenino','maceta','macetas','femenino','La clase tiene {cantidadA} {unidadA}. Las reparte por igual entre {cantidadB} {unidadB}, sin que sobre ninguna. ¿Cuántas semillas pone en cada maceta?'],
    ['Tarjetas por equipo','tarjeta','tarjetas','femenino','equipo','equipos','masculino','Para un juego hay {cantidadA} {unidadA}. Se reparten por igual entre {cantidadB} {unidadB}, sin que sobre ninguna. ¿Cuántas tarjetas recibe cada equipo?'],
    ['Botellas en cajas','botella','botellas','femenino','caja','cajas','femenino','Para una excursión tienen {cantidadA} {unidadA} de agua. Las guardan por igual en {cantidadB} {unidadB}, sin que sobre ninguna. ¿Cuántas botellas guardan en cada caja?'],
    ['Hojas por cuaderno','hoja','hojas','femenino','cuaderno','cuadernos','masculino','En el taller tienen {cantidadA} {unidadA}. Con ellas hacen {cantidadB} {unidadB} con el mismo número de hojas, sin que sobre ninguna. ¿Cuántas hojas lleva cada cuaderno?'],
    ['Cuentas por pulsera','cuenta','cuentas','femenino','pulsera','pulseras','femenino','Para una feria tienen {cantidadA} {unidadA} de colores. Las usan todas para hacer {cantidadB} {unidadB} iguales. ¿Cuántas cuentas lleva cada pulsera?'],
    ['Tizas por estuche','tiza','tizas','femenino','estuche','estuches','masculino','La clase tiene {cantidadA} {unidadA}. Las guarda por igual en {cantidadB} {unidadB}, sin que sobre ninguna. ¿Cuántas tizas pone en cada estuche?'],
    ['Libros por carro','libro','libros','masculino','carro','carros','masculino','En la biblioteca trasladan {cantidadA} {unidadA}. Los reparten por igual entre {cantidadB} {unidadB}, sin que sobre ninguno. ¿Cuántos libros lleva cada carro?'],
    ['Pinceles por mesa','pincel','pinceles','masculino','mesa','mesas','femenino','En el taller hay {cantidadA} {unidadA}. Los reparten por igual entre {cantidadB} {unidadB}, sin que sobre ninguno. ¿Cuántos pinceles dejan en cada mesa?'],
    ['Banderines por equipo','banderín','banderines','masculino','equipo','equipos','masculino','Para decorar tienen {cantidadA} {unidadA}. Los reparten por igual entre {cantidadB} {unidadB}, sin que sobre ninguno. ¿Cuántos banderines recibe cada equipo?'],
    ['Pegatinas por sobre','pegatina','pegatinas','femenino','sobre','sobres','masculino','Para un intercambio tienen {cantidadA} {unidadA}. Las reparten por igual en {cantidadB} {unidadB}, sin que sobre ninguna. ¿Cuántas pegatinas ponen en cada sobre?']
  ]
};
for(const [file,list]of Object.entries(stories)){
  const target=path.join(__dirname,file+'.json'),bank=JSON.parse(fs.readFileSync(target,'utf8'));
  list.forEach((row,i)=>{
    const id=`${file}-nuevo-20261124-${i+1}`,existing=bank.plantillas.findIndex(t=>t.id===id);
    const t=structuredClone(bank.plantillas[0]),two=row.length===8;
    t.id=id;t.titulo=row[0];t.enunciado=row.at(-1);t.dificultad='facil';
    const unitA={singular:row[1],plural:row[2],genero:row[3]},unitB=two?{singular:row[4],plural:row[5],genero:row[6]}:unitA;
    for(const [key,unit]of [['unidadA',unitA],['unidadB',unitB]])Object.assign(t.variables[key],unit);
    t.variables.cantidadA.descripcion=two&&file==='multiplicaciones'?'Número de grupos':'Cantidad inicial o total';
    t.variables.cantidadB.descripcion=file==='multiplicaciones'?'Cantidad de cada grupo':file==='divisiones'?'Número de grupos':'Cantidad que se añade o retira';
    t.respuesta.unidad=file==='multiplicaciones'?unitB:unitA;
    if(existing<0)bank.plantillas.push(t);else bank.plantillas[existing]=t;
  });
  fs.writeFileSync(target,JSON.stringify(bank,null,2)+'\n');
}
console.log('40 nuevas historias editables incorporadas. Ejecuta compilar-banco.cjs para actualizar los datos de la app.');
