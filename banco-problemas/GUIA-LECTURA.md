# Horarios, datos y razonamiento

Banco editable: lectura.json. Motor: ../lectura-problemas.js. Incluye 160
plantillas: diez contextos para cada una de las cuatro estructuras de cada familia.
Cambiar el contexto cambia la escena, no crea una estructura matematica nueva.

| Campo | Valores |
| --- | --- |
| id | Unico en todos los bancos; conservar al editar. |
| family | horarios, datos, estadistica o investigacion. |
| variant | 0, 1, 2 o 3, segun la tabla siguiente. |
| context | Nombre de la actividad, sin datos numericos ni HTML. |
| title | Titulo del catalogo; no se muestra como pista sobre la operacion. |

| Familia | 0 | 1 | 2 | 3 |
| --- | --- | --- | --- | --- |
| horarios | Duracion en minutos | Hora de llegada | Hora de salida | Duracion con cambio de dia |
| datos | Consultar tabla | Comparar dos cantidades | Total de la tabla | Mayor cantidad del grafico |
| estadistica | Media de tres datos | Media de cuatro datos | Probabilidad con bolas | Probabilidad con dado equilibrado |
| investigacion | Cantidad inicial desconocida | Datos suficientes o insuficientes | Corregir una operacion | Elegir datos relevantes |

## Ajustes

_literacyLevel es 1, 2 o 3. Tablas: tres, cuatro o cinco dias y cantidades de
una, dos o tres cifras. Horarios: pasos de 15, 5 o 1 minuto. Estadistica y
razonamiento ajustan cantidades; no hay una prueba de velocidad lectora.
Las cifras del nivel no son una restriccion universal para resultados derivados.

Cada familia tiene un selector: _horariosVariant, _datosVariant,
_estadisticaVariant o _investigacionVariant; -1 mezcla todos los tipos, 0-3
selecciona uno. Son ajustes independientes del selector de mezcla aritmetica.
_literacyDecimals permite medias exactas con cuartos en la media de cuatro
datos; las medias de tres datos son enteras. No se generan medias periodicas
ni se aceptan aproximaciones. Probabilidad se responde como fraccion y acepta
fracciones equivalentes, no requiere activar el interruptor general de decimales.

Las horas de llegada/salida y el razonamiento con opciones usan botones.
Pulsar una opcion la selecciona; Enviar confirma. Teclado: numero de opcion y
Enter. Las opciones se barajan de forma reproducible, igual para la misma
pregunta y semilla online. No se guarda el acierto por posicion fija.

El valor numerico de una respuesta con opciones es su indice desde 1; el texto
de la respuesta se conserva en answerLabel, se muestra en la solucion y se
envia como ultima respuesta al maestro. El repaso muestra las opciones
numeradas, aunque el campo para comprobar siga siendo numerico.

Las tablas se transponen en batalla estrecha o cara a cara para que conserven
todos los datos. Los encabezados abreviados tienen el nombre completo como
titulo. Los graficos incluyen valores exactos y descripcion accesible: no se
pide estimar alturas de pixeles. Al revelar solucion siguen visibles los datos.

## Compilar y comprobar

1. Editar lectura.json sin cambiar IDs existentes ni incluir cantidades en context.
2. Ejecutar node banco-problemas/compilar-banco.cjs.
3. Revisar VISTA-PREVIA-LECTURA.md, con opciones, dias y respuestas.
4. Ejecutar node tests/literacy.test.cjs y node tests/browser-smoke.cjs --literacy-only.
5. Publicar tambien lectura-datos.js y lectura-problemas.js.

La comprobacion automatica de matematicas y concordancias no sustituye la
revision humana de nuevas estructuras. Para anadir una estructura no basta
con cambiar el JSON: hay que ampliar motor, selector, validacion y pruebas.
