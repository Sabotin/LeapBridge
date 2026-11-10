# Changelog

0.7.5 is the first published release. It contains every section marked 0.7.5
below; from this release on, HACS installs releases instead of the latest
commit.

## Unreleased: certificate download and the full charging schedule

- **Certificates download themselves.** Setup starts with **Download from
  GitHub (recommended)**: both files are fetched from the `certs` folder of
  this repository (GitHub, with the jsDelivr mirror as a second way), checked
  to be a matching pair and stored in `/config/leapmotor/`. The same switch is
  in the account options, and a missing pair appears under **Settings →
  Repairs** with a one-click download. A failed download never touches
  certificates that already work. Uploading or pasting your own files still
  works.
- **Charging schedule, ported from LeapConnect.** The new action
  `leapmotor.set_charging_schedule` sets the time window, weekdays, charge
  limit, weekly repetition and auto recharge in one command; fields you leave
  out keep the car's value. Two new entities, *Set charging schedule start*
  and *Set charging schedule end* (`time.<model>_charging_schedule_start` /
  `_end`), change one time and keep the rest. Works on the T03 as well, where
  the schedule is read from the cloud because the status does not carry it.
- A second charging-plan change within five minutes now builds on the first
  one instead of on the car's status, which lags behind; before, changing the
  limit right after another change could undo it. The confirmed plan is shown
  at once.
- Not yet in the dashboard card: the schedule is edited through the action or
  the two time entities.

## 0.7.5: the car learns your routine, a Journey page, software and messages

Everything that existed before works as before: the regular poll is unchanged,
no remote command was added or altered, and every new cloud read is optional,
cached and kept apart, so a failing read keeps its last value and never stops
an update. The new reads also have a time limit (20 seconds each and 45
seconds for all of them in one update), so a slow cloud cannot hold the
regular update back. Card version 1.2.0.

### New from the Leapmotor cloud (read only)

- **Car software:** the installed version (`sensor.<model>_software_version`)
  and an update entity (`update.<model>_software`) that shows when Leapmotor
  offers a new version, with the release notes in your language. Installing
  still happens in the car; Home Assistant only tells you. Owner accounts
  only: a shared account is not allowed to read it.
- **Messages:** the last 20 messages of the Leapmotor app (door left open,
  charging finished, service notes …) as the `messages` attribute of *Unread
  messages* and on the card.
- **Charging history:** the sessions the cloud keeps for the last 60 days
  (`sensor.<model>_cloud_charging_sessions`), each with energy, duration,
  average power, AC or DC, the place (your zones) and the cost from your
  tariffs. They complete the sessions the integration records itself.
- **A year of driving:** distance and energy per day are read back for up to a
  year, a little on each update, for the calendar on the new Journey page.
- **Schedules:** *Next scheduled pre-conditioning* shows when the car's own
  climate, battery-heating or prepare-car schedule runs next.
- **Remote permissions:** what the account is allowed to do with the car,
  useful on shared accounts, where a missing permission explains a refused
  command.
- **Shared cars:** when a car was shared with the account and the invitation is
  still open, setup now offers to accept it instead of ending with "no
  vehicle"; later invitations appear under **Settings → Repairs**. Also as
  actions `leapmotor.accept_share_invitation` and
  `leapmotor.decline_share_invitation`. Nothing is accepted without your
  confirmation.

### The integration learns from your own trips (computed locally)

- **Next predicted departure:** from the last eight weeks of trips the
  integration learns when the car usually leaves on each weekday, with a
  confidence. No calendar and no manual schedule.
- **Outlook for the next day:** *Expected distance next day*, *Battery needed
  next day*, *Enough for next day* and *Charge recommended*: a plug-in hint
  only on the evenings it is really needed.
- **Real range:** the range worked out from your own consumption at the
  current outside temperature, next to the car's optimistic figure, plus the
  *Range at charge limit*.
- **Eco score:** each trip gets a score from 0 to 100 against your own usual
  consumption on similar trips and for speed, with an average over the last
  trips.
- **Frequent routes:** the routes you drive most (Home → Work …), each with
  its typical time, distance, consumption, cost and best run.
- **Battery forecast:** the capacity trend per year from your full charges and
  the expected *Battery health in one year*.
- **Savings against a petrol car:** money and fuel saved and CO₂ avoided, this
  month and in total. Set your fuel price, a comparison consumption (default
  6.5 l/100 km) and the CO₂ of your electricity (default 250 g/kWh) in
  **Leapmotor → Configure**.
- **Charging curve:** power over battery level for the session in progress and
  the last DC session, against your usual curve. *Slow charging* turns on when
  an AC session is clearly slower than you usually get at that kind of place,
  for example a wallbox that fell back to one phase.
- **Journey:** distance this year, driving streak, longest trip and longest
  day, busiest month, lifetime average consumption, average daily distance,
  trips and charging sessions recorded, home charging share, parked since.
- **Achievements:** eleven badges in bronze, silver and gold (Distance,
  Road-trip day, Long haul, Eco driver, On a roll, Explorer, Frost driver,
  Charge cycles, Night owl, CO₂ saver, Together).
- **Activity events:** `event.<model>_activity` fires for trip started and
  finished, charging started, finished and interrupted, plugged in and
  unplugged, battery low, new message, software update available and
  achievement reached, each with its details (distance, energy, cost, eco
  score …). The same events go out on the event bus as `leapmotor_event`.

### Actions

- `leapmotor.get_trips` and `leapmotor.get_charging_sessions` return the
  stored log (up to 500 entries) as response data, for exports and a driver's
  logbook.
- `leapmotor.refresh_cloud_data` reads software, schedules, charging history
  and invitations again without waiting for their next refresh.

### Ready-made automations

- **Pre-condition before your usual departure:** heats or cools a few minutes
  before the learned departure, only when the prediction is reliable and the
  weather makes it worth it.
- **Plug in for tomorrow:** an evening reminder only when the battery is not
  enough for the next day's usual driving.
- **Notify when something happens with the car:** pick the events you want.
- **Slow charging alert**.

### Dashboard card

- **New Journey page:** a year of driving as a calendar with the last twelve
  months, totals and records, the comparison with a petrol car, a **range
  lab** (move speed and outside temperature and see your range change, tuned
  to your own consumption) and the achievements.
- **Overview:** an **Outlook** panel (plug in tonight or not, usual departure,
  real range, your usual week) and a **Last 24 hours** timeline of trips,
  charging, locking and the cable.
- **Trips:** **replay** a trip on the map, **export the trip log as CSV**, an
  eco score on every trip, and the frequent routes.
- **Charging:** the charging curve with the slow-charging warning, and the
  charging history with place and cost.
- **Vehicle:** car software with release notes, the car's schedules and
  permissions, and the messages.
- The tabs and the car panel show when an update is waiting or charging is
  slow. English, Slovenian and German throughout.
- **Car app is now the default theme.** A theme you picked in the Settings
  tab, or set with `look:` in the card configuration, stays as it is.

### Fixes

- **Car picture:** a thin line next to some official car pictures (along the
  side, the bottom or both) is gone, and the charging cable now ends at the
  car instead of beside it. The card measures where the car really is in the
  picture.
- **Your own car from the first moment:** on opening the page the dashboard
  sometimes showed its built-in drawing of a car for a few seconds, or until
  *Refresh* was tapped, before the picture of your car appeared. The picture
  is now remembered on the device and shown at once; Home Assistant serves its
  saved copy immediately instead of downloading the picture package again
  after every restart; a failed load is retried on its own; and while a
  picture is still on its way, its place stays empty instead of showing
  another car.
- **German:** the integration's German translation is complete (176 names and
  descriptions of settings, entities and actions were still in English).
- **One part of the card can no longer take the rest down:** if a panel
  cannot be drawn, it says so and the other panels keep working.
- **Home Assistant 2026.12:** entering a new password (re-login or
  *Reconfigure*) reloaded the integration twice in a way Home Assistant stops
  accepting in 2026.12. It now reloads exactly once.
- **Narrow phones:** panel titles with buttons wrap instead of being cut off,
  and tab labels and the driver-display gauges fit at 320 px.
- Links point to the repository's current name, `Sabotin/LeapBridge`.

### Documentation

- The README is now in English first (`README.md`), with Slovenian
  (`README.sl.md`) and German (`README.de.md`) versions and German
  screenshots. The picture at the top shows the dashboard on a real car.
- Releases: the Release workflow can create a release from the Actions tab
  (*Run workflow*), with the version checked against the manifest.

### Deliberately left out

Commands that could not be verified on a real car are not included: setting
the car's speed limit, installing software updates, the Wi-Fi hotspot, the
digital key, remote parking, seat adjustment and media. The integration only
ships commands that are known to work.

### Checked with

246 unit tests and 28 runtime tests on Home Assistant 2025.3.0, 2026.2 and
2026.11, and every card page in all three themes, three languages and six
screen widths (1,200 renders). The new cloud reads are tested against the
answer formats that leapmotor-api 0.6.0 reads, not against the real Leapmotor
cloud: if the cloud answers differently, the affected entity stays unknown
and everything else keeps working.

## 0.7.5: charging shows on the T03, green glow while charging

- **T03 charging is read from the measured current:** when the car stands in
  Park and about 1 kW or more flows into the battery, it is reported as
  charging and plugged in, also when the car's own charge-state code says
  "not charging" or the car is switched on while it charges. Until now either
  of those hid a real session and the card showed *Parked*. The charging and
  cable sensors, connection state, charging power, EVCC status and the
  charging sessions all follow. Regeneration while driving and other models
  are unchanged.
- **Green glow while charging:** the car panel gets a green edge and the car a
  green outline over a brighter pool of light, in all three themes.

## 0.7.5: themes and a settings tab

- **Three themes** for the card (option `look`):
  - `classic` (default): the night or day sky, as before.
  - `cluster`, a **driver display**: battery gauge with range and the
    charge-limit mark, the car on a lit floor, a speed gauge with the speed
    limit sign and P R N D (charging power and finish time while charging),
    warning lights for lock, doors, trunk, windows, tires, cable, climate and
    sentry, a trip-computer strip and graphite panels.
  - `console`, a **car-app screen**: range as the headline, a segmented
    battery bar with the charge limit, status chips, tire pressures at the
    wheels and round quick buttons.
- **Settings tab** (gear): each user picks the theme, day or night, and the
  language (Auto, English, Slovenščina, Deutsch). Saved for that Home
  Assistant user on every device and used by all Leapmotor cards and the
  sidebar panel; the card configuration gives the defaults. Option
  `settings: false` hides the tab; one-page cards don't get it.
- `scene` is the sky in Classic and the display brightness in the other themes.
- **More readable:** small text one size up and more contrast for secondary
  text on every page; section headings without letter-spaced capitals.
- The map-less trip drawing keeps its stars only in Classic.
- **Sidebar panel without a top bar:** the dashboard starts right at the
  tabs. On phones and narrow screens a ☰ button at the start of the tab row
  opens Home Assistant's sidebar.
- **New logo:** a mint city car on the night sky, in the
  integration, the HACS brand icons and the README banners.
- **Docs:** shorter Slovenian README; the English README now follows it
  section by section, with English screenshots of every page and the remote
  control. The full English details (manual install, all settings, services,
  behaviour notes, debugging) moved to `docs/guide-en.md`, next to the
  Slovenian `docs/navodila-sl.md`.

## 0.7.5: card pages, trips page, readable panels

- **Pages:** the card is split into **Overview** (car, vehicle check, remote
  control), **Trips**, **Charging** and **Vehicle**, with tabs at the top and
  a dot on a tab when that page needs a look. It always opens on Overview;
  the tabs stay in view in the sidebar panel. Card options `tabs` and `page`.
- **Trips page** (like LeapConnect's): trip details with the map, energy,
  consumption, battery used, speeds, minutes above the limit, cost and
  outside temperature, plus a **speed chart** with the limit; the trip log is
  grouped by day with day totals and today/this month on top, and now lists
  the last **30** trips (*Show more*). Last 7 days moved here.
- **Charge limit needs confirmation:** − / + only pick the value; it is sent
  after **Set** is tapped twice (like Unlock), with *Cancel* to go back.
- **Vehicle check** shows status tiles (green fine, amber needs a look, red
  problem) and no longer has Unlock / Find car buttons: unlock is in the
  hero's quick buttons and Find car in the remote control.
- **Remote control** is grouped into *Climate* and *Doors & security*, and
  leaves out the quick buttons already shown in the hero. Charging controls
  (start/stop, schedule, battery preheat, healthy charging, release cable)
  moved into the charging panel.
- **Readable panels:** larger type and contrast everywhere; the 7-day panel
  has totals and one labelled row per day; the charging panel has a battery
  bar with the limit; the 24-hour chart shows the value now, its change, a
  scale and when the car was parked, driving or charging. *Charged* in the
  24-hour summary only counts rises while the car was charging.
- New **Tires** panel on the Vehicle page; *Energy & tires* became
  *Battery & efficiency* on the Charging page.
- Hero metric labels wrap instead of being cut off (e.g. *Meja polnjenja*).
- README screenshots show the new pages.

## 0.7.5: trip map, speed limit, live car picture, T03 charge limit

- **Trip map:** a new card section draws each trip on Home Assistant's map with
  dark tiles, coloured by speed against your limit. Tap a trip in the trip log
  to show it; the live trip updates every minute. It uses the location and
  speed history the recorder already keeps; no extra location data is stored.
  Without Home Assistant's map (or with `map: drawn`) the route is drawn on
  the night-sky background instead.
- **Faster polling while driving:** new option *Update interval while driving*
  (default 1 minute) so maps, trips and the speed alert get enough points.
- **Speed limit:** a *Speeding* binary sensor (your per-vehicle *Speed alert*
  in km/h, or the car's own limit when it is switched on), a red *Too fast*
  chip and a speed-limit cell on the card, top speed and minutes above the
  limit per trip, and a *Speeding alert* blueprint.
- **Live car picture:** the car on the card shows open doors, trunk, windows
  and sunroof, low tires, an unlocked ring, climate heating or cooling, sentry,
  motion and headlights while driving, and a battery bar while plugged in.
  The image entity lists the files in the official picture package
  (`package_images`) for future state renders.
- **Charge limit on the T03,** ported from LeapConnect (leapmotor-api 0.6.0):
  command 190 is built from the cloud's charging schedule, keeping every field
  it returns, 50–100 % in steps of 5. An unconfirmed command is sent once
  more (the same value twice is harmless). The card's charging panel has − / +
  buttons for the limit. Switching the T03 schedule on or off stays off.
- **Quick buttons on the first page:** lock/unlock, quick heat, quick cool and
  open/close windows under the battery (double-tap to confirm; card option
  `quick_actions`).
- Charge-limit errors now use the same clear, translated messages as the
  buttons.

## 0.7.5: remote commands survive an expired session

- **Fix:** *Preheat cabin* (and every other remote command) failed with
  *remote control result failed: Token is invalid*. An expired session is now
  renewed once automatically. Before the cloud accepts a command the whole
  command is sent again; after it is accepted only the result is polled again,
  so toggles such as the trunk are never sent twice.
- Status polls and remote commands no longer run at the same time, so a poll
  that renews the session cannot break a command that is in flight.
- A token refresh now also updates the signing device ID and registers the
  session for remote control again, as a full login does.
- The 10 s remote cooldown only follows a command that may have reached the
  car (or a rejected PIN); after a session or network error you can retry
  straight away.
- Clearer, translated messages (English and Slovenian) for an unconfirmed
  command, the cooldown and a session the cloud keeps rejecting.

## 0.7.5: plug-and-play sidebar dashboard

- After setup a **Leapmotor** sidebar entry shows the full dashboard, one per
  vehicle, with a menu button on phones. It is on by default and can be
  switched off in the options (*Show the Leapmotor dashboard in the sidebar*).
- Slovenian README with Slovenian screenshots; the English README moved to
  `README.en.md`.

## 0.7.5: stages 2 and 3 of the LeapConnect port, plus extras

- **Cabin preheat, pre-cool and auto pre-condition:** one-tap buttons and
  services using the app's climate command (170) with per-vehicle presets:
  preheat 22 °C, pre-cool 18 °C with A/C, fan 7 and recirculation by default;
  auto picks heat or cool from the outside temperature. Works on the T03.
- **Vehicle PIN** is prefilled with the factory PIN 0000 in setup and for new
  vehicles; it stays editable and can be cleared for read-only use.
- **Time-of-use home tariff** (LeapConnect costing): low-tariff price, window
  and weekends; home sessions are split by time.
- **Trip comparison** (LeapConnect similarity): last trip vs. similar trips.
- **Maintenance** (LeapConnect engine and MIT packs): factory schedules per
  model, severe-use option, due by km/time, `log_maintenance` /
  `reset_maintenance` services, a Next maintenance sensor and a Maintenance due
  binary sensor. Unlogged items assume on-schedule service.
- **More commands** (leapmotor-api payloads): sentry mode and healthy charging
  switches, start/stop charging and sunroof buttons and services.
- **Extras not in LeapConnect:** cost per trip / per 100 km, parked drain,
  slow-leak tire detection, charge-to-limit cost now vs. low tariff,
  consumption by temperature, Attention needed sensor, five blueprints.
- Card: Maintenance and Insights panels, climate preset and new control tiles,
  "vs usual" on trips, charge-to-limit estimate.

## 0.7.5: stage 1 of the LeapConnect port

- **Licence:** the project is now GNU AGPL-3.0, because it includes code
  ported from LeapConnect. The original MIT notice of leapmotor-ha is kept in
  `NOTICE.md`.
- **Trip log:** drives are detected from each poll with LeapConnect's
  segmentation and merge rules (explicit parks at segment boundaries also end
  a trip, to suit minute-level polling). New sensors: last trip distance and
  consumption, distance today, distance this month; recent trips as attributes.
- **Charging sessions and costs:** sessions are detected from the charging
  flag, classified as home, public AC or public DC, and priced with new tariff
  options. New sensors: last session energy and cost, charging cost this
  month, charged energy this month.
- **Battery health:** LeapConnect's state-of-health estimate from daily
  full-charge readings, with an optional usable-capacity reference per vehicle.
- Analytics are stored locally and survive restarts; no coordinates are kept.
- Setup and options validate the certificate pair and say which file is wrong.
- Dashboard card: new Trip log panel, charging costs and battery health.

## 0.7.5: sabotin/leapmotor redesign

- New built-in dashboard card (`type: custom:leapmotor-card`), served and
  auto-loaded by the integration: night/day hero scene with the owned car's
  official picture, vehicle check, 24-hour battery/range/power chart, 7-day
  driving bars, charging arc, energy & tires, and remote-control tiles with
  tap-twice confirmation. English, Slovenian and German.
- Full Slovenian translation of the integration (setup, options, vehicles,
  entities, services).
- New brand icon and logo, redesigned README, card documentation and a demo
  preview page (`docs/preview/`).
- HACS installs from the default branch (`zip_release: false`); manifest links
  point to this repository. Based on kerniger/leapmotor-ha 0.7.5 (MIT).

## 0.7.3 - 2026-09-23

- Redact nested VINs, vehicle/account titles, nicknames and remote-control session IDs in both diagnostics export paths (#69).
- Correct available battery energy to `energy_storage` + `measurement`, preserving entity identity, values and statistics semantics (#71).
- Stop exposing ineffective T03 charge-limit and charging-schedule controls; reject direct writes clearly while retaining charge-limit readback (#70/#72).
- Require complete current charging plans before writes. Keep missing schedule state unknown and preserve unverified start times as diagnostics (#72).
- Withhold T03 daily/rolling kWh values while their unit is unverified; preserve raw energy values and mileage. No guessed factor-of-1000 conversion (#67, mitigation).
- Label PTC/air-direction values as raw diagnostics, disable new entities by default and expose known AC modes as translated enums. Preserve existing registry choices (#73).
- Retain the previously confirmed model-specific window ventilation fix (#68).

The T03 energy unit, B10 energy scope and wake-up SOC transients remain under investigation. See [upgrade details and limitations](docs/issue-fixes-20260923.md).

## 0.7.2 - 2026-09-14

- Label the seven-day energy sensor as presumed driving energy in all supported
  languages; preserve entity identity and existing values (#67).
- Add `daily_detail.driving_energy_kwh`; retain `energy_kwh` as a compatibility
  alias. Expose the cloud source, provisional energy scope, and coverage meaning
  on both seven-day sensors.
- Document the aligned B10 comparison (38 kWh daily, 40.5 kWh driving, 53.1 kWh
  total). Driving-only energy is a working hypothesis, not confirmed API semantics.
  Preserve cloud precision; neither integer truncation nor a correction factor
  is assumed. These values must not be presented as total vehicle consumption.
- Thanks to fapgomes and the car's owner for the comparison and correction.

## 0.7.1 - 2026-09-14

- Correct the mileage/energy request to cover seven calendar days (today and
  the preceding six days), rather than eight. Today remains a partial day (#67).
- Normalize weekly consumption rates to numbers, including numeric strings;
  missing or invalid rates become null. Preserve other returned weekly fields.
- Clarify that `energy_complete` checks field and mileage coverage, not physical
  accuracy. The reported B10 daily-energy discrepancy remains under investigation.
- Add regression coverage for the date window across daylight-saving changes
  and mixed-type weekly consumption responses. All 44 tests pass.
- Thanks to fapgomes for the detailed measurements and verification in #67.

## 0.7.0 - 2026-09-10

- Promote VIN-scoped multi-vehicle configuration to the stable release: each
  vehicle has its own PIN and ABRP token below the shared account entry.
- Preserve existing entity IDs and migrate single-vehicle PIN and ABRP settings
  automatically. Existing multi-vehicle accounts must configure ABRP per vehicle;
  their old shared token is not reused across cars.
- Fix the default T03 window opening command and use model-specific percentage
  conversion for B05/B10/C10 and T03 (#68).
- Expose normalized daily mileage/energy details and coverage attributes. Mark
  seven-day energy unavailable when cloud details are incomplete (#67).
- Remember successful status endpoint paths per VIN for the client lifetime,
  with one C10 fallback attempt on unsupported model paths.
- Check release tags against the manifest before uploading HACS assets and on
  tagged CI builds. Install API test dependencies explicitly in CI.
- Requires Home Assistant 2025.3 or newer. Single-vehicle operation has been
  exercised; simultaneous multi-vehicle operation is covered by isolation tests
  but has not been verified with two physical vehicles by the maintainer.
- Thanks to markoceri, ProtossBlaster / Leapmotor Mate, and the issue reporters
  for the shared research and feedback.

## 0.7.0-beta.1 - 2026-08-13

- Model every discovered vehicle as a Home Assistant config subentry below the
  shared Leapmotor account, while preserving existing VIN-based entity IDs and
  device assignments during migration.
- Store and resolve the vehicle PIN per VIN so accounts with different PINs can
  safely control each car through the existing shared API session.
- Configure ABRP independently per vehicle and prevent an old account-wide ABRP
  token from receiving telemetry from multiple vehicles.
- Move vehicle PIN and ABRP editing from account options to each vehicle's
  configuration page; account options now contain only shared certificate and
  polling settings.
- Automatically migrate existing single-vehicle PIN and ABRP settings. For
  multi-vehicle accounts, the legacy PIN is retained per vehicle while legacy
  ABRP forwarding is disabled until a token is assigned to each intended car.
- Add VIN-scoped diagnostics, localized subentry flows in all supported
  languages, and regression tests for credential and ABRP isolation.
- This is a beta release. Back up Home Assistant before installing it and
  report migration or multi-vehicle behavior with redacted diagnostics. Home
  Assistant 2025.3 or newer is required for config subentries.

## 0.6.35 - 2026-08-13

- Remember authoritative GPS hemisphere signs per VIN across Home Assistant
  restarts, reuse them when signed signals are omitted, and guard isolated
  positive sign-loss frames without blocking real equator/meridian crossings.
- Read T03 window state from its live position signals when the model's binary
  window flags remain at zero, while keeping B10/C10 flag-based behavior.
- Treat non-zero door status codes as open instead of requiring exactly `1`.
- Reject phantom charging while the vehicle is physically READY or the cable
  state explicitly reports unplugged, while retaining the validated REEV
  low-current and deferred-schedule handling.
- Recognize cable state `1149=4` as connected but waiting for a scheduled
  charging window, without treating the idle state alone as active charging.
- Send the confirmed full climate payload required to switch off A/C on the
  T03; other models retain the existing bare `operate=off` command.
- Use the B10-specific 0-10 window command scale only on the B10; C10 and T03
  continue to receive the native 0-100 value.
- Add focused unit tests for GPS sign memory, charging plausibility, T03 window
  state, model-specific climate commands, and window command scaling, and run
  them in the validation workflow.
- Thanks to `JoseRMorales`, `uannight`, `ProtossBlaster`, `derekzoli`, and
  `markoceri` for the reports, captures, and cross-project research behind
  these changes.

## 0.6.34 - 2026-08-04

- Prefer measured REEV fuel volume signal `3263`, with the previous `2363`
  mapping retained as a compatibility fallback.
- Recognize the captured C10 REEV slow-AC signature where charge state `1149=2`
  and a positive remaining time confirm charging despite near-zero pack current.
- Keep REEV cable state `1149=3` connected across mid-charge state changes, and
  reject drive-time state `1149=5` even when gear or speed data is stale.
- Suppress implausible REEV `3736` charge-complete reports when the battery is
  more than 15 percentage points below a known charge limit.
- Back off failed vehicle-image package downloads for ten minutes when no cache
  exists, preventing repeated frontend requests from hammering the account.
- Thanks to `markoceri`, `ProtossBlaster`, and the Leapmotor Mate community for
  publishing the signal research and real-vehicle captures behind these fixes.

## 0.6.33 - 2026-07-27

- Rename the existing successful-poll timestamp to Last cloud refresh and add
  a separate Last vehicle update diagnostic sensor based on the timestamp
  attached to the vehicle status by Leapmotor.
- Expose vehicle-data age and staleness attributes for automations, supporting
  epoch seconds, epoch milliseconds, ISO timestamps, and T03 `collectTime`.
- Prefer numeric T03 `collectTimeMs` when both timestamp formats are present.
- Let Home Assistant choose the charge-limit number control automatically
  instead of forcing the ambiguous numeric input-box mode.

## 0.6.32 - 2026-07-20

- Prevent regenerative braking and stale charge-state signals, observed on a
  T03, from being reported as cable charging while any vehicle is in gear or
  moving.
- Keep charging status off, connection state unplugged, and charging power at
  zero during a drive while continuing to expose negative battery current as
  regenerative braking.

## 0.6.31 - 2026-07-20

- Gate remote charger unlock on declared vehicle ability `53`, hiding the
  button and rejecting direct service calls on unsupported models while
  retaining the previous behavior when ability data is unavailable.
- Hide seat heating, seat ventilation, steering-wheel heating, and their
  related diagnostic entities on the European T03, which does not physically
  provide these features. Mirror heating remains available.
- Refresh the cached vehicle image once per Home Assistant start so cloud-side
  model or color changes become visible, with the existing image retained as
  an offline fallback.
- Rename the signed raw charging-current entity to Battery current in all
  languages and document that negative values indicate energy flowing into
  the battery. The entity ID and value remain unchanged.
- Add a complete Portuguese translation for config flows, options, entities,
  states, errors, and service metadata.

## 0.6.30 - 2026-07-15

- Map B05 vehicles directly to the shared C10 status endpoint, confirmed by a
  European B05 returning 95 status signals. This avoids the initial HTTP 404
  request used by the discovery fallback in 0.6.29.

## 0.6.29 - 2026-07-15

- Add initial B05 status support by retrying the shared C10 status endpoint
  when a model-specific vehicle-status path returns HTTP 404.
- Report the status endpoint path that actually succeeded in diagnostics,
  including for shared vehicles.

## 0.6.28 - 2026-07-11

- Prefer signed GPS signals `2` and `3` on signal-based vehicles such as the
  C10 and B10, fixing locations mirrored into the wrong hemisphere when the
  absolute-value coordinate signals lose their South or West sign.
- Exclude the signed GPS signals from support diagnostics to prevent precise
  location disclosure.
- Exclude nested ZIP artifacts from release packages and reject them during
  local and GitHub release validation.

## 0.6.20 - 2026-06-19

- Include all numeric vehicle-status signals in redacted support diagnostics so
  previously unknown model-specific fields, including B10 REEV telemetry, can
  be identified from comparison captures.
- Exclude the known latitude and longitude signal IDs from the expanded raw
  signal export to prevent location disclosure in public support bundles.
- Reject Python cache files and directories when building release ZIP assets.

## 0.6.19 - 2026-06-13

- Harden diagnostics redaction for account e-mail addresses, usernames,
  camelCase secrets such as `operatePassword`, identifiers, and vehicle-picture
  key material.
- Recreate missing temporary account certificate files by logging in again
  before sending a remote command.
- Correct signal `1480` from parking-camera state to parking-brake state.
- Treat both positive states of signal `1945` as active windshield defrost.
- Add diagnostic binary sensors for healthy charging (signal `48`) and a
  one-time charging-schedule cancellation (signal `3737`).

## 0.6.18 - 2026-06-13

- Add a native climate on/off switch backed by signal `1938`. Turning it on
  uses the app-captured neutral climate profile (`nohotcold`, 24 °C, fan level 4);
  turning it off sends `{"operate":"off"}`.
- Align climate payloads with app captures: normal commands use `wshld=1`,
  defrost uses `wshld=2`, and the legacy `wind` mode is translated to
  `nohotcold`.
- Remove the redundant climate-off button now covered by the climate switch;
  the `leapmotor.ac_off` service remains available for automations.

## 0.6.17 - 2026-06-08

- Fix prepare-car coordinate service selectors for Home Assistant's service
  metadata schema.

## 0.6.16 - 2026-06-08

- Fix prepare-car service selectors so the `off` seat mode is parsed as a
  string by Home Assistant's service metadata loader.

## 0.6.15 - 2026-06-08

- Add B10-verified one-touch vehicle preparation services:
  `leapmotor.prepare_car`, `leapmotor.set_prepare_car_schedule`, and
  `leapmotor.cancel_prepare_car_schedule` using cmdIds `360` and `361`.

## 0.6.14 - 2026-06-08

- Add a `Vehicle READY` diagnostic binary sensor based on signal `1258`
  (`bcmKeyPositionOn3`), matching B10 READY/ON3 behavior.
- Schedule a short follow-up refresh after remote-control commands so delayed
  comfort, climate, charge-limit, and schedule status changes surface faster
  without increasing normal polling.
- Replace the deprecated Home Assistant device-tracker `TrackerEntity` import.
- Add a README reference to `leapmotor-mate` for TeslaMate-style trip and charge
  history.

## 0.6.13 - 2026-06-08

- Add B10-verified climate pre-conditioning schedule services using `cmdId=171`:
  `leapmotor.set_climate_schedule` writes one future schedule entry and
  `leapmotor.cancel_climate_schedule` sends an empty schedule list.

## 0.6.12 - 2026-06-06

- Refresh expired access tokens through `/acct/v1/token/refresh` before falling
  back to a full account login.
- Read the current charging plan through the dedicated `getAppointment`
  endpoint when vehicle status does not contain a complete plan, fixing charge
  limit and schedule updates on affected vehicles such as T03.
- Route B11 vehicle status requests through the shared C10 status endpoint,
  matching the international backend behavior.

## 0.6.11 - 2026-06-06

- Correct steering-wheel and exterior-mirror heating payloads from live C10
  captures of the international app.
- Correct driver/passenger seat heating and ventilation payloads and restore
  the `0-3` Home Assistant level controls. Passenger ventilation level 2 was
  additionally verified by sending it to a C10 through the API.
- Turn climate control fully off with `{"operate":"off"}` instead of the
  incomplete `close` operation reported in issue #42.

## 0.6.10 - 2026-05-28

- Add comfort controls based on `markoceri/leapmotor-api`: steering wheel
  heating and mirror heating switches, plus driver/passenger seat heating and
  ventilation level controls.

## 0.6.9 - 2026-05-28

- Retry vehicle-list resolution once after a fresh login when a remote action
  fails before command execution with `Token is invalid`.

## 0.6.8 - 2026-05-17

- Add a parameterised `leapmotor.set_climate` service for cooling, heating,
  ventilation, temperature, fan speed, recirculation, and windshield defrost.
- Replace the one-shot battery preheat button with a stateful Home Assistant
  switch and add the matching battery preheat off command.
- Add an optional diagnostic sensor for the last charging-session energy from
  the charging daily detail endpoint.
- Add an optional `is_driving` binary sensor derived from the existing vehicle
  state logic.
- Reduce duplicated visible controls and range entities by keeping secondary
  range variants disabled by default.

## 0.6.7 - 2026-05-13

- Add a controllable charging schedule switch that toggles the existing
  charging plan while preserving start time, end time, recurrence, and charge
  limit.

## 0.6.6 - 2026-05-12

- Use `en-GB` as the default signed API language to better match the standalone
  API client and international app behavior.
- Generate and persist a unique login device ID per Home Assistant config entry
  instead of reusing the same static device ID for every installation.

## 0.6.5 - 2026-05-11

- Improve setup failure diagnostics by recording transport-level API errors
  before a parsed API response exists.
- Use the `markoceri` GitHub handle consistently in README credits.
- Stop exposing signal `1939` as a raw charge status and rename the raw
  vehicle-state metadata to `raw_ac_operation_mode_code`; charge connection
  metadata remains based on signal `1149`.
- Stop using signal `1941` for vehicle parked/driving state. Movement state is
  now derived from gear (`1010`), speed (`1319`), and ON3 (`1258`), while
  `1941` is exposed as `raw_ac_fan_speed_code`.

## 0.6.4 - 2026-05-10

- Use the APK tire-pressure slot mapping for all models after live C10
  verification showed the previous non-B10/default mapping displayed rear right
  pressure as front left.

## 0.6.3 - 2026-05-10

- Add setup-time warning logs with compact last API result metadata when login
  succeeds but the first vehicle-data refresh fails. This helps diagnose setup
  failures before the config entry exists and before diagnostics services are
  available.

## 0.6.2 - 2026-05-09

- Remove the energy device class from the rolling 7-day energy sensor because
  Home Assistant does not allow `device_class: energy` with
  `state_class: measurement`.

## 0.6.1 - 2026-05-09

- Correct positive longitude values for western-hemisphere Home Assistant
  installations when the mirrored negative longitude is clearly closer to the
  configured Home Assistant home location. This fixes GPS placement for regions
  west of Greenwich without hard-coding countries.
- Expose longitude correction diagnostics on the device tracker via
  `raw_longitude`, `longitude_corrected`, and `longitude_correction_source`.

## 0.6.0 - 2026-05-09

- Start the 0.6 internal API-layer split by moving API exceptions, vehicle
  models, remote-command payloads, operatePassword crypto helpers, and the
  curl transport into `custom_components/leapmotor/leap_api`.
- Add optional eco polling. When enabled, the integration switches to a slower
  polling interval only while every vehicle is clearly locked, parked, and
  unplugged; otherwise it keeps the normal interval.
- Expose polling mode and normal/eco intervals in integration diagnostics.
- Add a compact redacted `support_summary` to diagnostics exports for easier
  issue triage without sharing the full payload.
- Tighten unit metadata for energy sensors and expose the API-provided
  `mi/kWh` average consumption value as an optional diagnostic sensor for
  imperial-unit users.

## 0.5.39 - 2026-05-09

- Add a dedicated charger-unlock button and `leapmotor.unlock_charger`
  service using the live-verified app command `cmdId=192` with
  `{"operation":"unlock"}`.
- Document the charger-unlock service example for Home Assistant automations.

## 0.5.38 - 2026-05-08

- Correct positive latitude values for southern-hemisphere Home Assistant
  installations when the mirrored negative latitude is clearly closer to the
  configured HA home location. This fixes backend GPS sign issues reported by
  Australian users without hard-coding a country list.
- Expose GPS correction diagnostics on the device tracker via `raw_latitude`,
  `latitude_corrected`, and `latitude_correction_source`.
- Update community credit from `Toxo666` to `sbstn-0x2a`.

## 0.5.37 - 2026-05-06

- Create optional diagnostic entities only when the first vehicle payload
  actually contains the corresponding raw value. Existing entity-registry
  entries are not removed automatically.
- Add EVCC helper sensors: `evcc_status` with IEC 61851 `A`/`B`/`C` mapping
  and `charging_finish_time` from the remaining charge time.
- Return the charge-limit number as an integer so Home Assistant accepts values
  like `90` without requiring `90.0`.
- Keep the English entity-ID migration enabled; localized display names remain
  language-specific.

## 0.5.36 - 2026-05-06

- Improve T03 named-payload coverage using fields also modeled by LeapConnect:
  available energy, outdoor temperature, climate fan/air-direction raw values,
  PTC state/settings, sunshade position, Bluetooth/hotspot state, door-control
  permission, and window remote-control support.
- Add dedicated diagnostic entities for these T03 fields instead of mapping
  them onto unrelated C10/B10-specific signals.
- Report charging power as `0.0 kW` when current and voltage are present but
  current is below the active-charging threshold.

## 0.5.35 - 2026-05-06

- Add `collectTime` / `collectTimeMs` as a timestamp fallback for T03 status
  payloads without numeric signal timestamps.
- Expand diagnostics exports with the complete normalized `status` and
  `charging` sections so remaining T03 gaps can be identified from support
  exports.

## 0.5.34 - 2026-05-06

- Add a T03 compatibility fallback for status payloads that expose named fields
  directly under `data` instead of the newer numeric `data.signal` map.
- Map safe T03 named fields for SOC, range, mileage, speed, gear, location,
  charge state, charge current/voltage/time, DC charge flag, lock, doors,
  windows, climate setpoint, and tire pressure.
- Derive parked/driving state from speed or gear when model-specific drive-state
  signals are absent.

## 0.5.33 - 2026-05-05

- Fix the HACS release archive layout. The release ZIP now contains the
  integration files directly at the archive root, so HACS installs
  `manifest.json` to `/config/custom_components/leapmotor/manifest.json`
  instead of nesting the repository inside the integration directory.

## 0.5.32 - 2026-05-05

- Improve low-current AC charging detection for B10 vehicles that charge around
  2.5 A, while keeping C10 plugged-idle snapshots around 1.5 A from being
  reported as active charging.
- Keep completed charging detection tied to true idle current so plugged-in
  vehicles with residual current are shown as connected rather than finished.

## 0.5.31 - 2026-05-05

- Fix HACS release metadata so HACS downloads `leapmotor-ha.zip` from GitHub
  releases instead of trying to infer the integration path from the repository.
- Fix the GitHub validation workflow so documentation that explains PEM marker
  text is not treated as a leaked certificate.

## 0.5.30 - 2026-05-05

- Add `leapmotor.export_diagnostics`, which writes an anonymized support JSON
  file with interpreted state and raw APK signal values to `/config/leapmotor`.
- Improve charge-complete detection: a plugged-in vehicle with completed/idle
  charging now reports `finished` instead of falling back to active charging.
- Add diagnostic lock-state sensors for source, age, and raw lock signal so
  stale cloud state and remote-control overrides are easier to identify.
- Document evcc usage through the Home Assistant entities, including SOC,
  range, plug state, active charging, and charging-connection interpretation.
- Expand service documentation with PIN requirements, targeting rules, and
  Home Assistant automation examples for navigation, climate, windows, charge
  limit, lock, and diagnostics export.
- Complete translation coverage for buttons, locks, numbers, image/location
  entities, and the setup/options config flow in all bundled languages.
- Improve release/HACS documentation with badges, screenshot checklist, known
  limitations, and troubleshooting for certificates, HACS setup, stale data,
  remote actions, and second-account usage.
- Add a read-only shared-car status fallback: if a shared vehicle returns an
  empty live-signal payload with `vin` only, retry once with `vin` and `carId`
  before treating the live status as unavailable.

## 0.5.29 - 2026-05-05

- Restore localized sensor and binary-sensor display names while keeping the
  English entity IDs introduced in `0.5.25`.
- Fix the previous translation-key regression by assigning localized entity
  names from the bundled translation files with English fallback.
- Complete translation entries for all current sensor and binary-sensor keys so
  missing translations no longer collapse to the vehicle name only.

## 0.5.28 - 2026-05-04

- Add account notification sensors from PR #5: unread message count, latest
  message title, and latest message timestamp.
- Fetch notification data once per coordinator refresh and keep vehicle updates
  working if the message endpoints are unavailable.

## 0.5.27 - 2026-05-04

- Hotfix entity display names after `0.5.26`: restore explicit entity names so
  Home Assistant no longer shows only the vehicle/device name.

## 0.5.26 - 2026-05-04

- Keep English entity IDs from the registry migration, but restore localized
  friendly names by switching sensor and binary-sensor entities to
  `translation_key` based names.
- Complete English/German entity translations for all sensor and binary-sensor
  entities.
- Document the recommended setup with a second Leapmotor account and shared
  vehicle to avoid logging the official app out.

## 0.5.25 - 2026-05-04

- Add an automatic Entity Registry migration for existing Leapmotor entries:
  known German-generated entity IDs are renamed to English IDs on startup after
  a HACS update/restart.
- This intentionally changes entity IDs such as `sensor.c10_batterie` to
  `sensor.c10_battery`; existing dashboards and automations may need to be
  updated.

## 0.5.24 - 2026-05-04

- Switch hardcoded default entity names for sensors, binary sensors, and the
  device tracker from German to English.
- Add a diagnostic `Regenerative braking` binary sensor derived from confirmed
  charging current while no external charge cable is plugged in.
- Complete the Dutch setup/options certificate wording based on community PR
  feedback while preserving the current `/config/leapmotor/app_cert.pem` and
  `/config/leapmotor/app_key.pem` guidance.

## 0.5.23 - 2026-05-04

- Fix charge-complete handling when the backend keeps signal `1149=2` but
  reports zero charging current and no remaining charge time; Home Assistant now
  shows plugged-in instead of active charging.
- Add optional `value` support for `windows_open`, `windows_close`,
  `sunshade_open`, and `sunshade_close` services to support partial
  positioning while preserving the previous full open/close default.
- Clarify certificate setup labels and documentation: uploaded/pasted material
  is stored as `/config/leapmotor/app_cert.pem` and
  `/config/leapmotor/app_key.pem`; certificates are still not bundled or
  downloaded automatically.

## 0.5.22 - 2026-05-04

- Add APK-verified read-only signal mappings for gear, speed, battery
  temperature, PTC power, DC charge cable, window/skylight state, parking
  camera, sentinel/parking-photo flags, range mode, live range, and tire
  pressure alarms.
- Correct speed-limit switch mapping to signal `12054`; signal `6047` is kept
  as raw speed-limit unit metadata.
- Treat signal `1939` as A/C fan mode metadata and stop using it as a charging
  fallback.
- Rename the `3257` diagnostic range display to CLTC remaining range while
  keeping the existing entity key for compatibility.

## 0.5.21 - 2026-05-04

- Fix active-charging detection when signal `1149` remains `1` during a real
  charging session; current, power, and remaining charge time now take
  precedence.
- Show `Ladeverbindung` as `charging` for confirmed active charging instead of
  `plugged_in`/`connecting`.

## 0.5.20 - 2026-05-04

- Restore app-correlated lock state using validated signal `1298`
  (`1=locked`, `0=unlocked`) instead of signal `47`.
- Keep vehicle movement state derived from `1941`/`1944` so lock state and
  parked/driving state are no longer coupled.

## 0.5.19 - 2026-05-04

- Correct signal `47` to charge-cable plugged-in state instead of lock state.
- Add newly validated door, trunk, charging, climate, heating, seat, mirror,
  speed-limit, and precise SOC/range signal entities.
- Update vehicle-state and active-charging derivation from the latest validated
  raw signal mapping.
- Add community credit for Toxo666's signal-mapping work.

## 0.5.18 - 2026-05-01

- Fix the rolling 7-day energy sensor metadata so Home Assistant no longer
  warns about an invalid `device_class=energy` / `state_class=measurement`
  combination.

## 0.5.17 - 2026-05-01

- Add B10 support by routing `carType=B10` status requests through the
  backend-compatible `c10` status endpoint.
- Fix B10 tire-pressure slot mapping based on app Vehicle Health verification.
- Expose additional B10 raw signal candidates in diagnostics for further
  community validation.
- Add verified consumption-screen read-only data from the official app flow:
  cumulative energy, last-7-days mileage/energy, six-week kWh/100 km average,
  and last-week driving/climate/other energy split.

## 0.5.16 - 2026-04-29

- Restore app-aligned vehicle-state precedence: `1298` is the primary
  parked/driving signal, while `1941` and `1944` remain fallback diagnostics.
- Fix the `0.5.15` regression where fresh `1941=3` / `1944=2` could show
  `driving` even when the app and `1298=1` showed the vehicle as parked.

## 0.5.15 - 2026-04-29

- Fix vehicle-state mapping so confirmed fresh `1941=3` / `1944=2` drive
  states are shown as `driving` even when the older parked flag remains set.
- Hide stale vehicle-state values instead of showing outdated `parked` or
  `driving` states as current, while keeping raw status codes in attributes.

## 0.5.14 - 2026-04-27

- Make the approved logo/icon artwork transparent outside the vehicle graphic.

## 0.5.13 - 2026-04-27

- Replace the rejected generated logo/icon with the cleaned user-provided
  artwork, scaled to 512x512 for Home Assistant and HACS.

## 0.5.12 - 2026-04-27

- Replace logo/icon PNG assets with clean transparent-background images and
  opaque vehicle windows so checkerboard artifacts are not visible.

## 0.5.11 - 2026-04-27

- Fix vehicle-state mapping so app-correlated parked states are no longer shown
  as driving.
- Store user-provided `app_cert.pem` and `app_key.pem` under
  `/config/leapmotor/` so HACS updates do not remove them.
- Automatically copy legacy certificate files from
  `/config/custom_components/leapmotor/` to `/config/leapmotor/` when present.

## 0.5.10 - 2026-04-27

- Fix charging-power mapping by deriving it from voltage/current instead of the
  GPS-like `2191` signal.
- Keep `Lädt` false for plugged-in but stopped/idle charging sessions.
- Document that the currently observed Leapmotor API signals do not reliably
  distinguish plugged-in from unplugged when the vehicle is not charging.

## 0.5.9 - 2026-04-27

- Ask for optional ABRP live-data settings during the initial setup flow, not
  only in the integration options.
- Use an internal default ABRP API key so users only need their vehicle-specific
  ABRP Generic token.
- Move local brand images into the Home Assistant custom-integration brand
  folder so the integration logo/icon can be discovered by newer HA versions.

## 0.5.8 - 2026-04-27

- Add Home Assistant service `leapmotor.send_destination`.
- Add `cmdId=180` send-destination support using the verified app flow.
- Add optional ABRP Generic Telemetry push after successful Leapmotor polls.
- Add manual refresh button and explicit last-refresh status.
- Improve stale-state handling for lock, vehicle state, and GPS data.
- Add charge-limit write service while preserving the current charging schedule.
- Add local static vehicle image support from the signed vehicle picture package.
- Add mileage/energy history summary sensors.
- Improve diagnostics with redacted API state, raw status candidates, and last action status.
- Improve setup/options flow for app certificate and private key provisioning.
- Add HACS brand assets.

## 0.5.7

- Public supportability baseline with read-only vehicle data and verified remote-control actions.
- Keep app certificate material out of the repository.
