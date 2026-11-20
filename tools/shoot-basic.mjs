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

await page.screenshot({ path: path.join(SHOTS, '01-home.png'), fullPage: false });
console.log('01-home captured, title =', await page.title());

await browser.close();
console.log('done');
