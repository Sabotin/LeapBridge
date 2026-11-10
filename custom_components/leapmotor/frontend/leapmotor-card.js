/*!
 * Leapmotor Card
 * Dashboard for the Leapmotor Home Assistant integration, in three looks.
 *
 * Part of https://github.com/Sabotin/LeapBridge (MIT License).
 * Bundled fonts: Outfit and JetBrains Mono, SIL Open Font License 1.1.
 *
 * The integration serves and auto-loads this file, so no manual resource
 * setup is needed. Add the card with:  type: custom:leapmotor-card
 */

const CARD_VERSION = "1.2.0";
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
    precoolCabin: "Pre-cool cabin", autoCabin: "Auto pre-condition", willCool: "will cool", willHeat: "will heat",
    preheatCabin: "Preheat cabin", preheatSub: "{t} °C · fan {f}", recircShort: "recirc.",
    mntTitle: "Maintenance", mntOk: "OK", mntSoon: "SOON", mntOverdue: "OVERDUE", kmLeft: "{x} km", daysLeft: "{x} days", overdueBy: "{x} overdue", mntAssumed: "assumed on schedule", mntLogged: "logged", mntDone: "Done", mntHint: "Tap Done twice after a service", mntNone: "No maintenance schedule yet.", insightsTitle: "Insights", driveCost: "Driving cost this month", per100: "{x} per 100 km", drain: "Parked drain", drainSub: "{p} % of battery per day", vsUsual: "{x} vs usual", usualSub: "last trip vs {n} similar trips", tempTitle: "Consumption by outside temperature", tiresOk: "Tires look fine", tiresWarn: "Check tires", tLow: "low", tUneven: "uneven", tDropping: "slowly dropping", noInsights: "Insights appear after a few days of driving and charging.", toLimit: "To {l} %: {e} kWh", costNowLow: "{now} now · {low} in low tariff", lowFrom: "from {t}", sentry: "Sentry mode", healthy: "Healthy charging", startCharge: "Start charging", stopCharge: "Stop charging", openRoof: "Open sunroof", closeRoof: "Close sunroof", logged: "Logged: {x}",
    tripsTitle: "Trip log", tripsMeta: "today {d} · this month {m}", drivingNow: "Driving now", yesterday: "Yesterday", noTrips: "Trips appear here after your next drive. For exact start and end times, set the update interval to 1 minute.", colTrip: "Trip", colDistance: "Distance", colDuration: "Duration", colEnergy: "Energy", colConsumption: "kWh/100 km", colSoc: "Battery", colSpeed: "Avg speed", monthTrips: "This month {d} · {n}× · {e}", monthCharging: "This month", lastSession: "Last session", tierHome: "Home", tierAC: "Public AC", tierDC: "Public DC", health: "Battery health", healthSub: "{c} of {r} kWh usable", healthPending: "estimate after 3 days with a full charge", sessionsN: "{n}× charged",
    mapTitle: "Trip map", mapLoading: "Loading route…", mapEmpty: "No route for this trip yet. It is drawn from the car's location history in Home Assistant.", mapHint: "Trips appear on the map after your next drive.", mapStart: "Start", mapEnd: "End", mapLive: "Live", topSpeed: "Top speed", avgSpeedL: "Average", aboveLimit: "Above limit", limitCar: "Car speed limit", limitAlert: "Speed alert", legendBelow: "below limit", legendNear: "close to it", legendAbove: "above limit", legendSlow: "up to 50", legendMid: "50–90", legendFast: "over 90", tooFast: "Too fast · {x}", speedLimit: "Speed limit", trunk: "Trunk", windows: "Windows", doors: "Doors", sunroof: "Sunroof", sentryOn: "Sentry", tireLowShort: "Tire", limitDown: "Lower charge limit", limitUp: "Raise charge limit", limitSet: "Charge limit {x}",
    pageOverview: "Overview", pageTrips: "Trips", pageCharging: "Charging", pageVehicle: "Vehicle",
    groupClimate: "Climate", groupAccess: "Doors & security", groupCharging: "Charging controls",
    setLimit: "Set to {x}", cancel: "Cancel", currently: "now {x}", noSessions: "No charging sessions recorded yet — they appear after the next charge.",
    delta24: "{x} in 24 h", chargedL: "Charged", drivenL: "Driven", rangeLeft: "{x} range", doneAt: "done at {x}", left: "{x} left",
    weekEnergy: "Energy", weekAvg: "Average", tripDetail: "Trip details", cost: "Cost", showMore: "Show {n} more",
    todayL: "Today", monthL: "This month", tripsN: "{n}×", tiresTitle: "Tires", tireHint: "low below {x} bar", tiresOkShort: "Tires OK",
    FLl: "Front left", FRl: "Front right", RLl: "Rear left", RRl: "Rear right", batteryEff: "Battery & efficiency",
    efficiency: "Consumption", maxL: "max {x}", startL: "Start", endL: "End",
    lookL: "Theme", look_classic: "Classic", look_cluster: "Driver display", look_console: "Car app",
    look_classic_d: "Night or day sky with your car", look_cluster_d: "Gauges around the car, warning lights", look_console_d: "Range, battery bar, round buttons",
    menu: "Menu", pageSettings: "Settings", setLanguage: "Language", langAuto: "Auto", langAutoSub: "from your profile",
    setScene: "Day or night", sceneAuto: "Auto", sceneDay: "Day", sceneNight: "Night", sceneHint: "Auto follows sunrise and sunset.",
    setSavedUser: "Saved for your Home Assistant user, on every device. The card configuration sets the defaults.",
    setSavedLocal: "Saved in this browser. The card configuration sets the defaults.", setReset: "Use card defaults",
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
    precoolCabin: "Ohladi kabino", autoCabin: "Samodejna priprava", willCool: "bo hladilo", willHeat: "bo grelo",
    preheatCabin: "Predgrej kabino", preheatSub: "{t} °C · ventilator {f}", recircShort: "kroženje",
    mntTitle: "Vzdrževanje", mntOk: "OK", mntSoon: "KMALU", mntOverdue: "ZAMUJENO", kmLeft: "{x} km", daysLeft: "{x} dni", overdueBy: "{x} čez rok", mntAssumed: "predpostavka: redno servisirano", mntLogged: "zabeleženo", mntDone: "Opravljeno", mntHint: "Po servisu dvakrat tapni Opravljeno", mntNone: "Servisnega načrta še ni.", insightsTitle: "Vpogledi", driveCost: "Strošek vožnje ta mesec", per100: "{x} na 100 km", drain: "Praznjenje med parkiranjem", drainSub: "{p} % baterije na dan", vsUsual: "{x} glede na običajno", usualSub: "zadnja vožnja proti {n} podobnim", tempTitle: "Poraba glede na zunanjo temperaturo", tiresOk: "Pnevmatike so v redu", tiresWarn: "Preveri pnevmatike", tLow: "nizek tlak", tUneven: "neenakomerno", tDropping: "počasi pada", noInsights: "Vpogledi se pojavijo po nekaj dneh vožnje in polnjenja.", toLimit: "Do {l} %: {e} kWh", costNowLow: "{now} zdaj · {low} v nizki tarifi", lowFrom: "od {t}", sentry: "Stražarski način", healthy: "Zdravo polnjenje", startCharge: "Začni polnjenje", stopCharge: "Ustavi polnjenje", openRoof: "Odpri strešno okno", closeRoof: "Zapri strešno okno", logged: "Zabeleženo: {x}",
    tripsTitle: "Dnevnik voženj", tripsMeta: "danes {d} · ta mesec {m}", drivingNow: "Vožnja poteka", yesterday: "Včeraj", noTrips: "Vožnje se pojavijo tukaj po naslednji vožnji. Za natančne čase začetka in konca nastavi interval posodabljanja na 1 minuto.", colTrip: "Vožnja", colDistance: "Razdalja", colDuration: "Trajanje", colEnergy: "Energija", colConsumption: "kWh/100 km", colSoc: "Baterija", colSpeed: "Povp. hitrost", monthTrips: "Ta mesec {d} · {n}× · {e}", monthCharging: "Ta mesec", lastSession: "Zadnje polnjenje", tierHome: "Doma", tierAC: "Javno AC", tierDC: "Javno DC", health: "Zdravje baterije", healthSub: "{c} od {r} kWh uporabnih", healthPending: "ocena po 3 dneh s polnim polnjenjem", sessionsN: "{n}× polnjeno",
    mapTitle: "Zemljevid vožnje", mapLoading: "Nalagam pot …", mapEmpty: "Za to vožnjo še ni poti. Nariše se iz zgodovine lokacije avta v Home Assistantu.", mapHint: "Vožnje se na zemljevidu pokažejo po naslednji vožnji.", mapStart: "Začetek", mapEnd: "Cilj", mapLive: "V živo", topSpeed: "Najvišja hitrost", avgSpeedL: "Povprečno", aboveLimit: "Nad omejitvijo", limitCar: "Omejitev v avtu", limitAlert: "Opozorilo na hitrost", legendBelow: "pod omejitvijo", legendNear: "blizu nje", legendAbove: "nad omejitvijo", legendSlow: "do 50", legendMid: "50–90", legendFast: "nad 90", tooFast: "Prehitro · {x}", speedLimit: "Omejitev hitrosti", trunk: "Prtljažnik", windows: "Okna", doors: "Vrata", sunroof: "Strešno okno", sentryOn: "Straža", tireLowShort: "Pnevmatika", limitDown: "Znižaj mejo polnjenja", limitUp: "Zvišaj mejo polnjenja", limitSet: "Meja polnjenja {x}",
    pageOverview: "Pregled", pageTrips: "Vožnje", pageCharging: "Polnjenje", pageVehicle: "Vozilo",
    groupClimate: "Klima", groupAccess: "Vrata in varnost", groupCharging: "Upravljanje polnjenja",
    setLimit: "Nastavi na {x}", cancel: "Prekliči", currently: "zdaj {x}", noSessions: "Polnjenja še niso zabeležena — pokažejo se po naslednjem polnjenju.",
    delta24: "{x} v 24 urah", chargedL: "Napolnjeno", drivenL: "Prevoženo", rangeLeft: "doseg {x}", doneAt: "konec ob {x}", left: "še {x}",
    weekEnergy: "Energija", weekAvg: "Povprečje", tripDetail: "Podrobnosti vožnje", cost: "Strošek", showMore: "Pokaži še {n}",
    todayL: "Danes", monthL: "Ta mesec", tripsN: "{n}×", tiresTitle: "Pnevmatike", tireHint: "nizko pod {x} bar", tiresOkShort: "Pnevmatike OK",
    FLl: "Spredaj levo", FRl: "Spredaj desno", RLl: "Zadaj levo", RRl: "Zadaj desno", batteryEff: "Baterija in poraba",
    efficiency: "Poraba", maxL: "največ {x}", startL: "Začetek", endL: "Konec",
    lookL: "Tema", look_classic: "Klasično", look_cluster: "Voznikov zaslon", look_console: "Aplikacija",
    look_classic_d: "Nočno ali dnevno nebo z avtom", look_cluster_d: "Merilniki ob avtu, opozorilne lučke", look_console_d: "Doseg, vrstica baterije, okrogli gumbi",
    menu: "Meni", pageSettings: "Nastavitve", setLanguage: "Jezik", langAuto: "Samodejno", langAutoSub: "iz profila",
    setScene: "Dan ali noč", sceneAuto: "Samodejno", sceneDay: "Dan", sceneNight: "Noč", sceneHint: "Samodejno sledi sončnemu vzhodu in zahodu.",
    setSavedUser: "Shranjeno za tvojega uporabnika Home Assistanta, na vseh napravah. Privzete vrednosti so v nastavitvah kartice.",
    setSavedLocal: "Shranjeno v tem brskalniku. Privzete vrednosti so v nastavitvah kartice.", setReset: "Uporabi privzete",
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
    precoolCabin: "Innenraum vorkühlen", autoCabin: "Auto-Vorklimatisierung", willCool: "kühlt", willHeat: "heizt",
    preheatCabin: "Innenraum vorheizen", preheatSub: "{t} °C · Lüfter {f}", recircShort: "Umluft",
    mntTitle: "Wartung", mntOk: "OK", mntSoon: "BALD", mntOverdue: "FÄLLIG", kmLeft: "{x} km", daysLeft: "{x} Tage", overdueBy: "{x} überfällig", mntAssumed: "angenommen: planmäßig", mntLogged: "erfasst", mntDone: "Erledigt", mntHint: "Nach dem Service zweimal auf Erledigt tippen", mntNone: "Noch kein Wartungsplan.", insightsTitle: "Einblicke", driveCost: "Fahrkosten diesen Monat", per100: "{x} pro 100 km", drain: "Standverlust", drainSub: "{p} % Akku pro Tag", vsUsual: "{x} ggü. üblich", usualSub: "letzte Fahrt ggü. {n} ähnlichen", tempTitle: "Verbrauch nach Außentemperatur", tiresOk: "Reifen in Ordnung", tiresWarn: "Reifen prüfen", tLow: "niedrig", tUneven: "ungleich", tDropping: "fällt langsam", noInsights: "Einblicke erscheinen nach einigen Tagen Fahren und Laden.", toLimit: "Bis {l} %: {e} kWh", costNowLow: "{now} jetzt · {low} im Niedertarif", lowFrom: "ab {t}", sentry: "Wächtermodus", healthy: "Schonladen", startCharge: "Laden starten", stopCharge: "Laden stoppen", openRoof: "Schiebedach öffnen", closeRoof: "Schiebedach schließen", logged: "Erfasst: {x}",
    tripsTitle: "Fahrtenbuch", tripsMeta: "heute {d} · diesen Monat {m}", drivingNow: "Fahrt läuft", yesterday: "Gestern", noTrips: "Fahrten erscheinen hier nach der nächsten Fahrt. Für genaue Start- und Endzeiten das Aktualisierungsintervall auf 1 Minute stellen.", colTrip: "Fahrt", colDistance: "Strecke", colDuration: "Dauer", colEnergy: "Energie", colConsumption: "kWh/100 km", colSoc: "Akku", colSpeed: "Ø Tempo", monthTrips: "Diesen Monat {d} · {n}× · {e}", monthCharging: "Diesen Monat", lastSession: "Letzte Ladung", tierHome: "Zuhause", tierAC: "Öffentlich AC", tierDC: "Öffentlich DC", health: "Akkugesundheit", healthSub: "{c} von {r} kWh nutzbar", healthPending: "Schätzung nach 3 Tagen mit Vollladung", sessionsN: "{n}× geladen",
    mapTitle: "Fahrtenkarte", mapLoading: "Route wird geladen …", mapEmpty: "Für diese Fahrt gibt es noch keine Route. Sie wird aus dem Standortverlauf des Autos in Home Assistant gezeichnet.", mapHint: "Fahrten erscheinen nach der nächsten Fahrt auf der Karte.", mapStart: "Start", mapEnd: "Ziel", mapLive: "Live", topSpeed: "Höchstgeschw.", avgSpeedL: "Durchschnitt", aboveLimit: "Über Limit", limitCar: "Tempolimit im Auto", limitAlert: "Tempowarnung", legendBelow: "unter Limit", legendNear: "knapp darunter", legendAbove: "über Limit", legendSlow: "bis 50", legendMid: "50–90", legendFast: "über 90", tooFast: "Zu schnell · {x}", speedLimit: "Tempolimit", trunk: "Kofferraum", windows: "Fenster", doors: "Türen", sunroof: "Schiebedach", sentryOn: "Wächter", tireLowShort: "Reifen", limitDown: "Ladelimit senken", limitUp: "Ladelimit erhöhen", limitSet: "Ladelimit {x}",
    pageOverview: "Übersicht", pageTrips: "Fahrten", pageCharging: "Laden", pageVehicle: "Fahrzeug",
    groupClimate: "Klima", groupAccess: "Türen & Sicherheit", groupCharging: "Ladesteuerung",
    setLimit: "Auf {x} setzen", cancel: "Abbrechen", currently: "jetzt {x}", noSessions: "Noch keine Ladevorgänge erfasst — sie erscheinen nach der nächsten Ladung.",
    delta24: "{x} in 24 h", chargedL: "Geladen", drivenL: "Gefahren", rangeLeft: "{x} Reichweite", doneAt: "fertig um {x}", left: "noch {x}",
    weekEnergy: "Energie", weekAvg: "Durchschnitt", tripDetail: "Fahrtdetails", cost: "Kosten", showMore: "{n} weitere anzeigen",
    todayL: "Heute", monthL: "Diesen Monat", tripsN: "{n}×", tiresTitle: "Reifen", tireHint: "niedrig unter {x} bar", tiresOkShort: "Reifen OK",
    FLl: "Vorne links", FRl: "Vorne rechts", RLl: "Hinten links", RRl: "Hinten rechts", batteryEff: "Akku & Effizienz",
    efficiency: "Verbrauch", maxL: "max. {x}", startL: "Start", endL: "Ende",
    lookL: "Design", look_classic: "Klassisch", look_cluster: "Fahrerdisplay", look_console: "Auto-App",
    look_classic_d: "Nacht- oder Taghimmel mit deinem Auto", look_cluster_d: "Rundinstrumente am Auto, Warnleuchten", look_console_d: "Reichweite, Akkubalken, runde Tasten",
    menu: "Menü", pageSettings: "Einstellungen", setLanguage: "Sprache", langAuto: "Automatisch", langAutoSub: "aus deinem Profil",
    setScene: "Tag oder Nacht", sceneAuto: "Automatisch", sceneDay: "Tag", sceneNight: "Nacht", sceneHint: "Automatisch folgt Sonnenauf- und -untergang.",
    setSavedUser: "Für deinen Home-Assistant-Benutzer auf allen Geräten gespeichert. Die Kartenkonfiguration legt die Vorgaben fest.",
    setSavedLocal: "In diesem Browser gespeichert. Die Kartenkonfiguration legt die Vorgaben fest.", setReset: "Vorgaben verwenden",
  },
};

/* Texts of the insights, journey, charging-history, software and inbox panels. */
Object.assign(STRINGS.en, {
  pageJourney: "Journey", sectionFailed: "This part cannot be shown right now.", schedOnce: "once", rlNowPlain: "with the battery as it is now",
  weekTitle: "Your usual week",
  outlookTitle: "Outlook", olTomorrow: "Tomorrow", olToday: "Today",
  olLeaves: "Usually leaves at {t}", olLeavesSub: "on {p} % of your {d}s · learned from your trips",
  olNoDeparture: "No usual departure", olNoDepartureSub: "the car usually stays parked on {d}s",
  olNeeds: "Usually up to {km} km", olNeedsSub: "about {e} kWh · {p} % with reserve",
  olEnough: "Enough battery", olCharge: "Plug in tonight", olChargeNow: "Charge before you leave", olLow: "Battery low", olPlugged: "Plugged in",
  olSocSub: "{soc} % now · {need} % needed", olSocOnly: "{soc} % now", olLimitLow: "raise the charge limit to {p} %",
  olLearning: "Still learning your routine", olLearningSub: "Predictions appear after about three weeks of driving.",
  realRange: "Real range", carSays: "the car says {x}", basisTemp: "your consumption at this temperature",
  basisRecent: "your recent trips", basisCloud: "your 6-week average", nextDep: "Next departure", inTime: "in {x}",
  realShort: "real {x}",
  tlTitle: "Last 24 hours", tlEmpty: "Nothing recorded in the last 24 hours yet.", tlDrove: "Drove {km} km",
  tlDroveShort: "Drove", tlCharged: "Charged {p} %", tlChargedShort: "Charged", tlChargingNow: "Charging now",
  tlDrivingNow: "Driving now", tlUnlocked: "Unlocked", tlLocked: "Locked", tlPlugged: "Plugged in", tlUnplugged: "Unplugged",
  rtTitle: "Frequent routes", rtTrips: "{n} trips", rtUsual: "usually at {t}", rtBest: "best {x}",
  rtEmpty: "Routes appear once you have driven the same way three times.", placeN: "Place {n}",
  ecoScore: "Eco score", ecoShort: "eco {x}", exportCsv: "Export CSV", exported: "Exported {n} trips",
  replay: "Replay", replayPause: "Pause",
  cvTitle: "Charging curve", cvNow: "this session", cvLast: "last session", cvUsual: "usual", cvPeak: "peak {x} kW",
  cvEmpty: "The curve appears after the next charging session.", slowTitle: "Charging slower than usual",
  slowSub: "{now} kW now · usually {usual} kW here",
  chTitle: "Charging history", chMeta: "last {n} days · Leapmotor cloud", chEmpty: "No charging sessions in the cloud yet.",
  chAt: "at {p}", chSessions: "{n} sessions",
  swTitle: "Car software", swUpToDate: "Up to date", swUpdate: "Update available", swInstalled: "Installed {v}",
  swNew: "Version {v} is ready to install in the car", swSince: "since {d}", swNotes: "What is new",
  swOwnerOnly: "The Leapmotor cloud only gives the software version to the owner's account.",
  swUnknown: "The software version has not been reported yet.", swSize: "{x} MB download",
  schedTitle: "Scheduled climate", schedNext: "next {t}", schedNone: "No climate schedule set in the car.",
  schedOff: "off", schedDaily: "every day", modeHeat: "heat", modeCool: "cool", modeFan: "fan",
  permTitle: "This account may", permShared: "shared car",
  ibTitle: "Messages", ibEmpty: "No messages from the car.", ibUnread: "{n} unread",
  calTitle: "A year of driving", calLess: "less", calMore: "more", calTotal: "{km} km on {d} days",
  calNoData: "The calendar fills in as the cloud's daily history arrives.", monthsTitle: "Last 12 months",
  recTitle: "Totals & records", recOdo: "Odometer", recEnergy: "Energy used", recAvg: "Lifetime average",
  recPerDay: "per day", recEarth: "{x}× around the Earth", recLongestDay: "Longest day", recLongestTrip: "Longest trip",
  recBestTrip: "Most efficient trip", recTopSpeed: "Top speed", recStreak: "Longest streak",
  recStreakDays: "{n} days in a row", recBigCharge: "Biggest charge", recFastCharge: "Fastest charge",
  recColdest: "Coldest drive", recYear: "This year", recProjected: "on course for {x} km", recBusiest: "Busiest month",
  recNone: "Records appear as you drive.",
  savTitle: "Compared with a petrol car", savFuel: "Fuel not burned", savMoney: "Saved", savCo2: "CO₂ avoided",
  savAssume: "compared with {l} l/100 km · electricity at {g} g CO₂/kWh",
  savSetPrice: "Set a fuel price in the integration options to see the money saved.", savLife: "since new", savMonth: "this month",
  bdTitle: "Achievements", bdLevels: ["", "Bronze", "Silver", "Gold"], bdNext: "next: {x}", bdEarned: "{n} of {m}",
  bd_distance: "Distance", bd_long_day: "Road-trip day", bd_long_trip: "Long haul", bd_eco_driver: "Eco driver",
  bd_streak: "On a roll", bd_explorer: "Explorer", bd_frost: "Frost driver", bd_full_cycles: "Charge cycles",
  bd_low_tariff: "Night owl", bd_co2: "CO₂ saver", bd_anniversary: "Together",
  bdd_distance: "kilometres on the odometer", bdd_long_day: "kilometres in one day", bdd_long_trip: "kilometres in one trip",
  bdd_eco_driver: "average eco score", bdd_streak: "driving days in a row", bdd_explorer: "places visited",
  bdd_frost: "coldest drive in °C", bdd_full_cycles: "full battery cycles charged", bdd_low_tariff: "charges in the low tariff",
  bdd_co2: "kg of CO₂ avoided", bdd_anniversary: "days with the car",
  rlTitle: "Range lab", rlSpeed: "Speed", rlTemp: "Outside", rlClimate: "Climate", rlResult: "Estimated range",
  rlNow: "with {p} % now", rlFull: "from 100 %", rlNote: "An estimate tuned to your own consumption: air drag grows with the square of speed, and heating or cooling costs more the further it is from 20 °C.",
  rlNeedData: "The range lab needs your average consumption first.",
  fcTitle: "Capacity trend", fcStable: "stable", fcSub: "{x} % per year · {n} full charges", fc90: "90 % around {d}",
});
Object.assign(STRINGS.sl, {
  pageJourney: "Pot", sectionFailed: "Tega dela trenutno ni mogoče prikazati.", schedOnce: "enkrat", rlNowPlain: "s trenutno baterijo",
  weekTitle: "Tvoj običajni teden",
  outlookTitle: "Napoved", olTomorrow: "Jutri", olToday: "Danes",
  olLeaves: "Običajno odpelje ob {t}", olLeavesSub: "{p} % dni ({d}) · naučeno iz tvojih voženj",
  olNoDeparture: "Ni običajnega odhoda", olNoDepartureSub: "avto ta dan ({d}) običajno stoji",
  olNeeds: "Običajno do {km} km", olNeedsSub: "približno {e} kWh · {p} % z rezervo",
  olEnough: "Baterije je dovolj", olCharge: "Nocoj priključi", olChargeNow: "Napolni pred odhodom", olLow: "Baterija skoraj prazna", olPlugged: "Priključeno",
  olSocSub: "zdaj {soc} % · potrebno {need} %", olSocOnly: "zdaj {soc} %", olLimitLow: "zvišaj mejo polnjenja na {p} %",
  olLearning: "Še spoznavam tvoje navade", olLearningSub: "Napovedi se pokažejo po približno treh tednih voženj.",
  realRange: "Dejanski doseg", carSays: "avto kaže {x}", basisTemp: "tvoja poraba pri tej temperaturi",
  basisRecent: "tvoje zadnje vožnje", basisCloud: "tvoje 6-tedensko povprečje", nextDep: "Naslednji odhod", inTime: "čez {x}",
  realShort: "dejansko {x}",
  tlTitle: "Zadnjih 24 ur", tlEmpty: "V zadnjih 24 urah še ni zabeleženega ničesar.", tlDrove: "Prevoženo {km} km",
  tlDroveShort: "Vožnja", tlCharged: "Napolnjeno {p} %", tlChargedShort: "Polnjenje", tlChargingNow: "Polnjenje poteka",
  tlDrivingNow: "Vožnja poteka", tlUnlocked: "Odklenjeno", tlLocked: "Zaklenjeno", tlPlugged: "Kabel priključen", tlUnplugged: "Kabel odklopljen",
  rtTitle: "Pogoste poti", rtTrips: "{n} voženj", rtUsual: "običajno ob {t}", rtBest: "najboljše {x}",
  rtEmpty: "Poti se pokažejo, ko isto pot prevoziš trikrat.", placeN: "Kraj {n}",
  ecoScore: "Eko ocena", ecoShort: "eko {x}", exportCsv: "Izvozi CSV", exported: "Izvoženih voženj: {n}",
  replay: "Predvajaj", replayPause: "Ustavi",
  cvTitle: "Polnilna krivulja", cvNow: "to polnjenje", cvLast: "zadnje polnjenje", cvUsual: "običajno", cvPeak: "največ {x} kW",
  cvEmpty: "Krivulja se pokaže po naslednjem polnjenju.", slowTitle: "Polnjenje je počasnejše kot običajno",
  slowSub: "zdaj {now} kW · tukaj običajno {usual} kW",
  chTitle: "Zgodovina polnjenja", chMeta: "zadnjih {n} dni · oblak Leapmotor", chEmpty: "V oblaku še ni polnjenj.",
  chAt: "{p}", chSessions: "{n} polnjenj",
  swTitle: "Programska oprema avta", swUpToDate: "Posodobljeno", swUpdate: "Na voljo je posodobitev", swInstalled: "Nameščena {v}",
  swNew: "Različica {v} je pripravljena za namestitev v avtu", swSince: "od {d}", swNotes: "Kaj je novega",
  swOwnerOnly: "Oblak Leapmotor različico programske opreme pokaže samo lastnikovemu računu.",
  swUnknown: "Različica programske opreme še ni bila sporočena.", swSize: "prenos {x} MB",
  schedTitle: "Načrtovana klima", schedNext: "naslednjič {t}", schedNone: "V avtu ni nastavljenega urnika klime.",
  schedOff: "izklopljeno", schedDaily: "vsak dan", modeHeat: "gretje", modeCool: "hlajenje", modeFan: "ventilator",
  permTitle: "Ta račun sme", permShared: "deljen avto",
  ibTitle: "Sporočila", ibEmpty: "Ni sporočil iz avta.", ibUnread: "neprebranih: {n}",
  calTitle: "Leto voženj", calLess: "manj", calMore: "več", calTotal: "{km} km v {d} dneh",
  calNoData: "Koledar se zapolni, ko prispe dnevna zgodovina iz oblaka.", monthsTitle: "Zadnjih 12 mesecev",
  recTitle: "Skupaj in rekordi", recOdo: "Prevoženo", recEnergy: "Porabljena energija", recAvg: "Povprečje od začetka",
  recPerDay: "na dan", recEarth: "{x}× okoli Zemlje", recLongestDay: "Najdaljši dan", recLongestTrip: "Najdaljša vožnja",
  recBestTrip: "Najvarčnejša vožnja", recTopSpeed: "Najvišja hitrost", recStreak: "Najdaljši niz",
  recStreakDays: "{n} dni zapored", recBigCharge: "Največje polnjenje", recFastCharge: "Najhitrejše polnjenje",
  recColdest: "Najhladnejša vožnja", recYear: "Letos", recProjected: "na poti do {x} km", recBusiest: "Najbolj prevožen mesec",
  recNone: "Rekordi se pokažejo z vožnjami.",
  savTitle: "V primerjavi z bencinskim avtom", savFuel: "Neporabljeno gorivo", savMoney: "Prihranek", savCo2: "Prihranjen CO₂",
  savAssume: "v primerjavi s {l} l/100 km · elektrika {g} g CO₂/kWh",
  savSetPrice: "Za prikaz prihranka v nastavitvah integracije vnesi ceno goriva.", savLife: "od novega", savMonth: "ta mesec",
  bdTitle: "Dosežki", bdLevels: ["", "Bron", "Srebro", "Zlato"], bdNext: "naslednje: {x}", bdEarned: "{n} od {m}",
  bd_distance: "Razdalja", bd_long_day: "Dan na cesti", bd_long_trip: "Dolga pot", bd_eco_driver: "Varčen voznik",
  bd_streak: "V zagonu", bd_explorer: "Raziskovalec", bd_frost: "Zimski voznik", bd_full_cycles: "Cikli polnjenja",
  bd_low_tariff: "Nočna ptica", bd_co2: "Varuh zraka", bd_anniversary: "Skupaj",
  bdd_distance: "prevoženih kilometrov", bdd_long_day: "kilometrov v enem dnevu", bdd_long_trip: "kilometrov v eni vožnji",
  bdd_eco_driver: "povprečna eko ocena", bdd_streak: "dni vožnje zapored", bdd_explorer: "obiskanih krajev",
  bdd_frost: "najhladnejša vožnja v °C", bdd_full_cycles: "napolnjenih polnih ciklov", bdd_low_tariff: "polnjenj v nizki tarifi",
  bdd_co2: "kg prihranjenega CO₂", bdd_anniversary: "dni z avtom",
  rlTitle: "Laboratorij dosega", rlSpeed: "Hitrost", rlTemp: "Zunaj", rlClimate: "Klima", rlResult: "Ocenjeni doseg",
  rlNow: "s trenutnimi {p} %", rlFull: "s 100 %", rlNote: "Ocena, umerjena na tvojo porabo: zračni upor raste s kvadratom hitrosti, gretje in hlajenje pa staneta več, čim dlje je od 20 °C.",
  rlNeedData: "Laboratorij dosega najprej potrebuje tvojo povprečno porabo.",
  fcTitle: "Trend kapacitete", fcStable: "stabilno", fcSub: "{x} % na leto · {n} polnih polnjenj", fc90: "90 % okoli {d}",
});
Object.assign(STRINGS.de, {
  pageJourney: "Reise", sectionFailed: "Dieser Teil kann gerade nicht angezeigt werden.", schedOnce: "einmalig", rlNowPlain: "mit dem aktuellen Akkustand",
  weekTitle: "Deine übliche Woche",
  outlookTitle: "Ausblick", olTomorrow: "Morgen", olToday: "Heute",
  olLeaves: "Fährt meist um {t} los", olLeavesSub: "an {p} % der Tage ({d}) · aus deinen Fahrten gelernt",
  olNoDeparture: "Keine übliche Abfahrt", olNoDepartureSub: "das Auto steht an diesem Tag ({d}) meist",
  olNeeds: "Meist bis zu {km} km", olNeedsSub: "etwa {e} kWh · {p} % mit Reserve",
  olEnough: "Akku reicht", olCharge: "Heute Abend einstecken", olChargeNow: "Vor der Abfahrt laden", olLow: "Akku fast leer", olPlugged: "Eingesteckt",
  olSocSub: "jetzt {soc} % · nötig {need} %", olSocOnly: "jetzt {soc} %", olLimitLow: "Ladelimit auf {p} % erhöhen",
  olLearning: "Lerne noch deine Gewohnheiten", olLearningSub: "Vorhersagen erscheinen nach etwa drei Wochen Fahren.",
  realRange: "Reale Reichweite", carSays: "das Auto zeigt {x}", basisTemp: "dein Verbrauch bei dieser Temperatur",
  basisRecent: "deine letzten Fahrten", basisCloud: "dein 6-Wochen-Schnitt", nextDep: "Nächste Abfahrt", inTime: "in {x}",
  realShort: "real {x}",
  tlTitle: "Letzte 24 Stunden", tlEmpty: "In den letzten 24 Stunden wurde noch nichts aufgezeichnet.", tlDrove: "{km} km gefahren",
  tlDroveShort: "Fahrt", tlCharged: "{p} % geladen", tlChargedShort: "Geladen", tlChargingNow: "Lädt gerade",
  tlDrivingNow: "Fährt gerade", tlUnlocked: "Entriegelt", tlLocked: "Verriegelt", tlPlugged: "Eingesteckt", tlUnplugged: "Ausgesteckt",
  rtTitle: "Häufige Strecken", rtTrips: "{n} Fahrten", rtUsual: "meist um {t}", rtBest: "beste {x}",
  rtEmpty: "Strecken erscheinen, sobald du denselben Weg dreimal gefahren bist.", placeN: "Ort {n}",
  ecoScore: "Eco-Wertung", ecoShort: "Eco {x}", exportCsv: "CSV exportieren", exported: "{n} Fahrten exportiert",
  replay: "Abspielen", replayPause: "Pause",
  cvTitle: "Ladekurve", cvNow: "dieser Ladevorgang", cvLast: "letzter Ladevorgang", cvUsual: "üblich", cvPeak: "Spitze {x} kW",
  cvEmpty: "Die Kurve erscheint nach dem nächsten Ladevorgang.", slowTitle: "Lädt langsamer als üblich",
  slowSub: "jetzt {now} kW · hier üblich {usual} kW",
  chTitle: "Ladehistorie", chMeta: "letzte {n} Tage · Leapmotor-Cloud", chEmpty: "Noch keine Ladevorgänge in der Cloud.",
  chAt: "{p}", chSessions: "{n} Ladevorgänge",
  swTitle: "Fahrzeugsoftware", swUpToDate: "Aktuell", swUpdate: "Update verfügbar", swInstalled: "Installiert {v}",
  swNew: "Version {v} kann im Auto installiert werden", swSince: "seit {d}", swNotes: "Was ist neu",
  swOwnerOnly: "Die Leapmotor-Cloud nennt die Softwareversion nur dem Konto des Besitzers.",
  swUnknown: "Die Softwareversion wurde noch nicht gemeldet.", swSize: "{x} MB Download",
  schedTitle: "Geplante Klimatisierung", schedNext: "nächste {t}", schedNone: "Im Auto ist kein Klimazeitplan gesetzt.",
  schedOff: "aus", schedDaily: "täglich", modeHeat: "Heizen", modeCool: "Kühlen", modeFan: "Lüfter",
  permTitle: "Dieses Konto darf", permShared: "geteiltes Auto",
  ibTitle: "Nachrichten", ibEmpty: "Keine Nachrichten vom Auto.", ibUnread: "{n} ungelesen",
  calTitle: "Ein Jahr Fahren", calLess: "weniger", calMore: "mehr", calTotal: "{km} km an {d} Tagen",
  calNoData: "Der Kalender füllt sich, sobald der Tagesverlauf aus der Cloud eintrifft.", monthsTitle: "Letzte 12 Monate",
  recTitle: "Summen & Rekorde", recOdo: "Kilometerstand", recEnergy: "Verbrauchte Energie", recAvg: "Schnitt gesamt",
  recPerDay: "pro Tag", recEarth: "{x}× um die Erde", recLongestDay: "Längster Tag", recLongestTrip: "Längste Fahrt",
  recBestTrip: "Sparsamste Fahrt", recTopSpeed: "Höchstgeschwindigkeit", recStreak: "Längste Serie",
  recStreakDays: "{n} Tage in Folge", recBigCharge: "Größte Ladung", recFastCharge: "Schnellste Ladung",
  recColdest: "Kälteste Fahrt", recYear: "Dieses Jahr", recProjected: "auf Kurs zu {x} km", recBusiest: "Stärkster Monat",
  recNone: "Rekorde erscheinen mit dem Fahren.",
  savTitle: "Im Vergleich zu einem Benziner", savFuel: "Nicht verbrannter Kraftstoff", savMoney: "Gespart", savCo2: "CO₂ vermieden",
  savAssume: "verglichen mit {l} l/100 km · Strom mit {g} g CO₂/kWh",
  savSetPrice: "Kraftstoffpreis in den Optionen der Integration eintragen, um die Ersparnis zu sehen.", savLife: "seit neu", savMonth: "diesen Monat",
  bdTitle: "Erfolge", bdLevels: ["", "Bronze", "Silber", "Gold"], bdNext: "als Nächstes: {x}", bdEarned: "{n} von {m}",
  bd_distance: "Strecke", bd_long_day: "Roadtrip-Tag", bd_long_trip: "Langstrecke", bd_eco_driver: "Sparfuchs",
  bd_streak: "Im Lauf", bd_explorer: "Entdecker", bd_frost: "Frostfahrer", bd_full_cycles: "Ladezyklen",
  bd_low_tariff: "Nachteule", bd_co2: "CO₂-Sparer", bd_anniversary: "Gemeinsam",
  bdd_distance: "Kilometer auf dem Tacho", bdd_long_day: "Kilometer an einem Tag", bdd_long_trip: "Kilometer in einer Fahrt",
  bdd_eco_driver: "Eco-Wertung im Schnitt", bdd_streak: "Fahrtage in Folge", bdd_explorer: "besuchte Orte",
  bdd_frost: "kälteste Fahrt in °C", bdd_full_cycles: "geladene Vollzyklen", bdd_low_tariff: "Ladungen im Niedertarif",
  bdd_co2: "kg CO₂ vermieden", bdd_anniversary: "Tage mit dem Auto",
  rlTitle: "Reichweiten-Labor", rlSpeed: "Tempo", rlTemp: "Außen", rlClimate: "Klima", rlResult: "Geschätzte Reichweite",
  rlNow: "mit {p} % jetzt", rlFull: "ab 100 %", rlNote: "Eine Schätzung, abgestimmt auf deinen eigenen Verbrauch: Der Luftwiderstand wächst mit dem Quadrat des Tempos, Heizen und Kühlen kosten umso mehr, je weiter es von 20 °C entfernt ist.",
  rlNeedData: "Das Reichweiten-Labor braucht zuerst deinen Durchschnittsverbrauch.",
  fcTitle: "Kapazitätstrend", fcStable: "stabil", fcSub: "{x} % pro Jahr · {n} Vollladungen", fc90: "90 % etwa {d}",
});

/** What a shared account may do, in words (rights the cloud lists for the car). */
const RIGHT_LABELS = {
  en: { lock: "lock and unlock", find_car: "find the car", trunk: "trunk", sunroof: "sunroof", sunshade: "sunshade",
    climate: "climate", quick_climate: "quick heat and cool", send_destination: "send a destination",
    battery_preheat: "battery preheat", unlock_charger: "release the cable", start_stop_charging: "start and stop charging",
    sentry_mode: "sentry mode", windows: "windows", seat_heat: "seat heating", steering_wheel_heat: "steering wheel heating",
    charge_limit: "charge limit", prepare_car: "prepare the car", seat_ventilation: "seat ventilation",
    mirror_heat: "mirror heating", windshield_defrost: "defrost", healthy_charging: "healthy charging", speed_limit: "speed limit" },
  sl: { lock: "zaklepanje in odklepanje", find_car: "iskanje avta", trunk: "prtljažnik", sunroof: "strešno okno", sunshade: "senčnik",
    climate: "klima", quick_climate: "hitro gretje in hlajenje", send_destination: "pošiljanje cilja",
    battery_preheat: "gretje baterije", unlock_charger: "sprostitev kabla", start_stop_charging: "začetek in konec polnjenja",
    sentry_mode: "stražarski način", windows: "okna", seat_heat: "gretje sedežev", steering_wheel_heat: "gretje volana",
    charge_limit: "meja polnjenja", prepare_car: "priprava avta", seat_ventilation: "prezračevanje sedežev",
    mirror_heat: "gretje ogledal", windshield_defrost: "odmrzovanje", healthy_charging: "zdravo polnjenje", speed_limit: "omejitev hitrosti" },
  de: { lock: "ver- und entriegeln", find_car: "Auto finden", trunk: "Kofferraum", sunroof: "Schiebedach", sunshade: "Sonnenschutz",
    climate: "Klima", quick_climate: "schnell heizen und kühlen", send_destination: "Ziel senden",
    battery_preheat: "Akku vorheizen", unlock_charger: "Kabel freigeben", start_stop_charging: "Laden starten und stoppen",
    sentry_mode: "Wächtermodus", windows: "Fenster", seat_heat: "Sitzheizung", steering_wheel_heat: "Lenkradheizung",
    charge_limit: "Ladelimit", prepare_car: "Auto vorbereiten", seat_ventilation: "Sitzlüftung",
    mirror_heat: "Spiegelheizung", windshield_defrost: "Entfrosten", healthy_charging: "Schonladen", speed_limit: "Tempolimit" },
};

/** Localised maintenance item names (the bundled packs are English). */
const SERVICE_NAMES = {
  sl: {
    brake_fluid_replace: "Zavorna tekočina — menjava (DOT4)", brake_fluid_inspect: "Zavorna tekočina — pregled",
    brake_pads_inspect: "Zavorne ploščice — pregled", brake_discs_inspect: "Zavorni diski — pregled",
    brake_hoses_inspect: "Zavorne cevi in vodi — pregled", tire_rotation: "Menjava položaja pnevmatik",
    tire_inspect: "Pnevmatike — tlak, obraba, profil", tire_replace: "Pnevmatike — zamenjava",
    cabin_filter_replace: "Kabinski filter — menjava", cabin_filter_clean: "Kabinski filter — čiščenje",
    reducer_oil_replace: "Olje reduktorja — menjava", wiper_blades_replace: "Metlice brisalcev — menjava",
    wiper_blades_inspect: "Metlice brisalcev — pregled", washer_fluid_topup: "Tekočina za pranje stekel — dolivanje",
    aux_battery_12v_check: "12 V akumulator — pregled", coolant_inspect: "Hladilna tekočina — pregled",
    lights_horn_check: "Luči, hupa, pranje — preizkus", battery_pack_inspect: "Visokonapetostna baterija — pregled",
    engine_oil_replace: "Motorno olje in filter — menjava", engine_air_filter_replace: "Zračni filter motorja — menjava",
    spark_plugs_replace: "Svečke — pregled/menjava", fuel_filter_replace: "Filter goriva — menjava",
    hvac_system_check: "Klimatska naprava — tesnost in hrup", door_hinges_lube: "Tečaji vrat, pokrova, prtljažnika — mazanje",
    chassis_bolts_check: "Vijaki podvozja — pritezni moment", drive_motor_inspect: "Pogonski motor in krmilnik — pregled",
    charging_port_inspect: "Polnilni priključek — čiščenje in pregled", software_update_check: "Programska oprema — preverjanje posodobitev",
  },
  de: {
    brake_fluid_replace: "Bremsflüssigkeit — Wechsel (DOT4)", brake_fluid_inspect: "Bremsflüssigkeit — Prüfung",
    brake_pads_inspect: "Bremsbeläge — Prüfung", brake_discs_inspect: "Bremsscheiben — Prüfung",
    brake_hoses_inspect: "Bremsleitungen — Prüfung", tire_rotation: "Reifen tauschen (Achswechsel)",
    tire_inspect: "Reifen — Druck, Verschleiß, Profil", tire_replace: "Reifen — Ersatz",
    cabin_filter_replace: "Innenraumfilter — Wechsel", cabin_filter_clean: "Innenraumfilter — Reinigung",
    reducer_oil_replace: "Getriebeöl — Wechsel", wiper_blades_replace: "Wischerblätter — Wechsel",
    wiper_blades_inspect: "Wischerblätter — Prüfung", washer_fluid_topup: "Scheibenwaschwasser — auffüllen",
    aux_battery_12v_check: "12-V-Batterie — Prüfung", coolant_inspect: "Kühlmittel — Prüfung",
    lights_horn_check: "Licht, Hupe, Waschanlage — Funktionsprüfung", battery_pack_inspect: "Hochvoltbatterie — Prüfung",
    engine_oil_replace: "Motoröl und Filter — Wechsel", engine_air_filter_replace: "Motorluftfilter — Wechsel",
    spark_plugs_replace: "Zündkerzen — Prüfung/Wechsel", fuel_filter_replace: "Kraftstofffilter — Wechsel",
    hvac_system_check: "Klimaanlage — Dichtheit und Geräusche", door_hinges_lube: "Scharniere — reinigen und schmieren",
    chassis_bolts_check: "Fahrwerksschrauben — Drehmoment", drive_motor_inspect: "Antriebsmotor und Steuerung — Prüfung",
    charging_port_inspect: "Ladeanschluss — Reinigung und Prüfung", software_update_check: "Software — Update prüfen",
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
  lastTrip: ["sensor", "last_trip_distance_km", "last_trip_distance"],
  tripConsumption: ["sensor", "last_trip_consumption_kwh_100km", "last_trip_consumption"],
  todayDistance: ["sensor", "trips_today_distance_km", "distance_today"],
  monthDistance: ["sensor", "trips_month_distance_km", "distance_this_month"],
  lastSession: ["sensor", "last_charge_session_energy_kwh", "last_charging_session_energy"],
  lastSessionCost: ["sensor", "last_charge_session_cost", "last_charging_session_cost"],
  monthCost: ["sensor", "charging_cost_month", "charging_cost_this_month"],
  monthEnergy: ["sensor", "charged_energy_month_kwh", "charged_energy_this_month"],
  health: ["sensor", "battery_health_percent", "battery_health"],
  nextMaintenance: ["sensor", "next_maintenance", "next_maintenance"],
  maintenanceDue: ["binary_sensor", "maintenance_due", "maintenance_due"],
  attention: ["binary_sensor", "attention_needed", "attention_needed"],
  tireWarning: ["binary_sensor", "tire_pressure_warning", "tire_pressure_warning"],
  driveCost: ["sensor", "driving_cost_month", "driving_cost_this_month"],
  costPer100: ["sensor", "driving_cost_per_100km", "driving_cost_per_100_km"],
  drain: ["sensor", "parked_drain_kwh_day", "parked_battery_drain"],
  toLimit: ["sensor", "energy_to_charge_limit_kwh", "energy_to_charge_limit"],
  sentry: ["switch", "sentry_mode", "sentry_mode"],
  healthyCharging: ["switch", "healthy_charging", "healthy_charging"],
  startChargeBtn: ["button", "start_charging", "start_charging"],
  stopChargeBtn: ["button", "stop_charging", "stop_charging"],
  sunroofOpenBtn: ["button", "open_sunroof", "open_sunroof"],
  preheatBtn: ["button", "preheat_cabin", "preheat_cabin"],
  precoolBtn: ["button", "precool_cabin", "precool_cabin"],
  preconditionBtn: ["button", "precondition_cabin", "precondition_cabin"],
  sunroofCloseBtn: ["button", "close_sunroof", "close_sunroof"],
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
  speedLimit: ["sensor", "speed_limit_kmh", "speed_limit"],
  speedLimitOn: ["binary_sensor", "speed_limit_enabled", "speed_limit_active"],
  speeding: ["binary_sensor", "speeding", "speeding"],
  climateMode: ["sensor", "climate_mode", "climate_mode"],
  chargeLimitSet: ["number", "charge_limit_setting", "charge_limit_setting"],
  // Insights and the extra cloud data
  realRange: ["sensor", "real_range_km", "real_range"],
  nextDeparture: ["sensor", "next_departure", "next_departure"],
  nextDay: ["sensor", "next_day_distance_km", "next_day_distance"],
  chargeAdvice: ["binary_sensor", "charge_recommended", "charge_recommended"],
  ecoScore: ["sensor", "eco_score", "eco_score"],
  routes: ["sensor", "frequent_routes", "frequent_routes"],
  capacityTrend: ["sensor", "battery_capacity_trend", "battery_capacity_trend"],
  fuelSavings: ["sensor", "fuel_savings_month", "fuel_savings_this_month"],
  fuelSavingsTotal: ["sensor", "fuel_savings_total", "fuel_savings_total"],
  co2Total: ["sensor", "co2_saved_total", "co2_saved_total"],
  co2Month: ["sensor", "co2_saved_month", "co2_saved_this_month"],
  fuelAvoided: ["sensor", "fuel_avoided_total_l", "fuel_not_burned"],
  yearDistance: ["sensor", "distance_this_year", "distance_this_year"],
  achievements: ["sensor", "achievements", "achievements"],
  curve: ["sensor", "charging_curve", "charging_curve"],
  slowCharging: ["binary_sensor", "slow_charging", "slow_charging"],
  cloudCharging: ["sensor", "cloud_charging_sessions", "cloud_charging_sessions"],
  software: ["update", "vehicle_software", "software"],
  softwareVersion: ["sensor", "software_version", "software_version"],
  inbox: ["sensor", "unread_message_count", "unread_message_count"],
  nextSchedule: ["sensor", "next_scheduled_preconditioning", "next_scheduled_preconditioning"],
  permissions: ["sensor", "remote_permissions", "remote_permissions"],
  lifetimeConsumption: ["sensor", "lifetime_consumption_kwh_100km", "lifetime_average_consumption"],
  availableEnergy: ["sensor", "available_energy_kwh", "available_energy"],
};

const DOORS = [
  ["doorDriver", "driverDoor"], ["doorPassenger", "passengerDoor"],
  ["doorRearLeft", "rearLeftDoor"], ["doorRearRight", "rearRightDoor"],
];
const WINDOWS = ["winFL", "winFR", "winRL", "winRR", "skylight"];
const TIRES = [["tireFL", "FL"], ["tireFR", "FR"], ["tireRL", "RL"], ["tireRR", "RR"]];
/** Pages of the card: the first page holds the car, its status and the remote controls. */
const PAGES = [
  { id: "overview", label: "pageOverview", icon: "car", sections: ["hero", "outlook", "check", "timeline", "controls"] },
  { id: "trips", label: "pageTrips", icon: "route", sections: ["map", "trips", "week", "routes"] },
  { id: "charging", label: "pageCharging", icon: "bolt", sections: ["charging", "chart", "energy", "curve", "sessions"] },
  { id: "vehicle", label: "pageVehicle", icon: "wrench", sections: ["maintenance", "tires", "insights", "software", "inbox"] },
  { id: "journey", label: "pageJourney", icon: "trophy", sections: ["calendar", "records", "rangelab", "badges"] },
];
const ALL_SECTIONS = PAGES.flatMap((p) => p.sections);
/** Per-user theme and language; shown as the last tab, not one of the `sections`. */
const SETTINGS_PAGE = { id: "settings", label: "pageSettings", icon: "gear", sections: ["settings"] };
const PAGE_OF = Object.fromEntries([...PAGES, SETTINGS_PAGE].flatMap((p) => p.sections.map((s) => [s, p.id])));
const LANGS = [["en", "English"], ["sl", "Slovenščina"], ["de", "Deutsch"]];
const SCENES = ["auto", "day", "night"];
/** Key of the per-user preferences in Home Assistant's frontend user data (and the browser fallback). */
const PREFS_KEY = "leapmotor_card";
const OK_C = "#34d399";
const WARN_C = "#f6a823";
const BAD_C = "#fb7185";
const TRIPS_SHOWN = 8;
const TIRE_LOW_BAR = 1.9;
const STALE_MINUTES = 120;
/**
 * Looks of the Overview car panel: "classic" (the night or day sky scene),
 * "cluster" (driver display with gauges) and "console" (car app / centre screen).
 */
const LOOKS = ["classic", "cluster", "console"];
const LOOK_LABELS = {
  classic: "Classic (night or day sky)",
  cluster: "Driver display (gauges around the car)",
  console: "Car app (range, battery bar, round buttons)",
};
const GEARS = ["P", "R", "N", "D"];

/* ------------------------------------------------------------------ */
/* Icons (24px line icons, drawn for this card)                        */
/* ------------------------------------------------------------------ */

const ICONS = {
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
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
  heart: '<path d="M12 20s-7.5-4.6-7.5-10.3A4.2 4.2 0 0 1 12 7.1a4.2 4.2 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20Z"/>',
  wrench: '<path d="M14.5 6.5a4 4 0 0 0-5.3 5.3L4 17l3 3 5.2-5.2a4 4 0 0 0 5.3-5.3l-2.4 2.4-2.6-.6-.6-2.6 2.6-2.2Z"/>',
  spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
  cctv: '<path d="M3 7l12-3 2 6-12 3-2-6Z"/><path d="m17 10 3 1v4M5 13l1 4H3"/>',
  roof: '<path d="M3 15 7 8h10l4 7"/><path d="M8.5 11h7M3 15h18v3H3z"/>',
  route: '<circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="6" r="2.5"/><path d="M8.5 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.5"/>',
  fuel: '<path d="M4.5 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M3 21h13M4.5 10h10"/><path d="M14.5 8.5 18 11v6.5a1.5 1.5 0 0 0 3 0V8l-3-3"/>',
  sign: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="5"/>',
  trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0V4Z"/><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8.5 20.5h7M10 17h4"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  download: '<path d="M12 4v11M7.5 11 12 15.5 16.5 11M5 19.5h14"/>',
  play: '<path d="M8 5.5v13l10-6.5-10-6.5Z"/>',
  pause: '<path d="M8.5 5.5v13M15.5 5.5v13"/>',
  mail: '<rect x="3.5" y="5.5" width="17" height="13" rx="2.5"/><path d="m4.5 7.5 7.5 6 7.5-6"/>',
  chip: '<rect x="7" y="7" width="10" height="10" rx="2"/><path d="M10 3.5V7M14 3.5V7M10 17v3.5M14 17v3.5M3.5 10H7M3.5 14H7M17 10h3.5M17 14h3.5"/>',
  medal: '<circle cx="12" cy="14.5" r="5.5"/><path d="M9 9.8 6.5 3.5h4L12 7l1.5-3.5h4L15 9.8M12 12.2l.8 1.6 1.7.2-1.3 1.2.4 1.7-1.6-.9-1.6.9.4-1.7-1.3-1.2 1.7-.2.8-1.6Z"/>',
  flask: '<path d="M9.5 3.5h5M10.5 3.5v6L5 19a1.5 1.5 0 0 0 1.3 2.2h11.4A1.5 1.5 0 0 0 19 19l-5.5-9.5v-6"/><path d="M7.8 15h8.4"/>',
  co2: '<path d="M7 18.5a4.5 4.5 0 0 1-.5-8.97A6 6 0 0 1 18 9a4.5 4.5 0 0 1-.5 9.5H7Z"/><path d="M9.5 14.5c.6-1.6 2-2.5 3.5-2.5M11 16.5c1.5 0 3-1.2 3.4-3"/>',
  piggy: '<path d="M4.5 12.5c0-3.3 3.1-6 7-6 1.2 0 2.3.2 3.3.7l2.7-1.2-.3 2.9c1 .9 1.6 2 1.8 3.1h1.5v3h-2c-.5.8-1.2 1.5-2 2V19.5h-2.5v-1.2a9 9 0 0 1-3 0v1.2H8.5V17a5.6 5.6 0 0 1-4-4.5Z"/><path d="M15.5 11.5v.1"/>',
  calendarHeart: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/><path d="M12 17.5s-3-1.8-3-3.6a1.6 1.6 0 0 1 3-.8 1.6 1.6 0 0 1 3 .8c0 1.8-3 3.6-3 3.6Z"/>',
};

ICONS.gear = (() => {
  const pts = [];
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    for (const [da, r] of [[-0.3, 7.2], [-0.2, 9.6], [0.2, 9.6], [0.3, 7.2]]) {
      pts.push(`${(12 + r * Math.cos(a + da)).toFixed(2)} ${(12 + r * Math.sin(a + da)).toFixed(2)}`);
    }
  }
  return `<path d="M${pts.join("L")}Z"/><circle cx="12" cy="12" r="3"/>`;
})();

const icon = (name, cls = "") =>
  `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ` +
  `stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ""}</svg>`;

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */

const esc = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
/** A list attribute as a list of objects, whatever arrived. */
const objs = (value) => (Array.isArray(value) ? value.filter((item) => item && typeof item === "object") : []);
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
/* Trip map                                                             */
/* ------------------------------------------------------------------ */

const SPEED_SLOW = "#38bdf8";
const SPEED_MID = "#f6a823";
const SPEED_FAST = "#fb7185";

/** Route colour: against the speed alert / car limit when known, else fixed bands. */
function speedColor(kmh, limit) {
  if (kmh == null) return "#94a3b8";
  if (limit) return kmh > limit ? SPEED_FAST : kmh > limit * 0.9 ? SPEED_MID : SPEED_SLOW;
  return kmh > 90 ? SPEED_FAST : kmh > 50 ? SPEED_MID : SPEED_SLOW;
}

/**
 * Split a track ([time, lat, lon] points) into runs of one colour, using the
 * speed recorded at the end of each leg. Also returns the time spent above the
 * limit and the top recorded speed.
 */
function trackRuns(points, speeds, limit) {
  const runs = [];
  let aboveMs = 0;
  let maxKmh = null;
  for (const [, v] of speeds) if (maxKmh == null || v > maxKmh) maxKmh = v;
  for (let i = 1; i < points.length; i++) {
    const [t0, a0, o0] = points[i - 1];
    const [t1, a1, o1] = points[i];
    const v = speeds.length ? valueAt(speeds, t1) : null;
    if (limit && v != null && v > limit) aboveMs += Math.max(0, t1 - t0);
    const color = speedColor(v, limit);
    const last = runs[runs.length - 1];
    if (last && last.color === color) last.pts.push([a1, o1]);
    else runs.push({ color, pts: [[a0, o0], [a1, o1]] });
  }
  return { runs, aboveMs, maxKmh };
}

/** Map-less route drawing: used when Home Assistant's map is not available. */
function routeSvg(track, startLabel, endLabel, W = 640, H = 300, starry = false) {
  const PAD = 34;
  const pts = track.points;
  const midLat = pts.reduce((a, p) => a + p[1], 0) / pts.length;
  const kx = Math.cos((midLat * Math.PI) / 180);
  const xs = pts.map((p) => p[2] * kx), ys = pts.map((p) => -p[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const span = Math.max(maxX - minX, maxY - minY, 1e-4);
  const scale = Math.min((W - 2 * PAD) / Math.max(maxX - minX, span * 0.25), (H - 2 * PAD) / Math.max(maxY - minY, span * 0.25));
  const ox = (W - (maxX - minX) * scale) / 2, oy = (H - (maxY - minY) * scale) / 2;
  const xy = (lat, lon) => [f1(ox + (lon * kx - minX) * scale), f1(oy + (-lat - minY) * scale)];
  const line = (run) => run.pts.map(([la, lo], i) => `${i ? "L" : "M"}${xy(la, lo).join(" ")}`).join("");
  const r = rng(Math.round(Math.abs(pts[0][1] * 1e4)));
  const stars = starry
    ? Array.from({ length: 34 }, () => `<circle cx="${f1(r() * W)}" cy="${f1(r() * H)}" r="${f1(0.4 + r())}" fill="#c7d2fe" opacity="${f1(0.15 + r() * 0.35)}"/>`).join("")
    : "";
  const [sx, sy] = xy(pts[0][1], pts[0][2]);
  const [ex, ey] = xy(pts[pts.length - 1][1], pts[pts.length - 1][2]);
  const proj = esc(JSON.stringify({ kx, minX, minY, scale, ox, oy }));
  return `<svg class="routesvg" data-proj="${proj}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${esc(startLabel)} → ${esc(endLabel)}">
    <defs>
      <pattern id="lm-grid" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M32 0H0V32" fill="none" stroke="rgba(148,163,184,.1)"/></pattern>
      <filter id="lm-routeglow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#lm-grid)"/>${stars}
    ${track.runs.map((run) => `<path d="${line(run)}" fill="none" stroke="${run.color}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" filter="url(#lm-routeglow)"/>`).join("")}
    <circle cx="${sx}" cy="${sy}" r="7" fill="${SPEED_SLOW}" stroke="#e9eef8" stroke-width="2"/>
    <circle cx="${ex}" cy="${ey}" r="8" fill="${SPEED_MID}" stroke="#e9eef8" stroke-width="2"/>
    <text x="${sx}" y="${f1(sy - 14)}" text-anchor="middle">${esc(startLabel)}</text>
    <text x="${ex}" y="${f1(ey - 15)}" text-anchor="middle">${esc(endLabel)}</text>
  </svg>`;
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
/* Car picture: cut it to the car itself                               */
/* ------------------------------------------------------------------ */

/** Longest run of entries above zero as [start, end), or null. */
function longestRun(counts) {
  let best = null, start = -1;
  for (let i = 0; i <= counts.length; i++) {
    const on = i < counts.length && counts[i] > 0;
    if (on && start < 0) start = i;
    if (!on && start >= 0) {
      if (!best || i - start > best[1] - best[0]) best = [start, i];
      start = -1;
    }
  }
  return best;
}

/** How far the nearest other content is from a run, on each side. */
function runGaps(counts, [start, end]) {
  let before = start, after = counts.length - end;
  for (let i = start - 1; i >= 0; i--) if (counts[i] > 0) { before = start - 1 - i; break; }
  for (let i = end; i < counts.length; i++) if (counts[i] > 0) { after = i - end; break; }
  return [before, after];
}

/**
 * The official car picture has wide transparent margins and, on some models,
 * a hairline along its edge. This finds the car (the largest connected block
 * of non-transparent columns and rows), cuts the picture to it and notes
 * where the body begins at charge-port height, so the wallbox stands next to
 * the car and the charging cable ends on it.
 *
 * Resolves to { url, attach } where url is a cut copy (or null when the
 * picture already fits) and attach the cable end as fractions of the picture
 * (x from the left, y from the bottom). Resolves to null when the picture
 * cannot be read, e.g. a picture from another site.
 */
async function trimCarPicture(img, flip) {
  const W = img.naturalWidth, H = img.naturalHeight;
  if (!W || !H) return null;
  // A copy at most 640 px wide is plenty to find the car and quick to scan.
  const scale = Math.min(1, 640 / W);
  const w = Math.max(1, Math.round(W * scale)), h = Math.max(1, Math.round(H * scale));
  const probe = document.createElement("canvas");
  probe.width = w;
  probe.height = h;
  const ctx = probe.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h).data; // throws for a picture from another site
  const alpha = (x, y) => data[(y * w + x) * 4 + 3];
  let cols = new Uint32Array(w);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (alpha(x, y) > 40) cols[x]++;
  let cx = longestRun(cols);
  if (!cx) return null;
  const rows = new Uint32Array(h);
  for (let y = 0; y < h; y++) for (let x = cx[0]; x < cx[1]; x++) if (alpha(x, y) > 40) rows[y]++;
  const cy = longestRun(rows);
  if (!cy) return null;
  // A line across the picture has a pixel in every column: count the columns again inside the car's own rows.
  const inner = new Uint32Array(w);
  for (let y = cy[0]; y < cy[1]; y++) for (let x = 0; x < w; x++) if (alpha(x, y) > 40) inner[x]++;
  const ix = longestRun(inner);
  if (ix) {
    cols = inner;
    cx = ix;
  }

  // A little air around the car, never reaching into other content (the hairline).
  const pad = (counts, run, size) => {
    const [before, after] = runGaps(counts, run);
    const want = Math.round(size * 0.012);
    return [Math.max(0, run[0] - Math.min(want, Math.floor(before / 2))),
      Math.min(counts.length, run[1] + Math.min(want, Math.floor(after / 2)))];
  };
  const bx = pad(cols, cx, w), by = pad(rows, cy, h);
  const bw = bx[1] - bx[0], bh = by[1] - by[0];
  if (bw < 8 || bh < 8) return null;

  // Where the body begins at charge-port height (40 % up from the wheels).
  const PORT_HEIGHT = 0.4;
  const hits = [];
  const yMid = Math.round(cy[1] - (cy[1] - cy[0]) * PORT_HEIGHT);
  for (let y = Math.max(cy[0], yMid - 3); y <= Math.min(cy[1] - 1, yMid + 3); y++) {
    if (flip) {
      for (let x = cx[1] - 1; x >= cx[0]; x--) if (alpha(x, y) > 128) { hits.push(bx[1] - 1 - x); break; }
    } else {
      for (let x = cx[0]; x < cx[1]; x++) if (alpha(x, y) > 128) { hits.push(x - bx[0]); break; }
    }
  }
  hits.sort((a, b) => a - b);
  const attach = hits.length
    ? { x: clamp(hits[Math.floor(hits.length / 2)] / bw, 0, 0.6), y: clamp((by[1] - yMid) / bh, 0.15, 0.8) }
    : null;

  // Nothing to cut away: keep the picture as it is.
  if (bw >= w * 0.97 && bh >= h * 0.97) return { url: null, attach };
  const X = Math.floor(bx[0] / scale), Y = Math.floor(by[0] / scale);
  const CW = Math.min(W - X, Math.ceil(bw / scale)), CH = Math.min(H - Y, Math.ceil(bh / scale));
  const out = document.createElement("canvas");
  out.width = CW;
  out.height = CH;
  out.getContext("2d").drawImage(img, X, Y, CW, CH, 0, 0, CW, CH);
  const blob = await new Promise((resolve) => out.toBlob(resolve, "image/png"));
  return blob ? { url: URL.createObjectURL(blob), attach } : { url: null, attach };
}

/**
 * Round instrument gauge (240° sweep) as used in a driver display: track,
 * tick marks, the value arc and an optional marker (e.g. the charge limit).
 */
function gaugeSvg({ frac = 0, color = "#f6a823", mark = null, flow = false }) {
  const cx = 100, cy = 100, r = 78, a0 = 150, sweep = 240;
  const pt = (a, rr) => [cx + rr * Math.cos((a * Math.PI) / 180), cy + rr * Math.sin((a * Math.PI) / 180)];
  const arc = (from, to) => {
    const [x0, y0] = pt(from, r), [x1, y1] = pt(to, r);
    return `M${f1(x0)} ${f1(y0)}A${r} ${r} 0 ${to - from > 180 ? 1 : 0} 1 ${f1(x1)} ${f1(y1)}`;
  };
  const f = clamp(frac || 0, 0, 1);
  let ticks = "";
  for (let i = 0; i <= 24; i++) {
    const a = a0 + (sweep * i) / 24;
    const major = i % 6 === 0;
    const [x0, y0] = pt(a, 87), [x1, y1] = pt(a, major ? 97 : 92);
    ticks += `<path d="M${f1(x0)} ${f1(y0)}L${f1(x1)} ${f1(y1)}" class="tk${major ? " mj" : ""}${f > 0 && i / 24 <= f + 1e-6 ? " lit" : ""}"/>`;
  }
  const val = f > 0.004 ? `<path d="${arc(a0, a0 + sweep * f)}" class="gval${flow ? " flow" : ""}"/>` : "";
  let mk = "";
  if (mark != null && isFinite(mark)) {
    const a = a0 + sweep * clamp(mark, 0, 1);
    const [x0, y0] = pt(a, 68), [x1, y1] = pt(a, 88);
    mk = `<path d="M${f1(x0)} ${f1(y0)}L${f1(x1)} ${f1(y1)}" class="gmark"/>`;
  }
  return `<svg class="gsvg" viewBox="0 0 200 168" style="color:${color}" aria-hidden="true">` +
    `<path d="${arc(a0, a0 + sweep)}" class="gtrack"/>${ticks}${val}${mk}</svg>`;
}

/** Small picture of each theme for the settings page. */
function lookThumb(look) {
  const car = (x, y, s, fill) =>
    `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 13 1.5 8Q3 5 9 4L15 1.6Q23 0 31 1.2Q36 2 39.5 5.6L44 7.4Q48 8.6 48 11.5V13Z" fill="${fill}"/>` +
    `<circle cx="11" cy="13.5" r="3.6" fill="#05070b"/><circle cx="37" cy="13.5" r="3.6" fill="#05070b"/></g>`;
  const arc = (cx, cy, r, f, c) => {
    const p = (a) => `${f1(cx + r * Math.cos((a * Math.PI) / 180))} ${f1(cy + r * Math.sin((a * Math.PI) / 180))}`;
    const end = 150 + 240 * f;
    return `<path d="M${p(150)}A${r} ${r} 0 1 1 ${p(390)}" fill="none" stroke="rgba(148,163,184,.22)" stroke-width="3.5" stroke-linecap="round"/>` +
      `<path d="M${p(150)}A${r} ${r} 0 ${end - 150 > 180 ? 1 : 0} 1 ${p(end)}" fill="none" stroke="${c}" stroke-width="3.5" stroke-linecap="round"/>`;
  };
  let body;
  if (look === "classic") {
    body = `<defs><linearGradient id="lm-th-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#070d24"/><stop offset="1" stop-color="#1b2a60"/></linearGradient></defs>` +
      `<rect width="160" height="90" fill="url(#lm-th-sky)"/><circle cx="104" cy="0" r="12" fill="#e8ecf8"/>` +
      [[20, 8], [58, 14], [140, 10], [128, 30], [76, 6], [150, 44]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".9" fill="#fff" opacity=".8"/>`).join("") +
      `<path d="M0 62C40 52 80 56 120 54S150 50 160 52V90H0Z" fill="#121c43"/><path d="M0 74C50 68 110 70 160 68V90H0Z" fill="#0d1534"/>` +
      `<rect x="10" y="20" width="34" height="18" rx="3" fill="#f1f4fa"/><rect x="47" y="20" width="7" height="7" rx="1.5" fill="#f6a823"/>` +
      `<rect x="10" y="44" width="40" height="4" rx="2" fill="rgba(241,244,250,.55)"/>` + car(88, 52, 1.35, "#c9d1e0");
  } else if (look === "cluster") {
    body = `<rect width="160" height="90" fill="#0a0d14"/>` +
      [0, 1, 2, 3, 4, 5].map((i) => `<circle cx="${62 + i * 7}" cy="9" r="2" fill="${i === 0 ? "#34d399" : i === 4 ? "#38bdf8" : "rgba(148,163,184,.35)"}"/>`).join("") +
      arc(25, 44, 16, 0.72, "#f6a823") + arc(135, 44, 16, 0, "#38bdf8") +
      `<text x="135" y="48" text-anchor="middle" font-size="12" font-weight="700" fill="#f1f4fa" font-family="sans-serif">P</text>` +
      `<path d="M52 66H108" stroke="rgba(125,211,252,.4)" stroke-width=".8"/>` + car(57, 46, 0.95, "#c9d1e0") +
      `<rect x="8" y="74" width="144" height="10" rx="3" fill="rgba(0,0,0,.45)" stroke="rgba(148,163,184,.25)" stroke-width=".6"/>`;
  } else {
    body = `<rect width="160" height="90" fill="#121b33"/><ellipse cx="112" cy="58" rx="44" ry="20" fill="rgba(165,190,255,.16)"/>` +
      `<rect x="10" y="12" width="30" height="13" rx="2.5" fill="#f1f4fa"/><rect x="43" y="17" width="9" height="8" rx="2" fill="#f6a823"/>` +
      Array.from({ length: 10 }, (_, i) => `<rect x="${10 + i * 5}" y="31" width="4" height="7" rx="1" fill="${i < 7 ? "#fbbf24" : "rgba(148,163,184,.3)"}"/>`).join("") +
      `<rect x="10" y="44" width="20" height="6" rx="3" fill="rgba(255,255,255,.14)"/><rect x="33" y="44" width="22" height="6" rx="3" fill="rgba(52,211,153,.35)"/>` +
      car(80, 40, 1.45, "#c9d1e0") +
      [0, 1, 2, 3].map((i) => `<circle cx="${56 + i * 16}" cy="80" r="5" fill="rgba(255,255,255,.1)" stroke="rgba(148,163,184,.4)" stroke-width=".7"/>`).join("");
  }
  return `<svg class="thumb" viewBox="0 0 160 90" aria-hidden="true">${body}</svg>`;
}

/** Perspective floor under the car in the driver display. */
function floorSvg() {
  const W = 600, H = 150, vx = 300, vy = -170;
  let lines = "";
  for (let x = -1500; x <= 2100; x += 100) {
    const k = (0 - vy) / (H - vy);
    lines += `<path d="M${f1(vx + (x - vx) * k)} 0L${x} ${H}"/>`;
  }
  for (let i = 1; i <= 7; i++) {
    const y = f1(H * Math.pow(i / 7, 1.7));
    lines += `<path d="M0 ${y}H${W}"/>`;
  }
  return `<svg class="floor" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">
  <defs>
    <radialGradient id="lm-floorfade" cx="50%" cy="100%" r="62%">
      <stop offset="0" stop-color="#fff" stop-opacity="1"/><stop offset=".55" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="lm-horizon" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#38bdf8" stop-opacity="0"/><stop offset=".5" stop-color="#7dd3fc" stop-opacity=".75"/><stop offset="1" stop-color="#38bdf8" stop-opacity="0"/>
    </linearGradient>
    <mask id="lm-floormask"><rect width="${W}" height="${H}" fill="url(#lm-floorfade)"/></mask>
  </defs>
  <g class="grid" mask="url(#lm-floormask)">${lines}</g>
  <rect y="0" width="${W}" height="1.6" fill="url(#lm-horizon)"/>
</svg>`;
}

/* ------------------------------------------------------------------ */
/* Styles                                                               */
/* ------------------------------------------------------------------ */

const STYLE = `
:host{
  --lm-bg:#080d1c;--lm-panel:#0f1729;--lm-line:rgba(148,163,184,.13);--lm-line-2:rgba(148,163,184,.07);
  --lm-text:#f1f4fa;--lm-soft:#d3dae8;--lm-muted:#a9b3c7;--lm-dim:#8892a8;
  --lm-panel-a:rgba(21,30,51,.96);--lm-panel-b:rgba(13,20,36,.98);--lm-halo:#111b3a;
  --lm-amber:#f6a823;--lm-amber-2:#ffc461;--lm-green:#34d399;--lm-red:#fb7185;--lm-sky:#38bdf8;--lm-violet:#a78bfa;
  --lm-font:'LM Outfit','Outfit',ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;
  --lm-mono:'LM JetBrains Mono','JetBrains Mono',ui-monospace,'SF Mono',Menlo,Consolas,monospace;
  display:block;container-type:inline-size;container-name:lmcard;
  font-family:var(--lm-font);color:var(--lm-text);-webkit-font-smoothing:antialiased;
}
*{box-sizing:border-box}
:host{scroll-margin-top:var(--lm-tabs-top,0px)}
.tabs:not(.sticky){scroll-margin-top:64px}
button{font:inherit;color:inherit;cursor:pointer;border:0;background:none;padding:0}
.ic{width:18px;height:18px;flex:none}
.lm{display:grid;grid-template-columns:minmax(0,1fr);gap:14px}
.page{display:grid;grid-template-columns:minmax(0,1fr);gap:14px;min-width:0;align-items:start}
.page+.page{margin-top:10px}
.lm.tabbed .page+.page{margin-top:0}
.lm.backdrop{background:radial-gradient(1200px 500px at 20% -10%,var(--lm-halo) 0%,transparent 60%),var(--lm-bg);padding:14px;border-radius:26px}
/* Driver display: graphite surfaces. Car app: the navy surfaces of the original card. */
.lm.look-cluster{--lm-bg:#05070b;--lm-halo:#121826;--lm-panel-a:rgba(19,23,32,.97);--lm-panel-b:rgba(11,14,20,.98);--lm-line:rgba(148,163,184,.12)}
.panel{position:relative;min-width:0;overflow:hidden;border-radius:20px;padding:18px 20px;
  background:linear-gradient(180deg,var(--lm-panel-a),var(--lm-panel-b));
  border:1px solid var(--lm-line);box-shadow:inset 0 1px 0 rgba(255,255,255,.035),0 24px 48px -30px rgba(0,0,0,.7)}
.ptitle{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 0 16px;min-height:30px}
.ptitle h3{margin:0;display:flex;align-items:center;gap:10px;font-size:18px;font-weight:650;letter-spacing:-.005em;color:var(--lm-text);white-space:nowrap}
.ptitle h3 .ic{width:20px;height:20px;color:var(--lm-amber-2)}
.ptitle:has(.seg),.ptitle:has(.cchip),.ptitle:has(.hbtn){flex-wrap:wrap;row-gap:8px}
.ptitle .meta{font-size:13.5px;color:var(--lm-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}
.mono{font-family:var(--lm-mono);font-feature-settings:"zero" 1}
.dot{width:7px;height:7px;border-radius:50%;background:var(--c,var(--lm-amber));box-shadow:0 0 10px var(--c,var(--lm-amber));flex:none;display:inline-block}
.dot.pulse{animation:lm-pulse 1.8s ease-in-out infinite}
.clickable{cursor:pointer}
[hidden]{display:none!important}
.contents{display:contents}
.stripwrap{grid-area:strip;min-width:0}
.sub .ic{width:13px;height:13px;color:var(--lm-amber)}
.empty{color:var(--lm-muted);font-size:14px;line-height:1.5;padding:24px 4px;text-align:center}
/* ---------- tabs ---------- */
.tabs{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(0,1fr);gap:4px;padding:5px;border-radius:18px;z-index:6;
  background:rgba(13,20,38,.94);border:1px solid var(--lm-line);box-shadow:0 14px 30px -18px rgba(0,0,0,.8);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}
.tabs.sticky{position:sticky;top:var(--lm-tabs-top,0px)}
.tabs.has-menu{grid-template-columns:44px}
.tab.menu{color:var(--lm-text);padding:8px 0}
.tab.menu .ic{width:22px;height:22px}
.tab{position:relative;display:flex;align-items:center;justify-content:center;gap:9px;min-height:46px;padding:8px 10px;border-radius:13px;
  font-size:15px;font-weight:600;color:var(--lm-muted);transition:color .2s,background .2s;min-width:0}
.tab:hover{color:var(--lm-text);background:rgba(255,255,255,.04)}
.tab.on{color:var(--lm-amber-2);background:rgba(246,168,35,.14);box-shadow:inset 0 0 0 1px rgba(246,168,35,.45)}
.look-cluster .tabs{background:rgba(9,11,16,.94);border-radius:16px}
.look-cluster .tab{border-radius:11px}
.look-cluster .tab.on{color:var(--lm-text);background:rgba(255,255,255,.06);box-shadow:inset 0 -3px 0 var(--lm-amber)}
.look-cluster .tab.on .ic{color:var(--lm-amber-2)}
.tab .ti{position:relative;display:grid;place-items:center}
.tab .ic{width:20px;height:20px}
.tab .tlb{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
.tab .tb{position:absolute;top:-3px;right:-5px;width:9px;height:9px;border-radius:50%;background:var(--c);box-shadow:0 0 0 2px var(--lm-bg),0 0 10px var(--c)}
.tab .tb.pulse{animation:lm-pulse 1.6s ease-in-out infinite}
.lm.sticky .panel{scroll-margin-top:calc(var(--lm-tabs-top,0px) + 76px)}
.stat{padding:11px 13px;border-radius:13px;background:rgba(255,255,255,.035);border:1px solid var(--lm-line-2);min-width:0}
.stat small{display:block;font-size:13px;color:var(--lm-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.stat b{display:block;font-size:20px;font-weight:700;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;letter-spacing:-.01em}
.stat b span{font-size:13px;font-weight:500;color:var(--lm-muted);margin-left:3px;letter-spacing:0}
.stat em{display:block;font-style:normal;font-size:13px;color:var(--lm-muted);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(128px,1fr));gap:8px}
.subh{font-size:14px;font-weight:650;color:var(--lm-soft);margin:20px 0 10px 2px}

/* ---------- hero (shared frame of the driver display and car app looks) ---------- */
:where(.lm:not(.look-classic)) .hero{padding:0;display:flex;min-height:0}
:where(.lm:not(.look-classic)) .stage{position:absolute;inset:0;overflow:hidden;pointer-events:none}
:where(.lm:not(.look-classic)) .hero-ui{position:relative;z-index:2;flex:1;display:grid;min-width:0;padding:18px 22px 20px;gap:14px 20px;align-items:center}
:where(.lm:not(.look-classic)) .h-top{grid-area:top;display:flex;align-items:center;gap:10px 16px;min-width:0;flex-wrap:wrap}
:where(.lm:not(.look-classic)) .h-left{grid-area:left;min-width:0}
:where(.lm:not(.look-classic)) .h-right{grid-area:right;min-width:0}
:where(.lm:not(.look-classic)) .h-quick{grid-area:quick;min-width:0}
:where(.lm:not(.look-classic)) .h-quick:empty,:where(.lm:not(.look-classic)) .h-right:empty,:where(.lm:not(.look-classic)) .stripwrap:empty{display:none}
:where(.lm:not(.look-classic)) .idb{min-width:0;flex:1 1 180px}
:where(.lm:not(.look-classic)) .idb h2{margin:0;font-size:22px;line-height:1.15;font-weight:700;letter-spacing:-.01em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
:where(.lm:not(.look-classic)) .idb .sub{margin-top:4px;font-size:14px;line-height:1.4;color:var(--lm-muted)}
:where(.lm:not(.look-classic)) .idb .sub .ic{width:14px;height:14px;margin-right:5px;vertical-align:-2px;color:var(--lm-amber)}
:where(.lm:not(.look-classic)) .h-top .refresh{margin-left:auto;flex:none}
:where(.lm:not(.look-classic)) .carzone{grid-area:car;position:relative;min-width:0;min-height:170px;align-self:stretch;display:flex;align-items:flex-end;justify-content:center;padding:0 0 16px}
:where(.lm:not(.look-classic)) .car{position:relative;width:min(100%,520px);display:flex;align-items:flex-end;justify-content:center;z-index:1}
:where(.lm:not(.look-classic)) .car img{display:block;max-width:100%;max-height:220px;object-fit:contain;filter:drop-shadow(0 18px 14px rgba(0,0,0,.6))}
:where(.lm:not(.look-classic)) .car img.flip{transform:scaleX(-1)}
:where(.lm:not(.look-classic)) .car .carsvg{width:100%;height:auto;display:block}
:where(.lm:not(.look-classic)) .car.charging .carbox::after{content:"";position:absolute;left:0;right:0;bottom:-16px;height:66px;border-radius:50%;
  background:radial-gradient(closest-side,rgba(52,211,153,.8),rgba(52,211,153,.28) 62%,transparent);filter:blur(10px);animation:lm-pulse 2.4s ease-in-out infinite;z-index:-1}
:where(.lm:not(.look-classic)) .wallbox{position:absolute;left:-30px;bottom:8px;width:20px;height:66px;border-radius:7px;background:linear-gradient(180deg,#26324f,#141c33);
  border:1px solid rgba(148,163,184,.25);box-shadow:0 10px 20px rgba(0,0,0,.4)}
:where(.lm:not(.look-classic)) .wallbox i{position:absolute;left:50%;top:12px;width:6px;height:6px;margin-left:-3px;border-radius:50%;background:var(--c,#34d399);box-shadow:0 0 10px var(--c,#34d399)}
:where(.lm:not(.look-classic)) .cable{position:absolute;left:-22px;bottom:6%;width:calc(16% + 22px);height:52%;overflow:visible}
:where(.lm:not(.look-classic)) .cable path{fill:none;stroke:var(--c,#34d399);stroke-width:2.4;stroke-linecap:round;stroke-dasharray:5 7;animation:lm-flow 1.1s linear infinite;filter:drop-shadow(0 0 4px var(--c,#34d399))}
:where(.lm:not(.look-classic)) .cable.idle path{animation:none;stroke-dasharray:none;opacity:.7}
:where(.lm:not(.look-classic)) .btn-amber{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:8px 15px;border-radius:999px;font-size:13.5px;font-weight:600;
  color:var(--lm-amber-2);background:rgba(246,168,35,.13);border:1px solid rgba(246,168,35,.5);transition:background .2s,transform .2s}
:where(.lm:not(.look-classic)) .btn-amber:hover{background:rgba(246,168,35,.22)}
:where(.lm:not(.look-classic)) .btn-amber .ic{width:15px;height:15px}
:where(.lm:not(.look-classic)) .spin .ic{animation:lm-spin 1s linear infinite}
:where(.lm:not(.look-classic)) .strip{display:grid;min-width:0}
:where(.lm:not(.look-classic)) .cell{min-width:0;display:flex}
:where(.lm:not(.look-classic)) .cell .cx{min-width:0;display:flex;flex-direction:column;gap:5px}
:where(.lm:not(.look-classic)) .cell .l{font-size:13px;font-weight:600;line-height:1.2;color:var(--lm-muted);overflow-wrap:anywhere;hyphens:auto}
:where(.lm:not(.look-classic)) .cell .v{font-family:var(--lm-mono);font-size:18px;font-weight:600;line-height:1.1;white-space:nowrap;color:var(--lm-text)}
:where(.lm:not(.look-classic)) .cell .v small{font-size:12px;color:var(--lm-muted);font-weight:500;margin-left:4px}
:where(.lm:not(.look-classic)) .quick{display:flex;flex-wrap:wrap;justify-content:center;gap:8px}
:where(.lm:not(.look-classic)) .qbtn{position:relative;display:inline-flex;align-items:center;justify-content:center;gap:9px;cursor:pointer;font:600 14px var(--lm-font);color:var(--lm-text);transition:background .2s,border-color .2s}
:where(.lm:not(.look-classic)) .qbtn .qi{display:grid;place-items:center;flex:none}
:where(.lm:not(.look-classic)) .qbtn .ic{width:18px;height:18px;color:var(--c)}
:where(.lm:not(.look-classic)) .qbtn.busy{opacity:.55;pointer-events:none}

/* ---------- hero: driver display (look: cluster) ---------- */
.look-cluster .hero{background:radial-gradient(46% 60% at 50% 52%,rgba(56,189,248,.075),transparent 72%),radial-gradient(120% 80% at 50% -12%,#161d2b 0%,transparent 62%),linear-gradient(180deg,#0b0e15,#05070b)}
.look-cluster .hero.day{background:radial-gradient(46% 60% at 50% 52%,rgba(125,211,252,.13),transparent 72%),radial-gradient(120% 80% at 50% -12%,#2a3650 0%,transparent 62%),linear-gradient(180deg,#1a2233,#0e131d)}
.look-cluster .hero-ui{grid-template-columns:minmax(150px,196px) minmax(0,1fr) minmax(150px,196px);grid-template-areas:"top top top" "left car right" "quick quick quick" "strip strip strip"}
.tells{display:flex;align-items:center;gap:2px;padding:4px 6px;border-radius:13px;background:rgba(0,0,0,.38);border:1px solid rgba(148,163,184,.12);box-shadow:inset 0 1px 0 rgba(255,255,255,.03)}
.tell{position:relative;width:34px;height:32px;display:grid;place-items:center;border-radius:9px;color:rgba(148,163,184,.3)}
.tell:hover{background:rgba(255,255,255,.06)}
.tell .ic{width:20px;height:20px}
.tell.on{color:var(--c);filter:drop-shadow(0 0 5px color-mix(in srgb,var(--c) 75%,transparent))}
.tell.pulse .ic{animation:lm-pulse 1.6s ease-in-out infinite}
.upd{font-size:13.5px;color:var(--lm-muted);white-space:nowrap}
.look-cluster .idb{flex:0 1 auto}
.look-cluster .tells{margin:0 auto}
.look-cluster .h-top .refresh{margin-left:0}
.gauge{position:relative;width:100%;max-width:196px;margin:0 auto;aspect-ratio:200/168}
.gsvg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.gtrack{fill:none;stroke:rgba(148,163,184,.13);stroke-width:8;stroke-linecap:round}
.gval{fill:none;stroke:currentColor;stroke-width:8;stroke-linecap:round;filter:drop-shadow(0 0 5px currentColor)}
.gval.flow{animation:lm-pulse 2.2s ease-in-out infinite}
.tk{stroke:rgba(148,163,184,.26);stroke-width:1.4}
.tk.mj{stroke:rgba(203,213,225,.55);stroke-width:2.2}
.tk.lit{stroke:currentColor;opacity:.85}
.gmark{stroke:#f8fafc;stroke-width:3.2;stroke-linecap:round}
.gin{position:absolute;left:0;right:0;top:36%;display:flex;flex-direction:column;align-items:center;text-align:center}
.gin .gv{font-size:40px;font-weight:700;line-height:1;letter-spacing:-.02em;font-variant-numeric:tabular-nums;white-space:nowrap}
.gin .gv small{font-size:17px;font-weight:600;color:var(--c);margin-left:3px;letter-spacing:0}
.gin .gs{margin-top:8px;font-size:15px;font-weight:600;color:var(--lm-soft);white-space:nowrap}
.gbot{position:absolute;left:0;right:0;bottom:0;display:flex;justify-content:center;align-items:center;gap:10px}
.glab{margin-top:8px;text-align:center;font-size:13.5px;font-weight:600;color:var(--lm-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.glab b{color:var(--lm-text);font-weight:650}
.prnd{display:inline-flex;gap:7px;font:700 14px/1 var(--lm-mono);color:rgba(148,163,184,.38)}
.prnd .on{color:#f8fafc;text-shadow:0 0 10px rgba(255,255,255,.5)}
.lsign{display:grid;place-items:center;width:34px;height:34px;border-radius:50%;background:#f8fafc;border:4px solid #e11d48;color:#0b0f17;font:800 12.5px/1 var(--lm-font);letter-spacing:-.03em;box-shadow:0 2px 10px rgba(0,0,0,.45)}
.lsign.over{animation:lm-pulse 1.1s ease-in-out infinite}
.floor{position:absolute;left:-8%;width:116%;bottom:0;height:60%;pointer-events:none}
.floor .grid path{fill:none;stroke:rgba(125,211,252,.3);stroke-width:1;vector-effect:non-scaling-stroke}
.hero.day .floor .grid path{stroke:rgba(186,230,253,.36)}
.look-cluster .fxbatt,.look-console .fxbatt{display:none}
.look-cluster .car.plugged{margin-left:30px}
.look-cluster .car::before{content:"";position:absolute;left:6%;right:6%;bottom:-10px;height:30px;border-radius:50%;background:radial-gradient(closest-side,rgba(125,211,252,.22),transparent);filter:blur(4px);z-index:-1}
.look-cluster .qbtn{min-height:44px;padding:8px 16px 8px 14px;border-radius:12px;
  background:linear-gradient(180deg,rgba(255,255,255,.075),rgba(255,255,255,.025));border:1px solid rgba(148,163,184,.18);box-shadow:inset 0 1px 0 rgba(255,255,255,.06),0 6px 14px -8px rgba(0,0,0,.8)}
.look-cluster .qbtn::after{content:"";position:absolute;left:32%;right:32%;top:-1px;height:2px;border-radius:2px}
.look-cluster .qbtn.on::after{background:var(--c);box-shadow:0 0 8px var(--c)}
.look-cluster .qbtn:hover{border-color:var(--c);background:linear-gradient(180deg,rgba(255,255,255,.1),rgba(255,255,255,.04))}
.look-cluster .qbtn.armed{border-color:var(--lm-amber);box-shadow:0 0 0 3px rgba(246,168,35,.18);animation:lm-armed 1s ease-in-out infinite}
.look-cluster .strip{grid-template-columns:repeat(auto-fit,minmax(118px,1fr));border-radius:14px;overflow:hidden;background:rgba(0,0,0,.34);border:1px solid rgba(148,163,184,.13)}
.look-cluster .cell{padding:11px 15px 12px;box-shadow:-1px 0 0 rgba(148,163,184,.11),0 -1px 0 rgba(148,163,184,.11)}
.look-cluster .cell .ci{display:none}

/* ---------- hero: car app / centre screen (look: console) ---------- */
.look-console .hero{background:radial-gradient(46% 64% at 68% 50%,rgba(165,190,255,.15),transparent 72%),linear-gradient(180deg,#131c35,#0a1124)}
.look-console .hero.day{background:radial-gradient(46% 64% at 68% 50%,rgba(205,222,255,.22),transparent 72%),linear-gradient(180deg,#22314f,#131c34)}
.look-console .hero-ui{grid-template-columns:minmax(230px,.82fr) minmax(0,1.45fr);grid-template-areas:"top top" "left car" "quick quick" "strip strip"}
.look-console .h-top .upd{display:none}
.rbox{display:flex;flex-direction:column;gap:12px;min-width:0}
.rbox .lbl{font-size:14px;font-weight:600;color:var(--lm-muted)}
.rng{display:flex;align-items:baseline;gap:7px;margin-top:-6px;font-size:66px;font-weight:700;line-height:1;letter-spacing:-.035em;font-variant-numeric:tabular-nums;white-space:nowrap}
.rng small{font-size:24px;font-weight:600;color:var(--lm-amber);letter-spacing:0}
.batt{display:flex;align-items:center;gap:12px;min-width:0}
.bwrap{position:relative;flex:1;min-width:0;max-width:240px;padding-right:7px}
.bwrap::after{content:"";position:absolute;right:0;top:50%;width:5px;height:11px;margin-top:-5.5px;border-radius:0 3px 3px 0;background:rgba(148,163,184,.4)}
.bseg{position:relative;height:24px;border-radius:6px;background:rgba(148,163,184,.17);overflow:hidden;
  -webkit-mask:repeating-linear-gradient(90deg,#000 0 calc(10% - 3px),transparent calc(10% - 3px) 10%);mask:repeating-linear-gradient(90deg,#000 0 calc(10% - 3px),transparent calc(10% - 3px) 10%)}
.bseg i{position:absolute;left:0;top:0;bottom:0;background:linear-gradient(90deg,#f59e0b,#fcd34d)}
.bseg i.on{background:linear-gradient(90deg,#10b981,#6ee7b7,#10b981);background-size:200% 100%;animation:lm-flowbg 2s linear infinite}
.bseg i.low{background:linear-gradient(90deg,#e11d48,#fb7185)}
.blim{position:absolute;top:-5px;bottom:-5px;width:3px;margin-left:-1.5px;background:#f8fafc;border-radius:2px;box-shadow:0 0 0 2px rgba(10,17,36,.85)}
.batt b{font-size:22px;font-weight:700;white-space:nowrap;font-variant-numeric:tabular-nums}
.batt b small{font-size:15px;color:var(--lm-muted);font-weight:600;margin-left:2px}
.bnote{font-size:13.5px;color:var(--lm-muted);margin-top:-4px}
.bnote b{color:var(--lm-text);font-weight:600}
.schips{display:flex;flex-wrap:wrap;gap:8px;margin-top:2px}
.schip{display:inline-flex;align-items:center;gap:7px;padding:7px 12px;border-radius:999px;font-size:13.5px;font-weight:600;white-space:nowrap;
  background:rgba(255,255,255,.06);border:1px solid rgba(148,163,184,.16);color:var(--lm-text)}
.schip .ic{width:15px;height:15px;color:var(--c,var(--lm-amber))}
.schip.hot{border-color:color-mix(in srgb,var(--c) 55%,transparent);background:color-mix(in srgb,var(--c) 12%,transparent)}
.look-console .carzone{min-height:210px;padding:0 0 34px 40px}
.look-console .carzone::before{content:"";position:absolute;left:2%;right:2%;bottom:10px;height:40%;border-radius:50%;background:radial-gradient(closest-side,rgba(185,205,255,.17),transparent);pointer-events:none}
.look-console .car img,.look-console .car .carsvg{-webkit-box-reflect:below -2px linear-gradient(transparent 80%,rgba(255,255,255,.13))}
.tpres{position:absolute;top:calc(100% + 10px);transform:translateX(-50%);display:inline-flex;gap:6px;align-items:baseline;padding:3px 10px;border-radius:999px;line-height:1.35;
  background:rgba(9,15,33,.8);border:1px solid rgba(148,163,184,.22);font:600 13px var(--lm-mono);color:var(--lm-text);white-space:nowrap;z-index:2;cursor:pointer}
.tpres small{font:500 11.5px var(--lm-font);color:var(--lm-muted)}
.tpres .low{color:#fda4af}
.tpres.bad{border-color:rgba(251,113,133,.65);background:rgba(60,12,24,.82)}
.look-console .qbtn{flex-direction:column;gap:8px;width:96px;min-height:0;padding:0;background:none;border:0;font-size:13.5px;color:var(--lm-soft);text-align:center;line-height:1.25}
.look-console .qbtn .qi{width:60px;height:60px;border-radius:50%;background:rgba(255,255,255,.07);border:1px solid rgba(148,163,184,.22);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.07),0 10px 20px -12px rgba(0,0,0,.8);transition:background .2s,border-color .2s}
.look-console .qbtn .ic{width:24px;height:24px}
.look-console .qbtn:hover .qi{border-color:var(--c);background:rgba(255,255,255,.1)}
.look-console .qbtn.on .qi{border-color:var(--c);background:color-mix(in srgb,var(--c) 18%,transparent)}
.look-console .qbtn.armed .qi{border-color:var(--lm-amber);box-shadow:0 0 0 4px rgba(246,168,35,.2);animation:lm-armed 1s ease-in-out infinite}
.look-console .qbtn.armed .ql{color:var(--lm-amber-2)}
.look-console .strip{grid-template-columns:repeat(auto-fit,minmax(156px,1fr));gap:8px}
.look-console .cell{align-items:center;gap:11px;padding:10px 12px;border-radius:14px;background:rgba(255,255,255,.045);border:1px solid rgba(148,163,184,.12)}
.look-console .cell .ci{width:36px;height:36px;border-radius:11px;display:grid;place-items:center;flex:none;color:var(--lm-amber-2);background:rgba(246,168,35,.12)}
.look-console .cell .ci .ic{width:18px;height:18px}
.look-console .cell .v{order:-1;font-family:var(--lm-font);font-size:18px;font-weight:700}
.look-console .cell .l{font-weight:500}

/* ---------- hero: night sky (look: classic, the original card) ---------- */
:where(.look-classic) .hero{padding:0;min-height:470px;display:flex;background:#0b1430}
:where(.look-classic) .scene{position:absolute;inset:0;overflow:hidden}
:where(.look-classic) .scene svg.sky{position:absolute;inset:0;width:100%;height:100%;display:block}
:where(.look-classic) .hero-ui{position:relative;z-index:2;flex:1;display:grid;min-width:0;
  grid-template-columns:minmax(0,1fr) minmax(0,1.05fr);grid-template-rows:1fr auto;
  grid-template-areas:"info car" "strip strip";padding:22px 24px 18px;column-gap:18px}
:where(.look-classic) .info{grid-area:info;min-width:0}
:where(.look-classic) .eyebrow{display:flex;align-items:center;gap:8px;font-size:11px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:var(--lm-soft)}
:where(.look-classic) .name{margin:8px 0 2px;font-size:27px;line-height:1.1;font-weight:700;letter-spacing:-.01em;text-shadow:0 2px 18px rgba(0,0,0,.4)}
:where(.look-classic) .sub{font-size:14px;color:#c0c9dc;display:flex;align-items:center;gap:6px;flex-wrap:wrap}
:where(.look-classic) .big{display:flex;align-items:flex-start;margin:16px 0 6px;font-weight:700;font-size:98px;line-height:.86;letter-spacing:-.045em;text-shadow:0 6px 30px rgba(0,0,0,.35)}
:where(.look-classic) .big .u{font-size:30px;line-height:1;font-weight:500;color:var(--lm-amber);margin:8px 0 0 6px;letter-spacing:0}
:where(.look-classic) .state{display:flex;align-items:center;gap:9px;font-size:16px;font-weight:600;margin-top:4px}
:where(.look-classic) .state .ic{width:17px;height:17px;color:var(--lm-amber-2)}
:where(.look-classic) .metaline{display:flex;gap:6px 14px;flex-wrap:wrap;font-size:13.5px;color:#b3bdd2;margin-top:10px}
:where(.look-classic) .metaline b{color:var(--lm-text);font-weight:600}
:where(.look-classic) .metaline .ic{width:12px;height:12px;vertical-align:-1px}
:where(.look-classic) .carzone{grid-area:car;position:relative;min-height:150px;display:flex;align-items:flex-end;justify-content:center;padding-bottom:12px}
:where(.look-classic) .car{position:relative;width:min(100%,540px);display:flex;align-items:flex-end;justify-content:center}
:where(.look-classic) .car img{display:block;max-width:100%;max-height:230px;object-fit:contain;filter:drop-shadow(0 20px 16px rgba(0,0,0,.55)) brightness(.94)}
:where(.look-classic) .car img.flip{transform:scaleX(-1)}
:where(.look-classic) .car .carsvg{width:100%;height:auto;display:block}
:where(.look-classic) .car.charging .carbox::after{content:"";position:absolute;left:0;right:0;bottom:-16px;height:66px;border-radius:50%;
  background:radial-gradient(closest-side,rgba(52,211,153,.8),rgba(52,211,153,.28) 62%,transparent);filter:blur(10px);animation:lm-pulse 2.4s ease-in-out infinite;z-index:-1}
:where(.look-classic) .wallbox{position:absolute;left:-30px;bottom:8px;width:20px;height:66px;border-radius:7px;background:linear-gradient(180deg,#26324f,#141c33);
  border:1px solid rgba(148,163,184,.25);box-shadow:0 10px 20px rgba(0,0,0,.4)}
:where(.look-classic) .wallbox i{position:absolute;left:50%;top:12px;width:6px;height:6px;margin-left:-3px;border-radius:50%;background:var(--c,#34d399);box-shadow:0 0 10px var(--c,#34d399)}
:where(.look-classic) .cable{position:absolute;left:-22px;bottom:6%;width:calc(16% + 22px);height:52%;overflow:visible}
:where(.look-classic) .cable path{fill:none;stroke:var(--c,#34d399);stroke-width:2.4;stroke-linecap:round;stroke-dasharray:5 7;animation:lm-flow 1.1s linear infinite;filter:drop-shadow(0 0 4px var(--c,#34d399))}
:where(.look-classic) .cable.idle path{animation:none;stroke-dasharray:none;opacity:.7}
:where(.look-classic) .chip{position:absolute;z-index:3;display:inline-flex;align-items:center;gap:8px;padding:8px 14px;border-radius:999px;
  background:rgba(9,15,33,.62);border:1px solid rgba(148,163,184,.17);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);
  font-size:13.5px;font-weight:600;white-space:nowrap;box-shadow:0 10px 24px -12px rgba(0,0,0,.6)}
:where(.look-classic) .chip .ic{width:13px;height:13px;color:var(--lm-amber)}
:where(.look-classic) .chip.a{top:22px;left:36%}
:where(.look-classic) .chip.b{top:70px;right:22px}
:where(.look-classic) .chip.c{top:44%;left:52%}
:where(.look-classic) .btn-amber{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:8px 15px;border-radius:999px;font-size:12.5px;font-weight:600;
  color:var(--lm-amber-2);background:rgba(246,168,35,.13);border:1px solid rgba(246,168,35,.5);transition:background .2s,transform .2s}
:where(.look-classic) .btn-amber:hover{background:rgba(246,168,35,.22)}
:where(.look-classic) .btn-amber .ic{width:14px;height:14px}
:where(.look-classic) .hero .refresh{position:absolute;z-index:3;top:20px;right:22px;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}
:where(.look-classic) .spin .ic{animation:lm-spin 1s linear infinite}
:where(.look-classic) .strip{grid-area:strip;display:grid;grid-template-columns:repeat(auto-fit,minmax(104px,1fr));gap:12px 8px;padding:13px 16px;border-radius:15px;
  background:rgba(8,13,29,.58);border:1px solid rgba(148,163,184,.15);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}
:where(.look-classic) .cell{min-width:0;display:flex;flex-direction:column;justify-content:space-between}
:where(.look-classic) .cell .l{font-size:11px;font-weight:600;letter-spacing:.14em;line-height:1.25;text-transform:uppercase;color:var(--lm-muted);overflow-wrap:anywhere;hyphens:auto}
:where(.look-classic) .cell .v{font-family:var(--lm-mono);font-size:16.5px;font-weight:600;margin-top:6px;white-space:nowrap}
:where(.look-classic) .cell .v small{font-size:11.5px;color:var(--lm-muted);font-weight:500;margin-left:3px}
:where(.look-classic) .quick{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}
:where(.look-classic) .qbtn{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:40px;padding:8px 14px;border-radius:999px;font:600 13.5px var(--lm-font);color:var(--lm-text);
  background:rgba(9,15,33,.55);border:1px solid rgba(148,163,184,.22);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);cursor:pointer;transition:background .2s,border-color .2s}
:where(.look-classic) .qbtn .ic{width:16px;height:16px;color:var(--c)}
:where(.look-classic) .qbtn:hover{background:rgba(255,255,255,.07);border-color:var(--c)}
:where(.look-classic) .qbtn.on{border-color:var(--c)}
:where(.look-classic) .qbtn.armed{border-color:var(--lm-amber);box-shadow:0 0 0 3px rgba(246,168,35,.18);animation:lm-armed 1s ease-in-out infinite}
:where(.look-classic) .qbtn.busy{opacity:.55;pointer-events:none}

/* ---------- vehicle check ---------- */
.summary{display:flex;align-items:center;gap:14px;padding:14px 16px;border-radius:16px;margin-bottom:12px;
  background:linear-gradient(135deg,rgba(52,211,153,.16),rgba(52,211,153,.04));border:1px solid rgba(52,211,153,.4)}
.summary.warn{background:linear-gradient(135deg,rgba(246,168,35,.18),rgba(246,168,35,.04));border-color:rgba(246,168,35,.5)}
.summary .sq{width:42px;height:42px;border-radius:12px;display:grid;place-items:center;flex:none;background:rgba(52,211,153,.2);color:var(--lm-green)}
.summary .sq .ic{width:22px;height:22px}
.summary.warn .sq{background:rgba(246,168,35,.22);color:var(--lm-amber-2)}
.summary b{display:block;font-size:18px;font-weight:700}
.summary span{display:block;font-size:13.5px;color:var(--lm-soft);margin-top:3px;line-height:1.4}
.ctiles{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
.ctile{display:flex;align-items:center;gap:11px;padding:12px;border-radius:14px;min-width:0;
  background:rgba(255,255,255,.03);border:1px solid var(--lm-line-2);transition:background .2s}
.ctile:hover{background:rgba(255,255,255,.055)}
.ctile .sq{width:36px;height:36px;border-radius:11px;display:grid;place-items:center;flex:none;color:var(--c);background:color-mix(in srgb,var(--c) 16%,transparent)}
.ctile .sq .ic{width:19px;height:19px}
.ctile div{min-width:0}
.ctile b{display:block;font-size:15px;font-weight:600;line-height:1.25}
.ctile small{display:block;font-size:13px;color:var(--lm-muted);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ctile.warn{border-color:rgba(246,168,35,.5);background:rgba(246,168,35,.07)}
.ctile.bad{border-color:rgba(251,113,133,.5);background:rgba(251,113,133,.07)}
.pill{font-size:11.5px;font-weight:700;letter-spacing:.08em;padding:4px 9px;border-radius:7px;color:var(--lm-green);background:rgba(52,211,153,.12);white-space:nowrap}
.pill.warn{color:var(--lm-amber-2);background:rgba(246,168,35,.15)}
.pill.bad{color:var(--lm-red);background:rgba(251,113,133,.14)}
.foot{font-size:13px;color:var(--lm-dim);margin:12px 2px 0;line-height:1.45}
.btns{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.btn{display:flex;align-items:center;justify-content:center;gap:8px;min-height:46px;padding:11px 14px;border-radius:13px;font-size:14.5px;font-weight:600;
  background:rgba(255,255,255,.04);border:1px solid var(--lm-line);transition:background .2s,border-color .2s}
.btn:hover{background:rgba(255,255,255,.08)}
.btn .ic{width:17px;height:17px}
.btn.primary{color:var(--lm-amber-2);background:rgba(246,168,35,.12);border-color:rgba(246,168,35,.5)}
.btn.primary:hover{background:rgba(246,168,35,.2)}
.btn.armed,.tile.armed{border-color:var(--lm-amber)!important;box-shadow:0 0 0 3px rgba(246,168,35,.18);animation:lm-armed 1s ease-in-out infinite}

/* ---------- 24 h chart ---------- */
.seg{display:inline-flex;padding:3px;border-radius:12px;background:rgba(255,255,255,.04);border:1px solid var(--lm-line-2);flex:none}
.seg button{padding:7px 12px;border-radius:9px;font-size:13px;font-weight:600;color:var(--lm-muted);transition:color .2s,background .2s}
.seg button.on{color:var(--lm-amber-2);background:rgba(246,168,35,.16);box-shadow:inset 0 0 0 1px rgba(246,168,35,.4)}
.note{display:flex;gap:9px;align-items:flex-start;font-size:13.5px;color:var(--lm-soft);margin:2px 0 10px;line-height:1.5}
.note .dot{margin-top:7px}
.chart,.week{display:flex;flex-direction:column}
.now24{display:flex;align-items:center;gap:10px 14px;flex-wrap:wrap;margin:0 0 6px}
.now24 .cur{font-size:36px;font-weight:700;line-height:1;letter-spacing:-.02em}
.now24 .cur span{font-size:17px;font-weight:600;color:var(--lm-amber);margin-left:3px}
.delta{display:inline-flex;align-items:center;font-size:13.5px;font-weight:600;padding:4px 10px;border-radius:999px;color:var(--lm-soft);background:rgba(148,163,184,.12)}
.delta.up{color:#6ee7b7;background:rgba(52,211,153,.14)}
.delta.down{color:var(--lm-amber-2);background:rgba(246,168,35,.14)}
.sum24{display:flex;flex-wrap:wrap;gap:4px 16px;font-size:13.5px;color:var(--lm-muted);margin:0 0 12px}
.sum24 b{color:var(--lm-text);font-weight:600}
.chartbox{position:relative;width:100%;flex:1;min-height:230px}
.chartbox svg{position:absolute;inset:0;display:block;width:100%;height:100%;overflow:visible}
.chartbox text{font-family:var(--lm-font);font-size:12px;fill:var(--lm-muted)}
.chartbox text.val{fill:var(--lm-text);font-weight:700;font-size:13px}
.chartbox text.nowtxt{fill:#1a1206;font-weight:700;font-size:11px}
.alegend{display:flex;flex-wrap:wrap;gap:6px 16px;font-size:13px;color:var(--lm-muted);margin-top:8px}
.alegend span{display:inline-flex;align-items:center;gap:7px}
.alegend i{width:14px;height:7px;border-radius:4px;background:var(--c)}

/* ---------- last 7 days ---------- */
.wstats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-bottom:16px}
.wrows{display:grid;gap:4px}
.wrow{display:grid;grid-template-columns:58px minmax(0,1fr) 92px;align-items:center;gap:12px;padding:8px 10px;border-radius:12px}
.wrow.today{background:rgba(246,168,35,.08);box-shadow:inset 0 0 0 1px rgba(246,168,35,.42)}
.wrow .wd{font-size:14.5px;font-weight:600;color:var(--lm-soft);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.wrow.today .wd{color:var(--lm-amber-2)}
.wbar{height:12px;border-radius:7px;background:rgba(148,163,184,.1);overflow:hidden}
.wbar i{display:block;height:100%;min-width:6px;border-radius:7px;box-shadow:0 0 14px -2px var(--g)}
.wrow .wv{text-align:right;min-width:0}
.wrow .wv b{display:block;font-size:16px;font-weight:700;white-space:nowrap}
.wrow .wv b small{font-size:12px;font-weight:500;color:var(--lm-muted);margin-left:3px}
.wrow .wv span{display:block;font-size:13px;color:var(--lm-muted);white-space:nowrap}
.wrow.idle .wv b{color:var(--lm-muted)}

/* ---------- charging ---------- */
.cchip{display:inline-flex;align-items:center;gap:8px;padding:6px 12px;border-radius:999px;font-size:13px;font-weight:600;white-space:nowrap;
  color:var(--c);background:color-mix(in srgb,var(--c) 13%,transparent);border:1px solid color-mix(in srgb,var(--c) 40%,transparent)}
.ctop{display:flex;align-items:flex-end;justify-content:space-between;gap:12px 18px;flex-wrap:wrap}
.soc{font-size:56px;font-weight:700;line-height:.9;letter-spacing:-.035em}
.soc span{font-size:24px;font-weight:600;color:var(--lm-amber);margin-left:5px;letter-spacing:0}
.socsub{font-size:14.5px;color:var(--lm-soft);margin-top:9px}
.cside{text-align:right}
.cside b{display:block;font-size:22px;font-weight:700}
.cside small{display:block;font-size:13px;color:var(--lm-muted);margin-top:2px}
.bbar{position:relative;height:18px;border-radius:10px;background:rgba(148,163,184,.12);margin:22px 0 40px}
.bbar .f{position:absolute;left:0;top:0;bottom:0;border-radius:10px;background:linear-gradient(90deg,#f59e0b,#fbbf24);box-shadow:0 0 18px -4px rgba(251,191,36,.7)}
.bbar .f.on{background:linear-gradient(90deg,#10b981,#6ee7b7,#10b981);background-size:200% 100%;animation:lm-flowbg 2s linear infinite;box-shadow:0 0 18px -4px rgba(52,211,153,.8)}
.bbar .tg{position:absolute;top:3px;bottom:3px;border-radius:0 8px 8px 0;background:repeating-linear-gradient(135deg,rgba(246,168,35,.4) 0 5px,rgba(246,168,35,.12) 5px 10px)}
.bbar .lim{position:absolute;top:-7px;bottom:-7px;width:3px;margin-left:-1.5px;border-radius:2px;background:#eef2fa;box-shadow:0 0 0 2px rgba(13,20,36,.9)}
.bbar .lim b{position:absolute;top:calc(100% + 5px);left:50%;transform:translateX(-50%);font-size:13px;font-weight:600;color:var(--lm-soft);white-space:nowrap}
.bbar .lim.edge-r b{left:auto;right:-2px;transform:none}
.bbar .lim.edge-l b{left:-2px;transform:none}
.cinfo{font-size:13.5px;color:var(--lm-muted);line-height:1.5;margin:-8px 0 14px}
.cinfo b{color:var(--lm-text);font-weight:600}
.lrow{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 14px;border-radius:15px;background:rgba(255,255,255,.035);border:1px solid var(--lm-line-2)}
.lrow.busy{opacity:.6;pointer-events:none}
.lrow small{display:block;font-size:13px;color:var(--lm-muted)}
.lrow b{display:inline-block;font-size:22px;font-weight:700;margin-top:2px}
.lrow b.pending{color:var(--lm-amber-2)}
.lrow .was{font-size:13px;color:var(--lm-muted);margin-left:8px}
.stepper{display:inline-flex;align-items:center;gap:10px}
.stepper .stp{width:44px;height:44px;border-radius:50%;border:1px solid rgba(246,168,35,.5);background:rgba(246,168,35,.1);color:var(--lm-amber-2);font:500 24px/1 var(--lm-font);display:grid;place-items:center;padding:0}
.stepper .stp:hover{background:rgba(246,168,35,.22)}
.stepper .stp:disabled{opacity:.35;cursor:default}
.lset{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(0,1fr);gap:8px;margin-top:8px}
.csum{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:14px}
.csum .stat b{font-size:18px}
.cnone{margin-top:14px;padding:12px 14px;border-radius:13px;font-size:13.5px;color:var(--lm-muted);background:rgba(255,255,255,.025);border:1px dashed var(--lm-line)}

/* ---------- battery & efficiency ---------- */
.aq{display:flex;align-items:center;gap:14px;margin-top:14px}
.aqv{font-size:34px;font-weight:700;letter-spacing:-.02em}
.aq .t{flex:1;min-width:0}
.aq .t b{font-size:15px;font-weight:700}
.aq .t b span{color:var(--lm-muted);font-weight:500}
.aq .t small{display:block;font-size:13px;color:var(--lm-muted);margin-top:2px}
.scale{position:relative;height:7px;border-radius:5px;margin-top:10px;background:linear-gradient(90deg,#34d399,#a3e635 30%,#facc15 50%,#fb923c 70%,#f43f5e 85%,#a855f7)}
.scale i{position:absolute;top:-5px;width:4px;height:17px;border-radius:2px;background:#fff;box-shadow:0 0 0 2px rgba(8,13,28,.85);transform:translateX(-50%)}
.split{margin-top:18px;font-size:13px;color:var(--lm-muted)}
.split .bar{display:flex;height:9px;border-radius:5px;overflow:hidden;margin:8px 0 8px;background:rgba(148,163,184,.12)}
.split .bar i{display:block;height:100%}
.split .lg{display:flex;flex-wrap:wrap;gap:4px 14px}
.split .lg span{display:inline-flex;align-items:center;gap:6px;color:var(--lm-soft)}
.split .lg i{width:9px;height:9px;border-radius:3px;display:inline-block}
.health{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:12px;padding:12px 14px;border-radius:14px;background:rgba(255,255,255,.035);border:1px solid var(--lm-line-2)}
.health .sq{width:38px;height:38px;border-radius:11px;display:grid;place-items:center;color:#f472b6;background:rgba(244,114,182,.14)}
.health b{display:block;font-size:15px;font-weight:600}
.health small{display:block;font-size:13px;color:var(--lm-muted);margin-top:2px}
.health .big2{font-size:24px;font-weight:700}

/* ---------- trips ---------- */
.tsum{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px}
.tgroup+.tgroup{margin-top:16px}
.tgh{display:flex;justify-content:space-between;align-items:baseline;gap:10px;padding:0 4px 8px;font-size:14px;font-weight:650;color:var(--lm-soft)}
.tgh span{font-size:13px;font-weight:500;color:var(--lm-muted);white-space:nowrap}
.trip{display:grid;grid-template-columns:minmax(52px,max-content) minmax(0,1fr) auto;align-items:center;gap:12px;width:100%;padding:11px 13px;border-radius:14px;text-align:left;
  background:rgba(255,255,255,.03);border:1px solid var(--lm-line-2);transition:background .2s,border-color .2s}
.trip+.trip{margin-top:6px}
button.trip:hover{background:rgba(255,255,255,.06)}
.trip .tt b{display:block;font-size:15px;font-weight:650;white-space:nowrap}
.trip .tt small{display:block;font-size:13px;color:var(--lm-muted);margin-top:2px;white-space:nowrap}
.trip .td{min-width:0}
.trip .td b{display:block;font-size:18px;font-weight:700;white-space:nowrap}
.trip .td b small{font-size:13px;font-weight:500;color:var(--lm-muted);margin-left:3px}
.trip .td>span{display:block;font-size:13px;color:var(--lm-muted);margin-top:3px;line-height:1.35}
.trip .tcx{text-align:right}
.trip .tcx small{display:block;font-size:11px;color:var(--lm-muted);margin-top:4px;white-space:nowrap}
.trip.sel{border-color:rgba(246,168,35,.6);background:rgba(246,168,35,.08);box-shadow:inset 3px 0 0 var(--lm-amber)}
.trip.live{border-color:rgba(56,189,248,.5);background:linear-gradient(90deg,rgba(56,189,248,.12),rgba(56,189,248,.02))}
.trip.live .tt small{color:#7dd3fc}
.cons{display:inline-block;padding:4px 9px;border-radius:8px;font-size:13.5px;color:#0b1020;font-weight:700;white-space:nowrap}
.vs{display:inline-block;margin-left:7px;padding:2px 7px;border-radius:6px;font-size:12px;font-weight:700;vertical-align:2px}
.vs.good{color:#34d399;background:rgba(52,211,153,.14)}
.vs.bad{color:#fb923c;background:rgba(251,146,60,.14)}
.more{display:block;width:100%;margin-top:12px;padding:11px;border-radius:13px;font-size:14px;font-weight:600;color:var(--lm-amber-2);background:rgba(246,168,35,.08);border:1px solid rgba(246,168,35,.32)}
.more:hover{background:rgba(246,168,35,.15)}
.tdh{display:flex;align-items:flex-end;justify-content:space-between;gap:10px 16px;flex-wrap:wrap;margin:-4px 0 14px}
.tdh .dist{font-size:40px;font-weight:700;line-height:.95;letter-spacing:-.03em}
.tdh .dist small{font-size:17px;font-weight:600;color:var(--lm-amber);margin-left:4px;letter-spacing:0}
.tdh .when{text-align:right}
.tdh .when b{display:block;font-size:15.5px;font-weight:650}
.tdh .when span{display:block;font-size:13.5px;color:var(--lm-muted);margin-top:2px}
.livebadge{display:inline-flex;align-items:center;gap:7px;font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#7dd3fc}
.spd{margin-top:16px}
.spd .sh{display:flex;justify-content:space-between;gap:10px;font-size:14px;font-weight:600;color:var(--lm-soft);margin-bottom:10px}
.spd .sh span{font-weight:500;font-size:13px;color:var(--lm-muted)}
.spdbox{position:relative;height:140px}
.spdbox svg{position:absolute;left:36px;right:0;top:0;width:calc(100% - 36px);height:calc(100% - 22px);overflow:visible}
.spdbox .yl{position:absolute;left:0;width:30px;text-align:right;font-size:12px;color:var(--lm-muted);transform:translateY(-50%)}
.spdbox .yl.lim{color:#fda4af;font-weight:600}
.spdbox .xl{position:absolute;left:36px;right:0;bottom:0;display:flex;justify-content:space-between;font-size:12px;color:var(--lm-muted)}

/* ---------- tires ---------- */
.tgrid{display:grid;grid-template-columns:minmax(0,1fr) 64px minmax(0,1fr);grid-template-areas:"fl car fr" "rl car rr";gap:10px 12px;align-items:center}
.tyre{padding:12px;border-radius:14px;background:rgba(255,255,255,.035);border:1px solid var(--lm-line-2);min-width:0}
.tyre small{display:block;font-size:13px;color:var(--lm-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tyre b{display:block;font-size:24px;font-weight:700;margin-top:3px;color:var(--c,var(--lm-text))}
.tyre b span{font-size:13px;font-weight:500;color:var(--lm-muted);margin-left:3px}
.tyre em{display:block;font-style:normal;font-size:12px;font-weight:600;color:var(--c);margin-top:2px}
.tyre.bad{border-color:rgba(251,113,133,.5);background:rgba(251,113,133,.07)}
.tyre.warn{border-color:rgba(246,168,35,.5);background:rgba(246,168,35,.06)}
.tcar{grid-area:car;justify-self:center;width:58px;height:auto}
.tstat{display:flex;align-items:center;gap:10px;margin-top:14px;font-size:14px;font-weight:600;color:var(--c)}
.tstat .ic{width:18px;height:18px}
.tstat span{font-weight:500;color:var(--lm-muted)}

/* ---------- maintenance ---------- */
.mside{display:flex;align-items:center;gap:10px}
.mrow{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:12px;padding:12px 14px;border-radius:14px;background:rgba(255,255,255,.03);border:1px solid var(--lm-line-2)}
.mrow+.mrow{margin-top:7px}
.mrow .sq{width:36px;height:36px;border-radius:11px;display:grid;place-items:center;color:var(--c);background:color-mix(in srgb,var(--c) 15%,transparent)}
.mrow b{display:block;font-size:14.5px;font-weight:600;line-height:1.3}
.mrow small{display:block;font-size:13px;color:var(--lm-muted);margin-top:2px}
.mbar{height:5px;border-radius:4px;background:rgba(148,163,184,.12);margin-top:7px;overflow:hidden}
.mbar i{display:block;height:100%;border-radius:4px}
.mdone{min-height:38px;padding:8px 12px;border-radius:11px;font-size:13px;font-weight:600;color:var(--lm-soft);background:rgba(255,255,255,.04);border:1px solid var(--lm-line)}
.mdone:hover{background:rgba(255,255,255,.08)}
.mdone.armed{color:var(--lm-amber-2);border-color:var(--lm-amber)}
/* ---------- insights ---------- */
.irow{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:12px;padding:12px 14px;border-radius:14px;background:rgba(255,255,255,.03);border:1px solid var(--lm-line-2)}
.irow+.irow{margin-top:7px}
.irow .sq{width:36px;height:36px;border-radius:11px;display:grid;place-items:center;color:var(--c);background:color-mix(in srgb,var(--c) 15%,transparent)}
.irow b{display:block;font-size:14.5px;font-weight:600}
.irow small{display:block;font-size:13px;color:var(--lm-muted);margin-top:2px}
.irow .mono{font-size:16px;font-weight:600;white-space:nowrap}
.temps{margin-top:16px}
.temps small.h{display:block;font-size:13px;font-weight:600;color:var(--lm-soft);margin-bottom:10px}
.trow2{display:grid;grid-template-columns:72px 1fr 52px;align-items:center;gap:10px;font-size:13px;color:var(--lm-muted)}
.trow2+.trow2{margin-top:8px}
.trow2 .b{height:9px;border-radius:6px;background:rgba(148,163,184,.12);overflow:hidden}
.trow2 .b i{display:block;height:100%;border-radius:6px}
.trow2 .mono{font-size:13px;text-align:right;color:var(--lm-text)}

/* ---------- controls ---------- */
.tiles{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px}
.tile{position:relative;display:flex;flex-direction:column;align-items:flex-start;gap:10px;padding:14px;border-radius:16px;text-align:left;min-width:0;
  background:rgba(255,255,255,.035);border:1px solid var(--lm-line-2);transition:background .2s,border-color .2s,transform .15s}
.tile:hover{background:rgba(255,255,255,.065);border-color:var(--lm-line)}
.tile:active{transform:scale(.98)}
.tile .sq{width:38px;height:38px;border-radius:12px;display:grid;place-items:center;color:var(--c,var(--lm-soft));background:color-mix(in srgb,var(--c,#94a3b8) 16%,transparent)}
.tile .sq .ic{width:20px;height:20px}
.tile .tl{font-size:15px;font-weight:600;line-height:1.25}
.tile .tx{display:flex;flex-direction:column;gap:3px;min-width:0}
.tile .ts{font-size:13px;color:var(--lm-muted);line-height:1.3}
.tile.on{border-color:rgba(246,168,35,.45);background:linear-gradient(180deg,rgba(246,168,35,.12),rgba(246,168,35,.03))}
.tile.on .ts{color:var(--lm-amber-2)}
.tile.busy .sq .ic{animation:lm-spin 1s linear infinite}
.controls .subh:first-of-type{margin-top:4px}

/* ---------- settings ---------- */
.sgrp+.sgrp{margin-top:10px}
.settings .subh{margin-top:6px}
.looks{display:grid;grid-template-columns:repeat(3,minmax(0,300px));gap:10px}
.lk{display:flex;flex-direction:column;gap:10px;padding:10px;border-radius:16px;text-align:left;min-width:0;
  background:rgba(255,255,255,.03);border:1px solid var(--lm-line-2);transition:border-color .2s,background .2s}
.lk:hover{background:rgba(255,255,255,.06);border-color:var(--lm-line)}
.lk.on{border-color:rgba(246,168,35,.7);background:rgba(246,168,35,.07);box-shadow:inset 0 0 0 1px rgba(246,168,35,.3)}
.lk .thumb{display:block;width:100%;height:auto;border-radius:10px;border:1px solid rgba(148,163,184,.14)}
.lkt{min-width:0;padding:0 4px 2px}
.lkt b{display:flex;align-items:center;gap:8px;font-size:15px;font-weight:650}
.lk.on .lkt b{color:var(--lm-amber-2)}
.lk.on .lkt b::after{content:"";width:8px;height:8px;border-radius:50%;background:var(--lm-amber);box-shadow:0 0 8px var(--lm-amber)}
.lkt small{display:block;font-size:13px;color:var(--lm-muted);margin-top:3px;line-height:1.35}
.srow{display:flex;align-items:center;gap:10px 16px;flex-wrap:wrap;margin-top:14px}
.slab{font-size:14.5px;font-weight:600;color:var(--lm-soft)}
.sseg{display:inline-flex;flex-wrap:wrap;gap:4px;padding:4px;border-radius:14px;background:rgba(255,255,255,.035);border:1px solid var(--lm-line-2);max-width:100%}
.sseg button{display:flex;flex-direction:column;justify-content:center;align-items:flex-start;min-height:44px;padding:6px 16px;border-radius:10px;color:var(--lm-soft);text-align:left;transition:background .2s,color .2s}
.sseg button b{font-size:14.5px;font-weight:600}
.sseg button small{font-size:12px;color:var(--lm-muted);margin-top:1px}
.sseg button:hover{background:rgba(255,255,255,.06)}
.sseg button.on{color:var(--lm-amber-2);background:rgba(246,168,35,.14);box-shadow:inset 0 0 0 1px rgba(246,168,35,.45)}
.sfoot{display:flex;align-items:center;justify-content:space-between;gap:10px 16px;flex-wrap:wrap;margin-top:20px;padding-top:14px;border-top:1px solid var(--lm-line-2);font-size:13px;color:var(--lm-muted)}
.lk:focus-visible,.sseg button:focus-visible,.tab:focus-visible,.mdone:focus-visible{outline:2px solid var(--lm-amber-2);outline-offset:2px}


/* ---------- outlook ---------- */
.otiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:8px}
.otile{display:flex;align-items:center;gap:12px;padding:13px 14px;border-radius:15px;min-width:0;background:rgba(255,255,255,.035);border:1px solid var(--lm-line-2);--c:var(--lm-sky)}
.otile .sq{width:38px;height:38px;border-radius:12px;display:grid;place-items:center;flex:none;color:var(--c);background:color-mix(in srgb,var(--c) 16%,transparent)}
.otile .sq .ic{width:20px;height:20px}
.otile>div{min-width:0;flex:1}
.otile b{display:block;font-size:15.5px;font-weight:650;line-height:1.25}
.otile small{display:block;font-size:13px;color:var(--lm-muted);margin-top:3px;line-height:1.35}
.otile.ok{--c:var(--lm-green);border-color:rgba(52,211,153,.4);background:linear-gradient(135deg,rgba(52,211,153,.14),rgba(52,211,153,.03))}
.otile.warn{--c:var(--lm-amber);border-color:rgba(246,168,35,.5);background:linear-gradient(135deg,rgba(246,168,35,.16),rgba(246,168,35,.03))}
.otile.bad{--c:var(--lm-red);border-color:rgba(251,113,133,.5);background:linear-gradient(135deg,rgba(251,113,133,.16),rgba(251,113,133,.03))}
.obig{flex:none;font-size:26px;font-weight:700;letter-spacing:-.02em;white-space:nowrap}
.obig small{display:inline;font-size:13px;font-weight:600;color:var(--lm-amber);margin:0 0 0 3px}
.onext{display:flex;align-items:center;gap:9px;margin-top:12px;font-size:13.5px;color:var(--lm-muted)}
.onext .ic{width:16px;height:16px;color:var(--lm-amber-2)}
.onext b{color:var(--lm-text);font-weight:600}
.outlook .note{margin:12px 0 0}
.wk{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:6px}
.wkd{display:grid;justify-items:center;gap:5px;padding:9px 2px 8px;border-radius:13px;background:rgba(255,255,255,.03);border:1px solid var(--lm-line-2);min-width:0}
.wkd small{font-size:12.5px;font-weight:600;color:var(--lm-muted)}
.wkb{width:100%;max-width:34px;height:54px;display:flex;align-items:flex-end;border-radius:7px;background:rgba(148,163,184,.1);overflow:hidden}
.wkb i{display:block;width:100%;border-radius:7px;background:linear-gradient(180deg,#60a5fa,#2563eb)}
.wkd b{font-size:14.5px;font-weight:700;font-variant-numeric:tabular-nums}
.wkd em{font-style:normal;font:500 11.5px var(--lm-mono);color:var(--lm-muted);white-space:nowrap}
.wkd.idle b{color:var(--lm-dim)}
.wkd.today small{color:var(--lm-text)}
.wkd.target{border-color:rgba(246,168,35,.6);background:rgba(246,168,35,.08)}
.wkd.target small{color:var(--lm-amber-2)}
.wkd.target .wkb i{background:linear-gradient(180deg,#ffc461,#f6a823)}
.outlook .note b{color:var(--lm-text)}
/* ---------- last 24 hours ---------- */
.tline{position:relative;display:grid;gap:2px;--tw:44px}
.tline.wide{--tw:70px}
.tlr{position:relative;display:grid;grid-template-columns:var(--tw) 30px minmax(0,1fr);align-items:center;gap:10px;padding:7px 4px}
.tlt{font:600 13px var(--lm-mono);color:var(--lm-muted);text-align:right;white-space:nowrap}
.tld{position:relative;width:30px;height:30px;border-radius:50%;display:grid;place-items:center;color:var(--c);background:color-mix(in srgb,var(--c) 16%,transparent);border:1px solid color-mix(in srgb,var(--c) 40%,transparent)}
.tlr+.tlr .tld::before{content:"";position:absolute;left:50%;bottom:calc(100% + 2px);height:13px;width:2px;margin-left:-1px;border-radius:2px;background:rgba(148,163,184,.2)}
.tld .ic{width:15px;height:15px}
.tlr b{display:block;font-size:14.5px;font-weight:600;line-height:1.25}
.tlr small{display:block;font-size:13px;color:var(--lm-muted);margin-top:2px}
.tlr.live .tld{animation:lm-pulse 1.8s ease-in-out infinite}
.tlr.live b{color:var(--c)}
/* ---------- frequent routes ---------- */
.rcards{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:10px}
.rcard{padding:14px;border-radius:16px;background:rgba(255,255,255,.035);border:1px solid var(--lm-line-2);min-width:0}
.rname{display:flex;align-items:center;gap:8px;min-width:0;font-size:15.5px}
.rname .ic{width:16px;height:16px;color:var(--lm-amber-2)}
.rname b{font-weight:650;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}
.rname i{font-style:normal;color:var(--lm-dim);flex:none}
.rname .pill{margin-left:auto;flex:none;letter-spacing:0;font-size:12px;color:var(--lm-soft);background:rgba(148,163,184,.14)}
.rstats{display:grid;grid-template-columns:repeat(auto-fit,minmax(64px,1fr));gap:8px;margin-top:12px}
.rstats b{display:block;font-size:19px;font-weight:700;letter-spacing:-.01em;white-space:nowrap}
.rstats small{display:block;font-size:12px;color:var(--lm-muted);margin-top:1px;white-space:nowrap}
.rsub{display:block;font-size:13px;color:var(--lm-muted);margin-top:10px;line-height:1.4}
/* ---------- trips: eco score, export, replay ---------- */
.eco{display:block;margin-top:5px;font-size:12px;font-weight:700;color:var(--c);white-space:nowrap}
.hbtn{display:inline-flex;align-items:center;gap:7px;min-height:34px;padding:6px 12px;border-radius:10px;font-size:13px;font-weight:600;color:var(--lm-soft);background:rgba(255,255,255,.04);border:1px solid var(--lm-line);flex:none}
.hbtn:hover{background:rgba(255,255,255,.09);color:var(--lm-text)}
.hbtn .ic{width:15px;height:15px}
.replay{display:flex;align-items:center;gap:10px 12px;flex-wrap:wrap;margin-top:12px}
.rpb{display:inline-flex;align-items:center;gap:8px;min-height:38px;padding:7px 14px;border-radius:999px;font-size:13.5px;font-weight:600;color:var(--lm-amber-2);background:rgba(246,168,35,.12);border:1px solid rgba(246,168,35,.5);flex:none}
.rpb:hover,.rpb.on{background:rgba(246,168,35,.22)}
.rpb .ic{width:15px;height:15px}
.rps{flex:1 1 140px;min-width:0}
.rpi{font:600 13px var(--lm-mono);color:var(--lm-soft);white-space:nowrap;min-width:9ch}
.rpcur{position:absolute;top:0;bottom:22px;width:2px;margin-left:-1px;border-radius:2px;background:#fff;box-shadow:0 0 8px rgba(255,255,255,.7);pointer-events:none}
.mapbox .rpdot{fill:#fff;stroke:#0b1224;stroke-width:3}
input[type=range]{-webkit-appearance:none;appearance:none;width:100%;height:30px;background:transparent;margin:0;cursor:pointer}
input[type=range]::-webkit-slider-runnable-track{height:6px;border-radius:4px;background:rgba(148,163,184,.24)}
input[type=range]::-moz-range-track{height:6px;border-radius:4px;background:rgba(148,163,184,.24)}
input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:22px;height:22px;margin-top:-8px;border-radius:50%;background:var(--lm-amber);border:3px solid #0f1729;box-shadow:0 0 0 1px rgba(246,168,35,.7)}
input[type=range]::-moz-range-thumb{width:16px;height:16px;border-radius:50%;background:var(--lm-amber);border:3px solid #0f1729;box-shadow:0 0 0 1px rgba(246,168,35,.7)}
input[type=range]:focus-visible{outline:2px solid var(--lm-amber-2);outline-offset:3px;border-radius:8px}
/* ---------- charging curve and history ---------- */
.cv{margin-top:0}
.cvdot{position:absolute;width:11px;height:11px;margin:-5.5px 0 0 -5.5px;border-radius:50%;background:var(--lm-green);border:2px solid #0f1729;box-shadow:0 0 10px var(--lm-green);animation:lm-pulse 1.8s ease-in-out infinite;pointer-events:none}
.alegend i.dash{background:repeating-linear-gradient(90deg,var(--c) 0 4px,transparent 4px 7px)}
.slowbox{display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:14px;margin-bottom:14px;color:var(--lm-amber-2);background:rgba(246,168,35,.1);border:1px solid rgba(246,168,35,.5)}
.slowbox .ic{width:22px;height:22px;flex:none}
.slowbox b{display:block;font-size:15px;font-weight:650;color:var(--lm-text)}
.slowbox small{display:block;font-size:13px;color:var(--lm-soft);margin-top:2px}
.chsum{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;margin-bottom:14px}
.hbar{height:7px;border-radius:5px;background:rgba(56,189,248,.35);margin-top:9px;overflow:hidden}
.hbar i{display:block;height:100%;border-radius:5px;background:var(--lm-green)}
.chrows{display:grid;gap:6px}
.chrow{display:grid;grid-template-columns:minmax(58px,max-content) minmax(0,1fr) auto;align-items:center;gap:12px;padding:11px 13px;border-radius:14px;background:rgba(255,255,255,.03);border:1px solid var(--lm-line-2)}
.sd b{display:block;font-size:14.5px;font-weight:650;white-space:nowrap}
.sd small,.sx small{display:block;font-size:13px;color:var(--lm-muted);margin-top:2px;white-space:nowrap}
.sm{min-width:0}
.sm b{display:block;font-size:18px;font-weight:700;white-space:nowrap}
.sm b small{font-size:13px;font-weight:500;color:var(--lm-muted);margin-left:3px}
.sm span{display:block;font-size:13px;color:var(--lm-muted);margin-top:3px;line-height:1.35}
.sx{text-align:right}
.pill.dc{color:#c4b5fd;background:rgba(167,139,250,.16)}
/* ---------- software, schedules, messages ---------- */
.notes{display:grid;gap:8px}
.nrow{padding:11px 13px;border-radius:13px;background:rgba(255,255,255,.03);border:1px solid var(--lm-line-2)}
.nrow b{display:block;font-size:14.5px;font-weight:650}
.nrow p{margin:4px 0 0;font-size:13.5px;line-height:1.5;color:var(--lm-soft);white-space:pre-line;display:-webkit-box;-webkit-line-clamp:5;-webkit-box-orient:vertical;overflow:hidden}
.subh .subm{float:right;font-size:13px;font-weight:500;color:var(--lm-muted)}
.schrows{display:grid;gap:6px}
.schrow{display:flex;align-items:center;gap:12px;padding:10px 13px;border-radius:13px;background:rgba(255,255,255,.03);border:1px solid var(--lm-line-2)}
.schrow b{font:600 15px var(--lm-mono);white-space:nowrap}
.schrow span:not(.pill){font-size:13.5px;color:var(--lm-soft);min-width:0;flex:1}
.schrow.off{opacity:.6}
.pchips{display:flex;flex-wrap:wrap;gap:6px}
.pchips span{padding:5px 10px;border-radius:999px;font-size:13px;color:var(--lm-soft);background:rgba(255,255,255,.05);border:1px solid var(--lm-line-2)}
.mrows2{display:grid;gap:6px}
.mrow2{display:grid;grid-template-columns:10px minmax(0,1fr) auto;align-items:start;gap:11px;padding:12px 13px;border-radius:14px;background:rgba(255,255,255,.03);border:1px solid var(--lm-line-2)}
.mrow2 i{width:8px;height:8px;margin-top:6px;border-radius:50%;background:transparent}
.mrow2.unread{border-color:rgba(246,168,35,.4)}
.mrow2.unread i{background:var(--lm-amber);box-shadow:0 0 8px var(--lm-amber)}
.mrow2 b{display:block;font-size:14.5px;font-weight:600;line-height:1.3}
.mrow2 p{margin:3px 0 0;font-size:13.5px;line-height:1.45;color:var(--lm-muted);display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.mrow2 small{font-size:12.5px;color:var(--lm-dim);white-space:nowrap;margin-top:2px}
/* ---------- journey ---------- */
.cal svg{display:block;width:100%;height:auto;max-width:1180px}
.cal text{font:500 10px var(--lm-font);fill:var(--lm-muted)}
.cal rect.cu{fill:rgba(148,163,184,.05)}
.cal rect.c0,.callegend i.c0{fill:rgba(148,163,184,.14);background:rgba(148,163,184,.14)}
.cal rect.c1,.callegend i.c1{fill:#7c4a12;background:#7c4a12}
.cal rect.c2,.callegend i.c2{fill:#b96d15;background:#b96d15}
.cal rect.c3,.callegend i.c3{fill:#e9951b;background:#e9951b}
.cal rect.c4,.callegend i.c4{fill:#ffc461;background:#ffc461}
.calhalf{display:none}
.callegend{display:flex;align-items:center;gap:5px;margin-top:10px;font-size:12.5px;color:var(--lm-muted)}
.callegend i{width:12px;height:12px;border-radius:3px;display:inline-block}
.callegend span:first-child{margin-right:3px}
.callegend span:last-child{margin-left:3px}
.mbars{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:6px;height:150px;align-items:end}
.mb{display:grid;grid-template-rows:16px minmax(0,1fr) 18px;height:100%;justify-items:center;min-width:0}
.mb span{grid-row:1;font-size:11.5px;color:var(--lm-muted);white-space:nowrap;overflow:hidden;max-width:100%}
.mb i{grid-row:2}
.mb small{grid-row:3}
.mb i{align-self:end;width:100%;max-width:38px;border-radius:7px 7px 3px 3px;background:linear-gradient(180deg,#60a5fa,#2563eb);min-height:0}
.mb.now i{background:linear-gradient(180deg,#ffc461,#f6a823);box-shadow:0 0 16px -4px rgba(246,168,35,.8)}
.mb small{font-size:12px;color:var(--lm-muted);align-self:end}
.mb.now small{color:var(--lm-amber-2);font-weight:600}
.recrows{margin-top:12px;display:grid;gap:7px}
.recrows .irow{margin-top:0}
@container lmcard (min-width:1180px){.recrows{grid-template-columns:repeat(2,minmax(0,1fr))}}
.records .subh{margin-top:18px}
.badgegrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:8px}
.badge{display:flex;align-items:center;gap:12px;padding:12px;border-radius:15px;min-width:0;background:rgba(255,255,255,.03);border:1px solid var(--lm-line-2)}
.badge.l0{opacity:.72}
.badge:not(.l0){border-color:color-mix(in srgb,var(--c) 45%,transparent);background:linear-gradient(135deg,color-mix(in srgb,var(--c) 12%,transparent),rgba(255,255,255,.02))}
.bring{position:relative;width:46px;height:46px;border-radius:50%;display:grid;place-items:center;flex:none;color:var(--c);
  background:conic-gradient(var(--c) calc(var(--p) * 1%),rgba(148,163,184,.16) 0)}
.bring::before{content:"";position:absolute;inset:4px;border-radius:50%;background:#101a30}
.bring .ic{position:relative;width:22px;height:22px}
.badge>div{min-width:0}
.badge b{display:block;font-size:14.5px;font-weight:650;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.badge small{display:block;font-size:12.5px;color:var(--c);font-weight:600;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.badge.l0 small{color:var(--lm-muted);font-weight:500}
.badge em{display:block;font-style:normal;font-size:12.5px;color:var(--lm-muted);margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.badge em span{color:var(--lm-text);font-weight:600}
.rl{display:grid;gap:12px}
.rlout{padding:14px 16px;border-radius:16px;background:linear-gradient(135deg,rgba(246,168,35,.13),rgba(246,168,35,.02));border:1px solid rgba(246,168,35,.35)}
.rlbig{font-size:46px;font-weight:700;line-height:1;letter-spacing:-.03em;font-variant-numeric:tabular-nums}
.rlbig small{font-size:19px;font-weight:600;color:var(--lm-amber);margin-left:5px;letter-spacing:0}
.rlsub{font-size:13.5px;color:var(--lm-muted);margin-top:7px}
.rlsub b{color:var(--lm-text);font-weight:600}
.rlcons{font-size:13.5px;color:var(--lm-muted);margin-top:3px}
.rlcons b{color:var(--lm-text);font-weight:600;font-variant-numeric:tabular-nums}
.rls{display:block}
.rls>span{display:flex;justify-content:space-between;align-items:baseline;font-size:14px;font-weight:600;color:var(--lm-soft)}
.rls b{font:600 14px var(--lm-mono);color:var(--lm-text)}
.rlt{display:inline-flex;align-items:center;justify-content:center;gap:9px;min-height:44px;padding:9px 14px;border-radius:13px;font-size:14.5px;font-weight:600;color:var(--lm-soft);background:rgba(255,255,255,.04);border:1px solid var(--lm-line)}
.rlt .ic{width:17px;height:17px}
.rlt.on{color:#7dd3fc;border-color:rgba(56,189,248,.5);background:rgba(56,189,248,.1)}
.rl .foot{margin-top:0}
.rlchart{margin-top:0}
.hbtn:focus-visible,.rpb:focus-visible,.rlt:focus-visible,.more:focus-visible{outline:2px solid var(--lm-amber-2);outline-offset:2px}
/* ---------- layout ---------- */
.pg-overview .check,.pg-vehicle .maintenance,.pg-charging .chart,.pg-charging .charge,.pg-overview .timeline,.pg-journey .rangelab{align-self:stretch}
.page{grid-auto-flow:row dense}
@container lmcard (min-width:760px){
  .page{grid-template-columns:repeat(2,minmax(0,1fr))}
  .hero,.map,.energy,.maintenance,.settings,.outlook,.controls,.routes,.calendar,.badges{grid-column:1/-1}
  .pg-charging .charge:only-child,.pg-trips .trips:last-child:nth-child(2){grid-column:1/-1}
  .page>.panel:only-child{grid-column:1/-1}
  .pg-overview:not(:has(.timeline)) .check,.pg-overview:not(:has(.check)) .timeline{grid-column:1/-1}
}
@container lmcard (min-width:1180px){
  .page{grid-template-columns:repeat(3,minmax(0,1fr))}
  .hero,.outlook{grid-column:span 2}
  .pg-overview .check,.pg-overview .timeline{grid-column:auto}
  .pg-overview:not(:has(.check)) .hero,.pg-overview:not(:has(.timeline)) .outlook{grid-column:1/-1}
  .controls,.routes,.calendar,.badges{grid-column:1/-1}
  .map{grid-column:span 2}
  .pg-trips:not(:has(.trips)) .map{grid-column:1/-1}
  .week{grid-column:1/-1}
  .pg-trips:has(.map):has(.week) .trips{grid-row:span 2}
  .pg-trips:has(.map):has(.trips) .week{grid-column:span 2}
  .charge{grid-row:span 2}
  .chart,.energy,.sessions,.inbox,.records{grid-column:span 2}
  .pg-charging:not(:has(.curve)) .sessions,.pg-vehicle:not(:has(.software)) .inbox,.pg-journey:not(:has(.rangelab)) .records{grid-column:1/-1}
  .maintenance{grid-column:span 2;grid-row:span 2}
}
/* Six pages and the settings tab: tablets get the settings icon alone, then the stacked tabs phones use. */
@container lmcard (max-width:1100px){
  .tabs.has-set{grid-template-columns:repeat(var(--n),minmax(0,1fr));grid-auto-columns:50px}
  .tabs.has-menu.has-set{grid-template-columns:44px repeat(var(--n),minmax(0,1fr))}
  .tab.set .tlb{display:none}
}
@container lmcard (max-width:900px){
  .tab{flex-direction:column;gap:4px;min-height:54px;padding:7px 2px;font-size:13.5px}
}
@container lmcard (max-width:640px){
  :where(.look-classic) .hero{min-height:0}
  :where(.look-classic) .hero-ui{grid-template-columns:minmax(0,1fr);grid-template-areas:"info" "car" "strip";padding:18px 16px 14px}
  :where(.look-classic) .chip{display:none}
  :where(.look-classic) .hero .refresh{top:16px;right:16px;padding:7px 12px}
  :where(.look-classic) .name{font-size:24px;padding-right:110px}
  :where(.look-classic) .big{font-size:80px}
  :where(.look-classic) .carzone{min-height:120px;padding:4px 0 10px 34px}
  :where(.look-classic) .car img{max-height:170px}
  :where(.look-classic) .quick{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))}
  :where(.look-classic) .strip{grid-template-columns:repeat(3,minmax(0,1fr));padding:12px}
  :where(.look-classic) .cell .l{letter-spacing:.04em;font-size:10.5px}
  :where(.lm:not(.look-classic)) .hero-ui{padding:16px 14px 16px;gap:12px}
  .idb h2{font-size:20px}
  .h-top .refresh{padding:7px 12px}
  :where(.lm:not(.look-classic)) .carzone{min-height:130px;padding-left:34px}
  :where(.lm:not(.look-classic)) .car img{max-height:170px}
  .look-cluster .hero-ui{grid-template-columns:repeat(2,minmax(0,1fr));grid-template-areas:"top top" "left right" "car car" "quick quick" "strip strip"}
  .look-cluster .idb{flex:1 1 0}
  .look-cluster .h-top .upd{display:none}
  .tells{order:3;flex:1 1 100%;justify-content:space-between}
  .gin .gv{font-size:34px}
  .gin .gv small{font-size:14px}
  .gin .gs{font-size:13.5px;margin-top:6px}
  .glab{font-size:13px}
  .lsign{width:30px;height:30px;border-width:3.5px;font-size:12px}
  .prnd{font-size:13px;gap:5px}
  .look-cluster .quick{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))}
  .look-cluster .strip{grid-template-columns:repeat(2,minmax(0,1fr))}
  .look-cluster .cell:last-child:nth-child(odd){grid-column:1/-1}
  .look-cluster .cell{padding:10px 11px}
  .look-console .hero-ui{grid-template-columns:minmax(0,1fr);grid-template-areas:"top" "left" "car" "quick" "strip"}
  .rng{font-size:54px}
  .look-console .carzone{min-height:150px}
  .look-console .quick{flex-wrap:nowrap;gap:6px;justify-content:space-around}
  .look-console .qbtn{width:76px;font-size:13px}
  .look-console .qbtn .qi{width:54px;height:54px}
  .look-console .strip{grid-template-columns:repeat(2,minmax(0,1fr))}
  .look-console .cell{gap:8px;padding:10px 9px}
  .look-console .cell .ci{width:30px;height:30px;border-radius:10px}
  .look-console .cell .ci .ic{width:16px;height:16px}
  .look-console .cell .v small{margin-left:2px}
  .look-console .cell .l{font-size:12px}
  :where(.lm:not(.look-classic)) .cell .v{font-size:16.5px}
  .mapbox{height:260px}
  .fxpin b{font-size:10px;padding:2px 6px}
  .panel{padding:16px}
  .tiles{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
  .tile{flex-direction:row;align-items:center;gap:10px;padding:11px}
  .tile .sq{width:34px;height:34px;flex:none}
  .tile .tl{display:block;font-size:14px}
  .tile .tx{display:block;min-width:0}
  .tile .ts{display:block;margin-top:2px;font-size:12px}
  .mrow{padding:11px 12px}
  .mside{flex-direction:column;align-items:flex-end;gap:7px}
  .mrow .sq{width:32px;height:32px}
  .wstats{grid-template-columns:repeat(2,minmax(0,1fr))}
  .wrow{grid-template-columns:48px minmax(0,1fr) 86px;gap:10px;padding:7px 8px}
  .tab{flex-direction:column;gap:4px;min-height:54px;padding:7px 2px;font-size:12.5px}
  .calfull{display:none}
  .calhalf{display:block}
  .otiles{grid-template-columns:minmax(0,1fr)}
  .rlbig{font-size:40px}
  .mbars{gap:3px;height:130px}
  .mb span{display:none}
  .mb{grid-template-rows:0 minmax(0,1fr) 18px}
  .tlr{gap:8px}
  .wk{gap:4px}
  .wkd{padding:8px 1px 7px}
  .wkd b{font-size:13.5px}
  .wkd em{white-space:normal;text-align:center;line-height:1.2;font-size:10.5px}
  .badgegrid{grid-template-columns:minmax(0,1fr)}
  .tabs.has-set{grid-template-columns:repeat(var(--n),minmax(0,1fr));grid-auto-columns:50px}
  .tabs.has-menu.has-set{grid-template-columns:40px repeat(var(--n),minmax(0,1fr))}
  .tab.set .tlb{display:none}
  .looks{grid-template-columns:minmax(0,1fr)}
  .srow{display:grid;gap:8px}
  .lk{flex-direction:row;align-items:center;gap:12px}
  .lk .thumb{width:116px;flex:none}
  .sseg{display:flex;width:100%}
  .sseg button{flex:1 1 0;min-width:0;padding:6px 10px}
  .sseg.langs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))}
  .soc{font-size:50px}
  .tdh .dist{font-size:34px}
}
@container lmcard (max-width:440px){
  /* Six tabs on a phone: the label size follows the width, so the names stay whole. */
  .tab{font-size:clamp(10px,3.2cqi,12.5px);letter-spacing:-.01em;padding:7px 0}
  .tabs{gap:2px}
  .tabs.has-set{grid-auto-columns:44px}
  .tabs.has-menu.has-set{grid-template-columns:36px repeat(var(--n),minmax(0,1fr))}
  .tabs.has-menu .tab:not(.menu){font-size:clamp(9.5px,2.85cqi,12.5px)}
}
@container lmcard (max-width:350px){
  /* With the sidebar button on the narrowest phones the tabs are icons (they keep their labels for screen readers). */
  .tabs.has-menu .tab:not(.menu) .tlb{display:none}
  .tabs.has-menu .tab{min-height:46px}
}
@container lmcard (max-width:380px){
  .tabs{padding:4px}
  .tabs.has-set{grid-auto-columns:42px}
  .tells{min-width:0}
  .tell{flex:1 1 0;width:auto;min-width:0}
  .tell .ic{width:18px;height:18px}
  .gin .gv{font-size:29px}
  .gin .gv small{font-size:13px}
  .gin .gs{font-size:12px;margin-top:4px}
  .look-console .cell .ci{display:none}
  .look-console .cell{padding:10px 12px}
  .ctiles{grid-template-columns:minmax(0,1fr)}
  .trip{gap:10px;padding:10px 11px}
}
.carbox{position:relative;display:inline-block;max-width:100%;line-height:0}
.plugdot{position:absolute;width:11px;height:11px;margin:0 0 -5.5px -5.5px;border-radius:50%;background:var(--c,#34d399);border:2px solid #0b1224;
  box-shadow:0 0 0 2px color-mix(in srgb,var(--c,#34d399) 45%,transparent),0 0 12px var(--c,#34d399);z-index:1;pointer-events:none}
.car.charging .plugdot{animation:lm-pulse 1.8s ease-in-out infinite}
.carbox.svgcar{width:100%}
.fxaura{position:absolute;left:24%;right:30%;top:6%;height:46%;border-radius:50%;filter:blur(14px);opacity:.8;pointer-events:none;mix-blend-mode:screen;animation:lm-pulse 3s ease-in-out infinite}
.fxaura.warm{background:radial-gradient(closest-side,rgba(251,146,60,.9),rgba(251,146,60,0))}
.fxaura.cool{background:radial-gradient(closest-side,rgba(56,189,248,.9),rgba(56,189,248,0))}
.fxring{position:absolute;left:6%;right:6%;bottom:-6px;height:26px;border-radius:50%;border:2px dashed rgba(246,168,35,.75);box-shadow:0 0 18px rgba(246,168,35,.35);pointer-events:none;animation:lm-pulse 1.8s ease-in-out infinite}
.fxmotion{position:absolute;left:-16%;top:32%;width:20%;height:40%;pointer-events:none}
.fxmotion i{position:absolute;left:0;height:2px;border-radius:2px;background:linear-gradient(90deg,transparent,rgba(148,197,255,.75));animation:lm-streak 1s linear infinite}
.fxmotion i:nth-child(1){top:8%;width:80%}
.fxmotion i:nth-child(2){top:46%;width:100%;animation-delay:.33s}
.fxmotion i:nth-child(3){top:84%;width:62%;animation-delay:.66s}
.fxbeam{position:absolute;left:96%;top:46%;width:30%;height:28%;background:linear-gradient(90deg,rgba(255,243,214,.6),rgba(255,243,214,0));clip-path:polygon(0 38%,100% 0,100% 100%,0 62%);filter:blur(2px);pointer-events:none}
.fxsentry{position:absolute;left:3%;top:-4%;display:inline-flex;align-items:center;gap:6px;font-size:10px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#fecdd3;line-height:1}
.fxsentry i{width:8px;height:8px;border-radius:50%;background:#f43f5e;box-shadow:0 0 10px #f43f5e;animation:lm-pulse 1.2s ease-in-out infinite}
.fxpin{position:absolute;transform:translate(-50%,-100%);display:flex;flex-direction:column;align-items:center;gap:5px;pointer-events:none;line-height:1;z-index:2}
.fxpin b{font-size:10.5px;font-weight:600;padding:3px 8px;border-radius:999px;color:#fff3d6;background:rgba(9,15,33,.8);border:1px solid rgba(246,168,35,.55);white-space:nowrap}
.fxpin i{width:10px;height:10px;border-radius:50%;background:var(--lm-amber);box-shadow:0 0 0 4px rgba(246,168,35,.25),0 0 14px var(--lm-amber);animation:lm-pulse 1.4s ease-in-out infinite}
.fxpin.bad b{border-color:rgba(251,113,133,.6);color:#ffe4e6}
.fxpin.bad i{background:var(--lm-red);box-shadow:0 0 0 4px rgba(251,113,133,.25),0 0 14px var(--lm-red)}
.fxbatt{position:absolute;left:30%;right:30%;bottom:-8px;height:4px;border-radius:3px;background:rgba(148,163,184,.2);overflow:hidden}
.fxbatt i{display:block;height:100%;border-radius:3px;background:linear-gradient(90deg,#10b981,#34d399)}
.fxbatt.on i{background:linear-gradient(90deg,#10b981,#6ee7b7,#10b981);background-size:200% 100%;animation:lm-flowbg 1.6s linear infinite}
.mapbox{position:relative;height:340px;border-radius:15px;overflow:hidden;background:radial-gradient(120% 90% at 30% 0%,#111b38,#070c1c 70%);border:1px solid rgba(148,163,184,.15)}
.mapbox .hamap{display:block;width:100%;height:100%}
.mapbox .routesvg{display:block;width:100%;height:100%}
.mapbox .routesvg text{font:600 12px var(--lm-font,inherit);fill:#e9eef8;paint-order:stroke;stroke:#070c1c;stroke-width:3px}
.mapbox .mapmsg{display:none;position:absolute;inset:0;place-items:center;text-align:center;padding:24px;color:var(--lm-muted);font-size:14px;line-height:1.5}
.mapbox.msg .mapmsg{display:grid}
.mapbox.msg .hamap,.mapbox.msg .routesvg{visibility:hidden}
.map .legend{display:flex;flex-wrap:wrap;gap:6px 16px;font-size:13px;color:var(--lm-soft);margin-top:12px}
.map .legend i{display:inline-block;width:18px;height:5px;border-radius:3px;background:var(--c);box-shadow:0 0 8px var(--c);vertical-align:middle;margin-right:7px}
.map .stats{margin-top:14px}
/* ---------- charging: the hero and the car glow green ---------- */
.hero.charging{border-color:rgba(52,211,153,.55);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.035),inset 0 0 70px -22px rgba(52,211,153,.4),0 0 34px -8px rgba(52,211,153,.5),0 24px 48px -30px rgba(0,0,0,.7)}
.hero.charging .car img{filter:drop-shadow(0 18px 14px rgba(0,0,0,.6)) drop-shadow(0 0 14px rgba(52,211,153,.6))}
.look-classic .hero.charging .car img{filter:drop-shadow(0 20px 16px rgba(0,0,0,.55)) drop-shadow(0 0 14px rgba(52,211,153,.6)) brightness(.94)}
.hero.charging .car .carsvg{filter:drop-shadow(0 0 14px rgba(52,211,153,.5))}
.look-console .hero.charging .carzone::before{background:radial-gradient(closest-side,rgba(52,211,153,.24),transparent)}
@keyframes lm-streak{0%{transform:translateX(40%);opacity:0}30%{opacity:1}100%{transform:translateX(-60%);opacity:0}}
@keyframes lm-flowbg{to{background-position:-200% 0}}
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
    this._page = null;
    this._tripLimit = TRIPS_SHOWN;
    this._sessLimit = 6;
    this._inboxLimit = 5;
    this._tlLimit = 7;
    this._lab = null;
    this._replay = null;
    this._failed = new Set();
  }

  /* ----- Lovelace API ----- */

  static getStubConfig() {
    return {};
  }

  static getConfigForm() {
    const sectionOptions = [
      ["hero", "Overview · car and battery"], ["check", "Overview · vehicle check"], ["controls", "Overview · remote control"],
      ["map", "Trips · trip details and map"], ["trips", "Trips · trip log"], ["week", "Trips · last 7 days"],
      ["charging", "Charging · charging and charge limit"], ["chart", "Charging · last 24 hours"], ["energy", "Charging · battery & efficiency"],
      ["maintenance", "Vehicle · maintenance"], ["tires", "Vehicle · tires"], ["insights", "Vehicle · insights"],
      ["outlook", "Overview · outlook (usual departure, next day, real range)"], ["timeline", "Overview · last 24 hours"],
      ["routes", "Trips · frequent routes"], ["curve", "Charging · charging curve"], ["sessions", "Charging · charging history"],
      ["software", "Vehicle · car software and schedules"], ["inbox", "Vehicle · messages"],
      ["calendar", "Journey · a year of driving"], ["records", "Journey · totals, records and savings"],
      ["rangelab", "Journey · range lab"], ["badges", "Journey · achievements"],
    ].map(([value, label]) => ({ value, label }));
    return {
      schema: [
        { name: "device_id", selector: { device: { filter: { integration: "leapmotor" } } } },
        { name: "name", selector: { text: {} } },
        { name: "sections", selector: { select: { multiple: true, mode: "list", options: sectionOptions } } },
        { name: "look", selector: { select: { mode: "dropdown", options: LOOKS.map((value) => ({ value, label: LOOK_LABELS[value] })) } } },
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
            { name: "quick_actions", selector: { boolean: {} } },
            { name: "tabs", selector: { boolean: {} } },
            { name: "settings", selector: { boolean: {} } },
          ],
        },
        { name: "page", selector: { select: { mode: "dropdown", options: [
          { value: "overview", label: "Overview" }, { value: "trips", label: "Trips" },
          { value: "charging", label: "Charging" }, { value: "vehicle", label: "Vehicle" },
          { value: "journey", label: "Journey" }, { value: "settings", label: "Settings" },
        ] } } },
        { name: "entity_prefix", selector: { text: {} } },
      ],
      computeLabel: (s) => ({
        device_id: "Vehicle", name: "Title (optional)", sections: "Sections", look: "Look", scene: "Day or night (sky in Classic, display in the other looks)",
        language: "Language", confirm_actions: "Tap twice to confirm remote actions",
        backdrop: "Dark backdrop", image_flip: "Mirror the car picture", quick_actions: "Quick buttons under the battery", entity_prefix: "Entity prefix (optional, e.g. c10)",
        tabs: "Pages with tabs (Overview, Trips, Charging, Vehicle, Journey)", page: "First page",
        settings: "Settings tab (each user picks theme and language)",
      })[s.name],
    };
  }

  setConfig(config) {
    if (!config || typeof config !== "object") throw new Error("Invalid configuration");
    const sections = Array.isArray(config.sections) && config.sections.length
      ? ALL_SECTIONS.filter((s) => config.sections.includes(s))
      : ALL_SECTIONS;
    this._config = {
      look: LOOKS[0], scene: "auto", language: "auto", confirm_actions: true, backdrop: true, show_image: true, image_flip: false, quick_actions: true,
      tabs: true, ...config, sections,
    };
    this._page = null;
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

  /** Set by the sidebar panel on narrow screens: a ☰ button in the tab row opens Home Assistant's sidebar. */
  set menuButton(on) {
    if (this._menu === !!on) return;
    this._menu = !!on;
    if (this._built) this._renderTabs();
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
    if (!this._onPrefs) this._onPrefs = (ev) => { if (ev.detail?.from !== this) this._applyPrefs(ev.detail?.value); };
    window.addEventListener("leapmotor-card-prefs", this._onPrefs);
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
    this._stopReplay();
    // The cut car picture stays in memory until it is released; it is made again when the card returns.
    if (this._pic?.cut && this._pic.shown) URL.revokeObjectURL(this._pic.shown);
    this._pic = null;
    if (this._sigs) this._sigs.hero = null;
    clearInterval(this._tick);
    window.removeEventListener("leapmotor-card-prefs", this._onPrefs);
    if (this._ro) this._ro.disconnect();
  }

  /* ----- i18n & formatting ----- */

  get _lang() {
    const cfg = this._prefs?.language ?? this._config?.language;
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
    const mode = this._prefs?.scene ?? this._config.scene;
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
        this.shadowRoot.innerHTML = `<style>${STYLE}</style><div class="lm look-${this._look} backdrop"><section class="panel"><div class="empty">${icon("car")}<br>${msg}</div></section></div>`;
      }
      return;
    }
    if (!this._built) this._build();
    this._renderTabs();
    for (const name of this._sections) this._renderSection(name, force);
    this._maybeFetchHistory();
    this._loadPrefs();
  }

  /* ----- pages ----- */

  /** Pages with at least one configured section, in their fixed order. */
  /** Pages with at least one configured section, in their fixed order. */
  _contentPages() {
    return PAGES.map((p) => ({ ...p, sections: p.sections.filter((s) => this._config.sections.includes(s)) }))
      .filter((p) => p.sections.length);
  }

  /** The settings tab joins cards that already have tabs (option `settings`). */
  get _hasSettings() {
    return this._config.settings !== false && this._config.tabs !== false && this._contentPages().length > 1;
  }

  _pages() {
    const pages = this._contentPages();
    return this._hasSettings ? [...pages, SETTINGS_PAGE] : pages;
  }

  /** Sections drawn on this card: the configured ones plus the settings page. */
  get _sections() {
    return this._hasSettings ? [...this._config.sections, "settings"] : this._config.sections;
  }

  get _look() {
    const look = this._prefs?.look ?? this._config.look;
    return LOOKS.includes(look) ? look : LOOKS[0];
  }

  get _tabbed() {
    return this._config.tabs !== false && this._contentPages().length > 1;
  }

  /** Only the open page is drawn; the others catch up when they are opened. */
  _visible(name) {
    return !this._tabbed || PAGE_OF[name] === this._page;
  }

  _build() {
    const pages = this._pages();
    if (!pages.some((p) => p.id === this._page)) {
      this._page = (pages.find((p) => p.id === this._config.page) || pages[0])?.id || null;
    }
    const tabbed = this._tabbed;
    const sticky = tabbed && this._config.sticky_tabs;
    const markup = {
      hero: this._look === "classic"
        ? `<section class="panel hero" id="hero"><div class="scene" id="scene"></div><div class="hero-ui" id="heroui"><div class="contents" id="hchips"></div><div class="info" id="hinfo"></div><div class="carzone" id="hcar"></div><div class="stripwrap" id="hstrip"></div></div></section>`
        : `<section class="panel hero" id="hero"><div class="stage" id="scene"></div><div class="hero-ui" id="heroui">` +
          `<div class="h-top" id="htop"></div><div class="h-left" id="hleft"></div><div class="carzone" id="hcar"></div>` +
          `<div class="h-right" id="hright"></div><div class="h-quick" id="hquick"></div><div class="stripwrap" id="hstrip"></div></div></section>`,
      check: `<section class="panel check" id="check"></section>`,
      controls: `<section class="panel controls" id="controls"></section>`,
      map: `<section class="panel map" id="map"><div id="maphead"></div><div class="mapbox" id="mapbox"></div><div id="mapfoot"></div></section>`,
      trips: `<section class="panel trips" id="trips"></section>`,
      week: `<section class="panel week" id="week"></section>`,
      charging: `<section class="panel charge" id="charging"></section>`,
      chart: `<section class="panel chart" id="chart"></section>`,
      energy: `<section class="panel energy" id="energy"></section>`,
      maintenance: `<section class="panel maintenance" id="maintenance"></section>`,
      tires: `<section class="panel tires" id="tires"></section>`,
      insights: `<section class="panel insights" id="insights"></section>`,
      outlook: `<section class="panel outlook" id="outlook"></section>`,
      timeline: `<section class="panel timeline" id="timeline"></section>`,
      routes: `<section class="panel routes" id="routes"></section>`,
      curve: `<section class="panel curve" id="curve"></section>`,
      sessions: `<section class="panel sessions" id="sessions"></section>`,
      software: `<section class="panel software" id="software"></section>`,
      inbox: `<section class="panel inbox" id="inbox"></section>`,
      calendar: `<section class="panel calendar" id="calendar"></section>`,
      records: `<section class="panel records" id="records"></section>`,
      rangelab: `<section class="panel rangelab" id="rangelab"></section>`,
      badges: `<section class="panel badges" id="badges"></section>`,
      settings: `<section class="panel settings" id="settings"></section>`,
    };
    const body = pages.map((p) =>
      `<div class="page pg-${p.id}" id="page-${p.id}" role="${tabbed ? "tabpanel" : "region"}"${tabbed && p.id !== this._page ? " hidden" : ""}>${p.sections.map((s) => markup[s]).join("")}</div>`).join("");
    const cls = ["lm", `look-${this._look}`, this._config.backdrop ? "backdrop" : "", tabbed ? "tabbed" : "", sticky ? "sticky" : ""].filter(Boolean).join(" ");
    this.shadowRoot.innerHTML = `<style>${STYLE}</style><div class="${cls}" id="root">` +
      `${tabbed ? `<nav class="tabs${sticky ? " sticky" : ""}" id="tabs" role="tablist"></nav>` : ""}${body}</div>`;
    this._sigs = {};
    this._built = true;
    const root = this.shadowRoot.getElementById("root");
    root.addEventListener("click", (ev) => this._onClick(ev));
    root.addEventListener("input", (ev) => this._onInput(ev));
    const chart = this.shadowRoot.getElementById("chart");
    if (chart && this._ro) this._ro.observe(chart);
  }

  _renderTabs() {
    const nav = this.shadowRoot.getElementById("tabs");
    if (!nav) return;
    const badges = this._badges();
    const sig = `${this._lang}|${this._page}|${this._menu ? 1 : 0}|${JSON.stringify(badges)}`;
    if (this._sigs.__tabs === sig) return;
    this._sigs.__tabs = sig;
    const pages = this._pages();
    nav.classList.toggle("has-set", this._hasSettings);
    nav.classList.toggle("has-menu", !!this._menu);
    nav.style.setProperty("--n", String(pages.length - (this._hasSettings ? 1 : 0)));
    const menu = this._menu
      ? `<button class="tab menu" aria-label="${esc(this._tr("menu"))}" title="${esc(this._tr("menu"))}" data-act="menu">${icon("menu")}</button>`
      : "";
    nav.innerHTML = menu + pages.map((p) => {
      const b = badges[p.id];
      const on = p.id === this._page;
      return `<button class="tab${on ? " on" : ""}${p.id === "settings" ? " set" : ""}" role="tab" aria-selected="${on}" aria-label="${esc(this._tr(p.label))}" data-act="page" data-page="${p.id}">` +
        `<span class="ti">${icon(p.icon)}${b ? `<i class="tb${b.pulse ? " pulse" : ""}" style="--c:${b.c}"></i>` : ""}</span>` +
        `<span class="tlb">${esc(this._tr(p.label))}</span></button>`;
    }).join("");
  }

  /** A dot on a tab when something on that page needs a look. */
  _badges() {
    const out = {};
    const { charging, plugged } = this._chargeState();
    if (this._issues().length) out.overview = { c: WARN_C };
    if (this._on("isDriving") === true || this._s("vehicleState")?.state === "driving") out.trips = { c: "#38bdf8", pulse: true };
    if (charging) out.charging = { c: OK_C, pulse: true };
    else if (plugged) out.charging = { c: OK_C };
    if (this._on("tireWarning") === true) out.vehicle = { c: BAD_C };
    else if (this._on("maintenanceDue") === true) out.vehicle = { c: WARN_C };
    else if (this._s("software")?.state === "on") out.vehicle = { c: "#38bdf8" };
    if (!out.charging && this._on("slowCharging") === true) out.charging = { c: WARN_C };
    return out;
  }

  _setPage(id) {
    if (!this._tabbed || id === this._page || !this._pages().some((p) => p.id === id)) return;
    this._page = id;
    this._stopReplay();
    for (const p of this._pages()) {
      const el = this.shadowRoot.getElementById(`page-${p.id}`);
      if (el) el.hidden = p.id !== id;
    }
    this._renderTabs();
    for (const name of this._sections) this._renderSection(name);
    requestAnimationFrame(() => {
      if (PAGE_OF.chart === id) this._measureChart();
      if (PAGE_OF.map === id) this.shadowRoot.getElementById("mapbox")?.__fit?.();
    });
    // Keep the tabs in view after switching from far down a long page.
    const root = this.shadowRoot.getElementById("root");
    if (root && root.getBoundingClientRect().top < 0) {
      (this._config.sticky_tabs ? this : this.shadowRoot.getElementById("tabs"))?.scrollIntoView?.({ block: "start" });
    }
  }

  /**
   * Draw one section. Unexpected data in one of them must not stop the
   * others or leave that section blank from then on.
   */
  _renderSection(name, force = false) {
    try {
      this._drawSection(name, force);
    } catch (err) {
      delete this._sigs[name]; // try again with the next update
      if (!this._failed.has(name)) {
        this._failed.add(name);
        console.error(`leapmotor-card: could not draw "${name}"`, err);
      }
      const target = name === "hero" || name === "map" ? null : this.shadowRoot?.getElementById(name);
      if (target && !target.childElementCount) target.innerHTML = `<div class="empty">${esc(this._tr("sectionFailed"))}</div>`;
    }
  }

  _drawSection(name, force = false) {
    const map = {
      hero: () => { this._renderScene(force); return this._heroSig(); },
      check: () => this._checkSig(),
      chart: () => this._chartSig(),
      week: () => this._sig(["week"]),
      charging: () => this._sig(["battery", "chargeLimit", "chargeLimitSet", "isCharging", "isPlugged", "connection", "finish", "remaining", "power", "current", "voltage", "lastCharge", "range", "lastSession", "lastSessionCost", "monthCost", "monthEnergy", "toLimit",
        "chargeSchedule", "preheat", "healthyCharging", "startChargeBtn", "stopChargeBtn", "unlockCharger"])
        + Math.floor(Date.now() / MIN) + `|${this._limitPending ?? ""}|${JSON.stringify(this._armed)}|${JSON.stringify(this._busy)}`,
      energy: () => this._sig(["avg", "lwDriving", "lwClimate", "lwOther", "health", "capacityTrend"]),
      trips: () => this._sig(["lastTrip", "todayDistance", "monthDistance", "tripConsumption", "driveCost"]) + Math.floor(Date.now() / MIN) + `|${this._tripKey(this._mapSelected())}|${this._tripLimit}`,
      map: () => this._mapSig(),
      maintenance: () => this._sig(["nextMaintenance", "maintenanceDue"]) + JSON.stringify(this._armed) + JSON.stringify(this._busy),
      tires: () => this._sig(["tireFL", "tireFR", "tireRL", "tireRR", "tireWarning"]),
      insights: () => this._sig(["driveCost", "costPer100", "drain", "tripConsumption", "tireWarning", "lastTrip"]),
      controls: () => this._controlsSig(),
      outlook: () => this._sig(["nextDay", "nextDeparture", "realRange", "chargeAdvice", "battery", "chargeLimit"]) + Math.floor(Date.now() / MIN),
      timeline: () => `${this._hist?.fetchedAt || 0}|${this._histLoading ? 1 : 0}|${this._tlLimit}`,
      routes: () => this._sig(["routes", "driveCost"]),
      curve: () => this._sig(["curve", "slowCharging", "power", "isCharging"]),
      sessions: () => this._sig(["cloudCharging", "monthCost"]) + `|${this._sessLimit}`,
      software: () => this._sig(["software", "softwareVersion", "nextSchedule", "permissions"]),
      inbox: () => this._sig(["inbox"]) + `|${this._inboxLimit}|${Math.floor(Date.now() / (10 * MIN))}`,
      calendar: () => this._sig(["yearDistance"]),
      records: () => this._sig(["yearDistance", "fuelSavingsTotal", "fuelSavings", "co2Total", "co2Month", "fuelAvoided", "lifetimeConsumption"]),
      rangelab: () => this._sig(["realRange", "outdoor", "battery", "batteryPrecise", "avg", "lifetimeConsumption", "availableEnergy", "lastTrip"]),
      badges: () => this._sig(["achievements"]),
      settings: () => `${JSON.stringify(this._prefs || {})}|${this._prefsWhere || ""}|${this._look}|${this._config.look}|${this._config.language}|${this._config.scene}`,
    };
    const html = {
      check: () => this._checkHtml(),
      chart: () => this._chartHtml(),
      week: () => this._weekHtml(),
      trips: () => this._tripsHtml(),
      maintenance: () => this._maintenanceHtml(),
      insights: () => this._insightsHtml(),
      charging: () => this._chargingHtml(),
      energy: () => this._energyHtml(),
      tires: () => this._tiresHtml(),
      controls: () => this._controlsHtml(),
      outlook: () => this._outlookHtml(),
      timeline: () => this._timelineHtml(),
      routes: () => this._routesHtml(),
      curve: () => this._curveHtml(),
      sessions: () => this._sessionsHtml(),
      software: () => this._softwareHtml(),
      inbox: () => this._inboxHtml(),
      calendar: () => this._calendarHtml(),
      records: () => this._recordsHtml(),
      rangelab: () => this._rangelabHtml(),
      badges: () => this._badgesHtml(),
      settings: () => this._settingsHtml(),
    };
    const target = this.shadowRoot.getElementById(name === "hero" ? "heroui" : name);
    if (!target || !map[name]) return;
    if (!this._visible(name)) {
      delete this._sigs[name];
      return;
    }
    const sig = `${this._lang}|${map[name]()}`;
    // Only the chart is redrawn on force (resize, new history); everything else is signature-driven.
    if (this._sigs[name] === sig && !(force && name === "chart")) return;
    this._sigs[name] = sig;
    if (name === "hero") {
      for (const [id, part] of Object.entries(this._heroHtml())) this._patch(id, part);
      this.shadowRoot.getElementById("hero")?.classList.toggle("charging", this._chargeState().charging);
      return;
    }
    if (name === "map") {
      for (const [id, part] of Object.entries(this._mapHtml())) this._patch(id, part);
      this._syncMap();
      return;
    }
    if (name === "rangelab") {
      // New data must not replace a slider the user is holding: refresh what the sliders produce.
      const out = target.querySelector("#rlout");
      if (out && !this._labFull && target.dataset.lang === this._lang && this._labResult()) {
        out.innerHTML = this._labOutHtml();
        const chart = target.querySelector("#rlchart");
        if (chart) chart.innerHTML = this._labChartHtml();
        return;
      }
      this._labFull = false;
      target.dataset.lang = this._lang;
    }
    target.innerHTML = html[name]();
    if (name === "chart" && !this._chartSize.w) this._measureChart();
  }

  /** Panel title with an icon and optional right-hand content. */
  _head(title, ic, right = "") {
    return `<div class="ptitle"><h3>${ic ? icon(ic) : ""}${esc(title)}</h3>${right}</div>`;
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

  /** Option `scene`: the day or night sky (classic), or a day or night display like the car's own screens. */
  _renderScene() {
    const hero = this.shadowRoot.getElementById("hero");
    if (!hero) return;
    const mode = this._sceneMode();
    if (this._sigs.__scene === mode) return;
    this._sigs.__scene = mode;
    hero.classList.toggle("day", mode === "day");
    hero.classList.toggle("night", mode !== "day");
    if (this._look === "classic") this.shadowRoot.getElementById("scene").innerHTML = sceneSvg(mode);
  }

  _heroSig() {
    return [
      this._sig(["battery", "batteryPrecise", "range", "lock", "isCharging", "isPlugged", "connection", "isDriving", "speed", "gear",
        "interior", "outdoor", "odometer", "chargeLimit", "avg", "lastUpdate", "tracker", "picture", "remaining", "vehicleState", "fuel", "power", "finish", "realRange"]),
      this._sig(DOORS.map(([k]) => k)), this._sig(WINDOWS), this._sig(["trunk"]),
      this._sig(["speeding", "speedLimit", "speedLimitOn", "climateOn", "climateMode", "climateSwitch", "sentry"]), this._sig(TIRES.map(([k]) => k)),
      this._sceneMode(), Math.floor(Date.now() / MIN), JSON.stringify(this._armed), JSON.stringify(this._busy),
      this._sig(["quickHeatBtn", "quickCoolBtn", "windowsOpenBtn", "windowsCloseBtn"]),
    ].join("#");
  }

  /** Values both hero looks show. */
  _heroData() {
    const precise = this._v("batteryPrecise");
    const soc = precise ?? this._v("battery");
    const lock = this._s("lock");
    const { charging, plugged, finished } = this._chargeState();
    const driving = this._on("isDriving") === true || this._s("vehicleState")?.state === "driving";
    const gear = String(this._s("gear")?.state || "").toUpperCase();
    return {
      soc, socTxt: soc == null ? "—" : precise != null ? this._num(precise, 1) : this._num(soc, 0),
      locked: lock ? lock.state === "locked" : null,
      charging, plugged, finished, driving,
      gear: GEARS.includes(gear) ? gear : driving ? "D" : "P",
      range: this._v("range"), rangeU: this._unit("range", "km"),
      limit: this._v("chargeLimit"),
      upd: this._ts("lastUpdate"),
      loc: this._location(),
      speed: this._v("speed"), speedU: this._unit("speed", "km/h"),
      speedLimit: this._speedLimit(),
      speeding: this._on("speeding") === true,
      night: this._sceneMode() === "night",
    };
  }

  _heroHtml() {
    if (this._look === "classic") return this._heroClassic();
    const d = this._heroData();
    return this._look === "console" ? this._heroConsole(d) : this._heroCluster(d);
  }

  /** A translated string whose {x} is filled with markup. */
  _trHtml(key, html) {
    const [pre, post = ""] = esc(this._tr(key, { x: "\u0001" })).split("\u0001");
    return `${pre}${html}${post}`;
  }

  _refreshHtml() {
    return this._ids.refreshBtn
      ? `<button class="btn-amber refresh${this._busy.refresh ? " spin" : ""}" data-act="refresh">${icon("refresh")}${esc(this._tr("refresh"))}</button>`
      : "";
  }

  _idHtml(sub) {
    return `<div class="idb"><h2>${esc(this._vehicleName())}</h2>${sub ? `<div class="sub">${sub}</div>` : ""}</div>`;
  }

  /** The car (official render or drawing) with its state overlays, wallbox and cable. */
  _heroCarHtml(d, { tireTags = false, floor = false } = {}) {
    const picUrl = this._carPicture();
    const carArt = picUrl
      ? `<img src="${esc(picUrl)}" alt="${esc(this._vehicleName())}"${this._config.image_flip ? ' class="flip"' : ""}>`
      : carSvg(d.night);
    const fx = this._carFx({ charging: d.charging, plugged: d.plugged, night: d.night, driving: d.driving, locked: d.locked }, { tirePins: !tireTags });
    // The wallbox and cable belong to the picture box, so they stay with the car whatever its width.
    const plug = d.plugged ? this._plugHtml(d.charging, picUrl ? this._pic?.attach : null) : "";
    const carInner = `<div class="carbox${picUrl ? "" : " svgcar"}">${plug}${carArt}${fx}${tireTags ? this._tireTagsHtml() : ""}</div>`;
    return `${floor ? floorSvg() : ""}<div class="car${d.charging ? " charging" : ""}${d.plugged ? " plugged" : ""}">${carInner}</div>`;
  }

  /**
   * Wallbox and charging cable. With a known attach point (from the car
   * picture) the cable ends on the car's body and a connector marks the spot;
   * otherwise it uses the geometry of the built-in drawing.
   */
  _plugHtml(charging, attach) {
    const led = charging ? "#34d399" : "#f6a823";
    let cableStyle = "", dot = "";
    if (attach) {
      // The path ends at 96 % of the cable's width and 68.75 % of its height (viewBox 100 × 96, end point 96 30).
      const x = attach.x * 100, y = attach.y * 100;
      cableStyle = `;width:calc((${f1(x)}% + 30px) / 0.96);height:${f1(Math.max(12, (y - 6) / 0.6875))}%`;
      dot = `<span class="plugdot" style="--c:${led};left:calc(${f1(x)}% + 8px);bottom:${f1(y)}%"></span>`;
    }
    return `<div class="wallbox" style="--c:${led}"><i></i></div>` +
      `<svg class="cable${charging ? "" : " idle"}" style="--c:${led}${cableStyle}" viewBox="0 0 100 96" preserveAspectRatio="none">` +
      `<path d="M8 50C14 98 70 102 96 30" vector-effect="non-scaling-stroke"/></svg>${dot}`;
  }

  /** Pressures at the wheels (left · right per axle); the car faces right. */
  _tireTagsHtml() {
    const one = (v) => v == null ? "—" : `<span${v < TIRE_LOW_BAR ? ' class="low"' : ""}>${this._num(v, 1)}</span>`;
    const tag = (x, l, r) => {
      const a = this._v(l), b = this._v(r);
      if (a == null && b == null) return "";
      const bad = [a, b].some((v) => v != null && v < TIRE_LOW_BAR);
      return `<span class="tpres${bad ? " bad" : ""}" style="left:${x}%" data-more="${l}">${one(a)}<small>·</small>${one(b)}<small>bar</small></span>`;
    };
    return tag(25, "tireRL", "tireRR") + tag(76, "tireFL", "tireFR");
  }

  /** Read-outs under the car: [label, value, unit, entity key, icon]. */
  _cellsHtml(cells) {
    const out = cells.filter((c) => c && c[1] != null).map(([label, value, unit, key, ic]) =>
      `<div class="cell${key ? " clickable" : ""}"${key ? ` data-more="${key}"` : ""}><span class="ci">${icon(ic)}</span>` +
      `<div class="cx"><div class="l">${esc(label)}</div><div class="v">${value}${unit ? `<small>${esc(unit)}</small>` : ""}</div></div></div>`);
    return out.length ? `<div class="strip">${out.join("")}</div>` : "";
  }

  _commonCells() {
    const t = (k) => this._tr(k);
    const odo = this._v("odometer");
    const today = this._v("todayDistance");
    const avg = this._v("avg");
    const out = this._v("outdoor");
    const inn = this._v("interior");
    const fuel = this._v("fuel");
    return [
      [t("odometer"), odo != null ? this._num(odo) : null, this._unit("odometer", "km"), "odometer", "road"],
      [t("todayL"), today != null ? this._num(today, 1) : null, this._unit("todayDistance", "km"), "todayDistance", "route"],
      fuel != null ? [t("fuel"), this._num(fuel), "%", "fuel", "fuel"] : null,
      [t("consumption"), avg != null ? this._num(avg, 1) : null, "kWh/100", "avg", "leaf"],
      [t("outside"), out != null ? this._num(out, 1) : null, "°C", "outdoor", "thermo"],
      [t("interior"), inn != null ? this._num(inn, 1) : null, "°C", "interior", "fan"],
    ];
  }

  /**
   * Warning lights as in the instrument cluster: dark when there is nothing to
   * report, lit in green (active), blue (info), amber (look) or red (problem).
   */
  _telltalesHtml(d) {
    const t = (k, v) => this._tr(k, v);
    const out = [];
    const add = (ic, c, title, more, pulse = false) => {
      if (!more || !this._ids[more]) return;
      out.push(`<button class="tell${c ? " on" : ""}${pulse ? " pulse" : ""}"${c ? ` style="--c:${c}"` : ""} data-more="${more}" title="${esc(title)}" aria-label="${esc(title)}">${icon(ic)}</button>`);
    };
    if (d.locked != null) add(d.locked ? "lock" : "unlock", d.locked ? OK_C : WARN_C, d.locked ? t("locked") : t("unlocked"), "lock");
    const doors = DOORS.filter(([k]) => this._s(k));
    const openD = doors.filter(([k]) => this._on(k));
    if (doors.length) {
      add("door", openD.length ? WARN_C : null,
        openD.length ? t("doorsOpen", { n: openD.length === 1 ? t(openD[0][1]) : openD.length }) : t("doorsClosed"), (openD[0] || doors[0])[0]);
    }
    if (this._s("trunk")) add("trunk", this._on("trunk") ? WARN_C : null, this._on("trunk") ? t("trunkOpen") : t("trunkClosed"), "trunk");
    const wins = WINDOWS.filter((k) => this._s(k));
    const openW = wins.filter((k) => this._on(k));
    if (wins.length) add("window", openW.length ? WARN_C : null, openW.length ? t("windowsOpen", { n: openW.length }) : t("windowsClosed"), openW[0] || wins[0]);
    const tires = this._tireRange();
    if (tires) {
      const low = tires.lo < TIRE_LOW_BAR;
      add("tire", low ? BAD_C : null, `${low ? t("tiresWarn") : t("tiresOkShort")} · ${tires.text}`, TIRES[0][0], low);
    }
    const plugKey = ["connection", "isPlugged", "isCharging"].find((k) => this._ids[k]);
    add("plug", d.charging ? OK_C : d.plugged ? "#38bdf8" : null,
      d.charging ? t("charging") : d.finished ? t("finished") : d.plugged ? t("pluggedIn") : t("unplugged"), plugKey, d.charging);
    const climKey = ["climateOn", "climateSwitch"].find((k) => this._ids[k]);
    const clim = this._on("climateOn") === true || this._s("climateSwitch")?.state === "on";
    add("fan", clim ? "#38bdf8" : null, `${t("climate")} · ${clim ? t("on") : t("off")}`, climKey);
    const sentry = this._s("sentry")?.state === "on";
    add("cctv", sentry ? "#f472b6" : null, `${t("sentry")} · ${sentry ? t("on") : t("off")}`, "sentry", sentry);
    return out.length ? `<div class="tells" role="group">${out.join("")}</div>` : "";
  }

  /* Driver display: battery gauge | car on the floor | speed or charging gauge. */
  _heroCluster(d) {
    const t = (k, v) => this._tr(k, v);
    const socC = d.charging ? OK_C : d.soc != null && d.soc < 20 ? BAD_C : WARN_C;
    const left = `
      <div class="gauge clickable" data-more="battery" style="--c:${socC}">
        ${gaugeSvg({ frac: (d.soc ?? 0) / 100, color: socC, mark: d.limit != null ? d.limit / 100 : null, flow: d.charging })}
        <div class="gin"><div class="gv">${d.socTxt}<small>%</small></div>${d.range != null ? `<div class="gs">${this._num(d.range)} ${esc(d.rangeU)}</div>` : ""}</div>
      </div>
      <div class="glab">${esc(t("tabBattery"))}${d.limit != null ? ` · ${this._trHtml("limitWord", `<b>${this._num(d.limit)} %</b>`)}` : ""}</div>`;

    let right;
    if (d.charging) {
      const p = this._v("power");
      const max = p == null || p <= 11.5 ? 11 : p <= 22.5 ? 22 : 150;
      const rem = this._v("remaining");
      const fin = this._ts("finish");
      right = `
        <div class="gauge clickable" data-more="power" style="--c:${OK_C}">
          ${gaugeSvg({ frac: (p ?? 0) / max, color: OK_C, flow: true })}
          <div class="gin"><div class="gv">${p != null ? this._num(p, 1) : "—"}<small>kW</small></div>${rem != null ? `<div class="gs">${esc(t("left", { x: this._dur(rem) }))}</div>` : ""}</div>
          ${fin ? `<div class="gbot"><span class="glab">${esc(t("doneAt", { x: this._time(new Date(fin)) }))}</span></div>` : ""}
        </div>
        <div class="glab">${esc(t("chargingTitle"))}</div>`;
    } else {
      const lim = d.speedLimit?.kmh;
      const spd = d.speed ?? 0;
      const max = Math.max(160, lim ? Math.ceil((lim * 1.4) / 20) * 20 : 0);
      const over = d.driving && (d.speeding || (lim && spd > lim));
      const c = over ? BAD_C : "#38bdf8";
      const sign = lim ? `<span class="lsign${over ? " over" : ""} clickable" data-more="${d.speedLimit.source === "vehicle" ? "speedLimit" : "speeding"}" title="${esc(t("speedLimit"))}">${this._num(lim)}</span>` : "";
      const prnd = `<span class="prnd">${GEARS.map((g) => `<b${g === d.gear ? ' class="on"' : ""}>${g}</b>`).join("")}</span>`;
      const center = d.driving
        ? `<div class="gv">${this._num(spd)}<small>${esc(d.speedU)}</small></div>`
        : `<div class="gv">${d.gear}</div>`;
      right = `
        <div class="gauge clickable" data-more="${this._ids.speed ? "speed" : "gear"}" style="--c:${c}">
          ${gaugeSvg({ frac: d.driving ? spd / max : 0, color: c, mark: lim ? lim / max : null })}
          <div class="gin">${center}</div>
          <div class="gbot">${d.driving ? prnd : ""}${sign}</div>
        </div>
        <div class="glab">${esc(over ? t("tooFast", { x: `${this._num(spd)} ${d.speedU}` }) : d.driving ? t("speed") : t("parked"))}</div>`;
    }

    const sub = d.loc ? `${icon("pin")}${esc(d.loc)}` : "";
    const cells = this._commonCells();
    return {
      htop: this._idHtml(sub) + this._telltalesHtml(d) +
        (d.upd ? `<span class="upd">${esc(t("updated", { x: this._ago(d.upd) }))}</span>` : "") + this._refreshHtml(),
      hleft: left,
      hcar: this._heroCarHtml(d, { floor: true }),
      hright: right,
      hquick: this._quickHtml(),
      hstrip: this._cellsHtml(cells),
    };
  }

  /* Car app: range and a battery bar, the car on a studio floor, round buttons. */
  _heroConsole(d) {
    const t = (k, v) => this._tr(k, v);
    const fill = d.charging ? "on" : d.soc != null && d.soc < 20 ? "low" : "";
    const chips = [];
    const chip = (ic, text, c, more, hot = false) =>
      chips.push(`<span class="schip${hot ? " hot" : ""}${more ? " clickable" : ""}" style="--c:${c}"${more ? ` data-more="${more}"` : ""}>${icon(ic)}${esc(text)}</span>`);
    if (d.locked != null) chip(d.locked ? "lock" : "unlock", d.locked ? t("locked") : t("unlocked"), d.locked ? OK_C : WARN_C, "lock", !d.locked);
    if (d.charging) {
      const rem = this._v("remaining");
      chip("bolt", rem != null ? `${t("charging")} · ${this._dur(rem)}` : `${t("charging")} · ${this._num(this._v("power"), 1)} kW`, OK_C, "power", true);
    } else if (d.driving && d.speeding && d.speed != null) {
      chip("gauge", t("tooFast", { x: `${this._num(d.speed)} ${d.speedU}` }), BAD_C, "speeding", true);
    } else if (d.driving) {
      chip("gauge", d.speed != null ? `${t("driving")} · ${this._num(d.speed)} ${d.speedU}` : t("driving"), "#38bdf8", "speed", true);
    } else if (d.plugged) {
      chip("plug", d.finished ? t("finished") : t("pluggedIn"), "#38bdf8", ["connection", "isPlugged"].find((k) => this._ids[k]));
    } else {
      chip("parked", t("parked"), "#94a3b8", this._ids.vehicleState ? "vehicleState" : null);
    }
    const other = this._issues().filter((x) => x !== t("unlocked"));
    if (other.length) chip("alert", other.length > 1 ? `${other[0]} +${other.length - 1}` : other[0], WARN_C, null, true);
    const inside = this._v("interior");
    const clim = this._on("climateOn") === true || this._s("climateSwitch")?.state === "on";
    if (inside != null || clim) {
      chip("thermo", `${t("insideChip")} ${inside != null ? `${this._num(inside, 1)} °C` : ""}${clim ? ` · ${t("climate")}` : ""}`.trim(), "#38bdf8", inside != null ? "interior" : "climateOn", clim);
    }
    if (d.driving && d.speedLimit) chip("sign", `${t("speedLimit")} ${this._num(d.speedLimit.kmh)} km/h`, BAD_C, d.speedLimit.source === "vehicle" ? "speedLimit" : "speeding");
    if (this._s("sentry")?.state === "on") chip("cctv", t("sentryOn"), "#f472b6", "sentry", true);

    const note = [];
    if (d.limit != null) note.push(this._trHtml("limitWord", `<b>${this._num(d.limit)} %</b>`));
    const fin = d.charging ? this._ts("finish") : null;
    if (fin) note.push(esc(t("doneAt", { x: this._time(new Date(fin)) })));
    const real = this._v("realRange");
    if (real != null && !fin) note.push(esc(t("realShort", { x: `${this._num(real)} km` })));
    const lim = d.limit != null ? `<span class="blim" style="left:calc((100% - 7px) * ${clamp(d.limit, 0, 100) / 100})"></span>` : "";
    const left = `
      <div class="rbox">
        <div class="lbl">${esc(t("range"))}</div>
        <div class="rng clickable" data-more="${this._ids.range ? "range" : "battery"}">${d.range != null ? this._num(d.range) : "—"}<small>${esc(d.rangeU)}</small></div>
        <div class="batt clickable" data-more="battery">
          <div class="bwrap"><div class="bseg"><i class="${fill}" style="width:${clamp(d.soc ?? 0, 0, 100)}%"></i></div>${lim}</div>
          <b>${d.socTxt}<small>%</small></b>
        </div>
        ${note.length ? `<div class="bnote">${note.join(" · ")}</div>` : ""}
        <div class="schips">${chips.join("")}</div>
      </div>`;

    const sub = [d.loc ? `${icon("pin")}${esc(d.loc)}` : "", d.upd ? esc(t("updated", { x: this._ago(d.upd) })) : ""].filter(Boolean).join(" · ");
    const cells = this._commonCells().filter((c) => !c || c[3] !== "interior");
    return {
      htop: this._idHtml(sub) + this._refreshHtml(),
      hleft: left,
      hcar: this._heroCarHtml(d, { tireTags: true }),
      hright: "",
      hquick: this._quickHtml(),
      hstrip: this._cellsHtml(cells),
    };
  }

  /* Classic: the original night or day sky scene with the big battery figure. */
  _heroClassic() {
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
    const realKm = this._v("realRange");
    if (realKm != null) meta.push(`<span>${esc(t("realShort", { x: `${this._num(realKm)} km` }))}</span>`);
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
    } else if (driving && this._on("speeding") === true && this._v("speed") != null) {
      cText = t("tooFast", { x: `${this._num(this._v("speed"))} ${this._unit("speed", "km/h")}` });
      cColor = "var(--lm-red)";
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
    const speedLimit = this._speedLimit();
    if (speedLimit) cell(t("speedLimit"), this._num(speedLimit.kmh), "km/h", speedLimit.source === "vehicle" ? "speedLimit" : "speeding");
    const avg = this._v("avg");
    cell(t("consumption"), avg != null ? this._num(avg, 1) : null, "kWh/100", "avg");
    if (upd) {
      const mins = (Date.now() - upd) / MIN;
      cell(t("lastUpdate"), mins < 60 ? this._num(Math.max(0, Math.round(mins))) : mins < 1440 ? this._num(mins / 60, 1) : this._num(mins / 1440, 1),
        mins < 60 ? "min" : mins < 1440 ? "h" : "d", "lastUpdate");
    }

    const night = this._sceneMode() === "night";

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
        <div class="metaline">${meta.join("")}</div>${this._quickHtml()}`,
      hcar: this._heroCarHtml({ charging, plugged, night, driving, locked }),
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
    const custom = this._config.image || null;
    const pic = custom || !this._config.show_image ? null : this._s("picture");
    const url = custom || (pic && !["unavailable", "unknown"].includes(pic.state) ? pic.attributes?.entity_picture : null);
    const p = this._pic || (this._pic = { shown: null, pending: null, key: null, pendingKey: null, attach: null, cut: false });
    if (!url) {
      if (p.cut && p.shown) URL.revokeObjectURL(p.shown);
      p.shown = null;
      p.cut = false;
      p.key = null;
      p.attach = null;
      p.pending = null;
      p.pendingKey = null;
      return null;
    }
    // The picture itself only changes with the entity's state; the address
    // carries a token that rotates every few minutes.
    const key = `${custom ? url : `${pic.entity_id}|${pic.state}`}|${this._config.image_flip ? 1 : 0}`;
    const stale = key !== p.key || (!p.cut && url !== p.shown);
    if (stale && url !== p.pending) {
      p.pending = url;
      p.pendingKey = key;
      const img = new Image();
      img.onload = async () => {
        if (p.pending !== url) return;
        let result = null;
        if (key !== p.key || !p.cut) {
          try {
            result = await trimCarPicture(img, !!this._config.image_flip);
          } catch (_e) {
            result = null; // not readable: show the picture as it is
          }
        }
        if (p.pending !== url) {
          if (result?.url) URL.revokeObjectURL(result.url);
          return;
        }
        if (p.cut && p.shown && p.shown !== result?.url) URL.revokeObjectURL(p.shown);
        p.shown = result?.url || url;
        p.cut = !!result?.url;
        p.attach = result?.attach || null;
        p.key = key;
        p.pending = null;
        p.pendingKey = null;
        this._sigs.hero = null;
        this._renderSection("hero");
      };
      img.onerror = () => {
        if (p.pending === url) {
          p.pending = null;
          p.pendingKey = null;
        }
      };
      img.src = url;
    }
    return p.shown;
  }

  /* ----- vehicle check ----- */

  _checkSig() {
    return [this._sig(["lock", "trunk", "battery", "lastUpdate"]), this._sig(DOORS.map(([k]) => k)),
      this._sig(WINDOWS), this._sig(TIRES.map(([k]) => k)), Math.floor(Date.now() / MIN)].join("#");
  }

  /** "2.1 bar" or "2.1–2.4 bar" from the four tire pressures (null without readings). */
  _tireRange() {
    const tv = TIRES.map(([k]) => this._v(k)).filter((v) => v != null);
    if (!tv.length) return null;
    const lo = Math.min(...tv), hi = Math.max(...tv);
    const a = this._num(lo, 1), b = this._num(hi, 1);
    return { lo, hi, text: a === b ? `${a} bar` : `${a}–${b} bar` };
  }

  /**
   * Status at a glance: one summary line and a tile per item. Lock/unlock
   * lives in the hero's quick buttons and Find car in the remote controls,
   * so this panel has no buttons of its own.
   */
  _checkHtml() {
    const t = (k, v) => this._tr(k, v);
    const tiles = [];
    const tile = (o) => tiles.push(o);

    const lock = this._s("lock");
    if (lock) {
      const ok = lock.state === "locked";
      tile({ i: ok ? "lock" : "unlock", title: ok ? t("locked") : t("unlocked"), sub: t("subLock"), st: ok ? "ok" : "warn", more: "lock" });
    }
    const doorKeys = DOORS.filter(([k]) => this._s(k));
    if (doorKeys.length) {
      const open = doorKeys.filter(([k]) => this._on(k));
      tile({ i: "door", title: open.length ? t("doorsOpen", { n: open.length }) : t("doorsClosed"),
        sub: open.length ? open.map(([, l]) => t(l)).join(", ") : t("subDoors"), st: open.length ? "warn" : "ok", more: (open[0] || doorKeys[0])[0] });
    }
    const winKeys = WINDOWS.filter((k) => this._s(k));
    if (winKeys.length) {
      const open = winKeys.filter((k) => this._on(k));
      tile({ i: "window", title: open.length ? t("windowsOpen", { n: open.length }) : t("windowsClosed"), sub: t("subWindows"),
        st: open.length ? "warn" : "ok", more: open[0] || winKeys[0] });
    }
    if (this._s("trunk")) {
      const open = this._on("trunk");
      tile({ i: "trunk", title: open ? t("trunkOpen") : t("trunkClosed"), sub: t("subTrunk"), st: open ? "warn" : "ok", more: "trunk" });
    }
    const tires = this._tireRange();
    if (tires) {
      const ok = tires.lo >= TIRE_LOW_BAR;
      const low = TIRES.filter(([k]) => { const v = this._v(k); return v != null && v < TIRE_LOW_BAR; }).map(([, l]) => t(l));
      tile({ i: "tire", title: ok ? t("tiresOkShort") : t("tiresWarn"), sub: ok ? tires.text : `${low.join(", ")} · ${tires.text}`,
        st: ok ? "ok" : "bad", more: TIRES[0][0] });
    }
    const soc = this._v("battery");
    if (soc != null && soc < 20) {
      tile({ i: "battery", title: t("batteryLevel", { x: `${this._num(soc)} %` }), sub: t("subBattery"), st: "bad", more: "battery" });
    }
    const upd = this._ts("lastUpdate");
    if (upd) {
      const mins = (Date.now() - upd) / MIN;
      const fresh = mins < STALE_MINUTES;
      tile({ i: "cloud", title: fresh ? t("updatedAgo", { x: this._ago(upd) }) : t("stale", { x: this._dur(mins) }),
        sub: t("subData"), st: fresh ? "ok" : "warn", more: "lastUpdate" });
    }

    const issues = this._issues();
    const summary = issues.length
      ? `<div class="summary warn"><div class="sq">${icon("alert")}</div><div><b>${esc(t("attention"))}</b><span>${esc(issues.join(" · "))}</span></div></div>`
      : `<div class="summary"><div class="sq">${icon("check")}</div><div><b>${esc(t("allSecure"))}</b><span>${esc(t("allSecureSub"))}</span></div></div>`;
    const color = { ok: OK_C, warn: WARN_C, bad: BAD_C };

    return `
      ${this._head(t("check"), "check", `<span class="meta">${esc(t("cloudStatus"))}</span>`)}
      ${summary}
      <div class="ctiles">${tiles.map((r) => `
        <div class="ctile clickable${r.st === "ok" ? "" : ` ${r.st}`}" style="--c:${color[r.st]}" data-more="${r.more}">
          <span class="sq">${icon(r.i)}</span>
          <div><b>${esc(r.title)}</b><small>${esc(r.sub)}</small></div>
        </div>`).join("")}</div>
      <div class="foot">${esc(t("footnote"))}</div>`;
  }

  /* ----- 24 h chart ----- */

  _chartSig() {
    return `${this._tab}|${this._hist?.fetchedAt || 0}|${this._chartSize.w}x${this._chartSize.h}|${this._histLoading ? 1 : 0}`;
  }

  _maybeFetchHistory() {
    if (!["chart", "timeline"].some((name) => this._config.sections.includes(name)) || this._histLoading) return;
    if (typeof this._hass.callWS !== "function") return;
    const bat = this._s("battery");
    const stamp = bat ? bat.last_updated : "";
    const age = this._hist ? Date.now() - this._hist.fetchedAt : Infinity;
    if (age < 10 * MIN && (this._hist?.stamp === stamp || age < MIN)) return;
    this._fetchHistory(stamp);
  }

  async _fetchHistory(stamp) {
    this._histLoading = true;
    const keys = ["battery", "range", "power", "odometer", "isCharging", "isDriving", "isPlugged", "lock"];
    const flags = new Set(["isCharging", "isDriving", "isPlugged"]);
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
          const value = flags.has(key) ? (s === "on" ? true : s === "off" ? false : null)
            : key === "lock" ? (s === "locked" || s === "unlocked" ? s : null) : parseFloat(s);
          return [time, value];
        }).filter(([, v]) => typeof v === "boolean" || typeof v === "string" || (typeof v === "number" && isFinite(v)));
      }
    } catch (_e) {
      // Recorder disabled or websocket unavailable: show the empty state.
    }
    this._hist = { fetchedAt: Date.now(), stamp, start: start.getTime(), end: end.getTime(), series };
    this._histLoading = false;
    this._renderSection("chart", true);
    this._renderSection("timeline");
  }

  _chartHtml() {
    const t = (k, v) => this._tr(k, v);
    const tabs = [["battery", t("tabBattery")], ["range", t("tabRange")], ["power", t("tabPower")]]
      .filter(([k]) => this._ids[k]);
    if (!tabs.find(([k]) => k === this._tab) && tabs.length) this._tab = tabs[0][0];
    const head = this._head(t("last24"), "gauge", `<div class="seg">${tabs.map(([k, l]) =>
      `<button class="${k === this._tab ? "on" : ""}" data-act="tab" data-tab="${k}">${esc(l)}</button>`).join("")}</div>`);

    const h = this._hist;
    const series = h?.series?.[this._tab] || [];
    if (!h || series.length === 0) {
      return `${head}<div class="note"><span class="dot" style="--c:var(--lm-sky)"></span>${esc(h ? t("noHistory") : "…")}</div><div class="chartbox" id="chartbox"></div>`;
    }

    // Charged = rises in battery while the car was charging (small upticks
    // while parked, e.g. after the pack warms up, are not charging).
    const bat = h.series.battery || [];
    const chg = h.series.isCharging || [];
    const chargingAt = (ts) => (chg.length ? valueAt(chg, ts) === true : null);
    let charged = 0;
    for (let i = 1; i < bat.length; i++) {
      const diff = bat[i][1] - bat[i - 1][1];
      if (diff <= 0) continue;
      const c = chargingAt(bat[i][0]) || chargingAt(bat[i - 1][0]);
      if (c === null ? diff >= 2 : c) charged += diff;
    }
    const odo = h.series.odometer || [];
    const driven = odo.length > 1 ? Math.max(0, odo[odo.length - 1][1] - odo[0][1]) : 0;
    const unit = this._tab === "battery" ? "%" : this._tab === "range" ? this._unit("range", "km") : "kW";
    const fmtV = (v) => (this._tab === "power" ? this._num(v, 1) : this._num(v));
    const vals = series.map(([, v]) => v);
    const maxV = Math.max(...vals), minV = Math.min(...vals);
    const tMax = series.find(([, v]) => v === maxV)[0], tMin = series.find(([, v]) => v === minV)[0];
    const cur = series[series.length - 1][1];
    const first = valueAt(series, h.start);

    // Headline: the value now and how it moved over the day.
    let delta = "";
    if (this._tab !== "power" && first != null) {
      const d = cur - first;
      const txt = `${d > 0 ? "+" : d < 0 ? "−" : "±"}${fmtV(Math.abs(d))} ${unit}`;
      delta = `<span class="delta ${d >= 1 ? "up" : d <= -1 ? "down" : ""}">${esc(t("delta24", { x: txt }))}</span>`;
    }
    const facts = [];
    if (driven >= 1) facts.push(`<span>${esc(t("drivenL"))} <b>${this._num(driven)} ${esc(this._unit("odometer", "km"))}</b></span>`);
    if (charged >= 1) facts.push(`<span>${esc(t("chargedL"))} <b>+${this._num(charged)} %</b></span>`);
    if (maxV !== minV) {
      const peak = { max: `${fmtV(maxV)} ${unit}`, tmax: this._time(new Date(tMax)), min: `${fmtV(minV)} ${unit}`, tmin: this._time(new Date(tMin)) };
      facts.push(`<span>${esc(this._tab === "power" ? t("peakOnly", peak) : t("peakLow", peak))}</span>`);
    } else if (!facts.length) {
      facts.push(`<span>${esc(t("sumNoChange"))}</span>`);
    }
    const headline = `<div class="now24"><span class="cur">${fmtV(cur)}<span>${esc(unit)}</span></span>${delta}</div><div class="sum24">${facts.join("")}</div>`;

    // Geometry (drawn at the box's real pixel size, so text is never scaled)
    const W = Math.max(260, this._chartSize.w || 560);
    const H = Math.max(200, this._chartSize.h || 240);
    const padL = 44, padR = 14, padT = 12, padB = 46;
    const plotB = H - padB;
    const x = (ts) => padL + ((ts - h.start) / (h.end - h.start)) * (W - padL - padR);
    let lo, hi, step;
    if (this._tab === "battery") {
      lo = Math.max(0, Math.floor((minV - 6) / 10) * 10);
      hi = Math.min(100, Math.ceil((maxV + 6) / 10) * 10);
    } else if (this._tab === "range") {
      lo = Math.max(0, Math.floor((minV - 20) / 50) * 50);
      hi = Math.ceil((maxV + 20) / 50) * 50;
    } else {
      lo = 0;
      hi = Math.max(4, Math.ceil(maxV * 1.15));
    }
    if (hi <= lo) hi = lo + 1;
    const y = (v) => padT + (1 - (v - lo) / (hi - lo)) * (plotB - padT);

    // Resample the step series into a smooth curve (every 15 min).
    const N = 96;
    const pts = [];
    for (let i = 0; i <= N; i++) {
      const ts = h.start + (i / N) * (h.end - h.start);
      const v = valueAt(series, ts);
      if (v != null) pts.push([x(ts), y(v)]);
    }
    const line = smoothPath(pts);
    const area = `${line}L${pts[pts.length - 1][0]},${plotB}L${pts[0][0]},${plotB}Z`;

    // Gridlines with labels on the left
    step = (hi - lo) / 2;
    const grid = [lo, lo + step, hi].map((v) =>
      `<line x1="${padL}" x2="${W - padR}" y1="${f1(y(v))}" y2="${f1(y(v))}" stroke="rgba(148,163,184,${v === lo ? ".2" : ".08"})"/>` +
      `<text x="${padL - 8}" y="${f1(y(v) + 4)}" text-anchor="end">${esc(fmtV(v))}${this._tab === "battery" ? "%" : ""}</text>`).join("");

    // What the car was doing: a strip under the curve (parked / driving / charging)
    const state = (ts) => (chg.length && valueAt(chg, ts) === true ? "c"
      : (h.series.isDriving || []).length && valueAt(h.series.isDriving, ts) === true ? "d" : "p");
    const colors = { p: "#3b4660", d: "#38bdf8", c: "#34d399" };
    const segs = [];
    const S = 144;
    for (let i = 0; i < S; i++) {
      const ts = h.start + ((i + 0.5) / S) * (h.end - h.start);
      const st = state(ts);
      const last = segs[segs.length - 1];
      if (last && last.st === st) last.to = i + 1;
      else segs.push({ st, from: i, to: i + 1 });
    }
    const sx = (i) => padL + (i / S) * (W - padL - padR);
    const stripY = plotB + 9;
    const strip = segs.map((g) => `<rect x="${f1(sx(g.from))}" y="${stripY}" width="${f1(Math.max(2, sx(g.to) - sx(g.from) - 1))}" height="7" rx="3.5" fill="${colors[g.st]}"/>`).join("");
    const seen = new Set(segs.map((g) => g.st));
    const legend = [["p", t("parked")], ["d", t("driving")], ["c", t("charging")]].filter(([k]) => seen.has(k))
      .map(([k, l]) => `<span><i style="--c:${colors[k]}"></i>${esc(l)}</span>`).join("");

    // Hour labels on whole hours: every 3 h on wide charts, every 6 h on phones.
    const every = W >= 520 ? 3 : 6;
    const hours = [];
    const firstHour = new Date(h.start);
    firstHour.setMinutes(0, 0, 0);
    for (let ts = firstHour.getTime() + HOUR; ts < h.end - 1.2 * HOUR; ts += HOUR) {
      const d = new Date(ts);
      if (d.getHours() % every) continue;
      hours.push(`<text x="${f1(x(ts))}" y="${H - 6}" text-anchor="middle">${this._hour(d)}:00</text>`);
    }
    const nowX = x(h.end);
    const pillW = Math.max(38, t("nowPill").length * 7 + 16);
    const endY = y(cur);

    const svg = `
      <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(t("last24"))}">
        <defs><linearGradient id="lm-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#f6a823" stop-opacity=".45"/><stop offset=".7" stop-color="#b8741c" stop-opacity=".12"/><stop offset="1" stop-color="#f6a823" stop-opacity="0"/>
        </linearGradient></defs>
        ${grid}
        <path d="${area}" fill="url(#lm-area)"/>
        <path d="${line}" fill="none" stroke="#f6b13d" stroke-width="2.6" stroke-linejoin="round"/>
        <line x1="${f1(nowX)}" x2="${f1(nowX)}" y1="${padT}" y2="${plotB}" stroke="#f6a823" stroke-width="1.2" stroke-dasharray="3 4"/>
        <circle cx="${f1(nowX)}" cy="${f1(endY)}" r="5" fill="#f6a823" stroke="#0f1729" stroke-width="2.5"/>
        ${strip}
        ${hours.join("")}
        <rect x="${f1(nowX - pillW)}" y="${H - 20}" width="${f1(pillW)}" height="18" rx="9" fill="#f6a823"/>
        <text class="nowtxt" x="${f1(nowX - pillW / 2)}" y="${H - 7}" text-anchor="middle">${esc(t("nowPill"))}</text>
      </svg>`;

    return `${head}${headline}<div class="chartbox" id="chartbox">${svg}</div><div class="alegend">${legend}</div>`;
  }

  /* ----- last 7 days ----- */

  _weekHtml() {
    const t = (k, v) => this._tr(k, v);
    const s = this._s("week");
    const detail = Array.isArray(s?.attributes?.daily_detail) ? s.attributes.daily_detail : null;
    const head = this._head(t("last7"), "calendar", `<span class="meta">Leapmotor cloud</span>`);
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
    let wd;
    try { wd = new Intl.DateTimeFormat(this._lang, { weekday: "short" }); } catch (_e) { wd = new Intl.DateTimeFormat("en", { weekday: "short" }); }
    const dayName = (day) => {
      if (day.today) return t("today");
      const n = wd.format(day.d).replace(".", "");
      return n.charAt(0).toUpperCase() + n.slice(1);
    };

    const known = days.filter((d) => d.km != null);
    const sum = known.reduce((a, b) => a + (b.km || 0), 0);
    const withEnergy = known.filter((d) => d.km > 0 && d.energy != null);
    const eSum = withEnergy.reduce((a, b) => a + b.energy, 0);
    const eKm = withEnergy.reduce((a, b) => a + b.km, 0);
    const drivingDays = known.filter((d) => d.km > 0).length;
    const longest = known.reduce((a, b) => ((b.km || 0) > (a?.km || 0) ? b : a), null);
    const stat = (label, value, unit, sub = "") =>
      `<div class="stat"><small>${esc(label)}</small><b>${value}${unit ? `<span>${esc(unit)}</span>` : ""}</b>${sub ? `<em>${esc(sub)}</em>` : ""}</div>`;
    const stats = [
      stat(t("total"), this._num(sum), "km", longest?.km ? `${t("longest")} ${dayName(longest)} · ${this._num(longest.km)} km` : ""),
      stat(t("drivingDays"), `${drivingDays}/7`, ""),
      stat(t("weekEnergy"), eSum ? this._num(eSum, 1) : "—", eSum ? "kWh" : ""),
      stat(t("weekAvg"), eKm ? this._num((eSum / eKm) * 100, 1) : "—", eKm ? "kWh/100" : ""),
    ].join("");

    const max = Math.max(1, ...days.map((d) => d.km || 0));
    const rows = days.map((day) => {
      const ratio = (day.km || 0) / max;
      const top = day.today ? "#5eead4" : rampColor([[0, "#60a5fa"], [0.5, "#a5b4fc"], [0.8, "#fde68a"], [1, "#fbbf24"]], ratio);
      const idle = !day.km;
      const sub = day.km == null ? "" : idle ? t("parked") : day.energy != null ? `${this._num(day.energy, 1)} kWh` : "";
      return `<div class="wrow${day.today ? " today" : ""}${idle ? " idle" : ""}">
          <span class="wd">${esc(dayName(day))}</span>
          <div class="wbar">${day.km ? `<i style="width:${Math.max(3, ratio * 100)}%;background:linear-gradient(90deg,#2563eb,${top});--g:${top}88"></i>` : ""}</div>
          <div class="wv"><b>${day.km == null ? "—" : this._num(day.km)}<small>km</small></b>${sub ? `<span>${esc(sub)}</span>` : ""}</div>
        </div>`;
    }).join("");
    return `${head}<div class="wstats">${stats}</div><div class="wrows">${rows}</div>`;
  }

  /* ----- charging ----- */

  /** The charge limit the car reports (the number entity, else the sensor). */
  _currentLimit() {
    const n = this._s("chargeLimitSet");
    const v = n ? parseFloat(n.state) : NaN;
    return isFinite(v) ? v : this._v("chargeLimit");
  }

  _chargingHtml() {
    const t = (k, v) => this._tr(k, v);
    const soc = this._v("battery");
    const limit = this._currentLimit();
    const { charging, plugged, finished } = this._chargeState();
    const power = this._v("power"), amps = this._v("current"), volts = this._v("voltage");

    let chipText, chipC, pulse = "";
    if (charging) { chipText = power != null ? `${t("charging")} · ${this._num(power, 1)} kW` : t("charging"); chipC = OK_C; pulse = " pulse"; }
    else if (finished) { chipText = t("finished"); chipC = OK_C; }
    else if (plugged) { chipText = t("pluggedIn"); chipC = WARN_C; }
    else { chipText = t("unplugged"); chipC = "#94a3b8"; }
    const chip = `<span class="cchip" style="--c:${chipC}"><span class="dot${pulse}" style="--c:${chipC}"></span>${esc(chipText)}</span>`;

    const rangeV = this._v("range");
    const finish = this._ts("finish");
    const rem = this._v("remaining");
    const side = charging && (finish || rem != null)
      ? `<div class="cside">${finish ? `<b>${esc(this._time(new Date(finish)))}</b>` : `<b>${esc(this._dur(rem))}</b>`}<small>${esc(
        finish ? [t("done"), rem != null ? t("left", { x: this._dur(rem) }) : ""].filter(Boolean).join(" · ") : t("remaining"))}</small></div>`
      : "";
    const elec = charging ? [amps != null ? `${this._num(Math.abs(amps))} A` : null, volts != null ? `${this._num(volts)} V` : null].filter(Boolean) : [];
    const sub = [rangeV != null ? t("rangeLeft", { x: `${this._num(rangeV)} ${this._unit("range", "km")}` }) : null, ...elec].filter(Boolean).join(" · ");

    const pct = soc != null ? clamp(soc, 0, 100) : 0;
    const target = this._limitPending ?? limit;
    const edge = target >= 86 ? " edge-r" : target <= 14 ? " edge-l" : "";
    const bar = `<div class="bbar clickable" data-more="battery" role="img" aria-label="${esc(t("batteryLevel", { x: `${this._num(soc)} %` }))}">
        <div class="f${charging ? " on" : ""}" style="width:${pct}%"></div>
        ${target != null && target > pct ? `<div class="tg" style="left:${pct}%;width:${target - pct}%"></div>` : ""}
        ${target != null ? `<div class="lim${edge}" style="left:${clamp(target, 0, 100)}%"><b>${esc(t("limit"))} ${this._num(target)} %</b></div>` : ""}
      </div>`;

    const tiles = this._groupTilesHtml("charging");
    return `
      ${this._head(t("chargingTitle"), "bolt", chip)}
      <div class="ctop">
        <div class="clickable" data-more="battery"><div class="soc">${soc != null ? this._num(soc) : "—"}<span>%</span></div>${sub ? `<div class="socsub">${esc(sub)}</div>` : ""}</div>
        ${side}
      </div>
      ${bar}
      ${this._toLimitHtml()}
      ${this._limitHtml(limit)}
      ${tiles ? `<div class="subh">${esc(t("groupCharging"))}</div>${tiles}` : ""}
      ${this._chargeSummaryHtml()}`;
  }

  /** Charge limit with − / +; the new value is only sent after Set (tap twice to confirm). */
  _limitHtml(limit) {
    const t = (k, v) => this._tr(k, v);
    const n = this._s("chargeLimitSet");
    const editable = !!n && !["unavailable", "unknown"].includes(n.state);
    const a = n?.attributes || {};
    const min = isFinite(Number(a.min)) ? Number(a.min) : 1;
    const max = isFinite(Number(a.max)) ? Number(a.max) : 100;
    const pending = this._limitPending;
    const changed = editable && pending != null && pending !== limit;
    const shown = changed ? pending : limit;
    if (shown == null && !editable) return "";
    const armed = this._isArmed("limitSet");
    const dis = (cond) => (cond ? " disabled" : "");
    return `<div class="lrow${this._busy.limit ? " busy" : ""}">
        <div><small>${esc(t("chargeLimit"))}</small><b class="${changed ? "pending" : ""}">${shown != null ? this._num(shown) : "—"} %</b>${changed && limit != null
          ? `<span class="was">${esc(t("currently", { x: `${this._num(limit)} %` }))}</span>` : ""}</div>
        ${editable ? `<div class="stepper">
          <button class="stp" data-act="limit" data-delta="-1" aria-label="${esc(t("limitDown"))}"${dis(shown != null && shown <= min)}>−</button>
          <button class="stp" data-act="limit" data-delta="1" aria-label="${esc(t("limitUp"))}"${dis(shown != null && shown >= max)}>+</button></div>` : ""}
      </div>
      ${changed ? `<div class="lset">
        <button class="btn primary${armed ? " armed" : ""}" data-act="limitset">${icon("check")}${esc(armed ? t("tapConfirm") : t("setLimit", { x: `${this._num(pending)} %` }))}</button>
        <button class="btn" data-act="limitcancel">${esc(t("cancel"))}</button></div>` : ""}`;
  }

  _toLimitHtml() {
    const t = (k, v) => this._tr(k, v);
    const tl = this._s("toLimit");
    const e = this._v("toLimit");
    if (!tl || e == null || e <= 0.2) return "";
    const tla = tl.attributes || {};
    const cur = this._unit("monthCost") || this._unit("lastSessionCost");
    const head = t("toLimit", { l: this._num(tla.limit ?? this._currentLimit() ?? 0), e: this._num(e, 1) });
    let tail = "";
    if (tla.cost_low_tariff != null && tla.cost_now != null && !tla.low_tariff_now) {
      tail = t("costNowLow", { now: this._money(tla.cost_now, cur), low: this._money(tla.cost_low_tariff, cur) })
        + (tla.next_low_tariff ? ` (${t("lowFrom", { t: this._time(new Date(tla.next_low_tariff)) })})` : "");
    } else if (tla.cost_now != null) {
      tail = this._money(tla.cost_now, cur);
    }
    return `<div class="cinfo clickable" data-more="toLimit"><b>${esc(head)}</b>${tail ? ` · ${esc(tail)}` : ""}</div>`;
  }

  _money(value, currency) {
    if (value == null || !isFinite(value)) return null;
    try {
      return new Intl.NumberFormat(this._lang, { style: "currency", currency: currency || "EUR" }).format(value);
    } catch (_e) {
      return `${this._num(value, 2)} ${currency || ""}`.trim();
    }
  }

  _tierLabel(tier) {
    return { home: this._tr("tierHome"), public_ac: this._tr("tierAC"), public_dc: this._tr("tierDC") }[tier] || "";
  }

  _chargeSummaryHtml() {
    const t = (k, v) => this._tr(k, v);
    const last = this._s("lastSession");
    let lastE = this._v("lastSession");
    const monthE = this._v("monthEnergy");
    const currency = this._unit("monthCost") || this._unit("lastSessionCost");
    const la = last?.attributes || {};
    let lastBits = [];
    let lastKey = "lastSession";
    if (lastE != null) {
      const ended = Date.parse(la.end || la.start);
      lastBits = [this._tierLabel(la.tier), this._money(this._v("lastSessionCost"), currency), isFinite(ended) ? this._ago(ended) : null];
    } else if (this._v("lastCharge") != null) {
      // No session recorded here yet: fall back to the cloud's last charge.
      lastE = this._v("lastCharge");
      lastKey = "lastCharge";
      lastBits = [this._s("lastCharge")?.attributes?.charge_type];
    }
    if (lastE == null && !monthE) {
      return last || this._s("monthEnergy") ? `<div class="cnone">${esc(t("noSessions"))}</div>` : "";
    }
    const sessions = this._s("monthCost")?.attributes?.sessions;
    const monthBits = [sessions ? t("sessionsN", { n: sessions }) : null, this._money(this._v("monthCost"), currency)].filter(Boolean);
    const em = (bits) => (bits.filter(Boolean).length ? `<em>${esc(bits.filter(Boolean).join(" · "))}</em>` : "");
    return `<div class="csum">
      <div class="stat clickable" data-more="${lastKey}"><small>${esc(t("lastSession"))}</small><b>${lastE != null ? `${this._num(lastE, 1)}<span>kWh</span>` : "—"}</b>${em(lastBits)}</div>
      <div class="stat clickable" data-more="${this._ids.monthEnergy ? "monthEnergy" : "monthCost"}"><small>${esc(t("monthCharging"))}</small><b>${monthE != null ? `${this._num(monthE, 1)}<span>kWh</span>` : "—"}</b>${em(monthBits)}</div>
    </div>`;
  }

  /* ----- battery & efficiency ----- */

  _energyHtml() {
    const t = (k, v) => this._tr(k, v);
    const avg = this._v("avg");
    const pos = avg != null ? clamp((avg - 10) / 20, 0, 1) : null;
    const ratings = this._t.ratings || STRINGS.en.ratings;
    const rating = avg == null ? "" : avg < 13 ? ratings[0] : avg < 16 ? ratings[1] : avg < 19 ? ratings[2] : avg < 23 ? ratings[3] : ratings[4];
    const color = pos != null ? rampColor(EFFICIENCY_STOPS, pos) : "#94a3b8";
    const d = this._v("lwDriving"), c = this._v("lwClimate"), o = this._v("lwOther");
    let split = "";
    if (d != null || c != null || o != null) {
      const sum = (d || 0) + (c || 0) + (o || 0) || 1;
      const seg = (v, col) => (v ? `<i style="width:${(v / sum) * 100}%;background:${col}"></i>` : "");
      split = `<div class="split">${esc(t("lastWeek"))}<div class="bar">${seg(d, "#f6a823")}${seg(c, "#38bdf8")}${seg(o, "#a78bfa")}</div>
        <div class="lg"><span><i style="background:#f6a823"></i>${esc(t("drivingE"))} ${this._num(d || 0)} %</span><span><i style="background:#38bdf8"></i>${esc(t("climateE"))} ${this._num(c || 0)} %</span><span><i style="background:#a78bfa"></i>${esc(t("otherE"))} ${this._num(o || 0)} %</span></div></div>`;
    }
    const consumption = this._s("avg") ? `
      <div class="aq clickable" data-more="avg">
        <span class="aqv" style="color:${color}">${avg != null ? this._num(avg, 1) : "—"}</span>
        <div class="t"><b>kWh/100 km${rating ? ` <span>· ${esc(rating)}</span>` : ""}</b><small>${esc(t("sixWeek"))}</small>
          <div class="scale">${pos != null ? `<i style="left:${pos * 100}%"></i>` : ""}</div></div>
      </div>` : "";
    // Without a Tires panel the four pressures stay here.
    const tires = this._config.sections.includes("tires") ? "" : TIRES.filter(([k]) => this._s(k)).map(([k, l]) => {
      const v = this._v(k);
      return `<div class="stat clickable" data-more="${k}"><small>${esc(t(l))}</small><b style="${v != null && v < TIRE_LOW_BAR ? "color:var(--lm-red)" : ""}">${v != null ? this._num(v, 1) : "—"}<span>bar</span></b></div>`;
    }).join("");
    const body = `${this._healthHtml()}${this._forecastHtml()}${consumption}${tires ? `<div class="stats" style="margin-top:14px">${tires}</div>` : ""}${split}`;
    return `${this._head(t("batteryEff"), "battery")}${body.trim() ? body : `<div class="empty">—</div>`}`;
  }

  _healthHtml() {
    const t = (k, v) => this._tr(k, v);
    const s = this._s("health");
    if (!s) return "";
    const soh = this._v("health");
    const a = s.attributes || {};
    const sub = soh != null && a.capacity_kwh != null && a.reference_kwh != null
      ? t("healthSub", { c: this._num(a.capacity_kwh, 1), r: this._num(a.reference_kwh, 1) })
      : t("healthPending");
    return `<div class="health clickable" data-more="health"><span class="sq">${icon("heart")}</span>
      <div><b>${esc(t("health"))}</b><small>${esc(sub)}</small></div>
      <span class="big2">${soh != null ? `${this._num(soh, 1)} %` : "—"}</span></div>`;
  }

  /** Where the measured capacity is heading (needs months of full charges). */
  _forecastHtml() {
    const t = (k, v) => this._tr(k, v);
    const s = this._s("capacityTrend");
    const trend = this._v("capacityTrend");
    if (!s || trend == null) return "";
    const a = s.attributes || {};
    const stable = a.stable === true || trend >= -0.2;
    const bits = [t("fcSub", { x: `${trend > 0 ? "+" : ""}${this._num(trend, 1)}`, n: this._num(a.samples ?? 0) })];
    if (a.reaches_90) bits.push(t("fc90", { d: this._date(this._day(a.reaches_90), { month: "short", year: "numeric" }) }));
    return `<div class="health clickable" data-more="capacityTrend" style="margin-top:8px"><span class="sq" style="color:#38bdf8;background:rgba(56,189,248,.14)">${icon("gauge")}</span>
      <div><b>${esc(t("fcTitle"))}</b><small>${esc(bits.join(" · "))}</small></div>
      <span class="big2" style="font-size:18px">${esc(stable ? t("fcStable") : `${this._num(trend, 1)} %`)}</span></div>`;
  }

  /* ----- tires ----- */

  /** Per-wheel flags from the tire warning sensor: { tireFL: ["low"], ... }. */
  _tireFlags() {
    const flags = {};
    for (const r of this._s("tireWarning")?.attributes?.reasons || []) {
      const m = /^(front|rear)_(left|right)_(low|uneven|dropping)$/.exec(r);
      if (!m) continue;
      const key = { front_left: "tireFL", front_right: "tireFR", rear_left: "tireRL", rear_right: "tireRR" }[`${m[1]}_${m[2]}`];
      (flags[key] = flags[key] || []).push(m[3]);
    }
    return flags;
  }

  _tiresHtml() {
    const t = (k, v) => this._tr(k, v);
    const head = this._head(t("tiresTitle"), "tire", `<span class="meta">${esc(t("tireHint", { x: this._num(TIRE_LOW_BAR, 1) }))}</span>`);
    if (!TIRES.some(([k]) => this._s(k))) return `${head}<div class="empty">—</div>`;
    const flags = this._tireFlags();
    const words = { low: t("tLow"), uneven: t("tUneven"), dropping: t("tDropping") };
    const area = { tireFL: "fl", tireFR: "fr", tireRL: "rl", tireRR: "rr" };
    const status = {};
    const wheels = TIRES.map(([k]) => {
      const v = this._v(k);
      const f = flags[k] || [];
      const st = (v != null && v < TIRE_LOW_BAR) || f.includes("low") ? "bad" : f.length ? "warn" : "ok";
      status[k] = st;
      const c = st === "bad" ? BAD_C : st === "warn" ? WARN_C : "";
      return `<div class="tyre clickable${st === "ok" ? "" : ` ${st}`}" data-more="${k}" style="grid-area:${area[k]}${c ? `;--c:${c}` : ""}">
        <small>${esc(t(`${k.slice(4)}l`))}</small><b>${v != null ? this._num(v, 1) : "—"}<span>bar</span></b>${f.length ? `<em>${esc(f.map((x) => words[x]).join(", "))}</em>` : ""}</div>`;
    }).join("");
    const wc = (k) => (status[k] === "bad" ? BAD_C : status[k] === "warn" ? WARN_C : "#64748b");
    const car = `<svg class="tcar" viewBox="0 0 60 132" aria-hidden="true">
      <rect x="3" y="20" width="9" height="22" rx="3" fill="${wc("tireFL")}"/><rect x="48" y="20" width="9" height="22" rx="3" fill="${wc("tireFR")}"/>
      <rect x="3" y="90" width="9" height="22" rx="3" fill="${wc("tireRL")}"/><rect x="48" y="90" width="9" height="22" rx="3" fill="${wc("tireRR")}"/>
      <rect x="9" y="4" width="42" height="124" rx="17" fill="#1b2540" stroke="rgba(148,163,184,.45)" stroke-width="1.5"/>
      <path d="M15 40Q30 32 45 40L42 56H18Z" fill="rgba(56,189,248,.28)"/><path d="M18 96H42L45 108Q30 115 15 108Z" fill="rgba(56,189,248,.2)"/>
      <path d="M18 60H42V92H18Z" fill="rgba(148,163,184,.08)"/></svg>`;
    const warn = this._on("tireWarning") === true || Object.values(status).some((s) => s !== "ok");
    const reasons = Object.entries(flags).map(([k, f]) => `${t(`${k.slice(4)}l`)} ${f.map((x) => words[x]).join(", ")}`);
    const line = warn
      ? `<div class="tstat clickable" data-more="tireWarning" style="--c:${BAD_C}">${icon("alert")}${esc(t("tiresWarn"))}${reasons.length ? ` <span>· ${esc(reasons.join(" · "))}</span>` : ""}</div>`
      : `<div class="tstat" style="--c:${OK_C}">${icon("check")}${esc(t("tiresOk"))}</div>`;
    return `${head}<div class="tgrid">${wheels}${car}</div>${line}`;
  }

  /* ----- maintenance ----- */

  _maintenanceDef(key) {
    const service = key.slice(4);
    const item = (this._s("nextMaintenance")?.attributes?.items || []).find((i) => i.service_type === service);
    const target = this._ids.battery || this._ids.nextMaintenance;
    if (!item || !target) return null;
    return { domain: "leapmotor", service: "log_maintenance", label: this._serviceName(item),
      data: { service_type: service, entity_id: target } };
  }

  _serviceName(item) {
    const names = SERVICE_NAMES[this._lang.split("-")[0]];
    return (names && names[item.service_type]) || item.label;
  }

  _maintenanceHtml() {
    const t = (k, v) => this._tr(k, v);
    const s = this._s("nextMaintenance");
    const a = s?.attributes || {};
    const items = Array.isArray(a.items) ? a.items : [];
    const head = this._head(t("mntTitle"), "wrench", `<span class="meta">${esc(a.schedule || "")}</span>`);
    if (!items.length) return `${head}<div class="empty">${esc(t("mntNone"))}</div>`;
    const colors = { overdue: "#fb7185", due_soon: "#f6a823", ok: "#34d399" };
    const pills = { overdue: ["bad", t("mntOverdue")], due_soon: ["warn", t("mntSoon")], ok: ["", t("mntOk")] };
    const rows = items.slice(0, 6).map((item) => {
      const left = [];
      if (item.remaining_km != null) left.push(item.remaining_km > 0 ? t("kmLeft", { x: this._num(item.remaining_km) }) : t("overdueBy", { x: `${this._num(-item.remaining_km)} km` }));
      if (item.remaining_days != null) left.push(item.remaining_days > 0 ? t("daysLeft", { x: this._num(item.remaining_days) }) : t("overdueBy", { x: t("daysLeft", { x: this._num(-item.remaining_days) }) }));
      const fracs = [];
      if (item.interval_km && item.remaining_km != null) fracs.push(1 - item.remaining_km / item.interval_km);
      if (item.interval_months && item.remaining_days != null) fracs.push(1 - item.remaining_days / (item.interval_months * 30));
      const used = clamp(Math.max(0, ...fracs), 0, 1);
      const key = `mnt:${item.service_type}`;
      const armed = this._isArmed(key);
      const [pcls, ptxt] = pills[item.status] || pills.ok;
      return `<div class="mrow" style="--c:${colors[item.status] || "#94a3b8"}">
        <span class="sq">${icon("wrench")}</span>
        <div><b>${esc(this._serviceName(item))}</b><small>${esc(left.join(" · "))} · ${esc(item.baseline === "logged" ? t("mntLogged") : t("mntAssumed"))}</small>
          <div class="mbar"><i style="width:${Math.round(used * 100)}%;background:${colors[item.status] || "#94a3b8"}"></i></div></div>
        <div class="mside"><span class="pill ${pcls}">${esc(ptxt)}</span>
        <button class="mdone${armed ? " armed" : ""}" data-act="ctl" data-key="${esc(key)}">${esc(armed ? t("tapConfirm") : t("mntDone"))}</button></div>
      </div>`;
    }).join("");
    return `${head}<div class="clickable" data-more="nextMaintenance">${rows}</div><div class="foot">${esc(t("mntHint"))}</div>`;
  }

  /* ----- insights ----- */

  _insightsHtml() {
    const t = (k, v) => this._tr(k, v);
    const rows = [];
    const currency = this._unit("driveCost") || this._unit("monthCost");
    const cost = this._v("driveCost");
    if (cost != null) {
      const per = this._v("costPer100");
      rows.push(`<div class="irow clickable" data-more="driveCost" style="--c:#f6a823"><span class="sq">${icon("route")}</span>
        <div><b>${esc(t("driveCost"))}</b><small>${per != null ? esc(t("per100", { x: this._money(per, currency) })) : ""}</small></div>
        <span class="mono">${esc(this._money(cost, currency))}</span></div>`);
    }
    const drain = this._v("drain");
    if (drain != null) {
      const pct = this._s("drain")?.attributes?.pct_per_day;
      rows.push(`<div class="irow clickable" data-more="drain" style="--c:#a78bfa"><span class="sq">${icon("battery")}</span>
        <div><b>${esc(t("drain"))}</b><small>${pct != null ? esc(t("drainSub", { p: this._num(pct, 1) })) : ""}</small></div>
        <span class="mono">${this._num(drain, 2)} kWh/d</span></div>`);
    }
    const tc = this._s("tripConsumption")?.attributes || {};
    if (tc.vs_usual_pct != null) {
      const good = tc.vs_usual_pct <= 0;
      rows.push(`<div class="irow clickable" data-more="tripConsumption" style="--c:${good ? "#34d399" : "#fb923c"}"><span class="sq">${icon("spark")}</span>
        <div><b>${esc(t("vsUsual", { x: `${tc.vs_usual_pct > 0 ? "+" : ""}${this._num(tc.vs_usual_pct, 0)} %` }))}</b><small>${esc(t("usualSub", { n: tc.similar_trips ?? 0 }))}</small></div>
        <span class="mono">${this._num(tc.usual_consumption_kwh_100km, 1)}</span></div>`);
    }
    const tw = this._config.sections.includes("tires") ? null : this._s("tireWarning");
    if (tw) {
      const warn = tw.state === "on";
      const reasons = (tw.attributes?.reasons || []).map((r) => {
        const m = /^(front|rear)_(left|right)_(low|uneven|dropping)$/.exec(r);
        if (!m) return r;
        const tire = { front_left: t("FL"), front_right: t("FR"), rear_left: t("RL"), rear_right: t("RR") }[`${m[1]}_${m[2]}`];
        return `${tire} ${t({ low: "tLow", uneven: "tUneven", dropping: "tDropping" }[m[3]])}`;
      });
      rows.push(`<div class="irow clickable" data-more="tireWarning" style="--c:${warn ? "#fb7185" : "#34d399"}"><span class="sq">${icon("tire")}</span>
        <div><b>${esc(warn ? t("tiresWarn") : t("tiresOk"))}</b><small>${esc(reasons.join(", "))}</small></div>
        <span class="pill ${warn ? "bad" : ""}">${esc(warn ? t("open").replace(/.*/, "!") : t("ok"))}</span></div>`);
    }
    const bands = Array.isArray(tc.efficiency_by_temperature) ? tc.efficiency_by_temperature : [];
    let temps = "";
    if (bands.length) {
      const labels = { below_0: "< 0 °C", "0_10": "0–10 °C", "10_20": "10–20 °C", above_20: "> 20 °C" };
      const max = Math.max(...bands.map((b) => b.consumption_kwh_100km));
      temps = `<div class="temps"><small class="h">${esc(t("tempTitle"))}</small>${bands.map((b) => {
        const color = rampColor(EFFICIENCY_STOPS, clamp((b.consumption_kwh_100km - 10) / 20, 0, 1));
        return `<div class="trow2"><span>${esc(labels[b.band] || b.band)}</span><div class="b"><i style="width:${Math.round(b.consumption_kwh_100km / max * 100)}%;background:${color}"></i></div><span class="mono">${this._num(b.consumption_kwh_100km, 1)}</span></div>`;
      }).join("")}</div>`;
    }
    const head = this._head(t("insightsTitle"), "spark");
    if (!rows.length && !temps) return `${head}<div class="empty">${esc(t("noInsights"))}</div>`;
    return `${head}${rows.join("")}${temps}`;
  }

  /* ----- trip log ----- */

  _tripDay(date) {
    const today = new Date();
    const y = new Date(today.getTime() - DAY);
    const same = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
    if (same(date, today)) return this._tr("today");
    if (same(date, y)) return this._tr("yesterday");
    try {
      const s = new Intl.DateTimeFormat(this._lang, { weekday: "long", day: "numeric", month: "long" }).format(date);
      return s.charAt(0).toUpperCase() + s.slice(1);
    } catch (_e) { return date.toDateString(); }
  }

  _dayKey(date) {
    return isFinite(date) ? `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}` : "?";
  }

  /** Average price per kWh the integration uses for driving costs (null without tariffs). */
  _pricePerKwh() {
    const p = Number(this._s("driveCost")?.attributes?.avg_price_kwh);
    return isFinite(p) && p > 0 ? p : null;
  }

  _tripRow(trip, { live = false, index = 0, pick = false, latest = false } = {}) {
    const t = (k, v) => this._tr(k, v);
    const selected = pick && this._tripKey(this._mapSelected()) === this._tripKey(live ? { ...trip, live: true } : trip);
    const start = trip.start ? new Date(trip.start) : null;
    const end = trip.end ? new Date(trip.end) : null;
    const cons = trip.consumption_kwh_100km;
    const consColor = cons != null ? rampColor(EFFICIENCY_STOPS, clamp((cons - 10) / 20, 0, 1)) : null;
    const bits = [];
    if (trip.duration_min != null) bits.push(this._dur(trip.duration_min));
    if (trip.energy_kwh != null) bits.push(`${this._num(trip.energy_kwh, 1)} kWh`);
    if (trip.start_soc != null && trip.end_soc != null) bits.push(`${this._num(trip.start_soc)} → ${this._num(trip.end_soc)} %`);
    const vs = latest && trip.vs_usual_pct != null
      ? `<span class="vs ${trip.vs_usual_pct <= 0 ? "good" : "bad"}">${trip.vs_usual_pct > 0 ? "+" : ""}${this._num(trip.vs_usual_pct, 0)} %</span>` : "";
    const eco = trip.eco_score != null
      ? `<span class="eco" style="--c:${this._ecoColor(trip.eco_score)}" title="${esc(t("ecoScore"))}">${esc(t("ecoShort", { x: this._num(trip.eco_score) }))}</span>` : "";
    const tag = pick ? "button" : "div";
    const sub = live
      ? `<small><span class="dot pulse" style="--c:#38bdf8;width:6px;height:6px;margin-right:6px;vertical-align:1px"></span>${esc(t("mapLive"))}</small>`
      : `<small>${end ? esc(this._time(end)) : ""}</small>`;
    return `<${tag} class="trip${live ? " live" : ""}${selected ? " sel" : ""}"${pick ? ` data-trip="${live ? "live" : index}"` : ""}>
      <div class="tt"><b>${start ? esc(this._time(start)) : "—"}</b>${sub}</div>
      <div class="td"><b>${this._num(trip.distance_km ?? 0, 1)}<small>km</small>${vs}</b><span>${esc(bits.map((b) => b.replace(/ /g, "\u00a0")).join(" · ") || (live ? t("drivingNow") : ""))}</span></div>
      <div class="tcx">${cons != null ? `<span class="cons" style="background:${consColor}">${this._num(cons, 1)}</span><small>kWh/100 km</small>` : ""}${eco}</div>
    </${tag}>`;
  }

  _ecoColor(score) {
    return score >= 80 ? OK_C : score >= 60 ? "#a3e635" : score >= 40 ? WARN_C : "#fb923c";
  }

  /** Trips grouped by day, newest first, like the LeapConnect trips page. */
  _tripsHtml() {
    const t = (k, v) => this._tr(k, v);
    const a = this._s("lastTrip")?.attributes || {};
    const recent = Array.isArray(a.recent_trips) ? a.recent_trips : [];
    const current = a.current_trip && a.current_trip.start ? a.current_trip : null;
    const pick = this._config.sections.includes("map");
    const head = this._head(t("tripsTitle"), "route", recent.length
      ? `<button type="button" class="hbtn" data-act="exportcsv" title="${esc(t("exportCsv"))}" aria-label="${esc(t("exportCsv"))}">${icon("download")}<span>CSV</span></button>` : "");

    const currency = this._unit("driveCost") || this._unit("monthCost");
    const dc = this._s("driveCost")?.attributes || {};
    const stat = (label, km, at, key, cost) => {
      const em = [at.trips != null ? t("tripsN", { n: at.trips }) : null, at.energy_kwh != null ? `${this._num(at.energy_kwh, 1)} kWh` : null, cost].filter(Boolean).join(" · ");
      return `<div class="stat clickable" data-more="${key}"><small>${esc(label)}</small><b>${this._num(km ?? 0, (km ?? 0) >= 100 ? 0 : 1)}<span>km</span></b>${em ? `<em>${esc(em)}</em>` : ""}</div>`;
    };
    const today = this._v("todayDistance"), month = this._v("monthDistance");
    const summary = today != null || month != null
      ? `<div class="tsum">${stat(t("todayL"), today, this._s("todayDistance")?.attributes || {}, "todayDistance", dc.today != null ? this._money(dc.today, currency) : null)}`
        + `${stat(t("monthL"), month, this._s("monthDistance")?.attributes || {}, "monthDistance", this._v("driveCost") != null ? this._money(this._v("driveCost"), currency) : null)}</div>`
      : "";
    if (!recent.length && !current) return `${head}${summary}<div class="empty">${esc(t("noTrips"))}</div>`;

    // Day totals over every known trip of that day, even when the list is cut short.
    const totals = {};
    for (const trip of current ? [current, ...recent] : recent) {
      const k = this._dayKey(new Date(trip.start));
      const tot = totals[k] || (totals[k] = { km: 0, kwh: 0 });
      tot.km += trip.distance_km || 0;
      tot.kwh += trip.energy_kwh || 0;
    }
    const latest = recent.length ? { ...recent[0], vs_usual_pct: a.vs_usual_pct ?? this._s("tripConsumption")?.attributes?.vs_usual_pct } : null;
    const items = [];
    if (current) items.push({ trip: current, live: true });
    recent.slice(0, this._tripLimit).forEach((trip, index) => items.push({ trip: index === 0 ? latest : trip, index }));
    const groups = [];
    for (const it of items) {
      const d = new Date(it.trip.start);
      const key = this._dayKey(d);
      let g = groups[groups.length - 1];
      if (!g || g.key !== key) groups.push((g = { key, date: d, items: [] }));
      g.items.push(it);
    }
    const list = groups.map((g) => {
      const tot = totals[g.key] || { km: 0, kwh: 0 };
      return `<div class="tgroup"><div class="tgh">${esc(isFinite(g.date) ? this._tripDay(g.date) : "—")}<span>${this._num(tot.km, 1)} km${tot.kwh ? ` · ${this._num(tot.kwh, 1)} kWh` : ""}</span></div>`
        + g.items.map((it) => this._tripRow(it.trip, { live: !!it.live, index: it.index, pick, latest: it.index === 0 })).join("") + `</div>`;
    }).join("");
    const left = recent.length - this._tripLimit;
    const more = left > 0 ? `<button class="more" data-act="moretrips">${esc(t("showMore", { n: Math.min(10, left) }))}</button>` : "";
    return `${head}${summary}${list}${more}`;
  }

  /* ----- quick actions on the first page ----- */

  /** The remote actions shown as quick buttons in the hero. */
  _quickKeys(defs = this._controlDefs()) {
    if (this._config.quick_actions === false || !this._config.sections.includes("hero")) return [];
    return [
      defs.unlockCar ? "unlockCar" : "lockCar",
      defs.quickHeat ? "quickHeat" : "cabinPreheat",
      defs.quickCool ? "quickCool" : "cabinPrecool",
      "windows",
    ].filter((k) => defs[k]);
  }

  /** Lock/unlock, quick heat, quick cool and windows as one row under the car. */
  _quickHtml() {
    const t = (k) => this._tr(k);
    const defs = this._controlDefs();
    const keys = this._quickKeys(defs);
    if (!keys.length) return "";
    const buttons = keys.map((key) => {
      const d = defs[key];
      const armed = this._isArmed(key);
      return `<button class="qbtn${d.on ? " on" : ""}${armed ? " armed" : ""}${this._busy[key] ? " busy" : ""}" style="--c:${d.color}" data-act="ctl" data-key="${key}">` +
        `<span class="qi">${icon(d.icon)}</span><span class="ql">${esc(armed ? t("tapConfirm") : d.label)}</span></button>`;
    });
    return `<div class="quick">${buttons.join("")}</div>`;
  }

  /* ----- speed limit ----- */

  /** The speed to compare with: the user's alert speed, else the car's own limit when on. */
  _speedLimit() {
    const a = this._s("speeding")?.attributes || {};
    const alert = Number(a.threshold_kmh);
    if (isFinite(alert) && alert > 0) return { kmh: alert, source: a.threshold_source || "setting" };
    const car = this._v("speedLimit");
    if (this._on("speedLimitOn") === true && car != null && car > 0) return { kmh: car, source: "vehicle" };
    return null;
  }

  /* ----- dynamic car picture ----- */

  /**
   * State overlays on the car (official render or built-in drawing): climate
   * glow, unlocked ring, motion and headlight while driving, sentry, open
   * doors/trunk/windows, low tires and the battery bar while plugged in.
   * Positions assume the car faces right, as in the scene (mirror the picture
   * in the card options if it does not).
   */
  _carFx({ charging, plugged, night, driving, locked }, { tirePins = true } = {}) {
    const t = (k, v) => this._tr(k, v);
    const fx = [];
    const pin = (x, y, label, cls = "") =>
      fx.push(`<span class="fxpin${cls ? ` ${cls}` : ""}" style="left:${x}%;top:${y}%"><b>${esc(label)}</b><i></i></span>`);
    if (this._on("climateOn") === true || this._s("climateSwitch")?.state === "on") {
      const mode = String(this._s("climateMode")?.state || "");
      const out = this._v("outdoor");
      const warm = mode.includes("heat") || (!mode.includes("cool") && out != null && out < 16);
      fx.push(`<span class="fxaura ${warm ? "warm" : "cool"}"></span>`);
    }
    if (locked === false) fx.push(`<span class="fxring"></span>`);
    if (driving) {
      fx.push(`<span class="fxmotion"><i></i><i></i><i></i></span>`);
      if (night) fx.push(`<span class="fxbeam"></span>`);
    }
    if (this._s("sentry")?.state === "on") fx.push(`<span class="fxsentry"><i></i>${esc(t("sentryOn"))}</span>`);
    const front = this._on("doorDriver") || this._on("doorPassenger");
    const rear = this._on("doorRearLeft") || this._on("doorRearRight");
    if (front || rear) pin(front ? 58 : 42, 48, t("doors"));
    if (this._on("trunk")) pin(8, 40, t("trunk"));
    if (["winFL", "winFR", "winRL", "winRR"].some((k) => this._on(k))) pin(50, 24, t("windows"));
    if (this._on("skylight")) pin(47, 6, t("sunroof"));
    const low = (k) => { const v = this._v(k); return v != null && v < TIRE_LOW_BAR; };
    if (tirePins && (low("tireFL") || low("tireFR"))) pin(76, 82, t("tireLowShort"), "bad");
    if (tirePins && (low("tireRL") || low("tireRR"))) pin(25, 82, t("tireLowShort"), "bad");
    const soc = this._v("battery");
    if (plugged && soc != null) fx.push(`<span class="fxbatt${charging ? " on" : ""}"><i style="width:${clamp(soc, 0, 100)}%"></i></span>`);
    return fx.join("");
  }

  /* ----- charge limit ----- */

  /** − / + only change the value shown; nothing is sent until Set is confirmed. */
  _bumpLimit(delta) {
    const n = this._s("chargeLimitSet");
    if (!n || !delta || this._busy.limit) return;
    const a = n.attributes || {};
    const step = Number(a.step) || 1;
    const min = isFinite(Number(a.min)) ? Number(a.min) : 1;
    const max = isFinite(Number(a.max)) ? Number(a.max) : 100;
    const current = this._currentLimit();
    const base = this._limitPending ?? current ?? 80;
    const next = clamp(Math.round((base + delta * step) / step) * step, min, max);
    this._limitPending = next === current ? null : next;
    if (this._armed?.key === "limitSet") this._armed = null;
    this._renderSection("charging");
  }

  _confirmLimit() {
    if (this._limitPending == null || this._busy.limit) return;
    if (this._config.confirm_actions && !this._isArmed("limitSet")) {
      this._arm("limitSet");
      return;
    }
    this._armed = null;
    this._sendLimit();
  }

  _cancelLimit() {
    this._limitPending = null;
    if (this._armed?.key === "limitSet") this._armed = null;
    this._renderSection("charging");
  }

  async _sendLimit() {
    const value = this._limitPending;
    const id = this._ids.chargeLimitSet;
    if (value == null || !id) return;
    this._busy.limit = true;
    this._renderSection("charging");
    try {
      await this._hass.callService("number", "set_value", { entity_id: id, value });
      this._toast(this._tr("sent", { x: this._tr("limitSet", { x: `${value} %` }) }));
    } catch (err) {
      this._toast(this._tr("failed", { x: err?.message || String(err) }));
    }
    this._limitPending = null;
    delete this._busy.limit;
    this._renderSection("charging");
  }

  /* ----- trip map ----- */

  _mapTrips() {
    const a = this._s("lastTrip")?.attributes || {};
    const recent = Array.isArray(a.recent_trips) ? a.recent_trips : [];
    const current = a.current_trip && a.current_trip.start ? { ...a.current_trip, live: true } : null;
    return { recent, current };
  }

  /** The trip shown on the map: the one tapped in the trip log, else the live or latest trip. */
  _mapSelected() {
    const { recent, current } = this._mapTrips();
    if (this._mapSel === "live" && current) return current;
    if (typeof this._mapSel === "number" && recent[this._mapSel]) return recent[this._mapSel];
    return current || recent[0] || null;
  }

  _tripKey(trip) {
    return trip ? `${trip.start}|${trip.live ? "live" : trip.end}` : "";
  }

  _mapSig() {
    const trip = this._mapSelected();
    const key = this._tripKey(trip);
    const tr = this._track;
    return [key, tr && tr.key === key ? `${tr.state}|${tr.fetchedAt}` : "-", this._trackLoading ? 1 : 0,
      this._sig(["speeding", "speedLimit", "speedLimitOn", "tracker"]), trip?.live ? Math.floor(Date.now() / MIN) : 0].join("#");
  }

  _mapHtml() {
    const t = (k, v) => this._tr(k, v);
    const trip = this._mapSelected();
    const tr = this._track && this._track.key === this._tripKey(trip) ? this._track : null;
    if (!trip) return { maphead: this._head(t("tripDetail"), "pin"), mapfoot: "" };
    const start = new Date(trip.start);
    const end = trip.end ? new Date(trip.end) : null;
    const when = `${this._time(start)}${end && !trip.live ? ` – ${this._time(end)}` : ""}`;
    const dur = trip.duration_min != null ? this._dur(trip.duration_min) : null;
    const live = trip.live ? `<span class="livebadge"><span class="dot pulse" style="--c:#38bdf8"></span>${esc(t("mapLive"))}</span>` : "";
    const maphead = this._head(t("tripDetail"), "pin", live)
      + `<div class="tdh"><div class="dist">${this._num(trip.distance_km ?? 0, 1)}<small>km</small></div>`
      + `<div class="when"><b>${esc(this._tripDay(start))}</b><span>${esc([when, dur].filter(Boolean).join(" · "))}</span></div></div>`;

    const sl = this._speedLimit();
    const limit = tr?.limit ?? sl?.kmh ?? null;
    const legend = (limit
      ? [[SPEED_SLOW, t("legendBelow")], [SPEED_MID, t("legendNear")], [SPEED_FAST, t("legendAbove")]]
      : [[SPEED_SLOW, `${t("legendSlow")} km/h`], [SPEED_MID, `${t("legendMid")} km/h`], [SPEED_FAST, `${t("legendFast")} km/h`]])
      .map(([c, l]) => `<span><i style="--c:${c}"></i>${esc(l)}</span>`).join("");

    const top = trip.max_speed_kmh ?? tr?.maxKmh ?? null;
    const cons = trip.consumption_kwh_100km;
    const price = this._pricePerKwh();
    const currency = this._unit("driveCost") || this._unit("monthCost");
    const cells = [];
    const stat = (label, value, unit, color = "") =>
      cells.push(`<div class="stat"><small>${esc(label)}</small><b${color ? ` style="color:${color}"` : ""}>${value}${unit ? `<span>${esc(unit)}</span>` : ""}</b></div>`);
    if (trip.energy_kwh != null) stat(t("colEnergy"), this._num(trip.energy_kwh, 1), "kWh");
    if (cons != null) stat(t("efficiency"), this._num(cons, 1), "kWh/100", rampColor(EFFICIENCY_STOPS, clamp((cons - 10) / 20, 0, 1)));
    if (trip.start_soc != null && trip.end_soc != null) stat(t("colSoc"), `${this._num(trip.start_soc)} → ${this._num(trip.end_soc)}`, "%");
    if (trip.avg_speed_kmh != null) stat(t("avgSpeedL"), this._num(trip.avg_speed_kmh), "km/h");
    if (top) stat(t("topSpeed"), this._num(top), "km/h", limit && top > limit ? SPEED_FAST : "");
    if (limit && tr && tr.state === "ok") stat(t("aboveLimit"), this._num(Math.round(tr.aboveMs / MIN)), "min", tr.aboveMs > 0 ? SPEED_FAST : "");
    if (price && trip.energy_kwh != null) stat(t("cost"), esc(this._money(trip.energy_kwh * price, currency)), "");
    if (trip.outdoor_temp_c != null) stat(t("outside"), this._num(trip.outdoor_temp_c, 1), "°C");
    if (trip.eco_score != null) stat(t("ecoScore"), this._num(trip.eco_score), "", this._ecoColor(trip.eco_score));
    return {
      maphead,
      mapfoot: `${this._replayHtml(tr)}<div class="legend">${legend}</div>${cells.length ? `<div class="stats">${cells.join("")}</div>` : ""}${this._speedChartHtml(tr, limit, sl?.source)}`,
    };
  }

  /** Speed over the trip from the recorder, coloured like the route, with the limit as a dashed line. */
  _speedChartHtml(tr, limit, source) {
    const t = (k, v) => this._tr(k, v);
    if (!tr || tr.state !== "ok" || !isFinite(tr.t0) || !isFinite(tr.t1)) return "";
    const t0 = tr.t0, t1 = Math.max(tr.t1, tr.t0 + MIN);
    const sp = (tr.speeds || []).filter(([ts]) => ts >= t0 - MIN && ts <= t1 + MIN).map(([ts, v]) => [clamp(ts, t0, t1), Math.max(0, v)]);
    if (sp.length < 2) return "";
    const top = Math.max(...sp.map(([, v]) => v));
    const hi = Math.max(40, Math.ceil((Math.max(top, limit || 0) * 1.1) / 20) * 20);
    const X = (ts) => f1(((ts - t0) / (t1 - t0)) * 1000);
    const Y = (v) => f1((1 - v / hi) * 200);
    const line = sp.map(([ts, v], i) => `${i ? "L" : "M"}${X(ts)} ${Y(v)}`).join("");
    const area = `${line}L${X(sp[sp.length - 1][0])} 200L${X(sp[0][0])} 200Z`;
    const [b1, b2] = limit ? [limit * 0.9, limit] : [50, 90];
    const o = (v) => clamp(v / hi, 0, 1).toFixed(3);
    const grad = `<linearGradient id="lm-spdg" gradientUnits="userSpaceOnUse" x1="0" y1="200" x2="0" y2="0">
      <stop offset="0" stop-color="${SPEED_SLOW}"/><stop offset="${o(b1)}" stop-color="${SPEED_SLOW}"/><stop offset="${o(b1)}" stop-color="${SPEED_MID}"/>
      <stop offset="${o(b2)}" stop-color="${SPEED_MID}"/><stop offset="${o(b2)}" stop-color="${SPEED_FAST}"/><stop offset="1" stop-color="${SPEED_FAST}"/></linearGradient>
      <linearGradient id="lm-spda" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#38bdf8" stop-opacity=".28"/><stop offset="1" stop-color="#38bdf8" stop-opacity="0"/></linearGradient>`;
    const PLOT = 118; // px: .spdbox height minus the time labels
    const yl = [0, hi / 2, hi].map((v) => `<span class="yl" style="top:${f1((1 - v / hi) * PLOT)}px">${this._num(v)}</span>`).join("");
    const limLine = limit && limit < hi
      ? `<line x1="0" x2="1000" y1="${Y(limit)}" y2="${Y(limit)}" stroke="${SPEED_FAST}" stroke-width="1.4" stroke-dasharray="6 6" vector-effect="non-scaling-stroke" opacity=".85"/>` : "";
    const limLabel = limit && limit < hi && Math.abs(limit - hi / 2) > hi * 0.08 && Math.abs(limit - hi) > hi * 0.08
      ? `<span class="yl lim" style="top:${f1((1 - limit / hi) * PLOT)}px">${this._num(limit)}</span>` : "";
    const mid = new Date((t0 + t1) / 2);
    const right = limit ? `${t(source === "vehicle" ? "limitCar" : "limitAlert")} ${this._num(limit)} km/h` : t("maxL", { x: `${this._num(top)} km/h` });
    return `<div class="spd"><div class="sh">${esc(t("speed"))} · km/h<span>${esc(right)}</span></div>
      <div class="spdbox">${yl}${limLabel}
        <svg viewBox="0 0 1000 200" preserveAspectRatio="none" aria-hidden="true"><defs>${grad}</defs>
          <line x1="0" x2="1000" y1="200" y2="200" stroke="rgba(148,163,184,.25)" vector-effect="non-scaling-stroke"/>
          <line x1="0" x2="1000" y1="100" y2="100" stroke="rgba(148,163,184,.08)" vector-effect="non-scaling-stroke"/>
          <path d="${area}" fill="url(#lm-spda)"/>${limLine}
          <path d="${line}" fill="none" stroke="url(#lm-spdg)" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>
        </svg>
        <div class="xl"><span>${esc(this._time(new Date(t0)))}</span><span>${esc(this._time(mid))}</span><span>${esc(this._time(new Date(t1)))}</span></div>
      </div></div>`;
  }

  _syncMap() {
    const box = this.shadowRoot.getElementById("mapbox");
    if (!box) return;
    const trip = this._mapSelected();
    if (!trip) {
      this._showMapMsg(box, this._tr("mapHint"));
      return;
    }
    const key = this._tripKey(trip);
    const tr = this._track;
    const current = tr && tr.key === key;
    if (!current || (trip.live && Date.now() - tr.fetchedAt > MIN)) {
      if (!this._trackLoading) this._fetchTrack(trip, key);
      if (!current) {
        this._showMapMsg(box, this._tr("mapLoading"));
        return;
      }
    }
    if (tr.state !== "ok") {
      this._showMapMsg(box, this._tr("mapEmpty"));
      return;
    }
    this._drawRoute(box, tr);
  }

  _showMapMsg(box, message) {
    box.__drawn = null;
    let msg = box.querySelector(".mapmsg");
    if (!msg) {
      msg = document.createElement("div");
      msg.className = "mapmsg";
      box.appendChild(msg);
    }
    msg.textContent = message;
    box.classList.add("msg");
  }

  /** Route from the recorder: device tracker positions plus recorded speed. */
  async _fetchTrack(trip, key) {
    this._trackLoading = true;
    const tracker = this._ids.tracker;
    const speedId = this._ids.speed;
    const startMs = Date.parse(trip.start);
    const endMs = trip.live || !trip.end ? Date.now() : Date.parse(trip.end);
    const limit = this._speedLimit()?.kmh || null;
    const points = [];
    let speeds = [];
    try {
      if (!tracker || typeof this._hass.callWS !== "function" || !isFinite(startMs) || !isFinite(endMs)) throw new Error("no history");
      const from = startMs - 2 * MIN;
      const base = {
        type: "history/history_during_period",
        start_time: new Date(from).toISOString(),
        end_time: new Date(endMs + 2 * MIN).toISOString(),
        significant_changes_only: false,
      };
      const [loc, spd] = await Promise.all([
        this._hass.callWS({ ...base, entity_ids: [tracker], minimal_response: false, no_attributes: false }),
        speedId ? this._hass.callWS({ ...base, entity_ids: [speedId], minimal_response: true, no_attributes: true }).catch(() => ({})) : {},
      ]);
      const tsOf = (st) => (st.lu != null ? st.lu * 1000 : st.lc != null ? st.lc * 1000 : Date.parse(st.last_updated || st.last_changed));
      for (const st of loc?.[tracker] || []) {
        const a = st.a || st.attributes || {};
        const lat = Number(a.latitude), lon = Number(a.longitude), ts = tsOf(st);
        if (!isFinite(lat) || !isFinite(lon) || (lat === 0 && lon === 0) || !isFinite(ts)) continue;
        const prev = points[points.length - 1];
        if (prev && Math.abs(prev[1] - lat) < 1e-6 && Math.abs(prev[2] - lon) < 1e-6) continue;
        points.push([Math.max(ts, from), lat, lon]);
      }
      speeds = (spd?.[speedId] || []).map((st) => [tsOf(st), parseFloat(st.s ?? st.state)]).filter(([ts, v]) => isFinite(ts) && isFinite(v));
    } catch (_e) {
      points.length = 0;
    }
    this._track = {
      key, fetchedAt: Date.now(), state: points.length ? "ok" : "empty", live: !!trip.live,
      points, speeds, t0: startMs, t1: endMs, limit, ...trackRuns(points, speeds, limit),
    };
    this._trackLoading = false;
    this._renderSection("map");
  }

  /** Load Home Assistant's own map element (it is only defined once a map card loads). */
  async _ensureHaMap() {
    if (customElements.get("ha-map")) return true;
    if (typeof window.loadCardHelpers !== "function") return false;
    if (!this._haMapLoad) {
      this._haMapLoad = (async () => {
        try {
          const helpers = await window.loadCardHelpers?.();
          if (helpers) await helpers.createCardElement({ type: "map", entities: this._ids.tracker ? [this._ids.tracker] : [] });
          await Promise.race([customElements.whenDefined("ha-map"), new Promise((r) => setTimeout(r, 5000))]);
        } catch (_e) {
          // No card helpers (outside Home Assistant): use the drawn route.
        }
        return !!customElements.get("ha-map");
      })();
    }
    return this._haMapLoad;
  }

  async _drawRoute(box, tr) {
    const key = `${tr.key}|${tr.fetchedAt}`;
    if (box.__drawn === key) return;
    if (this._replay && this._replay.key !== tr.key) this._stopReplay();
    box.__drawn = key;
    box.classList.remove("msg");
    const useMap = this._config.map !== "drawn" && (await this._ensureHaMap());
    if (box.__drawn !== key) return;
    if (!useMap || !this._drawLeaflet(box, tr, key)) this._drawSvg(box, tr);
  }

  _drawSvg(box, tr) {
    box.querySelector("ha-map")?.remove();
    box.querySelector(".routesvg")?.remove();
    // Draw at the box's own size so the route fills phones and wide screens alike.
    const w = Math.round(clamp(box.clientWidth || 640, 240, 1600));
    const h = Math.round(clamp(box.clientHeight || 300, 180, 900));
    box.insertAdjacentHTML("afterbegin", routeSvg(tr, this._tr("mapStart"), this._tr(tr.live ? "mapLive" : "mapEnd"), w, h, this._look === "classic"));
  }

  /** Draw the coloured route on Home Assistant's map (dark tiles), or report failure. */
  _drawLeaflet(box, tr, key) {
    let map = box.querySelector("ha-map");
    try {
      if (!map) {
        box.querySelector(".routesvg")?.remove();
        map = document.createElement("ha-map");
        map.className = "hamap";
        map.hass = this._hass;
        map.autoFit = false;
        map.themeMode = "dark";
        map.darkMode = true;
        map.zoom = 14;
        map.entities = [];
        box.prepend(map);
      } else {
        map.hass = this._hass;
      }
    } catch (_e) {
      map?.remove();
      return false;
    }
    let tries = 0;
    const draw = () => {
      if (box.__drawn !== key) return;
      const L = map.Leaflet, lm = map.leafletMap;
      if (!L || !lm) {
        if (++tries > 60) {
          map.remove();
          this._drawSvg(box, tr);
        } else setTimeout(draw, 100);
        return;
      }
      map.__lmLayer?.remove();
      const group = L.featureGroup();
      for (const run of tr.runs) {
        L.polyline(run.pts, { color: "#060a16", weight: 9, opacity: 0.6, lineCap: "round", lineJoin: "round" }).addTo(group);
        L.polyline(run.pts, { color: run.color, weight: 5, opacity: 0.95, lineCap: "round", lineJoin: "round" }).addTo(group);
      }
      const first = tr.points[0], last = tr.points[tr.points.length - 1];
      L.circleMarker([first[1], first[2]], { radius: 7, color: "#e9eef8", weight: 2, fillColor: SPEED_SLOW, fillOpacity: 1 })
        .bindTooltip(this._tr("mapStart")).addTo(group);
      L.circleMarker([last[1], last[2]], { radius: 8, color: "#e9eef8", weight: 2, fillColor: SPEED_MID, fillOpacity: 1 })
        .bindTooltip(this._tr(tr.live ? "mapLive" : "mapEnd")).addTo(group);
      group.addTo(lm);
      map.__lmLayer = group;
      const fit = () => {
        try {
          lm.invalidateSize();
          lm.fitBounds(group.getBounds(), { padding: [30, 30], maxZoom: 16 });
        } catch (_e) { /* map not sized yet */ }
      };
      box.__fit = fit;
      fit();
      setTimeout(fit, 500);
    };
    draw();
    return true;
  }

  /* ----- remote control ----- */

  /**
   * Every remote action the car supports, with a group: climate, access
   * (doors, windows, security) or charging (shown in the charging panel).
   */
  _controlDefs() {
    const t = (k) => this._tr(k);
    const defs = {};
    const add = (key, group, o) => { if (o.entity) defs[key] = { ...o, group }; };
    const sw = (k) => this._s(k);
    const lock = this._s("lock");
    if (lock) {
      const locked = lock.state === "locked";
      add(locked ? "unlockCar" : "lockCar", "access", { entity: this._ids.lock, domain: "lock", service: locked ? "unlock" : "lock", label: locked ? t("unlock") : t("lock"), icon: locked ? "lock" : "unlock", color: "#f6a823", sub: locked ? t("locked") : t("unlocked"), on: !locked });
    }
    const ph = this._s("preheatBtn")?.attributes;
    if (ph) {
      const sub = this._tr("preheatSub", { t: this._num(ph.temperature ?? 22), f: ph.fan_speed ?? 7 })
        + (ph.recirculate ? ` · ${this._tr("recircShort")}` : "");
      add("cabinPreheat", "climate", { entity: this._ids.preheatBtn, domain: "button", service: "press", label: t("preheatCabin"), icon: "flame", color: "#fb7185", sub });
    }
    const pc = this._s("precoolBtn")?.attributes;
    if (pc) {
      const sub = this._tr("preheatSub", { t: this._num(pc.temperature ?? 18), f: pc.fan_speed ?? 7 })
        + (pc.recirculate ? ` · ${this._tr("recircShort")}` : "");
      add("cabinPrecool", "climate", { entity: this._ids.precoolBtn, domain: "button", service: "press", label: t("precoolCabin"), icon: "snow", color: "#7dd3fc", sub });
    }
    const pa = this._s("preconditionBtn")?.attributes;
    if (pa) {
      const outside = this._v("outdoor");
      const sub = `${pa.mode === "cold" ? t("willCool") : t("willHeat")}${outside != null ? ` · ${this._num(outside, 1)} °C` : ""}`;
      add("cabinAuto", "climate", { entity: this._ids.preconditionBtn, domain: "button", service: "press", label: t("autoCabin"), icon: "thermo", color: "#a78bfa", sub });
    }
    const swDef = (key, group, k, label, ic, color, extra = "") => {
      const s = sw(k);
      if (!s) return;
      add(key, group, { entity: this._ids[k], domain: "switch", service: s.state === "on" ? "turn_off" : "turn_on", label, icon: ic, color, on: s.state === "on", sub: (s.state === "on" ? t("on") : t("off")) + extra });
    };
    const btn = (key, group, k, label, ic, color, sub = "") => add(key, group, { entity: this._ids[k], domain: "button", service: "press", label, icon: ic, color, sub });
    const inside = this._v("interior");
    swDef("climate", "climate", "climateSwitch", t("climate"), "fan", "#38bdf8", inside != null ? ` · ${this._num(inside, 1)} °C` : "");
    btn("quickHeat", "climate", "quickHeatBtn", t("quickHeat"), "flame", "#fb923c");
    btn("quickCool", "climate", "quickCoolBtn", t("quickCool"), "snow", "#7dd3fc");
    btn("defrost", "climate", "defrostBtn", t("defrost"), "defrost", "#5eead4");
    swDef("steering", "climate", "steeringHeat", t("steering"), "wheel", "#fbbf24");
    swDef("mirrors", "climate", "mirrorHeat", t("mirrors"), "mirror", "#c4b5fd");
    if (this._on("trunk")) btn("trunk", "access", "trunkCloseBtn", t("closeTrunk"), "trunk", "#2dd4bf");
    else btn("trunk", "access", "trunkOpenBtn", t("openTrunk"), "trunk", "#2dd4bf");
    if (WINDOWS.some((k) => this._on(k))) btn("windows", "access", "windowsCloseBtn", t("closeWindows"), "window", "#38bdf8");
    else btn("windows", "access", "windowsOpenBtn", t("openWindows"), "window", "#38bdf8");
    if (this._on("skylight")) btn("sunroof", "access", "sunroofCloseBtn", t("closeRoof"), "roof", "#94a3b8");
    else btn("sunroof", "access", "sunroofOpenBtn", t("openRoof"), "roof", "#94a3b8");
    const shade = this._v("sunshadePos");
    if (shade != null && shade > 0) btn("sunshade", "access", "sunshadeCloseBtn", t("closeSunshade"), "sunshade", "#94a3b8");
    else btn("sunshade", "access", "sunshadeOpenBtn", t("openSunshade"), "sunshade", "#94a3b8");
    swDef("sentry", "access", "sentry", t("sentry"), "cctv", "#f472b6");
    btn("find", "access", "findBtn", t("findCar"), "find", "#f472b6");
    const { plugged, charging } = this._chargeState();
    if (plugged) {
      if (charging) btn("charge", "charging", "stopChargeBtn", t("stopCharge"), "plug", "#f6a823");
      else btn("charge", "charging", "startChargeBtn", t("startCharge"), "bolt", "#34d399");
    }
    swDef("schedule", "charging", "chargeSchedule", t("schedule"), "calendar", "#a78bfa");
    swDef("preheat", "charging", "preheat", t("preheat"), "battery", "#34d399");
    swDef("healthy", "charging", "healthyCharging", t("healthy"), "heart", "#34d399");
    if (plugged) btn("unlockCharger", "charging", "unlockCharger", t("unlockCharger"), "plug", "#34d399");
    return defs;
  }

  _controlsSig() {
    return [this._sig(["lock", "climateSwitch", "preheat", "steeringHeat", "mirrorHeat", "chargeSchedule", "trunk", "sunshadePos", "isPlugged", "isCharging", "connection", "interior", "sentry", "healthyCharging", "skylight", "preheatBtn", "precoolBtn", "preconditionBtn", "outdoor"]),
      this._sig(WINDOWS), JSON.stringify(this._armed), JSON.stringify(this._busy)].join("#");
  }

  _tileHtml(key, d) {
    const armed = this._isArmed(key);
    return `<button class="tile${d.on ? " on" : ""}${armed ? " armed" : ""}${this._busy[key] ? " busy" : ""}" style="--c:${d.color}" data-act="ctl" data-key="${key}">
      <span class="sq">${icon(d.icon)}</span><span class="tx"><span class="tl">${esc(d.label)}</span>${armed || d.sub ? `<span class="ts">${esc(armed ? this._tr("tapConfirm") : d.sub)}</span>` : ""}</span></button>`;
  }

  /** Tiles of one group, leaving out the actions that already sit in the hero as quick buttons. */
  _groupTilesHtml(group, defs = this._controlDefs()) {
    const skip = new Set(this._quickKeys(defs));
    const tiles = Object.entries(defs).filter(([k, d]) => d.group === group && !skip.has(k)).map(([k, d]) => this._tileHtml(k, d));
    return tiles.length ? `<div class="tiles">${tiles.join("")}</div>` : "";
  }

  _controlsHtml() {
    const t = (k) => this._tr(k);
    const defs = this._controlDefs();
    const groups = [["climate", "groupClimate"], ["access", "groupAccess"]];
    // Charging actions live in the charging panel; without it they stay here.
    if (!this._config.sections.includes("charging")) groups.push(["charging", "groupCharging"]);
    const body = groups.map(([g, label]) => {
      const tiles = this._groupTilesHtml(g, defs);
      return tiles ? `<div class="subh">${esc(t(label))}</div>${tiles}` : "";
    }).join("");
    const foot = this._config.confirm_actions && body ? `<div class="foot">${esc(t("confirmHint"))}</div>` : "";
    return `${this._head(t("controls"), "spark")}${body || `<div class="empty">—</div>`}${foot}`;
  }

  /* ----- settings: theme and language for each user ----- */

  /**
   * Personal theme, day or night and language, kept in Home Assistant's
   * frontend user data (same user, every device). Falls back to this browser
   * when that store is not available. The card configuration gives the defaults.
   */
  async _loadPrefs() {
    if (this._prefsState) return;
    this._prefsState = "loading";
    let value = null;
    try {
      const res = await this._hass.callWS({ type: "frontend/get_user_data", key: PREFS_KEY });
      value = res?.value ?? null;
      this._prefsWhere = "user";
    } catch (_e) {
      this._prefsWhere = "local";
      try { value = JSON.parse(window.localStorage.getItem(PREFS_KEY) || "null"); } catch (_e2) { value = null; }
    }
    this._prefsState = "ready";
    this._applyPrefs(value);
  }

  _applyPrefs(value) {
    const v = value && typeof value === "object" ? value : {};
    const next = {};
    if (LOOKS.includes(v.look)) next.look = v.look;
    if (v.language === "auto" || LANGS.some(([c]) => c === v.language)) next.language = v.language;
    if (SCENES.includes(v.scene)) next.scene = v.scene;
    if (JSON.stringify(next) === JSON.stringify(this._prefs || {})) return;
    const rebuild = (next.look ?? this._config.look) !== (this._prefs?.look ?? this._config.look);
    this._prefs = next;
    if (!this._hass || !this._config) return;
    if (rebuild) this._built = false;
    this._sigs = {};
    this._render(true);
  }

  async _savePrefs(patch) {
    const next = { ...(this._prefs || {}), ...patch };
    for (const k of Object.keys(next)) if (next[k] == null) delete next[k];
    this._applyPrefs(next);
    // Other Leapmotor cards on this page follow at once.
    window.dispatchEvent(new CustomEvent("leapmotor-card-prefs", { detail: { value: next, from: this } }));
    if (this._prefsWhere !== "local") {
      try {
        await this._hass.callWS({ type: "frontend/set_user_data", key: PREFS_KEY, value: next });
        return;
      } catch (_e) {
        this._prefsWhere = "local";
        this._renderSection("settings");
      }
    }
    try { window.localStorage.setItem(PREFS_KEY, JSON.stringify(next)); } catch (_e) { /* kept until reload */ }
  }

  _settingsHtml() {
    const t = (k, v) => this._tr(k, v);
    const prefs = this._prefs || {};
    const look = this._look;
    const lang = prefs.language ?? this._config.language ?? "auto";
    const scene = prefs.scene ?? this._config.scene ?? "auto";
    const seg = (key, items, current) => `<div class="sseg" role="radiogroup">${items.map(([v, label, sub]) =>
      `<button type="button" role="radio" aria-checked="${v === current}" class="${v === current ? "on" : ""}" data-act="pref" data-k="${key}" data-v="${v}">` +
      `<b>${esc(label)}</b>${sub ? `<small>${esc(sub)}</small>` : ""}</button>`).join("")}</div>`;
    const looks = LOOKS.map((l) =>
      `<button type="button" role="radio" aria-checked="${l === look}" class="lk${l === look ? " on" : ""}" data-act="pref" data-k="look" data-v="${l}">` +
      `${lookThumb(l)}<span class="lkt"><b>${esc(t(`look_${l}`))}</b><small>${esc(t(`look_${l}_d`))}</small></span></button>`).join("");
    const custom = Object.keys(prefs).length > 0;
    return `
      ${this._head(t("pageSettings"), "gear")}
      <div class="sgrp">
        <div class="subh">${esc(t("lookL"))}</div>
        <div class="looks" role="radiogroup" aria-label="${esc(t("lookL"))}">${looks}</div>
        <div class="srow"><span class="slab">${esc(t("setScene"))}</span>
          ${seg("scene", [["auto", t("sceneAuto")], ["day", t("sceneDay")], ["night", t("sceneNight")]], scene)}</div>
        <div class="foot">${esc(t("sceneHint"))}</div>
      </div>
      <div class="sgrp">
        <div class="subh">${esc(t("setLanguage"))}</div>
        ${seg("language", [["auto", t("langAuto"), t("langAutoSub")], ...LANGS.map(([c, n]) => [c, n, c.toUpperCase()])], lang).replace('class="sseg"', 'class="sseg langs"')}
      </div>
      <div class="sfoot"><span>${esc(t(this._prefsWhere === "local" ? "setSavedLocal" : "setSavedUser"))}</span>
        ${custom ? `<button type="button" class="mdone" data-act="prefreset">${esc(t("setReset"))}</button>` : ""}</div>`;
  }

  /* ----- helpers of the insight panels ----- */

  _a(key, name) {
    return this._s(key)?.attributes?.[name];
  }

  /** Weekday name for Monday = 0 … Sunday = 6. */
  _weekday(index, style = "long") {
    // 1 January 2024 was a Monday.
    if (index == null || !Number.isFinite(Number(index))) return "—";
    const date = new Date(Date.UTC(2024, 0, 1 + ((Math.trunc(Number(index)) % 7) + 7) % 7, 12));
    try {
      return new Intl.DateTimeFormat(this._lang, { weekday: style, timeZone: "UTC" }).format(date);
    } catch (_e) {
      return new Intl.DateTimeFormat("en", { weekday: style, timeZone: "UTC" }).format(date);
    }
  }

  _date(value, options = { day: "numeric", month: "short" }) {
    const date = value instanceof Date ? value : new Date(value);
    if (!isFinite(date)) return "—";
    try {
      return new Intl.DateTimeFormat(this._lang, options).format(date);
    } catch (_e) {
      return date.toDateString();
    }
  }

  /** A date-only text (YYYY-MM-DD or YYYY-MM) as a local date, so the day never shifts. */
  _day(text) {
    const m = /^(\d{4})-(\d{2})(?:-(\d{2}))?/.exec(String(text || ""));
    return m ? new Date(+m[1], +m[2] - 1, m[3] ? +m[3] : 1, 12) : new Date(NaN);
  }

  /** "07:20" in the user's clock format. */
  _clock(hhmm) {
    const m = /^(\d{1,2}):(\d{2})/.exec(String(hhmm || ""));
    if (!m) return String(hhmm || "—");
    const date = new Date();
    date.setHours(+m[1], +m[2], 0, 0);
    return this._time(date);
  }

  _currency() {
    return this._unit("monthCost") || this._unit("driveCost") || this._unit("lastSessionCost") || this._unit("fuelSavings");
  }

  /* ----- outlook: usual departure, the next day, real range ----- */

  _outlookHtml() {
    const t = (k, v) => this._tr(k, v);
    const o = this._s("nextDay")?.attributes || {};
    const ra = this._s("realRange")?.attributes || {};
    const real = this._v("realRange");
    const known = o.day != null;
    const tiles = [];
    const tile = (st, ic, title, sub, more, big = "") => tiles.push(
      `<div class="otile${st ? ` ${st}` : ""}${more && this._ids[more] ? " clickable" : ""}"${more && this._ids[more] ? ` data-more="${more}"` : ""}>` +
      `<span class="sq">${icon(ic)}</span><div><b>${esc(title)}</b>${sub ? `<small>${esc(sub)}</small>` : ""}</div>${big}</div>`);
    const n = (v) => this._num(v);
    // The expected distance is the state of the sensor, not one of its attributes.
    const expected = o.expected_km ?? this._v("nextDay");
    if (known) {
      const need = o.needed_soc;
      const socSub = o.soc == null ? "" : need != null
        ? t("olSocSub", { soc: n(o.soc), need: n(need) }) : t("olSocOnly", { soc: n(o.soc) });
      if (o.reason === "plugged_in") {
        const raise = o.limit_ok === false && need != null ? ` · ${t("olLimitLow", { p: n(Math.min(100, Math.ceil(need / 5) * 5)) })}` : "";
        tile(o.limit_ok === false ? "warn" : "ok", "plug", t("olPlugged"), socSub + raise, "chargeAdvice");
      } else if (o.reason === "low_battery") tile("bad", "battery", t("olLow"), socSub, "chargeAdvice");
      else if (o.reason === "low_for_next_day") tile("warn", "plug", t(o.is_today ? "olChargeNow" : "olCharge"), socSub, "chargeAdvice");
      else if (o.reason === "enough") tile("ok", "check", t("olEnough"), socSub, "chargeAdvice");
      const dayName = this._weekday(o.weekday);
      if (o.departure?.time) {
        tile("", "clock", t("olLeaves", { t: this._clock(o.departure.time) }),
          t("olLeavesSub", { p: n((o.departure.confidence || 0) * 100), d: dayName }), "nextDeparture");
      } else if (o.drive_probability != null && o.drive_probability < 0.3) {
        tile("", "parked", t("olNoDeparture"), t("olNoDepartureSub", { d: dayName }), "nextDeparture");
      }
      if (expected != null) {
        tile("", "route", t("olNeeds", { km: n(expected) }),
          o.expected_kwh != null && need != null ? t("olNeedsSub", { e: this._num(o.expected_kwh, 1), p: n(need) }) : "", "nextDay");
      }
    }
    if (real != null) {
      const basis = { temperature: t("basisTemp"), recent: t("basisRecent"), six_week: t("basisCloud") }[ra.basis] || "";
      const car = ra.car_km != null ? t("carSays", { x: `${n(ra.car_km)} km` }) : "";
      tile("", "gauge", t("realRange"), [car, basis].filter(Boolean).join(" · "), "realRange",
        `<span class="obig">${n(real)}<small>km</small></span>`);
    }
    const learned = known && (o.departure?.time || expected != null || (o.drive_probability != null && o.drive_probability < 0.3));
    const meta = known
      ? `<span class="meta">${esc(o.is_today ? t("olToday") : t("olTomorrow"))} · ${esc(this._weekday(o.weekday))}</span>` : "";
    const next = this._ts("nextDeparture");
    const nextLine = next && next > Date.now()
      ? `<div class="onext clickable" data-more="nextDeparture">${icon("clock")}<span>${esc(t("nextDep"))} <b>${esc(this._weekday((new Date(next).getDay() + 6) % 7, "short"))} ${esc(this._time(new Date(next)))}</b> · ${esc(t("inTime", { x: this._dur((next - Date.now()) / MIN) }))}</span></div>`
      : "";
    const note = learned ? "" : `<div class="note"><span class="dot" style="--c:var(--lm-sky)"></span><span><b>${esc(t("olLearning"))}.</b> ${esc(t("olLearningSub"))}</span></div>`;
    return `${this._head(t("outlookTitle"), "clock", meta)}${tiles.length ? `<div class="otiles">${tiles.join("")}</div>` : ""}${nextLine}${note}${this._weekPatternHtml(known ? o.weekday : null)}`;
  }

  /** What each weekday usually looks like: distance and first departure. */
  _weekPatternHtml(target) {
    const days = objs(this._a("nextDeparture", "weekdays"));
    if (days.length !== 7 || !days.some((d) => d.typical_km != null || objs(d.departures).length)) return "";
    const top = Math.max(1, ...days.map((d) => d.typical_km || 0));
    const today = (new Date().getDay() + 6) % 7;
    const cols = days.map((d, index) => {
      const km = d.typical_km;
      const first = objs(d.departures)[0];
      const cls = `${index === target ? " target" : ""}${index === today ? " today" : ""}${km ? "" : " idle"}`;
      return `<div class="wkd${cls}"><small>${esc(this._weekday(index, "short").replace(".", ""))}</small>` +
        `<div class="wkb"><i style="height:${km ? Math.max(8, (km / top) * 100) : 0}%"></i></div>` +
        `<b>${km != null ? this._num(km) : "—"}</b><em>${first ? esc(this._clock(first.time)) : "&nbsp;"}</em></div>`;
    });
    return `<div class="subh clickable" data-more="nextDeparture">${esc(this._tr("weekTitle"))}<span class="subm">km</span></div><div class="wk">${cols.join("")}</div>`;
  }

  /* ----- last 24 hours: what the car did ----- */

  _timelineEvents() {
    const h = this._hist;
    if (!h) return null;
    const S = h.series || {};
    const events = [];
    const runs = (series) => {
      const out = [];
      let open = null;
      for (const [ts, on] of series || []) {
        if (on === true && !open) open = { from: ts };
        else if (on === false && open) {
          open.to = ts;
          out.push(open);
          open = null;
        }
      }
      if (open) out.push(open);
      return out;
    };
    const odo = S.odometer || [], bat = S.battery || [];
    for (const run of runs(S.isDriving)) {
      const a = valueAt(odo, run.from), b = valueAt(odo, run.to ?? h.end);
      events.push({ t: run.from, to: run.to, kind: "drive", km: a != null && b != null ? Math.max(0, b - a) : null });
    }
    for (const run of runs(S.isCharging)) {
      const a = valueAt(bat, run.from), b = valueAt(bat, run.to ?? h.end);
      events.push({ t: run.from, to: run.to, kind: "charge", pct: a != null && b != null ? Math.max(0, b - a) : null });
    }
    // The first sample is the state at the start of the window, not a change.
    const changes = (series, map) => {
      let last = null;
      (series || []).forEach(([ts, value], index) => {
        if (index > 0 && value !== last && map[value]) events.push({ t: ts, kind: map[value] });
        last = value;
      });
    };
    changes(S.lock, { locked: "locked", unlocked: "unlocked" });
    changes(S.isPlugged, { true: "plugged", false: "unplugged" });
    return events.sort((x, y) => y.t - x.t);
  }

  _timelineHtml() {
    const t = (k, v) => this._tr(k, v);
    const head = this._head(t("tlTitle"), "calendar");
    const events = this._timelineEvents();
    if (events == null) return `${head}<div class="empty">…</div>`;
    if (!events.length) return `${head}<div class="empty">${esc(t("tlEmpty"))}</div>`;
    const look = {
      drive: ["route", "#38bdf8"], charge: ["bolt", OK_C], locked: ["lock", "#94a3b8"], unlocked: ["unlock", WARN_C],
      plugged: ["plug", "#5eead4"], unplugged: ["plug", "#94a3b8"],
    };
    let wide = false;
    const rows = events.slice(0, this._tlLimit).map((ev) => {
      const [ic, color] = look[ev.kind];
      const from = this._time(new Date(ev.t));
      if (from.length > 5) wide = true;
      const span = ev.to ? `${from} – ${this._time(new Date(ev.to))} · ${this._dur((ev.to - ev.t) / MIN)}` : "";
      let title, sub = span, live = false;
      if (ev.kind === "drive") {
        live = !ev.to;
        title = live ? t("tlDrivingNow") : ev.km != null && ev.km >= 0.1 ? t("tlDrove", { km: this._num(ev.km, ev.km < 100 ? 1 : 0) }) : t("tlDroveShort");
      } else if (ev.kind === "charge") {
        live = !ev.to;
        title = live ? t("tlChargingNow") : ev.pct != null && ev.pct >= 1 ? t("tlCharged", { p: `+${this._num(ev.pct)}` }) : t("tlChargedShort");
        if (live && ev.pct != null && ev.pct >= 1) sub = `+${this._num(ev.pct)} %`;
      } else {
        title = t({ locked: "tlLocked", unlocked: "tlUnlocked", plugged: "tlPlugged", unplugged: "tlUnplugged" }[ev.kind]);
      }
      return `<div class="tlr${live ? " live" : ""}" style="--c:${color}"><span class="tlt">${esc(from)}</span>` +
        `<span class="tld">${icon(ic)}</span><div><b>${esc(title)}</b>${sub ? `<small>${esc(sub)}</small>` : ""}</div></div>`;
    });
    const left = events.length - this._tlLimit;
    const more = left > 0 ? `<button class="more" data-act="moretimeline">${esc(t("showMore", { n: Math.min(10, left) }))}</button>` : "";
    return `${head}<div class="tline${wide ? " wide" : ""}">${rows.join("")}</div>${more}`;
  }

  /* ----- frequent routes ----- */

  _placeName(place) {
    return place?.name || (place?.rank ? this._tr("placeN", { n: place.rank }) : "?");
  }

  _routesHtml() {
    const t = (k, v) => this._tr(k, v);
    const routes = objs(this._a("routes", "routes"));
    const head = this._head(t("rtTitle"), "route");
    if (!routes.length) return `${head}<div class="empty">${esc(t("rtEmpty"))}</div>`;
    const currency = this._currency();
    const cards = routes.map((r) => {
      const stat = (value, unit) => (value == null ? "" : `<div><b>${value}</b><small>${esc(unit)}</small></div>`);
      const cons = r.consumption_kwh_100km;
      const color = cons != null ? rampColor(EFFICIENCY_STOPS, clamp((cons - 10) / 20, 0, 1)) : "";
      const sub = [
        r.usual_departure ? t("rtUsual", { t: this._clock(r.usual_departure) }) : "",
        r.best_duration_min != null && r.duration_min != null && r.best_duration_min < r.duration_min ? t("rtBest", { x: this._dur(r.best_duration_min) }) : "",
        r.best_consumption_kwh_100km != null && cons != null && r.best_consumption_kwh_100km < cons ? t("rtBest", { x: `${this._num(r.best_consumption_kwh_100km, 1)} kWh/100 km` }) : "",
      ].filter(Boolean).join(" · ");
      return `<div class="rcard"><div class="rname">${icon(r.from?.home || r.to?.home ? "pin" : "route")}<b>${esc(this._placeName(r.from))}</b><i>→</i><b>${esc(this._placeName(r.to))}</b>` +
        `${r.trips != null ? `<span class="pill">${esc(t("rtTrips", { n: this._num(r.trips) }))}</span>` : ""}</div>` +
        `<div class="rstats">${stat(this._num(r.distance_km, 1), "km")}${stat(r.duration_min != null ? this._num(r.duration_min) : null, "min")}` +
        `${cons != null ? `<div><b style="color:${color}">${this._num(cons, 1)}</b><small>kWh/100 km</small></div>` : ""}` +
        `${r.cost != null ? `<div><b>${esc(this._money(r.cost, currency))}</b><small>${esc(t("cost"))}</small></div>` : ""}</div>` +
        `${sub ? `<small class="rsub">${esc(sub)}</small>` : ""}</div>`;
    });
    return `${head}<div class="rcards">${cards.join("")}</div>`;
  }

  /* ----- charging curve ----- */

  _curveHtml() {
    const t = (k, v) => this._tr(k, v);
    const a = this._s("curve")?.attributes || {};
    // [battery %, kW] pairs; anything else is left out.
    const pairs = (value) => (Array.isArray(value) ? value.filter((pt) => Array.isArray(pt) && Number.isFinite(pt[0]) && Number.isFinite(pt[1])) : []);
    const live = pairs(a.current?.points).length > 0;
    const shown = live ? a.current : a.last;
    const points = pairs(shown?.points);
    const usual = pairs(a.usual);
    const peak = points.length ? Math.max(...points.map((pt) => pt[1])) : null;
    const head = this._head(t("cvTitle"), "gauge",
      peak != null ? `<span class="cchip" style="--c:${live ? OK_C : "#94a3b8"}">${esc(t("cvPeak", { x: this._num(peak, peak >= 100 ? 0 : 1) }))}</span>` : "");
    let slow = "";
    if (this._on("slowCharging") === true) {
      const sa = this._s("slowCharging").attributes || {};
      slow = `<div class="slowbox clickable" data-more="slowCharging">${icon("alert")}<div><b>${esc(t("slowTitle"))}</b>` +
        `<small>${esc(t("slowSub", { now: this._num(sa.now_kw, 1), usual: this._num(sa.usual_kw, 1) }))}</small></div></div>`;
    }
    if (!points.length) return `${head}${slow}<div class="empty">${esc(t("cvEmpty"))}</div>`;
    const top = Math.max(peak, ...usual.map((pt) => pt[1]), 1);
    const hi = [4, 8, 12, 24, 50, 100, 150, 200, 250, 350].find((v) => v >= top * 1.05) || Math.ceil(top / 100) * 100;
    const X = (soc) => f1(clamp(soc, 0, 100) * 10), Y = (kw) => f1((1 - clamp(kw / hi, 0, 1)) * 300);
    // Each point is the average power over a 2 % slice of the battery.
    const path = (pts) => pts.map(([soc, kw], i) => `${i ? "L" : "M"}${X(soc)} ${Y(kw)}`).join("") + `L${X(pts[pts.length - 1][0] + 2)} ${Y(pts[pts.length - 1][1])}`;
    const line = path(points);
    const area = `${line}L${X(points[points.length - 1][0] + 2)} 300L${X(points[0][0])} 300Z`;
    const color = live ? OK_C : WARN_C;
    const usualLine = usual.length ? `<path d="${path(usual)}" fill="none" stroke="#94a3b8" stroke-width="1.6" stroke-dasharray="6 6" vector-effect="non-scaling-stroke" opacity=".8"/>` : "";
    const last = points[points.length - 1];
    const dot = live ? `<span class="cvdot" style="left:calc(36px + (100% - 36px) * ${clamp(last[0] + 2, 0, 100) / 100});top:${f1((1 - clamp(last[1] / hi, 0, 1)) * 118)}px"></span>` : "";
    const yl = [0, hi / 2, hi].map((v) => `<span class="yl" style="top:${f1((1 - v / hi) * 118)}px">${this._num(v, v % 1 ? 1 : 0)}</span>`).join("");
    const legend = `<span><i style="--c:${color}"></i>${esc(live ? t("cvNow") : t("cvLast"))}</span>` +
      (usual.length ? `<span><i class="dash" style="--c:#94a3b8"></i>${esc(t("cvUsual"))}</span>` : "");
    return `${head}${slow}<div class="spd cv"><div class="sh">kW · ${esc(t("tabBattery"))} %<span>${esc(shown.dc ? "DC" : "AC")}${shown.start ? ` · ${esc(this._date(shown.start))}` : ""}</span></div>
      <div class="spdbox">${yl}
        <svg viewBox="0 0 1000 300" preserveAspectRatio="none" aria-hidden="true">
          <defs><linearGradient id="lm-cva" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity=".32"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs>
          <line x1="0" x2="1000" y1="300" y2="300" stroke="rgba(148,163,184,.25)" vector-effect="non-scaling-stroke"/>
          <line x1="0" x2="1000" y1="150" y2="150" stroke="rgba(148,163,184,.08)" vector-effect="non-scaling-stroke"/>
          <line x1="500" x2="500" y1="0" y2="300" stroke="rgba(148,163,184,.08)" vector-effect="non-scaling-stroke"/>
          <path d="${area}" fill="url(#lm-cva)"/>${usualLine}
          <path d="${line}" fill="none" stroke="${color}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>
        </svg>${dot}
        <div class="xl"><span>0 %</span><span>50 %</span><span>100 %</span></div>
      </div></div><div class="alegend">${legend}</div>`;
  }

  /* ----- charging history from the cloud ----- */

  _sessionsHtml() {
    const t = (k, v) => this._tr(k, v);
    const s = this._s("cloudCharging");
    const a = s?.attributes || {};
    const sessions = objs(a.sessions);
    const head = this._head(t("chTitle"), "plug",
      a.window_days ? `<span class="meta">${esc(t("chMeta", { n: a.window_days }))}</span>` : "");
    if (!sessions.length) return `${head}<div class="empty">${esc(t("chEmpty"))}</div>`;
    const currency = this._currency();
    const m = a.month || {};
    let summary = "";
    if (m.sessions) {
      const shared = (m.home_energy_kwh || 0) + (m.public_energy_kwh || 0);
      const home = shared > 0 ? Math.round((m.home_energy_kwh || 0) / shared * 100) : null;
      const bits = [t("chSessions", { n: m.sessions }), m.cost != null ? this._money(m.cost, currency) : null].filter(Boolean).join(" · ");
      summary = `<div class="chsum"><div class="stat"><small>${esc(t("monthL"))}</small><b>${this._num(m.energy_kwh, 1)}<span>kWh</span></b><em>${esc(bits)}</em></div>` +
        (home != null ? `<div class="stat"><small>${esc(t("tierHome"))}</small><b>${this._num(home)}<span>%</span></b><div class="hbar"><i style="width:${home}%"></i></div></div>` : "") + `</div>`;
    }
    const rows = sessions.slice(0, this._sessLimit).map((item) => {
      const start = new Date(item.start);
      const where = item.place || this._tierLabel(item.tier);
      const bits = [item.duration_min != null ? this._dur(item.duration_min) : null,
        item.avg_power_kw != null ? `${this._num(item.avg_power_kw, 1)} kW` : null, where || null].filter(Boolean);
      const dc = item.type === "dc";
      return `<div class="chrow"><div class="sd"><b>${esc(this._date(start))}</b><small>${isFinite(start) ? esc(this._time(start)) : ""}</small></div>` +
        `<div class="sm"><b>${item.energy_kwh != null ? this._num(item.energy_kwh, 1) : "—"}<small>kWh</small></b><span>${esc(bits.join(" · "))}</span></div>` +
        `<div class="sx">${item.type ? `<span class="pill${dc ? " dc" : ""}">${dc ? "DC" : "AC"}</span>` : ""}${item.cost != null ? `<small>${esc(this._money(item.cost, currency))}</small>` : ""}</div></div>`;
    });
    const left = sessions.length - this._sessLimit;
    const more = left > 0 ? `<button class="more" data-act="moresessions">${esc(t("showMore", { n: Math.min(10, left) }))}</button>` : "";
    return `${head}${summary}<div class="chrows">${rows.join("")}</div>${more}`;
  }

  /* ----- car software, schedules, permissions ----- */

  _softwareHtml() {
    const t = (k, v) => this._tr(k, v);
    const sw = this._s("software");
    const a = sw?.attributes || {};
    const perm = this._s("permissions")?.attributes || {};
    const head = this._head(t("swTitle"), "chip");
    let body;
    if (sw && a.installed_version) {
      const update = sw.state === "on" && a.latest_version && a.latest_version !== a.installed_version;
      const since = a.installed_at ? ` · ${t("swSince", { d: this._date(a.installed_at, { day: "numeric", month: "short", year: "numeric" }) })}` : "";
      const size = update && a.update_size_mb ? ` · ${t("swSize", { x: this._num(a.update_size_mb) })}` : "";
      body = `<div class="summary clickable${update ? " warn" : ""}" data-more="software"><div class="sq">${icon(update ? "download" : "check")}</div><div>` +
        `<b>${esc(update ? t("swUpdate") : t("swUpToDate"))}</b>` +
        `<span>${esc(update ? t("swNew", { v: a.latest_version }) + size : t("swInstalled", { v: a.installed_version }) + since)}</span></div></div>`;
      if (update) body += `<div class="foot" style="margin:-4px 2px 10px">${esc(t("swInstalled", { v: a.installed_version }) + since)}</div>`;
      const notes = Array.isArray(a.notes) ? a.notes.filter((x) => x && (x.title || x.content)).slice(0, 4) : [];
      if (notes.length) {
        body += `<div class="subh">${esc(t("swNotes"))}</div><div class="notes">${notes.map((x) =>
          `<div class="nrow">${x.title ? `<b>${esc(x.title)}</b>` : ""}${x.content ? `<p>${esc(x.content)}</p>` : ""}</div>`).join("")}</div>`;
      }
    } else {
      body = `<div class="cnone" style="margin-top:0">${esc(perm.shared ? t("swOwnerOnly") : t("swUnknown"))}</div>`;
    }
    // Climate schedules read back from the car.
    const schedules = this._a("nextSchedule", "schedules") || {};
    const entries = [...objs(schedules.climate), ...objs(schedules.prepare_car)];
    if (this._s("nextSchedule")) {
      const next = this._ts("nextSchedule");
      const dayList = (days) => {
        const list = Array.isArray(days) ? days.filter((d) => Number.isFinite(Number(d))) : [];
        // An entry without days runs once.
        if (!list.length) return t("schedOnce");
        if (list.length === 7) return t("schedDaily");
        // The app counts Sunday as 0.
        return list.map((d) => this._weekday((Number(d) + 6) % 7, "short").replace(".", "")).join(" ");
      };
      const rows = entries.map((e) => {
        const what = e.kind === "climate"
          ? [{ heat: t("modeHeat"), cool: t("modeCool"), fan: t("modeFan") }[e.mode], e.temperature != null ? `${this._num(e.temperature)} °C` : null].filter(Boolean).join(" ")
          : (e.name || t("autoCabin"));
        return `<div class="schrow${e.enabled === false ? " off" : ""}"><b>${esc(e.time ? this._clock(e.time) : "—")}</b>` +
          `<span>${esc([dayList(e.days), what].filter(Boolean).join(" · "))}</span>${e.enabled === false ? `<span class="pill warn">${esc(t("schedOff"))}</span>` : ""}</div>`;
      });
      body += `<div class="subh clickable" data-more="nextSchedule">${esc(t("schedTitle"))}${next ? `<span class="subm">${esc(t("schedNext", { t: `${this._weekday((new Date(next).getDay() + 6) % 7, "short")} ${this._time(new Date(next))}` }))}</span>` : ""}</div>` +
        (rows.length ? `<div class="schrows">${rows.join("")}</div>` : `<div class="foot" style="margin-top:0">${esc(t("schedNone"))}</div>`);
    }
    if (perm.shared && Array.isArray(perm.rights) && perm.rights.length) {
      const labels = RIGHT_LABELS[this._lang.split("-")[0]] || RIGHT_LABELS.en;
      const chips = perm.rights.map((r) => labels[r]).filter(Boolean);
      if (chips.length) {
        body += `<div class="subh clickable" data-more="permissions">${esc(t("permTitle"))}<span class="subm">${esc(t("permShared"))}</span></div>` +
          `<div class="pchips">${chips.map((c) => `<span>${esc(c)}</span>`).join("")}</div>`;
      }
    }
    return `${head}${body}`;
  }

  /* ----- messages from the car ----- */

  _inboxHtml() {
    const t = (k, v) => this._tr(k, v);
    const s = this._s("inbox");
    const messages = objs(s?.attributes?.messages);
    const unread = this._v("inbox");
    const head = this._head(t("ibTitle"), "mail",
      unread ? `<span class="cchip clickable" data-more="inbox" style="--c:${WARN_C}">${esc(t("ibUnread", { n: this._num(unread) }))}</span>` : "");
    if (!messages.length) return `${head}<div class="empty">${esc(t("ibEmpty"))}</div>`;
    const rows = messages.slice(0, this._inboxLimit).map((msg) => {
      const when = msg.ts ? msg.ts * 1000 : Date.parse(msg.time);
      return `<div class="mrow2${msg.read === false ? " unread" : ""}"><i></i><div><b>${esc(msg.title || msg.message || "")}</b>` +
        `${msg.title && msg.message ? `<p>${esc(msg.message)}</p>` : ""}</div><small>${isFinite(when) ? esc(this._ago(when)) : ""}</small></div>`;
    });
    const left = messages.length - this._inboxLimit;
    const more = left > 0 ? `<button class="more" data-act="moremessages">${esc(t("showMore", { n: Math.min(10, left) }))}</button>` : "";
    return `${head}<div class="mrows2">${rows.join("")}</div>${more}`;
  }

  /* ----- journey: a year of driving ----- */

  /** One heat-map of the last `weeks` weeks; a column is a week, Monday on top. */
  _calendarSvg(start, km, weeks, cap) {
    const cols = Math.ceil(km.length / 7);
    const first = Math.max(0, cols - weeks);
    const STEP = 15, CELL = 12, LEFT = 30, TOP = 18;
    let dayFmt, monthFmt;
    try {
      dayFmt = new Intl.DateTimeFormat(this._lang, { weekday: "short", day: "numeric", month: "short" });
      monthFmt = new Intl.DateTimeFormat(this._lang, { month: "short" });
    } catch (_e) {
      dayFmt = new Intl.DateTimeFormat("en", { weekday: "short", day: "numeric", month: "short" });
      monthFmt = new Intl.DateTimeFormat("en", { month: "short" });
    }
    let cells = "", labels = "", lastMonth = -1, lastLabelX = -100;
    for (let col = first; col < cols; col++) {
      const x = LEFT + (col - first) * STEP;
      const monday = new Date(start.getFullYear(), start.getMonth(), start.getDate() + col * 7, 12);
      if (monday.getMonth() !== lastMonth) {
        lastMonth = monday.getMonth();
        if (x - lastLabelX >= 30) {
          labels += `<text x="${x}" y="11">${esc(monthFmt.format(monday).replace(".", ""))}</text>`;
          lastLabelX = x;
        }
      }
      for (let row = 0; row < 7; row++) {
        const index = col * 7 + row;
        if (index >= km.length) break;
        const value = km[index];
        const level = value < 0 ? "u" : value < 1 ? 0 : 1 + Math.min(3, Math.floor((value / cap) * 4 - 1e-9));
        const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index, 12);
        const tip = `${dayFmt.format(date)}${value >= 0 ? ` · ${this._num(value)} km` : ""}`;
        cells += `<rect x="${x}" y="${TOP + row * STEP}" width="${CELL}" height="${CELL}" rx="3" class="c${level}"><title>${esc(tip)}</title></rect>`;
      }
    }
    const side = [0, 2, 4].map((row) =>
      `<text x="0" y="${TOP + row * STEP + 10}">${esc(this._weekday(row, "short").replace(".", ""))}</text>`).join("");
    const width = LEFT + (cols - first) * STEP;
    return `<svg viewBox="0 0 ${width} ${TOP + 7 * STEP}" role="img" aria-label="${esc(this._tr("calTitle"))}">${labels}${side}${cells}</svg>`;
  }

  _calendarHtml() {
    const t = (k, v) => this._tr(k, v);
    const a = this._s("yearDistance")?.attributes || {};
    const cal = a.calendar;
    const km = Array.isArray(cal?.km) ? cal.km : [];
    const start = this._day(cal?.start);
    const driven = km.filter((v) => v >= 1);
    const total = km.reduce((sum, v) => sum + (v > 0 ? v : 0), 0);
    const head = this._head(t("calTitle"), "calendarHeart",
      driven.length ? `<span class="meta">${esc(t("calTotal", { km: this._num(total), d: this._num(driven.length) }))}</span>` : "");
    if (!km.length || !isFinite(start) || !km.some((v) => v >= 0)) return `${head}<div class="empty">${esc(t("calNoData"))}</div>`;
    const sorted = [...driven].sort((x, y) => x - y);
    const cap = Math.max(10, sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.9))] : 10);
    const legend = `<div class="callegend"><span>${esc(t("calLess"))}</span>${[0, 1, 2, 3, 4].map((l) => `<i class="c${l}"></i>`).join("")}<span>${esc(t("calMore"))}</span></div>`;
    // Months: one bar per month, the current one highlighted.
    const months = objs(a.months);
    let bars = "";
    if (months.some((m) => m.km > 0)) {
      const top = Math.max(1, ...months.map((m) => m.km || 0));
      bars = `<div class="subh">${esc(t("monthsTitle"))}</div><div class="mbars">${months.map((m, index) => {
        const date = this._day(m.month);
        const label = this._date(date, { month: "short" }).replace(".", "");
        const tip = `${this._date(date, { month: "long", year: "numeric" })} · ${this._num(m.km)} km${m.kwh != null ? ` · ${this._num(m.kwh)} kWh` : ""}`;
        return `<div class="mb${index === months.length - 1 ? " now" : ""}" title="${esc(tip)}"><span>${m.km >= 1 ? this._num(m.km) : ""}</span>` +
          `<i style="height:${Math.max(m.km > 0 ? 4 : 0, (m.km / top) * 100)}%"></i><small>${esc(label)}</small></div>`;
      }).join("")}</div>`;
    }
    return `${head}<div class="cal"><div class="calfull">${this._calendarSvg(start, km, 54, cap)}</div>` +
      `<div class="calhalf">${this._calendarSvg(start, km, 22, cap)}</div></div>${legend}${bars}`;
  }

  /* ----- journey: totals, records and savings ----- */

  _recordsHtml() {
    const t = (k, v) => this._tr(k, v);
    const a = this._s("yearDistance")?.attributes || {};
    const totals = a.totals || {}, rec = a.records || {}, year = a.year || {};
    const head = this._head(t("recTitle"), "trophy");
    const stat = (label, value, unit, sub = "", more = "") =>
      `<div class="stat${more ? " clickable" : ""}"${more ? ` data-more="${more}"` : ""}><small>${esc(label)}</small><b>${value}${unit ? `<span>${esc(unit)}</span>` : ""}</b>${sub ? `<em>${esc(sub)}</em>` : ""}</div>`;
    const stats = [];
    if (totals.odometer_km != null) {
      stats.push(stat(t("recOdo"), this._num(totals.odometer_km), "km",
        totals.earth_laps != null && totals.earth_laps >= 0.05 ? t("recEarth", { x: this._num(totals.earth_laps, 2) }) : "", "odometer"));
    }
    if (year.km != null && year.km > 0) {
      stats.push(stat(`${t("recYear")} ${year.year || ""}`.trim(), this._num(year.km), "km",
        year.projected_km ? t("recProjected", { x: this._num(year.projected_km) }) : "", "yearDistance"));
    }
    const life = this._v("lifetimeConsumption");
    if (life != null) stats.push(stat(t("recAvg"), this._num(life, 1), "kWh/100 km", "", "lifetimeConsumption"));
    if (totals.lifetime_energy_kwh != null) stats.push(stat(t("recEnergy"), this._num(totals.lifetime_energy_kwh), "kWh"));
    if (totals.km_per_day != null) stats.push(stat(t("recPerDay"), this._num(totals.km_per_day, 1), "km"));

    const rows = [];
    const row = (ic, color, label, value, sub = "") => rows.push(
      `<div class="irow" style="--c:${color}"><span class="sq">${icon(ic)}</span><div><b>${esc(label)}</b>${sub ? `<small>${esc(sub)}</small>` : ""}</div><span class="mono">${esc(value)}</span></div>`);
    const day = (text) => (text ? this._date(this._day(text), { day: "numeric", month: "short", year: "numeric" }) : "");
    if (rec.longest_day) row("road", "#38bdf8", t("recLongestDay"), `${this._num(rec.longest_day.km)} km`, day(rec.longest_day.date));
    if (rec.longest_trip) row("route", "#a78bfa", t("recLongestTrip"), `${this._num(rec.longest_trip.km, 1)} km`, day(rec.longest_trip.date));
    if (rec.most_efficient_trip) {
      row("leaf", "#34d399", t("recBestTrip"), `${this._num(rec.most_efficient_trip.kwh_100km, 1)} kWh/100`,
        [day(rec.most_efficient_trip.date), rec.most_efficient_trip.km != null ? `${this._num(rec.most_efficient_trip.km, 1)} km` : ""].filter(Boolean).join(" · "));
    }
    if (rec.best_streak_days) row("spark", "#fbbf24", t("recStreak"), t("recStreakDays", { n: this._num(rec.best_streak_days) }));
    if (rec.busiest_month) row("calendar", "#5eead4", t("recBusiest"), `${this._num(rec.busiest_month.km)} km`, this._date(this._day(rec.busiest_month.month), { month: "long", year: "numeric" }));
    if (rec.top_speed) row("gauge", "#fb7185", t("recTopSpeed"), `${this._num(rec.top_speed.kmh)} km/h`, day(rec.top_speed.date));
    if (rec.biggest_charge) row("battery", "#34d399", t("recBigCharge"), `${this._num(rec.biggest_charge.kwh, 1)} kWh`, day(rec.biggest_charge.date));
    if (rec.fastest_charge) row("bolt", "#f6a823", t("recFastCharge"), `${this._num(rec.fastest_charge.kw, 1)} kW`, day(rec.fastest_charge.date));
    if (rec.coldest_drive_c != null) row("snow", "#7dd3fc", t("recColdest"), `${this._num(rec.coldest_drive_c, 1)} °C`);

    // Against a petrol car driving the same distance.
    const sv = this._s("fuelSavingsTotal")?.attributes || {};
    const assume = this._s("co2Total")?.attributes || {};
    const litres = this._v("fuelAvoided");
    const co2 = this._v("co2Total");
    const money = this._v("fuelSavingsTotal");
    let savings = "";
    if (litres != null || co2 != null || money != null) {
      const currency = this._currency();
      const tiles = [];
      const month = this._v("fuelSavings");
      if (money != null) tiles.push(stat(t("savMoney"), esc(this._money(money, currency)), "", month != null ? `${this._money(month, currency)} ${t("savMonth")}` : t("savLife"), "fuelSavingsTotal"));
      if (litres != null) tiles.push(stat(t("savFuel"), this._num(litres), "l", t("savLife"), "fuelAvoided"));
      if (co2 != null) {
        const tons = Math.abs(co2) >= 1000;
        tiles.push(stat(t("savCo2"), this._num(tons ? co2 / 1000 : co2, tons ? 2 : 0), tons ? "t" : "kg", t("savLife"), "co2Total"));
      }
      const note = [
        assume.fuel_l_100km != null && assume.grid_co2_g_kwh != null
          ? t("savAssume", { l: this._num(assume.fuel_l_100km, 1), g: this._num(assume.grid_co2_g_kwh) }) : "",
        money == null && sv.fuel_cost == null ? t("savSetPrice") : "",
      ].filter(Boolean).join(" ");
      savings = `<div class="subh">${esc(t("savTitle"))}</div><div class="stats">${tiles.join("")}</div>${note ? `<div class="foot">${esc(note)}</div>` : ""}`;
    }
    if (!stats.length && !rows.length && !savings) return `${head}<div class="empty">${esc(t("recNone"))}</div>`;
    return `${head}${stats.length ? `<div class="stats">${stats.join("")}</div>` : ""}` +
      `${rows.length ? `<div class="recrows">${rows.join("")}</div>` : ""}${savings}`;
  }

  /* ----- journey: achievements ----- */

  _badgesHtml() {
    const t = (k, v) => this._tr(k, v);
    // Only badges this card has a name for.
    const badges = objs(this._a("achievements", "badges")).filter((b) => STRINGS.en[`bd_${b.id}`]);
    if (!badges.length) return `${this._head(t("bdTitle"), "medal")}<div class="empty">${esc(t("recNone"))}</div>`;
    const levels = this._t.bdLevels || STRINGS.en.bdLevels;
    const colors = ["#64748b", "#d08a4e", "#cbd5e1", "#fbbf24"];
    const earned = badges.filter((b) => b.level > 0).length;
    const tiles = badges.map((b) => {
      const level = clamp(b.level || 0, 0, 3);
      const digits = b.id === "full_cycles" || b.id === "frost" ? 1 : 0;
      const value = b.value != null ? this._num(b.value, Number.isInteger(b.value) ? 0 : digits) : "—";
      const next = b.next != null ? ` · ${esc(t("bdNext", { x: this._num(b.next) }))}` : "";
      return `<div class="badge l${level}" style="--c:${colors[level]}" title="${esc(t(`bdd_${b.id}`))}">` +
        `<span class="bring" style="--p:${Math.round(clamp(b.progress ?? 0, 0, 1) * 100)}">${icon("medal")}</span>` +
        `<div><b>${esc(t(`bd_${b.id}`))}</b><small>${esc(level ? levels[level] : t(`bdd_${b.id}`))}</small>` +
        `<em><span>${value}</span>${next}</em></div></div>`;
    });
    return `${this._head(t("bdTitle"), "medal", `<span class="meta">${esc(t("bdEarned", { n: earned, m: badges.length }))}</span>`)}` +
      `<div class="badgegrid clickable" data-more="achievements">${tiles.join("")}</div>`;
  }

  /* ----- journey: range lab ----- */

  /**
   * Consumption at a steady speed and outside temperature, as a shape:
   * rolling resistance, air drag (with the square of speed) and the power the
   * climate and electronics draw, which weighs more the slower the car goes.
   * It is scaled to the driver's own average, so only the shape matters.
   */
  _labModel(speed, temp, climate) {
    const aux = 0.35 + (climate ? (temp < 20 ? (20 - temp) * 0.11 : (temp - 20) * 0.07) : 0); // kW
    return 5.2 + 0.00095 * speed * speed + (aux / Math.max(speed, 10)) * 100;
  }

  _labBase() {
    const ra = this._s("realRange")?.attributes || {};
    const own = Number(ra.consumption_kwh_100km) || this._v("lifetimeConsumption") || this._v("avg");
    if (!own || own <= 0) return null;
    // The driver's average belongs to their usual pace: the mean speed of recent trips.
    const trips = objs(this._a("lastTrip", "recent_trips")).filter((x) => x.avg_speed_kmh > 0 && x.distance_km > 0);
    const km = trips.reduce((sum, x) => sum + x.distance_km, 0);
    const pace = km > 0 ? clamp(trips.reduce((sum, x) => sum + x.avg_speed_kmh * x.distance_km, 0) / km, 30, 90) : 55;
    const outside = this._v("outdoor");
    const soc = this._v("batteryPrecise") ?? this._v("battery");
    let energy = Number(ra.energy_kwh) || this._v("availableEnergy");
    if (!(energy > 0)) energy = null;
    let capacity = ra.full_km > 0 ? (ra.full_km * own) / 100 : null;
    if (!capacity && energy && soc && soc >= 20) capacity = (energy / soc) * 100;
    if (!energy && capacity && soc != null) energy = (capacity * soc) / 100;
    return { own, pace, outside: outside ?? 15, soc, energy: energy || null, capacity: capacity || null };
  }

  _labResult() {
    const base = this._labBase();
    if (!base) return null;
    const lab = this._lab || (this._lab = { speed: 90, temp: clamp(Math.round(base.outside), -15, 35), climate: true });
    const factor = base.own / this._labModel(base.pace, base.outside, true);
    const cons = factor * this._labModel(lab.speed, lab.temp, lab.climate);
    return { cons, now: base.energy ? (base.energy / cons) * 100 : null, full: base.capacity ? (base.capacity / cons) * 100 : null, soc: base.soc };
  }

  _labOutHtml() {
    const t = (k, v) => this._tr(k, v);
    const r = this._labResult();
    if (!r) return "";
    const shown = r.now ?? r.full;
    return `<div class="rlbig">${shown != null ? this._num(shown) : "—"}<small>km</small></div>` +
      `<div class="rlsub">${esc(r.now == null ? t("rlFull") : r.soc != null ? t("rlNow", { p: this._num(r.soc) }) : t("rlNowPlain"))}` +
      `${r.now != null && r.full != null ? ` · <b>${this._num(r.full)} km</b> ${esc(t("rlFull"))}` : ""}</div>` +
      `<div class="rlcons"><b>${this._num(r.cons, 1)}</b> kWh/100 km</div>`;
  }

  /** Range over steady speed for the chosen temperature, with the chosen speed marked. */
  _labChartHtml() {
    const base = this._labBase();
    const lab = this._lab;
    if (!base || !lab) return "";
    const energy = base.energy || base.capacity;
    if (!energy) return "";
    const factor = base.own / this._labModel(base.pace, base.outside, true);
    const range = (v) => (energy / (factor * this._labModel(v, lab.temp, lab.climate))) * 100;
    const speeds = [];
    for (let v = 30; v <= 130; v += 5) speeds.push(v);
    const values = speeds.map(range);
    const hi = Math.ceil(Math.max(...values) / 50) * 50;
    const X = (v) => f1(((v - 30) / 100) * 1000), Y = (km) => f1((1 - km / hi) * 300);
    const line = speeds.map((v, i) => `${i ? "L" : "M"}${X(v)} ${Y(values[i])}`).join("");
    const now = range(lab.speed);
    const yl = [0, hi / 2, hi].map((v) => `<span class="yl" style="top:${f1((1 - v / hi) * 118)}px">${this._num(v)}</span>`).join("");
    return `<div class="spdbox">${yl}
      <svg viewBox="0 0 1000 300" preserveAspectRatio="none" aria-hidden="true">
        <defs><linearGradient id="lm-rla" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6a823" stop-opacity=".3"/><stop offset="1" stop-color="#f6a823" stop-opacity="0"/></linearGradient></defs>
        <line x1="0" x2="1000" y1="300" y2="300" stroke="rgba(148,163,184,.25)" vector-effect="non-scaling-stroke"/>
        <line x1="0" x2="1000" y1="150" y2="150" stroke="rgba(148,163,184,.08)" vector-effect="non-scaling-stroke"/>
        <path d="${line}L1000 300L0 300Z" fill="url(#lm-rla)"/>
        <path d="${line}" fill="none" stroke="#f6b13d" stroke-width="2.6" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
        <line x1="${X(lab.speed)}" x2="${X(lab.speed)}" y1="${Y(now)}" y2="300" stroke="#f6a823" stroke-width="1.2" stroke-dasharray="3 4" vector-effect="non-scaling-stroke"/>
      </svg>
      <span class="cvdot" style="background:var(--lm-amber);box-shadow:0 0 10px var(--lm-amber);animation:none;left:calc(36px + (100% - 36px) * ${((lab.speed - 30) / 100).toFixed(3)});top:${f1((1 - now / hi) * 118)}px"></span>
      <div class="xl"><span>30</span><span>80</span><span>130 km/h</span></div></div>`;
  }

  _rangelabHtml() {
    const t = (k, v) => this._tr(k, v);
    const head = this._head(t("rlTitle"), "flask");
    if (!this._labResult()) return `${head}<div class="empty">${esc(t("rlNeedData"))}</div>`;
    const lab = this._lab;
    return `${head}<div class="rl"><div class="rlout" id="rlout" aria-live="polite">${this._labOutHtml()}</div>
      <div class="spd rlchart" id="rlchart">${this._labChartHtml()}</div>
      <label class="rls"><span>${esc(t("rlSpeed"))}<b id="rlv-speed">${this._num(lab.speed)} km/h</b></span>
        <input type="range" min="30" max="130" step="5" value="${lab.speed}" data-lab="speed" aria-label="${esc(t("rlSpeed"))}"></label>
      <label class="rls"><span>${esc(t("rlTemp"))}<b id="rlv-temp">${this._num(lab.temp)} °C</b></span>
        <input type="range" min="-15" max="35" step="1" value="${lab.temp}" data-lab="temp" aria-label="${esc(t("rlTemp"))}"></label>
      <button type="button" class="rlt${lab.climate ? " on" : ""}" data-act="labclimate" aria-pressed="${lab.climate}">${icon("fan")}<span>${esc(t("rlClimate"))} · ${esc(lab.climate ? t("on") : t("off"))}</span></button>
      <div class="foot">${esc(t("rlNote"))}</div></div>`;
  }

  _onInput(ev) {
    const el = ev.composedPath().find((node) => node instanceof HTMLInputElement && (node.dataset?.lab || node.dataset?.replay));
    if (!el) return;
    if (el.dataset.replay) {
      this._seekReplay(Number(el.value) / 1000);
      return;
    }
    if (!this._lab) return;
    this._lab[el.dataset.lab] = Number(el.value);
    const out = this.shadowRoot.getElementById("rlout");
    if (out) out.innerHTML = this._labOutHtml();
    const chart = this.shadowRoot.getElementById("rlchart");
    if (chart) chart.innerHTML = this._labChartHtml();
    const label = this.shadowRoot.getElementById(`rlv-${el.dataset.lab}`);
    if (label) label.textContent = el.dataset.lab === "speed" ? `${this._num(this._lab.speed)} km/h` : `${this._num(this._lab.temp)} °C`;
  }

  /* ----- trip replay on the map ----- */

  /** Position and speed at a share (0…1) of the recorded route. */
  _replayPoint(tr, share) {
    const pts = tr.points;
    const a = pts[0][0], b = pts[pts.length - 1][0];
    const at = a + clamp(share, 0, 1) * Math.max(1, b - a);
    let lat = pts[pts.length - 1][1], lon = pts[pts.length - 1][2];
    for (let i = 1; i < pts.length; i++) {
      if (pts[i][0] >= at) {
        const k = pts[i][0] > pts[i - 1][0] ? (at - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]) : 0;
        lat = pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k;
        lon = pts[i - 1][2] + (pts[i][2] - pts[i - 1][2]) * k;
        break;
      }
    }
    return { at, lat, lon, speed: tr.speeds && tr.speeds.length ? valueAt(tr.speeds, at) : null };
  }

  _replayTrack() {
    const tr = this._track;
    return tr && tr.state === "ok" && tr.key === this._tripKey(this._mapSelected()) && tr.points.length >= 3 ? tr : null;
  }

  _replayHtml(tr) {
    if (!tr || tr.state !== "ok" || tr.points.length < 3) return "";
    // Drawn from the replay in progress, so a refresh of this panel does not reset the controls.
    const state = this._replay && this._replay.key === tr.key ? this._replay : null;
    const label = esc(this._tr("replay"));
    const action = esc(this._tr(state?.playing ? "replayPause" : "replay"));
    return `<div class="replay"><button type="button" class="rpb" data-act="replay" aria-label="${action}">${icon(state?.playing ? "pause" : "play")}<span>${action}</span></button>` +
      `<input type="range" class="rps" min="0" max="1000" step="1" value="${Math.round(clamp(state?.share || 0, 0, 1) * 1000)}" data-replay="1" aria-label="${label}"><span class="rpi" id="rpinfo"></span></div>`;
  }

  _toggleReplay() {
    const tr = this._replayTrack();
    if (!tr) return;
    const state = this._replay && this._replay.key === tr.key ? this._replay : (this._replay = { key: tr.key, share: 0, playing: false, raf: 0, last: 0 });
    if (state.playing) {
      state.playing = false;
      cancelAnimationFrame(state.raf);
    } else {
      if (state.share >= 1) state.share = 0;
      state.playing = true;
      state.last = 0;
      const frame = (now) => {
        if (!state.playing || this._replay !== state) return;
        // At most a tenth of a second per frame: a tab that was in the background does not jump to the end.
        if (state.last) state.share = Math.min(1, state.share + Math.min(now - state.last, 100) / 12000);
        state.last = now;
        this._applyReplay(tr, state.share);
        if (state.share >= 1) {
          state.playing = false;
          this._replayButton(false);
          return;
        }
        state.raf = requestAnimationFrame(frame);
      };
      state.raf = requestAnimationFrame(frame);
    }
    this._replayButton(state.playing);
  }

  _replayButton(playing) {
    const button = this.shadowRoot.querySelector(".rpb");
    if (!button) return;
    const label = this._tr(playing ? "replayPause" : "replay");
    button.innerHTML = `${icon(playing ? "pause" : "play")}<span>${esc(label)}</span>`;
    button.setAttribute("aria-label", label);
    button.classList.toggle("on", playing);
  }

  _seekReplay(share) {
    const tr = this._replayTrack();
    if (!tr) return;
    if (!this._replay || this._replay.key !== tr.key) this._replay = { key: tr.key, share: 0, playing: false, raf: 0, last: 0 };
    this._replay.share = clamp(share, 0, 1);
    this._replay.last = 0;
    this._applyReplay(tr, this._replay.share, true);
  }

  /** Move the marker on the map, the cursor in the speed chart and the read-out. */
  _applyReplay(tr, share, fromSlider = false) {
    const root = this.shadowRoot;
    const box = root.getElementById("mapbox");
    if (!box) return;
    const p = this._replayPoint(tr, share);
    const map = box.querySelector("ha-map");
    const svg = box.querySelector(".routesvg");
    try {
      if (map && map.Leaflet && map.leafletMap) {
        if (!box.__rpMarker) {
          box.__rpMarker = map.Leaflet.circleMarker([p.lat, p.lon],
            { radius: 8, color: "#0b1224", weight: 3, fillColor: "#ffffff", fillOpacity: 1, interactive: false }).addTo(map.leafletMap);
        }
        box.__rpMarker.setLatLng([p.lat, p.lon]);
      } else if (svg && svg.dataset.proj) {
        const j = JSON.parse(svg.dataset.proj);
        let dot = svg.querySelector(".rpdot");
        if (!dot) {
          dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
          dot.setAttribute("class", "rpdot");
          dot.setAttribute("r", "8");
          svg.appendChild(dot);
        }
        dot.setAttribute("cx", f1(j.ox + (p.lon * j.kx - j.minX) * j.scale));
        dot.setAttribute("cy", f1(j.oy + (-p.lat - j.minY) * j.scale));
      }
    } catch (_e) {
      // The map is not ready; the read-out below still follows.
    }
    const slider = root.querySelector(".rps");
    if (slider && !fromSlider) slider.value = String(Math.round(share * 1000));
    const info = root.getElementById("rpinfo");
    if (info) info.textContent = `${this._time(new Date(p.at))}${p.speed != null ? ` · ${this._num(p.speed)} km/h` : ""}`;
    const chart = root.querySelector(".map .spdbox");
    if (chart && isFinite(tr.t0) && tr.t1 > tr.t0) {
      let cursor = chart.querySelector(".rpcur");
      if (!cursor) {
        cursor = document.createElement("i");
        cursor.className = "rpcur";
        chart.appendChild(cursor);
      }
      cursor.style.left = `calc(36px + (100% - 36px) * ${clamp((p.at - tr.t0) / (tr.t1 - tr.t0), 0, 1).toFixed(4)})`;
    }
  }

  _stopReplay() {
    if (this._replay) cancelAnimationFrame(this._replay.raf);
    this._replay = null;
    const box = this.shadowRoot?.getElementById("mapbox");
    if (box) {
      try {
        box.__rpMarker?.remove();
      } catch (_e) { /* the map is already gone */ }
      box.__rpMarker = null;
      box.querySelector(".rpdot")?.remove();
    }
    this.shadowRoot?.querySelector(".rpcur")?.remove();
  }

  /* ----- trip log export ----- */

  async _exportCsv() {
    if (this._busy.csv) return;
    this._busy.csv = true;
    let trips = null;
    try {
      const res = await this._hass.callWS({
        type: "call_service", domain: "leapmotor", service: "get_trips",
        service_data: { entity_id: this._ids.lastTrip, limit: 500 }, return_response: true,
      });
      trips = res?.response?.trips;
    } catch (_e) {
      trips = null; // an older integration version: export what the card shows
    }
    if (!Array.isArray(trips) || !trips.length) trips = this._a("lastTrip", "recent_trips") || [];
    delete this._busy.csv;
    if (!trips.length) return;
    const cols = ["start", "end", "from", "to", "distance_km", "duration_min", "energy_kwh", "consumption_kwh_100km",
      "avg_speed_kmh", "max_speed_kmh", "start_soc", "end_soc", "outdoor_temp_c", "eco_score"];
    const cell = (value) => {
      if (value == null) return "";
      if (typeof value === "number") return String(value);
      // Text never starts a formula in a spreadsheet.
      const text = /^[=+\-@\t\r]/.test(String(value)) ? `'${value}` : String(value);
      return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    };
    // Local date and time, in the form spreadsheets read as a date.
    const stamp = (value) => {
      const d = new Date(value);
      if (!value || Number.isNaN(d.getTime())) return value;
      const two = (n) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())} ${two(d.getHours())}:${two(d.getMinutes())}`;
    };
    try {
      const lines = [cols.join(","), ...trips.map((trip) => cols.map((c) => cell(c === "start" || c === "end" ? stamp(trip[c]) : trip[c])).join(","))];
      const blob = new Blob(["﻿" + lines.join("\r\n") + "\r\n"], { type: "text/csv;charset=utf-8" });
      const link = document.createElement("a");
      const now = new Date();
      link.href = URL.createObjectURL(blob);
      link.download = `leapmotor-trips-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(link.href), 60 * 1000);
      this._toast(this._tr("exported", { n: trips.length }));
    } catch (err) {
      this._toast(this._tr("failed", { x: err?.message || String(err) }));
    }
  }

  /* ----- interaction ----- */

  _isArmed(key) {
    return !!(this._armed && this._armed.key === key && Date.now() < this._armed.until);
  }

  /** First tap of a remote action: wait 4 s for the confirming second tap. */
  _arm(key) {
    this._armed = { key, until: Date.now() + 4000 };
    this._rerenderInteractive();
    setTimeout(() => {
      if (this._armed && this._armed.key === key && Date.now() >= this._armed.until) {
        this._armed = null;
        this._rerenderInteractive();
      }
    }, 4100);
  }

  _rerenderInteractive() {
    for (const name of ["controls", "hero", "maintenance", "charging"]) if (this._config.sections.includes(name)) this._renderSection(name);
  }

  _onClick(ev) {
    const el = ev.composedPath().find((n) => n instanceof HTMLElement && (n.dataset?.act || n.dataset?.more || n.dataset?.trip));
    if (!el) return;
    if (el.dataset.trip) {
      this._stopReplay();
      this._mapSel = el.dataset.trip === "live" ? "live" : Number(el.dataset.trip);
      this._renderSection("trips");
      this._renderSection("map");
      this.shadowRoot.getElementById("map")?.scrollIntoView?.({ behavior: "smooth", block: "nearest" });
      return;
    }
    const act = el.dataset.act;
    if (act === "page") return this._setPage(el.dataset.page);
    if (act === "menu") return this.dispatchEvent(new Event("hass-toggle-menu", { bubbles: true, composed: true }));
    if (act === "pref") return this._savePrefs({ [el.dataset.k]: el.dataset.v });
    if (act === "prefreset") return this._savePrefs({ look: null, language: null, scene: null });
    if (act === "limit") return this._bumpLimit(Number(el.dataset.delta) || 0);
    if (act === "limitset") return this._confirmLimit();
    if (act === "limitcancel") return this._cancelLimit();
    if (act === "moretrips") {
      this._tripLimit += 10;
      this._renderSection("trips");
      return;
    }
    if (act === "moretimeline") {
      this._tlLimit += 10;
      this._renderSection("timeline");
      return;
    }
    if (act === "moresessions") {
      this._sessLimit += 10;
      this._renderSection("sessions");
      return;
    }
    if (act === "moremessages") {
      this._inboxLimit += 10;
      this._renderSection("inbox");
      return;
    }
    if (act === "replay") return this._toggleReplay();
    if (act === "exportcsv") return this._exportCsv();
    if (act === "labclimate") {
      if (!this._lab) return;
      this._lab.climate = !this._lab.climate;
      this._labFull = true; // the button itself changes
      this._sigs.rangelab = null;
      this._renderSection("rangelab");
      return;
    }
    if (act === "tab") {
      this._tab = el.dataset.tab;
      this._renderSection("chart", true);
      return;
    }
    if (act === "refresh") return this._refresh();
    if (act === "ctl") return this._control(el.dataset.key);
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
    const def = key.startsWith("mnt:") ? this._maintenanceDef(key) : this._controlDefs()[key];
    if (!def) return;
    if (this._config.confirm_actions && !this._isArmed(key)) {
      this._arm(key);
      return;
    }
    this._armed = null;
    this._busy[key] = true;
    this._rerenderInteractive();
    try {
      await this._hass.callService(def.domain, def.service, def.data || { entity_id: def.entity });
      this._toast(def.data ? this._tr("logged", { x: def.label }) : this._tr("sent", { x: def.label }));
    } catch (err) {
      this._toast(this._tr("failed", { x: err?.message || String(err) }));
    }
    setTimeout(() => { delete this._busy[key]; this._rerenderInteractive(); }, 1500);
  }
}

// Artwork is exposed for the docs banner and previews.
LeapmotorCard.art = { sceneSvg, carSvg };

/* ------------------------------------------------------------------ */
/* Sidebar panel: the full dashboard, one per vehicle (plug and play)  */
/* ------------------------------------------------------------------ */

const PANEL_STYLE = `
:host{display:block;min-height:100vh;background:#060a16;color:#e9eef8;
  font-family:'LM Outfit','Outfit',ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif}
.wrap{max-width:1640px;margin:0 auto;padding:18px;display:grid;gap:22px}
@media (max-width:600px){.wrap{padding:8px;gap:14px}}
`;

class LeapmotorPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._cards = new Map();
  }

  set hass(hass) {
    this._hass = hass;
    this._update();
  }

  set narrow(narrow) {
    this._narrow = !!narrow;
    this.toggleAttribute("narrow", this._narrow);
    this._syncMenu();
  }

  /** No top bar: on narrow screens the first card's tab row carries the ☰ button for Home Assistant's sidebar. */
  _syncMenu() {
    [...this._cards.values()].forEach((card, i) => { card.menuButton = !!this._narrow && i === 0; });
  }

  set panel(panel) {
    this._panel = panel;
  }

  connectedCallback() {
    ensureFonts();
  }

  _vehicles() {
    const entities = Object.values(this._hass?.entities || {});
    const ids = entities
      .filter((e) => e && e.platform === "leapmotor" && e.translation_key === "battery_percent" && e.entity_id.startsWith("sensor."))
      .map((e) => e.device_id)
      .filter(Boolean);
    return [...new Set(ids)];
  }

  _build() {
    this.shadowRoot.innerHTML = `<style>${PANEL_STYLE}</style><div class="wrap" id="wrap"></div>`;
    this._built = true;
  }

  _update() {
    if (!this._hass) return;
    if (!this._built) this._build();
    const wrap = this.shadowRoot.getElementById("wrap");
    const vehicles = this._vehicles();
    const keys = vehicles.length ? vehicles : ["auto"];
    for (const [key, card] of this._cards) {
      if (!keys.includes(key)) {
        card.remove();
        this._cards.delete(key);
      }
    }
    for (const key of keys) {
      let card = this._cards.get(key);
      if (!card) {
        card = document.createElement("leapmotor-card");
        card.setConfig({ type: "custom:leapmotor-card", sticky_tabs: true, ...(key === "auto" ? {} : { device_id: key }) });
        this._cards.set(key, card);
        wrap.appendChild(card);
      }
      card.hass = this._hass;
    }
    this._syncMenu();
  }
}

if (!customElements.get("leapmotor-panel")) customElements.define("leapmotor-panel", LeapmotorPanel);

if (!customElements.get("leapmotor-card")) {
  customElements.define("leapmotor-card", LeapmotorCard);
  window.customCards = window.customCards || [];
  window.customCards.push({
    type: "leapmotor-card",
    name: "Leapmotor",
    description: "Dashboard for your Leapmotor in three looks (night sky, driver display, car app): remote controls, trips with maps, charging and vehicle care.",
    preview: true,
    documentationURL: "https://github.com/Sabotin/LeapBridge/blob/main/docs/card.md",
  });
  console.info(`%c LEAPMOTOR-CARD %c ${CARD_VERSION} `, "color:#1a1206;background:#f6a823;font-weight:700;border-radius:4px 0 0 4px;padding:2px 6px", "color:#f6a823;background:#0f1729;border-radius:0 4px 4px 0;padding:2px 6px");
}
