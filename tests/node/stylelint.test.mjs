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
