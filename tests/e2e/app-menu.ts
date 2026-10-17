import { expect, type Page } from '@playwright/test';

export function appMenuTrigger(page: Page) {
  return page.getByRole('button', {
    name: /Abrir menú|Open menu|Cerrar menú|Close menu/,
  });
}

export async function openAppMenu(page: Page) {
  const trigger = appMenuTrigger(page);
  if ((await trigger.getAttribute('aria-expanded')) !== 'true') {
    await trigger.click();
  }
  await expect(page.getByRole('menu', { name: /Menú|Menu/ })).toBeVisible();
}

export async function chooseFromAppMenu(page: Page, item: string | RegExp) {
  await openAppMenu(page);
  await page.getByRole('menuitem', { name: item }).click();
}
