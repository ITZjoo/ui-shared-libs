import { test, expect } from '@playwright/test';
import { css, setTheme, tokenColor } from './helpers.mjs';

test('card padding: default, small, and a nested default card is not affected', async ({ page }) => {
  await page.goto('/docs/components/card.html');
  expect(await css(page.locator('#card-default'), 'padding-top')).toBe('24px');
  expect(await css(page.locator('#card-sm'), 'padding-top')).toBe('16px');
  expect(await css(page.locator('#card-nested'), 'padding-top')).toBe('24px');
});

test('badge variants use subtle tokens', async ({ page }) => {
  await page.goto('/docs/components/badge.html');
  const danger = page.locator('#badge-danger');
  expect(await css(danger, 'background-color')).toBe('rgb(254, 242, 242)');
  expect(await css(danger, 'color')).toBe('rgb(185, 28, 28)');
  expect(await css(page.locator('#badge-neutral'), 'background-color')).toBe('rgb(243, 244, 246)');
});

test('alert status icon follows the variant, in both themes', async ({ page }) => {
  await page.goto('/docs/components/alert.html');
  const warning = page.locator('#alert-warning');
  // The icon uses the subtle foreground: the solid warning yellow is under 3:1 on its own tint.
  expect(await css(warning, 'background-color', '::before')).toBe('rgb(133, 77, 14)');
  expect(await css(warning, 'mask-image', '::before')).toContain('M10.3 4.6');
  expect(await css(page.locator('#alert-dismissible'), 'mask-image', '::before')).toContain('M12 7.5v5');
  await setTheme(page, 'dark');
  expect(await css(warning, 'background-color', '::before')).toBe(await tokenColor(page, '--ui-warning-subtle-fg'));
  expect(await css(warning, 'background-color', '::before')).not.toBe('rgb(133, 77, 14)');
});

test('an authored .ui-alert__icon replaces the built-in icon', async ({ page }) => {
  await page.goto('/docs/components/alert.html');
  const alert = page.locator('#alert-warning');
  expect(await css(alert, 'content', '::before')).not.toBe('none');
  await alert.evaluate((el) => {
    const icon = document.createElement('span');
    icon.className = 'ui-alert__icon';
    el.prepend(icon);
  });
  expect(await css(alert, 'content', '::before')).toBe('none');
});
