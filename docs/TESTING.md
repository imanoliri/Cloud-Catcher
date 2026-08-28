# Testing and pre-merge verification

## Commands

```bash
npm test
npx playwright install chromium
npm run test:smoke
npm run test:all
```

Playwright starts the freshly built static `dist` site with a Pixel 7 profile. Random quiz selection is fixed and remote reference images are replaced with deterministic fixtures.

## Covered paths

1. Learn and Quiz navigation, mobile layout, collapsed reference guide, tooltips and non-shifting feedback.
2. Catch gesture selection, local photo/detection creation, Atlas progress and Data display.
3. `window.cloudCatcher.importCloudPhotos` batch ingestion into the same atlas.
4. IndexedDB persistence across a page reload.
5. Data messaging that the atlas is private to the current browser.
6. Legacy hosted media references are detected, and the one-time repair embeds recovered originals while removing redundant snippets without changing atlas records.
7. Export prefers native file sharing and retains a download fallback; import remains a system file-picker operation.

Node repository guards verify that the static build contains every browser asset and that deployment configuration contains no Functions, Blob dependencies, hosted routes or OpenAPI artifact.

## Merge gate

Before squash-merging require:

- unit/repository tests green;
- deterministic Playwright suite green;
- production static build successful;
- CI green for the exact PR head;
- Netlify Deploy Preview successful for that same head;
- no known regression in Learn, Quiz, Catch, Atlas or Data.
