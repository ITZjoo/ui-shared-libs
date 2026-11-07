const GAPS = ['', '1', '2', '3', '4', '5', '6', '8', '10', '12'];

export default {
  title: 'Foundation/Layout',
  parameters: { docs: { description: { component: 'Stack, cluster and grid, with a gap scale. The only utilities in the kit.' } } },
  render: ({ layout, gap, items }) => {
    const cls = [`ui-${layout}`, gap && `ui-gap-${gap}`].filter(Boolean).join(' ');
    const children = Array.from({ length: items }, (_, i) => `  <span class="sb-box">Item ${i + 1}</span>`).join('\n');
    const style = layout === 'grid' ? ' style="--ui-grid-min: 12rem"' : '';
    return `<div class="${cls}"${style}>\n${children}\n</div>`;
  },
  argTypes: {
    layout: { control: 'inline-radio', options: ['stack', 'cluster', 'grid'] },
    gap: { control: 'select', options: GAPS, description: 'Empty uses the layout default.' },
    items: { control: { type: 'range', min: 1, max: 12 } },
  },
  args: { layout: 'cluster', gap: '', items: 4 },
};

export const Playground = {};

export const Stack = { args: { layout: 'stack', items: 3 } };

export const Grid = { args: { layout: 'grid', items: 6 } };

export const ScreenReaderOnly = {
  render: () => `<span>Visible text</span>
<span class="ui-sr-only">Only for screen readers</span>`,
};
