# Connect your AI

Hyperion keeps the same workflow regardless of the tool doing the work. The local connection supplies tools or instructions for creating and updating runs.

## Recommended setup

Install Desktop and open **Hyperion → Conectar con mi IA**. The assistant configures:

| Tool           | Connection                                     |
| -------------- | ---------------------------------------------- |
| Codex          | Local MCP server                               |
| Cursor         | Local MCP server                               |
| Claude Desktop | Local MCP server                               |
| Claude Code    | Managed skill connected to the Desktop runtime |

Restart the tool and open a new chat. The assistant reports conflicts and backs up the configuration files it changes. Installing a connection does not guarantee that an existing chat has loaded it. Naming Hyperion in an unconnected application is not enough.

## If Hyperion is not recognized

1. Check that you selected the right tool in the assistant.
2. Restart it and open a new chat.
3. Ask “Use Hyperion to…” with a concrete goal.
4. Check the assistant or MCP server error if it still fails.

Do not share credentials or tokens when reporting an issue.

## If saving an answer does not resume work

See [pause and resume](./reanudacion.md). Without an installed resume connector, your answer is saved locally. An agent can receive it during an active integration wait; a finished chat needs another message. Use **Copiar continuación** in the canvas and send it in the chat.

## Antigravity

Google Antigravity can connect to Hyperion’s local MCP server. Setup is manual; the Desktop assistant does not yet have an Antigravity button.

1. Ask your agent to prepare the [Antigravity technical connection](https://github.com/0vas/hiperion/blob/main/docs/conexion.md#antigravity) on the computer running Hyperion.
2. In Antigravity IDE, open **MCP Servers → Manage MCP Servers → View raw config**. Add the generated `mcpServers.hyperion` entry, preserving other servers.
3. Reload servers and check that Hyperion tools appear. Open a chat and ask: **“Use Hyperion to prepare a welcome guide for my project.”**

::: info Current scope
Compatibility is based on the documented MCP transport; a real Antigravity session has not been validated. MCP alone cannot wake a finished chat. The resume connector is still pending.
:::

[Antigravity MCP documentation](https://antigravity.google/docs/mcp).

## Other applications

Compatible clients can use MCP, the CLI or the local API. They must supply an agent that plans and executes; Hyperion does not include an AI model. Hermes can use a manually configured MCP stdio connection. ChatGPT requires a remote authenticated integration, which is not included.

The current edition connects applications on the same computer. Do not expose the local service as a remote server.

Integrator references: [technical setup](https://github.com/0vas/hiperion/blob/main/docs/conexion.md), [protocol](https://github.com/0vas/hiperion/blob/main/docs/protocol.md), [process contract](https://github.com/0vas/hiperion/blob/main/docs/process-contract.md).
