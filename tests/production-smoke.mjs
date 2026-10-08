import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:net';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
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
