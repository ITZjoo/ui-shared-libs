import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }, testInfo) => {
  await page.goto('/docs/components/modal.html');
  testInfo.annotations.push({ type: 'native support', description: JSON.stringify(await page.evaluate(() => UI.supports)) });
  await page.getByRole('button', { name: 'Open modal' }).click();
});

test('opens as a modal and locks page scroll', async ({ page }) => {
  const dialog = page.locator('#demo-modal');
  await expect(dialog).toBeVisible();
  expect(await dialog.evaluate((d) => d.matches(':modal'))).toBe(true);
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflow)).toBe('hidden');
});

test('Escape closes it', async ({ page }) => {
  await page.keyboard.press('Escape');
  await expect(page.locator('#demo-modal')).toBeHidden();
});

test('a command="close" button closes it', async ({ page }) => {
  await page.locator('#demo-modal').getByRole('button', { name: 'Cancel' }).click();
  await expect(page.locator('#demo-modal')).toBeHidden();
});

test('a backdrop click closes it', async ({ page }) => {
  await page.mouse.click(5, 5);
  await expect(page.locator('#demo-modal')).toBeHidden();
});

test('a click inside does not close it', async ({ page }) => {
  await page.locator('#demo-modal .ui-modal__body').click();
  await expect(page.locator('#demo-modal')).toBeVisible();
});
