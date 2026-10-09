import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('ribbons retain their element and clock through polling and log revisions', async ({
  page,
  request,
}) => {
  const headers = {
    authorization: `Bearer ${JSON.parse(readFileSync('.hyperion-e2e/credentials.json', 'utf8')).agentToken}`,
  };
  const response = await request.post('/api/runs', {
    headers,
    data: {
      commandId: crypto.randomUUID(),
      plan: {
        title: 'Continuous refresh',
        steps: [
          { id: 'before', title: 'Preparar', kind: 'agent' },
          {
            id: 'after',
            title: 'Procesar',
            kind: 'agent',
            dependencies: ['before'],
          },
        ],
      },
    },
  });
  expect(response.status()).toBe(201);
  const run = await response.json();
  for (const [type, stepId] of [
    ['start', 'before'],
    ['complete', 'before'],
    ['start', 'after'],
  ]) {
    const result = await request.post(`/api/runs/${run.id}/commands`, {
      headers,
      data: {
        type,
        stepId,
        message: 'Synthetic evidence',
        commandId: crypto.randomUUID(),
      },
    });
    expect(result.status()).toBe(200);
  }
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto(`/?run=${run.id}`);
  const ribbon = page.locator('[data-id="before-after"] .flow-ribbon').first();
  await expect(ribbon).toHaveCount(1);
  await expect(ribbon.locator('animate')).toHaveCount(1);
  const handle = await ribbon.elementHandle();
  const animation = await ribbon.locator('animate').elementHandle();
  const begin = await animation!.evaluate((el) =>
    (el as SVGAnimateElement).getStartTime(),
  );
  let previousTime = 0;
  // Observe more than two 6.4-second cycles with real server polling.
  for (let i = 0; i < 14; i++) {
    await page.waitForResponse(
      (r) => new URL(r.url()).pathname === '/api/runs' && r.status() === 200,
    );
    if (i === 1) {
      const logged = await request.post(`/api/runs/${run.id}/commands`, {
        headers,
        data: {
          type: 'log',
          stepId: 'after',
          message: 'A real revision without layout changes',
          commandId: crypto.randomUUID(),
        },
      });
      expect(logged.status()).toBe(200);
    }
    await expect
      .poll(() => handle!.evaluate((el) => el.isConnected))
      .toBe(true);
    expect(await animation!.evaluate((el) => el.isConnected)).toBe(true);
    const clock = await animation!.evaluate((el) => ({
      time: (el as SVGAnimateElement).getCurrentTime(),
      begin: (el as SVGAnimateElement).getStartTime(),
    }));
    expect(clock.begin).toBe(begin);
    expect(clock.time).toBeGreaterThan(previousTime);
    previousTime = clock.time;
  }
  expect(previousTime - begin).toBeGreaterThan(12.8);
  await animation!.dispose();
  await handle!.dispose();
});
