# Component catalogue (0.1)

Every class the kit ships, with the markup to copy. Optional parts are
marked. Live examples: https://itzjoo.github.io/ui-shared-libs/docs/

## Layout

| Class | Does |
|---|---|
| `ui-stack` | vertical flow, gap 16px |
| `ui-cluster` | wrapping row, centred, gap 12px |
| `ui-grid` | responsive columns; set `style="--ui-grid-min: 12rem"` (default 16rem) |
| `ui-gap-{1,2,3,4,5,6,8,10,12}` | gap on the element above (the number times 4px); does not leak into nested layouts |
| `ui-container` | centred page width |
| `ui-sr-only` | visible to screen readers only |

## Button

Modifiers: `--primary`, `--secondary`, `--ghost`, `--danger`, `--outline`
(= default), sizes `--sm`, `--lg`, `--block`, `--icon`.
State: `disabled`, `aria-disabled="true"`, `aria-busy="true"` (spinner).
Works on `<a>` too.

```html
<button type="button" class="ui-btn ui-btn--primary">Save</button>
<button type="button" class="ui-btn">Cancel</button>
<button type="button" class="ui-btn ui-btn--primary" aria-busy="true">Saving</button>
<button type="button" class="ui-btn ui-btn--icon" aria-label="Close"><span class="ui-close" aria-hidden="true"></span></button>
```

## Form field

Controls: `ui-input`, `ui-textarea`, `ui-select` (native `<select>`), sizes
`--sm` / `--lg` on input and select.

```html
<div class="ui-field">
  <label class="ui-label" for="email">Email<span class="ui-label__required" aria-hidden="true">*</span></label>
  <input class="ui-input" id="email" type="email" required aria-describedby="email-hint">
  <p class="ui-hint" id="email-hint">We never share it.</p>
</div>

<!-- invalid -->
<div class="ui-field">
  <div class="ui-field__header">
    <label class="ui-label" for="phone">Phone</label>
    <span class="ui-label__optional">Optional</span>
  </div>
  <input class="ui-input" id="phone" aria-invalid="true" aria-describedby="phone-error">
  <p class="ui-error" id="phone-error">Enter a number starting with +62.</p>
</div>
```

## Checkbox, radio, switch

```html
<label class="ui-choice">
  <input type="checkbox" class="ui-checkbox">
  <span class="ui-choice__text">
    <span class="ui-choice__label">Email me receipts</span>
    <span class="ui-choice__desc">Optional description.</span>   <!-- optional -->
  </span>
</label>

<fieldset class="ui-choice-group ui-choice-group--horizontal">
  <legend class="ui-label">Payment</legend>
  <label class="ui-choice"><input type="radio" class="ui-radio" name="pay" value="cash" checked><span class="ui-choice__label">Cash</span></label>
  <label class="ui-choice"><input type="radio" class="ui-radio" name="pay" value="transfer"><span class="ui-choice__label">Transfer</span></label>
</fieldset>

<!-- selectable card: add ui-choice--card -->
<label class="ui-choice ui-choice--card">…</label>

<label class="ui-choice">
  <input type="checkbox" role="switch" class="ui-switch">   <!-- ui-switch--sm / --lg -->
  <span class="ui-choice__label">Notifications</span>
</label>
```

`aria-invalid="true"` on a checkbox shows the error colour. Indeterminate:
set `input.indeterminate = true` in JS.

## Card

Modifiers: `--sm`, `--lg`, `--flush` (no padding), `--flat` (no shadow),
`--raised`, `--borderless`, `--interactive` (on an `<a>`).

```html
<article class="ui-card">
  <header class="ui-card__header">
    <div>
      <h3 class="ui-card__title">Monthly savings</h3>
      <p class="ui-card__desc">Due on the 10th.</p>
    </div>
    <span class="ui-badge ui-badge--success">Paid</span>
  </header>
  <p>Body content.</p>
  <footer class="ui-card__footer">
    <button type="button" class="ui-btn">Details</button>
    <button type="button" class="ui-btn ui-btn--primary">Download</button>
  </footer>
</article>
```

## Badge

Modifiers: `--primary`, `--success`, `--warning`, `--danger`, `--info`
(none = neutral), sizes `--sm`, `--lg`. Optional `ui-badge__dot`.

```html
<span class="ui-badge ui-badge--success"><span class="ui-badge__dot"></span>Active</span>
```

## Alert

Modifiers: `--success`, `--warning`, `--danger` (none = info). A status icon
is drawn automatically; put your own `<svg class="ui-alert__icon">` first to
replace it.

```html
<div class="ui-alert ui-alert--danger" role="alert" data-ui-dismissible="alert">
  <div class="ui-alert__body">
    <p class="ui-alert__title">Payment failed</p>     <!-- optional -->
    <p class="ui-alert__text">The bank declined the transfer.</p>
  </div>
  <button type="button" class="ui-close" data-ui-dismiss aria-label="Dismiss"></button>   <!-- optional, needs ui.js -->
</div>
```

## Modal

Sizes: `--sm`, `--lg`, `--xl`, `--full` (default 32rem).

```html
<button type="button" class="ui-btn ui-btn--danger" commandfor="delete-member" command="show-modal">Delete</button>

<dialog class="ui-modal" id="delete-member" closedby="any" aria-labelledby="delete-member-title">
  <header class="ui-modal__header">
    <div>
      <h2 class="ui-modal__title" id="delete-member-title">Delete member?</h2>
      <p class="ui-modal__desc">This cannot be undone.</p>
    </div>
    <button type="button" class="ui-close" commandfor="delete-member" command="close" aria-label="Close"></button>
  </header>
  <div class="ui-modal__body">…</div>
  <footer class="ui-modal__footer">
    <button type="button" class="ui-btn" commandfor="delete-member" command="close" autofocus>Cancel</button>
    <button type="submit" class="ui-btn ui-btn--danger" form="delete-form">Delete</button>
  </footer>
</dialog>
```

From JS: `dialog.showModal()` / `dialog.close()`.

## Toast

Modifiers: `--success`, `--warning`, `--danger` (none = info). Region
position (author the region yourself to choose): `ui-toast-region--top-right`,
`--top-center`, `--bottom-center` (default bottom-right).

```js
UI.toast({ title: 'Saved', message: 'Member updated.', variant: 'success' });
```

```html
<!-- server-rendered flash -->
<div class="ui-toast ui-toast--warning" role="status" data-ui="toast" data-duration="0">
  <div class="ui-toast__body">
    <p class="ui-toast__title">Session ends soon</p>
    <p class="ui-toast__text">Save your work.</p>
  </div>
  <button type="button" class="ui-close" data-ui-dismiss aria-label="Close"></button>
</div>
```

## Close button

`<button type="button" class="ui-close" aria-label="Close"></button>` — size
with `style="--ui-close-size: 1.5rem"`.

## Tokens most often set by apps

`--ui-primary` (+ `-hover`, `-active`, `-on`, `-subtle`, `-subtle-fg`,
`-border`), `--ui-font-sans`, `--ui-control-radius`, `--ui-button-radius`,
`--ui-control-h` / `-sm` / `-lg`, `--ui-radius-*`, `--ui-space-*`. Surfaces
and text: `--ui-bg`, `--ui-surface`, `--ui-surface-raised`,
`--ui-surface-sunken`, `--ui-fg`, `--ui-fg-muted`, `--ui-border`,
`--ui-border-strong`.

## Coming later (not in 0.1 — do not use yet)

Tabs, dropdown, popover, tooltip, drawer, accordion, date pickers, data
table, charts, e-commerce and Indonesia modules, `UI.confirm()`, and the
Vue / React adapters.
