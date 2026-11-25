# Datenquellen

Jede Zahl in TŌMEI hat eine Quelle, ist als Schätzwert/Annahme gekennzeichnet oder kommt vom Nutzer. Es gibt keinen automatischen Abruf fremder Seiten (kein Scraping). Einzige Live-Quelle ist der EZB-Kurs.

## Live

| Daten | Quelle | Nutzung |
|---|---|---|
| Wechselkurse (EZB-Referenzkurse) | https://api.frankfurter.dev (öffentlich, ohne Schlüssel) | Rechner, Merkliste, Startseite; Ersatzkurse in `src/data.ts` (`FX_FALLBACK`, Stand 16.11.2026) |

## Statisch im Code

| Daten | Datei | Quelle | Stand |
|---|---|---|---|
| Gebühren der Export-Agenten in Japan | `src/data.ts` → `AGENTS` | Preisseiten der Firmen (Link je Agent im Feld `source`) | 17.11.2026 |
| Pauschale JP-Importcars.de | `src/data.ts` → `IMPORT_FLAT` | https://www.jp-importcars.de/?lang=en | 17.11.2026 |
| Aufgeld der Auktionshäuser USA/UK/AU | `src/data.ts` → `ORIGIN.*.houses` | https://support.classic.com/auction-fees-and-prices bzw. Bedingungen des Hauses | 18.11.2026 |
| Fracht USA → Bremerhaven, Hafenabwicklung | `src/data.ts` → `ORIGIN.us` | wcshipping.com, alltransportdepot.com (Links im Code) | 18.11.2026 |
| Zollpräferenzen US-/UK-Ursprung | `src/data.ts` → `ORIGIN.*.pref` | VO (EU) 2026/1455 (über wcshipping-Blog), zoll.de (TCA) | 18.11.2026 |
| Zoll- und Steuersätze der Zielländer | `src/data.ts` → `DEST` | Allgemein bekannte Sätze (DE 10 % Zoll/19 % EUSt, Oldtimer 0 %/7 %) | 28.10./17.11.2026 |
| **Gebühren im Zielland** (Zollabwicklung, Agent, Inlandstransport, TÜV, Zulassung) und Seefracht ab Japan | `src/data.ts` → `DEST.*.fees/freight` | **Schätzwerte** – in der Oberfläche als „Schätzwert“ markiert. Gesucht am 24.11.2026: Für Hafen- und Zollabwicklung in Bremerhaven, Inlandstransport und Zulassung gibt es keine veröffentlichten Festpreise; für die Vollabnahme siehe unten (TÜV NORD) | 28.10.2026 |
| Median-Angebotspreise JDM | `src/classics.ts` | JDMBUYSELL Market Trends, CC BY 4.0, von Hand abgelesen | 17.11.2026 |
| Märkte und Portale (Suchlinks) | `src/data.ts` → `MARKETS` | Öffentliche Suchseiten der Portale, nur Links | 17.11.2026 |
| Auktionshäuser (Verzeichnis) | `src/data.ts` → `AUCTIONS` | Webseiten der Häuser; keine Ergebnisse oder Listen | 17.11.2026 |
| Straßen: Länge, Höhe, Endpunkte, Kurzfakten | `src/data/roads.ts` | Englische Wikipedia über die REST/Action-API (Link je Straße) | 24.11.2026 |
| Koordinaten der Wegpunkte | `src/data/roads.ts` | Koordinaten der Wikipedia-Artikel der Orte/Pässe | 24.11.2026 |
| Länder: Fahrseite, ungefähre Landesmitte | `src/data/countries.ts` | Allgemeinwissen; Koordinaten nur für Markierungen | 24.11.2026 |
| Vollgutachten § 21 StVZO (Grundentgelt 116,50 € + 35 €/Viertelstunde) | `src/data.ts` → `DEST.DE.feeSources` | TÜV NORD Entgeltliste 2025: https://tuev-nord.de/fileadmin/Content/TUEV_NORD_DE/verkehr/pdf/pk-td-entgeltliste-25-01.pdf | 24.11.2026 |
| Kfz-Steuer H-Kennzeichen 191,73 €/Jahr | `src/lib/ownership.ts` | § 9 Abs. 4 Nr. 2 KraftStG, https://www.gesetze-im-internet.de/kraftstg/__9.html | 24.11.2026 |
| Modell-Katalog (Name, Hersteller, Herkunftsland, Bauzeit, Klasse) | `src/data/models.json` | Wikidata (CC0, SPARQL-Abfrage) für Modelle, Hersteller und Herkunft; Bauzeit und Klasse aus der Infobox der englischen Wikipedia (API, einmalig beim Bauen, Link je Modell) | 24.11.2026 |
| Erweitertes Verzeichnis (Auktionshäuser, Transport, Vermietung, Teile) | `src/data/directory.ts` | Webseiten der Firmen; jede Adresse am 24.11.2026 abgerufen; nur Rolle beschrieben, keine Preise oder Bewertungen | 24.11.2026 |
| Weitere Straßen und Rennstrecken (Kurztext, Höhe, Länge, Koordinaten) | `src/data/roads_more.json` | Wikipedia de/en (Texte gekürzt, CC BY-SA 4.0; Zahlen aus der Infobox), Fotos von Hand gesichtet | 24.11.2026 |
| Kurztexte der Modelle | `src/data/models_text.json` | Wikipedia de/en, gekürzt, CC BY-SA 4.0, Link je Modell | 24.11.2026 |
| Events | `src/data/events.json` | Quelle je Termin (Veranstalter, Presse, Saisonseiten der Wikipedia); teils Drittquellen | 24.11.2026 |
| Importregeln | `src/data/importRules.ts` | Behördenseiten (Links je Land) | 24.11.2026 |
| Landflächen des Globus | `world-atlas/land-110m.json` | Natural Earth (gemeinfrei) über das Paket world-atlas (ISC) | Paket 2.0.2 |

- **Technische Daten je Modell** (`src/data/models_specs.json`): Infoboxen der englischen Wikipedia, CC BY-SA 4.0, abgerufen 25.11.2026, automatisch ausgelesen (Maße, Gewicht, Hubraum, Motoren, Generationen).
- **Schwachstellen** (`src/data/weakspots.ts`): Kaufberatungen, über die Websuche am 25.11.2026 gelesen, in eigenen Worten; Links je Modell.
- **Gelände** (`public/data/terrain/`): Terrain Tiles (Mapzen/Tilezen, AWS Open Data; u. a. SRTM, EU-DEM, NED, GMTED), einmalig am 25.11.2026 geladen.
- **Straßenverläufe**: © OpenStreetMap-Mitwirkende (ODbL), geladen am 25.11.2026 über Overpass und OpenFreeMap-Kacheln (© OpenMapTiles). Einmalig beim Erstellen; die Webseite fragt keinen Kartendienst. Die daraus abgeleiteten Verläufe stehen unter der ODbL.
- **Orte** (`src/data/places.json`): 3.325 Städte, OpenStreetMap (ODbL) über OpenFreeMap-Kacheln, 25.11.2026.
- **Spritpreis**: EU-Durchschnitt Super 95, 1,83 €/l, EU Weekly Oil Bulletin vom 16.11.2026 (abgelesen über fuel-prices.eu). Von Hand aktualisieren (`FUEL` in `TripPlan.tsx`).
- **Werkstätten** (`public/data/shops.json`): OpenStreetMap (ODbL) über Overpass, einmalig; Auswahl nach Name, Marke und Oldtimer-Bezug (119 Kartenabschnitte, 25.11.2026).
- **Portale** (`src/data/portals.ts`): Direktlinks, am 25.11.2026 von Hand im Browser geprüft; keine Inserate ausgelesen. eBay- und Yahoo-Links, Bring-a-Trailer-Suche: bekanntes Format, nicht einzeln geöffnet.

## Annahmen (in der Oberfläche als „Annahme“ markiert, änderbar)

| Annahme | Standard | Wo |
|---|---|---|
| Kursschwankung bis zur Zahlung | ±5 % | Importrechner 2.0, Startseite „Real Cost“ |
| Reserve im Worst Case | 10 % vom Fahrzeugwert | Importrechner 2.0, Startseite |
| Transportversicherung | 1,5 % | Rechner (schon in 1.x) |

- Roadtrip je Auto (`carprofile.ts`): Verbrauch, Tagesstrecke, Tankgröße nach Klasse und Baujahr; Ausschluss enger, geschotterter oder gepflasterter Straßen von Hand festgelegt.
- Angebote: 20.000 € Startpreis ohne Preisquelle; gleicher Preis in allen Ländern.
- Roadtrip: 9 l/100 km, 100 €/Nacht, Umwegfaktor 1,35, 320 km/Tag. Unterhalt: Startwerte `DEMO` in `Simulator.tsx`. Wartung: üblicher Grundplan.

## Demo-Daten (gekennzeichnet)

| Daten | Wo | Kennzeichnung |
|---|---|---|
| Beispielautos mit Orientierungspreisen (`CARS`) | Importrechner | Badge „Beispielautos“ |
| Beispiel-Zeitleiste | Startseite, Passport-Sektion (nur bei leerem Passport) | Badge „Beispiel“ |
| Beispielwerte Unterhalt | Simulator, Knopf „Beispielwerte laden“ | Badge „Beispielwerte, keine Marktdaten“ |

## Nicht verfügbar (bewusst)

- **Live-Bestand je Modell** („Welche Portale haben das Auto gerade?“): Die Portale bieten keine freie Schnittstelle, Auslesen ist verboten. Einzige freie offizielle Schnittstelle wäre eBay (Entwicklerkonto + eigener Server nötig, neuer Dienst → nur nach Tims Entscheidung). Stattdessen: Portale des Herkunftslands als Vorauswahl.
- **Preise für den Katalog:** nur bei den handverlesenen Modellen aus `classics.ts` (JDMBUYSELL, CC BY 4.0, von Hand abgelesen).

- Inserate und Auktionsergebnisse der Portale: Auslesen verboten bzw. nur kostenpflichtig.
- Freie Preisquellen für Klassiker in USA/UK/AU: keine mit erlaubter Nachnutzung gefunden (siehe Kommentar in `src/classics.ts`).
- Kfz-Steuer außer H-Kennzeichen: hängt von Erstzulassung, Hubraum, CO₂ ab → Link zum Rechner des BMF.
