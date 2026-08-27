# Cloud Catcher API

Cloud Catcher exposes the same domain concepts to humans and AI clients. The hosted API is served by Netlify Functions and stores library data and uploaded images in Netlify Blobs.

The MVP API is intentionally open for reads and writes. It has no authentication layer yet.

## Recommended AI workflow

For normal AI ingestion, prefer `POST /api/catches`. It stores one photo plus all cloud detections found in that photo in one request.

For an outing or imported photo batch, prefer `POST /api/catches/batch` with `multipart/form-data`. One request carries all image files plus one JSON metadata part describing the session, shared metadata, and detections.

The lower-level `/photos` and `/detections` endpoints remain available for editing or incremental workflows.

## Endpoints

- `GET /api/status`
- `GET /api/cloud-types`
- `GET /api/cloud-types/:id`
- `GET /api/sessions`
- `GET /api/sessions/:id`
- `POST /api/sessions`
- `POST /api/catches`
- `POST /api/catches/batch`
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

## Create one complete catch

`POST /api/catches`

```json
{
  "location": "San Sebastián",
  "observedAt": "2026-08-27T15:00:00Z",
  "originalName": "39640.jpg",
  "imageDataUrl": "data:image/jpeg;base64,...",
  "source": "ai",
  "detections": [
    {
      "cloudTypeId": "stratocumulus",
      "confidence": 0.91,
      "status": "confirmed",
      "region": {
        "type": "rect",
        "x": 0.03,
        "y": 0.02,
        "width": 0.72,
        "height": 0.50
      }
    }
  ]
}
```

The response contains the created `photo` and all created `detections`. Each detection includes `snippetRef`, which points to a JPEG crop generated from its region.

## Import a whole cloud session in one request

`POST /api/catches/batch`

Use `multipart/form-data`. The request contains:

- one text field named `metadata` containing JSON;
- one file field per photo (`photo0`, `photo1`, ... by default).

Example metadata:

```json
{
  "session": {
    "name": "San Sebastián sky — 27 Aug 2026",
    "location": "San Sebastián",
    "observedAt": "2026-08-27T15:00:00Z",
    "source": "ai"
  },
  "defaults": {
    "location": "San Sebastián",
    "source": "ai"
  },
  "catches": [
    {
      "fileField": "photo0",
      "originalName": "39640.jpg",
      "detections": [
        {
          "cloudTypeId": "stratocumulus",
          "confidence": 0.91,
          "status": "confirmed",
          "region": {"type":"rect","x":0.03,"y":0.02,"width":0.72,"height":0.50}
        }
      ]
    },
    {
      "fileField": "photo1",
      "originalName": "39367.jpg",
      "detections": [
        {
          "cloudTypeId": "altostratus",
          "confidence": 0.82,
          "status": "confirmed",
          "region": {"type":"rect","x":0,"y":0,"width":1,"height":0.72}
        }
      ]
    }
  ]
}
```

Conceptually the multipart request is:

```text
metadata = <JSON above>
photo0   = 39640.jpg
photo1   = 39367.jpg
...
photo8   = ninth-photo.jpg
```

If `fileField` is omitted, Cloud Catcher expects `photo0`, `photo1`, and so on according to catch order.

The endpoint stores each original image once, creates the optional session, creates every detection, and returns the session, all photo/detection results, snippet references, and batch totals. This is the preferred interface for an AI ingesting a set such as nine photos from one outing.

For compatibility with simple clients, `/api/catches/batch` also accepts the older JSON form using `imageDataUrl`, but multipart upload is preferred for real image files.

## Sessions

A session groups photos that belong to the same outing, weather episode, or imported batch. A session stores `name`, `location`, `observedAt`, `notes`, `source`, and `photoIds`. Photos also store their `sessionId`.

A session is optional: individual catches can exist without one.

## Detection regions

A detection belongs to one photo. Regions use normalized `0..1` coordinates, independent of image resolution.

Rectangle:

```json
{"type":"rect","x":0.05,"y":0.10,"width":0.50,"height":0.35}
```

Polygon:

```json
{
  "type": "polygon",
  "points": [[0.05,0.08],[0.61,0.06],[0.70,0.37],[0.18,0.48]]
}
```

Detection status may be `proposed`, `confirmed`, or `rejected`. Only confirmed detections count toward Cloud Atlas and location progress.

`GET /api/snippets/:detectionId` returns a cropped JPEG generated from the original photo and the detection region.

## Lower-level photo and detection operations

`POST /api/photos` stores a photo alone. It accepts `imageRef` or base64 `imageDataUrl`.

`POST /api/detections` adds a detection to an existing photo. `PATCH /api/detections/:id` can correct the type, confidence, region, status, or notes.

These endpoints are useful for editing, but AI clients should normally use `/api/catches` or `/api/catches/batch` for ingestion.

## Persistence

The hosted API uses the global Netlify Blob store named `cloud-catcher`, so catches ingested through a Deploy Preview remain available after later preview builds and after the branch is merged.

## Browser API

The web application exposes `window.cloudCatcher` for local automations running in the page:

- `getLibrary()`
- `getCloudTypes()`
- `getProgress(location?)`
- `addPhoto(data)`
- `addDetection(data)`
- `updateDetection(id, patch)`

## Library schema

The MVP uses one current schema:

```json
{
  "format": "cloud-catcher",
  "sessions": [],
  "photos": [],
  "detections": [],
  "albums": []
}
```

There is no migration/version layer yet; compatibility machinery can be introduced later when there is real persisted user data worth preserving.
