import { emit } from '../runtime.js';

// <div data-ui-dismissible="alert"> … <button data-ui-dismiss> … </div>
export function installDismiss(doc) {
  doc.addEventListener('click', (event) => {
    const origin = event.target?.nodeType === 1 ? event.target : event.target?.parentElement;
    const button = origin?.closest('[data-ui-dismiss]');
    const target = button?.closest('[data-ui-dismissible]');
    if (!target) return;
    const component = target.getAttribute('data-ui-dismissible') || 'element';
    if (emit(target, component, 'dismiss', undefined, { cancelable: true })) target.remove();
  });
}
