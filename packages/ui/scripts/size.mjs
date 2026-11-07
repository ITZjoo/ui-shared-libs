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
