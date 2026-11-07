import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => { await page.goto('/docs/components/toast.html'); });

test('UI.toast shows, then removes itself after its duration', async ({ page }) => {
  await page.evaluate(() => UI.toast({ title: 'Saved', message: 'Member updated.', variant: 'success', duration: 400 }));
  const toast = page.locator('.ui-toast-region .ui-toast--success');
  await expect(toast).toBeVisible();
  expect(await toast.getAttribute('role')).toBeNull();
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
  await page.evaluate(() => UI.toast({ message: 'Hover me', duration: 1500 }));
  const toast = page.locator('.ui-toast', { hasText: 'Hover me' });
  await toast.hover();
  await page.waitForTimeout(2500);
  await expect(toast).toBeVisible();
  await page.mouse.move(0, 0);
  await expect(toast).toHaveCount(0, { timeout: 3000 });
});

test('focus inside keeps it open after the pointer leaves', async ({ page }) => {
  await page.evaluate(() => UI.toast({ message: 'Focus me', duration: 1500 }));
  const toast = page.locator('.ui-toast', { hasText: 'Focus me' });
  await toast.hover();
  await toast.getByRole('button', { name: 'Close' }).focus();
  await page.mouse.move(0, 0);
  await page.waitForTimeout(2500);
  await expect(toast).toBeVisible();
  await page.evaluate(() => document.activeElement.blur());
  await expect(toast).toHaveCount(0, { timeout: 3000 });
});

test('hover keeps it open after focus leaves', async ({ page }) => {
  await page.evaluate(() => UI.toast({ message: 'Hover and focus', duration: 1500 }));
  const toast = page.locator('.ui-toast', { hasText: 'Hover and focus' });
  await toast.getByRole('button', { name: 'Close' }).focus();
  await toast.hover();
  await page.evaluate(() => document.activeElement.blur());
  await page.waitForTimeout(2500);
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

test('the live region exists on page load, before any toast', async ({ page }) => {
  await page.goto('/docs/components/button.html');
  const region = page.locator('.ui-toast-region');
  await expect(region).toHaveCount(1);
  await expect(region).toHaveAttribute('role', 'region');
  await expect(region).toHaveAttribute('aria-label', 'Notifications');
  await expect(region).toHaveAttribute('aria-live', 'polite');
  expect(await region.locator('.ui-toast').count()).toBe(0);
});

test('toast() still works if the region was removed', async ({ page }) => {
  await page.evaluate(() => {
    document.querySelector('.ui-toast-region').remove();
    UI.toast({ message: 'Again', duration: 0 });
  });
  await expect(page.locator('.ui-toast-region[aria-live="polite"] .ui-toast', { hasText: 'Again' })).toHaveCount(1);
});

test('toast show and hide events are not cancelable', async ({ page }) => {
  const flags = await page.evaluate(async () => {
    const seen = {};
    for (const type of ['show', 'hide']) document.addEventListener(`ui:toast:${type}`, (e) => { seen[type] = e.cancelable; });
    const t = UI.toast({ message: 'Events', duration: 0 });
    t.hide();
    return seen;
  });
  expect(flags).toEqual({ show: false, hide: false });
});

test('a page-authored region is reused and made a polite live region', async ({ page }) => {
  await page.goto('/tests/fixtures/toast-region.html');
  await page.evaluate(() => UI.toast({ message: 'Hi', duration: 0 }));
  const regions = page.locator('.ui-toast-region');
  await expect(regions).toHaveCount(1);
  await expect(regions).toHaveAttribute('id', 'authored');
  await expect(regions).toHaveAttribute('aria-live', 'polite');
  await expect(regions).toHaveAttribute('role', 'region');
  expect(await regions.getAttribute('aria-label')).toBeTruthy();
  await expect(page.locator('#authored .ui-toast', { hasText: 'Hi' })).toHaveCount(1);
});
