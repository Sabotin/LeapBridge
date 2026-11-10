// node crop.js out.png url width height clipHeight
const { chromium } = require('playwright');
(async () => {
  const [out, url, w, h, ch, y0 = '0', scale = '2'] = process.argv.slice(2);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: +scale });
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(1100);
  await page.screenshot({ path: out, fullPage: true, clip: { x: 0, y: +y0, width: +w, height: +ch } });
  console.log(JSON.stringify(errors));
  await browser.close();
})();
