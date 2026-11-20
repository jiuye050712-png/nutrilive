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

// Move to a point roughly 300 m from the home anchor (55.8440, -4.4300)
await client.send('Emulation.setGeolocationOverride', {
  latitude: 55.8465,
  longitude: -4.428,
  accuracy: 15
});
// Trigger an explicit position refresh
await page.click('[title="Refresh GPS Location"]');
await page.waitForFunction(
  () => {
    const m = document.body.innerText.match(/(\d+)\s*m from Home/);
    return m && Number(m) > 60;
  },
  { timeout: 10000 }
);
await new Promise((r) => setTimeout(r, 1000));

// Scroll the map into view and capture GPS / Dining Out
await page.evaluate(() => {
  const sec = document.querySelector('.leaflet-container');
  sec.closest('section').scrollIntoView({ block: 'start' });
});
await new Promise((r) => setTimeout(r, 700));
await page.screenshot({ path: path.join(SHOTS, '04-gps.png') });
console.log('04-gps captured');

// Switch to offline and capture
await client.send('Network.emulateNetworkConditions', {
  offline: true,
  latency: 0,
  downloadThroughput: 0,
  uploadThroughput: 0
});
await page.waitForFunction(() => document.body.innerText.includes('Offline Mode'), { timeout: 10000 });
await new Promise((r) => setTimeout(r, 1000));
await page.screenshot({ path: path.join(SHOTS, '05-offline.png') });
console.log('05-offline captured');

await browser.close();
console.log('done');
