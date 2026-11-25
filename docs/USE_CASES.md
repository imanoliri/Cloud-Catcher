# Cloud Catcher use cases

Status reflects the current application (`main`).

| Use case | Status | Current behavior | Main gap |
| --- | --- | --- | --- |
| Learn and quiz Level 1 | Works | Theory, reference examples and two deterministic practice modes; practice never changes progress. | No mastery history or spaced repetition. |
| Catch from a photo (`F1`) | Works | Camera-first capture (`Take photo`) or file upload (`Choose photo`), EXIF timestamp/GPS hint parsing, touch/mouse region selection and explicit cloud-type validation. | No automatic GPS reverse-geocoding yet. |
| Several clouds in one photo (`F2`) | Works | Existing saved and proposed regions render directly over the photo and can be tapped/redrawn in place without duplicating the original image. | Polygons via UI drawing not yet added (API supports polygons). |
| AI-assisted batch import | Works | Local `window.cloudCatcher.importCloudPhotos` and LifeOS `/api/clouds` tailnet sync write into one canonical atlas format (`format: "cloud-catcher"`). | Standalone Netlify site remains offline-first without server-side AI inference. |
| Review AI proposals (`F3`) | Works | Atlas shows a `Needs Review` queue with confidence, explanations, clickable lookalike alternatives, editable genus/notes, **Redraw**, **Confirm**, and **Reject**. | Needs cloud-spotter Live Run to populate automatically from Cyrus (`LifeOS#190`). |
| Browse Atlas and observation detail (`F4`, `F11`) | Works | Filter by status (`All`/`Confirmed`/`Needs Review`), genus, and location; tap any detection or Level-1 card for full Observation Detail (`Crop` vs `Full photo & regions`, sibling catches, inline edit/confirm/reject). | Timeline/map aggregations remain future work (`F9`–`F11`). |
| Complete Level 1/location | Partial | Unique confirmed genera are counted globally and by exact location. | No Level 2, celebration, or location alias normalization. |
| Sessions | Partial | Domain and batch import support sessions. | No session-management UI. |
| Export and restore (`F5`) | Works | Shows approximate atlas size and storage quota when supported; Export opens the system share/save sheet (or downloads JSON); Import uses the system file picker. | Large libraries remain subject to device storage quotas. |
| Keep data across deployments | Works | IndexedDB remains on the same site origin across static deployments; when served under LifeOS (`/cloud-catcher/`), `LifeOsStorageProvider` syncs with the private tailnet atlas. | Unlinked browser origins do not share IndexedDB. |

## Verified rules

1. One original photo can contain multiple detections.
2. Proposed/rejected detections do not advance progress.
3. Level and location progress count unique confirmed genera.
4. Regions support normalized rectangles and polygons.
5. Manual, LifeOS tailnet sync, and browser-API writes enter the same atlas schema.
6. Snippets are generated locally.
7. Existing localStorage data migrates to IndexedDB.
8. Static Netlify hosting performs zero hosted user-data reads or writes.
9. Learn and Quiz never create catches.
