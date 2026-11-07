import { toast } from '../packages/ui/src/js/index.js';

export default {
  title: 'Core/Toast',
  parameters: { docs: { description: { component: 'Brief messages in a corner. Call `UI.toast({ … })`, or render one from the server with `data-ui="toast"`. Needs ui.js.' } } },
};

export const Api = {
  name: 'From JavaScript',
  argTypes: {
    variant: { control: 'inline-radio', options: ['info', 'success', 'warning', 'danger'] },
    title: { control: 'text' },
    message: { control: 'text' },
    duration: { control: 'text', description: 'Milliseconds, or a CSS time like `4s`. `0` keeps it open.' },
  },
  args: { variant: 'success', title: 'Saved', message: 'Member updated.', duration: '4s' },
  render: (args) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'ui-btn ui-btn--primary';
    button.textContent = 'Show toast';
    button.addEventListener('click', () => toast({ ...args, title: args.title || undefined }));
    return button;
  },
  parameters: {
    docs: {
      source: {
        code: "UI.toast({ title: 'Saved', message: 'Member updated.', variant: 'success', duration: '4s' });",
        language: 'js',
      },
    },
  },
};

export const Server = {
  name: 'From the server',
  render: () => `<div class="ui-toast ui-toast--warning" role="status" data-ui="toast" data-duration="0">
  <div class="ui-toast__body">
    <p class="ui-toast__title">Session ends soon</p>
    <p class="ui-toast__text">Save your work.</p>
  </div>
  <button type="button" class="ui-close" data-ui-dismiss aria-label="Close"></button>
</div>`,
};
