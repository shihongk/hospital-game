@AGENTS.md

## Git

- Remote: `git@github.com:shihongk/hospital-game.git` (SSH)
- Main branch: `main`
- The `gh-pages` branch is auto-managed by the `npm run deploy` script — never edit it manually

## Deploying to GitHub Pages

```bash
npm run deploy
```

This runs `npx expo export --platform web && gh-pages -d dist --nojekyll` which:
1. Builds the web bundle into `dist/`
2. Pushes `dist/` contents to the `gh-pages` branch

Live URL: https://shihongk.github.io/hospital-game

GitHub Pages is configured to serve from the `gh-pages` branch, root folder.

### Key config required for GitHub Pages

- `app.json` must have `"experiments": { "baseUrl": "/hospital-game" }` — without this, all asset URLs are wrong (load from `/` instead of `/hospital-game/`)
- `--nojekyll` flag in the deploy script is required — GitHub Pages runs Jekyll by default and silently drops all folders starting with `_` (including `_expo/`)

## React Native Web gotchas

- Use `onClick` on Views for tap detection — not `onTouchEnd`. Adding `onTouchEnd` to Views interferes with react-native-web's internal touch responder system and breaks all interaction including drag.
- When mixing drag (`onTouchStart/Move/End`) and tap (`onClick`) on the same View, call `e.preventDefault()` in `onTouchEnd` after a drag ends — this suppresses the synthetic `click` event the browser fires after a touch sequence, preventing a double-fire.
- `pointerEvents="none"` on a child View behaves differently on web vs native: on web it causes touch events to fall through to elements behind in z-order (not to the parent), which is rarely what you want inside a touch target.
