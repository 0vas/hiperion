# Conectar tu IA

Hyperion mantiene el mismo proceso independientemente de la herramienta que realiza el trabajo. La conexión local aporta las herramientas o instrucciones necesarias para crear y actualizar el flujo.

## Camino recomendado

Instala Desktop y abre **Hyperion → Conectar con mi IA**. El asistente configura:

| Herramienta    | Conexión                                            |
| -------------- | --------------------------------------------------- |
| Codex          | Servidor MCP local                                  |
| Cursor         | Servidor MCP local                                  |
| Claude Desktop | Servidor MCP local                                  |
| Claude Code    | Skill administrada con acceso al runtime de Desktop |
| Antigravity    | Servidor MCP local · Desktop compilado desde `main` |

Después reinicia la herramienta y abre un chat nuevo. Las integraciones existentes no se sobreescriben a ciegas: el asistente informa conflictos y respalda los archivos que modifica.

Una conexión instalada no garantiza que un chat ya abierto haya cargado las herramientas. Tampoco basta mencionar «Hyperion» en una aplicación sin integración.

## Si no reconoce Hyperion

1. Comprueba que elegiste la herramienta correcta en el asistente.
2. Reinicia esa herramienta y abre un chat nuevo.
3. Pide «Usa Hyperion para…» con un objetivo concreto.
4. Si sigue fallando, revisa el error del asistente o del servidor MCP de tu herramienta.

No compartas archivos de credenciales ni tokens al reportar un error.

## Si el flujo no sigue tras guardar

Consulta [Pausa y reanudación](./reanudacion.md) para distinguir conexión MCP de reactivación de sesiones.

Sin un conector de reanudación instalado, tu respuesta se guarda localmente. El agente puede recibirla mientras espera con la integración; un chat que terminó necesita un nuevo mensaje. Usa **Copiar continuación** en el canvas y envíalo en el chat. [Más sobre la continuidad](./usar-el-flujo.md#retomar-el-trabajo).

## Antigravity

En Desktop compilado desde `main`, abre **Hyperion → Conectar con mi IA → Antigravity**. El asistente prepara `mcpServers.hyperion` en la configuración global documentada de Antigravity, conserva otros servidores y respalda el archivo anterior. El runtime incluido inicia Hyperion cuando el cliente carga MCP.

Reinicia Antigravity o recarga sus servidores MCP. Comprueba que aparecen las herramientas de Hyperion y pide: **«Usa Hyperion para preparar una guía de bienvenida a mi proyecto»**.

::: warning Versión necesaria
Los instaladores publicados **0.4.0-preview.1** todavía no incluyen este botón. El soporte está implementado en `main`; la [conexión técnica](https://github.com/0vas/hyperion/blob/main/docs/conexion.md#antigravity) ofrece también `setup antigravity` para instalaciones desde fuentes. No necesitas editar JSON con el asistente nuevo.
:::

::: info Alcance verificado
Las pruebas cubren configuración, respaldo, conflictos y el protocolo MCP con identidad Antigravity. Falta validar una conversación en la aplicación de Google. El conector para reactivar automáticamente un chat terminado sigue pendiente.
:::

[Documentación MCP de Antigravity](https://antigravity.google/docs/mcp).

## Otras aplicaciones

Un cliente compatible puede usar el servidor MCP, la CLI o la API local. Debe aportar un agente que planifique y ejecute: Hyperion no incluye un modelo de IA ni interpreta peticiones por sí solo.

La edición actual comunica aplicaciones en el mismo equipo. No expongas el servicio local como un servidor remoto para conectar otros equipos.

Para integradores: [conexión técnica](https://github.com/0vas/hiperion/blob/main/docs/conexion.md), [protocolo](https://github.com/0vas/hiperion/blob/main/docs/protocol.md) y [contrato del proceso](https://github.com/0vas/hiperion/blob/main/docs/process-contract.md).
