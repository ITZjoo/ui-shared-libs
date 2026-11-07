// The AI skill shipped in the package must not teach classes or tokens that
// do not exist: every ui- class and --ui- token it names is checked against
// the built CSS.
import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { build } from '../../packages/ui/scripts/build.mjs';

const skillDir = 'packages/ui/skills/ui-shared-libs';
const docs = ['SKILL.md', 'references/components.md'].map((f) => readFileSync(`${skillDir}/${f}`, 'utf8')).join('\n');
let css;

// A private output dir: node --test runs files in parallel and pack.test.mjs owns dist/.
before(async () => {
  const { outDir } = await build({ outDir: await mkdtemp(join(tmpdir(), 'ui-skill-')) });
  css = readFileSync(join(outDir, 'ui.css'), 'utf8');
});

// Names the skill lists as not shipped yet, or as examples of what not to write.
const NOT_IN_KIT = new Set(['ui-btn--disabled']);

test('the skill has frontmatter with a name and a description', () => {
  const skill = readFileSync(`${skillDir}/SKILL.md`, 'utf8');
  assert.match(skill, /^---\nname: ui-shared-libs\ndescription: .{40,}\n---\n/);
});

test('every ui- class the skill names exists in ui.css', () => {
  // "ui-gap-{1,2,…}" ranges are prose; the real gap classes are listed by the layout test.
  const text = docs.replace(/ui-gap-(?:\{[^}]*\}|\*)/g, '');
  // Not preceded by "-" or a letter: that would be a --ui-token or a data-ui-attribute.
  const classes = new Set(text.match(/(?<![\w-])ui-[a-z0-9]+(?:-[a-z0-9]+)*(?:__[a-z0-9-]+)?(?:--[a-z0-9-]+)?/g));
  assert.ok(classes.size > 40, `found only ${classes.size} class names; the pattern is broken`);
  const missing = [...classes]
    .filter((c) => !NOT_IN_KIT.has(c))
    .filter((c) => !c.startsWith('ui-shared-libs'))
    .filter((c) => !new RegExp(`\\.${c.replace(/[-_]/g, (m) => `\\${m}`)}(?![a-z0-9_-])`).test(css));
  assert.deepEqual(missing, []);
});

test('every --ui- token the skill names is defined', () => {
  const tokens = new Set(docs.match(/--ui-[a-z0-9-]+[a-z0-9]/g));
  assert.ok(tokens.size > 10, `found only ${tokens.size} tokens; the pattern is broken`);
  // "--ui-radius-*" style wildcards and "-hover" suffix lists are written as prose; skip prefixes followed by "*".
  // A token is real if the kit defines it or reads it with a fallback (var(--ui-grid-min, 16rem)).
  const missing = [...tokens].filter((t) => !docs.includes(`${t}-*`) && !css.includes(`${t}:`) && !css.includes(`var(${t},`));
  assert.deepEqual(missing, []);
});
