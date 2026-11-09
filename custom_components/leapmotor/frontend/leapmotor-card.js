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

const CARD_VERSION = "1.1.0";
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
  },
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
};

const DOORS = [
  ["doorDriver", "driverDoor"], ["doorPassenger", "passengerDoor"],
  ["doorRearLeft", "rearLeftDoor"], ["doorRearRight", "rearRightDoor"],
];
const WINDOWS = ["winFL", "winFR", "winRL", "winRR", "skylight"];
const TIRES = [["tireFL", "FL"], ["tireFR", "FR"], ["tireRL", "RL"], ["tireRR", "RR"]];
/** Pages of the card: the first page holds the car, its status and the remote controls. */
const PAGES = [
  { id: "overview", label: "pageOverview", icon: "car", sections: ["hero", "check", "controls"] },
  { id: "trips", label: "pageTrips", icon: "route", sections: ["map", "trips", "week"] },
  { id: "charging", label: "pageCharging", icon: "bolt", sections: ["charging", "chart", "energy"] },
  { id: "vehicle", label: "pageVehicle", icon: "wrench", sections: ["maintenance", "tires", "insights"] },
];
const ALL_SECTIONS = PAGES.flatMap((p) => p.sections);
const PAGE_OF = Object.fromEntries(PAGES.flatMap((p) => p.sections.map((s) => [s, p.id])));
const OK_C = "#34d399";
const WARN_C = "#f6a823";
const BAD_C = "#fb7185";
const TRIPS_SHOWN = 8;
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
  heart: '<path d="M12 20s-7.5-4.6-7.5-10.3A4.2 4.2 0 0 1 12 7.1a4.2 4.2 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20Z"/>',
  wrench: '<path d="M14.5 6.5a4 4 0 0 0-5.3 5.3L4 17l3 3 5.2-5.2a4 4 0 0 0 5.3-5.3l-2.4 2.4-2.6-.6-.6-2.6 2.6-2.2Z"/>',
  spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
  cctv: '<path d="M3 7l12-3 2 6-12 3-2-6Z"/><path d="m17 10 3 1v4M5 13l1 4H3"/>',
  roof: '<path d="M3 15 7 8h10l4 7"/><path d="M8.5 11h7M3 15h18v3H3z"/>',
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
function routeSvg(track, startLabel, endLabel, W = 640, H = 300) {
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
  const stars = Array.from({ length: 34 }, () => `<circle cx="${f1(r() * W)}" cy="${f1(r() * H)}" r="${f1(0.4 + r())}" fill="#c7d2fe" opacity="${f1(0.15 + r() * 0.35)}"/>`).join("");
  const [sx, sy] = xy(pts[0][1], pts[0][2]);
  const [ex, ey] = xy(pts[pts.length - 1][1], pts[pts.length - 1][2]);
  return `<svg class="routesvg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${esc(startLabel)} → ${esc(endLabel)}">
    <defs>
      <pattern id="lm-grid" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M32 0H0V32" fill="none" stroke="rgba(148,163,184,.07)"/></pattern>
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
/* Styles                                                               */
/* ------------------------------------------------------------------ */

const STYLE = `
:host{
  --lm-bg:#080d1c;--lm-panel:#0f1729;--lm-line:rgba(148,163,184,.13);--lm-line-2:rgba(148,163,184,.07);
  --lm-text:#eef2fa;--lm-soft:#cdd5e6;--lm-muted:#9ba6bd;--lm-dim:#7b869d;
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
.lm.backdrop{background:radial-gradient(1200px 500px at 20% -10%,#111b3a 0%,transparent 60%),var(--lm-bg);padding:14px;border-radius:26px}
.panel{position:relative;min-width:0;overflow:hidden;border-radius:20px;padding:18px 20px;
  background:linear-gradient(180deg,rgba(21,30,51,.96),rgba(13,20,36,.98));
  border:1px solid var(--lm-line);box-shadow:inset 0 1px 0 rgba(255,255,255,.035),0 24px 48px -30px rgba(0,0,0,.7)}
.ptitle{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 0 16px;min-height:30px}
.ptitle h3{margin:0;display:flex;align-items:center;gap:10px;font-size:17px;font-weight:650;letter-spacing:-.005em;color:var(--lm-text);white-space:nowrap}
.ptitle h3 .ic{width:20px;height:20px;color:var(--lm-amber-2)}
.ptitle .meta{font-size:13px;color:var(--lm-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}
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
.tab{position:relative;display:flex;align-items:center;justify-content:center;gap:9px;min-height:46px;padding:8px 10px;border-radius:13px;
  font-size:15px;font-weight:600;color:var(--lm-muted);transition:color .2s,background .2s;min-width:0}
.tab:hover{color:var(--lm-text);background:rgba(255,255,255,.04)}
.tab.on{color:var(--lm-amber-2);background:rgba(246,168,35,.14);box-shadow:inset 0 0 0 1px rgba(246,168,35,.45)}
.tab .ti{position:relative;display:grid;place-items:center}
.tab .ic{width:20px;height:20px}
.tab .tlb{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tab .tb{position:absolute;top:-3px;right:-5px;width:9px;height:9px;border-radius:50%;background:var(--c);box-shadow:0 0 0 2px #0d1426,0 0 10px var(--c)}
.tab .tb.pulse{animation:lm-pulse 1.6s ease-in-out infinite}
.lm.sticky .panel{scroll-margin-top:calc(var(--lm-tabs-top,0px) + 76px)}
.stat{padding:11px 13px;border-radius:13px;background:rgba(255,255,255,.035);border:1px solid var(--lm-line-2);min-width:0}
.stat small{display:block;font-size:12.5px;color:var(--lm-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.stat b{display:block;font-size:20px;font-weight:700;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;letter-spacing:-.01em}
.stat b span{font-size:13px;font-weight:500;color:var(--lm-muted);margin-left:3px;letter-spacing:0}
.stat em{display:block;font-style:normal;font-size:12.5px;color:var(--lm-muted);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(128px,1fr));gap:8px}
.subh{font-size:13px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--lm-muted);margin:20px 0 10px 2px}

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
.sub{font-size:14px;color:#c0c9dc;display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.big{display:flex;align-items:flex-start;margin:16px 0 6px;font-weight:700;font-size:98px;line-height:.86;letter-spacing:-.045em;text-shadow:0 6px 30px rgba(0,0,0,.35)}
.big .u{font-size:30px;line-height:1;font-weight:500;color:var(--lm-amber);margin:8px 0 0 6px;letter-spacing:0}
.state{display:flex;align-items:center;gap:9px;font-size:16px;font-weight:600;margin-top:4px}
.state .ic{width:17px;height:17px;color:var(--lm-amber-2)}
.metaline{display:flex;gap:6px 14px;flex-wrap:wrap;font-size:13.5px;color:#b3bdd2;margin-top:10px}
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
.chip{position:absolute;z-index:3;display:inline-flex;align-items:center;gap:8px;padding:8px 14px;border-radius:999px;
  background:rgba(9,15,33,.62);border:1px solid rgba(148,163,184,.17);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);
  font-size:13.5px;font-weight:600;white-space:nowrap;box-shadow:0 10px 24px -12px rgba(0,0,0,.6)}
.chip .ic{width:13px;height:13px;color:var(--lm-amber)}
.chip.a{top:22px;left:36%}
.chip.b{top:70px;right:22px}
.chip.c{top:44%;left:52%}
.btn-amber{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:8px 15px;border-radius:999px;font-size:12.5px;font-weight:600;
  color:var(--lm-amber-2);background:rgba(246,168,35,.13);border:1px solid rgba(246,168,35,.5);transition:background .2s,transform .2s}
.btn-amber:hover{background:rgba(246,168,35,.22)}
.btn-amber .ic{width:14px;height:14px}
.hero .refresh{position:absolute;z-index:3;top:20px;right:22px;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}
.spin .ic{animation:lm-spin 1s linear infinite}
.strip{grid-area:strip;display:grid;grid-template-columns:repeat(auto-fit,minmax(104px,1fr));gap:12px 8px;padding:13px 16px;border-radius:15px;
  background:rgba(8,13,29,.58);border:1px solid rgba(148,163,184,.15);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}
.cell{min-width:0}
.cell .l{font-size:11px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:var(--lm-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cell .v{font-family:var(--lm-mono);font-size:16.5px;font-weight:600;margin-top:6px;white-space:nowrap}
.cell .v small{font-size:11.5px;color:var(--lm-muted);font-weight:500;margin-left:3px}

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
.ctile b{display:block;font-size:14.5px;font-weight:600;line-height:1.25}
.ctile small{display:block;font-size:12.5px;color:var(--lm-muted);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ctile.warn{border-color:rgba(246,168,35,.5);background:rgba(246,168,35,.07)}
.ctile.bad{border-color:rgba(251,113,133,.5);background:rgba(251,113,133,.07)}
.pill{font-size:11px;font-weight:700;letter-spacing:.08em;padding:4px 9px;border-radius:7px;color:var(--lm-green);background:rgba(52,211,153,.12);white-space:nowrap}
.pill.warn{color:var(--lm-amber-2);background:rgba(246,168,35,.15)}
.pill.bad{color:var(--lm-red);background:rgba(251,113,133,.14)}
.foot{font-size:12px;color:var(--lm-dim);margin:12px 2px 0;line-height:1.45}
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
.alegend{display:flex;flex-wrap:wrap;gap:6px 16px;font-size:12.5px;color:var(--lm-muted);margin-top:8px}
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
.wrow .wv span{display:block;font-size:12.5px;color:var(--lm-muted);white-space:nowrap}
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
.bbar .lim b{position:absolute;top:calc(100% + 5px);left:50%;transform:translateX(-50%);font-size:12.5px;font-weight:600;color:var(--lm-soft);white-space:nowrap}
.bbar .lim.edge-r b{left:auto;right:-2px;transform:none}
.bbar .lim.edge-l b{left:-2px;transform:none}
.cinfo{font-size:13.5px;color:var(--lm-muted);line-height:1.5;margin:-8px 0 14px}
.cinfo b{color:var(--lm-text);font-weight:600}
.lrow{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 14px;border-radius:15px;background:rgba(255,255,255,.035);border:1px solid var(--lm-line-2)}
.lrow.busy{opacity:.6;pointer-events:none}
.lrow small{display:block;font-size:12.5px;color:var(--lm-muted)}
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
.aq .t small{display:block;font-size:12.5px;color:var(--lm-muted);margin-top:2px}
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
.health small{display:block;font-size:12.5px;color:var(--lm-muted);margin-top:2px}
.health .big2{font-size:24px;font-weight:700}

/* ---------- trips ---------- */
.tsum{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px}
.tgroup+.tgroup{margin-top:16px}
.tgh{display:flex;justify-content:space-between;align-items:baseline;gap:10px;padding:0 4px 8px;font-size:14px;font-weight:650;color:var(--lm-soft)}
.tgh span{font-size:12.5px;font-weight:500;color:var(--lm-muted);white-space:nowrap}
.trip{display:grid;grid-template-columns:minmax(52px,max-content) minmax(0,1fr) auto;align-items:center;gap:12px;width:100%;padding:11px 13px;border-radius:14px;text-align:left;
  background:rgba(255,255,255,.03);border:1px solid var(--lm-line-2);transition:background .2s,border-color .2s}
.trip+.trip{margin-top:6px}
button.trip:hover{background:rgba(255,255,255,.06)}
.trip .tt b{display:block;font-size:15px;font-weight:650;white-space:nowrap}
.trip .tt small{display:block;font-size:12.5px;color:var(--lm-muted);margin-top:2px;white-space:nowrap}
.trip .td{min-width:0}
.trip .td b{display:block;font-size:18px;font-weight:700;white-space:nowrap}
.trip .td b small{font-size:12.5px;font-weight:500;color:var(--lm-muted);margin-left:3px}
.trip .td>span{display:block;font-size:12.5px;color:var(--lm-muted);margin-top:3px;line-height:1.35}
.trip .tcx{text-align:right}
.trip .tcx small{display:block;font-size:11px;color:var(--lm-muted);margin-top:4px;white-space:nowrap}
.trip.sel{border-color:rgba(246,168,35,.6);background:rgba(246,168,35,.08);box-shadow:inset 3px 0 0 var(--lm-amber)}
.trip.live{border-color:rgba(56,189,248,.5);background:linear-gradient(90deg,rgba(56,189,248,.12),rgba(56,189,248,.02))}
.trip.live .tt small{color:#7dd3fc}
.cons{display:inline-block;padding:4px 9px;border-radius:8px;font-size:13.5px;color:#0b1020;font-weight:700;white-space:nowrap}
.vs{display:inline-block;margin-left:7px;padding:2px 7px;border-radius:6px;font-size:11.5px;font-weight:700;vertical-align:2px}
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
.livebadge{display:inline-flex;align-items:center;gap:7px;font-size:12.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#7dd3fc}
.spd{margin-top:16px}
.spd .sh{display:flex;justify-content:space-between;gap:10px;font-size:14px;font-weight:600;color:var(--lm-soft);margin-bottom:10px}
.spd .sh span{font-weight:500;font-size:13px;color:var(--lm-muted)}
.spdbox{position:relative;height:140px}
.spdbox svg{position:absolute;left:36px;right:0;top:0;width:calc(100% - 36px);height:calc(100% - 22px);overflow:visible}
.spdbox .yl{position:absolute;left:0;width:30px;text-align:right;font-size:11.5px;color:var(--lm-muted);transform:translateY(-50%)}
.spdbox .yl.lim{color:#fda4af;font-weight:600}
.spdbox .xl{position:absolute;left:36px;right:0;bottom:0;display:flex;justify-content:space-between;font-size:11.5px;color:var(--lm-muted)}

/* ---------- tires ---------- */
.tgrid{display:grid;grid-template-columns:minmax(0,1fr) 64px minmax(0,1fr);grid-template-areas:"fl car fr" "rl car rr";gap:10px 12px;align-items:center}
.tyre{padding:12px;border-radius:14px;background:rgba(255,255,255,.035);border:1px solid var(--lm-line-2);min-width:0}
.tyre small{display:block;font-size:12.5px;color:var(--lm-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
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
.mrow small{display:block;font-size:12.5px;color:var(--lm-muted);margin-top:2px}
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
.irow small{display:block;font-size:12.5px;color:var(--lm-muted);margin-top:2px}
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
.tile .tl{font-size:14.5px;font-weight:600;line-height:1.25}
.tile .tx{display:flex;flex-direction:column;gap:3px;min-width:0}
.tile .ts{font-size:12.5px;color:var(--lm-muted);line-height:1.3}
.tile.on{border-color:rgba(246,168,35,.45);background:linear-gradient(180deg,rgba(246,168,35,.12),rgba(246,168,35,.03))}
.tile.on .ts{color:var(--lm-amber-2)}
.tile.busy .sq .ic{animation:lm-spin 1s linear infinite}
.controls .subh:first-of-type{margin-top:4px}

/* ---------- layout ---------- */
.pg-overview .check,.pg-vehicle .maintenance,.pg-charging .chart,.pg-charging .charge{align-self:stretch}
@container lmcard (min-width:760px){
  .page{grid-template-columns:repeat(2,minmax(0,1fr))}
  .hero,.map,.energy,.maintenance{grid-column:1/-1}
  .pg-overview:not(:has(.check)) .controls{grid-column:1/-1}
  .pg-charging .charge:only-child,.pg-trips .trips:last-child:nth-child(2){grid-column:1/-1}
}
@container lmcard (min-width:1180px){
  .page{grid-template-columns:repeat(3,minmax(0,1fr))}
  .hero{grid-column:span 2}
  .pg-overview:not(:has(.check)) .hero{grid-column:1/-1}
  .controls{grid-column:1/-1}
  .map{grid-column:span 2}
  .pg-trips:not(:has(.trips)) .map{grid-column:1/-1}
  .week{grid-column:1/-1}
  .pg-trips:has(.map):has(.week) .trips{grid-row:span 2}
  .pg-trips:has(.map):has(.trips) .week{grid-column:span 2}
  .charge{grid-row:span 2}
  .chart,.energy{grid-column:span 2}
  .maintenance{grid-column:span 2;grid-row:span 2}
}
@container lmcard (max-width:640px){
  .hero{min-height:0}
  .hero-ui{grid-template-columns:minmax(0,1fr);grid-template-areas:"info" "car" "strip";padding:18px 16px 14px}
  .chip{display:none}
  .hero .refresh{top:16px;right:16px;padding:7px 12px}
  .name{font-size:24px;padding-right:110px}
  .big{font-size:80px}
  .carzone{min-height:120px;padding:4px 0 10px 34px}
  .car img{max-height:170px}
  .mapbox{height:260px}
  .quick{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))}
  .fxpin b{font-size:10px;padding:2px 6px}
  .panel{padding:16px}
  .tiles{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
  .tile{flex-direction:row;align-items:center;gap:10px;padding:11px}
  .tile .sq{width:34px;height:34px;flex:none}
  .tile .tl{display:block;font-size:14px}
  .tile .tx{display:block;min-width:0}
  .tile .ts{display:block;margin-top:2px;font-size:12px}
  .strip{grid-template-columns:repeat(3,minmax(0,1fr));padding:12px}
  .cell .l{letter-spacing:.04em;font-size:10.5px}
  .mrow{padding:11px 12px}
  .mside{flex-direction:column;align-items:flex-end;gap:7px}
  .mrow .sq{width:32px;height:32px}
  .wstats{grid-template-columns:repeat(2,minmax(0,1fr))}
  .wrow{grid-template-columns:48px minmax(0,1fr) 86px;gap:10px;padding:7px 8px}
  .tab{flex-direction:column;gap:4px;min-height:54px;padding:7px 4px;font-size:12.5px}
  .soc{font-size:50px}
  .tdh .dist{font-size:34px}
}
@container lmcard (max-width:380px){
  .ctiles{grid-template-columns:minmax(0,1fr)}
  .trip{gap:10px;padding:10px 11px}
}
.quick{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}
.qbtn{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:40px;padding:8px 14px;border-radius:999px;font:600 13.5px var(--lm-font);color:var(--lm-text);
  background:rgba(9,15,33,.55);border:1px solid rgba(148,163,184,.22);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);cursor:pointer;transition:background .2s,border-color .2s}
.qbtn .ic{width:16px;height:16px;color:var(--c)}
.qbtn:hover{background:rgba(255,255,255,.07);border-color:var(--c)}
.qbtn.on{border-color:var(--c)}
.qbtn.armed{border-color:var(--lm-amber);box-shadow:0 0 0 3px rgba(246,168,35,.18);animation:lm-armed 1s ease-in-out infinite}
.qbtn.busy{opacity:.55;pointer-events:none}
.carbox{position:relative;display:inline-block;max-width:100%;line-height:0}
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
            { name: "quick_actions", selector: { boolean: {} } },
            { name: "tabs", selector: { boolean: {} } },
          ],
        },
        { name: "page", selector: { select: { mode: "dropdown", options: [
          { value: "overview", label: "Overview" }, { value: "trips", label: "Trips" },
          { value: "charging", label: "Charging" }, { value: "vehicle", label: "Vehicle" },
        ] } } },
        { name: "entity_prefix", selector: { text: {} } },
      ],
      computeLabel: (s) => ({
        device_id: "Vehicle", name: "Title (optional)", sections: "Sections", scene: "Scene",
        language: "Language", confirm_actions: "Tap twice to confirm remote actions",
        backdrop: "Dark backdrop", image_flip: "Mirror the car picture", quick_actions: "Quick buttons under the battery", entity_prefix: "Entity prefix (optional, e.g. c10)",
        tabs: "Pages with tabs (Overview, Trips, Charging, Vehicle)", page: "First page",
      })[s.name],
    };
  }

  setConfig(config) {
    if (!config || typeof config !== "object") throw new Error("Invalid configuration");
    const sections = Array.isArray(config.sections) && config.sections.length
      ? ALL_SECTIONS.filter((s) => config.sections.includes(s))
      : ALL_SECTIONS;
    this._config = {
      scene: "auto", language: "auto", confirm_actions: true, backdrop: true, show_image: true, image_flip: false, quick_actions: true,
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
    this._renderTabs();
    for (const name of this._config.sections) this._renderSection(name, force);
    this._maybeFetchHistory();
  }

  /* ----- pages ----- */

  /** Pages with at least one configured section, in their fixed order. */
  _pages() {
    return PAGES.map((p) => ({ ...p, sections: p.sections.filter((s) => this._config.sections.includes(s)) }))
      .filter((p) => p.sections.length);
  }

  get _tabbed() {
    return this._config.tabs !== false && this._pages().length > 1;
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
      hero: `<section class="panel hero" id="hero"><div class="scene" id="scene"></div><div class="hero-ui" id="heroui"><div class="contents" id="hchips"></div><div class="info" id="hinfo"></div><div class="carzone" id="hcar"></div><div class="stripwrap" id="hstrip"></div></div></section>`,
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
    };
    const body = pages.map((p) =>
      `<div class="page pg-${p.id}" id="page-${p.id}" role="${tabbed ? "tabpanel" : "region"}"${tabbed && p.id !== this._page ? " hidden" : ""}>${p.sections.map((s) => markup[s]).join("")}</div>`).join("");
    const cls = ["lm", this._config.backdrop ? "backdrop" : "", tabbed ? "tabbed" : "", sticky ? "sticky" : ""].filter(Boolean).join(" ");
    this.shadowRoot.innerHTML = `<style>${STYLE}</style><div class="${cls}" id="root">` +
      `${tabbed ? `<nav class="tabs${sticky ? " sticky" : ""}" id="tabs" role="tablist"></nav>` : ""}${body}</div>`;
    this._sigs = {};
    this._built = true;
    const root = this.shadowRoot.getElementById("root");
    root.addEventListener("click", (ev) => this._onClick(ev));
    const chart = this.shadowRoot.getElementById("chart");
    if (chart && this._ro) this._ro.observe(chart);
  }

  _renderTabs() {
    const nav = this.shadowRoot.getElementById("tabs");
    if (!nav) return;
    const badges = this._badges();
    const sig = `${this._lang}|${this._page}|${JSON.stringify(badges)}`;
    if (this._sigs.__tabs === sig) return;
    this._sigs.__tabs = sig;
    nav.innerHTML = this._pages().map((p) => {
      const b = badges[p.id];
      const on = p.id === this._page;
      return `<button class="tab${on ? " on" : ""}" role="tab" aria-selected="${on}" data-act="page" data-page="${p.id}">` +
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
    return out;
  }

  _setPage(id) {
    if (!this._tabbed || id === this._page || !this._pages().some((p) => p.id === id)) return;
    this._page = id;
    for (const p of this._pages()) {
      const el = this.shadowRoot.getElementById(`page-${p.id}`);
      if (el) el.hidden = p.id !== id;
    }
    this._renderTabs();
    for (const name of this._config.sections) this._renderSection(name);
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

  _renderSection(name, force = false) {
    const map = {
      hero: () => { this._renderScene(force); return this._heroSig(); },
      check: () => this._checkSig(),
      chart: () => this._chartSig(),
      week: () => this._sig(["week"]),
      charging: () => this._sig(["battery", "chargeLimit", "chargeLimitSet", "isCharging", "isPlugged", "connection", "finish", "remaining", "power", "current", "voltage", "lastCharge", "range", "lastSession", "lastSessionCost", "monthCost", "monthEnergy", "toLimit",
        "chargeSchedule", "preheat", "healthyCharging", "startChargeBtn", "stopChargeBtn", "unlockCharger"])
        + Math.floor(Date.now() / MIN) + `|${this._limitPending ?? ""}|${JSON.stringify(this._armed)}|${JSON.stringify(this._busy)}`,
      energy: () => this._sig(["avg", "lwDriving", "lwClimate", "lwOther", "health"]),
      trips: () => this._sig(["lastTrip", "todayDistance", "monthDistance", "tripConsumption", "driveCost"]) + Math.floor(Date.now() / MIN) + `|${this._tripKey(this._mapSelected())}|${this._tripLimit}`,
      map: () => this._mapSig(),
      maintenance: () => this._sig(["nextMaintenance", "maintenanceDue"]) + JSON.stringify(this._armed) + JSON.stringify(this._busy),
      tires: () => this._sig(["tireFL", "tireFR", "tireRL", "tireRR", "tireWarning"]),
      insights: () => this._sig(["driveCost", "costPer100", "drain", "tripConsumption", "tireWarning", "lastTrip"]),
      controls: () => this._controlsSig(),
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
      return;
    }
    if (name === "map") {
      for (const [id, part] of Object.entries(this._mapHtml())) this._patch(id, part);
      this._syncMap();
      return;
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
      this._sig(["speeding", "speedLimit", "speedLimitOn", "climateOn", "climateMode", "climateSwitch", "sentry"]), this._sig(TIRES.map(([k]) => k)),
      this._sceneMode(), Math.floor(Date.now() / MIN), JSON.stringify(this._armed), JSON.stringify(this._busy),
      this._sig(["quickHeatBtn", "quickCoolBtn", "windowsOpenBtn", "windowsCloseBtn"]),
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

    // Car
    const night = this._sceneMode() === "night";
    const picUrl = this._carPicture();
    const carArt = picUrl
      ? `<img src="${esc(picUrl)}" alt="${esc(this._vehicleName())}"${this._config.image_flip ? ' class="flip"' : ""}>`
      : carSvg(night);
    const carInner = `<div class="carbox${picUrl ? "" : " svgcar"}">${carArt}${this._carFx({ charging, plugged, night, driving, locked })}</div>`;
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
        <div class="metaline">${meta.join("")}</div>${this._quickHtml()}`,
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
    const body = `${this._healthHtml()}${consumption}${tires ? `<div class="stats" style="margin-top:14px">${tires}</div>` : ""}${split}`;
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
        return `<div class="trow2"><span>${labels[b.band] || b.band}</span><div class="b"><i style="width:${Math.round(b.consumption_kwh_100km / max * 100)}%;background:${color}"></i></div><span class="mono">${this._num(b.consumption_kwh_100km, 1)}</span></div>`;
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
    const tag = pick ? "button" : "div";
    const sub = live
      ? `<small><span class="dot pulse" style="--c:#38bdf8;width:6px;height:6px;margin-right:6px;vertical-align:1px"></span>${esc(t("mapLive"))}</small>`
      : `<small>${end ? esc(this._time(end)) : ""}</small>`;
    return `<${tag} class="trip${live ? " live" : ""}${selected ? " sel" : ""}"${pick ? ` data-trip="${live ? "live" : index}"` : ""}>
      <div class="tt"><b>${start ? esc(this._time(start)) : "—"}</b>${sub}</div>
      <div class="td"><b>${this._num(trip.distance_km ?? 0, 1)}<small>km</small>${vs}</b><span>${esc(bits.map((b) => b.replace(/ /g, "\u00a0")).join(" · ") || (live ? t("drivingNow") : ""))}</span></div>
      <div class="tcx">${cons != null ? `<span class="cons" style="background:${consColor}">${this._num(cons, 1)}</span><small>kWh/100 km</small>` : ""}</div>
    </${tag}>`;
  }

  /** Trips grouped by day, newest first, like the LeapConnect trips page. */
  _tripsHtml() {
    const t = (k, v) => this._tr(k, v);
    const a = this._s("lastTrip")?.attributes || {};
    const recent = Array.isArray(a.recent_trips) ? a.recent_trips : [];
    const current = a.current_trip && a.current_trip.start ? a.current_trip : null;
    const pick = this._config.sections.includes("map");
    const head = this._head(t("tripsTitle"), "route");

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

  /** Lock/unlock, quick heat, quick cool and windows as one row under the battery. */
  _quickHtml() {
    const t = (k) => this._tr(k);
    const defs = this._controlDefs();
    const keys = this._quickKeys(defs);
    if (!keys.length) return "";
    const buttons = keys.map((key) => {
      const d = defs[key];
      const armed = this._isArmed(key);
      return `<button class="qbtn${d.on ? " on" : ""}${armed ? " armed" : ""}${this._busy[key] ? " busy" : ""}" style="--c:${d.color}" data-act="ctl" data-key="${key}">${icon(d.icon)}${esc(armed ? t("tapConfirm") : d.label)}</button>`;
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
  _carFx({ charging, plugged, night, driving, locked }) {
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
    if (low("tireFL") || low("tireFR")) pin(76, 82, t("tireLowShort"), "bad");
    if (low("tireRL") || low("tireRR")) pin(25, 82, t("tireLowShort"), "bad");
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
    return {
      maphead,
      mapfoot: `<div class="legend">${legend}</div>${cells.length ? `<div class="stats">${cells.join("")}</div>` : ""}${this._speedChartHtml(tr, limit, sl?.source)}`,
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
    box.insertAdjacentHTML("afterbegin", routeSvg(tr, this._tr("mapStart"), this._tr(tr.live ? "mapLive" : "mapEnd"), w, h));
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
      this._mapSel = el.dataset.trip === "live" ? "live" : Number(el.dataset.trip);
      this._renderSection("trips");
      this._renderSection("map");
      this.shadowRoot.getElementById("map")?.scrollIntoView?.({ behavior: "smooth", block: "nearest" });
      return;
    }
    const act = el.dataset.act;
    if (act === "page") return this._setPage(el.dataset.page);
    if (act === "limit") return this._bumpLimit(Number(el.dataset.delta) || 0);
    if (act === "limitset") return this._confirmLimit();
    if (act === "limitcancel") return this._cancelLimit();
    if (act === "moretrips") {
      this._tripLimit += 10;
      this._renderSection("trips");
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
.bar{position:sticky;top:0;z-index:5;display:flex;align-items:center;gap:10px;height:56px;padding:0 16px;
  background:rgba(6,10,22,.86);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border-bottom:1px solid rgba(148,163,184,.1)}
.bar h1{margin:0;font-size:18px;font-weight:600;letter-spacing:.01em}
.bar .dot{width:8px;height:8px;border-radius:50%;background:#f6a823;box-shadow:0 0 10px #f6a823}
.menu{display:none;width:40px;height:40px;border:0;border-radius:50%;background:none;color:inherit;cursor:pointer;place-items:center}
.menu:hover{background:rgba(255,255,255,.06)}
.menu svg{width:22px;height:22px}
:host([narrow]) .menu{display:grid}
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
    this.shadowRoot.innerHTML = `<style>${PANEL_STYLE}</style>
      <div class="bar">
        <button class="menu" title="Menu" aria-label="Menu"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>
        <span class="dot"></span><h1>Leapmotor</h1>
      </div>
      <div class="wrap" id="wrap"></div>`;
    this.shadowRoot.querySelector(".menu").addEventListener("click", () => {
      this.dispatchEvent(new Event("hass-toggle-menu", { bubbles: true, composed: true }));
    });
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
        // The tabs stay under the panel's own top bar while scrolling.
        card.style.setProperty("--lm-tabs-top", "56px");
        card.setConfig({ type: "custom:leapmotor-card", sticky_tabs: true, ...(key === "auto" ? {} : { device_id: key }) });
        this._cards.set(key, card);
        wrap.appendChild(card);
      }
      card.hass = this._hass;
    }
  }
}

if (!customElements.get("leapmotor-panel")) customElements.define("leapmotor-panel", LeapmotorPanel);

if (!customElements.get("leapmotor-card")) {
  customElements.define("leapmotor-card", LeapmotorCard);
  window.customCards = window.customCards || [];
  window.customCards.push({
    type: "leapmotor-card",
    name: "Leapmotor",
    description: "Night-sky dashboard for your Leapmotor: overview with remote controls, trips with maps, charging and vehicle care.",
    preview: true,
    documentationURL: "https://github.com/sabotin/leapmotor/blob/main/docs/card.md",
  });
  console.info(`%c LEAPMOTOR-CARD %c ${CARD_VERSION} `, "color:#1a1206;background:#f6a823;font-weight:700;border-radius:4px 0 0 4px;padding:2px 6px", "color:#f6a823;background:#0f1729;border-radius:0 4px 4px 0;padding:2px 6px");
}
