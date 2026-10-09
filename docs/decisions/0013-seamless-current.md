# ADR 0013 — Corriente continua y discreta

Criterios previos:

- Retirar la punta de flecha en conexiones con cintas; conservar dirección explícita en conexiones pendientes y etiquetas accesibles.
- Una sola animación direccional, lenta y sutil, sin pulso superpuesto ni inversión al cerrar el ciclo. La forma y velocidad deben enlazar entre ciclos sin salto perceptible.
- Reducir amplitud y grosor; conservar colores, trazado, orientación y comportamiento de pausa/desconexión/movimiento reducido.
- TDD: navegador mide geometría y dirección de velocidad antes/después del cierre; comprueba ausencia de flechas en cintas y conservación en rutas pendientes. Validación visual y `npm run check` más Playwright.
