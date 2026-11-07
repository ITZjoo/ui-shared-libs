import { test, expect } from '@playwright/test';
import { css, setTheme, settle } from './helpers.mjs';

test.beforeEach(async ({ page }) => { await page.goto('/docs/components/button.html'); });

test('variants use their tokens in light and dark', async ({ page }) => {
  const primary = page.locator('#btn-primary');
  expect(await css(primary, 'background-color')).toBe('rgb(21, 128, 61)');
  expect(await css(primary, 'color')).toBe('rgb(255, 255, 255)');
  expect(await css(page.locator('#btn-secondary'), 'background-color')).toBe('rgb(240, 253, 244)');
  expect(await css(page.locator('#btn-outline'), 'background-color')).toBe('rgb(255, 255, 255)');
  expect(await css(page.locator('#btn-ghost'), 'background-color')).toBe('rgba(0, 0, 0, 0)');
  expect(await css(page.locator('#btn-danger'), 'background-color')).toBe('rgb(220, 38, 38)');
  await setTheme(page, 'dark');
  expect(await css(primary, 'background-color')).toBe('rgb(34, 197, 94)');
  expect(await css(primary, 'color')).toBe('rgb(3, 7, 18)');
});

test('sizes set the height', async ({ page }) => {
  expect((await page.locator('#btn-sm').boundingBox()).height).toBe(32);
  expect((await page.locator('#btn-primary').boundingBox()).height).toBe(36);
  expect((await page.locator('#btn-lg').boundingBox()).height).toBe(44);
});

test('aria-busy shows a spinner and blocks clicks', async ({ page }) => {
  const busy = page.locator('#btn-busy');
  expect(await css(busy, 'content', '::before')).not.toBe('none');
  expect(await css(busy, 'pointer-events')).toBe('none');
});

test('disabled is faded and inert', async ({ page }) => {
  const disabled = page.locator('#btn-disabled');
  expect(await css(disabled, 'opacity')).toBe('0.5');
  expect(await css(disabled, 'pointer-events')).toBe('none');
});

test('unlayered app CSS beats the kit', async ({ page }) => {
  await page.addStyleTag({ content: '.ui-btn--primary { background-color: rgb(1, 2, 3); }' });
  await settle(page);
  expect(await css(page.locator('#btn-primary'), 'background-color')).toBe('rgb(1, 2, 3)');
});

test('the component file ships alone, in its layer', async ({ request }) => {
  const res = await request.get('/packages/ui/dist/components/button.css');
  expect(res.ok()).toBe(true);
  const body = await res.text();
  expect(body.startsWith('@layer ui.reset, ui.tokens, ui.base, ui.components, ui.utilities;')).toBe(true);
  expect(body).toContain('.ui-btn');
});

test('each demo shows its markup', async ({ page }) => {
  const demos = await page.locator('.docs-demo').count();
  await expect(page.locator('pre.docs-code')).toHaveCount(demos);
  await expect(page.locator('pre.docs-code').first()).toContainText('class="ui-btn ui-btn--primary"');
});

test('every variant draws a focus ring on keyboard focus', async ({ page }) => {
  for (const id of ['btn-primary', 'btn-secondary', 'btn-outline', 'btn-ghost', 'btn-danger']) {
    const el = page.locator(`#${id}`);
    await page.evaluate(() => document.activeElement?.blur());
    await page.keyboard.press('Tab');
    await el.evaluate((e) => e.focus());
    await settle(page);
    expect(await el.evaluate((e) => e.matches(':focus-visible')), `${id} focus-visible`).toBe(true);
    const shadow = await css(el, 'box-shadow');
    expect(shadow, id).not.toBe('none');
    const width = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--ui-focus-width').trim());
    expect(shadow, id).toContain(width);
  }
});
