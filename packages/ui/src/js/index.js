import { destroy, emit, get, init, register, start } from './runtime.js';
import { installDismiss } from './core/dismiss.js';

export { destroy, emit, get, init, register };
export const version = '0.1.0';

if (typeof document !== 'undefined') {
  start(document);
  installDismiss(document);
}
