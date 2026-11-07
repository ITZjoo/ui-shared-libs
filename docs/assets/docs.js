// Docs chrome: theme toggle (system → light → dark), markup shown under
// each demo, and buttons that fire a toast. Not part of the kit.
(() => {
  const root = document.documentElement;
  const KEY = 'ui-docs-theme';
  const ORDER = ['system', 'light', 'dark'];

  const apply = (mode) => {
    if (mode === 'system') delete root.dataset.theme;
    else root.dataset.theme = mode;
    for (const button of document.querySelectorAll('[data-docs-theme]')) button.textContent = `Theme: ${mode}`;
  };

  let mode = 'system';
  try { mode = localStorage.getItem(KEY) ?? 'system'; } catch { /* storage blocked */ }
  if (!ORDER.includes(mode)) mode = 'system';

  const dedent = (html) => {
    const lines = html.replace(/^\s*\n/, '').replace(/\s+$/, '').split('\n');
    const indents = lines.filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length);
    const indent = Math.min(...indents);
    return lines.map((l) => l.slice(indent)).join('\n');
  };

  const ready = () => {
    apply(mode);
    // Runs before ui.js (script order), so demos are captured as written.
    for (const demo of document.querySelectorAll('.docs-demo')) {
      const pre = document.createElement('pre');
      pre.className = 'docs-code';
      pre.tabIndex = 0;
      const code = document.createElement('code');
      code.textContent = dedent(demo.innerHTML);
      pre.append(code);
      demo.after(pre);
    }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready, { once: true });
  else ready();

  document.addEventListener('click', (event) => {
    const themeButton = event.target.closest('[data-docs-theme]');
    if (themeButton) {
      mode = ORDER[(ORDER.indexOf(mode) + 1) % ORDER.length];
      apply(mode);
      try { localStorage.setItem(KEY, mode); } catch { /* storage blocked */ }
      return;
    }
    const toastButton = event.target.closest('[data-docs-toast]');
    if (toastButton && window.UI?.toast) window.UI.toast(JSON.parse(toastButton.dataset.docsToast));
  });
})();
