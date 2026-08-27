# Architecture

Cloud Catcher is an offline-first static web application with a portable domain model and replaceable persistence adapters.

## Principles

1. Domain logic is independent of rendering and storage.
2. Taxonomy is data-driven and hierarchical so later levels can subdivide existing cloud types without rewriting Level 1.
3. The portable library format is the user's data contract. Netlify, browser storage, and Google Drive are adapters around it.
4. Human UI actions and AI/API actions operate on the same domain concepts: cloud types, observations, albums, and progress.
5. Stable string IDs are used for taxonomy nodes.

## Layers

```text
Human UI                  AI clients
   |                         |
   v                         v
Browser application       HTTP API
   |                         |
   +------ Domain model -----+
              |
      StorageProvider boundary
        /        |          \
 browser     Google Drive   Netlify Blobs
```

## Domain objects

### CloudType
A node in the classification tree. Fields include `id`, `name`, `code`, `level`, `parentId`, `family`, explanation, and identifying clues.

### CloudObservation
A caught real or quiz cloud. It records `cloudTypeId`, location, observation time, image reference, notes, confidence, source, and timestamps.

### Album
A user-defined grouping of observations. Location completion cards are derived from observation data rather than duplicated as special state.

### CollectionProgress
A computed view of which cloud types are caught or missing for a level and optional location.

## Persistence

The browser uses `BrowserStorageProvider`. It can export/import the complete library as versioned JSON. `GoogleDriveStorageProvider` uses the Google Drive REST API and writes the same library format. The hosted HTTP API uses Netlify Blobs for persistent server-side storage.

Browser local data and hosted API data are separate libraries in MVP 1. A later sync feature should reconcile them explicitly rather than silently merging potentially conflicting observations.

## Archive format

```json
{
  "format": "cloud-catcher",
  "formatVersion": 1,
  "taxonomyVersion": "1.0",
  "observations": [],
  "albums": [],
  "createdAt": "...",
  "updatedAt": "..."
}
```

Images are represented by references in MVP 1. A ZIP archive containing binary images can be introduced in a later format version without breaking JSON exports.

## Security

Hosted mutation endpoints require a bearer token configured through `CLOUD_CATCHER_API_TOKEN`. If no token is configured, hosted mutations are disabled rather than opened anonymously. Read endpoints are public in MVP 1.

## Future fractal taxonomy

Level 1 contains the ten principal cloud genera. Later nodes use `parentId` to subdivide a genus into species, varieties, supplementary features, or other learning groupings. Unlocking is computed from completion rules rather than hard-coded into components.
