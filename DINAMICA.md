# Bloque 5: progresion, pausa y equipos

## Activacion

En Personaliza tu partida se activa Dificultad progresiva. Empieza apagada.
Los equipos tambien empiezan apagados y se ofrecen en salas online y Maestro.
Las sesiones guardan estos ajustes y los nombres de equipos, pero no los UID
ni la asignacion del alumnado. Las salas nuevas empiezan con reparto nuevo;
la revancha conserva codigo y asignaciones, salvo cambios del anfitrion.

## Dificultad y Puntos

En individual, tres aciertos consecutivos sin pista suben un nivel. Dos fallos
consecutivos bajan un nivel. Pistas, solucion o salto cortan la serie limpia.
El cambio se aplica a la siguiente pregunta: nunca se cambia una operacion
pendiente ni su recompensa despues de un fallo.

En batalla local y online no hay adaptacion individual: preguntas 1-5 en nivel
1, 6-10 en nivel 2 y desde la 11 en nivel 3. En online, mismo indice y semilla
producen la misma pregunta. En batalla local se mantienen preguntas diferentes.
Las preguntas encadenadas conservan los datos y nivel de la primera pregunta.

Se parte de las cifras o nivel que has elegido y se aumenta hasta dos pasos,
dentro de los limites del selector. No se cambian operaciones, unidades,
llevadas, negativos, decimales ni el tipo de problema elegido. Si los limites
del contexto impiden una pregunta compatible se vuelve al nivel inicial.

El nivel efectivo se calcula por el incremento posible: base 2 cifras con
tope 3 solo alcanza un incremento, no dos. Las actividades fijas (tablas,
equivalencias sin cifras configurables, angulos, dado sencillo y algunas
preguntas de razonamiento) no reciben una bonificacion ficticia. La pregunta
muestra su nivel efectivo y recompensa.

| Tipo | Nivel 1 | Nivel 2 | Nivel 3 |
| --- | ---: | ---: | ---: |
| Normal | 10 | 15 | 20 |
| Combinadas avanzadas y combinadas con fracciones | 20 | 30 | 40 |

Fallar sigue restando 5 solo si Penalizar fallos esta activo. Saltar conserva
su coste y requiere puntos suficientes. Nunca se baja de cero. La progresiva
no tiene ruleta para evitar bonificaciones aleatorias; si se activan rachas,
sus animaciones siguen funcionando. El modo fijo conserva sus eventos.

Las marcas fijas y progresivas se consultan por separado en el Cuadro de los
Grandes Maestros. Los informes permiten filtrar dificultad; Excel/PDF incluyen
tipo de dificultad y equipo en el detalle de rondas. No compares puntuaciones
brutas entre configuraciones distintas. La precision y aciertos siguen siendo
indicadores utiles en el resumen acumulado.

## Pausa Compartida

El anfitrion ve Pausar durante la partida, tanto en Maestro como en batalla
online. Pausa a toda la sala. El tiempo se calcula desde el inicio compartido,
descontando las pausas, con el reloj de Firebase. No se descuentan segundos
mientras se explica. No se cambia ni se pierde la respuesta que cada alumno
estaba escribiendo, salvo que se muestre la solucion de su pregunta.

El anfitrion puede escoger un participante para mostrar su pregunta y revelar
la solucion a toda la sala. El contenido se genera en cada navegador a partir
de indice y semilla: no se reciben fragmentos HTML de Firebase.
Si corresponde a una pregunta pendiente, se marca como explicada en Firebase;
tras reanudar se pasa con Siguiente, sin puntos. El marcador sobrevive a una
recarga. No se cuenta como consulta individual de solucion en los informes.

La base de datos rechaza cambios de puntos, aciertos, errores y progreso
mientras esta pausada. La presencia y reconexion siguen funcionando. El
cliente reconcilia respuestas que coincidan con el instante de la pausa.
Terminar o lanzar revancha limpia la pausa y los marcadores de ayuda.

Se puede salir de la sala desde la pausa. Si sale el anfitrion, la ronda se
cierra como antes. Usa navegadores actualizados con esta version en todos los
dispositivos: los clientes antiguos no conocen los controles de pausa.

## Equipos

Se eligen entre dos y cuatro equipos con nombres editables. El anfitrion abre
Equipos desde la sala de espera y puede repartir de nuevo o mover a alguien.
El reparto automatico equilibra participantes conectados y asigna a quienes
entran tarde sin mover a los que ya estan jugando. Durante la ronda no se
admiten cambios manuales de equipo. Para cambiar el reparto, vuelve a espera
con una nueva ronda en la misma sala.

La clasificacion usa media de puntos por participante, ademas de mostrar total,
aciertos, fallos y miembros. Asi un equipo con mas dispositivos no gana solo
por ser mayor. Cada perfil/dispositivo cuenta como participante: la app no
conoce cuantas personas comparten un equipo fisico. Las contribuciones de
quienes se desconectan tras participar se conservan. Al expulsar un perfil se
retira de la sala y de ese resultado, como en la clasificacion individual.

El maestro mantiene sus tarjetas individuales, con un borde del color del
equipo. Equipos abre una clasificacion visual con barras y nombres. Al final
se muestran equipos y clasificacion individual, con empates explicitos.
El dialogo y los resultados admiten scroll interno; la arena mantiene su
altura fija y las tarjetas del maestro siguen ajustandose sin scroll.

## Firebase y Pruebas

Reglas actualizadas y publicadas en dojo-matematico el 2026-11-11. No se han
abierto permisos publicos. Solo el anfitrion controla pausas, configuracion y
reparto. La puntuacion sigue calculandose en el navegador: no es antitrampas.
Para otro proyecto hay que publicar firebase/database.rules.json.

Pruebas:

```sh
node tests/dynamics.test.cjs
node tests/browser-smoke.cjs --dynamics-only
node tests/live-security.cjs --live
```

El emulador comprueba 82 permisos. Las pruebas reales usan identidades y sala
desechables, y las eliminan; no tocan salas de clase. Se han comprobado pausa,
revelado, reanudacion, bloqueo de progreso, revancha desde pausa, expulsion y
asignacion. Los SDK necesitan mantener una suscripcion durante la transaccion
del anfitrion para que una lectura puntual no libere su cache antes de empezar.

Referencia oficial: [transacciones y actualizaciones](https://firebase.google.com/docs/database/web/read-and-write)
y [reglas de acceso y validacion](https://firebase.google.com/docs/database/security/core-syntax).
