import '../packages/ui/src/ui.css';
import '../packages/ui/src/js/index.js';
import './preview.css';

// Same three modes as the docs site: "system" removes data-theme so the
// device decides through color-scheme.
const withTheme = (story, context) => {
  const root = document.documentElement;
  const mode = context.globals.theme ?? 'system';
  if (mode === 'system') delete root.dataset.theme;
  else root.dataset.theme = mode;
  return story();
};

/** @type {import('@storybook/html-vite').Preview} */
export default {
  decorators: [withTheme],
  globalTypes: {
    theme: {
      description: 'Colour scheme',
      toolbar: {
        title: 'Theme',
        icon: 'mirror',
        items: [
          { value: 'system', title: 'System' },
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: 'system' },
  parameters: {
    layout: 'padded',
    options: { storySort: { order: ['Foundation', 'Core'] } },
    backgrounds: { disable: true },
    controls: { expanded: true },
    docs: { source: { type: 'dynamic', language: 'html' } },
    a11y: { test: 'todo' },
  },
  tags: ['autodocs'],
};
