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
  expect(bounds.x).toBe(0);
  expect(bounds.y).toBe(0);
  expect(bounds.width).toBe(1440);
  expect(bounds.height).toBe(900);
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
  await expect(page.getByRole('dialog').locator('button').last()).toBeFocused();
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

test('BPMN nodes expose typed inputs/outputs and public traces through their own icons', async ({
  page,
  request,
}) => {
  const plan = JSON.parse(readFileSync('examples/process-review.json', 'utf8'));
  const headers = { authorization: `Bearer ${token()}` };
  const response = await request.post('/api/runs', {
    headers,
    data: { commandId: crypto.randomUUID(), plan },
  });
  expect(response.status()).toBe(201);
  const run = await response.json();
  await page.goto(`/?run=${run.id}`);
  await expect(
    page.getByRole('button', { name: 'Ver paso: Inicio', exact: true }),
  ).toBeVisible();
  await expect(page.locator('.bpmn-gateway')).toHaveCount(2);
  await page
    .getByRole('button', { name: 'Ver datos: Elegir revisiones', exact: true })
    .click();
  await expect(
    page.getByRole('dialog', { name: 'Entradas y salidas' }),
  ).toContainText('boolean');
  await page.keyboard.press('Escape');
  await page
    .getByRole('button', { name: 'Ver paso: Elegir revisiones', exact: true })
    .click();
  await expect(page.locator('#human-answer')).toHaveCount(0);
  const { default: AxeBuilder } = await import('@axe-core/playwright');
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.locator('#output-docs').selectOption('true');
  await page.locator('#output-code').selectOption('false');
  await page.getByRole('button', { name: 'Guardar elección' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('.react-flow__node[data-id="code"]')).toContainText(
    'Omitido',
  );
  await page
    .getByRole('button', {
      name: 'Ver datos: Revisar documentación',
      exact: true,
    })
    .click();
  await expect(page.getByRole('dialog')).toContainText('Hyperion');
  await page.keyboard.press('Escape');
  const command = async (data: Record<string, unknown>) =>
    request.post(`/api/runs/${run.id}/commands`, {
      headers,
      data: { commandId: crypto.randomUUID(), stepId: 'docs', ...data },
    });
  expect((await command({ type: 'start' })).status()).toBe(200);
  expect(
    (
      await command({
        type: 'log',
        message: 'Lectura de README',
        trace: { kind: 'action', tool: 'read_file' },
      })
    ).status(),
  ).toBe(200);
  expect(
    (
      await command({
        type: 'complete',
        message: 'Guía comprobada',
        outputs: { report: 'README y CONTRIBUTING revisados' },
      })
    ).status(),
  ).toBe(200);
  await page
    .getByRole('button', {
      name: 'Ver trazas: Revisar documentación',
      exact: true,
    })
    .click();
  await expect(
    page.getByRole('dialog', { name: 'Trazas del paso' }),
  ).toContainText('read_file');
  await expect(page.getByRole('dialog')).toContainText('Lectura de README');
  await page.screenshot({ path: 'test-results/process-traces.png' });
  await page.keyboard.press('Escape');
  await page
    .getByRole('button', {
      name: 'Ver datos: Aprobar la revisión',
      exact: true,
    })
    .click();
  await expect(page.getByRole('dialog')).toContainText(
    'README y CONTRIBUTING revisados',
  );
  await page.keyboard.press('Escape');
  await page
    .getByRole('button', { name: 'Ver paso: Aprobar la revisión', exact: true })
    .click();
  await page.getByRole('button', { name: 'Aprobar paso', exact: true }).click();
  await expect(page.getByTestId('run-status')).toHaveText('Completado');
  await page.screenshot({ path: 'test-results/process-canvas.png' });
});

test('the canvas renders start/end and all three gateway symbols together', async ({
  page,
  request,
}) => {
  const response = await request.post('/api/runs', {
    headers: { authorization: `Bearer ${token()}` },
    data: {
      commandId: crypto.randomUUID(),
      plan: JSON.parse(readFileSync('examples/process-gateways.json', 'utf8')),
    },
  });
  expect(response.status()).toBe(201);
  const run = await response.json();
  await page.goto(`/?run=${run.id}`);
  await expect(page.locator('.bpmn-gateway')).toHaveCount(6);
  await expect(page.locator('.bpmn-event')).toHaveCount(2);
  await page
    .getByRole('button', { name: 'Ver datos: Definir el alcance', exact: true })
    .click();
  await expect(page.getByRole('dialog')).toContainText('docs');
  await page.keyboard.press('Escape');
  await page.screenshot({ path: 'test-results/process-gateways.png' });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByRole('button', { name: 'Enfocar paso actual' }).click();
  const scope = page.locator('.react-flow__node[data-id="scope"]');
  await expect
    .poll(async () => (await scope.boundingBox())!.width)
    .toBeGreaterThan(270);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.screenshot({ path: 'test-results/process-focus.png' });
});

test('follow tracks the next task, manual navigation releases it, and any task can be focused', async ({
  page,
  request,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const headers = { authorization: `Bearer ${token()}` };
  const response = await request.post('/api/runs', {
    headers,
    data: {
      commandId: crypto.randomUUID(),
      plan: {
        title: 'Seguir mi tarea',
        steps: [
          { id: 'a', title: 'Revisar archivos', kind: 'agent' },
          {
            id: 'b',
            title: 'Elegir siguiente acción',
            kind: 'manual',
            dependencies: ['a'],
          },
          {
            id: 'c',
            title: 'Entregar resultado',
            kind: 'agent',
            dependencies: ['b'],
          },
        ],
      },
    },
  });
  const run = await response.json();
  await page.goto(`/?run=${run.id}`);
  const follow = page.getByRole('button', {
    name: 'Seguir actividad',
    exact: true,
  });
  await follow.click();
  await expect(follow).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByLabel('Ir a tarea')).toHaveValue('a');
  const command = async (type: string, message: string) => {
    expect(
      (
        await request.post(`/api/runs/${run.id}/commands`, {
          headers,
          data: { type, stepId: 'a', message, commandId: crypto.randomUUID() },
        })
      ).ok(),
    ).toBeTruthy();
  };
  await command('start', 'Revisión iniciada');
  await expect(page.getByLabel('Ir a tarea')).toContainText('En curso');
  const camera = await page
    .locator('.react-flow__viewport')
    .getAttribute('style');
  await command('log', 'Inspección registrada');
  await page.getByRole('button', { name: 'Logs de la tarea enfocada' }).click();
  await expect(page.getByRole('dialog')).toContainText('Inspección registrada');
  expect(
    await page.locator('.react-flow__viewport').getAttribute('style'),
  ).toBe(camera);
  await command('complete', 'Archivos revisados');
  await expect(page.getByRole('dialog')).toContainText('Archivos revisados');
  expect(
    await page.locator('.react-flow__viewport').getAttribute('style'),
  ).toBe(camera);
  await page.keyboard.press('Escape');
  await expect(page.getByLabel('Ir a tarea')).toHaveValue('b');
  const box = (await page
    .locator('.react-flow__node[data-id="b"]')
    .boundingBox())!;
  expect(box.width).toBeGreaterThan(270);
  await page
    .getByRole('button', { name: 'Datos de la tarea enfocada' })
    .click();
  await expect(
    page.getByRole('dialog', { name: 'Entradas y salidas' }),
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await page.mouse.move(1000, 450);
  await page.mouse.down();
  await page.mouse.move(1080, 480, { steps: 5 });
  await page.mouse.up();
  await expect(follow).toHaveAttribute('aria-pressed', 'false');
  await page.getByLabel('Ir a tarea').selectOption('a');
  await expect(page.getByLabel('Ir a tarea')).toHaveValue('a');
  await page.getByRole('button', { name: 'Abrir tarea enfocada' }).click();
  await expect(
    page.getByRole('dialog', { name: 'Revisar archivos' }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Enfocar tarea', exact: true })
    .click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page
    .getByRole('button', { name: 'Vista general', exact: true })
    .click();
  await expect(follow).toHaveAttribute('aria-pressed', 'false');
  await page.getByRole('button', { name: 'Guía de uso', exact: true }).click();
  await expect(
    page.getByRole('dialog', { name: 'De la conversación al flujo' }),
  ).toContainText('Seguir actividad');
  await page.keyboard.press('Escape');
  await page.screenshot({ path: 'test-results/task-follow.png' });
  await follow.click();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(follow).toHaveAttribute('aria-pressed', 'true');
  const mobileTask = page.locator('.react-flow__node[data-id="b"]');
  await expect
    .poll(async () => (await mobileTask.boundingBox())!.width)
    .toBeGreaterThan(270);
  const mobileBox = (await mobileTask.boundingBox())!;
  expect(mobileBox.y).toBeGreaterThan(240);
  expect(mobileBox.y + mobileBox.height).toBeLessThan(620);
  await page.screenshot({ path: 'test-results/task-follow-mobile.png' });
  const { default: AxeBuilder } = await import('@axe-core/playwright');
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.getByRole('button', { name: 'Guía de uso', exact: true }).click();
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
});

test('following survives a paused agent completion and resumes on the next task', async ({
  page,
  request,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const headers = { authorization: `Bearer ${token()}` };
  const response = await request.post('/api/runs', {
    headers,
    data: {
      commandId: crypto.randomUUID(),
      plan: {
        title: 'Pausa de seguimiento',
        steps: [
          { id: 'work', title: 'Comprobar cambios', kind: 'agent' },
          {
            id: 'review',
            title: 'Validar cambios',
            kind: 'approval',
            dependencies: ['work'],
          },
        ],
      },
    },
  });
  const run = await response.json();
  const command = async (type: string) =>
    request.post(`/api/runs/${run.id}/commands`, {
      headers,
      data: {
        type,
        stepId: 'work',
        message: 'Cambios comprobados',
        commandId: crypto.randomUUID(),
      },
    });
  expect((await command('start')).ok()).toBeTruthy();
  await page.goto(`/?run=${run.id}`);
  const follow = page.getByRole('button', {
    name: 'Seguir actividad',
    exact: true,
  });
  await follow.click();
  await expect(page.getByLabel('Ir a tarea')).toHaveValue('work');
  await page.getByRole('button', { name: 'Pausar', exact: true }).click();
  await expect(page.getByTestId('run-status')).toHaveText('En pausa');
  const camera = await page
    .locator('.react-flow__viewport')
    .getAttribute('style');
  expect((await command('complete')).ok()).toBeTruthy();
  await expect(page.locator('.react-flow__node[data-id="work"]')).toContainText(
    'Completado',
  );
  await expect(follow).toHaveAttribute('aria-pressed', 'true');
  expect(
    await page.locator('.react-flow__viewport').getAttribute('style'),
  ).toBe(camera);
  await page.getByRole('button', { name: 'Reanudar', exact: true }).click();
  await expect(page.getByLabel('Ir a tarea')).toHaveValue('review');
  await expect(follow).toHaveAttribute('aria-pressed', 'true');
});

test('jobs, concrete decisions and preferences work from a conversation-generated plan', async ({
  page,
  request,
}) => {
  const response = await request.post('/api/runs', {
    headers: { authorization: `Bearer ${token()}` },
    data: {
      commandId: crypto.randomUUID(),
      plan: {
        title: 'Preparar mi guía de Hyperion',
        request: 'Usa Hyperion para preparar mi guía con ejemplos.',
        jobs: [
          { id: 'preferences', title: 'Personalizar guía' },
          { id: 'writing', title: 'Redactar guía' },
        ],
        steps: [
          {
            id: 'examples',
            jobId: 'preferences',
            title: 'Elegir ejemplos',
            kind: 'manual',
            interaction: {
              question: '¿Incluimos ejemplos de peticiones?',
              context: 'La guía se adaptará a tu elección.',
              next: 'Codex redactará la guía con el formato elegido.',
            },
            outputs: [
              {
                name: 'examples',
                type: 'boolean',
                required: true,
                description: 'Incluir ejemplos de peticiones',
              },
            ],
          },
          {
            id: 'write',
            jobId: 'writing',
            title: 'Escribir la guía',
            kind: 'agent',
            dependencies: ['examples'],
          },
          {
            id: 'verify',
            jobId: 'writing',
            title: 'Comprobar la guía',
            kind: 'agent',
            dependencies: ['write'],
          },
        ],
      },
    },
  });
  expect(response.status()).toBe(201);
  const run = await response.json();
  await page.goto(`/?run=${run.id}`);
  await page.getByRole('button', { name: 'Ajustes', exact: true }).click();
  await page.getByLabel('Tema', { exact: true }).selectOption('dark');
  await page.getByLabel('Reducir movimiento').check();
  await page.getByLabel('Seguir al abrir un flujo').check();
  await page.getByLabel('Vista del flujo').selectOption('jobs');
  await page.keyboard.press('Escape');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(
    page.getByRole('button', { name: 'Seguir actividad' }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.job-node')).toHaveCount(2);
  const { default: CanvasAxe } = await import('@axe-core/playwright');
  expect(
    (
      await new CanvasAxe({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.screenshot({ path: 'test-results/jobs-dark.png' });
  await page
    .getByRole('button', { name: 'Ver pasos: Personalizar guía' })
    .click();
  await expect(
    page.getByRole('button', { name: 'Ver paso: Elegir ejemplos' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Ver paso: Elegir ejemplos' }).click();
  await expect(
    page.getByText('¿Incluimos ejemplos de peticiones?', { exact: true }),
  ).toBeVisible();
  await expect(page.locator('#human-answer')).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Guardar elección' }),
  ).toBeDisabled();
  await page.getByLabel('Incluir ejemplos de peticiones').selectOption('true');
  await expect(page.locator('.decision-next')).toContainText(
    'Codex redactará la guía con el formato elegido.',
  );
  const { default: AxeBuilder } = await import('@axe-core/playwright');
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.screenshot({ path: 'test-results/decision-dark.png' });
  await page.getByRole('button', { name: 'Guardar elección' }).click();
  await expect(
    page.getByRole('status').filter({ hasText: 'Elección guardada' }),
  ).toBeVisible();
  const updated = await (
    await request.get(`/api/runs/${run.id}`, {
      headers: { authorization: `Bearer ${token()}` },
    })
  ).json();
  expect(updated.steps[0].outputValues).toEqual({ examples: true });
  expect(updated.steps[1].status).toBe('ready');
  await page.getByLabel('Ir a tarea').selectOption('examples');
  for (const name of [
    'Datos de la tarea enfocada',
    'Logs de la tarea enfocada',
  ]) {
    await page.getByRole('button', { name, exact: true }).click();
    expect(
      (
        await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
          .analyze()
      ).violations,
    ).toEqual([]);
    await page.keyboard.press('Escape');
  }

  await page.getByRole('button', { name: 'Ajustes', exact: true }).click();
  await expect(page.getByLabel('Reducir movimiento')).toBeChecked();
  await page.getByLabel('Tema', { exact: true }).selectOption('light');
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.screenshot({ path: 'test-results/settings-mobile.png' });
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Guía de uso' })).toBeVisible();
});
