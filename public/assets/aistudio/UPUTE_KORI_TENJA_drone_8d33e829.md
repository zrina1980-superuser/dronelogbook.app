# 🚁 Drone Logbook Pro - Upute za Korištenje

Detaljne upute kako koristiti svaki modul aplikacije.

---

## 📑 Sadržaj

1. [Glavna Navigacija](#glavna-navigacija)
2. [Modul: NOVI LET](#modul-novi-let)
3. [Modul: SERVIS](#modul-servis)
4. [Modul: LOG](#modul-log)
5. [Modul: PRAVILA](#modul-pravila)
6. [Uredi Profil](#uredi-profil)
7. [Offline Red (Sinkronizacija)](#offline-red-sinkronizacija)
8. [Česti Zadaci](#česti-zadaci)

---

## 🎨 Glavna Navigacija

Na vrhu aplikacije vidjet ćeš:

```
👤 [Ime Pilota] ⚙️ [Uredi profil]  ?
🎪 [NOVI LET] [SERVIS] [LOG] [PRAVILA]
```

- **Pilot card** - Prikazuje tvoj profil i linkove na dokumente
- **Tabu gumbi** - Klikni za prebacivanje između modula
- **⚙️ Uredi profil** - Promijeni podatke
- **?** - Odricanje od odgovornosti

---

## ✈️ MODUL: NOVI LET

### Zašto?
Zabilježi novi let drona s lokacijom, vremenom i napomenama.

### Kako?

1. **Klikni tab "NOVI LET"** (prikazuje se po defaultu)

2. **Ispuni lokaciju polijetanja**
   ```
   Lokacija polijetanja: [Unesi adrešu ili koordinate]
   ```
   - Primjer: `Jarun, Zagreb`
   - Primjer: `45.8232, 15.9729`
   - Ili klikni:
     - 📍 **KLIKNI ZA GPS LOKACIJU** - Aplikacija će koristiti tvoj trenutni GPS
     - 🗺️ **ODABERI NA KARTI** - Klikni na kartu da odabereš lokaciju

3. **Postavi Radius Leta (Optional)**
   ```
   Radius leta: [Klizi slider]
   ```
   - Min: 100 m
   - Default: 500 m
   - Max: 2000 m
   - **Što je ovo?** Maksimalna udaljenost od polijetanja na koju će letjeti dron
   - Sprema se u dnevnik letenja

4. **Unesi Vrijeme Polijetanja**
   ```
   Polijetanje: [Klikni za odabir datuma i vremena]
   ```
   - Primjer: `14.04.2026  10:30`
   - Koristi lokalno vrijeme

5. **Unesi Vrijeme Slijetanja**
   ```
   Slijetanje: [Klikni za odabir datuma i vremena]
   ```
   - Primjer: `14.04.2026  10:45`
   - **Trajanje će se izračunati automatski** (15 min)

6. **Dodaj Napomene (Optional)**
   ```
   Napomene / Događaji: [Upiši bilješke]
   ```
   - Primjer: `sve OK, slik dane gradnje`
   - Primjer: `jak južni vjetar, upozorenje aplikacije na kraju`

7. **Potvrdi Checklista**
   ```
   ☑ CHECKLISTA OBAVLJENA ✅
   ```
   - **OBAVEZNO** makni checkbox - potvrđuješ da si obavio sve:
     - Vizualna provjera oštećenja propelera i motora
     - Status i temperatura baterije
     - Umetnuta SD kartica
     - Kalibracija kompasa
     - Dovoljan broj GPS satelita
     - Procjena vremenskih uvjeta

8. **Klikni "SPREMI U DNEVNIK"**
   - Ako si **online**: Let se sprema odmah u Google Sheet
   - Ako si **offline**: Let ide u red čekanja, automatski se sinhronizira kad se vratiš online

### 🗺️ Kako Koristiti Kartu?

**Klikni "🗺️ ODABERI NA KARTI":**

1. Otvorit će se karta s markerom na sredini
2. **Klikni na kartu** gdje se nalazi lokacija polijetanja
3. Ili **povuci marker** na željenu lokaciju
4. Na dnu vidiš koordinate i naziv mjesta
5. Klikni **"Spremi"** - lokacija se popuni automatski

### 💡 Primjer Unosa

```
Lokacija: Jarun, Zagreb
Radius: 600 m
Polijetanje: 14.04.2026, 10:30
Slijetanje: 14.04.2026, 10:50
Trajanje: 20 min
Napomene: Slike za dokumentaciju gradnje, sve OK
✓ Checklista obavljena
```

---

## 🔧 MODUL: SERVIS

### Zašto?
Zabilježi održavanje, popravke i izmjene na dronu.

### Kako?

1. **Klikni tab "SERVIS"**

2. **Unesi Datum Servisa**
   ```
   Datum: [Klikni za odabir datuma]
   ```
   - Primjer: `14.04.2026`

3. **Napiši Opis Radova**
   ```
   Opis radova: [Upiši što si napravio]
   ```
   - Primjer: `Zamjena dotrajalog propelera DJI 3`
   - Primjer: `Ažuriranje firmware-a na verziju 3.15`
   - Primjer: `Isciljavač za vodu nakon pada u jezero`

4. **Klikni "ZAPIŠI SERVIS"**

### 📋 Primjeri Zapisa

- `Zamjena baterije - HB2S (2250mAh) zbog pada napona ispod 3.6V`
- `Kalibracija kompasa nakon transporta van zemlje`
- `Montaža ND64 filtera za bolju ekpoziciju kod sunca`
- `Čišćenje kamera - uklanjanje prašine`

### 📊 Pregled Servisa

Ispod forme vidjet ćeš tablicu **"Povijest servisa"** sa svim zapisanim serviserima.

Svaki red ima:
- **Datum** - Kada je servis obavljen
- **Opis** - Što je napravljeno
- **Akcije** - 🗑️ Obriši ili ✏️ Uredi (ako postoji)

---

## 📊 MODUL: LOG

### Zašto?
Pregled svih letova s mogućnosti uređivanja i brisanja.

### Kako?

1. **Klikni tab "LOG"**

2. **Pregled Svih Letova**
   - Tablica prikazuje sve zapisane letove
   - Sortira se po datumu (najnoviji prvi)

3. **Kolone u LOG Tablici**
   
   | Kolona | Što značи |
   |--------|----------|
   | **Polijetanje** | Datum i vrijeme polijetanja |
   | **Slijetanje** | Datum i vrijeme slijetanja |
   | **Lokacija** | Gdje je dron letio |
   | **Radius** | Maksimalna udaljenost od startne točke |
   | **Min** | Trajanje leta u minutama |
   | **Akcije** | 🗑️ Obriši ili ✏️ Uredi |

4. **Uređivanje Existirajućeg Leta**
   - Klikni **"✏️ Uredi"** u redu koji trebaš promijeniti
   - Formazt će se učitati s postojećim podacima
   - Promijeni što trebai
   - Klikni **"Spremi Izmjene"** (gumb će promijeniti naziv)

5. **Brisanje Leta**
   - Klikni **"🗑️ Obriši"** u redu
   - Aplikacija će te pitati za potvrdu
   - Klikni **"Obriši"**

### 💾 Gdje su Podaci?

Svi letovi se sprema u **Google Sheet > tablica "Letovi"** s ovim stupcima:
- Timestamp
- Let #
- Lokacija
- Polijetanje
- Slijetanje
- Trajanje (min)
- Radius (m)
- S/N Drona
- Napomene

---

## 🗺️ MODUL: PRAVILA

### Zašto?
Provjeri pravila letenja za svaku državu, poreza, osiguranja i特특no dozvole.

### Kako?

#### 1️⃣ Pretraga Pravila za Državu

1. **Klikni tab "PRAVILA"**

2. **Unesi Naziv Zemlje**
   ```
   [Pretraži holdingtorij:]  🔎 Upiši državu
   ```
   - Primjer: `Hrvatska`
   - Primjer: `Portugal`
   - Primjer: `Italija`

3. **Odaberi iz Dropdown-a**
   - Dok tipkaš, vidjet će se lista dostupnih zemalja
   - Klikni na željenu državu

4. **Provjeri Podatke**
   - Kartice će se automatski popuniti s informacijama:

   | Polje | Što Znači |
   |-------|-----------|
   | **Regulator** | Organizacija koja regulira letnje (npr. HACZ) |
   | **EASA** | Slijedi li EASA standarde (Da/Ne) |
   | **Max visina** | Maksimalna dozvljena visina |
   | **Osiguranje** | Je li osiguranje obavezno |
   | **Aplikacija** | Link na službeni portal |
   | **Zabranjeno** | Što je zabranjeno |
   | **Bilješka** | Dodatne napomene |
   | **Detaljne upute** | Korak po korak upute |

#### 2️⃣ Dodaj Novu Državu

**Ako države nema u bazi:**

1. **Unesi Naziv** u polje za pretragu
   - Primjer: `Novi Zeland`

2. **Ispuni sve podatke:**

   | Polje | Što Unijeti | Primjer |
   |-------|-----------|---------|
   | **Ime države** | Naziv | Novi Zeland |
   | **Regulator** | Regulatorna bodova | CAA |
   | **EASA** | Da / Ne | Ne (lokalno) |
   | **Max visina** | Maksimalna visina | 120 m |
   | **Osiguranje** | Obavezno / Ne | Obavezno |
   | **Službeni portal / app** | Link | https://caanz.org/ |
   | **Zabranjene zone** | Gdje se ne može letiti | Blizu aerodroma, gradskih centara |
   | **Bilješka** | Dodatne info | Potrebna posebna dozvola za komercijalne letove |
   | **Detaljne upute** | Korak po korak | 1. Registriraj se na CAA web-u... 2. Pročitaj lokalnu regulativu... |

3. **Klikni "SPREMI U BAZU"**

### 📌 Primjer - Hrvatska

```
Država: Hrvatska
Regulator: HACZ (Hrvatska Agencija za Civilnu Zrakoplovu)
EASA: Da
Max visina: 120 m (ili 400 ft)
Osiguranje: Obavezno
Aplikacija: https://www.hacz.hr/
Zabranjeno: Blizu aerodroma, nad ljudima, bez dozvole, noću
Bilješka: Pilot mora biti registriran i imati licencu. Droni preko 250g moraju biti registrirani.
Detaljne upute:
1. Prijavi se na HACZ web portal
2. Kreiraj konto i unesi podatke
3. Učitaj dokaze o osiguranju
4. Čekaj odobrenje (3-5 radnih dana)
```

---

## 👤 UREDI PROFIL

### Gdje?
Klikni **"⚙️ Uredi profil"** na vrhu screen-a.

### Što se Sprema?

Profil se sprema **lokalno u tvoj browser** (localStorage) - ne u Google račun.

### Kako Ažurirati?

1. **Klikni "⚙️ Uredi profil"**
2. **Promijeni što trebai:**
   - Ime, ID-eve, sliku, linkove
3. **Klikni "Spremi"**

### ⚠️ Važne Napomene

- "Profil se sprema lokalno u tvoj browser (localStorage)"
- Ako obrišeš browser cache - profil će nestati
- **Savjet:** Sačuvaj si sve linkove negdje sigurno!
- Profilna slika se sprema kao komprimirani Base64 (manja veličina)

---

## 🔄 OFFLINE RED (SINKRONIZACIJA)

### Što je Offline?

Ako nemaš internet, aplikacija **krije zapise u lokalnom redu čekanja** (offline queue). Automatski se sinhronizira kada se vratiš online.

### Kako Radi?

1. **Zabilježi let dok si offline**
   - Popuni sve podatke kao normalno
   - Klikni "SPREMI U DNEVNIK"
   - Let se sprema **lokalno** (u browser localStorage)

2. **Vratiš se online**
   - Aplikacija **automatski detektira** internet vezu
   - Počinje sinkronizacija (bez da moraš biti nešto klikati)
   - Zapisi se prikupljaju u redu i šalju na Google Sheet

3. **Što Vidjeti?**
   - Dok se sinkronizira, trebalo bi vidjeti poruku: `🔄 Sinkronizacija u tijeku...`
   - Nakon što je gotovo: `✅ Sinkronizacija uspješna`

### 💡 Savjet

Čak i ako si offline, preporučujem da prije slijetanja drona:
- Provjeriš je li Let sprema u lokalnom redu
- Čim dođeš do interneta, pusti app da se sinkronizira

---

## ❓ ČESTI ZADACI

### Kako Preuzeti Podatke?

1. **Svi podaci su u Google Sheetu**
   - Otvori [Google Drive](https://drive.google.com)
   - Otvori Sheet koji si kopirao
   - Tabu "Letovi", "Odrzavanje", "PravilaZemalja"

2. **Preuzmi kao Excel ili CSV**
   - Ide: **File** → **Download** → **Microsoft Excel (.xlsx)** ili **CSV**

### Kako Obrisati Sve Podatke i Početi Ispočetka?

1. **Otvori Google Sheet**
2. **Za svaku tablicu (Letovi, Odrzavanje, PravilaZemalja):**
   - Odaberi sve redove ispod headera
   - Desni klik → **Obriši redove**
3. **Klikni na "⚙️ Admin: Učitaj početne države"** da kreneš s novom bazom

### Kako Izmijeniti Pravila za Već Dodanu Zemlju?

1. **Idi na tab "PRAVILA"**
2. **Pretraži zemlju**
3. **Klikni "✏️ Uredi"** (ako postoji u listi)
4. **Ili:** Dodaj novu - aplikacija će vidjeti da postoji i ažurirati je

### Kako Vratiti Profil Ako Sam Obrisa Cache?

**Nažalost, profil se brišeMo ako brišeš localStorage.**

**Savjet:**
- Kada popuniš profil prvi put, **slika se skraćuje**
- Čuva se kao comprimirani Base64
- Ako trebaš vratiti:
  1. Ponovno učitaj isto sliku
  2. Ponovno unesi sve linkove
  3. Spremi

---

## 🆘 Trebas Pomoć?

- 📖 Čitaj [**Upute za instalaciju**](UPUTE_INSTALACIJA.md)
- 🎥 Pogledaj [**video upute**](https://youtu.be/D051Ty762LI)
- 💾 Svi podaci su sigurni - sprema se samo na tvoj Google račun

---

**Uživaj u legalnom letenju bez papira!** 🚁 ✈️
