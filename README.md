<p align="center">
  <img src="docs/images/sl/pasica.png" alt="Leapmotor za Home Assistant" width="100%">
</p>

<p align="center">
  <a href="https://hacs.xyz/"><img src="https://img.shields.io/badge/HACS-Custom-f6a823?style=for-the-badge&labelColor=0f1729" alt="HACS"></a>
  <img src="https://img.shields.io/badge/Home%20Assistant-2025.3%2B-38bdf8?style=for-the-badge&labelColor=0f1729&logo=homeassistant&logoColor=white" alt="Home Assistant 2025.3+">
  <img src="https://img.shields.io/badge/jezik-SL%20%C2%B7%20EN-c3cbe0?style=for-the-badge&labelColor=0f1729" alt="Slovenščina in angleščina">
  <a href="LICENSE"><img src="https://img.shields.io/badge/licenca-AGPL--3.0-a78bfa?style=for-the-badge&labelColor=0f1729" alt="AGPL-3.0"></a>
</p>

<p align="center">
  <b>Tvoj Leapmotor v Home Assistantu.</b><br>
  Baterija, polnjenje, vožnje, stroški, vzdrževanje in daljinsko upravljanje —<br>
  vse na eni lepi nadzorni plošči.
</p>

<p align="center">🇬🇧 <a href="README.en.md">English</a></p>

<br>

## ✦ Kaj dobiš

- 🔋 **Stanje vozila** — baterija, doseg, ključavnica, vrata, okna, pnevmatike, lokacija
- 🔥 **Predgretje in hlajenje** — en dotik: ogrej (22 °C) ali ohladi s klimo (18 °C), ventilator 7, kroženje zraka; ali **samodejno** glede na zunanjo temperaturo
- ⚡ **Polnjenje in stroški** — **meja polnjenja** (tudi na T03), vsako polnjenje s ceno za dom, javno AC in DC, tudi **nizka tarifa** (MT/VT)
- 🛣️ **Dnevnik voženj** — razdalja, poraba in strošek vsake vožnje ter primerjava z običajnimi vožnjami
- 🗺️ **Zemljevid vožnje** — pot vsake vožnje, obarvana po hitrosti
- 🚦 **Omejitev hitrosti** — opozorilo, ko voziš hitreje od svoje meje ali omejitve v avtu
- 🚗 **Živa slika avta** — pokaže odprta vrata, prtljažnik in okna, klimo, polnjenje in vožnjo
- 🔧 **Vzdrževanje** — tovarniški servisni načrt za T03, B10, C10 in C10 REEV
- 💡 **Vpogledi** — zdravje baterije, praznjenje med parkiranjem, opozorilo, ko pnevmatika počasi pušča
- 🎛️ **Daljinsko upravljanje** — zaklepanje, prtljažnik, okna, stražarski način, polnjenje …
- 🤖 **Avtomatizacije** — pripravljene na en klik
- 🇸🇮 **V slovenščini** — ali angleščini, kakor imaš nastavljeno v profilu

<p align="center">
  <img src="docs/images/sl/nadzorna-plosca.png" alt="Nadzorna plošča" width="100%">
</p>

<br>

## ✦ Namestitev

**Kaj potrebuješ**

- Home Assistant 2025.3 ali novejši in [HACS](https://hacs.xyz/)
- e-pošto in geslo za račun Leapmotor — najbolje **drugi račun**, s katerim deliš vozilo, da te aplikacija ne odjavlja
- certifikat aplikacije: `app_cert.pem` in `app_key.pem` (nista del repozitorija, priskrbiš ju sam)
- PIN vozila je že vpisan (**0000**) — spremeni ga, če si ga v vozilu zamenjal

**Prek HACS**

[![Dodaj v HACS](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=Sabotin&repository=Leapmotor&category=integration)

1. HACS → **⋮** → **Poljubni repozitoriji** → `https://github.com/Sabotin/Leapmotor`, vrsta **Integration**.
2. Poišči **Leapmotor** → **Prenesi** → znova zaženi Home Assistant.
3. **Nastavitve → Naprave in storitve → Dodaj integracijo → Leapmotor**.
4. Naloži oba certifikata in vpiši račun. Končano — v stranski vrstici se pojavi **Leapmotor**. 🎉

**Posodobitev:** HACS namesti zadnjo različico z veje `main`. V HACS odpri Leapmotor → **⋮ → Posodobi informacije** (*Update information*) → **Prenesi znova** (*Redownload*) → znova zaženi Home Assistant. Če je kartica še stara, osveži brskalnik (**Ctrl + F5**).

Ročna namestitev brez HACS in vse podrobnosti: **[navodila v slovenščini](docs/navodila-sl.md)**.

<br>

## ✦ Nadzorna plošča

**Plug & play:** po namestitvi se v stranski vrstici sama pojavi **Leapmotor** s celotno nadzorno ploščo. Ničesar ni treba nastavljati. Če imaš več vozil, ima vsako svojo. Skriješ jo v **Leapmotor → Nastavi** (stikalo *Prikaži nadzorno ploščo v stranski vrstici*).

Kartica ima **štiri strani z zavihki** in zavihek **Nastavitve** (zobnik). Pika na zavihku pove, da je na tisti strani nekaj za pogledati. Slike kažejo temo **Aplikacija**.

<table>
  <tr>
    <td width="25%" valign="top"><img src="docs/images/sl/stran-pregled.png" alt="Pregled" width="100%"></td>
    <td width="25%" valign="top"><img src="docs/images/sl/stran-voznje.png" alt="Vožnje" width="100%"></td>
    <td width="25%" valign="top"><img src="docs/images/sl/stran-polnjenje.png" alt="Polnjenje" width="100%"></td>
    <td width="25%" valign="top"><img src="docs/images/sl/stran-vozilo.png" alt="Vozilo" width="100%"></td>
  </tr>
  <tr>
    <td valign="top"><b>Pregled</b><br><sub>Avto z baterijo in hitrimi gumbi (<i>Odkleni, Hitro gretje, Hitro hlajenje, Okna</i>), pregled vozila in daljinsko upravljanje.</sub></td>
    <td valign="top"><b>Vožnje</b><br><sub>Vsaka vožnja z zemljevidom, hitrostjo, porabo, baterijo in stroškom. Dnevnik po dnevih in zadnjih 7 dni.</sub></td>
    <td valign="top"><b>Polnjenje</b><br><sub>Polnjenje, meja polnjenja (izberi s − in +, potrdi z dvojnim tapom na <i>Nastavi</i>), zadnjih 24 ur in zdravje baterije.</sub></td>
    <td valign="top"><b>Vozilo</b><br><sub>Vzdrževanje, pnevmatike in vpogledi (stroški, praznjenje, poraba glede na temperaturo).</sub></td>
  </tr>
</table>

Kartico lahko dodaš tudi na svojo nadzorno ploščo: **Dodaj kartico → Leapmotor** ali

```yaml
type: custom:leapmotor-card
```

Kartica ima tri teme: klasično (nočno ali dnevno nebo), voznikov zaslon (merilniki ob avtu) in aplikacijo. Temo, dan ali noč in jezik si vsak uporabnik izbere v zavihku **Nastavitve** (zobnik); izbira velja za tega uporabnika na vseh napravah. Med polnjenjem se ob avtu prižge polnilnica. Če kartice ne najde, enkrat osveži brskalnik (**Ctrl + F5**).

<br>

## ✦ Predgretje, hlajenje in upravljanje

<p align="center">
  <img src="docs/images/sl/upravljanje.png" alt="Daljinsko upravljanje" width="100%">
</p>

- **Predgrej kabino** — 22 °C, ventilator 7, samo kroženje zraka
- **Ohladi kabino** — klima, najnižja temperatura 18 °C, ventilator 7
- **Pripravi kabino (samodejno)** — hladi, ko je zunaj topleje od 20 °C, sicer greje

Vse vrednosti spremeniš pri vozilu: **Naprave in storitve → Leapmotor →** vozilo **→ Nastavi**.
Vsak ukaz za varnost potrdiš z **dvojnim dotikom**.

Pri **Vzdrževanju** po servisu dvakrat tapni **Opravljeno** in rok se začne znova.

<br>

## ✦ Nastavitve

| Kaj | Kje |
| --- | --- |
| Cena polnjenja doma, javno AC in DC, nizka tarifa | **Leapmotor → Nastavi** (zobnik pri računu) |
| PIN, predgretje, hlajenje, kapaciteta baterije, opozorilo na hitrost | pri **vozilu** pod računom → **Nastavi** |
| Pogostost med vožnjo (za zemljevid) | **Leapmotor → Nastavi**, privzeto **1 minuta** |
| Leapmotor v stranski vrstici (vklop/izklop) | **Leapmotor → Nastavi** |
| Jezik | klikni svoje ime spodaj levo → **Jezik** |

<br>

## ✦ Avtomatizacije na en klik

| | |
| --- | --- |
| 🔥 **Pripravi kabino pred odhodom** — ob izbrani uri in dnevih | [![Uvozi](https://my.home-assistant.io/badges/blueprint_import.svg)](https://my.home-assistant.io/redirect/blueprint_import/?blueprint_url=https%3A%2F%2Fgithub.com%2FSabotin%2FLeapmotor%2Fblob%2Fmain%2Fblueprints%2Fautomation%2Fleapmotor%2Fprecondition_before_departure.yaml) |
| ⚡ **Polnjenje končano** — obvestilo na telefon | [![Uvozi](https://my.home-assistant.io/badges/blueprint_import.svg)](https://my.home-assistant.io/redirect/blueprint_import/?blueprint_url=https%3A%2F%2Fgithub.com%2FSabotin%2FLeapmotor%2Fblob%2Fmain%2Fblueprints%2Fautomation%2Fleapmotor%2Fcharging_complete.yaml) |
| 🔓 **Avto ostal odklenjen** — obvestilo ali samodejno zaklepanje | [![Uvozi](https://my.home-assistant.io/badges/blueprint_import.svg)](https://my.home-assistant.io/redirect/blueprint_import/?blueprint_url=https%3A%2F%2Fgithub.com%2FSabotin%2FLeapmotor%2Fblob%2Fmain%2Fblueprints%2Fautomation%2Fleapmotor%2Fleft_unlocked.yaml) |
| 🔌 **Opomnik za polnjenje** — zvečer, ko je baterija nizka | [![Uvozi](https://my.home-assistant.io/badges/blueprint_import.svg)](https://my.home-assistant.io/redirect/blueprint_import/?blueprint_url=https%3A%2F%2Fgithub.com%2FSabotin%2FLeapmotor%2Fblob%2Fmain%2Fblueprints%2Fautomation%2Fleapmotor%2Fplug_in_reminder.yaml) |
| ⚠️ **Opozorila** — vrata, okna, pnevmatike, servis | [![Uvozi](https://my.home-assistant.io/badges/blueprint_import.svg)](https://my.home-assistant.io/redirect/blueprint_import/?blueprint_url=https%3A%2F%2Fgithub.com%2FSabotin%2FLeapmotor%2Fblob%2Fmain%2Fblueprints%2Fautomation%2Fleapmotor%2Fattention_alert.yaml) |
| 🚦 **Prehitra vožnja** — hitrost in omejitev na telefon | [![Uvozi](https://my.home-assistant.io/badges/blueprint_import.svg)](https://my.home-assistant.io/redirect/blueprint_import/?blueprint_url=https%3A%2F%2Fgithub.com%2FSabotin%2FLeapmotor%2Fblob%2Fmain%2Fblueprints%2Fautomation%2Fleapmotor%2Fspeed_alert.yaml) |

<br>

## ✦ Težave?

| Težava | Rešitev |
| --- | --- |
| Napaka pri certifikatu | Sporočilo pove, katera datoteka je narobe. Naloži ujemajoč se par. |
| Napačno geslo (`code 21`) | Če deluje v aplikaciji: odjavi se, enkrat spremeni geslo v aplikaciji, poskusi znova. |
| Aplikacija te odjavlja | Uporabi drugi račun z deljenim vozilom. |
| Ukaz ne deluje | Preveri PIN vozila in pravice deljenega računa. |
| *Token is invalid* | Integracija se sama znova prijavi. Če se ponavlja, uporabi drugi račun z deljenim vozilom. |
| Zastareli podatki | Tapni **Osveži** na kartici. Podatki prihajajo iz oblaka in lahko malo zamujajo. |

<br>

## ✦ Zahvale

- Temelji na **[leapmotor-ha](https://github.com/kerniger/leapmotor-ha)** avtorja [kerniger](https://github.com/kerniger) (MIT).
- Dnevnik voženj, stroški polnjenja, vzdrževanje in dodatni ukazi so preneseni iz **[LeapConnect](https://github.com/markoceri/leapconnect)** avtorja [Marco Mancino](https://github.com/markoceri) (AGPL-3.0).

**Licenca:** GNU AGPL-3.0 — [LICENSE](LICENSE) in [NOTICE.md](NOTICE.md).
Neuradni projekt, ni povezan z družbo Leapmotor. Uporaba na lastno odgovornost.

<p align="center"><br><img src="custom_components/leapmotor/logo.svg" width="56" alt=""><br><sub>Narejeno za voznike Leapmotor 🚗⚡</sub></p>
