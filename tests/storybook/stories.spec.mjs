// Every Storybook story renders without errors and has no serious axe
// violations in light and dark. Runs against the static build
// (npm run build-storybook) served from the repo root.
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';
import { settle } from '../e2e/helpers.mjs';

const index = JSON.parse(readFileSync('storybook-static/index.json', 'utf8'));
const stories = Object.values(index.entries).filter((e) => e.type === 'story');

test('the build lists a story for every docs component page', () => {
  const titles = new Set(stories.map((s) => s.title.split('/').pop()));
  for (const title of ['Button', 'Form controls', 'Checkbox, radio, switch', 'Card', 'Badge', 'Alert', 'Modal', 'Toast', 'Layout']) {
    expect(titles, `no stories for ${title}`).toContain(title);
  }
});

for (const { id } of stories) {
  for (const theme of ['light', 'dark']) {
    test(`${id} renders cleanly (${theme})`, async ({ page }) => {
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

      // a11y.manual stops the a11y addon's own axe run, which would collide with ours.
      await page.goto(`/storybook-static/iframe.html?id=${id}&viewMode=story&globals=theme:${theme};a11y.manual:!true`);
      // Storybook sets this class once the story has rendered. A server toast moves itself
      // into the live region outside #storybook-root, so the whole page is checked.
      await expect(page.locator('body')).toHaveClass(/sb-show-main/);
      await expect(page.locator('#storybook-root [class*="ui-"], .ui-toast').first()).toBeAttached();
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      await settle(page);

      // Same rule as tests/e2e/a11y.spec.mjs: a disabled choice is faded on purpose (WCAG 1.4.3 exemption).
      const { violations } = await new AxeBuilder({ page }).exclude('.ui-choice:has(:disabled)').analyze();
      const serious = violations
        .filter((v) => v.impact === 'serious' || v.impact === 'critical')
        .map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target.join(' ')) }));
      expect(serious).toEqual([]);
      expect(errors).toEqual([]);
    });
  }
}
