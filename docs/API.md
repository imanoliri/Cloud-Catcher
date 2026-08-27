# Cloud Catcher API

Cloud Catcher exposes the same domain concepts to humans and AI clients. The hosted API is served by Netlify Functions and stores its server-side library in Netlify Blobs.

## Authentication

Read operations are public in the MVP. Write operations require `Authorization: Bearer <CLOUD_CATCHER_API_TOKEN>`. If the environment variable is not configured, mutations remain disabled.

## Endpoints

- `GET /api/status`
- `GET /api/cloud-types`
- `GET /api/cloud-types/:id`
- `GET /api/photos`
- `GET /api/photos/:id`
- `POST /api/photos`
- `DELETE /api/photos/:id`
- `GET /api/detections`
- `GET /api/detections/:id`
- `POST /api/detections`
- `PATCH /api/detections/:id`
- `DELETE /api/detections/:id`
- `GET /api/images/:photoId`
- `GET /api/snippets/:detectionId`
- `GET /api/albums`
- `GET /api/albums/:id`
- `POST /api/albums`
- `PATCH /api/albums/:id`
- `GET /api/progress?location=San%20Sebasti%C3%A1n`

## Upload a photo

A client can provide either `imageRef` or a base64 `imageDataUrl`. Uploaded image data is stored once and can be referenced by several detections.

```json
{
  "location": "San Sebastián",
  "observedAt": "2026-08-27T15:00:00Z",
  "originalName": "sky.jpg",
  "imageDataUrl": "data:image/jpeg;base64,...",
  "source": "ai"
}
```

## Add a cloud detection

A detection belongs to one photo. Its region uses normalized `0..1` coordinates and may be either a rectangle or polygon. AI-created detections should normally start as `proposed`; only `confirmed` detections count toward the Cloud Atlas and location progress.

```json
{
  "photoId": "PHOTO_ID",
  "cloudTypeId": "stratocumulus",
  "confidence": 0.93,
  "status": "proposed",
  "region": {
    "type": "rect",
    "x": 0.04,
    "y": 0.02,
    "width": 0.66,
    "height": 0.43
  },
  "source": "ai"
}
```

`GET /api/snippets/:detectionId` returns a cropped JPEG generated from the original photo and the stored detection region.

## Browser API

The web application exposes `window.cloudCatcher` for local automations running in the page:

- `getLibrary()`
- `getCloudTypes()`
- `getProgress(location?)`
- `addPhoto(data)`
- `addDetection(data)`
- `updateDetection(id, patch)`

## Library schema

The MVP uses one current schema: `photos`, `detections`, and `albums`. There is no migration/version layer yet; the model can stay simple until real persisted user data makes compatibility necessary.
