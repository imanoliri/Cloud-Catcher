# Architecture

Cloud Catcher is an offline-first static web application with one private browser-local atlas and a portable domain model.

## Invariants

1. Domain logic is independent of rendering and persistence.
2. The taxonomy is data-driven and uses stable IDs.
3. One photo may own many normalized cloud detections.
4. Only confirmed detections count toward collection progress.
5. Human UI and browser automation mutate the same library.
6. The MVP never uploads personal photos or atlas records to Cloud Catcher's hosting.
7. Exported JSON is the portable user-owned data contract.

## Layers

```text
Human UI        Browser/AI automation
    \                 /
     Browser application
              |
        Domain model
              |
 BrowserStorageProvider (IndexedDB)
              |
       Export / import JSON
```

Netlify serves the static application only. There are no deployed Functions, Blob-backed records, image endpoints, REST mutations or MCP server in the MVP.

## Domain and persistence

The domain contains hierarchical cloud types, optional sessions, photos, normalized cloud detections, albums and derived collection progress. `BrowserStorageProvider` stores the complete library in IndexedDB. IndexedDB is used instead of `localStorage` because real image data quickly exceeds small string-storage quotas.

On first load, a legacy `cloud-catcher-library` localStorage value is validated, saved into IndexedDB and removed. The library contains data-URL originals plus normalized crop regions, making export/import self-contained without duplicating image bytes. A stored snippet is retained only as a legacy fallback when its original is unavailable. Browser quotas still vary, so the Data screen warns users to export backups. No automatic cross-device synchronization exists.

`GoogleDriveStorageProvider` demonstrates the future provider boundary but is not wired into the UI. A future Drive feature must preserve a single logical atlas, explicit ownership, conflict handling and offline operation; it must not introduce a second silently merged collection.

## Local automation API

`window.cloudCatcher` is the supported integration boundary. `importCloudPhotos` accepts optional session/default metadata and multiple photos/detections and persists once. Crops are rendered locally from each original and detection region. Smaller mutation operations support corrections and incremental classification.

When Cloud Catcher opens it creates a temporary relay session. An authorized remote agent submits a command to the relay, the open browser polls and executes it through `window.cloudCatcher`, then returns the result. The relay stores only expiring hashed-token sessions plus temporary commands/results. It rejects commands when the browser has not checked in recently, and never stores the Atlas or photos.

Backup transfer uses browser capabilities rather than a Drive API integration: supported mobile browsers open the native share sheet for exports, and imports use the native file picker. Google Drive may appear there as an installed/system provider, but Cloud Catcher receives no account-level Drive access. Unsupported share environments fall back to a download.

## Images and deployment

Regions use normalized `0..1` rectangles or polygons. Crops are derived locally at render time, and the original is stored once regardless of detection count.

The navigation order is **Learn → Quiz → Catch → Atlas → Data**. `app.js` owns navigation and Learn/Quiz rendering; enhancement modules augment the DOM.

`npm run build` copies referenced browser assets to `dist`. Netlify deploys only that static directory. Deterministic Node and mobile Playwright tests verify domain behavior, local persistence and the absence of server persistence configuration.
