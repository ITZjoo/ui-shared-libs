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
