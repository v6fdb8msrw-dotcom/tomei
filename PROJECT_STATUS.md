# Projektstatus TŌMEI

**Stand: 24.11.2026 · Version 2.0.0-alpha.1 · Zweig `tomei-2.0` · nicht deployt**

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
| `npm run build` | erfolgreich; Hinweis: Hauptbündel ~590 KB (Globus, Builder, Simulator, Build Studio, Wartung, Passport schon ausgelagert) |
| `npm run lint` (oxlint) | nur Warnungen (Fast-Refresh-Hinweise), keine Fehler |
| Browser Desktop 1440×900 | Startseite (alle 9 Sektionen), alle Welt-Seiten, Detailseiten, 404 geprüft; keine Konsolenfehler außer bekannten Abbrüchen von View-Transitions (abgefangen) |
| Browser Mobil 375×812 | alle Routen ohne seitlichen Überlauf, Unternavigation scrollt zum aktiven Punkt |
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

## Offene Punkte

1. **Englisch** deckt Navigation, Startseite, Übersichten und Zustände ab; Werkzeugtexte sind noch deutsch.
2. **Impressum/Datenschutz** fehlen; vor einem öffentlichen Release nötig (Inhalt von Tim).
3. **Bundle-Größe** (~590 KB): weiteres Code-Splitting.
4. **Ziel-Gebühren im Rechner** (DEST in `src/data.ts`) sind Schätzwerte ohne Einzelquelle; nach Quellen ersetzen oder deutlicher kennzeichnen.
5. **Service** ist nur eine Anfrage-Vorlage; `CONTACT_EMAIL` bleibt leer, bis Tim eine öffentliche Adresse nennt.
6. **Karte mit Kacheln** im Builder nur nach Tims OK (neuer externer Dienst).

Roadmap: `ROADMAP.md` · Quellen: `DATA_SOURCES.md` · Bildrechte: `ASSET_LICENSES.md` · Bibliotheken: `THIRD_PARTY_NOTICES.md` · Release: `RELEASE_CHECKLIST.md`
