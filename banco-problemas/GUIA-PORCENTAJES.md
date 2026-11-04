# Plantillas de porcentajes

Contenido editable: `porcentajes.json`. Sus 160 entradas son 40 contextos para cada uno de los cuatro tipos. Los números no se guardan en el contexto: se generan en cada partida según los ajustes. No sustituyas números en los ejemplos Markdown; son vistas generadas.

## Estructura

```json
{
  "id": "porcentajes-parte-papeleria",
  "family": "porcentajes",
  "type": "parte",
  "title": "Calcula una parte: material escolar",
  "variant": 0,
  "scene": {
    "key": "papeleria",
    "intro": "En la papelería del barrio",
    "item": "una mochila",
    "purpose": "material escolar"
  }
}
```

| Campo | Valores admitidos / función |
| --- | --- |
| `id` | Identificador único; no cambiar en plantillas ya publicadas salvo necesidad. |
| `family` | Siempre `porcentajes`. |
| `type` | `parte`, `descuento`, `aumento` o `relacion`. |
| `title` | Título legible. |
| `variant` | Entero de 0 a 3; elige una de cuatro introducciones para parte/relación individuales. |
| `scene.key` | Identificador del contexto. |
| `scene.intro` | Lugar o contexto completo, sin punto final: «En la papelería del barrio». |
| `scene.item` | Sintagma con artículo: «una mochila», «unas gafas de natación». Se inserta después de «comprar» o «el precio de». |
| `scene.purpose` | Objeto de una compra, sin verbo: «material escolar». Se inserta después de «para», «comprar» o «una compra de». |

## Variables Generadas

- `initial`: importe inicial entero, con las cifras seleccionadas.
- `total`: importe de referencia después de las operaciones adicionales, si las hay.
- `percent`: porcentaje entero; básico o entre 1 y 100, compatible con los decimales permitidos.
- `part`: parte del total (`total × percent ÷ 100`), con decimal exacto y coma española cuando proceda.
- En combinados: cantidad de unidades, precio de entrega, importe del vale y número de personas. Todos aparecen explícitamente en el enunciado; no se insertan operaciones desmarcadas.

Las cuatro preguntas buscan, respectivamente, la parte, el precio después del descuento, el importe después del aumento o el porcentaje que representa una parte. El resultado es exacto, no redondeado. Los pasos y los textos largos/compactos se construyen en `porcentajes.js`.

## Revisar y Publicar

1. Edita el JSON, conservando el sentido de las frases al sustituir `intro`, `item` y `purpose`.
2. Ejecuta `node banco-problemas/compilar-banco.cjs`.
3. Lee los ejemplos de `VISTA-PREVIA-PORCENTAJES.md`, especialmente artículos y unidades.
4. Ejecuta `node tests/percentages.test.cjs` y `node tests/browser-smoke.cjs --percentages-only`.
5. Publica el código y el archivo compilado `porcentajes-datos.js`. No publiques la configuración local de Firebase.

Las pruebas detectan errores concretos de cálculo, formato y concordancia; no sustituyen la revisión humana de un contexto nuevo. El constructor `crear-banco-porcentajes.cjs` sobrescribe el JSON: solo sirve para reconstruir el catálogo inicial, no para compilar tus cambios.
