# Architecture

Cloud Catcher is an offline-first static web application with a portable domain model and replaceable persistence adapters.

## Principles

1. Domain logic is independent of rendering and storage.
2. Taxonomy is data-driven and hierarchical so later levels can subdivide existing cloud types without rewriting Level 1.
3. The portable library is the user's data contract. Netlify, browser storage, and Google Drive are adapters around it.
4. Human UI actions and AI/API actions operate on the same domain concepts: cloud types, sessions, photos, detections, albums, and progress.
5. Stable string IDs are used for taxonomy nodes.
6. One photo may contain several cloud detections.
7. AI ingestion should be coarse-grained: one catch request can create a photo plus detections, and one batch request can create an entire field session.

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

### Session
An optional grouping for photos from the same outing, weather episode, or imported batch. It records `name`, location, observation time, notes, source, and `photoIds`.

### Photo
One uploaded or captured image with optional `sessionId`, location, observation time, image reference, dimensions, notes, source, and timestamps. The image is stored once even when several cloud types appear in it.

### CloudDetection
A cloud identified inside a photo. It records `photoId`, `cloudTypeId`, confidence, a normalized rectangle or polygon region, review status (`proposed`, `confirmed`, or `rejected`), notes, and source. A snippet is derived from the original image and the region rather than stored as an unrelated second photo.

### Album
A user-defined grouping of cloud detections. Location completion cards are derived from confirmed detections and the location of their parent photos rather than duplicated as special state.

### CollectionProgress
A computed view of which cloud types are caught or missing for a level and optional location. Only confirmed detections count.

## Ingestion operations

The low-level model stays normalized, but the AI-facing API provides aggregate commands:

```text
POST /api/catches
  -> Photo
  -> 0..n CloudDetections

POST /api/catches/batch
  -> optional Session
  -> 1..n Photos
  -> 0..n CloudDetections per photo
```

This avoids forcing an AI client to perform dozens of dependent calls when ingesting a set of cloud photos. Lower-level `/photos` and `/detections` operations remain available for edits and corrections.

## Persistence

The browser uses `BrowserStorageProvider`. It can export/import the complete library as JSON. `GoogleDriveStorageProvider` writes the same library schema. The hosted HTTP API uses Netlify Blobs for persistent server-side library data and original images.

Browser local data and hosted API data are separate libraries in the MVP. A later sync feature should reconcile them explicitly rather than silently merging potentially conflicting data.

## Current library shape

```json
{
  "format": "cloud-catcher",
  "sessions": [],
  "photos": [],
  "detections": [],
  "albums": [],
  "createdAt": "...",
  "updatedAt": "..."
}
```

The MVP deliberately has no schema migration/version layer. Compatibility machinery should only be introduced once there is real persisted user data worth preserving.

## Image regions and snippets

Detection regions use normalized `0..1` coordinates so they are independent of image resolution. Rectangles are supported directly and polygons are supported for irregular cloud regions. Snippets are generated from the original image using the detection bounds.

## API access

The MVP HTTP API is intentionally open for reads and writes. Authentication and multi-user isolation are deferred until the project actually needs them.

## Future fractal taxonomy

Level 1 contains the ten principal cloud genera. Later nodes use `parentId` to subdivide a genus into species, varieties, supplementary features, or other learning groupings. Unlocking is computed from completion rules rather than hard-coded into components.
