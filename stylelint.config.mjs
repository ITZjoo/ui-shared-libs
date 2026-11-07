// Kit rules: ui- naming everywhere; outside tokens/, colours only via tokens.
const NAME = '[a-z0-9]+(?:-[a-z0-9]+)*';

export default {
  rules: {
    'selector-class-pattern': [`^ui-${NAME}(?:__${NAME})?(?:--${NAME})?$`, { message: (s) => `"${s}": use ui-<block>[__<part>][--<modifier>]` }],
    'keyframes-name-pattern': [`^ui-${NAME}$`],
    'custom-property-pattern': [`^(?:ui-|_)${NAME}$`],
    'declaration-no-important': true,
  },
  overrides: [
    {
      files: ['packages/ui/src/{base,components,modules,utilities}/**/*.css'],
      rules: {
        'color-no-hex': true,
        'color-named': 'never',
        'function-disallowed-list': ['rgb', 'rgba', 'hsl', 'hsla', 'hwb', 'lab', 'lch', 'oklab', 'oklch'],
      },
    },
  ],
};
