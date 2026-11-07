import { test, expect } from '@playwright/test';
import { css, setTheme, tokenColor } from './helpers.mjs';

const GRAY_50 = 'rgb(249, 250, 251)';
const GRAY_950 = 'rgb(3, 7, 18)';
const GREEN_700 = 'rgb(21, 128, 61)';
const GREEN_500 = 'rgb(34, 197, 94)';

test.describe('light device', () => {
  test.use({ colorScheme: 'light' });

  test('defaults to light tokens', async ({ page }) => {
    await page.goto('/docs/index.html');
    expect(await css(page.locator('body'), 'background-color')).toBe(GRAY_50);
    expect(await tokenColor(page, '--ui-primary')).toBe(GREEN_700);
  });

  test('data-theme="dark" forces dark', async ({ page }) => {
    await page.goto('/docs/index.html');
    await setTheme(page, 'dark');
    expect(await css(page.locator('body'), 'background-color')).toBe(GRAY_950);
    expect(await tokenColor(page, '--ui-primary')).toBe(GREEN_500);
  });
});

test.describe('dark device', () => {
  test.use({ colorScheme: 'dark' });

  test('follows the device', async ({ page }) => {
    await page.goto('/docs/index.html');
    expect(await css(page.locator('body'), 'background-color')).toBe(GRAY_950);
  });

  test('data-theme="light" forces light', async ({ page }) => {
    await page.goto('/docs/index.html');
    await setTheme(page, 'light');
    expect(await css(page.locator('body'), 'background-color')).toBe(GRAY_50);
  });
});

test('unlayered app CSS overrides a token without !important', async ({ page }) => {
  await page.goto('/docs/index.html');
  await page.addStyleTag({ content: ':root { --ui-primary: #2563eb; }' });
  expect(await tokenColor(page, '--ui-primary')).toBe('rgb(37, 99, 235)');
});

test('reset makes boxes border-box', async ({ page }) => {
  await page.goto('/docs/index.html');
  expect(await css(page.locator('main'), 'box-sizing')).toBe('border-box');
});
