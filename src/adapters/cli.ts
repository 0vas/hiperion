#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { HyperionClient } from './client.js';
import { commandSchema } from '../domain/workflow.js';
import { generateConnection } from './connections.js';
const [operation, first, second, ...rest] = process.argv.slice(2);
const help = `Hyperion — cooperative workflow adapter
  connect <client-id>  # codex, claude, cursor, or your own ID
  create <plan.json> [idempotency-key]
  list
  get <run-id>
  start|complete|fail|log|retry <run-id> <step-id> [message]
  wait <run-id> [after-revision] [timeout-seconds, max 55]

Human approvals and manual input belong in the web interface.
Set HYPERION_URL and HYPERION_DATA_DIR to target another local instance.`;
try {
  if (!operation || operation === '--help') console.log(help);
  else if (operation === 'connect' && first)
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
    } else if (operation === 'get' && first) result = await client.get(first);
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
