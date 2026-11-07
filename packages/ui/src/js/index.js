import { destroy, emit, get, init, register, start } from './runtime.js';
import { installDismiss } from './core/dismiss.js';
import { installDialogFallback, supports } from './core/dialog.js';

export { destroy, emit, get, init, register, supports };
export const version = '0.1.0';

if (typeof document !== 'undefined') {
  start(document);
  installDismiss(document);
  installDialogFallback(document);
}
