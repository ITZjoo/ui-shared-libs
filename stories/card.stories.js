export default {
  title: 'Core/Card',
  parameters: { docs: { description: { component: 'A surface with a border and a soft shadow.' } } },
  render: ({ size, flat, title, desc }) => {
    const cls = ['ui-card', size === 'sm' && 'ui-card--sm', flat && 'ui-card--flat'].filter(Boolean).join(' ');
    return `<article class="${cls}">
  <header class="ui-card__header">
    <div>
      <h3 class="ui-card__title">${title}</h3>
      <p class="ui-card__desc">${desc}</p>
    </div>
    <span class="ui-badge ui-badge--success">Paid</span>
  </header>
  <p>Rp 150.000 received on 2 November.</p>
  <footer class="ui-card__footer">
    <button type="button" class="ui-btn">Details</button>
    <button type="button" class="ui-btn ui-btn--primary">Download receipt</button>
  </footer>
</article>`;
  },
  argTypes: {
    size: { control: 'inline-radio', options: ['md', 'sm'] },
    flat: { control: 'boolean', description: 'No shadow.' },
    title: { control: 'text' },
    desc: { control: 'text' },
  },
  args: { size: 'md', flat: false, title: 'Monthly savings', desc: 'Due on the 10th.' },
};

export const Playground = {};

export const Nested = {
  render: () => `<div class="ui-card ui-card--sm">
  <p>A small card</p>
  <div class="ui-card ui-card--flat">A default card inside it keeps its own padding.</div>
</div>`,
};
