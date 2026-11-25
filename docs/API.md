# Browser API & Storage Providers

When deployed standalone on Netlify, Cloud Catcher stores all library data locally in IndexedDB (`BrowserStorageProvider`). When opened from a LifeOS tailnet host at `/cloud-catcher/` (or `?storage=lifeos`), `LifeOsStorageProvider` in `src/storage.js` connects transparently to the same operator's private `/api/clouds/library` endpoint using the canonical `"format": "cloud-catcher"` schema.

The programmatic in-page interface remains `window.cloudCatcher`:

## Operations

- `getLibrary()` returns a structured clone of the complete library.
- `getCloudTypes()` returns the Level 1 taxonomy.
- `getProgress(location?)` returns confirmed Level 1 progress.
- `getStorageMode()` returns `'lifeos'` or `'browser'`.
- `addPhoto(data)` and `updatePhoto(id, patch)` create or edit photo metadata.
- `addDetection(data)` and `updateDetection(id, patch)` create, redraw region, confirm, reject, or annotate detections (supporting optional `explanation` and `alternatives[]`).
- `openInCatchForEdit(photoId, detectionId)` opens a stored photo in Catch with an existing region selected for visual redraw/refinement.

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
      explanation: 'Puffy flat-based heaps.',
      alternatives: ['stratocumulus'],
      region: {type: 'rect', x: 0.1, y: 0.1, width: 0.6, height: 0.4}
    }]
  }]
});
```

Each catch may supply `file`, `imageDataUrl`, or `imageRef`. Regions are normalized `0..1` coordinates; crop images are rendered locally from originals and are not stored twice.

## Library ownership

The portable library contains `format: "cloud-catcher"`, sessions, photos, detections and albums. Export produces a self-contained JSON archive (embedding data URLs when exported from LifeOS via `?embed_images=1`).
