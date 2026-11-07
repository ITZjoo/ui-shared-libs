// Native <dialog> does the work. Only where a browser lacks invoker commands
// (commandfor/command) or closedby="any" does this fill the gap.
export const supports = {
  commands: typeof HTMLButtonElement !== 'undefined' && 'command' in HTMLButtonElement.prototype,
  closedBy: typeof HTMLDialogElement !== 'undefined' && 'closedBy' in HTMLDialogElement.prototype,
};

export function installDialogFallback(doc) {
  if (!supports.commands) {
    doc.addEventListener('click', (event) => {
      const button = event.target.closest?.('button[commandfor]');
      if (!button) return;
      const dialog = doc.getElementById(button.getAttribute('commandfor'));
      if (!(dialog instanceof HTMLDialogElement)) return;
      const command = button.getAttribute('command');
      if (command === 'show-modal' && !dialog.open) dialog.showModal();
      else if (command === 'close' && dialog.open) dialog.close(button.value || undefined);
      else if (command === 'request-close' && dialog.open) (dialog.requestClose ? dialog.requestClose() : dialog.close());
    });
  }
  if (!supports.closedBy) {
    doc.addEventListener('click', (event) => {
      const dialog = event.target;
      if (!(dialog instanceof HTMLDialogElement) || !dialog.open || dialog.getAttribute('closedby') !== 'any') return;
      const r = dialog.getBoundingClientRect();
      const inside = event.clientX >= r.left && event.clientX <= r.right && event.clientY >= r.top && event.clientY <= r.bottom;
      if (!inside) dialog.close();
    });
  }
}
