export default {
  title: 'Core/Alert',
  parameters: { docs: { description: { component: 'Inline messages. Add `data-ui-dismissible="alert"` and a `data-ui-dismiss` button to let people close one (needs ui.js).' } } },
  render: ({ variant, title, text, dismissible }) => {
    const cls = ['ui-alert', variant !== 'neutral' && `ui-alert--${variant}`].filter(Boolean).join(' ');
    const role = variant === 'danger' ? 'alert' : 'status';
    const titleHtml = title ? `\n    <p class="ui-alert__title">${title}</p>` : '';
    const close = dismissible ? '\n  <button type="button" class="ui-close" data-ui-dismiss aria-label="Dismiss"></button>' : '';
    return `<div class="${cls}" role="${role}"${dismissible ? ' data-ui-dismissible="alert"' : ''}>
  <div class="ui-alert__body">${titleHtml}
    <p class="ui-alert__text">${text}</p>
  </div>${close}
</div>`;
  },
  argTypes: {
    variant: { control: 'inline-radio', options: ['neutral', 'success', 'warning', 'danger'] },
    title: { control: 'text' },
    text: { control: 'text' },
    dismissible: { control: 'boolean' },
  },
  args: { variant: 'danger', title: 'Payment failed', text: 'The bank declined the transfer.', dismissible: true },
};

export const Playground = {};

export const Variants = {
  render: () => `<div class="sb-col">
  <div class="ui-alert" role="status">
    <div class="ui-alert__body">
      <p class="ui-alert__title">Maintenance tonight</p>
      <p class="ui-alert__text">The app is read-only from 22:00 to 23:00.</p>
    </div>
  </div>
  <div class="ui-alert ui-alert--success" role="status"><div class="ui-alert__body"><p class="ui-alert__text">Your payment was received.</p></div></div>
  <div class="ui-alert ui-alert--warning" role="status"><div class="ui-alert__body"><p class="ui-alert__text">Your membership ends in 7 days.</p></div></div>
</div>`,
};
