## What this adds

The integration now learns from the trips it already records, reads more from the Leapmotor cloud (read only), and the dashboard gets a fifth page. Nothing that existed changes behaviour: the regular poll is untouched, no remote command was added or altered, and every new cloud read is optional, cached and isolated, so a failing read keeps its last value and never stops an update.

### Learned from your own trips (computed locally)

- **Next predicted departure** per weekday, with a confidence, from the last eight weeks of trips.
- **Outlook for the next day**: expected distance, battery needed, *Enough for next day* and *Charge recommended*.
- **Real range** from your own consumption at the current temperature, and range at the charge limit.
- **Eco score** for every trip, **frequent routes**, a **battery capacity forecast**, **savings against a petrol car** (money, fuel, CO₂), a **charging curve** with a **slow-charging** warning, and **achievements**.
- An **activity event entity** (`event.<model>_activity`, also `leapmotor_event` on the bus) for trips, charging, the cable, low battery, messages, software updates and achievements.

### New from the Leapmotor cloud (read only)

- **Car software**: installed version and an `update` entity with release notes (owner accounts).
- **Messages** from the Leapmotor app, **charging history** for the last 60 days with place and cost, a **year of daily distance and energy**, the car's own **schedules**, and the account's **remote permissions**.
- **Shared cars**: an open share invitation can be accepted during setup or from Repairs, only on confirmation.

### Dashboard card 1.2.0

- New **Journey** page: a year of driving as a calendar, totals and records, the petrol comparison, a **range lab** and achievements.
- **Overview**: Outlook and a Last 24 hours timeline. **Trips**: replay on the map, CSV export, eco score, frequent routes. **Charging**: charging curve and history. **Vehicle**: car software and messages.
- English, Slovenian and German.

### Also

- Actions `get_trips`, `get_charging_sessions`, `refresh_cloud_data`, `accept_share_invitation`, `decline_share_invitation`.
- Four new blueprints: pre-condition before the learned departure, plug in for tomorrow, car event notifications, slow charging alert.
- Options for the petrol comparison: fuel price, comparison consumption, CO₂ of your electricity.

## Fixes

- **Car picture**: the thin vertical line next to some official pictures is gone and the charging cable now ends at the car. The card measures where the car is in the picture.
- **Home Assistant 2026.12**: a password change (re-login or Reconfigure) reloaded the entry twice in a way Home Assistant reports as "will stop working in 2026.12". It now reloads exactly once, in all three cases (changed password, same password, entry that failed setup).
- **Tab bar and narrow screens**: with six tabs the names stay whole from 320 px phones to tablets; panel titles with buttons wrap instead of being clipped; the monthly bars and the status strip render correctly on phones.
- Links point to the repository's current name.

## Deliberately not included

Remote commands that could not be verified on a real car: setting the car's speed limit, installing software updates, the Wi-Fi hotspot, the digital key, remote parking, seat adjustment and media.

## How it was checked

- 231 unit tests, including an independent re-implementation of the request signature for the new endpoints.
- 27 runtime tests on Home Assistant 2025.3.0, 2026.2.3 and 2026.11.1 (Python 3.13 and 3.14).
- All ten blueprints load and their templates render on the oldest and newest Home Assistant.
- Card: 1,200 renders (6 pages × 3 themes × 6 widths × scenarios and languages) with no console errors, no overflow and no cut tab names; replay, CSV export, range lab and the lists driven by a browser test; a fresh install (new entities unknown, unavailable or missing) renders cleanly.
- The CI secret-pattern scan passes locally.

**Not tested:** the new cloud reads against the real Leapmotor cloud. They are ported from the endpoints of leapmotor-api 0.6.0 and tested against recorded shapes; if the cloud answers differently, the affected entity stays unknown and everything else keeps working.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01ReYF8Dzo1cNbuaGp8eLoTv
