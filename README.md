# Dojo Matematico

Web app educativa de calculo mental con modo individual, batalla local, teclado tactil, operaciones configurables, eventos sorpresa y cuadro de puntuaciones local.

## Ejecutar en local

1. Abre la carpeta del proyecto.
2. Lanza un servidor estatico, por ejemplo Live Server en VS Code.
3. Abre `index.html` en el navegador.

La app funciona sin backend para los modos locales.

## Funciones principales

- Modo entrenamiento y batalla local.
- Operaciones configurables: sumas, restas, multiplicaciones, divisiones, divisiones dificiles, combinadas, fracciones y porcentajes.
- Selector de cifras por tipo de operacion.
- Operaciones horizontales, verticales o mixtas.
- Teclado tactil y soporte de teclado fisico.
- Temporizador configurable.
- Rachas, eventos sorpresa y sonidos.
- Cuadro de los Grandes Maestros guardado en el navegador.
- Batalla Online con codigo de sala y Firebase Realtime Database.
- Modo Maestro con sala proyectable, ranking en directo, carrera visual y tarjetas de progreso por alumno.

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

En `Batalla online`, el host configura la partida y pulsa `Empezar`: la app crea un codigo automatico, muestra una lobby con boton de copiar y permite iniciar cuando todos hayan entrado.

En `Modo Maestro`, el profesor crea la sala y comparte el codigo generado automaticamente. Los alumnos entran desde `Batalla online > Unirse con codigo`.

### Pasos en Firebase

1. Entra en Firebase Console.
2. Crea un proyecto nuevo.
3. Anade una app web al proyecto.
4. Copia la configuracion web de Firebase.
5. Activa `Realtime Database`.
6. Elige ubicacion europea si esta disponible.
7. En `Realtime Database > Rules`, pega el contenido de `firebase/database.rules.json` y publica.
8. Duplica `firebase-config.example.js` como `firebase-config.js`.
9. Rellena `firebase-config.js` con los datos de tu app web Firebase.

`firebase-config.js` se puede subir a GitHub Pages: la configuracion web de Firebase es publica. No subas nunca claves privadas de servidor ni cuentas de servicio.

### Hosting

Puedes seguir usando GitHub Pages, Netlify o Vercel para alojar la web.

Firebase se usa para sincronizacion en tiempo real:

- salas con codigo,
- jugadores conectados,
- puntuaciones,
- progreso,
- eventos de partida.

No necesitas alojar la web en Firebase Hosting, aunque tambien seria posible.

## Archivos importantes

- `index.html`: estructura de la app.
- `styles.css`: estilos y responsive.
- `app.js`: logica del juego local.
- `firebase-online.js`: cargador y cliente base para Firebase.
- `firebase-config.example.js`: plantilla de configuracion Firebase.
- `firebase/database.rules.json`: reglas iniciales para Realtime Database.
- `assets/branding/`: favicon, logo e iconos.
