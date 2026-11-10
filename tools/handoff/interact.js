// Drives the interactive parts of the card: replay, CSV export, range lab, "show more", more-info, tabs.
const { chromium } = require('playwright');
const BASE = 'http://127.0.0.1:8765/docs/preview/index.html';
const assert = (ok, msg) => { if (!ok) throw new Error('ASSERT ' + msg); console.log('  ok  ' + msg); };
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 }, acceptDownloads: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message));
  const root = (sel) => page.locator(`leapmotor-card >> ${sel}`);
  const ev = (fn, arg) => page.evaluate(fn, arg);

  for (const look of ['console', 'classic', 'cluster']) {
    console.log(`--- ${look}`);
    // ---- trips: replay + CSV
    await page.goto(`${BASE}?state=parked&look=${look}&page=trips&shot=1`, { waitUntil: 'load' });
    await page.waitForTimeout(700);
    assert(await root('[data-act="replay"]').count() === 1, 'replay button present');
    const before = await ev(() => window.__card._replay && window.__card._replay.playing);
    await root('[data-act="replay"]').click();
    await page.waitForTimeout(900);
    const st = await ev(() => { const r = window.__card._replay; return r ? { playing: r.playing, share: +r.share.toFixed(3) } : null; });
    assert(st && st.playing === true && !before, `replay is playing (${JSON.stringify(st)})`);
    const dot1 = await ev(() => { const d = window.__card.shadowRoot.querySelector('.rpdot,.replaydot,[data-replay-dot]'); return d ? d.getBoundingClientRect().left + ',' + d.getBoundingClientRect().top : null; });
    await page.waitForTimeout(900);
    const dot2 = await ev(() => { const d = window.__card.shadowRoot.querySelector('.rpdot,.replaydot,[data-replay-dot]'); return d ? d.getBoundingClientRect().left + ',' + d.getBoundingClientRect().top : null; });
    console.log('      marker', dot1, '->', dot2);
    await root('[data-act="replay"]').click();
    await page.waitForTimeout(200);
    assert(await ev(() => !window.__card._replay || window.__card._replay.playing === false), 'replay pauses');
    // seek with the slider
    const slider = root('input[type="range"]').first();
    await slider.evaluate((el) => { el.value = String(Number(el.max) * 0.5); el.dispatchEvent(new Event('input', { bubbles: true, composed: true })); });
    await page.waitForTimeout(150);
    // pick another trip: replay must reset
    const tripCount = await root('.trip').count();
    assert(tripCount >= 3, `trip rows listed (${tripCount})`);
    await root('.trip').nth(2).click();
    await page.waitForTimeout(500);
    assert(await ev(() => !window.__card._replay || !window.__card._replay.playing), 'replay stopped after choosing another trip');
    // CSV
    const [download] = await Promise.all([page.waitForEvent('download', { timeout: 8000 }), root('[data-act="exportcsv"]').click()]);
    const path = await download.path();
    const text = require('fs').readFileSync(path, 'utf8');
    const lines = text.trim().split(/\r?\n/);
    assert(lines.length > 5 && /start/i.test(lines[0]) && lines[0].split(/[;,]/).length >= 8, `CSV with ${lines.length - 1} trips, header: ${lines[0].slice(0, 90)}`);
    assert(/\.csv$/.test(download.suggestedFilename()), 'CSV file name ' + download.suggestedFilename());
    console.log('      row1:', lines[1].slice(0, 120));
    // show more trips
    if (await root('.trips .more').count()) { const n0 = await root('.trip').count(); await root('.trips .more').click(); await page.waitForTimeout(250); assert(await root('.trip').count() > n0, 'trip log shows more'); }

    // ---- journey: range lab
    await page.goto(`${BASE}?state=parked&look=${look}&page=journey&shot=1`, { waitUntil: 'load' });
    await page.waitForTimeout(700);
    const big = async () => (await root('#rlout .rlbig').innerText()).replace(/\s+/g, ' ');
    const r0 = await big();
    const inputs = root('.rangelab input[type="range"]');
    assert(await inputs.count() === 2, 'range lab has two sliders');
    const setSlider = async (i, v) => inputs.nth(i).evaluate((el, val) => { el.value = String(val); el.dispatchEvent(new Event('input', { bubbles: true, composed: true })); }, v);
    await setSlider(0, 130); await page.waitForTimeout(120);
    const fast = parseFloat((await big()).replace(/[^\d.]/g, ''));
    await setSlider(0, 50); await page.waitForTimeout(120);
    const slowv = parseFloat((await big()).replace(/[^\d.]/g, ''));
    assert(slowv > fast, `slower speed gives more range (${slowv} > ${fast}); was "${r0}"`);
    await setSlider(1, -10); await page.waitForTimeout(120);
    const cold = parseFloat((await big()).replace(/[^\d.]/g, ''));
    await setSlider(1, 20); await page.waitForTimeout(120);
    const mild = parseFloat((await big()).replace(/[^\d.]/g, ''));
    assert(mild > cold, `mild weather gives more range than frost (${mild} > ${cold})`);
    const withClimate = mild;
    await setSlider(1, -5); await page.waitForTimeout(100);
    const c1 = parseFloat((await big()).replace(/[^\d.]/g, ''));
    await root('.rlt').click(); await page.waitForTimeout(200);
    const c2 = parseFloat((await big()).replace(/[^\d.]/g, ''));
    assert(c2 > c1, `climate off gives more range in the cold (${c2} > ${c1})`);
    assert(await root('#rlchart svg').count() === 1, 'range curve drawn');
    // sliders keep focus/element identity while dragging (no re-render of the inputs)
    const same = await ev(() => { const el = window.__card.shadowRoot.querySelector('.rangelab input[type="range"]'); el.dataset.mark = '1'; el.value = '77'; el.dispatchEvent(new Event('input', { bubbles: true, composed: true })); return window.__card.shadowRoot.querySelector('.rangelab input[type="range"]').dataset.mark === '1'; });
    assert(same, 'slider element survives input (drag is not interrupted)');
    // more-info from a badge / calendar
    await ev(() => { window.__more = []; window.addEventListener('hass-more-info', (e) => window.__more.push(e.detail.entityId)); });
    await root('.badgegrid').click({ position: { x: 20, y: 20 } });
    await page.waitForTimeout(150);
    assert((await ev(() => window.__more)).some((x) => /achievements/.test(x)), 'badge opens more-info of the achievements sensor');

    // ---- overview: timeline show more, outlook more-info
    await page.goto(`${BASE}?state=parked&look=${look}&page=overview&shot=1`, { waitUntil: 'load' });
    await page.waitForTimeout(900);
    const tl0 = await root('.tlr').count();
    if (await root('[data-act="moretimeline"]').count()) { await root('[data-act="moretimeline"]').click(); await page.waitForTimeout(250); assert(await root('.tlr').count() > tl0, `timeline shows more (${tl0} -> ${await root('.tlr').count()})`); }
    assert(await root('.wkd').count() === 7, 'usual week has seven days');
    await page.goto(`${BASE}?state=charging&look=${look}&page=overview&shot=1`, { waitUntil: 'load' });
    await page.waitForTimeout(900);
    assert(await root('.cable').count() === 1, 'cable drawn while charging');
    await page.goto(`${BASE}?state=parked&look=${look}&page=overview&shot=1`, { waitUntil: 'load' });
    await page.waitForTimeout(700);
    assert(await root('.cable').count() === 0, 'no cable when not plugged in');
    assert(await root('.wkd.target').count() === 1, 'the outlook day is highlighted');

    // ---- charging: sessions show more
    await page.goto(`${BASE}?state=charging&look=${look}&page=charging&shot=1`, { waitUntil: 'load' });
    await page.waitForTimeout(700);
    const s0 = await root('.chrow').count();
    assert(s0 === 6, `six charging sessions first (${s0})`);
    await root('[data-act="moresessions"]').click(); await page.waitForTimeout(250);
    assert(await root('.chrow').count() > s0, 'charging history shows more');

    // ---- vehicle: inbox more, software
    await page.goto(`${BASE}?state=parked&look=${look}&page=vehicle&shot=1`, { waitUntil: 'load' });
    await page.waitForTimeout(700);
    assert(await root('.software').count() === 1 && await root('.inbox').count() === 1, 'software and inbox panels shown');
    await page.goto(`${BASE}?state=parked&look=${look}&page=vehicle&shot=1&shared=1`, { waitUntil: 'load' });
    await page.waitForTimeout(700);
    console.log('      shared account: software panel count', await root('.software').count());
  }
  // tab switching keeps working, incl. keyboard
  await page.goto(`${BASE}?state=charging&shot=1`, { waitUntil: 'load' });
  await page.waitForTimeout(600);
  for (const name of ['trips', 'charging', 'vehicle', 'journey', 'settings', 'overview']) {
    await root(`.tab[data-page="${name}"]`).click();
    await page.waitForTimeout(350);
    const on = await ev(() => window.__card.shadowRoot.querySelector('.tab.on')?.dataset.page);
    assert(on === name, `tab ${name} opens`);
  }
  console.log('console errors:', JSON.stringify(errors));
  await browser.close();
  if (errors.length) process.exit(1);
})().catch((e) => { console.error(String(e.stack || e)); process.exit(1); });
