# Fichas de practica y PDF

Version 2026.11.25-fichas-orden-utf8. En la pantalla inicial, Tu dojo, tambien en papel
abre un generador independiente de la partida y del historial de informes.

## Preparar la ficha

1. Elige Calculo, Problemas o Calculo y problemas.
2. Marca los tipos que necesitas. Hay buscador y grupos plegados. Los ajustes
   de cada calculo aparecen en su desplegable: cifras, factores, divisores,
   exponentes y variantes, segun el tipo.
3. Misma cantidad de cada tipo utiliza una cantidad POR TIPO: 5 ejercicios de
   tres tipos generan 15. Mixto aleatorio utiliza una cantidad TOTAL y no
   garantiza que aparezcan todos los tipos ni igual cantidad de cada uno.
4. Ajusta formato horizontal/vertical/mezclado, maximo por fila y
   renglones. Los problemas ocupan todo el ancho para facilitar la lectura.
5. Decide si quieres soluciones explicadas. Empiezan en una pagina nueva
   DESPUES de todos los ejercicios, con la misma numeracion.
6. Genera la vista previa y pulsa Imprimir / Guardar PDF. En el dialogo del
   navegador elige Guardar como PDF. El destino y nombre final dependen del
   navegador y sistema operativo. No es una descarga binaria automatica.

La ficha es A4 vertical. Esto es distinto al formato de las OPERACIONES:
sumas, restas y productos pueden apilar sus operandos; las divisiones usan
la disposicion de dividendo a la izquierda y divisor/cociente a la derecha.
Fracciones, combinadas, ecuaciones y demas retos conservan su notacion.
En pantallas pequenas la vista previa apila tarjetas para que se lean; el
PDF mantiene los ejercicios por fila que has elegido.

El maximo por fila es Automatico (hasta 5) por defecto. El generador mide los
anchos reales con las fuentes y notacion de impresion, no cuenta caracteres:
cinco sumas pequenas pueden compartir una fila, mientras que una combinada
larga puede ocuparla entera. Elegir un maximo manual de 1-5 solo limita la
cantidad; nunca fuerza a meter una expresion que no cabe. Si una expresion
supera todo el ancho A4, se ajusta su letra para mantenerla en una linea.
Los problemas y las instrucciones siguen permitiendo parrafos de varias lineas.
El ajuste se recalcula al cargar la ficha y antes de imprimir.

Las preguntas se ordenan por el orden real de los controles de la plataforma:
naturales, enteros, potencias, contenidos comunes, algebra/ESO y problemas.
Dentro de cada bloque se explicita el orden de los tipos: sumas, restas,
productos, divisiones y combinadas faciles/avanzadas, antes de otros retos.
El selector y el documento comparten esta misma lista; no se ordenan por nombre
ni por el orden en que se marcaron las casillas.
La seleccion aleatoria sigue determinando cantidades y ejercicios, no el orden
de estos bloques. Se renumera la ficha completa y las respuestas mantienen
esa misma numeracion. En problemas no se muestra la operacion que resuelve cada uno.

Las soluciones estan en una hoja separada de la vista previa, despues de todos
los ejercicios. En impresion se fuerza el comienzo de esa hoja en pagina nueva,
aunque sobre espacio al final de la ultima pagina de preguntas. No hay respuestas
pegadas al ultimo ejercicio. Cerrar permanece en la cabecera fija del generador
mientras te desplazas; no aparece en el PDF.

Puedes escribir un titulo; nombre y fecha quedan en blanco para rellenarlos
en papel. No se copian nombres del alumnado ni codigos de sala. La ficha no
incluye los tipos de operacion encima de los problemas.

## Problemas

Hay problemas individuales de suma/resta/producto/division, combinados y
todas las familias del banco actual: fracciones, geometria, medidas, horarios,
razonamiento, lectura visual, etc. La cantidad cuenta ejercicios; un problema
encadenado puede contener un apartado b adicional con su solucion.

Los ajustes globales permiten cifras minimas/maximas, dificultad, llevadas,
dibujos y operaciones para combinaciones/fracciones. Las familias con nivel
usan dificultad 1-3. Las cifras de fracciones, geometria y otras familias
especiales se limitan a lo que admite su motor (generalmente 1-3). No se
inventan variantes fuera de su banco. Cada familia que lo permite tiene
un selector propio de variedad; otras opciones parten de la configuracion
actual de Problemas al cargarla.

Los dibujos opcionales se pueden ocultar. Las tablas y los datos necesarios
se conservan, igual que en el juego. Los ejercicios que no sean compatibles
con las cifras, llevadas o unidades elegidas muestran un aviso: no se genera
una ficha parcial ni se cambian los ajustes en silencio.

## Exactitud y soluciones

Las cuatro operaciones basicas, las combinadas aritmeticas, fracciones y
porcentajes se resuelven con racionales BigInt. Los productos decimales se
imprimen sin redondear: pueden tener mas decimales que sus factores.
En sumas/restas enteras no negativas se detallan las columnas, llevadas y
prestamos; en productos enteros se muestran productos parciales; en
divisiones se usa la fraccion reducida y la comprobacion multiplicativa.
Los otros retos reutilizan sus explicaciones matematicas, incluidos la formula
de segundo grado, discriminante y ambas raices. Las fracciones muestran
tambien el resultado anterior a simplificar cuando esta disponible.

Las soluciones de una ficha pueden ser mas exactas que un antiguo modo de
juego que redondeaba un producto: no se arrastra ese redondeo al papel.
La aplicacion de partida no se modifica por generar una ficha.

## Limites y privacidad

- Maximo de 200 ejercicios por ficha; al pedir cantidad por tipo, se comprueba
  el total. Hay intentos acotados para reducir repeticiones, pero en rangos
  pequenos o con cantidades altas pueden repetirse ejercicios.
- No inicia partidas, cronometros ni salas; no cambia puntos, operaciones,
  preferencias, indices ni semilla de una partida. La generacion temporal de
  calculos restaura sus referencias y opciones incluso si hay un error.
- No escribe en Firebase ni envia las fichas a un servicio PDF. No incluye
  firebase-config.js en la exportacion. La vista previa utiliza HTML local.
- Los ajustes y la ficha permanecen mientras la pagina esta abierta; no se
  guardan automaticamente como historial ni en las sesiones de juego.
- Cambiar un ajuste invalida la vista previa anterior. El boton de imprimir
  se activa cuando la nueva ficha esta cargada para evitar imprimir en blanco.
- Si el dispositivo no permite imprimir el iframe, usa Abrir ficha en otra
  pestana y su boton Imprimir. Permite ventanas emergentes si lo solicita.
- El PDF puede variar en saltos de pagina segun fuentes y navegador. En
  impresion conviene desactivar cabeceras/pies del navegador si no se desean.

## Pruebas

```text
node tests/fichas-pdf.test.cjs
node tests/encoding.test.cjs
node tests/browser-smoke.cjs --worksheets-only
node tests/startup-live.cjs
```

Se comprueban la aritmetica exacta, seguridad del titulo, reparto y limites,
los 96 tipos actuales, cinco tamanos, formatos, estado inalterado y un PDF A4
real mediante Chrome. Se conservan las pruebas del panel maestro y sus tarjetas.
Publicar todos los archivos del release y recargar los dispositivos.
No requiere cambiar las reglas de Firebase.

El workflow de Pages usa un nombre de artefacto unico por ejecucion e intento,
y espera a que sus metadatos esten disponibles antes de desplegar. Evita los
fallos de paquete no visible aun y paquetes duplicados tras reintentar.
