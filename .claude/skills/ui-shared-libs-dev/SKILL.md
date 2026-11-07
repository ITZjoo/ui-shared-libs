---
name: ui-shared-libs-dev
description: Work on the ui-shared-libs repository itself — add or change a component, token, docs page, story or test in @ui-shared-libs/ui. Use for any edit under packages/ui, docs/, stories/ or tests/ in this repo. For building an app with the kit, use the ui-shared-libs skill in packages/ui/skills instead.
---

# Working on ui-shared-libs

Read first: `docs/specs/2026-11-07-ui-shared-libs-design.md` (what the kit
is and the milestones) and `packages/ui/README.md` (the public promise).

## Layout

```
packages/ui/src/tokens/      primitives (raw scales), semantic (what components read), glyphs (SVG masks), dark
packages/ui/src/base/        reset, typography, motion
packages/ui/src/components/  one file per component; index.css imports them in order
packages/ui/src/utilities/   layout.css (the only utilities)
packages/ui/src/js/          runtime.js (registry, observer), core/*.js, index.js (public API)
packages/ui/scripts/         build.mjs (Lightning CSS + esbuild), size.mjs
packages/ui/skills/          the consumer AI skill, shipped in the npm tarball
docs/                        static docs; each page is also a Playwright fixture
stories/, .storybook/        Storybook playground (reads src/ directly)
tests/node|e2e|visual|storybook
```

## Rules the code already follows

- Everything is inside `@layer ui.*`; the build prepends the full layer
  statement to every bundle. Never add `!important` (stylelint fails).
- Class names: `ui-<block>[__<part>][--<modifier>]`. Private custom
  properties `--_name`, public ones `--ui-name`.
- In `components/`, `base/`, `utilities/`: no raw colours (hex, `rgb()`,
  named). Read semantic tokens; add a token to `semantic.css` with a
  `light-dark()` value if none fits.
- State is a native attribute (`disabled`, `aria-invalid`, `aria-busy`,
  `[open]`, `:checked`), never a state class.
- Hover rules use `:where(:not(:disabled, :focus, [aria-invalid="true"]))`
  so hover never masks focus or error styling.
- Every text and non-text pair meets WCAG AA (4.5:1 text, 3:1 borders,
  icons, focus rings) in light **and** dark. Check with the axe tests and by
  computing the ratio; the tokens file comments record the hard cases.
- Motion goes through `--ui-duration*`; the reduced-motion block in
  `primitives.css` zeroes them.
- Visual style is deliberately quiet: no gradients, glows, side stripes,
  blur beyond the modal backdrop, or decorative animation. Controls share
  `--ui-control-h*` and `--ui-control-radius`.

## Adding a component (checklist)

1. `packages/ui/src/components/<name>.css`, imported in `components/index.css`.
2. JS only if CSS cannot do it: `core/<name>.js` exporting a factory,
   `register('<name>', factory)` in `index.js`; return `{ destroy }`; emit
   events with `emit(el, '<name>', '<event>', detail, { cancelable })`.
3. `docs/components/<name>.html` (copy an existing page; give testable
   elements ids) and a link in `docs/index.html`.
4. `stories/<name>.stories.js`: a `Playground` with controls plus fixed
   stories for variants and states. Ids must be unique per story (docs pages
   render every story together); use the story id from the render context.
5. Tests: `tests/e2e/<name>.spec.mjs` asserting computed styles via
   `css()`/`tokenColor()` after `settle()`, keyboard and events for JS; the
   docs page is picked up by `a11y.spec.mjs` and the story by
   `tests/storybook`. Add it to the title list in
   `tests/storybook/stories.spec.mjs`.
6. Visual baselines: `npx playwright test --project=visual --update-snapshots`
   — only after looking at the page in light and dark yourself. Baselines are
   Windows (`-win32.png`).
7. Update `packages/ui/skills/ui-shared-libs/references/components.md`
   (and `SKILL.md` if behaviour changed). `tests/node/skill.test.mjs` fails
   if the skill names a class or token that does not exist.

## Commands

```
npm run build            # packages/ui/dist
npm run serve            # http://127.0.0.1:4317/docs/
npm run storybook        # http://localhost:6006
npm run test:node        # use this, not `node --test tests/node` (that runs nothing)
npx playwright test --project=chromium tests/e2e/<file>   # quick loop
npm test                 # everything; must exit 0 before a commit
```

## Traps already hit here

- Lightning CSS drops or shortens a bare `@layer a, b;` statement once the
  layers have content; `build.mjs` strips and re-prepends it. The build test
  covers this; do not "simplify" that code.
- `getComputedStyle` right after a theme switch returns the value mid
  transition. Use `settle(page)` (finishes finite animations; spinners are
  infinite and must be skipped, `finish()` throws on them).
- Node 24 prints `ℹ pass N`, not `# pass N`. A grep that returns nothing
  means the pattern is wrong, not that tests passed.
- Prove a new test can fail: break the code, watch it fail, restore.
- Unlayered docs CSS beats the kit; keep `docs/assets/docs.css` selectors
  scoped (`.docs-example > h2`) so they never hit kit markup in demos.
- Toast `duration` / `data-duration` is milliseconds only; `'4s'` parses as
  NaN and falls back to 5000.
- Commit as `imam <imambprasojo@gmail.com>`; never `--no-verify`.
