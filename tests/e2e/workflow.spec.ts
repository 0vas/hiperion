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
  await page.goto('/');
  await page.getByRole('region', { name: 'Canvas del workflow' }).waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  const node = page.getByRole('button', { name: /^Ver paso:/ }).first();
  await expect
    .poll(async () => {
      const box = await node.boundingBox();
      return Boolean(box && box.x >= 0 && box.x + box.width <= 390);
    })
    .toBeTruthy();
  await node.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.screenshot({ path: 'test-results/canvas-mobile-popup.png' });
  await page.keyboard.press('Escape');
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
  const canvasAccessibility = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(canvasAccessibility.violations).toEqual([]);
  await page
    .getByRole('button', { name: 'Ver paso: Definir el objetivo' })
    .click();
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

test('request-derived plans flow top to bottom with parallel branches and retain the original request', async ({
  page,
  request,
}) => {
  const original =
    'Usa Hyperion para revisar un proyecto: pregúntame el alcance, revisa documentación y pruebas en paralelo, y pide mi aprobación.';
  const response = await request.post('/api/runs', {
    headers: { authorization: `Bearer ${token()}` },
    data: {
      commandId: crypto.randomUUID(),
      plan: {
        title: 'Plan generado desde una petición',
        request: original,
        steps: [
          { id: 'scope', title: 'Definir alcance', kind: 'manual' },
          {
            id: 'docs',
            title: 'Revisar documentación',
            kind: 'agent',
            dependencies: ['scope'],
          },
          {
            id: 'tests',
            title: 'Revisar pruebas',
            kind: 'agent',
            dependencies: ['scope'],
          },
          {
            id: 'approve',
            title: 'Aprobar propuesta',
            kind: 'approval',
            dependencies: ['docs', 'tests'],
          },
        ],
      },
    },
  });
  expect(response.status()).toBe(201);
  const run = await response.json();
  await page.goto(`/?run=${run.id}`);
  await expect(page.getByText('Flujo vertical', { exact: true })).toBeVisible();
  await page.getByText('Petición original', { exact: true }).click();
  await expect(page.getByText(original, { exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  const bounds = async (name: string) =>
    (await page
      .getByRole('button', { name: `Ver paso: ${name}` })
      .boundingBox())!;
  const scope = await bounds('Definir alcance');
  const docs = await bounds('Revisar documentación');
  const tests = await bounds('Revisar pruebas');
  const approval = await bounds('Aprobar propuesta');
  expect(docs.y).toBeGreaterThan(scope.y + scope.height);
  expect(Math.abs(docs.y - tests.y)).toBeLessThan(2);
  expect(approval.y).toBeGreaterThan(docs.y + docs.height);
  await page.screenshot({
    path: 'test-results/request-vertical.png',
    fullPage: true,
  });
});

test('the workflow is a landscape canvas with information and human actions in accessible popups', async ({
  page,
  request,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const response = await request.post('/api/runs', {
    headers: { authorization: `Bearer ${token()}` },
    data: {
      commandId: crypto.randomUUID(),
      plan: {
        title: 'Canvas desde Codex',
        request: 'Codex, guía mi revisión en un solo canvas.',
        steps: [
          { id: 'input', title: 'Compartir observaciones', kind: 'manual' },
          {
            id: 'approval',
            title: 'Confirmar resultado',
            kind: 'approval',
            dependencies: ['input'],
          },
        ],
      },
    },
  });
  const run = await response.json();
  await page.goto(`/?run=${run.id}`);
  const canvas = page.getByRole('region', { name: 'Canvas del workflow' });
  await expect(canvas).toBeVisible();
  const bounds = (await canvas.boundingBox())!;
  expect(bounds.width).toBeGreaterThan(1440 * 0.9);
  expect(bounds.height).toBeGreaterThan(900 * 0.75);
  expect(bounds.width).toBeGreaterThan(bounds.height);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByLabel('Tu respuesta')).toHaveCount(0);
  await page
    .getByRole('button', { name: 'Petición original', exact: true })
    .click();
  await expect(
    page.getByRole('dialog', { name: 'Petición original' }),
  ).toContainText('Codex, guía mi revisión');
  await page.keyboard.press('Escape');
  await expect(
    page.getByRole('button', { name: 'Petición original', exact: true }),
  ).toBeFocused();
  const node = page.getByRole('button', {
    name: 'Ver paso: Compartir observaciones',
  });
  await node.click();
  await expect(
    page.getByRole('dialog', { name: 'Compartir observaciones' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Cerrar popup' }),
  ).toBeFocused();
  await page
    .getByLabel('Tu respuesta')
    .fill('El canvas funciona y mantiene mi contexto.');
  await page.getByRole('button', { name: 'Cerrar popup' }).focus();
  await page.keyboard.press('Shift+Tab');
  await expect(
    page.getByRole('button', { name: 'Enviar respuesta' }),
  ).toBeFocused();
  await page.getByRole('button', { name: 'Enviar respuesta' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(node).toBeFocused();
  await page
    .getByRole('button', { name: 'Ver paso: Confirmar resultado' })
    .click();
  await expect(
    page.getByRole('dialog', { name: 'Confirmar resultado' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Aprobar paso', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByTestId('run-status')).toHaveText('Completado');
  await page.getByRole('button', { name: 'Actividad', exact: true }).click();
  await expect(
    page.getByRole('dialog', { name: 'Historial del flujo' }),
  ).toContainText('El canvas funciona');
  await page.keyboard.press('Escape');
  await page.reload();
  await expect(page.getByTestId('run-status')).toHaveText('Completado');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollHeight <= innerHeight,
    ),
  ).toBeTruthy();
  await page.screenshot({ path: 'test-results/canvas-landscape.png' });
});

test('rejection stays in the canvas popup and reports command errors before retrying', async ({
  page,
  request,
}) => {
  const response = await request.post('/api/runs', {
    headers: { authorization: `Bearer ${token()}` },
    data: {
      commandId: crypto.randomUUID(),
      plan: {
        title: 'Revisar y rechazar',
        steps: [{ id: 'gate', title: 'Revisar propuesta', kind: 'approval' }],
      },
    },
  });
  const run = await response.json();
  await page.goto(`/?run=${run.id}`);
  await page
    .getByRole('button', { name: 'Ver paso: Revisar propuesta' })
    .click();
  await page
    .getByRole('button', { name: 'Rechazar y detener este flujo' })
    .click();
  await expect(page.getByRole('dialog')).toHaveCount(1);
  await page
    .getByLabel('Motivo del rechazo')
    .fill('Falta evidencia de la propuesta.');
  await page.route(`**/api/runs/${run.id}/commands`, (route) =>
    route.fulfill({
      status: 409,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'REVISION_CONFLICT' }),
    }),
  );
  await page.getByRole('button', { name: 'Confirmar rechazo' }).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText(
    'El flujo cambió',
  );
  await expect(page.getByLabel('Motivo del rechazo')).toHaveValue(
    'Falta evidencia de la propuesta.',
  );
  await page.unroute(`**/api/runs/${run.id}/commands`);
  await page.getByRole('button', { name: 'Confirmar rechazo' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByTestId('run-status')).toHaveText('Rechazado');
});
