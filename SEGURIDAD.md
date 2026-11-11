# Online protegido

Actualizacion: 2026-11-11. El proyecto dojo-matematico ya tiene Authentication
anonimo habilitado y las reglas privadas publicadas en su Realtime Database.
No hay que abrir la base de datos ni usar reglas de prueba.

## Publicar esta version

Sube el contenido del ZIP de releases a GitHub, incluida la carpeta oculta
.github y assets/vendor. Conserva los secretos y variables de Actions ya
configurados. El workflow genera firebase-config.js al desplegar. No publiques
el archivo local firebase-config.js, copias de seguridad, node_modules ni logs.
Actualiza todas las pantallas y crea una sala nueva: los codigos antiguos de seis
cifras pertenecen al protocolo anterior y no se reutilizan.

## Permisos

- Sin autenticacion no se pueden leer ni escribir salas.
- No se permite listar todas las salas. La ruta antigua rooms queda bloqueada.
- Las salas nuevas usan secureRooms y codigos aleatorios de ocho caracteres.
- Conocer el codigo permite inscribirse como alumno mientras la sala admite
  entradas. Es una invitacion: no compartas publicamente codigos con nombres.
- Cada navegador obtiene una identidad anonima persistente. Cambiar el nombre
  no cambia la identidad ni concede permisos de otro alumno o del profesor.
- Solo el anfitrion puede iniciar, cambiar ajustes, lanzar revancha o expulsar.
- Cada alumno solo puede actualizar su propio progreso y presencia; las reglas
  comprueban la semilla de ronda para rechazar respuestas antiguas.
- La expulsion bloquea esa identidad hasta que el anfitrion la autorice de nuevo.
- Las salas caducan a las 12 horas. Iniciar o reiniciar renueva su vigencia.
  Caducar no elimina automaticamente los datos: la limpieza programada queda
  pendiente. No guardes datos personales innecesarios; usa alias del alumnado.

La clave web de Firebase es configuracion del cliente, no una credencial de
administrador. La proteccion depende de Authentication y de estas reglas.
Las puntuaciones se calculan en el cliente: esto no evita que un usuario
manipule sus propios puntos. No sirve como sistema antitrampas de evaluacion.
App Check, limitacion adicional de abuso y limpieza automatica son mejoras
pendientes para una publicacion masiva, no protecciones que ya esten activadas.

## Funcionamiento y comprobaciones

El modo local no carga Firebase y funciona abriendo index.html directamente.
El online necesita Internet y firebase-config.js, generado por Actions en la
version publicada o disponible solo localmente para desarrollo.
Los SDK app, auth y database 10.12.5 estan incluidos en assets/vendor, con
licencia y hashes; hay alternativa desde la distribucion oficial de Firebase.
La carga comprueba que cada servicio existe antes de utilizarlo.

Pruebas ejecutadas para esta version:

- Inicio real de index.html, cuenta atras, respuesta y puntuacion local.
- Creacion real de sala maestro, inicio, lectura y revancha.
- Tres identidades reales aisladas: anfitrion y dos alumnos; progreso,
  estadisticas, bloqueo de suplantacion y lectura ajena, revancha, respuesta
  antigua rechazada, expulsion y reingreso autorizado.
- 82 comprobaciones de autorizacion con Realtime Database Emulator.

Las pruebas reales crean salas y cuentas anonimas desechables y las eliminan.
No leen ni modifican salas del alumnado. Ejecucion explicita:

```sh
node tests/startup-live.cjs
node tests/startup-live.cjs --live-room
node tests/live-security.cjs --live
```

Pruebas de reglas sin tocar produccion (Node 24, Java 21 y Firebase CLI):

```sh
npm --prefix tests/security ci
firebase emulators:exec --config firebase/emulator.json --only database --project demo-dojo-security "npm --prefix tests/security test"
```

Fuente de reglas: firebase/build-rules.cjs. Si se modifica, ejecutar
`node firebase/build-rules.cjs`, probar en el emulador y publicar despues
firebase/database.rules.json. No cambiar las reglas por true para resolver
un error de permisos.

Documentacion oficial:
[Authentication anonimo](https://firebase.google.com/docs/auth/web/anonymous-auth)
y [reglas de Realtime Database](https://firebase.google.com/docs/database/security).

## Pausa y equipos (bloque 5)

Reglas publicadas para los campos de pausa y el marcador de pregunta explicada.
Durante una pausa se permiten presencia y reconexion, no cambios de puntuacion
ni progreso. El anfitrion puede revelar y marcar una pregunta como explicada;
ese marcador no concede puntos. Reanudar, terminar o revancha limpian la pausa.
Los equipos se guardan en la configuracion de la sala, que solo puede editar
el anfitrion. Las sesiones locales excluyen las asignaciones por UID.

Las pruebas reales comprueban reparto, pausa/revelado/reanudacion, respuestas
rechazadas en pausa y revancha desde pausa, con usuarios aislados. Recarga todos
los dispositivos despues de publicar esta version. Ver DINAMICA.md.
