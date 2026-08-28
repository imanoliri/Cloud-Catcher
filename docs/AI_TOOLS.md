# AI-assisted ingestion

The MVP deliberately exposes no public remote AI endpoint, OpenAPI service or MCP server. Those designs created a second hosted atlas, public write access and avoidable image bandwidth.

AI assistance remains possible through the local page:

1. Inspect user-provided photos with permission.
2. Identify cloud genera and normalized regions.
3. In an authorized Cloud Catcher browser session, call `window.cloudCatcher.importCloudPhotos(...)` once for the batch.
4. Alternatively, produce a self-contained Cloud Catcher JSON archive for explicit import.
5. Use `updateDetection` for corrections instead of duplicating records.

Use `confirmed` only for reliable identifications and `proposed` when human review is useful. One photo may contain multiple detections. Originals must not be uploaded to Cloud Catcher's Netlify site.

A future remote connector should target the user's chosen private provider, such as Google Drive, and still represent the same logical atlas. It requires authentication, explicit consent, quotas and conflict resolution before remote writes are enabled.
