import { test, expect } from '@playwright/test';
import { css } from './helpers.mjs';

test.beforeEach(async ({ page }) => { await page.goto('/docs/components/layout.html'); });

test('stack is a column with the default gap', async ({ page }) => {
  const stack = page.locator('#stack-default');
  expect(await css(stack, 'flex-direction')).toBe('column');
  expect(await css(stack, 'row-gap')).toBe('16px');
});

test('gap utilities set the gap', async ({ page }) => {
  expect(await css(page.locator('#stack-gap-2'), 'row-gap')).toBe('8px');
  expect(await css(page.locator('#cluster-gap-6'), 'column-gap')).toBe('24px');
});

test('a gap utility does not leak into a nested primitive', async ({ page }) => {
  expect(await css(page.locator('#stack-nested'), 'row-gap')).toBe('16px');
});

test('grid fits columns of at least 16rem', async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 800 });
  const columns = await css(page.locator('#grid'), 'grid-template-columns');
  expect(columns.split(' ').length).toBeGreaterThanOrEqual(3);
  await page.setViewportSize({ width: 375, height: 800 });
  expect((await css(page.locator('#grid'), 'grid-template-columns')).split(' ').length).toBe(1);
});

test('sr-only text is in the accessibility tree but 1px', async ({ page }) => {
  const hidden = page.locator('#sr');
  await expect(hidden).toHaveText('Only for screen readers');
  const box = await hidden.boundingBox();
  expect(box.width).toBeLessThanOrEqual(1);
});
