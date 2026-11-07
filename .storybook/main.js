// Storybook is a dev-only playground for @ui-shared-libs/ui. It reads the
// package source directly, so CSS and JS edits hot-reload. Nothing here is
// published to npm.
/** @type {import('@storybook/html-vite').StorybookConfig} */
export default {
  framework: '@storybook/html-vite',
  stories: ['../stories/**/*.mdx', '../stories/**/*.stories.js'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  core: { disableTelemetry: true },
};
