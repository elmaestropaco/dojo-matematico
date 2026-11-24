# Ampliacion en cinco bloques

Version: 2026.11.24-aula5. Copia previa en backups/antes-cinco-bloques-aula-20261124.zip.

Esta guia describe la tanda anterior. La ampliacion posterior, que lleva el banco
a 2530 plantillas e incorpora enteros y potencias, se explica en NUEVOS-RETOS.md.

## 1. Revision y organizacion del banco

Se conservan las 2140 plantillas anteriores. Las pruebas existentes comprueban
matematicas, concordancia, singular/plural, parametros, soluciones y generacion
reproducible. El script banco-problemas/auditar-aula.cjs comprueba el recuento
global y los identificadores y genera AUDITORIA-AULA.json con ejemplos de las
nuevas estructuras y longitud descriptiva de lectura. Esta auditoria automatica
no equivale a una revision humana completa de cada enunciado ni asigna edades.

Las nuevas familias separan nivel matematico y lectura: contexto completo o
redaccion breve con los mismos datos esenciales. Cuando se elige Todos, alternan
sus razonamientos de forma determinista y recorren los diez contextos. Si se
selecciona un unico razonamiento, naturalmente se repite esa estructura. Las
familias anteriores mantienen sus generadores, ajustes y secuencias habituales.

## 2. Nuevos problemas

180 plantillas, basadas en 18 razonamientos con 10 contextos cada uno. No son
180 razonamientos diferentes. El total al cerrar esa tanda fue de 2320 plantillas.

- Divisiones con resto: grupos completos, lo que sobra, cajas necesarias para
  llevarlo todo y cantidad que recibe cada equipo. Se distingue cociente, resto
  y necesidad de un recipiente adicional.
- Fracciones con sentido: recuperar el total conocida una parte, parte que queda
  y comparar partes de cantidades distintas. Todos los resultados son enteros.
- Geometria aplicada: area en L, valla con entrada y superficie con una zona
  interior sin cubrir. Dibujos orientativos; medidas completas en el texto.
- Decisiones de compra: precio unitario, maximo que permite un presupuesto y
  ahorro entre ofertas con exactamente los mismos productos.
- Estimacion: redondear cada cantidad antes de sumar, estimar un producto y
  acotar una division entre multiplos consecutivos. El criterio se explicita.
- Reparto inverso: un total fijo entre mas o menos equipos. No se utilizan
  supuestos ambiguos sobre velocidad de trabajo o productividad de personas.

En Problemas, selecciona la familia y abre Ajusta estos problemas. Los selectores
de mezcla de operaciones de otras familias no se aplican a estas: cada variedad
define su razonamiento. Las soluciones conservan el texto, el dibujo y los pasos.
Los niveles modifican los datos, no la velocidad de lectura. La progresion opcional
respeta el limite de nivel 3 y no otorga aumentos ficticios cuando ya se alcanzo.

## 3. Nuevos calculos

En Mas retos de calculo aparecen cinco opciones, desactivadas inicialmente:

- Division con cociente y resto. Responde, por ejemplo, 3 R 2. En el teclado
  tactil R separa las partes; internamente se guarda 3/2. En el fisico valen R,
  F, dos puntos y la tecla de division. No es una fraccion: se comprueban
  dividendo = divisor por cociente + resto y 0 <= resto < divisor.
- Completar el numerador de una fraccion equivalente.
- Comparar fracciones con <, = o >, sin aproximarlas con decimales.
- Sumar o restar duraciones en horas y minutos; responder en minutos.
- Convertir cantidades compuestas: metros y centimetros, kilos y gramos,
  litros y mililitros. Se responde en la unidad pequena indicada.

Cifras se refiere a los datos iniciales, no al tamano de un resultado o de un
termino equivalente construido. No se fuerza un resultado a encajar en cifras.
Los resultados son exactos y no necesitan activar decimales.

## 4. Herramientas del aula

Abre el boton de libros en la partida o Aula dentro de Mis sesiones y actividades.
Los tres apartados empiezan plegados y el dialogo puede desplazarse internamente.
La pantalla del maestro sigue reservada para sus tarjetas, sin nuevos paneles
permanentes que les quiten altura.

### Identidad para informes

Las nuevas capturas guardan un identificador separado del nombre. Por defecto
usan el UID del navegador: cambiar el nombre no crea otro alumno y dos personas
de igual nombre no se agrupan por coincidencia de texto. El anfitrion puede
asignar una referencia local como grupoA-07 a cada UID. Puede usar esa misma
referencia para la misma persona en otro ordenador. No se permite asignarla a
dos perfiles distintos conectados en esa sala a la vez.

La referencia se guarda solo en el ordenador docente. No crea cuentas de menores,
no se envia a Firebase y no se usa para autenticar ni controlar accesos. Solo
afecta a nuevas capturas; no reasigna retroactivamente datos antiguos por nombre.
Los registros antiguos sin identificador siguen agrupandose como antes. Filtros,
Excel y PDF incluyen el identificador. Las referencias deben ser diferentes para
personas distintas: es responsabilidad del docente mantenerlas coherentes.

### Secuencia de rondas

Guarda primero sesiones con sus ajustes y anadelas a la secuencia (maximo 30).
Preparar siguiente pide confirmacion, aplica los ajustes y, en una sala propia,
prepara la revancha con el mismo codigo y los mismos perfiles. No comienza de
forma automatica: el anfitrion pulsa Empezar cuando esten listos. No cambia una
ronda activa ni avanza el indice si falla la preparacion. La lista se recuerda
en ese navegador. Una sesion eliminada se identifica como tal y no se ejecuta.

### Copias y repaso

La copia JSON incluye sesiones, favoritos de esas sesiones, referencias e historial.
No contiene claves de Firebase, credenciales ni permisos de sala. Contiene nombres
y resultados: debe guardarse de forma privada. Al importar se validan primero
los datos y los limites (8 MB, 30 sesiones, 500 rondas). Las sesiones se anaden;
las rondas con el mismo ID se combinan sin duplicarse. Se conserva el historial
mas reciente si se supera el limite de 500. La secuencia se prepara en cada equipo;
no se importa automaticamente. No se modifican salas online durante la importacion.
Si no hay almacenamiento, se avisa de la conservacion temporal en memoria.

El plan de repaso permite preparar una actividad de ese contenido sin tiempo,
sin modificar la sala ni empezarla. Se puede guardar como sesion. Al terminar una
partida, Crear practica con estos errores abre una partida individual con las
preguntas registradas localmente. Si estabas en online, confirma la salida. No
modifica la clasificacion anterior ni guarda marcas de esta practica en el cuadro.
No se inventa un historial de preguntas falladas del alumnado que el anfitrion
no haya recibido: sus informes por contenido siguen siendo estadisticas.

## 5. Estabilidad y comprobaciones

Version visible en el pie para identificar equipos con una copia antigua. Tras
publicar, recarga TODOS los dispositivos antes de usar los tipos nuevos: la
version no actualiza a distancia una pestaña antigua abierta.

Si un mismo navegador abre dos pestanas con el mismo participante y sala, se
pide confirmacion para continuar en la nueva. La anterior vuelve al dojo sin
desconectar el perfil de la nueva y cancela su aviso pendiente de desconexion.
Es una proteccion de interfaz basada en almacenamiento local, no un sistema
antitrampas. Si el almacenamiento se bloquea, no se garantiza esta coordinacion.
Los avisos de desconexion y los latidos existentes se mantienen.

Se comprueba el arranque real abriendo index.html sin servidor ni Firebase, el
teclado tactil/fisico/numerico, dos punteros tactiles, soluciones, transferencias,
identidad, secuencias y nombres. Las pruebas de navegador cubren cinco tamanos,
660 vistas nuevas y 114 vistas del maestro, hasta 60 alumnos (30 en movil).
Las pruebas reales de Firebase usan anfitrion y dos alumnos aislados, verifican
presencia y cancelacion, permisos y una secuencia docente que cambia la familia
de problemas sin cambiar el codigo ni expulsar alumnos. Las cuentas y salas
de prueba se eliminan. No se cambian las reglas ni la configuracion de Firebase.

Esto no sustituye una prueba en tu pizarra fisica: no se puede certificar aqui
su controlador multitactil, rendimiento, suspension o comportamiento del navegador.

## Comandos

- node banco-problemas/auditar-aula.cjs
- node banco-problemas/compilar-banco.cjs
- node tests/aula.test.cjs
- node tests/browser-smoke.cjs --aula-only
- node tests/browser-smoke.cjs --learning-only
- node tests/browser-smoke.cjs --dynamics-only
- node tests/startup-live.cjs
- node tests/live-security.cjs --live (prueba real opcional, con recursos desechables)
