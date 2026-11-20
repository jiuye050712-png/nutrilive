import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import puppeteer from 'puppeteer-core';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SHOTS = path.join(ROOT, 'docs', 'shots');
const CHROME = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const reportUrl = pathToFileURL(path.join(ROOT, 'docs', 'lighthouse-report.html')).href;

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--no-sandbox']
});

const page = await browser.newPage();
await page.setViewport({ width: 1200, height: 1000, deviceScaleFactor: 2 });
await page.goto(reportUrl, { waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 1500));

// Capture the top scores section
await page.screenshot({ path: path.join(SHOTS, '06-lighthouse.png') });
console.log('06-lighthouse captured');

await browser.close();
console.log('done');
