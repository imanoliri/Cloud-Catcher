# Cloud Catcher

A cloud-spotting game where you catch, identify, and collect real clouds, unlocking increasingly detailed classifications and location-based collections.

## MVP

Cloud Catcher starts with Level 1: the ten principal cloud genera. A real photo is stored once and can contain several cloud detections. Each confirmed detection can unlock its own Cloud Atlas card, while detections inherit the photo's location and date.

Completing all ten genera completes the Level 1 collection; catching all ten in the same place also completes a location card for that place.

Photos from the same outing or weather episode can be grouped into a **session**, for example `San Sebastián sky — 27 Aug 2026`.

The classification model is hierarchical, so later levels can split broad types into progressively finer categories without redesigning the game.

## AI ingestion

The Netlify-hosted HTTP API is designed so an AI client can ingest real cloud photography directly.

- `POST /api/catches` uploads one photo and all detected cloud regions in one request.
- `POST /api/catches/batch` uploads many photos as one optional session with shared location/date defaults.
- Each cloud detection receives a generated snippet URL derived from the original photo.
- Lower-level photo and detection endpoints remain available for later corrections.

The MVP API is intentionally open for reads and writes; there is no authentication layer yet.

See [`docs/API.md`](docs/API.md) for the complete contract and examples.

## Data ownership

Cloud Catcher is offline-first and portable by design. Browser progress is stored locally, and the Data screen can export or import the complete Cloud Catcher library as JSON. The same schema is used by storage adapters, including Google Drive.

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
- [`docs/API.md`](docs/API.md) — hosted and browser API contract
- [`docs/GOOGLE_DRIVE.md`](docs/GOOGLE_DRIVE.md) — Google Drive storage adapter
