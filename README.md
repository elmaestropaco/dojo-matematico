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
