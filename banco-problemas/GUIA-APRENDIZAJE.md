# Banco de Aprendizaje

Edita `aprendizaje.json`. Contiene 260 plantillas: 140 de geometria y 40 por cada otra familia, con diez contextos. Las cantidades son variables, no numeros fijos de los ejemplos.

```json
{
  "id": "geometria-1-1",
  "family": "geometria",
  "variant": 0,
  "context": "La biblioteca",
  "title": "Geometría: la biblioteca"
}
```

| Campo | Valores admitidos |
| --- | --- |
| `id` | Identificador unico entre todos los bancos. Mantenerlo estable. |
| `family` | `razonamiento`, `geometria`, `compras`, `proporcionalidad`. |
| `variant` | Entero de 0 a 13 en geometria y de 0 a 3 en las otras familias; estructura segun las tablas. |
| `context` | Nombre de una actividad: se inserta en «En la actividad «{context}»...». No contiene cantidades. |
| `title` | Titulo para el catalogo; no aparece como pista sobre la operacion durante el juego. |

| Familia | Variante 0 | Variante 1 | Variante 2 | Variante 3 |
| --- | --- | --- | --- | --- |
| Razonamiento | Datos sobrantes | Cantidad inicial desconocida | Dos preguntas encadenadas | Elegir el dato necesario |
| Geometria | Perimetro de cuadrado | Area de cuadrado | Perimetro de rectangulo | Area de rectangulo |
| Compras | Coste total | Cambio | Ahorro entre ofertas | Presupuesto restante |
| Proporcionalidad | Receta | Precio por unidad | Escala de un plano | Cantidad por equipo |

## Variables y Motor

`ampliacion.js` genera datos base de una, dos o tres cifras, factores de 2 a 8 y cantidades derivadas exactas. Los precios tienen centimos solo si se activan. Se usan lotes cuando los precios serian poco creibles para un cuaderno. Las escalas mantienen pequena la distancia sobre el plano. Las recetas distinguen especias, arroz y cantidades para varias comidas cuando procede.

Geometria genera un SVG con las medidas; es ilustrativo y no esta a escala. Las preguntas encadenadas producen una segunda pregunta con los mismos datos del contexto y el total anterior. No se pierde la cadena al consultar la solucion; la pregunta ayudada no da puntos. Cada pregunta cuenta por separado para los objetivos. El banco no guarda respuestas fijas: se calculan en el motor y las pruebas las contrastan con referencias independientes.

Estos campos no aceptan formulas ni marcadores arbitrarios. Para crear una estructura narrativa nueva hay que extender el generador, el selector y las pruebas; cambiar solo `context` produce otra escena de las estructuras existentes, no un tipo de razonamiento nuevo.

## Revisar y Publicar

1. Edita el JSON sin cambiar identificadores existentes ni introducir cantidades en los nombres de contexto.
2. Ejecuta `node banco-problemas/compilar-banco.cjs`.
3. Lee `VISTA-PREVIA-APRENDIZAJE.md`, incluidas las segundas preguntas y las unidades de area.
4. Ejecuta `node tests/aprendizaje.test.cjs`, `node tests/firebase-rounds.test.cjs` y `node tests/browser-smoke.cjs --learning-only`.
5. Publica tambien `aprendizaje-datos.js` y los archivos de motor/interfaz de aprendizaje indicados en el README.

El constructor `crear-banco-aprendizaje.cjs` sobrescribe el catalogo inicial; no lo uses para compilar tus cambios. Las pruebas de lenguaje y matematicas no sustituyen la lectura humana de cada estructura nueva.

## Geometria ampliada

Variantes: 0 perimetro de cuadrado, 1 area de cuadrado, 2 perimetro de rectangulo, 3 area de rectangulo, 4 perimetro de triangulo, 5 area de triangulo, 6 circunferencia, 7 area del circulo, 8 perimetro de paralelogramo, 9 area de paralelogramo, 10 perimetro de rombo, 11 area de rombo, 12 perimetro de trapecio isosceles y 13 area de trapecio.

Motor: geometria.js. Ajustes compartidos en la sala: _newDigits (1 a 3), _geometryVariant (-1 todas, o 0 a 13), _geometryDecimals (booleano, por defecto true), _geometryPi (cadena "3,14" o "3"). Todas las respuestas usan cm o cm2 segun corresponda. Pi se proporciona como dato aproximado; el resultado es exacto para ese dato, sin otro redondeo. El caso de circulos de una cifra con pi 3,14 y sin decimales no es compatible. Los triangulos cumplen la desigualdad triangular y los trapecios tienen bases distintas y dimensiones posibles.

Pruebas adicionales: node tests/geometry.test.cjs.
