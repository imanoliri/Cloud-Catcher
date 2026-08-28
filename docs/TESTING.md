# Testing and pre-merge verification

Cloud Catcher uses two deterministic test layers plus the Netlify Deploy Preview.

## Commands

```bash
npm test
npx playwright install chromium
npm run test:smoke
```

`npm run test:all` runs the Node unit/repository tests followed by Playwright. Playwright starts a local static server from a fresh `npm run build`, so the smoke suite tests the same `dist` artifact shape that Netlify publishes.

## Deterministic Playwright design

The smoke suite runs one mobile Chromium project using the Pixel 7 device profile. To avoid flaky external dependencies it:

- replaces `Math.random` with a fixed sequence before application code runs;
- stubs hosted `/api/*` reads with empty deterministic responses;
- replaces remote learning/reference images with a small deterministic image response;
- starts with cleared browser local storage.

The tests therefore exercise Cloud Catcher behavior rather than the availability, latency, or contents of third-party image hosts or persisted Netlify data.

## Covered MVP smoke paths

1. **Learn**
   - Navigation order is Learn → Quiz → Catch → Atlas → Data.
   - Main Level 1 learning content renders on mobile.
   - **Know them by sight** is collapsed by default and expands on click.
   - Its title font size matches normal section headings.
   - The page does not introduce document-level horizontal overflow.

2. **Quiz**
   - Both image-identification and definition quizzes render four choices.
   - The inline ℹ️ opens a floating tooltip and closes without becoming question text.
   - Answer feedback overlays the choices rather than moving the quiz image.
   - Definition questions quote the genus with normal double quotes.
   - Definition answers keep visible vertical separation.

3. **Catch → Atlas → Data**
   - A browser image upload creates the region selector.
   - Dragging a deterministic region enables the save action.
   - Saving creates one confirmed local catch.
   - Atlas progress becomes 1/10 and the photo journal renders.
   - Data view exposes export and reports the stored photo/detection.

## Repository/build guards

Node tests also verify that every browser asset referenced by the static UI is included in the explicit build-copy contract and that the documented semantic AI operations remain present in `openapi.json`.

This build guard exists because Netlify can successfully deploy `dist` even when a newly referenced root CSS/JS file was accidentally omitted from the build copy list.

## CI and merge gate

`.github/workflows/ci.yml` runs on pull requests and pushes to `main`:

1. install dependencies;
2. run Node tests;
3. build `dist`;
4. install Playwright Chromium;
5. run the mobile smoke suite.

Before squash-merging a feature branch, require:

- CI green for the exact PR head;
- Netlify Deploy Preview successful for the exact PR head;
- no unresolved known regression in Learn, Quiz, Catch, Atlas, or Data.

The browser tests are the repeatable smoke gate. Manual preview inspection remains useful for visual judgment, but it is not the only verification mechanism.
