# Tools

Development and report helper scripts. These are **not** part of the running application; they
generate the icons and the figures used in the report and stored under [`../docs/shots`](../docs/shots).

## Prerequisites

- A local installation of Google Chrome (the scripts drive it through `puppeteer-core`).
- The helper packages installed as dev dependencies:

```bash
npm install --save-dev puppeteer-core highlight.js
```

Optional environment variables:

| Variable | Default | Purpose |
|---|---|---|
| `CHROME_PATH` | `C:\Program Files\Google\Chrome\Application\chrome.exe` | Full path to the Chrome executable |
| `BASE_URL` | `http://localhost:5173/` | App URL the screenshot scripts open |

## Scripts

| Script | Output | What it does |
|---|---|---|
| `make-icons.mjs` | `public/icon-192.png`, `icon-512.png`, `icon-maskable-512.png` | Rasterises `public/icon.svg` into the PWA icon set |
| `shoot-basic.mjs` | `docs/shots/01-home.png` | Home dashboard with progress, guidance, map and quick log |
| `shoot-edit-cam.mjs` | `docs/shots/02-live-edit.png`, `03-camera.png` | Inline editor and camera capture |
| `shoot-gps-offline.mjs` | `docs/shots/04-gps.png`, `05-offline.png` | Simulated ~300 m displacement and offline mode |
| `shoot-lighthouse.mjs` | `docs/shots/06-lighthouse.png` | Scores section of `docs/lighthouse-report.html` |
| `shoot-ci.mjs` | `docs/shots/07-ci.png` | Public GitHub Actions run list |
| `gen-code-shots.mjs` | `docs/shots/code-01..06.png` | Syntax-highlighted real source excerpts |

## Usage

```bash
# 1. Start the app in one terminal
npm run dev

# 2. Run a script from the repository root (or from this folder)
node tools/shoot-basic.mjs
```

The UI and code scripts write into `docs/shots/`; `make-icons.mjs` writes into `public/`.
