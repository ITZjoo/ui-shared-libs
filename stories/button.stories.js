const VARIANTS = ['primary', 'secondary', 'outline', 'ghost', 'danger'];

const classes = ({ variant, size }) =>
  ['ui-btn', variant !== 'outline' && `ui-btn--${variant}`, size !== 'md' && `ui-btn--${size}`]
    .filter(Boolean).join(' ');

export default {
  title: 'Core/Button',
  parameters: { docs: { description: { component: 'Works on `<button>` and `<a>`. No class for outline: it is the default.' } } },
  render: (args) =>
    `<button type="button" class="${classes(args)}"${args.disabled ? ' disabled' : ''}${args.busy ? ' aria-busy="true"' : ''}>${args.label}</button>`,
  argTypes: {
    variant: { control: 'inline-radio', options: VARIANTS, description: 'Outline is the default and has no modifier class.' },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    label: { control: 'text' },
    disabled: { control: 'boolean' },
    busy: { control: 'boolean', description: '`aria-busy="true"` shows a spinner and blocks clicks.' },
  },
  args: { variant: 'primary', size: 'md', label: 'Save', disabled: false, busy: false },
};

export const Playground = {};

export const Variants = {
  render: () => `<div class="sb-row">
  <button type="button" class="ui-btn ui-btn--primary">Save</button>
  <button type="button" class="ui-btn ui-btn--secondary">Draft</button>
  <button type="button" class="ui-btn">Cancel</button>
  <button type="button" class="ui-btn ui-btn--ghost">Skip</button>
  <button type="button" class="ui-btn ui-btn--danger">Delete</button>
</div>`,
};

export const Sizes = {
  render: () => `<div class="sb-row">
  <button type="button" class="ui-btn ui-btn--primary ui-btn--sm">Small</button>
  <button type="button" class="ui-btn ui-btn--primary">Medium</button>
  <button type="button" class="ui-btn ui-btn--primary ui-btn--lg">Large</button>
</div>`,
};

export const States = {
  render: () => `<div class="sb-row">
  <button type="button" class="ui-btn ui-btn--primary" aria-busy="true">Saving</button>
  <button type="button" class="ui-btn ui-btn--primary" disabled>Disabled</button>
  <a class="ui-btn" href="#">Link as button</a>
  <button type="button" class="ui-btn ui-btn--icon" aria-label="Close"><span class="ui-close" aria-hidden="true"></span></button>
</div>`,
};
