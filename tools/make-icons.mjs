import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import puppeteer from 'puppeteer-core';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CHROME = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const iconUrl = pathToFileURL(path.join(ROOT, 'public', 'icon.svg')).href;

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--no-sandbox']
});

async function render(size, maskable, out) {
  const pg = await browser.newPage();
  await pg.setViewport({ width: size, height: size, deviceScaleFactor: 1 });

  if (maskable) {
    const body =
      '<body style="margin:0;background:#0b0f19;display:flex;align-items:center;justify-content:center;height:100vh">' +
      `<img src="${iconUrl}" style="width:78%;height:78%"></body>`;
    await pg.goto('data:text/html,' + encodeURIComponent(body), { waitUntil: 'networkidle0' });
  } else {
    await pg.goto(iconUrl, { waitUntil: 'networkidle0' });
  }

  await pg.screenshot({ path: out });
  await pg.close();
  console.log('rendered', out);
}

await render(192, false, path.join(ROOT, 'public', 'icon-192.png'));
await render(512, false, path.join(ROOT, 'public', 'icon-512.png'));
await render(512, true, path.join(ROOT, 'public', 'icon-maskable-512.png'));

await browser.close();
console.log('done');
