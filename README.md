# Dojo Matematico

Web app educativa de calculo mental con modo individual, batalla local, teclado tactil, operaciones configurables, eventos sorpresa y cuadro de puntuaciones local.

## Ejecutar en local

1. Abre la carpeta del proyecto.
2. Lanza un servidor estatico, por ejemplo Live Server en VS Code.
3. Abre `index.html` en el navegador.

La app funciona sin backend para los modos locales.

## Modo Problemas

En la pantalla inicial, elige **Que quieres practicar > Problemas**. Mantiene las modalidades entrenamiento, batalla local, online y maestro. Incluye **1320 plantillas** en tres familias: 600 de numeros enteros, 600 de fracciones y 120 de MCM/MCD. Enteros y fracciones tienen 40 de cada operacion individual y 40 de cada una de las 11 combinaciones de dos, tres o cuatro operaciones. MCM/MCD tiene 40 individuales de cada concepto y 40 que utilizan ambos. El desglose esta en `banco-problemas/RECUENTO.md`. Los bloques de categoria estan plegados y conservan su altura propia al desplegar un vecino.

Solo hay selectores Minimo y Maximo de cifras (1 a 9). Si coinciden, las cifras son fijas; si difieren, forman un intervalo. Se mantienen los limites de cada contexto. Los enunciados usan frases naturales y vocabulario accesible: Facil corresponde a un tipo de problema directo, Media pide razonamiento y Avanzada puede tener dos pasos. Para empezar a los 6 anos se recomienda Facil y una cifra. Responde solo con el numero, sin separadores de miles. Ver solucion explica los pasos sin sumar puntos.

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
7. En `Realtime Database > Rules`, pega el contenido de `firebase/database.rules.json` y publica.
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

Las reglas incluidas permiten leer y escribir en `rooms` sin login para que los alumnos puedan unirse con codigo desde distintos dispositivos. Es adecuado para una primera version educativa, pero si la app se abre mucho al publico conviene anadir autenticacion anonima, limpieza automatica de salas antiguas o App Check.

## Archivos importantes

- `index.html`: estructura de la app.
- `styles.css`: estilos y responsive.
- `app.js`: logica del juego local.
- `firebase-online.js`: cargador y cliente base para Firebase.
- `firebase-config.example.js`: plantilla de configuracion Firebase.
- `firebase/database.rules.json`: reglas iniciales para Realtime Database.
- `assets/branding/`: favicon, logo e iconos.
