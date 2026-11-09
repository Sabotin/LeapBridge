<p align="center">
  <img src="images/banner.png" alt="Leapmotor za Home Assistant" width="100%">
</p>

# Navodila za namestitev (slovensko)

Ta vodnik te pelje skozi namestitev integracije **Leapmotor** v Home Assistant,
od začetka do delujoče nadzorne plošče. Za angleška navodila glej
[README.md](../README.md).

> [!IMPORTANT]
> To je neuradna integracija, ni povezana z družbo Leapmotor. Uporaba na lastno
> odgovornost. Leapmotor lahko kadar koli spremeni svoj API; ukaze za daljinsko
> upravljanje uporabljaj premišljeno in le, kadar je vozilo v varnem stanju.

---

## Kaj potrebuješ

| Kaj | Opomba |
| --- | --- |
| **Home Assistant 2025.3 ali novejši** | Starejše različice ne podpirajo nastavitev vozila. |
| **E-pošta in geslo računa Leapmotor** | Tvoji podatki za prijavo. |
| **Certifikat aplikacije:** `app_cert.pem` in `app_key.pem` | Dve datoteki, potrebni za prijavo na evropski strežnik. Nista del tega repozitorija — glej [spodaj](#o-certifikatu-app_certpem-in-app_keypem). |
| **PIN vozila** *(neobvezno)* | Potreben samo za daljinsko upravljanje (zaklepanje, klima …). |

> [!TIP]
> Priporočilo: ustvari **drugi račun Leapmotor** in mu v uradni aplikaciji deli
> vozilo. Ta deljeni račun nato uporabi v Home Assistantu. Če uporabiš isti
> račun v aplikaciji in v Home Assistantu, te lahko aplikacija odjavi.

---

## O certifikatu `app_cert.pem` in `app_key.pem`

Za prijavo na evropski strežnik Leapmotor sta potrebni dve datoteki:

- **`app_cert.pem`** — certifikat aplikacije,
- **`app_key.pem`** — pripadajoči zasebni ključ.

To **nista** tvoje uporabniško ime in geslo in nista osebna podatka vozila — sta
gradivo na ravni aplikacije. Zaradi tega **nista vključena v ta repozitorij** in
ju integracija ne more ustvariti ali prenesti sama. Vsak uporabnik mora datoteki
priskrbeti sam.

Datoteki shraniš **samo v svoj Home Assistant**, nikoli v GitHub. Repozitorij
ima samodejni pregled, ki zavrne vsako objavo z zasebnim ključem ali
certifikatom, prav zato da po nesreči ne pristaneta na spletu.

Ko imaš obe datoteki, nadaljuj z namestitvijo.

---

## 1. Namestitev integracije

### Prek HACS (priporočeno)

1. V HACS odpri **⋮ → Poljubni repozitoriji** (*Custom repositories*).
2. Dodaj `https://github.com/sabotin/leapmotor`, vrsta **Integration**.
3. Poišči **Leapmotor** in klikni **Prenesi** (*Download*).
4. **Znova zaženi** Home Assistant.

### Ročno

1. Prenesi ZIP: **[sabotin/leapmotor → main.zip](https://github.com/sabotin/leapmotor/archive/refs/heads/main.zip)** in ga razpakiraj.
2. Mapo `custom_components/leapmotor` kopiraj v svoj Home Assistant, tako da
   obstaja datoteka `/config/custom_components/leapmotor/manifest.json`.
   Kopiraj **celotno** mapo `leapmotor` (vključno z `frontend/` in
   `translations/`).
3. **Znova zaženi** Home Assistant.

<details>
<summary><b>Ročno prek dodatka Terminal &amp; SSH</b></summary>

```bash
mkdir -p /config/custom_components
```
```bash
wget -O /tmp/leapmotor.zip https://github.com/sabotin/leapmotor/archive/refs/heads/main.zip
```
```bash
rm -rf /tmp/leapmotor-src && unzip -q /tmp/leapmotor.zip -d /tmp/leapmotor-src
```
```bash
rm -rf /config/custom_components/leapmotor && cp -r /tmp/leapmotor-src/*/custom_components/leapmotor /config/custom_components/
```
```bash
ls /config/custom_components/leapmotor/manifest.json
```

</details>

---

## 2. Izbira jezika

Klikni svoje ime (spodaj levo) → **Jezik** (*Language*) → **Slovenščina**.
Imena entitet, pogovorna okna za namestitev in nadzorna plošča se ravnajo po tej
nastavitvi. Na voljo sta slovenščina in angleščina.

---

## 3. (Neobvezno) Certifikati vnaprej

Lahko ju vneseš med namestitvijo (korak 4) ali pa ju že zdaj shraniš v mapo:

```
/config/leapmotor/app_cert.pem
/config/leapmotor/app_key.pem
```

Ta mapa je zunaj `custom_components`, zato je posodobitve nikoli ne izbrišejo.

---

## 4. Nastavitev integracije

1. **Nastavitve → Naprave in storitve → + Dodaj integracijo → Leapmotor**.
2. **Certifikati** — naloži ali prilepi `app_cert.pem` in `app_key.pem`.
   (Ta korak se preskoči, če sta datoteki že v `/config/leapmotor/`.)
3. **Račun** — e-pošta, geslo, neobvezni PIN vozila in interval posodabljanja.
4. Končano. Vozilo se pojavi kot naprava z vsemi entitetami.

> [!NOTE]
> Če se namestitev ustavi pri certifikatih, ti sporočilo pove, kaj je narobe:
> *certifikat ni veljaven PEM*, *ključ ni veljaven*, ali *certifikat in ključ se
> ne ujemata*. V tem primeru preveri, da imaš pravi par datotek iz istega vira.

---

## 5. Dodaj nadzorno ploščo

Integracija vgrajeno kartico **naloži sama**, zato ni treba dodajati nobenega
vira (resource).

1. **Nastavitve → Nadzorne plošče → + Dodaj nadzorno ploščo → Nova prazna
   nadzorna plošča**, poimenuj jo *Leapmotor*.
2. Odpri jo → **✎ Uredi** → svinčnik ob imenu pogleda → **Vrsta pogleda: Pano
   (ena kartica)** (*Panel*) → Shrani.
3. **+ Dodaj kartico** → poišči **Leapmotor** (ali *Ročno* in prilepi spodnje) →
   Shrani.

```yaml
type: custom:leapmotor-card
```

Če kartice ne najde, enkrat osveži brskalnik s **Ctrl + F5**
(⌘ + Shift + R na macOS). V aplikaciji: *Nastavitve → Aplikacija → Razhroščevanje
→ Ponastavi predpomnilnik vmesnika*.

Vse možnosti kartice so v [docs/card.md](card.md).

---

## Stroški polnjenja in zdravje baterije

- **Cene polnjenja:** *Nastavitve → Naprave in storitve → Leapmotor → Nastavi*
  (zobnik pri računu). Vnesi ceno na kWh za polnjenje **doma**, **javno AC** in
  **javno DC**. Polnjenje šteje kot domače, če se začne v coni *Doma*; kot DC,
  če vozilo javi kabel DC ali polni z več kot 22 kW. Pusti 0, če stroškov ne
  želiš spremljati.
- **Kapaciteta baterije:** pri posameznem vozilu (pod računom) lahko vpišeš
  uporabno kapaciteto nove baterije v kWh. Pusti 0 za primerjavo z najboljšo
  doslej izmerjeno vrednostjo. Ocena zdravja se pokaže po treh dneh s polnim
  (100 %) polnjenjem.
- **Dnevnik voženj:** vožnje in polnjenja se zaznajo samodejno iz podatkov
  vozila. Za natančne čase začetka in konca ter kratke vožnje nastavi interval
  posodabljanja na **1 minuto**.

---

## Odpravljanje težav

| Težava | Rešitev |
| --- | --- |
| HACS ne namesti | Repozitorij dodaj kot vrsto **Integration**, nato znova zaženi. |
| Napaka certifikata ali prijave | Naloži/prilepi obe datoteki PEM ali ju shrani kot `/config/leapmotor/app_cert.pem` in `app_key.pem`. |
| *Certifikat in ključ se ne ujemata* | Datoteki nista par iz istega vira — priskrbi ujemajoč se par. |
| Prijava `code 21` / napačen račun ali geslo | Če isti podatki delujejo v uradni aplikaciji: popolnoma se odjavi, enkrat spremeni/ponastavi geslo v aplikaciji in poskusi znova. |
| Aplikacija te odjavlja | Uporabi drugi račun z deljenim vozilom. |
| Zastarele ali napačne vrednosti | Pritisni **Osveži podatke**, preveri **Zadnja osvežitev**, nato zaženi `leapmotor.export_diagnostics`. |
| Daljinsko upravljanje ne deluje | Nastavi PIN vozila; preveri dovoljenja računa in deljenega vozila. |
| Kartice ni mogoče najti | Osveži brskalnik (Ctrl + F5) ali ponastavi predpomnilnik vmesnika v aplikaciji. |

<details>
<summary><b>Beleženje za razhroščevanje</b></summary>

```yaml
logger:
  default: info
  logs:
    custom_components.leapmotor: debug
```

Po urejanju `configuration.yaml` znova zaženi Home Assistant. Pred deljenjem
dnevnikov jih preveri glede podatkov računa, številk VIN, lokacij, žetonov in
certifikatov. Za javne prijave napak raje uporabi `leapmotor.export_diagnostics`.

</details>

---

## Posodabljanje

- **HACS:** v HACS odpri Leapmotor → **Prenesi znova** (*Redownload*) → znova
  zaženi.
- **Ročno:** ponovi [1. korak](#1-namestitev-integracije) (zamenjaj mapo) in
  znova zaženi. Tvoja certifikata v `/config/leapmotor/` ostaneta nedotaknjena.

---

<p align="center"><sub>Narejeno za voznike Leapmotor · ni povezano z družbo Leapmotor</sub></p>
