# ui-shared-libs

Source of `@ui-shared-libs/ui`, a framework-free UI kit. Package docs:
[packages/ui/README.md](packages/ui/README.md).

    npm install
    npm run build      # packages/ui/dist
    npm run serve      # docs at http://127.0.0.1:4317/docs/
    npm run storybook  # playground at http://localhost:6006, hot-reloads src/
    npm test           # build, lint, node tests, size, Playwright (3 engines), stories
    npm run test:visual  # screenshot baselines (Windows)

Storybook (`.storybook/`, `stories/`) is a dev-only playground with controls, a
theme toolbar and an a11y panel. It reads `packages/ui/src` directly and is not
published to npm. The static docs in `docs/` stay the reference and the test
fixtures.

Design: [docs/specs](docs/specs). Plans: [docs/plans](docs/plans).
