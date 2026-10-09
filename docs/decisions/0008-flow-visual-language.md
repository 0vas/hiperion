# ADR 0008 — Estados visibles y rutas del flujo

Criterios previos a implementar:

- Inicio y fin explícitos, con símbolos SVG diferentes y nombres legibles.
- Verde: recorrido/completado; azul: listo o ejecutando; ámbar: intervención humana/pausa; rojo: error; gris: pendiente/omitido. Iconos, etiquetas y patrones acompañan al color.
- Animar únicamente rutas hacia pasos realmente en ejecución. Pausa, cancelación, desconexión y movimiento reducido detienen la animación. Las ramas omitidas no se presentan como recorridas.
- La vista de trabajos obtiene sus rutas de las dependencias reales entre pasos, sin inventar actividad por un estado agregado.
- Cajas compactas con icono SVG, título, responsable/estado y acceso a datos/logs. No truncar títulos ni ocultar acciones al usar teclado/táctil.
- Validación: tests de clasificación de rutas, Playwright con transiciones, movimiento reducido, temas y viewport móvil; inspección de capturas y `npm run check`.

Se modifica la presentación del estado existente. No cambia el motor, los permisos ni la arquitectura de ejecución.
