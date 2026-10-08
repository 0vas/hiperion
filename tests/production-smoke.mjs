import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:net';
import { mkdtempSync, rmSync, existsSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ensureServer } from '../dist/adapters/bootstrap.js';
import { generateConnection } from '../dist/adapters/connections.js';

test('compiled launcher serves the UI and generates usable MCP paths', async () => {
  const reservation = createServer();
  await new Promise((r) => reservation.listen(0, '127.0.0.1', r));
  const port = reservation.address().port;
  await new Promise((r) => reservation.close(r));
  const directory = mkdtempSync(join(tmpdir(), 'hyperion-production-'));
  let pid;
  try {
    const url = `http://127.0.0.1:${port}`;
    const started = await ensureServer({ directory, url });
    pid = started.pid;
    const page = await fetch(url);
    assert.equal(page.status, 200);
    const html = await page.text();
    assert.match(html, /<div id="root">/);
    const asset = html.match(/src="([^"]+\.js)"/)[1];
    assert.equal((await fetch(url + asset)).status, 200);
    const config = generateConnection('codex', directory, true);
    assert.ok(existsSync(config.config.mcpServers.hyperion.args[0]));
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
    rmSync(directory, { recursive: true, force: true });
  }
});

test('installed skill starts Hyperion from another workspace and an arbitrary tool identity creates and completes a run', async () => {
  const reservation = createServer();
  await new Promise((r) => reservation.listen(0, '127.0.0.1', r));
  const port = reservation.address().port;
  await new Promise((r) => reservation.close(r));
  const workspace = mkdtempSync(join(tmpdir(), 'hyperion-portable-'));
  const cli = fileURLToPath(
    new URL('../dist/adapters/cli.js', import.meta.url),
  );
  const env = {
    ...process.env,
    HYPERION_DATA_DIR: join(workspace, 'data'),
    HYPERION_URL: `http://127.0.0.1:${port}`,
  };
  let pid;
  try {
    const invoke = async (file, args) =>
      JSON.parse(
        (
          await promisify(execFile)(process.execPath, [file, ...args], {
            cwd: workspace,
            env,
          })
        ).stdout,
      );
    const install = await invoke(cli, ['install', join(workspace, 'skills')]);
    const runner = join(install.paths[0], 'scripts/hyperion.mjs');
    const launch = await invoke(runner, ['--agent', 'independent-tool', 'up']);
    pid = launch.pid;
    assert.equal(launch.started, true);
    assert.equal(
      (await invoke(runner, ['--agent', 'independent-tool', 'up'])).started,
      false,
    );
    const planFile = join(workspace, 'plan.json');
    writeFileSync(
      planFile,
      JSON.stringify({
        title: 'Portable request',
        request: 'Guide my review',
        steps: [
          {
            id: 'review',
            title: 'Review',
            kind: 'agent',
            outputs: [{ name: 'report', type: 'string', required: true }],
          },
        ],
      }),
    );
    const run = await invoke(runner, [
      '--agent',
      'independent-tool',
      'create',
      planFile,
      'portable-request',
    ]);
    assert.equal(run.coordinator, 'independent-tool');
    assert.equal(run.request, 'Guide my review');
    await invoke(runner, [
      '--agent',
      'independent-tool',
      'start',
      run.id,
      'review',
    ]);
    const commandFile = join(workspace, 'command.json');
    writeFileSync(
      commandFile,
      JSON.stringify({
        type: 'complete',
        stepId: 'review',
        message: 'Transport tested',
        outputs: { report: 'Verified isolated workflow' },
      }),
    );
    const completed = await invoke(runner, [
      '--agent',
      'independent-tool',
      'command',
      run.id,
      commandFile,
    ]);
    assert.equal(completed.status, 'completed');
    const page = await fetch(launch.url);
    assert.equal(page.status, 200);
    assert.ok(existsSync(resolve(install.paths[0], 'references/protocol.md')));
    assert.ok(
      existsSync(resolve(install.paths[0], 'examples/process-gateways.json')),
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
    rmSync(workspace, { recursive: true, force: true });
  }
});
