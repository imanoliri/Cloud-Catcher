# AGENTS.md

Cloud Catcher is a cloud-identification and collection game built around fractal learning levels, real observations, location-based collection cards, portable user-owned data, and an API usable by AI agents.

## Rules for coding agents

- Keep domain logic out of UI rendering code whenever practical.
- Keep taxonomy data-driven. Do not hard-code future Level 2 categories into components.
- Use stable taxonomy IDs; names are presentation and may change.
- All persisted data must remain compatible with the versioned Cloud Catcher archive format or include an explicit migration.
- Do not make browser storage, Netlify, Google Drive, or another provider the canonical data format.
- New mutation paths must validate cloud type IDs and preserve observation IDs.
- API writes must remain authenticated by default.
- Location completion is derived from observations; do not duplicate progress state without a compelling reason.
- Preserve offline usability of the human-facing app.
- Prefer small static-first dependencies and Netlify-compatible deployment.
- Add tests when changing archive validation, taxonomy traversal, progress calculation, or storage migrations.

## Key files

- `src/taxonomy.js`: cloud taxonomy
- `src/domain.js`: domain objects and progress rules
- `src/storage.js`: storage adapters and import/export
- `app.js`: browser UI and local browser API
- `netlify/functions/cloud-api.mjs`: hosted AI-facing API
- `docs/API.md`: API contract
- `ARCHITECTURE.md`: system design and invariants

## MVP boundary

Level 1 uses the ten principal cloud genera. The architecture may anticipate deeper levels, but do not add Level 2 content unless explicitly requested. Avoid accounts, social features, or implicit cloud synchronization in MVP 1.
