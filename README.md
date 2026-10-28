# TŌMEI — The Japanese Car Experience

Web-App rund um JDM-Autos: Spots in Japan, Vermietung vor Ort, Import nach Deutschland/EU und Tuning-Teile.
Zusammengeführt aus den drei ersten Fassungen (Emergent-Prompt, `tomei-jdm-bridge.jsx`, `jdm-import-rechner.jsx`).

- Vite + React 19 + TypeScript, Animationen mit `motion`, Icons von `lucide-react`
- Farben wie im Original: fast schwarz (#0a0a0b), Rot (#e5322d) als einziger Akzent
- Animationen im Stil von StreetSignal: Bilder blenden über und zoomen langsam, folgen der Maus, Karten neigen sich, Inhalte gleiten beim Scrollen ein

## Starten

```bash
npm install
npm run dev
```

Läuft auf http://localhost:5193. Online stellen: `npm run deploy` (Zweig gh-pages).

## Inhalt

| Reiter | Was |
|---|---|
| Spots | Hero mit 8 wechselnden Spots, Karten mit Kartenlink, Parallax-Band, Links zu den anderen Reitern |
| Rent | 6 Vermieter, Hinweis zu JAF-Übersetzung/IDP |
| Import | 6 Importeure, Garage mit Beispiel-Listings, Landed-Cost-Rechner, Broker-Vergleich |
| Parts | 5 Shops, animiertes Dasai Mochi mit Shop-Link |

**Rechner** (`src/pages/Import.tsx`, Rechnung in `src/lib/calc.ts`): 6 Zielländer (DE, UK, US, AU, CA, NZ) mit Zoll, Steuer und Gebühren, Preis in Yen oder Landeswährung, Tageskurs der EZB (frankfurter.dev) oder eigener Kurs, RoRo/Container, Versicherung an/aus, EU-Japan-Abkommen (0 % Zoll), alle Posten änderbar, Beispiel laden/Zurücksetzen, gestapelter Kostenbalken, Aufschlüsselung mit Zollwert, Multiplikator-Stempel.

## Anpassen

Alle Texte, Links und Bilder stehen in `src/data.ts`. Stellen mit `[REPLACE]` sind für eigene Fotos, Kontakt und Instagram gedacht.
Bildnachweise: `public/images/CREDITS.md`.

## Offene Punkte

- Eigene Fotos/Drohnenvideos statt Unsplash-Symbolbildern (Umihotaru, Tatsumi, Hakone)
- Kontakt-Adresse und Instagram-Profil in `src/data.ts` eintragen
- Broker-Gebühren und Zollsätze sind Schätzwerte, vor Veröffentlichung prüfen
