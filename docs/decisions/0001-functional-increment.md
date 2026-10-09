# ADR 0001 — Primer incremento funcional

Estado: decidido para el MVP por delegación del usuario. Fecha: 2026-10-07.

## Criterios antes de implementación

- Registrar desde Codex un plan real y abrir su workflow en el navegador.
- Aplicar dependencias y permitir dos pasos independientes activos a la vez.
- Reservar las aprobaciones y entradas manuales para operaciones humanas.
- Rechazar ciclos, IDs duplicados, transiciones inválidas y ejecutores sin autoridad.
- Conservar estado e historial tras reiniciar; deduplicar comandos reintentados.
- Visualizar progreso, responsable, evidencias, errores y acciones del usuario.
- Proveer CLI HTTP para esta conversación y MCP stdio para clientes compatibles.
- Verificar motor, persistencia, HTTP, MCP y flujo completo en un navegador real.

## Decisiones y alcance

Aplicación web local, TypeScript, React y React Flow para el grafo. Motor puro separado de transporte e interfaz. SQLite con transacciones para snapshots y registro de comandos/eventos. API HTTP local compartida por CLI, MCP e interfaz. Node >=22.13; CI en 22 y 24. Se usa el módulo incorporado `node:sqlite`, cuya estabilidad depende de la versión de Node; no hay compilación nativa de dependencias.

Primera modalidad: coordinación cooperativa con un agente externo de confianza. Hyperion autoriza pasos; el agente ejecuta sus herramientas y reporta evidencias. No lanza comandos arbitrarios recibidos por HTTP ni contiene un LLM. Codex sigue siendo el agente de esta conversación. La orquestación autónoma multiagente queda como extensión, no se simula.

Planes inmutables en v0.1: un cambio de alcance requiere una nueva ejecución, conservando la anterior. Pasos agent, manual y approval. Pausar impide nuevos inicios; un trabajo en curso puede terminar y registrar su resultado. Cancelar es terminal en Hyperion, pero no deshace efectos externos ni mata procesos ajenos.

Credencial de agente separada de sesión humana, validación de Host/Origin y escucha únicamente en loopback. Modelo local de un usuario de confianza: un agente con control total del mismo equipo puede acceder a sus datos y navegador; no es una frontera de aislamiento frente al propietario del sistema. Sin publicación en Internet ni soporte multiusuario en este incremento.

## Challenges a resolver con pruebas

1. ¿Puede el agente aprobarse solo? API rechaza operaciones humanas con credencial de agente.
2. ¿Puede una pestaña antigua sobrescribir decisiones? Comandos humanos requieren revisión vigente.
3. ¿Un retry repite trabajo o eventos? Idempotency key vinculada a payload y actor.
4. ¿Una desconexión pierde resultados? Transacción y reconstrucción desde SQLite.
5. ¿La UI aparenta autonomía que no existe? Muestra cuándo Codex debe retomar; no inventa avances.
6. ¿El plan acepta ciclos? Validación de DAG antes de persistir.

Validación prevista: `npm test`, `npm run typecheck`, `npm run build`, `npm run test:e2e`, revisión visual y prueba manual desde esta conversación. Tests se escriben y ejecutan en rojo antes del motor y sus adaptadores.
