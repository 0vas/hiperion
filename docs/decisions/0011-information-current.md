# ADR 0011 — Corriente de información y colores de símbolos

Criterios previos:

- Conexiones SVG con canal continuo y reflejos que recorren la dirección origen → destino, como una corriente. Circula por rutas recorridas y hasta la tarea habilitada/en ejecución/en espera; no invade ramas pendientes u omitidas.
- La corriente representa información disponible y avance registrado, no garantiza ejecución de un agente. Se detiene al pausar, finalizar, cancelar, desconectar o reducir movimiento.
- Símbolos con semántica visual fija: inicio verde, todas las compuertas amarillas, fin rojo. Etiquetas de estado independientes: un fin rojo puede estar pendiente o completado y no representa un error.
- Conservar forma SVG, dirección horizontal/vertical, lectura de condiciones, flechas, contraste claro/oscuro y preferencia de accesibilidad del sistema.
- TDD sobre clasificación de corriente y pruebas de navegador para colores invariantes, movimiento, rutas excluidas y pausa; clasificación de estados terminales en pruebas unitarias. Verificar el flujo real sin responder decisiones humanas.

Los eventos de mensaje/temporización/enlace de la imagen son referencia visual; no se añaden tipos de ejecución que el motor aún no implementa.
