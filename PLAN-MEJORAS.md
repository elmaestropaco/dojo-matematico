# Plan de mejoras por bloques

Inicio: 2026-11-11. Se implementa y comprueba un bloque antes de pasar al siguiente.

| Bloque | Alcance | Estado |
| --- | --- | --- |
| 1. Organizar el dojo | Sesiones guardadas con nombre, favoritas y buscador de actividades. | Completado y comprobado |
| 2. Calculo y equivalencias | Fraccion-decimal-porcentaje; multiplicar/dividir por 10, 100 y 1000; ordenar enteros, valor absoluto, recta numerica y angulos. | Completado y comprobado |
| 3. Problemas y lectura de datos | Horarios, tablas, graficos, media, probabilidad sencilla, problemas inversos, datos insuficientes y detectar errores. | Completado y comprobado |
| 4. Geometria espacial | Volumen de cubos y prismas rectangulares, dibujos y soluciones. | Completado y comprobado |
| 5. Dinamica de partidas | Dificultad progresiva opcional con puntuacion visible por nivel, pausa/explicacion del maestro y equipos. | Completado y comprobado |
| 6. Accesibilidad y seguimiento | Modo pizarra de alto contraste e informes acumulados por contenido que indiquen necesidades de practica. | Completado y comprobado |

## Criterios del bloque 5

La dificultad progresiva debe estar desactivada por defecto. Antes de empezar
se explicaran los niveles y puntos por acierto; no cambiara silenciosamente
la penalizacion por fallo. Separar resultados progresivos de los de dificultad
fija. En competicion sera una opcion explicita del anfitrion: una adaptacion
individual no debe dar ventajas injustas. Su formula y reglas ya estan implementadas y probadas; ver DINAMICA.md.

## Bloque 1

Las sesiones se guardan solo en el navegador y contienen actividad, operaciones,
cifras, formato, duracion, objetivos y opciones didacticas. No contienen nombres,
resultados, credenciales, identidades ni codigos de sala. Cargarlas no inicia una
partida, no cambia el modo elegido y no modifica una ronda en curso. En el panel
del maestro preparan los ajustes de la siguiente ronda, sin sustituir el codigo.

Los favoritos de actividades son accesos rapidos, no operaciones activadas de
forma automatica. El buscador no altera las selecciones ni oculta controles del
resto de la app. Todo el bloque empieza plegado y se mueve con los ajustes al
crear salas online y preparar rondas del maestro.

Comprobaciones: persistencia, favoritos, datos malformados, almacenamiento
bloqueado, limites, nombres con caracteres HTML, busqueda sin tildes y cinco
tamanos de pantalla. Carga local, online y maestro sin cambiar modo/codigo;
bloqueo de aplicacion durante rondas activas y para alumnos de una sala.

## Bloque 2

Seis actividades nuevas en Calculo > Equivalencias, enteros y angulos, plegado
inicialmente. Multiplicar/dividir por potencias de diez tiene selectores de
cifras, decimales iniciales, operacion y factor. Equivalencias ofrece las seis
direcciones entre fraccion, decimal y porcentaje, siempre exactas.

Ordenar muestra de tres a cinco enteros y pide el numero de una posicion,
ordenados de menor a mayor o al reves. Se evita introducir una lista en el
teclado numerico. Valor absoluto calcula la distancia al cero. Recta numerica
pide el valor de una marca; las marcas son equidistantes. Estos retos incluyen
negativos por su propia naturaleza, sin activar negativos en otras operaciones.

Angulos permite complementarios, suplementarios, interiores de un triangulo
y vuelta completa; incluye esquemas y explicaciones. Las pistas progresivas
se adaptan a cada actividad. Sesiones, favoritos, configuracion online, rondas
del maestro e informes reconocen los nuevos tipos. No cambian las reglas de
Firebase ni las puntuaciones. La dificultad progresiva se incorpora en el bloque 5.

Comprobaciones: 7200 retos con referencias matematicas independientes, 480
vistas de navegador en cinco tamanos, teclados fisico/tactil, cambio de
teclado entre retos, conservacion de dibujos al cambiar formato, generacion
online reproducible y regresiones de sesiones y pantalla del maestro.

## Bloque 3

160 plantillas nuevas (2060 en total), repartidas en Horarios, Tablas y graficos,
Media y probabilidad e Investiga y razona. Cuatro estructuras y diez contextos
por familia, con tres niveles y selectores de tipos independientes. Los ajustes
empiezan plegados. Las opciones se eligen por tactil o numero de teclado y se
confirman con Enviar. Las probabilidades se responden como fraccion equivalente.

Las opciones se barajan de manera reproducible en online; no hay una posicion
fija para la respuesta correcta. Se conserva el teclado tactil y el numerico
para las preguntas sin opciones. Las soluciones mantienen enunciado y datos,
las tablas se transponen en batalla compacta y los graficos tienen datos exactos.
Sesion guardada, favoritos, pistas, repaso, informes y maestro reconocen los tipos.
No cambian las reglas de Firebase ni la puntuacion.

Pruebas: 3840 problemas generados, 1792 vistas en cinco tamanos con ambas letras,
1200 casos con opciones, respuestas tactiles/fisicas, cambio entre opciones y
fracciones, medianoche, medias exactas, probabilidad y regresiones del maestro.

## Bloque 4

Dos operaciones: volumen de cubos y de prismas rectangulares, con medidas de
1-3 cifras y cm, dm o m. Una familia espacial con 40 plantillas: cubo, prisma,
cubitos por filas/capas y depositos en litros. El banco alcanza 2100 plantillas.
Los datos y resultados son enteros exactos. Los depositos tienen medidas
interiores en dm y aplican 1 dm3 = 1 litro. Dibujos SVG, soluciones, pistas,
sesiones, favoritos, informes y siguiente ronda del maestro.

Mejora adicional: buscador dentro de Operaciones, en todos los grupos, sin
desmarcar actividades. Ignora tildes y mayusculas, admite varias palabras,
abre grupos coincidentes e informa si no hay resultados. Limpiar o Escape
restauran los desplegables anteriores y no borran los ajustes.

Pruebas: 5040 volumenes y problemas, 528 vistas en cinco tamanos, ambas letras
en problemas, respuestas tactiles, sesiones, maestro, unidades cubicas y
generacion online reproducible. Buscador: coincidencias, sin resultados,
seleccion conservada y restauracion de desplegables en cinco tamanos.

## Bloque 5

Progresion opcional, apagada por defecto, con adaptacion individual y tramos
comunes por indice en competicion. Recompensas normales 10/15/20 y avanzadas
20/30/40. Sin cambios de penalizacion ni bonificaciones ficticias en limites.
Marcas e informes separan dificultad fija y progresiva. Sin ruleta en progresiva.

El anfitrion pausa/reanuda toda la sala con reloj congelado y puede explicar
una pregunta. La solucion compartida marca las preguntas pendientes para
pasarlas sin puntos, incluso al recargar. Equipos de 2-4 miembros/grupos con
nombres editables, reparto equilibrado, ajustes en espera y clasificacion por
media y total. Se mantienen tarjetas individuales y codigo en revancha.

Pruebas: algoritmo con repartos de hasta 100 perfiles, 60 vistas progresivas,
pausa/revelado/reanudacion, carrera entre pausa y final de ronda, sesiones sin
UID, equipos y maestro hasta 60 participantes. Regresiones de los bloques
anteriores y 82 permisos en emulador. Prueba real con anfitrion y dos alumnos:
equipos, pausa, respuestas bloqueadas, ayuda persistente, revancha desde pausa,
expulsion y reingreso autorizado. Reglas publicadas. Ver DINAMICA.md.

## Bloque 6

Modo pizarra local con fondos blancos, letras oscuras, foco visible y controles
destacados; no modifica el tema guardado ni los ajustes de la sala. Opciones de
movimiento reducido (tambien respeta el sistema) y pantalla completa cuando el
navegador la permite. Sin alterar el tamano de las filas de juego o del maestro.
La ruleta reducida aplica el evento directamente, sin cambiar puntos ni azar.

Informes acumulados con filtros de periodo, dificultad, alumno, contenido e
indicador. Vistas de resumen, contenido y plan de repaso, con cuatro hojas en
Excel y cuatro secciones para imprimir/PDF. Indicadores orientativos con aviso
de muestra pequena; los datos antiguos sin desglose no se reclasifican. Los
puntos de rondas mixtas no se atribuyen artificialmente a un contenido.

Pruebas: indicadores, filtros, historico, emojis, exportaciones seguras, 60 vistas
de alto contraste en cinco tamanos y tres temas, 114 vistas del maestro con
todos los alumnos sin scroll, arranque local real sin Firebase y regresiones
de aprendizaje y dinamica. No hay cambios de reglas Firebase ni nuevas
plantillas: el banco mantiene 2100. Detalles en PIZARRA-SEGUIMIENTO.md.
