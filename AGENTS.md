# AGENTS.md

Cloud Catcher is an offline-first cloud-identification and collection game with one private browser-local atlas.

## Repository rules

- Keep domain logic separate from UI rendering and persistence.
- Keep taxonomy data-driven and use stable taxonomy IDs.
- One original photo may have many detections; never duplicate it per cloud type.
- Validate mutation inputs and preserve photo/detection/session relationships.
- Only confirmed real detections advance progress.
- `app.js` owns Learn/Quiz rendering and top-level navigation.
- Every asset referenced by `index.html` must be copied into `dist` by `npm run build`.
- Add deterministic tests for domain, storage, ingestion, navigation and user-visible behavior changes.
- Before merging, run `npm run test:all` and verify the exact PR-head Deploy Preview.

## Data ownership and persistence

- The MVP has exactly one live atlas: `BrowserStorageProvider` in IndexedDB.
- Never add a second hosted, preview-specific or silently merged atlas.
- Netlify serves static application assets only. Do not add Netlify Blobs, hosted photo storage, public REST writes, Functions or remote MCP without explicit product authorization and a complete ownership/authentication design.
- Preserve automatic migration of the legacy `cloud-catcher-library` localStorage record.
- Keep JSON export/import self-contained and provider-independent.
- Browser data must not leave the device unless the user explicitly exports it or enables a future private provider.
- Google Drive is a future optional provider for the same logical atlas, not a parallel collection.

## Browser automation

AI/browser clients use `window.cloudCatcher`. Prefer `importCloudPhotos` for batch ingestion, `updateDetection` for corrections and `addDetection` for newly found regions. Use normalized `0..1` regions. Use `proposed` for uncertain identifications and `confirmed` only when reliable.

There is intentionally no hosted `/api`, `/ai-tools`, OpenAPI or `/mcp` service in the MVP. An agent must operate through the authorized local page or provide an archive for explicit import.

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
