import { test, expect } from '@playwright/test';

const log = (page) => page.evaluate(() => window.log.slice());
const count = async (page, entry) => (await log(page)).filter((e) => e === entry).length;

test.describe('runtime', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/tests/fixtures/runtime.html'); });

  test('initialises existing elements once per behaviour', async ({ page }) => {
    expect(await log(page)).toEqual(expect.arrayContaining(['init:a', 'init:b', 'other:b', 'ready:a', 'ready:b']));
    await page.evaluate(() => UI.init());
    expect(await count(page, 'init:a')).toBe(1);
  });

  test('initialises markup added later, including nested', async ({ page }) => {
    await page.evaluate(() => {
      const c = document.createElement('div');
      c.id = 'c';
      c.dataset.ui = 'probe';
      document.querySelector('#target').append(c);
    });
    await expect.poll(() => count(page, 'init:c')).toBe(1);
    await page.evaluate(() => { document.querySelector('#target').insertAdjacentHTML('beforeend', '<p><span id="d" data-ui="probe"></span></p>'); });
    await expect.poll(() => count(page, 'init:d')).toBe(1);
  });

  test('destroys removed elements but not moved ones', async ({ page }) => {
    await page.evaluate(() => document.querySelector('#a').remove());
    await expect.poll(() => count(page, 'destroy:a')).toBe(1);
    await page.evaluate(() => document.querySelector('#target').append(document.querySelector('#b')));
    await page.waitForTimeout(50);
    expect(await count(page, 'destroy:b')).toBe(0);
    expect(await count(page, 'init:b')).toBe(1);
  });

  test('get, destroy and re-init', async ({ page }) => {
    expect(await page.evaluate(() => typeof UI.get(document.querySelector('#a'), 'probe').destroy)).toBe('function');
    await page.evaluate(() => UI.destroy(document.querySelector('main')));
    expect(await count(page, 'destroy:a')).toBe(1);
    await page.evaluate(() => UI.init(document.querySelector('main')));
    expect(await count(page, 'init:a')).toBe(2);
  });

  test('registering after start initialises matching elements', async ({ page }) => {
    await page.evaluate(() => UI.register('late', (el) => { window.log.push(`late:${el.id}`); }));
    expect(await count(page, 'late:late')).toBe(1);
  });

  test('a throwing behaviour does not stop the others', async ({ page }) => {
    const entries = await log(page);
    expect(entries).toEqual(expect.arrayContaining(['init:x', 'init:a', 'init:b']));
    expect(await count(page, 'error:boom')).toBe(1);
  });

  test('the observer still runs after a throwing first pass', async ({ page }) => {
    await page.evaluate(() => {
      const n = document.createElement('div');
      n.id = 'n';
      n.dataset.ui = 'probe';
      document.querySelector('#target').append(n);
    });
    await expect.poll(() => count(page, 'init:n')).toBe(1);
  });
});

test.describe('dismiss', () => {
  test('removes the alert and emits a cancelable event', async ({ page }) => {
    await page.goto('/docs/components/alert.html');
    await page.evaluate(() => {
      window.events = [];
      document.addEventListener('ui:alert:dismiss', (e) => window.events.push(e.target.id));
    });
    await page.locator('#alert-dismissible [data-ui-dismiss]').click();
    await expect(page.locator('#alert-dismissible')).toHaveCount(0);
    expect(await page.evaluate(() => window.events)).toEqual(['alert-dismissible']);
  });

  test('preventDefault keeps it', async ({ page }) => {
    await page.goto('/docs/components/alert.html');
    await page.evaluate(() => document.addEventListener('ui:alert:dismiss', (e) => e.preventDefault()));
    await page.locator('#alert-dismissible [data-ui-dismiss]').click();
    await expect(page.locator('#alert-dismissible')).toHaveCount(1);
  });

  test('works when the click lands on a text node', async ({ page }) => {
    await page.goto('/docs/components/alert.html');
    await page.evaluate(() => {
      const button = document.querySelector('#alert-dismissible [data-ui-dismiss]');
      const text = document.createTextNode('x');
      button.append(text);
      text.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await expect(page.locator('#alert-dismissible')).toHaveCount(0);
  });
});
