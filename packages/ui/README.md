# @ui-shared-libs/ui

A UI kit for HTML from any stack: Laravel, Django, Rails, Go, plain HTML,
htmx, Vue or React. The look is one CSS file. A small optional script adds
what CSS cannot (toasts, and fallbacks for older browsers).

Docs with live examples: https://itzjoo.github.io/ui-shared-libs/docs/

## Install

From a CDN:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@ui-shared-libs/ui@0.1/dist/ui.min.css">
<script src="https://cdn.jsdelivr.net/npm/@ui-shared-libs/ui@0.1/dist/ui.iife.min.js" defer></script>
```

From npm:

```
npm install @ui-shared-libs/ui
```

```js
import '@ui-shared-libs/ui/ui.css';
import { toast } from '@ui-shared-libs/ui';
```

## A first page

```html
<form class="ui-card ui-stack">
  <div class="ui-field">
    <label class="ui-label" for="name">Full name</label>
    <input class="ui-input" id="name" required>
  </div>
  <button class="ui-btn ui-btn--primary">Save</button>
</form>
```

## Theme

Every colour comes from a token. Override tokens after the kit:

```css
:root { --ui-primary: #2563eb; --ui-primary-hover: #1d4ed8; --ui-primary-active: #1e40af; }
```

Dark mode follows the device. Force one with `<html data-theme="dark">` or
`data-theme="light"`.

The kit sits in `@layer ui`, so your own CSS wins without `!important`.

## Only what you use

`dist/tokens.css` and `dist/base.css`, then any of `dist/components/*.css`.

## JavaScript

`ui.iife.min.js` defines `window.UI`; the npm entry exports the same names.

| | |
|---|---|
| `UI.toast({ title, message, variant, duration, dismissible })` | show a toast; returns `{ hide, destroy }` |
| `UI.init(root)` / `UI.destroy(root)` | run behaviours on markup (automatic for markup added later) |
| `UI.register(name, factory)` | add a behaviour for `data-ui="name"` |
| `UI.get(el, name?)` | the instance of a behaviour on an element (the first one if `name` is omitted) |
| `UI.emit(el, component, event, detail?)` | dispatch a `ui:<component>:<event>` event on an element |
| `UI.supports` | `{ commands, closedBy }`: whether the browser has invoker commands and `closedby` natively |

Toast options:

- `title`, `message`: text content.
- `variant`: `info` (default), `success`, `warning` or `danger`.
- `duration`: milliseconds, default 5000. `0` or a negative value keeps the toast until it is closed. An invalid value falls back to 5000.
- `dismissible`: show a close button, default `true`.

A modal opens with `<button commandfor="id" command="show-modal">`. In browsers
without invoker commands, ui.js supplies the fallback.

## Events

Events are `ui:<component>:<event>`, e.g. `ui:toast:hide`.

A behaviour that throws during init does not stop the others. The error is
rethrown asynchronously, and a `ui:runtime:error` event with
`detail: { name, error }` is dispatched on the element.

## Browsers

Chrome and Edge 123, Firefox 125, Safari 17.5, and newer.

## Licence

MIT
