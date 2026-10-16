import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { HyperionClient } from '../../src/adapters/client';
const token = () =>
  JSON.parse(readFileSync('.hyperion-e2e/credentials.json', 'utf8')).agentToken;

test('saving input delivers it to a waiting agent and advances without copying a prompt', async ({
  page,
}) => {
  const agent = new HyperionClient({
    url: 'http://127.0.0.1:4318',
    token: token(),
  });
  const run = await agent.create({
    title: 'Confirmación conectada',
    steps: [
      {
        id: 'input',
        title: 'Elegir destino',
        kind: 'manual',
        outputs: [
          {
            name: 'destination',
            type: 'string',
            required: true,
            form: {
              label: 'Destino',
              options: [{ value: 'guide', label: 'Guía' }],
            },
          },
        ],
      },
      {
        id: 'work',
        title: 'Preparar resultado',
        kind: 'agent',
        dependencies: ['input'],
        outputs: [{ name: 'result', type: 'string', required: true }],
      },
      {
        id: 'review',
        title: 'Revisar resultado',
        kind: 'approval',
        dependencies: ['work'],
      },
    ],
  });
  await page.goto(`/?run=${run.id}`);
  await page
    .getByRole('button', { name: 'Ver paso: Elegir destino', exact: true })
    .click();
  await expect(page.locator('.decision-return')).toContainText(
    'No hay un agente esperando',
  );
  // A synthetic connected harness performs actual test work after receiving the human event.
  const worker = agent.wait(run.id, run.revision, 20).then(async (updated) => {
    const choice = updated.steps[0]!.outputValues!.destination;
    const started = await agent.command(run.id, {
      type: 'start',
      stepId: 'work',
    });
    await agent.command(run.id, {
      type: 'complete',
      stepId: 'work',
      attempt: started.steps[1]!.attempt,
      message: 'Resultado construido a partir de la elección',
      outputs: { result: `Destino: ${choice}` },
    });
  });
  await expect(page.locator('.decision-return')).toContainText(
    'Agente conectado',
  );
  await page
    .getByRole('combobox', { name: 'Destino', exact: true })
    .selectOption('guide');
  await page
    .getByRole('button', { name: 'Guardar elección', exact: true })
    .click();
  await worker;
  await expect(
    page.getByRole('button', {
      name: 'Ver paso: Revisar resultado',
      exact: true,
    }),
  ).toContainText('Tu turno');
  expect((await agent.get(run.id)).steps[1]!.outputValues).toEqual({
    result: 'Destino: guide',
  });
});

test('a stuck task can be recovered explicitly and retried without reopening its human input', async ({
  page,
}) => {
  const agent = new HyperionClient({
    url: 'http://127.0.0.1:4318',
    token: token(),
  });
  const run = await agent.create({
    title: 'Recuperar trabajo',
    steps: [
      { id: 'work', title: 'Preparar entrega', kind: 'agent' },
      {
        id: 'review',
        title: 'Revisión',
        kind: 'approval',
        dependencies: ['work'],
      },
    ],
  });
  await agent.command(run.id, { type: 'start', stepId: 'work' });
  await page.setViewportSize({ width: 540, height: 900 });
  await page.goto(`/?run=${run.id}`);
  await page
    .getByRole('button', { name: 'Recuperar: Preparar entrega', exact: true })
    .click();
  await expect(page.getByRole('dialog')).toContainText('no cancela');
  const { default: AxeBuilder } = await import('@axe-core/playwright');
  for (const theme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    expect(
      (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze())
        .violations,
    ).toEqual([]);
    await page.screenshot({ path: `test-results/recovery-${theme}.png` });
  }
  await page.getByRole('button', { name: 'Volver', exact: true }).click();
  expect((await agent.get(run.id)).steps[0]!.status).toBe('running');

  await page
    .getByRole('button', { name: 'Ver paso: Preparar entrega', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Recuperar tarea', exact: true })
    .click();
  await expect(page.getByRole('dialog')).toContainText('no cancela');
  await page
    .getByRole('button', { name: 'Confirmar recuperación', exact: true })
    .click();
  expect((await agent.get(run.id)).steps[0]!.status).toBe('ready');
  const state = await agent.get(run.id);
  const waiting = agent.wait(run.id, state.revision, 10);
  await expect
    .poll(async () => (await agent.get(run.id)).agentWaiting)
    .toBe(true);
  await page
    .getByRole('button', { name: 'Reintentar: Preparar entrega', exact: true })
    .click();
  const retried = await waiting;
  expect(retried.revision).toBeGreaterThan(state.revision);
  expect(retried.steps[0]!.status).toBe('ready');
  expect(retried.events.filter((e) => e.type === 'retry')).toHaveLength(2);
});

test('the installed skill keeps creation alive until a dropdown answer reaches the host', async ({
  page,
}) => {
  const { mkdtempSync, writeFileSync, rmSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join, resolve } = await import('node:path');
  const { spawn } = await import('node:child_process');
  const { installSkill } = await import('../../src/adapters/install');
  const directory = mkdtempSync(join(tmpdir(), 'hyperion-guided-browser-'));
  const agent = new HyperionClient({
    url: 'http://127.0.0.1:4318',
    token: token(),
  });
  const installed = installSkill({
    home: directory,
    destination: join(directory, 'skills'),
    directory: resolve('.hyperion-e2e'),
    url: 'http://127.0.0.1:4318',
  });
  const plan = {
    title: 'Elegir aplicación',
    steps: [
      {
        id: 'choose',
        title: 'Elegir producto',
        kind: 'manual',
        interaction: {
          question: '¿Qué aplicación quieres usar?',
          context: 'Elige una opción.',
          next: 'Prepararemos una confirmación de tu elección.',
        },
        outputs: [
          {
            name: 'product',
            type: 'string',
            required: true,
            description: 'Producto',
            form: {
              options: [
                { value: 'idea', label: 'IntelliJ IDEA' },
                { value: 'pycharm', label: 'PyCharm' },
                { value: 'help', label: 'Necesito ayuda' },
              ],
            },
          },
        ],
      },
      {
        id: 'work',
        title: 'Preparar confirmación',
        kind: 'agent',
        dependencies: ['choose'],
        inputs: [
          {
            name: 'product',
            type: 'string',
            required: true,
            source: { stepId: 'choose', output: 'product' },
          },
        ],
        outputs: [{ name: 'result', type: 'string', required: true }],
      },
    ],
  };
  const file = join(directory, 'plan.json');
  writeFileSync(file, JSON.stringify(plan));
  // A cached skill still calling create also uses the new attached lifecycle.
  const child = spawn(
    process.execPath,
    [
      join(installed.paths[0]!, 'scripts/hyperion.mjs'),
      '--agent',
      'codex',
      'create',
      file,
      'browser-' + Date.now(),
    ],
    { stdio: ['ignore', 'pipe', 'pipe'] },
  );
  let stdout = '',
    stderr = '';
  child.stdout.on('data', (data) => {
    stdout += data;
  });
  child.stderr.on('data', (data) => {
    stderr += data;
  });
  const exited = new Promise<number | null>((done) => child.on('close', done));
  try {
    await expect
      .poll(() => (stdout.includes('"event":"waiting"') ? 'waiting' : stderr))
      .toBe('waiting');
    const first = JSON.parse(stdout.split('\n')[0]!);
    await page.goto(first.url);
    await page
      .getByRole('button', { name: 'Ver paso: Elegir producto', exact: true })
      .click();
    await expect(page.locator('.decision-return')).toContainText(
      'Agente conectado',
    );
    expect(child.exitCode).toBeNull();
    const select = page.getByRole('combobox', {
      name: 'Producto',
      exact: true,
    });
    await expect(select).toHaveValue('');
    await select.selectOption('pycharm');
    await page.screenshot({ path: 'test-results/guided-dropdown.png' });
    await page
      .getByRole('button', { name: 'Guardar elección', exact: true })
      .click();
    expect(await exited, stderr).toBe(0);
    const returned = JSON.parse(stdout.trim().split('\n').at(-1)!);
    expect(returned.agentNext.action).toBe('execute');
    expect(returned.steps[1].inputValues.product).toBe('pycharm');
    // This synthetic host executes a real, harmless result after its tool returns.
    const started = await agent.command(returned.id, {
      type: 'start',
      stepId: 'work',
    });
    await agent.command(returned.id, {
      type: 'complete',
      stepId: 'work',
      attempt: started.steps[1]!.attempt,
      message: 'Elección recibida por el adaptador',
      outputs: { result: `Elegiste ${returned.steps[0].outputValues.product}` },
    });
    await expect(
      page.getByRole('button', {
        name: 'Ver paso: Preparar confirmación',
        exact: true,
      }),
    ).toContainText('Completado');
    const waitingRun = await agent.create({
      title: 'Stop attached wait',
      steps: [{ id: 'answer', title: 'Answer', kind: 'manual' }],
    });
    const following = spawn(
      process.execPath,
      [
        join(installed.paths[0]!, 'scripts/hyperion.mjs'),
        '--agent',
        'codex',
        'follow',
        waitingRun.id,
      ],
      { stdio: 'ignore' },
    );
    const stopped = new Promise((done) => following.on('close', done));
    try {
      await expect
        .poll(async () => (await agent.get(waitingRun.id)).agentWaiting)
        .toBe(true);
      following.kill('SIGTERM');
      await stopped;
      await expect
        .poll(async () => (await agent.get(waitingRun.id)).agentWaiting)
        .toBe(false);
      expect((await agent.get(waitingRun.id)).steps[0]!.status).toBe('waiting');
    } finally {
      if (following.exitCode === null && following.signalCode === null)
        following.kill('SIGTERM');
      await stopped;
    }
  } finally {
    if (child.exitCode === null) child.kill('SIGTERM');
    await exited;
    rmSync(directory, { recursive: true, force: true });
  }
});
