# Architecture

Cloud Catcher is an offline-first static web application with a portable domain model and replaceable persistence adapters.

## Principles

1. Domain logic is independent of rendering and storage.
2. Taxonomy is data-driven and hierarchical so later levels can subdivide existing cloud types without rewriting Level 1.
3. The portable library is the user's data contract. Netlify, browser storage, and Google Drive are adapters around it.
4. Human UI actions and AI/API actions operate on the same domain concepts: cloud types, photos, detections, albums, and progress.
5. Stable string IDs are used for taxonomy nodes.
6. One photo may contain several cloud detections.

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

### Photo
One uploaded or captured image with location, observation time, image reference, dimensions, notes, source, and timestamps. The image is stored once even when several cloud types appear in it.

### CloudDetection
A cloud identified inside a photo. It records `photoId`, `cloudTypeId`, confidence, a normalized rectangle or polygon region, review status (`proposed`, `confirmed`, or `rejected`), notes, and source. A snippet is derived from the original image and the region rather than stored as an unrelated second photo.

### Album
A user-defined grouping of cloud detections. Location completion cards are derived from confirmed detections and the location of their parent photos rather than duplicated as special state.

### CollectionProgress
A computed view of which cloud types are caught or missing for a level and optional location. Only confirmed detections count.

## Persistence

The browser uses `BrowserStorageProvider`. It can export/import the complete library as JSON. `GoogleDriveStorageProvider` writes the same library schema. The hosted HTTP API uses Netlify Blobs for persistent server-side library data and original images.

Browser local data and hosted API data are separate libraries in the MVP. A later sync feature should reconcile them explicitly rather than silently merging potentially conflicting data.

## Current library shape

```json
{
  "format": "cloud-catcher",
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

## Security

Hosted mutation endpoints require a bearer token configured through `CLOUD_CATCHER_API_TOKEN`. If no token is configured, hosted mutations are disabled rather than opened anonymously. Read endpoints are public in the MVP.

## Future fractal taxonomy

Level 1 contains the ten principal cloud genera. Later nodes use `parentId` to subdivide a genus into species, varieties, supplementary features, or other learning groupings. Unlocking is computed from completion rules rather than hard-coded into components.
