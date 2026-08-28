# Cloud Catcher use cases

Status reflects the current browser-local MVP.

| Use case | Status | Current behavior | Main gap |
| --- | --- | --- | --- |
| Learn and quiz Level 1 | Works | Theory, reference examples and two deterministic practice modes; practice never changes progress. | No mastery history or spaced repetition. |
| Catch from a photo | Works | Touch/mouse region selection plus an explicit cloud-type choice creates a confirmed detection. Save shows immediate progress and completion feedback; the crop is rendered locally from the original photo. | No direct camera action yet. |
| Several clouds in one photo | Works | The original stays active and owns multiple normalized detections. | Saved regions cannot yet be edited visually. |
| AI-assisted batch import | Partial | An authorized browser agent can call `window.cloudCatcher.importCloudPhotos` with many local files and detections. | No in-app analysis button and no remote connector. |
| Review AI proposals | Partial | Proposed status is represented and excluded from progress; browser API can correct it. | Normal review UI is missing. |
| Browse Atlas and journal | Works | Cards, crops, originals, progress and location collections use one local library. | Search, filtering and observation detail are missing. |
| Complete Level 1/location | Partial | Unique confirmed genera are counted globally and by exact location. | No Level 2, celebration, or location alias normalization. |
| Sessions | Partial | Domain and batch import support sessions. | No session-management UI. |
| Export and restore | Works | Export opens the system share/save sheet when file sharing is supported, otherwise downloads the self-contained JSON. Import uses the system file picker, including available Drive providers. | Import replaces the current atlas; large libraries may produce large backup files. |
| Keep data across deployments | Works | IndexedDB remains on the same site origin across static deployments and branch updates. | Different preview hostnames, browsers and devices do not share data. |
| Use through AI/API | Partial | The local `window.cloudCatcher` API supports structured ingestion and correction without a second atlas. | Agent needs an authorized browser session or must generate an import archive. |

## Verified rules

1. One original photo can contain multiple detections.
2. Proposed/rejected detections do not advance progress.
3. Level and location progress count unique confirmed genera.
4. Regions support normalized rectangles and polygons.
5. Manual and browser-API writes enter the same IndexedDB atlas.
6. Snippets are generated locally.
7. Existing localStorage data migrates to IndexedDB.
8. No hosted user-data read or write occurs.
9. Learn and Quiz never create catches.

## Current core loop

Learn → Quiz → choose a real photo → select and classify one or more regions → browse Atlas → export a backup from Data.

For AI-assisted batches, the agent classifies locally available photos and calls `window.cloudCatcher.importCloudPhotos` inside the page. Future work is tracked in [`../FUTURE.md`](../FUTURE.md).
