# Cloud Catcher

A mobile-first cloud-spotting game where the user learns, catches, identifies and collects real clouds.

## MVP

Level 1 contains the ten principal cloud genera. The flow is **Learn → Quiz → Catch → Atlas → Data**. One original photo may contain several independently selected cloud regions. Confirmed detections unlock atlas and location progress; quizzes never change collection progress.

See [`docs/USE_CASES.md`](docs/USE_CASES.md) for the audited current journeys and [`FUTURE.md`](FUTURE.md) for later work.

## One private atlas

The MVP has exactly one atlas: the library stored in the current browser using IndexedDB.

- Website catches and `window.cloudCatcher` automation write to that same library.
- Original photos, crop coordinates, sessions, detections and albums stay on the device. Crops are rendered from their original photo instead of storing duplicate image bytes.
- There is no hosted photo Atlas, public permanent-write endpoint, or background synchronization. Netlify Blobs is used only as the temporary relay mailbox.
- Cloud Catcher creates a temporary local-agent relay whenever it opens. It keeps only short-lived commands/results in Netlify Blobs; the browser's IndexedDB remains the Atlas. Open **Data** to copy the temporary agent API connection.
- Data export produces a self-contained JSON backup; import restores it.
- On supported phones, Export opens the system share/save sheet so Google Drive or another installed destination can receive the backup without OAuth. Import uses the system file picker, which can browse Drive. Other browsers fall back to a normal download.
- Import refuses older exports that still point at the retired hosted image API, instead of silently showing a broken atlas. Recover those archives once with `npm run repair:legacy-archive -- INPUT OUTPUT --legacy-origin URL`; the repaired copy embeds each original and keeps a crop image only when its original is unavailable.
- An existing `localStorage` library is migrated automatically to IndexedDB.
- Optional Google Drive backup/synchronization is future work.

Browser data survives deployments and branch changes on the same site origin, but clearing site data or changing browsers/devices requires an export/import until Drive sync exists.

## Browser automation API

The local page exposes `window.cloudCatcher`: `getLibrary`, `getCloudTypes`, `getProgress`, `importCloudPhotos`, `addPhoto`, `addDetection`, and `updateDetection`.

`importCloudPhotos` accepts a session, shared defaults and multiple catches with `File`, data-URL or existing local image references. It creates all records in one local operation; crops are rendered from stored regions. See [`docs/API.md`](docs/API.md) and [`docs/AI_TOOLS.md`](docs/AI_TOOLS.md).

## Develop and verify

```bash
npm install
npm run dev
npm run test:all
```

`npm run build` creates the static `dist` artifact deployed by Netlify. Pull requests receive Deploy Previews, but Netlify hosts only static application assets—not user atlas data.

## Documentation

- [`ARCHITECTURE.md`](ARCHITECTURE.md)
- [`AGENTS.md`](AGENTS.md)
- [`docs/USE_CASES.md`](docs/USE_CASES.md)
- [`FUTURE.md`](FUTURE.md)
- [`docs/API.md`](docs/API.md)
- [`docs/AI_TOOLS.md`](docs/AI_TOOLS.md)
- [`docs/GOOGLE_DRIVE.md`](docs/GOOGLE_DRIVE.md)
- [`docs/TESTING.md`](docs/TESTING.md)
