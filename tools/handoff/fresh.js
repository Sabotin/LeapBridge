// A fresh installation: the new entities exist but know nothing yet (or do not exist at all).
const { chromium } = require('playwright');
const BASE = 'http://127.0.0.1:8765/docs/preview/index.html';
const NEW = /real_range|range_at_charge_limit|next_departure|next_day|eco_score|frequent_routes|battery_capacity_trend|battery_health_in_one_year|fuel_savings|co2_saved|fuel_not_burned|fuel_avoided|distance_this_year|driving_streak|longest_trip|lifetime_|trips_recorded|charging_sessions_recorded|achievements|charging_curve|home_charging_share|parked_since|average_daily_distance|software|cloud_charging|next_scheduled|remote_permissions|charge_recommended|slow_charging|enough_for_next_day|next_day_range|activity|unread_message/;
(async () => {
  const browser = await chromium.launch();
  const mode = process.argv[2] || 'unknown';
  const shots = process.argv[3] === 'shots';
  let bad = 0;
  for (const [w, h] of [[1400, 900], [390, 844]]) for (const look of ['console', 'classic', 'cluster']) for (const pg of ['overview', 'trips', 'charging', 'vehicle', 'journey']) {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    const errors = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message));
    await page.goto(`${BASE}?state=parked&look=${look}&page=${pg}&shot=1`, { waitUntil: 'load' });
    await page.waitForTimeout(500);
    const info = await page.evaluate(({ src, mode }) => {
      const re = new RegExp(src);
      const card = window.__card;
      const hass = card.hass || card._hass;
      const states = { ...hass.states };
      let n = 0;
      for (const id of Object.keys(states)) {
        if (!re.test(id)) continue;
        n++;
        if (mode === 'missing') delete states[id];
        else states[id] = { ...states[id], state: mode === 'unavailable' ? 'unavailable' : 'unknown', attributes: { friendly_name: states[id].attributes.friendly_name, unit_of_measurement: states[id].attributes.unit_of_measurement } };
      }
      const entities = { ...(hass.entities || {}) };
      if (mode === 'missing') for (const id of Object.keys(entities)) if (re.test(id)) delete entities[id];
      card.hass = { ...hass, states, entities };
      return n;
    }, { src: NEW.source, mode });
    await page.waitForTimeout(700);
    const res = await page.evaluate(() => {
      const root = window.__card.shadowRoot;
      const out = [];
      for (const panel of root.querySelectorAll('.panel')) {
        const r = panel.getBoundingClientRect();
        const text = (panel.innerText || '').replace(/\s+/g, ' ').trim();
        if (/undefined|NaN|\[object|Infinity|null(?![a-z])|Invalid Date/.test(text)) out.push(`BAD TEXT ${panel.id}: ${(text.match(/.{0,40}(undefined|NaN|\[object|Infinity|null(?![a-z])|Invalid Date).{0,40}/) || [])[0]}`);
        if (r.height > 0 && r.height < 60) out.push(`tiny panel ${panel.id} ${Math.round(r.height)}px: "${text.slice(0, 60)}"`);
      }
      const summary = [...root.querySelectorAll('.panel')].filter((p) => p.getBoundingClientRect().height > 0).map((p) => `${p.id}:${Math.round(p.getBoundingClientRect().height)}`).join(' ');
      return { out, summary };
    });
    if (errors.length || res.out.length) { bad++; console.log(`${w} ${look} ${pg}:`, JSON.stringify(errors), JSON.stringify(res.out)); }
    if (look === 'console' && w === 1400) console.log(`  [${mode}] ${pg} (${info} entities blanked) panels: ${res.summary}`);
    if (shots && look === 'console') await page.screenshot({ path: `${__dirname}/fresh_${mode}_${pg}_${w}.png`, fullPage: true });
    await page.close();
  }
  console.log(`mode ${mode}: ${bad} renders with problems`);
  await browser.close();
})();
