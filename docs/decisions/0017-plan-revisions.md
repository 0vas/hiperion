# 0017 — Decisiones compactas y revisión excepcional del plan

## Criterios

- Las ramas booleanas muestran SVG check/cruz con nombre accesible y tooltip; etiquetas específicas siguen legibles. No se confunden con fallos del proceso.
- El coordinador puede revisar tareas futuras con motivo y revisión esperada. Ninguna tarea puede estar ejecutándose. Se conservan los pasos completados, omitidos, iniciados y decisiones humanas ya presentadas, sus contratos, contexto y evidencias.
- Cada cambio archiva el plan anterior y su diferencia. El flujo queda pausado; solo la persona puede reanudarlo. No se editan procesos terminados.
- CLI, HTTP y MCP comparten las reglas del dominio; idempotencia, reinicio y conflictos se prueban.
- El manual ofrece un caso completo mediante mensajes desde el chat, incluyendo cambio de alcance sin comandos.

## Validación

Tests de dominio y persistencia primero; integración MCP; navegador para SVG, revisión y continuación; npm run check y Playwright relevantes.
