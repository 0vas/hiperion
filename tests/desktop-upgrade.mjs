import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createServer } from 'node:net';
import {
  mkdtempSync,
  cpSync,
  symlinkSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  readdirSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join, dirname } from 'node:path';
import { HyperionClient } from '../dist/adapters/client.js';
const exec = promisify(execFile);

test(
  'installed runtime replaces its older authenticated service and preserves all workflow evidence',
  { timeout: 60000 },
  async () => {
    const home = mkdtempSync(join(tmpdir(), 'hyperion-upgrade-'));
    const root = join(home, 'runtime');
    mkdirSync(root);
    const executable = process.env.HYPERION_DESKTOP_EXECUTABLE
      ? resolve(process.env.HYPERION_DESKTOP_EXECUTABLE)
      : process.execPath;
    const packaged = process.env.HYPERION_DESKTOP_EXECUTABLE
      ? resolve(
          dirname(executable),
          process.platform === 'darwin' ? '../Resources/app' : 'resources/app',
        )
      : process.cwd();
    cpSync(join(packaged, 'dist'), join(root, 'dist'), { recursive: true });
    symlinkSync(
      resolve('node_modules'),
      join(root, 'node_modules'),
      process.platform === 'win32' ? 'junction' : 'dir',
    );
    writeFileSync(
      join(root, 'package.json'),
      JSON.stringify({ type: 'module' }),
    );
    const releasePath = join(root, 'dist/release.json');
    const current = readFileSync(releasePath, 'utf8');
    writeFileSync(
      releasePath,
      JSON.stringify({
        version: '2026.10.12.1722',
        channel: 'preview',
        timezone: 'UTC',
      }),
    );
    const reservation = createServer();
    await new Promise((r) => reservation.listen(0, '127.0.0.1', r));
    const port = reservation.address().port;
    await new Promise((r) => reservation.close(r));
    const directory = join(home, 'data');
    const url = `http://127.0.0.1:${port}`;
    const env = {
      ...process.env,
      HYPERION_HOME: home,
      HYPERION_DATA_DIR: directory,
      HYPERION_URL: url,
      ...(process.env.HYPERION_DESKTOP_EXECUTABLE
        ? { ELECTRON_RUN_AS_NODE: '1' }
        : {}),
    };
    const cli = async (...args) =>
      JSON.parse(
        (
          await exec(
            executable,
            [join(root, 'dist/adapters/cli.js'), ...args],
            { env, timeout: 25000 },
          )
        ).stdout,
      );
    const pids = new Set();
    try {
      const old = await cli('up');
      pids.add(old.pid);
      const client = new HyperionClient({ directory, url });
      const originalCredentials = readFileSync(
        join(directory, 'credentials.json'),
        'utf8',
      );
      let parent = await client.create({
        title: 'Preserve delivered file',
        request: 'Prepare a guide',
        steps: [
          {
            id: 'work',
            kind: 'agent',
            title: 'Write',
            outputs: [{ name: 'text', type: 'string', required: true }],
          },
        ],
      });
      await client.command(parent.id, { type: 'start', stepId: 'work' });
      const bytes = Buffer.from('# A real saved artifact');
      await client.addArtifact(parent.id, {
        stepId: 'work',
        attempt: 1,
        commandId: 'artifact',
        name: 'guide.md',
        mediaType: 'text/markdown',
        contentBase64: bytes.toString('base64'),
      });
      const command = {
        type: 'complete',
        stepId: 'work',
        attempt: 1,
        commandId: 'saved-receipt',
        message: 'Written',
        outputs: { text: 'Guide' },
      };
      parent = await client.command(parent.id, command);
      const child = await client.create(
        {
          title: 'Continue conversation',
          request: 'Review the guide',
          steps: [{ id: 'review', kind: 'manual', title: 'Review' }],
        },
        'child',
        parent.id,
      );
      let running = await client.create({
        title: 'External execution',
        steps: [{ id: 'external', kind: 'agent', title: 'Do not rerun' }],
      });
      running = await client.command(running.id, {
        type: 'start',
        stepId: 'external',
      });
      const saved = [parent, child, running].map((r) => ({
        id: r.id,
        status: r.status,
        revision: r.revision,
        events: r.events,
        steps: r.steps.map((s) => ({
          id: s.id,
          status: s.status,
          attempt: s.attempt,
          outputValues: s.outputValues,
          artifacts: s.artifacts,
        })),
      }));
      // Installing new files does not change the version cached by the already running old process.
      writeFileSync(releasePath, current);
      assert.equal(
        (await (await fetch(url + '/api/health')).json()).version,
        '2026.10.12.1722',
      );
      // If the snapshot backup cannot be written, leave the original server running.
      writeFileSync(join(directory, 'backups'), 'blocked destination');
      await assert.rejects(cli('up'), /EEXIST|ENOTDIR/);
      assert.equal(
        (await (await fetch(url + '/api/health')).json()).version,
        '2026.10.12.1722',
      );
      assert.equal((await client.get(running.id)).steps[0].status, 'running');
      rmSync(join(directory, 'backups'));
      const [next, concurrent] = await Promise.all([cli('up'), cli('up')]);
      for (const r of [next, concurrent]) if (r.pid) pids.add(r.pid);
      assert.equal([next, concurrent].filter((r) => r.started).length, 1);
      assert.equal(
        (await (await fetch(url + '/api/health')).json()).version,
        JSON.parse(current).version,
      );
      assert.equal(
        readFileSync(join(directory, 'credentials.json'), 'utf8'),
        originalCredentials,
      );
      for (const expected of saved) {
        const actual = await client.get(expected.id);
        assert.deepEqual(
          {
            id: actual.id,
            status: actual.status,
            revision: actual.revision,
            events: actual.events,
            steps: actual.steps.map((s) => ({
              id: s.id,
              status: s.status,
              attempt: s.attempt,
              outputValues: s.outputValues,
              artifacts: s.artifacts,
            })),
          },
          expected,
        );
      }
      const after = await client.get(parent.id);
      assert.equal(after.links.next[0].id, child.id);
      const token = JSON.parse(originalCredentials).agentToken;
      const download = await fetch(
        `${url}/api/runs/${parent.id}/artifacts/${after.steps[0].artifacts[0].id}`,
        { headers: { authorization: `Bearer ${token}` } },
      );
      assert.deepEqual(Buffer.from(await download.arrayBuffer()), bytes);
      assert.equal(
        (await client.command(parent.id, command)).revision,
        parent.revision,
      );
      assert.equal(
        readdirSync(join(directory, 'backups')).filter((n) =>
          n.endsWith('.sqlite'),
        ).length,
        1,
      );
      // A downgraded launcher must never stop the newer service.
      writeFileSync(
        releasePath,
        JSON.stringify({ version: '2026.10.12.1722', channel: 'preview' }),
      );
      await assert.rejects(cli('up'), /newer|new version|más reciente/i);
      assert.equal((await client.get(running.id)).steps[0].status, 'running');
    } finally {
      for (const pid of pids)
        try {
          process.kill(pid, 'SIGTERM');
        } catch {}
      await new Promise((r) => setTimeout(r, 300));
      rmSync(home, {
        recursive: true,
        force: true,
        maxRetries: 20,
        retryDelay: 100,
      });
    }
  },
);
