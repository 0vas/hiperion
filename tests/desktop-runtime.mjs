import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
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
      // Register using only the bundled runtime, then launch the exact generated MCP command.
      await promisify(execFile)(
        executable,
        [
          '--input-type=module',
          '-e',
          `
        const { setupDesktopClient } = await import(${JSON.stringify(pathToFileURL(resolve(root, 'dist/adapters/desktop-setup.js')).href)});
        for (const id of ['codex', 'cursor', 'claude-desktop'])
          await setupDesktopClient(id, { home: ${JSON.stringify(home)}, directory: ${JSON.stringify(join(home, 'data'))} });
      `,
        ],
        { cwd: home, env: installEnv },
      );
      for (const id of ['codex', 'cursor', 'claude']) {
        const server = JSON.parse(
          readFileSync(
            join(home, 'data/connections', `${id}.mcp.json`),
            'utf8',
          ),
        ).mcpServers.hyperion;
        assert.equal(server.command, executable);
        assert.equal(server.env.ELECTRON_RUN_AS_NODE, '1');
        const client = new Client({
          name: 'desktop-setup-test',
          version: '1.0.0',
        });
        try {
          await client.connect(
            new StdioClientTransport({
              command: server.command,
              args: server.args,
              env: { ...installEnv, ...server.env },
              stderr: 'pipe',
            }),
          );
          assert.ok(
            (await client.listTools()).tools.some(
              (tool) => tool.name === 'hyperion_create_run',
            ),
          );
          const listed = await client.callTool({
            name: 'hyperion_list_runs',
            arguments: {},
          });
          assert.notEqual(listed.isError, true);
        } finally {
          await client.close();
        }
      }
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
