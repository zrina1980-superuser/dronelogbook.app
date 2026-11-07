# 🏗️ Arhitektura Sustava — `dronelogbook.app`

Ovaj dokument opisuje tehničku arhitekturu, PWA podsustav, strukturu direktorija, podatkovni model, tokove sinkronizacije i sigurnosni model aplikacije **dronelogbook.app v2.1.1**.

---

## 1. Tehnološki Stog (Tech Stack)

| Sloj | Tehnologija | Uloga u sustavu |
| :--- | :--- | :--- |
| **Frontend Framework** | **React 19 + TypeScript** | Modularno korisničko sučelje temeljeno na funkcijskim komponentama i prilagođenim hookovima. |
| **Build & PWA Sustav** | **Vite 8 + `vite-plugin-pwa` (Workbox)** | Brzo bundlanje, automatsko generiranje Service Workera, precaching statičkih resursa i upravljanje Web App Manifestom (`manifest.json`). |
| **Stiliziranje i Dizajn** | **Tailwind CSS v4 + Lucide Icons** | Zrakoplovni HUD dizajn (`#060a14` tamna podloga, `#00f0ff` cijan i `#ff007f` magenta akcenti), responzivni *mobile-first* i *desktop* raspored. |
| **Baza Podataka i Oblak** | **Firebase Firestore** | NoSQL dokumentna baza u stvarnom vremenu s `onSnapshot` pretplatama po prijavljenom korisniku. |
| **Autentifikacija** | **Firebase Authentication** | Prijava putem Google računa (`signInWithPopup`) za višekorisničku izolaciju podataka. |
| **Kartografija i Geokodiranje** | **Leaflet + Esri World Imagery + OSM Nominatim** | Interaktivna satelitska i cestovna karta, crtanje radijusa leta i automatsko pretvaranje GPS koordinata u naziv naselja. |
| **Meteorološki Podaci** | **Open-Meteo API** | Dohvat temperature (2 m), brzine vjetra (10 m) i udara vjetra u stvarnom vremenu za koordinate polijetanja. |
| **Testiranje i Verifikacija** | **Node.js Test Runner (`node:test`) + ESLint** | Jedinični testovi poslovne logike, tipova i Firestore sigurnosnih pravila. |

---

## 2. Struktura Projekta

```text
/
├── README.md                        # Glavni pregled projekta, PWA instalacije, značajki i uputa
├── ARCHITECTURE.md                  # Tehnička arhitektura, PWA podsustav, tokovi podataka i sigurnost
├── CHANGELOG.md                     # Povijest promjena po verzijama (v1.0.0 -> v2.1.1)
├── security_spec.md                 # Sigurnosna specifikacija i analiza prijetnji
├── firebase-blueprint.json          # Deklarativna shema kolekcija i entiteta u Firestore bazi
├── firestore.rules                  # Produkcijska Zero-Trust sigurnosna pravila za Firestore
├── firestore.rules.test.ts          # Automatizirani sigurnosni testovi ("Dirty Dozen" napadi)
├── vite.config.ts                   # Vite + Tailwind v4 + VitePWA (Workbox & Manifest) konfiguracija
├── index.html                       # Ulazna HTML datoteka (<title>dronelogbook.app</title>, PWA & iOS meta)
├── public/
│   ├── manifest.json                # Web App Manifest (name & short_name: "dronelogbook.app")
│   ├── dronelogbookapp.png          # Glavna izvorna ikona aplikacije (512x512 8-bit RGB PNG)
│   ├── favicon.png / favicon.ico    # Ikona kartice preglednika (64x64 PNG)
│   ├── apple-touch-icon.png         # iOS Safari Home Screen ikona (180x180 PNG)
│   ├── pwa-192x192.png              # Standardna PWA ikona (192x192 PNG, purpose: "any")
│   ├── pwa-512x512.png              # Visokorezolucijska PWA splash ikona (512x512 PNG, purpose: "any")
│   ├── pwa-maskable-512x512.png     # Android adaptivna maskable ikona (512x512 PNG sa safe-zonom)
└── src/
    ├── main.tsx                     # React DOM ulazna točka + registracija PWA Service Workera
    ├── App.tsx                      # Glavni kontejner aplikacije, navigacija tabova, offline indikator
    ├── index.css                    # Globalni Tailwind v4 stilovi i tipografija
    ├── firebase.ts                  # Inicijalizacija Firebase SDK-a, Auth providera i error handlera
    ├── components/
    │   ├── PilotHeader.tsx          # Zaglavlje s profilom, PWAInstallButtonom i trezorom dokumenata
    │   ├── PWAInstallButton.tsx     # Gumb i vodič za instalaciju PWA aplikacije (Android/iOS/Desktop)
    │   ├── NewFlightModule.tsx      # Modul NOVI LET (forma, meteo widget, checklista i GPS karta)
    │   ├── MapPickerModal.tsx       # Interaktivna Leaflet satelitska/cestovna karta s radijusom
    │   ├── ServiceModule.tsx        # Modul SERVIS (unos, pretraga i inline uređivanje servisa)
    │   ├── FlightLogModule.tsx      # Modul LOG (kartice letova, inline uređivanje i CSV izvoz)
    │   ├── RulesModule.tsx          # Modul PRAVILA (tražilica za 195 država + modal olovčice ✏️)
    │   └── Modals.tsx               # Modali za Profil/Flotu, Trezor dokumenata i O aplikaciji
    ├── data/
    │   ├── globalRules195.ts        # Kompletna baza zrakoplovnih i carinskih propisa za 195 država
    │   └── defaultCountries.ts      # Clean Slate zadane konstante i izvoz globalne baze
    ├── hooks/
    │   ├── useLogbookStore.ts       # Središnji Local-First + Firebase Cloud state & sync engine
    │   └── usePWAInstall.ts         # Hook za beforeinstallprompt, standalone detekciju i iOS
    └── utils/
        ├── logbookLogic.ts          # Čiste funkcije (validacija, izračun trajanja, analitika, CSV)
        └── logbookLogic.test.ts     # Jedinični testovi poslovne logike
```

---

## 3. PWA Arhitektura i Instalabilnost (`dronelogbook.app`)

Sustav zadovoljava sve **Chromium, Android i iOS Safari** kriterije za instalabilnu progresivnu web aplikaciju:

1. **Web App Manifest (`vite.config.ts` & `/public/manifest.json`)**:
   - `id: '/'`, `start_url: '/'`, `scope: '/'`
   - `name: 'dronelogbook.app'` i `short_name: 'dronelogbook.app'` (usklađeno s `<title>dronelogbook.app</title>` u `index.html` kako bi gornji okvir prozora i naziv instalirane aplikacije uvijek glasili `dronelogbook.app`)
   - `display: 'standalone'`, `theme_color: '#030710'`, `background_color: '#030710'`
   - Čiste 8-bit RGB PNG ikone (`pwa-192x192.png`, `pwa-512x512.png`, `dronelogbookapp.png` za `purpose: "any"` te `pwa-maskable-512x512.png` za `purpose: "maskable"`) generirane iz izvornog `dronelogbook.app` amblema, čime se sprječava prikaz generičkog slova „D” pri instalaciji.
2. **Workbox Service Worker (`registerSW({ immediate: true })`)**:
   - Predmemorira sve `.js`, `.css`, `.html`, `.png` i `.svg` datoteke pri prvom učitavanju.
   - Koristi `CacheFirst` strategiju za Google Fonts i Leaflet CDN skripte/stilove kako bi sučelje i karte radili pouzdano i pri slabom signalu na terenu.
3. **In-App Instalacijski Tok (`usePWAInstall.ts` + `PWAInstallButton.tsx`)**:
   - Hvata događaj `beforeinstallprompt` i omogućuje instalaciju jednim klikom na gumb **„Instaliraj App”** u zaglavlju.
   - Detektira `window.matchMedia('(display-mode: standalone)')` i automatski skriva gumb za instalaciju kada korisnik već koristi instaliranu aplikaciju.
   - Pruža prilagođene upute korak-po-korak za iOS Safari korisnike (*Dijeli -> Dodaj na početni zaslon*).

---

## 4. Arhitektura Pohrane: Clean Slate + Local-First + Firebase Cloud

Aplikacija koristi **dvostupanjski model pohrane** kojim spaja brzinu lokalne aplikacije s pouzdanošću osobnog oblaka:

```text
[ Korisničko Sučelje (React Komponente) ]
                   │
                   ▼
     [ useLogbookStore Hook ]
        ├──► 1. Lokalna Pohrana (localStorage: droneApp_clean_v3_*)
        │       • Trenutno čitanje i pisanje (0 ms latencije)
        │       • Radi potpuno offline na terenu
        │       • Zadano stanje je 100% prazno (Clean Slate)
        │
        └──► 2. Firebase Cloud (kada je korisnik prijavljen Google računom)
                • Real-time onSnapshot pretplate filtrirane po ownerId == user.uid
                • Automatski Cloud backup letova, servisa, profila i učitanih dokumenata
```

---

## 5. Podatkovni Model u Firebase Firestore Bazi

Sve kolekcije nalaze se u korijenu baze i zaštićene su vlasničkim identifikatorom (`uid` / `ownerId`):

- **`/users/{userId}` (`PilotProfile`)**: Osobni profil pilota, oznake (`pilotId`, `operatorId`), aktivni dron (`droneSn`, `droneMake`, `droneModel`), komprimirani avatar i vanjski linkovi.
- **`/flights/{flightId}` (`FlightRecord`)**: Pojedinačni zapis o letu (`ownerId`, `location`, `latitude`, `longitude`, `takeoffTime`, `landingTime`, `durationMin`, `radiusM`, `droneSn`, `checklistCompleted`, `notes`).
- **`/maintenance/{maintId}` (`MaintenanceRecord`)**: Zapis o održavanju drona (`ownerId`, `serviceDate`, `category`, `droneSn`, `description`).
- **`/pilotDocs/{docId}` (`PilotDocument`)**: Trezor učitanih lokalnih datoteka (`license`, `registration`, `insurance`) spremljenih kao optimizirani Data URL do 600 KB uz metapodatke (`fileName`, `mimeType`, `docNumber`, `validUntil`).
- **`/countryRules/{ruleId}` (`CountryRule`)**: Korisničke izmjene ili novododane države spremljene putem ikone olovčice (`✏️`).

---

## 6. Sigurnosni Model (`firestore.rules`)

Sigurnosna pravila u datoteci `firestore.rules` dizajnirana su prema **Zero-Trust** principima:
1. **Default Deny**: Svaka putanja koja nije eksplicitno definirana automatski odbija čitanje i pisanje (`allow read, write: if false;`).
2. **Stroga provjera vlasništva (Multi-Tenancy)**: Korisnik može čitati, mijenjati ili brisati samo one dokumente gdje je `resource.data.ownerId == request.auth.uid`.
3. **Verifikacija e-pošte**: Sva pisanja zahtijevaju `request.auth.token.email_verified == true`.
4. **Strogo ograničenje sheme (`hasOnly`)**: Sprječava ubacivanje neautoriziranih polja (*Shadow Field Injection*).
5. **Validacija tipova i veličina**: Svako polje ima strogo ograničenu duljinu stringa i numerički raspon radi zaštite od *Denial-of-Wallet* napada.
6. **Nepromjenjivost (`Immutability`)**: Prilikom ažuriranja (`update`), polja `ownerId` i `createdAt` ne smiju se mijenjati, a `updatedAt` mora biti jednak `request.time`.
