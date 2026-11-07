import { test, expect } from '@playwright/test';
import { readdirSync } from 'node:fs';
import { settle } from '../e2e/helpers.mjs';

const pages = ['index', ...readdirSync('docs/components').filter((f) => f.endsWith('.html')).map((f) => `components/${f.slice(0, -5)}`)];

for (const name of pages) {
  for (const theme of ['light', 'dark']) {
    test(`${name} ${theme}`, async ({ page }) => {
      await page.goto(`/docs/${name}.html`);
      await page.evaluate((t) => { document.documentElement.dataset.theme = t; }, theme);
      await settle(page); // skips infinite spinners, which finish() rejects; animations: 'disabled' freezes them
      await expect(page).toHaveScreenshot(`${name.replace('/', '-')}-${theme}.png`, { fullPage: true, animations: 'disabled' });
    });
  }
}
