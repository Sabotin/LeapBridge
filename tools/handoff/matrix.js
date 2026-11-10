// Renders every page in every look, language, scenario and width and reports layout problems.
const { chromium } = require('playwright');
const BASE = 'http://127.0.0.1:8765/docs/preview/index.html';
const looks = ['classic', 'cluster', 'console'];
const pages = ['overview', 'trips', 'charging', 'vehicle', 'journey', 'settings'];
const widths = [[1400, 900], [1024, 800], [820, 900], [700, 900], [390, 844], [320, 700]];
const langs = ['en', 'sl', 'de'];
const states = ['charging', 'parked', 'driving', 'attention'];
const extra = ['', '&slow=1', '&shared=1', '&update=0'];

async function check(page, url) {
  const errors = [];
  const onConsole = (m) => { if (m.type() === 'error') errors.push(m.text()); };
  const onError = (e) => errors.push('PAGEERROR ' + e.message);
  page.on('console', onConsole); page.on('pageerror', onError);
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(450);
  const problems = await page.evaluate(() => {
    const out = [];
    let card = window.__card;
    if (!card && window.__panel) card = window.__panel.shadowRoot?.querySelector('leapmotor-card') || window.__panel.querySelector?.('leapmotor-card');
    if (!card) return ['no card'];
    const root = card.shadowRoot;
    if (document.documentElement.scrollWidth > window.innerWidth + 1) out.push(`page scrolls sideways ${document.documentElement.scrollWidth}>${window.innerWidth}`);
    const clipped = (el, stop) => {
      for (let p = el.parentElement; p && p !== stop; p = p.parentElement) {
        const o = getComputedStyle(p);
        if (o.overflowX !== 'visible' || o.overflow !== 'visible') return true;
      }
      return false;
    };
    for (const panel of root.querySelectorAll('.panel')) {
      const pr = panel.getBoundingClientRect();
      if (!pr.width || !pr.height) continue;
      const seen = new Set();
      for (const el of panel.querySelectorAll('*')) {
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) continue;
        const cs = getComputedStyle(el);
        if (cs.visibility === 'hidden' || cs.position === 'fixed') continue;
        if (/^fx/.test(String(el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className))) continue;
        if ((r.right > pr.right + 1.5 || r.left < pr.left - 1.5) && !clipped(el, panel)) {
          const key = `${panel.id}:${el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className}`;
          if (!seen.has(key)) { seen.add(key); out.push(`overflow ${key} (${Math.round(r.left - pr.left)}..${Math.round(r.right - pr.right)})`); }
        }
      }
      if ((panel.textContent || '').match(/undefined|NaN|\[object|null(?![a-z])/)) {
        const m = panel.textContent.match(/.{0,30}(undefined|NaN|\[object|null(?![a-z])).{0,30}/);
        out.push(`bad text in ${panel.id}: ${m && m[0]}`);
      }
    }
    for (const el of root.querySelectorAll('.tab .tlb')) {
      if (getComputedStyle(el).display !== 'none' && el.scrollWidth > el.clientWidth + 0.5) out.push(`tab name cut: ${el.textContent}`);
    }
    const bars = [...root.querySelectorAll('.mb i')];
    if (bars.length && !bars.some((b) => b.getBoundingClientRect().height > 2)) out.push('monthly bars have no height');
    return out;
  });
  page.off('console', onConsole); page.off('pageerror', onError);
  return [...errors.map((e) => 'console: ' + e), ...problems];
}

(async () => {
  const browser = await chromium.launch();
  let total = 0, bad = 0;
  const report = {};
  const mode = process.argv[2] || 'core';
  await Promise.all(widths.map(async ([w, h]) => {
    const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    for (const look of looks) for (const pg of pages) {
      const combos = [];
      if (mode === 'core') {
        for (const st of states) combos.push(`state=${st}&lang=en`);
        for (const lang of ['sl', 'de']) combos.push(`state=charging&lang=${lang}`, `state=parked&lang=${lang}`);
        for (const x of extra.slice(1)) combos.push(`state=charging&lang=en${x}`);
      } else {
        for (const st of states) for (const lang of langs) for (const x of extra) combos.push(`state=${st}&lang=${lang}${x}`);
      }
      for (const c of combos) {
        const url = `${BASE}?${c}&look=${look}&page=${pg}&shot=1`;
        const res = await check(page, url);
        total++;
        if (res.length) {
          bad++;
          for (const r of res) { const k = r; (report[k] = report[k] || []).push(`${w}px ${look} ${pg} ${c}`); }
        }
      }
    }
    await page.close();
  }));
  // One-page and sidebar modes
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  for (const look of looks) for (const x of ['tabs=0', 'panel=1', 'tabs=0&state=parked', 'panel=1&state=driving&lang=sl']) {
    const res = await check(page, `${BASE}?${x}&look=${look}&shot=1`);
    total++;
    if (res.length) { bad++; for (const r of res) (report[r] = report[r] || []).push(`1400px ${look} ${x}`); }
  }
  await browser.close();
  console.log(`checked ${total} renders, ${bad} with findings`);
  for (const [k, v] of Object.entries(report)) console.log(`\n${k}\n   x${v.length}: ${v.slice(0, 4).join(' | ')}`);
})();
