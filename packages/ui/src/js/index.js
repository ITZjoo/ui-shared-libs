import { destroy, emit, get, init, register, start } from './runtime.js';
import { installDismiss } from './core/dismiss.js';
import { installDialogFallback, supports } from './core/dialog.js';
import { toast, toastBehaviour } from './core/toast.js';

register('toast', toastBehaviour);

export { destroy, emit, get, init, register, supports, toast };
export const version = '0.1.0';

if (typeof document !== 'undefined') {
  start(document);
  installDismiss(document);
  installDialogFallback(document);
}
