# NutriLive — Real-Time Meal & Nutrition PWA

A mobile-first, installable Progressive Web App for low-friction meal logging, live
nutrition summaries, GPS-based dining context and on-device meal photos. Built with
React 18 and Vite, fully usable offline, and persisted entirely on the device.

COMP10013 Dynamic Web Technologies — Coursework 01 (Part A report + Part B demonstration).

## 1. What the app does

| Feature | Where it lives | Module topic it demonstrates |
|---|---|---|
| Full CRUD on meal records | `src/App.jsx`, `src/components/LiveMealCard.jsx` | React state, controlled inputs |
| Live macro totals (calories, protein, caffeine) | `src/App.jsx` | Derived state, `useMemo` |
| On-device persistence across reloads | `src/db/db.js` (Dexie.js / IndexedDB) | On-device storage |
| GPS dining context (Home-Cooked vs Dining Out) | `src/hooks/useGeolocation.js` | Device API — Geolocation |
| Meal photo capture | `src/components/MealCamera.jsx` | Device API — MediaDevices / camera |
| Interactive location map | `src/components/MealMap.jsx` (Leaflet) | Geolocation visualisation |
| Installable, offline-first shell | `public/manifest.json`, `public/sw.js` | PWA — manifest + service worker |
| One-tap quick logging | `src/App.jsx` | Reusable presets and event handling |

## 2. Tech stack

| Layer | Choice | Why |
|---|---|---|
| UI | React 18 (function components + hooks) | Module content; hooks give small, reusable units |
| Build tool | Vite 6 | Fast dev server and small production bundles |
| Styling | Tailwind CSS 4 | Utility-first, mobile-first responsive layout |
| Icons | lucide-react | Consistent tree-shaken vector icons |
| Storage | Dexie.js over IndexedDB | Asynchronous structured records, supports photos |
| Map | Leaflet | Lightweight open-source interactive maps |
| Camera | react-webcam | React wrapper for `getUserMedia` |
| PWA | Web app manifest + custom service worker | Installability and offline app shell |

## 3. Project structure

```
nutrilive/
├── public/
│   ├── manifest.json          # PWA metadata, theme colour and icons
│   ├── sw.js                  # App shell cache and offline fetch handling
│   ├── icon.svg               # Vector fork icon
│   ├── icon-192.png           # 192x192 install icon
│   ├── icon-512.png           # 512x512 install icon
│   └── icon-maskable-512.png  # Maskable icon
├── src/
│   ├── main.jsx               # React root and service worker registration
│   ├── index.css              # Tailwind and global styles
│   ├── App.jsx                # Main container: state, totals, forms, presets
│   ├── db/
│   │   └── db.js              # Dexie schema, goals and seed data
│   ├── hooks/
│   │   └── useGeolocation.js  # watchPosition, Haversine distance, context
│   └── components/
│       ├── LiveMealCard.jsx   # Inline update and delete
│       ├── MealCamera.jsx     # Camera capture and upload fallback
│       └── MealMap.jsx        # Leaflet map and dining pins
├── index.html
├── vite.config.js
└── package.json
```

## 4. Getting started

### Prerequisites

- Node.js 18 or newer (developed on Node 22) and npm 9+
- A modern browser: Chrome / Edge 111+, Safari 16.4+, Firefox 115+

### Install and run

```bash
# 1. Clone the repository
git clone <your-repository-url>
cd nutrilive

# 2. Install dependencies
npm install

# 3. Start the dev server (http://localhost:5173)
npm run dev
```

### Production build and preview

```bash
npm run build     # outputs a static bundle to dist/
npm run preview   # serves dist/ at http://localhost:4173
```

The build includes `manifest.json`, `sw.js` and the icons, which make the output an
installable PWA. The service worker registers on a production build rather than in the
dev server.

## 5. Install it as an app

1. Open the deployed HTTPS URL (or `npm run preview`).
2. In Chrome / Edge, use the install icon in the address bar, or the browser menu and
   **Install NutriLive**.
3. Launch it from the home screen; it opens in standalone mode without browser chrome.
4. With the network set to offline, the cached app shell still launches and the stored
   meals remain available.

## 6. User guide

| Task | Steps |
|---|---|
| Quick log a meal | Tap a **1-Tap Quick Log** chip (e.g. Americano, Oat Latte) to add it instantly |
| Add a custom meal | Tap **+ Custom**, enter the name, type, calories, protein, caffeine and note, then **Save Entry** |
| Read and browse | View the daily energy dashboard and the list of meal cards for the selected date |
| Update a meal | Tap **Adjust**, then edit the title, type, sliders or note; changes save without a separate Save step |
| Delete a meal | Tap **Adjust**, then **Delete** |
| Take a meal photo | Tap **Adjust**, then **Camera**, capture the photo and attach it; use **Upload** if the camera is blocked |
| Check dining context | Move more than 60 m from the home anchor and the context switches to **Dining Out** |
| Set the home anchor | On the map, tap the home icon to save the current location as the kitchen |
| Change daily goals | Tap **Goals**, choose a preset or edit the calorie, protein and caffeine targets |

## 7. Device API notes

- **Geolocation** — `watchPosition()` runs inside `useEffect`, so location updates do not
  block the interface. The Haversine formula calculates the distance from a saved home
  anchor; displacement greater than 60 m is tagged Dining Out, otherwise Home-Cooked.
- **Camera** — `react-webcam` wraps `getUserMedia` and requests the rear camera with
  `facingMode: environment`. Captured images are compressed and stored on the device. A
  file input with `capture="environment"` provides a mobile fallback.
- Both APIs require a secure context (HTTPS or localhost).

## 8. Data model

```json
{
  "id": 1,
  "dateKey": "2026-11-20",
  "title": "Grilled Chicken & Avocado Bowl",
  "mealType": "Lunch/Dinner",
  "calories": 650,
  "protein": 46,
  "caffeine": 0,
  "note": "High-protein lunch bowl with brown rice and sesame dressing.",
  "diningContext": "Dining Out",
  "lat": 55.8458,
  "lon": -4.4241,
  "placeName": "High Street, Paisley",
  "photo": null,
  "updatedAt": 1732100000000
}
```

The Dexie database (`NutriLiveDB_v3`) contains a `meals` store and a `goals` store.
Default goals and two sample meals are seeded on first launch.

## 9. Deployment

Any static host works (Vercel, Netlify, Cloudflare Pages, GitHub Pages). HTTPS is
required for the Geolocation and camera APIs, with localhost as the only exception.

```bash
npm run build
# Deploy the dist/ folder to your chosen static host
```

## 10. Statement of AI use

Generative AI was used as an assistant during part of this work. The application's core
source code — the React components, custom hooks, the Dexie data layer and the
geolocation, camera and map integrations — was written by the author. AI was used to:

- draft the web app manifest and service worker, and the application icons;
- draft and structure this README;
- help produce the presentation slides and automate the screenshots, which are captured
  from genuine runs of the application and a real Lighthouse audit.

The author reviewed, adapted and verified every generated item and takes full
responsibility for the final content and correctness. No fabricated results, metrics or
references are included.
