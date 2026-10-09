import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
const headers = () => ({
  authorization: `Bearer ${JSON.parse(readFileSync('.hyperion-e2e/credentials.json', 'utf8')).agentToken}`,
});
test('boolean routes render accessible SVG checks and crosses in both orientations', async ({
  page,
  request,
}) => {
  const plan = JSON.parse(readFileSync('examples/process-review.json', 'utf8'));
  const split = plan.steps.find((s: { id: string }) => s.id === 'split');
  split.gateway.type = 'exclusive';
  split.gateway.routes = split.gateway.routes.filter(
    (r: { target: string }) => r.target !== 'code',
  );
  plan.steps = plan.steps.filter((s: { id: string }) => s.id !== 'code');
  const join = plan.steps.find((s: { id: string }) => s.id === 'join');
  join.gateway.type = 'exclusive';
  join.dependencies = ['docs', 'fallback'];
  plan.steps.find((s: { id: string }) => s.id === 'approve').inputs = [];
  const response = await request.post('/api/runs', {
    headers: headers(),
    data: { plan, commandId: crypto.randomUUID() },
  });
  expect(response.status()).toBe(201);
  const run = await response.json();
  await page.goto(`/?run=${run.id}`);
  for (const orientation of ['vertical', 'horizontal']) {
    if (orientation === 'horizontal')
      await page.getByRole('button', { name: 'Ver flujo horizontal' }).click();
    await expect(
      page.locator('.decision-marker[data-decision="yes"]'),
    ).toHaveAttribute('aria-label', 'Sí');
    await expect(
      page.locator('.decision-marker[data-decision="no"]'),
    ).toHaveAttribute('aria-label', 'No');
    await expect(page.locator('.decision-marker svg')).toHaveCount(2);
    expect(
      await page.locator('.react-flow__edge-text').allTextContents(),
    ).not.toContain('Sí');
  }
  await page.screenshot({ path: 'test-results/decision-svg.png' });
});
test('a revised future plan arrives live, shows its diff and requires human resume', async ({
  page,
  request,
}) => {
  await page.setViewportSize({ width: 700, height: 900 });
  const plan = {
    title: 'A changing conversation',
    request: 'Prepare a guide',
    steps: [
      { id: 'first', title: 'Check context', kind: 'agent' },
      {
        id: 'future',
        title: 'Write a long guide',
        kind: 'agent',
        dependencies: ['first'],
      },
    ],
  };
  const created = await request.post('/api/runs', {
    headers: headers(),
    data: { plan, commandId: crypto.randomUUID() },
  });
  let run = await created.json();
  for (const type of ['start', 'complete'])
    run = await (
      await request.post(`/api/runs/${run.id}/commands`, {
        headers: headers(),
        data: {
          type,
          stepId: 'first',
          message: 'Context verified',
          commandId: crypto.randomUUID(),
        },
      })
    ).json();
  await page.goto(`/?run=${run.id}`);
  const revised = await request.post(`/api/runs/${run.id}/commands`, {
    headers: headers(),
    data: {
      type: 'revise',
      expectedRevision: run.revision,
      commandId: crypto.randomUUID(),
      message: 'The user prefers a checklist',
      plan: {
        ...plan,
        steps: [
          plan.steps[0],
          { ...plan.steps[1], title: 'Write a checklist' },
          {
            id: 'review',
            title: 'Review checklist',
            kind: 'approval',
            dependencies: ['future'],
          },
        ],
      },
    },
  });
  expect(revised.status()).toBe(200);
  await page
    .getByRole('button', {
      name: 'El plan cambió Revisa los cambios antes de reanudar',
    })
    .click();
  await expect(
    page.getByRole('region', { name: 'Cambios del plan' }),
  ).toContainText('Write a checklist');
  await expect(
    page.getByRole('region', { name: 'Cambios del plan' }),
  ).toContainText('Review checklist');
  await expect(
    page.getByRole('region', { name: 'Cambios del plan' }),
  ).toContainText('The user prefers a checklist');
  await page.screenshot({ path: 'test-results/plan-revision.png' });
  await page.getByRole('button', { name: 'Cerrar popup' }).click();
  await page.getByRole('button', { name: 'Más opciones', exact: true }).click();
  await page.getByRole('button', { name: 'Reanudar', exact: true }).click();
  const after = await (
    await request.get(`/api/runs/${run.id}`, { headers: headers() })
  ).json();
  expect(after.status).toBe('active');
  expect(after.steps[0].result).toBe('Context verified');
  expect(after.steps[1].status).toBe('ready');
  expect(after.planChanges).toHaveLength(1);
});
