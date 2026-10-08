import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
const token = () =>
  JSON.parse(readFileSync('.hyperion-e2e/credentials.json', 'utf8'))
    .agentToken as string;

test('an agent creates a workflow; the human supplies input and approves; the agent resumes', async ({
  page,
  request,
}) => {
  const headers = { authorization: `Bearer ${token()}` };
  const created = await request.post('/api/runs', {
    headers,
    data: {
      commandId: crypto.randomUUID(),
      plan: {
        title: 'Prueba funcional con Codex',
        description: 'A real human handoff',
        steps: [
          { id: 'inspect', title: 'Inspeccionar proyecto', kind: 'agent' },
          {
            id: 'human',
            title: 'Elegir el objetivo',
            kind: 'manual',
            dependencies: ['inspect'],
          },
          {
            id: 'gate',
            title: 'Aprobar el siguiente paso',
            kind: 'approval',
            dependencies: ['human'],
          },
          {
            id: 'finish',
            title: 'Preparar resultado',
            kind: 'agent',
            dependencies: ['gate'],
          },
        ],
      },
    },
  });
  expect(created.status()).toBe(201);
  const run = await created.json();
  const command = async (type: string, stepId: string) =>
    request.post(`/api/runs/${run.id}/commands`, {
      headers,
      data: {
        type,
        stepId,
        message: 'Evidencia de la prueba automatizada',
        commandId: crypto.randomUUID(),
      },
    });
  await command('start', 'inspect');
  await command('complete', 'inspect');
  await page.goto(`/?run=${run.id}`);
  await expect(
    page.getByRole('heading', { name: 'Prueba funcional con Codex' }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Ver paso: Elegir el objetivo' })
    .click();
  await page
    .getByLabel('Tu respuesta')
    .fill('Quiero preparar una guía de contribución.');
  await page.getByRole('button', { name: 'Enviar respuesta' }).click();
  await page
    .getByRole('button', { name: 'Ver paso: Aprobar el siguiente paso' })
    .click();
  await page.getByRole('button', { name: 'Aprobar paso' }).click();
  await expect(
    page.getByText('Listo para que Codex continúe', { exact: true }),
  ).toBeVisible();
  await page.reload();
  await page
    .getByRole('button', { name: 'Ver paso: Elegir el objetivo' })
    .click();
  await expect(
    page
      .getByText('Quiero preparar una guía de contribución.', { exact: true })
      .first(),
  ).toBeVisible();
  expect((await command('start', 'finish')).status()).toBe(200);
  expect((await command('complete', 'finish')).status()).toBe(200);
  await expect(page.getByTestId('run-status')).toHaveText('Completado');
  await page.screenshot({
    path: 'test-results/workflow-desktop.png',
    fullPage: true,
  });
});

test('narrow viewport stays usable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByRole('banner')).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: 'test-results/workflow-mobile.png',
    fullPage: true,
  });
});

test('human handoff meets automated WCAG AA checks', async ({
  page,
  request,
}) => {
  const { default: AxeBuilder } = await import('@axe-core/playwright');
  const response = await request.post('/api/runs', {
    headers: { authorization: `Bearer ${token()}` },
    data: {
      commandId: crypto.randomUUID(),
      plan: {
        title: 'Accesibilidad del flujo',
        steps: [{ id: 'human', title: 'Definir el objetivo', kind: 'manual' }],
      },
    },
  });
  const run = await response.json();
  await page.goto(`/?run=${run.id}`);
  await expect(page.getByLabel('Tu respuesta')).toBeVisible();
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(
    results.violations.map((v) => ({
      id: v.id,
      targets: v.nodes.map((n) => n.target),
      details: v.nodes.map((n) => n.failureSummary),
    })),
  ).toEqual([]);
});

test('connection help supports keyboard dismissal and restores focus', async ({
  page,
}) => {
  await page.goto('/');
  const help = page.getByRole('button', { name: 'Ayuda de conexión' });
  await help.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Cerrar ayuda' }),
  ).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(help).toBeFocused();
});

test('an unknown run URL never silently selects a different workflow', async ({
  page,
}) => {
  await page.goto('/?run=00000000-0000-0000-0000-000000000000');
  await expect(
    page.getByRole('heading', { name: 'No encontramos ese flujo' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Aprobar paso' }),
  ).not.toBeVisible();
});
