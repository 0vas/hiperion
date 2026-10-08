import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { once } from 'node:events';
import { _electron, chromium } from '@playwright/test';

test('desktop and split share one real service, decisions and agent progress', async () => {
  const home = mkdtempSync(join(tmpdir(), 'hyperion-desktop-smoke-'));
  const directory = join(home, 'data');
  const env = {
    ...process.env,
    HYPERION_HOME: home,
    HYPERION_DATA_DIR: directory,
    HYPERION_PORT: '4339',
    HYPERION_URL: 'http://127.0.0.1:4339',
  };
  const service = spawn(process.execPath, ['dist/server/main.js'], {
    cwd: process.cwd(),
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let app, browser;
  try {
    await Promise.race([
      once(service.stdout, 'data'),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Service timeout')), 8000).unref(),
      ),
    ]);
    const token = JSON.parse(
      readFileSync(join(directory, 'credentials.json'), 'utf8'),
    ).agentToken;
    const api = async (path, body) => {
      const response = await fetch(env.HYPERION_URL + path, {
        method: body ? 'POST' : 'GET',
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      assert.equal(response.ok, true, await response.clone().text());
      return response.json();
    };
    const run = await api('/api/runs', {
      commandId: crypto.randomUUID(),
      plan: {
        title: 'Mismo flujo en escritorio y split',
        steps: [
          {
            id: 'choice',
            title: 'Elegir audiencia',
            kind: 'manual',
            outputs: [
              {
                name: 'beginners',
                description: 'Incluir principiantes',
                type: 'boolean',
                required: true,
              },
            ],
          },
          {
            id: 'work',
            title: 'Preparar guía',
            kind: 'agent',
            dependencies: ['choice'],
          },
        ],
      },
    });
    const args = [
      `--hyperion-run=${run.id}`,
      `--hyperion-url=${env.HYPERION_URL}`,
      `--hyperion-directory=${directory}`,
    ];
    app = await _electron.launch({
      ...(process.env.HYPERION_DESKTOP_EXECUTABLE
        ? { executablePath: process.env.HYPERION_DESKTOP_EXECUTABLE }
        : {}),
      args: process.env.HYPERION_DESKTOP_EXECUTABLE
        ? args
        : ['desktop/main.mjs', ...args],
      env,
    });
    const page = await app.firstWindow();
    await page.getByRole('heading', { name: run.title }).waitFor();
    assert.equal(await page.evaluate(() => typeof window.require), 'undefined');
    browser = await chromium.launch();
    const split = await browser.newPage({
      viewport: { width: 540, height: 720 },
    });
    await split.goto(`${env.HYPERION_URL}/?run=${run.id}`);
    await split
      .getByRole('button', { name: 'Ver paso: Elegir audiencia', exact: true })
      .click();
    await split.getByRole('radio', { name: 'No', exact: true }).check();
    await split
      .getByRole('button', { name: 'Guardar elección', exact: true })
      .click();
    await page.locator('[data-id="work"] [data-flow-state="ready"]').waitFor();
    for (const type of ['start', 'complete'])
      await api(`/api/runs/${run.id}/commands`, {
        type,
        stepId: 'work',
        message: 'Guía preparada desde el adaptador del chat',
        commandId: crypto.randomUUID(),
      });
    await page
      .locator('[data-testid="run-status"]')
      .filter({ hasText: 'Completado' })
      .waitFor();
    await split
      .locator('[data-testid="run-status"]')
      .filter({ hasText: 'Completado' })
      .waitFor();
    const opened = await promisify(execFile)(
      process.execPath,
      ['dist/adapters/cli.js', 'open', run.id, 'desktop'],
      { cwd: process.cwd(), env },
    );
    assert.equal(JSON.parse(opened.stdout).runId, run.id);
    assert.equal(JSON.parse(opened.stdout).presentation, 'desktop');
    await page.getByRole('heading', { name: run.title }).waitFor();
    const result = await api(`/api/runs/${run.id}`);
    assert.equal(result.steps[0].outputValues.beginners, false);
    await page.screenshot({ path: 'test-results/desktop-shared.png' });
  } finally {
    await browser?.close();
    await app?.close();
    service.kill('SIGTERM');
    if (service.exitCode === null) await once(service, 'exit');
    rmSync(home, { recursive: true, force: true });
  }
});
