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
  for (const file of ['ui.css', 'ui.min.css', 'tokens.css', 'tokens.min.css', 'base.css', 'base.min.css', 'utilities.css', 'utilities.min.css', 'ui.js', 'ui.min.js', 'ui.iife.min.js']) {
    assert.ok(out.files.includes(file), `missing ${file}`);
  }
  assert.ok((await readdir(out.outDir)).includes('components'));
});

test('every CSS bundle starts with the layer order, exactly once', async () => {
  const strip = (v) => v.replace(/\s+/g, '');
  const wanted = strip(LAYERS);
  for (const file of out.files.filter((f) => f.endsWith('.css'))) {
    const css = await readFile(join(out.outDir, file), 'utf8');
    if (file.endsWith('.min.css')) {
      assert.ok(strip(css).startsWith(wanted), `${file} starts with: ${css.slice(0, 80)}`);
    } else {
      assert.ok(css.trimStart().startsWith(LAYERS), `${file} starts with: ${css.slice(0, 80)}`);
    }
    const count = strip(css).split('ui.reset,ui.tokens').length - 1;
    assert.equal(count, 1, `${file} has the layer order ${count} times`);
  }
});

test('the IIFE defines a global UI', async () => {
  const js = await readFile(join(out.outDir, 'ui.iife.min.js'), 'utf8');
  assert.match(js, /var UI=/);
});
