# Changelog — `dronelogbook.app`

Sve značajne promjene i nadogradnje projekta dokumentirane su u ovoj datoteci.

---

## [2.1.1] - 2026-10-27 — Izvorna `dronelogbook.app` Ikona, PWA Manifest i Naziv Prozora

### Changed & Fixed (Izmijenjeno i ispravljeno)
- **Naziv instalirane PWA aplikacije i naslov prozora (`dronelogbook.app`)**:
  - Postavljeni `<title>dronelogbook.app</title>`, `apple-mobile-web-app-title="dronelogbook.app"` te `name: "dronelogbook.app"` i `short_name: "dronelogbook.app"` u Web App Manifestu kako bi se u gornjem okviru prozora i ispod ikone na zaslonu prikazivao točan naziv **`dronelogbook.app`** (umjesto starog naziva *"Drone Logbook Pro"*).
- **Izvorna `dronelogbook.app` ikona i uklanjanje generičkog slova „D” pri PWA instalaciji**:
  - Sve PWA i aplikacijske ikone (`/public/dronelogbookapp.png`, `/public/pwa-192x192.png`, `/public/pwa-512x512.png`, `/public/pwa-maskable-512x512.png`, `/public/apple-touch-icon.png`, `/public/favicon.png`) generirane su izravno iz originalnog visokorezolucijskog `dronelogbook.app` amblema u čistom 8-bit RGB PNG formatu.
  - Uklonjen duplikat manifest oznaka i `sizes: "any"` SVG zapis iz PWA manifesta koji je uzrokovao da Chromium pri instalaciji prikaže generičko slovo „D” umjesto prave ikone aplikacije.

---

## [2.1.0] - 2026-10-26 — Potpuna PWA Integracija i Service Worker

### Added (Dodano)
- **VitePWA & Workbox Service Worker (`vite-plugin-pwa`)**:
  - Automatska registracija Service Workera (`virtual:pwa-register` s `registerType: 'autoUpdate'`) za trenutni rad izvan mreže i predmemoriranje svih aplikacijskih resursa, Google fontova i Leaflet kartografskih skripti.
- **Ugrađeni gumb za instalaciju aplikacije (`PWAInstallButton.tsx` + `usePWAInstall.ts`)**:
  - Izravno pokretanje nativnog `beforeinstallprompt` instalacijskog dijaloga na Android i Desktop (Chrome/Edge) preglednicima.
  - Interaktivni vodič za instalaciju na **iPhone/iPad (iOS Safari — Add to Home Screen)**, **Android** i **Desktop** uređajima.
  - Automatsko skrivanje gumba za instalaciju kada je aplikacija već pokrenuta u instaliranom `standalone` načinu rada.
- **Kompletan set brendiranih `dronelogbook.app` PWA ikona u `/public`**:
  - `/public/dronelogbookapp.png` i `/public/pwa-512x512.png` (`512x512`, `purpose: "any"`)
  - `/public/pwa-192x192.png` (`192x192`, `purpose: "any"`)
  - `/public/pwa-maskable-512x512.png` (`512x512`, `purpose: "maskable"` sa sigurnosnom marginom na `#030710` podlozi za Android adaptivne ikone)
  - `/public/apple-touch-icon.png` (`180x180` PNG za iOS Safari početni zaslon)
  - `/public/favicon.png` i `/public/favicon.ico` (`64x64`) za kartice preglednika.
- **Indikator izvanmrežnog rada (Offline Banner)**:
  - Vizualna obavijest na dnu zaslona kada uređaj izgubi vezu s internetom i koristi lokalno predmemorirane podatke.

---

## [2.0.0] - 2026-10-26 — Modernizacija na React + Firebase Cloud Platformu

Potpuna migracija i redizajn aplikacije sa zastarjelog Google Apps Script + Google Sheets sustava na modernu **React 19 + TypeScript + Tailwind CSS + Firebase (Firestore & Google Auth)** arhitekturu.

### Added (Dodano)
- **Višekorisnička Firebase Cloud arhitektura (`Firestore` + `Google Auth`)**:
  - Svaki korisnik koji se prijavi svojim Google računom dobiva vlastiti izolirani prostor u oblaku (`users`, `flights`, `maintenance`, `countryRules`, `pilotDocs`).
  - Implementirana stroga Zero-Trust sigurnosna pravila (`firestore.rules`) verificirana s 12 adversarial testova.
- **Trezor dokumenata (Lokalna datoteka + Cloud Sync)**:
  - Mogućnost učitavanja lokalnih datoteka (**PDF, JPG, PNG, WEBP**) za **Dozvolu**, **Registraciju** i **Osiguranje**.
  - Automatska kompresija slika putem HTML5 Canvasa i sinkronizacija s kolekcijom `/pilotDocs/{uid}_{docType}` u Firestore bazi.
- **Globalna baza propisa za svih 195 država svijeta**:
  - Ugrađena kompletna baza od **195 država svijeta** (`src/data/globalRules195.ts`) s podacima o statusu letenja, maksimalnoj visini, VLOS-u, registraciji, osiguranju, Remote ID-u, nadležnom tijelu, službenom izvoru, **carinskim pravilima unosa drona** i kratkim pravilima.
- **Uživo Zrakoplovna Meteo Telemetrija (Open-Meteo API)**:
  - Automatski dohvat temperature na 2 m, brzine vjetra i udara vjetra za odabrane GPS koordinate polijetanja uz status procjene (`OPTIMALNO`, `OPREZ (VJETAR)`, `NEPOVOLJNO`).
- **Upravljanje flotom dronova**:
  - Mogućnost dodavanja više dronova u flotu (proizvođač, model, S/N, EASA klasa C0–C4) i brze promjene aktivnog drona u zaglavlju.
- **Sekcija "O aplikaciji", Kolačići, Disclaimer i Kontakt**:
  - Dodan informativni modal s novim logotipima (`dronelogbook.svg` i `droneapp.png`), objašnjenjem višekorisničkog rada, pravilima o kolačićima i privatnosti, pravnim odricanjem od odgovornosti te kontakt poveznicama (`drone@zrina.app` i `https://zrina.app`).
- **Jedinični i sigurnosni testovi (`node:test`)**:
  - 20 automatiziranih testova za čistu poslovnu logiku (`src/utils/logbookLogic.test.ts`) i sigurnosna pravila baze (`firestore.rules.test.ts`).

### Changed (Izmijenjeno)
- **100% Clean Slate zadano stanje**:
  - Aplikacija se po defaultu otvara potpuno prazna (bez unaprijed upisanih osobnih podataka autora), spremna za javno dijeljenje.
- **Novi HUD vizualni identitet**:
  - Zamijenjen stari zeleni izgled modernom tamnoplavom (`#060a14` / `#0b1324`), cijan (`#00f0ff`), nebesko plavom (`#38bdf8`) i magenta (`#ff007f`) paletom usklađenom s novim `drone.app` SVG logotipom.
- **Minimalistički UX u modulu PRAVILA**:
  - Uklonjeni nepotrebni horizontalni gumbi država ispod tražilice i okvir s popisom svih država.
  - Forma za uređivanje pravila više nije stalno prikazana na zaslonu, već se otvara isključivo klikom na diskretnu ikonu olovčice (`✏️`) u zaglavlju odabrane države.

---

## [1.3.1] - 2026-04-16 — Web Embed Stabilizacija (Legacy GAS)

### Highlights
- Potvrđeno stabilno učitavanje unutar GitHub Pages iframe okruženja putem `/exec` krajnje točke.
- Dokumentiran ponovljivi postupak objave radi izbjegavanja `X-Frame-Options: sameorigin` blokada.

---

## [1.3.0] - 2026-04-16 — Local-First Offline Nadogradnja + PWA Standalone

### Added
- Lokalno keširanje (`localStorage`) za trenutni prikaz povijesti letova, servisa i pravila prije pozadinskog osvježavanja.
- Automatsko spremanje u lokalni red čekanja (*offline queue*) kada uređaj nema internetsku vezu.
- Statusna oznaka `Online` / `Offline` i gumb za ručnu sinkronizaciju u zaglavlju pilota.
- Dinamički PWA manifest (`display: standalone`) za instalaciju na početni zaslon mobitela.

### Changed
- Prikaz dnevnika letova (`LOG`) i servisa (`SERVIS`) prebačen iz tablica u pregledne mobilne kartice.

---

## [1.2.0] - 2026-04-14 — Pametni Upsert i Autofill u Modulu Pravila

### Added
- Autocomplete padajući izbornik za odabir država u modulu `PRAVILA`.
- Automatsko popunjavanje obrasca postojećim pravilima pri odabiru države.
- Pametna *upsert* logika koja ažurira postojeću državu ili dodaje novu bez stvaranja duplikata.

---

## [1.1.0] - 2026-04-14 — Interaktivna GPS Karta i Inline Uređivanje

### Added
- Interaktivna karta s odabirom lokacije klikom ili povlačenjem markera te prebacivanjem između satelitskog i cestovnog prikaza.
- Automatski *reverse geocoding* (pretvaranje koordinata u naziv mjesta).
- Klizač radijusa leta (`100 m – 2000 m`, zadano `500 m`) u unosu novog leta i uređivanju dnevnika.
- Inline uređivanje letova i servisa bez skočnih `prompt()` prozora.

---

## [1.0.0] - Početno izdanje

### Added
- Početna Google Apps Script web aplikacija s 4 osnovna modula (`NOVI LET`, `SERVIS`, `LOG`, `PRAVILA`) i Google Sheets pozadinom.
