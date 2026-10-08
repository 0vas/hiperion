# Hyperion: del chat al flujo

**Tú describes la actividad en el chat. La IA conecta Hyperion, crea el plan y ejecuta sus pasos. Tú sigues el avance y decides en el canvas.**

## Invocarlo desde esta conversación

Escribe, por ejemplo:

> Usa Hyperion para preparar una guía de bienvenida a mi proyecto. Organiza el trabajo por trabajos y pasos. Pregúntame a quién va dirigida y espera mi aprobación antes de darla por terminada.

Eso es todo. En este entorno la conexión ya está preparada: no tienes que instalar nada, abrir una terminal ni escribir comandos. Codex crea un flujo específico y te entrega su enlace.

Si solo dices «Quiero usar Hyperion», el agente te preguntará qué actividad quieres realizar. El plan nace de tu respuesta.

## Qué pasa después

1. **Abre el enlace.** «Petición original» conserva lo que pediste.
2. **Revisa el plan.** «Ver trabajos» resume las fases. Pulsa un trabajo para desplegar los pasos en el canvas. Cada paso conserva su responsable, estado, datos y logs.
3. **Enfoca el trabajo.** Selecciona un paso en «Ir a tarea» y activa «Seguir actividad». La vista acompaña el avance; al arrastrar o cambiar el zoom puedes explorar libremente.
4. **Decide cuando diga «Tu turno».** Abre el paso: verás qué se te pregunta, por qué hace falta y qué sucederá después. Elige los valores y pulsa «Guardar elección», o revisa el resultado y aprueba/rechaza.
5. **Vuelve a este chat y escribe:** «Continúa mi flujo de Hyperion». Codex leerá tu decisión y retomará los pasos habilitados del mismo flujo.

Si tienes varios flujos, pulsa «Continuar en Codex» dentro del que quieres retomar y pega aquí el texto copiado. Ese botón copia la petición; no envía mensajes por ti.

## Un ejemplo completo

**Tú, aquí:** «Usa Hyperion para preparar mi guía de bienvenida».

**Codex:** conecta el canvas, crea los trabajos «Definir la guía», «Redactar» y «Revisar», con sus pasos, y comparte el enlace.

**Hyperion, en tu turno:** «¿La guía es para personas sin experiencia técnica?». Explica que esta elección adapta el vocabulario. Seleccionas Sí o No y guardas.

**Tú, aquí:** «Continúa mi flujo de Hyperion».

**Codex:** lee la elección, redacta la guía, registra el resultado y deja la revisión final para ti. Apruebas solo después de leerla.

Los títulos y decisiones se generan para tu actividad; este ejemplo no es una plantilla obligatoria.

## Controles útiles

| Control                    | Uso                                                          |
| -------------------------- | ------------------------------------------------------------ |
| Ver trabajos / Ver pasos   | Alternar resumen y detalle del mismo proceso                 |
| Ir a tarea / Enfocar tarea | Centrar un paso, incluso si ya terminó                       |
| Seguir actividad           | Acompañar la tarea que requiere atención                     |
| Vista general              | Volver al flujo completo                                     |
| I/O                        | Ver lo que recibe y entrega un paso                          |
| Logs                       | Consultar acciones y resultados que registró el agente       |
| Actividad                  | Revisar el historial del proceso                             |
| Ajustes                    | Elegir tema, reducir movimiento, vista y seguimiento inicial |
| Pausar                     | Evitar que se inicien nuevas tareas hasta reanudar           |

Los ajustes se guardan en este navegador. No alteran tus decisiones ni conceden permisos al agente. Escape cierra un popup sin responder.

## Qué significa el estado

**En espera:** falta un paso previo. **Listo:** la IA puede ejecutarlo. **En curso:** la IA registró que empezó. **Tu turno:** necesita tu decisión. **Completado:** hay un resultado. **Omitido:** esa rama no fue elegida. **Falló:** abre los logs y pide al agente que lo revise.

Inicio y fin marcan los límites. Las compuertas indican todas las ramas (`+`), una sola (`X`) o las que cumplen una condición (`○`). El agente las usa solo cuando aportan sentido al proceso.

## Codex, Cursor y Claude

La misma petición funciona en un harness que tenga Hyperion conectado. Hyperion acepta skills, MCP o su API; el flujo no depende de una marca de IA. Esta conversación de Codex ya dispone de la skill.

En otra herramienta puedes pedir: «Conecta Hyperion y úsalo para [actividad]». Si aún no tiene acceso a Hyperion, necesitará que su integración esté habilitada; reconocer el nombre no instala una aplicación por sí solo. La [guía de conexión para integradores](conexion.md) contiene esa configuración, separada del uso diario.

En esta versión, al guardar una decisión debes volver al chat para continuar. El canvas no despierta conversaciones cerradas ni ejecuta por sí mismo las herramientas de la IA.
