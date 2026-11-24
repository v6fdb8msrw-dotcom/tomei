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
| **Gebühren im Zielland** (Zollabwicklung, Agent, Inlandstransport, TÜV, Zulassung) und Seefracht ab Japan | `src/data.ts` → `DEST.*.fees/freight` | **Schätzwerte ohne Einzelquelle** – in der Oberfläche als „Schätzwert“ markiert | 28.10.2026 |
| Median-Angebotspreise JDM | `src/classics.ts` | JDMBUYSELL Market Trends, CC BY 4.0, von Hand abgelesen | 17.11.2026 |
| Märkte und Portale (Suchlinks) | `src/data.ts` → `MARKETS` | Öffentliche Suchseiten der Portale, nur Links | 17.11.2026 |
| Auktionshäuser (Verzeichnis) | `src/data.ts` → `AUCTIONS` | Webseiten der Häuser; keine Ergebnisse oder Listen | 17.11.2026 |
| Straßen: Länge, Höhe, Endpunkte, Kurzfakten | `src/data/roads.ts` | Englische Wikipedia über die REST/Action-API (Link je Straße) | 24.11.2026 |
| Koordinaten der Wegpunkte | `src/data/roads.ts` | Koordinaten der Wikipedia-Artikel der Orte/Pässe | 24.11.2026 |
| Länder: Fahrseite, ungefähre Landesmitte | `src/data/countries.ts` | Allgemeinwissen; Koordinaten nur für Markierungen | 24.11.2026 |
| Kfz-Steuer H-Kennzeichen 191,73 €/Jahr | `src/lib/ownership.ts` | § 9 Abs. 4 Nr. 2 KraftStG, https://www.gesetze-im-internet.de/kraftstg/__9.html | 24.11.2026 |
| Landflächen des Globus | `world-atlas/land-110m.json` | Natural Earth (gemeinfrei) über das Paket world-atlas (ISC) | Paket 2.0.2 |

## Annahmen (in der Oberfläche als „Annahme“ markiert, änderbar)

| Annahme | Standard | Wo |
|---|---|---|
| Kursschwankung bis zur Zahlung | ±5 % | Importrechner 2.0, Startseite „Real Cost“ |
| Reserve im Worst Case | 10 % vom Fahrzeugwert | Importrechner 2.0, Startseite |
| Transportversicherung | 1,5 % | Rechner (schon in 1.x) |

## Demo-Daten (gekennzeichnet)

| Daten | Wo | Kennzeichnung |
|---|---|---|
| Beispielautos mit Orientierungspreisen (`CARS`) | Importrechner | Badge „Beispielautos“ |
| Beispiel-Zeitleiste | Startseite, Passport-Sektion (nur bei leerem Passport) | Badge „Beispiel“ |
| Beispielwerte Unterhalt | Simulator, Knopf „Beispielwerte laden“ | Badge „Beispielwerte, keine Marktdaten“ |

## Nicht verfügbar (bewusst)

- Inserate und Auktionsergebnisse der Portale: Auslesen verboten bzw. nur kostenpflichtig.
- Freie Preisquellen für Klassiker in USA/UK/AU: keine mit erlaubter Nachnutzung gefunden (siehe Kommentar in `src/classics.ts`).
- Kfz-Steuer außer H-Kennzeichen: hängt von Erstzulassung, Hubraum, CO₂ ab → Link zum Rechner des BMF.
