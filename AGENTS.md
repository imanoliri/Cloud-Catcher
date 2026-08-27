# AGENTS.md

Cloud Catcher is a cloud-identification and collection game built around fractal learning levels, real observations, location-based collection cards, portable user-owned data, and an API usable by AI agents.

## Rules for coding agents

- Keep domain logic out of UI rendering code whenever practical.
- Keep taxonomy data-driven. Do not hard-code future Level 2 categories into components.
- Use stable taxonomy IDs; names are presentation and may change.
- The MVP intentionally has one current data schema. Do not add schema versions or migration machinery until there is real persisted data that requires backwards compatibility.
- Do not make browser storage, Netlify, Google Drive, or another provider the canonical data format.
- New mutation paths must validate cloud type IDs and preserve photo/detection relationships.
- The MVP API is intentionally open. Do not add authentication, tokens, accounts, or permissions unless explicitly requested.
- Location completion is derived from confirmed detections; do not duplicate progress state without a compelling reason.
- Preserve offline usability of the human-facing app.
- Prefer small static-first dependencies and Netlify-compatible deployment.
- Add tests when changing taxonomy traversal, detection/progress calculation, storage behavior, or API ingestion.

## Rules for AI clients

Cloud Catcher exposes a semantic AI-tool layer on top of the lower-level REST API. AI clients should prefer these semantic operations instead of manually orchestrating several REST calls.

- Use `import_cloud_photos` for normal ingestion. A set of photos from one outing should normally be sent in one multipart request with the image files and one metadata JSON payload.
- A single photo may contain multiple cloud detections. Never force a one-photo/one-cloud relationship.
- Identify the cloud type and its normalized region (`rect` or `polygon`) before ingestion. Regions use coordinates from `0` to `1` so they are independent of image resolution.
- Use `confirmed` only when the identification is sufficiently reliable. Use `proposed` when human review would be useful; rejected detections do not count toward collection progress.
- Prefer one session for photos belonging to the same outing or weather episode, carrying shared location/date metadata at session/default level instead of repeating it unnecessarily.
- Use `correct_detection` to change an existing identification, confidence, region, notes, or review status rather than deleting and recreating it.
- Use `add_detection` when another cloud type is later found in an already stored photo.
- Use `get_missing_clouds` when deciding what the user should try to catch next.
- Use `get_collection_progress` to report Level 1 and location-specific progress.
- Do not generate separate image files for cloud snippets. Store the original once and provide the detection region; Cloud Catcher generates snippets from the original.
- Do not bypass the semantic tool layer merely because the underlying REST endpoints exist. Use low-level `/api/*` operations for maintenance, debugging, or functionality not represented by an AI tool.

Machine-readable tool discovery is available at `/ai-tools` and `/openapi.json`. See `docs/AI_TOOLS.md` for agent integration and `docs/API.md` for the underlying REST contract.

## Key files

- `src/taxonomy.js`: cloud taxonomy
- `src/domain.js`: domain objects and progress rules
- `src/storage.js`: storage adapters and import/export
- `app.js`: browser UI and local browser API
- `netlify/functions/cloud-api.mjs`: hosted REST API
- `netlify/functions/ai-tools.mjs`: semantic AI-tool adapter
- `openapi.json`: machine-readable AI/API contract
- `docs/AI_TOOLS.md`: AI-agent integration guide
- `docs/API.md`: underlying REST API contract
- `ARCHITECTURE.md`: system design and invariants

## MVP boundary

Level 1 uses the ten principal cloud genera. The architecture may anticipate deeper levels, but do not add Level 2 content unless explicitly requested. Avoid accounts, social features, authentication, or implicit cloud synchronization in MVP 1.
