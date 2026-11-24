# Release-Checkliste

Vor jedem `npm run deploy` von oben nach unten abhaken. **Deploy nur nach Tims ausdrücklichem Ja.**

## Technik

- [ ] `npx tsc -b` ohne Fehler
- [ ] `npm test` grün
- [ ] `npm run lint` ohne Fehler
- [ ] `npm run build` erfolgreich, `dist/index.html` hat den richtigen Titel
- [ ] Preview lokal: Startseite, je eine Seite pro Welt, eine Straßen-Detailseite, 404 (`#/gibtsnicht`)
- [ ] Mobil (375 px): kein seitlicher Überlauf, untere Navigation erreichbar
- [ ] Konsole ohne Fehler
- [ ] Alte Links leiten weiter: `#/markets`, `#/import/rechner`, `#/service/anfrage`, `#/spots`, `#/rent`, `#/parts`
- [ ] Bestehende Daten: Merkliste aus 1.x erscheint nach dem ersten Start in der Garage

## Daten und Inhalte

- [ ] Keine erfundenen Preise, Inserate, Anbieter, Bewertungen oder Routen
- [ ] Demo-Daten sichtbar gekennzeichnet (Beispielautos, Beispiel-Zeitleiste, Beispielwerte)
- [ ] Schätzwerte und Annahmen gekennzeichnet
- [ ] Stand-Daten in `DATA_SOURCES.md` aktuell; Agenten-Gebühren älter als 3 Monate neu prüfen
- [ ] Jedes neue Foto mit Lizenz in `ASSET_LICENSES.md` bzw. `public/images/CREDITS.md`
- [ ] Neue Bibliotheken in `THIRD_PARTY_NOTICES.md`, nur freie Lizenzen

## Recht und Datenschutz

- [ ] Name markenrechtlich geprüft (sonst nur `src/config/brand.ts` ändern)
- [ ] Impressum und Datenschutzerklärung vorhanden (Inhalt von Tim)
- [ ] `CONTACT_EMAIL` leer oder eine öffentliche Adresse, die Tim freigegeben hat – nie die private Adresse
- [ ] Keine Anfragen an Dritte außer frankfurter.dev (Netzwerk-Tab prüfen)
- [ ] Kein Cloudflare, Hosting nur GitHub Pages

## Veröffentlichen

- [ ] Tim hat ausdrücklich Ja gesagt
- [ ] `npm run deploy`
- [ ] https://v6fdb8msrw-dotcom.github.io/tomei/ öffnen und Startseite prüfen
- [ ] `PROJECT_STATUS.md` auf „deployt am …“ setzen
