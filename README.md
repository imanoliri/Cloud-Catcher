# Cloud Catcher

A cloud-spotting game where you catch, identify, and collect real clouds, unlocking increasingly detailed classifications and location-based collections.

## MVP

Cloud Catcher starts with Level 1: the ten principal cloud genera. Correct identifications become observations in your personal Cloud Atlas. Completing all ten completes the Level 1 collection; catching all ten in the same place also completes a location card for that place.

The classification model is hierarchical, so later levels can split broad types into progressively finer categories without redesigning the game.

## Data ownership

Cloud Catcher is offline-first and portable by design. Browser progress is stored locally, and the Data screen can export or import the complete versioned Cloud Catcher library as JSON. The same format is used by storage adapters, including Google Drive.

The repository also includes a Netlify-hosted HTTP API for AI clients. Read endpoints expose taxonomy, observations, albums, and collection progress. Writes require a bearer token configured as `CLOUD_CATCHER_API_TOKEN`.

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
