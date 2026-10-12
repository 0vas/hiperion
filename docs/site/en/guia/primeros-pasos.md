# Your first workflow

You need a compatible AI tool connected to Hyperion. Set up the connection once; write subsequent requests in your chat.

<Quickstart />

## Try it before installing

<WorkflowDemo />

## 1. Open Hyperion

<Downloads />

Choose the installer for your computer. On macOS, open the DMG and move Hyperion to **Applications** before connecting your AI. On Windows, open the EXE. These preview builds are not signed or notarized; your system may show an unverified publisher notice.

## 2. Connect your AI

Choose **Codex**, **Cursor**, **Claude Desktop** or **Claude Code** in the first-launch assistant. You can reopen it from **Hyperion → Conectar con mi IA** (Connect my AI).

Restart your AI tool and open a new chat to load the integration. This Desktop setup requires no Node.js installation or manual configuration edits.

## 3. Ask for what you need

> Use Hyperion to prepare a welcome guide for my project.

::: tip Just describe your goal
You do not need to design the workflow or explain how to use Hyperion. The agent organizes the steps and asks only for missing information.
:::

The agent shares a link to your workflow. A new chat can start with this request once the connection is installed.

You can ask for a desktop window or a canvas beside your chat. Split view availability depends on your AI tool; the browser link opens the same run.

## 4. Take part in the canvas

Open the task marked **Tu turno** (Your turn), answer and save. Known choices appear as dropdowns when the plan declares their options; open questions accept text. The application currently uses Spanish labels; this documentation supports both languages.

If the agent is still waiting through the integration, it can continue in the same turn. If the chat has ended, use **Copiar continuación** (Copy continuation) and send the message in the connected chat. Your answer is already saved. See [pause and resume](./reanudacion.md) for connector capabilities.

## Check your first run

- The workflow reflects your request and identifies each task's owner.
- Your responses appear in I/O and reach subsequent tasks.
- The draft and real progress are recorded in the workflow.
- You can review the result and request changes in the chat.

Preparing a guide does not authorize publishing it. The integration must respect the scope of your request.

[Use the canvas](./usar-el-flujo.md) · [Connection troubleshooting](./integraciones.md)

## Requests ready to try

<UseCases />

Choose a case, copy the request and paste it into your connected AI tool. The agent adapts the plan to your context. These examples describe expected workflows, not guaranteed executions.

::: details Try it from source
For developers who prefer a local checkout instead of Desktop. Requires Node.js 22.13 or newer.

```sh
git clone https://github.com/0vas/hiperion.git
cd hiperion
npm ci
npm run build
npm start
```

In a second terminal, connect your tool once:

```sh
npm run hyperion -- setup cursor
# Alternatives: setup codex / setup claude
```

Restart that AI tool, open a new chat and paste a request from above. Visit `http://127.0.0.1:4317` to view the canvas. This runs the code in `main`, not the older preview installer.
:::

## Update Desktop

From **0.5.1-preview.1**, open **Hyperion → Buscar actualizaciones…**. The app checks GitHub and offers an installer for your computer; you choose whether to download it. Size and SHA-256 are checked before revealing the installer. Cancel with **Hyperion → Cancelar descarga**. Workflows remain in local storage.

Version 0.4.0 requires a manual upgrade. Its macOS bundle has an incomplete signature; downloading the same installer again does not fix it. The new preview seals the bundle correctly but **is not notarized by Apple**. Ad-hoc signing does not guarantee Gatekeeper acceptance. If macOS blocks installation, consult [Apple’s guide](https://support.apple.com/102445); do not disable system-wide protection.

If the local service fails, the new app offers retry, diagnostics and update checks. If another version occupies the port, close that instance before retrying; recorded workflows are preserved.
