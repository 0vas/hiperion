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
