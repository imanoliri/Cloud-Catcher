# Cloud Catcher use cases

Cloud Catcher should be understood as a small field game, learning tool, personal cloud atlas, and AI-assisted observation archive. This document describes the main user journeys the product should support and separates current MVP behavior from future directions.

## Core loop

The central loop is:

1. See a cloud in the real world.
2. Take one or more photos.
3. Identify one or more cloud types in each photo, manually or with AI help.
4. Store the original photo once and attach detections to regions of that photo.
5. Add confirmed detections to the Cloud Atlas.
6. See what cloud genera are still missing.
7. Keep observing until a level or location collection is complete.

The product should always make a clear distinction between a **reference example**, a **proposed identification**, and a **confirmed catch**.

## MVP use cases

### UC1 — Learn what the ten Level 1 cloud genera look like

**Goal:** A user who knows little about clouds can browse the Level 1 Atlas and learn the basic visual differences.

**Flow:**
- Open the Atlas.
- See all ten genera in a grid.
- Uncaught genera show real reference photographs, clearly marked `Reference example — not your catch`.
- Tap a tile to open a larger image and read the name, family, clue, and status.

**Success:** The Atlas works as a compact field guide even before the user has caught anything.

### UC2 — Catch a cloud manually from a photograph

**Goal:** The user has a cloud photograph and wants to add a confirmed observation themselves.

**Flow:**
- Open Catch.
- Choose a photo.
- Enter or confirm the location.
- Select a cloud genus.
- Optionally define the crop/region containing that cloud.
- Save the detection as confirmed.

**Success:** The original photo is stored once, the detection is attached to it, and the matching Atlas genus uses the user's crop instead of the reference example.

### UC3 — Identify several cloud types inside one photograph

**Goal:** A sky photograph contains more than one cloud genus.

**Flow:**
- Upload/store the photo once.
- Add multiple detections referencing different normalized regions of the same image.
- Each detection may have its own genus, confidence, status, and crop.

**Success:** One physical photo can contribute several individual cloud observations without duplicating the original image.

### UC4 — Let an AI import a batch of cloud photos

**Goal:** The user gives an AI several photos from one outing and wants Cloud Catcher populated automatically.

**Flow:**
- AI visually examines the images.
- AI identifies cloud regions and assigns genera/confidence.
- AI groups the images into one session when appropriate.
- AI calls the semantic import tool or the batch REST endpoint once.
- Uncertain detections are marked proposed; strong identifications can be confirmed.

**Success:** The user can say, in effect, `Add these photos to Cloud Catcher`, without manually entering every detection.

### UC5 — Review an AI proposal

**Goal:** The AI thinks a cloud may be a particular genus, but the identification is uncertain.

**Flow:**
- Proposed detections are visible in the Atlas and photo journal.
- Their actual crop is shown, but the status says `Proposed` / `Awaiting confirmation`.
- The user or another AI can confirm, correct, or reject the detection.

**Success:** Proposed detections help the user learn and review observations but do not falsely advance collection progress.

### UC6 — See the personal Cloud Atlas

**Goal:** The user wants a visual overview of what they have caught.

**Flow:**
- Open Atlas.
- Browse the ten Level 1 genera in an image grid.
- Confirmed genera display the user's own cloud crop.
- Proposed genera display the proposed user crop with its status.
- Missing genera display a greyed real reference photo.
- Tap a tile to open it large.

**Success:** The user can immediately distinguish caught, proposed, and missing cloud types.

### UC7 — Browse the photo journal

**Goal:** The user wants to inspect the original photographs rather than only the genus collection.

**Flow:**
- Open the Photo journal inside Atlas.
- Every stored photo appears, including photos with zero detections.
- The original filename and location remain visible.
- Each non-rejected detection beneath the photo gets its own snippet thumbnail and label.

**Success:** No stored photograph disappears merely because it is unclassified.

### UC8 — Find what to catch next

**Goal:** The user is outside looking at the sky and wants a simple next objective.

**Flow:**
- Cloud Catcher calculates Level 1 progress from confirmed detections.
- Missing genera are exposed in the UI/API.
- The user or AI can ask which cloud types are still missing.

**Success:** The collection mechanic creates a reason to keep looking at the sky.

### UC9 — Complete Level 1

**Goal:** Catch all ten principal cloud genera.

**Rule:** Only confirmed detections count.

**Success:** Once all ten unique Level 1 genera have at least one confirmed detection, Level 1 is complete and the next classification level can eventually unlock.

### UC10 — Build a location collection

**Goal:** Complete the same cloud collection in a specific place, for example San Sebastián.

**Flow:**
- Every photo has a location.
- Confirmed detections inherit the photo's location for progress purposes.
- Cloud Catcher separately calculates which genera have been caught at each location.

**Success:** Catching all ten Level 1 genera at one location unlocks/completes that location's Level 1 card.

### UC11 — Group an outing into a session

**Goal:** Keep related photos together, such as one walk, trip, storm, or afternoon of cloud watching.

**Flow:**
- Create or infer a session with shared location/date/notes.
- Attach multiple photos to it.
- Individual photos and detections still remain independently addressable.

**Success:** The collection can later be explored by outing/weather episode as well as by genus and location.

### UC12 — Export and restore the collection

**Goal:** The user's observations should not be trapped in one browser or hosting provider.

**Flow:**
- Export the complete Cloud Catcher library.
- Store the archive elsewhere.
- Import it later into another Cloud Catcher installation/browser.

**Success:** The portable library remains the canonical user-owned representation of the collection.

### UC13 — Use Cloud Catcher through an AI/API rather than the UI

**Goal:** An AI assistant or external application manages the user's collection.

**Flow:**
- Discover semantic tools through `/ai-tools`, `/openapi.json`, or `/mcp`.
- Import photos, add/correct detections, query missing clouds, or retrieve progress.
- Use lower-level `/api/*` endpoints when required.

**Success:** The human UI and AI clients operate on the same domain model rather than separate collections.

## Near-term use cases worth adding

These fit the existing architecture but are not yet complete MVP journeys.

### UC14 — Take a photo directly from a phone

Open Cloud Catcher outdoors, launch the phone camera from the Catch screen, take a photo, and immediately classify/import it without first managing a file manually.

### UC15 — Ask `What is this cloud?`

The user uploads one image and receives AI proposals with highlighted regions, explanations, confidence, and comparison against similar genera before deciding whether to confirm them.

### UC16 — Open an individual observation

Tap any detection thumbnail to see the crop at full size together with the original photo, date, location, confidence, notes, review status, and other detections from the same sky.

### UC17 — Explore by place

Open `San Sebastián`, `Braunschweig`, or another location and see its photos, caught genera, missing genera, completed level cards, and sessions.

### UC18 — Explore by outing/session

Open one session and replay the sky from that outing as a chronological photo gallery with all detected cloud types.

### UC19 — Correct bad AI data easily

From the image viewer, change a genus, redraw a region, merge/delete duplicate detections, or mark a proposal rejected without touching JSON/API calls.

### UC20 — Suggest what to look for today

Combine the user's missing genera with local weather/cloud conditions and suggest realistic catches for the day, e.g. `Altocumulus is plausible this afternoon; Cirrus is also worth watching for.`

## Future fractal-learning use cases

### UC21 — Unlock deeper taxonomy levels

After Level 1 is complete, each broad genus can open into finer species/varieties/features. The same observation model remains usable because taxonomy IDs are data-driven and hierarchical.

### UC22 — Revisit old photos when a deeper level unlocks

When the user learns a finer classification, existing photos can be re-examined and receive new deeper-level detections instead of requiring entirely new photographs.

### UC23 — Earn nested location cards

A location can have separate completion cards for Level 1, Level 2, and deeper levels, making familiar places long-running cloud-spotting challenges.

### UC24 — Build a personal cloud history

Over months or years, browse cloud observations by date, season, location, genus, weather episode, or rarity and see how the personal atlas grows.

## Product principles implied by these use cases

1. **Real observations come first.** Reference images teach; they never masquerade as catches.
2. **One photo may contain many clouds.** Photo storage and detections remain separate concepts.
3. **Uncertainty is visible.** Proposed and confirmed identifications are meaningfully different.
4. **Progress is earned from confirmed real observations.** Reference examples and proposals do not complete collections.
5. **The Atlas is both collection and field guide.** It should be useful before, during, and after an observation.
6. **AI should reduce data entry, not create a second product.** AI and humans use the same photos, detections, sessions, taxonomy, and progress rules.
7. **The user's collection should remain portable.** Browser storage, Netlify, Google Drive, and future providers are adapters around the same data.
