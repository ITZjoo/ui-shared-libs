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

test('focus inside keeps it open after the pointer leaves', async ({ page }) => {
  await page.evaluate(() => UI.toast({ message: 'Focus me', duration: 700 }));
  const toast = page.locator('.ui-toast', { hasText: 'Focus me' });
  await toast.hover();
  await toast.getByRole('button', { name: 'Close' }).focus();
  await page.mouse.move(0, 0);
  await page.waitForTimeout(1200);
  await expect(toast).toBeVisible();
  await page.evaluate(() => document.activeElement.blur());
  await expect(toast).toHaveCount(0, { timeout: 3000 });
});

test('hover keeps it open after focus leaves', async ({ page }) => {
  await page.evaluate(() => UI.toast({ message: 'Hover and focus', duration: 700 }));
  const toast = page.locator('.ui-toast', { hasText: 'Hover and focus' });
  await toast.getByRole('button', { name: 'Close' }).focus();
  await toast.hover();
  await page.evaluate(() => document.activeElement.blur());
  await page.waitForTimeout(1200);
  await expect(toast).toBeVisible();
  await page.mouse.move(0, 0);
  await expect(toast).toHaveCount(0, { timeout: 3000 });
});

test('an invalid duration falls back to the default', async ({ page }) => {
  await page.evaluate(() => {
    UI.toast({ message: 'Bad', duration: 'abc' });
    const el = document.createElement('div');
    el.className = 'ui-toast ui-toast--info';
    el.dataset.ui = 'toast';
    el.dataset.duration = 'abc';
    el.textContent = 'Bad server';
    document.body.append(el);
  });
  const toasts = [page.locator('.ui-toast', { hasText: 'Bad' }).first(), page.locator('.ui-toast', { hasText: 'Bad server' })];
  await page.waitForTimeout(800);
  for (const toast of toasts) {
    await expect(toast).toBeVisible();
    expect(await toast.evaluate((el) => el.style.getPropertyValue('--ui-toast-duration'))).toBe('5000ms');
  }
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
