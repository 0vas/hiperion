import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  mkdtempSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setupClient } from '../src/adapters/setup.js';

test('one-command setup generates absolute launch configuration and delegates vendor registration without a shell', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'hyperion-setup-'));
  try {
    for (const id of ['codex', 'claude'] as const) {
      const calls: { command: string; args: string[] }[] = [];
      const result = await setupClient(id, {
        directory: dir,
        home: dir,
        run: (command, args) => {
          calls.push({ command, args });
        },
      });
      assert.equal(calls.length, 1);
      assert.equal(calls[0]!.command, id);
      assert.ok(calls[0]!.args.includes('hyperion'));
      assert.ok(calls[0]!.args.some((arg) => arg.includes('mcp-launcher.js')));
      assert.match(result.message, /reload|session/i);
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
test('Cursor setup preserves other servers, is idempotent and refuses conflicting entries', async () => {
  const home = mkdtempSync(join(tmpdir(), 'hyperion-cursor-'));
  try {
    mkdirSync(join(home, '.cursor'));
    const path = join(home, '.cursor/mcp.json');
    writeFileSync(
      path,
      JSON.stringify({ mcpServers: { other: { command: 'keep-me' } } }),
    );
    const options = { directory: join(home, 'data'), home };
    await setupClient('cursor', options);
    await setupClient('cursor', options);
    const config = JSON.parse(readFileSync(path, 'utf8'));
    assert.equal(config.mcpServers.other.command, 'keep-me');
    assert.match(config.mcpServers.hyperion.args[0], /mcp-launcher.js$/);
    config.mcpServers.hyperion.command = 'different';
    writeFileSync(path, JSON.stringify(config));
    await assert.rejects(setupClient('cursor', options), /already|conflict/i);
    assert.equal(
      JSON.parse(readFileSync(path, 'utf8')).mcpServers.hyperion.command,
      'different',
    );
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
});
