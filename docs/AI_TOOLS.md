# Cloud Catcher AI Tools

Cloud Catcher exposes a semantic AI-facing layer at `/ai-tools/*` on top of the lower-level REST API.

The goal is that an AI agent can think in Cloud Catcher actions instead of HTTP implementation details.

## Tool discovery

- `GET /ai-tools` — machine-readable catalogue of available semantic tools.
- `GET /openapi.json` — OpenAPI 3.1 description suitable for agents and API clients that can import OpenAPI operations.

## Semantic tools

### `import_cloud_photos`

`POST /ai-tools/import-cloud-photos`

Use this for the normal workflow: the user gives an AI one or many cloud images, the AI identifies cloud types and regions, then sends the whole batch in one multipart request.

The multipart request contains:

- `metadata`: JSON string with optional session information, shared defaults, and detections for each image.
- `photo0`, `photo1`, ...: the actual image files.

Example metadata:

```json
{
  "session": {
    "name": "San Sebastián sky — 27 Aug 2026",
    "location": "San Sebastián",
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
  ]
}
```

The response contains the created session, every stored photo, every detection, generated snippet references, and totals.

### `correct_detection`

`POST /ai-tools/correct-detection`

Correct a detection after review. Supply `detectionId` plus any changed fields: `cloudTypeId`, `confidence`, `region`, `status`, or `notes`.

### `add_detection`

`POST /ai-tools/add-detection`

Add an extra cloud type to a photo already stored in Cloud Catcher.

### `get_missing_clouds`

`GET /ai-tools/get-missing-clouds?location=San%20Sebasti%C3%A1n`

Returns the Level 1 genera still missing from the user's collection, optionally scoped to a location.

### `get_collection_progress`

`GET /ai-tools/get-collection-progress?location=San%20Sebasti%C3%A1n`

Returns collection progress for Level 1, optionally scoped to a location.

## Intended AI workflow

1. Receive one or more user photos.
2. Visually classify each cloud region.
3. Produce confidence and normalized rectangle/polygon regions.
4. Call `import_cloud_photos` once for the whole batch.
5. Report new catches and collection progress.
6. If the user corrects an identification, call `correct_detection` rather than re-uploading the photo.

The semantic tool layer is deliberately thin. It forwards to the canonical `/api/*` operations, so there is only one domain and persistence implementation.
