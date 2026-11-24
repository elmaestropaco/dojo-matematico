# Enteros, potencias y nuevos razonamientos

Version: 2026.11.24-enteros-potencias. No cambia la configuracion ni las reglas
de Firebase. Recarga todos los dispositivos despues de publicar la actualizacion.

## Codigo de sala

Se retira la llave flotante de la arena, tambien en el maestro: no puede tapar
Pista, Ver solucion ni el encabezado de un alumno. Se conserva el codigo
copiable del lobby y el codigo del panel docente. La sala no cambia de codigo.

## Dibujos opcionales

En Banco de problemas hay una casilla Mostrar dibujos, activa por defecto.
Se guarda con las preferencias y sesiones y se comparte en online/maestro.
Ocultar dibujos no cambia la pregunta ni la respuesta: un grafico o cuadrícula
que aporta datos se sustituye por una descripcion con esos mismos datos.
Las tablas no se ocultan. Las medidas de problemas geometricos anteriores ya
estan en sus enunciados. En pistas, solucion y repaso se respeta la misma opcion.
El ajuste afecta a problemas, no elimina rectas numericas esenciales del calculo.

## Calculo con enteros

En Mas retos de calculo, abre Enteros y potencias. Hay seis opciones independientes:
sumas, restas, multiplicaciones, divisiones exactas, combinadas faciles y avanzadas.
Las cifras de los operandos van de 1 a 3 (2 por defecto). Los operandos admiten
signos positivos y negativos; los negativos se muestran entre parentesis.

Las faciles combinan suma y producto respetando prioridad. Las avanzadas utilizan
dos parentesis, producto, resta y division exacta. No generan divisores cero ni
divisiones truncadas. Estas opciones incluyen signos aunque el ajuste general
de negativos este desactivado: seleccionarlas es una eleccion explicita del docente.
Las operaciones basicas anteriores no cambian. Se muestran en linea para que
los parentesis y signos se lean sin ambiguedad. El teclado incluye la tecla −.

## Potencias

Opciones de multiplicar, dividir o combinar potencias de la misma base. Bases
positivas de 2 a 9; nunca se generan bases cero. Exponente maximo en valor
absoluto: de 1 a 6. Exponentes positivos y cero por defecto; opcionalmente,
positivos y negativos. Sin negativos, los cocientes se construyen para que el
exponente final no sea negativo tampoco.

Multiplicar suma exponentes y dividir los resta, incluida la resta de exponentes
negativos. No se confunde exponente negativo con resultado negativo. Ejemplo:
2^2 dividido entre 2^5 = 2^-3 = 1/8. Se acepta la potencia simplificada conservando
la base original (2^-3) o su valor numerico exacto (1/8 o una fraccion equivalente).
La tecla ^ aparece en el teclado tactil; en el fisico se acepta ^ o la letra P.
En el bloque numerico, la tecla de multiplicar introduce ^ durante estos retos.
El signo − puede escribirse despues de ^, no solo al principio de la respuesta.

Combinadas de enteros y potencias suma un entero con signo a un producto/cociente
de potencias. Pide el valor numerico exacto, como entero o fraccion; no una
aproximacion decimal. Su exponente reducido se acota para que la respuesta
completa quepa en el teclado de 32 caracteres. La aritmetica se comprueba con
fracciones de enteros grandes, no con tolerancias de coma flotante.

Las combinadas avanzadas de enteros y las mixtas de enteros/potencias valen
20 puntos por acierto; las demas, 10, antes de los ajustes opcionales de partida.
La penalizacion por error no aumenta y los puntos nunca bajan de cero.
Las potencias sin cifras configurables son retos fijos: no reciben un aumento
de puntuacion ficticio por activar dificultad progresiva.

## Problemas nuevos

210 plantillas, 21 razonamientos con 10 contextos cada uno. Banco total: 2530.
No se cuentan las variantes numericas como plantillas adicionales.

- Patrones: continuar una serie, corregir un termino y alternar dos reglas.
  El criterio de la serie se explicita para que la respuesta no sea ambigua.
- Combinatoria: conjuntos de ropa, menus de tres platos y caminos por etapas.
  Se indica que todas las combinaciones estan permitidas.
- Mediana, moda y rango: cinco datos; cuando se pide moda, es unica.
- Enteros en contexto: temperaturas, plantas de un ascensor y saldos. Los
  resultados negativos tienen teclado con signo, tambien en modo problemas.
- Porcentajes inversos y sucesivos: recuperar un precio previo o una cantidad
  inicial; aplicar dos descuentos sobre bases sucesivas claramente indicadas.
  Las cantidades se construyen para tener resultados exactos, sin redondeo.
- Planificacion: ultima llegada permitida, hueco sin solapamientos y compra
  que cumple cantidad y presupuesto. Las opciones tienen una unica respuesta
  correcta y se barajan de forma reproducible para todos los participantes.
- Lectura visual: contar cuadraditos unitarios sombreados, leer cantidades
  de un grafico y recorrer una cuadricula siguiendo un camino. El texto alternativo
  conserva dimensiones, cantidades y direcciones si se desactivan dibujos.

Los nuevos tipos se pueden seleccionar junto con otros calculos y se incluyen
en sesiones, busqueda de actividades, siguiente ronda del maestro y seguimiento.
Dentro de problemas se escoge una familia y sus variedades: el selector de mezcla
de operaciones de otras familias no altera estas preguntas.

## Pruebas

- node tests/razonamiento.test.cjs: 12000 calculos exactos y 2520 problemas con
  referencias independientes; signos, cifras, exponentes cero/negativos, limites,
  unicidad de las opciones y datos alternativos sin SVG.
- node tests/browser-smoke.cjs --reasoning-only: cinco tamanos, individual y
  batalla, variantes nuevas con/sin dibujos, enunciado y solucion, teclado de
  exponentes, cambios de teclado y ausencia de codigo flotante.
- 1240 vistas nuevas y 114 vistas del maestro, conservando las tarjetas sin scroll.
- Las baterias anteriores siguen disponibles; el arranque directo de index.html
  no necesita Firebase. Las pruebas reales de Firebase usan recursos desechables,
  comprueban configuracion compartida, igualdad de preguntas/respuestas entre
  alumnos y cambio de ronda con el mismo codigo.

Una prueba en tu pizarra fisica sigue siendo necesaria para confirmar su
controlador multitactil y rendimiento. Las pruebas automaticas no lo certifican.
