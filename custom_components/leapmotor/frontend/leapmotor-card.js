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
    precoolCabin: "Pre-cool cabin", autoCabin: "Auto pre-condition", willCool: "will cool", willHeat: "will heat",
    preheatCabin: "Preheat cabin", preheatSub: "{t} °C · fan {f}", recircShort: "recirc.",
    mntTitle: "Maintenance", mntOk: "OK", mntSoon: "SOON", mntOverdue: "OVERDUE", kmLeft: "{x} km", daysLeft: "{x} days", overdueBy: "{x} overdue", mntAssumed: "assumed on schedule", mntLogged: "logged", mntDone: "Done", mntHint: "Tap Done twice after a service", mntNone: "No maintenance schedule yet.", insightsTitle: "Insights", driveCost: "Driving cost this month", per100: "{x} per 100 km", drain: "Parked drain", drainSub: "{p} % of battery per day", vsUsual: "{x} vs usual", usualSub: "last trip vs {n} similar trips", tempTitle: "Consumption by outside temperature", tiresOk: "Tires look fine", tiresWarn: "Check tires", tLow: "low", tUneven: "uneven", tDropping: "slowly dropping", noInsights: "Insights appear after a few days of driving and charging.", toLimit: "To {l} %: {e} kWh", costNowLow: "{now} now · {low} in low tariff", lowFrom: "from {t}", sentry: "Sentry mode", healthy: "Healthy charging", startCharge: "Start charging", stopCharge: "Stop charging", openRoof: "Open sunroof", closeRoof: "Close sunroof", logged: "Logged: {x}",
    tripsTitle: "Trip log", tripsMeta: "today {d} · this month {m}", drivingNow: "Driving now", yesterday: "Yesterday", noTrips: "Trips appear here after your next drive. For exact start and end times, set the update interval to 1 minute.", colTrip: "Trip", colDistance: "Distance", colDuration: "Duration", colEnergy: "Energy", colConsumption: "kWh/100 km", colSoc: "Battery", colSpeed: "Avg speed", monthTrips: "This month {d} · {n}× · {e}", monthCharging: "This month", lastSession: "Last session", tierHome: "Home", tierAC: "Public AC", tierDC: "Public DC", health: "Battery health", healthSub: "{c} of {r} kWh usable", healthPending: "estimate after 3 days with a full charge", sessionsN: "{n}× charged",
    mapTitle: "Trip map", mapLoading: "Loading route…", mapEmpty: "No route for this trip yet. It is drawn from the car's location history in Home Assistant.", mapHint: "Trips appear on the map after your next drive.", mapStart: "Start", mapEnd: "End", mapLive: "Live", topSpeed: "Top speed", avgSpeedL: "Average", aboveLimit: "Above limit", limitCar: "Car speed limit", limitAlert: "Speed alert", legendBelow: "below limit", legendNear: "close to it", legendAbove: "above limit", legendSlow: "up to 50", legendMid: "50–90", legendFast: "over 90", tooFast: "Too fast · {x}", speedLimit: "Speed limit", trunk: "Trunk", windows: "Windows", doors: "Doors", sunroof: "Sunroof", sentryOn: "Sentry", tireLowShort: "Tire", limitDown: "Lower charge limit", limitUp: "Raise charge limit", limitSet: "Charge limit {x}",
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
const ALL_SECTIONS = ["hero", "check", "chart", "week", "charging", "energy", "trips", "map", "maintenance", "insights", "controls"];
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

/* ---------- trips ---------- */
.trow{display:grid;grid-template-columns:minmax(0,1.5fr) repeat(6,minmax(0,1fr));align-items:center;gap:10px;padding:10px 14px;border-radius:12px}
.trow+.trow{margin-top:6px}
.trow.head{padding:0 14px 4px;font-size:9.5px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:var(--lm-dim)}
.trow.item{background:rgba(255,255,255,.025);border:1px solid var(--lm-line-2)}
.trow.live{border-color:rgba(56,189,248,.4);background:linear-gradient(90deg,rgba(56,189,248,.1),rgba(56,189,248,.02))}
.tday b{display:block;font-size:13px;font-weight:600}
.tday small{display:block;font-family:var(--lm-mono);font-size:11px;color:var(--lm-muted);margin-top:2px}
.tc{font-family:var(--lm-mono);font-size:13px;font-weight:600;white-space:nowrap}
.tc small{font-size:9.5px;color:var(--lm-muted);font-weight:500;margin-left:2px}
.tc.dist{font-size:15px}
.cons{display:inline-block;padding:3px 8px;border-radius:7px;font-size:12px;color:#0b1020;font-weight:700}
.socbar{position:relative;height:5px;border-radius:5px;background:rgba(148,163,184,.14);margin-top:5px;overflow:hidden}
.socbar i{position:absolute;top:0;bottom:0;border-radius:5px;background:linear-gradient(90deg,#f6a823,#fbbf24)}
.tfoot{font-size:11.5px;color:var(--lm-muted);margin-top:12px}
.tfoot b{color:var(--lm-text);font-weight:600}
/* charging summary + battery health */
.csum{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:14px}
.csum div{padding:10px 12px;border-radius:11px;background:rgba(255,255,255,.03);border:1px solid var(--lm-line-2);min-width:0}
.csum small{display:block;font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--lm-dim)}
.csum b{display:block;font-size:15px;margin-top:5px}
.csum span{display:block;font-size:11px;color:var(--lm-muted);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.health{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:12px;margin-top:12px;padding:10px 12px;border-radius:11px;background:rgba(255,255,255,.03);border:1px solid var(--lm-line-2)}
.health .sq{width:30px;height:30px;border-radius:9px;display:grid;place-items:center;color:#f472b6;background:rgba(244,114,182,.14)}
.health b{display:block;font-size:13px;font-weight:600}
.health small{display:block;font-size:10.5px;color:var(--lm-dim);margin-top:1px}
.health .mono{font-size:17px;font-weight:600}

/* ---------- maintenance ---------- */
.mrow{display:grid;grid-template-columns:auto minmax(0,1fr) auto auto;align-items:center;gap:12px;padding:10px 12px;border-radius:12px;background:rgba(255,255,255,.025);border:1px solid var(--lm-line-2)}
.mrow+.mrow{margin-top:7px}
.mrow .sq{width:30px;height:30px;border-radius:9px;display:grid;place-items:center;color:var(--c);background:color-mix(in srgb,var(--c) 15%,transparent)}
.mrow b{display:block;font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mrow small{display:block;font-size:10.5px;color:var(--lm-dim);margin-top:2px}
.mbar{height:4px;border-radius:4px;background:rgba(148,163,184,.12);margin-top:6px;overflow:hidden}
.mbar i{display:block;height:100%;border-radius:4px}
.mdone{padding:6px 10px;border-radius:9px;font-size:11.5px;font-weight:600;color:var(--lm-soft);background:rgba(255,255,255,.04);border:1px solid var(--lm-line)}
.mdone:hover{background:rgba(255,255,255,.08)}
.mdone.armed{color:var(--lm-amber-2);border-color:var(--lm-amber)}
/* ---------- insights ---------- */
.irow{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:12px;padding:10px 12px;border-radius:12px;background:rgba(255,255,255,.025);border:1px solid var(--lm-line-2)}
.irow+.irow{margin-top:7px}
.irow .sq{width:30px;height:30px;border-radius:9px;display:grid;place-items:center;color:var(--c);background:color-mix(in srgb,var(--c) 15%,transparent)}
.irow b{display:block;font-size:13px;font-weight:600}
.irow small{display:block;font-size:10.5px;color:var(--lm-dim);margin-top:1px}
.irow .mono{font-size:15px;font-weight:600;white-space:nowrap}
.temps{margin-top:12px}
.temps small.h{display:block;font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--lm-dim);margin-bottom:8px}
.trow2{display:grid;grid-template-columns:62px 1fr 48px;align-items:center;gap:8px;font-size:11px;color:var(--lm-muted)}
.trow2+.trow2{margin-top:6px}
.trow2 .b{height:6px;border-radius:6px;background:rgba(148,163,184,.12);overflow:hidden}
.trow2 .b i{display:block;height:100%;border-radius:6px}
.trow2 .mono{font-size:11px;text-align:right;color:var(--lm-text)}
.vs{display:inline-block;margin-left:6px;padding:2px 6px;border-radius:6px;font-size:10px;font-weight:700;font-family:var(--lm-font)}
.vs.good{color:#34d399;background:rgba(52,211,153,.14)}
.vs.bad{color:#fb923c;background:rgba(251,146,60,.14)}
.climit{margin-top:8px;font-size:11px;color:var(--lm-muted)}
.climit b{color:var(--lm-text);font-weight:600}

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
  .hero,.controls,.trips,.map,.maintenance,.insights{grid-column:1/-1}
}
@container lmcard (min-width:1180px){
  .lm{grid-template-columns:minmax(0,1.28fr) minmax(0,1.16fr) minmax(0,1fr)}
  .hero{grid-column:span 2}
  .lm.solo-hero .hero{grid-column:1/-1}
  .maintenance{grid-column:span 2}
  .insights{grid-column:span 1}
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
  .mapbox{height:250px}
  .quick{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))}
  .fxpin b{font-size:9.5px;padding:2px 6px}
  .panel{padding:16px}
  .days{gap:3px;min-height:300px}
  .day{padding:10px 0 8px}
  .day .km{font-size:12.5px}
  .day .co{display:none}
  .tiles{grid-template-columns:repeat(auto-fill,minmax(112px,1fr))}
  .trow{grid-template-columns:minmax(0,1fr) auto auto;gap:8px 10px;padding:10px 12px}
  .trow.head{display:none}
  .trow .tdur,.trow .ten,.trow .tsoc,.trow .tspd{display:none}
  .strip{grid-template-columns:repeat(3,minmax(0,1fr));padding:12px}
  .day .en{font-size:10px}
  .cell .l{letter-spacing:.08em}
  .day .en small{display:none}
}
.quick{display:flex;flex-wrap:wrap;gap:6px;margin-top:16px}
.qbtn{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:7px 12px;border-radius:999px;font:600 12px var(--lm-font);color:var(--lm-text);
  background:rgba(9,15,33,.55);border:1px solid rgba(148,163,184,.22);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);cursor:pointer;transition:background .2s,border-color .2s}
.qbtn .ic{width:14px;height:14px;color:var(--c)}
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
.stepper{display:inline-flex;align-items:center;gap:8px}
.stepper .stp{width:28px;height:28px;border-radius:50%;border:1px solid rgba(246,168,35,.5);background:rgba(246,168,35,.1);color:var(--lm-amber-2);font:600 16px/1 var(--lm-mono);cursor:pointer;display:grid;place-items:center;padding:0}
.stepper .stp:hover{background:rgba(246,168,35,.22)}
.stepper .pending{color:var(--lm-amber-2)}
.stepper.busy{opacity:.55;pointer-events:none}
.mapbox{position:relative;height:320px;border-radius:14px;overflow:hidden;background:radial-gradient(120% 90% at 30% 0%,#111b38,#070c1c 70%);border:1px solid rgba(148,163,184,.15)}
.mapbox .hamap{display:block;width:100%;height:100%}
.mapbox .routesvg{display:block;width:100%;height:100%}
.mapbox .routesvg text{font:600 11px var(--lm-font,inherit);fill:#e9eef8;paint-order:stroke;stroke:#070c1c;stroke-width:3px}
.mapbox .mapmsg{display:none;position:absolute;inset:0;place-items:center;text-align:center;padding:24px;color:var(--lm-muted);font-size:13px;line-height:1.5}
.mapbox.msg .mapmsg{display:grid}
.mapbox.msg .hamap,.mapbox.msg .routesvg{visibility:hidden}
.map .legend{display:flex;flex-wrap:wrap;gap:6px 16px;font-size:12px;color:#a9b3ca;margin-top:12px}
.map .legend i{display:inline-block;width:18px;height:4px;border-radius:2px;background:var(--c);box-shadow:0 0 8px var(--c);vertical-align:middle;margin-right:7px}
.map .mstats{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:12px 8px;margin-top:14px;padding:12px 14px;border-radius:13px;background:rgba(255,255,255,.025);border:1px solid var(--lm-line-2)}
.trow[data-trip]{cursor:pointer}
.trow.sel{border-color:rgba(246,168,35,.55);box-shadow:inset 3px 0 0 var(--lm-amber)}
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
  }

  /* ----- Lovelace API ----- */

  static getStubConfig() {
    return {};
  }

  static getConfigForm() {
    const sectionOptions = [
      ["hero", "Hero scene"], ["check", "Vehicle check"], ["chart", "Last 24 hours"], ["week", "Last 7 days"],
      ["charging", "Charging"], ["energy", "Energy & tires"], ["trips", "Trip log"], ["map", "Trip map"], ["maintenance", "Maintenance"], ["insights", "Insights"], ["controls", "Remote control"],
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
          ],
        },
        { name: "entity_prefix", selector: { text: {} } },
      ],
      computeLabel: (s) => ({
        device_id: "Vehicle", name: "Title (optional)", sections: "Sections", scene: "Scene",
        language: "Language", confirm_actions: "Tap twice to confirm remote actions",
        backdrop: "Dark backdrop", image_flip: "Mirror the car picture", quick_actions: "Quick buttons under the battery", entity_prefix: "Entity prefix (optional, e.g. c10)",
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
    if (has("trips")) parts.push(`<section class="panel trips" id="trips"></section>`);
    if (has("map")) parts.push(`<section class="panel map" id="map"><div id="maphead"></div><div class="mapbox" id="mapbox"></div><div id="mapfoot"></div></section>`);
    if (has("maintenance")) parts.push(`<section class="panel maintenance" id="maintenance"></section>`);
    if (has("insights")) parts.push(`<section class="panel insights" id="insights"></section>`);
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
      charging: () => this._sig(["battery", "chargeLimit", "chargeLimitSet", "isCharging", "isPlugged", "connection", "finish", "remaining", "power", "current", "voltage", "lastCharge", "range", "lastSession", "lastSessionCost", "monthCost", "monthEnergy", "toLimit"]) + Math.floor(Date.now() / MIN) + `|${this._limitPending ?? ""}|${this._busy.limit ? 1 : 0}`,
      energy: () => this._sig(["avg", "tireFL", "tireFR", "tireRL", "tireRR", "lwDriving", "lwClimate", "lwOther", "health"]),
      trips: () => this._sig(["lastTrip", "todayDistance", "monthDistance", "tripConsumption"]) + Math.floor(Date.now() / MIN) + `|${this._tripKey(this._mapSelected())}`,
      map: () => this._mapSig(),
      maintenance: () => this._sig(["nextMaintenance", "maintenanceDue"]) + JSON.stringify(this._armed) + JSON.stringify(this._busy),
      insights: () => this._sig(["driveCost", "costPer100", "drain", "tripConsumption", "tireWarning", "lastTrip"]),
      controls: () => this._controlsSig(),
    };
    const html = {
      hero: () => this._heroHtml(),
      check: () => this._checkHtml(),
      chart: () => this._chartHtml(),
      week: () => this._weekHtml(),
      trips: () => this._tripsHtml(),
      maintenance: () => this._maintenanceHtml(),
      insights: () => this._insightsHtml(),
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
    if (name === "map") {
      for (const [id, part] of Object.entries(this._mapHtml())) this._patch(id, part);
      this._syncMap();
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
        <div class="mid">${this._limitStepper(limit)}</div>
        <div><small>${esc(right.label)}</small><span class="mono">${esc(right.value)}</span></div>
      </div>
      <div class="cbottom">
        <div class="cstate"><span class="sq${charging ? " on" : ""}">${icon(charging ? "bolt" : "plug")}</span><div><b>${esc(stateTitle)}</b>${stateSub ? `<small>${esc(stateSub)}</small>` : ""}</div></div>
        ${charging && rem != null ? `<div class="cright"><span class="mono">${esc(this._dur(rem))}</span><small>${esc(t("remaining"))}</small></div>` : ""}
      </div>
      ${this._chargeSummaryHtml()}`;
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
    const lastE = this._v("lastSession");
    const monthE = this._v("monthEnergy");
    if (!last && monthE == null) return "";
    const currency = this._unit("monthCost") || this._unit("lastSessionCost");
    const lastBits = [this._tierLabel(last?.attributes?.tier), this._money(this._v("lastSessionCost"), currency)].filter(Boolean);
    const sessions = this._s("monthCost")?.attributes?.sessions;
    const monthBits = [this._money(this._v("monthCost"), currency), sessions ? t("sessionsN", { n: sessions }) : null].filter(Boolean);
    const tl = this._s("toLimit");
    const tla = tl?.attributes || {};
    let limitLine = "";
    if (tl && this._v("toLimit") != null && this._v("toLimit") > 0.2) {
      const head = t("toLimit", { l: this._num(tla.limit ?? 0), e: this._num(this._v("toLimit"), 1) });
      const cur = currency;
      let tail = "";
      if (tla.cost_low_tariff != null && tla.cost_now != null && !tla.low_tariff_now) {
        tail = t("costNowLow", { now: this._money(tla.cost_now, cur), low: this._money(tla.cost_low_tariff, cur) })
          + (tla.next_low_tariff ? ` (${t("lowFrom", { t: this._time(new Date(tla.next_low_tariff)) })})` : "");
      } else if (tla.cost_now != null) {
        tail = this._money(tla.cost_now, cur);
      }
      limitLine = `<div class="climit clickable" data-more="toLimit"><b>${esc(head)}</b>${tail ? ` · ${esc(tail)}` : ""}</div>`;
    }
    return limitLine + `<div class="csum">
      <div class="clickable" data-more="lastSession"><small>${esc(t("lastSession"))}</small><b class="mono">${lastE != null ? `${this._num(lastE, 1)} kWh` : "—"}</b><span>${esc(lastBits.join(" · ") || "—")}</span></div>
      <div class="clickable" data-more="monthCost"><small>${esc(t("monthCharging"))}</small><b class="mono">${monthE != null ? `${this._num(monthE, 1)} kWh` : "—"}</b><span>${esc(monthBits.join(" · ") || "—")}</span></div>
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
      ${this._healthHtml()}
      ${split}`;
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
      <span class="mono">${soh != null ? `${this._num(soh, 1)} %` : "—"}</span></div>`;
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
    const head = `<div class="ptitle"><h3>${esc(t("mntTitle"))}</h3><span class="meta">${esc(a.schedule || "")}</span></div>`;
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
        <span class="pill ${pcls}">${esc(ptxt)}</span>
        <button class="mdone${armed ? " armed" : ""}" data-act="ctl" data-key="${esc(key)}">${esc(armed ? t("tapConfirm") : t("mntDone"))}</button>
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
    const tw = this._s("tireWarning");
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
    const head = `<div class="ptitle"><h3>${esc(t("insightsTitle"))}</h3></div>`;
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
      const s = new Intl.DateTimeFormat(this._lang, { weekday: "short", day: "numeric", month: "numeric" }).format(date);
      return s.charAt(0).toUpperCase() + s.slice(1);
    } catch (_e) { return date.toDateString(); }
  }

  _tripRow(trip, live = false, index = 0) {
    const t = (k, v) => this._tr(k, v);
    const pick = this._config.sections.includes("map");
    const selected = pick && this._tripKey(this._mapSelected()) === this._tripKey(live ? { ...trip, live: true } : trip);
    const start = trip.start ? new Date(trip.start) : null;
    const end = trip.end ? new Date(trip.end) : null;
    const when = start ? `${this._time(start)}${end && !live ? `–${this._time(end)}` : ""}` : "";
    const cons = trip.consumption_kwh_100km;
    const consColor = cons != null ? rampColor(EFFICIENCY_STOPS, clamp((cons - 10) / 20, 0, 1)) : null;
    const s0 = trip.start_soc, s1 = trip.end_soc;
    const socBar = s0 != null && s1 != null
      ? `<div class="socbar"><i style="left:${Math.min(s0, s1)}%;width:${Math.max(2, Math.abs(s0 - s1))}%"></i></div>` : "";
    return `<div class="trow item${live ? " live" : ""}${selected ? " sel" : ""}"${pick ? ` data-trip="${live ? "live" : index}"` : ""}>
      <div class="tday"><b>${live ? `<span class="dot pulse" style="--c:var(--lm-sky);margin-right:6px"></span>${esc(t("drivingNow"))}` : esc(start ? this._tripDay(start) : "")}</b><small>${esc(when)}</small></div>
      <div class="tc dist">${this._num(trip.distance_km ?? 0, 1)}<small>km</small>${trip.vs_usual_pct != null
        ? `<span class="vs ${trip.vs_usual_pct <= 0 ? "good" : "bad"}">${trip.vs_usual_pct > 0 ? "+" : ""}${this._num(trip.vs_usual_pct, 0)} %</span>` : ""}</div>
      <div class="tc tdur">${trip.duration_min != null ? esc(this._dur(trip.duration_min)) : "—"}</div>
      <div class="tc ten">${trip.energy_kwh != null ? `${this._num(trip.energy_kwh, 1)}<small>kWh</small>` : "—"}</div>
      <div class="tc">${cons != null ? `<span class="cons" style="background:${consColor}">${this._num(cons, 1)}</span>` : "—"}</div>
      <div class="tc tsoc">${s0 != null && s1 != null ? `${this._num(s0)} → ${this._num(s1)}<small>%</small>${socBar}` : "—"}</div>
      <div class="tc tspd">${trip.avg_speed_kmh != null ? `${this._num(trip.avg_speed_kmh)}<small>km/h</small>` : "—"}</div>
    </div>`;
  }

  _tripsHtml() {
    const t = (k, v) => this._tr(k, v);
    const s = this._s("lastTrip");
    const a = s?.attributes || {};
    const recent = Array.isArray(a.recent_trips) ? a.recent_trips : [];
    const current = a.current_trip && a.current_trip.start ? a.current_trip : null;
    const today = this._v("todayDistance"), month = this._v("monthDistance");
    const head = `<div class="ptitle"><h3>${esc(t("tripsTitle"))}</h3><span class="meta">${esc(t("tripsMeta", {
      d: `${this._num(today ?? 0, 1)} km`, m: `${this._num(month ?? 0)} km`,
    }))}</span></div>`;
    if (!recent.length && !current) return `${head}<div class="empty">${esc(t("noTrips"))}</div>`;
    const cols = `<div class="trow head"><span>${esc(t("colTrip"))}</span><span>${esc(t("colDistance"))}</span><span class="tdur">${esc(t("colDuration"))}</span><span class="ten">${esc(t("colEnergy"))}</span><span>${esc(t("colConsumption"))}</span><span class="tsoc">${esc(t("colSoc"))}</span><span class="tspd">${esc(t("colSpeed"))}</span></div>`;
    const latest = { ...(recent[0] || {}), vs_usual_pct: a.vs_usual_pct ?? this._s("tripConsumption")?.attributes?.vs_usual_pct };
    const rows = (current ? this._tripRow(current, true) : "")
      + recent.slice(0, 6).map((trip, i) => this._tripRow(i === 0 ? latest : trip, false, i)).join("");
    const ma = this._s("monthDistance")?.attributes || {};
    const foot = month != null
      ? `<div class="tfoot">${esc(t("monthTrips", { d: `${this._num(month)} km`, n: ma.trips ?? 0, e: ma.energy_kwh != null ? `${this._num(ma.energy_kwh, 1)} kWh` : "— kWh" }))}</div>`
      : "";
    return `${head}${cols}<div class="clickable" data-more="lastTrip">${rows}</div>${foot}`;
  }

  /* ----- quick actions on the first page ----- */

  /** Lock/unlock, quick heat, quick cool and windows as one row under the battery. */
  _quickHtml() {
    if (this._config.quick_actions === false) return "";
    const t = (k) => this._tr(k);
    const defs = this._controlDefs();
    const keys = [
      defs.unlockCar ? "unlockCar" : "lockCar",
      defs.quickHeat ? "quickHeat" : "cabinPreheat",
      defs.quickCool ? "quickCool" : "cabinPrecool",
      "windows",
    ].filter((k) => defs[k]);
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

  /* ----- charge limit stepper ----- */

  _limitStepper(limit) {
    const t = (k, v) => this._tr(k, v);
    const n = this._s("chargeLimitSet");
    const shown = this._limitPending ?? limit;
    const text = `${esc(t("limit"))} ${shown != null ? `${this._num(shown)} %` : "—"}`;
    if (!n || n.state === "unavailable") return text;
    const busy = this._busy.limit ? " busy" : "";
    return `<span class="stepper${busy}"><button class="stp" data-act="limit" data-delta="-1" aria-label="${esc(t("limitDown"))}">−</button>`
      + `<span class="${this._limitPending != null ? "pending" : ""}">${text}</span>`
      + `<button class="stp" data-act="limit" data-delta="1" aria-label="${esc(t("limitUp"))}">+</button></span>`;
  }

  /** Collect taps for a moment, then send one charge-limit command. */
  _bumpLimit(delta) {
    const n = this._s("chargeLimitSet");
    if (!n || !delta || this._busy.limit) return;
    const a = n.attributes || {};
    const step = Number(a.step) || 1;
    const min = isFinite(Number(a.min)) ? Number(a.min) : 1;
    const max = isFinite(Number(a.max)) ? Number(a.max) : 100;
    const base = this._limitPending ?? (parseFloat(n.state) || this._v("chargeLimit") || 80);
    this._limitPending = clamp(Math.round((base + delta * step) / step) * step, min, max);
    this._renderSection("charging");
    clearTimeout(this._limitTimer);
    this._limitTimer = setTimeout(() => this._sendLimit(), 1300);
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
    let meta = "";
    if (trip) {
      const start = new Date(trip.start);
      const end = trip.end ? new Date(trip.end) : null;
      const when = `${this._tripDay(start)} ${this._time(start)}${end && !trip.live ? `–${this._time(end)}` : ""}`;
      meta = `${trip.live ? `${t("mapLive")} · ` : ""}${when} · ${this._num(trip.distance_km ?? 0, 1)} km`;
    }
    const head = `<div class="ptitle"><h3>${esc(t("mapTitle"))}</h3><span class="meta">${esc(meta)}</span></div>`;
    if (!trip) return { maphead: head, mapfoot: "" };
    const limit = tr?.limit ?? this._speedLimit()?.kmh ?? null;
    const source = this._speedLimit()?.source;
    const legend = (limit
      ? [[SPEED_SLOW, t("legendBelow")], [SPEED_MID, t("legendNear")], [SPEED_FAST, t("legendAbove")]]
      : [[SPEED_SLOW, `${t("legendSlow")} km/h`], [SPEED_MID, `${t("legendMid")} km/h`], [SPEED_FAST, `${t("legendFast")} km/h`]])
      .map(([c, l]) => `<span><i style="--c:${c}"></i>${esc(l)}</span>`).join("");
    const top = trip.max_speed_kmh ?? tr?.maxKmh ?? null;
    const cells = [];
    const cell = (label, value, unit) => cells.push(`<div class="cell"><div class="l">${esc(label)}</div><div class="v">${value}<small>${esc(unit)}</small></div></div>`);
    if (top != null) cell(t("topSpeed"), this._num(top), "km/h");
    if (trip.avg_speed_kmh != null) cell(t("avgSpeedL"), this._num(trip.avg_speed_kmh), "km/h");
    if (limit) cell(source === "vehicle" ? t("limitCar") : t("limitAlert"), this._num(limit), "km/h");
    if (limit && tr) cell(t("aboveLimit"), this._num(Math.round(tr.aboveMs / MIN)), "min");
    return {
      maphead: head,
      mapfoot: `<div class="legend">${legend}</div>${cells.length ? `<div class="mstats">${cells.join("")}</div>` : ""}`,
    };
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
      points, limit, ...trackRuns(points, speeds, limit),
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
      fit();
      setTimeout(fit, 500);
    };
    draw();
    return true;
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
    const ph = this._s("preheatBtn")?.attributes;
    if (ph) {
      const sub = this._tr("preheatSub", { t: this._num(ph.temperature ?? 22), f: ph.fan_speed ?? 7 })
        + (ph.recirculate ? ` · ${this._tr("recircShort")}` : "");
      add("cabinPreheat", { entity: this._ids.preheatBtn, domain: "button", service: "press", label: t("preheatCabin"), icon: "flame", color: "#fb7185", sub, tile: true });
    }
    const pc = this._s("precoolBtn")?.attributes;
    if (pc) {
      const sub = this._tr("preheatSub", { t: this._num(pc.temperature ?? 18), f: pc.fan_speed ?? 7 })
        + (pc.recirculate ? ` · ${this._tr("recircShort")}` : "");
      add("cabinPrecool", { entity: this._ids.precoolBtn, domain: "button", service: "press", label: t("precoolCabin"), icon: "snow", color: "#7dd3fc", sub, tile: true });
    }
    const pa = this._s("preconditionBtn")?.attributes;
    if (pa) {
      const outside = this._v("outdoor");
      const sub = `${pa.mode === "cold" ? t("willCool") : t("willHeat")}${outside != null ? ` · ${this._num(outside, 1)} °C` : ""}`;
      add("cabinAuto", { entity: this._ids.preconditionBtn, domain: "button", service: "press", label: t("autoCabin"), icon: "thermo", color: "#a78bfa", sub, tile: true });
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
    if (this._chargeState().plugged) {
      if (this._chargeState().charging) btn("charge", "stopChargeBtn", t("stopCharge"), "plug", "#f6a823");
      else btn("charge", "startChargeBtn", t("startCharge"), "bolt", "#34d399");
    }
    swDef("sentry", "sentry", t("sentry"), "cctv", "#f472b6");
    swDef("healthy", "healthyCharging", t("healthy"), "heart", "#34d399");
    if (this._on("skylight")) btn("sunroof", "sunroofCloseBtn", t("closeRoof"), "roof", "#94a3b8");
    else btn("sunroof", "sunroofOpenBtn", t("openRoof"), "roof", "#94a3b8");
    if (this._chargeState().plugged) btn("unlockCharger", "unlockCharger", t("unlockCharger"), "plug", "#34d399");
    btn("find", "findBtn", t("findCar"), "find", "#f472b6");
    return defs;
  }

  _controlsSig() {
    return [this._sig(["lock", "climateSwitch", "preheat", "steeringHeat", "mirrorHeat", "chargeSchedule", "trunk", "sunshadePos", "isPlugged", "isCharging", "connection", "interior", "sentry", "healthyCharging", "skylight", "preheatBtn", "precoolBtn", "preconditionBtn", "outdoor"]),
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
    for (const name of ["check", "controls", "hero", "maintenance"]) if (this._config.sections.includes(name)) this._renderSection(name);
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
    if (el.dataset.act === "limit") {
      this._bumpLimit(Number(el.dataset.delta) || 0);
      return;
    }
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
    const def = key.startsWith("mnt:") ? this._maintenanceDef(key) : this._controlDefs()[key];
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
        card.setConfig(key === "auto" ? { type: "custom:leapmotor-card" } : { type: "custom:leapmotor-card", device_id: key });
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
    description: "Night-sky dashboard for your Leapmotor: battery, charging, vehicle check, 7-day driving and remote controls.",
    preview: true,
    documentationURL: "https://github.com/sabotin/leapmotor/blob/main/docs/card.md",
  });
  console.info(`%c LEAPMOTOR-CARD %c ${CARD_VERSION} `, "color:#1a1206;background:#f6a823;font-weight:700;border-radius:4px 0 0 4px;padding:2px 6px", "color:#f6a823;background:#0f1729;border-radius:0 4px 4px 0;padding:2px 6px");
}
