// The car picture: cut to the car, no stray line, cable on the body — for several defects, in all looks.
const { chromium } = require('playwright');
const BASE = 'http://127.0.0.1:8765/docs/preview/index.html';
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message));
  let bad = 0;
  const sizes = new Set();
  for (const pic of ['car_clean', 'car_hairline', 'car_hline', 'car_both']) for (const look of ['console', 'cluster', 'classic']) {
    await page.goto(`${BASE}?state=charging&look=${look}&page=overview&shot=1&pic=/_test/${pic}.png`, { waitUntil: 'load' });
    await page.waitForTimeout(1300);
    const r = await page.evaluate(async () => {
      const card = window.__card, root = card.shadowRoot;
      const img = root.querySelector('.carbox img');
      if (!img) return { none: true };
      // Look at the picture that is shown: is anything left outside the car?
      const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
      const g = c.getContext('2d'); g.drawImage(img, 0, 0);
      const d = g.getImageData(0, 0, c.width, c.height).data;
      const col = (x) => { let n = 0; for (let y = 0; y < c.height; y++) if (d[(y * c.width + x) * 4 + 3] > 40) n++; return n; };
      const row = (y) => { let n = 0; for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3] > 40) n++; return n; };
      // Nothing may touch the edge of the picture that is shown (a leftover line would).
      let lines = 0;
      for (const x of [0, c.width - 1]) if (col(x) > 0) lines++;
      for (const y of [0, c.height - 1]) if (row(y) > 0) lines++;
      const box = root.querySelector('.carbox').getBoundingClientRect();
      const dot = root.querySelector('.plugdot')?.getBoundingClientRect();
      let onBody = null;
      if (dot) {
        const px = Math.round(((dot.left + dot.width / 2 - box.left) / box.width) * c.width), py = Math.round(((dot.top + dot.height / 2 - box.top) / box.height) * c.height);
        let near = 0;
        for (let dx = 0; dx <= Math.round(c.width * 0.03); dx++) { const x = Math.min(c.width - 1, px + dx); if (d[(Math.min(c.height - 1, Math.max(0, py)) * c.width + x) * 4 + 3] > 128) { near = 1; break; } }
        onBody = !!near;
      }
      return { cut: card._pic.cut, natural: [img.naturalWidth, img.naturalHeight], lines, onBody, blob: img.src.startsWith('blob:') };
    });
    sizes.add(String(r.natural));
    const ok = !r.none && r.lines === 0 && r.onBody === true && sizes.size === 1;
    if (!ok) bad++;
    console.log(`${ok ? 'ok ' : 'BAD'} ${pic.padEnd(13)} ${look.padEnd(8)} ${JSON.stringify(r)}`);
  }
  // released on disconnect, made again on return
  await page.goto(`${BASE}?state=charging&look=console&page=overview&shot=1&pic=/_test/car_hairline.png`, { waitUntil: 'load' });
  await page.waitForTimeout(1300);
  const life = await page.evaluate(async () => {
    const card = window.__card, parent = card.parentNode, next = card.nextSibling;
    const revoked = [];
    const orig = URL.revokeObjectURL.bind(URL);
    URL.revokeObjectURL = (u) => { revoked.push(u); orig(u); };
    const first = card.shadowRoot.querySelector('.carbox img').src;
    card.remove();
    const afterRemove = { revokedFirst: revoked.includes(first), pic: card._pic };
    parent.insertBefore(card, next);
    await new Promise((r) => setTimeout(r, 1500));
    const img = card.shadowRoot.querySelector('.carbox img');
    const ok = await new Promise((res) => { const t = new Image(); t.onload = () => res(true); t.onerror = () => res(false); t.src = img.src; });
    return { afterRemove, second: img.src.startsWith('blob:') && img.src !== first, loads: ok, cut: card._pic?.cut };
  });
  console.log('disconnect/reconnect:', JSON.stringify(life));
  if (!(life.afterRemove.revokedFirst && life.second && life.loads)) bad++;
  console.log('console errors:', JSON.stringify(errors), '| problems:', bad);
  await browser.close();
  process.exit(bad || errors.length ? 1 : 0);
})();
