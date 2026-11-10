// Usage: node shot.js <out.png> <url> [width] [height] [fullPage] [waitMs]
const { chromium } = require('playwright');
(async () => {
  const [out, url, w = '1400', h = '900', full = '0', wait = '1200'] = process.argv.slice(2);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message));
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(+wait);
  await page.screenshot({ path: out, fullPage: full === '1' });
  const info = await page.evaluate(() => {
    const card = window.__card;
    if (!card) return null;
    const root = card.shadowRoot;
    const img = root.querySelector('.carbox img');
    const box = root.querySelector('.carbox')?.getBoundingClientRect();
    const dot = root.querySelector('.plugdot')?.getBoundingClientRect();
    const cable = root.querySelector('.cable')?.getBoundingClientRect();
    return { src: img ? img.src.slice(0, 40) : null, natural: img ? [img.naturalWidth, img.naturalHeight] : null,
      box: box ? [Math.round(box.left), Math.round(box.top), Math.round(box.width), Math.round(box.height)] : null,
      dot: dot ? [Math.round(dot.left + dot.width / 2), Math.round(dot.top + dot.height / 2)] : null,
      cable: cable ? [Math.round(cable.left), Math.round(cable.top), Math.round(cable.width), Math.round(cable.height)] : null,
      attach: card._pic ? card._pic.attach : null, cut: card._pic ? card._pic.cut : null };
  });
  console.log(JSON.stringify({ out, info, errors }));
  await browser.close();
})();
