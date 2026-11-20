import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import hljs from 'highlight.js';
import puppeteer from 'puppeteer-core';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SHOTS = path.join(ROOT, 'docs', 'shots');
fs.mkdirSync(SHOTS, { recursive: true });

const CHROME = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const shots = [
  { name: 'code-01-hooks.png', segments: [['src/App.jsx', 59, 84]] },
  { name: 'code-02-create.png', segments: [['src/App.jsx', 180, 207]] },
  {
    name: 'code-03-update-delete.png',
    segments: [
      ['src/components/LiveMealCard.jsx', 28, 33],
      ['src/components/LiveMealCard.jsx', 244, 247]
    ]
  },
  {
    name: 'code-04-geo.png',
    segments: [
      ['src/hooks/useGeolocation.js', 9, 19],
      ['src/hooks/useGeolocation.js', 103, 126]
    ]
  },
  { name: 'code-05-camera.png', segments: [['src/components/MealCamera.jsx', 23, 36]] },
  {
    name: 'code-06-pwa.png',
    segments: [
      ['src/main.jsx', 7, 14],
      ['public/sw.js', 1, 16]
    ]
  }
];

function readSegment(rel, start, end) {
  const lines = fs.readFileSync(path.join(ROOT, rel), 'utf8').split('\n');
  return lines.slice(start - 1, end).join('\n');
}

function buildPage(title, code) {
  const highlighted = hljs.highlight(code, { language: 'javascript' }).value;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    * { box-sizing: border-box; }
    body { margin:0; background:#0b0f19; font-family:'Cascadia Code','Consolas','Courier New',monospace; }
    .win { width:1120px; background:#0d1320; border:1px solid #1e293b; border-radius:14px; overflow:hidden; }
    .bar { display:flex; align-items:center; gap:8px; padding:14px 18px; background:#111827; border-bottom:1px solid #1e293b; }
    .dot { width:13px; height:13px; border-radius:50%; }
    .fname { margin-left:10px; color:#94a3b8; font-size:16px; }
    pre { margin:0; padding:22px 24px; font-size:20px; line-height:1.55; color:#e2e8f0; white-space:pre; }
    .hljs-keyword { color:#c084fc; }
    .hljs-string { color:#86efac; }
    .hljs-comment { color:#64748b; font-style:italic; }
    .hljs-number { color:#fbbf24; }
    .hljs-title { color:#7dd3fc; }
    .hljs-built_in { color:#f0abfc; }
    .hljs-attr { color:#7dd3fc; }
  </style></head><body>
    <div class="win" id="win">
      <div class="bar">
        <span class="dot" style="background:#ef4444"></span>
        <span class="dot" style="background:#f59e0b"></span>
        <span class="dot" style="background:#22c55e"></span>
        <span class="fname">${title}</span>
      </div>
      <pre><code>${highlighted}</code></pre>
    </div>
  </body></html>`;
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--no-sandbox']
});

for (const shot of shots) {
  let code = '';
  shot.segments.forEach((seg, i) => {
    if (i > 0) code += '// ...\n';
    code += readSegment(seg[0], seg[1], seg[2]);
    if (i < shot.segments.length - 1) code += '\n';
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1160, height: 900, deviceScaleFactor: 2 });
  await page.setContent(buildPage(shot.segments[0][0], code), { waitUntil: 'networkidle0' });
  const win = await page.$('#win');
  await win.screenshot({ path: path.join(SHOTS, shot.name) });
  await page.close();
  console.log('captured', shot.name);
}

await browser.close();
console.log('done');
