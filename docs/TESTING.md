# Testing and pre-merge verification

## Commands

```bash
npm test
npx playwright install chromium
npm run test:smoke
npm run test:all
```

Playwright starts the freshly built static `dist` site with a Pixel 7 profile. Random quiz selection is fixed and remote reference images are replaced with deterministic fixtures.

## Covered paths

1. Learn and Quiz navigation, mobile layout, collapsed reference guide, tooltips and non-shifting feedback.
2. Catch camera-first capture, EXIF timestamp/GPS extraction (`src/exif.js`), gesture selection, saved region overlays, in-place region redraw, and multi-cloud photo persistence.
3. Proposal review UI (`Needs Review` Confirm / Alternatives / Edit / Redraw / Reject), Atlas filtering, and Observation Detail modal (`Crop` / `Full photo & regions` / siblings).
4. `window.cloudCatcher.importCloudPhotos` batch ingestion and `LifeOsStorageProvider` (`/api/clouds/library`) connectivity.
5. IndexedDB persistence and legacy `localStorage` migration.
6. Data storage-footprint visibility, native share / download export, and legacy reference rejection.

Node repository guards verify that the static build contains every browser asset and that deployment configuration remains 100% static with no Netlify Functions, Blobs, or unauthenticated remote writes.
