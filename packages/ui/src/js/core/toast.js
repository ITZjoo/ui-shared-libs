import { emit, get, init } from '../runtime.js';

const VARIANTS = new Set(['info', 'success', 'warning', 'danger']);
const DEFAULT_DURATION = 5000;

function region() {
  let el = document.querySelector('.ui-toast-region');
  if (!el) {
    el = document.createElement('div');
    el.className = 'ui-toast-region';
    el.setAttribute('role', 'region');
    el.setAttribute('aria-label', 'Notifications');
    el.setAttribute('aria-live', 'polite');
    document.body.append(el);
  }
  return el;
}

// Create the live region ahead of the first toast: a region inserted together with its
// content is often not announced. Without a body yet, wait for DOMContentLoaded.
export function prepareRegion(doc = document) {
  if (doc.body) region();
  else doc.addEventListener('DOMContentLoaded', () => region(), { once: true });
}

// A countdown that runs only while neither the pointer nor focus is on the toast.
function countdown(el, duration, done) {
  if (duration <= 0) return () => {};
  let remaining = duration;
  let startedAt = 0;
  let timer = 0;
  let running = false;
  let hovered = false;
  let focused = false;
  const sync = () => {
    const shouldRun = !hovered && !focused;
    if (shouldRun === running) return;
    running = shouldRun;
    if (running) {
      startedAt = Date.now();
      timer = setTimeout(done, remaining);
    } else {
      clearTimeout(timer);
      remaining -= Date.now() - startedAt;
    }
  };
  const events = [
    ['mouseenter', () => { hovered = true; sync(); }],
    ['mouseleave', () => { hovered = false; sync(); }],
    ['focusin', () => { focused = true; sync(); }],
    // relatedTarget is where focus is going; still inside the toast means still focused.
    ['focusout', (event) => { focused = !!event.relatedTarget && el.contains(event.relatedTarget); sync(); }],
  ];
  for (const [type, fn] of events) el.addEventListener(type, fn);
  sync();
  return () => {
    clearTimeout(timer);
    for (const [type, fn] of events) el.removeEventListener(type, fn);
  };
}

function close(el) {
  if (el.dataset.state === 'closing') return;
  el.dataset.state = 'closing';
  emit(el, 'toast', 'hide');
  let fallback = 0;
  const onEnd = (event) => { if (event.target === el && !event.pseudoElement) remove(); };
  const remove = () => {
    clearTimeout(fallback);
    el.removeEventListener('animationend', onEnd);
    el.remove();
  };
  el.addEventListener('animationend', onEnd);
  fallback = setTimeout(remove, 400);
}

// Non-finite values (e.g. "abc", "null") fall back to the default. An empty string is
// treated as "not set" (default, not persistent), since Number('') would otherwise be 0.
function parseDuration(raw) {
  if (raw === undefined || raw === null || String(raw).trim() === '') return DEFAULT_DURATION;
  const value = Number(raw);
  return Number.isFinite(value) ? value : DEFAULT_DURATION;
}

export function toastBehaviour(el) {
  if (!el.closest('.ui-toast-region')) region().append(el);
  const duration = parseDuration(el.dataset.duration);
  el.style.setProperty('--ui-toast-duration', `${duration}ms`);
  if (duration <= 0) el.setAttribute('data-persistent', '');
  const hide = () => close(el);
  const stop = countdown(el, duration, hide);
  const onClick = (event) => { if (event.target.closest('[data-ui-dismiss]')) hide(); };
  el.addEventListener('click', onClick);
  emit(el, 'toast', 'show');
  return {
    hide,
    destroy() { stop(); el.removeEventListener('click', onClick); },
  };
}

export function toast({ title = '', message = '', variant = 'info', duration = DEFAULT_DURATION, dismissible = true } = {}) {
  const kind = VARIANTS.has(variant) ? variant : 'info';
  const el = document.createElement('div');
  el.className = `ui-toast ui-toast--${kind}`;
  // The region is the polite live region; only danger toasts interrupt with role="alert".
  if (kind === 'danger') el.setAttribute('role', 'alert');
  el.dataset.ui = 'toast';
  el.dataset.duration = String(duration);

  const body = document.createElement('div');
  body.className = 'ui-toast__body';
  if (title) {
    const t = document.createElement('p');
    t.className = 'ui-toast__title';
    t.textContent = title;
    body.append(t);
  }
  if (message) {
    const m = document.createElement('p');
    m.className = 'ui-toast__text';
    m.textContent = message;
    body.append(m);
  }
  el.append(body);
  if (dismissible) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'ui-close';
    button.setAttribute('aria-label', 'Close');
    button.setAttribute('data-ui-dismiss', '');
    el.append(button);
  }
  region().append(el);
  init(el);
  return get(el, 'toast');
}
