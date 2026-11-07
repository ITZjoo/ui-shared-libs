import { test, expect } from '@playwright/test';
import { css, settle } from './helpers.mjs';

const GREEN_700 = 'rgb(21, 128, 61)';
const RED_600 = 'rgb(220, 38, 38)';

test.beforeEach(async ({ page }) => { await page.goto('/docs/components/choice.html'); });

test('clicking the label checks the checkbox and shows the tick', async ({ page }) => {
  const box = page.locator('#terms');
  expect(await css(box, 'transform', '::before')).toBe('matrix(0, 0, 0, 0, 0, 0)');
  await page.getByText('I agree to the terms', { exact: true }).click();
  await expect(box).toBeChecked();
  await settle(page);
  expect(await css(box, 'background-color')).toBe(GREEN_700);
  expect(await css(box, 'transform', '::before')).toBe('matrix(1, 0, 0, 1, 0, 0)');
});

test('indeterminate fills the box', async ({ page }) => {
  const box = page.locator('#all');
  await box.evaluate((el) => { el.indeterminate = true; });
  await settle(page);
  expect(await css(box, 'background-color')).toBe(GREEN_700);
});

test('radios are exclusive and the checked one uses primary', async ({ page }) => {
  await page.getByLabel('Transfer').check();
  await expect(page.getByLabel('Cash')).not.toBeChecked();
  await settle(page);
  expect(await css(page.getByLabel('Transfer'), 'border-top-color')).toBe(GREEN_700);
});

test('a card choice highlights when its input is checked', async ({ page }) => {
  const card = page.locator('#plan-pro');
  await card.click();
  await settle(page);
  expect(await css(card, 'border-top-color')).toBe(GREEN_700);
});

test('hover keeps the primary border on a checked card choice', async ({ page }) => {
  const card = page.locator('#plan-pro');
  await card.click();
  await page.mouse.move(0, 0);
  await card.hover();
  await expect(card).toHaveCSS('border-top-color', GREEN_700);
  await settle(page);
  expect(await card.evaluate((el) => el.matches(':hover'))).toBe(true);
  expect(await css(card, 'border-top-color')).toBe(GREEN_700);
});

test('switch slides its thumb when on', async ({ page }) => {
  const sw = page.getByRole('switch', { name: 'Email notifications' });
  await sw.click();
  await expect(sw).toBeChecked();
  await settle(page);
  expect(await css(sw, 'background-color')).toBe(GREEN_700);
  expect(await css(sw, 'transform', '::before')).toBe('matrix(1, 0, 0, 1, 20, 0)');
});

test('a disabled choice is faded', async ({ page }) => {
  expect(await css(page.locator('#choice-disabled'), 'opacity')).toBe('0.5');
});

test('hover keeps the danger border on an invalid checkbox', async ({ page }) => {
  const box = page.locator('#consent');
  await box.hover();
  await settle(page);
  expect(await box.evaluate((el) => el.matches(':hover'))).toBe(true);
  expect(await css(box, 'border-top-color')).toBe(RED_600);
});

test('unchecked checkbox border and off switch track meet 3:1 (gray-500)', async ({ page }) => {
  expect(await css(page.locator('#terms'), 'border-top-color')).toBe('rgb(107, 114, 128)');
  expect(await css(page.getByRole('switch', { name: 'Email notifications' }), 'background-color')).toBe('rgb(107, 114, 128)');
});
