# 🚁 Drone Logbook Pro

> Google Apps Script PWA aplikacija za evidenciju letova drona, servisa i pravila letenja po državama.

## Glavne značajke (Zašto Drone Logbook PRO?)

- 🗺️ Interaktivna GPS karta: Nema ručnog upisivanja! Odaberi lokaciju na karti sa satelitskim prikazom i aplikacija sama vuče ime mjesta i koordinate.
- ⚡ Brzo inline uređivanje: Mijenjaj podatke o letovima direktno u redu, bez iskakanja dosadnih prozora.
- 📚 Baza zakona s pametnim pretraživanjem: Automatsko popunjavanje pravila za 35+ država na jedan klik.

Za detaljan popis svih nadogradnji, pogledajte [Changelog](CHANGELOG.md).

---

## Brzi linkovi

### Za korisnike
- [UPUTE_INSTALACIJA.md](UPUTE_INSTALACIJA.md) - Kako instalirati aplikaciju
- [UPUTE_KORIŠTENJA.md](UPUTE_KORIŠTENJA.md) - Kako koristiti module
- [RELEASE_NOTES.md](RELEASE_NOTES.md) - Zadnje verzije i sažetak promjena

### Za developere
- [UPUTE_VSC.txt](CLEAN_FILES/UPUTE_VSC.txt) - VSC workflow
- [CHANGELOG.md](CHANGELOG.md) - Povijest promjena po verzijama
- [CLEAN_FILES](CLEAN_FILES) - Distribucijska verzija bez korisničkih podataka

---

## Sadržaj ovog dokumenta

1. [Što je novo](#1-sto-je-novo)
2. [Što aplikacija radi](#2-sto-aplikacija-radi)
3. [Arhitektura i datoteke](#3-arhitektura-i-datoteke)
4. [Baza podataka (Google Sheets)](#4-baza-podataka-google-sheets)
5. [Frontend funkcionalnosti](#5-frontend-funkcionalnosti)
6. [Offline queue i sinkronizacija](#6-offline-queue-i-sinkronizacija)
7. [PWA i full screen](#7-pwa-i-full-screen)
8. [Navigacija tabova](#8-navigacija-tabova)
9. [Profil pilota i localStorage](#9-profil-pilota-i-localstorage)
10. [CLEAN_FILES distribucija](#10-clean_files-distribucija)
11. [Pokretanje i deployment](#11-pokretanje-i-deployment)
12. [Operativni workflow](#12-operativni-workflow)
13. [Najcesci problemi](#13-najcesci-problemi)
14. [Sigurnost i privatnost](#14-sigurnost-i-privatnost)
15. [Brzi admin checklist](#15-brzi-admin-checklist)

## 1. Sto je novo

### 🆕 2026-04-14 - Velika Ažuriranja!

**Automatizacija i Dokumentacija:**
- ✅ **Automation Script** (`sync-clean-files.ps1`) - Automatski prebacuje i sanitizira datoteke iz root u CLEAN_FILES
- ✅ **Nove Upute za Kupce** - Kreiran `UPUTE_INSTALACIJA.md` i `UPUTE_KORIŠTENJA.md` s detaljnim primjerima
- ✅ **Sanitizacija Podataka** - CLEAN_FILES sada ima sve user podatke resetovane na default vrijednosti
- ✅ **Manifest i PWA Icone** - Zamijenjeni Google Drive linkovi s čistim SVG data URI-jima
- ✅ **Improved README** - Jasnija struktura za kupce i developere

**Kako Koristiti Automation:**
```powershell
# Iz root direktorija:
powershell -ExecutionPolicy Bypass -File .\sync-clean-files.ps1
```

---

### Legacy Changes (Prethodne Verzije)

- Uklonjeni hardkodirani osobni podaci iz UI-a.
- Dodan je Settings/Profile modal (unos imena, ID-eva, slike i dokumenata).
- Profil se sprema u localStorage pod kljucem pilotProfile.
- Profilna slika se ucitava kroz file input i sprema kao komprimirani Base64 (canvas resize, JPEG 0.7).
- Dodana PWA priprema (manifest + mobile web app meta tagovi).
- Back/device back logika je trenutno namjerno ugasena radi stabilnosti u Apps Script iframe runtimeu.

## 2. Sto aplikacija radi

Aplikacija ima 4 glavna modula:

1. NOVI LET
2. SERVIS
3. LOG
4. PRAVILA

Backend je Google Apps Script, a podaci su u Google Sheetsu.

## 3. Arhitektura i datoteke

Kljuce datoteke:

- Code.js - backend logika (Sheets CRUD, seed, helperi)
- Index.html - glavni UI i modalni elementi
- JS.html - frontend logika, localStorage, offline queue
- CSS.html - tamna tema i stilovi modala
- manifest.json - PWA manifest
- appsscript.json - GAS manifest/deploy postavke

Tok rada:

- Frontend zove backend kroz google.script.run.
- Offline zapisi idu u offlineQueue u localStorage.
- Profil pilota je u pilotProfile kljucu.

## 4. Baza podataka (Google Sheets)

Aplikacija osigurava postojanje sheetova:

- Letovi
- Odrzavanje
- PravilaZemalja

### 4.1 Letovi kolone

- Timestamp
- Proizvodac
- Model
- S/N Drona
- Lokacija
- Polijetanje
- Slijetanje
- Trajanje (min)
- Znacajni dogadaji

### 4.2 Odrzavanje kolone

- Timestamp
- Datum
- Opis popravka/izmjene

### 4.3 PravilaZemalja kolone

- Drzava
- Regulator
- EASA_Vrijedi
- MaxVisina
- Osiguranje
- LinkApp
- Zabranjeno
- Biljeska
- Upute

## 5. Frontend funkcionalnosti

NOVI LET:

- unos lokacije i vremena
- auto-izracun trajanja
- checklista prije spremanja

SERVIS:

- unos datuma i opisa
- pregled povijesti

LOG:

- prikaz zadnjih letova

PRAVILA:

- pretraga drzava
- prikaz detalja pravila
- forma za dodavanje/azuriranje
- admin seed

## 6. Offline queue i sinkronizacija

- Ako nema interneta, letovi/servisi idu u offlineQueue.
- Na online event i pri DOMContentLoaded pokusava se sinkronizacija.
- Ako sync padne, red ostaje spremljen za sljedeci pokusaj.

## 7. PWA i full screen

U Index.html su dodani mobile/PWA meta tagovi:

- apple-mobile-web-app-capable
- mobile-web-app-capable
- apple-mobile-web-app-status-bar-style
- theme-color

Manifest identitet:

- Name: Drone Logbook Pro
- Display: standalone
- Theme/background: tamna tema

## 8. Navigacija tabova

- Tabovi se trenutno mijenjaju klikom na UI gumbe.
- Back/device back mehanizam je privremeno iskljucen radi stabilnosti.

## 9. Profil pilota i localStorage

UI elementi se pune preko DOM id-jeva:

- ime pilota
- pilot ID
- operater ID
- profilna slika
- dokument linkovi (dozvola, registracija, osiguranje)

Ponasanje:

- pilotProfile se ucitava na DOMContentLoaded.
- Ako nema profila, koristi se default iz JS varijante projekta.
- Klik na "Uredi profil" otvara modal.
- Submit forme sprema profil i odmah osvjezava DOM.

## 10. CLEAN_FILES distribucija

- CLEAN_FILES je pripremljen kao zaseban distribucijski paket.
- Ima vlastiti .clasp.json i .claspignore.
- Push iz CLEAN_FILES salje samo Apps Script datoteke (bez txt/docs pomocnih fajlova).

### 📦 Automatska Sanitizacija - sync-clean-files.ps1

Novi PowerShell script **`sync-clean-files.ps1`** automatski:

1. **Prebacuje datoteke iz root u CLEAN_FILES:**
   - appsscript.json
   - Code.js → Code.gs
   - CSS.html
   - Index.html
   - JS.html
   - manifest.json
   - README.md (opciono)

2. **Sanitizira sve user podatke:**
   - `DEFAULT_DRONE_SN` → `''` (prazno)
   - `DEFAULT_PILOT_PROFILE.pilotId` → `'#'`
   - `DEFAULT_PILOT_PROFILE.operatorId` → `'#'`
   - Svi dokumentalni linkovi → `''` (Google Drive → prazno)
   - Profilne slike → SVG data URIs (bez Google Drive URL-a)
   - manifest.json icon → SVG data URI

3. **Osigurava PWA kompatibilnost:**
   - Dodaje manifest.json link ako nedostaje
   - Zamjenjuje sve Google Drive ikone s čistim SVG-ima

**Kako Koristiti:**
```powershell
cd "C:\Users\zrina\Desktop\APLIKACIJE\Drone Logbook App"
powershell -ExecutionPolicy Bypass -File .\sync-clean-files.ps1
```

**Rezultat:**
- CLEAN_FILES će biti updated s verzijom bez user podataka
- Spreman za distribuciju kupcima bez privremenih podataka
- Korisnici će unijeti svoje podatke kroz "Uredi profil" nakon instalacije

## 11. Pokretanje i deployment

### PreDeploy - Sanitizacija za Distribuciju

**Prije svakog pusha u CLEAN_FILES:**

1. Ažuriraj root datoteke s novim feature-ima/fixima
2. Pokreni automation script:
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\sync-clean-files.ps1
   ```
3. Provjeri CLEAN_FILES je li sve sanitizirano (bez user podataka)
4. Tek tada pokreni push:
   ```powershell
   cd CLEAN_FILES
   clasp push
   ```

### Preduvjeti

- Google racun
- Node.js + npm
- clasp

### Lokalno Razvijanje:

1. npm install -g @google/clasp
2. clasp login
3. clasp clone <SCRIPT_ID> ili rad iz postojeceg foldera
4. Uredi kod
5. clasp push

### Deploy Web App:

1. Apps Script -> Deploy -> Manage deployments
2. Edit postojeci deployment ili novi
3. Potvrdi dozvole i uzmi URL

### Push Strategija:

- **Root folder** - Za razvoj i testiranje s full user podacima
- **CLEAN_FILES folder** - Za distribuciju kupcima (bez korisničkih podataka)

## 12. Operativni workflow

### Za Kupce:
1. Čitaj **[UPUTE_INSTALACIJA.md](UPUTE_INSTALACIJA.md)** - Kako instalirati
2. Čitaj **[UPUTE_KORIŠTENJA.md](UPUTE_KORIŠTENJA.md)** - Kako koristiti app
3. Pogledaj **[video upute](https://youtu.be/D051Ty762LI)** - Vizualni guide

### Za Administratora / Operatera:
1. Otvori app i provjeri profil (Uredi profil).
2. Upiši S/N drona u header.
3. U NOVI LET popuni let i spremi.
4. U LOG provjeri zapis.
5. U SERVIS vodi intervencije.
6. U PRAVILA provjeri drzavu prije leta.

### Za Developera - Release Process:
1. Ažuriraj kod u root folder
2. Testiraj na root deployment
3. Pokreni `sync-clean-files.ps1` da sanitiziraš CLEAN_FILES
4. Provjeri CLEAN_FILES je li everything OK
5. Push iz CLEAN_FILES u production
6. Update RELEASE_NOTES.md s novim verzijom

## 13. Najcesci problemi

1. saveNewCountry greska nakon izmjena:
  - obicno syntax greska ranije u Code.js.
2. Pravila se ne ucitavaju:
  - provjeri sheet PravilaZemalja i nazive kolona.
3. Offline zapisi ne odlaze:
  - provjeri mrezu i ponovno otvori app online.
4. Profil se ne prikazuje kako treba:
  - ocisti pilotProfile iz browser localStorage i spremi ponovno.

## 14. Sigurnost i privatnost

- Podaci zavrsavaju u Google Sheetu vlasnika deploymenta.
- Profil podaci ostaju lokalno u browseru (localStorage).
- Ako app nije javna, preporuceno je ograniciti pristup deploymentu.

## 15. Brzi admin checklist

### Prije Svakog Release-a:

- [ ] Ažuriraj `RELEASE_NOTES.md` s novom verzijom
- [ ] Testiraj u root deploymenta
- [ ] Provjeri syntax u Code.js, Index.html, JS.html, CSS.html
- [ ] Pokreni `clasp push` iz root foldera
- [ ] Osvježi web app i testiraj sve funkcije:
  - [ ] NOVI LET - Zabilježi test let
  - [ ] SERVIS - Dodaj test servis
  - [ ] LOG - Provjeri test zapis
  - [ ] PRAVILA - Testira seed i dodavanje nove zemlje
  - [ ] Profil - Uredi profil test

### Prije Distribucije Kupcima:

- [ ] Pokreni: `powershell -ExecutionPolicy Bypass -File .\sync-clean-files.ps1`
- [ ] Provjeri CLEAN_FILES je li sve sanitizirano:
  - [ ] DEFAULT_DRONE_SN je prazno
  - [ ] DEFAULT_PILOT_PROFILE ima '#' i prazne stringove
  - [ ] Nema Google Drive linkova
  - [ ] SVG ikone su korištene umjesto Google Drive linkovau
  - [ ] manifest.json je prisutan
- [ ] Testiraj CLEAN_FILES deployment
- [ ] `clasp push` iz CLEAN_FILES foldera
- [ ] Pošalji kupcima novi URL ili osvježi postojeći

### Quick Health Check:
```powershell
# Testiraj DRY CHECK:
clasp status  # Root
cd CLEAN_FILES
clasp status  # CLEAN_FILES
```

---

**Aplikacija je spremna za distribuciju!** ✅
