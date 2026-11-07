import { test, expect } from '@playwright/test';
import { css, setTheme } from './helpers.mjs';

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

test('alert accent bar follows the variant, in both themes', async ({ page }) => {
  await page.goto('/docs/components/alert.html');
  const warning = page.locator('#alert-warning');
  expect(await css(warning, 'background-color', '::before')).toBe('rgb(234, 179, 8)');
  await setTheme(page, 'dark');
  expect(await css(warning, 'background-color', '::before')).toBe('rgb(250, 204, 21)');
});
