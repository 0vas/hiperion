# ADR 0014 — Persistencia de la animación durante el refresco

Evidencia y criterios previos:

- El flujo real remonta las cintas aproximadamente cada segundo: cambian los elementos SVG y su reloj vuelve a cero durante el polling, aunque el proceso no cambia. El cierre geométrico de ADR 0013 no detectaba este problema de ciclo de vida.
- Conservar las medidas de nodos controlados que React Flow comunica, evitando invalidar sus conexiones al reconstruir los datos. Probar polling sin cambios y revisiones con logs, con el mismo elemento y reloj continuo durante más de dos ciclos.
- WebKit instalado para esta investigación no expone/interpola la propiedad CSS `d`. Usar animación SVG nativa portable, manteniendo pausa, desconexión y movimiento reducido. Verificar desplazamiento geométrico real, no solo el nombre CSS de una animación.
- Mantener semántica, colores, ausencia de puntas en cintas y orientación. No responder decisiones humanas durante la inspección del flujo real.
- TDD: caso de regresión con polling y logs, pruebas en Chromium y WebKit, `npm run check` y suite E2E.
