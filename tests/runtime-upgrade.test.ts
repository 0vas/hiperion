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
import {
  ensureServer,
  FOREIGN_PORT_MESSAGE,
} from '../src/adapters/bootstrap.js';
import { VERSION } from '../src/version.js';
import { HyperionClient } from '../src/adapters/client.js';

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

test('foreign conflict copy is actionable and never bare UNAUTHORIZED', () => {
  assert.match(FOREIGN_PORT_MESSAGE, /otra cuenta|otra instalación/i);
  assert.doesNotMatch(FOREIGN_PORT_MESSAGE, /UNAUTHORIZED/);
});

async function stopPid(pid?: number) {
  if (!pid) return;
  try {
    process.kill(pid, 'SIGTERM');
  } catch {
    return;
  }
  for (let i = 0; i < 100; i++) {
    try {
      process.kill(pid, 0);
    } catch {
      return;
    }
    await new Promise((r) => setTimeout(r, 20));
  }
}

test('foreign or unauthenticated listener is never stopped; alternate loopback recovers', async () => {
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
  const started: number[] = [];
  try {
    const recovered = await ensureServer({ directory: dir, url });
    assert.equal(recovered.started, true);
    assert.ok(recovered.pid);
    assert.ok(recovered.url);
    assert.notEqual(recovered.url, url);
    started.push(recovered.pid!);
    assert.equal((await fetch(url + '/api/health')).status, 200);
    assert.equal(
      (
        (await (await fetch(recovered.url + '/api/health')).json()) as {
          version: string;
        }
      ).version,
      VERSION,
    );
    assert.deepEqual(
      await new HyperionClient({ directory: dir, url: recovered.url }).list(),
      [],
    );
    await stopPid(recovered.pid);
    started.pop();

    authenticated = true;
    assert.notEqual(VERSION, '2026.10.12.0638');
    const ownedForeign = await ensureServer({ directory: dir, url });
    assert.equal(ownedForeign.started, true);
    assert.ok(ownedForeign.url);
    assert.notEqual(ownedForeign.url, url);
    started.push(ownedForeign.pid!);
    assert.equal((await fetch(url + '/api/health')).status, 200);
    assert.equal(existsSync(join(dir, 'backups')), false);
    await stopPid(ownedForeign.pid);
    started.pop();

    health = false;
    await assert.rejects(
      ensureServer({ directory: dir, url }),
      /another service/,
    );
    assert.equal(existsSync(join(dir, 'backups')), false);
    assert.equal((await fetch(url + '/api/health')).status, 200);
  } finally {
    for (const pid of started) await stopPid(pid);
    await new Promise<void>((r) => server.close(() => r()));
    rmSync(dir, { recursive: true, force: true });
  }
});

test('a responsive service under load is not mistaken for an unavailable runtime', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'hyperion-slow-health-'));
  const server = createServer((req, res) => {
    res.setHeader('content-type', 'application/json');
    if (req.url === '/api/health')
      setTimeout(
        () => res.end(JSON.stringify({ ok: true, version: VERSION })),
        1100,
      );
    else res.end('[]');
  });
  await new Promise<void>((done) => server.listen(0, '127.0.0.1', done));
  try {
    const url = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
    assert.deepEqual(await ensureServer({ directory: dir, url }), {
      started: false,
      url,
    });
  } finally {
    await new Promise<void>((done) => server.close(() => done()));
    rmSync(dir, { recursive: true, force: true });
  }
});
