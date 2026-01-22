# Bike Rental (Expo Go) — lokalno (bez backenda)

Mobilna aplikacija (React Native + Expo) za iznajmljivanje bicikala **bez baze i bez backenda** — svi podaci se čuvaju lokalno (AsyncStorage + lokalno čuvanje fotografija).

## Funkcionalnosti (korisnik)
- Registracija / prijava
- Izmena profila i promena lozinke
- Mapa sa biciklima + parking zone (krugovi)
- Detalji bicikla (tip, cena, status, najbliža parking zona)
- Pokretanje iznajmljivanja skeniranjem QR koda (ili ručni unos koda)
- Pregled aktivnog iznajmljivanja (trajanje + trenutna cena)
- Završetak iznajmljivanja (provera parking zone + obavezna fotografija)
- Istorija iznajmljivanja + detalji (sa fotografijom vraćanja)
- Obaveštenja u aplikaciji (početak / završetak / prijava problema)
- Prijava problema sa biciklom (opis + fotografija)

## Pokretanje (Expo Go)
**Preduslovi:** Node.js LTS, instalirana Expo Go aplikacija na telefonu.

1) Raspakuj ZIP i uđi u folder projekta:
```bash
cd bike-rental
```

2) Instaliraj zavisnosti:
```bash
npm install
```

3) Pokreni razvojni server:
```bash
npx expo start
```

4) Otvori Expo Go na telefonu i skeniraj QR kod iz terminala / browsera.

## Test bez pravog QR koda
Na ekranu **Skeniraj QR** postoji ručni unos. Unesi, na primer:
- `bike:bike_1`
- `bike_2`

Bicikli i parking zone su seedovani lokalno (Beograd).

## Napomene
- Završetak iznajmljivanja zahteva lokaciju (provera parking zone). Ako lokacija nije dozvoljena, aplikacija će tražiti da je uključiš.
- Fotografije se čuvaju lokalno u `FileSystem.documentDirectory/photos/`.
