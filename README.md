# Dojo Matemático

Web app educativa de cálculo mental (modo individual y VS) con teclado táctil, operaciones configurables, eventos sorpresa y cuadro de puntuaciones local.

## Ejecutar en local

1. Abre la carpeta del proyecto.
2. Lanza un servidor estático (por ejemplo con Live Server en VS Code).
3. Abre `index.html` en el navegador.

No requiere backend.

## Funciones principales

- Modo `👤 Entrenamiento` y `⚔️ Batalla`.
- Operaciones configurables: sumas, restas, multiplicaciones, divisiones, divisiones difíciles, combinadas, fracciones y porcentajes.
- Selector de cifras por tipo de operación.
- Formato de operación horizontal/vertical/mixto.
- Teclado táctil y soporte de teclado físico.
- Temporizador configurable y cuenta atrás visual/sonora.
- Sistema de puntos, rachas y eventos sorpresa.
- `🏆 Cuadro de los Grandes Maestros` con filtros.

## Persistencia (navegador)

La app guarda en `localStorage`:

- Preferencias de juego (modo, operaciones, duración, etc.).
- Resultados del Cuadro de los Grandes Maestros.
- Tema visual.
- Consentimiento de analítica.

## Analítica y cookies

- La integración de Google Analytics se carga **solo si el usuario acepta** en el banner de consentimiento.
- Si el usuario rechaza, no se carga el script de Analytics.

## Responsive

La interfaz incluye breakpoints para móvil, tablet y pantallas pequeñas/landscape, manteniendo:

- Teclado visible.
- Operación y temporizador legibles.
- Distribución equilibrada en modo VS.

## Estructura

- `index.html`: estructura de la app.
- `styles.css`: estilos y responsive.
- `app.js`: lógica de juego, generación de operaciones, puntuación, eventos, persistencia y consentimiento.
- `assets/branding/`: favicon, logo e iconos PWA.
