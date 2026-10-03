# Streak

The Streak Dashboard, rebuilt as an installable web app. No Xcode, no 7-day re-signing.

Static files only: no build step and no dependencies. Data stays in the browser's local storage on each device, using the same keys and format as the old iOS app (`streakly-v1[:email]`).

## Use and share

Open [Streak](https://prajwaluu.github.io/streak-dashboard/) and share that same link with anyone. Each device keeps its own entries; there is no automatic cloud sync.

- **iPhone:** open in Safari, then Share → Add to Home Screen. Enable Open as Web App if offered.
- **Android:** open in Chrome, then its menu → Install and create shortcut → Install (the wording can vary by Chrome version).
- **Move your history:** export a backup from the current installation, then import it in the new installation.

GitHub Pages publishes `main`. `.nojekyll` serves the static files directly. Personal backups and local preview fixtures are excluded from Git.

## Run locally

```bash
python3 -m http.server 5173
```

Then open http://localhost:5173.

## Test

```bash
node --test tests/*.test.mjs
```

The tests run the old app's streak, year-stats and momentum code next to the new logic. They also run against `migration/streak-backup-from-iphone.json` when that file is present.

## Moving data from the iPhone app

`migration/streak-backup-from-iphone.json` was pulled from the iOS app's WebKit storage. It is git-ignored and never published. A copy is in iCloud Drive. On the iPhone, open the web app, choose **Import backup from the old app**, and pick the file from iCloud Drive.

## Keeping data safe

- **Export backup** (Settings) saves a `.json` file; **Import backup** restores one.
- An automatic restore point is saved to IndexedDB each day, and the last 14 are kept.
- The app asks the browser for persistent storage. Added to the Home Screen, iOS keeps its data and doesn't apply Safari's 7-day clean-up.

## Today and Insights

Today offers **Conquered**, **Tempered**, and **Defeated**, with optional rating and mood details and one daily notes field. Tempered is the middle ground: a balanced day that keeps the flame alive. Conquered and Tempered both continue a streak; Defeated ends it. An unlogged today leaves yesterday’s streak available. Legacy partial days now display as Tempered, using their original saved values.

Insights offers 7-, 30-, and 90-day views with separate counts for all three outcomes. Conquest rates count only Conquered days out of all explicitly logged outcomes; Tempered days keep streaks alive without inflating conquest counts. Unlogged days stay separate, and weekday patterns require at least three observations. Tap the day timeline to revisit an entry. A comeback is a Conquered day immediately after a Defeated day. Keyboard shortcuts are 1 for Conquered, 2 for Tempered, and 3 for Defeated.

The flame uses a locally bundled **Three.js 0.186.1** shader with a moving flame silhouette, flowing heat, a pulsing orange glow and rising embers. One 192×192 WebGL scene serves both display canvases at up to 30fps. It stops when hidden, offscreen or inactive, renders a still flame for reduced motion, and keeps the SVG fallback when WebGL is unavailable. The Three.js bundle and flame are cached for offline use; its MIT license is in `js/vendor/THREE-LICENSE.txt`.
