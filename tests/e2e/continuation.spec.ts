import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { HyperionClient } from '../../src/adapters/client';
import { dispatchOnce } from '../../src/adapters/continuation-worker';

test('a suspended harness receives a canvas decision and executes without a second chat message', async ({
  page,
}) => {
  const client = new HyperionClient({
    url: 'http://127.0.0.1:4318',
    token: JSON.parse(readFileSync('.hyperion-e2e/credentials.json', 'utf8'))
      .agentToken,
  });
  const run = await client.create({
    title: 'Pausa persistente',
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
        inputs: [
          {
            name: 'destination',
            type: 'string',
            required: true,
            source: { stepId: 'input', output: 'destination' },
          },
        ],
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
  await client.suspend(run.id, {
    expectedRevision: run.revision,
    connector: {
      id: 'test-bridge',
      harness: 'independent-tool',
      sessionId: 'fixture-session',
      scope: 'managed-session',
      capabilities: { resume: true, idempotentDelivery: true },
    },
  });
  await expect(page.locator('.decision-return')).toContainText(
    'Pausa guardada',
  );
  expect((await client.get(run.id)).agentWaiting).toBe(false);
  await page
    .getByRole('combobox', { name: 'Destino', exact: true })
    .selectOption('guide');
  await page
    .getByRole('button', { name: 'Guardar elección', exact: true })
    .click();
  await expect(page.locator('.canvas-next')).toContainText(
    'Reanudación pendiente',
  );
  // Synthetic connector: protocol proof, not a native harness certification.
  let value: unknown;
  await dispatchOnce(client, {
    id: 'test-bridge',
    async resume(_delivery, current) {
      value = current.steps[1]!.inputValues!.destination;
      return { outcome: 'accepted' };
    },
  });
  await expect(page.locator('.canvas-next')).toContainText(
    'Solicitud entregada al agente',
  );
  const started = await client.command(run.id, {
    type: 'start',
    stepId: 'work',
  });
  await client.command(run.id, {
    type: 'complete',
    stepId: 'work',
    attempt: started.steps[1]!.attempt,
    message: 'Documento de prueba construido con la elección guardada',
    outputs: { result: `Destino: ${value}` },
  });
  await expect(
    page.getByRole('button', {
      name: 'Ver paso: Revisar resultado',
      exact: true,
    }),
  ).toContainText('Tu turno');
  expect((await client.get(run.id)).steps[1]!.outputValues!.result).toBe(
    'Destino: guide',
  );
});

test('a saved decision without an executor explains the handoff instead of suggesting automatic progress', async ({
  page,
}) => {
  const client = new HyperionClient({
    url: 'http://127.0.0.1:4318',
    token: JSON.parse(readFileSync('.hyperion-e2e/credentials.json', 'utf8'))
      .agentToken,
  });
  const run = await client.create({
    title: 'Respuesta sin conector',
    steps: [
      {
        id: 'input',
        title: 'Tu decisión',
        kind: 'manual',
        outputs: [
          {
            name: 'product',
            type: 'string',
            required: true,
            form: {
              label: 'Producto',
              options: [{ value: 'idea', label: 'IntelliJ IDEA' }],
            },
          },
        ],
      },
      {
        id: 'work',
        title: 'Comprobar equipo',
        kind: 'agent',
        dependencies: ['input'],
      },
    ],
  });
  await page.goto(`/?run=${run.id}`);
  await page
    .getByRole('button', { name: 'Ver paso: Tu decisión', exact: true })
    .click();
  await page
    .getByRole('combobox', { name: 'Producto', exact: true })
    .selectOption('idea');
  await page
    .getByRole('button', { name: 'Guardar elección', exact: true })
    .click();
  await expect(
    page.getByText(
      'Elección guardada. Este flujo continúa desde el chat; no tiene reanudación automática.',
      { exact: true },
    ),
  ).toBeVisible();
  await expect(page.locator('.canvas-next')).toContainText(
    'Continuar desde el chat',
  );
  const current = await client.get(run.id);
  expect(current.steps[0]!.outputValues!.product).toBe('idea');
  expect(current.steps[1]!.attempt).toBe(0);
});
