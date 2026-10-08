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

## Lenguaje visual del flujo (ADR 0008)

- Criterios definidos antes de implementar; tests iniciales fallaron por ausencia de la clasificación visual de rutas.
- Rutas clasificadas desde dependencias reales: pendientes, listas, activas, completadas, intervención humana, error, pausa, detención y omisión. La vista de trabajos inspecciona las aristas entre pasos de los grupos, no supone actividad a partir del estado agregado.
- Iconos SVG por ejecutor, etiquetas explícitas INICIO/FIN, cajas compactas, leyenda accesible y colores adaptados a ambos temas. La tarea corta de la prueba mide menos de 165 px a escala real; los títulos largos pueden crecer.
- Comprobación: 42 tests de dominio/adaptadores/presentación, 2 de producción y 14 Playwright. El escenario visual verifica flechas activas, pausa/reanudación, fallo/reintento, desconexión/reconexión, preferencias de movimiento, intervención humana, teclado, contraste y vista móvil.
- Inspección del flujo real existente sin enviar decisiones humanas. Las capturas locales permanecen en `.hyperion/`; las capturas sintéticas se generan en `test-results/flow-colors-*.png`.

## Ventanas divididas y espacio de trabajo (ADR 0009)

- TDD: el primer escenario de 540 px detectó una navegación que terminaba a 239 px, frente al máximo previsto de 108 px. La implementación separa dos filas compactas, elimina la tira duplicada y agrupa acciones secundarias hasta 1100 px.
- El escenario nuevo verifica 390, 540, 720 y 1440 px, títulos largos, foco libre de barras, ausencia de desbordamiento horizontal, navegación por teclado, devolución de foco al cerrar paneles, accesibilidad axe y apertura del mismo flujo en una ventana web independiente.
- Se corrigió el retorno de foco al cambiar de panel, la capa que interceptaba el selector y el contraste del botón de enfoque al pasar el cursor en tema oscuro. La prueba anterior de orientación conserva sus comprobaciones geométricas sin depender del rótulo retirado «Flujo vertical».
- `npm run check`: 42 pruebas de lógica/integración, 2 de distribución, tipos, build y formato correctos. `npm run test:e2e`: 15 recorridos aprobados.
- Se inspeccionó el flujo real en ventanas de 540 y 1440 px, en tema oscuro y sin errores JavaScript. No se enviaron decisiones humanas. Las capturas locales permanecen en `.hyperion/workspace-*.png`; las sintéticas, en `test-results/workspace-*.png`.

«Abrir en ventana» depende de la apertura de ventanas del navegador. No se ha creado ni probado un instalador nativo; la interfaz se adapta a una ventana web independiente.

## Proceso SVG, decisiones y desktop (ADR 0010)

- TDD observó fallos iniciales por orientación horizontal ausente, símbolos SVG inexistentes, reintento no visible y herramienta MCP de presentación ausente. Se corrigieron antes de validar.
- Inicio/fin usan círculos SVG de borde fino/grueso; las compuertas usan rombos con +, X y O. Orientación persistente en pasos y trabajos, con handles laterales y cámara ajustada. Las compuertas conservan la lógica ejecutable del motor.
- Animación direccional azul para ejecución y pulso ámbar para espera humana. Pausa, desconexión y movimiento reducido preservan la lectura estática. Se verificó `route-wait` en el flujo real abierto, sin enviar decisiones.
- Lista de decisiones con progreso, Sí/No explícito y datos tipados. Axe detectó una etiqueta ARIA sin rol; se corrigió. Se eliminó la descripción duplicada del formulario y se inspeccionaron vistas claras/oscuras y split. Reintentar desde la caja deja el paso listo, conserva el intento anterior y su error y no ejecuta herramientas.
- `npm run check`: 44 pruebas de lógica/adaptadores, 2 de distribución, tipos, build y formato. Playwright: 17 recorridos aprobados; se repitieron los escenarios afectados por los ajustes visuales finales. Total: 65 pruebas contando las 2 de desktop empaquetado.
- Desktop en macOS Apple Silicon: proceso Electron real, renderizador sin Node, decisión booleana falsa desde otro navegador, progreso publicado por el agente y actualización en ambas ventanas. La CLI abre de nuevo el mismo run mediante la instalación registrada. Arranque con el ejecutable empaquetado, sin Node externo; instalación de la skill con `nodeEnv` de Electron. El primer test de instalación detectó ejemplos faltantes en el paquete; se incluyeron y el escenario pasó.
- Compilados DMG arm64/x64 y NSIS EXE x64. Aplicación arm64 probada; ejecución Windows e Intel pendiente. Artefactos sin firma/notarización de release, en `release/` ignorado. El workflow manual compila y valida en cada plataforma y conserva artefactos, sin publicar automáticamente; su ejecución remota aún no se ha realizado.
- Skill actualizada, frontmatter validado con js-yaml (el validador Python no tenía PyYAML disponible). XML/SVG ArchiMate analizados: cinco componentes y ocho relaciones válidas; importación en editor ArchiMate pendiente. La vista lógica representa el canvas alojado en navegador o Electron.

El usuario elige split o desktop en su chat. `hyperion_open` (MCP) y `open RUN_ID split|desktop` (CLI) conservan el run; abrir una presentación no cambia decisiones. El perfil sigue siendo BPMN-lite estructurado, sin bucles ni eventos temporizados. No se afirma compatibilidad BPMN 2.0 completa ni despertar automático de conversaciones.

## Corriente de información y símbolos (ADR 0011)

- TDD: el test inicial falló por ausencia de `carriesCurrent`. La prueba de navegador detectó además que el estilo de React Flow imponía `dashdraw`; se reemplazó por un canal SVG continuo y un reflejo direccional con patrón y movimiento comprobados.
- La corriente recorre conexiones completadas y llega hasta tareas listas, en curso o esperando respuesta. No recorre rutas pendientes, omitidas o con error. Finalización, cancelación, pausa, desconexión y movimiento reducido la detienen. Representa información disponible, no garantiza que un agente esté ejecutándose.
- Inicio verde, compuertas amarillas y fin rojo conservan su color por tipo, independientemente del estado. Verificados los tres tipos de compuerta, ambos temas y orientación horizontal/vertical. Se mantiene la etiqueta de estado; fin rojo no significa error.
- `npm run check`: 45 pruebas de lógica/adaptadores/presentación, 2 de distribución, tipos, build y formato correctos. `npm run test:e2e`: 18 recorridos aprobados, incluidos movimiento real, estilos SVG, pausa, preferencias, accesibilidad y split.
- Inspección visual del flujo real en una ventana de 720 px, sin enviar decisiones humanas: tres conexiones alcanzadas con `information-current` y ramas pendientes estáticas. Captura local ignorada en `.hyperion/information-current-split.png`. Inspección adicional del proceso sintético horizontal con los tres tipos de compuerta.
- El canvas compilado queda actualizado para navegador y desktop conectado al servicio local. En este incremento no se regeneraron los instaladores independientes de ADR 0010.

## Cintas ondulantes (ADR 0012)

- Referencia visual del usuario traducida a tres cintas SVG entrelazadas por conexión alcanzada, con degradado y deformación direccional. La geometría sigue el trazado real y se estrecha al llegar a los nodos; no modifica dependencias ni decisiones.
- TDD: el escenario falló inicialmente al encontrar cero cintas donde esperaba tres. Tras implementar, comprueba cambio real de geometría CSS, ausencia en rutas pendientes y detención al pausar o reducir movimiento.
- `npm run check` aprobado: 45 pruebas unitarias/integración, 2 de producción, tipos, compilación y formato. `npm run test:e2e`: 18 recorridos aprobados, incluidos contraste, split, orientación y movimiento. Total: 65 pruebas.
- Inspección del flujo real sin enviar decisiones: vertical claro a 720 px y horizontal oscuro a 720/1440 px, sin errores JavaScript. Capturas locales ignoradas: `.hyperion/ribbons-split-light.png`, `.hyperion/ribbons-horizontal-dark.png`, `.hyperion/ribbons-desktop-dark.png`.
- La animación usa CSS sobre geometrías SVG calculadas al cambiar el recorrido, sin actualizaciones React por frame. La prueba se realizó en Chromium; en este incremento no se regeneraron ni probaron los instaladores nativos.

## Continuidad del ciclo (ADR 0013)

- TDD: el escenario falló inicialmente porque las conexiones con cintas aún tenían `marker-end`. Se eliminó ese marcador en rutas alcanzadas, conservándolo en las pendientes.
- Se retiró el pulso superpuesto. La única onda usa 32 fases periódicas en 6,4 s, con amplitud y grosor menores; el cierre reutiliza exactamente la forma inicial. No añade trabajo React por frame.
- El navegador mide la forma en el cierre y la dirección de velocidad a ambos lados: diferencia de cierre menor de 0,001 y similitud direccional mayor de 0,96. También verifica movimiento real, ausencia del pulso, pausa, movimiento reducido y conservación de flechas pendientes.
- `npm run check`: 45 pruebas de lógica/integración y 2 de producción, tipos, build y formato aprobados. `npm run test:e2e`: 18 recorridos aprobados.
- Inspección del flujo real vertical claro y horizontal oscuro, sin modificar decisiones humanas: cero errores JavaScript, ciclos de 6,4 s y cero flechas en conexiones alcanzadas. Capturas locales ignoradas en `.hyperion/seamless-current-light.png` y `.hyperion/seamless-current-dark.png`. Validado en Chromium; no se regeneraron instaladores nativos.

## Corrección del reinicio durante polling (ADR 0014)

- El problema seguía presente tras ADR 0013: las pruebas anteriores comprobaban la unión geométrica del ciclo, pero no la vida de la conexión durante el refresco. La inspección real detectó reemplazo del SVG y reloj reiniciado aproximadamente cada segundo.
- Causa: los nodos controlados se reconstruían sin las medidas calculadas por React Flow. Eso invalidaba sus handles y desmontaba las aristas. Ahora se conservan las medidas recibidas por `onNodesChange`, separadas por flujo, vista y orientación; no se ocultan actualizaciones del proceso.
- TDD: la nueva prueba falló al detectar desconectado el elemento SVG después del polling. Tras la corrección, el mismo elemento y animación sobreviven a 14 refrescos, incluidos logs que cambian la revisión real del proceso.
- WebKit no interpolaba la propiedad CSS `d` como Chromium. Se sustituyó por `<animate attributeName="d">` SVG nativo, con valores periódicos y cierre idéntico. Se mantiene el movimiento reducido del sistema mediante suscripción a `matchMedia`; pausa, desconexión y preferencias quitan la animación.
- Verificación: `npm run check` (45 pruebas de lógica/integración y 2 de producción), `npm run test:e2e` (19 recorridos Chromium) y `npm run test:e2e -- --config playwright.webkit.config.ts` (2 recorridos WebKit). Tipos, build y formato correctos. Se verifican geometría real, continuidad, actualización de estado, orientación, foco, contraste y controles.
- Inspección de más de dos ciclos completos en el flujo real: elemento conectado y comienzo de animación inalterado, reloj final superior a 13,5 s en ambos motores. El desplazamiento máximo observado entre muestras de 100 ms fue inferior a 0,24 unidades SVG. No se enviaron decisiones humanas. Capturas locales ignoradas: `.hyperion/persistent-current-chromium.png` y `.hyperion/persistent-current-webkit.png`.
- CI incorpora los dos escenarios WebKit; no se ejecutó CI remota ni se regeneraron instaladores nativos en este incremento.
