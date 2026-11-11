# Pizarra y seguimiento por contenido

Bloque 6. Actualizado: 2026-11-11.

## Accesibilidad

El boton con pantalla esta en la cabecera y en la barra de la partida. Abre
un dialogo que se cierra con Cerrar o Escape. Ofrece:

- Modo pizarra: fondos blancos, letras oscuras, bordes definidos, botones
  principales amarillos y foco de teclado azul. Mantiene los dibujos y emojis,
  no invierte imagenes ni cambia las dimensiones de las tarjetas del maestro.
- Reducir movimiento y vibracion: elimina animaciones CSS y transiciones;
  evita la vibracion y el giro/cambio rapido de textos de la ruleta. Los eventos
  se aplican directamente y mantienen los mismos efectos y puntuaciones.
- Pantalla completa: solicita el modo del navegador tras pulsar su boton;
  si no se permite, muestra un aviso. Escape permite salir donde sea compatible.

La preferencia del sistema operativo de movimiento reducido tambien se respeta.
La cuenta atras conserva su duracion y los sonidos siguen dependiendo del
control de sonido. Las opciones empiezan apagadas y se guardan en localStorage
con la clave ninja_math_accessibility_v1. No se comparten con la sala, no
modifican el tema guardado ni los ajustes didacticos. Si falla el almacenamiento,
se avisa y solo se mantienen durante esa visita. No es una certificacion de
accesibilidad ni reemplaza una prueba en cada pizarra fisica.

## Seguimiento

Usa el seguimiento desde el dispositivo del anfitrion que ha observado las rondas.
Se conservan hasta 500 rondas online en el almacenamiento ya existente. No se
requiere otro backend ni cambios de reglas Firebase. Las partidas locales no
se convierten automaticamente en historico del alumnado.

Filtros: periodo, dificultad fija/progresiva, alumno, contenido e indicador.
Los tres ultimos se aplican sobre los registros acumulados del periodo y
dificultad escogidos. Los nombres iguales, ignorando mayusculas y espacios
exteriores, se agrupan; usa nombres distintos para alumnos distintos.

Vistas: resumen por alumno, detalle por contenido y plan de repaso. Para nuevas
rondas se distingue el tipo seleccionado de calculo, y las estructuras de
geometria, espacio, horarios, datos, estadistica e investigacion. Los registros
antiguos genericos siguen siendo genericos. Cuando no hay desglose se muestra
Sin desglose de contenido (historico); no se deduce una operacion de los puntos.

## Interpretacion

Los indicadores son sugerencias para el docente, no notas ni diagnosticos.
Orden de evaluacion:

1. Menos de cinco observaciones: Pocos datos.
2. Con al menos cinco intentos y precision inferior al 65%: Conviene repasar.
3. Al menos la mitad de resultados registrados con ayuda, o al menos tres saltos
   que igualen/superen los aciertos: Con apoyo.
4. Si todavia hay menos de cinco intentos: Pocos datos.
5. Precision desde el 85% y ayuda como maximo del 25%: Practica solida.
6. En los demas casos: Consolidando.

Intentos = aciertos + fallos. Un fallo es un envio incorrecto, no necesariamente
una pregunta distinta. Observaciones = intentos + soluciones + saltos. Resultados
registrados = aciertos + soluciones + saltos. Ayuda = aciertos con pista (como
maximo los aciertos) + soluciones individuales, dividido por esos resultados.
Autonomia = aciertos sin pista dividido por esos resultados. Las pistas son
consultas, no un numero de preguntas distintas. Una explicacion compartida por
el maestro no se contabiliza como solucion individual de cada alumno.

No se comparan capacidades, cursos ni mejoras cronologicas automaticamente:
pueden cambiar las cifras, el formato, las ayudas o la dificultad entre rondas.
Los datos parciales se conservan y se identifican en las rondas de origen.

## Excel y PDF

Ambos respetan los cinco filtros y generan cuatro hojas/secciones:

1. Resumen de practica: solo los contenidos filtrados, sin puntos atribuidos.
2. Por contenido: precision, autonomia, consultas, soluciones, saltos e indicador.
3. Plan de repaso: propuestas no consolidadas, incluidos los casos de pocos datos.
4. Rondas de origen: rondas asociadas a los registros filtrados. Puntos, aciertos
   y fallos se etiquetan como TOTALES DE RONDA, no resultados de un contenido.

El selector de vista solo cambia lo que se ve en pantalla, no elimina hojas del
archivo. PDF abre una vista imprimible: el navegador permite Guardar como PDF.
Los nombres y textos se escapan en HTML/XML; las cadenas del Excel son texto,
no formulas. Exportar no envia los datos a servicios externos. Custodia y borra
los archivos descargados de acuerdo con los criterios de tu centro.

## Comprobaciones

- node tests/insights.test.cjs
- node tests/browser-smoke.cjs --accessibility-only
- node tests/browser-smoke.cjs --learning-only
- node tests/browser-smoke.cjs --dynamics-only
- node tests/startup-live.cjs

La prueba de alto contraste cubre cinco tamanos, tres temas, individual y batalla,
soluciones, filtros y preferencias. La bateria del maestro comprueba 114 vistas
con hasta 60 alumnos (30 en movil), nombres completos, sin scroll de tarjetas,
revancha, desconexiones y podio. Los tests se ejecutan en Chrome sin interfaz;
no sustituyen la comprobacion del tactil y la proyeccion del aula concreta.
