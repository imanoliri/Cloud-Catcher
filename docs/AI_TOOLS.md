# Cloud Catcher AI Tools

Cloud Catcher exposes the same semantic operations through two adapters:

- `/mcp` — remote Model Context Protocol server for MCP-capable AI clients.
- `/ai-tools/*` — simple HTTP semantic endpoints for agents that prefer ordinary REST/OpenAPI.

Both adapters sit on top of the canonical `/api/*` implementation. They do not own a separate data model.

## Remote MCP

Connect an MCP-capable client to:

```text
https://<cloud-catcher-host>/mcp
```

The MCP server exposes:

- `import_cloud_photos`
- `correct_detection`
- `add_detection`
- `get_missing_clouds`
- `get_collection_progress`

`import_cloud_photos` accepts structured photo metadata plus either `imageDataUrl` or a reachable `imageUrl` for each photo. The MCP server resolves image URLs and forwards the complete batch to Cloud Catcher's canonical ingestion API.

Agents that already possess raw file bytes should prefer the multipart HTTP operation described below, because MCP tool arguments are structured data rather than arbitrary multipart file parts.

## HTTP tool discovery

- `GET /ai-tools` — machine-readable catalogue of available semantic tools.
- `GET /openapi.json` — OpenAPI 3.1 description suitable for agents and API clients that can import OpenAPI operations.

## Semantic tools

### `import_cloud_photos`

HTTP: `POST /ai-tools/import-cloud-photos`

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

Correct a detection after review. Supply `detectionId` plus any changed fields: `cloudTypeId`, `confidence`, `region`, `status`, or `notes`.

### `add_detection`

Add an extra cloud type to a photo already stored in Cloud Catcher.

### `get_missing_clouds`

Returns the Level 1 genera still missing from the user's collection, optionally scoped to a location.

### `get_collection_progress`

Returns collection progress for Level 1, optionally scoped to a location.

## Intended AI workflow

1. Receive one or more user photos.
2. Visually classify each cloud region.
3. Produce confidence and normalized rectangle/polygon regions.
4. Call `import_cloud_photos` once for the whole batch.
5. Report new catches and collection progress.
6. If the user corrects an identification, call `correct_detection` rather than re-uploading the photo.

## ChatGPT availability

Cloud Catcher is now technically ready to be connected as a remote MCP app. Whether a ChatGPT account can attach it with write actions depends on the ChatGPT plan and current custom-app availability. The MCP endpoint itself does not grant ChatGPT access; it must be added as a custom app/connector in a supported ChatGPT workspace.
