# AGENTS.md

Cloud Catcher is an offline-first cloud-identification and collection game with one private browser-local atlas.

## Repository rules

- Keep domain logic separate from UI rendering and persistence.
- Keep taxonomy data-driven and use stable taxonomy IDs.
- One original photo may have many detections; never duplicate it per cloud type.
- Persist original photos and normalized regions, not duplicate crop images. Retain a snippet only as a legacy fallback when its original is unavailable.
- Validate mutation inputs and preserve photo/detection/session relationships.
- Only confirmed real detections advance progress.
- `app.js` owns Learn/Quiz rendering and top-level navigation.
- Every asset referenced by `index.html` must be copied into `dist` by `npm run build`.
- Add deterministic tests for domain, storage, ingestion, navigation and user-visible behavior changes.
- Before merging, run `npm run test:all` and verify the exact PR-head Deploy Preview.

## Data ownership and persistence

- The MVP has exactly one live atlas: `BrowserStorageProvider` in IndexedDB.
- Never add a second hosted, preview-specific or silently merged atlas.
- IndexedDB remains the only live Atlas. Netlify Blobs may hold only expiring relay sessions, commands and results; never store photos or an Atlas there.
- Preserve automatic migration of the legacy `cloud-catcher-library` localStorage record.
- Keep JSON export/import self-contained and provider-independent.
- Browser data must not leave the device unless the user explicitly exports it, enables a future private provider, or an active local-agent relay returns an explicitly requested result.
- Google Drive is a future optional provider for the same logical atlas, not a parallel collection.

## Browser automation

AI/browser clients use `window.cloudCatcher`. Prefer `importCloudPhotos` for batch ingestion, `updateDetection` for corrections and `addDetection` for newly found regions. Use normalized `0..1` regions. Use `proposed` for uncertain identifications and `confirmed` only when reliable.

The local-agent relay is the supported remote API. It starts automatically when Cloud Catcher opens, but commands are processed only while that page remains open. Agents receive a temporary token from the Data page and can call allow-listed operations through the relay. Do not add a second hosted Atlas.

## Key files

- `src/taxonomy.js`: cloud taxonomy
- `src/domain.js`: domain objects and progress
- `src/storage.js`: IndexedDB, migration, export/import and future Drive adapter
- `app.js`: UI and local browser API
- `docs/API.md`: browser API contract
- `docs/AI_TOOLS.md`: local AI-assisted workflow
- `docs/TESTING.md`: deterministic merge gate
- `ARCHITECTURE.md`: system invariants

## MVP boundary

Level 1 uses the ten principal cloud genera. Avoid accounts, social features, authentication, remote persistence and Level 2 content unless explicitly requested.
