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

test('interactive quickstart teaches a human decision and review without a live agent', async ({
  page,
}) => {
  const requests = [];
  page.on('request', (request) => {
    if (request.url().includes('/api/')) requests.push(request.url());
  });
  for (const en of [false, true]) {
    await page.goto(`/hiperion/${en ? 'en/' : ''}guia/primeros-pasos.html`);
    const demo = page.getByRole('region', {
      name: en ? 'Interactive example' : 'Ejemplo interactivo',
      exact: true,
    });
    await expect(demo).toContainText(en ? 'Simulation' : 'Simulación');
    await demo
      .getByRole('button', {
        name: en ? 'Create the plan' : 'Crear el plan',
        exact: true,
      })
      .click();
    await expect(
      demo.getByRole('button', {
        name: en ? 'Save answer' : 'Guardar respuesta',
        exact: true,
      }),
    ).toBeDisabled();
    await demo
      .getByLabel(
        en ? 'Who is the guide for?' : '¿A quién va dirigida la guía?',
        { exact: true },
      )
      .selectOption('team');
    await demo
      .getByRole('button', {
        name: en ? 'Save answer' : 'Guardar respuesta',
        exact: true,
      })
      .click();
    await expect(demo).toContainText(
      en ? 'Welcome to the team' : 'Bienvenido al equipo',
    );
    await demo
      .getByRole('button', {
        name: en ? 'Approve draft' : 'Aprobar borrador',
        exact: true,
      })
      .click();
    await expect(demo.getByRole('status')).toContainText(
      en ? 'Example completed' : 'Ejemplo completado',
    );
    await demo
      .getByRole('button', {
        name: en ? 'Restart example' : 'Reiniciar ejemplo',
        exact: true,
      })
      .click();
    await expect(
      demo.getByRole('button', {
        name: en ? 'Create the plan' : 'Crear el plan',
        exact: true,
      }),
    ).toBeVisible();
  }
  expect(requests).toEqual([]);
});

test('home motion can be paused and respects reduced motion', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/hiperion/');
  const motion = page.locator('.home-motion .link-current').first();
  await expect(motion).toHaveCSS('animation-play-state', 'running');
  await page
    .getByRole('button', { name: 'Pausar animación', exact: true })
    .click();
  await expect(motion).toHaveCSS('animation-play-state', 'paused');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(motion).toHaveCSS('animation-name', 'none');
});

test('demo forms, evidence and review stay accessible in narrow layouts', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const theme of ['light', 'dark']) {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
    for (const en of [false, true]) {
      await page.goto(`/hiperion/${en ? 'en/' : ''}guia/primeros-pasos.html`);
      const demo = page.getByRole('region', {
        name: en ? 'Interactive example' : 'Ejemplo interactivo',
        exact: true,
      });
      await demo
        .getByRole('button', {
          name: en ? 'Create the plan' : 'Crear el plan',
          exact: true,
        })
        .click();
      await demo.getByRole('combobox').selectOption('users');
      await demo.getByRole('combobox').focus();
      await page.keyboard.press('Tab');
      await expect(
        demo.getByRole('button', {
          name: en ? 'Save answer' : 'Guardar respuesta',
          exact: true,
        }),
      ).toBeFocused();
      expect(
        (
          await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
            .analyze()
        ).violations,
      ).toEqual([]);
      await page.keyboard.press('Enter');
      await demo.locator('summary').first().click();
      await expect(demo.locator('dd').first()).toHaveText(
        en ? 'new users' : 'nuevos usuarios',
      );
      expect(
        (
          await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
            .analyze()
        ).violations,
      ).toEqual([]);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await demo.screenshot({
        path: `../../test-results/docs/demo-review-${theme}-${en ? 'en' : 'es'}.png`,
      });
    }
  }
});

test('the demo uses the Hyperion canvas and keeps SVG task states in sync', async ({
  page,
}) => {
  await page.goto('/hiperion/guia/primeros-pasos.html');
  const demo = page.getByRole('region', {
    name: 'Ejemplo interactivo',
    exact: true,
  });
  await expect(demo.locator('.product-canvas')).toBeVisible();
  await demo
    .getByRole('button', { name: 'Crear el plan', exact: true })
    .click();
  await expect(demo.locator('[data-task="audience"]').first()).toHaveAttribute(
    'data-state',
    'waiting',
  );
  await demo.getByRole('combobox').selectOption('team');
  await demo
    .getByRole('button', { name: 'Guardar respuesta', exact: true })
    .click();
  await expect(demo.locator('[data-task="draft"]').first()).toHaveAttribute(
    'data-state',
    'completed',
  );
  await expect(demo.locator('[data-task="review"]').first()).toHaveAttribute(
    'data-state',
    'waiting',
  );
  await demo
    .getByRole('button', { name: 'Aprobar borrador', exact: true })
    .click();
  await expect(demo.locator('[data-task="review"]').first()).toHaveAttribute(
    'data-state',
    'completed',
  );
});

test('quickstart offers specific use cases, copyable prompts and source commands', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  for (const en of [false, true]) {
    await page.goto(`/hiperion/${en ? 'en/' : ''}guia/primeros-pasos.html`);
    await page
      .getByRole('button', {
        name: en ? 'Code review' : 'Revisión de código',
        exact: true,
      })
      .click();
    await page
      .getByRole('button', {
        name: en ? 'Copy request' : 'Copiar petición',
        exact: true,
      })
      .click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(
      en ? 'Use Hyperion to review' : 'Usa Hyperion para revisar',
    );
    await page
      .getByText(en ? 'Try it from source' : 'Probar desde el código fuente', {
        exact: true,
      })
      .click();
    await expect(
      page.locator('pre').filter({ hasText: 'npm run build' }),
    ).toBeVisible();
  }
});

test('video landing uses a centered headline, wide product view and controllable media', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  for (const en of [false, true]) {
    await page.goto(`/hiperion/${en ? 'en/' : ''}`);
    const hero = page.locator('.landscape-hero');
    const title = await hero.locator('h1').boundingBox();
    expect(Math.abs(title.x + title.width / 2 - 720)).toBeLessThan(5);
    expect(
      (await hero.locator('.landscape-product').boundingBox()).width,
    ).toBeGreaterThan(1000);
    const video = page.locator('.cinema-video');
    await expect(video).toHaveAttribute('src', /cloudfront.*mp4/);
    await expect(video).toHaveJSProperty('muted', true);
    await expect(video).toHaveJSProperty('loop', true);
    await hero
      .getByRole('button', {
        name: en ? 'Pause background' : 'Pausar fondo',
        exact: true,
      })
      .click();
    await expect(video).toHaveJSProperty('paused', true);
    await expect(
      hero.getByRole('button', {
        name: en ? 'Resume background' : 'Reanudar fondo',
      }),
    ).toHaveAttribute('aria-pressed', 'true');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(video).not.toHaveAttribute('src');
    await expect(hero.locator('h1 span')).toHaveCSS('animation-name', 'none');
    expect(
      (
        await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
          .analyze()
      ).violations,
    ).toEqual([]);
    await page.screenshot({
      path: `../../test-results/docs/cinema-${en ? 'en' : 'es'}.png`,
    });
    await hero
      .getByRole('link', {
        name: en ? 'Try the canvas' : 'Probar el canvas',
        exact: true,
      })
      .click();
    await expect(
      page.getByRole('region', {
        name: en ? 'Interactive example' : 'Ejemplo interactivo',
        exact: true,
      }),
    ).toBeInViewport();
    await page.emulateMedia({ reducedMotion: 'no-preference' });
  }
});

test('cinematic landing stays readable in split windows and small phones', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const width of [320, 820, 1024]) {
    await page.setViewportSize({ width, height: 768 });
    await page.goto('/hiperion/');
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const hero = page.locator('.landscape-hero');
    for (const selector of ['h1', '.landscape-actions', '.landscape-product']) {
      const bounds = await hero.locator(selector).boundingBox();
      expect(bounds.x).toBeGreaterThanOrEqual(0);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
    }
    if (width === 320) {
      await page.getByRole('button', { name: /Navegación móvil/ }).click();
      await page.getByRole('link', { name: 'Guía', exact: true }).click();
      await expect(page.locator('h1')).toHaveText('Tu primer flujo');
    } else {
      await page.screenshot({
        path: `../../test-results/docs/cinema-split-${width}.png`,
      });
    }
  }
});

test('video failure keeps the poster, navigation and download actions usable', async ({
  page,
}) => {
  await page.route('https://d8j0ntlcm91z4.cloudfront.net/**', (route) =>
    route.abort(),
  );
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const failure = page.waitForEvent('requestfailed', (request) =>
    request.url().includes('cloudfront.net'),
  );
  await page.goto('/hiperion/');
  await failure;
  const video = page.locator('.cinema-video');
  await expect(video).not.toHaveAttribute('src');
  await expect(video).toHaveAttribute(
    'poster',
    '/hiperion/brand/cinema-poster.svg',
  );
  await expect(page.locator('h1')).toHaveText('Tus ideas.En movimiento.');
  await page
    .getByRole('link', { name: 'Descargar Hyperion', exact: true })
    .click();
  await expect(
    page.getByRole('link', { name: 'macOS · Apple Silicon', exact: true }),
  ).toBeInViewport();
});
