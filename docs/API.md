# Cloud Catcher API

Cloud Catcher exposes the same domain concepts to humans and AI clients. The hosted API is served by Netlify Functions and stores its server-side library in Netlify Blobs.

## Authentication

Read operations are public in the MVP. Write operations require `Authorization: Bearer <CLOUD_CATCHER_API_TOKEN>`. If the environment variable is not configured, mutations remain disabled.

## Endpoints

- `GET /api/status`
- `GET /api/cloud-types`
- `GET /api/cloud-types/:id`
- `GET /api/observations`
- `GET /api/observations/:id`
- `POST /api/observations`
- `DELETE /api/observations/:id`
- `GET /api/albums`
- `GET /api/albums/:id`
- `POST /api/albums`
- `PATCH /api/albums/:id`
- `GET /api/progress?location=San%20Sebasti%C3%A1n`

### Add an observation

```json
{
  "cloudTypeId": "cumulus",
  "location": "San Sebastián",
  "observedAt": "2026-08-27T15:00:00Z",
  "imageRef": "https://example.invalid/photo.jpg",
  "notes": "Detached cauliflower cloud with flat base",
  "confidence": 0.91,
  "source": "ai"
}
```

The API deliberately stores `imageRef` rather than assuming one image host. A future image-storage adapter can use Drive, object storage, or another provider without changing observations.

## Browser API

The web application also exposes `window.cloudCatcher` for local automations running in the page:

- `getLibrary()`
- `getCloudTypes()`
- `getProgress(location?)`
- `addObservation(data)`

## Versioning

Portable libraries contain `format: "cloud-catcher"` and `formatVersion: 1`. Importers validate these fields before accepting an archive.
