import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SHOTS = path.join(ROOT, 'docs', 'shots');
const CHROME = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = process.env.BASE_URL || 'http://localhost:5173/';

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: [
    '--use-fake-ui-for-media-stream',
    '--use-fake-device-for-media-stream',
    '--no-sandbox'
  ]
});

const page = await browser.newPage();
await page.setViewport({
  width: 430,
  height: 932,
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true
});

const client = await page.target().createCDPSession();
await client.send('Browser.grantPermissions', {
  permissions: ['geolocation', 'videoCapture', 'notifications']
});

await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 1800));

// Open the first card's inline editor
await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim().startsWith('Adjust'));
  b.click();
});
await page.waitForFunction(() =>
  [...document.querySelectorAll('button')].some((x) => x.textContent.includes('Delete'))
);
await new Promise((r) => setTimeout(r, 800));

// Scroll the expanded article to the top of the viewport
await page.evaluate(() => {
  const del = [...document.querySelectorAll('button')].find((x) => x.textContent.includes('Delete'));
  del.closest('article').scrollIntoView({ block: 'start' });
});
await new Promise((r) => setTimeout(r, 700));
await page.screenshot({ path: path.join(SHOTS, '02-live-edit.png') });
console.log('02-live-edit captured');

// Open the camera view inside the expanded editor
await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === 'Camera');
  b.click();
});
await page.waitForSelector('video', { timeout: 10000 });
await new Promise((r) => setTimeout(r, 1800));
await page.screenshot({ path: path.join(SHOTS, '03-camera.png') });
console.log('03-camera captured');

await browser.close();
console.log('done');
