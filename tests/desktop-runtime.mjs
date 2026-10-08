import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, dirname, join } from 'node:path';
const executable = process.env.HYPERION_DESKTOP_EXECUTABLE;
test(
  'packaged desktop starts its own service without a system Node installation',
  { skip: !executable },
  async () => {
    const home = mkdtempSync(join(tmpdir(), 'hyperion-bundled-runtime-'));
    let pid;
    try {
      const root = resolve(
        dirname(executable),
        process.platform === 'darwin' ? '../Resources/app' : 'resources/app',
      );
      const { stdout } = await promisify(execFile)(
        executable,
        [resolve(root, 'dist/adapters/cli.js'), 'up'],
        {
          cwd: home,
          timeout: 20000,
          env: {
            ...process.env,
            ELECTRON_RUN_AS_NODE: '1',
            HYPERION_HOME: home,
            HYPERION_DATA_DIR: join(home, 'data'),
            HYPERION_URL: 'http://127.0.0.1:4340',
          },
        },
      );
      const result = JSON.parse(stdout);
      pid = result.pid;
      const installEnv = {
        ...process.env,
        ELECTRON_RUN_AS_NODE: '1',
        HYPERION_HOME: home,
        HYPERION_DATA_DIR: join(home, 'data'),
        HYPERION_URL: 'http://127.0.0.1:4340',
      };
      await promisify(execFile)(
        executable,
        [
          resolve(root, 'dist/adapters/cli.js'),
          'install',
          join(home, 'skills'),
        ],
        { cwd: home, env: installEnv },
      );
      const installed = JSON.parse(
        readFileSync(join(home, 'skills/hyperion/runtime.json'), 'utf8'),
      );
      assert.equal(installed.nodeEnv.ELECTRON_RUN_AS_NODE, '1');
      assert.equal(installed.node, executable);
      assert.equal(result.started, true);
      assert.ok(pid > 0);
      const page = await fetch(result.url);
      assert.equal(page.status, 200);
      assert.match(await page.text(), /Hyperion/);
    } finally {
      if (pid) process.kill(pid, 'SIGTERM');
      rmSync(home, {
        recursive: true,
        force: true,
        maxRetries: 10,
        retryDelay: 100,
      });
    }
  },
);
