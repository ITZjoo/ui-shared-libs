import { test, expect } from '@playwright/test';

test.describe('native invoker commands', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    await page.goto('/docs/components/modal.html');
    testInfo.annotations.push({ type: 'native support', description: JSON.stringify(await page.evaluate(() => UI.supports)) });
    await page.getByRole('button', { name: 'Open modal' }).click();
  });

  test('opens as a modal and locks page scroll', async ({ page }) => {
    const dialog = page.locator('#demo-modal');
    await expect(dialog).toBeVisible();
    expect(await dialog.evaluate((d) => d.matches(':modal'))).toBe(true);
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflow)).toBe('hidden');
  });

  test('Escape closes it', async ({ page }) => {
    await page.keyboard.press('Escape');
    await expect(page.locator('#demo-modal')).toBeHidden();
  });

  test('a command="close" button closes it', async ({ page }) => {
    await page.locator('#demo-modal').getByRole('button', { name: 'Cancel' }).click();
    await expect(page.locator('#demo-modal')).toBeHidden();
  });

  test('a backdrop click closes it', async ({ page }) => {
    await page.mouse.click(5, 5);
    await expect(page.locator('#demo-modal')).toBeHidden();
  });

  test('a click inside does not close it', async ({ page }) => {
    await page.locator('#demo-modal .ui-modal__body').click();
    await expect(page.locator('#demo-modal')).toBeVisible();
  });
});

test.describe('fallback for browsers without invoker commands', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      // Pretend to be Chrome 123-133: no invoker commands, so UI.supports.commands is false.
      delete HTMLButtonElement.prototype.command;
      delete HTMLButtonElement.prototype.commandForElement;
      // Cancel the default action of clicks on command buttons so the browser's own
      // command activation cannot run; only the kit's fallback listener is left.
      window.addEventListener('click', (event) => {
        if (event.target.closest?.('button[commandfor]')) event.preventDefault();
      }, true);
    });
    await page.goto('/docs/components/modal.html');
  });

  test('is active because invoker commands are reported as unsupported', async ({ page }) => {
    expect(await page.evaluate(() => UI.supports.commands)).toBe(false);
  });

  test('"Open modal" opens it as a modal', async ({ page }) => {
    await page.getByRole('button', { name: 'Open modal' }).click();
    const dialog = page.locator('#demo-modal');
    await expect(dialog).toBeVisible();
    expect(await dialog.evaluate((d) => d.matches(':modal'))).toBe(true);
  });

  test('a command="close" footer button closes it', async ({ page }) => {
    await page.getByRole('button', { name: 'Open modal' }).click();
    await expect(page.locator('#demo-modal')).toBeVisible();
    await page.locator('#demo-modal').getByRole('button', { name: 'Cancel' }).click();
    await expect(page.locator('#demo-modal')).toBeHidden();
  });

  test('the header close button closes it after reopening', async ({ page }) => {
    const dialog = page.locator('#demo-modal');
    await page.getByRole('button', { name: 'Open modal' }).click();
    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(dialog).toBeHidden();
    await page.getByRole('button', { name: 'Open modal' }).click();
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Close', exact: true }).click();
    await expect(dialog).toBeHidden();
  });
});

test('--full is (nearly) the full viewport width', async ({ page }) => {
  await page.goto('/docs/components/modal.html');
  const width = await page.evaluate(() => {
    const dialog = document.createElement('dialog');
    dialog.className = 'ui-modal ui-modal--full';
    dialog.textContent = 'Full';
    document.body.append(dialog);
    dialog.showModal();
    return dialog.offsetWidth;
  });
  const viewport = page.viewportSize().width;
  expect(width).toBeGreaterThanOrEqual(viewport - 40);
});
