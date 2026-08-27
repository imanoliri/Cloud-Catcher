# Cloud Catcher

A cloud-spotting game where you catch, identify, and collect real clouds, unlocking increasingly detailed classifications and location-based collections.

## MVP

Cloud Catcher starts with Level 1: the ten principal cloud genera. A real photo is stored once and can contain several cloud detections. Each confirmed detection can unlock its own Cloud Atlas card, while detections inherit the photo's location and date.

Completing all ten genera completes the Level 1 collection; catching all ten in the same place also completes a location card for that place.

Photos from the same outing or weather episode can be grouped into a **session**, for example `San Sebastián sky — 27 Aug 2026`.

The classification model is hierarchical, so later levels can split broad types into progressively finer categories without redesigning the game.

See [`docs/USE_CASES.md`](docs/USE_CASES.md) for the product's concrete user journeys and the distinction between current MVP, near-term, and future fractal-learning use cases.

## AI ingestion

Cloud Catcher provides both a low-level REST API and a semantic AI tool layer.

- `POST /api/catches/batch` is the canonical batch-ingestion API.
- `POST /ai-tools/import-cloud-photos` is the agent-friendly semantic tool for the same operation.
- One multipart request can carry many actual image files plus one metadata JSON field describing the session and all detections.
- `correct_detection`, `add_detection`, `get_missing_clouds`, and `get_collection_progress` are exposed through `/ai-tools/*`.
- `GET /ai-tools` provides machine-readable tool discovery.
- `GET /openapi.json` publishes an OpenAPI 3.1 description that compatible AI/API clients can import.

The semantic tool layer is only an adapter over the canonical REST/domain implementation; it does not duplicate storage or game logic.

The MVP API is intentionally open for reads and writes; there is no authentication layer yet.

See [`docs/API.md`](docs/API.md) for the complete REST contract and [`docs/AI_TOOLS.md`](docs/AI_TOOLS.md) for AI-agent integration.

## Data ownership

Cloud Catcher is offline-first and portable by design. Browser progress is stored locally, and the Data screen can export or import the complete Cloud Catcher library as JSON. The same schema is used by storage adapters, including Google Drive.

Hosted API images and library data are stored in the global Netlify Blob store so catches survive deploy-preview updates and the eventual merge to production.

## Run locally

```bash
npm install
npm run dev
```

## Build and deploy

```bash
npm run build
```

Netlify configuration lives in `netlify.toml`. The GitHub repository is connected to the Netlify project `cloud-catcher-game`, with `main` as production and pull requests deployed as previews.

## Documentation

- [`ARCHITECTURE.md`](ARCHITECTURE.md) — domain boundaries, persistence, and future fractal levels
- [`AGENTS.md`](AGENTS.md) — repository rules for coding agents
- [`docs/USE_CASES.md`](docs/USE_CASES.md) — current and future user journeys
- [`docs/API.md`](docs/API.md) — hosted and browser REST API contract
- [`docs/AI_TOOLS.md`](docs/AI_TOOLS.md) — semantic AI tool layer and recommended agent workflow
- [`docs/GOOGLE_DRIVE.md`](docs/GOOGLE_DRIVE.md) — Google Drive storage adapter
- [`openapi.json`](openapi.json) — machine-readable OpenAPI tool description
