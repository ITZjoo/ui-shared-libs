# Milestone 1: Foundation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `@ui-shared-libs/ui` 0.1.0: build pipeline, tokens with dark mode, base, layout utilities, a JS runtime, and 13 components (button, input, textarea, select, checkbox, radio, switch, form-group, card, badge, alert, modal, toast), each with a docs page and tests.

**Architecture:** Plain CSS in `packages/ui/src`, bundled by Lightning CSS into `@layer ui.*` so app CSS always wins. Components read semantic tokens only; dark mode is `light-dark()` driven by `color-scheme`. A dependency-free JS runtime initialises `[data-ui]` elements (and markup injected later) and is bundled by esbuild as ESM and IIFE. Static HTML docs double as Playwright fixtures.

**Tech Stack:** Node 22+ (local is 24), npm workspaces, Lightning CSS 1.30.1, esbuild 0.25.5, Stylelint 16.21.0, Playwright 1.53.1, @axe-core/playwright 4.10.2, `node:test`.

Spec: `docs/specs/2026-11-07-ui-shared-libs-design.md`.

## Global Constraints

- Repo: `C:\jojo\ui-shared-libs`, remote `ITZjoo/ui-shared-libs`. Commit as `imam <imambprasojo@gmail.com>` (already set per-repo). Work on branch `feat/m1-foundation`; never push to `main` (a local hook blocks it); merge via PR.
- Package names: `@ui-shared-libs/ui` (this milestone), later `@ui-shared-libs/vue`, `@ui-shared-libs/react`. MIT.
- Class names: `ui-<block>`, `ui-<block>__<part>`, `ui-<block>--<modifier>`. Keyframes: `ui-*`. Custom properties: `--ui-*`, or `--_*` for component-private values.
- State via native attributes (`disabled`, `aria-invalid="true"`, `aria-busy="true"`, `[open]`, `:checked`), never state classes.
- Components and modules read semantic tokens only: no hex, no named colours, no `rgb()/hsl()/oklch()`, no `!important`. Stylelint enforces it.
- Layer order, first line of every CSS bundle: `@layer ui.reset, ui.tokens, ui.base, ui.components, ui.utilities;`
- Browsers: Chrome/Edge 123+, Firefox 125+, Safari 17.5+.
- Every text/background pair meets WCAG AA. Solid primary is `green-700` (`#15803d`), not the reference's `green-600`.
- JS: no dependencies; DOM built with `textContent`, never `innerHTML` from options.
- Size budget (gzip): `ui.min.css` ≤ 40 KB, `ui.min.js` ≤ 25 KB.
- Test server port **4317** (not 4173, which Vite preview uses). Never touch Postgres or port 5432.
- Do not modify `C:\jojo2\koperasi-ui-component`; it is read-only reference.

## File map

```
package.json                     workspace root, scripts, devDependencies
.gitignore
stylelint.config.mjs             naming + no-raw-colour rules
playwright.config.mjs            4 projects: chromium, firefox, webkit, visual
scripts/serve.mjs                static server for docs + tests (port 4317)
packages/ui/
  package.json                   @ui-shared-libs/ui, exports
  README.md  LICENSE
  scripts/build.mjs              CSS + JS bundles → dist/
  scripts/size.mjs               gzip budget check
  src/ui.css                     layer order + imports
  src/tokens/{primitives,semantic,glyphs,dark}.css
  src/base/{reset,typography,motion}.css
  src/utilities/layout.css
  src/components/index.css       imports every component file
  src/components/{close,button,form,choice,checkbox,switch,card,badge,alert,modal,toast}.css
  src/js/index.js                public API + auto-start
  src/js/runtime.js              registry, init/destroy, observer, events
  src/js/core/{dismiss,dialog,toast}.js
docs/index.html
docs/assets/{docs.css,docs.js}
docs/components/{layout,button,form,choice,card,badge,alert,modal,toast}.html
tests/node/{build,stylelint,size,pack}.test.mjs
tests/e2e/helpers.mjs
tests/e2e/{docs,tokens,layout,button,form,choice,card,runtime,modal,toast,a11y}.spec.mjs
tests/fixtures/runtime.html
tests/visual/pages.spec.mjs
.github/workflows/{ci,pages}.yml
```

`form.css` holds input, textarea, select and form-group; `checkbox.css` holds checkbox and radio; `choice.css` holds the label wrapper and groups those three share. Each becomes one file in `dist/components/`.

---

### Task 1: Workspace and build pipeline

**Files:**
- Create: `package.json`, `.gitignore`, `packages/ui/package.json`, `packages/ui/scripts/build.mjs`
- Create (stubs filled by later tasks): `packages/ui/src/ui.css`, `packages/ui/src/tokens/{primitives,semantic,glyphs,dark}.css`, `packages/ui/src/base/{reset,typography,motion}.css`, `packages/ui/src/utilities/layout.css`, `packages/ui/src/components/index.css`, `packages/ui/src/js/index.js`
- Test: `tests/node/build.test.mjs`

**Interfaces:**
- Produces: `build({ outDir? }) → Promise<{ outDir: string, files: string[] }>` and `LAYERS` (the layer statement string) from `packages/ui/scripts/build.mjs`. `files` are paths relative to `outDir`, forward slashes, e.g. `components/button.css`.
- Produces: `dist/ui.css`, `ui.min.css`, `tokens.css`, `tokens.min.css`, `base.css`, `base.min.css`, `components/<name>.css` + `.min.css` for every `src/components/*.css` except `index.css`, `ui.js`, `ui.min.js`, `ui.iife.min.js` (global `UI`).

- [ ] **Step 1: Branch**

```bash
cd /c/jojo/ui-shared-libs && git checkout -b feat/m1-foundation
```

- [ ] **Step 2: Root files**

`package.json`:

```json
{
  "name": "ui-shared-libs-workspace",
  "private": true,
  "type": "module",
  "workspaces": ["packages/*"],
  "scripts": {
    "build": "npm run build --workspace @ui-shared-libs/ui",
    "serve": "node scripts/serve.mjs",
    "lint:css": "stylelint \"packages/ui/src/**/*.css\"",
    "size": "node packages/ui/scripts/size.mjs",
    "test:node": "node --test \"tests/node/**/*.test.mjs\"",
    "test:e2e": "playwright test --project=chromium --project=firefox --project=webkit",
    "test:visual": "playwright test --project=visual",
    "test": "npm run build && npm run lint:css && npm run test:node && npm run size && npm run test:e2e"
  },
  "devDependencies": {
    "@axe-core/playwright": "4.10.2",
    "@playwright/test": "1.53.1",
    "esbuild": "0.25.5",
    "lightningcss": "1.30.1",
    "stylelint": "16.21.0"
  }
}
```

`.gitignore`:

```
node_modules/
packages/ui/dist/
test-results/
playwright-report/
*.tgz
```

`packages/ui/package.json`:

```json
{
  "name": "@ui-shared-libs/ui",
  "version": "0.1.0",
  "description": "A framework-free UI kit: one CSS file and optional JavaScript, for any stack.",
  "license": "MIT",
  "type": "module",
  "main": "./dist/ui.js",
  "module": "./dist/ui.js",
  "style": "./dist/ui.css",
  "unpkg": "./dist/ui.iife.min.js",
  "jsdelivr": "./dist/ui.iife.min.js",
  "exports": {
    ".": "./dist/ui.js",
    "./ui.css": "./dist/ui.css",
    "./ui.min.css": "./dist/ui.min.css",
    "./tokens.css": "./dist/tokens.css",
    "./base.css": "./dist/base.css",
    "./components/*": "./dist/components/*",
    "./ui.min.js": "./dist/ui.min.js",
    "./ui.iife.min.js": "./dist/ui.iife.min.js",
    "./package.json": "./package.json"
  },
  "files": ["dist"],
  "sideEffects": true,
  "scripts": {
    "build": "node scripts/build.mjs",
    "prepack": "node scripts/build.mjs"
  },
  "repository": { "type": "git", "url": "git+https://github.com/ITZjoo/ui-shared-libs.git", "directory": "packages/ui" },
  "homepage": "https://itzjoo.github.io/ui-shared-libs/docs/",
  "publishConfig": { "access": "public" }
}
```

- [ ] **Step 3: Install**

Run: `npm install`
Expected: exit 0, `node_modules/@ui-shared-libs/ui` is a link to `packages/ui`. If a pinned version is missing from the registry, run `npm view <pkg> versions --json` and pin the nearest existing patch of the same minor.

- [ ] **Step 4: Source stubs**

`packages/ui/src/ui.css`:

```css
@layer ui.reset, ui.tokens, ui.base, ui.components, ui.utilities;
@import "./base/reset.css" layer(ui.reset);
@import "./tokens/primitives.css" layer(ui.tokens);
@import "./tokens/semantic.css" layer(ui.tokens);
@import "./tokens/glyphs.css" layer(ui.tokens);
@import "./tokens/dark.css" layer(ui.tokens);
@import "./base/typography.css" layer(ui.base);
@import "./base/motion.css" layer(ui.base);
@import "./components/index.css" layer(ui.components);
@import "./utilities/layout.css" layer(ui.utilities);
```

Each of these files gets exactly one comment line for now:

| File | Content |
|---|---|
| `src/tokens/primitives.css` | `/* Primitive tokens: colour scales, spacing, radii, type, motion. */` |
| `src/tokens/semantic.css` | `/* Semantic tokens: what components read. */` |
| `src/tokens/glyphs.css` | `/* Glyph tokens: SVG data URIs used as masks. */` |
| `src/tokens/dark.css` | `/* Colour scheme switching. */` |
| `src/base/reset.css` | `/* Reset. */` |
| `src/base/typography.css` | `/* Document defaults. */` |
| `src/base/motion.css` | `/* Shared keyframes and reduced motion. */` |
| `src/utilities/layout.css` | `/* Layout utilities. */` |
| `src/components/index.css` | `/* One @import per component file. */` |

`packages/ui/src/js/index.js`:

```js
export const version = '0.1.0';
```

- [ ] **Step 5: Write the failing test**

`tests/node/build.test.mjs`:

```js
import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { build, LAYERS } from '../../packages/ui/scripts/build.mjs';

let out;
before(async () => {
  out = await build({ outDir: await mkdtemp(join(tmpdir(), 'ui-build-')) });
});

test('build writes every bundle', async () => {
  for (const file of ['ui.css', 'ui.min.css', 'tokens.css', 'tokens.min.css', 'base.css', 'base.min.css', 'ui.js', 'ui.min.js', 'ui.iife.min.js']) {
    assert.ok(out.files.includes(file), `missing ${file}`);
  }
  assert.ok((await readdir(out.outDir)).includes('components'));
});

test('every CSS bundle starts with the layer order', async () => {
  for (const file of out.files.filter((f) => f.endsWith('.css') && !f.endsWith('.min.css'))) {
    const css = await readFile(join(out.outDir, file), 'utf8');
    assert.ok(css.trimStart().startsWith(LAYERS), `${file} starts with: ${css.slice(0, 80)}`);
  }
});

test('the IIFE defines a global UI', async () => {
  const js = await readFile(join(out.outDir, 'ui.iife.min.js'), 'utf8');
  assert.match(js, /var UI=/);
});
```

- [ ] **Step 6: Run it to verify it fails**

Run: `node --test tests/node/build.test.mjs`
Expected: FAIL, `Cannot find module '.../packages/ui/scripts/build.mjs'`.

- [ ] **Step 7: Implement the build**

`packages/ui/scripts/build.mjs`:

```js
// Builds packages/ui/src into dist/: the full CSS bundle, tokens and base on
// their own, one file per component (all readable and minified), and the JS
// runtime as ESM and as an IIFE that defines window.UI.
import { bundleAsync } from 'lightningcss';
import { build as esbuild } from 'esbuild';
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const pkgDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = join(pkgDir, 'src');

export const LAYERS = '@layer ui.reset, ui.tokens, ui.base, ui.components, ui.utilities;';

const version = (major, minor = 0) => (major << 16) | (minor << 8);
export const cssTargets = { chrome: version(123), edge: version(123), firefox: version(125), safari: version(17, 5) };
export const jsTargets = ['chrome123', 'edge123', 'firefox125', 'safari17.5'];

const TOKEN_FILES = ['tokens/primitives.css', 'tokens/semantic.css', 'tokens/glyphs.css', 'tokens/dark.css'];
const BASE_FILES = [['base/reset.css', 'ui.reset'], ['base/typography.css', 'ui.base'], ['base/motion.css', 'ui.base']];

// A virtual entry: the layer order, then each file imported into its layer.
const entry = (imports) =>
  [LAYERS, ...imports.map(([file, layer]) => `@import "./${file}" layer(${layer});`)].join('\n');

async function bundleCss(filename, code) {
  const resolver = code === undefined ? undefined : {
    read: (path) => (path === filename ? code : readFile(path, 'utf8')),
  };
  const result = {};
  for (const minify of [false, true]) {
    const { code: out } = await bundleAsync({ filename, minify, targets: cssTargets, resolver });
    result[minify ? 'min' : 'full'] = Buffer.from(out).toString();
  }
  return result;
}

export async function build({ outDir = join(pkgDir, 'dist') } = {}) {
  await rm(outDir, { recursive: true, force: true });
  await mkdir(join(outDir, 'components'), { recursive: true });
  const files = [];

  const write = async (rel, contents) => {
    const file = join(outDir, rel);
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, contents);
    files.push(rel);
  };
  const emitCss = async (name, filename, code) => {
    const { full, min } = await bundleCss(filename, code);
    await write(`${name}.css`, full);
    await write(`${name}.min.css`, min);
  };

  await emitCss('ui', join(srcDir, 'ui.css'));
  await emitCss('tokens', join(srcDir, '__tokens__.css'), entry(TOKEN_FILES.map((f) => [f, 'ui.tokens'])));
  await emitCss('base', join(srcDir, '__base__.css'), entry(BASE_FILES));
  for (const name of await readdir(join(srcDir, 'components'))) {
    if (!name.endsWith('.css') || name === 'index.css') continue;
    const base = name.slice(0, -'.css'.length);
    await emitCss(`components/${base}`, join(srcDir, `__component_${base}__.css`), entry([[`components/${name}`, 'ui.components']]));
  }

  const common = { entryPoints: [join(srcDir, 'js/index.js')], bundle: true, target: jsTargets, write: false, logLevel: 'silent' };
  const variants = [
    ['ui.js', { format: 'esm' }],
    ['ui.min.js', { format: 'esm', minify: true }],
    ['ui.iife.min.js', { format: 'iife', globalName: 'UI', minify: true }],
  ];
  for (const [rel, options] of variants) {
    const { outputFiles } = await esbuild({ ...common, ...options });
    await write(rel, outputFiles[0].text);
  }
  return { outDir, files };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { files } = await build();
  console.log(`built ${files.length} files into packages/ui/dist/`);
}
```

- [ ] **Step 8: Run the test to verify it passes**

Run: `node --test tests/node/build.test.mjs`
Expected: `# pass 3`, `# fail 0`.

- [ ] **Step 9: Falsify**

Change the first line of `src/ui.css` to `@layer ui.reset, ui.tokens;` and rerun. Expected: test 2 FAILS for `ui.css`. Restore the line; rerun; `# fail 0`. (Editing `LAYERS` in `build.mjs` would not falsify anything: the test imports the same constant.)

- [ ] **Step 10: Build from npm and commit**

Run: `npm run build`
Expected: `built 9 files into packages/ui/dist/`.

```bash
git add package.json package-lock.json .gitignore packages/ui tests/node/build.test.mjs
git commit -m "build: workspace and Lightning CSS + esbuild pipeline"
```

---

### Task 2: Static server, Playwright harness, docs shell

**Files:**
- Create: `scripts/serve.mjs`, `playwright.config.mjs`, `docs/index.html`, `docs/assets/docs.css`, `docs/assets/docs.js`
- Test: `tests/e2e/docs.spec.mjs`

**Interfaces:**
- Produces: server on `http://127.0.0.1:4317` serving the repo root; Playwright `baseURL` is that origin, so tests `goto('/docs/...')`.
- Produces: docs page conventions every later docs page follows: `<header class="docs-header">` with a `[data-docs-theme]` button; `<main class="docs-main">`; each example is `<section class="docs-example">` containing `<div class="docs-demo">…</div>`; `docs.js` adds a `<pre class="docs-code" tabindex="0">` after each demo holding the demo's markup. `[data-docs-toast]` buttons call `UI.toast(JSON.parse(value))`.
- Produces: `docs/index.html` has `<ul class="docs-list" id="components">`; each component task adds one `<li>`.

- [ ] **Step 1: Write the failing test**

`tests/e2e/docs.spec.mjs`:

```js
import { test, expect } from '@playwright/test';

test('docs index loads with no failed requests or errors', async ({ page }) => {
  const failed = [];
  const errors = [];
  page.on('response', (r) => { if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`); });
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/docs/index.html');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('ui-shared-libs');
  expect(failed).toEqual([]);
  expect(errors).toEqual([]);
});

test('theme toggle cycles system → light → dark and persists', async ({ page }) => {
  await page.goto('/docs/index.html');
  const html = page.locator('html');
  const toggle = page.locator('[data-docs-theme]');
  await expect(toggle).toHaveText('Theme: system');
  await expect(html).not.toHaveAttribute('data-theme');
  await toggle.click();
  await expect(html).toHaveAttribute('data-theme', 'light');
  await toggle.click();
  await expect(html).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(html).toHaveAttribute('data-theme', 'dark');
  await page.locator('[data-docs-theme]').click();
  await expect(html).not.toHaveAttribute('data-theme');
});
```

- [ ] **Step 2: Playwright config and browsers**

`playwright.config.mjs`:

```js
import { defineConfig, devices } from '@playwright/test';

const PORT = 4317;

export default defineConfig({
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: { baseURL: `http://127.0.0.1:${PORT}`, trace: 'retain-on-failure' },
  webServer: {
    command: 'npm run build && node scripts/serve.mjs',
    url: `http://127.0.0.1:${PORT}/docs/index.html`,
    env: { PORT: String(PORT) },
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  projects: [
    { name: 'chromium', testDir: 'tests/e2e', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', testDir: 'tests/e2e', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', testDir: 'tests/e2e', use: { ...devices['Desktop Safari'] } },
    { name: 'visual', testDir: 'tests/visual', use: { ...devices['Desktop Chrome'] } },
  ],
});
```

Run: `npx playwright install chromium firefox webkit`
Expected: exit 0.

Run: `netstat -ano | grep 4317`
Expected: no output (port free). If something listens, stop and ask; do not change the port silently.

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx playwright test tests/e2e/docs.spec.mjs --project=chromium`
Expected: FAIL — the web server command fails (`scripts/serve.mjs` not found) or times out.

- [ ] **Step 4: Static server**

`scripts/serve.mjs`:

```js
// Static server for the docs and the tests. Serves the repository root on
// 127.0.0.1 only, with no caching, so a rebuild is visible on reload.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const port = Number(process.env.PORT ?? 4317);
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
};

createServer(async (req, res) => {
  const { pathname } = new URL(req.url, 'http://localhost');
  let path = normalize(join(root, decodeURIComponent(pathname)));
  if (!path.startsWith(root)) {
    res.writeHead(403).end();
    return;
  }
  try {
    if ((await stat(path)).isDirectory()) path = join(path, 'index.html');
    const body = await readFile(path);
    res.writeHead(200, { 'content-type': types[extname(path)] ?? 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('not found');
  }
}).listen(port, '127.0.0.1', () => console.log(`serving ${root} at http://127.0.0.1:${port}/docs/`));
```

- [ ] **Step 5: Docs shell**

`docs/index.html`:

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>ui-shared-libs</title>
  <link rel="stylesheet" href="../packages/ui/dist/ui.css">
  <link rel="stylesheet" href="assets/docs.css">
  <script src="assets/docs.js" defer></script>
  <script src="../packages/ui/dist/ui.iife.min.js" defer></script>
</head>
<body>
  <header class="docs-header">
    <a class="docs-brand" href="index.html">ui-shared-libs</a>
    <button type="button" class="ui-btn ui-btn--ghost ui-btn--sm" data-docs-theme>Theme: system</button>
  </header>
  <main class="docs-main">
    <h1>ui-shared-libs</h1>
    <p class="docs-lead">One CSS file and optional JavaScript for HTML from any stack.</p>
    <h2>Install</h2>
    <pre class="docs-code docs-code--alone" tabindex="0"><code>&lt;link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@ui-shared-libs/ui@0.1/dist/ui.min.css"&gt;
&lt;script src="https://cdn.jsdelivr.net/npm/@ui-shared-libs/ui@0.1/dist/ui.iife.min.js" defer&gt;&lt;/script&gt;</code></pre>
    <h2>Components</h2>
    <ul class="docs-list" id="components">
    </ul>
  </main>
</body>
</html>
```

`docs/assets/docs.css` (docs chrome only; not part of the kit, not linted; must not set `body` colours, which the tokens test checks):

```css
.docs-header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 1.5rem;
  border-bottom: 1px solid var(--ui-border);
  background: var(--ui-surface);
}
.docs-brand { font-weight: 600; color: var(--ui-fg); text-decoration: none; }
.docs-main { max-width: 56rem; margin: 0 auto; padding: 2rem 1.5rem 4rem; }
.docs-main h1 { font-size: 1.875rem; line-height: 2.25rem; margin-bottom: 0.5rem; }
.docs-main h2 { font-size: 1.125rem; line-height: 1.75rem; margin: 2.5rem 0 1rem; }
.docs-lead { color: var(--ui-fg-muted); margin-bottom: 1.5rem; }
.docs-demo {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1.5rem;
  border: 1px solid var(--ui-border);
  border-radius: 12px 12px 0 0;
  background: var(--ui-surface);
}
.docs-demo--stack { flex-direction: column; align-items: stretch; }
.docs-code {
  margin: 0;
  padding: 1rem 1.25rem;
  overflow-x: auto;
  border: 1px solid var(--ui-border);
  border-top: 0;
  border-radius: 0 0 12px 12px;
  background: var(--ui-surface-sunken);
  color: var(--ui-fg);
  font: 0.8125rem/1.6 var(--ui-font-mono);
}
.docs-code--alone { border-top: 1px solid var(--ui-border); border-radius: 12px; }
.docs-list { display: grid; gap: 0.5rem; padding-left: 1.25rem; }
.docs-list a { color: var(--ui-primary); }
```

`docs/assets/docs.js`:

```js
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
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npx playwright test tests/e2e/docs.spec.mjs --project=chromium --project=firefox --project=webkit`
Expected: `6 passed`.

- [ ] **Step 7: Commit**

```bash
git add scripts/serve.mjs playwright.config.mjs docs tests/e2e/docs.spec.mjs
git commit -m "test: static server, Playwright harness and docs shell"
```

---

### Task 3: Tokens, base and dark mode

**Files:**
- Modify (replace stub content): `packages/ui/src/tokens/{primitives,semantic,glyphs,dark}.css`, `packages/ui/src/base/{reset,typography,motion}.css`
- Create: `tests/e2e/helpers.mjs`
- Test: `tests/e2e/tokens.spec.mjs`

**Interfaces:**
- Produces (used by every component): all custom properties below. Semantic intents: for `I` in `primary success warning danger info`: `--ui-I`, `--ui-I-hover`, `--ui-I-active`, `--ui-I-on`, `--ui-I-subtle`, `--ui-I-subtle-fg`, `--ui-I-border`. Neutral: `--ui-neutral`, `--ui-neutral-subtle`, `--ui-neutral-subtle-fg`, `--ui-neutral-border`. Also `--ui-bg`, `--ui-surface`, `--ui-surface-raised`, `--ui-surface-sunken`, `--ui-overlay`, `--ui-fg`, `--ui-fg-muted`, `--ui-fg-subtle`, `--ui-border`, `--ui-border-strong`, `--ui-thumb`, `--ui-shadow-sm|md|lg|xl`, `--ui-focus-ring`, `--ui-focus-ring-danger`, `--ui-focus-width`, `--ui-control-radius`, `--ui-button-radius`, `--ui-glyph-check|dash|x`, keyframes `ui-spin`.
- Produces `tests/e2e/helpers.mjs`: `setTheme(page, 'light'|'dark'|null)`, `settle(page)`, `css(locator, prop, pseudo?) → Promise<string>`, `tokenColor(page, '--ui-x') → Promise<string>` (computed `rgb(...)`).

- [ ] **Step 1: Helpers**

`tests/e2e/helpers.mjs`:

```js
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
```

- [ ] **Step 2: Write the failing test**

`tests/e2e/tokens.spec.mjs`:

```js
import { test, expect } from '@playwright/test';
import { css, setTheme, tokenColor } from './helpers.mjs';

const GRAY_50 = 'rgb(249, 250, 251)';
const GRAY_950 = 'rgb(3, 7, 18)';
const GREEN_700 = 'rgb(21, 128, 61)';
const GREEN_500 = 'rgb(34, 197, 94)';

test.describe('light device', () => {
  test.use({ colorScheme: 'light' });

  test('defaults to light tokens', async ({ page }) => {
    await page.goto('/docs/index.html');
    expect(await css(page.locator('body'), 'background-color')).toBe(GRAY_50);
    expect(await tokenColor(page, '--ui-primary')).toBe(GREEN_700);
  });

  test('data-theme="dark" forces dark', async ({ page }) => {
    await page.goto('/docs/index.html');
    await setTheme(page, 'dark');
    expect(await css(page.locator('body'), 'background-color')).toBe(GRAY_950);
    expect(await tokenColor(page, '--ui-primary')).toBe(GREEN_500);
  });
});

test.describe('dark device', () => {
  test.use({ colorScheme: 'dark' });

  test('follows the device', async ({ page }) => {
    await page.goto('/docs/index.html');
    expect(await css(page.locator('body'), 'background-color')).toBe(GRAY_950);
  });

  test('data-theme="light" forces light', async ({ page }) => {
    await page.goto('/docs/index.html');
    await setTheme(page, 'light');
    expect(await css(page.locator('body'), 'background-color')).toBe(GRAY_50);
  });
});

test('unlayered app CSS overrides a token without !important', async ({ page }) => {
  await page.goto('/docs/index.html');
  await page.addStyleTag({ content: ':root { --ui-primary: #2563eb; }' });
  expect(await tokenColor(page, '--ui-primary')).toBe('rgb(37, 99, 235)');
});

test('reset makes boxes border-box', async ({ page }) => {
  await page.goto('/docs/index.html');
  expect(await css(page.locator('main'), 'box-sizing')).toBe('border-box');
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `npx playwright test tests/e2e/tokens.spec.mjs --project=chromium`
Expected: FAIL — body background is `rgba(0, 0, 0, 0)`, token colour is the default text colour.

- [ ] **Step 4: Primitives**

`packages/ui/src/tokens/primitives.css` (`::backdrop` is listed because older engines do not let a dialog's backdrop inherit custom properties):

```css
:root,
::backdrop {
  --ui-white: #fff;
  --ui-black: #000;

  --ui-green-50: #f0fdf4;
  --ui-green-100: #dcfce7;
  --ui-green-200: #bbf7d0;
  --ui-green-300: #86efac;
  --ui-green-400: #4ade80;
  --ui-green-500: #22c55e;
  --ui-green-600: #16a34a;
  --ui-green-700: #15803d;
  --ui-green-800: #166534;
  --ui-green-900: #14532d;
  --ui-green-950: #052e16;

  --ui-yellow-50: #fefce8;
  --ui-yellow-100: #fef9c3;
  --ui-yellow-200: #fef08a;
  --ui-yellow-300: #fde047;
  --ui-yellow-400: #facc15;
  --ui-yellow-500: #eab308;
  --ui-yellow-600: #ca8a04;
  --ui-yellow-700: #a16207;
  --ui-yellow-800: #854d0e;
  --ui-yellow-900: #713f12;
  --ui-yellow-950: #422006;

  --ui-red-50: #fef2f2;
  --ui-red-100: #fee2e2;
  --ui-red-200: #fecaca;
  --ui-red-300: #fca5a5;
  --ui-red-400: #f87171;
  --ui-red-500: #ef4444;
  --ui-red-600: #dc2626;
  --ui-red-700: #b91c1c;
  --ui-red-800: #991b1b;
  --ui-red-900: #7f1d1d;
  --ui-red-950: #450a0a;

  --ui-orange-50: #fff7ed;
  --ui-orange-100: #ffedd5;
  --ui-orange-200: #fed7aa;
  --ui-orange-300: #fdba74;
  --ui-orange-400: #fb923c;
  --ui-orange-500: #f97316;
  --ui-orange-600: #ea580c;
  --ui-orange-700: #c2410c;
  --ui-orange-800: #9a3412;
  --ui-orange-900: #7c2d12;
  --ui-orange-950: #431407;

  --ui-sky-50: #f0f9ff;
  --ui-sky-100: #e0f2fe;
  --ui-sky-200: #bae6fd;
  --ui-sky-300: #7dd3fc;
  --ui-sky-400: #38bdf8;
  --ui-sky-500: #0ea5e9;
  --ui-sky-600: #0284c7;
  --ui-sky-700: #0369a1;
  --ui-sky-800: #075985;
  --ui-sky-900: #0c4a6e;
  --ui-sky-950: #082f49;

  --ui-gray-50: #f9fafb;
  --ui-gray-100: #f3f4f6;
  --ui-gray-200: #e5e7eb;
  --ui-gray-300: #d1d5db;
  --ui-gray-400: #9ca3af;
  --ui-gray-500: #6b7280;
  --ui-gray-600: #4b5563;
  --ui-gray-700: #374151;
  --ui-gray-800: #1f2937;
  --ui-gray-900: #111827;
  --ui-gray-950: #030712;

  --ui-space-0-5: 2px;
  --ui-space-1: 4px;
  --ui-space-1-5: 6px;
  --ui-space-2: 8px;
  --ui-space-2-5: 10px;
  --ui-space-3: 12px;
  --ui-space-4: 16px;
  --ui-space-5: 20px;
  --ui-space-6: 24px;
  --ui-space-8: 32px;
  --ui-space-10: 40px;
  --ui-space-12: 48px;
  --ui-space-16: 64px;

  --ui-radius-sm: 2px;
  --ui-radius: 4px;
  --ui-radius-md: 6px;
  --ui-radius-lg: 8px;
  --ui-radius-xl: 12px;
  --ui-radius-2xl: 16px;
  --ui-radius-3xl: 24px;
  --ui-radius-full: 9999px;

  --ui-font-sans: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --ui-font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  --ui-text-xs: 0.75rem;
  --ui-leading-xs: 1rem;
  --ui-text-sm: 0.875rem;
  --ui-leading-sm: 1.25rem;
  --ui-text-base: 1rem;
  --ui-leading-base: 1.5rem;
  --ui-text-lg: 1.125rem;
  --ui-leading-lg: 1.75rem;
  --ui-text-xl: 1.25rem;
  --ui-leading-xl: 1.75rem;
  --ui-text-2xl: 1.5rem;
  --ui-leading-2xl: 2rem;
  --ui-weight-normal: 400;
  --ui-weight-medium: 500;
  --ui-weight-semibold: 600;
  --ui-weight-bold: 700;

  --ui-duration-fast: 150ms;
  --ui-duration: 200ms;
  --ui-duration-slow: 300ms;
  --ui-ease: cubic-bezier(0.2, 0, 0, 1);
  --ui-ease-spring: cubic-bezier(0.34, 1.3, 0.64, 1);

  --ui-z-modal: 1000;
  --ui-z-toast: 1100;
}
```

- [ ] **Step 5: Semantic tokens**

`packages/ui/src/tokens/semantic.css`:

```css
:root,
::backdrop {
  --ui-bg: light-dark(var(--ui-gray-50), var(--ui-gray-950));
  --ui-surface: light-dark(var(--ui-white), var(--ui-gray-900));
  --ui-surface-raised: light-dark(var(--ui-white), var(--ui-gray-800));
  --ui-surface-sunken: light-dark(var(--ui-gray-100), var(--ui-gray-950));
  --ui-overlay: color-mix(in srgb, var(--ui-gray-950) 55%, transparent);

  --ui-fg: light-dark(var(--ui-gray-900), var(--ui-gray-50));
  --ui-fg-muted: light-dark(var(--ui-gray-500), var(--ui-gray-400));
  --ui-fg-subtle: light-dark(var(--ui-gray-400), var(--ui-gray-500));
  --ui-border: light-dark(var(--ui-gray-200), var(--ui-gray-800));
  --ui-border-strong: light-dark(var(--ui-gray-300), var(--ui-gray-700));
  --ui-thumb: light-dark(var(--ui-white), var(--ui-gray-100));

  --ui-primary: light-dark(var(--ui-green-700), var(--ui-green-500));
  --ui-primary-hover: light-dark(var(--ui-green-800), var(--ui-green-400));
  --ui-primary-active: light-dark(var(--ui-green-900), var(--ui-green-300));
  --ui-primary-on: light-dark(var(--ui-white), var(--ui-gray-950));
  --ui-primary-subtle: light-dark(var(--ui-green-50), color-mix(in srgb, var(--ui-green-500) 16%, transparent));
  --ui-primary-subtle-fg: light-dark(var(--ui-green-800), var(--ui-green-300));
  --ui-primary-border: light-dark(var(--ui-green-200), var(--ui-green-800));

  --ui-success: light-dark(var(--ui-green-700), var(--ui-green-500));
  --ui-success-hover: light-dark(var(--ui-green-800), var(--ui-green-400));
  --ui-success-active: light-dark(var(--ui-green-900), var(--ui-green-300));
  --ui-success-on: light-dark(var(--ui-white), var(--ui-gray-950));
  --ui-success-subtle: light-dark(var(--ui-green-50), color-mix(in srgb, var(--ui-green-500) 16%, transparent));
  --ui-success-subtle-fg: light-dark(var(--ui-green-800), var(--ui-green-300));
  --ui-success-border: light-dark(var(--ui-green-200), var(--ui-green-800));

  --ui-warning: light-dark(var(--ui-yellow-500), var(--ui-yellow-400));
  --ui-warning-hover: light-dark(var(--ui-yellow-600), var(--ui-yellow-300));
  --ui-warning-active: light-dark(var(--ui-yellow-700), var(--ui-yellow-200));
  --ui-warning-on: light-dark(var(--ui-gray-900), var(--ui-gray-950));
  --ui-warning-subtle: light-dark(var(--ui-yellow-50), color-mix(in srgb, var(--ui-yellow-400) 16%, transparent));
  --ui-warning-subtle-fg: light-dark(var(--ui-yellow-800), var(--ui-yellow-200));
  --ui-warning-border: light-dark(var(--ui-yellow-200), var(--ui-yellow-800));

  --ui-danger: light-dark(var(--ui-red-600), var(--ui-red-500));
  --ui-danger-hover: light-dark(var(--ui-red-700), var(--ui-red-400));
  --ui-danger-active: light-dark(var(--ui-red-800), var(--ui-red-300));
  --ui-danger-on: light-dark(var(--ui-white), var(--ui-gray-950));
  --ui-danger-subtle: light-dark(var(--ui-red-50), color-mix(in srgb, var(--ui-red-500) 16%, transparent));
  --ui-danger-subtle-fg: light-dark(var(--ui-red-700), var(--ui-red-300));
  --ui-danger-border: light-dark(var(--ui-red-200), var(--ui-red-800));

  --ui-info: light-dark(var(--ui-sky-700), var(--ui-sky-500));
  --ui-info-hover: light-dark(var(--ui-sky-800), var(--ui-sky-400));
  --ui-info-active: light-dark(var(--ui-sky-900), var(--ui-sky-300));
  --ui-info-on: light-dark(var(--ui-white), var(--ui-gray-950));
  --ui-info-subtle: light-dark(var(--ui-sky-50), color-mix(in srgb, var(--ui-sky-500) 16%, transparent));
  --ui-info-subtle-fg: light-dark(var(--ui-sky-800), var(--ui-sky-300));
  --ui-info-border: light-dark(var(--ui-sky-200), var(--ui-sky-800));

  --ui-neutral: light-dark(var(--ui-gray-400), var(--ui-gray-500));
  --ui-neutral-subtle: light-dark(var(--ui-gray-100), var(--ui-gray-800));
  --ui-neutral-subtle-fg: light-dark(var(--ui-gray-700), var(--ui-gray-300));
  --ui-neutral-border: light-dark(var(--ui-gray-300), var(--ui-gray-700));

  --ui-shadow-color: light-dark(var(--ui-gray-900), var(--ui-black));
  --ui-shadow-sm: 0 1px 2px 0 color-mix(in srgb, var(--ui-shadow-color) 6%, transparent);
  --ui-shadow-md: 0 4px 6px -1px color-mix(in srgb, var(--ui-shadow-color) 8%, transparent), 0 2px 4px -2px color-mix(in srgb, var(--ui-shadow-color) 8%, transparent);
  --ui-shadow-lg: 0 10px 15px -3px color-mix(in srgb, var(--ui-shadow-color) 10%, transparent), 0 4px 6px -4px color-mix(in srgb, var(--ui-shadow-color) 10%, transparent);
  --ui-shadow-xl: 0 25px 50px -12px color-mix(in srgb, var(--ui-shadow-color) 25%, transparent);

  --ui-focus-width: 3px;
  --ui-focus-ring: color-mix(in srgb, var(--ui-primary) 40%, transparent);
  --ui-focus-ring-danger: color-mix(in srgb, var(--ui-danger) 40%, transparent);
  --ui-control-radius: var(--ui-radius-lg);
  --ui-button-radius: var(--ui-radius-full);
}
```

- [ ] **Step 6: Glyphs, scheme, base**

`packages/ui/src/tokens/glyphs.css`:

```css
:root,
::backdrop {
  --ui-glyph-check: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='3.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M5 12.5l4.5 4.5L19 7.5'/%3E%3C/svg%3E");
  --ui-glyph-dash: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='3.5' stroke-linecap='round'%3E%3Cpath d='M6 12h12'/%3E%3C/svg%3E");
  --ui-glyph-x: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='2.5' stroke-linecap='round'%3E%3Cpath d='M6 6l12 12M18 6L6 18'/%3E%3C/svg%3E");
}
```

`packages/ui/src/tokens/dark.css`:

```css
/* The device decides by default; data-theme or a scope class forces one. */
:root { color-scheme: light dark; }
:root[data-theme="light"],
.ui-theme-light { color-scheme: light; }
:root[data-theme="dark"],
.ui-theme-dark { color-scheme: dark; }
```

`packages/ui/src/base/reset.css`:

```css
*,
*::before,
*::after { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; text-size-adjust: 100%; }
body, h1, h2, h3, h4, h5, h6, p, figure, blockquote, dl, dd { margin: 0; }
img, picture, svg, video, canvas { display: block; max-inline-size: 100%; }
input, button, textarea, select { font: inherit; color: inherit; }
```

`packages/ui/src/base/typography.css`:

```css
body {
  font-family: var(--ui-font-sans);
  font-size: var(--ui-text-base);
  line-height: var(--ui-leading-base);
  color: var(--ui-fg);
  background-color: var(--ui-bg);
  -webkit-font-smoothing: antialiased;
}
::selection { background-color: var(--ui-primary-subtle); color: var(--ui-fg); }
:focus-visible { outline: var(--ui-focus-width) solid var(--ui-focus-ring); outline-offset: 2px; }
```

`packages/ui/src/base/motion.css`:

```css
@keyframes ui-spin { to { transform: rotate(1turn); } }

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after { transition-duration: 0.01ms; scroll-behavior: auto; }
}
```

- [ ] **Step 7: Run the test to verify it passes**

Run: `npx playwright test tests/e2e/tokens.spec.mjs --project=chromium --project=firefox --project=webkit`
Expected: `18 passed`.

- [ ] **Step 8: Falsify**

In `semantic.css` change `--ui-bg`'s dark value to `var(--ui-gray-50)`, rerun chromium. Expected: the two dark tests FAIL with `rgb(249, 250, 251)`. Restore; rerun; pass.

- [ ] **Step 9: Commit**

```bash
git add packages/ui/src tests/e2e/helpers.mjs tests/e2e/tokens.spec.mjs
git commit -m "feat(tokens): primitives, semantic tokens, glyphs, dark mode, base"
```

---

### Task 4: Stylelint guardrails

**Files:**
- Create: `stylelint.config.mjs`
- Test: `tests/node/stylelint.test.mjs`

**Interfaces:**
- Produces: `npm run lint:css` that every later task must keep at 0 problems.

- [ ] **Step 1: Write the failing test**

`tests/node/stylelint.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import stylelint from 'stylelint';

const root = fileURLToPath(new URL('../..', import.meta.url));
const lint = async (code, rel) => {
  const { results } = await stylelint.lint({ code, codeFilename: join(root, rel), configFile: join(root, 'stylelint.config.mjs') });
  return results[0].warnings.map((w) => w.rule).sort();
};
const COMPONENT = 'packages/ui/src/components/probe.css';

test('class names need the ui- prefix and BEM shape', async () => {
  assert.deepEqual(await lint('.btn { color: var(--ui-fg); }', COMPONENT), ['selector-class-pattern']);
  assert.deepEqual(await lint('.ui-btn__icon--lg { color: var(--ui-fg); }', COMPONENT), []);
});

test('components may not use raw colours', async () => {
  assert.deepEqual(await lint('.ui-btn { color: #fff; }', COMPONENT), ['color-no-hex']);
  assert.deepEqual(await lint('.ui-btn { color: white; }', COMPONENT), ['color-named']);
  assert.deepEqual(await lint('.ui-btn { color: rgb(0 0 0); }', COMPONENT), ['function-disallowed-list']);
});

test('keywords and tokens are allowed in components', async () => {
  assert.deepEqual(await lint('.ui-btn { color: currentColor; background: transparent; border-color: color-mix(in srgb, var(--ui-fg) 10%, transparent); }', COMPONENT), []);
});

test('!important is banned', async () => {
  assert.deepEqual(await lint('.ui-btn { color: var(--ui-fg) !important; }', COMPONENT), ['declaration-no-important']);
});

test('token files may hold raw colours', async () => {
  assert.deepEqual(await lint(':root { --ui-x: #fff; }', 'packages/ui/src/tokens/probe.css'), []);
});

test('keyframes need the ui- prefix', async () => {
  assert.deepEqual(await lint('@keyframes spin { to { opacity: 0; } }', COMPONENT), ['keyframes-name-pattern']);
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test tests/node/stylelint.test.mjs`
Expected: FAIL, `No configuration provided` / cannot find `stylelint.config.mjs`.

- [ ] **Step 3: Config**

`stylelint.config.mjs`:

```js
// Kit rules: ui- naming everywhere; outside tokens/, colours only via tokens.
const NAME = '[a-z0-9]+(?:-[a-z0-9]+)*';

export default {
  rules: {
    'selector-class-pattern': [`^ui-${NAME}(?:__${NAME})?(?:--${NAME})?$`, { message: (s) => `"${s}": use ui-<block>[__<part>][--<modifier>]` }],
    'keyframes-name-pattern': [`^ui-${NAME}$`],
    'custom-property-pattern': [`^(?:ui-|_)${NAME}$`],
    'declaration-no-important': true,
  },
  overrides: [
    {
      files: ['packages/ui/src/{base,components,modules,utilities}/**/*.css'],
      rules: {
        'color-no-hex': true,
        'color-named': 'never',
        'function-disallowed-list': ['rgb', 'rgba', 'hsl', 'hsla', 'hwb', 'lab', 'lch', 'oklab', 'oklch'],
      },
    },
  ],
};
```

- [ ] **Step 4: Run the tests and the linter**

Run: `node --test tests/node/stylelint.test.mjs`
Expected: `# pass 6`, `# fail 0`.

Run: `npm run lint:css`
Expected: exit 0, no output.

If `keywords and tokens are allowed` fails, read which value the warning names. `currentColor` and `transparent` must stay legal: find how this Stylelint version classifies them (search `node_modules/stylelint/lib/rules/color-named/` for its keyword list), change only what is needed to allow those two, keep `white` failing (the test above checks it), and note the finding in the commit message.

- [ ] **Step 5: Commit**

```bash
git add stylelint.config.mjs tests/node/stylelint.test.mjs
git commit -m "lint: enforce ui- naming and token-only colours"
```

---

### Task 5: Layout utilities

**Files:**
- Modify: `packages/ui/src/utilities/layout.css`, `docs/index.html` (add list item)
- Create: `docs/components/layout.html`
- Test: `tests/e2e/layout.spec.mjs`

**Interfaces:**
- Produces: `ui-stack`, `ui-cluster`, `ui-grid` (min column `--ui-grid-min`, default 16rem), `ui-gap-{1,2,3,4,5,6,8,10,12}` (sets `--ui-gap`), `ui-container` (max `--ui-container-max`, default 75rem), `ui-sr-only`.

- [ ] **Step 1: Write the failing test**

`tests/e2e/layout.spec.mjs`:

```js
import { test, expect } from '@playwright/test';
import { css } from './helpers.mjs';

test.beforeEach(async ({ page }) => { await page.goto('/docs/components/layout.html'); });

test('stack is a column with the default gap', async ({ page }) => {
  const stack = page.locator('#stack-default');
  expect(await css(stack, 'flex-direction')).toBe('column');
  expect(await css(stack, 'row-gap')).toBe('16px');
});

test('gap utilities set the gap', async ({ page }) => {
  expect(await css(page.locator('#stack-gap-2'), 'row-gap')).toBe('8px');
  expect(await css(page.locator('#cluster-gap-6'), 'column-gap')).toBe('24px');
});

test('grid fits columns of at least 16rem', async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 800 });
  const columns = await css(page.locator('#grid'), 'grid-template-columns');
  expect(columns.split(' ').length).toBeGreaterThanOrEqual(3);
  await page.setViewportSize({ width: 375, height: 800 });
  expect((await css(page.locator('#grid'), 'grid-template-columns')).split(' ').length).toBe(1);
});

test('sr-only text is in the accessibility tree but 1px', async ({ page }) => {
  const hidden = page.locator('#sr');
  await expect(hidden).toHaveText('Only for screen readers');
  const box = await hidden.boundingBox();
  expect(box.width).toBeLessThanOrEqual(1);
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx playwright test tests/e2e/layout.spec.mjs --project=chromium`
Expected: FAIL — `page.goto` 404 → locators not found.

- [ ] **Step 3: Implement**

`packages/ui/src/utilities/layout.css`:

```css
.ui-stack { display: flex; flex-direction: column; gap: var(--ui-gap, var(--ui-space-4)); }
.ui-cluster { display: flex; flex-wrap: wrap; align-items: center; gap: var(--ui-gap, var(--ui-space-3)); }
.ui-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(var(--ui-grid-min, 16rem), 100%), 1fr));
  gap: var(--ui-gap, var(--ui-space-4));
}

.ui-gap-1 { --ui-gap: var(--ui-space-1); }
.ui-gap-2 { --ui-gap: var(--ui-space-2); }
.ui-gap-3 { --ui-gap: var(--ui-space-3); }
.ui-gap-4 { --ui-gap: var(--ui-space-4); }
.ui-gap-5 { --ui-gap: var(--ui-space-5); }
.ui-gap-6 { --ui-gap: var(--ui-space-6); }
.ui-gap-8 { --ui-gap: var(--ui-space-8); }
.ui-gap-10 { --ui-gap: var(--ui-space-10); }
.ui-gap-12 { --ui-gap: var(--ui-space-12); }

.ui-container {
  inline-size: 100%;
  max-inline-size: var(--ui-container-max, 75rem);
  margin-inline: auto;
  padding-inline: var(--ui-space-4);
}

.ui-sr-only {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}
```

`docs/components/layout.html`:

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Layout · ui-shared-libs</title>
  <link rel="stylesheet" href="../../packages/ui/dist/ui.css">
  <link rel="stylesheet" href="../assets/docs.css">
  <script src="../assets/docs.js" defer></script>
  <script src="../../packages/ui/dist/ui.iife.min.js" defer></script>
</head>
<body>
  <header class="docs-header">
    <a class="docs-brand" href="../index.html">ui-shared-libs</a>
    <button type="button" class="ui-btn ui-btn--ghost ui-btn--sm" data-docs-theme>Theme: system</button>
  </header>
  <main class="docs-main">
    <h1>Layout</h1>
    <p class="docs-lead">Stack, cluster and grid, with a gap scale. The only utilities in the kit.</p>

    <section class="docs-example" aria-labelledby="ex-stack">
      <h2 id="ex-stack">Stack</h2>
      <div class="docs-demo docs-demo--stack">
        <div class="ui-stack" id="stack-default">
          <span>First</span>
          <span>Second</span>
        </div>
        <div class="ui-stack ui-gap-2" id="stack-gap-2">
          <span>Tight</span>
          <span>Tight</span>
        </div>
      </div>
    </section>

    <section class="docs-example" aria-labelledby="ex-cluster">
      <h2 id="ex-cluster">Cluster</h2>
      <div class="docs-demo">
        <div class="ui-cluster ui-gap-6" id="cluster-gap-6">
          <span>One</span>
          <span>Two</span>
          <span>Three</span>
        </div>
      </div>
    </section>

    <section class="docs-example" aria-labelledby="ex-grid">
      <h2 id="ex-grid">Grid</h2>
      <div class="docs-demo docs-demo--stack">
        <div class="ui-grid" id="grid" style="--ui-grid-min: 12rem">
          <span>A</span>
          <span>B</span>
          <span>C</span>
          <span>D</span>
        </div>
      </div>
    </section>

    <section class="docs-example" aria-labelledby="ex-sr">
      <h2 id="ex-sr">Screen-reader only</h2>
      <div class="docs-demo">
        <span>Visible text</span>
        <span class="ui-sr-only" id="sr">Only for screen readers</span>
      </div>
    </section>
  </main>
</body>
</html>
```

Note: the grid test needs ≥3 columns at 1200px; the docs main is 56rem (896px) wide minus padding, and `--ui-grid-min: 12rem` (192px) gives 4 columns. At 375px it collapses to 1.

In `docs/index.html`, inside `<ul class="docs-list" id="components">`, add:

```html
      <li><a href="components/layout.html">Layout</a></li>
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx playwright test tests/e2e/layout.spec.mjs --project=chromium --project=firefox --project=webkit`
Expected: `12 passed`.

Run: `npm run lint:css`
Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/utilities docs tests/e2e/layout.spec.mjs
git commit -m "feat(utilities): stack, cluster, grid, gap, container, sr-only"
```

---

### Task 6: Close button and Button

**Files:**
- Create: `packages/ui/src/components/close.css`, `packages/ui/src/components/button.css`, `docs/components/button.html`
- Modify: `packages/ui/src/components/index.css`, `docs/index.html`
- Test: `tests/e2e/button.spec.mjs`

**Interfaces:**
- Produces `.ui-close` (X button; size via `--ui-close-size`, default 1.75rem) used by alert, modal and toast.
- Produces `.ui-btn` with `--primary|--secondary|--outline|--ghost|--danger`, `--sm|--lg`, `--block`, `--icon`; loading via `aria-busy="true"`.

- [ ] **Step 1: Write the failing test**

`tests/e2e/button.spec.mjs`:

```js
import { test, expect } from '@playwright/test';
import { css, setTheme } from './helpers.mjs';

test.beforeEach(async ({ page }) => { await page.goto('/docs/components/button.html'); });

test('variants use their tokens in light and dark', async ({ page }) => {
  const primary = page.locator('#btn-primary');
  expect(await css(primary, 'background-color')).toBe('rgb(21, 128, 61)');
  expect(await css(primary, 'color')).toBe('rgb(255, 255, 255)');
  expect(await css(page.locator('#btn-secondary'), 'background-color')).toBe('rgb(240, 253, 244)');
  expect(await css(page.locator('#btn-outline'), 'background-color')).toBe('rgb(255, 255, 255)');
  expect(await css(page.locator('#btn-ghost'), 'background-color')).toBe('rgba(0, 0, 0, 0)');
  expect(await css(page.locator('#btn-danger'), 'background-color')).toBe('rgb(220, 38, 38)');
  await setTheme(page, 'dark');
  expect(await css(primary, 'background-color')).toBe('rgb(34, 197, 94)');
  expect(await css(primary, 'color')).toBe('rgb(3, 7, 18)');
});

test('sizes set the height', async ({ page }) => {
  expect((await page.locator('#btn-sm').boundingBox()).height).toBe(32);
  expect((await page.locator('#btn-primary').boundingBox()).height).toBe(36);
  expect((await page.locator('#btn-lg').boundingBox()).height).toBe(44);
});

test('aria-busy shows a spinner and blocks clicks', async ({ page }) => {
  const busy = page.locator('#btn-busy');
  expect(await css(busy, 'content', '::before')).not.toBe('none');
  expect(await css(busy, 'pointer-events')).toBe('none');
});

test('disabled is faded and inert', async ({ page }) => {
  const disabled = page.locator('#btn-disabled');
  expect(await css(disabled, 'opacity')).toBe('0.5');
  expect(await css(disabled, 'pointer-events')).toBe('none');
});

test('unlayered app CSS beats the kit', async ({ page }) => {
  await page.addStyleTag({ content: '.ui-btn--primary { background-color: rgb(1, 2, 3); }' });
  expect(await css(page.locator('#btn-primary'), 'background-color')).toBe('rgb(1, 2, 3)');
});

test('the component file ships alone, in its layer', async ({ request }) => {
  const res = await request.get('/packages/ui/dist/components/button.css');
  expect(res.ok()).toBe(true);
  const body = await res.text();
  expect(body.startsWith('@layer ui.reset, ui.tokens, ui.base, ui.components, ui.utilities;')).toBe(true);
  expect(body).toContain('.ui-btn');
});

test('each demo shows its markup', async ({ page }) => {
  const demos = await page.locator('.docs-demo').count();
  await expect(page.locator('pre.docs-code')).toHaveCount(demos);
  await expect(page.locator('pre.docs-code').first()).toContainText('class="ui-btn ui-btn--primary"');
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx playwright test tests/e2e/button.spec.mjs --project=chromium`
Expected: FAIL — page 404.

- [ ] **Step 3: Implement**

`packages/ui/src/components/close.css`:

```css
.ui-close {
  display: inline-grid;
  place-items: center;
  flex-shrink: 0;
  inline-size: var(--ui-close-size, 1.75rem);
  block-size: var(--ui-close-size, 1.75rem);
  padding: 0;
  border: 0;
  border-radius: var(--ui-radius-lg);
  background-color: transparent;
  color: var(--ui-fg-muted);
  cursor: pointer;
  transition: background-color var(--ui-duration-fast) var(--ui-ease), color var(--ui-duration-fast) var(--ui-ease);

  &::before {
    content: "";
    inline-size: 1rem;
    block-size: 1rem;
    background-color: currentColor;
    mask: var(--ui-glyph-x) center / contain no-repeat;
  }

  &:hover { background-color: var(--ui-surface-sunken); color: var(--ui-fg); }
  &:focus-visible { outline: none; box-shadow: 0 0 0 var(--ui-focus-width) var(--ui-focus-ring); }
}
```

`packages/ui/src/components/button.css`:

```css
.ui-btn {
  --_h: 2.25rem;
  --_px: var(--ui-space-4);
  --_fs: var(--ui-text-sm);
  --_lh: var(--ui-leading-sm);
  --_gap: var(--ui-space-2);
  --_bg: var(--ui-surface);
  --_bg-hover: var(--ui-surface-sunken);
  --_bg-active: var(--ui-surface-sunken);
  --_fg: var(--ui-fg);
  --_border: var(--ui-border-strong);
  --_ring: var(--ui-focus-ring);
  --_shadow: var(--ui-shadow-sm);

  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--_gap);
  block-size: var(--_h);
  padding: 0 var(--_px);
  border: 1px solid var(--_border);
  border-radius: var(--ui-button-radius);
  background-color: var(--_bg);
  color: var(--_fg);
  box-shadow: var(--_shadow);
  font: inherit;
  font-size: var(--_fs);
  line-height: var(--_lh);
  font-weight: var(--ui-weight-medium);
  text-decoration: none;
  white-space: nowrap;
  cursor: pointer;
  user-select: none;
  transition:
    background-color var(--ui-duration-fast) var(--ui-ease),
    border-color var(--ui-duration-fast) var(--ui-ease),
    color var(--ui-duration-fast) var(--ui-ease),
    box-shadow var(--ui-duration-fast) var(--ui-ease),
    transform var(--ui-duration-fast) var(--ui-ease);

  &:hover { background-color: var(--_bg-hover); }
  &:active { background-color: var(--_bg-active); transform: scale(0.97); }
  &:focus-visible { outline: none; box-shadow: var(--_shadow), 0 0 0 var(--ui-focus-width) var(--_ring); }
  &:disabled,
  &[aria-disabled="true"] { opacity: 0.5; pointer-events: none; }
  &[aria-busy="true"] { pointer-events: none; }
  &[aria-busy="true"]::before {
    content: "";
    inline-size: 1em;
    block-size: 1em;
    border: 2px solid currentColor;
    border-inline-end-color: transparent;
    border-radius: var(--ui-radius-full);
    animation: ui-spin 0.7s linear infinite;
  }
}

.ui-btn--outline {
  --_bg: var(--ui-surface);
  --_bg-hover: var(--ui-surface-sunken);
  --_fg: var(--ui-fg);
  --_border: var(--ui-border-strong);
}
.ui-btn--primary {
  --_bg: var(--ui-primary);
  --_bg-hover: var(--ui-primary-hover);
  --_bg-active: var(--ui-primary-active);
  --_fg: var(--ui-primary-on);
  --_border: transparent;
}
.ui-btn--secondary {
  --_bg: var(--ui-primary-subtle);
  --_bg-hover: color-mix(in srgb, var(--ui-primary-subtle), var(--ui-primary) 12%);
  --_bg-active: color-mix(in srgb, var(--ui-primary-subtle), var(--ui-primary) 20%);
  --_fg: var(--ui-primary-subtle-fg);
  --_border: transparent;
  --_shadow: none;
}
.ui-btn--ghost {
  --_bg: transparent;
  --_bg-hover: var(--ui-surface-sunken);
  --_bg-active: var(--ui-border);
  --_fg: var(--ui-fg-muted);
  --_border: transparent;
  --_shadow: none;

  &:hover { color: var(--ui-fg); }
}
.ui-btn--danger {
  --_bg: var(--ui-danger);
  --_bg-hover: var(--ui-danger-hover);
  --_bg-active: var(--ui-danger-active);
  --_fg: var(--ui-danger-on);
  --_border: transparent;
  --_ring: var(--ui-focus-ring-danger);
}

.ui-btn--sm { --_h: 2rem; --_px: var(--ui-space-3); --_fs: var(--ui-text-xs); --_lh: var(--ui-leading-xs); --_gap: var(--ui-space-1-5); }
.ui-btn--lg { --_h: 2.75rem; --_px: var(--ui-space-5); --_fs: var(--ui-text-base); --_lh: var(--ui-leading-base); }
.ui-btn--block { display: flex; inline-size: 100%; }
.ui-btn--icon { inline-size: var(--_h); padding: 0; }
```

`packages/ui/src/components/index.css` (replace the comment):

```css
@import "./close.css";
@import "./button.css";
```

`docs/components/button.html` (same head/header as `layout.html`, title `Button · ui-shared-libs`):

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Button · ui-shared-libs</title>
  <link rel="stylesheet" href="../../packages/ui/dist/ui.css">
  <link rel="stylesheet" href="../assets/docs.css">
  <script src="../assets/docs.js" defer></script>
  <script src="../../packages/ui/dist/ui.iife.min.js" defer></script>
</head>
<body>
  <header class="docs-header">
    <a class="docs-brand" href="../index.html">ui-shared-libs</a>
    <button type="button" class="ui-btn ui-btn--ghost ui-btn--sm" data-docs-theme>Theme: system</button>
  </header>
  <main class="docs-main">
    <h1>Button</h1>
    <p class="docs-lead">Works on <code>&lt;button&gt;</code> and <code>&lt;a&gt;</code>. No class for outline: it is the default.</p>

    <section class="docs-example" aria-labelledby="ex-variants">
      <h2 id="ex-variants">Variants</h2>
      <div class="docs-demo">
        <button type="button" class="ui-btn ui-btn--primary" id="btn-primary">Save</button>
        <button type="button" class="ui-btn ui-btn--secondary" id="btn-secondary">Draft</button>
        <button type="button" class="ui-btn ui-btn--outline" id="btn-outline">Cancel</button>
        <button type="button" class="ui-btn ui-btn--ghost" id="btn-ghost">Skip</button>
        <button type="button" class="ui-btn ui-btn--danger" id="btn-danger">Delete</button>
      </div>
    </section>

    <section class="docs-example" aria-labelledby="ex-sizes">
      <h2 id="ex-sizes">Sizes</h2>
      <div class="docs-demo">
        <button type="button" class="ui-btn ui-btn--primary ui-btn--sm" id="btn-sm">Small</button>
        <button type="button" class="ui-btn ui-btn--primary">Medium</button>
        <button type="button" class="ui-btn ui-btn--primary ui-btn--lg" id="btn-lg">Large</button>
      </div>
    </section>

    <section class="docs-example" aria-labelledby="ex-states">
      <h2 id="ex-states">States</h2>
      <div class="docs-demo">
        <button type="button" class="ui-btn ui-btn--primary" aria-busy="true" id="btn-busy">Saving</button>
        <button type="button" class="ui-btn ui-btn--primary" disabled id="btn-disabled">Disabled</button>
        <a class="ui-btn" href="#ex-states">Link as button</a>
        <button type="button" class="ui-btn ui-btn--icon" aria-label="Close"><span class="ui-close" aria-hidden="true"></span></button>
      </div>
    </section>
  </main>
</body>
</html>
```

In `docs/index.html` add after the Layout item:

```html
      <li><a href="components/button.html">Button</a></li>
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx playwright test tests/e2e/button.spec.mjs --project=chromium --project=firefox --project=webkit`
Expected: `21 passed`.

Run: `npm run lint:css && node --test tests/node/build.test.mjs`
Expected: both exit 0.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components docs tests/e2e/button.spec.mjs
git commit -m "feat(button): button variants, sizes, loading; close button"
```

---

### Task 7: Input, textarea, select, form group

**Files:**
- Create: `packages/ui/src/components/form.css`, `docs/components/form.html`
- Modify: `packages/ui/src/components/index.css`, `docs/index.html`
- Test: `tests/e2e/form.spec.mjs`

**Interfaces:**
- Produces: `.ui-input`, `.ui-textarea`, `.ui-select` (each `--sm|--lg` where shown), `.ui-field`, `.ui-field__header`, `.ui-label`, `.ui-label__required`, `.ui-label__optional`, `.ui-hint`, `.ui-error`. Invalid state is `aria-invalid="true"`; an `.ui-error` in a field hides its `.ui-hint`.

- [ ] **Step 1: Write the failing test**

`tests/e2e/form.spec.mjs`:

```js
import { test, expect } from '@playwright/test';
import { css, settle } from './helpers.mjs';

test.beforeEach(async ({ page }) => { await page.goto('/docs/components/form.html'); });

test('controls use surface, border and control radius', async ({ page }) => {
  const input = page.locator('#name');
  expect(await css(input, 'background-color')).toBe('rgb(255, 255, 255)');
  expect(await css(input, 'border-top-color')).toBe('rgb(209, 213, 219)');
  expect(await css(input, 'border-top-left-radius')).toBe('8px');
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
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx playwright test tests/e2e/form.spec.mjs --project=chromium`
Expected: FAIL — page 404.

- [ ] **Step 3: Implement**

`packages/ui/src/components/form.css`:

```css
.ui-input,
.ui-textarea,
.ui-select {
  display: block;
  inline-size: 100%;
  padding: var(--ui-space-2-5) var(--ui-space-3);
  border: 1px solid var(--ui-border-strong);
  border-radius: var(--ui-control-radius);
  background-color: var(--ui-surface);
  color: var(--ui-fg);
  font: inherit;
  font-size: var(--ui-text-sm);
  line-height: var(--ui-leading-sm);
  transition: border-color var(--ui-duration-fast) var(--ui-ease), box-shadow var(--ui-duration-fast) var(--ui-ease);

  &::placeholder { color: var(--ui-fg-subtle); opacity: 1; }
  &:hover:not(:disabled) { border-color: var(--ui-fg-subtle); }
  &:focus { outline: none; border-color: var(--ui-primary); box-shadow: 0 0 0 var(--ui-focus-width) var(--ui-focus-ring); }
  &[aria-invalid="true"] { border-color: var(--ui-danger); }
  &[aria-invalid="true"]:focus { box-shadow: 0 0 0 var(--ui-focus-width) var(--ui-focus-ring-danger); }
  &:disabled { background-color: var(--ui-surface-sunken); color: var(--ui-fg-subtle); cursor: not-allowed; }
}

.ui-input:read-only:not(:disabled),
.ui-textarea:read-only:not(:disabled) { background-color: var(--ui-surface-sunken); }

.ui-input--sm,
.ui-select--sm { padding-block: var(--ui-space-1-5); font-size: var(--ui-text-xs); line-height: var(--ui-leading-xs); }
.ui-input--lg,
.ui-select--lg { padding-block: var(--ui-space-3); font-size: var(--ui-text-base); line-height: var(--ui-leading-base); }

.ui-textarea { min-block-size: 5rem; resize: vertical; }

.ui-select {
  appearance: none;
  padding-inline-end: var(--ui-space-10);
  background-image:
    linear-gradient(45deg, transparent 50%, var(--ui-fg-muted) 50%),
    linear-gradient(135deg, var(--ui-fg-muted) 50%, transparent 50%);
  background-position: calc(100% - 1.125rem) 50%, calc(100% - 0.8125rem) 50%;
  background-size: 0.3125rem 0.3125rem;
  background-repeat: no-repeat;
}

.ui-field { display: flex; flex-direction: column; gap: var(--ui-space-1-5); }
.ui-field__header { display: flex; align-items: baseline; justify-content: space-between; gap: var(--ui-space-2); }
.ui-label {
  display: block;
  font-size: var(--ui-text-sm);
  line-height: var(--ui-leading-sm);
  font-weight: var(--ui-weight-medium);
  color: var(--ui-fg);
}
.ui-label__required { margin-inline-start: var(--ui-space-0-5); color: var(--ui-danger); }
.ui-label__optional { font-size: var(--ui-text-xs); line-height: var(--ui-leading-xs); color: var(--ui-fg-muted); }
.ui-hint,
.ui-error { margin: 0; font-size: var(--ui-text-xs); line-height: var(--ui-leading-xs); }
.ui-hint { color: var(--ui-fg-muted); }
.ui-error { color: var(--ui-danger); }
.ui-field:has(.ui-error) .ui-hint { display: none; }
```

`packages/ui/src/components/index.css` — append:

```css
@import "./form.css";
```

`docs/components/form.html` (head and header as in `button.html`, title `Form · ui-shared-libs`; body `<main>`):

```html
  <main class="docs-main">
    <h1>Form controls</h1>
    <p class="docs-lead">Input, textarea, select and the field that labels them. Mark an invalid control with <code>aria-invalid="true"</code>.</p>

    <section class="docs-example" aria-labelledby="ex-field">
      <h2 id="ex-field">Field</h2>
      <div class="docs-demo docs-demo--stack">
        <div class="ui-field">
          <label class="ui-label" for="name">Full name<span class="ui-label__required" aria-hidden="true">*</span></label>
          <input class="ui-input" id="name" name="name" required placeholder="As on your ID" aria-describedby="name-hint">
          <p class="ui-hint" id="name-hint">Used on receipts.</p>
        </div>
        <div class="ui-field" id="email-field">
          <div class="ui-field__header">
            <label class="ui-label" for="email">Email</label>
            <span class="ui-label__optional">Optional</span>
          </div>
          <input class="ui-input" id="email" type="email" value="not-an-email" aria-invalid="true" aria-describedby="email-error">
          <p class="ui-hint">We never share it.</p>
          <p class="ui-error" id="email-error">Enter a valid email address.</p>
        </div>
        <div class="ui-field">
          <label class="ui-label" for="disabled">Member number</label>
          <input class="ui-input" id="disabled" value="KOP-0001" disabled>
        </div>
      </div>
    </section>

    <section class="docs-example" aria-labelledby="ex-textarea">
      <h2 id="ex-textarea">Textarea</h2>
      <div class="docs-demo docs-demo--stack">
        <div class="ui-field">
          <label class="ui-label" for="notes">Notes</label>
          <textarea class="ui-textarea" id="notes" rows="3"></textarea>
        </div>
      </div>
    </section>

    <section class="docs-example" aria-labelledby="ex-select">
      <h2 id="ex-select">Select</h2>
      <div class="docs-demo docs-demo--stack">
        <div class="ui-field">
          <label class="ui-label" for="city">City</label>
          <select class="ui-select" id="city">
            <option value="">Choose…</option>
            <option>Bandung</option>
            <option>Jakarta</option>
          </select>
        </div>
      </div>
    </section>
  </main>
```

In `docs/index.html` add:

```html
      <li><a href="components/form.html">Form controls</a></li>
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx playwright test tests/e2e/form.spec.mjs --project=chromium --project=firefox --project=webkit`
Expected: `18 passed`.

Run: `npm run lint:css`
Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components docs tests/e2e/form.spec.mjs
git commit -m "feat(form): input, textarea, select and field"
```

---

### Task 8: Checkbox, radio, switch

**Files:**
- Create: `packages/ui/src/components/choice.css`, `packages/ui/src/components/checkbox.css`, `packages/ui/src/components/switch.css`, `docs/components/choice.html`
- Modify: `packages/ui/src/components/index.css`, `docs/index.html`
- Test: `tests/e2e/choice.spec.mjs`

**Interfaces:**
- Produces: `.ui-checkbox`, `.ui-radio` (on the `<input>`), `.ui-switch` (on `<input type="checkbox" role="switch">`, `--sm|--lg`), wrapper `.ui-choice` with `__text`, `__label`, `__desc`, `--card`; `.ui-choice-group` (`<fieldset>`), `--horizontal`.

- [ ] **Step 1: Write the failing test**

`tests/e2e/choice.spec.mjs`:

```js
import { test, expect } from '@playwright/test';
import { css, settle } from './helpers.mjs';

const GREEN_700 = 'rgb(21, 128, 61)';

test.beforeEach(async ({ page }) => { await page.goto('/docs/components/choice.html'); });

test('clicking the label checks the checkbox and shows the tick', async ({ page }) => {
  const box = page.locator('#terms');
  expect(await css(box, 'transform', '::before')).toBe('matrix(0, 0, 0, 0, 0, 0)');
  await page.getByText('I agree to the terms').click();
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
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx playwright test tests/e2e/choice.spec.mjs --project=chromium`
Expected: FAIL — page 404.

- [ ] **Step 3: Implement**

`packages/ui/src/components/choice.css`:

```css
.ui-choice {
  display: inline-flex;
  align-items: flex-start;
  gap: var(--ui-space-3);
  cursor: pointer;
  user-select: none;

  &:has(:disabled) { cursor: not-allowed; opacity: 0.5; }
}
.ui-choice__text { display: flex; flex-direction: column; gap: var(--ui-space-0-5); }
.ui-choice__label { font-size: var(--ui-text-sm); line-height: var(--ui-leading-sm); font-weight: var(--ui-weight-medium); color: var(--ui-fg); }
.ui-choice__desc { font-size: var(--ui-text-xs); line-height: var(--ui-leading-xs); color: var(--ui-fg-muted); }

.ui-choice--card {
  display: flex;
  padding: var(--ui-space-4);
  border: 2px solid var(--ui-border);
  border-radius: var(--ui-radius-xl);
  background-color: var(--ui-surface);
  transition: border-color var(--ui-duration-fast) var(--ui-ease), background-color var(--ui-duration-fast) var(--ui-ease);

  &:hover { border-color: var(--ui-border-strong); }
  &:has(:checked) { border-color: var(--ui-primary); background-color: var(--ui-primary-subtle); }
}

.ui-choice-group {
  display: flex;
  flex-direction: column;
  gap: var(--ui-space-2-5);
  min-inline-size: 0;
  margin: 0;
  padding: 0;
  border: 0;

  & > legend { margin-block-end: var(--ui-space-2-5); padding: 0; }
}
.ui-choice-group--horizontal { flex-direction: row; flex-wrap: wrap; gap: var(--ui-space-3); }
```

`packages/ui/src/components/checkbox.css`:

```css
.ui-checkbox,
.ui-radio {
  appearance: none;
  display: inline-grid;
  place-content: center;
  flex-shrink: 0;
  inline-size: 1.25rem;
  block-size: 1.25rem;
  margin: var(--ui-space-0-5) 0 0;
  border: 2px solid var(--ui-border-strong);
  background-color: var(--ui-surface);
  cursor: pointer;
  transition:
    background-color var(--ui-duration-fast) var(--ui-ease),
    border-color var(--ui-duration-fast) var(--ui-ease),
    box-shadow var(--ui-duration-fast) var(--ui-ease);

  &::before { content: ""; transform: scale(0); transition: transform var(--ui-duration) var(--ui-ease-spring); }
  &:checked::before { transform: scale(1); }
  &:hover:not(:disabled) { border-color: var(--ui-primary); }
  &:focus-visible { outline: none; box-shadow: 0 0 0 var(--ui-focus-width) var(--ui-focus-ring); }
  &[aria-invalid="true"] { border-color: var(--ui-danger); }
  &:disabled { cursor: not-allowed; }
}

.ui-checkbox { border-radius: var(--ui-radius-md); }
.ui-checkbox::before {
  inline-size: 0.875rem;
  block-size: 0.875rem;
  background-color: var(--ui-primary-on);
  mask: var(--ui-glyph-check) center / contain no-repeat;
}
.ui-checkbox:checked,
.ui-checkbox:indeterminate { border-color: var(--ui-primary); background-color: var(--ui-primary); }
.ui-checkbox:indeterminate::before { transform: scale(1); mask-image: var(--ui-glyph-dash); }

.ui-radio { border-radius: var(--ui-radius-full); }
.ui-radio::before {
  inline-size: 0.625rem;
  block-size: 0.625rem;
  border-radius: var(--ui-radius-full);
  background-color: var(--ui-primary);
}
.ui-radio:checked { border-color: var(--ui-primary); }
```

`packages/ui/src/components/switch.css`:

```css
.ui-switch {
  --_w: 2.75rem;
  --_h: 1.5rem;
  --_thumb: 1.25rem;

  appearance: none;
  position: relative;
  flex-shrink: 0;
  inline-size: var(--_w);
  block-size: var(--_h);
  margin: 0;
  border: 0;
  border-radius: var(--ui-radius-full);
  background-color: var(--ui-border-strong);
  cursor: pointer;
  transition: background-color var(--ui-duration) var(--ui-ease);

  &::before {
    content: "";
    position: absolute;
    inset-block-start: calc((var(--_h) - var(--_thumb)) / 2);
    inset-inline-start: calc((var(--_h) - var(--_thumb)) / 2);
    inline-size: var(--_thumb);
    block-size: var(--_thumb);
    border-radius: var(--ui-radius-full);
    background-color: var(--ui-thumb);
    box-shadow: var(--ui-shadow-sm);
    transition: transform var(--ui-duration-slow) var(--ui-ease-spring);
  }

  &:checked { background-color: var(--ui-primary); }
  &:checked::before { transform: translateX(calc(var(--_w) - var(--_h))); }
  &:focus-visible { outline: none; box-shadow: 0 0 0 var(--ui-focus-width) var(--ui-focus-ring); }
  &:disabled { cursor: not-allowed; }
}
.ui-switch--sm { --_w: 2.25rem; --_h: 1.25rem; --_thumb: 1rem; }
.ui-switch--lg { --_w: 3.25rem; --_h: 1.75rem; --_thumb: 1.5rem; }
```

`packages/ui/src/components/index.css` — append:

```css
@import "./choice.css";
@import "./checkbox.css";
@import "./switch.css";
```

`docs/components/choice.html` (head and header as in `button.html`, title `Checkbox, radio, switch · ui-shared-libs`; body `<main>`):

```html
  <main class="docs-main">
    <h1>Checkbox, radio, switch</h1>
    <p class="docs-lead">Native inputs with a class. Wrap them in <code>.ui-choice</code> to label them.</p>

    <section class="docs-example" aria-labelledby="ex-checkbox">
      <h2 id="ex-checkbox">Checkbox</h2>
      <div class="docs-demo docs-demo--stack">
        <label class="ui-choice">
          <input type="checkbox" class="ui-checkbox" id="terms">
          <span class="ui-choice__text">
            <span class="ui-choice__label">I agree to the terms</span>
            <span class="ui-choice__desc">You can change this later.</span>
          </span>
        </label>
        <label class="ui-choice">
          <input type="checkbox" class="ui-checkbox" id="all">
          <span class="ui-choice__label">Select all</span>
        </label>
        <label class="ui-choice" id="choice-disabled">
          <input type="checkbox" class="ui-checkbox" disabled>
          <span class="ui-choice__label">Unavailable</span>
        </label>
      </div>
    </section>

    <section class="docs-example" aria-labelledby="ex-radio">
      <h2 id="ex-radio">Radio</h2>
      <div class="docs-demo docs-demo--stack">
        <fieldset class="ui-choice-group ui-choice-group--horizontal">
          <legend class="ui-label">Payment</legend>
          <label class="ui-choice"><input type="radio" class="ui-radio" name="pay" value="cash" checked><span class="ui-choice__label">Cash</span></label>
          <label class="ui-choice"><input type="radio" class="ui-radio" name="pay" value="transfer"><span class="ui-choice__label">Transfer</span></label>
        </fieldset>
        <fieldset class="ui-choice-group">
          <legend class="ui-label">Plan</legend>
          <label class="ui-choice ui-choice--card"><input type="radio" class="ui-radio" name="plan" value="basic" checked><span class="ui-choice__text"><span class="ui-choice__label">Basic</span><span class="ui-choice__desc">Up to 100 members.</span></span></label>
          <label class="ui-choice ui-choice--card" id="plan-pro"><input type="radio" class="ui-radio" name="plan" value="pro"><span class="ui-choice__text"><span class="ui-choice__label">Pro</span><span class="ui-choice__desc">Unlimited members.</span></span></label>
        </fieldset>
      </div>
    </section>

    <section class="docs-example" aria-labelledby="ex-switch">
      <h2 id="ex-switch">Switch</h2>
      <div class="docs-demo docs-demo--stack">
        <label class="ui-choice">
          <input type="checkbox" role="switch" class="ui-switch">
          <span class="ui-choice__label">Email notifications</span>
        </label>
        <label class="ui-choice">
          <input type="checkbox" role="switch" class="ui-switch ui-switch--sm" checked>
          <span class="ui-choice__label">Compact</span>
        </label>
      </div>
    </section>
  </main>
```

In `docs/index.html` add:

```html
      <li><a href="components/choice.html">Checkbox, radio, switch</a></li>
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx playwright test tests/e2e/choice.spec.mjs --project=chromium --project=firefox --project=webkit`
Expected: `18 passed`.

Run: `npm run lint:css`
Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components docs tests/e2e/choice.spec.mjs
git commit -m "feat(choice): checkbox, radio, switch and choice wrappers"
```

---

### Task 9: Card, badge, alert

**Files:**
- Create: `packages/ui/src/components/{card,badge,alert}.css`, `docs/components/{card,badge,alert}.html`
- Modify: `packages/ui/src/components/index.css`, `docs/index.html`
- Test: `tests/e2e/card.spec.mjs`

**Interfaces:**
- Produces: `.ui-card` (`--sm|--lg|--flush|--borderless|--flat|--raised|--interactive`, parts `__header|__title|__desc|__footer`); `.ui-badge` (`--primary|--success|--warning|--danger|--info`, neutral default, `--sm|--lg`, part `__dot`); `.ui-alert` (`--success|--warning|--danger`, info default, parts `__icon|__body|__title|__text`, hosts a `.ui-close`). Alerts that can be dismissed carry `data-ui-dismissible="alert"` and a close button with `data-ui-dismiss` (behaviour arrives in Task 10).

- [ ] **Step 1: Write the failing test**

`tests/e2e/card.spec.mjs`:

```js
import { test, expect } from '@playwright/test';
import { css, setTheme } from './helpers.mjs';

test('card padding: default, small, and a nested default card is not affected', async ({ page }) => {
  await page.goto('/docs/components/card.html');
  expect(await css(page.locator('#card-default'), 'padding-top')).toBe('24px');
  expect(await css(page.locator('#card-sm'), 'padding-top')).toBe('16px');
  expect(await css(page.locator('#card-nested'), 'padding-top')).toBe('24px');
});

test('badge variants use subtle tokens', async ({ page }) => {
  await page.goto('/docs/components/badge.html');
  const danger = page.locator('#badge-danger');
  expect(await css(danger, 'background-color')).toBe('rgb(254, 242, 242)');
  expect(await css(danger, 'color')).toBe('rgb(185, 28, 28)');
  expect(await css(page.locator('#badge-neutral'), 'background-color')).toBe('rgb(243, 244, 246)');
});

test('alert accent bar follows the variant, in both themes', async ({ page }) => {
  await page.goto('/docs/components/alert.html');
  const warning = page.locator('#alert-warning');
  expect(await css(warning, 'background-color', '::before')).toBe('rgb(234, 179, 8)');
  await setTheme(page, 'dark');
  expect(await css(warning, 'background-color', '::before')).toBe('rgb(250, 204, 21)');
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx playwright test tests/e2e/card.spec.mjs --project=chromium`
Expected: FAIL — pages 404.

- [ ] **Step 3: Implement**

`packages/ui/src/components/card.css`:

```css
.ui-card {
  --_pad: var(--ui-space-6);

  display: block;
  padding: var(--_pad);
  border: 1px solid var(--ui-border);
  border-radius: var(--ui-radius-xl);
  background-color: var(--ui-surface);
  color: var(--ui-fg);
  box-shadow: var(--ui-shadow-sm);
  transition: box-shadow var(--ui-duration) var(--ui-ease);
}
.ui-card--sm { --_pad: var(--ui-space-4); }
.ui-card--lg { --_pad: var(--ui-space-8); }
.ui-card--flush { --_pad: 0; }
.ui-card--borderless { border-color: transparent; }
.ui-card--flat { box-shadow: none; }
.ui-card--raised { box-shadow: var(--ui-shadow-md); }
.ui-card--interactive {
  cursor: pointer;
  text-decoration: none;

  &:hover { box-shadow: var(--ui-shadow-md); }
  &:focus-visible { outline: none; box-shadow: var(--ui-shadow-md), 0 0 0 var(--ui-focus-width) var(--ui-focus-ring); }
}
.ui-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--ui-space-4);
  margin-block-end: var(--ui-space-4);
}
.ui-card__title { margin: 0; font-size: var(--ui-text-sm); line-height: var(--ui-leading-sm); font-weight: var(--ui-weight-semibold); color: var(--ui-fg); }
.ui-card__desc { margin: var(--ui-space-0-5) 0 0; font-size: var(--ui-text-sm); line-height: var(--ui-leading-sm); color: var(--ui-fg-muted); }
.ui-card__footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--ui-space-2);
  margin-block-start: var(--ui-space-5);
  padding-block-start: var(--ui-space-4);
  border-block-start: 1px solid var(--ui-border);
}
```

`packages/ui/src/components/badge.css`:

```css
.ui-badge {
  --_bg: var(--ui-neutral-subtle);
  --_fg: var(--ui-neutral-subtle-fg);
  --_ring: var(--ui-neutral-border);
  --_dot: var(--ui-neutral);

  display: inline-flex;
  align-items: center;
  gap: var(--ui-space-1-5);
  padding: var(--ui-space-0-5) var(--ui-space-2-5);
  border-radius: var(--ui-radius-full);
  background-color: var(--_bg);
  color: var(--_fg);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--_ring) 60%, transparent);
  font-size: var(--ui-text-xs);
  line-height: var(--ui-leading-xs);
  font-weight: var(--ui-weight-medium);
  white-space: nowrap;
}
.ui-badge--primary { --_bg: var(--ui-primary-subtle); --_fg: var(--ui-primary-subtle-fg); --_ring: var(--ui-primary-border); --_dot: var(--ui-primary); }
.ui-badge--success { --_bg: var(--ui-success-subtle); --_fg: var(--ui-success-subtle-fg); --_ring: var(--ui-success-border); --_dot: var(--ui-success); }
.ui-badge--warning { --_bg: var(--ui-warning-subtle); --_fg: var(--ui-warning-subtle-fg); --_ring: var(--ui-warning-border); --_dot: var(--ui-warning); }
.ui-badge--danger { --_bg: var(--ui-danger-subtle); --_fg: var(--ui-danger-subtle-fg); --_ring: var(--ui-danger-border); --_dot: var(--ui-danger); }
.ui-badge--info { --_bg: var(--ui-info-subtle); --_fg: var(--ui-info-subtle-fg); --_ring: var(--ui-info-border); --_dot: var(--ui-info); }
.ui-badge--sm { padding: 0 var(--ui-space-2); font-size: 0.6875rem; }
.ui-badge--lg { padding: var(--ui-space-1) var(--ui-space-3); font-size: var(--ui-text-sm); line-height: var(--ui-leading-sm); }
.ui-badge__dot { flex-shrink: 0; inline-size: 0.375rem; block-size: 0.375rem; border-radius: var(--ui-radius-full); background-color: var(--_dot); }
```

`packages/ui/src/components/alert.css`:

```css
.ui-alert {
  --_bg: var(--ui-info-subtle);
  --_fg: var(--ui-info-subtle-fg);
  --_border: var(--ui-info-border);
  --_accent: var(--ui-info);

  position: relative;
  display: flex;
  align-items: flex-start;
  gap: var(--ui-space-3);
  padding: var(--ui-space-4) var(--ui-space-4) var(--ui-space-4) var(--ui-space-5);
  overflow: hidden;
  border: 1px solid var(--_border);
  border-radius: var(--ui-radius-xl);
  background-color: var(--_bg);
  color: var(--_fg);

  &::before {
    content: "";
    position: absolute;
    inset-block: 0;
    inset-inline-start: 0;
    inline-size: 4px;
    background-color: var(--_accent);
  }

  & .ui-close { --ui-close-size: 1.5rem; margin: calc(var(--ui-space-1) * -1) calc(var(--ui-space-1) * -1) 0 0; color: inherit; }
}
.ui-alert--success { --_bg: var(--ui-success-subtle); --_fg: var(--ui-success-subtle-fg); --_border: var(--ui-success-border); --_accent: var(--ui-success); }
.ui-alert--warning { --_bg: var(--ui-warning-subtle); --_fg: var(--ui-warning-subtle-fg); --_border: var(--ui-warning-border); --_accent: var(--ui-warning); }
.ui-alert--danger { --_bg: var(--ui-danger-subtle); --_fg: var(--ui-danger-subtle-fg); --_border: var(--ui-danger-border); --_accent: var(--ui-danger); }
.ui-alert__icon { flex-shrink: 0; inline-size: 1.25rem; block-size: 1.25rem; color: var(--_accent); }
.ui-alert__body { flex: 1; min-inline-size: 0; }
.ui-alert__title { margin: 0; font-size: var(--ui-text-sm); line-height: var(--ui-leading-sm); font-weight: var(--ui-weight-semibold); }
.ui-alert__text { margin: 0; font-size: var(--ui-text-sm); line-height: 1.375rem; }
.ui-alert__title + .ui-alert__text { margin-block-start: var(--ui-space-0-5); }
```

`packages/ui/src/components/index.css` — append:

```css
@import "./card.css";
@import "./badge.css";
@import "./alert.css";
```

Docs pages (head and header as in `button.html`; titles `Card · ui-shared-libs`, `Badge · ui-shared-libs`, `Alert · ui-shared-libs`). `<main>` bodies:

`docs/components/card.html`:

```html
  <main class="docs-main">
    <h1>Card</h1>
    <p class="docs-lead">A surface with a border and a soft shadow.</p>
    <section class="docs-example" aria-labelledby="ex-card">
      <h2 id="ex-card">Card</h2>
      <div class="docs-demo docs-demo--stack">
        <article class="ui-card" id="card-default">
          <header class="ui-card__header">
            <div>
              <h3 class="ui-card__title">Monthly savings</h3>
              <p class="ui-card__desc">Due on the 10th.</p>
            </div>
            <span class="ui-badge ui-badge--success">Paid</span>
          </header>
          <p>Rp 150.000 received on 2 November.</p>
          <footer class="ui-card__footer">
            <button type="button" class="ui-btn">Details</button>
            <button type="button" class="ui-btn ui-btn--primary">Download receipt</button>
          </footer>
        </article>
        <div class="ui-card ui-card--sm" id="card-sm">
          <p>A small card</p>
          <div class="ui-card ui-card--flat" id="card-nested">A default card inside it keeps its own padding.</div>
        </div>
      </div>
    </section>
  </main>
```

`docs/components/badge.html`:

```html
  <main class="docs-main">
    <h1>Badge</h1>
    <p class="docs-lead">Short status labels.</p>
    <section class="docs-example" aria-labelledby="ex-badge">
      <h2 id="ex-badge">Variants</h2>
      <div class="docs-demo">
        <span class="ui-badge" id="badge-neutral">Draft</span>
        <span class="ui-badge ui-badge--primary">New</span>
        <span class="ui-badge ui-badge--success"><span class="ui-badge__dot"></span>Active</span>
        <span class="ui-badge ui-badge--warning">Pending</span>
        <span class="ui-badge ui-badge--danger" id="badge-danger">Overdue</span>
        <span class="ui-badge ui-badge--info ui-badge--lg">Info</span>
      </div>
    </section>
  </main>
```

`docs/components/alert.html`:

```html
  <main class="docs-main">
    <h1>Alert</h1>
    <p class="docs-lead">Inline messages. Add <code>data-ui-dismissible="alert"</code> and a <code>data-ui-dismiss</code> button to let people close one (needs ui.js).</p>
    <section class="docs-example" aria-labelledby="ex-alert">
      <h2 id="ex-alert">Variants</h2>
      <div class="docs-demo docs-demo--stack">
        <div class="ui-alert" role="status">
          <div class="ui-alert__body">
            <p class="ui-alert__title">Maintenance tonight</p>
            <p class="ui-alert__text">The app is read-only from 22:00 to 23:00.</p>
          </div>
        </div>
        <div class="ui-alert ui-alert--success" role="status"><div class="ui-alert__body"><p class="ui-alert__text">Your payment was received.</p></div></div>
        <div class="ui-alert ui-alert--warning" role="status" id="alert-warning"><div class="ui-alert__body"><p class="ui-alert__text">Your membership ends in 7 days.</p></div></div>
        <div class="ui-alert ui-alert--danger" role="alert" data-ui-dismissible="alert" id="alert-dismissible">
          <div class="ui-alert__body">
            <p class="ui-alert__title">Payment failed</p>
            <p class="ui-alert__text">The bank declined the transfer.</p>
          </div>
          <button type="button" class="ui-close" data-ui-dismiss aria-label="Dismiss"></button>
        </div>
      </div>
    </section>
  </main>
```

In `docs/index.html` add:

```html
      <li><a href="components/card.html">Card</a></li>
      <li><a href="components/badge.html">Badge</a></li>
      <li><a href="components/alert.html">Alert</a></li>
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx playwright test tests/e2e/card.spec.mjs --project=chromium --project=firefox --project=webkit`
Expected: `9 passed`.

Run: `npm run lint:css`
Expected: exit 0.

- [ ] **Step 5: Falsify the nested-card guard**

In `card.css` change the rule to `padding: var(--_pad, var(--ui-space-6));` and delete the `--_pad: var(--ui-space-6);` line; rerun chromium. Expected: `card padding` FAILS on `#card-nested` (16px, inherited). Restore; rerun; pass.

- [ ] **Step 6: Commit**

```bash
git add packages/ui/src/components docs tests/e2e/card.spec.mjs
git commit -m "feat: card, badge and alert"
```

---

### Task 10: JS runtime and dismiss

**Files:**
- Create: `packages/ui/src/js/runtime.js`, `packages/ui/src/js/core/dismiss.js`, `tests/fixtures/runtime.html`
- Modify: `packages/ui/src/js/index.js`
- Test: `tests/e2e/runtime.spec.mjs`

**Interfaces:**
- Produces from `runtime.js`: `register(name: string, factory: (el: Element) => { destroy?(): void } | void): void`, `init(root?: ParentNode): void`, `destroy(root?: ParentNode): void`, `get(el: Element, name?: string): object | undefined`, `emit(el: Element, component: string, event: string, detail?: any): boolean` (returns `false` if a listener called `preventDefault()`), `start(doc: Document): void`.
- Produces from `core/dismiss.js`: `installDismiss(doc: Document): void` — a click on `[data-ui-dismiss]` inside `[data-ui-dismissible="<name>"]` emits `ui:<name>:dismiss` (cancelable) and removes the element unless cancelled.
- Public API (ESM exports and `window.UI`): `init`, `destroy`, `get`, `register`, `emit`, `version`.

- [ ] **Step 1: Fixture**

`tests/fixtures/runtime.html`:

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>runtime fixture</title>
  <script>
    window.log = [];
    document.addEventListener('ui:probe:ready', (e) => log.push(`ready:${e.detail.id}`));
  </script>
  <script src="/packages/ui/dist/ui.iife.min.js"></script>
  <script>
    UI.register('probe', (el) => {
      log.push(`init:${el.id}`);
      UI.emit(el, 'probe', 'ready', { id: el.id });
      return { destroy() { log.push(`destroy:${el.id}`); } };
    });
    UI.register('other', (el) => { log.push(`other:${el.id}`); });
  </script>
</head>
<body>
  <main>
    <div id="a" data-ui="probe"></div>
    <div id="b" data-ui="probe other"></div>
    <div id="late" data-ui="late"></div>
    <section id="target"></section>
  </main>
</body>
</html>
```

- [ ] **Step 2: Write the failing test**

`tests/e2e/runtime.spec.mjs`:

```js
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
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `npx playwright test tests/e2e/runtime.spec.mjs --project=chromium`
Expected: FAIL — `UI.register is not a function`.

- [ ] **Step 4: Implement**

`packages/ui/src/js/runtime.js`:

```js
// Behaviour registry. An element opts in with data-ui="name [name...]".
// Instances live in a WeakMap, so init is idempotent and nothing leaks.
const registry = new Map();
const instances = new WeakMap();
let started = false;

const namesOf = (el) => (el.getAttribute('data-ui') ?? '').split(/\s+/).filter(Boolean);

function elementsIn(root) {
  const found = root.querySelectorAll ? [...root.querySelectorAll('[data-ui]')] : [];
  if (root.nodeType === 1 && root.hasAttribute('data-ui')) found.unshift(root);
  return found;
}

export function register(name, factory) {
  registry.set(name, factory);
  if (started) init(document);
}

export function init(root = document) {
  for (const el of elementsIn(root)) {
    for (const name of namesOf(el)) {
      const factory = registry.get(name);
      if (!factory || instances.get(el)?.has(name)) continue;
      if (!instances.has(el)) instances.set(el, new Map());
      instances.get(el).set(name, factory(el) ?? {});
    }
  }
}

export function destroy(root = document) {
  for (const el of elementsIn(root)) {
    const map = instances.get(el);
    if (!map) continue;
    for (const instance of map.values()) instance.destroy?.();
    instances.delete(el);
  }
}

export function get(el, name) {
  const map = instances.get(el);
  if (!map) return undefined;
  return name ? map.get(name) : map.values().next().value;
}

export function emit(el, component, event, detail) {
  return el.dispatchEvent(new CustomEvent(`ui:${component}:${event}`, { bubbles: true, cancelable: true, detail }));
}

export function start(doc) {
  if (started) return;
  started = true;
  const run = () => {
    init(doc);
    new MutationObserver((records) => {
      for (const record of records) {
        // A moved node is removed and re-added; it is still connected, so skip it.
        for (const node of record.removedNodes) if (node.nodeType === 1 && !node.isConnected) destroy(node);
        for (const node of record.addedNodes) if (node.nodeType === 1 && node.isConnected) init(node);
      }
    }).observe(doc.documentElement, { childList: true, subtree: true });
  };
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', run, { once: true });
  else run();
}
```

`packages/ui/src/js/core/dismiss.js`:

```js
import { emit } from '../runtime.js';

// <div data-ui-dismissible="alert"> … <button data-ui-dismiss> … </div>
export function installDismiss(doc) {
  doc.addEventListener('click', (event) => {
    const button = event.target.closest?.('[data-ui-dismiss]');
    const target = button?.closest('[data-ui-dismissible]');
    if (!target) return;
    const component = target.getAttribute('data-ui-dismissible') || 'element';
    if (emit(target, component, 'dismiss')) target.remove();
  });
}
```

`packages/ui/src/js/index.js`:

```js
import { destroy, emit, get, init, register, start } from './runtime.js';
import { installDismiss } from './core/dismiss.js';

export { destroy, emit, get, init, register };
export const version = '0.1.0';

if (typeof document !== 'undefined') {
  start(document);
  installDismiss(document);
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx playwright test tests/e2e/runtime.spec.mjs --project=chromium --project=firefox --project=webkit`
Expected: `21 passed`.

- [ ] **Step 6: Falsify the moved-node rule**

In `runtime.js` delete `&& !node.isConnected` from the removed-nodes loop; rerun chromium. Expected: `destroys removed elements but not moved ones` FAILS (`destroy:b` is 1). Restore; rerun; pass.

- [ ] **Step 7: Commit**

```bash
git add packages/ui/src/js tests/fixtures tests/e2e/runtime.spec.mjs
git commit -m "feat(js): behaviour runtime with auto-init, observer and dismiss"
```

---

### Task 11: Modal

**Files:**
- Create: `packages/ui/src/components/modal.css`, `packages/ui/src/js/core/dialog.js`, `docs/components/modal.html`
- Modify: `packages/ui/src/components/index.css`, `packages/ui/src/js/index.js`, `docs/index.html`
- Test: `tests/e2e/modal.spec.mjs`

**Interfaces:**
- Produces: `<dialog class="ui-modal" closedby="any">` (`--sm|--lg|--xl|--full`, parts `__header|__title|__desc|__body|__footer`), opened by `<button commandfor="id" command="show-modal">`, closed by `command="close"`, Esc, or a backdrop click.
- Produces from `core/dialog.js`: `supports: { commands: boolean, closedBy: boolean }` and `installDialogFallback(doc)`, which handles `commandfor` and `closedby="any"` only where the browser lacks them.
- Public API adds `supports`.

- [ ] **Step 1: Write the failing test**

`tests/e2e/modal.spec.mjs`:

```js
import { test, expect } from '@playwright/test';

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
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx playwright test tests/e2e/modal.spec.mjs --project=chromium`
Expected: FAIL — page 404.

- [ ] **Step 3: Implement**

`packages/ui/src/components/modal.css`:

```css
.ui-modal {
  --_w: 32rem;

  inline-size: min(var(--_w), calc(100vw - 2rem));
  max-inline-size: none;
  max-block-size: calc(100dvh - 2rem);
  margin: auto;
  padding: 0;
  overflow: hidden;
  border: 0;
  border-radius: var(--ui-radius-2xl);
  background-color: var(--ui-surface-raised);
  color: var(--ui-fg);
  box-shadow: var(--ui-shadow-xl);
  transition:
    opacity var(--ui-duration) var(--ui-ease),
    transform var(--ui-duration) var(--ui-ease),
    display var(--ui-duration) allow-discrete,
    overlay var(--ui-duration) allow-discrete;

  &[open] { display: flex; flex-direction: column; }
  &:not([open]) { opacity: 0; transform: translateY(12px) scale(0.98); }

  &::backdrop {
    background-color: var(--ui-overlay);
    backdrop-filter: blur(2px);
    transition:
      background-color var(--ui-duration) var(--ui-ease),
      display var(--ui-duration) allow-discrete,
      overlay var(--ui-duration) allow-discrete;
  }
  &:not([open])::backdrop { background-color: transparent; }
}

@starting-style {
  .ui-modal[open] { opacity: 0; transform: translateY(12px) scale(0.98); }
  .ui-modal[open]::backdrop { background-color: transparent; }
}

@media (prefers-reduced-motion: reduce) {
  .ui-modal,
  .ui-modal:not([open]) { transform: none; }
}

.ui-modal--sm { --_w: 24rem; }
.ui-modal--lg { --_w: 42rem; }
.ui-modal--xl { --_w: 56rem; }
.ui-modal--full { --_w: 100vw; }

.ui-modal__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--ui-space-4);
  padding: var(--ui-space-5) var(--ui-space-6);
  border-block-end: 1px solid var(--ui-border);
}
.ui-modal__title { margin: 0; font-size: var(--ui-text-base); line-height: var(--ui-leading-base); font-weight: var(--ui-weight-semibold); }
.ui-modal__desc { margin: var(--ui-space-0-5) 0 0; font-size: var(--ui-text-sm); line-height: var(--ui-leading-sm); color: var(--ui-fg-muted); }
.ui-modal__body { flex: 1; overflow-y: auto; padding: var(--ui-space-6); }
.ui-modal__footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--ui-space-2);
  padding: var(--ui-space-4) var(--ui-space-6);
  border-block-start: 1px solid var(--ui-border);
}

:root:has(.ui-modal:modal) { overflow: hidden; }
```

`packages/ui/src/js/core/dialog.js`:

```js
// Native <dialog> does the work. Only where a browser lacks invoker commands
// (commandfor/command) or closedby="any" does this fill the gap.
export const supports = {
  commands: typeof HTMLButtonElement !== 'undefined' && 'command' in HTMLButtonElement.prototype,
  closedBy: typeof HTMLDialogElement !== 'undefined' && 'closedBy' in HTMLDialogElement.prototype,
};

export function installDialogFallback(doc) {
  if (!supports.commands) {
    doc.addEventListener('click', (event) => {
      const button = event.target.closest?.('button[commandfor]');
      if (!button) return;
      const dialog = doc.getElementById(button.getAttribute('commandfor'));
      if (!(dialog instanceof HTMLDialogElement)) return;
      const command = button.getAttribute('command');
      if (command === 'show-modal' && !dialog.open) dialog.showModal();
      else if (command === 'close' && dialog.open) dialog.close(button.value || undefined);
      else if (command === 'request-close' && dialog.open) (dialog.requestClose ? dialog.requestClose() : dialog.close());
    });
  }
  if (!supports.closedBy) {
    doc.addEventListener('click', (event) => {
      const dialog = event.target;
      if (!(dialog instanceof HTMLDialogElement) || !dialog.open || dialog.getAttribute('closedby') !== 'any') return;
      const r = dialog.getBoundingClientRect();
      const inside = event.clientX >= r.left && event.clientX <= r.right && event.clientY >= r.top && event.clientY <= r.bottom;
      if (!inside) dialog.close();
    });
  }
}
```

`packages/ui/src/js/index.js`:

```js
import { destroy, emit, get, init, register, start } from './runtime.js';
import { installDismiss } from './core/dismiss.js';
import { installDialogFallback, supports } from './core/dialog.js';

export { destroy, emit, get, init, register, supports };
export const version = '0.1.0';

if (typeof document !== 'undefined') {
  start(document);
  installDismiss(document);
  installDialogFallback(document);
}
```

`packages/ui/src/components/index.css` — append:

```css
@import "./modal.css";
```

`docs/components/modal.html` (head and header as in `button.html`, title `Modal · ui-shared-libs`; body `<main>`):

```html
  <main class="docs-main">
    <h1>Modal</h1>
    <p class="docs-lead">A native <code>&lt;dialog&gt;</code>. Esc, a click outside or a close button closes it. Works without ui.js in browsers with invoker commands; ui.js fills in the rest.</p>
    <section class="docs-example" aria-labelledby="ex-modal">
      <h2 id="ex-modal">Modal</h2>
      <div class="docs-demo">
        <button type="button" class="ui-btn ui-btn--primary" commandfor="demo-modal" command="show-modal">Open modal</button>
        <dialog class="ui-modal" id="demo-modal" closedby="any" aria-labelledby="demo-modal-title">
          <header class="ui-modal__header">
            <div>
              <h2 class="ui-modal__title" id="demo-modal-title">Delete member?</h2>
              <p class="ui-modal__desc">This cannot be undone.</p>
            </div>
            <button type="button" class="ui-close" commandfor="demo-modal" command="close" aria-label="Close"></button>
          </header>
          <div class="ui-modal__body">
            <p>The member's savings history stays in the reports.</p>
          </div>
          <footer class="ui-modal__footer">
            <button type="button" class="ui-btn" commandfor="demo-modal" command="close">Cancel</button>
            <button type="button" class="ui-btn ui-btn--danger" commandfor="demo-modal" command="close" value="delete">Delete</button>
          </footer>
        </dialog>
      </div>
    </section>
  </main>
```

In `docs/index.html` add:

```html
      <li><a href="components/modal.html">Modal</a></li>
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx playwright test tests/e2e/modal.spec.mjs --project=chromium --project=firefox --project=webkit`
Expected: `15 passed`. Then run `npx playwright test tests/e2e/modal.spec.mjs --reporter=json | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const r=JSON.parse(s);const seen=new Set();for(const f of r.suites)for(const sp of f.specs)for(const t of sp.tests)for(const a of t.annotations)seen.add(t.projectName+' '+a.description);console.log([...seen].join('\n'))})"` and read the `native support` line per engine. At least one engine should report `commands: false` or `closedBy: false`; that engine's passing tests prove the fallback works. If every engine reports both `true`, the fallback was not exercised (native behaviour cannot be switched off from script): say so in the commit message rather than claiming it is tested.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src docs tests/e2e/modal.spec.mjs
git commit -m "feat(modal): native dialog with command and closedby fallbacks"
```

---

### Task 12: Toast

**Files:**
- Create: `packages/ui/src/components/toast.css`, `packages/ui/src/js/core/toast.js`, `docs/components/toast.html`
- Modify: `packages/ui/src/components/index.css`, `packages/ui/src/js/index.js`, `docs/index.html`
- Test: `tests/e2e/toast.spec.mjs`

**Interfaces:**
- Consumes: `register`, `init`, `get`, `emit` from `runtime.js`.
- Produces: `toast(options) → { hide(): void, destroy(): void }` with `options = { title?: string, message?: string, variant?: 'info'|'success'|'warning'|'danger', duration?: number (ms, default 5000, 0 = stays), dismissible?: boolean (default true) }`. Declarative: `<div class="ui-toast ui-toast--success" data-ui="toast" data-duration="4000">` is moved into the region and timed. Events `ui:toast:show`, `ui:toast:hide`. CSS: `.ui-toast-region` (`--top-right|--top-center|--bottom-center`), `.ui-toast` (`--success|--warning|--danger`, info default, parts `__body|__title|__text`), `--ui-toast-duration`.

- [ ] **Step 1: Write the failing test**

`tests/e2e/toast.spec.mjs`:

```js
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => { await page.goto('/docs/components/toast.html'); });

test('UI.toast shows, then removes itself after its duration', async ({ page }) => {
  await page.evaluate(() => UI.toast({ title: 'Saved', message: 'Member updated.', variant: 'success', duration: 400 }));
  const toast = page.locator('.ui-toast-region .ui-toast--success');
  await expect(toast).toBeVisible();
  await expect(toast).toHaveAttribute('role', 'status');
  await expect(toast).toContainText('Member updated.');
  await expect(toast).toHaveCount(0, { timeout: 3000 });
});

test('duration 0 stays until closed, and emits hide', async ({ page }) => {
  await page.evaluate(() => {
    window.hidden = 0;
    document.addEventListener('ui:toast:hide', () => { window.hidden += 1; });
    UI.toast({ message: 'Stays', duration: 0 });
  });
  const toast = page.locator('.ui-toast', { hasText: 'Stays' });
  await page.waitForTimeout(800);
  await expect(toast).toHaveAttribute('data-persistent', '');
  await toast.getByRole('button', { name: 'Close' }).click();
  await expect(toast).toHaveCount(0);
  expect(await page.evaluate(() => window.hidden)).toBe(1);
});

test('hovering pauses the timer', async ({ page }) => {
  await page.evaluate(() => UI.toast({ message: 'Hover me', duration: 700 }));
  const toast = page.locator('.ui-toast', { hasText: 'Hover me' });
  await toast.hover();
  await page.waitForTimeout(1200);
  await expect(toast).toBeVisible();
  await page.mouse.move(0, 0);
  await expect(toast).toHaveCount(0, { timeout: 3000 });
});

test('server-rendered toast moves into the region', async ({ page }) => {
  await expect(page.locator('.ui-toast-region #flash')).toHaveCount(1);
});

test('options are text, never HTML', async ({ page }) => {
  await page.evaluate(() => UI.toast({ message: '<img src=x id=injected>', duration: 0 }));
  await expect(page.locator('#injected')).toHaveCount(0);
  await expect(page.locator('.ui-toast', { hasText: '<img src=x id=injected>' })).toHaveCount(1);
});

test('unknown variants fall back to info; danger is an alert', async ({ page }) => {
  await page.evaluate(() => {
    UI.toast({ message: 'odd', variant: 'bogus', duration: 0 });
    UI.toast({ message: 'bad', variant: 'danger', duration: 0 });
  });
  await expect(page.locator('.ui-toast', { hasText: 'odd' })).toHaveClass(/ui-toast--info/);
  await expect(page.locator('.ui-toast', { hasText: 'bad' })).toHaveAttribute('role', 'alert');
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx playwright test tests/e2e/toast.spec.mjs --project=chromium`
Expected: FAIL — page 404.

- [ ] **Step 3: Implement**

`packages/ui/src/components/toast.css`:

```css
.ui-toast-region {
  position: fixed;
  z-index: var(--ui-z-toast);
  inset-block-end: var(--ui-space-4);
  inset-inline-end: var(--ui-space-4);
  display: flex;
  flex-direction: column;
  gap: var(--ui-space-2);
  inline-size: min(22rem, calc(100vw - 2rem));
  pointer-events: none;
}
.ui-toast-region--top-right { inset-block: var(--ui-space-4) auto; flex-direction: column-reverse; }
.ui-toast-region--top-center { inset-block: var(--ui-space-4) auto; inset-inline: 50% auto; translate: -50% 0; flex-direction: column-reverse; }
.ui-toast-region--bottom-center { inset-inline: 50% auto; translate: -50% 0; }

.ui-toast {
  --_accent: var(--ui-info);

  position: relative;
  display: flex;
  align-items: flex-start;
  gap: var(--ui-space-3);
  padding: var(--ui-space-4) var(--ui-space-4) var(--ui-space-4) var(--ui-space-5);
  overflow: hidden;
  border: 1px solid var(--ui-border);
  border-radius: var(--ui-radius-xl);
  background-color: var(--ui-surface-raised);
  color: var(--ui-fg);
  box-shadow: var(--ui-shadow-lg);
  pointer-events: auto;
  animation: ui-toast-in var(--ui-duration-slow) var(--ui-ease);

  &::before {
    content: "";
    position: absolute;
    inset-block: 0;
    inset-inline-start: 0;
    inline-size: 4px;
    background-color: var(--_accent);
  }
  &::after {
    content: "";
    position: absolute;
    inset-inline: 0;
    inset-block-end: 0;
    block-size: 2px;
    background-color: var(--_accent);
    transform-origin: left;
    animation: ui-toast-progress var(--ui-toast-duration, 5000ms) linear forwards;
  }
  &:hover::after,
  &:focus-within::after { animation-play-state: paused; }
  &[data-persistent]::after { display: none; }
  &[data-state="closing"] { animation: ui-toast-out var(--ui-duration) var(--ui-ease) forwards; }
}
.ui-toast--success { --_accent: var(--ui-success); }
.ui-toast--warning { --_accent: var(--ui-warning); }
.ui-toast--danger { --_accent: var(--ui-danger); }

.ui-toast__body { flex: 1; min-inline-size: 0; }
.ui-toast__title { margin: 0; font-size: var(--ui-text-sm); line-height: var(--ui-leading-sm); font-weight: var(--ui-weight-semibold); }
.ui-toast__text { margin: 0; font-size: var(--ui-text-sm); line-height: var(--ui-leading-sm); color: var(--ui-fg-muted); }
.ui-toast__title + .ui-toast__text { margin-block-start: var(--ui-space-0-5); }

@keyframes ui-toast-in { from { opacity: 0; transform: translateY(8px) scale(0.98); } }
@keyframes ui-toast-out { to { opacity: 0; transform: translateX(16px); } }
@keyframes ui-toast-progress { from { transform: scaleX(1); } to { transform: scaleX(0); } }

@media (prefers-reduced-motion: reduce) {
  .ui-toast,
  .ui-toast[data-state="closing"] { animation-name: none; }
}
```

`packages/ui/src/js/core/toast.js`:

```js
import { emit, get, init } from '../runtime.js';

const VARIANTS = new Set(['info', 'success', 'warning', 'danger']);
const DEFAULT_DURATION = 5000;

function region() {
  let el = document.querySelector('.ui-toast-region');
  if (!el) {
    el = document.createElement('div');
    el.className = 'ui-toast-region';
    el.setAttribute('role', 'region');
    el.setAttribute('aria-label', 'Notifications');
    document.body.append(el);
  }
  return el;
}

// A countdown that pauses while the pointer or focus is on the toast.
function countdown(el, duration, done) {
  if (duration <= 0) return () => {};
  let remaining = duration;
  let startedAt = 0;
  let timer = 0;
  let paused = true;
  const resume = () => { if (!paused) return; paused = false; startedAt = Date.now(); timer = setTimeout(done, remaining); };
  const pause = () => { if (paused) return; paused = true; clearTimeout(timer); remaining -= Date.now() - startedAt; };
  const events = [['mouseenter', pause], ['mouseleave', resume], ['focusin', pause], ['focusout', resume]];
  for (const [type, fn] of events) el.addEventListener(type, fn);
  resume();
  return () => {
    clearTimeout(timer);
    for (const [type, fn] of events) el.removeEventListener(type, fn);
  };
}

function close(el) {
  if (el.dataset.state === 'closing') return;
  el.dataset.state = 'closing';
  emit(el, 'toast', 'hide');
  const remove = () => el.remove();
  el.addEventListener('animationend', (event) => { if (event.target === el && !event.pseudoElement) remove(); });
  setTimeout(remove, 400);
}

export function toastBehaviour(el) {
  if (!el.closest('.ui-toast-region')) region().append(el);
  const duration = Number(el.dataset.duration ?? DEFAULT_DURATION);
  el.style.setProperty('--ui-toast-duration', `${duration}ms`);
  if (duration <= 0) el.setAttribute('data-persistent', '');
  const hide = () => close(el);
  const stop = countdown(el, duration, hide);
  const onClick = (event) => { if (event.target.closest('[data-ui-dismiss]')) hide(); };
  el.addEventListener('click', onClick);
  emit(el, 'toast', 'show');
  return {
    hide,
    destroy() { stop(); el.removeEventListener('click', onClick); },
  };
}

export function toast({ title = '', message = '', variant = 'info', duration = DEFAULT_DURATION, dismissible = true } = {}) {
  const kind = VARIANTS.has(variant) ? variant : 'info';
  const el = document.createElement('div');
  el.className = `ui-toast ui-toast--${kind}`;
  el.setAttribute('role', kind === 'danger' ? 'alert' : 'status');
  el.dataset.ui = 'toast';
  el.dataset.duration = String(duration);

  const body = document.createElement('div');
  body.className = 'ui-toast__body';
  if (title) {
    const t = document.createElement('p');
    t.className = 'ui-toast__title';
    t.textContent = title;
    body.append(t);
  }
  if (message) {
    const m = document.createElement('p');
    m.className = 'ui-toast__text';
    m.textContent = message;
    body.append(m);
  }
  el.append(body);
  if (dismissible) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'ui-close';
    button.setAttribute('aria-label', 'Close');
    button.setAttribute('data-ui-dismiss', '');
    el.append(button);
  }
  region().append(el);
  init(el);
  return get(el, 'toast');
}
```

`packages/ui/src/js/index.js`:

```js
import { destroy, emit, get, init, register, start } from './runtime.js';
import { installDismiss } from './core/dismiss.js';
import { installDialogFallback, supports } from './core/dialog.js';
import { toast, toastBehaviour } from './core/toast.js';

register('toast', toastBehaviour);

export { destroy, emit, get, init, register, supports, toast };
export const version = '0.1.0';

if (typeof document !== 'undefined') {
  start(document);
  installDismiss(document);
  installDialogFallback(document);
}
```

`packages/ui/src/components/index.css` — append:

```css
@import "./toast.css";
```

`docs/components/toast.html` (head and header as in `button.html`, title `Toast · ui-shared-libs`; body `<main>`):

```html
  <main class="docs-main">
    <h1>Toast</h1>
    <p class="docs-lead">Brief messages in a corner. Call <code>UI.toast({ … })</code>, or render one from the server with <code>data-ui="toast"</code>. Needs ui.js.</p>
    <section class="docs-example" aria-labelledby="ex-api">
      <h2 id="ex-api">From JavaScript</h2>
      <div class="docs-demo">
        <button type="button" class="ui-btn ui-btn--primary" data-docs-toast='{"title":"Saved","message":"Member updated.","variant":"success"}'>Success</button>
        <button type="button" class="ui-btn" data-docs-toast='{"message":"Sync in progress."}'>Info</button>
        <button type="button" class="ui-btn ui-btn--danger" data-docs-toast='{"title":"Failed","message":"Try again.","variant":"danger"}'>Danger</button>
      </div>
    </section>
    <section class="docs-example" aria-labelledby="ex-server">
      <h2 id="ex-server">From the server</h2>
      <div class="docs-demo">
        <div class="ui-toast ui-toast--warning" role="status" data-ui="toast" data-duration="0" id="flash">
          <div class="ui-toast__body">
            <p class="ui-toast__title">Session ends soon</p>
            <p class="ui-toast__text">Save your work.</p>
          </div>
          <button type="button" class="ui-close" data-ui-dismiss aria-label="Close"></button>
        </div>
      </div>
    </section>
  </main>
```

In `docs/index.html` add:

```html
      <li><a href="components/toast.html">Toast</a></li>
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx playwright test tests/e2e/toast.spec.mjs --project=chromium --project=firefox --project=webkit`
Expected: `18 passed`.

Run: `npm run lint:css && npx playwright test tests/e2e/runtime.spec.mjs`
Expected: both pass (the runtime suite still green with toast registered).

- [ ] **Step 5: Falsify the XSS guard**

In `toast.js` change `m.textContent = message;` to `m.innerHTML = message;`, `npm run build`, rerun chromium. Expected: `options are text, never HTML` FAILS (`#injected` count 1). Restore; rebuild; pass.

- [ ] **Step 6: Commit**

```bash
git add packages/ui/src docs tests/e2e/toast.spec.mjs
git commit -m "feat(toast): toast API, server-rendered toasts, pause on hover"
```

---

### Task 13: Accessibility, visual baselines, size budget

**Files:**
- Create: `packages/ui/scripts/size.mjs`, `tests/e2e/a11y.spec.mjs`, `tests/visual/pages.spec.mjs`
- Test: `tests/node/size.test.mjs`

**Interfaces:**
- Produces: `budgets` and `checkSizes(distDir, limits?) → Promise<Array<{ file, size, limit, ok }>>` from `size.mjs`; `npm run size` exits 1 when over.

- [ ] **Step 1: Write the failing tests**

`tests/node/size.test.mjs`:

```js
import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { build } from '../../packages/ui/scripts/build.mjs';
import { budgets, checkSizes } from '../../packages/ui/scripts/size.mjs';

let outDir;
before(async () => { ({ outDir } = await build({ outDir: await mkdtemp(join(tmpdir(), 'ui-size-')) })); });

test('the real bundles are within budget', async () => {
  const report = await checkSizes(outDir);
  assert.deepEqual(report.filter((r) => !r.ok), []);
  assert.equal(report.length, Object.keys(budgets).length);
});

test('a 1-byte budget fails', async () => {
  const report = await checkSizes(outDir, { 'ui.min.css': 1 });
  assert.equal(report[0].ok, false);
});
```

`tests/e2e/a11y.spec.mjs`:

```js
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
```

`tests/visual/pages.spec.mjs`:

```js
import { test, expect } from '@playwright/test';
import { readdirSync } from 'node:fs';

const pages = ['index', ...readdirSync('docs/components').filter((f) => f.endsWith('.html')).map((f) => `components/${f.slice(0, -5)}`)];

for (const name of pages) {
  for (const theme of ['light', 'dark']) {
    test(`${name} ${theme}`, async ({ page }) => {
      await page.goto(`/docs/${name}.html`);
      await page.evaluate((t) => { document.documentElement.dataset.theme = t; }, theme);
      await page.evaluate(() => document.getAnimations().forEach((a) => a.finish()));
      await expect(page).toHaveScreenshot(`${name.replace('/', '-')}-${theme}.png`, { fullPage: true, animations: 'disabled' });
    });
  }
}
```

- [ ] **Step 2: Run them to verify they fail**

Run: `node --test tests/node/size.test.mjs`
Expected: FAIL, cannot find `size.mjs`.

- [ ] **Step 3: Size script**

`packages/ui/scripts/size.mjs`:

```js
// Gzip budget for the core bundles. `npm run size` exits 1 when over.
import { readFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const budgets = { 'ui.min.css': 40 * 1024, 'ui.min.js': 25 * 1024 };

export async function checkSizes(distDir, limits = budgets) {
  const report = [];
  for (const [file, limit] of Object.entries(limits)) {
    const size = gzipSync(await readFile(join(distDir, file)), { level: 9 }).length;
    report.push({ file, size, limit, ok: size <= limit });
  }
  return report;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const dist = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
  const report = await checkSizes(dist);
  for (const r of report) console.log(`${r.ok ? 'ok  ' : 'OVER'} ${r.file} ${(r.size / 1024).toFixed(1)} KB gzip (limit ${(r.limit / 1024).toFixed(0)} KB)`);
  if (report.some((r) => !r.ok)) process.exit(1);
}
```

- [ ] **Step 4: Run the size test and script**

Run: `node --test tests/node/size.test.mjs`
Expected: `# pass 2`.

Run: `npm run build && npm run size`
Expected: two `ok` lines, exit 0. Record both sizes in the commit message.

- [ ] **Step 5: Run axe**

Run: `npx playwright test tests/e2e/a11y.spec.mjs --project=chromium --project=firefox --project=webkit`
Expected: all pass (10 pages × 2 themes × 3 engines = 60). For each failure, fix the cause in the kit or the docs page — a token pair below 4.5:1, a missing label, a non-focusable scroller — never by filtering the rule out. Re-run until green.

- [ ] **Step 6: Visual baselines**

Run: `npx playwright test --project=visual --update-snapshots`
Expected: 20 PNGs under `tests/visual/pages.spec.mjs-snapshots/`, with `-visual-win32` in their names. Open three of them (index light, button dark, modal light) with the Read tool and check they show the expected page; a blank or unstyled screenshot means the CSS failed to load.

Run: `npx playwright test --project=visual`
Expected: `20 passed`. These baselines are Windows-specific, so CI does not run this project.

- [ ] **Step 7: Commit**

```bash
git add packages/ui/scripts/size.mjs tests
git commit -m "test: axe on every docs page, visual baselines, size budget"
```

---

### Task 14: Package readiness

**Files:**
- Create: `LICENSE`, `packages/ui/LICENSE`, `README.md`, `packages/ui/README.md`
- Test: `tests/node/pack.test.mjs`

**Interfaces:**
- Consumes: `exports` in `packages/ui/package.json` (Task 1).

- [ ] **Step 1: Write the failing test**

`tests/node/pack.test.mjs`:

```js
import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { build } from '../../packages/ui/scripts/build.mjs';

const require = createRequire(import.meta.url);
let files;

before(async () => {
  await build();
  const out = execSync('npm pack --dry-run --json --ignore-scripts --workspace @ui-shared-libs/ui', { encoding: 'utf8' });
  files = JSON.parse(out)[0].files.map((f) => f.path);
});

test('the tarball holds dist, README, LICENSE and nothing from src', () => {
  for (const f of ['package.json', 'README.md', 'LICENSE', 'dist/ui.css', 'dist/ui.min.css', 'dist/ui.iife.min.js', 'dist/components/button.css']) {
    assert.ok(files.includes(f), `missing ${f}`);
  }
  assert.deepEqual(files.filter((f) => f.startsWith('src/') || f.startsWith('scripts/')), []);
});

test('export paths resolve', () => {
  for (const spec of ['@ui-shared-libs/ui/ui.css', '@ui-shared-libs/ui/tokens.css', '@ui-shared-libs/ui/components/button.css', '@ui-shared-libs/ui/ui.iife.min.js']) {
    assert.ok(require.resolve(spec));
  }
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test tests/node/pack.test.mjs`
Expected: FAIL on `missing README.md` and `missing LICENSE`.

- [ ] **Step 3: Licence and readmes**

`LICENSE` and `packages/ui/LICENSE` (identical):

```
MIT License

Copyright (c) 2026 Imam Budi Prasojo

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

`packages/ui/README.md`:

````markdown
# @ui-shared-libs/ui

A UI kit for HTML from any stack: Laravel, Django, Rails, Go, plain HTML,
htmx, Vue or React. The look is one CSS file. A small optional script adds
what CSS cannot (toasts, and fallbacks for older browsers).

Docs with live examples: https://itzjoo.github.io/ui-shared-libs/docs/

## Install

From a CDN:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@ui-shared-libs/ui@0.1/dist/ui.min.css">
<script src="https://cdn.jsdelivr.net/npm/@ui-shared-libs/ui@0.1/dist/ui.iife.min.js" defer></script>
```

From npm:

```
npm install @ui-shared-libs/ui
```

```js
import '@ui-shared-libs/ui/ui.css';
import { toast } from '@ui-shared-libs/ui';
```

## A first page

```html
<form class="ui-card ui-stack">
  <div class="ui-field">
    <label class="ui-label" for="name">Full name</label>
    <input class="ui-input" id="name" required>
  </div>
  <button class="ui-btn ui-btn--primary">Save</button>
</form>
```

## Theme

Every colour comes from a token. Override tokens after the kit:

```css
:root { --ui-primary: #2563eb; --ui-primary-hover: #1d4ed8; --ui-primary-active: #1e40af; }
```

Dark mode follows the device. Force one with `<html data-theme="dark">` or
`data-theme="light"`.

The kit sits in `@layer ui`, so your own CSS wins without `!important`.

## Only what you use

`dist/tokens.css` and `dist/base.css`, then any of `dist/components/*.css`.

## JavaScript

`ui.iife.min.js` defines `window.UI`; the npm entry exports the same names.

| | |
|---|---|
| `UI.toast({ title, message, variant, duration })` | show a toast |
| `UI.init(root)` / `UI.destroy(root)` | run behaviours on markup (automatic for markup added later) |
| `UI.register(name, factory)` | add a behaviour for `data-ui="name"` |

Events are `ui:<component>:<event>`, e.g. `ui:toast:hide`.

## Browsers

Chrome and Edge 123, Firefox 125, Safari 17.5, and newer.

## Licence

MIT
````

`README.md` (repo root):

```markdown
# ui-shared-libs

Source of `@ui-shared-libs/ui`, a framework-free UI kit. Package docs:
[packages/ui/README.md](packages/ui/README.md).

    npm install
    npm run build      # packages/ui/dist
    npm run serve      # docs at http://127.0.0.1:4317/docs/
    npm test           # build, lint, node tests, size, Playwright (3 engines)
    npm run test:visual  # screenshot baselines (Windows)

Design: [docs/specs](docs/specs). Plans: [docs/plans](docs/plans).
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test tests/node/pack.test.mjs`
Expected: `# pass 2`.

- [ ] **Step 5: Full suite**

Run: `npm test`
Expected: exit 0; Playwright prints the total passed and `0 failed`.

- [ ] **Step 6: Commit**

```bash
git add LICENSE README.md packages/ui/LICENSE packages/ui/README.md tests/node/pack.test.mjs
git commit -m "docs: readme and licence; pack test"
```

---

### Task 15: CI and GitHub Pages

**Files:**
- Create: `.github/workflows/ci.yml`, `.github/workflows/pages.yml`

- [ ] **Step 1: CI workflow**

`.github/workflows/ci.yml`:

```yaml
name: ci
on:
  pull_request:
  push:
    branches: [main]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npx playwright install --with-deps chromium firefox webkit
      - run: npm test
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report
```

- [ ] **Step 2: Pages workflow**

`.github/workflows/pages.yml`:

```yaml
name: pages
on:
  push:
    branches: [main]
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: true
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run build
      - run: |
          mkdir -p _site/packages/ui
          cp -r docs _site/docs
          cp -r packages/ui/dist _site/packages/ui/dist
          printf '<!doctype html><meta http-equiv="refresh" content="0; url=docs/">' > _site/index.html
      - uses: actions/upload-pages-artifact@v3
        with:
          path: _site
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 3: Commit**

```bash
git add .github
git commit -m "ci: test on pull requests; publish docs to GitHub Pages"
```

- [ ] **Step 4: Push and open the PR — ask the user first**

This is outward-facing. Ask the user before running:

```bash
git push -u origin feat/m1-foundation
gh pr create --repo ITZjoo/ui-shared-libs --base main --head feat/m1-foundation --title "Milestone 1: foundation" --body-file - <<'EOF'
Build pipeline, tokens and dark mode, base, layout utilities, JS runtime, and
13 components (button, input, textarea, select, checkbox, radio, switch,
form-group, card, badge, alert, modal, toast) with docs pages and tests.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
```

Then: `gh pr checks --repo ITZjoo/ui-shared-libs --watch`
Expected: `ci` passes on Linux. If a Playwright test fails only on CI, download the `playwright-report` artifact and read the trace before changing anything.

Pages needs the repo setting **Settings → Pages → Source: GitHub Actions**, which the user sets; the `pages` workflow runs after the PR merges to `main`.

- [ ] **Step 5: Publish — the user runs it**

Publishing is irreversible (a version number can never be reused). Do not run it. Give the user these commands after the PR is merged and the npm organisation `ui-shared-libs` exists:

```bash
git checkout main && git pull
npm publish --workspace @ui-shared-libs/ui --dry-run
npm publish --workspace @ui-shared-libs/ui
git tag ui-v0.1.0 && git push origin ui-v0.1.0
```
