# Streak

The Streak Dashboard, rebuilt as an installable web app. No Xcode, no 7-day re-signing.

Static files only: no build step and no dependencies. Data stays in the browser's local storage on each device, using the same keys and format as the old iOS app (`streakly-v1[:email]`).

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
