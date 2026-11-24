# Projektstatus TŌMEI

**Stand: 24.11.2026 · Version 2.0.0-alpha.2 (erster Entwurf) · Zweig `tomei-2.0` · nicht deployt**

Die Webseite unter https://v6fdb8msrw-dotcom.github.io/tomei/ zeigt weiterhin den alten Stand 1.x. Dieser Stand ist nur lokal geprüft (Preview-Server). Deploy erst nach Tims ausdrücklichem Ja.

## Kurzfassung

TŌMEI ist jetzt in drei verbundene Welten gegliedert:

- **DISCOVER** `#/discover` – Fahrzeugsuche, Auktionshäuser (Verzeichnis), Import-Partner, Importrechner 2.0, Import-Journey, Service (in Vorbereitung)
- **DRIVE** `#/drive` – Roads (15 Straßen), Straßen-Detailseiten, Roadtrip-Builder mit GPX, Automotive Atlas (18 Länder), Mieten
- **OWN** `#/own` – Garage, Ownership-Simulator, Build Studio, Wartungsplaner, Automotive Passport

Alle Welten teilen einen lokalen, versionierten Datenspeicher. Beispiele für Verbindungen:

- Dream Car auf der Startseite → Fahrzeug in der Garage (Status „Traum“)
- Merkliste in der Fahrzeugsuche → Fahrzeug „Beobachtet“ → „Durchrechnen“ → Importrechner
- Importrechner → Szenario am Fahrzeug speichern → Status „Geplant“ → Unterhalt simulieren
- Import-Journey „Kaufen“ → Status „Im Import“; „Angekommen“ → „In Besitz“ + Passport-Eintrag
- Straße → Roadtrip → Fahrzeug wählen → Fahrt im Passport
- Wartung erledigt / Umbau verbaut → Passport-Eintrag

## Geprüft

| Prüfung | Ergebnis |
|---|---|
| `npx tsc -b` | ohne Fehler |
| `npm test` (Vitest) | 20 Tests grün: Rechnung, Szenarien, GPX lesen/schreiben, Speicher (Migration, alte Merkliste, Sicherung, Zusammenführen, unsichere Links), Wartung, Unterhalt, ICS |
| `npm run build` | erfolgreich; Hauptbündel ~469 KB (vorher ~590 KB): alle Seiten außer der Startseite werden erst bei Bedarf geladen |
| `npm run lint` (oxlint) | nur Warnungen (Fast-Refresh-Hinweise), keine Fehler |
| Browser Desktop 1440×900 | Startseite (alle 9 Sektionen), alle Welt-Seiten, Detailseiten, 404 geprüft; keine Konsolenfehler außer bekannten Abbrüchen von View-Transitions (abgefangen) |
| Browser Mobil 375×812 | alle Routen ohne seitlichen Überlauf, Unternavigation scrollt zum aktiven Punkt |
| Sprache | alle Seiten auf Deutsch und Englisch durchgeschaltet (Desktop), `<html lang>` zieht mit |
| Abläufe | Traum merken → Garage; Rechner → Worst Case speichern → Garage; Straße → Roadtrip → Builder; Sprache DE/EN; alte Links (`#/markets`, `#/import/rechner`, `#/spots`, `#/parts`) leiten weiter |

Nicht geprüft: Safari/Firefox (nur Chromium im Preview), echte GPX-Dateien aus Navis (nur Testdaten), Druckansicht des Passports auf Papier, Screenreader.

## Audit des Stands 1.x (vor dem Umbau)

- Sieben Reiter ohne gemeinsames Datenmodell; einzige Verbindung war die Merkliste → Rechner.
- `CARS` im Rechner waren Beispielpreise ohne Kennzeichnung → jetzt als „Beispielautos“ markiert.
- TŌMEI Service versprach eine Leistung, die es noch nicht gibt → jetzt „In Vorbereitung“.
- Anbieter-Logos kamen von Googles Favicon-Dienst (Besucher-IPs an Google) → durch Monogramme ersetzt.
- Ziel-Gebühren im Rechner (Zollabwicklung, TÜV, Zulassung …) sind Schätzwerte → in Atlas und Startseite als „Schätzwert“ gekennzeichnet; Quellenlage siehe `DATA_SOURCES.md`.
- Keine Tests, keine Fehlergrenze, keine 404-Seite, kein Export/Löschen der lokalen Daten → alles ergänzt.

## Datenintegrität

- Keine erfundenen Inserate, Preise, Anbieter, Bewertungen, Routen oder Live-Daten.
- Demo-Daten sind gekennzeichnet: Beispielautos im Rechner, Beispiel-Zeitleiste auf der Startseite (nur solange der Passport leer ist), „Beispielwerte laden“ im Simulator.
- Annahmen sind gekennzeichnet: Kursschwankung (Standard ±5 %) und Reserve im Worst Case (Standard 10 %) im Importrechner 2.0, jederzeit änderbar.
- Straßen: Fakten aus der englischen Wikipedia (abgerufen 24.11.2026), Wegpunkte sind Orte an der Strecke, keine gezeichnete Linienführung.

## Technik

- React 19, TypeScript 7, Vite 8, Motion, Lucide; neu: d3-geo, topojson-client, world-atlas (Globus), Vitest, Fontsource (Manrope, Inter).
- Speicher: `localStorage`-Schlüssel `tomei.store`, Format-Version 1, alte Merkliste `tomei.finds` wird beim ersten Start übernommen (bleibt liegen).
- Externe Anfragen zur Laufzeit: nur der EZB-Kurs über `api.frankfurter.dev` (ohne Schlüssel, ohne Cookies). Alle Fotos liegen im Repo.
- Branding: `src/config/brand.ts` (Name, Claim, Speicher-Präfix, Titel der `index.html`).

## Erster Entwurf (alpha.2)

- **Englisch** für alle Werkzeuge: Oberfläche, Beschriftungen, Hinweise, Leer- und Fehlerzustände. Texte stehen als Paar direkt im Werkzeug (`tx('Deutsch', 'English')`), gemeinsame Texte in `src/i18n/i18n.ts`.
- **Datenschutz** (`#/privacy`) und **Impressum** (`#/imprint`) als Entwurf, im Footer verlinkt. Der Datenschutztext beschreibt nur, was die Seite technisch tut (GitHub Pages, lokaler Speicher, EZB-Kurs über frankfurter.dev, keine Cookies). Die Angaben zum Betreiber stehen leer in `BRAND.operator` (`src/config/brand.ts`); solange sie fehlen, zeigt die Seite einen roten Platzhalter und einen Entwurfs-Hinweis.
- **Kleineres Hauptbündel:** alle Seiten außer der Startseite werden nachgeladen.
- Behoben: Die Passport-Vorschau auf der Startseite zeigte bei echten Einträgen die interne Art (z. B. „service“) statt „Wartung“.
- Behoben: Die 3D-Routenkarte der Fahrzeugsuche stand bei 1024 px Breite seitlich über.

## Offene Punkte

1. **Englisch, Datentexte:** Beschreibungen aus `src/data.ts` und `src/classics.ts` (Portale, Auktionshäuser, Agenten, Vermieter, Teile-Shops, Spots, Klassiker, Hinweise der Zielländer) sind noch deutsch; Straßen und Länder sind schon zweisprachig.
2. **Impressum/Datenschutz:** Name, Anschrift und öffentliche E-Mail von Tim in `BRAND.operator` eintragen, Texte rechtlich prüfen lassen. Ohne das kein öffentlicher Release.
3. **Bundle-Größe** (~469 KB): Motion und React bilden den Großteil; weiteres Aufteilen bringt wenig.
4. **Ziel-Gebühren im Rechner** (DEST in `src/data.ts`) sind Schätzwerte ohne Einzelquelle; nach Quellen ersetzen oder deutlicher kennzeichnen.
5. **Service** ist nur eine Anfrage-Vorlage; `CONTACT_EMAIL` bleibt leer, bis Tim eine öffentliche Adresse nennt.
6. **Karte mit Kacheln** im Builder nur nach Tims OK (neuer externer Dienst).
7. **Dasai-Mochi-Bereich** (Build Studio, aus 1.x): zeigt eine mit CSS gezeichnete Nachbildung eines Produkts. Nach der Regel „nur echte Fotos“ durch ein lizenziertes Foto ersetzen oder entfernen (Tims Entscheidung).

Roadmap: `ROADMAP.md` · Quellen: `DATA_SOURCES.md` · Bildrechte: `ASSET_LICENSES.md` · Bibliotheken: `THIRD_PARTY_NOTICES.md` · Release: `RELEASE_CHECKLIST.md`
