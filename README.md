# Streak

The Streak Dashboard, rebuilt as an installable web app. No Xcode, no 7-day re-signing.

Static files only: no build step and no dependencies. Data stays in the browser's local storage on each device, using the same keys and format as the old iOS app (`streakly-v1[:email]`).

## Use and share

Use **Settings → Share Streak** to share the current public app address. No account, approval, or installation is required. Each device keeps its own entries; there is no automatic cloud sync. New users can start logging immediately and add an optional profile later.

- **iPhone:** open in Safari, then Share → Add to Home Screen.
- **Android:** open in Chrome, then its menu → Add to Home screen or Install app.
- **Move your history:** export a backup from the current installation, then import it in the new installation. Changing the site's address does not carry browser storage across automatically.

Publish only the app assets: `index.html`, `manifest.webmanifest`, `sw.js`, `css/`, `js/`, and `icons/`. Keep `.git`, documentation, tests, backups, and migration files out of public deployment output.

## Run locally

```bash
python3 -m http.server 5173
```

Then open http://localhost:5173.

## Test

```bash
node --test tests/*.test.mjs
```

The tests cover streak calculations, period comparisons, outcomes, and legacy data compatibility. Personal migration files are excluded from Git and deployment output.

## Keeping data safe

- **Export backup** (Settings) saves a `.json` file; **Import backup** restores one.
- An automatic restore point is saved to IndexedDB each day, and the last 14 are kept.
- The app asks the browser for persistent storage. Added to the Home Screen, iOS keeps its data and doesn't apply Safari's 7-day clean-up.

## Today and Insights

Today offers **Conquered**, **Tempered**, and **Defeated**, with optional rating and mood details and one daily notes field. Tempered is the middle ground: a balanced day that keeps the flame alive. Conquered and Tempered both continue a streak; Defeated ends it. An unlogged today leaves yesterday’s streak available. Legacy partial days now display as Tempered, using their original saved values.

Insights offers 7-, 30-, and 90-day views with separate counts for all three outcomes. Conquest rates count only Conquered days out of all explicitly logged outcomes; Tempered days keep streaks alive without inflating conquest counts. Unlogged days stay separate, and weekday patterns require at least three observations. The outcome ribbon shows the full period, and dated day bars let you revisit an entry. Ratings include a shaded chart, monthly totals use columns, and the next milestone shows progress from the current streak. A comeback is a Conquered day immediately after a Defeated day. Keyboard shortcuts are 1 for Conquered, 2 for Tempered, and 3 for Defeated.

The flame uses a locally bundled **Three.js 0.186.1** shader with a moving flame silhouette, flowing heat, a pulsing orange glow and rising embers. One 192×192 WebGL scene serves both display canvases at up to 30fps. It stops when hidden, offscreen or inactive, renders a still flame for reduced motion, and keeps the SVG fallback when WebGL is unavailable. The Three.js bundle and flame are cached for offline use; its MIT license is in `js/vendor/THREE-LICENSE.txt`.
