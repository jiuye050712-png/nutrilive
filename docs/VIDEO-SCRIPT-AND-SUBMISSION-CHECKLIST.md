# Part B — Demonstration Video Script & Submission Checklist

This document plans the Part B screen recording for NutriLive and lists the final checks
before submission. It is a working script; the actual recording must show the real running
application.

## Video requirements

- Record the screen (and optionally voice) while operating the genuine app.
- Show the application clearly at a mobile viewport; keep each step visible long enough to
  read.
- Identify the work at the start: course code, name, Banner ID and the app name.
- Keep to the duration and file format stated in the assessment brief.

## Opening (0:00 – 0:15)

- State: COMP10013 Dynamic Web Technologies, Jiating Zhang, B01857710, **NutriLive**.
- Open the app and show the home dashboard: progress ring, daily guidance, map and the
  1-Tap Quick Log chips.

## Scene 1 — Quick logging and live totals (0:15 – 0:40)

1. Tap a Quick Log chip (e.g. Americano).
2. Show the new meal card appearing and the calorie / protein / caffeine totals updating
   immediately.
3. Point out the derived totals recalculating from the current meal list.

## Scene 2 — Create a custom meal (0:40 – 1:10)

1. Open **+ Custom**.
2. Fill the controlled fields: name, type, calories, protein, caffeine and note.
3. Save and show the new record in the list.

## Scene 3 — Inline update and delete (1:10 – 1:45)

1. Tap **Adjust** on a card to expand the inline editor.
2. Move a slider and edit the title / note; show the change saving without a separate Save
   step.
3. Tap **Delete** and confirm the card disappears and totals recalculate.

## Scene 4 — Geolocation and map (1:45 – 2:20)

1. Show the Leaflet map and the current Home-Cooked context.
2. Simulate a position more than 60 m from the home anchor.
3. Show the Haversine distance and the context switching to **Dining Out**.

## Scene 5 — Camera capture (2:20 – 2:50)

1. Inside an expanded card, open **Camera**.
2. Show the live preview, capture a photo and attach it.
3. Mention the **Upload** fallback for when the camera is blocked.

## Scene 6 — Offline mode and PWA (2:50 – 3:20)

1. Switch the network to offline; show the **Offline Mode** badge.
2. Reload and show the cached app shell launching and the stored meals still present.
3. Show the installable manifest / standalone behaviour.

## Closing (3:20 – 3:30)

- Summarise the demonstrated features and the verified build, then end the recording.

## Submission checklist

| # | Item | Confirmed |
|---|---|---|
| 1 | Part A presentation complete with real screenshots and no placeholders | |
| 2 | Part B video recorded, named correctly and within the required length/format | |
| 3 | Public repository accessible 24/7 with versioned commits | |
| 4 | Live HTTPS URL working (`https://nutrilive.vercel.app`) | |
| 5 | Manifest, service worker and icons present and reachable | |
| 6 | CI run green on the latest `main` | |
| 7 | Lighthouse report included and metrics accurate | |
| 8 | Student declaration submitted as a separate file | |
| 9 | AI use statement truthful and consistent across deliverables | |
| 10 | All files named with Banner ID where the brief requires it | |
