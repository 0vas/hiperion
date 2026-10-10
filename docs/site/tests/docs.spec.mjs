import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const pages = [
  '',
  'guia/primeros-pasos',
  'guia/usar-el-flujo',
  'guia/integraciones',
  'referencia/arquitectura',
  'referencia/limites',
  'contribuir',
  'despliegue',
];
test('all guides load under the Pages subpath with working internal links and no local service', async ({
  page,
  request,
}) => {
  const failures = [];
  page.on('pageerror', (error) => failures.push(error.message));
  page.on('response', (response) => {
    if (response.status() >= 400) failures.push(response.url());
  });
  page.on('request', (request) => {
    if (new URL(request.url()).port === '4317')
      failures.push('Documentation accessed the local application');
  });
  const links = new Set();
  for (const path of pages) {
    const response = await page.goto(`/hiperion/${path}${path ? '.html' : ''}`);
    expect(response.status()).toBe(200);
    await expect(page.locator('h1')).toBeVisible();
    for (const href of await page
      .locator('a[href]')
      .evaluateAll((anchors) => anchors.map((a) => a.href))) {
      const url = new URL(href);
      if (url.origin !== 'http://127.0.0.1:4175') continue;
      expect(url.pathname).toMatch(/^\/hiperion\//);
      if (url.pathname === new URL(page.url()).pathname && url.hash)
        expect(
          await page
            .locator(
              `[id=${JSON.stringify(decodeURIComponent(url.hash.slice(1)))}]`,
            )
            .count(),
        ).toBeGreaterThan(0);
      url.hash = '';
      links.add(url.href);
    }
  }
  for (const href of links)
    expect((await request.get(href)).status(), href).toBe(200);
  expect(failures).toEqual([]);
});

test('a new reader can find setup and search for retry', async ({ page }) => {
  await page.goto('/hiperion/');
  await page.getByRole('link', { name: 'Empezar', exact: true }).click();
  await expect(page.locator('h1')).toHaveText('Tu primer flujo');
  await expect(
    page.getByRole('link', { name: 'Descargar Hyperion Desktop', exact: true }),
  ).toHaveAttribute('href', /releases\/tag\/v0.4.0-preview.1/);
  await page.getByRole('button', { name: /Buscar/ }).click();
  await page.locator('#localsearch-input').fill('Reintentar');
  await expect(page.locator('.VPLocalSearchBox a').first()).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#localsearch-input')).not.toBeVisible();
});

test('mobile navigation and reading remain accessible in both themes', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const theme of ['light', 'dark']) {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
    for (const path of ['', 'guia/primeros-pasos.html']) {
      await page.goto(`/hiperion/${path}`);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
      expect(
        (
          await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
            .analyze()
        ).violations,
      ).toEqual([]);
      await page.screenshot({
        path: `../../test-results/docs/${theme}-${path ? 'guide' : 'home'}.png`,
        fullPage: true,
      });
    }
  }
  await page.getByRole('button', { name: /Navegación móvil/ }).click();
  await page.getByRole('link', { name: 'Guía', exact: true }).click();
  await expect(page.locator('h1')).toHaveText('Tu primer flujo');
});
