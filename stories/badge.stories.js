export default {
  title: 'Core/Badge',
  parameters: { docs: { description: { component: 'Short status labels.' } } },
  render: ({ variant, size, dot, label }) => {
    const cls = ['ui-badge', variant !== 'neutral' && `ui-badge--${variant}`, size === 'lg' && 'ui-badge--lg'].filter(Boolean).join(' ');
    return `<span class="${cls}">${dot ? '<span class="ui-badge__dot"></span>' : ''}${label}</span>`;
  },
  argTypes: {
    variant: { control: 'inline-radio', options: ['neutral', 'primary', 'success', 'warning', 'danger', 'info'], description: 'Neutral is the default and has no modifier class.' },
    size: { control: 'inline-radio', options: ['md', 'lg'] },
    dot: { control: 'boolean' },
    label: { control: 'text' },
  },
  args: { variant: 'success', size: 'md', dot: true, label: 'Active' },
};

export const Playground = {};

export const Variants = {
  render: () => `<div class="sb-row">
  <span class="ui-badge">Draft</span>
  <span class="ui-badge ui-badge--primary">New</span>
  <span class="ui-badge ui-badge--success"><span class="ui-badge__dot"></span>Active</span>
  <span class="ui-badge ui-badge--warning">Pending</span>
  <span class="ui-badge ui-badge--danger">Overdue</span>
  <span class="ui-badge ui-badge--info ui-badge--lg">Info</span>
</div>`,
};
