import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readdirSync } from 'node:fs';
import { setTheme, settle } from './helpers.mjs';

const pages = ['index', ...readdirSync('docs/components').filter((f) => f.endsWith('.html')).map((f) => `components/${f.slice(0, -5)}`)];

// Only serious/critical count. WCAG 1.4.3 exempts inactive controls; a disabled choice is faded on purpose.
async function seriousViolations(page) {
  const { violations } = await new AxeBuilder({ page }).exclude('.ui-choice:has(:disabled)').analyze();
  return violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target.join(' ')) }));
}

for (const name of pages) {
  for (const theme of ['light', 'dark']) {
    test(`${name} has no serious axe violations (${theme})`, async ({ page }) => {
      await page.goto(`/docs/${name}.html`);
      await setTheme(page, theme);
      expect(await seriousViolations(page)).toEqual([]);
    });
  }
}

// Axe only sees rendered content, so open states need their own checks.
for (const theme of ['light', 'dark']) {
  test(`open modal has no serious axe violations (${theme})`, async ({ page }) => {
    await page.goto('/docs/components/modal.html');
    await setTheme(page, theme);
    await page.getByRole('button', { name: 'Open modal' }).click();
    await page.waitForFunction(() => document.querySelector('#demo-modal')?.matches(':modal'));
    await settle(page);
    expect(await seriousViolations(page)).toEqual([]);
  });

  test(`toasts have no serious axe violations (${theme})`, async ({ page }) => {
    await page.goto('/docs/components/toast.html');
    await setTheme(page, theme);
    await page.evaluate(() => {
      for (const variant of ['info', 'success', 'warning', 'danger']) {
        UI.toast({ title: `${variant} title`, message: `The ${variant} message.`, variant, duration: 0 });
      }
    });
    await settle(page);
    expect(await seriousViolations(page)).toEqual([]);
  });
}
