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
    document.body.append(el);
  }
  return el;
}

// A countdown that pauses while the pointer or focus is on the toast.
function countdown(el, duration, done) {
  if (duration <= 0) return () => {};
  let remaining = duration;
  let startedAt = 0;
  let timer = 0;
  let paused = true;
  const resume = () => { if (!paused) return; paused = false; startedAt = Date.now(); timer = setTimeout(done, remaining); };
  const pause = () => { if (paused) return; paused = true; clearTimeout(timer); remaining -= Date.now() - startedAt; };
  const events = [['mouseenter', pause], ['mouseleave', resume], ['focusin', pause], ['focusout', resume]];
  for (const [type, fn] of events) el.addEventListener(type, fn);
  resume();
  return () => {
    clearTimeout(timer);
    for (const [type, fn] of events) el.removeEventListener(type, fn);
  };
}

function close(el) {
  if (el.dataset.state === 'closing') return;
  el.dataset.state = 'closing';
  emit(el, 'toast', 'hide');
  const remove = () => el.remove();
  el.addEventListener('animationend', (event) => { if (event.target === el && !event.pseudoElement) remove(); });
  setTimeout(remove, 400);
}

export function toastBehaviour(el) {
  if (!el.closest('.ui-toast-region')) region().append(el);
  const duration = Number(el.dataset.duration ?? DEFAULT_DURATION);
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
  el.setAttribute('role', kind === 'danger' ? 'alert' : 'status');
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
