# ADR 0004 — Conexión simple y contrato de proceso

Criterios previos, 2026-10-08:

- `setup codex|claude|cursor` resuelve rutas, registra identidad y configura MCP sin exigir edición de JSON; conserva otros servidores. El adaptador inicia la instancia local bajo demanda. No se promete recargar herramientas en un chat ya abierto.
- Un perfil explícito `bpmn-lite` incluye un inicio, un fin, tareas y pares de compuertas paralelas, exclusivas e inclusivas. Las condiciones consultan salidas tipadas; nunca ejecutan código. Se rechazan ciclos, cruces de ramas y uniones ambiguas.
- Paralela: activa todas las ramas y espera todas. Exclusiva: activa la primera condición verdadera o la ruta por defecto. Inclusiva: activa todas las condiciones verdaderas o la ruta por defecto, y espera solo las ramas seleccionadas. Las ramas no elegidas quedan omitidas y no pueden ejecutarse.
- Las entradas declaran tipo, obligatoriedad y origen (valor literal o salida de un predecesor). Las salidas se validan antes de completar una tarea. Contratos visibles con el mismo formato para agentes y personas.
- Cada caja ofrece iconos de información, datos y trazas. Las trazas distinguen resumen público, acción y observación; no solicitan razonamiento privado del modelo.
- Los planes anteriores siguen funcionando. SQLite, CLI, HTTP y MCP comparten las reglas del dominio. El canvas conserva popups y permisos humanos.

Alcance: perfil acíclico y estructurado basado en BPMN 2.0.2, no motor conforme al estándar completo ni importador/exportador BPMN XML. No incluye bucles, eventos intermedios, compensación ni múltiples tokens por actividad. Cada split tiene un join del mismo tipo; los bloques pueden anidarse y no cruzarse. ArchiMate sigue describiendo la arquitectura; BPMN expresa el proceso.

Referencia normativa: [OMG BPMN 2.0.2](https://www.omg.org/spec/BPMN/2.0.2/PDF), secciones de eventos y compuertas. Los detalles implementados y límites se documentan en el protocolo y el manual.

Validación prevista: primero tests de selección/unión, exclusión de ramas, tipado de datos, trazas, persistencia y configuración aislada. Después navegador real para iconos, símbolos, datos, formularios y trazas; regresión de planes anteriores y revisión visual.

Resultado: criterios cubiertos por 34 pruebas de lógica/integración, una prueba de la distribución compilada y 10 recorridos Playwright; tipos, build y formato correctos. Se verificó visualmente el proceso compuesto y sus popups. El caso personal espera intervención humana. El registro en aplicaciones nativas se valida mediante ejecutores/configuraciones aislados; la carga efectiva en cada producto requiere una sesión con MCP habilitado. Detalle reproducible en [prueba funcional](../functional-test.md).
