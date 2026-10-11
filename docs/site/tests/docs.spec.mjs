import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const pages = [
  '',
  'guia/primeros-pasos',
  'guia/usar-el-flujo',
  'guia/integraciones',
  'guia/reanudacion',
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
  for (const path of [...pages, ...pages.map((path) => `en/${path}`)]) {
    const response = await page.goto(
      `/hiperion/${path}${path && !path.endsWith('/') ? '.html' : ''}`,
    );
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
    for (const path of [
      '',
      'guia/primeros-pasos.html',
      'en/',
      'en/guia/primeros-pasos.html',
    ]) {
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
        path: `../../test-results/docs/${theme}-${path.startsWith('en/') ? 'en-' : ''}${path.includes('primeros') ? 'guide' : 'home'}.png`,
        fullPage: true,
      });
    }
  }
  await page.goto('/hiperion/guia/primeros-pasos.html');
  await page.getByRole('button', { name: /Navegación móvil/ }).click();
  await page.getByRole('link', { name: 'Guía', exact: true }).click();
  await expect(page.locator('h1')).toHaveText('Tu primer flujo');
});

test('language switch preserves the page and English search stays in English', async ({
  page,
}) => {
  await page.goto('/hiperion/referencia/arquitectura.html');
  await page.getByRole('button', { name: /Cambiar idioma/ }).click();
  await page.getByRole('link', { name: 'English', exact: true }).click();
  await expect(page).toHaveURL(/\/en\/referencia\/arquitectura.html/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('h1')).toHaveText('Architecture');
  await page
    .getByRole('button', { name: /Search/ })
    .first()
    .click();
  await page.locator('#localsearch-input').fill('Retry');
  await expect(page.locator('.VPLocalSearchBox a').first()).toHaveAttribute(
    'href',
    /\/en\//,
  );
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: /Change language/ }).click();
  await page.getByRole('link', { name: 'Español', exact: true }).click();
  await expect(page).toHaveURL('/hiperion/referencia/arquitectura.html');
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
});

test('branded pages offer direct installers and a working Archify viewer in both languages', async ({
  page,
}) => {
  for (const locale of ['', 'en/']) {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(`/hiperion/${locale}`);
    await page.screenshot({
      path: `../../test-results/docs/home-${locale ? 'en' : 'es'}-desktop.png`,
      fullPage: true,
    });
    await expect(
      page.getByRole('img', { name: /Hyperion.*solar/ }),
    ).toBeVisible();
    for (const [name, asset] of [
      ['macOS · Apple Silicon', 'mac-arm64.dmg'],
      ['macOS · Intel', 'mac-x64.dmg'],
      ['Windows · x64', 'win-x64.exe'],
    ]) {
      await expect(
        page.getByRole('link', { name, exact: true }),
      ).toHaveAttribute(
        'href',
        `https://github.com/0vas/hiperion/releases/download/v0.4.0-preview.1/Hyperion-0.4.0-${asset}`,
      );
    }
    await page.goto(`/hiperion/${locale}referencia/arquitectura.html`);
    await expect(
      page.frameLocator('iframe').locator('svg').first(),
    ).toBeVisible();
    await page.screenshot({
      path: `../../test-results/docs/architecture-${locale ? 'en' : 'es'}.png`,
      fullPage: true,
    });
    await page
      .getByRole('link', {
        name: locale ? 'Explore in Archify' : 'Explorar en Archify',
        exact: true,
      })
      .click();
    await expect(page.locator('svg').first()).toBeVisible();
    await expect(page.locator('body')).toContainText('Hyperion');
  }
});
