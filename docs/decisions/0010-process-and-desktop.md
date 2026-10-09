# ADR 0010 — Proceso visible y cliente de escritorio

Criterios previos:

- Orientación vertical/horizontal persistente, con compuertas, trabajos, handles y cámara coherentes; no cambia dependencias ni decisiones.
- Símbolos de inicio, fin y compuertas paralela (+), exclusiva (X) e inclusiva (O) dibujados en SVG. La leyenda explica dividir/unir. Se muestran las compuertas presentes en el plan, sin inventar ramas.
- Animación direccional durante ejecución; pulso ámbar distinto al esperar al usuario. Pendientes/omitidas quietas. Pausa, desconexión y movimiento reducido detienen animaciones.
- Reintento visible en pasos fallidos, conserva historia y habilita al mismo agente; no ejecuta por sí solo ni reabre decisiones completadas.
- Decisiones como lista con progreso, preguntas concretas, Sí/No explícito y campos adecuados. Ningún valor falso se deduce de una casilla sin marcar. Mantener validación de tipos, errores, teclado y contraste.
- Desktop Electron comparte el mismo servicio local y run con split. El usuario elige desde el chat; adaptador abre el cliente instalado. Sin acceso Node en el renderizador; navegación limitada al servicio autenticado local.
- Compilación reproducible DMG macOS y NSIS EXE Windows. Artefactos en releases, no binarios en Git. Verificar DMG y app en este Mac; no afirmar validación Windows sin ejecutarla.
- TDD de geometría, decisiones, animación, retry y conexión local. `npm run check`, Playwright y smoke de Electron. Mantener trazabilidad en el repositorio.

La edición sigue siendo BPMN-lite estructurado (tres compuertas, sin bucles ni eventos complejos), no un motor BPMN 2.0 completo. El cliente no despierta conversaciones: el agente retoma ante un mensaje del usuario.
