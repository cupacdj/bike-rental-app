# Bike Rental Admin Panel

Admin web aplikacija za upravljanje sistemom za iznajmljivanje bicikala.

## Funkcionalnosti

- 🔐 **Prijava administratora** - Sigurna autentifikacija sa administratorskim privilegijama
- 🚲 **Upravljanje biciklima** - Dodavanje, izmena, brisanje i promena statusa bicikala
- 📋 **Pregled iznajmljivanja** - Lista svih iznajmljivanja sa detaljima i fotografijama
- ⚠️ **Obrada prijava problema** - Pregled i rešavanje prijava korisnika
- 📊 **Kontrolna tabla** - Statistika i brzi pregled stanja sistema
- 🔄 **Sinhronizacija** - Automatska sinhronizacija sa mobilnom aplikacijom

## Tehnologije

- **Frontend**: React 18, Framer Motion, Recharts, Lucide Icons
- **Backend**: Express.js, Node.js
- **Storage**: Lokalni JSON fajlovi (bez baze podataka)

## Instalacija

### 1. Instalacija zavisnosti

```bash
cd admin-web
npm run install:all
```

### 2. Pokretanje servera (development)

```bash
npm run dev
```

Ovo će pokrenuti:
- Express server na `http://localhost:5000`
- React aplikaciju na `http://localhost:3000`

### Ili pojedinačno:

```bash
# Samo server
npm run server:dev

# Samo client
npm run client
```

## Pristupni podaci

Podrazumevani admin nalog:

| Polje | Vrednost |
|-------|----------|
| Korisničko ime | `admin` |
| Lozinka | `admin123` |

## Sinhronizacija sa mobilnom aplikacijom

Da bi mobilna aplikacija komunicirala sa serverom:

1. Pronađite IP adresu vašeg računara
2. U mobilnoj aplikaciji, idite na **Podešavanja > Sinhronizacija**
3. Unesite URL servera: `http://<vaša-ip-adresa>:5000`

## API Endpoints

### Autentifikacija
- `POST /api/admin/login` - Prijava administratora

### Bicikli
- `GET /api/admin/bikes` - Lista svih bicikala
- `GET /api/admin/bikes/:id` - Detalji bicikla
- `POST /api/admin/bikes` - Dodaj novi bicikl
- `PUT /api/admin/bikes/:id` - Izmeni bicikl
- `PATCH /api/admin/bikes/:id/status` - Promeni status bicikla
- `DELETE /api/admin/bikes/:id` - Obriši bicikl

### Iznajmljivanja
- `GET /api/admin/rentals` - Lista svih iznajmljivanja
- `GET /api/admin/rentals/:id` - Detalji iznajmljivanja

### Prijave problema
- `GET /api/admin/issues` - Lista svih prijava
- `GET /api/admin/issues/:id` - Detalji prijave
- `PUT /api/admin/issues/:id` - Ažuriraj prijavu

### Sinhronizacija (za mobilnu app)
- `GET /api/state` - Dobavi stanje aplikacije
- `PUT /api/state` - Ažuriraj stanje aplikacije
- `POST /api/upload` - Upload fotografije

## Struktura projekta

```
admin-web/
├── package.json          # Root package.json
├── tsconfig.server.json  # TypeScript config for server
├── server/
│   ├── index.ts          # Express server (TypeScript)
│   ├── data/             # Lokalni JSON storage
│   │   ├── state.json    # Stanje aplikacije
│   │   └── admins.json   # Admin nalozi
│   └── uploads/          # Uploadovane fotografije
└── client/
    ├── package.json      # React dependencies
    ├── tailwind.config.js # Tailwind CSS configuration
    ├── postcss.config.js  # PostCSS configuration
    ├── tsconfig.json      # TypeScript config for client
    ├── public/
    └── src/
        ├── App.tsx
        ├── index.tsx
        ├── index.css
        ├── types/
        │   └── index.ts
        ├── components/
        │   └── Layout.tsx
        ├── context/
        │   ├── AuthContext.tsx
        │   └── ToastContext.tsx
        ├── pages/
        │   ├── Login.tsx
        │   ├── Dashboard.tsx
        │   ├── Bikes.tsx
        │   ├── Rentals.tsx
        │   └── Issues.tsx
        └── services/
            └── api.ts
```

## Napomene

- Svi podaci se čuvaju lokalno u JSON fajlovima
- Server automatski kreira početne podatke pri prvom pokretanju
- Fotografije se čuvaju u `server/uploads/` direktorijumu
- Za produkciju, pokrenite `npm run client:build` i server će servirati build fajlove

## Licence

MIT
