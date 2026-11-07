export default {
  title: 'Core/Modal',
  parameters: { docs: { description: { component: 'A native `<dialog>`. Esc, a click outside or a close button closes it. Works without ui.js in browsers with invoker commands; ui.js fills in the rest.' } } },
  render: ({ title, desc, confirm, danger }) => `<button type="button" class="ui-btn ui-btn--primary" commandfor="sb-modal" command="show-modal">Open modal</button>
<dialog class="ui-modal" id="sb-modal" closedby="any" aria-labelledby="sb-modal-title">
  <header class="ui-modal__header">
    <div>
      <h2 class="ui-modal__title" id="sb-modal-title">${title}</h2>
      <p class="ui-modal__desc">${desc}</p>
    </div>
    <button type="button" class="ui-close" commandfor="sb-modal" command="close" aria-label="Close"></button>
  </header>
  <div class="ui-modal__body">
    <p>The savings history stays in the reports.</p>
  </div>
  <footer class="ui-modal__footer">
    <button type="button" class="ui-btn" commandfor="sb-modal" command="close" autofocus>Cancel</button>
    <button type="button" class="ui-btn ${danger ? 'ui-btn--danger' : 'ui-btn--primary'}" commandfor="sb-modal" command="close" value="confirm">${confirm}</button>
  </footer>
</dialog>`,
  argTypes: {
    title: { control: 'text' },
    desc: { control: 'text' },
    confirm: { control: 'text' },
    danger: { control: 'boolean' },
  },
  args: { title: 'Delete member?', desc: 'This cannot be undone.', confirm: 'Delete', danger: true },
};

export const Playground = {};
