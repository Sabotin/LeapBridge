// Documentation screenshots, at a fixed moment so they can be reproduced.
const { chromium } = require('playwright');
const path = require('path');
const BASE = 'http://127.0.0.1:8765/docs/preview/index.html';
const OUT = path.join(__dirname, 'docshots');
const WHEN = new Date('2026-11-10T18:40:00+01:00');

(async () => {
  const browser = await chromium.launch();
  const problems = [];
  async function open(lang, w, h, query) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2,
      locale: lang === 'sl' ? 'sl-SI' : 'en-US', timezoneId: 'Europe/Ljubljana' });
    const page = await ctx.newPage();
    await page.clock.setFixedTime(WHEN);
    page.on('console', (m) => { if (m.type() === 'error') problems.push(`${query}: ${m.text()}`); });
    page.on('pageerror', (e) => problems.push(`${query}: PAGEERROR ${e.message}`));
    await page.goto(`${BASE}?shot=1&lang=${lang}&${query}`, { waitUntil: 'load' });
    await page.waitForTimeout(1500);
    return { ctx, page };
  }
  const shot = async (name, lang, w, h, query, how = {}) => {
    const { ctx, page } = await open(lang, w, h, query);
    const file = path.join(OUT, name);
    if (how.element) {
      const box = await page.evaluate((id) => { const r = window.__card.shadowRoot.getElementById(id).getBoundingClientRect(); return { x: r.x, y: r.y + window.scrollY, width: r.width, height: r.height }; }, how.element);
      await page.screenshot({ path: file, fullPage: true, clip: box });
    } else if (how.through) {
      const bottom = await page.evaluate((ids) => Math.max(...ids.map((id) => { const el = window.__card.shadowRoot.getElementById(id); return el ? el.getBoundingClientRect().bottom + window.scrollY : 0; })), how.through);
      await page.screenshot({ path: file, fullPage: true, clip: { x: 0, y: 0, width: w, height: Math.ceil(bottom + 12) } });
    } else {
      await page.screenshot({ path: file, fullPage: !!how.full });
    }
    console.log('wrote', name);
    await ctx.close();
  };
  const C = 'state=charging&scene=night&look=console';
  // README hero images
  await shot('dashboard.png', 'en', 1440, 1022, `${C}&page=overview`);
  await shot('nadzorna-plosca.png', 'sl', 1440, 1022, `${C}&page=overview`);
  // phone pages
  for (const [pg, en, sl] of [['overview', 'page-overview', 'stran-pregled'], ['trips', 'page-trips', 'stran-voznje'], ['charging', 'page-charging', 'stran-polnjenje'], ['vehicle', 'page-vehicle', 'stran-vozilo'], ['journey', 'page-journey', 'stran-pot']]) {
    await shot(`en_${en}.png`, 'en', 390, 844, `${C}&page=${pg}`);
    await shot(`sl_${sl}.png`, 'sl', 390, 844, `${C}&page=${pg}`);
  }
  // the Journey page, wide
  await shot('en_journey.png', 'en', 1440, 1000, `state=parked&scene=night&look=console&page=journey`, { full: true });
  await shot('sl_pot.png', 'sl', 1440, 1000, `state=parked&scene=night&look=console&page=journey`, { full: true });
  // themes
  for (const look of ['classic', 'cluster', 'console']) {
    await shot(`looks_${look}-wide.png`, 'en', 1440, 900, `state=charging&scene=night&look=${look}&page=overview`, { through: ['hero', 'check'] });
    await shot(`looks_${look}-drive.png`, 'en', 1440, 900, `state=driving&scene=night&look=${look}&page=overview`, { element: 'hero' });
    await shot(`looks_${look}-phone.png`, 'sl', 390, 844, `state=attention&scene=night&look=${look}&page=overview`, { element: 'hero' });
  }
  await shot('looks_settings.png', 'en', 1280, 700, `state=charging&scene=night&look=classic&page=settings`, { through: ['settings'] });
  console.log('problems:', JSON.stringify(problems));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
