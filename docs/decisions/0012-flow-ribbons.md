# ADR 0012 — Cintas de información

Criterios previos:

- Sustituir el aspecto de línea con pulso por tres cintas SVG entrelazadas, inspiradas en la referencia del usuario: ondas suaves, volumen por degradado y movimiento direccional.
- Conservar el trazado, las flechas y los colores de estado; limitar las ondas al espacio inmediato de cada conexión. No crear cruces ni ramas lógicas nuevas.
- Animar solo las rutas alcanzadas. Pausa, desconexión, finalización y movimiento reducido mantienen una imagen estática. Las rutas pendientes/omitidas conservan su aspecto discontinuo.
- Geometría válida en horizontal, vertical y codos, incluidos segmentos cortos; ningún bucle de renderizado por frame en React.
- Validar con pruebas de navegador (deformación real y detención), check completo y capturas de ambas orientaciones/temas en split y escritorio web.
