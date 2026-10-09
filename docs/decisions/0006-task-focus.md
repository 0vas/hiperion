# ADR 0006 — Enfoque y seguimiento

Criterios previos, 2026-10-08:

- Enfocar cualquier tarea desde un selector o su popup. Abrir sus detalles, datos y logs sin buscarla en el gráfico.
- Activar «Seguir actividad» para centrar la siguiente tarea que requiere atención. Prioridad: fallo, intervención humana, ejecución y tarea lista. Conservar el foco entre ramas de igual prioridad; los logs y el polling no mueven la cámara.
- La navegación manual, el zoom y «Vista general» desactivan el seguimiento. No mover el canvas mientras hay un popup, desconexión o pausa. Al finalizar, conservar el último foco.
- «Seguir actividad» solo controla la vista; el harness continúa siendo el ejecutor. Las decisiones humanas siguen en el canvas y la continuación del chat es cooperativa.
- Manual corto: pedir desde el harness, abrir el canvas, enfocar/seguir, responder, revisar y volver al chat. Guía accesible desde la aplicación; instalación como referencia separada.
- Verificar TDD con casos de transición real, ramas paralelas, interacción manual y accesibilidad; comprobar escritorio, móvil y movimiento reducido.

Resultado: 37 pruebas de lógica/integración, 2 de distribución y 12 recorridos Playwright aprobados. La prueba nueva verifica el avance del foco, estabilidad ante logs, suspensión durante un popup, navegación manual, redimensionado móvil y accesibilidad. Otra comprueba completar trabajo durante una pausa y retomar el seguimiento al reanudar. Se corrigió la etiqueta inaccesible del selector móvil. El manual separa uso diario y conexión.
