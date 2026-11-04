# Problemas de Medidas

El banco editable es `medidas.json`. Hay 40 plantillas de longitud, 40 de masa, 40 de capacidad y 40 de tiempo. Sus cantidades y unidades se generan según los ajustes de cada partida. Las variantes combinadas reutilizan estas plantillas: no se cuentan como entradas nuevas.

```json
{
  "id": "medidas-longitud-costura",
  "family": "medidas",
  "type": "longitud",
  "title": "Longitud: En el taller de costura",
  "scene": {
    "key": "costura",
    "intro": "En el taller de costura"
  }
}
```

| Campo | Valores / significado |
| --- | --- |
| `id` | Identificador único. Mantenerlo estable en contenido publicado. |
| `family` | Siempre `medidas`. |
| `type` | `longitud`, `masa`, `capacidad` o `tiempo`. |
| `title` | Título legible. |
| `scene.key` | Identificador del contexto. |
| `scene.intro` | Introducción completa sin punto: «En el taller de costura». Debe admitir preparar una cinta, reunir papel, disponer de agua o reservar tiempo para una actividad. |

## Variables Generadas

- Cantidad inicial: entero con las cifras mínimas/máximas seleccionadas, de 1 a 9.
- Unidad de origen y destino: elegidas por el usuario o aleatorias compatibles; siempre de la misma magnitud y distintas entre sí.
- Cantidad convertida: exacta, entera o con hasta 1, 2 o 3 decimales, según los ajustes.
- Datos adicionales: medidas en la unidad de destino, número de lotes o número de partes de un reparto, solo para las operaciones marcadas.
- Resultado final: exacto, con coma española si hay decimales. No se redondea.

La tabla de unidades y el generador están en `magnitudes.js`. Masa trabaja con papel, longitud con una cinta, capacidad con agua y tiempo con una actividad. Las variantes completas y compactas conservan los datos, la pregunta y la magnitud. Para ampliar a otros materiales o nuevas estructuras narrativas hay que extender el generador y sus pruebas, no introducir campos que el motor ignore.

## Combinados

Cada problema usa una sola magnitud. Marcar longitud y masa alterna problemas de ambos tipos, no suma metros con gramos. Con operaciones adicionales se convierte primero a la unidad de destino y después se aplican las seleccionadas en orden: suma, resta, multiplicación y reparto. Los factores y los repartos son pequeños; no se recortan resultados intermedios para forzar las cifras iniciales. Cada paso explica su operación y unidad. Consultar la solución no da puntos.

## Publicación

1. Edita `medidas.json` conservando una introducción natural y compatible con el tipo.
2. Ejecuta `node banco-problemas/compilar-banco.cjs`.
3. Revisa los ejemplos de `VISTA-PREVIA-MEDIDAS.md`.
4. Ejecuta `node tests/units.test.cjs` y `node tests/browser-smoke.cjs --units-only`.
5. Publica también `medidas-datos.js` y `magnitudes.js`.

`crear-banco-medidas.cjs` reconstruye y sobrescribe el banco inicial. No sustituye al compilador ni debe ejecutarse sobre modificaciones propias sin copia. Las pruebas no sustituyen una lectura humana de los nuevos contextos.
