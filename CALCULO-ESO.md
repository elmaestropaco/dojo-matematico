# Calculos de algebra y ESO

Version 2026.11.24-algebra-eso. Son nuevos retos de calculo, no nuevas plantillas
de problemas. El banco mantiene sus 2530 plantillas. Todos los tipos se pueden
mezclar, guardar en sesiones y usar en individual, batalla local, online y maestro.
No cambia el esquema ni las reglas de Firebase.

## Opciones plegadas

En Operaciones, Mas retos: algebra y ESO agrupa cuatro bloques:

- Algebra y ecuaciones: primer grado, valor numerico y segundo grado.
- Notacion cientifica: mantisa, exponente o valor decimal.
- Razones, proporciones y escalas: directa, inversa, dibujo y realidad.
- Divisibilidad y Pitagoras: criterios y lados de triangulos rectangulos.

Cada opcion comienza con una cifra y permite 1, 2 o 3. Se refiere a los datos
iniciales elegidos, no a limitar a esas cifras los resultados o coeficientes
derivados. Por ejemplo, construir una ecuacion con raices de una cifra puede
dar un termino independiente de dos cifras. En Pitagoras se eligen las cifras
del factor que multiplica una terna pitagorica. El buscador, contadores, chips,
Quitar todas y Todo a 1 cifra incluyen los nuevos tipos.

## Algebra

Primer grado ofrece ax+b=c, parentesis y x en ambos lados. Se construyen
ecuaciones con una unica solucion entera; nunca una identidad o contradiccion.
Valor numerico ofrece expresiones lineales, con x al cuadrado y con parentesis.
Se puede escoger valores positivos o positivos/negativos para x. El ajuste es
propio del reto; no exige activar decimales ni el interruptor general de negativos.

## Segundo grado y formula general

Se construye ax^2+bx+c=0 con a distinto de cero. Tres variantes:

- Dos raices enteras distintas.
- Dos raices racionales distintas: se permiten fracciones equivalentes.
- Raiz doble: el discriminante es cero.

Las raices son reales y exactas. No se generan discriminantes negativos ni
raices irracionales que necesiten aproximacion. La opcion de valores positivos
se refiere a las raices: los coeficientes pueden ser negativos en cualquier caso.

Ver solucion muestra a,b,c; la formula x=(-b +/- raiz(b^2-4ac))/(2a);
el discriminante y su raiz; y las dos sustituciones hasta sus fracciones reducidas.
La raiz se dibuja mediante SVG y los exponentes se muestran elevados, tambien
en variables. Se usa BigInt para el discriminante y la comprobacion racional.

Escribe ambas raices separadas por ;, por ejemplo -2;3/2 o 1,5;-2.
El orden no importa. Una raiz doble se escribe dos veces. Introducir solo una
raiz no completa el ejercicio. Teclado tactil: tecla ;. Teclado fisico: ; o S.
Bloque numerico lateral: + separa las raices; / escribe la fraccion y la tecla
decimal escribe coma. F o : siguen siendo alternativas para la barra de fraccion.
Se conserva el limite de entrada de 32 caracteres.

La respuesta correcta suma 20 puntos base; las otras siete opciones nuevas,
10. Las penalizaciones y la puntuacion progresiva mantienen sus reglas anteriores.
Ver solucion sigue siendo una ayuda sin sumar un acierto.

## Otros retos

Notacion cientifica mantiene la mantisa en [1,10), con 1-3 cifras significativas.
El exponente puede ser negativo, cero o positivo, con rango configurable hasta
9 en valor absoluto. Pide el exponente, mantisa o valor decimal segun el tipo.
La respuesta es exacta; usa coma y puede requerir mas decimales que la opcion
general, porque el objetivo es desplazarla, no redondear. No modifica ese ajuste.

Proporcionalidad directa mantiene la razon, e inversa el producto. Se puede
elegir una o mezclarlas. Escalas usa centimetros en dibujo y realidad, en ambos
sentidos: no mezcla unidades sin avisar.

Divisibilidad ofrece los criterios de 2,3,4,5,6,8,9,10 y 11, individualmente o
mezclados. Se responde Si/No con botones, o 1/2 en el teclado. La solucion
explica el criterio y comprueba el resto de la division.

Pitagoras pide hipotenusa o cateto, o mezcla ambos. Los triangulos siempre son
rectangulos no degenerados y la longitud buscada es una raiz positiva exacta.

## Comprobaciones

```text
node tests/calculo-eso.test.cjs
node tests/browser-smoke.cjs --secondary-only
node tests/startup-live.cjs
node tests/live-security.cjs --live
```

Pruebas matematicas con referencias independientes, sustitucion de ambas raices
en el polinomio, discriminante, fracciones equivalentes, todos los criterios y
generacion determinista. Navegador: cinco tamanos, individual/batalla, todas las
variantes, soluciones, teclados, puntos y configuracion compartida. Ademas se
mantienen las pruebas de tarjetas y revancha del panel maestro.

Tras publicar, recarga todos los equipos. Los dispositivos con una version
antigua no conocen estos nuevos tipos. La prueba de navegador no sustituye
una comprobacion tactil en la pizarra fisica.
