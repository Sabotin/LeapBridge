// Are the tab names whole on phones, with and without the sidebar menu button?
const { chromium } = require('playwright');
const BASE = 'http://127.0.0.1:8765/docs/preview/index.html';
(async () => {
  const browser = await chromium.launch();
  for (const w of [320, 344, 352, 360, 375]) {
    const page = await browser.newPage({ viewport: { width: w, height: 800 } });
    const row = [];
    for (const mode of ['', 'panel=1&']) for (const lang of ['en', 'sl', 'de']) for (const look of ['console', 'cluster']) {
      await page.goto(`${BASE}?${mode}lang=${lang}&look=${look}&shot=1`, { waitUntil: 'load' });
      await page.waitForTimeout(350);
      const res = await page.evaluate(() => {
        let card = window.__card;
        if (!card && window.__panel) card = window.__panel.shadowRoot.querySelector('leapmotor-card');
        const root = card.shadowRoot;
        const cut = [];
        let font = null;
        for (const el of root.querySelectorAll('.tab .tlb')) {
          const cs = getComputedStyle(el);
          if (cs.display === 'none') continue;
          font = cs.fontSize;
          if (el.scrollWidth > el.clientWidth + 0.5) cut.push(`${el.textContent}(${el.scrollWidth}>${el.clientWidth})`);
        }
        const nav = root.querySelector('.tabs');
        return { cut, font, over: nav.scrollWidth > nav.clientWidth + 1, menu: nav.classList.contains('has-menu') };
      });
      if (res.cut.length || res.over) row.push(`${mode ? 'panel' : 'card'}/${lang}/${look} font ${res.font}${res.menu ? ' menu' : ''}: ${res.cut.join(' ')}${res.over ? ' NAV OVERFLOW' : ''}`);
    }
    console.log(`${w}px: ${row.length ? '\n   ' + row.join('\n   ') : 'all tab names whole'}`);
    await page.close();
  }
  await browser.close();
})();
