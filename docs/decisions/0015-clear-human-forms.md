# ADR 0015 — Formularios centrados en la decisión

Criterios previos:

- Presentar una pregunta principal y controles claros; evitar repetirla junto al campo cuando solo hay una respuesta obligatoria.
- Mostrar progreso solo para varias respuestas necesarias. Los opcionales se abren bajo demanda y no cuentan como pendientes obligatorios.
- Mantener instrucciones extensas, contexto del paso e historial en secciones desplegables. La acción principal y la indicación breve de volver al chat quedan visibles.
- Permitir etiquetas, ayuda breve y ejemplos de entrada por campo mediante metadatos opcionales `form`, sin cambiar valores ni tipos del contrato. Conservar compatibilidad con planes existentes.
- Mensajes de validación junto al campo después de interactuar; no perder respuestas al plegar opciones. No preseleccionar decisiones ni tratar No/0 como vacío.
- Verificar envío tipado, aprobación/rechazo, teclado, axe, 390/540/1440 px y temas claro/oscuro. Inspeccionar el caso real sin responder por el usuario.
