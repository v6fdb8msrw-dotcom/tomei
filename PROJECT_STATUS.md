# Projektstatus TŌMEI

**Stand: 24.11.2026 · Version 2.0.0-alpha.3 (erster Entwurf, überarbeitet) · Zweig `tomei-2.0` · deployt am 24.11.2026 auf Tims Ja**

Die Webseite unter https://v6fdb8msrw-dotcom.github.io/tomei/ zeigt seit 24.11.2026 diesen Stand (Deploy auf Tims Ja, live geprüft). Impressum und Datenschutz sind noch Entwürfe mit Platzhalter für die Betreiberangaben. Der Zweig `tomei-2.0` ist gepusht, aber noch nicht in `main` zusammengeführt.

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
| `npm run build` | erfolgreich; Hauptbündel ~303 KB, Seiten und Globus werden nachgeladen |
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

## Datenbank-Ausbau (alpha.4, noch nicht deployt)

- **Modell-Katalog:** 1.100 Modelle aus Wikidata und Wikipedia plus die handverlesenen Klassiker (zusammen gut 1.130) in `src/data/models.json`. Suche mit Vorschlagsliste beim Tippen (Fahrzeugsuche und Startseite), Filter nach Herkunft, Klasse, Jahrzehnt und Oldtimer-Status. Je Modell: Inserate im Herkunftsland suchen, durchrechnen (Herkunft JP/US/UK/CA/AU), in die Garage merken, Quelle. Preise nur bei den handverlesenen Modellen.
- **Verzeichnis** (`src/data/directory.ts`, alle Adressen am 24.11.2026 geprüft): 57 weitere Auktionshäuser und Marktplätze (insgesamt 70), 41 Transportfirmen (Reedereien, Häfen, Speditionen, Frachtvergleich), 30 weitere Vermieter weltweit mit Länderfilter, 75 weitere Teile-Shops (insgesamt 80) aus 10 Ländern.
- **Teile passend zur Garage:** neue Seite Own · Teile; Shops werden nach den Marken in der Garage vorgeschlagen.
- **Europa** als zwölfter Markt (AutoScout24, mobile.de, Classic Trader, Catawiki, Dorotheum, Artcurial); Frankreich im Atlas.
- **10 neue Straßen** (insgesamt 25): Timmelsjoch, Grimselpass, Gotthardpass, Great Ocean Road, Icefields Parkway, Tail of the Dragon, Jebel Jais, Col de Turini, Bealach na Bà, Milford Road – Fakten aus Wikipedia, Fotos von Wikimedia Commons mit Lizenz.
- **Nicht möglich (kostenlos und erlaubt):** anzeigen, welche Portale ein Modell gerade im Bestand haben; siehe `DATA_SOURCES.md`.

## Überarbeitung nach Tims Feedback (alpha.3)

- **Weltweit statt Japan im Mittelpunkt:** Startseite (Slides aus Italien, USA, Japan, Norwegen, England), Traumautos aus vier Kontinenten (Skyline, Mustang, Esprit, Monaro; neue Wikimedia-Fotos mit Lizenz), Globus auf Europa ausgerichtet, Japan nicht mehr besonders markiert.
- **3D-Globus (three.js):** schlicht und einfarbig, Routen in Rot, mit der Maus drehbar. Importrouten jedes Markts nach Bremerhaven als Bögen von Land zu Land. Farbe je Abschnitt fest: grau (Startseite, Fahrzeugsuche, Roadtrip-Builder), Petrol (Atlas). Kein Umschaltknopf.
- **Roadtrip-Builder:** zeigt die Route auf dem Globus (Ort zu Ort). Die OpenStreetMap-Karte ist wieder raus, es gibt also keinen zusätzlichen externen Dienst.
- **Design:** Seitenköpfe mit Vollbild-Foto und Slideshow, Startseite als Vollbild-Slideshow, Werkzeuge als Bildkacheln, je Welt farbige Hintergründe (Discover Sand, Drive Petrol, Own Rosé) mit langsam wanderndem Höhenlinien-Muster, Globus-Abschnitte dunkel. Ein komplett dunkles Design wurde ausprobiert und auf Tims Wunsch verworfen.
- **Dasai Mochi** entfernt (die Nachbildung traf das Original nicht).
- **Englisch für Datentexte:** Beschreibungen aus `data.ts`/`classics.ts` über `src/i18n/data_en.ts`.
- **Gebühren Deutschland:** Vollgutachten § 21 mit Quelle (TÜV NORD Entgeltliste 2025); übrige Zielland-Gebühren bleiben Schätzwerte, weil es keine veröffentlichten Festpreise gibt.

## Erster Entwurf (alpha.2)

- **Englisch** für alle Werkzeuge: Oberfläche, Beschriftungen, Hinweise, Leer- und Fehlerzustände. Texte stehen als Paar direkt im Werkzeug (`tx('Deutsch', 'English')`), gemeinsame Texte in `src/i18n/i18n.ts`.
- **Datenschutz** (`#/privacy`) und **Impressum** (`#/imprint`) als Entwurf, im Footer verlinkt. Der Datenschutztext beschreibt nur, was die Seite technisch tut (GitHub Pages, lokaler Speicher, EZB-Kurs über frankfurter.dev, keine Cookies). Die Angaben zum Betreiber stehen leer in `BRAND.operator` (`src/config/brand.ts`); solange sie fehlen, zeigt die Seite einen roten Platzhalter und einen Entwurfs-Hinweis.
- **Kleineres Hauptbündel:** alle Seiten außer der Startseite werden nachgeladen.
- Behoben: Die Passport-Vorschau auf der Startseite zeigte bei echten Einträgen die interne Art (z. B. „service“) statt „Wartung“.
- Behoben: Die 3D-Routenkarte der Fahrzeugsuche stand bei 1024 px Breite seitlich über.

## Offene Punkte

1. **Englisch:** fast vollständig; einzelne Datentexte ohne Umlaut/Füllwort können noch deutsch sein (Eintrag in `src/i18n/data_en.ts` ergänzen).
2. **Impressum/Datenschutz:** Name, Anschrift und öffentliche E-Mail von Tim in `BRAND.operator` eintragen, Texte rechtlich prüfen lassen. Ohne das kein öffentlicher Release.
3. **Bundle-Größe:** Hauptbündel ~303 KB; der 3D-Globus (three.js, ~630 KB) lädt erst, wenn er gebraucht wird.
4. **Ziel-Gebühren im Rechner** (DEST in `src/data.ts`) sind Schätzwerte ohne Einzelquelle; nach Quellen ersetzen oder deutlicher kennzeichnen.
5. **Service** ist nur eine Anfrage-Vorlage; `CONTACT_EMAIL` bleibt leer, bis Tim eine öffentliche Adresse nennt.
6. **Design-Feinschliff:** Tims Urteil zum hellen, farbigen Stand steht aus.

Roadmap: `ROADMAP.md` · Quellen: `DATA_SOURCES.md` · Bildrechte: `ASSET_LICENSES.md` · Bibliotheken: `THIRD_PARTY_NOTICES.md` · Release: `RELEASE_CHECKLIST.md`
