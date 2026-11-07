import { emit } from '../runtime.js';

// <div data-ui-dismissible="alert"> … <button data-ui-dismiss> … </div>
export function installDismiss(doc) {
  doc.addEventListener('click', (event) => {
    const button = event.target.closest?.('[data-ui-dismiss]');
    const target = button?.closest('[data-ui-dismissible]');
    if (!target) return;
    const component = target.getAttribute('data-ui-dismissible') || 'element';
    if (emit(target, component, 'dismiss')) target.remove();
  });
}
