---
name: ui-shared-libs
description: Build UI with @ui-shared-libs/ui, a framework-free CSS kit with optional JS. Use when a project depends on @ui-shared-libs/ui or loads ui.css / ui.iife.min.js, or when asked to build a page, form, dashboard screen, dialog or notification in Laravel, Django, Rails, Go templates, plain HTML, htmx, Vue or React with this kit.
---

# Building UI with @ui-shared-libs/ui

The kit is plain HTML plus `ui-` classes. Any template language can emit it.
The look comes from one CSS file; a small optional script adds toasts,
dismissal and fallbacks. Write the documented markup exactly; do not invent
classes.

## Setup

CDN (any stack):

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@ui-shared-libs/ui@0.1/dist/ui.min.css">
<script src="https://cdn.jsdelivr.net/npm/@ui-shared-libs/ui@0.1/dist/ui.iife.min.js" defer></script>
```

npm / bundler:

```js
import '@ui-shared-libs/ui/ui.css';
import { toast } from '@ui-shared-libs/ui'; // auto-starts; also exposes init, destroy, get, register
```

Only one component? `@ui-shared-libs/ui/tokens.css` + `base.css` +
`components/<name>.css`.

## Rules that keep the output on-brand

1. **Classes come from the catalogue only.** Block `ui-<name>`, modifier
   `ui-<name>--<variant>`, part `ui-<name>__<part>`. The full list with
   markup is in [references/components.md](references/components.md). If a
   class is not there, it does not exist.
2. **State is native attributes, never classes.** `disabled`,
   `aria-invalid="true"`, `aria-busy="true"`, `aria-current`, `[open]`,
   `:checked`, `role="switch"`. There is no `.is-active` / `.ui-btn--disabled`.
3. **Outline is the default button.** `ui-btn` alone is the outline button;
   `ui-btn--outline` is only an alias, so leave it out.
4. **Customise with tokens, not overrides.** Every colour, radius and height
   is a `--ui-*` custom property. Set them after the kit:
   `:root { --ui-primary: #2563eb; --ui-button-radius: var(--ui-radius-full); }`.
   The kit lives in `@layer ui`, so any unlayered CSS in the app already
   wins without `!important`.
5. **Layout utilities only.** `ui-stack`, `ui-cluster`, `ui-grid`,
   `ui-gap-{1,2,3,4,5,6,8,10,12}`, `ui-container`, `ui-sr-only`. For anything
   else write normal CSS in the app. Do not add Tailwind-style helpers.
6. **Dark mode is free.** The device decides. Force with
   `<html data-theme="dark">` or `data-theme="light"`. Never hard-code
   colours; use `var(--ui-fg)`, `var(--ui-surface)`, `var(--ui-border)` etc.
   in app CSS so it follows the theme.

## Accessibility you must not drop

- Every input has a `<label class="ui-label" for>`; hints and errors are
  linked with `aria-describedby`. An invalid control gets
  `aria-invalid="true"` **and** a `.ui-error` message (the hint hides itself).
- Icon-only buttons (`ui-btn--icon`, `ui-close`) need `aria-label`.
- Alerts: `role="status"` for information, `role="alert"` only for errors.
- Modals: `<dialog class="ui-modal" aria-labelledby>`; put `autofocus` on the
  safe action (Cancel), never on the destructive one.
- Group radios in `<fieldset class="ui-choice-group">` with a `<legend>`.

## JavaScript behaviour (optional script)

| Need | Markup / call |
|---|---|
| Toast from JS | `UI.toast({ title, message, variant: 'info'\|'success'\|'warning'\|'danger', duration: 5000, dismissible })`; duration is milliseconds, `0` stays open |
| Toast from the server (flash message) | `<div class="ui-toast ui-toast--success" role="status" data-ui="toast" data-duration="5000">…</div>` anywhere in the page |
| Dismissible element | `data-ui-dismissible="alert"` on the container, `data-ui-dismiss` on the button |
| Open / close a modal, no JS of your own | `<button commandfor="id" command="show-modal">` / `command="close"`; `closedby="any"` closes on Esc and outside click |
| Markup inserted later (htmx, Turbo, Livewire) | nothing: a MutationObserver initialises it. Call `UI.init(el)` only for shadow roots |

Events bubble and are named `ui:<component>:<event>`: `ui:toast:show`,
`ui:toast:hide`, `ui:alert:dismiss` (cancelable: `preventDefault()` keeps
the element). Listen with `addEventListener` on the element or `document`.

## Anti-slop checklist

Before handing back a screen, check:

- No gradients, glows, glassmorphism, emoji icons or decorative blobs. The
  kit's restraint is the style.
- One primary button per view or form; others are default (outline),
  `--secondary` or `--ghost`. Destructive actions use `--danger` and live
  in a modal or at the end of a row, not next to Save.
- Controls on one row share a size (`--sm` with `--sm`); the kit keeps
  inputs, selects and buttons the same height per size.
- Status uses `ui-badge--<intent>` or `ui-alert--<intent>`, not coloured
  text.
- Copy is short and specific: "Delete member?" / "This cannot be undone.",
  not "Are you sure you want to proceed with this action?".
- No placeholder used as a label. No "Lorem ipsum".
- Spacing comes from `ui-stack` / `ui-cluster` / `ui-gap-*` or `--ui-space-*`
  tokens, not ad-hoc pixel values.

## Framework notes

- **Vue / React:** render the same markup (`class`, `className`). Until the
  adapters ship, wrap repeated markup in your own small components; keep the
  classes identical.
- **Server templates:** emit the markup from partials/components (Blade
  component, Django include, Rails partial, Go `template`). Escape user text
  as usual; the kit never needs raw HTML.
- **htmx:** swapped-in toasts and `data-ui` elements initialise
  automatically.
