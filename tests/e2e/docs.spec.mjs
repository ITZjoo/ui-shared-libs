import { test, expect } from '@playwright/test';

test('docs index loads with no failed requests or errors', async ({ page }) => {
  const failed = [];
  const errors = [];
  page.on('response', (r) => { if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`); });
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/docs/index.html');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('ui-shared-libs');
  expect(failed).toEqual([]);
  expect(errors).toEqual([]);
});

test('theme toggle cycles system → light → dark and persists', async ({ page }) => {
  await page.goto('/docs/index.html');
  const html = page.locator('html');
  const toggle = page.locator('[data-docs-theme]');
  await expect(toggle).toHaveText('Theme: system');
  await expect(html).not.toHaveAttribute('data-theme');
  await toggle.click();
  await expect(html).toHaveAttribute('data-theme', 'light');
  await toggle.click();
  await expect(html).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(html).toHaveAttribute('data-theme', 'dark');
  await page.locator('[data-docs-theme]').click();
  await expect(html).not.toHaveAttribute('data-theme');
});
