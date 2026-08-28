# Future use cases

This document tracks user journeys Cloud Catcher should support but does **not** yet support end to end. The current implementation audit lives in [`docs/USE_CASES.md`](docs/USE_CASES.md).

## Priority 1 — Make the basic field workflow complete

### F1 — Take a photo directly from the phone

**Goal:** Open Cloud Catcher outdoors, launch the camera directly, take a photo and continue immediately to classification.

**Acceptance criteria:**
- Catch screen offers a camera-first action on supported mobile devices.
- Newly captured image appears immediately in the classification flow.
- Existing file-picker upload remains available.

### F2 — Edit and visualize saved cloud regions

**Goal:** Build on the implemented gesture rectangle selector so multiple saved regions on one photo can be reviewed and adjusted visually.

**Acceptance criteria:**
- Existing saved regions are overlaid on the original photo with genus/status labels.
- User can tap a saved region and move/resize it.
- User can redraw a mistaken region without deleting/recreating the observation manually.
- Multiple overlapping regions remain understandable.
- Region coordinates continue to use the existing normalized domain model.
- Later extension can support polygon/freeform drawing when rectangular crops are insufficient.

### F3 — Complete proposal review UI

**Goal:** Review AI detections without touching an API.

**Acceptance criteria:**
- Proposed crop opens in a review view.
- User can Confirm, Reject, or Correct genus.
- User can edit confidence/notes when useful.
- User can redraw the region.
- Confirming immediately updates Atlas/location progress.
- Rejected proposals disappear from collection views but remain represented in the data model as rejected.

### F4 — Individual observation detail screen

**Goal:** Open one detected cloud as a complete observation.

**Acceptance criteria:**
- Shows full crop and original photo.
- Shows genus, status, confidence, date, location, notes and source.
- Shows other detections from the same photo.
- Offers edit/review actions where appropriate.

### F5 — Storage visibility and quota management

**Goal:** Help users understand and manage a growing IndexedDB photo atlas.

**Acceptance criteria:**
- Show approximate local storage use and available quota when the browser exposes it.
- Warn before storage pressure can make new catches fail.
- Offer safe image downsampling and cleanup without breaking detections.
- Keep export/import self-contained and preserve the automatic localStorage migration.

## Priority 2 — Make AI assistance a first-class product flow

### F6 — “What is this cloud?”

**Goal:** Upload/capture one image and have Cloud Catcher propose cloud genera automatically.

**Acceptance criteria:**
- One user action requests analysis.
- Multiple cloud regions may be proposed from one image.
- Every proposal includes genus, crop/region, confidence and a short explanation.
- Similar/confusable genera can be shown as alternatives.
- Results enter the normal proposal review flow; they do not count until confirmed unless an explicit confidence/review policy says otherwise.

### F7 — Analyze a batch/session from the UI

**Goal:** Import an outing with many photos without an external API client.

**Acceptance criteria:**
- Select multiple photos.
- Create or infer one session.
- Run AI analysis over the batch.
- Show all proposals in a review queue.
- Persist originals once and detections separately.

### F8 — Suggest what to catch next today

**Goal:** Turn missing genera into a useful real-world objective.

**Acceptance criteria:**
- Starts from the user's missing confirmed genera.
- Optionally considers current/local cloud/weather conditions.
- Returns a small ranked set of plausible targets with identification clues.
- Never marks anything caught without a real confirmed observation.

## Priority 3 — Make the collection browsable as a real archive

### F9 — Location detail pages

**Goal:** Open a place such as San Sebastián and see the cloud history there.

**Acceptance criteria:**
- Shows caught/missing genera and completion status.
- Shows all photos, detections and sessions at that location.
- Supports location aliases/normalization so spelling variants do not accidentally create separate collections.

### F10 — Session/outing pages

**Goal:** Replay one cloud-watching outing as a coherent gallery.

**Acceptance criteria:**
- User can create, rename and edit sessions from the UI.
- Session page shows chronological photos and detections.
- Photos can be moved between sessions.
- Batch imports expose their created session in the UI.

### F11 — Search, filter and sort the journal

**Goal:** Find old observations quickly.

**Acceptance criteria:**
- Filter by genus, location, status, date/session and confidence.
- Sort newest/oldest and optionally by confidence.
- Unclassified photos remain discoverable.

### F12 — Optional Google Drive backup and synchronization

**Goal:** Carry the same user-owned atlas across devices without creating a second collection.

**Acceptance criteria:**
- Connection and every initial upload are explicitly authorized by the user.
- Browser and Drive represent one logical library with documented conflict handling.
- The browser remains an offline-capable cache.
- Export/import remains a provider-independent recovery path.
- Disconnecting Drive does not delete the local atlas.

## Priority 4 — Complete the game/learning progression

### F13 — Level 2 and deeper taxonomy

**Goal:** Completing Level 1 should unlock more detailed cloud learning rather than ending the game.

**Acceptance criteria:**
- Taxonomy supports deeper children under Level 1 genera.
- UI clearly explains the newly unlocked level.
- Progress is calculated independently per level/subtree.
- Existing Level 1 observations remain valid.

### F14 — Reclassify old photos at deeper levels

**Goal:** Existing photographs gain new learning value as the user progresses.

**Acceptance criteria:**
- Old observations can receive finer classifications later.
- Finer detections link back to the same original photo/region where appropriate.
- Reclassification never destroys the historical broader classification without an explicit correction.

### F15 — Nested location challenges

**Goal:** Make familiar locations long-running collection challenges.

**Acceptance criteria:**
- A location can have separate completion for Level 1, Level 2 and later levels.
- Location cards visually show progress by level.

### F16 — Completion rewards and next objective

**Goal:** Finishing a collection should feel like game progression.

**Acceptance criteria:**
- Level/location completion gets a clear celebration/state change.
- The next available taxonomy level or challenge is presented immediately.
- Progress never depends on reference images or unconfirmed proposals.

## Priority 5 — Personal cloud history and local profiles

### F17 — Timeline and seasonal history

Browse observations over months/years by date, season, genus, location and weather episode.

### F18 — Personal statistics

Show useful statistics such as most commonly caught genera, locations with most diversity, time to complete a level, and seasonal patterns. Avoid turning uncertain/proposed detections into authoritative statistics.

### F19 — Rarity / notable catches

Allow taxonomy or rules to identify unusually interesting observations, while keeping the core learning game understandable for beginners.

### F20 — Data-driven location cloud profiles

**Goal:** Build a profile for a location from the user's own confirmed observations instead of hard-coding which clouds are expected there.

The profile should be derived from existing photo/session metadata and detections. Location and observation time should come from photo metadata where available, and all cloud detections from the same image remain linked so the system can learn which cloud genera appear together.

**Potential derived statistics:**
- Frequency of each cloud genus at a location.
- Number of observations and sessions supporting each statistic.
- Distribution by month, season and optionally time of day.
- Changes in observed cloud mix through the year.
- Diversity of cloud genera observed at each location.
- Confidence/review-aware statistics that primarily use confirmed observations.

**Important interpretation:** this initially represents **“clouds you have observed here”**, not an objective climatological statement about what clouds normally occur at that location. The UI should communicate sample size and avoid presenting sparse personal data as authoritative climate information.

### F21 — Cloud co-occurrence analysis

**Goal:** Learn which cloud genera tend to occur together in one sky or weather episode.

**Derivation:**
- Same-photo co-occurrence: two or more confirmed genera detected in one original image.
- Same-session co-occurrence: genera observed during the same outing/weather episode even if they occur in different photos.
- Location-specific co-occurrence: relationships calculated separately for places with sufficient data.
- Seasonal co-occurrence: optionally compare relationships by month or season when enough observations exist.

**Possible UI:**
- “Often seen together” on a cloud detail page.
- A simple pair-frequency table or network/graph.
- Statements such as “In your San Sebastián observations, Stratocumulus often appears with Altocumulus,” always accompanied by the supporting observation count.

The analysis should be derived rather than persisted as canonical state so corrections to detections automatically update it.

### F22 — Personal observations vs regional climate profile

**Goal:** Eventually distinguish the user's empirical collection from a broader external picture of typical clouds for the area.

A future location page could show two clearly separate layers:
- **Your observations:** derived only from the user's photos, timestamps, sessions and confirmed detections.
- **Typical for this location:** optional external meteorological/climatological information from a trustworthy source.

The application should never silently blend these datasets. External climate information should remain attributable to its source and should not alter collection progress.

### F23 — Metadata-assisted observation context

**Goal:** Reduce manual entry and improve the quality of location/time analytics.

**Potential behavior:**
- Read photo capture time from EXIF metadata when available.
- Read GPS coordinates from EXIF when available and let the user confirm or correct the interpreted location.
- Group photos captured close together in time/place into a suggested session or weather episode.
- Preserve explicitly entered user metadata over inferred metadata when they conflict.
- Keep working when metadata is absent or has been stripped by messaging/social applications.

This feature would improve seasonal, location and co-occurrence analytics without requiring extra work for every uploaded photo.

## Architecture constraints for future work

Future features should preserve these existing decisions:

1. **One original photo, many detections.** Do not duplicate images per cloud type.
2. **Reference / proposed / confirmed remain distinct.** Only confirmed real observations advance progress.
3. **Domain state stays separate from presentation.** UI features should use domain/browser-API operations rather than encode separate progress rules.
4. **One logical atlas.** IndexedDB is the MVP store; Google Drive and future providers may back up or synchronize that same user-owned library, never create silently merged parallel collections.
5. **AI is an assistant, not a parallel database.** AI-produced detections use the same normal detection model and review flow.
6. **Derived analytics stay derived.** Frequencies, seasonal profiles, co-occurrence relationships and similar statistics should normally be recomputed from canonical photos/sessions/detections rather than stored as duplicate truth.
7. **Personal observations and external climatology stay distinct.** Do not present sampling-biased personal catches as objective local climate data, and do not mix external weather datasets into collection progress.
8. **Keep the MVP understandable.** Prefer completing the field-observation loop before adding social, competitive or highly elaborate mechanics.
9. **Static hosting stays data-free.** Do not store personal photos or atlas records in Netlify Blobs or expose unauthenticated remote mutations.

## Priority 6 — Learning mastery

### F24 — Quiz mastery and spaced repetition

**Goal:** Build on the current stateless image-identification and definition quizzes so practice adapts to what the user actually finds difficult.

**Acceptance criteria:**
- Track practice results separately from real Cloud Atlas catches.
- Show optional accuracy/streak history without turning practice into collection progress.
- Prefer genera the user frequently confuses while still revisiting mastered genera.
- Keep both current quiz modes available: image → genus and genus → definition.
- Allow resetting practice history without affecting photos, detections, sessions, albums, or location progress.
