#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { setupClient } from './setup.js';
import { HyperionClient } from './client.js';
import { commandSchema } from '../domain/workflow.js';
import { generateConnection } from './connections.js';
const [operation, first, second, ...rest] = process.argv.slice(2);
const help = `Hyperion — cooperative workflow adapter
  setup <codex|claude|cursor>  # configure the client; local server starts on demand
  connect <client-id>  # codex, claude, cursor, or your own ID
  create <plan.json> [idempotency-key]
  command <run-id> <command.json>  # typed outputs or structured traces
  list
  get <run-id>
  start|complete|fail|log|retry <run-id> <step-id> [message]
  wait <run-id> [after-revision] [timeout-seconds, max 55]

Human approvals and manual input belong in the web interface.
Set HYPERION_URL and HYPERION_DATA_DIR to target another local instance.`;
try {
  if (!operation || operation === '--help') console.log(help);
  else if (operation === 'setup' && first) {
    const root = fileURLToPath(new URL('../../', import.meta.url));
    if (!existsSync(resolve(root, 'dist/adapters/mcp-launcher.js'))) {
      const build = spawnSync('npm', ['run', 'build'], {
        cwd: root,
        stdio: 'inherit',
        shell: false,
      });
      if (build.status !== 0)
        throw new Error('Build failed. Run npm ci and npm run build first.');
    }
    console.log(JSON.stringify(await setupClient(first), null, 2));
  } else if (operation === 'connect' && first)
    console.log(JSON.stringify(generateConnection(first), null, 2));
  else {
    const client = new HyperionClient();
    let result: unknown;
    if (operation === 'list') result = await client.list();
    else if (operation === 'create' && first) {
      const run = await client.create(
        JSON.parse(readFileSync(first, 'utf8')),
        second,
      );
      result = { ...run, url: client.link(run) };
    } else if (operation === 'command' && first && second)
      result = await client.command(
        first,
        commandSchema.parse(JSON.parse(readFileSync(second, 'utf8'))),
      );
    else if (operation === 'get' && first) result = await client.get(first);
    else if (operation === 'wait' && first)
      result = await client.wait(
        first,
        Number(second || 0),
        Number(rest[0] || 30),
      );
    else if (
      ['start', 'complete', 'fail', 'log', 'retry'].includes(operation) &&
      first &&
      second
    )
      result = await client.command(
        first,
        commandSchema.parse({
          type: operation,
          stepId: second,
          message: rest.join(' ') || undefined,
        }),
      );
    else throw new Error(help);
    console.log(JSON.stringify(result, null, 2));
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
