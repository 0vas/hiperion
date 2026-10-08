import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:net';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ensureServer } from '../src/adapters/bootstrap.js';
import { HyperionClient } from '../src/adapters/client.js';
test('launcher starts one authenticated local server on demand and refuses a mismatched instance', async () => {
  const reservation = createServer();
  await new Promise<void>((r) => reservation.listen(0, '127.0.0.1', r));
  const port = (reservation.address() as { port: number }).port;
  await new Promise<void>((r) => reservation.close(() => r()));
  const dir = mkdtempSync(join(tmpdir(), 'hyperion-launch-'));
  const other = mkdtempSync(join(tmpdir(), 'hyperion-wrong-'));
  let pid: number | undefined;
  try {
    const options = { url: `http://127.0.0.1:${port}`, directory: dir };
    const first = await ensureServer(options);
    pid = first.pid;
    assert.equal(first.started, true);
    assert.ok(pid);
    const client = new HyperionClient(options);
    assert.deepEqual(await client.list(), []);
    const run = await client.create({
      title: 'CLI typed results',
      steps: [
        {
          id: 'review',
          title: 'Review',
          kind: 'agent',
          outputs: [{ name: 'report', type: 'string', required: true }],
        },
      ],
    });
    await client.command(run.id, { type: 'start', stepId: 'review' });
    const commandFile = join(dir, 'command.json');
    const invoke = async (command: unknown) => {
      writeFileSync(commandFile, JSON.stringify(command));
      const result = await promisify(execFile)(
        process.execPath,
        [
          '--import',
          import.meta.resolve('tsx'),
          'src/adapters/cli.ts',
          'command',
          run.id,
          commandFile,
        ],
        {
          env: {
            ...process.env,
            HYPERION_URL: options.url,
            HYPERION_DATA_DIR: dir,
          },
        },
      );
      return JSON.parse(result.stdout);
    };
    const logged = await invoke({
      type: 'log',
      stepId: 'review',
      message: 'Read the guide',
      trace: { kind: 'action', tool: 'read_file' },
    });
    assert.equal(logged.events.at(-1).trace.tool, 'read_file');
    const completed = await invoke({
      type: 'complete',
      stepId: 'review',
      message: 'Guide checked',
      outputs: { report: 'Verified guide' },
    });
    assert.equal(completed.status, 'completed');
    assert.equal(completed.steps[0].outputValues.report, 'Verified guide');
    assert.equal((await ensureServer(options)).started, false);
    await assert.rejects(
      ensureServer({ ...options, directory: other }),
      /401|UNAUTHORIZED|credential/i,
    );
  } finally {
    if (pid) {
      process.kill(pid, 'SIGTERM');
      for (let i = 0; i < 100; i++) {
        try {
          process.kill(pid, 0);
        } catch {
          break;
        }
        await new Promise((r) => setTimeout(r, 20));
      }
    }
    rmSync(dir, { recursive: true, force: true });
    rmSync(other, { recursive: true, force: true });
  }
});
