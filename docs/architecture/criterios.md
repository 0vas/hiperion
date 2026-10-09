# Criterios de la primera propuesta de arquitectura

Definidos antes de elaborar la propuesta. Fecha: 2026-10-07, America/Lima.

- Hyperion es independiente de Olimpo, de un proveedor de IA y de una interfaz de conversación.
- Se distinguen requisitos confirmados, propuestas y decisiones pendientes; no se elige un stack ni se implementa el producto.
- La propuesta explica la integración desde herramientas externas, la supervisión humana, el paralelismo y la orquestación multiagente opcional.
- Cada ejecución tiene una autoridad de coordinación explícita. Se distingue observar una acción de poder bloquearla.
- Los diagramas declaran su versión y tipos ArchiMate, identifican elementos y nombran las relaciones; las flechas no simulan acceso al razonamiento privado de un modelo.
- Quedan registrados escenarios de aceptación que precederán a los tests automatizados cuando se apruebe la implementación.
- Validación: revisión de cobertura contra esta lista, análisis XML del SVG, comprobación de referencias locales, inspección visual del diagrama y `git diff --check`.

Esta revisión documental no equivale a pruebas ejecutables del futuro producto ni a validación del modelo con una herramienta ArchiMate.
