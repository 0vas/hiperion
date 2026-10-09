# ADR 0002 — Petición original y clientes independientes

Fecha: 2026-10-08. Alcance solicitado: flujo vertical, caso de prueba y manual de interacción desde Codex, Claude, Cursor u otra herramienta.

## Criterios previos

- Cada dependencia termina arriba de su sucesor; las ramas paralelas comparten nivel.
- La petición original se conserva y se puede leer en la interfaz.
- Cada cliente tiene una credencial e identidad propias en la misma instancia local.
- Un cliente no puede ejecutar pasos de un flujo coordinado por otro ni realizar aprobaciones humanas.
- Las credenciales anteriores y las ejecuciones guardadas siguen funcionando.
- La configuración del cliente se puede generar sin exponer secretos ni reemplazar configuración ajena.
- El manual explica configuración inicial, petición en lenguaje natural, intervención en Hyperion, continuación en el agente y límites de la validación.
- Un caso de prueba concreto se genera desde una petición y queda abierto esperando una intervención real.

## Diseño

Se reutilizan el servidor HTTP y el adaptador MCP. Un registro local de credenciales identifica clientes por ID, sin ramas específicas de proveedor en el motor. El campo opcional `request` conserva el origen del plan; es opcional para mantener compatibilidad con planes existentes. El LLM de la herramienta anfitriona transforma la petición en el plan; Hyperion no incorpora un segundo LLM ni genera pasos por heurísticas fijas.

Se mantiene una autoridad por ejecución. Conectar varias herramientas a una instancia no habilita automáticamente el traspaso de un flujo entre ellas. El comando de conexión genera un archivo MCP y registra una identidad local; no sobrescribe archivos de Codex, Claude ni Cursor.

Verificación: tests del registro de credenciales, identidad HTTP/MCP, conservación de petición, layout y navegador. Guías contrastadas con la documentación oficial de cada cliente.
