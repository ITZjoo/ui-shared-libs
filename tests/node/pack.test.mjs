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
  for (const f of ['package.json', 'README.md', 'LICENSE', 'dist/ui.css', 'dist/ui.min.css', 'dist/utilities.css', 'dist/utilities.min.css', 'dist/ui.iife.min.js', 'dist/components/button.css']) {
    assert.ok(files.includes(f), `missing ${f}`);
  }
  assert.deepEqual(files.filter((f) => f.startsWith('src/') || f.startsWith('scripts/')), []);
});

test('export paths resolve', () => {
  for (const spec of ['@ui-shared-libs/ui/ui.css', '@ui-shared-libs/ui/tokens.css', '@ui-shared-libs/ui/utilities.css', '@ui-shared-libs/ui/components/button.css', '@ui-shared-libs/ui/ui.iife.min.js']) {
    assert.ok(require.resolve(spec));
  }
});
