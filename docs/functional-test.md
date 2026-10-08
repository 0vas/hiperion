# Prueba funcional con Codex

## Preparación

Desde la raíz del repositorio:

```sh
npm ci
npm run build
npm start
```

En otra terminal, o desde las herramientas de esta conversación:

```sh
npm run hyperion -- create examples/codex-trial.json
```

El resultado incluye `id` y `url`. Abre esa URL. La instancia local usa `http://127.0.0.1:4317`.

## Participación de la persona

1. Selecciona **Definir tu objetivo**.
2. Escribe una actividad pequeña relacionada con el proyecto y pulsa **Enviar respuesta**.
3. Vuelve al chat de Codex y escribe: «Continúa el flujo de Hyperion RUN_ID». El botón **Continuar en Codex** copia esa petición; no inicia una conversación por su cuenta.
4. Observa cómo Codex registra su revisión y su propuesta. Abre cada nodo para leer resultados e historial.
5. En **Validar la propuesta**, aprueba o rechaza con una explicación.
6. Si apruebas, pide a Codex continuar para realizar la entrega final.

## Trabajo que debe realizar Codex

Lee el estado y la respuesta del usuario mediante la CLI o MCP. Registra el inicio antes de realizar una acción; adjunta resultados reales al completarla. Los dos pasos intermedios admiten concurrencia porque ambos dependen del objetivo. No inventes trabajo paralelo si los ejecutas secuencialmente.

En la aprobación, detente y devuelve la referencia del flujo al usuario. No uses el navegador, credenciales humanas o llamadas directas para aprobar por él. La aprobación autoriza solo el alcance descrito en la propuesta.

## Evidencia de validación

- La suite del motor/API/SQLite/MCP comprueba estados, dependencias, roles, revisiones, ciclos, idempotencia, persistencia, límites de entrada y espera acotada.
- Playwright crea un flujo con una credencial de agente de prueba y realiza la interacción humana **en una instancia de pruebas separada**. Verifica respuesta, aprobación, recarga, continuación y finalización.
- La misma suite comprueba la vista estrecha, el contraste WCAG AA mediante axe y el manejo del foco en la ayuda.
- La ejecución personal creada desde esta conversación es distinta de las pruebas automatizadas. Permanece esperando una respuesta real del usuario hasta que este la envíe.

La integración utilizada en esta conversación es la CLI HTTP. MCP se valida con un cliente del SDK mediante stdio; su configuración en una nueva sesión de Codex es opcional y se explica en [integration.md](integration.md).

## Resultado de la verificación del primer incremento

- `npm test`: 15 pruebas aprobadas.
- Suite del motor, HTTP, SQLite y MCP ejecutada además con Node 22 y Node 24: 15 aprobadas en cada versión.
- `npm run test:e2e`: 5 pruebas aprobadas en Chromium. Incluye un recorrido completo con respuesta humana, aprobación, recarga y finalización; viewport estrecho; axe WCAG AA; foco del diálogo; y rechazo visual de un enlace a una ejecución inexistente.
- `npm run typecheck`, `npm run build` y `npm run format:check`: correctos.
- `npm audit --audit-level=high`: 0 vulnerabilidades reportadas en el momento de la comprobación.
- Inspección visual de capturas de escritorio y móvil, revisión de enlaces locales y XML/SVG de arquitectura.
- CI configurado en GitHub Actions; no se ha enviado la rama al remoto ni ejecutado CI remoto.

Los ciclos TDD detectaron fallos antes de sus correcciones: módulos aún inexistentes, nodos que no recibían clics, contraste insuficiente, espera con argumentos inválidos y selección incorrecta ante enlaces inexistentes. La validación automática de accesibilidad cubre las pantallas probadas; no es una auditoría exhaustiva del producto.

## Incremento: petición original y múltiples clientes (2026-10-08)

El [manual de uso](manual-uso.md) añade un caso completo generado desde una petición, con elección manual, dos revisiones independientes y aprobación previa a la entrega. El ejemplo reproducible es `examples/first-contribution.plan.json`. La instancia creada desde Codex queda esperando la elección humana; no se ha simulado esa respuesta.

- `npm run check`: correcto; 20 pruebas de lógica, persistencia, HTTP, credenciales y MCP aprobadas, además de tipos, build y formato.
- `npm run test:e2e`: 6 pruebas aprobadas. La nueva prueba compara posiciones de nodos para verificar dependencias verticales y ramas en el mismo nivel; también comprueba la petición original visible.
- El mismo contrato MCP se ejecuta con identidades Codex, Claude y Cursor usando el cliente del SDK. La API comprueba además un cliente genérico, separación de autoridad y registro de credenciales con el servidor en marcha. No se afirma haber ejecutado Claude o Cursor nativos.
- La generación de configuración comprueba rutas absolutas y ausencia de secretos. Las credenciales existentes se conservan.
- La instancia local actualizada muestra los cinco nodos del nuevo caso y la petición original, sin errores JavaScript en la comprobación de navegador.

El ciclo TDD observó primero el fallo por la operación de registro aún inexistente, después implementó el registro y sus adaptadores, y terminó verificando API, MCP e interfaz.

## Incremento: canvas y popups (2026-10-08)

El caso personal se generó desde la petición recibida en Codex y se registró mediante CLI. Codex inició el paso de implementación antes de realizar los cambios y registra sus verificaciones como evidencia; el usuario responde y aprueba en los nodos del mismo workflow. El archivo de esa petición y el estado personal permanecen en `.hyperion/`, fuera de Git.

Criterios y decisiones: [ADR 0003](decisions/0003-canvas-interaction.md). Recorrido del usuario: [manual](manual-uso.md).

- Canvas landscape de una pantalla, con dependencias verticales y sin inspector fijo.
- Nodos y botones abren popups para información, respuesta, aprobación, rechazo, actividad y selección de flujos.
- 20 pruebas de lógica/integración y 8 pruebas de navegador aprobadas. Tipos, build y formato correctos.
- Las pruebas de navegador comprueban dimensiones del canvas, foco inicial y su restauración, Escape, Tab, respuesta/aprobación, rechazo, errores dentro del popup, persistencia, reajuste al cambiar a viewport estrecho y axe WCAG AA tanto en el canvas como en la intervención humana.
- Se corrigieron los fallos detectados por las pruebas: canvas aún inexistente, foco perdido tras re-medición del nodo y falta de ajuste del viewport al redimensionar.
- Inspección visual de escritorio, móvil y popup. La captura del README usa únicamente datos sintéticos del navegador de pruebas.

La prueba humana personal queda pendiente; no se simula su respuesta ni aprobación. La continuación desde Codex sigue siendo cooperativa mediante lectura del estado al retomar el chat.

## Incremento: conexión simple, compuertas e I/O (2026-10-08)

Criterios: [ADR 0004](decisions/0004-process-contract.md). Contrato: [perfil de procesos](process-contract.md). El ejemplo reproducible [process-gateways.json](../examples/process-gateways.json) tiene inicio, elección humana, un bloque paralelo que contiene bloques exclusivo e inclusivo, sus uniones, aprobación y fin.

Para probarlo desde Codex, solicita:

> Usa Hyperion para revisar este repositorio. Pídeme si quiero revisar documentación y código. Separa ambas fases en paralelo, usa una decisión exclusiva para documentación y una inclusiva para las verificaciones. Declara entradas y salidas, registra acciones y observaciones públicas y pide mi aprobación final.

1. Codex genera y registra el plan desde la petición y devuelve su URL.
2. En **Definir el alcance**, escribe tu respuesta y selecciona Sí/No para `docs` y `code`. Envía la respuesta.
3. Observa las compuertas resueltas y las ramas omitidas. Pide en el chat «Continúa el flujo de Hyperion RUN_ID».
4. Codex consulta el estado, ejecuta únicamente las tareas habilitadas y envía resultados tipados. Los iconos **I/O** y **Logs** muestran datos y trazas de cada nodo.
5. Revisa los reportes y aprueba o rechaza desde el mismo canvas. El motor activa el fin tras aprobar.

Evidencia de este incremento:

- `npm run check`: correcto; **34 pruebas de lógica/integración**, **1 prueba de distribución compilada**, tipos, build y formato.
- `npm run test:e2e`: **10 pruebas de navegador** aprobadas. Incluyen las tres compuertas, contratos, formularios booleanos, ramas omitidas, trazas y aprobación; axe WCAG AA también cubre el formulario nuevo.
- El ciclo TDD comprobó fallos por contratos y configuración aún inexistentes y por el comando CLI de datos sin implementar; todos quedaron corregidos.
- Se prueban combinaciones de condiciones, fallback, bloques anidados, pausa, rechazo de planes ambiguos, datos inválidos, persistencia, idempotencia y secuencia causal de eventos.
- El arranque bajo demanda se comprueba con un proceso real y credenciales aisladas. La distribución compilada sirve HTML/assets y genera rutas MCP existentes.
- El registro de Codex/Claude se prueba con ejecutores aislados, y Cursor con un directorio temporal que conserva otras entradas. MCP se prueba con el SDK y las tres identidades; no se afirma haber conectado las interfaces nativas de los tres productos.
- Se reinició la instancia local conservando SQLite, se creó el caso desde Codex mediante CLI y se verificaron sus 15 nodos, 6 símbolos de compuerta y formulario humano, sin errores JavaScript. El inicio está completado y el alcance espera la respuesta real del usuario. Los planes anteriores siguen siendo legibles.

El perfil es estructurado y acíclico; no implementa BPMN completo ni subprocesos independientes por fase. Las trazas contienen información pública enviada expresamente por el agente. La continuación de un chat sigue siendo cooperativa.

## Incremento: skill portable y canvas continuo (2026-10-08)

Criterios: [ADR 0005](decisions/0005-portable-invocation-and-canvas.md).

- `npm run check`: 36 pruebas de lógica/integración y 2 de distribución compilada aprobadas; tipos, build y formato correctos.
- `npm run test:e2e`: 10 recorridos aprobados, con medidas exactas del canvas (origen 0,0 y dimensiones del viewport), foco de popups, decisiones humanas, accesibilidad axe WCAG AA y enfoque de la tarea actual con movimiento reducido. Capturas revisadas en escritorio y móvil.
- TDD observó módulos ausentes para instalación y layout, el margen de 16 px del canvas anterior y el control de enfoque aún inexistente; después se implementaron y pasaron esas verificaciones.
- Se generó el archivo npm, se instaló en una carpeta temporal con `--omit=dev --ignore-scripts` y se ejecutaron las dos pruebas de distribución contra ese paquete instalado. No había carpeta `src` ni dependencias de desarrollo.
- Una skill instalada en otra carpeta arranca/reutiliza el servicio, crea un flujo desde una petición con la identidad genérica `independent-tool` y envía una salida tipada hasta completar el recorrido. Se sirve HTML y JavaScript desde el paquete.
- El instalador conserva skills ajenas, permite reinstalar sus archivos sin cambios y rechaza modificaciones manuales. El validador de skills comprobó el frontmatter. Los contratos y ejemplos enlazados se incluyen en la instalación.
- En el equipo de desarrollo, se instaló la skill y se ejecutó desde `/tmp`, iniciando la instancia real actualizada con los datos existentes. Se verificó el caso anterior de 15 nodos en el canvas a pantalla completa, sin errores JavaScript; su intervención humana sigue pendiente.
- El modelo ArchiMate XML/SVG se actualizó a 0.3, manteniendo cinco componentes y ocho relaciones verificadas. La importación en un editor ArchiMate sigue sin comprobarse.

No se ha publicado el paquete ni enviado la rama. La elección automática de la skill en nuevas conversaciones nativas de Codex, Claude o Cursor requiere recargar esos clientes y sigue pendiente de una prueba humana. La ejecución aislada del script demuestra el contrato y el arranque, no garantiza el comportamiento de todos los hosts.

## Incremento: enfoque y seguimiento de tareas (2026-10-08)

Criterios: [ADR 0006](decisions/0006-task-focus.md). Guías: [uso diario](manual-uso.md) e [instalación](conexion.md).

- `npm run check`: 37 pruebas de lógica/integración, 2 de distribución, tipos, build y formato correctos.
- `npm run test:e2e`: 12 recorridos aprobados. El seguimiento cambia de tarea ante una transición real y conserva el foco entre tareas paralelas de igual prioridad. Los logs no cambian la cámara.
- Abrir un popup suspende el movimiento; navegar manualmente desactiva el seguimiento. La pausa conserva el modo, incluso si el agente completa un trabajo iniciado, y la reanudación centra la siguiente tarea.
- Se verificaron selector, foco desde popup, acceso a datos/logs, vista general, guía integrada, movimiento reducido, viewport móvil y axe WCAG AA. El ciclo TDD detectó controles ausentes y una etiqueta oculta en móvil; ambos casos quedaron corregidos.
- Capturas inspeccionadas en escritorio y móvil. El canvas y sus acciones humanas conservan el mismo flujo. La continuación del agente sigue siendo cooperativa; «Seguir actividad» controla únicamente la vista.

## Incremento 0.4 — trabajos, decisiones y ajustes

Criterios definidos en ADR 0007. Test rojo inicial: el contrato rechazaba `jobs`/`interaction` y no existía la proyección de trabajos. Después, la prueba de navegador detectó la falta de ajustes y problemas de contraste en el modo oscuro. Se corrigieron antes de validar.

- Dominio: trabajos con referencias válidas, sin duplicados, vacíos ni reentrada; estados/progreso derivados; dependencias al contraer; envío humano tipado sin texto redundante; rechazo de suplantación del usuario.
- UI: vista de trabajos/pasos, foco, pregunta con contexto y consecuencia, elección Sí/No, confirmación tras guardar, tema persistente, movimiento reducido y seguimiento inicial. Se mantienen los escenarios anteriores de compuertas y cooperación.
- Verificación automatizada: 40 tests de dominio/adaptadores/persistencia; 2 de distribución compilada; 13 Playwright, con comprobaciones axe WCAG AA y pantallas de escritorio/móvil. Typecheck, build y formato.
- Verificación local desde Codex: skill instalada invocada fuera del checkout, servicio 0.4, creación de un flujo con tres trabajos desde la petición real; inspección visual de temas, datos y navegación. Las evidencias reales permanecen en `.hyperion/`, fuera de Git. No se completó ni aprobó ninguna intervención humana real.
- La skill portable se validó y actualizó. La arquitectura ArchiMate conserva cinco componentes y ocho relaciones. La interacción real en Cursor/Claude no se abrió en esta prueba; sus adaptadores MCP se comprueban mediante tests de protocolo, no mediante una sesión de esos productos.

Capturas automatizadas: `test-results/jobs-dark.png`, `decision-dark.png`, `settings-mobile.png`. La revisión humana del caso real queda pendiente en su canvas. Guardar una elección aún requiere volver al chat para continuar.
