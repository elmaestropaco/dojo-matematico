# Volumenes y geometria espacial

Banco editable: espacio.json. Motor: ../espacio.js. Hay 40 plantillas: diez
contextos para cada una de cuatro estructuras. El contexto cambia la escena,
no constituye una estructura matematica nueva.

| Campo | Valores |
| --- | --- |
| id | Identificador unico entre todos los bancos; conservar al editar. |
| family | espacio |
| variant | 0 cubo, 1 prisma, 2 cubitos por capas, 3 deposito en litros |
| context | Nombre de actividad, sin cantidades ni HTML. |
| title | Titulo del catalogo; no se muestra como pista. |

## Datos y Respuestas

_spaceDigits permite 1, 2 o 3 cifras en cada medida o cantidad dada; no limita
las cifras del resultado. _spaceVariant es -1 para todos los tipos, o 0-3 para
seleccionar uno. _spaceUnit es 0 cm, 1 dm o 2 m para figuras y cubitos. Los
depositos utilizan siempre dm y litros: el selector lo indica expresamente.
Estas familias no usan el selector de mezcla aritmetica.

Los datos son enteros positivos y los resultados se calculan con BigInt, sin
redondear. Cubo: a por a por a. Prisma: largo por ancho por alto. Cubitos:
cantidad por fila por filas por capa por numero de capas; cada cubito ocupa
una unidad cubica. Deposito: medidas interiores multiplicadas en dm; 1 dm3
equivale a 1 litro. No se mezclan unidades dentro de una misma pregunta.

Los SVG son esquemas etiquetados, no a escala. No hay que medir pixeles ni
contar cubitos dibujados. Las soluciones conservan el enunciado y el dibujo.
La pregunta pide volumen, no superficie: se responde en unidades cubicas.

## Calculo y Publicacion

cubeVolume y prismVolume tienen digits (1-3, por defecto 2) y spaceUnit (0-2,
por defecto 0). Los interruptores de negativos/decimales no cambian estos
datos enteros. Se incluyen en sesiones, favoritos, informes y salas online.

1. Editar espacio.json sin cambiar IDs existentes.
2. Ejecutar node banco-problemas/compilar-banco.cjs.
3. Leer VISTA-PREVIA-ESPACIO.md.
4. Ejecutar node tests/spatial.test.cjs y node tests/browser-smoke.cjs --spatial-only.
5. Publicar tambien espacio-datos.js, espacio.js y los cambios de interfaz.

Para anadir una estructura nueva hay que ampliar motor, selector, validador
y pruebas; cambiar solo context no es suficiente.
