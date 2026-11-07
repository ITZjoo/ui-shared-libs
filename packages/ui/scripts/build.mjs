// Builds packages/ui/src into dist/: the full CSS bundle, tokens, base and utilities on
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
    let css = Buffer.from(out).toString();
    // Lightning CSS may drop the bare layer statement or keep a shortened one (a bundle that only uses some
    // layers); every bundle needs exactly the full statement first, once.
    css = LAYERS + (minify ? '' : '\n') + css.replace(/^\s*(@layer[^{;]*;\s*)+/, '');
    result[minify ? 'min' : 'full'] = css;
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
  await emitCss('utilities', join(srcDir, '__utilities__.css'), entry([['utilities/layout.css', 'ui.utilities']]));
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
