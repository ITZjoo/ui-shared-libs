# ui-shared-libs — design

Date: 2026-11-07
Status: approved in conversation, pending written-spec review

## Goal

A public UI library that any stack can use: Laravel, Django, Rails, Go, plain
HTML, htmx, Vue, React. Its look comes from one CSS file and plain HTML; a
small optional JavaScript file adds the behaviour that CSS cannot. It ports
the design of `C:\jojo2\koperasi-ui-component` (78 Vue 3 + Tailwind
components) to framework-free CSS, then wraps it for Vue and React.

The reference repo is read-only input. Its code is not copied: its Tailwind
classes inside `.vue` files are re-expressed as CSS components and tokens.

## Packages

An npm workspace in `C:\jojo\ui-shared-libs` (remote `ITZjoo/ui-shared-libs`),
MIT licensed, published publicly to npm:

| Package | Contents |
|---|---|
| `@ui-shared-libs/ui` | CSS, optional JS, themes, modules. The product. |
| `@ui-shared-libs/vue` | Vue 3 components that render `@ui-shared-libs/ui` markup. |
| `@ui-shared-libs/react` | React components that render `@ui-shared-libs/ui` markup. |

The scope is the npm organisation `ui-shared-libs`, owned by the author and
created before the first publish.

```
packages/
  ui/
    src/
      tokens/        primitives.css, semantic.css, dark.css
      base/          reset.css, typography.css
      utilities/     layout.css
      components/    <name>.css            (core)
      modules/
        dashboard/   <name>.css
        ecommerce/   <name>.css
        id/          <name>.css
      js/
        core/        <name>.js             (core behaviours)
        modules/     dashboard/ ecommerce/ id/
        index.js     registry, auto-init, public API
      ui.css         @imports core
    dist/            build output (committed to npm, not to git)
  vue/
  react/
docs/                static HTML docs site, one page per component
tests/               Playwright
```

## Build output (`@ui-shared-libs/ui`)

```
dist/ui.css            dist/ui.min.css            core
dist/ui.js             dist/ui.min.js             core behaviours, ESM
dist/ui.iife.min.js                               same, for a <script> tag
dist/modules/dashboard.{css,min.css,js,min.js}
dist/modules/ecommerce.{css,min.css,js,min.js}
dist/modules/id.{css,min.css,js,min.js}
dist/components/<name>.css                         one component, for cherry-picking
```

- CSS: plain CSS with native nesting, bundled and minified by **Lightning CSS**
  with targets set to the supported browsers.
- JS: plain ES modules, no dependencies, bundled by **esbuild**.
- Delivery: npm, and jsDelivr / unpkg from the npm package.

## Cascade and naming

- Everything sits in `@layer ui` (sub-layers `ui.reset`, `ui.tokens`,
  `ui.base`, `ui.components`, `ui.utilities`). An app's own CSS, being
  unlayered, always wins without `!important`.
- Classes: `ui-<component>`, modifiers `ui-<component>--<variant>`, parts
  `ui-<component>__<part>`. Example:
  `<button class="ui-btn ui-btn--primary ui-btn--lg">`.
- State uses native attributes, never state classes: `disabled`,
  `aria-invalid="true"`, `aria-expanded`, `aria-current`, `aria-selected`,
  `[open]`, `:checked`.
- Utilities are layout only: `ui-stack`, `ui-cluster`, `ui-grid`,
  `ui-gap-{1..12}`, `ui-container`, `ui-sr-only`.

## Tokens

All tokens are custom properties prefixed `--ui-`.

**Primitives** (`tokens/primitives.css`): the colour scales from the
reference (`green` as primary, `yellow` as accent, plus `neutral`, `red`,
`amber`, `blue`, each 50–950); spacing on a 4px scale (`--ui-space-1` = 4px …
`--ui-space-16` = 64px); radii; font families, sizes, weights and line
heights; shadows; durations and easings.

**Semantic** (`tokens/semantic.css`): what components read. Surfaces
(`--ui-bg`, `--ui-surface`, `--ui-surface-raised`, `--ui-surface-sunken`),
text (`--ui-fg`, `--ui-fg-muted`, `--ui-fg-subtle`, `--ui-fg-on-primary`),
borders (`--ui-border`, `--ui-border-strong`), intents (`--ui-primary`,
`--ui-primary-hover`, `--ui-primary-active`, `--ui-primary-subtle`, and the
same for `success`, `warning`, `danger`, `info`), focus ring, control height
and radius.

Rule: a component reads semantic tokens only. Stylelint enforces no raw
colour values inside `components/` and `modules/`.

**Theming**: override semantic tokens after the kit, e.g.
`:root { --ui-primary: #2563eb; }`. The default theme is the reference's
green.

**Dark mode**: semantic tokens are defined with `light-dark()`;
`color-scheme` is `light dark` by default, so the device decides.
`<html data-theme="dark">` or `data-theme="light"` forces one.

## JavaScript

- One entry, no dependencies. A component opts in with
  `data-ui="<behaviour>"`.
- On `DOMContentLoaded` it initialises every `[data-ui]`; a
  `MutationObserver` initialises nodes added later (htmx, Turbo, Livewire)
  and destroys removed ones.
- Init is idempotent: instances are kept in a `WeakMap` per element.
- Public API on `window.UI` (IIFE) and as named exports (ESM):
  `UI.init(root?)`, `UI.destroy(root?)`, `UI.get(el)`, `UI.toast(options)`,
  `UI.confirm(options) → Promise<boolean>`, `UI.register(name, factory)`.
- Each behaviour emits DOM `CustomEvent`s named `ui:<component>:<event>`
  (e.g. `ui:datepicker:change`) so any stack can listen.
- Data-heavy components (charts, data table) read JSON from a child
  `<script type="application/json">`, which any server language can emit.
- Components that native HTML already handles ship no JS: modal and
  confirm-dialog (`<dialog>` with `commandfor`/`command`, plus a JS fallback
  for browsers without invoker commands), drawer (`<dialog>`), dropdown,
  popover, tooltip and context-menu (`popover`), accordion (`<details>`),
  tabs (radio inputs; JS adds arrow-key navigation).

## Components

78 components, matching the reference one to one. **JS** marks those that
need `ui.js` (or the module's JS) to work; the rest are CSS only.

**Core — 51** (`ui.css`, `ui.js`)

accordion, alert, attachment-preview, autocomplete (JS), avatar, badge,
button, card, carousel (CSS scroll-snap; JS adds buttons and dots), checkbox,
chip, confirm-dialog, context-menu, date-picker (JS), date-range-picker (JS),
divider, drawer, dropdown, empty-state, error-page, file-upload (JS),
form-group, icon, image-upload (JS), input, loading-page, media-lightbox (JS),
modal, multi-select (JS), otp-input (JS), pagination, popover, progress-bar,
quantity-input (JS), radio, rich-text-editor (JS), search-bar, select (native),
signature-pad (JS), skeleton, slider, spinner, step-indicator, stepper,
switch, tabs, tag, textarea, timeline, toast (JS), tooltip.

**Dashboard / ERP — 13** (`modules/dashboard`)

sidebar, topnav, page-header, stat-card, description-list, filter-panel,
data-table (CSS; JS adds sort, row selection, column visibility),
chart-bar (JS), chart-line (JS), chart-donut (JS), chart-funnel (JS),
chart-stacked-bar (JS), chart-dashboard (layout for a set of charts).
Charts render SVG themselves; no chart library.

**E-commerce — 11** (`modules/ecommerce`)

product-card, product-variant-selector (JS), price-tag, cart-item,
order-card, order-status-badge, shipping-option-card, payment-method-card,
address-card, review-card, rating-stars (CSS display; JS for input).

**Indonesia — 3** (`modules/id`)

nik-input (JS: 16-digit mask and check), phone-input (JS: +62 formatting),
currency-input (JS: Rupiah via `Intl.NumberFormat('id-ID')`).

rich-text-editor is deliberately small: a `contenteditable` area with a
toolbar for bold, italic, headings, lists and links, writing HTML into a
hidden `<input>` for form submission. It does not sanitise; the docs state
that the server must sanitise submitted HTML.

Icons are not bundled. `ui-icon--sm|md|lg|xl` sizes any SVG or icon font.
Where a component needs a glyph (select chevron, checkbox tick, close), it is
an inline CSS mask so no icon set is required.

## Framework adapters

`@ui-shared-libs/vue` and `@ui-shared-libs/react` expose one component per kit
component (`<UiButton variant="primary" size="lg">`). They:

- render exactly the documented markup and classes, so the CSS is the single
  source of styling;
- call `UI.init(el)` on mount and `UI.destroy(el)` on unmount for JS
  components, and map `ui:*` events to framework events / callbacks;
- ship TypeScript types; peer-depend on `@ui-shared-libs/ui`.

## Browsers

Chrome and Edge 123+, Firefox 125+, Safari 17.5+ (`popover`, `:has()`,
`light-dark()`, native CSS nesting). Invoker commands (`commandfor`) are used
where present, with the JS fallback above where not.

## Documentation

`docs/` is a static site, one HTML page per component: live examples of each
variant and state, the markup to copy, its tokens, and for JS components the
`data-` options, events and API. Light and dark toggle on every page.
Published to GitHub Pages. The same pages are the Playwright fixtures.

## Testing

- **Stylelint**: class names must start with `ui-`; no raw colours or
  `!important` in components and modules.
- **Playwright** (Chromium, Firefox, WebKit):
  - every JS behaviour: init, re-init idempotence, init of injected markup,
    destroy, events, keyboard support;
  - dark mode via `data-theme` and via emulated `prefers-color-scheme`;
  - a screenshot per docs page in light and dark, compared to a committed
    baseline.
- **axe** on every docs page: no serious or critical violations.
- **Size budget**: build fails if `ui.min.css` exceeds 40 KB gzipped or
  `ui.min.js` exceeds 25 KB gzipped (core only; modules have their own
  budgets set in milestone 3 and 4).
- **Adapters**: Vitest + Testing Library render each component and assert
  its markup equals the docs markup.

## Milestones

Each milestone ends with a tagged, publishable release.

| # | Scope | Release |
|---|---|---|
| 1 | Workspace, build, tokens, dark mode, base, utilities, docs shell, test harness; components: button, input, textarea, select, checkbox, radio, switch, form-group, card, badge, alert, modal, toast | 0.1.0 |
| 2 | Remaining 38 core components | 0.2.0 |
| 3 | Dashboard / ERP module | 0.3.0 |
| 4 | E-commerce and Indonesia modules | 0.4.0 |
| 5 | Vue and React adapters for every component | 1.0.0 |

## Out of scope

- Server-side helpers for specific languages (Blade/Jinja partials).
  Markup is documented; any template language can emit it.
- Icon set, fonts, and a visual theme builder.
- Browsers older than the list above.
