import { test, expect, Page, TestInfo } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const base = process.env.WEB_BASE_URL || 'http://127.0.0.1:5173';

async function audit(page: Page, name: string, testInfo: TestInfo) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  await testInfo.attach(`${name}-axe.json`, { body: JSON.stringify(results, null, 2), contentType: 'application/json' });
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
}

test('login: auditoría WCAG 2.1 A y AA', async ({ page }, info) => {
  await page.goto(`${base}/login`);
  await expect(page.getByTestId('login-form')).toBeVisible();
  await audit(page, 'login', info);
});

async function login(page: Page) {
  await page.goto(`${base}/login`);
  await page.getByTestId('login-email-input').fill('ana@test.com');
  await page.getByTestId('login-password-input').fill('Password1');
  await page.getByTestId('login-submit').click();
  await expect(page.getByTestId('projects-page')).toBeVisible();
  await expect(page.getByTestId('project-list')).toBeVisible();
}

test('proyectos: auditoría WCAG 2.1 A y AA', async ({ page }, info) => {
  await login(page);
  await audit(page, 'proyectos', info);
});

test('tablero: auditoría WCAG 2.1 A y AA', async ({ page }, info) => {
  await login(page);
  const href = await page.getByTestId('project-card-name').first().getAttribute('href');
  expect(href).toBeTruthy();
  await page.goto(`${base}${href}`);
  await expect(page.getByTestId('board-page')).toBeVisible();
  await audit(page, 'tablero', info);
});

test('login: navegación por teclado', async ({ page }) => {
  await page.goto(`${base}/login`);
  await page.keyboard.press('Tab');
  await expect(page.getByTestId('login-email-input')).toBeFocused();
  await page.keyboard.type('ana@test.com');
  await page.keyboard.press('Tab');
  await expect(page.getByTestId('login-password-input')).toBeFocused();
  await page.keyboard.type('Password1');
  await page.keyboard.press('Tab');
  await expect(page.getByTestId('login-submit')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('projects-page')).toBeVisible();
});
