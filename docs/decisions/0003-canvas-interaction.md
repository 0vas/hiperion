# ADR 0003 — Un solo canvas e interacción mediante popups

Criterios previos (2026-10-08):

- Un canvas amplio ocupa más del 90% del ancho y el 75% del alto en escritorio 1440×900, sin scroll de página; las dependencias conservan su dirección vertical.
- No hay inspector ni formulario permanente. Cada nodo abre un popup con instrucciones, evidencias, respuesta o aprobación según su estado.
- Petición, actividad, otros flujos y ayuda son botones que abren popups en el mismo espacio.
- Los diálogos reciben el foco, limitan la navegación con Tab, cierran con Escape y devuelven el foco al botón de origen. Una acción humana exitosa vuelve al canvas.
- Los controles conservan permisos, dependencias, revisiones y persistencia. Los errores son visibles dentro del popup activo.
- El caso funcional nace en esta conversación de Codex mediante la CLI, conserva la petición del usuario y registra trabajo real. La respuesta y aprobación personales quedan pendientes hasta que el usuario las realice.

Validación prevista: recorrido Playwright completo, foco de popups, respuesta/aprobación, recarga, canvas landscape, pantalla estrecha y axe; comprobación visual de escritorio y móvil. El motor y las integraciones conservan sus pruebas existentes.

Resultado: criterios verificados con 20 pruebas de lógica/integración y 8 de navegador. Se conservan el motor y las integraciones; cambia la composición de la interfaz. El canvas se ajusta al tamaño disponible y conserva su encuadre al abrir y cerrar popups. Las pantallas y el caso personal iniciado por Codex están documentados en [la prueba funcional](../functional-test.md).
