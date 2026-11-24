# Organizacion del calculo

Version 2026.11.24-calculo-mental. Banco de problemas sin cambios: 2530 plantillas.

## Valores iniciales y cifras de exponentes

Todos los selectores de cifras de calculo parten de 1. Los ajustes guardados se
conservan: Todo a 1 cifra aplica ese valor a cifras de operandos, exponentes y
limites decimales sin desmarcar operaciones. No modifica las cantidades de
numeros (MCM/MCD necesita al menos 2), unidades, signos ni modalidades.

En los retos de propiedades de potencias, Cifras del exponente permite 1, 2 o 3:
valores de 0 hasta 9, 99 o 999, respectivamente. Si se activan negativos, tambien
sus opuestos. El resultado de combinar exponentes puede tener mas cifras que
los exponentes iniciales. Los exponentes negativos se muestran con signo.

Los productos, cocientes, combinadas multiplicativas y potencia de potencia
admiten base^exponente, por ejemplo 3^174. Las potencias grandes no se expanden
en memoria: no hay redondeos, Infinity ni resultados gigantes que teclear.
Se acepta ademas el valor numerico exacto cuando el motor dispone de su
fraccion desarrollada (exponente absoluto hasta 64, o base 1).

Para sumas/restas y combinadas, con 2-3 cifras en exponentes se pide un
coeficiente: 3^87 + 3^88 = ? x 3^87, respuesta 4. El hueco pide solo ese numero.
Las combinadas con enteros combinan un parentesis de suma con propiedades de
potencias y tambien piden el coeficiente. Con una cifra, sumas y combinadas
mantienen el valor numerico exacto si cabe en el limite de 32 caracteres;
si no, pasan a un hueco de coeficiente. No se suman exponentes al sumar potencias.

Calcular una potencia conserva el reto de desarrollar su valor numerico:
base de 1-3 cifras y exponente de 0-9. No se ofrecen exponentes de 999 para
pedir cientos de cifras ni se acepta como solucion copiar la propia expresion.
Las configuraciones antiguas sin exponentDigits siguen disponibles en las
funciones matematicas; la interfaz actual ofrece el nuevo selector por cifras.

## Seleccionar operaciones

- Numeros naturales: sumas con/sin llevadas, restas con/sin prestamo,
  multiplicaciones, divisiones exactas, tablas inversas, cociente/resto y combinadas.
  Otros retos agrupa raices exactas, factorizacion, MCM/MCD, huecos, comparacion
  y redondeo.
- Numeros enteros: las cuatro operaciones, combinadas faciles/avanzadas,
  ordenacion, valor absoluto y recta numerica. Las seis operaciones con signos
  permiten entre 1 y 9 cifras por operando; 1 por defecto. Las divisiones son exactas.
- Operaciones con potencias: calcular, sumar, restar, multiplicar/dividir con igual
  base, potencia de potencia, combinadas faciles/avanzadas y combinadas con enteros.
- Contenidos comunes: fracciones, porcentajes, decimales, magnitudes, tiempo y
  geometria. No se duplican estas opciones bajo Naturales y Enteros.

El buscador admite el nombre del grupo (naturales, enteros, potencias), no solo
el nombre de una operacion. Los contadores resumen las opciones activas de cada grupo.

Borrar busqueda elimina solo el texto y restaura los desplegables. Quitar todas
las operaciones desmarca todas las opciones, aunque esten plegadas o filtradas.
Conserva las cifras y demas ajustes. Cada chip permite quitar una sola operacion.

## Compatibilidad

Se mueven los controles existentes, sin duplicarlos ni cambiar sus identificadores.
Las preferencias y sesiones guardadas siguen funcionando. Si estaban activos los
ajustes generales de decimales o negativos, no se apagan en silencio. El apartado
Naturales muestra un aviso y una accion explicita para usar naturales puros.
Esta accion apaga ambos ajustes generales; no desmarca operaciones. Los retos
del apartado Enteros siguen incluyendo signos por su propia definicion.

Los enteros no exigen activar decimales. No se ofrecen raices negativas reales
ni se duplican MCM/MCD como si fueran operaciones distintas para numeros negativos.

## Potencias nuevas

Bases positivas de 2 a 9. Las propiedades permiten 1-3 cifras de exponente.
Cada opcion permite exponentes positivos/cero o tambien negativos.

- Sumas/restas: se calculan los valores, NO se suman/restan exponentes.
  Ejemplo: 2^3 + 2^2 = 12.
- Potencia de potencia: se multiplican exponentes. (2^3)^(-2) = 2^-6 = 1/64.
  Se acepta base^exponente con la base original o el valor numerico exacto.
  La tecla P introduce ^; el teclado tactil permanece disponible.
- Combinadas faciles: suma entre parentesis y producto de potencias.
- Combinadas avanzadas: parentesis, resta, division, suma y potencia de potencia.
  Las respuestas numericas se mantienen dentro del limite de entrada de 32 caracteres.

Las sumas/restas y combinadas piden valor numerico entero o fraccion exacta.
Se evita redondear. La aritmetica racional usa BigInt, tambien con 9 cifras.
Una potencia de potencia grande puede responderse en formato base^exponente,
sin teclear un entero o denominador expandido de mas de 32 caracteres.
La avanzada vale 20 puntos base; las otras nuevas, 10. La penalizacion no cambia.

## Publicacion y comprobaciones

No cambia el esquema ni las reglas de Firebase. Nuevas opciones viajan en la
configuracion de sala existente. Todos los dispositivos deben recargar la web
publicada para compartir los mismos generadores. El modo local funciona abriendo
index.html. El ZIP excluye firebase-config.js como los releases anteriores.

Pruebas:

```text
node tests/organizacion.test.cjs
node tests/exponentes-cifras.test.cjs
node tests/startup-live.cjs
node tests/browser-smoke.cjs --controls-only
node tests/browser-smoke.cjs --reasoning-only
node tests/browser-smoke.cjs --exponents-only
node tests/live-security.cjs --live
```

Las pruebas de navegador cubren cinco tamanos, selecciones y almacenamiento,
busqueda, las dos acciones de borrado, soluciones, teclado y panel docente.
Comprobar ademas la pizarra fisica: sus controladores tactiles no se emulan aqui.
