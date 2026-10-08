# Manual de Hyperion — de una petición a un flujo interactivo

Hyperion convierte el plan de tu agente en un flujo **vertical, de arriba hacia abajo**. Las tareas independientes aparecen en paralelo en el mismo nivel. La petición se escribe en Codex, Claude, Cursor u otra herramienta conectada; el agente interpreta lo que necesitas, genera los pasos y registra el flujo. Tú respondes y apruebas desde Hyperion.

La configuración se realiza una vez por herramienta. Después, el uso habitual comienza con una petición en lenguaje natural. No necesitas escribir JSON ni preparar una plantilla de pasos.

## Conexión rápida — configuración una sola vez

Desde el repositorio, ejecuta `npm ci` la primera vez. Después utiliza **solo el comando correspondiente** a tu herramienta:

```sh
npm run hyperion -- setup codex
npm run hyperion -- setup claude
npm run hyperion -- setup cursor
```

`setup` resuelve las rutas de Node y del adaptador, registra la identidad y configura el cliente. Construye el adaptador si todavía no existe. Codex y Claude Code requieren su CLI instalada; Cursor recibe una entrada en su configuración local de usuario. Los demás servidores se conservan; una entrada distinta de Hyperion en Cursor se señala como conflicto.

Recarga las herramientas MCP o abre una sesión nueva del cliente. Al cargar Hyperion, el adaptador inicia el servidor local si hace falta y reutiliza la instancia autenticada si ya existe. El arranque no escribe mensajes en el canal de herramientas; sus logs quedan en `.hyperion/server.log`. La instancia permanece disponible después de cerrar el adaptador. Si una versión anterior ocupa el puerto, detén esa instancia antes de reconectar. Tras actualizar el repositorio, ejecuta `npm run build`.

Luego basta con escribir en el chat:

> Usa Hyperion para [mi actividad]. Genera un proceso con inicio y fin, compuertas cuando correspondan, entradas y salidas por tarea, y registra tus acciones y observaciones.

La configuración no añade herramientas retroactivamente a una conversación abierta. Esta conversación puede continuar usando la CLI. Las secciones siguientes conservan la configuración manual, Claude Desktop y otros clientes como alternativas.

## 1. Iniciar Hyperion

Requisitos: Node.js 22.13 o superior y npm. Los comandos siguientes utilizan una terminal macOS o Linux.

Desde la carpeta del repositorio:

```sh
npm ci
npm run build
npm start
```

Deja esa terminal abierta. Abre [Hyperion local](http://127.0.0.1:4317). En una segunda terminal, dentro del mismo repositorio, define las rutas para los ejemplos:

```sh
HYPERION_REPO="$PWD"
HYPERION_NODE="$(command -v node)"
```

En este equipo, el repositorio está en `/Users/oscarlobaton/Documents/ChatGPT/github/0vas/hiperion`. En otros equipos debes usar tu ruta local. Usa una ruta absoluta al ejecutable Node si la aplicación no hereda el PATH de tu terminal.

Hyperion guarda sus ejecuciones en `.hyperion/`. No requiere una clave de OpenAI ni de Anthropic: el modelo lo proporciona la herramienta en la que haces la petición.

## 2. Conectar la herramienta elegida

### Codex

Genera la identidad y configuración local:

```sh
npm run hyperion -- connect codex
```

La salida indica el archivo `.hyperion/connections/codex.mcp.json`. El comando no cambia la configuración de Codex. Para registrar el servidor:

```sh
codex mcp add hyperion \
  --env HYPERION_AGENT_ID=codex \
  --env HYPERION_DATA_DIR="$HYPERION_REPO/.hyperion" \
  --env HYPERION_URL=http://127.0.0.1:4317 \
  -- "$HYPERION_NODE" "$HYPERION_REPO/dist/adapters/mcp.js"
codex mcp get hyperion
```

Comprueba en Codex que estén disponibles las herramientas `hyperion_create_run`, `hyperion_get_run`, `hyperion_step`, `hyperion_list_runs` y `hyperion_wait`. Si la conversación actual no las carga, inicia una sesión que recoja la configuración actualizada. En esta conversación ya podemos trabajar mediante la CLI, sin esperar a cargar MCP.

La configuración stdio y los comandos de registro se basan en la [documentación oficial de Codex](https://developers.openai.com/codex/mcp).

### Claude Code

Desde el proyecto en el que usarás Claude Code, registra el adaptador. `HYPERION_REPO` debe seguir apuntando al repositorio de Hyperion, aunque estés trabajando en otro proyecto.

Primero, desde Hyperion:

```sh
npm run hyperion -- connect claude
```

Después, en la terminal del proyecto de trabajo:

```sh
claude mcp add hyperion --transport stdio --scope local \
  --env HYPERION_AGENT_ID=claude \
  --env HYPERION_DATA_DIR="$HYPERION_REPO/.hyperion" \
  --env HYPERION_URL=http://127.0.0.1:4317 \
  -- "$HYPERION_NODE" "$HYPERION_REPO/dist/adapters/mcp.js"
claude mcp get hyperion
```

Abre Claude Code y revisa `/mcp`. La conexión local se aplica al proyecto donde ejecutaste el registro. Véase la [configuración MCP oficial de Claude Code](https://code.claude.com/docs/en/mcp).

### Claude Desktop

Para la aplicación de escritorio de Claude, usa el mismo comando `connect claude`. Abre la configuración de servidores MCP locales de la aplicación e incorpora la entrada `mcpServers.hyperion` del archivo generado, conservando las demás entradas que ya tengas. En macOS, la guía oficial sitúa esa configuración en `~/Library/Application Support/Claude/claude_desktop_config.json`.

Reinicia la aplicación y comprueba que muestre las herramientas. La [guía oficial de servidores MCP locales](https://modelcontextprotocol.io/docs/develop/connect-local-servers) describe este mecanismo. Claude en el navegador no puede usar directamente este proceso stdio local; no equivale a Claude Desktop o Claude Code.

### Cursor

Genera la configuración:

```sh
npm run hyperion -- connect cursor
```

Abre `.hyperion/connections/cursor.mcp.json`. Incorpora su entrada `mcpServers.hyperion` en **una** de estas ubicaciones:

- `.cursor/mcp.json` del proyecto donde usarás Cursor.
- `~/.cursor/mcp.json` para disponer de Hyperion en tus proyectos locales.

Si ya existe el archivo, combina las entradas; no reemplaces otros servidores. El archivo generado incluye `type: stdio`, la ruta de Node, el adaptador y `HYPERION_AGENT_ID=cursor`. No contiene tokens.

Comprueba que el servidor esté habilitado en la configuración MCP de Cursor y úsalo desde su agente. Las ubicaciones y el formato se documentan en la [guía oficial de Cursor](https://prod.cursor.com/docs/mcp).

### Otra herramienta

```sh
npm run hyperion -- connect mi-herramienta
```

El comando registra una identidad y genera `.hyperion/connections/mi-herramienta.mcp.json`. Configura su entrada en un cliente que admita MCP stdio y procesos locales. Si tu herramienta dispone de terminal o HTTP pero no de MCP, puede usar la CLI o el [protocolo HTTP](protocol.md).

Cada cliente recibe una credencial diferente. Pueden coexistir en la misma instancia y cada flujo conserva su coordinador. Esta versión no transfiere automáticamente un flujo de Codex a Claude o Cursor. Para esa situación haría falta un mecanismo explícito de cesión de autoridad.

## 3. Hacer una petición

En la herramienta conectada, escribe:

> Usa Hyperion para [describe aquí tu actividad]. Genera el flujo a partir de esta petición, conserva el texto original y decide los pasos necesarios. Identifica qué haces tú, qué necesito hacer yo, las dependencias y las acciones que puedan realizarse en paralelo. Pide mi aprobación antes de las acciones que la requieran. Muéstrame el enlace y registra resultados reales.

El agente debe:

1. Interpretar la petición y solicitar aclaraciones solo si son necesarias.
2. Generar un plan específico y enviarlo mediante `hyperion_create_run`, incluyendo `plan.request` con el texto original.
3. Entregarte el enlace a esa ejecución.
4. Iniciar únicamente pasos automáticos habilitados, realizar el trabajo con sus propias herramientas y registrar evidencias.
5. Esperar cuando un paso dependa de tu respuesta o aprobación.

No necesitas convertir tu petición a JSON: lo hace el agente. Hyperion valida y representa ese plan; la aplicación no contiene un modelo adicional que interprete texto por sí solo. Una nueva petición produce un nuevo plan, no una copia obligatoria del caso de demostración.

## 4. Participar en el flujo

Todo ocurre en un único **canvas landscape**. El recorrido mantiene su dirección vertical y puedes desplazar o ampliar el gráfico. No hay un inspector fijo: cada nodo es un botón que abre un popup con sus instrucciones, resultados y acciones disponibles.

- **Petición original:** abre el texto recibido desde Codex o la herramienta coordinadora.
- **Actividad:** abre el historial del mismo flujo.
- **I/O** en cada tarea: abre sus entradas, salidas, tipos, orígenes y valores.
- **Logs** en cada nodo: abre sus eventos y las trazas públicas compartidas por el agente.
- **Responder / Revisar y aprobar:** abre el popup del nodo correspondiente. Envía la respuesta o decisión allí; al guardarla vuelves al canvas.
- **Mis flujos:** permite elegir otra ejecución desde un popup.
- **Escape** o el botón de cierre regresa al canvas sin enviar una decisión.

| Lo que ves            | Qué significa                             | Qué haces                                        |
| --------------------- | ----------------------------------------- | ------------------------------------------------ |
| Petición original     | Texto que dio origen al plan              | Ábrelo para comprobar el alcance                 |
| En espera             | Faltan dependencias                       | Revisa los pasos anteriores                      |
| Listo                 | El agente puede iniciar ese paso          | Pídele que continúe si está esperando en el chat |
| En curso              | El agente registró el inicio              | Consulta su actividad y resultados               |
| Tu turno, paso manual | Falta información o trabajo tuyo          | Escribe el resultado y pulsa Enviar respuesta    |
| Tu turno, aprobación  | Debes decidir sobre un resultado concreto | Revisa evidencias y aprueba o rechaza            |
| Completado            | Hay un resultado registrado               | Abre el nodo para leerlo                         |

El botón **Continuar en [herramienta]** copia una petición con el ID del flujo. Pégala en el mismo chat del agente coordinador. También puedes escribir: «Continúa el flujo de Hyperion [ID]; lee mi respuesta y ejecuta solo los pasos habilitados».

El adaptador ofrece esperas acotadas, pero no inicia ni despierta conversaciones automáticamente. Tu clic queda guardado aunque el agente haya terminado su turno. Una pausa bloquea nuevos inicios; cancelar no deshace acciones externas ya realizadas.

## 5. Caso de prueba desde Codex

El caso se inicia en Codex: escribes la petición en el chat y Codex genera el plan, lo registra mediante CLI o MCP y te entrega el enlace. Hyperion muestra el trabajo que Codex va reportando. No necesitas crear el caso desde la interfaz ni ejecutar comandos de registro personalmente.

Para probar la interacción del canvas, pide en Codex:

> Usa Hyperion para probar su canvas interactivo. Verifica la interfaz, pídeme probar los botones y popups, revisa mis observaciones y solicita mi aprobación antes de cerrar la prueba.

El recorrido esperado es: verificación real de Codex → prueba manual en un popup → revisión de tus observaciones por Codex → aprobación en un popup → cierre registrado por Codex. El texto original y los eventos del coordinador permiten seguir el origen del flujo. Después de enviar una respuesta, usa **Continuar en Codex** y pega la petición copiada en este chat; esta versión no despierta conversaciones automáticamente.

### Otro ejemplo: preparar una contribución

Copia esta petición en cualquiera de las herramientas conectadas:

> Usa Hyperion para ayudarme a preparar mi primera contribución a este repositorio open source. Pregúntame si quiero contribuir a documentación o código; luego revisa las instrucciones y las verificaciones disponibles en paralelo. Muéstrame una propuesta y pide mi aprobación antes de crear una checklist personalizada.

El flujo de referencia generado a partir de esa petición tiene este recorrido:

1. **Elegir el tipo de contribución** — tú indicas documentación o código.
2. **Revisar instrucciones** y **Revisar verificaciones** — dos pasos del agente en paralelo, habilitados después de tu respuesta.
3. **Aprobar la checklist propuesta** — tú revisas los resultados y decides.
4. **Crear la checklist personalizada** — el agente hace la entrega después de tu aprobación.

La estructura exacta de un plan generado por otro modelo puede variar; el contrato comprobable es que conserve la intención, las dependencias y la aprobación previa. El ejemplo guardado está en [examples/first-contribution.plan.json](../examples/first-contribution.plan.json) y su petición en [examples/first-contribution.request.md](../examples/first-contribution.request.md).

**Resultado esperado:** se ve un grafo vertical, tu respuesta persiste tras recargar, ambas ramas pueden estar activas simultáneamente, el paso final permanece bloqueado hasta aprobar y la checklist aparece como resultado real. Si rechazas, el agente no realiza la entrega de ese flujo.

Para reproducir exactamente la estructura del ejemplo, el agente puede registrar el archivo suministrado mediante la CLI. Eso es una fixture de prueba; el uso normal sigue siendo pedir al agente que genere un plan nuevo a partir de tu petición.

## 6. Usar la CLI desde una conversación ya abierta

El agente ejecuta estos comandos desde Hyperion. Sustituye `codex` por `claude`, `cursor` u otra identidad registrada cuando corresponda:

```sh
HYPERION_AGENT_ID=codex npm run hyperion -- create PLAN_GENERADO.json
HYPERION_AGENT_ID=codex npm run hyperion -- get RUN_ID
HYPERION_AGENT_ID=codex npm run hyperion -- start RUN_ID STEP_ID
# El agente realiza aquí el trabajo autorizado con sus propias herramientas.
HYPERION_AGENT_ID=codex npm run hyperion -- complete RUN_ID STEP_ID 'Resultado y evidencia'
HYPERION_AGENT_ID=codex npm run hyperion -- wait RUN_ID REVISION 30
```

Las aprobaciones se realizan en la interfaz. Ni CLI ni MCP ofrecen un comando para suplantar la decisión humana.

## Procesos con compuertas y contrato de datos

El [contrato de procesos](process-contract.md) describe inicio/fin, las compuertas `+`, `X`, `○`, el tipado de inputs/outputs y las trazas públicas. El ejemplo [process-review.json](../examples/process-review.json) permite elegir documentación, código o ambos; la compuerta inclusiva activa lo elegido y la unión espera esas ramas. Si no eliges ninguna, se ejecuta una ruta por defecto explícita. Todo se responde desde popups del mismo canvas.

## 7. Resolver problemas

| Problema                                         | Comprobación                                                                            |
| ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| La interfaz no abre                              | Mantén `npm start` activo y usa `127.0.0.1:4317`                                        |
| El cliente no encuentra el adaptador             | Ejecuta `npm run build`; comprueba las rutas absolutas de Node y `dist/adapters/mcp.js` |
| Unregistered agent                               | Ejecuta `connect` para esa identidad y verifica `HYPERION_AGENT_ID`                     |
| Aparece el nombre de otra herramienta            | Revisa la identidad configurada antes de crear un flujo nuevo                           |
| Falta la herramienta MCP en el chat              | Revisa el estado MCP del cliente y recarga o abre una sesión que la incluya             |
| El agente no continúa tras aprobar               | Pídele continuar con el ID; la decisión ya quedó guardada                               |
| Una herramienta intenta continuar un flujo ajeno | Usa el coordinador original; aún no existe transferencia de autoridad                   |
| La herramienta está en la nube                   | Este adaptador es local; `127.0.0.1` no apunta a tu ordenador desde un entorno remoto   |

## Alcance de la verificación

La integración de esta conversación usa Codex mediante CLI. El contrato MCP se prueba automáticamente con un cliente del SDK y las identidades `codex`, `claude` y `cursor`; también se prueba otra identidad mediante HTTP. La configuración está contrastada con documentación oficial. Esa prueba no equivale a haber ejecutado el recorrido en las aplicaciones nativas de Claude y Cursor: su verificación final se realiza al conectarlas y usar la petición anterior.
