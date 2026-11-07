import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => { await page.goto('/docs/components/toast.html'); });

test('UI.toast shows, then removes itself after its duration', async ({ page }) => {
  await page.evaluate(() => UI.toast({ title: 'Saved', message: 'Member updated.', variant: 'success', duration: 400 }));
  const toast = page.locator('.ui-toast-region .ui-toast--success');
  await expect(toast).toBeVisible();
  await expect(toast).toHaveAttribute('role', 'status');
  await expect(toast).toContainText('Member updated.');
  await expect(toast).toHaveCount(0, { timeout: 3000 });
});

test('duration 0 stays until closed, and emits hide', async ({ page }) => {
  await page.evaluate(() => {
    window.hidden = 0;
    document.addEventListener('ui:toast:hide', () => { window.hidden += 1; });
    UI.toast({ message: 'Stays', duration: 0 });
  });
  const toast = page.locator('.ui-toast', { hasText: 'Stays' });
  await page.waitForTimeout(800);
  await expect(toast).toHaveAttribute('data-persistent', '');
  await toast.getByRole('button', { name: 'Close' }).click();
  await expect(toast).toHaveCount(0);
  expect(await page.evaluate(() => window.hidden)).toBe(1);
});

test('hovering pauses the timer', async ({ page }) => {
  await page.evaluate(() => UI.toast({ message: 'Hover me', duration: 700 }));
  const toast = page.locator('.ui-toast', { hasText: 'Hover me' });
  await toast.hover();
  await page.waitForTimeout(1200);
  await expect(toast).toBeVisible();
  await page.mouse.move(0, 0);
  await expect(toast).toHaveCount(0, { timeout: 3000 });
});

test('server-rendered toast moves into the region', async ({ page }) => {
  await expect(page.locator('.ui-toast-region #flash')).toHaveCount(1);
});

test('options are text, never HTML', async ({ page }) => {
  await page.evaluate(() => UI.toast({ message: '<img src=x id=injected>', duration: 0 }));
  await expect(page.locator('#injected')).toHaveCount(0);
  await expect(page.locator('.ui-toast', { hasText: '<img src=x id=injected>' })).toHaveCount(1);
});

test('unknown variants fall back to info; danger is an alert', async ({ page }) => {
  await page.evaluate(() => {
    UI.toast({ message: 'odd', variant: 'bogus', duration: 0 });
    UI.toast({ message: 'bad', variant: 'danger', duration: 0 });
  });
  await expect(page.locator('.ui-toast', { hasText: 'odd' })).toHaveClass(/ui-toast--info/);
  await expect(page.locator('.ui-toast', { hasText: 'bad' })).toHaveAttribute('role', 'alert');
});
