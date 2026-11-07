import { test, expect } from '@playwright/test';
import { css, settle } from './helpers.mjs';

test.beforeEach(async ({ page }) => { await page.goto('/docs/components/form.html'); });

test('controls use surface, border and control radius', async ({ page }) => {
  const input = page.locator('#name');
  expect(await css(input, 'background-color')).toBe('rgb(255, 255, 255)');
  expect(await css(input, 'border-top-color')).toBe('rgb(209, 213, 219)');
  expect(await css(input, 'border-top-left-radius')).toBe('8px');
});

test('placeholder uses the muted foreground (gray-500, AA on white)', async ({ page }) => {
  expect(await css(page.locator('#name'), 'color', '::placeholder')).toBe('rgb(107, 114, 128)');
});

test('focus shows the primary border and a ring', async ({ page }) => {
  const input = page.locator('#name');
  await input.focus();
  await settle(page);
  expect(await css(input, 'border-top-color')).toBe('rgb(21, 128, 61)');
  expect(await css(input, 'box-shadow')).not.toBe('none');
});

test('aria-invalid shows the danger border and hides the hint', async ({ page }) => {
  expect(await css(page.locator('#email'), 'border-top-color')).toBe('rgb(220, 38, 38)');
  await expect(page.locator('#email-field .ui-error')).toBeVisible();
  await expect(page.locator('#email-field .ui-hint')).toBeHidden();
});

test('hover keeps the danger border on an invalid control', async ({ page }) => {
  const input = page.locator('#email');
  await input.hover();
  await settle(page);
  expect(await css(input, 'border-top-color')).toBe('rgb(220, 38, 38)');
});

test('hover keeps the primary border on a focused control', async ({ page }) => {
  const input = page.locator('#name');
  await input.focus();
  await input.hover();
  await settle(page);
  expect(await css(input, 'border-top-color')).toBe('rgb(21, 128, 61)');
});

test('disabled uses the sunken surface', async ({ page }) => {
  expect(await css(page.locator('#disabled'), 'background-color')).toBe('rgb(243, 244, 246)');
});

test('select draws its chevron with gradients', async ({ page }) => {
  const select = page.locator('#city');
  expect(await css(select, 'appearance')).toBe('none');
  expect(await css(select, 'background-image')).toContain('linear-gradient');
});

test('label is tied to its control', async ({ page }) => {
  await page.getByLabel('Full name').fill('Test');
  await expect(page.locator('#name')).toHaveValue('Test');
});

test('the input focus ring is opaque primary', async ({ page }) => {
  const input = page.locator('#name');
  await input.focus();
  await settle(page);
  const shadow = await css(input, 'box-shadow');
  expect(shadow).toContain('rgb(21, 128, 61)');
  expect(shadow).not.toContain('rgba');
});
