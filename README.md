# Dojo Matematico

Web app educativa de calculo mental con modo individual, batalla local, teclado tactil, operaciones configurables, eventos sorpresa y cuadro de puntuaciones local.

## Ejecutar en local

1. Abre la carpeta del proyecto.
2. Abre `index.html` directamente en el navegador para jugar en local.
3. Opcionalmente usa un servidor estatico, por ejemplo Live Server en VS Code.

La app funciona sin backend para los modos locales.

Para preparar un paquete limpio ejecuta `powershell -NoProfile -ExecutionPolicy Bypass -File .\crear-release.ps1`. Incluye la
carpeta oculta `.github`, pero excluye configuracion local, dependencias y logs.
La version protegida del online y sus comprobaciones se explican en `SEGURIDAD.md`.

## Modo Problemas

En la pantalla inicial, elige **Que quieres practicar > Problemas**. Mantiene las modalidades entrenamiento, batalla local, online y maestro. Incluye **1900 plantillas**: 600 de numeros enteros, 600 de fracciones, 120 de MCM/MCD, 160 de porcentajes, 160 de medidas y 260 de razonamiento, geometria, compras y proporcionalidad. Enteros y fracciones tienen 40 de cada operacion individual y 40 de cada una de las 11 combinaciones de dos, tres o cuatro operaciones. MCM/MCD tiene 40 individuales de cada concepto y 40 que utilizan ambos. El desglose esta en `banco-problemas/RECUENTO.md`. Los bloques de categoria estan plegados y conservan su altura propia al desplegar un vecino. Durante la pregunta solo aparece Lee y resuelve: no se muestra la operacion necesaria ni el numero de pasos como pista involuntaria.

En enteros hay selectores Minimo y Maximo de cifras (1 a 9). Si coinciden, las cifras son fijas; si difieren, forman un intervalo. Se mantienen los limites de cada contexto. Los enunciados usan frases naturales y vocabulario accesible: Facil corresponde a un tipo de problema directo, Media pide razonamiento y Avanzada puede tener dos pasos. Para empezar a los 6 anos se recomienda Facil y una cifra. Responde solo con el numero, sin separadores de miles. Ver solucion explica los pasos sin sumar puntos.

Multiplicaciones tiene rangos independientes para Multiplicador 1 y Multiplicador 2; divisiones, para Dividendo y Divisor. Se guardan en el navegador y se comparten en las salas online. Las preferencias anteriores migran su rango comun a ambos operandos. En problemas de varios pasos se aplican a las cantidades dadas, segun el primer paso en que intervienen; un resultado intermedio no se recorta para forzar sus cifras. Las divisiones siempre son exactas. Algunos contextos tienen limites razonables (por ejemplo, personas por mesa); el contador muestra las plantillas compatibles con los ajustes actuales, no siempre las 600.

El selector de mezcla ofrece Solo individuales (un tipo por problema), Solo combinados (todos los tipos marcados en cada problema) e Individuales y combinados. No se incluyen operaciones sin marcar. Los combinados necesitan al menos dos tipos seleccionados; su numero de pasos depende de la seleccion y los ajustes de dificultad por categoria se aplican a los individuales. Las cifras se asignan a cada cantidad segun la operacion que la utiliza primero. Los resultados intermedios pueden tener mas cifras.

El texto es mas grande donde hay espacio y se ajusta para no tapar el teclado. Se puede elegir Imprenta o Ligada escolar, tambien mediante el boton Aa de la partida. La fuente Playwrite ES se incluye localmente con su licencia OFL en assets/fonts. La eleccion de letra es personal del dispositivo, no se impone desde la sala online. En batallas de moviles se utilizan versiones naturales mas breves de los combinados, con los mismos datos, y las soluciones numericas se muestran de forma compacta.

Al pulsar Ver solucion, el enunciado permanece visible junto a los pasos y el resultado. En escritorio individual se colocan lado a lado; en pantallas estrechas se apilan. Mientras se explica esa pregunta se aprovecha el espacio del teclado, que reaparece al pulsar Siguiente. No se suman puntos por consultar la solucion y la pagina de juego sigue sin scroll. Los enunciados de MCM/MCD asignan cada cantidad a una actividad, tira, paquete o coleccion y repiten las unidades para no confundir varios enteros con un decimal.

Sumas y restas tienen botones Ambas / Sin llevadas / Con llevadas. Se comprueban tambien sus pasos dentro de los combinados. Una resta entre cantidades de una cifra no puede tener prestamos; el motor excluye combinaciones imposibles. Las divisiones son exactas y los productos grandes se validan sin perdida de precision. El reloj muestra minutos y segundos, por ejemplo 2:50.

En problemas de enteros y MCM/MCD las respuestas son enteras no negativas. En fracciones se responde con numerador/denominador (tecla tactil /, o F o : en teclado), y tambien se aceptan fracciones equivalentes o un decimal exacto. Se eligen por separado las cifras del numerador y denominador, de 1 a 3, y los datos se muestran con esas cifras aunque admitan simplificacion. Las soluciones incluyen resultados intermedios y simplificacion. Las restas no producen cantidades negativas. Las opciones de decimales, negativos y eventos sorpresa de calculo se ocultan para problemas. Se conservan el sonido, las penalizaciones opcionales y la duracion elegida. Se recomienda dar mas tiempo de lectura que en calculo.

En problemas de MCM/MCD puedes elegir 2, 3 o 4 datos distintos de 1, 2 o 3 cifras. MCM trabaja encuentros de actividades periodicas y MCD repartos sin sobras con el maximo numero comun de grupos. Los combinados usan primero el MCM para obtener el momento de un reencuentro y luego el MCD para repartir las cantidades obtenidas; los resultados intermedios pueden superar las cifras elegidas. Cada grupo de datos generado contiene numeros distintos.

Las salas online comparten configuracion, orden de plantillas y variantes numericas reproducibles. Los ajustes de problemas se conservan en el navegador y pueden cambiarse para una siguiente ronda en la misma sala.

Consulta `banco-problemas/GUIA-Y-PLANTILLA.md`. Para comprobar los ejemplos ejecuta `node banco-problemas/validar-banco.cjs`; las pruebas del formato se ejecutan con `node tests/problem-bank.test.cjs`.

Tras editar los JSON ejecuta `node banco-problemas/compilar-banco.cjs` y sube tambien el `datos.js` generado. Para comprobar el motor ejecuta `node tests/problems-mode.test.cjs`. Las pruebas de navegador verifican las 600 plantillas y sus soluciones con las dos letras en escritorio, y una seleccion de los textos mas largos y problemas de varios pasos en cinco tamanos, individual y batalla, junto al reloj, plegables y controles independientes de operandos.

El banco ampliado se edita en `banco-problemas/ampliado.json`; el compilador tambien reconstruye `ampliado-datos.js`. `matematicas-extra.js` contiene el motor racional exacto y MCM/MCD, y debe cargarse despues de `problemas.js` y antes de `app.js`. Ejecuta `node tests/advanced-math.test.cjs` para comprobar las nuevas familias y `node tests/browser-smoke.cjs --advanced-only` para sus vistas. El constructor `crear-banco-ampliado.cjs` reconstruye el catalogo inicial; no lo ejecutes sobre un banco ampliado editado sin guardar antes tus cambios.

### Problemas de porcentajes

Elige la familia Porcentajes. Hay 40 contextos para cada tipo: calcular una parte, precio final con descuento, importe final tras un aumento y calcular que porcentaje representa una parte del total. Se pueden seleccionar varios tipos para alternarlos. Las preguntas de descuento piden el precio final, no solo el ahorro; las soluciones explican ambas cantidades. Se responde solo con el numero, sin euros ni simbolo %, y con coma cuando corresponda.

La cantidad inicial tiene de 1 a 9 cifras, con minimo y maximo independientes. Minimo y maximo iguales fijan las cifras. Se puede practicar con porcentajes basicos (10, 20, 25, 50, 75 y 100 %) o con porcentajes enteros entre 1 y 100 %. Desactivar decimales exige que los datos monetarios y los resultados sean enteros; activarlos permite uno o dos decimales exactos. No hay redondeos ni aproximaciones aceptadas como correctas. Los enunciados actuales usan euros, por eso no se ofrece un tercer decimal.

Para combinar, abre Operaciones adicionales, marca sumas, restas, multiplicaciones o divisiones y utiliza Solo combinados o Individuales y combinados. Cada combinado incluye todas las operaciones adicionales marcadas y un unico tipo de porcentaje seleccionado. Primero se calcula el importe (unidades, entrega, vale y reparto, en ese orden cuando esten marcados) y despues el porcentaje. Los factores y repartos son pequenos y los resultados intermedios pueden superar las cifras iniciales. Las divisiones de estos contextos son enteras exactas. No se generan dos porcentajes sucesivos con bases ambiguas. Las 160 plantillas se reutilizan para estas variantes, no se cuentan de nuevo. En pantallas estrechas de batalla se acorta la redaccion sin quitar datos; al consultar una solucion larga los pasos numerados se reparten en dos columnas.

Los ajustes se guardan en el navegador, se comparten en la sala y pueden cambiarse para la siguiente ronda desde el panel maestro. Los motores generan la misma secuencia con la misma semilla, indice y configuracion. No es necesario cambiar la configuracion de Firebase para esta familia.

El contenido editable esta en `banco-problemas/porcentajes.json`; ejecuta `node banco-problemas/compilar-banco.cjs` tras editarlo. Publica tambien `banco-problemas/porcentajes-datos.js` y `porcentajes.js`, que se cargan despues de `matematicas-extra.js` y antes de `app.js`. La guia de campos esta en `banco-problemas/GUIA-PORCENTAJES.md` y los ejemplos completos en `banco-problemas/VISTA-PREVIA-PORCENTAJES.md`. `crear-banco-porcentajes.cjs` reconstruye el catalogo inicial: no lo ejecutes sobre un JSON editado sin guardar antes tus cambios.

Pruebas: `node tests/percentages.test.cjs` comprueba 13824 variantes con referencia exacta, tipos, cifras, combinaciones y limites decimales. `node tests/browser-smoke.cjs --percentages-only` comprueba los controles, guardado, configuracion online/maestro, teclado, respuestas y disposicion en cinco tamanos con ambas letras. Las salas de estas pruebas son simuladas, no una prueba de conexion real a Firebase.

### Medidas y Conversiones

En **Calculo > Conversiones de magnitudes** activa Longitud, Masa, Capacidad o Tiempo. Cada una tiene cifras iniciales (1 a 9), unidad de origen y unidad de destino; Aleatoria permite variar la unidad. Los simbolos se acompanian de sus nombres completos en los selectores. Se generan cantidades iniciales enteras, de las cifras elegidas. El ajuste general de decimales permite 1, 2 o 3 decimales exactos en el resultado. Con decimales desactivados solo aparecen conversiones enteras. No se aceptan redondeos ni aproximaciones periodicas. Ejemplos: `2 kg = ? g`, `75 cm = ? m`, `3 L = ? mL`, `2 h = ? min`. Responde solo el numero, con coma cuando corresponda.

Longitud: km, hm, dam, m, dm, cm y mm. Masa: kg, hg, dag, g, dg, cg y mg. Capacidad: kL, hL, daL, L, dL, cL y mL. Tiempo: semanas (7 dias), dias (24 horas), horas (60 minutos), minutos (60 segundos) y segundos. No se usan meses ni anos variables. La ayuda de calculo muestra la equivalencia y la multiplicacion o division necesaria. Las conversiones se presentan horizontales, incluso si el formato general es vertical, para mantener las unidades legibles. Los numeros negativos no se aplican a medidas.

Si origen y destino coinciden, o no existen valores exactos con las cifras y decimales elegidos, se avisa y no se inicia la partida ni la siguiente ronda hasta corregirlo. No se cambian silenciosamente las unidades, cifras o decimales. Las unidades aleatorias se eligen entre las combinaciones compatibles con esos limites. El teclado tactil y fisico siguen funcionando; la solucion consultada no suma puntos.

En **Problemas > Medidas y conversiones** hay 40 plantillas de cada magnitud, con minimo y maximo de cifras iniciales (1 a 9), selectores propios de unidades y opcion de permitir hasta tres decimales exactos en los datos adicionales y las respuestas. Los ajustes de decimales de problemas son independientes de calculo. Si se activan varias magnitudes, se alternan problemas de cada una. No se suman cantidades de dimensiones diferentes. Para combinados, activa las operaciones adicionales y elige Solo combinados o Individuales y combinados: primero se convierte la cantidad a la unidad de destino y despues se suman, restan, multiplican o reparten cantidades de esa misma magnitud. Cada combinado incluye todas las operaciones adicionales marcadas. Restas y repartos no generan resultados negativos ni aproximados. Las cantidades adicionales son pequenas; los resultados pueden superar las cifras iniciales. Los nombres completos de unidades y la concordancia singular/plural se mantienen en enunciados y soluciones.

`magnitudes.js` contiene el motor exacto con BigInt, la tabla de unidades, las conversiones de calculo y la familia de problemas. Se carga despues de `porcentajes.js` y `banco-problemas/medidas-datos.js`, antes de `app.js`. Contenido editable: `banco-problemas/medidas.json`. Tras editar, ejecuta `node banco-problemas/compilar-banco.cjs`; publica el JS generado. Guia y ejemplos: `banco-problemas/GUIA-MEDIDAS.md` y `banco-problemas/VISTA-PREVIA-MEDIDAS.md`. El constructor `crear-banco-medidas.cjs` sobrescribe el catalogo inicial; no lo ejecutes sobre cambios propios sin respaldo.

Se guardan cifras y unidades, incluidas las selecciones aleatorias. Se comparten con las salas online y los ajustes de la siguiente ronda del maestro sin cambiar de codigo. No hay cambios de configuracion ni reglas de Firebase. Las pruebas `node tests/units.test.cjs` y `node tests/browser-smoke.cjs --units-only` comprueban calculos, problemas, limites, teclado, controles, persistencia, vistas responsive y configuracion online/maestro. Las salas de navegador son simuladas, no conexiones reales a Firebase.

## Aprendizaje, Objetivos e Informes

### Contenidos nuevos

Problemas incluye Razonamiento, Geometria, Dinero y compras y Proporcionalidad, con 140 plantillas de geometria y 40 de cada otra familia (10 contextos), datos base de 1, 2 o 3 cifras y soluciones explicadas. Razonamiento tiene datos sobrantes, datos iniciales desconocidos, dos preguntas encadenadas y lectura para seleccionar el dato necesario. La segunda pregunta conserva el contexto de la primera, incluso si se resuelve con ayuda. Geometria trabaja areas y perimetros de cuadrados, rectangulos, triangulos, circulos, paralelogramos, rombos y trapecios: 14 estructuras, cada una con diez contextos y un dibujo SVG accesible, no a escala. Se eligen datos de 1, 2 o 3 cifras, permitir resultados decimales y el valor de pi (3,14 o 3 para iniciacion). El enunciado indica el valor dado de pi; se calcula exactamente con ese valor, sin redondear. Con una cifra, pi = 3,14 y sin decimales no hay circulos compatibles; cambia una de esas opciones. Las alturas son perpendiculares y distintas de los lados inclinados. Compras incluye coste, cambio, comparacion de ofertas y presupuesto; permite centimos opcionales. Proporcionalidad incluye recetas, precio por unidad, escalas sencillas y cantidades por equipo. Las cifras se aplican a los datos base; factores y longitudes del plano permanecen pequenos para conservar el sentido del contexto.

Estas cuatro familias utilizan sus propios selectores de variedad; el selector general de mezcla aritmetica se oculta porque no las controla. Los precios grandes se plantean como lotes o pedidos, no como un cuaderno de miles de euros. Las magnitudes muy grandes se expresan como registros acumulados de una red de centros, tanto en texto completo como compacto; no como una cinta o actividad individual gigantesca. Las escalas usan distancias pequenas sobre el plano. La revision no limita las conversiones abstractas de calculo.

Calculo tiene un desplegable Mas retos: completar huecos, comparar con < = > (numeros, fracciones o metros/centimetros), potencias con base de 1 a 3 cifras y exponente de 2 a 5, y redondeo a unidades, decenas, centenas, millares, decimas, centesimas o milesimas. En redondeo se aplica la regla de 5 hacia arriba a numeros no negativos. Sus datos decimales son propios de la actividad y no dependen del interruptor de decimales de otras operaciones. La respuesta debe ser exactamente el redondeo pedido; no se introduce tolerancia en fracciones, conversiones u otras actividades. Huecos pide el numero ausente; no se anade un segundo igual a la expresion. En comparaciones el teclado tactil cambia a tres signos y vuelve al numerico cuando cambia el tipo de pregunta. El teclado fisico acepta < = >; el numerico permite menos para menor, multiplicar para igual y mas para mayor. El resto de teclas numericas sigue funcionando como antes.

### Final de partida y ayuda

Final de la partida ofrece Por tiempo, Sin tiempo, Numero de preguntas resueltas y Numero de aciertos sin ver solucion. El objetivo va de 1 a 1000. Sin tiempo no descuenta segundos y permite Terminar. En preguntas resueltas cuentan los aciertos y las preguntas completadas tras consultar la solucion; los saltos no cuentan. En aciertos solo cuentan respuestas correctas sin revelar solucion; utilizar una pista de orientacion no elimina el acierto, pero queda registrado como acierto con ayuda. La batalla local termina cuando uno alcanza la meta. En online cada alumno completa su objetivo y queda en resultados sin reiniciarse al recibir otro cambio de la sala; la sala termina cuando todos los conectados completan o cuando el anfitrion la cierra. El anfitrion puede terminar antes. Los objetivos y ajustes se comparten y guardan para la siguiente ronda. Los eventos de tiempo extra se excluyen cuando no hay limite temporal.

Pista es independiente del boton Ver solucion, que sigue disponible. Hay orientacion, planteamiento sin respuesta y solucion completa. Las dos primeras pistas se registran; consultar la solucion no da puntos. El enunciado sigue visible. Los dialogos no introducen scroll en la arena: se desplazan dentro de su propio panel cuando hace falta, y el teclado del juego queda bloqueado mientras hay un dialogo abierto. Tras terminar se ofrece Repasar errores, con las mismas preguntas y datos, campo para intentarlo otra vez y explicacion opcional. Ese repaso no suma puntos, no modifica la clasificacion y no envia nuevos resultados a la sala. Se conserva en memoria para esa ronda, no se publica un historial completo de enunciados fallados en Firebase.

### Seguimiento del alumnado

El anfitrion, tanto en Maestro como en Batalla online, registra las rondas observadas en **este navegador y dispositivo**, acumulando distintas salas y contenidos. No se recuperan retroactivamente rondas antiguas no observadas ni se sincroniza el archivo local entre ordenadores. El panel Informes esta disponible desde Maestro, la cabecera del anfitrion y sus resultados. Guarda hasta 500 rondas; un aviso informa si el navegador no tiene espacio. En ese caso los datos nuevos permanecen exportables en memoria mientras la pagina siga abierta: descarga el Excel antes de salir o actualizar. Hay filtros Todo, Hoy, 7 y 30 dias y borrado de historial. El borrado impide que un aviso retrasado de una ronda vieja vuelva a guardarla. Las rondas parciales, por ejemplo al retirar un participante antes del cierre, se identifican como tales.

El Excel es un **XLSX real**, sin dependencias ni servicios externos, con tres hojas: Resumen por alumno, Por contenido y Rondas. Incluye puntos, aciertos, fallos, precision, pistas, soluciones, saltos y aciertos con pista, segun la hoja. Los fallos cuentan intentos, incluidos reintentos; precision es aciertos dividido entre aciertos mas fallos. Los nombres iguales se agrupan entre rondas y salas: utiliza nombres o alias distintos para alumnos distintos y mantenlos estables. Los emojis se conservan como Unicode; su aspecto depende de las fuentes del visor. Los textos se exportan como celdas de texto, no como formulas. PDF abre una vista imprimible: pulsa Imprimir / Guardar como PDF en el navegador. No es una descarga automatica de PDF.

Los informes contienen nombres y progreso. Usa un dispositivo de confianza y guarda los archivos descargados de forma adecuada. Borrar el historial local no borra los Excel/PDF ya descargados ni los datos de una sala de Firebase. Rechazar analitica no impide los ajustes ni los informes locales necesarios para las funciones elegidas. Los nombres y contadores de partidas online se comparten con la sala de Firebase; el archivo de informes y las exportaciones permanecen en el dispositivo del anfitrion. El online requiere autenticacion anonima y las reglas privadas incluidas. Consulta SEGURIDAD.md.

La conexion muestra Local, Conectando, Conectado o Sin conexion/reintentando. Firebase restablece la presencia y onDisconnect tras reconectar; no se envian respuestas desde la interfaz mientras se sabe que esta desconectada. Las tarjetas distinguen alumnos activos y que han completado su meta. Reentrar desde el mismo navegador conserva la identidad anonima, puntos, contadores y pregunta encadenada pendiente. El nombre no identifica ni concede permisos. Un navegador distinto obtiene otra identidad aunque escriba el mismo nombre. Cada actualizacion de progreso lleva la semilla de ronda; una validacion en el servidor rechaza respuestas de rondas anteriores y no recrea un participante expulsado. La revancha limpia estadisticas, ayudas y marca de finalizacion. La cuenta atras de tres segundos queda fuera del tiempo de juego y el vencimiento se calcula con el inicio compartido.

### Archivos y pruebas

El banco editable nuevo es `banco-problemas/aprendizaje.json`; la guia es `GUIA-APRENDIZAJE.md`. Compila con `node banco-problemas/compilar-banco.cjs`. Se generan `aprendizaje-datos.js`, `VISTA-PREVIA-APRENDIZAJE.md` y el recuento. `crear-banco-aprendizaje.cjs` reconstruye el banco inicial y no debe ejecutarse sobre contenido editado sin copia. Carga `aprendizaje-datos.js`, `geometria.js` y `ampliacion.js` despues de `magnitudes.js`, seguidos de `seguimiento.js`, `aprendizaje-ui.js` y finalmente `app.js`. No hacen falta productos nuevos ni cambios de configuracion de Firebase para estas funciones.

`node tests/aprendizaje.test.cjs` comprueba 6000 calculos nuevos y 1560 problemas, respuestas con referencia independiente, geometria, precios, proporcionalidad, comparaciones, redondeos exactos, plantillas, historial y XLSX. `node tests/firebase-rounds.test.cjs` comprueba presencia, revancha y actualizaciones tardias con una base simulada. `node tests/browser-smoke.cjs --learning-only` comprueba vistas en cinco tamanos, ambas letras, ayuda, repaso, metas, teclado tactil/fisico, configuracion compartida, informes y generacion de un PDF mediante impresion. Tambien se han ejecutado pruebas reales con tres identidades aisladas en Firebase; ver SEGURIDAD.md.

## Revision del lenguaje

Las unidades del banco de enteros incluyen `genero` (femenino o masculino), ademas del singular y plural. El compilador comprueba las preguntas para evitar errores como Cuantos hojas y rechaza algunas construcciones que fallan si una cantidad vale 1. El genero no se deduce por la terminacion: mapa y dia son masculinos, mientras que foto es femenino. Las comparaciones no usan el mismo nombre para los dos personajes.

Las escenas de fracciones declaran `unitGender` y `unitSingular`. Los generadores de MCM/MCD ajustan minuto/minutos, tarjeta/tarjetas, alumno/alumnos y unidad/unidades. Los repartos repetidos indican expresamente cada dia. En fracciones se distingue la cantidad que tienen de la cantidad que necesitan para otra actividad.

`node tests/problem-language.test.cjs` comprueba las 1320 plantillas, cantidades singulares y plurales, las preguntas completas y compactas, personajes diferentes y el caso de 87 hojas necesarias y 71 disponibles. Son comprobaciones concretas de regresion, no una certificacion automatica de cualquier texto nuevo. `revisar-lenguaje.cjs` aplica las correcciones de esta revision al banco existente; no sustituye la lectura y revision de nuevos enunciados.

## Renovacion visual y copias

La pantalla inicial separa modo y actividad de las opciones avanzadas, que estan plegadas en Personaliza tu partida. El archivo `renovacion.css` unifica el aspecto sin sustituir la cuadricula de altura fija de las partidas. El cuadro de marcas se despliega cuando hace falta. Se mantienen los temas claro, ninja y oscuro y se respeta la preferencia del sistema de reducir movimiento.

El panel del maestro calcula columnas y filas segun el numero de alumnos y el espacio real disponible. Los nombres completos se parten en lineas, sin puntos suspensivos, con tipografia ajustada a cada tarjeta. Se mantienen puntos, posicion, aciertos y fallos. Al aumentar la densidad se ocultan primero los adornos y la ultima accion de cada tarjeta, no sus datos principales. ResizeObserver y la carga de fuentes recalculan el reparto al cambiar de pantalla. En un movil con muchos alumnos la letra se reduce: para proyectar una clase se recomienda una pantalla grande. No hay scroll en la cuadricula.

`node tests/browser-smoke.cjs --teacher-only` comprueba espera, partida y resultados con 0, 1, 4, 12, 20, 30, 40 y 60 alumnos (en movil hasta 30), nombres largos con emojis, puntuaciones, desconexiones, podio y actualizacion de estadisticas en una siguiente ronda. Son salas simuladas en el navegador, no una prueba de dos dispositivos contra Firebase real.

La copia previa esta en `backups/dojo-antes-renovacion-20261027-190022.zip`. Es una copia local completa, incluida la configuracion local de Firebase: **no se sube a GitHub**. Para volver atras, extraela en otra carpeta y prueba alli la version anterior. Los ZIP de `releases` excluyen `firebase-config.js`, `backups` y releases anteriores.

## MCM y MCD en calculo

Dentro de Operaciones puedes activar Minimo comun multiplo y Maximo comun divisor. Cada uno tiene un selector de cifras (1, 2 o 3) y cantidad de numeros distintos (2, 3 o 4). Se generan datos enteros positivos sin repetir; la respuesta se valida exactamente. Las opciones se guardan y viajan con la configuracion online, como las demas operaciones.

## Funciones principales

- Modo entrenamiento y batalla local.
- Operaciones configurables: sumas, restas, multiplicaciones, divisiones, divisiones dificiles, combinadas, fracciones y porcentajes.
- Divisiones tipo tablas del 1 al 10.
- Raices cuadradas exactas con radicandos de 1, 2 o 3 cifras (por ejemplo, raiz de 4, 81 o 144).
- Simbolo de raiz dibujado en SVG con barra sobre el radicando, independiente de las fuentes del dispositivo.
- Boton Ver solucion en cada panel: muestra la respuesta y permite pasar sin sumar puntos ni aciertos. Disponible en entrenamiento, duelo y online.
- Consultar la solucion se mantiene registrado aunque un evento cambie el formato de la operacion.
- Selector de cifras por tipo de operacion.
- Operaciones horizontales, verticales o mixtas.
- Fracciones representadas con numerador, barra y denominador.
- Sumas, restas, multiplicaciones, divisiones y combinadas con fracciones: selectores independientes de 1, 2 o 3 cifras para numeradores y denominadores. Por defecto, 2 cifras.
- Respuestas exactas en formato `3/4`; se aceptan fracciones equivalentes (`6/8`) y decimales exactos (`0,75`). No se aceptan aproximaciones periodicas como `0,333` para `1/3`.
- Tecla `/` en el teclado tactil cuando hay operaciones con fracciones y soporte de `/` en el teclado numerico fisico. La ayuda muestra la solucion simplificada.
- Al consultar una operacion con fracciones se muestran el resultado antes de simplificar y la fraccion simplificada. Por ejemplo, `9/6 + 3/8` muestra `45/24 = 15/8`; ambas formas y sus equivalentes se aceptan como respuesta. En sumas y restas se usa el minimo comun denominador.
- Atajos para portatiles: `F` o `:` escriben `/`. Los atajos con Ctrl, Alt o Meta conservan su funcion en el navegador.
- Descomposicion en factores primos de numeros compuestos de 1, 2 o 3 cifras. Para 12 se acepta `2x2x3` o `3x2x2`; `4x3` se rechaza porque 4 no es primo. Usa la tecla tactil de producto, `X` o `*`. La solucion muestra todos los factores repetidos, sin potencias.
- Combinadas con fracciones con prioridad de multiplicacion/division y parentesis: 20 puntos por acierto. Las otras operaciones con fracciones valen 10 puntos; mantienen las penalizaciones configuradas.
- Selector de decimales para resultados y operaciones con coma decimal.
- Opcion para permitir o bloquear resultados negativos.
- Opcion para activar o desactivar penalizacion por fallos.
- Teclado tactil y soporte de teclado fisico.
- Temporizador configurable.
- Rachas, eventos sorpresa y sonidos.
- Cuadro de los Grandes Maestros guardado en el navegador.
- Batalla Online con codigo de sala y Firebase Realtime Database.
- Modo Maestro con sala proyectable, ranking en directo, podio final y tarjetas de progreso por alumno.

## Comprobaciones

Con Node.js instalado, ejecuta `node tests/math.test.cjs` para comprobar operaciones, equivalencias, cifras, negativos y generacion online reproducible.

Para comprobar pantallas y entrada de respuestas en Chrome, ejecuta `node tests/browser-smoke.cjs`. En Windows busca Chrome en su ruta habitual; para otro navegador Chromium, define `CHROME_PATH` con la ruta al ejecutable. Las pruebas usan una pagina temporal y no se conectan a Firebase.

## Persistencia local

La app guarda en `localStorage`:

- Preferencias de juego.
- Resultados del Cuadro de los Grandes Maestros.
- Tema visual.
- Consentimiento de analitica.

## Analitica y cookies

Google Analytics (`G-5XSQG511V6`) solo se carga si el usuario acepta el banner de consentimiento. Si rechaza, no se carga Analytics.

## Firebase / modo online

La app usa Firebase Realtime Database como backend de `Batalla Online` y `Modo Maestro`.

La version online permite:

- crear una sala con codigo,
- generar automaticamente un codigo de sala para el host,
- unirse desde otro ordenador,
- competir con la misma secuencia de operaciones,
- sincronizar puntuacion y progreso basico en vivo.
- crear una sala de maestro para proyectar un ranking animado con todos los alumnos conectados.
- mostrar a los alumnos una sala de espera tras unirse con codigo.

En `Batalla online`, el host configura la partida y pulsa `Empezar`: la app crea un codigo automatico, muestra una lobby con boton de copiar y permite iniciar cuando todos hayan entrado.
El bloque `Crea tu partida online` agrupa duracion, operaciones, formato y opciones. Desde la misma sala se pueden cambiar esos ajustes antes de empezar la siguiente ronda.

En `Modo Maestro`, el profesor crea la sala y comparte el codigo generado automaticamente. Los alumnos entran desde `Batalla online > Unirse con codigo`.
Al terminar una ronda, el maestro puede usar `Ajustes de la próxima ronda`, cambiar operaciones/duración/formato y lanzar revancha manteniendo el mismo código.

### Pasos en Firebase

1. Entra en Firebase Console.
2. Crea un proyecto nuevo.
3. Anade una app web al proyecto.
4. Copia la configuracion web de Firebase.
5. Activa `Realtime Database`.
6. Elige ubicacion europea si esta disponible.
7. En `Authentication > Sign-in method`, activa Anonimo. En `Realtime Database > Rules`, pega el contenido de `firebase/database.rules.json` y publica.
8. Para trabajar en local, duplica `firebase-config.example.js` como `firebase-config.js`.
9. Rellena `firebase-config.js` con los datos de tu app web Firebase.

`firebase-config.js` es solo para desarrollo local y esta ignorado por Git. No lo subas al repositorio.

### GitHub Pages con Firebase

El repositorio incluye `.github/workflows/deploy-pages.yml`. Ese workflow crea `firebase-config.js` automaticamente durante el despliegue usando secretos y variables de GitHub.

En GitHub, entra en `Settings > Secrets and variables > Actions` y crea:

Secret:

- `FIREBASE_API_KEY`

Variables:

- `FIREBASE_AUTH_DOMAIN`
- `FIREBASE_DATABASE_URL`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_STORAGE_BUCKET`
- `FIREBASE_MESSAGING_SENDER_ID`
- `FIREBASE_APP_ID`
- `FIREBASE_MEASUREMENT_ID`

Despues entra en `Settings > Pages` y selecciona `Build and deployment > Source: GitHub Actions`.

La clave web de Firebase no es una clave privada de servidor, pero GitHub puede marcarla como secreto. Protege el proyecto con reglas correctas de Realtime Database y, si quieres mas seguridad, restringe la API key en Google Cloud a los dominios donde publiques la app.

### Hosting

Puedes seguir usando GitHub Pages, Netlify o Vercel para alojar la web. En GitHub Pages se recomienda desplegar con el workflow incluido para no versionar `firebase-config.js`.

Firebase se usa para sincronizacion en tiempo real:

- salas con codigo,
- jugadores conectados,
- puntuaciones,
- progreso,
- eventos de partida.

No necesitas alojar la web en Firebase Hosting, aunque tambien seria posible.

Las reglas incluidas bloquean la antigua ruta publica rooms. Las salas nuevas viven en secureRooms y requieren identidad anonima. Solo el anfitrion administra la sala; cada alumno escribe su propio progreso. Los codigos nuevos tienen ocho caracteres y son invitaciones a la sala: no los publiques si contiene nombres. Las salas caducan a las 12 horas (el anfitrion puede renovar al iniciar). App Check y limpieza automatica son medidas adicionales pendientes; no son requisitos del juego local. Las puntuaciones se calculan en el navegador: no es un sistema antitrampas para examenes. Consulta SEGURIDAD.md.

## Archivos importantes

- `index.html`: estructura de la app.
- `styles.css`: estilos y responsive.
- `app.js`: logica del juego local.
- `firebase-online.js`: cargador y cliente base para Firebase.
- `firebase-config.example.js`: plantilla de configuracion Firebase.
- `firebase/database.rules.json`: reglas privadas para Realtime Database.
- `assets/branding/`: favicon, logo e iconos.
