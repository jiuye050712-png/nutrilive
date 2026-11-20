import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SHOTS = path.join(ROOT, 'docs', 'shots');
const CHROME = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--no-sandbox']
});
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 2 });

const url = 'https://github.com/jiuye050712-png/nutrilive/actions';
await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
await page
  .waitForSelector('[data-testid="workflow-run-list"], .workflow-run, [id^="workflow_"]', { timeout: 30000 })
  .catch(() => {});
await new Promise((r) => setTimeout(r, 2500));

await page.screenshot({ path: path.join(SHOTS, '07-ci.png'), fullPage: false });
console.log('07-ci captured, title =', await page.title());
await browser.close();
