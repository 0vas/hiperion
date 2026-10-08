#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { ensureServer } from './bootstrap.js';
import { registerAgent } from '../server/config.js';
import { installSkill, defaultDirectory } from './install.js';
import { setupClient } from './setup.js';
import { HyperionClient } from './client.js';
import { commandSchema } from '../domain/workflow.js';
import { generateConnection } from './connections.js';
const args = process.argv.slice(2);
if (args[0] === '--agent') {
  if (!args[1]) throw new Error('--agent requires an identity');
  process.env.HYPERION_AGENT_ID = args[1];
  args.splice(0, 2);
}
process.env.HYPERION_DATA_DIR ||= defaultDirectory();
const [operation, first, second, ...rest] = args;
const help = `Hyperion — cooperative workflow adapter
  install [skills-directory]  # portable skill, no vendor CLI or MCP required
  up                         # start/reuse local Hyperion, return URL
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
  else if (operation === 'install' || (operation === 'setup' && first)) {
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
    console.log(
      JSON.stringify(
        operation === 'install'
          ? installSkill({ destination: first })
          : await setupClient(first!),
        null,
        2,
      ),
    );
  } else if (operation === 'connect' && first)
    console.log(JSON.stringify(generateConnection(first), null, 2));
  else {
    if (
      ![
        'up',
        'list',
        'create',
        'command',
        'get',
        'wait',
        'start',
        'complete',
        'fail',
        'log',
        'retry',
      ].includes(operation)
    )
      throw new Error(help);
    if (process.env.HYPERION_AGENT_ID)
      registerAgent(
        process.env.HYPERION_AGENT_ID,
        process.env.HYPERION_DATA_DIR,
      );
    const startup = await ensureServer();
    const client = new HyperionClient();
    let result: unknown;
    if (operation === 'up') result = { ...startup, url: client.url };
    else if (operation === 'list') result = await client.list();
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
