# ADR 0009 — Espacio de trabajo para ventanas divididas

Criterios previos a la implementación:

- Una cabecera y una fila de navegación, con altura conjunta máxima de 108 px. Sin tira de pasos duplicada ni barras superpuestas al nodo enfocado.
- En ventanas de hasta 1100 px, las acciones secundarias se agrupan en «Más opciones». Tarea, seguimiento, zoom y siguiente acción permanecen accesibles.
- Al ampliar la ventana se aprovecha el espacio de escritorio. Foco y vista general comparten los mismos márgenes, tanto al abrir como al redimensionar.
- Sin desplazamiento horizontal del documento a 390, 540, 720 y 1440 px; títulos largos y ventanas bajas conservan el acceso a acciones y decisiones.
- «Abrir en ventana» abre el flujo actual en una ventana web independiente, con respuesta explícita si el navegador bloquea la apertura. Esto no crea un instalador nativo.
- TDD: tests de geometría, redimensionado/foco, menú con teclado, popup independiente y accesibilidad; `npm run check` y Playwright. Inspección visual del caso existente sin responder por el usuario.

Cambian composición y navegación de la interfaz. El motor, las decisiones y el protocolo permanecen iguales.
