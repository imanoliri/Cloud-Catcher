# AI-assisted ingestion

The local-agent relay exposes a temporary API without creating a second hosted Atlas. It is created automatically when the browser opens and works only while that page remains open.

AI assistance remains possible through the local page:

1. Inspect user-provided photos with permission.
2. Identify cloud genera and normalized regions.
3. Open Data, copy the temporary agent API connection, and use its token only for that active task.
4. Start with `getAtlas` or `listPhotos`, then request individual originals with `getPhoto` only when needed.
5. Use `updateDetection` for corrections instead of duplicating records.

Use `confirmed` only for reliable identifications and `proposed` when human review is useful. One photo may contain multiple detections. The relay returns an original only for an explicit `getPhoto` request and never persists it.

A future remote connector should target the user's chosen private provider, such as Google Drive, and still represent the same logical atlas. It requires authentication, explicit consent, quotas and conflict resolution before remote writes are enabled.
