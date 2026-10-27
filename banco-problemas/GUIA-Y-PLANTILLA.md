# Banco de problemas: formato 1

El banco de enteros tiene 600 plantillas, 40 de cada operacion individual y 40 de cada una de las 11 combinaciones posibles de dos, tres o cuatro operaciones. Junto al banco ampliado de fracciones y MCM/MCD, la app ofrece 1320 plantillas. Se puede jugar en entrenamiento, batalla local, online y salas del maestro. Consulta el desglose en `RECUENTO.md`.

## Archivos

El banco de enteros conserva el formato 1 descrito abajo. La app incluye tambien `ampliado.json`, con 600 plantillas de fracciones y 120 de MCM/MCD: el total es 1320. Sus plantillas contienen `id`, `family` (fracciones o mcmMcd), `title`, `categories`, `scene` (key, title, intro y unit), y, para fracciones, `order` con las operaciones en el orden narrado. Los textos y pasos se construyen en `matematicas-extra.js`, con aritmetica racional exacta. No mezcles este formato con el de los JSON de enteros. Tras editar cualquiera de los bancos, ejecuta `node banco-problemas/compilar-banco.cjs` y comprueba `node tests/advanced-math.test.cjs`. Los ejemplos de las nuevas familias pueden generarse con `NinjaProblems.generate` seleccionando `_family`.

- `sumas.json`: 40 plantillas individuales de sumas.
- `restas.json`: 40 plantillas individuales de restas.
- `multiplicaciones.json` y `divisiones.json`: 40 plantillas individuales de cada categoria y dos combinadas heredadas en cada archivo.
- `combinados.json`: 436 problemas adicionales con varias operaciones; sumados a los cuatro heredados, hay 40 por combinacion.
- `VISTA-PREVIA-RESTAS.md`: las restas con ejemplos resueltos.
- `datos.js`: copia compilada para que la app funcione incluso abriendo index.html directamente. No editar este archivo a mano.
- `compilar-banco.cjs`: valida los cinco JSON y reconstruye datos.js, las vistas previas y RECUENTO.md tras editar el contenido.
- `VISTA-PREVIA-SUMAS.md` y las vistas previas de cada archivo: plantillas en formato legible, con variables, limites y ejemplos resueltos.
- `plantilla-problema.json`: un ejemplo completo y editable para aportar nuevos problemas. No forma parte del banco de sumas.
- `validar-banco.cjs`: comprueba la estructura, las variables, el ejemplo numerico y su solucion. Se ejecuta con Node.js.

Puedes escribir los enunciados y explicaciones con tildes y signos habituales. Guarda los JSON como UTF-8. Las comillas, comas, nombres de campos y palabras reservadas deben conservar el formato indicado.

Cada unidad de concordancia y la unidad de respuesta pueden indicar `genero`: `femenino` o `masculino`. Incluyelo siempre al crear problemas nuevos, especialmente si el sustantivo no figura en el vocabulario del validador. Ejemplo: `{"tipo":"concordancia","cantidad":"cantidadA","singular":"hoja","plural":"hojas","genero":"femenino"}`. La pregunta debe decir Cuantas hojas, no Cuantos hojas. Evita ligar verbos o adjetivos plurales a una cantidad que pueda valer 1: tienen 1 hoja funciona; quedan 1 hoja no. Usa formulaciones como tienen, reciben o hay.

En las escenas de fracciones, declara tambien `unitSingular` (por ejemplo, litro de agua) y `unitGender` (masculino o femenino). No basta con cambiar el objeto: revisa unidades, pronombres, concordancia y que cada paso se deduzca del texto. Si se multiplica por dias, el enunciado debe indicar la cantidad que se recibe cada dia, no solo una entrega durante varios dias.

## Que debes rellenar

1. El identificador `id`: unico, sin espacios ni tildes; por ejemplo, `resta-biblioteca-001`.
2. El `titulo` y las `etiquetas` de operaciones que realmente se resuelven.
3. El `enunciado`, colocando las variables entre llaves simples.
4. Las `variables`: cantidades, palabras o formas singular/plural que aparezcan en el texto.
5. Los `pasos`: operacion, datos de entrada, identificador del resultado y explicacion.
6. La `respuesta`: resultado final y unidad.
7. Las `restricciones` y un `ejemplo` concreto con su respuesta correcta.

El campo opcional `dificultad` admite `facil`, `media` o `avanzada`. Si se omite se considera facil. Facil usa frases cortas y un paso directo; media pide interpretar una comparacion, cantidad inicial o agrupamiento; avanzada tiene dos pasos. Todo el banco utiliza lenguaje sencillo. Para comenzar con alumnado de 6 anos, se recomienda facil y una cifra. Las cifras se configuran por separado de la dificultad del enunciado.

Los enunciados deben ser naturales, no listas de frases telegráficas. Ejemplo: «En una estanteria hay {cantidadA} {unidadA} y un alumno se lleva {cantidadB} {unidadB} a casa. ¿Cuantos libros quedan en la estanteria ahora?». El campo opcional `enunciadoCompacto` permite una version mas breve para batallas en movil; debe mantener todos los datos necesarios y una redaccion natural. Usa los mismos marcadores declarados en `variables`.

Cada archivo tiene este envoltorio. Puedes incluir varios problemas dentro de `plantillas`, separados por comas:

```json
{
  "version": 1,
  "idioma": "es",
  "plantillas": []
}
```

## Variables y palabras admitidas

Los nombres distinguen mayusculas de minusculas. Cada variable debe estar declarada; no se admiten marcadores sueltos como `{cajas}` sin declarar.

| Para que sirve | Nombres admitidos | Uso en el enunciado |
| --- | --- | --- |
| Cantidades enteras | `cantidadA`, `cantidadB`, `cantidadC`, `cantidadD`, `cantidadE`, `cantidadF` | `{cantidadA}` |
| Personas o personajes | `nombre1`, `nombre2` | `{nombre1}` |
| Lugar o contexto | `lugar` | `{lugar}` |
| Sustantivo que concuerda con una cantidad | `unidadA`, `unidadB`, `unidadC`, `unidadD`, `unidadE`, `unidadF` | `{unidadA}` |
| Resultado de un paso | `resultado1`, `resultado2`, `resultado3`, `resultado4`, `resultado5`, `resultado6` | `{resultado1}` en explicaciones |

`cantidadA` no significa siempre cajas: puede representar libros, personas, una distancia o el numero de grupos. Indica su significado en `descripcion`.

Las palabras del texto son libres. Por ejemplo, puedes escribir biblioteca, huerto, nave espacial o cromos. Para palabras intercambiables, utiliza una variable de texto y enumera las opciones en `valores`. Solo se escogeran palabras de esa lista; puedes ampliarla. No hace falta una lista universal de objetos.

Ejemplos de declaraciones:

```json
{
  "cantidadA": {
    "tipo": "entero",
    "descripcion": "Libros que habia al principio",
    "minimo": 1,
    "maximo": 9999
  },
  "nombre1": {
    "tipo": "texto",
    "valores": ["Ana", "Alex", "Sam"]
  },
  "unidadA": {
    "tipo": "concordancia",
    "cantidad": "cantidadA",
    "singular": "libro",
    "plural": "libros"
  }
}
```

Con `{cantidadA} {unidadA}` se genera `1 libro` o `23 libros`.

Elige palabras intercambiables que encajen en toda la frase: despues de `en la`, las alternativas deben encajar con ese articulo. Si quieres cambiar tambien el articulo, incluyelo en cada valor de `lugar` y escribe `en {lugar}`.

## Operaciones: palabras exactas

En `etiquetas` y `pasos[].operacion` solo se admiten estas palabras, en minusculas y sin tildes:

| Palabra admitida | Significado |
| --- | --- |
| `suma` | Primer operando mas segundo operando |
| `resta` | Primer operando menos segundo operando |
| `multiplicacion` | Producto de los dos operandos |
| `division` | Primer operando dividido entre el segundo |

No escribas `sumas`, `+`, `multiplicar` o `divisiones` en esos campos. En los enunciados y explicaciones si puedes escribir con lenguaje natural.

La pantalla ofrece tres formas de mezclar. Individuales admite plantillas con una sola etiqueta y alterna los tipos marcados. Combinados exige que las etiquetas de cada plantilla coincidan exactamente con todos los tipos marcados. Mixto une ambos conjuntos. Nunca se usan etiquetas sin marcar. En combinados no se aplica la dificultad individual: el numero de pasos depende del conjunto elegido. Con un solo tipo, Solo combinados no tiene plantillas compatibles.

Cada paso lleva exactamente dos operandos. Para sumar tres cantidades, usa dos pasos. Para operaciones combinadas, escribe los pasos en el orden de resolucion y etiqueta todas las operaciones utilizadas. No se escriben formulas ejecutables ni expresiones JavaScript.

En la app, multiplicaciones dispone de un rango Minimo/Maximo de cifras para Multiplicador 1 y otro para Multiplicador 2. Divisiones ofrece Dividendo y Divisor. Los rangos admiten de 1 a 9 cifras; al igualar minimo y maximo, las cifras son fijas. Los limites de cada variable siguen vigentes y el contador excluye contextos incompatibles.

Una cantidad dada usa la configuracion de la primera operacion que la utiliza y de su posicion en los operandos. En un reparto `cantidadA / cantidadB`, A usa Dividendo y B usa Divisor. Si el dividendo es un resultado intermedio, se conserva completo, sin truncarlo ni cambiarlo para forzar sus cifras. En dos repartos consecutivos, los dos divisores dados usan el rango Divisor. Todas las divisiones del banco son exactas.

```json
{
  "etiquetas": ["multiplicacion", "resta"],
  "pasos": [
    {
      "id": "resultado1",
      "operacion": "multiplicacion",
      "operandos": ["cantidadA", "cantidadB"],
      "explicacion": "Calculamos el total: {cantidadA} × {cantidadB} = {resultado1}."
    },
    {
      "id": "resultado2",
      "operacion": "resta",
      "operandos": ["resultado1", "cantidadC"],
      "explicacion": "Restamos los que se han usado: {resultado1} − {cantidadC} = {resultado2}."
    }
  ]
}
```

## Restricciones

Estos nombres tambien se escriben exactamente asi:

| `tipo` | `izquierda` | `derecha` | Regla |
| --- | --- | --- | --- |
| `mayor_o_igual` | Una cantidad o resultado | Otra cantidad o resultado | Izquierda >= derecha |
| `mayor_que` | Una cantidad o resultado | Otra cantidad o resultado | Izquierda > derecha |
| `division_exacta` | Dividendo | Divisor | Divisor distinto de cero y resto cero |

Ejemplo para impedir una resta negativa:

```json
{"tipo": "mayor_o_igual", "izquierda": "cantidadA", "derecha": "cantidadB"}
```

Ejemplo para una division exacta:

```json
{"tipo": "division_exacta", "izquierda": "cantidadA", "derecha": "cantidadB"}
```

Incluye una restriccion `division_exacta` para los operandos de cada paso de division.

Para el problema combinado anterior, la restriccion seria `resultado1 >= cantidadC`. Los resultados se calculan antes de comprobar estas restricciones; solo las variantes que las cumplan podran usarse.

Este primer formato usa cantidades enteras positivas y soluciones enteras no negativas. Las divisiones deben ser exactas. Los resultados intermedios pueden ser negativos si el resultado final respeta las restricciones; añade restricciones sobre ellos si el contexto tambien los prohibe. Fracciones, decimales y conversiones de unidades necesitaran una ampliacion explicita del formato.

## Cifras fijas o intervalos

Los campos `minimo` y `maximo` son limites de coherencia del contexto, no una dificultad fija. La pantalla solo pide Minimo y Maximo de cifras (1 a 9). Iguales = cifras fijas; distintos = intervalo. En combinados, cada variable numerica toma la configuracion de la primera operacion que la usa. Se cruzan estas cifras con sus limites de contexto.

Ejemplo: con 3 cifras, una cantidad entre 1 y 9999 se generaria entre 100 y 999. Una cantidad limitada a 30 no puede generar 3 cifras; esa plantilla se debera excluir de esa configuracion, sin cambiar silenciosamente sus limites.

El resultado puede tener mas cifras que los datos. No pongas grandes limites artificiales en contextos pequenos: una clase no debe tener millones de alumnos. La plantilla de poblacion del banco permite practicar numeros de hasta 9 cifras.

## Llevadas y selectores de cifras

Cada categoria de sumas y restas tiene botones Ambas, Sin llevadas y Con llevadas. En restas, las llevadas se entienden como prestamos. Se comprueba cada paso de ese tipo, tambien en combinados. Se excluyen configuraciones imposibles, como una resta con prestamos entre cantidades de una cifra. En multiplicacion y division no se aplica este filtro.

Ambos selectores permanecen editables mientras la categoria esta activa. Si se sube el minimo por encima del maximo se sube tambien el maximo, y si se baja el maximo por debajo del minimo se baja el minimo. No hay un selector adicional de cifras fijas o intervalo.

Las divisiones se construyen con multiplos del divisor para que sean exactas; no se busca una coincidencia por redondeo. Los calculos usan enteros exactos incluso cuando una multiplicacion produce un resultado de mas de 15 cifras.

## Ejemplo obligatorio

En `ejemplo.valores` incluye todas las cantidades y variables de texto declaradas. No incluyas las concordancias ni los resultados: se calculan automaticamente.

`ejemplo.respuesta` se escribe como texto de un entero, por ejemplo `"37"`. Esto evita perder precision con productos grandes.

```json
{
  "valores": {"cantidadA": 25, "cantidadB": 12, "lugar": "la biblioteca"},
  "respuesta": "13"
}
```

## Comprobar tus archivos

Desde la carpeta de la app:

```powershell
node banco-problemas/validar-banco.cjs
node banco-problemas/validar-banco.cjs banco-problemas/plantilla-problema.json
node banco-problemas/validar-banco.cjs banco-problemas/restas.json
node banco-problemas/validar-banco.cjs banco-problemas/multiplicaciones.json
node banco-problemas/validar-banco.cjs banco-problemas/divisiones.json
node banco-problemas/validar-banco.cjs banco-problemas/combinados.json
node banco-problemas/compilar-banco.cjs
```

El comprobador muestra cada enunciado con los valores del ejemplo y su respuesta. Comprueba el formato, los marcadores, las referencias, las etiquetas, los limites, las restricciones y el calculo del ejemplo. No sustituye la revision pedagogica. El motor del juego comprueba tambien las restricciones en cada variante generada.

Puedes entregarme el JSON rellenado o pegar su contenido en el chat. Mantener estos nombres permite convertirlo a datos de la app sin tener que adivinar que representa cada campo.
