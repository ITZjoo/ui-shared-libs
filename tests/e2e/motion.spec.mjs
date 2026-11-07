import { test, expect } from '@playwright/test';
import { css } from './helpers.mjs';

test.use({ reducedMotion: 'reduce' });

const seconds = (list) => list.split(',').map((v) => {
  const n = parseFloat(v);
  return v.trim().endsWith('ms') ? n / 1000 : n;
});

test('switch transitions are near-instant under reduced motion', async ({ page }) => {
  await page.goto('/docs/components/choice.html');
  const sw = page.locator('.ui-switch').first();
  for (const value of [await css(sw, 'transition-duration'), await css(sw, 'transition-duration', '::before')]) {
    for (const s of seconds(value)) expect(s).toBeLessThan(0.001);
  }
});

test('button transitions are near-instant and :active does not scale', async ({ page }) => {
  await page.goto('/docs/components/button.html');
  const btn = page.locator('#btn-primary');
  for (const s of seconds(await css(btn, 'transition-duration'))) expect(s).toBeLessThan(0.001);
  await btn.hover();
  await page.mouse.down();
  await page.waitForTimeout(100);
  expect(await css(btn, 'transform')).toBe('none');
  await page.mouse.up();
});
