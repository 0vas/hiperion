# Instalar y conectar Hyperion

## Instalación y conexión (una vez)

Si ya recibes un canvas al pedir «usa Hyperion», consulta el [manual de uso](manual-uso.md). Para configurar otra herramienta, consulta las opciones siguientes. Codex, Cursor y Claude Code pueden usar la skill con terminal local; Claude Desktop usa la conexión MCP descrita más abajo.

### Skill portable

En este repositorio ya preparado, instala la skill portable:

```sh
npm run hyperion -- install
```

Recarga las skills o abre una sesión nueva del agente y escribe:

> Usa Hyperion para preparar mi siguiente entrega. Pídeme el alcance, muéstrame los pasos y espera mi aprobación antes de ejecutarla.

La skill enseña al agente a arrancar o reutilizar Hyperion, construir el plan desde esa petición y devolver el enlace al canvas. El agente usa sus propias herramientas para el trabajo y registra sus resultados. La persona participa mediante los popups. No necesitas configurar MCP, escribir JSON ni mantener una terminal de servidor abierta.

Esta vía usa el estándar [Agent Skills](https://agentskills.io/specification) y requiere un agente con shell local y Node.js 22.13+. El instalador coloca la skill en `~/.agents/skills/hyperion`, ubicación compartida por [Codex](https://learn.chatgpt.com/docs/build-skills) y [Cursor](https://cursor.com/docs/skills). Si existe `~/.claude`, también la instala en `~/.claude/skills/hyperion`, ubicación de [Claude Code](https://code.claude.com/docs/en/skills). Para otra ubicación: `hyperion install /ruta/a/skills`; se creará su subcarpeta `hyperion`.

La frase por sí sola no instala capacidades en una herramienta que nunca ha cargado la skill ni conoce Hyperion. Esa primera instalación y la recarga del cliente son necesarias. La selección automática depende del host; si no la selecciona, invoca su skill Hyperion explícitamente. Un agente remoto sin acceso al ordenador local necesita otra modalidad de despliegue, pendiente en esta edición.

### Instalar el paquete sin clonar el repositorio

Con el archivo de distribución `hyperion-workflows-0.4.0.tgz`:

```sh
npm install --global ./hyperion-workflows-0.4.0.tgz
hyperion install
```

El paquete incluye la web, el servidor y la CLI compilados. No requiere TypeScript, Vite ni el código fuente. Es una instalación inicial de dos comandos; el uso posterior comienza desde el chat. En este incremento el archivo se genera y valida localmente: todavía no está publicado en npm ni en GitHub Releases. No uses un paquete homónimo del registro suponiendo que es este proyecto.

Para generar una distribución desde las fuentes: `npm ci` y `npm pack` (el empaquetado construye el producto). El paquete puede compartirse sin incluir ejecuciones ni credenciales. La validación del incremento comprobó su instalación en un directorio aislado con dependencias de producción.

### Datos, actualizaciones y otras herramientas

La skill incluye rutas absolutas al ejecutable y al almacenamiento, sin tokens. Las instalaciones de paquete usan `~/.hyperion` por defecto; el checkout actual conserva su `.hyperion` existente. `HYPERION_DATA_DIR` permite elegir otra ubicación. Así, cambiar de proyecto no crea otra instancia ni pierde los flujos. `--agent ID` permite registrar cualquier identidad local, sin lista cerrada de marcas.

Si mueves Hyperion o lo actualizas, vuelve a ejecutar `hyperion install` (en las fuentes, construye antes con `npm run build`). Se conservan las skills ajenas; una modificación manual de los archivos administrados provoca un conflicto explícito. Para retirar la integración, elimina únicamente las carpetas de skill mostradas por el instalador; esto no borra tus flujos. El servicio iniciado sigue disponible al terminar el chat. Una versión antigua que ocupe el puerto debe detenerse antes de cargar una nueva.

El reconocimiento nativo en cada producto debe verificarse tras recargar su sesión. Las pruebas automatizadas verifican instalación, ejecución del script, API y MCP; no equivalen a una conversación nativa completa en cada cliente.

## Alternativa: conexión MCP por cliente

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

## Iniciar Hyperion manualmente (opcional)

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

Usa la ruta local de tu copia de Hyperion. Usa una ruta absoluta al ejecutable Node si la aplicación no hereda el PATH de tu terminal.

Hyperion guarda sus ejecuciones en `.hyperion/`. No requiere una clave de OpenAI ni de Anthropic: el modelo lo proporciona la herramienta en la que haces la petición.

## Conectar la herramienta elegida

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

## Usar la CLI desde una conversación ya abierta

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

## Resolver problemas

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
