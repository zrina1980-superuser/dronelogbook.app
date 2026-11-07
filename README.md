# 🚁 dronelogbook.app

> Suvremena, instalabilna **Progressive Web App (PWA) & Firebase Cloud** platforma za evidenciju letova drona, održavanja flote, pohranu pilotskih dokumenata i pregled zrakoplovnih te carinskih propisa za **195 država svijeta**.

---

## 🌟 Glavne značajke (v2.1.1 PWA & Cloud Edition)

- **📲 Instalabilna PWA Aplikacija (`dronelogbook.app`)**:
  - Potpuna PWA usklađenost putem **VitePWA & Workbox Service Workera** (`display: standalone`, naziv prozora i instalirane aplikacije `dronelogbook.app`, automatsko predmemoriranje resursa i fontova za trenutni offline rad).
  - Ugrađeni gumb **„Instaliraj App”** u zaglavlju aplikacije s izravnim sustavnim skočnim okvirom (`beforeinstallprompt`) i slikovnim vodičem za **Android**, **iPhone/iPad (iOS Safari)** i **Desktop (Chrome/Edge)**.
  - Kompletan set izvornih `dronelogbook.app` PNG ikona (8-bit RGB, bez generičkog slova „D”): `dronelogbookapp.png` (`512x512`), `pwa-192x192.png` (`192x192`), `pwa-512x512.png` (`512x512`), `pwa-maskable-512x512.png` (sa sigurnosnom marginom za Android), `apple-touch-icon.png` (`180x180` za iOS) i `favicon.png` (`64x64`).
- **🧹 Clean Slate & Višekorisnički Cloud (Multi-Tenant)**:
  - Aplikacija se svakom novom korisniku otvara potpuno čista, bez tuđih podataka. Prijavom putem **Google računa (Firebase Authentication)** svaki pilot dobiva vlastiti, kriptografski izoliran prostor u **Cloud Firestore** bazi.
- **🗺️ Interaktivna Satelitska GPS Karta (Leaflet + Esri + Nominatim)**:
  - Odabir točke polijetanja klikom ili povlačenjem markera uz automatski dohvat naziva naselja/grada i vizualni prikaz radijusa leta (`100 m – 2000 m`).
- **🌬️ Uživo Zrakoplovna Meteo Telemetrija (Open-Meteo API)**:
  - Automatski prikaz trenutne temperature na 2 m, brzine vjetra, udara vjetra i procjene sigurnosti polijetanja (`OPTIMALNO`, `OPREZ (VJETAR)`, `NEPOVOLJNO`) za odabrane koordinate.
- **🗂️ Trezor Pilotskih Dokumenata (Lokalno + Cloud Sync)**:
  - Učitavanje lokalnih datoteka (**PDF, JPG, PNG, WEBP**) za **Dozvolu (A1/A3/A2)**, **Registraciju operatera** i **Policu osiguranja**. Slike se automatski optimiziraju pomoću HTML5 Canvasa, spremaju lokalno za rad bez interneta i sinkroniziraju s osobnim Firebase Cloud računom.
- **🌍 Globalna Baza Propisa za 195 Država Svijeta**:
  - Trenutno pretraživanje svih 195 država svijeta (po hrvatskom nazivu, engleskom nazivu ili ISO kodu) s detaljima o maksimalnoj visini, VLOS-u, registraciji, osiguranju, Remote ID-u, **pravilima carine i unosa preko granice** te diskretnom ikonom olovčice (`✏️`) za ručno ažuriranje podataka.

---

## 📲 Kako instalirati `dronelogbook.app` kao PWA aplikaciju

Kliknite na gumb **„Instaliraj App”** u gornjem desnom kutu aplikacije:
1. **Android (Chrome / Brave / Samsung Internet)**: Sustav će odmah ponuditi izravnu instalaciju (*Install app*) ili odaberite `⋮` -> **Instaliraj aplikaciju**.
2. **iPhone / iPad (iOS Safari)**: Dodirnite gumb **Dijeli (Share)** u alatnoj traci Safarija i odaberite **„Dodaj na početni zaslon”** (*Add to Home Screen*).
3. **Računalo (Chrome / Edge Desktop)**: Kliknite na **Instaliraj App** u aplikaciji ili na ikonu instalacije u adresnoj traci preglednika za samostalni prozor bez adresne trake.

---

## 🧭 Pregled Modula

| Modul | Namjena i funkcionalnosti |
| :--- | :--- |
| **1. NOVI LET** | Unos lokacije (GPS ili interaktivna satelitska karta), meteo telemetrija uživo, klizač radijusa leta (`100–2000 m`), automatski izračun trajanja leta u minutama, brzi predlošci trajanja (`+15m`, `+25m`, `+40m`) i obavezna prijeletna sigurnosna checklista (6 točaka). |
| **2. SERVIS** | Evidencija redovnog održavanja, zamjene propelera, kalibracije IMU/kompasa, provjere baterija i nadogradnje firmwarea po serijskom broju drona (`S/N`), uz brzo inline uređivanje i filtriranje. |
| **3. LOG (Dnevnik)** | Kronološki pregled svih letova s filtriranjem po dronu (`S/N`), pretragom po lokaciji ili bilješkama, inline uređivanjem svih parametara leta (uključujući kartu i radijus) te **CSV izvozom** (`UTF-8 BOM` kompatibilno s Excelom). |
| **4. PRAVILA (195 država)** | Minimalistička tražilica s autocomplete padajućim izbornikom za svih **195 država svijeta**, strukturiranim prikazom zrakoplovnih i carinskih pravila te gumbom olovčice (`✏️`) za uređivanje ili dodavanje nove države. |

---

## 🚀 Pokretanje i Razvoj

### Instalacija i lokalno pokretanje
```bash
# 1. Instalacija ovisnosti
npm install

# 2. Pokretanje razvojnog poslužitelja s aktivnim PWA Service Workerom (port 3000)
npm run dev
```

### Provjera ispravnosti, testovi i produkcijski build
```bash
# Pokretanje jediničnih testova logike i sigurnosnih pravila (20 testova)
npx tsx --test src/utils/logbookLogic.test.ts firestore.rules.test.ts

# Statička provjera koda i Firestore pravila
npm run lint

# Produkcijski build (generira dist/ s Workbox Service Workerom sw.js i manifest.webmanifest)
npm run build
```

---

## 🔒 Privatnost, Kolačići i Sigurnost

- **Bez reklamnog praćenja**: Aplikacija ne koristi oglašivačke kolačiće trećih strana niti analitičke trackere.
- **Lokalna pohrana (`localStorage` + Cache Storage)**: Koristi se isključivo za rad aplikacije izvan mreže (*Offline-First PWA*) na uređaju korisnika.
- **Višekorisnička izolacija u oblaku**: Pravila u `firestore.rules` strogo provjeravaju `request.auth.uid` i `request.auth.token.email_verified == true`. Svaki prijavljeni korisnik ima pristup isključivo vlastitim dokumentima u kolekcijama `/users`, `/flights`, `/maintenance`, `/countryRules` i `/pilotDocs`.

---

## 📚 Dodatna Dokumentacija u Repozitoriju

- [**ARCHITECTURE.md**](./ARCHITECTURE.md) — Detaljan opis tehničke arhitekture, PWA Service Workera, podatkovnog modela, tokova sinkronizacije i sigurnosnih pravila.
- [**CHANGELOG.md**](./CHANGELOG.md) — Kronološki pregled svih verzija i nadogradnji.
- [**security_spec.md**](./security_spec.md) — Sigurnosna specifikacija za Firestore Zero-Trust pravila.

---

## 📬 Kontakt i Podrška

- **E-pošta**: [drone@zrina.app](mailto:drone@zrina.app)
- **Službeni web**: [https://zrina.app](https://zrina.app)

## Neobavezna podrška

Ako ti je ovaj projekt bio koristan, možeš po želji podržati njegov daljnji razvoj na [Ko-fi](https://ko-fi.com/zrina).
