/*!
 * Leapmotor Card
 * A night-sky dashboard for the Leapmotor Home Assistant integration.
 *
 * Part of https://github.com/sabotin/leapmotor (MIT License).
 * Bundled fonts: Outfit and JetBrains Mono, SIL Open Font License 1.1.
 *
 * The integration serves and auto-loads this file, so no manual resource
 * setup is needed. Add the card with:  type: custom:leapmotor-card
 */

const CARD_VERSION = "1.0.0";
const MODULE_BASE = new URL(".", import.meta.url);

/* ------------------------------------------------------------------ */
/* Fonts (must live in the document, @font-face is ignored in shadow) */
/* ------------------------------------------------------------------ */

const LATIN =
  "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD";
const LATIN_EXT =
  "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF";

function ensureFonts() {
  if (document.getElementById("leapmotor-card-fonts")) return;
  const face = (family, file, range) =>
    `@font-face{font-family:'${family}';font-style:normal;font-weight:100 900;font-display:swap;` +
    `src:url('${new URL(`fonts/${file}`, MODULE_BASE)}') format('woff2');unicode-range:${range};}`;
  const style = document.createElement("style");
  style.id = "leapmotor-card-fonts";
  style.textContent = [
    face("LM Outfit", "outfit-latin-ext-wght-normal.woff2", LATIN_EXT),
    face("LM Outfit", "outfit-latin-wght-normal.woff2", LATIN),
    face("LM JetBrains Mono", "jetbrains-mono-latin-ext-wght-normal.woff2", LATIN_EXT),
    face("LM JetBrains Mono", "jetbrains-mono-latin-wght-normal.woff2", LATIN),
  ].join("");
  document.head.appendChild(style);
}

/* ------------------------------------------------------------------ */
/* Translations                                                        */
/* ------------------------------------------------------------------ */

const STRINGS = {
  en: {
    now: "Now", justNow: "just now", updated: "updated {x}",
    locked: "Locked", unlocked: "Unlocked", parked: "Parked", driving: "Driving",
    charging: "Charging", pluggedIn: "Plugged in", unplugged: "Not plugged in", finished: "Charge complete",
    rangeWord: "{x} range", limitWord: "limit {x}", odometer: "Odometer", outside: "Outside",
    interior: "Interior", chargeLimit: "Charge limit", speed: "Speed", gear: "Gear",
    consumption: "Consumption", lastUpdate: "Updated", range: "Range", fuel: "Fuel",
    home: "Home", away: "Away", refresh: "Refresh", insideChip: "Inside",
    secureChip: "Locked & closed",
    check: "Vehicle check", cloudStatus: "cloud status", allSecure: "All secure",
    allSecureSub: "Locked — doors, windows and trunk closed", attention: "Needs attention",
    doorsClosed: "All doors closed", doorsOpen: "Doors open: {n}",
    windowsClosed: "Windows closed", windowsOpen: "Windows open: {n}",
    trunkClosed: "Trunk closed", trunkOpen: "Trunk open",
    tirePressure: "Tire pressure {x}", tireLow: "Low tire pressure {x}",
    batteryLevel: "Battery {x}", updatedAgo: "Updated {x}", stale: "Data is {x} old",
    ok: "OK", open: "OPEN", low: "LOW", stalePill: "OLD",
    subLock: "central locking", subDoors: "4 doors", subWindows: "windows & sunroof",
    subTrunk: "tailgate", subTires: "all four wheels", subBattery: "state of charge",
    subData: "last contact with the car",
    footnote: "Polled from the Leapmotor cloud — values can lag behind the car.",
    lock: "Lock", unlock: "Unlock", findCar: "Find car",
    last24: "Last 24 hours", tabBattery: "Battery", tabRange: "Range", tabPower: "Power",
    sum24: "{charged} charged and {driven} driven in the last 24 h.",
    sumCharged: "{charged} charged in the last 24 h.", sumDriven: "{driven} driven in the last 24 h.",
    peakLow: "Peak {max} at {tmax}, lowest {min} at {tmin}.", peakOnly: "Peak {max} at {tmax}.",
    sumNoChange: "Steady over the last 24 h.",
    noHistory: "No history yet — the chart fills in as Home Assistant records data.",
    nowPill: "now",
    last7: "Last 7 days", today: "Today", longest: "Longest", total: "Total",
    drivingDays: "Driving days", noWeek: "No daily history from the cloud yet.",
    chargingTitle: "Charging", done: "done", remaining: "remaining", lastCharge: "last charge {x}",
    battery: "battery", limit: "limit",
    energyTires: "Energy & tires", sixWeek: "6-week average",
    ratings: ["Very efficient", "Efficient", "Moderate", "High", "Very high"],
    lastWeek: "Last week", drivingE: "driving", climateE: "climate", otherE: "other",
    FL: "Front L", FR: "Front R", RL: "Rear L", RR: "Rear R",
    controls: "Remote control", confirmHint: "Tap twice to confirm · vehicle PIN required",
    tapConfirm: "Tap again to confirm", on: "On", off: "Off",
    climate: "Climate", quickHeat: "Quick heat", quickCool: "Quick cool", defrost: "Defrost",
    preheat: "Battery preheat", steering: "Steering wheel", mirrors: "Mirror heat",
    schedule: "Charge schedule", openTrunk: "Open trunk", closeTrunk: "Close trunk",
    openWindows: "Open windows", closeWindows: "Close windows",
    openSunshade: "Open sunshade", closeSunshade: "Close sunshade",
    unlockCharger: "Release cable", sent: "Sent: {x}", failed: "Failed: {x}",
    notFound: "No Leapmotor vehicle found. Set device_id or entity_prefix in the card configuration.",
    driverDoor: "Driver door", passengerDoor: "Passenger door",
    rearLeftDoor: "Rear left door", rearRightDoor: "Rear right door",
  },
  sl: {
    now: "Zdaj", justNow: "pravkar", updated: "posodobljeno {x}",
    locked: "Zaklenjeno", unlocked: "Odklenjeno", parked: "Parkirano", driving: "Vožnja",
    charging: "Polnjenje", pluggedIn: "Priključeno", unplugged: "Ni priključeno", finished: "Polnjenje končano",
    rangeWord: "doseg {x}", limitWord: "meja {x}", odometer: "Prevoženo", outside: "Zunaj",
    interior: "Notranjost", chargeLimit: "Meja polnjenja", speed: "Hitrost", gear: "Prestava",
    consumption: "Poraba", lastUpdate: "Posodobljeno", range: "Doseg", fuel: "Gorivo",
    home: "Doma", away: "Na poti", refresh: "Osveži", insideChip: "Notri",
    secureChip: "Zaklenjeno in zaprto",
    check: "Pregled vozila", cloudStatus: "stanje v oblaku", allSecure: "Vse je varno",
    allSecureSub: "Zaklenjeno — vrata, okna in prtljažnik zaprti", attention: "Potrebna pozornost",
    doorsClosed: "Vsa vrata zaprta", doorsOpen: "Odprta vrata: {n}",
    windowsClosed: "Okna zaprta", windowsOpen: "Odprta okna: {n}",
    trunkClosed: "Prtljažnik zaprt", trunkOpen: "Prtljažnik odprt",
    tirePressure: "Tlak v pnevmatikah {x}", tireLow: "Nizek tlak v pnevmatikah {x}",
    batteryLevel: "Baterija {x}", updatedAgo: "Posodobljeno {x}", stale: "Podatki so stari {x}",
    ok: "OK", open: "ODPRTO", low: "NIZKO", stalePill: "STARO",
    subLock: "centralno zaklepanje", subDoors: "4 vrata", subWindows: "okna in strešno okno",
    subTrunk: "prtljažna vrata", subTires: "vsa štiri kolesa", subBattery: "stanje napolnjenosti",
    subData: "zadnji stik z vozilom",
    footnote: "Podatki iz oblaka Leapmotor — lahko zamujajo za vozilom.",
    lock: "Zakleni", unlock: "Odkleni", findCar: "Poišči avto",
    last24: "Zadnjih 24 ur", tabBattery: "Baterija", tabRange: "Doseg", tabPower: "Moč",
    sum24: "V zadnjih 24 urah {charged} napolnjeno in {driven} prevoženo.",
    sumCharged: "V zadnjih 24 urah {charged} napolnjeno.", sumDriven: "V zadnjih 24 urah {driven} prevoženo.",
    peakLow: "Najvišje {max} ob {tmax}, najnižje {min} ob {tmin}.", peakOnly: "Največ {max} ob {tmax}.",
    sumNoChange: "Zadnjih 24 ur brez sprememb.",
    noHistory: "Zgodovine še ni — graf se zapolni, ko Home Assistant beleži podatke.",
    nowPill: "zdaj",
    last7: "Zadnjih 7 dni", today: "Danes", longest: "Najdaljša", total: "Skupaj",
    drivingDays: "Dni vožnje", noWeek: "Dnevne zgodovine iz oblaka še ni.",
    chargingTitle: "Polnjenje", done: "konec", remaining: "preostalo", lastCharge: "zadnje polnjenje {x}",
    battery: "baterija", limit: "meja",
    energyTires: "Energija in pnevmatike", sixWeek: "6-tedensko povprečje",
    ratings: ["Zelo varčno", "Varčno", "Zmerno", "Visoko", "Zelo visoko"],
    lastWeek: "Prejšnji teden", drivingE: "vožnja", climateE: "klima", otherE: "drugo",
    FL: "Spredaj L", FR: "Spredaj D", RL: "Zadaj L", RR: "Zadaj D",
    controls: "Daljinsko upravljanje", confirmHint: "Za potrditev tapni dvakrat · potreben PIN vozila",
    tapConfirm: "Tapni še enkrat", on: "Vklopljeno", off: "Izklopljeno",
    climate: "Klima", quickHeat: "Hitro gretje", quickCool: "Hitro hlajenje", defrost: "Odmrzovanje",
    preheat: "Gretje baterije", steering: "Gretje volana", mirrors: "Gretje ogledal",
    schedule: "Urnik polnjenja", openTrunk: "Odpri prtljažnik", closeTrunk: "Zapri prtljažnik",
    openWindows: "Odpri okna", closeWindows: "Zapri okna",
    openSunshade: "Odpri senčnik", closeSunshade: "Zapri senčnik",
    unlockCharger: "Sprosti kabel", sent: "Poslano: {x}", failed: "Ni uspelo: {x}",
    notFound: "Vozilo Leapmotor ni najdeno. V nastavitvah kartice nastavi device_id ali entity_prefix.",
    driverDoor: "Voznikova vrata", passengerDoor: "Sovoznikova vrata",
    rearLeftDoor: "Zadnja leva vrata", rearRightDoor: "Zadnja desna vrata",
  },
  de: {
    now: "Jetzt", justNow: "gerade eben", updated: "aktualisiert {x}",
    locked: "Verriegelt", unlocked: "Entriegelt", parked: "Geparkt", driving: "Fährt",
    charging: "Lädt", pluggedIn: "Eingesteckt", unplugged: "Nicht eingesteckt", finished: "Laden abgeschlossen",
    rangeWord: "{x} Reichweite", limitWord: "Limit {x}", odometer: "Kilometerstand", outside: "Außen",
    interior: "Innen", chargeLimit: "Ladelimit", speed: "Tempo", gear: "Gang",
    consumption: "Verbrauch", lastUpdate: "Aktualisiert", range: "Reichweite", fuel: "Kraftstoff",
    home: "Zuhause", away: "Unterwegs", refresh: "Aktualisieren", insideChip: "Innen",
    secureChip: "Verriegelt & geschlossen",
    check: "Fahrzeugcheck", cloudStatus: "Cloud-Status", allSecure: "Alles sicher",
    allSecureSub: "Verriegelt — Türen, Fenster und Kofferraum zu", attention: "Bitte prüfen",
    doorsClosed: "Alle Türen zu", doorsOpen: "Türen offen: {n}",
    windowsClosed: "Fenster geschlossen", windowsOpen: "Fenster offen: {n}",
    trunkClosed: "Kofferraum zu", trunkOpen: "Kofferraum offen",
    tirePressure: "Reifendruck {x}", tireLow: "Niedriger Reifendruck {x}",
    batteryLevel: "Akku {x}", updatedAgo: "Aktualisiert {x}", stale: "Daten sind {x} alt",
    ok: "OK", open: "OFFEN", low: "NIEDRIG", stalePill: "ALT",
    subLock: "Zentralverriegelung", subDoors: "4 Türen", subWindows: "Fenster & Schiebedach",
    subTrunk: "Heckklappe", subTires: "alle vier Räder", subBattery: "Ladezustand",
    subData: "letzter Kontakt zum Auto",
    footnote: "Aus der Leapmotor-Cloud abgefragt — Werte können dem Auto hinterherhinken.",
    lock: "Verriegeln", unlock: "Entriegeln", findCar: "Auto finden",
    last24: "Letzte 24 Stunden", tabBattery: "Akku", tabRange: "Reichweite", tabPower: "Leistung",
    sum24: "{charged} geladen und {driven} gefahren in den letzten 24 h.",
    sumCharged: "{charged} geladen in den letzten 24 h.", sumDriven: "{driven} gefahren in den letzten 24 h.",
    peakLow: "Höchststand {max} um {tmax}, Tiefststand {min} um {tmin}.", peakOnly: "Spitze {max} um {tmax}.",
    sumNoChange: "Keine Veränderung in den letzten 24 h.",
    noHistory: "Noch kein Verlauf — das Diagramm füllt sich, sobald Home Assistant Daten aufzeichnet.",
    nowPill: "jetzt",
    last7: "Letzte 7 Tage", today: "Heute", longest: "Längste", total: "Gesamt",
    drivingDays: "Fahrtage", noWeek: "Noch kein Tagesverlauf aus der Cloud.",
    chargingTitle: "Laden", done: "fertig", remaining: "verbleibend", lastCharge: "letzte Ladung {x}",
    battery: "Akku", limit: "Limit",
    energyTires: "Energie & Reifen", sixWeek: "6-Wochen-Schnitt",
    ratings: ["Sehr effizient", "Effizient", "Mittel", "Hoch", "Sehr hoch"],
    lastWeek: "Letzte Woche", drivingE: "Fahren", climateE: "Klima", otherE: "Sonstiges",
    FL: "Vorne L", FR: "Vorne R", RL: "Hinten L", RR: "Hinten R",
    controls: "Fernsteuerung", confirmHint: "Zum Bestätigen zweimal tippen · Fahrzeug-PIN nötig",
    tapConfirm: "Erneut tippen", on: "An", off: "Aus",
    climate: "Klima", quickHeat: "Schnell heizen", quickCool: "Schnell kühlen", defrost: "Entfrosten",
    preheat: "Akku vorheizen", steering: "Lenkradheizung", mirrors: "Spiegelheizung",
    schedule: "Ladeplan", openTrunk: "Kofferraum öffnen", closeTrunk: "Kofferraum schließen",
    openWindows: "Fenster öffnen", closeWindows: "Fenster schließen",
    openSunshade: "Sonnenschutz öffnen", closeSunshade: "Sonnenschutz schließen",
    unlockCharger: "Kabel freigeben", sent: "Gesendet: {x}", failed: "Fehlgeschlagen: {x}",
    notFound: "Kein Leapmotor-Fahrzeug gefunden. Setze device_id oder entity_prefix in der Kartenkonfiguration.",
    driverDoor: "Fahrertür", passengerDoor: "Beifahrertür",
    rearLeftDoor: "Tür hinten links", rearRightDoor: "Tür hinten rechts",
  },
};

/* ------------------------------------------------------------------ */
/* Entity map: card key -> [domain, translation_key, english slug]     */
/* ------------------------------------------------------------------ */

const SPEC = {
  battery: ["sensor", "battery_percent", "battery"],
  batteryPrecise: ["sensor", "battery_percent_precise", "precise_battery"],
  range: ["sensor", "remaining_range_km", "range"],
  odometer: ["sensor", "odometer_km", "odometer"],
  speed: ["sensor", "speed_kmh", "speed"],
  gear: ["sensor", "gear", "gear"],
  interior: ["sensor", "interior_temp_c", "interior_temperature"],
  outdoor: ["sensor", "outdoor_temp_c", "outdoor_temperature"],
  chargeLimit: ["sensor", "charge_limit_percent", "charge_limit"],
  remaining: ["sensor", "remaining_charge_minutes", "remaining_charge_time"],
  finish: ["sensor", "charging_finish_time", "charging_finish_time"],
  power: ["sensor", "charging_power_kw", "charging_power"],
  current: ["sensor", "charging_current_a", "charging_current"],
  voltage: ["sensor", "charging_voltage_v", "charging_voltage"],
  connection: ["sensor", "charging_connection_state", "charging_connection"],
  vehicleState: ["sensor", "vehicle_state", "vehicle_state"],
  lastUpdate: ["sensor", "last_vehicle_update", "last_vehicle_update"],
  week: ["sensor", "last_7_days_mileage_km", "last_7_days_mileage"],
  avg: ["sensor", "average_consumption_6w_kwh_100km", "six_week_average_consumption"],
  lwDriving: ["sensor", "last_week_driving_energy_percent", "last_week_driving_energy"],
  lwClimate: ["sensor", "last_week_climate_energy_percent", "last_week_climate_energy"],
  lwOther: ["sensor", "last_week_other_energy_percent", "last_week_other_energy"],
  lastCharge: ["sensor", "last_charge_energy_kwh", "last_charge_energy"],
  sunshadePos: ["sensor", "sunshade_position", "sunshade_position"],
  tireFL: ["sensor", "tire_pressure_front_left_bar", "front_left_tire_pressure"],
  tireFR: ["sensor", "tire_pressure_front_right_bar", "front_right_tire_pressure"],
  tireRL: ["sensor", "tire_pressure_rear_left_bar", "rear_left_tire_pressure"],
  tireRR: ["sensor", "tire_pressure_rear_right_bar", "rear_right_tire_pressure"],
  fuel: ["sensor", "fuel_level_percent", "fuel_level_percent"],
  isCharging: ["binary_sensor", "is_charging", "charging"],
  isPlugged: ["binary_sensor", "is_plugged_in", "charge_cable_plugged_in"],
  isDriving: ["binary_sensor", "is_driving", "is_driving"],
  doorDriver: ["binary_sensor", "driver_door_open", "driver_door"],
  doorPassenger: ["binary_sensor", "passenger_door_open", "passenger_door"],
  doorRearLeft: ["binary_sensor", "rear_left_door_open", "rear_left_door"],
  doorRearRight: ["binary_sensor", "rear_right_door_open", "rear_right_door"],
  trunk: ["binary_sensor", "trunk_open", "trunk"],
  winFL: ["binary_sensor", "front_left_window_open", "front_left_window"],
  winFR: ["binary_sensor", "front_right_window_open", "front_right_window"],
  winRL: ["binary_sensor", "rear_left_window_open", "rear_left_window"],
  winRR: ["binary_sensor", "rear_right_window_open", "rear_right_window"],
  skylight: ["binary_sensor", "skylight_open", "skylight_open"],
  climateOn: ["binary_sensor", "climate_on", "climate"],
  lock: ["lock", "vehicle_lock", "lock"],
  tracker: ["device_tracker", "location", "location"],
  picture: ["image", "vehicle_picture", "vehicle_picture"],
  climateSwitch: ["switch", "climate_control", "climate"],
  preheat: ["switch", "battery_preheat", "battery_preheat"],
  steeringHeat: ["switch", "steering_wheel_heat", "steering_wheel_heating"],
  mirrorHeat: ["switch", "rearview_mirror_heat", "mirror_heating"],
  chargeSchedule: ["switch", "charging_schedule", "charging_schedule"],
  refreshBtn: ["button", "refresh_data", "refresh_data"],
  unlockCharger: ["button", "unlock_charger", "unlock_charger"],
  trunkOpenBtn: ["button", "open_trunk", "open_trunk"],
  trunkCloseBtn: ["button", "close_trunk", "close_trunk"],
  findBtn: ["button", "find_vehicle", "find_vehicle"],
  windowsOpenBtn: ["button", "open_windows", "open_windows"],
  windowsCloseBtn: ["button", "close_windows", "close_windows"],
  sunshadeOpenBtn: ["button", "open_sunshade", "open_sunshade"],
  sunshadeCloseBtn: ["button", "close_sunshade", "close_sunshade"],
  quickCoolBtn: ["button", "quick_cool", "quick_cool"],
  quickHeatBtn: ["button", "quick_heat", "quick_heat"],
  defrostBtn: ["button", "windshield_defrost", "windshield_defrost"],
};

const DOORS = [
  ["doorDriver", "driverDoor"], ["doorPassenger", "passengerDoor"],
  ["doorRearLeft", "rearLeftDoor"], ["doorRearRight", "rearRightDoor"],
];
const WINDOWS = ["winFL", "winFR", "winRL", "winRR", "skylight"];
const TIRES = [["tireFL", "FL"], ["tireFR", "FR"], ["tireRL", "RL"], ["tireRR", "RR"]];
const ALL_SECTIONS = ["hero", "check", "chart", "week", "charging", "energy", "controls"];
const TIRE_LOW_BAR = 1.9;
const STALE_MINUTES = 120;

/* ------------------------------------------------------------------ */
/* Icons (24px line icons, drawn for this card)                        */
/* ------------------------------------------------------------------ */

const ICONS = {
  lock: '<rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  unlock: '<rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 7.6-1.8"/>',
  bolt: '<path d="M13 2.5 5 13.5h6l-1 8 8-11h-6l1-8Z"/>',
  plug: '<path d="M9 2.5v4.5M15 2.5v4.5M6.5 7h11v3.5a5.5 5.5 0 0 1-11 0V7ZM12 16v5.5"/>',
  car: '<path d="M3.5 16v-3l1.9-4.9A2 2 0 0 1 7.3 6.8h9.4a2 2 0 0 1 1.9 1.3L20.5 13v3"/><path d="M3.5 12.5h17M3.5 16h2M9 16h6M18.5 16h2"/><circle cx="7.2" cy="16.4" r="1.9"/><circle cx="16.8" cy="16.4" r="1.9"/>',
  door: '<path d="M5.5 21V9.5L11 3h7.5v18h-13Z"/><path d="M5.5 11.5h13M14.5 15h2"/>',
  window: '<path d="M3.5 18 8.5 6h12v12h-17Z"/><path d="M13 6v12"/>',
  trunk: '<path d="M3.5 14h17v3.5a2.5 2.5 0 0 1-2.5 2.5H6a2.5 2.5 0 0 1-2.5-2.5V14Z"/><path d="m5.5 14 2-8h9l2 8M10 17h4"/>',
  tire: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.5"/><path d="M12 3v5.5M12 15.5V21M3 12h5.5M15.5 12H21"/>',
  battery: '<rect x="2.5" y="7" width="17" height="10" rx="2.5"/><path d="M22 10.5v3M6 10.5v3M9.5 10.5v3M13 10.5v3"/>',
  cloud: '<path d="M7 18.5a4.5 4.5 0 0 1-.5-8.97A6 6 0 0 1 18 9a4.5 4.5 0 0 1-.5 9.5H7Z"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  alert: '<path d="M12 3.5 2.5 20h19L12 3.5Z"/><path d="M12 10v4.5M12 17.4v.1"/>',
  refresh: '<path d="M20 11.5A8 8 0 0 0 5.6 6.4L4 8M4 3.5V8h4.5M4 12.5a8 8 0 0 0 14.4 5.1L20 16M20 20.5V16h-4.5"/>',
  pin: '<path d="M12 21s7-6.2 7-11.5a7 7 0 0 0-14 0C5 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/>',
  thermo: '<path d="M14 14.5V5a2 2 0 0 0-4 0v9.5a4 4 0 1 0 4 0Z"/><path d="M12 9v7.5"/>',
  fan: '<circle cx="12" cy="12" r="1.6"/><path d="M12 10.4C11 7 12 3.5 15 3.5c2.5 0 3 3 .5 4.8L13.4 10M13.6 12c3.4-1 6.9 0 6.9 3 0 2.5-3 3-4.8.5L14 13.4M12 13.6c1 3.4 0 6.9-3 6.9-2.5 0-3-3-.5-4.8l2.1-1.7M10.4 12C7 13 3.5 12 3.5 9c0-2.5 3-3 4.8-.5L10 10.6"/>',
  snow: '<path d="M12 2.5v19M4 7l16 10M20 7 4 17"/><path d="m9 4.2 3 2.3 3-2.3M9 19.8l3-2.3 3 2.3"/>',
  flame: '<path d="M12 21.5c3.9 0 6.8-2.6 6.8-6.5 0-3.5-2.3-5.7-4.1-8-.6 1.9-1.5 3-2.7 3.5.3-2.9-1-5.9-3.5-8.3C8.4 5.6 5.2 8.6 5.2 15c0 3.9 2.9 6.5 6.8 6.5Z"/>',
  defrost: '<path d="M3 8.5c3.5-3 14.5-3 18 0l-2 9.5H5L3 8.5Z"/><path d="M9 10.5c-.9 1.1.9 2 0 3.2M12 10.5c-.9 1.1.9 2 0 3.2M15 10.5c-.9 1.1.9 2 0 3.2"/>',
  wheel: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.2"/><path d="M3.4 10.6c5.2 1.3 12 1.3 17.2 0M10.6 14l-2 6.6M13.4 14l2 6.6"/>',
  mirror: '<path d="M4 9c0-2.5 2-3.5 5-3.5h6c3 0 5 1.2 5 3.5v2.5c0 2.5-2 3.5-5 3.5H9c-3 0-5-1-5-3.5V9Z"/><path d="M12 15v4.5M9 19.5h6"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4M8 14h2M14 14h2M8 17h2"/>',
  sunshade: '<path d="M3 6.5h18M5 6.5V17h14V6.5"/><path d="M5 10h14M5 13.5h14" opacity=".55"/>',
  find: '<circle cx="12" cy="12" r="2.2"/><path d="M8 8a5.6 5.6 0 0 0 0 8M16 8a5.6 5.6 0 0 1 0 8M5.2 5.2a9.6 9.6 0 0 0 0 13.6M18.8 5.2a9.6 9.6 0 0 1 0 13.6"/>',
  moon: '<path d="M19.5 14.5A8 8 0 1 1 9.5 4.5a6.4 6.4 0 0 0 10 10Z"/>',
  parked: '<rect x="4" y="4" width="16" height="16" rx="4.5"/><path d="M10 16.5v-9h3.2a2.6 2.6 0 0 1 0 5.2H10"/>',
  gauge: '<path d="M4.4 17.5a8.6 8.6 0 1 1 15.2 0"/><path d="m12 13.5 4-4.5"/>',
  leaf: '<path d="M5 19.5c0-8.5 5.5-14 15-14.5-.5 9.5-6 15-14 15"/><path d="m5 19.5 8.5-8.5"/>',
  arrowUp: '<path d="M12 19V5.5M6.5 11 12 5.5 17.5 11"/>',
  road: '<path d="M8.5 3 4 21M15.5 3 20 21M12 4.5v2.5M12 10.5v3M12 17v2.5"/>',
  route: '<circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="6" r="2.5"/><path d="M8.5 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.5"/>',
};

const icon = (name, cls = "") =>
  `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ` +
  `stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ""}</svg>`;

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */

const esc = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const f1 = (n) => (Math.round(n * 10) / 10).toString();
const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
}

function mixHex(a, b, t) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return "#" + pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, "0")).join("");
}

function rampColor(stops, t) {
  t = clamp(t, 0, 1);
  for (let i = 1; i < stops.length; i++) {
    if (t <= stops[i][0]) {
      const [p0, c0] = stops[i - 1];
      const [p1, c1] = stops[i];
      return mixHex(c0, c1, (t - p0) / (p1 - p0 || 1));
    }
  }
  return stops[stops.length - 1][1];
}

const EFFICIENCY_STOPS = [
  [0, "#34d399"], [0.3, "#a3e635"], [0.5, "#facc15"], [0.7, "#fb923c"], [0.85, "#f43f5e"], [1, "#a855f7"],
];

/** Monotone cubic interpolation (Fritsch–Carlson) through points. */
function smoothPath(pts) {
  const n = pts.length;
  if (!n) return "";
  const r = (v) => Math.round(v * 10) / 10;
  if (n === 1) return `M${r(pts[0][0])},${r(pts[0][1])}`;
  const dx = [], m = [], t = new Array(n);
  for (let i = 0; i < n - 1; i++) {
    dx[i] = pts[i + 1][0] - pts[i][0];
    m[i] = dx[i] ? (pts[i + 1][1] - pts[i][1]) / dx[i] : 0;
  }
  t[0] = m[0];
  t[n - 1] = m[n - 2];
  for (let i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) { t[i] = 0; t[i + 1] = 0; continue; }
    const a = t[i] / m[i], b = t[i + 1] / m[i], s = a * a + b * b;
    if (s > 9) { const k = 3 / Math.sqrt(s); t[i] = k * a * m[i]; t[i + 1] = k * b * m[i]; }
  }
  let d = `M${r(pts[0][0])},${r(pts[0][1])}`;
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3;
    d += `C${r(pts[i][0] + h)},${r(pts[i][1] + t[i] * h)} ${r(pts[i + 1][0] - h)},${r(pts[i + 1][1] - t[i + 1] * h)} ${r(pts[i + 1][0])},${r(pts[i + 1][1])}`;
  }
  return d;
}

/** Value of a step series at time t (last known value at or before t). */
function valueAt(series, t) {
  let v = null;
  for (const [ts, val] of series) {
    if (ts > t) break;
    v = val;
  }
  return v ?? (series.length ? series[0][1] : null);
}

/* ------------------------------------------------------------------ */
/* Scene artwork                                                        */
/* ------------------------------------------------------------------ */

function pine(x, base, h, fill) {
  const w = h * 0.42;
  const tiers = [0, 0.3, 0.55].map((k, i) => {
    const top = base - h + k * h;
    const bw = w * (0.55 + i * 0.25);
    const bottom = top + h * 0.48;
    return `<path d="M${f1(x)} ${f1(top)}L${f1(x + bw)} ${f1(bottom)}H${f1(x - bw)}Z" fill="${fill}"/>`;
  });
  return `<rect x="${f1(x - 1.5)}" y="${f1(base - h * 0.12)}" width="3" height="${f1(h * 0.14)}" fill="${fill}"/>${tiers.join("")}`;
}

function sceneSvg(mode) {
  const night = mode !== "day";
  const P = night
    ? { sky: ["#070d24", "#0e1a42", "#1b2a60"], cloud: "#25356c", far: "#16224e", mid: "#121c43", near: "#0d1534", tree: "#0a112b", fog: "#0c1430" }
    : { sky: ["#0c2350", "#1d4785", "#4f7cb4"], cloud: "#5d86bd", far: "#1d4067", mid: "#16345a", near: "#10284a", tree: "#0c2140", fog: "#0e1d3a" };
  const r = rng(11);
  let stars = "";
  if (night) {
    for (let i = 0; i < 110; i++) {
      const x = r() * 1200, y = r() * 300;
      const big = r() > 0.9;
      const rad = big ? 1.3 + r() * 0.6 : 0.5 + r() * 0.75;
      const o = 0.25 + r() * 0.7;
      stars += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${rad.toFixed(2)}" fill="#fff" opacity="${o.toFixed(2)}"${i % 6 === 0 ? ` class="tw" style="animation-delay:${(r() * 5).toFixed(1)}s"` : ""}/>`;
    }
  }
  const glow = night
    ? `<circle cx="600" cy="-8" r="280" fill="url(#lm-halo)"/><circle cx="600" cy="-8" r="42" fill="#e8ecf8"/><circle cx="588" cy="-14" r="7" fill="#cfd6ea" opacity=".6"/><circle cx="614" cy="8" r="5" fill="#cfd6ea" opacity=".5"/>`
    : `<circle cx="700" cy="120" r="300" fill="url(#lm-halo)"/><circle cx="700" cy="120" r="54" fill="#ffd27a" opacity=".22" filter="url(#lm-soft)"/><circle cx="700" cy="120" r="27" fill="url(#lm-sun)"/>`;
  const cloud = (cx, cy, s, o) =>
    `<g opacity="${o}" filter="url(#lm-soft)"><ellipse cx="${cx}" cy="${cy}" rx="${170 * s}" ry="${46 * s}" fill="${P.cloud}"/>` +
    `<ellipse cx="${cx - 70 * s}" cy="${cy - 22 * s}" rx="${80 * s}" ry="${44 * s}" fill="${P.cloud}"/>` +
    `<ellipse cx="${cx + 50 * s}" cy="${cy - 34 * s}" rx="${96 * s}" ry="${56 * s}" fill="${P.cloud}"/></g>`;
  const windows = night ? "#ffb547" : "#f6d39a";
  const house =
    `<g transform="translate(828 240)">` +
    `<path d="M-6 52V18L34 -8L74 18V52Z" fill="${P.tree}"/>` +
    `<path d="M74 52V26h38v26Z" fill="${P.tree}"/>` +
    `<path d="M70 28 93 12l23 16" fill="none" stroke="${P.tree}" stroke-width="6"/>` +
    `<rect x="44" y="-38" width="12" height="34" fill="${P.tree}"/><path d="M41 -38 50 -58 59 -38Z" fill="${P.tree}"/>` +
    `<g fill="${windows}" filter="url(#lm-glow)"><rect x="10" y="24" width="7" height="9" rx="1"/><rect x="26" y="24" width="7" height="9" rx="1"/><rect x="88" y="34" width="10" height="7" rx="1" opacity=".75"/><rect x="47" y="-28" width="5" height="7" rx="1"/></g>` +
    `</g>`;
  const trees = [
    [70, 432, 92], [120, 438, 70], [160, 430, 110], [205, 440, 64],
    [455, 420, 74], [492, 425, 96], [530, 428, 60],
    [700, 412, 68], [738, 416, 90], [1010, 410, 84], [1052, 414, 118], [1098, 418, 76], [1150, 412, 96],
  ].map(([x, b, h]) => pine(x, b, h, P.tree)).join("");
  return `
<svg class="sky" viewBox="0 0 1200 520" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
  <defs>
    <linearGradient id="lm-sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${P.sky[0]}"/><stop offset=".55" stop-color="${P.sky[1]}"/><stop offset="1" stop-color="${P.sky[2]}"/>
    </linearGradient>
    <radialGradient id="lm-halo"><stop offset="0" stop-color="${night ? "#c9d4ff" : "#ffcf7a"}" stop-opacity="${night ? ".22" : ".35"}"/><stop offset="1" stop-color="${night ? "#c9d4ff" : "#ffcf7a"}" stop-opacity="0"/></radialGradient>
    <radialGradient id="lm-sun"><stop offset="0" stop-color="#fff4d1"/><stop offset=".7" stop-color="#ffd27a"/><stop offset="1" stop-color="#f6b13d"/></radialGradient>
    <linearGradient id="lm-fog" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P.fog}" stop-opacity="0"/><stop offset="1" stop-color="${P.fog}" stop-opacity=".96"/></linearGradient>
    <pattern id="lm-rows" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(-7)"><rect width="16" height="2.2" fill="#fff" opacity=".05"/></pattern>
    <clipPath id="lm-midclip"><path d="M0 368C200 330 420 306 640 318S980 292 1200 304V520H0Z"/></clipPath>
    <filter id="lm-soft" x="-30%" y="-60%" width="160%" height="220%"><feGaussianBlur stdDeviation="14"/></filter>
    <filter id="lm-glow" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="2.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <rect width="1200" height="520" fill="url(#lm-sky)"/>
  ${glow}
  <g>${stars}</g>
  ${cloud(330, 120, 1.25, night ? 0.5 : 0.35)}${cloud(860, 70, 1.05, night ? 0.42 : 0.3)}${cloud(1120, 170, 0.8, night ? 0.35 : 0.25)}
  <path d="M0 300C150 252 300 272 450 286S750 238 900 254S1100 228 1200 244V520H0Z" fill="${P.far}"/>
  <path d="M0 368C200 330 420 306 640 318S980 292 1200 304V520H0Z" fill="${P.mid}"/>
  <g clip-path="url(#lm-midclip)"><rect x="250" y="300" width="560" height="120" fill="url(#lm-rows)"/></g>
  ${house}
  <path d="M0 424C240 398 520 402 760 412S1080 400 1200 406V520H0Z" fill="${P.near}"/>
  ${trees}
  <rect y="360" width="1200" height="160" fill="url(#lm-fog)"/>
</svg>`;
}

/** Generic crossover silhouette used when the cloud does not provide a vehicle picture. */
function carSvg(night) {
  return `
<svg class="carsvg" viewBox="0 0 460 170" aria-hidden="true">
  <defs>
    <linearGradient id="lm-body" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#eef2fa"/><stop offset=".45" stop-color="#b9c4d8"/><stop offset="1" stop-color="#5b6884"/>
    </linearGradient>
    <linearGradient id="lm-glass" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#1c2a4f"/><stop offset=".55" stop-color="#0b1330"/><stop offset="1" stop-color="#16244a"/>
    </linearGradient>
    <radialGradient id="lm-rim"><stop offset="0" stop-color="#d9e0ec"/><stop offset=".7" stop-color="#7d8aa3"/><stop offset="1" stop-color="#4a5670"/></radialGradient>
    <linearGradient id="lm-beam" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff3d6" stop-opacity=".55"/><stop offset="1" stop-color="#fff3d6" stop-opacity="0"/></linearGradient>
    <filter id="lm-carshadow" x="-20%" y="-200%" width="140%" height="500%"><feGaussianBlur stdDeviation="6"/></filter>
  </defs>
  <ellipse cx="232" cy="156" rx="214" ry="10" fill="#000" opacity=".55" filter="url(#lm-carshadow)"/>
  ${night ? '<path d="M438 98 L460 84 L460 122 Z" fill="url(#lm-beam)" opacity=".8"/>' : ""}
  <path d="M30 126L26 104Q24 86 36 80L52 70Q70 50 104 44L140 38Q200 30 262 33Q292 35 314 50L344 70Q400 76 428 88Q440 94 440 108L438 126H386A34 34 0 0 0 318 126H146A34 34 0 0 0 78 126Z" fill="url(#lm-body)"/>
  <path d="M74 74Q92 56 116 50L146 45Q200 39 258 41Q284 43 302 55L326 72Z" fill="url(#lm-glass)"/>
  <path d="M128 47 123 74M198 41 196 74" stroke="#aab6cb" stroke-width="6"/>
  <path d="M96 60 L150 47 L140 60 Z" fill="#fff" opacity=".08"/>
  <path d="M40 92Q240 82 432 97" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="1.5"/>
  <path d="M200 77 198 124M126 77 134 122" stroke="#3d4860" stroke-opacity=".5" stroke-width="1.2"/>
  <path d="M146 126H318L314 114H150Z" fill="#1d2538" opacity=".55"/>
  <rect x="168" y="90" width="18" height="3.2" rx="1.6" fill="#3d4860" opacity=".7"/>
  <rect x="244" y="90" width="18" height="3.2" rx="1.6" fill="#3d4860" opacity=".7"/>
  <path d="M308 62q12-3 16 6l-10 2Z" fill="#8e9bb5"/>
  <path d="M404 86Q426 88 439 98" fill="none" stroke="#fff6e0" stroke-width="3.2" stroke-linecap="round"/>
  <path d="M28 88 46 80" stroke="#ff4d4d" stroke-width="4" stroke-linecap="round" ${night ? 'filter="url(#lm-glow)"' : ""}/>
  ${[112, 352].map((cx) => `
  <g transform="translate(${cx} 128)">
    <circle r="29" fill="#0a0e19"/><circle r="19.5" fill="url(#lm-rim)"/>
    ${[0, 72, 144, 216, 288].map((a) => `<path d="M0 -4.5 L0 -17" transform="rotate(${a})" stroke="#2b3449" stroke-width="4.2" stroke-linecap="round"/>`).join("")}
    <circle r="5" fill="#2b3449"/><circle r="2" fill="#c7cfdd"/>
  </g>`).join("")}
</svg>`;
}

/* ------------------------------------------------------------------ */
/* Styles                                                               */
/* ------------------------------------------------------------------ */

const STYLE = `
:host{
  --lm-bg:#080d1c;--lm-panel:#0f1729;--lm-line:rgba(148,163,184,.13);--lm-line-2:rgba(148,163,184,.07);
  --lm-text:#e9eef8;--lm-soft:#c3cbe0;--lm-muted:#8a95ab;--lm-dim:#5f6a82;
  --lm-amber:#f6a823;--lm-amber-2:#ffc461;--lm-green:#34d399;--lm-red:#fb7185;--lm-sky:#38bdf8;--lm-violet:#a78bfa;
  --lm-font:'LM Outfit','Outfit',ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;
  --lm-mono:'LM JetBrains Mono','JetBrains Mono',ui-monospace,'SF Mono',Menlo,Consolas,monospace;
  display:block;container-type:inline-size;container-name:lmcard;
  font-family:var(--lm-font);color:var(--lm-text);-webkit-font-smoothing:antialiased;
}
*{box-sizing:border-box}
button{font:inherit;color:inherit;cursor:pointer;border:0;background:none;padding:0}
.ic{width:18px;height:18px;flex:none}
.lm{display:grid;grid-template-columns:minmax(0,1fr);gap:14px}
.lm.backdrop{background:radial-gradient(1200px 500px at 20% -10%,#111b3a 0%,transparent 60%),var(--lm-bg);padding:14px;border-radius:26px}
.stack{display:grid;gap:14px;align-content:stretch;min-width:0}
.panel{position:relative;min-width:0;overflow:hidden;border-radius:20px;padding:18px 20px;
  background:linear-gradient(180deg,rgba(21,30,51,.96),rgba(13,20,36,.98));
  border:1px solid var(--lm-line);box-shadow:inset 0 1px 0 rgba(255,255,255,.035),0 24px 48px -30px rgba(0,0,0,.7)}
.ptitle{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 0 14px}
.ptitle h3{margin:0;font-size:11px;font-weight:600;letter-spacing:.22em;text-transform:uppercase;color:var(--lm-muted)}
.ptitle .meta{font-size:11px;color:var(--lm-dim);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mono{font-family:var(--lm-mono);font-feature-settings:"zero" 1}
.dot{width:7px;height:7px;border-radius:50%;background:var(--c,var(--lm-amber));box-shadow:0 0 10px var(--c,var(--lm-amber));flex:none;display:inline-block}
.dot.pulse{animation:lm-pulse 1.8s ease-in-out infinite}
.clickable{cursor:pointer}
[hidden]{display:none!important}
.contents{display:contents}
.stripwrap{grid-area:strip;min-width:0}
.sub .ic{width:13px;height:13px;color:var(--lm-amber)}
.empty{color:var(--lm-muted);font-size:13px;padding:24px 4px;text-align:center}

/* ---------- hero ---------- */
.hero{padding:0;min-height:470px;display:flex;background:#0b1430}
.scene{position:absolute;inset:0;overflow:hidden}
.scene svg.sky{position:absolute;inset:0;width:100%;height:100%;display:block}
.hero-ui{position:relative;z-index:2;flex:1;display:grid;min-width:0;
  grid-template-columns:minmax(0,1fr) minmax(0,1.05fr);grid-template-rows:1fr auto;
  grid-template-areas:"info car" "strip strip";padding:22px 24px 18px;column-gap:18px}
.info{grid-area:info;min-width:0}
.eyebrow{display:flex;align-items:center;gap:8px;font-size:11px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:var(--lm-soft)}
.name{margin:8px 0 2px;font-size:27px;line-height:1.1;font-weight:700;letter-spacing:-.01em;text-shadow:0 2px 18px rgba(0,0,0,.4)}
.sub{font-size:13px;color:#b9c3d9;display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.big{display:flex;align-items:flex-start;margin:16px 0 6px;font-weight:700;font-size:98px;line-height:.86;letter-spacing:-.045em;text-shadow:0 6px 30px rgba(0,0,0,.35)}
.big .u{font-size:30px;line-height:1;font-weight:500;color:var(--lm-amber);margin:8px 0 0 6px;letter-spacing:0}
.state{display:flex;align-items:center;gap:9px;font-size:16px;font-weight:600;margin-top:4px}
.state .ic{width:17px;height:17px;color:var(--lm-amber-2)}
.metaline{display:flex;gap:6px 14px;flex-wrap:wrap;font-size:12px;color:#a9b3ca;margin-top:9px}
.metaline b{color:var(--lm-text);font-weight:600}
.metaline .ic{width:12px;height:12px;vertical-align:-1px}
.carzone{grid-area:car;position:relative;min-height:150px;display:flex;align-items:flex-end;justify-content:center;padding-bottom:12px}
.car{position:relative;width:min(100%,540px);display:flex;align-items:flex-end;justify-content:center}
.car img{display:block;max-width:100%;max-height:230px;object-fit:contain;filter:drop-shadow(0 20px 16px rgba(0,0,0,.55)) brightness(.94)}
.car img.flip{transform:scaleX(-1)}
.car .carsvg{width:100%;height:auto;display:block}
.car.charging::after{content:"";position:absolute;left:8%;right:8%;bottom:-6px;height:36px;border-radius:50%;
  background:radial-gradient(closest-side,rgba(52,211,153,.55),transparent);filter:blur(6px);animation:lm-pulse 2.4s ease-in-out infinite;z-index:-1}
.wallbox{position:absolute;left:-30px;bottom:8px;width:20px;height:66px;border-radius:7px;background:linear-gradient(180deg,#26324f,#141c33);
  border:1px solid rgba(148,163,184,.25);box-shadow:0 10px 20px rgba(0,0,0,.4)}
.wallbox i{position:absolute;left:50%;top:12px;width:6px;height:6px;margin-left:-3px;border-radius:50%;background:var(--c,#34d399);box-shadow:0 0 10px var(--c,#34d399)}
.cable{position:absolute;left:-22px;bottom:6%;width:calc(16% + 22px);height:52%;overflow:visible}
.cable path{fill:none;stroke:var(--c,#34d399);stroke-width:2.4;stroke-linecap:round;stroke-dasharray:5 7;animation:lm-flow 1.1s linear infinite;filter:drop-shadow(0 0 4px var(--c,#34d399))}
.cable.idle path{animation:none;stroke-dasharray:none;opacity:.7}
.chip{position:absolute;z-index:3;display:inline-flex;align-items:center;gap:8px;padding:7px 13px;border-radius:999px;
  background:rgba(9,15,33,.62);border:1px solid rgba(148,163,184,.17);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);
  font-size:12.5px;font-weight:600;white-space:nowrap;box-shadow:0 10px 24px -12px rgba(0,0,0,.6)}
.chip .ic{width:13px;height:13px;color:var(--lm-amber)}
.chip.a{top:22px;left:36%}
.chip.b{top:70px;right:22px}
.chip.c{top:44%;left:41%}
.btn-amber{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:8px 15px;border-radius:999px;font-size:12.5px;font-weight:600;
  color:var(--lm-amber-2);background:rgba(246,168,35,.13);border:1px solid rgba(246,168,35,.5);transition:background .2s,transform .2s}
.btn-amber:hover{background:rgba(246,168,35,.22)}
.btn-amber .ic{width:14px;height:14px}
.hero .refresh{position:absolute;z-index:3;top:20px;right:22px;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}
.spin .ic{animation:lm-spin 1s linear infinite}
.strip{grid-area:strip;display:grid;grid-template-columns:repeat(auto-fit,minmax(104px,1fr));gap:12px 8px;padding:13px 16px;border-radius:15px;
  background:rgba(8,13,29,.58);border:1px solid rgba(148,163,184,.15);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}
.cell{min-width:0}
.cell .l{font-size:9.5px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:var(--lm-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cell .v{font-family:var(--lm-mono);font-size:15px;font-weight:600;margin-top:6px;white-space:nowrap}
.cell .v small{font-size:10px;color:var(--lm-muted);font-weight:500;margin-left:3px}

/* ---------- vehicle check ---------- */
.summary{display:flex;align-items:center;gap:14px;padding:14px 16px;border-radius:14px;margin-bottom:12px;
  background:linear-gradient(135deg,rgba(52,211,153,.15),rgba(52,211,153,.04));border:1px solid rgba(52,211,153,.38)}
.summary.warn{background:linear-gradient(135deg,rgba(246,168,35,.17),rgba(246,168,35,.04));border-color:rgba(246,168,35,.45)}
.summary .sq{width:36px;height:36px;border-radius:10px;display:grid;place-items:center;background:rgba(52,211,153,.18);color:var(--lm-green)}
.summary.warn .sq{background:rgba(246,168,35,.2);color:var(--lm-amber-2)}
.summary b{display:block;font-size:16px;font-weight:700}
.summary span{display:block;font-size:12px;color:var(--lm-muted);margin-top:2px}
.rows{display:grid;gap:7px}
.row{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:12px;padding:9px 12px;border-radius:12px;
  background:rgba(255,255,255,.022);border:1px solid var(--lm-line-2);border-left:2px solid color-mix(in srgb,var(--c) 70%,transparent);transition:background .2s}
.row:hover{background:rgba(255,255,255,.045)}
.row .sq{width:28px;height:28px;border-radius:8px;display:grid;place-items:center;color:var(--c);background:color-mix(in srgb,var(--c) 16%,transparent)}
.row .sq .ic{width:15px;height:15px}
.row b{display:block;font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.row small{display:block;font-size:10.5px;color:var(--lm-dim);margin-top:1px}
.pill{font-size:9.5px;font-weight:700;letter-spacing:.1em;padding:4px 8px;border-radius:7px;color:var(--lm-green);background:rgba(52,211,153,.12)}
.pill.warn{color:var(--lm-amber-2);background:rgba(246,168,35,.15)}
.pill.bad{color:var(--lm-red);background:rgba(251,113,133,.14)}
.foot{font-size:10.5px;color:var(--lm-dim);margin:12px 0 10px}
.btns{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.btn{display:flex;align-items:center;justify-content:center;gap:8px;padding:11px 12px;border-radius:12px;font-size:13px;font-weight:600;
  background:rgba(255,255,255,.04);border:1px solid var(--lm-line);transition:background .2s,border-color .2s}
.btn:hover{background:rgba(255,255,255,.08)}
.btn .ic{width:15px;height:15px}
.btn.primary{color:var(--lm-amber-2);background:rgba(246,168,35,.12);border-color:rgba(246,168,35,.5)}
.btn.primary:hover{background:rgba(246,168,35,.2)}
.btn.armed,.tile.armed{border-color:var(--lm-amber)!important;box-shadow:0 0 0 3px rgba(246,168,35,.18);animation:lm-armed 1s ease-in-out infinite}

/* ---------- chart ---------- */
.seg{display:inline-flex;padding:3px;border-radius:11px;background:rgba(255,255,255,.04);border:1px solid var(--lm-line-2)}
.seg button{padding:5px 11px;border-radius:8px;font-size:11.5px;font-weight:600;color:var(--lm-muted);transition:color .2s,background .2s}
.seg button.on{color:var(--lm-amber-2);background:rgba(246,168,35,.16);box-shadow:inset 0 0 0 1px rgba(246,168,35,.4)}
.note{display:flex;gap:9px;align-items:flex-start;font-size:12.5px;color:var(--lm-soft);margin:2px 0 10px;line-height:1.45}
.note .dot{margin-top:6px}
.chart,.week{display:flex;flex-direction:column}
.chartbox{position:relative;width:100%;flex:1;min-height:270px}
.chartbox svg{position:absolute;inset:0;display:block;width:100%;height:100%;overflow:visible}
.chartbox text{font-family:var(--lm-mono);font-size:10px;fill:var(--lm-muted)}
.chartbox text.val{fill:var(--lm-text);font-weight:600;font-size:10.5px}
.chartbox text.nowtxt{fill:#1a1206;font-weight:700;font-size:9.5px;font-family:var(--lm-font)}

/* ---------- week ---------- */
.days{flex:1;display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:6px;min-height:340px}
.day{display:flex;flex-direction:column;align-items:center;gap:7px;padding:12px 2px 10px;border-radius:14px;border:1px solid transparent;min-width:0}
.day.today{border-color:rgba(246,168,35,.5);background:linear-gradient(180deg,rgba(246,168,35,.09),rgba(246,168,35,.02))}
.day .dn{font-size:11.5px;font-weight:600;color:var(--lm-muted)}
.day.today .dn{color:var(--lm-amber-2)}
.day .di{color:#a5b4d0}.day .di .ic{width:20px;height:20px}
.day .km{font-size:14px;font-weight:700;white-space:nowrap}
.day .km small{font-size:9.5px;font-weight:500;color:var(--lm-muted);margin-left:1px}
.track{position:relative;flex:1;width:10px;min-height:110px;border-radius:6px;background:rgba(148,163,184,.1)}
.fill{position:absolute;left:0;right:0;bottom:0;border-radius:6px;min-height:4px;box-shadow:0 0 14px -2px var(--g,rgba(56,189,248,.5))}
.day .en{font-family:var(--lm-mono);font-size:10.5px;color:var(--lm-dim);white-space:nowrap}
.day .en.has{color:#5ccff5}
.day .co{font-family:var(--lm-mono);font-size:9.5px;color:var(--lm-dim);white-space:nowrap}
.wfoot{display:flex;flex-wrap:wrap;gap:4px 14px;font-size:11.5px;color:var(--lm-muted);margin-top:12px}
.wfoot b{color:var(--lm-text);font-weight:600}

/* ---------- charging ---------- */
.arcbox svg{display:block;width:100%;height:auto;overflow:visible}
.arcbox text{font-family:var(--lm-mono);font-size:13px;fill:var(--lm-muted)}
.arclabels{display:grid;grid-template-columns:1fr auto 1fr;align-items:end;margin-top:-6px}
.arclabels div:last-child{text-align:right}
.arclabels small{display:block;font-size:11px;color:var(--lm-muted);margin-bottom:2px}
.arclabels .mono{font-size:21px;font-weight:600}
.arclabels .mid{font-family:var(--lm-mono);font-size:13px;color:var(--lm-muted);text-align:center;padding:0 6px 4px}
.cbottom{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:16px}
.cstate{display:flex;align-items:center;gap:10px;min-width:0}
.cstate .sq{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;background:rgba(148,163,184,.12);color:var(--lm-soft)}
.cstate .sq.on{background:rgba(52,211,153,.16);color:var(--lm-green);box-shadow:0 0 18px -4px rgba(52,211,153,.7)}
.cstate b{display:block;font-size:13px;font-weight:600}
.cstate small{display:block;font-size:10.5px;color:var(--lm-dim)}
.cright{text-align:right}
.cright .mono{font-size:15px;font-weight:600}
.cright small{display:block;font-size:10.5px;color:var(--lm-dim)}

/* ---------- energy & tires ---------- */
.aq{display:flex;align-items:center;gap:14px}
.aqv{font-size:30px;font-weight:700;letter-spacing:-.02em;font-family:var(--lm-mono)}
.aq .t{flex:1;min-width:0}
.aq .t b{font-size:14px;font-weight:700}
.aq .t b span{color:var(--lm-muted);font-weight:500}
.scale{position:relative;height:5px;border-radius:5px;margin-top:9px;background:linear-gradient(90deg,#34d399,#a3e635 30%,#facc15 50%,#fb923c 70%,#f43f5e 85%,#a855f7)}
.scale i{position:absolute;top:-4px;width:3px;height:13px;border-radius:2px;background:#fff;box-shadow:0 0 0 2px rgba(8,13,28,.85);transform:translateX(-50%)}
.tiles4{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:22px}
.t4{padding:10px 10px 9px;border-radius:11px;background:rgba(255,255,255,.03);border:1px solid var(--lm-line-2);min-width:0}
.t4 small{display:block;font-size:9.5px;color:var(--lm-dim);letter-spacing:.06em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.t4 .mono{display:block;font-size:15px;font-weight:600;margin-top:5px}
.t4 .mono span{font-size:9.5px;color:var(--lm-muted);font-weight:500;margin-left:2px}
.t4.low{border-color:rgba(251,113,133,.45);background:rgba(251,113,133,.07)}
.t4.low .mono{color:var(--lm-red)}
.split{margin-top:14px;font-size:11px;color:var(--lm-muted)}
.split .bar{display:flex;height:5px;border-radius:5px;overflow:hidden;margin:7px 0 6px;background:rgba(148,163,184,.12)}
.split .bar i{display:block;height:100%}
.split .lg{display:flex;flex-wrap:wrap;gap:4px 12px}
.split .lg span{display:inline-flex;align-items:center;gap:5px}
.split .lg i{width:7px;height:7px;border-radius:2px;display:inline-block}

/* ---------- controls ---------- */
.tiles{display:grid;grid-template-columns:repeat(auto-fill,minmax(132px,1fr));gap:10px}
.tile{position:relative;display:flex;flex-direction:column;align-items:flex-start;gap:10px;padding:14px;border-radius:15px;text-align:left;min-width:0;
  background:rgba(255,255,255,.03);border:1px solid var(--lm-line-2);transition:background .2s,border-color .2s,transform .15s}
.tile:hover{background:rgba(255,255,255,.06);border-color:var(--lm-line)}
.tile:active{transform:scale(.98)}
.tile .sq{width:34px;height:34px;border-radius:11px;display:grid;place-items:center;color:var(--c,var(--lm-soft));background:color-mix(in srgb,var(--c,#94a3b8) 15%,transparent)}
.tile .tl{font-size:13px;font-weight:600;line-height:1.2}
.tile .ts{font-size:11px;color:var(--lm-dim);margin-top:-6px}
.tile.on{border-color:rgba(246,168,35,.45);background:linear-gradient(180deg,rgba(246,168,35,.12),rgba(246,168,35,.03))}
.tile.on .ts{color:var(--lm-amber-2)}
.tile.busy .sq .ic{animation:lm-spin 1s linear infinite}

/* ---------- layout ---------- */
@container lmcard (min-width:760px){
  .lm{grid-template-columns:repeat(2,minmax(0,1fr))}
  .hero,.controls{grid-column:1/-1}
}
@container lmcard (min-width:1180px){
  .lm{grid-template-columns:minmax(0,1.28fr) minmax(0,1.16fr) minmax(0,1fr)}
  .hero{grid-column:span 2}
  .lm.solo-hero .hero{grid-column:1/-1}
}
@container lmcard (max-width:640px){
  .hero{min-height:0}
  .hero-ui{grid-template-columns:minmax(0,1fr);grid-template-areas:"info" "car" "strip";padding:18px 16px 14px}
  .chip{display:none}
  .hero .refresh{top:16px;right:16px;padding:7px 12px}
  .name{font-size:23px;padding-right:110px}
  .big{font-size:76px}
  .carzone{min-height:120px;padding:4px 0 10px 34px}
  .car img{max-height:170px}
  .panel{padding:16px}
  .days{gap:3px;min-height:300px}
  .day{padding:10px 0 8px}
  .day .km{font-size:12.5px}
  .day .co{display:none}
  .tiles{grid-template-columns:repeat(auto-fill,minmax(112px,1fr))}
  .strip{grid-template-columns:repeat(3,minmax(0,1fr));padding:12px}
  .day .en{font-size:10px}
  .cell .l{letter-spacing:.08em}
  .day .en small{display:none}
}
@keyframes lm-pulse{0%,100%{opacity:1}50%{opacity:.45}}
@keyframes lm-spin{to{transform:rotate(360deg)}}
@keyframes lm-flow{to{stroke-dashoffset:-24}}
@keyframes lm-armed{50%{box-shadow:0 0 0 6px rgba(246,168,35,.06)}}
@keyframes lm-tw{0%,100%{opacity:.9}50%{opacity:.15}}
.tw{animation:lm-tw 4s ease-in-out infinite}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
`;

/* ------------------------------------------------------------------ */
/* The card                                                             */
/* ------------------------------------------------------------------ */

class LeapmotorCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._sigs = {};
    this._tab = "battery";
    this._armed = null;
    this._busy = {};
    this._hist = null;
    this._histLoading = false;
    this._chartSize = { w: 0, h: 0 };
    this._ids = {};
  }

  /* ----- Lovelace API ----- */

  static getStubConfig() {
    return {};
  }

  static getConfigForm() {
    const sectionOptions = [
      ["hero", "Hero scene"], ["check", "Vehicle check"], ["chart", "Last 24 hours"], ["week", "Last 7 days"],
      ["charging", "Charging"], ["energy", "Energy & tires"], ["controls", "Remote control"],
    ].map(([value, label]) => ({ value, label }));
    return {
      schema: [
        { name: "device_id", selector: { device: { filter: { integration: "leapmotor" } } } },
        { name: "name", selector: { text: {} } },
        { name: "sections", selector: { select: { multiple: true, mode: "list", options: sectionOptions } } },
        {
          type: "grid", name: "", schema: [
            { name: "scene", selector: { select: { mode: "dropdown", options: [
              { value: "auto", label: "Auto (follows sun.sun)" }, { value: "night", label: "Night" }, { value: "day", label: "Day" },
            ] } } },
            { name: "language", selector: { select: { mode: "dropdown", options: [
              { value: "auto", label: "Auto" }, { value: "en", label: "English" }, { value: "sl", label: "Slovenščina" }, { value: "de", label: "Deutsch" },
            ] } } },
          ],
        },
        {
          type: "grid", name: "", schema: [
            { name: "confirm_actions", selector: { boolean: {} } },
            { name: "backdrop", selector: { boolean: {} } },
            { name: "image_flip", selector: { boolean: {} } },
          ],
        },
        { name: "entity_prefix", selector: { text: {} } },
      ],
      computeLabel: (s) => ({
        device_id: "Vehicle", name: "Title (optional)", sections: "Sections", scene: "Scene",
        language: "Language", confirm_actions: "Tap twice to confirm remote actions",
        backdrop: "Dark backdrop", image_flip: "Mirror the car picture", entity_prefix: "Entity prefix (optional, e.g. c10)",
      })[s.name],
    };
  }

  setConfig(config) {
    if (!config || typeof config !== "object") throw new Error("Invalid configuration");
    const sections = Array.isArray(config.sections) && config.sections.length
      ? ALL_SECTIONS.filter((s) => config.sections.includes(s))
      : ALL_SECTIONS;
    this._config = {
      scene: "auto", language: "auto", confirm_actions: true, backdrop: true, show_image: true, image_flip: false,
      ...config, sections,
    };
    this._built = false;
    this._sigs = {};
    this._idsKey = null;
    if (this._hass) this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  get hass() {
    return this._hass;
  }

  getCardSize() {
    return 14;
  }

  getGridOptions() {
    return { columns: "full", rows: "auto" };
  }

  connectedCallback() {
    ensureFonts();
    this._tick = setInterval(() => this._render(true), 30 * 1000);
    if (window.ResizeObserver && !this._ro) {
      this._ro = new ResizeObserver(() => this._measureChart());
    }
    if (this._ro) {
      this._ro.observe(this);
      const chart = this.shadowRoot.getElementById("chart");
      if (chart) this._ro.observe(chart);
    }
    if (this._hass) this._render(true);
  }

  disconnectedCallback() {
    clearInterval(this._tick);
    if (this._ro) this._ro.disconnect();
  }

  /* ----- i18n & formatting ----- */

  get _lang() {
    const cfg = this._config?.language;
    const raw = cfg && cfg !== "auto" ? cfg : this._hass?.locale?.language || this._hass?.language || navigator.language || "en";
    return String(raw).toLowerCase();
  }

  get _t() {
    const base = this._lang.split("-")[0];
    return STRINGS[base] || STRINGS.en;
  }

  _tr(key, vars = {}) {
    let s = this._t[key] ?? STRINGS.en[key] ?? key;
    for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, v);
    return s;
  }

  _num(value, digits = 0) {
    if (value == null || !isFinite(value)) return "—";
    this._nf = this._nf || {};
    const key = `${this._lang}|${digits}`;
    if (!this._nf[key]) {
      try {
        this._nf[key] = new Intl.NumberFormat(this._lang, { minimumFractionDigits: digits, maximumFractionDigits: digits });
      } catch (_e) {
        this._nf[key] = new Intl.NumberFormat("en", { minimumFractionDigits: digits, maximumFractionDigits: digits });
      }
    }
    return this._nf[key].format(value);
  }

  _time(date) {
    try {
      return new Intl.DateTimeFormat(this._lang, { hour: "2-digit", minute: "2-digit" }).format(date);
    } catch (_e) {
      return date.toTimeString().slice(0, 5);
    }
  }

  _hour(date) {
    return String(date.getHours()).padStart(2, "0");
  }

  _ago(ts) {
    const diff = Date.now() - ts;
    if (!isFinite(diff)) return "—";
    if (diff < 60 * 1000) return this._tr("justNow");
    let rtf;
    try {
      rtf = new Intl.RelativeTimeFormat(this._lang, { numeric: "auto", style: "short" });
    } catch (_e) {
      rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto", style: "short" });
    }
    if (diff < HOUR) return rtf.format(-Math.round(diff / MIN), "minute");
    if (diff < DAY) return rtf.format(-Math.round(diff / HOUR), "hour");
    return rtf.format(-Math.round(diff / DAY), "day");
  }

  _dur(minutes) {
    if (minutes == null || !isFinite(minutes)) return "—";
    const m = Math.max(0, Math.round(minutes));
    const h = Math.floor(m / 60);
    if (h >= 48) return `${Math.round(h / 24)} d`;
    return h ? `${h} h ${String(m % 60).padStart(2, "0")} min` : `${m} min`;
  }

  /* ----- entity access ----- */

  _resolve() {
    const hass = this._hass;
    const cfg = this._config;
    const regKey = `${Object.keys(hass.states).length}|${hass.entities ? Object.keys(hass.entities).length : 0}`;
    if (this._idsKey === regKey) return;
    this._idsKey = regKey;

    const ids = {};
    const byKey = {};
    let deviceId = cfg.device_id;
    const reg = hass.entities ? Object.values(hass.entities).filter((e) => e && e.platform === "leapmotor") : [];
    if (reg.length && !deviceId && !cfg.entity_prefix) {
      const anchor = reg.find((e) => e.translation_key === "battery_percent" && e.entity_id.startsWith("sensor."));
      deviceId = anchor?.device_id;
    }
    for (const e of reg) {
      if (deviceId && e.device_id !== deviceId) continue;
      if (!e.translation_key) continue;
      const k = `${e.entity_id.split(".")[0]}:${e.translation_key}`;
      if (!byKey[k]) byKey[k] = e.entity_id;
    }

    let prefix = cfg.entity_prefix ? String(cfg.entity_prefix).replace(/_$/, "") : null;
    if (!prefix && !Object.keys(byKey).length) {
      // Registry not available: look for the battery sensor via its attributes.
      const bat = Object.values(hass.states).find((s) =>
        s.entity_id.startsWith("sensor.") && s.entity_id.endsWith("_battery") &&
        s.attributes && s.attributes.vin !== undefined && s.attributes.car_type !== undefined);
      if (bat) prefix = bat.entity_id.slice(7, -8);
    }

    for (const [key, [domain, tk, slug]] of Object.entries(SPEC)) {
      let id = cfg.entities?.[key] || byKey[`${domain}:${tk}`];
      if (!id && prefix) id = `${domain}.${prefix}_${slug}`;
      if (id && hass.states[id]) ids[key] = id;
    }
    this._ids = ids;
    this._deviceId = deviceId || (ids.battery && hass.entities?.[ids.battery]?.device_id) || null;
  }

  _s(key) {
    const id = this._ids[key];
    return id ? this._hass.states[id] : undefined;
  }

  _v(key) {
    const s = this._s(key);
    if (!s) return null;
    const v = parseFloat(s.state);
    return isFinite(v) ? v : null;
  }

  _on(key) {
    const s = this._s(key);
    if (!s) return null;
    if (s.state === "on") return true;
    if (s.state === "off") return false;
    return null;
  }

  _unit(key, fallback = "") {
    return this._s(key)?.attributes?.unit_of_measurement || fallback;
  }

  _ts(key) {
    const s = this._s(key);
    if (!s || ["unknown", "unavailable", ""].includes(s.state)) return null;
    const t = Date.parse(s.state);
    return isFinite(t) ? t : null;
  }

  _sig(keys) {
    return keys.map((k) => {
      const s = this._s(k);
      return s ? `${s.state}|${s.last_updated}` : "-";
    }).join(";");
  }

  _sceneMode() {
    const mode = this._config.scene;
    if (mode === "night" || mode === "day") return mode;
    const sun = this._hass.states["sun.sun"];
    if (sun) return sun.state === "above_horizon" ? "day" : "night";
    const h = new Date().getHours();
    return h >= 7 && h < 19 ? "day" : "night";
  }

  _vehicleName() {
    if (this._config.name) return this._config.name;
    const car = this._s("battery")?.attributes?.car_type;
    if (car) return `Leapmotor ${car}`;
    const dev = this._deviceId && this._hass.devices?.[this._deviceId];
    return dev?.name_by_user || dev?.name || "Leapmotor";
  }

  _location() {
    const tr = this._s("tracker");
    if (!tr) return null;
    if (tr.state === "home") return this._tr("home");
    if (tr.state === "not_home") return this._tr("away");
    if (["unknown", "unavailable"].includes(tr.state)) return null;
    const zone = this._hass.states[`zone.${tr.state}`];
    return zone?.attributes?.friendly_name || tr.state;
  }

  /* ----- derived state ----- */

  _issues() {
    const t = (k, v) => this._tr(k, v);
    const issues = [];
    const lock = this._s("lock");
    if (lock && lock.state === "unlocked") issues.push(t("unlocked"));
    const doors = DOORS.filter(([k]) => this._on(k));
    if (doors.length === 1) issues.push(t("doorsOpen", { n: t(doors[0][1]) }));
    else if (doors.length > 1) issues.push(t("doorsOpen", { n: doors.length }));
    const wins = WINDOWS.filter((k) => this._on(k)).length;
    if (wins) issues.push(t("windowsOpen", { n: wins }));
    if (this._on("trunk")) issues.push(t("trunkOpen"));
    const lowTires = TIRES.filter(([k]) => { const v = this._v(k); return v != null && v < TIRE_LOW_BAR; });
    if (lowTires.length) issues.push(t("tireLow", { x: lowTires.map(([, l]) => t(l)).join(", ") }));
    return issues;
  }

  _chargeState() {
    const conn = this._s("connection")?.state;
    const charging = this._on("isCharging") === true || conn === "charging";
    const plugged = charging || this._on("isPlugged") === true || conn === "plugged_in" || conn === "finished";
    return { charging, plugged, finished: conn === "finished" };
  }

  /* ----- rendering ----- */

  _render(force = false) {
    if (!this._hass || !this._config) return;
    this._resolve();
    if (!this._ids.battery && !this._ids.range) {
      this._built = false;
      const msg = esc(this._tr("notFound"));
      if (this._sigs.__empty !== msg) {
        this._sigs = { __empty: msg };
        this.shadowRoot.innerHTML = `<style>${STYLE}</style><div class="lm backdrop"><section class="panel"><div class="empty">${icon("car")}<br>${msg}</div></section></div>`;
      }
      return;
    }
    if (!this._built) this._build();
    for (const name of this._config.sections) this._renderSection(name, force);
    this._maybeFetchHistory();
  }

  _build() {
    const secs = this._config.sections;
    const has = (s) => secs.includes(s);
    const parts = [];
    if (has("hero")) parts.push(`<section class="panel hero" id="hero"><div class="scene" id="scene"></div><div class="hero-ui" id="heroui"><div class="contents" id="hchips"></div><div class="info" id="hinfo"></div><div class="carzone" id="hcar"></div><div class="stripwrap" id="hstrip"></div></div></section>`);
    if (has("check")) parts.push(`<section class="panel check" id="check"></section>`);
    if (has("chart")) parts.push(`<section class="panel chart" id="chart"></section>`);
    if (has("week")) parts.push(`<section class="panel week" id="week"></section>`);
    if (has("charging") || has("energy")) {
      parts.push(`<div class="stack">${has("charging") ? `<section class="panel charge" id="charging"></section>` : ""}${has("energy") ? `<section class="panel energy" id="energy"></section>` : ""}</div>`);
    }
    if (has("controls")) parts.push(`<section class="panel controls" id="controls"></section>`);
    const solo = has("hero") && !has("check") ? " solo-hero" : "";
    this.shadowRoot.innerHTML = `<style>${STYLE}</style><div class="lm${this._config.backdrop ? " backdrop" : ""}${solo}" id="root">${parts.join("")}</div>`;
    this._sigs = {};
    this._built = true;
    const root = this.shadowRoot.getElementById("root");
    root.addEventListener("click", (ev) => this._onClick(ev));
    const chart = this.shadowRoot.getElementById("chart");
    if (chart && this._ro) this._ro.observe(chart);
  }

  _renderSection(name, force = false) {
    const map = {
      hero: () => { this._renderScene(force); return this._heroSig(); },
      check: () => this._checkSig(),
      chart: () => this._chartSig(),
      week: () => this._sig(["week"]),
      charging: () => this._sig(["battery", "chargeLimit", "isCharging", "isPlugged", "connection", "finish", "remaining", "power", "current", "voltage", "lastCharge", "range"]) + Math.floor(Date.now() / MIN),
      energy: () => this._sig(["avg", "tireFL", "tireFR", "tireRL", "tireRR", "lwDriving", "lwClimate", "lwOther"]),
      controls: () => this._controlsSig(),
    };
    const html = {
      hero: () => this._heroHtml(),
      check: () => this._checkHtml(),
      chart: () => this._chartHtml(),
      week: () => this._weekHtml(),
      charging: () => this._chargingHtml(),
      energy: () => this._energyHtml(),
      controls: () => this._controlsHtml(),
    };
    const target = this.shadowRoot.getElementById(name === "hero" ? "heroui" : name);
    if (!target || !map[name]) return;
    const sig = `${this._lang}|${map[name]()}`;
    // Only the chart is redrawn on force (resize, new history); everything else is signature-driven.
    if (this._sigs[name] === sig && !(force && name === "chart")) return;
    this._sigs[name] = sig;
    if (name === "hero") {
      for (const [id, part] of Object.entries(this._heroHtml())) this._patch(id, part);
      return;
    }
    target.innerHTML = html[name]();
    if (name === "chart" && !this._chartSize.w) this._measureChart();
  }

  _measureChart() {
    const box = this.shadowRoot.getElementById("chartbox");
    if (!box) return;
    const w = Math.round(box.clientWidth), h = Math.round(box.clientHeight);
    if (!w || !h) return;
    if (Math.abs(w - this._chartSize.w) > 4 || Math.abs(h - this._chartSize.h) > 4) {
      this._chartSize = { w, h };
      this._renderSection("chart", true);
    }
  }

  _patch(id, markup) {
    const el = this.shadowRoot.getElementById(id);
    if (el && el.__lmHtml !== markup) {
      el.__lmHtml = markup;
      el.innerHTML = markup;
    }
  }

  /* ----- hero ----- */

  _renderScene() {
    const scene = this.shadowRoot.getElementById("scene");
    if (!scene) return;
    const mode = this._sceneMode();
    if (this._sigs.__scene === mode) return;
    this._sigs.__scene = mode;
    scene.innerHTML = sceneSvg(mode);
  }

  _heroSig() {
    return [
      this._sig(["battery", "batteryPrecise", "range", "lock", "isCharging", "isPlugged", "connection", "isDriving", "speed", "gear",
        "interior", "outdoor", "odometer", "chargeLimit", "avg", "lastUpdate", "tracker", "picture", "remaining", "vehicleState", "fuel"]),
      this._sig(DOORS.map(([k]) => k)), this._sig(WINDOWS), this._sig(["trunk"]),
      this._sceneMode(), Math.floor(Date.now() / MIN), this._busy.refresh ? 1 : 0,
    ].join("#");
  }

  _heroHtml() {
    const t = (k, v) => this._tr(k, v);
    const now = new Date();
    const precise = this._v("batteryPrecise");
    const soc = precise ?? this._v("battery");
    const socTxt = soc == null ? "—" : precise != null ? this._num(precise, 1) : this._num(soc, 0);
    const lock = this._s("lock");
    const locked = lock ? lock.state === "locked" : null;
    const { charging, plugged } = this._chargeState();
    const driving = this._on("isDriving") === true || this._s("vehicleState")?.state === "driving";
    const rangeV = this._v("range");
    const rangeU = this._unit("range", "km");
    const issues = this._issues();

    const dateStr = (() => {
      try {
        const s = new Intl.DateTimeFormat(this._lang, { weekday: "long", day: "numeric", month: "long" }).format(now);
        return s.charAt(0).toUpperCase() + s.slice(1);
      } catch (_e) { return now.toDateString(); }
    })();
    const loc = this._location();

    const stateBits = [];
    if (locked != null) stateBits.push(locked ? t("locked") : t("unlocked"));
    stateBits.push(charging ? t("charging") : driving ? t("driving") : t("parked"));
    const stateIcon = charging ? "bolt" : locked === false ? "unlock" : "lock";

    const meta = [];
    const limit = this._v("chargeLimit");
    if (limit != null) {
      const [pre, post = ""] = esc(t("limitWord", { x: "\u0001" })).split("\u0001");
      meta.push(`<span>${icon("arrowUp")} ${pre}<b>${this._num(limit)} %</b>${post}</span>`);
    }
    if (rangeV != null) meta.push(`<span>${esc(t("rangeWord", { x: `${this._num(rangeV)} ${rangeU}` }))}</span>`);
    const upd = this._ts("lastUpdate");
    if (upd) meta.push(`<span>${esc(t("updated", { x: this._ago(upd) }))}</span>`);

    // Floating chips
    const chips = [];
    if (rangeV != null) chips.push(`<div class="chip a"><span class="dot"></span>${esc(t("range"))} ${this._num(rangeV)} ${esc(rangeU)} ${icon("route")}</div>`);
    const inside = this._v("interior") ?? this._v("outdoor");
    if (inside != null) {
      const label = this._v("interior") != null ? t("insideChip") : t("outside");
      chips.push(`<div class="chip b clickable" data-more="${this._v("interior") != null ? "interior" : "outdoor"}"><span class="dot" style="--c:var(--lm-sky)"></span>${esc(label)} ${this._num(inside, 1)} °C</div>`);
    }
    let cText, cColor = "var(--lm-green)", cPulse = "";
    if (charging) {
      const rem = this._v("remaining");
      cText = rem != null ? `${t("charging")} · ${this._dur(rem)}` : `${t("charging")} · ${this._num(this._v("power"), 1)} kW`;
      cPulse = " pulse";
    } else if (driving) {
      const spd = this._v("speed");
      cText = spd != null ? `${t("driving")} · ${this._num(spd)} ${this._unit("speed", "km/h")}` : t("driving");
      cColor = "var(--lm-sky)";
    } else if (issues.length) {
      cText = issues[0];
      cColor = "var(--lm-red)";
    } else {
      cText = t("secureChip");
    }
    chips.push(`<div class="chip c"><span class="dot${cPulse}" style="--c:${cColor}"></span>${esc(cText)}</div>`);

    // Metric strip
    const cells = [];
    const cell = (label, value, unit, key) => {
      if (value == null) return;
      cells.push(`<div class="cell${key ? " clickable" : ""}"${key ? ` data-more="${key}"` : ""}><div class="l">${esc(label)}</div><div class="v">${value}<small>${esc(unit)}</small></div></div>`);
    };
    const out = this._v("outdoor");
    cell(t("outside"), out != null ? this._num(out, 1) : null, "°C", "outdoor");
    const inn = this._v("interior");
    cell(t("interior"), inn != null ? this._num(inn, 1) : null, "°C", "interior");
    const odo = this._v("odometer");
    cell(t("odometer"), odo != null ? this._num(odo) : null, this._unit("odometer", "km"), "odometer");
    cell(t("chargeLimit"), limit != null ? this._num(limit) : null, "%", "chargeLimit");
    const fuel = this._v("fuel");
    if (fuel != null) cell(t("fuel"), this._num(fuel), "%", "fuel");
    const spd = this._v("speed");
    if (spd != null) cell(t("speed"), this._num(spd), this._unit("speed", "km/h"), "speed");
    else if (this._s("gear")) cell(t("gear"), esc(this._s("gear").state), "", "gear");
    const avg = this._v("avg");
    cell(t("consumption"), avg != null ? this._num(avg, 1) : null, "kWh/100", "avg");
    if (upd) {
      const mins = (Date.now() - upd) / MIN;
      cell(t("lastUpdate"), mins < 60 ? this._num(Math.max(0, Math.round(mins))) : mins < 1440 ? this._num(mins / 60, 1) : this._num(mins / 1440, 1),
        mins < 60 ? "min" : mins < 1440 ? "h" : "d", "lastUpdate");
    }

    // Car
    const night = this._sceneMode() === "night";
    const picUrl = this._carPicture();
    const carInner = picUrl
      ? `<img src="${esc(picUrl)}" alt="${esc(this._vehicleName())}"${this._config.image_flip ? ' class="flip"' : ""}>`
      : carSvg(night);
    const ledColor = charging ? "#34d399" : "#f6a823";
    const plug = plugged
      ? `<div class="wallbox" style="--c:${ledColor}"><i></i></div><svg class="cable${charging ? "" : " idle"}" style="--c:${ledColor}" viewBox="0 0 100 96" preserveAspectRatio="none"><path d="M8 50C14 98 70 102 96 30" vector-effect="non-scaling-stroke"/></svg>`
      : "";

    return {
      hchips: chips.join("") + (this._ids.refreshBtn
        ? `<button class="btn-amber refresh${this._busy.refresh ? " spin" : ""}" data-act="refresh">${icon("refresh")}${esc(t("refresh"))}</button>`
        : ""),
      hinfo: `
        <div class="eyebrow"><span class="dot"></span>${esc(t("now"))} · ${esc(this._time(now))}</div>
        <h2 class="name">${esc(this._vehicleName())}</h2>
        <div class="sub">${esc(dateStr)}${loc ? ` · ${icon("pin")}${esc(loc)}` : ""}</div>
        <div class="big clickable" data-more="battery">${socTxt}<span class="u">%</span></div>
        <div class="state">${icon(stateIcon)}${esc(stateBits.join(" · "))}</div>
        <div class="metaline">${meta.join("")}</div>`,
      hcar: `<div class="car${charging ? " charging" : ""}">${plug}${carInner}</div>`,
      hstrip: cells.length ? `<div class="strip">${cells.slice(0, 7).join("")}</div>` : "",
    };
  }

  /**
   * URL of the owned car's picture: the integration's image entity (the
   * official render from the Leapmotor picture package) or a configured URL.
   * The image proxy token rotates every few minutes, so a new URL is preloaded
   * and only swapped in once it has loaded — no flicker, no broken image.
   */
  _carPicture() {
    if (this._config.image) return this._config.image;
    if (!this._config.show_image) return null;
    const pic = this._s("picture");
    const url = pic && !["unavailable", "unknown"].includes(pic.state) ? pic.attributes?.entity_picture : null;
    const p = this._pic || (this._pic = { shown: null, pending: null });
    if (!url) {
      p.shown = null;
      return null;
    }
    if (url !== p.shown && url !== p.pending) {
      p.pending = url;
      const img = new Image();
      img.onload = () => {
        if (p.pending !== url) return;
        p.shown = url;
        p.pending = null;
        this._sigs.hero = null;
        this._renderSection("hero");
      };
      img.onerror = () => {
        if (p.pending === url) p.pending = null;
      };
      img.src = url;
    }
    return p.shown;
  }

  /* ----- vehicle check ----- */

  _checkSig() {
    return [this._sig(["lock", "trunk", "battery", "lastUpdate", "findBtn", "refreshBtn"]), this._sig(DOORS.map(([k]) => k)),
      this._sig(WINDOWS), this._sig(TIRES.map(([k]) => k)), Math.floor(Date.now() / MIN), JSON.stringify(this._armed), JSON.stringify(this._busy)].join("#");
  }

  _checkHtml() {
    const t = (k, v) => this._tr(k, v);
    const rows = [];
    const row = (o) => rows.push(o);

    const lock = this._s("lock");
    if (lock) {
      const ok = lock.state === "locked";
      row({ c: "#f6a823", i: ok ? "lock" : "unlock", title: ok ? t("locked") : t("unlocked"), sub: t("subLock"), ok, more: "lock" });
    }
    const doorKeys = DOORS.filter(([k]) => this._s(k));
    if (doorKeys.length) {
      const open = doorKeys.filter(([k]) => this._on(k));
      row({ c: "#a78bfa", i: "door", title: !open.length ? t("doorsClosed") : open.length === 1 ? t("doorsOpen", { n: t(open[0][1]) }) : t("doorsOpen", { n: open.length }),
        sub: t("subDoors"), ok: !open.length, more: (open[0] || doorKeys[0])[0] });
    }
    const winKeys = WINDOWS.filter((k) => this._s(k));
    if (winKeys.length) {
      const open = winKeys.filter((k) => this._on(k));
      row({ c: "#38bdf8", i: "window", title: open.length ? t("windowsOpen", { n: open.length }) : t("windowsClosed"), sub: t("subWindows"), ok: !open.length, more: open[0] || winKeys[0] });
    }
    if (this._s("trunk")) {
      const open = this._on("trunk");
      row({ c: "#2dd4bf", i: "trunk", title: open ? t("trunkOpen") : t("trunkClosed"), sub: t("subTrunk"), ok: !open, more: "trunk" });
    }
    const tv = TIRES.map(([k]) => this._v(k)).filter((v) => v != null);
    if (tv.length) {
      const lo = Math.min(...tv), hi = Math.max(...tv);
      const range = lo === hi ? `${this._num(lo, 1)} bar` : `${this._num(lo, 1)}–${this._num(hi, 1)} bar`;
      const ok = lo >= TIRE_LOW_BAR;
      row({ c: "#94a3b8", i: "tire", title: t("tirePressure", { x: range }), sub: t("subTires"), ok, pill: ok ? null : "low", more: TIRES[0][0] });
    }
    const soc = this._v("battery");
    if (soc != null) {
      row({ c: "#34d399", i: "battery", title: t("batteryLevel", { x: `${this._num(soc)} %` }), sub: t("subBattery"), ok: soc >= 20, pill: soc >= 20 ? null : "low", more: "battery" });
    }
    const upd = this._ts("lastUpdate");
    if (upd) {
      const mins = (Date.now() - upd) / MIN;
      const fresh = mins < STALE_MINUTES;
      row({ c: "#22d3ee", i: "cloud", title: fresh ? t("updatedAgo", { x: this._ago(upd) }) : t("stale", { x: this._dur(mins) }),
        sub: t("subData"), ok: fresh, pill: fresh ? null : "stale", more: "lastUpdate" });
    }

    const issues = this._issues();
    const summary = issues.length
      ? `<div class="summary warn"><div class="sq">${icon("alert")}</div><div><b>${esc(t("attention"))}</b><span>${esc(issues.join(" · "))}</span></div></div>`
      : `<div class="summary"><div class="sq">${icon("check")}</div><div><b>${esc(t("allSecure"))}</b><span>${esc(t("allSecureSub"))}</span></div></div>`;

    const pillHtml = (r) => {
      if (r.ok) return `<span class="pill">${esc(t("ok"))}</span>`;
      if (r.pill === "low") return `<span class="pill bad">${esc(t("low"))}</span>`;
      if (r.pill === "stale") return `<span class="pill warn">${esc(t("stalePill"))}</span>`;
      return `<span class="pill warn">${esc(t("open"))}</span>`;
    };

    const btns = [];
    if (lock) {
      const locked = lock.state === "locked";
      const key = locked ? "unlockCar" : "lockCar";
      const armed = this._isArmed(key);
      btns.push(`<button class="btn primary${armed ? " armed" : ""}" data-act="ctl" data-key="${key}">${icon(locked ? "unlock" : "lock")}${esc(armed ? t("tapConfirm") : locked ? t("unlock") : t("lock"))}</button>`);
    }
    if (this._ids.findBtn) {
      const armed = this._isArmed("find");
      btns.push(`<button class="btn${armed ? " armed" : ""}" data-act="ctl" data-key="find">${icon("find")}${esc(armed ? t("tapConfirm") : t("findCar"))}</button>`);
    } else if (this._ids.refreshBtn) {
      btns.push(`<button class="btn${this._busy.refresh ? " spin" : ""}" data-act="refresh">${icon("refresh")}${esc(t("refresh"))}</button>`);
    }

    return `
      <div class="ptitle"><h3>${esc(t("check"))}</h3><span class="meta">${esc(t("cloudStatus"))}</span></div>
      ${summary}
      <div class="rows">${rows.map((r) => `
        <div class="row clickable" style="--c:${r.c}" data-more="${r.more}">
          <span class="sq">${icon(r.i)}</span>
          <div><b>${esc(r.title)}</b><small>${esc(r.sub)}</small></div>
          ${pillHtml(r)}
        </div>`).join("")}</div>
      <div class="foot">${esc(t("footnote"))}</div>
      ${btns.length ? `<div class="btns" style="${btns.length === 1 ? "grid-template-columns:1fr" : ""}">${btns.join("")}</div>` : ""}
    `;
  }

  /* ----- 24 h chart ----- */

  _chartSig() {
    return `${this._tab}|${this._hist?.fetchedAt || 0}|${this._chartSize.w}x${this._chartSize.h}|${this._histLoading ? 1 : 0}`;
  }

  _maybeFetchHistory() {
    if (!this._config.sections.includes("chart") || this._histLoading) return;
    if (typeof this._hass.callWS !== "function") return;
    const bat = this._s("battery");
    const stamp = bat ? bat.last_updated : "";
    const age = this._hist ? Date.now() - this._hist.fetchedAt : Infinity;
    if (age < 10 * MIN && (this._hist?.stamp === stamp || age < MIN)) return;
    this._fetchHistory(stamp);
  }

  async _fetchHistory(stamp) {
    this._histLoading = true;
    const keys = ["battery", "range", "power", "odometer", "isCharging", "isDriving"];
    const ids = keys.map((k) => this._ids[k]).filter(Boolean);
    const end = new Date();
    const start = new Date(end.getTime() - DAY);
    const series = {};
    try {
      const res = await this._hass.callWS({
        type: "history/history_during_period",
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        entity_ids: ids,
        minimal_response: true,
        no_attributes: true,
        significant_changes_only: false,
      });
      for (const key of keys) {
        const id = this._ids[key];
        const raw = id ? res?.[id] || [] : [];
        let prevTime = start.getTime();
        series[key] = raw.map((st) => {
          const ts = st.lu != null ? st.lu * 1000 : st.lc != null ? st.lc * 1000 : Date.parse(st.last_updated || st.last_changed);
          const time = isFinite(ts) ? Math.max(ts, start.getTime()) : prevTime;
          prevTime = time;
          const s = st.s ?? st.state;
          const value = key === "isCharging" || key === "isDriving" ? s === "on" : parseFloat(s);
          return [time, value];
        }).filter(([, v]) => typeof v === "boolean" || isFinite(v));
      }
    } catch (_e) {
      // Recorder disabled or websocket unavailable: show the empty state.
    }
    this._hist = { fetchedAt: Date.now(), stamp, start: start.getTime(), end: end.getTime(), series };
    this._histLoading = false;
    this._renderSection("chart", true);
  }

  _chartHtml() {
    const t = (k, v) => this._tr(k, v);
    const tabs = [["battery", t("tabBattery")], ["range", t("tabRange")], ["power", t("tabPower")]]
      .filter(([k]) => this._ids[k]);
    if (!tabs.find(([k]) => k === this._tab) && tabs.length) this._tab = tabs[0][0];
    const head = `<div class="ptitle"><h3>${esc(t("last24"))}</h3><div class="seg">${tabs.map(([k, l]) =>
      `<button class="${k === this._tab ? "on" : ""}" data-act="tab" data-tab="${k}">${esc(l)}</button>`).join("")}</div></div>`;

    const h = this._hist;
    const series = h?.series?.[this._tab] || [];
    if (!h || series.length === 0) {
      return `${head}<div class="note"><span class="dot" style="--c:var(--lm-sky)"></span>${esc(h ? t("noHistory") : "…")}</div><div class="chartbox" id="chartbox"></div>`;
    }

    // Summary line
    const bat = h.series.battery || [];
    let charged = 0;
    for (let i = 1; i < bat.length; i++) if (bat[i][1] > bat[i - 1][1]) charged += bat[i][1] - bat[i - 1][1];
    const odo = h.series.odometer || [];
    const driven = odo.length > 1 ? Math.max(0, odo[odo.length - 1][1] - odo[0][1]) : 0;
    const unit = this._tab === "battery" ? "%" : this._tab === "range" ? this._unit("range", "km") : "kW";
    const fmtV = (v) => (this._tab === "power" ? this._num(v, 1) : this._num(v));
    const vals = series.map(([, v]) => v);
    const maxV = Math.max(...vals), minV = Math.min(...vals);
    const tMax = series.find(([, v]) => v === maxV)[0], tMin = series.find(([, v]) => v === minV)[0];
    const chargedTxt = `+${this._num(charged)} %`;
    const drivenTxt = `${this._num(driven)} ${this._unit("odometer", "km")}`;
    let note = charged >= 1 && driven >= 1 ? t("sum24", { charged: chargedTxt, driven: drivenTxt })
      : charged >= 1 ? t("sumCharged", { charged: chargedTxt })
        : driven >= 1 ? t("sumDriven", { driven: drivenTxt }) : t("sumNoChange");
    if (maxV !== minV) {
      const peak = { max: `${fmtV(maxV)} ${unit}`, tmax: this._time(new Date(tMax)), min: `${fmtV(minV)} ${unit}`, tmin: this._time(new Date(tMin)) };
      note += " " + (this._tab === "power" ? t("peakOnly", peak) : t("peakLow", peak));
    }

    // Geometry
    const W = Math.max(260, this._chartSize.w || 560);
    const H = Math.max(240, this._chartSize.h || 300);
    const padL = 14, padR = 14, padT = 58, padB = 30;
    const x = (ts) => padL + ((ts - h.start) / (h.end - h.start)) * (W - padL - padR);
    let lo, hi;
    if (this._tab === "battery") {
      lo = Math.max(0, Math.floor((minV - 8) / 10) * 10);
      hi = Math.min(100, Math.ceil((maxV + 8) / 10) * 10);
    } else if (this._tab === "range") {
      lo = Math.max(0, Math.floor((minV - 20) / 50) * 50);
      hi = Math.ceil((maxV + 20) / 50) * 50;
    } else {
      lo = 0;
      hi = Math.max(4, Math.ceil(maxV * 1.15));
    }
    if (hi <= lo) hi = lo + 1;
    const y = (v) => padT + (1 - (v - lo) / (hi - lo)) * (H - padT - padB);

    // Resample the step series into a smooth curve (every 15 min).
    const N = 96;
    const pts = [];
    for (let i = 0; i <= N; i++) {
      const ts = h.start + (i / N) * (h.end - h.start);
      const v = valueAt(series, ts);
      if (v != null) pts.push([x(ts), y(v)]);
    }
    const line = smoothPath(pts);
    const area = `${line}L${pts[pts.length - 1][0]},${H - padB}L${pts[0][0]},${H - padB}Z`;

    // Charging / driving bands
    const bands = [];
    const band = (s, color) => {
      let from = null;
      const flush = (until) => { if (from != null) bands.push(`<rect x="${f1(x(from))}" y="${padT - 30}" width="${f1(Math.max(2, x(until) - x(from)))}" height="${H - padB - padT + 30}" fill="${color}" rx="6"/>`); from = null; };
      for (const [ts, on] of s) { if (on && from == null) from = ts; else if (!on && from != null) flush(ts); }
      flush(h.end);
    };
    band(h.series.isCharging || [], "rgba(52,211,153,.07)");
    band(h.series.isDriving || [], "rgba(56,189,248,.06)");

    // Ticks every 3 hours back from now
    const ticks = [];
    for (let k = 8; k >= 0; k--) ticks.push(h.end - k * 3 * HOUR);
    const tickIcon = (ts) => {
      const from = ts - 3 * HOUR;
      const anyOn = (s) => !!s && s.length > 0 && (valueAt(s, from) === true || s.some(([t0, on]) => on && t0 > from && t0 <= ts));
      if (anyOn(h.series.isCharging)) return ["bolt", "#34d399"];
      if (anyOn(h.series.isDriving)) return ["car", "#7dd3fc"];
      return ["parked", "#7b87a3"];
    };

    const labels = ticks.map((ts, i) => {
      const v = valueAt(series, ts);
      if (v == null || (this._tab === "power" && v === 0)) return "";
      const px = x(ts), py = y(v);
      const anchor = i === 0 ? "start" : i === ticks.length - 1 ? "end" : "middle";
      const ty = py - 10 < padT - 4 ? py + 18 : py - 10;
      return `<circle cx="${f1(px)}" cy="${f1(py)}" r="3.4" fill="#f6a823" stroke="#0f1729" stroke-width="2"/>` +
        `<text class="val" x="${f1(px)}" y="${f1(ty)}" text-anchor="${anchor}">${esc(fmtV(v))}${this._tab === "battery" ? "%" : ""}</text>`;
    }).join("");
    const icons = ticks.map((ts) => {
      const [name, color] = tickIcon(ts);
      const px = clamp(x(ts) - 8, 0, W - 16);
      return `<svg x="${f1(px)}" y="0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</svg>`;
    }).join("");
    const hours = ticks.slice(0, -1).map((ts, i) =>
      `<text x="${f1(x(ts))}" y="${H - 8}" text-anchor="${i === 0 ? "start" : "middle"}">${this._hour(new Date(ts))}</text>`).join("");
    const nowX = x(h.end);
    const pillW = Math.max(34, t("nowPill").length * 6.4 + 14);

    const svg = `
      <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(t("last24"))}">
        <defs><linearGradient id="lm-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#f6a823" stop-opacity=".55"/><stop offset=".6" stop-color="#b8741c" stop-opacity=".18"/><stop offset="1" stop-color="#f6a823" stop-opacity="0"/>
        </linearGradient></defs>
        ${bands.join("")}
        <line x1="${padL}" x2="${W - padR}" y1="${H - padB}" y2="${H - padB}" stroke="rgba(148,163,184,.14)"/>
        <path d="${area}" fill="url(#lm-area)"/>
        <path d="${line}" fill="none" stroke="#f6b13d" stroke-width="2.2" stroke-linejoin="round"/>
        <line x1="${f1(nowX)}" x2="${f1(nowX)}" y1="${padT - 28}" y2="${H - padB}" stroke="#f6a823" stroke-width="1.2" stroke-dasharray="3 4"/>
        ${labels}
        ${icons}
        ${hours}
        <rect x="${f1(nowX - pillW)}" y="${H - 21}" width="${f1(pillW)}" height="17" rx="8.5" fill="#f6a823"/>
        <text class="nowtxt" x="${f1(nowX - pillW / 2)}" y="${H - 9}" text-anchor="middle">${esc(t("nowPill"))}</text>
      </svg>`;

    return `${head}<div class="note"><span class="dot" style="--c:var(--lm-sky)"></span><span>${esc(note)}</span></div><div class="chartbox" id="chartbox">${svg}</div>`;
  }

  /* ----- last 7 days ----- */

  _weekHtml() {
    const t = (k, v) => this._tr(k, v);
    const s = this._s("week");
    const detail = Array.isArray(s?.attributes?.daily_detail) ? s.attributes.daily_detail : null;
    const total = this._v("week");
    const head = `<div class="ptitle"><h3>${esc(t("last7"))}</h3><span class="meta">Leapmotor cloud${total != null ? ` · ${this._num(total)} ${esc(this._unit("week", "km"))}` : ""}</span></div>`;
    if (!detail || !detail.length) return `${head}<div class="empty">${esc(t("noWeek"))}</div>`;

    const byDate = {};
    for (const row of detail) if (row && row.date) byDate[String(row.date).slice(0, 10)] = row;
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today.getTime() - i * DAY);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const row = byDate[key];
      const km = row ? parseFloat(row.mileage_km ?? 0) : null;
      const eRaw = row ? row.driving_energy_kwh ?? row.energy_kwh : null;
      const energy = eRaw != null && isFinite(parseFloat(eRaw)) ? parseFloat(eRaw) : null;
      days.push({ d, km: isFinite(km) ? km : null, energy, today: i === 0 });
    }
    const max = Math.max(1, ...days.map((d) => d.km || 0));
    let wd;
    try { wd = new Intl.DateTimeFormat(this._lang, { weekday: "short" }); } catch (_e) { wd = new Intl.DateTimeFormat("en", { weekday: "short" }); }
    const cols = days.map((day) => {
      const name = day.today ? t("today") : (() => { const n = wd.format(day.d).replace(".", ""); return n.charAt(0).toUpperCase() + n.slice(1); })();
      const ratio = (day.km || 0) / max;
      const top = rampColor([[0, "#38bdf8"], [0.5, "#5eead4"], [0.8, "#fde68a"], [1, "#fbbf24"]], ratio);
      const ic = !day.km ? "parked" : ratio > 0.66 ? "route" : "car";
      const cons = day.km > 0 && day.energy != null ? (day.energy / day.km) * 100 : null;
      return `
        <div class="day${day.today ? " today" : ""}">
          <div class="dn">${esc(name)}</div>
          <div class="di">${icon(ic)}</div>
          <div class="km">${day.km == null ? "—" : this._num(day.km)}<small>km</small></div>
          <div class="track"><div class="fill" style="height:${day.km ? Math.max(4, ratio * 100) : 0}%;background:linear-gradient(0deg,#2563eb,${top});--g:${top}88"></div></div>
          <div class="en${day.energy ? " has" : ""}">${day.energy != null ? this._num(day.energy, 1) : "—"}<small> kWh</small></div>
          <div class="co">${cons != null ? `${this._num(cons, 1)}/100` : "&nbsp;"}</div>
        </div>`;
    }).join("");
    const known = days.filter((d) => d.km != null);
    const longest = known.reduce((a, b) => ((b.km || 0) > (a?.km || 0) ? b : a), null);
    const sum = known.reduce((a, b) => a + (b.km || 0), 0);
    const driving = known.filter((d) => d.km > 0).length;
    const longestName = longest && longest.km ? (longest.today ? t("today") : wd.format(longest.d).replace(".", "")) : null;
    return `${head}<div class="days">${cols}</div>
      <div class="wfoot">${longestName ? `<span>${esc(t("longest"))} <b>${esc(longestName)} ${this._num(longest.km)} km</b></span>` : ""}
        <span>${esc(t("total"))} <b>${this._num(sum)} km</b></span><span>${esc(t("drivingDays"))} <b>${driving}/7</b></span></div>`;
  }

  /* ----- charging arc ----- */

  _chargingHtml() {
    const t = (k, v) => this._tr(k, v);
    const soc = this._v("battery");
    const limit = this._v("chargeLimit");
    const { charging, plugged, finished } = this._chargeState();
    const power = this._v("power"), amps = this._v("current"), volts = this._v("voltage");
    const metaBits = [];
    if (charging && power != null) metaBits.push(`${this._num(power, 1)} kW`);
    if (charging && amps != null) metaBits.push(`${this._num(Math.abs(amps))} A`);
    if (charging && volts != null) metaBits.push(`${this._num(volts)} V`);
    const meta = metaBits.length ? metaBits.join(" · ") : charging ? t("charging") : plugged ? t("pluggedIn") : t("unplugged");

    // Cubic arc and arc-length lookup
    const P0 = [40, 172], P1 = [170, -28], P2 = [350, -28], P3 = [480, 172];
    const bez = (u) => {
      const a = (1 - u) ** 3, b = 3 * (1 - u) ** 2 * u, c = 3 * (1 - u) * u * u, d = u ** 3;
      return [a * P0[0] + b * P1[0] + c * P2[0] + d * P3[0], a * P0[1] + b * P1[1] + c * P2[1] + d * P3[1]];
    };
    const samples = [[0, ...bez(0)]];
    let len = 0;
    for (let i = 1; i <= 200; i++) {
      const p = bez(i / 200), q = samples[i - 1];
      len += Math.hypot(p[0] - q[1], p[1] - q[2]);
      samples.push([len, ...p]);
    }
    const at = (pct) => {
      const target = (clamp(pct, 0, 100) / 100) * len;
      const s = samples.find((p) => p[0] >= target) || samples[samples.length - 1];
      return [s[1], s[2]];
    };
    const d = `M${P0.join(" ")}C${P1.join(" ")} ${P2.join(" ")} ${P3.join(" ")}`;
    const socPt = soc != null ? at(soc) : null;
    const limPt = limit != null ? at(limit) : null;

    const svg = `
      <svg viewBox="0 0 520 190" role="img" aria-label="${esc(t("chargingTitle"))}">
        <defs>
          <linearGradient id="lm-arc" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f59e0b"/><stop offset=".55" stop-color="#fbbf24"/><stop offset="1" stop-color="#f97316"/></linearGradient>
          <filter id="lm-dotglow" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>
        <line x1="20" x2="500" y1="172" y2="172" stroke="rgba(148,163,184,.14)"/>
        <path d="${d}" fill="none" stroke="rgba(148,163,184,.2)" stroke-width="3" stroke-dasharray="2 7" stroke-linecap="round"/>
        ${soc != null ? `<path d="${d}" fill="none" stroke="url(#lm-arc)" stroke-width="4.5" stroke-linecap="round" pathLength="100" stroke-dasharray="${clamp(soc, 0, 100)} 100"/>` : ""}
        ${limPt ? `<circle cx="${f1(limPt[0])}" cy="${f1(limPt[1])}" r="6" fill="#0f1729" stroke="#94a3b8" stroke-width="2"/><text x="${f1(limPt[0])}" y="${f1(limPt[1] - 14)}" text-anchor="middle">${this._num(limit)}%</text>` : ""}
        ${socPt ? `<circle cx="${f1(socPt[0])}" cy="${f1(socPt[1])}" r="8" fill="${charging ? "#34d399" : "#fbbf24"}" filter="url(#lm-dotglow)"/>` : ""}
      </svg>`;

    const finish = this._ts("finish");
    const rem = this._v("remaining");
    const rangeV = this._v("range");
    const right = charging && finish
      ? { label: t("done"), value: this._time(new Date(finish)) }
      : { label: t("range"), value: rangeV != null ? `${this._num(rangeV)} ${this._unit("range", "km")}` : "—" };
    const lc = this._s("lastCharge");
    const lcV = this._v("lastCharge");
    const lcType = lc?.attributes?.charge_type;
    const stateTitle = charging ? t("charging") : finished ? t("finished") : plugged ? t("pluggedIn") : t("unplugged");
    const stateSub = lcV != null ? t("lastCharge", { x: `${this._num(lcV, 1)} kWh${lcType ? ` · ${lcType}` : ""}` }) : "";

    return `
      <div class="ptitle"><h3>${esc(t("chargingTitle"))}</h3><span class="meta">${esc(meta)}</span></div>
      <div class="arcbox clickable" data-more="battery">${svg}</div>
      <div class="arclabels">
        <div><small>${esc(t("battery"))}</small><span class="mono">${soc != null ? this._num(soc) : "—"} %</span></div>
        <div class="mid">${esc(t("limit"))} ${limit != null ? `${this._num(limit)} %` : "—"}</div>
        <div><small>${esc(right.label)}</small><span class="mono">${esc(right.value)}</span></div>
      </div>
      <div class="cbottom">
        <div class="cstate"><span class="sq${charging ? " on" : ""}">${icon(charging ? "bolt" : "plug")}</span><div><b>${esc(stateTitle)}</b>${stateSub ? `<small>${esc(stateSub)}</small>` : ""}</div></div>
        ${charging && rem != null ? `<div class="cright"><span class="mono">${esc(this._dur(rem))}</span><small>${esc(t("remaining"))}</small></div>` : ""}
      </div>`;
  }

  /* ----- energy & tires ----- */

  _energyHtml() {
    const t = (k, v) => this._tr(k, v);
    const avg = this._v("avg");
    const pos = avg != null ? clamp((avg - 10) / 20, 0, 1) : null;
    const ratings = this._t.ratings || STRINGS.en.ratings;
    const rating = avg == null ? "" : avg < 13 ? ratings[0] : avg < 16 ? ratings[1] : avg < 19 ? ratings[2] : avg < 23 ? ratings[3] : ratings[4];
    const color = pos != null ? rampColor(EFFICIENCY_STOPS, pos) : "#94a3b8";
    const tiles = TIRES.filter(([k]) => this._s(k)).map(([k, l]) => {
      const v = this._v(k);
      return `<div class="t4 clickable${v != null && v < TIRE_LOW_BAR ? " low" : ""}" data-more="${k}"><small>${esc(t(l))}</small><span class="mono">${v != null ? this._num(v, 1) : "—"}<span>bar</span></span></div>`;
    }).join("");
    const d = this._v("lwDriving"), c = this._v("lwClimate"), o = this._v("lwOther");
    let split = "";
    if (d != null || c != null || o != null) {
      const sum = (d || 0) + (c || 0) + (o || 0) || 1;
      const seg = (v, col) => (v ? `<i style="width:${(v / sum) * 100}%;background:${col}"></i>` : "");
      split = `<div class="split">${esc(t("lastWeek"))}<div class="bar">${seg(d, "#f6a823")}${seg(c, "#38bdf8")}${seg(o, "#a78bfa")}</div>
        <div class="lg"><span><i style="background:#f6a823"></i>${esc(t("drivingE"))} ${this._num(d || 0)} %</span><span><i style="background:#38bdf8"></i>${esc(t("climateE"))} ${this._num(c || 0)} %</span><span><i style="background:#a78bfa"></i>${esc(t("otherE"))} ${this._num(o || 0)} %</span></div></div>`;
    }
    return `
      <div class="ptitle"><h3>${esc(t("energyTires"))}</h3><span class="meta">${esc(t("sixWeek"))}</span></div>
      <div class="aq clickable" data-more="avg">
        <span class="aqv" style="color:${color}">${avg != null ? this._num(avg, 1) : "—"}</span>
        <div class="t"><b>kWh/100 km${rating ? ` <span>· ${esc(rating)}</span>` : ""}</b>
          <div class="scale">${pos != null ? `<i style="left:${pos * 100}%"></i>` : ""}</div></div>
      </div>
      ${tiles ? `<div class="tiles4">${tiles}</div>` : ""}
      ${split}`;
  }

  /* ----- remote control ----- */

  _controlDefs() {
    const t = (k) => this._tr(k);
    const defs = {};
    const add = (key, o) => { if (o.entity) defs[key] = o; };
    const sw = (k) => this._s(k);
    const lock = this._s("lock");
    if (lock) {
      const locked = lock.state === "locked";
      add(locked ? "unlockCar" : "lockCar", { entity: this._ids.lock, domain: "lock", service: locked ? "unlock" : "lock", label: locked ? t("unlock") : t("lock"), icon: locked ? "lock" : "unlock", color: "#f6a823", sub: locked ? t("locked") : t("unlocked"), on: !locked, tile: true });
    }
    const swDef = (key, k, label, ic, color, extra = "") => {
      const s = sw(k);
      if (!s) return;
      add(key, { entity: this._ids[k], domain: "switch", service: s.state === "on" ? "turn_off" : "turn_on", label, icon: ic, color, on: s.state === "on", sub: (s.state === "on" ? t("on") : t("off")) + extra, tile: true });
    };
    const inside = this._v("interior");
    swDef("climate", "climateSwitch", t("climate"), "fan", "#38bdf8", inside != null ? ` · ${this._num(inside, 1)} °C` : "");
    const btn = (key, k, label, ic, color, sub = "") => add(key, { entity: this._ids[k], domain: "button", service: "press", label, icon: ic, color, sub, tile: true });
    btn("quickHeat", "quickHeatBtn", t("quickHeat"), "flame", "#fb923c");
    btn("quickCool", "quickCoolBtn", t("quickCool"), "snow", "#7dd3fc");
    btn("defrost", "defrostBtn", t("defrost"), "defrost", "#5eead4");
    swDef("preheat", "preheat", t("preheat"), "battery", "#34d399");
    swDef("steering", "steeringHeat", t("steering"), "wheel", "#fbbf24");
    swDef("mirrors", "mirrorHeat", t("mirrors"), "mirror", "#c4b5fd");
    swDef("schedule", "chargeSchedule", t("schedule"), "calendar", "#a78bfa");
    if (this._on("trunk")) btn("trunk", "trunkCloseBtn", t("closeTrunk"), "trunk", "#2dd4bf");
    else btn("trunk", "trunkOpenBtn", t("openTrunk"), "trunk", "#2dd4bf");
    if (WINDOWS.some((k) => this._on(k))) btn("windows", "windowsCloseBtn", t("closeWindows"), "window", "#38bdf8");
    else btn("windows", "windowsOpenBtn", t("openWindows"), "window", "#38bdf8");
    const shade = this._v("sunshadePos");
    if (shade != null && shade > 0) btn("sunshade", "sunshadeCloseBtn", t("closeSunshade"), "sunshade", "#94a3b8");
    else btn("sunshade", "sunshadeOpenBtn", t("openSunshade"), "sunshade", "#94a3b8");
    if (this._chargeState().plugged) btn("unlockCharger", "unlockCharger", t("unlockCharger"), "plug", "#34d399");
    btn("find", "findBtn", t("findCar"), "find", "#f472b6");
    return defs;
  }

  _controlsSig() {
    return [this._sig(["lock", "climateSwitch", "preheat", "steeringHeat", "mirrorHeat", "chargeSchedule", "trunk", "sunshadePos", "isPlugged", "isCharging", "connection", "interior"]),
      this._sig(WINDOWS), JSON.stringify(this._armed), JSON.stringify(this._busy)].join("#");
  }

  _controlsHtml() {
    const t = (k) => this._tr(k);
    const defs = this._controlDefs();
    const tiles = Object.entries(defs).filter(([, d]) => d.tile).map(([key, d]) => {
      const armed = this._isArmed(key);
      return `<button class="tile${d.on ? " on" : ""}${armed ? " armed" : ""}${this._busy[key] ? " busy" : ""}" style="--c:${d.color}" data-act="ctl" data-key="${key}">
        <span class="sq">${icon(d.icon)}</span><span class="tl">${esc(d.label)}</span><span class="ts">${esc(armed ? t("tapConfirm") : d.sub || "")}</span></button>`;
    }).join("");
    if (!tiles) return `<div class="ptitle"><h3>${esc(t("controls"))}</h3></div><div class="empty">—</div>`;
    return `<div class="ptitle"><h3>${esc(t("controls"))}</h3><span class="meta">${esc(this._config.confirm_actions ? t("confirmHint") : "")}</span></div><div class="tiles">${tiles}</div>`;
  }

  /* ----- interaction ----- */

  _isArmed(key) {
    return !!(this._armed && this._armed.key === key && Date.now() < this._armed.until);
  }

  _rerenderInteractive() {
    for (const name of ["check", "controls", "hero"]) if (this._config.sections.includes(name)) this._renderSection(name);
  }

  _onClick(ev) {
    const el = ev.composedPath().find((n) => n instanceof HTMLElement && (n.dataset?.act || n.dataset?.more));
    if (!el) return;
    if (el.dataset.act === "tab") {
      this._tab = el.dataset.tab;
      this._renderSection("chart", true);
      return;
    }
    if (el.dataset.act === "refresh") {
      this._refresh();
      return;
    }
    if (el.dataset.act === "ctl") {
      this._control(el.dataset.key);
      return;
    }
    if (el.dataset.more) {
      const id = this._ids[el.dataset.more];
      if (id) this.dispatchEvent(new CustomEvent("hass-more-info", { bubbles: true, composed: true, detail: { entityId: id } }));
    }
  }

  _toast(message) {
    this.dispatchEvent(new CustomEvent("hass-notification", { bubbles: true, composed: true, detail: { message } }));
  }

  async _refresh() {
    const id = this._ids.refreshBtn;
    if (!id || this._busy.refresh) return;
    this._busy.refresh = true;
    this._rerenderInteractive();
    try {
      await this._hass.callService("button", "press", { entity_id: id });
    } catch (err) {
      this._toast(this._tr("failed", { x: err?.message || String(err) }));
    }
    setTimeout(() => { this._busy.refresh = false; this._rerenderInteractive(); }, 2500);
  }

  async _control(key) {
    const def = this._controlDefs()[key];
    if (!def) return;
    if (this._config.confirm_actions && !this._isArmed(key)) {
      this._armed = { key, until: Date.now() + 4000 };
      this._rerenderInteractive();
      setTimeout(() => {
        if (this._armed && this._armed.key === key && Date.now() >= this._armed.until) {
          this._armed = null;
          this._rerenderInteractive();
        }
      }, 4100);
      return;
    }
    this._armed = null;
    this._busy[key] = true;
    this._rerenderInteractive();
    try {
      await this._hass.callService(def.domain, def.service, { entity_id: def.entity });
      this._toast(this._tr("sent", { x: def.label }));
    } catch (err) {
      this._toast(this._tr("failed", { x: err?.message || String(err) }));
    }
    setTimeout(() => { delete this._busy[key]; this._rerenderInteractive(); }, 1500);
  }
}

// Artwork is exposed for the docs banner and previews.
LeapmotorCard.art = { sceneSvg, carSvg };

if (!customElements.get("leapmotor-card")) {
  customElements.define("leapmotor-card", LeapmotorCard);
  window.customCards = window.customCards || [];
  window.customCards.push({
    type: "leapmotor-card",
    name: "Leapmotor",
    description: "Night-sky dashboard for your Leapmotor: battery, charging, vehicle check, 7-day driving and remote controls.",
    preview: true,
    documentationURL: "https://github.com/sabotin/leapmotor/blob/main/docs/card.md",
  });
  console.info(`%c LEAPMOTOR-CARD %c ${CARD_VERSION} `, "color:#1a1206;background:#f6a823;font-weight:700;border-radius:4px 0 0 4px;padding:2px 6px", "color:#f6a823;background:#0f1729;border-radius:0 4px 4px 0;padding:2px 6px");
}
