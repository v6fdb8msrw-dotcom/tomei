# Roadmap TŌMEI 2.0 – Beyond the Drive

Stand: 24.11.2026. Grundregeln für jede Phase: alles kostenlos und dauerhaft frei lizenziert, kein Cloudflare, Hosting auf GitHub Pages, keine erfundenen Daten, kein Scraping, Quellen für alle Zahlen, Daten bleiben auf dem Gerät des Nutzers. Deploy nur nach Tims ausdrücklichem Ja.

## Phase 0 – Audit und Checkpoint ✅

- Zweig `tomei-2.0`, Tag `checkpoint-vor-2.0` auf dem letzten Stand von 1.x (`8e5a633`).
- Audit von Repo und Webseite (Ergebnis in `PROJECT_STATUS.md`, Abschnitt „Audit“).

## Phase 1 – Production Foundation ✅ (dieser Stand)

- Zentrales Branding (`src/config/brand.ts`), Name nur an einer Stelle.
- Farb-Tokens Ivory/Petrol/Vermilion, freie Schriften (Manrope, Inter, JetBrains Mono).
- Gemeinsame Datenmodelle (`src/store/schema.ts`): Fahrzeug, Wartung, Passport, Roadtrip, Einstellungen.
- Local-first-Speicher mit Version, Migration, Export, Import (zusammenführen/ersetzen), Löschen (`src/store/store.ts`, Seite „Meine Daten“).
- Hash-Router mit drei Welten, Weiterleitung alter Links, View-Transitions, `prefers-reduced-motion`.
- i18n-Gerüst DE/EN (Navigation, Startseite, Übersichten, Zustände).
- 404-, Leer- und Fehlerzustände; Fehlergrenze pro Seite.
- Tests mit Vitest (Rechnung, Szenarien, GPX, Speicher, Wartung, Unterhalt).

## Phase 2 – Erste verbundene Funktionen ✅ (dieser Stand)

| Welt | Funktion | Stand |
|---|---|---|
| DISCOVER | Fahrzeugsuche (11 Märkte, Modell-Finder), Merkliste = Garage | ✅ übernommen und verbunden |
| DISCOVER | Auktionshäuser als Verzeichnis mit Suchlinks | ✅ neu |
| DISCOVER | Import-Partner-Finder (Herkunft, Leistung, veröffentlichte Preise) | ✅ neu |
| DISCOVER | Importrechner 2.0: Best/Expected/Worst/Custom, Speichern am Fahrzeug | ✅ neu |
| DISCOVER | Import-Journey (9 Schritte, Status zieht mit, Passport-Eintrag) | ✅ neu |
| DRIVE | Roadtrip-Explorer (15 Straßen, Fakten aus Wikipedia, Fotos Wikimedia) | ✅ neu |
| DRIVE | Straßen-Detailseiten mit Route, Karten-Links, GPX | ✅ neu |
| DRIVE | Roadtrip-Builder mit GPX-Import/-Export, Fahrzeug, Passport | ✅ neu |
| DRIVE | Automotive Atlas (18 Länder, Globus, Länderseiten) | ✅ neu |
| DRIVE | Sportwagenvermietung (Japan) | ✅ übernommen |
| OWN | Garage mit 6 Status, Fahrzeugdetail | ✅ neu |
| OWN | Ownership-Simulator | ✅ neu |
| OWN | Build Studio (Kanban, Budget, Teile-Shops) | ✅ neu |
| OWN | Wartungsplaner (Intervalle, Fälligkeit, .ics-Export) | ✅ neu |
| OWN | Automotive Passport (Zeitleiste, Druck, Export) | ✅ neu |
| HOME | Startseite mit 9 Sektionen und 3D-Globus | ✅ neu |

## Phase 3 – Inhalte vertiefen (als Nächstes)

1. **Englisch vollständig**: Texte der Werkzeuge (Rechner, Märkte, Service, Builder …) in `src/i18n` übernehmen.
2. **Mehr Länder im Rechner**: Zielländer Österreich, Schweiz, Niederlande (Zoll/Steuer nur mit amtlicher Quelle).
3. **Mehr Roads**: weitere Straßen in Japan (z. B. Irohazaka, Venus Line, Bandai-Azuma Skyline), Europa und USA – jeweils mit Wikipedia-Fakten und Commons-Foto.
4. **Vermietung außerhalb Japans**: nur Anbieter, die Preise öffentlich nennen; ohne Bewertungen.
5. **Länderseiten**: Zulassungsregeln je Land mit amtlichen Quellen (DE: KBA/StVZO, AT, CH).
6. **Bundle verkleinern**: Hauptbündel ~590 KB; Märkte, Rechner und Startseiten-Sektionen per `lazy()` aufteilen.

## Phase 4 – Komfort (nach Rücksprache mit Tim)

- **Karte mit Kacheln** im Roadtrip-Builder (z. B. Leaflet + OpenStreetMap-Kacheln). Kostenlos, aber ein neuer externer Dienst mit Nutzungsrichtlinie → **vorher Tim fragen**.
- **Fotos am eigenen Fahrzeug** (lokal in IndexedDB, nie hochgeladen).
- **PWA/Offline**: Service Worker, Installation auf dem Handy.
- **Teilen eines Roadtrips** als Link (Daten im Link selbst, ohne Server).

## Phase 5 – Release

- Markenrechtliche Prüfung des Namens (Branding nur in `brand.ts` ändern).
- Impressum und Datenschutzerklärung (Pflicht für eine öffentliche Seite in Deutschland) – Inhalt muss Tim liefern; `CONTACT_EMAIL` bleibt bis dahin leer.
- `RELEASE_CHECKLIST.md` abarbeiten, dann `npm run deploy` **nur nach Tims Ja**.

## Bewusst nicht geplant

- Inserate, Auktionsergebnisse oder Preise von Portalen auslesen (verboten bzw. kostenpflichtig).
- Bewertungen von Händlern, Agenten oder Vermietern.
- Konten, Server-Datenbank, Tracking, Werbung.
- Cloudflare in jeder Form.
