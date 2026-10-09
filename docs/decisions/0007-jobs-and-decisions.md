# ADR 0007 — Trabajos, decisiones y preferencias

Estado: implementado en 0.4.

Criterios de aceptación: trabajos con pasos ejecutables y progreso derivado; canvas con vistas de trabajos/pasos preservando dependencias; decisiones humanas con pregunta, contexto y consecuencia; campos tipados sin texto redundante; preferencias persistidas de apariencia y navegación; manual sin comandos para el usuario. Regresión: planes anteriores, gates, separación agente/persona e idempotencia.

El plan declara `jobs` y cada paso su `jobId`. El motor sigue ejecutando pasos. La contracción de trabajos debe ser acíclica; una fase que vuelve a aparecer debe dividirse. No son subprocesos BPMN independientes. `interaction` describe una decisión, no la responde. Las preferencias no cambian permisos ni ejecución.

Validación: tests de dominio/proyección y Playwright para jerarquía, decisiones, preferencias, accesibilidad y móvil; `npm run check`.

Patrones consultados: [Apple Design](https://github.com/emilkowalski/skills/tree/main/skills/apple-design) y [Design Engineering](https://github.com/emilkowalski/skills/tree/main/skills/emil-design-eng).

| Antes                               | Después                                | Motivo                                    |
| ----------------------------------- | -------------------------------------- | ----------------------------------------- |
| Respuesta libre más salidas tipadas | Pregunta concreta y campos necesarios  | Evitar duplicar la decisión               |
| Nodos planos                        | Trabajos resumidos y pasos desplegados | Comprender el plan y revisar su ejecución |
| Apariencia fija                     | Preferencias locales accesibles        | Adaptar la vista sin alterar el proceso   |
| Ayuda con instalación               | Invocación desde el chat               | El agente se ocupa de la conexión         |
