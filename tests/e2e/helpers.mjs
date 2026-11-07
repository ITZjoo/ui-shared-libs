// Shared test helpers. Computed values are read after finishing every
// running animation and transition, so a theme switch is not caught mid-way.
export async function setTheme(page, theme) {
  await page.evaluate((t) => {
    if (t) document.documentElement.dataset.theme = t;
    else delete document.documentElement.dataset.theme;
  }, theme);
  await settle(page);
}

export async function settle(page) {
  await page.evaluate(() => document.getAnimations().forEach((a) => a.finish()));
}

export function css(locator, prop, pseudo = null) {
  return locator.evaluate((el, [p, ps]) => getComputedStyle(el, ps).getPropertyValue(p), [prop, pseudo]);
}

export function tokenColor(page, token) {
  return page.evaluate((t) => {
    const probe = document.createElement('div');
    probe.style.color = `var(${t})`;
    document.body.append(probe);
    const value = getComputedStyle(probe).color;
    probe.remove();
    return value;
  }, token);
}
