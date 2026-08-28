# Browser API

Cloud Catcher has no hosted REST API in the browser-local MVP. The supported programmatic interface is `window.cloudCatcher` in an open Cloud Catcher page. Every mutation writes to the same IndexedDB library used by the UI.

## Operations

- `getLibrary()` returns a structured clone of the complete library.
- `getCloudTypes()` returns the Level 1 taxonomy.
- `getProgress(location?)` returns confirmed Level 1 progress.
- `addPhoto(data)` and `addDetection(data)` perform incremental local mutations.
- `updateDetection(id, patch)` corrects an existing detection.

### `importCloudPhotos(batch)`

```js
await window.cloudCatcher.importCloudPhotos({
  session: {name: 'San Sebastián sky', location: 'San Sebastián'},
  defaults: {location: 'San Sebastián', source: 'ai'},
  catches: [{
    file: imageFile,
    originalName: imageFile.name,
    detections: [{
      cloudTypeId: 'cumulus',
      confidence: 0.95,
      status: 'confirmed',
      region: {type: 'rect', x: 0.1, y: 0.1, width: 0.6, height: 0.4}
    }]
  }]
});
```

Each catch may supply `file`, `imageDataUrl`, or `imageRef`. The operation creates the optional session, photos, detections and local JPEG snippets, persists the library, and returns `{session, results, summary}`.

## Library ownership

The portable library contains `format: "cloud-catcher"`, sessions, photos, detections and albums. The Data view exports/imports it as JSON. Images and snippets are local data URLs, so backups are self-contained. This browser library is the only live atlas; there is no Netlify Blob library to merge.
