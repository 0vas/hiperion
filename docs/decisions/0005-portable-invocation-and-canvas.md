# ADR 0005 — Invocación portable y canvas continuo

Criterios previos (2026-10-08):

- Una skill estándar reconoce «usa Hyperion», genera un plan desde la petición, arranca/reutiliza el servicio y devuelve el canvas. No depende de MCP ni de una marca cuando el agente tiene shell local; MCP sigue disponible como transporte alternativo.
- Un paquete instalable incluye CLI compilada, interfaz y skill. Funciona desde un directorio ajeno, sin checkout, compilador ni edición de JSON. Instalar la skill una vez es necesario para que un agente descubra el módulo; no se promete reconocimiento en aplicaciones sin skills o herramientas locales.
- El instalador conserva skills ajenas y credenciales, permite reinstalar su propia skill y rechaza colisiones. No publica paquetes ni registra servicios externos.
- El canvas cubre exactamente el viewport. Identidad, navegación, estado y acciones flotan sobre él, sin marco contenedor ni cabecera que reduzca el espacio del gráfico.
- El layout centra cada split/join sobre sus ramas y mantiene bloques anidados separados, sin depender del orden del JSON. Se conserva dirección vertical, I/O, trazas, foco, aprobaciones y persistencia.
- Identidad visual: mármol cálido, tinta, luz dorada y emblema solar geométrico. Controles legibles, foco visible, movimiento reducido y transparencia reducida. Referencia: Apple HIG, no reproducción de una app nativa.

Validación: pruebas rojas de instalación, arranque desde otra carpeta, orden y separación del layout; Playwright con medidas exactas del canvas, interacción, accesibilidad, escritorio/móvil, movimiento reducido y capturas. Prueba de paquete sin acceso a fuentes. Verificar y documentar los límites de descubrimiento por cliente.

Fuentes: [Agent Skills](https://agentskills.io/specification), [Codex skills](https://learn.chatgpt.com/docs/build-skills), [Claude skills](https://code.claude.com/docs/en/skills), [Cursor skills](https://cursor.com/docs/skills), [Apple layout](https://developer.apple.com/design/human-interface-guidelines/layout), [Apple materials](https://developer.apple.com/design/human-interface-guidelines/materials).

Resultado: 36 pruebas de lógica/integración, 2 de distribución compilada y 10 de navegador aprobadas. Se probó además el paquete instalado en una carpeta aislada sin fuentes ni dependencias de desarrollo. Se revisaron capturas del canvas, móvil y enfoque. El instalador quedó ejecutado en el equipo; el descubrimiento por modelos en nuevas sesiones de cada host queda por verificar. No se publicó ni se subió código.
