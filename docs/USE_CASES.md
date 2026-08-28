# Cloud Catcher use cases

Cloud Catcher is intended to be a field game, learning tool, personal cloud atlas, and AI-assisted observation archive. This document records **what the current MVP actually supports**, not only the intended journeys.

Status meanings:

- **Works** — the current implementation has the main end-to-end behavior.
- **Partial** — important pieces exist, but the user journey is incomplete or fragile.
- **Not implemented** — keep as a future use case rather than presenting it as current behavior.

## Current MVP audit

| Use case | Status | What actually works today | Main gap |
| --- | --- | --- | --- |
| UC1 — Learn and practice the ten Level 1 genera | **Works** | Learn explains cloud formation, name parts, altitude/form combinations and reference examples. **Know them by sight** is collapsed by default. Quiz provides image → genus and genus → definition practice, including tap/hover help and non-shifting answer feedback. | Reference photos/diagrams are remotely hosted; offline reference-image support is not guaranteed. Quiz has no score/history or spaced repetition yet. |
| UC2 — Catch a cloud manually from a photo | **Partial** | Catch accepts an image, location, genus and confidence. The user drags directly over the photo with touch or mouse to select the cloud region; normalized coordinates are stored automatically and the confirmed crop appears in the Atlas. | This browser flow writes to local browser storage rather than the hosted API, and large image collections can hit `localStorage` limits. |
| UC3 — Identify several cloud types in one photo | **Works** | One photo remains loaded after a detection is saved. The selection clears, and the user can repeatedly select another region, classify it and save it. Every detection references the same original photo and stores its own normalized region. | Existing saved regions are not yet drawn together on the editor, and saved regions cannot yet be resized visually. |
| UC4 — Let an AI import a batch of cloud photos | **Partial** | `/api/catches/batch` and `/ai-tools/import-cloud-photos` support one multipart batch with photos, session metadata and detections. | Cloud Catcher itself does not run image recognition. An external AI/client must inspect the images and call the endpoint. There is no in-app “analyze these photos” button yet. |
| UC5 — Review an AI proposal | **Partial** | Proposed detections are visible, do not count toward progress, and can be corrected/confirmed/rejected through the API/domain layer. | The normal UI has no confirm/correct/reject controls. Review currently requires an API/AI client or developer-facing method. |
| UC6 — Browse the personal Cloud Atlas | **Works** | Confirmed, proposed and missing genera are visually distinct; missing genera use reference photos; tiles open in a large viewer. | The viewer is genus-centric rather than a complete observation-detail screen. |
| UC7 — Browse the photo journal | **Works** | Stored photos stay visible even when unclassified; detections have snippet thumbnails and labels. | No filtering, sorting, full observation viewer or editing from the journal yet. |
| UC8 — Find what to catch next | **Partial** | Progress logic returns `missingIds`; missing genera are visible as reference cards; the AI tool can query missing genera. | There is no dedicated “what should I catch next?” UI or ranked recommendation. |
| UC9 — Complete Level 1 | **Partial** | The domain correctly counts unique **confirmed** genera and marks Level 1 complete at 10/10. | There is no Level 2 taxonomy/unlock flow yet, so completion currently ends at the status indicator. |
| UC10 — Build a location collection | **Partial** | Progress can be calculated per location and location cards show counts/completion. | There is no dedicated location screen, map, location normalization or merge flow for spelling variants. |
| UC11 — Group an outing into a session | **Partial** | Sessions exist in the domain/API and batch imports can create a session containing multiple photos. | The normal UI cannot create, browse or edit sessions. |
| UC12 — Export and restore the collection | **Partial** | The Data screen exports/imports the browser library JSON. | Hosted images are represented by URLs rather than embedded image bytes, so the exported JSON is not yet a fully self-contained backup of hosted media. Browser image storage also relies on `localStorage`. |
| UC13 — Use Cloud Catcher through an AI/API | **Works** | REST endpoints, semantic `/ai-tools`, OpenAPI and MCP endpoints are implemented over the same hosted data model. | Actual usability depends on the external client being able to call write-capable custom APIs/MCP. The web UI does not configure clients for the user. |

## Verified implementation rules

The following important rules are directly implemented in the domain/API and covered by current code/tests or UI behavior:

1. A single photo can contain multiple detections.
2. Proposed detections do not advance collection progress.
3. Level progress counts unique confirmed cloud genera.
4. Progress can be calculated for a particular location.
5. Sessions can group multiple photos.
6. Detection status can be `proposed`, `confirmed`, or `rejected`.
7. Detection regions support normalized rectangles and polygons.
8. Hosted detections can generate cropped snippet images from the original uploaded photo.
9. The manual Catch flow maps touch/mouse rectangle gestures to normalized detection coordinates.
10. After saving one region, the same original image stays active so additional regions can be caught without re-uploading it.
11. Learn and Quiz practice do not create catches or change collection progress.
12. Quiz result feedback overlays the answer area and does not push the image or following layout downward.
13. The **Know them by sight** reference section starts collapsed and expands on demand.

## Core loop that is genuinely usable now

1. Open **Learn** for the Level 1 theory/reference guide.
2. Use **Quiz** to practice image recognition and definitions without affecting progress.
3. Take a cloud photo with the phone/camera app.
4. Open **Catch** and choose the photo.
5. Drag a rectangle around one cloud or cloud region in the photo.
6. Choose the genus and save that selected region as a confirmed catch.
7. If the same image contains another cloud, drag over the next region and classify it separately.
8. Repeat as many times as useful on that same original image.
9. Open **Atlas** to see confirmed crops replace reference examples.
10. Use the missing reference cards/progress count to decide what to look for next.
11. Use **Data** when you want to export/import the portable browser library.

For larger batches, the more effective current path is an external AI/API client using `POST /api/catches/batch` rather than manual entry.

## Product principle

**One original photo may contain many independently classified regions. Reference examples teach the user what to look for. Proposed identifications help review uncertain observations. Only confirmed real observations advance the collection.**

Future and incomplete journeys are tracked in [`../FUTURE.md`](../FUTURE.md).

## Deterministic smoke-test coverage

The current mobile Playwright suite verifies the main pre-merge journeys against the built static site: Learn layout/collapse behavior, Quiz navigation/tooltips/quotes/option spacing/non-shifting feedback, Catch region selection and save, Atlas progress, and Data availability. See [`TESTING.md`](TESTING.md) for the exact contract.
