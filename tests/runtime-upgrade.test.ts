import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import {
  mkdtempSync,
  rmSync,
  existsSync,
  writeFileSync,
  readFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  olderRuntime,
  sameServerCommand,
  withRuntimeLock,
} from '../src/adapters/runtime-upgrade.js';
import { ensureServer } from '../src/adapters/bootstrap.js';
import { VERSION } from '../src/version.js';

test('replacement permits older releases, never unknown identities or downgrades', () => {
  assert.equal(olderRuntime('2026.10.12.0638', '2026.10.12.1722'), true);
  assert.equal(olderRuntime('0.5.1', '2026.10.12.1722'), true);
  for (const v of [
    '2026.10.12.1722',
    '2027.01.01.0000',
    '2026.13.01.0000',
    '2026.02.31.0000',
    '0.99.0',
    'garbage',
  ])
    assert.equal(olderRuntime(v, '2026.10.12.1722'), false);
  assert.equal(
    sameServerCommand(
      '"C:\\Program Files\\Hyperion.exe" "C:\\App\\dist\\server\\main.js"',
      ['C:\\Program Files\\Hyperion.exe', 'C:\\App\\dist\\server\\main.js'],
      true,
    ),
    true,
  );
  assert.equal(
    sameServerCommand(
      '/app/Hyperion /other/dist/server/main.js',
      ['/app/Hyperion', '/app/dist/server/main.js'],
      false,
    ),
    false,
  );
});

test('startup lock serializes concurrent launchers and releases on error', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'hyperion-lock-'));
  let active = 0,
    max = 0;
  try {
    await Promise.all(
      Array.from({ length: 3 }, () =>
        withRuntimeLock(dir, async () => {
          max = Math.max(max, ++active);
          await new Promise((r) => setTimeout(r, 30));
          active--;
        }),
      ),
    );
    assert.equal(max, 1);
    await assert.rejects(
      withRuntimeLock(dir, async () => {
        throw new Error('test');
      }),
      /test/,
    );
    assert.equal(existsSync(join(dir, 'runtime-start.lock')), false);
    writeFileSync(
      join(dir, 'runtime-start.lock'),
      JSON.stringify({ pid: 2147483646, nonce: 'dead' }),
    );
    await withRuntimeLock(dir, async () =>
      assert.equal(
        JSON.parse(readFileSync(join(dir, 'runtime-start.lock'), 'utf8')).pid,
        process.pid,
      ),
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('foreign or unauthenticated listener is never stopped or backed up', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'hyperion-foreign-'));
  let authenticated = false,
    health = true;
  const server = createServer((req, res) => {
    res.setHeader('content-type', 'application/json');
    if (req.url === '/api/health')
      res.end(JSON.stringify({ ok: health, version: '2026.10.12.0638' }));
    else {
      res.statusCode = authenticated ? 200 : 401;
      res.end(
        JSON.stringify(
          authenticated
            ? []
            : { error: 'UNAUTHORIZED', message: 'Wrong workspace' },
        ),
      );
    }
  });
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  const url = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
  try {
    await assert.rejects(ensureServer({ directory: dir, url }), /UNAUTHORIZED/);
    authenticated = true;
    assert.notEqual(VERSION, '2026.10.12.0638');
    await assert.rejects(
      ensureServer({ directory: dir, url }),
      /another installation or process/,
    );
    health = false;
    await assert.rejects(
      ensureServer({ directory: dir, url }),
      /another service/,
    );
    assert.equal(existsSync(join(dir, 'backups')), false);
    assert.equal((await fetch(url + '/api/health')).status, 200);
  } finally {
    await new Promise<void>((r) => server.close(() => r()));
    rmSync(dir, { recursive: true, force: true });
  }
});
