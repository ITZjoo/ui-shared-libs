import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readdirSync } from 'node:fs';
import { setTheme } from './helpers.mjs';

const pages = ['index', ...readdirSync('docs/components').filter((f) => f.endsWith('.html')).map((f) => `components/${f.slice(0, -5)}`)];

for (const name of pages) {
  for (const theme of ['light', 'dark']) {
    test(`${name} has no serious axe violations (${theme})`, async ({ page }) => {
      await page.goto(`/docs/${name}.html`);
      await setTheme(page, theme);
      // WCAG 1.4.3 exempts inactive controls; a disabled choice is faded on purpose.
      const { violations } = await new AxeBuilder({ page }).exclude('.ui-choice:has(:disabled)').analyze();
      const serious = violations
        .filter((v) => v.impact === 'serious' || v.impact === 'critical')
        .map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target.join(' ')) }));
      expect(serious).toEqual([]);
    });
  }
}
