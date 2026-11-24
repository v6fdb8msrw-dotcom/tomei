# Third-Party Notices

TŌMEI nutzt ausschließlich kostenlose Open-Source-Bibliotheken und frei lizenzierte Daten. Stand: 24.11.2026 (Versionen aus `package-lock.json`).

## Laufzeit (im ausgelieferten Build)

| Paket | Version | Lizenz | Zweck |
|---|---|---|---|
| react, react-dom | 19.3.1 | MIT | Oberfläche |
| motion (inkl. framer-motion, motion-dom, motion-utils) | 14.7.1 | MIT | Animationen |
| lucide-react | 1.63.0 | ISC | Icons |
| d3-geo (inkl. d3-array) | 3.1.2 | ISC | Projektion des Globus und der Weltkarte |
| topojson-client | 3.1.0 | ISC | Landflächen entpacken |
| three | 0.172.0 | MIT | 3D-Globus |
| world-atlas | 2.0.2 | ISC | Landflächen 1:110 Mio. (Daten: Natural Earth, gemeinfrei) |
| @fontsource-variable/manrope | 5.3.0 | OFL-1.1 (Schrift), MIT (Paket) | Überschriften |
| @fontsource-variable/inter | 5.3.0 | OFL-1.1 (Schrift), MIT (Paket) | Fließtext |
| @fontsource/jetbrains-mono | 5.3.0 | OFL-1.1 (Schrift), MIT (Paket) | Zahlen |

## Entwicklung (nicht im Build)

vite 8.3.5 (MIT), @vitejs/plugin-react 6.1.2 (MIT), typescript 7.0.2 (Apache-2.0), vitest 5.1.1 (MIT), oxlint 1.90.0 (MIT), @types/* (MIT).

## Daten

| Daten | Lizenz | Nachweis |
|---|---|---|
| Natural Earth (über world-atlas) | gemeinfrei | https://www.naturalearthdata.com/ |
| JDMBUYSELL Market Trends (Medianpreise) | CC BY 4.0 | https://www.jdmbuysell.com/market-trends/ – Nachweis auf der Startseite und im Modell-Finder |
| Wikipedia (Fakten zu Straßen, sinngemäß übernommen) | Fakten sind nicht schutzfähig; Artikeltexte CC BY-SA 4.0 | Link zur Quelle auf jeder Straßenseite |
| Wikimedia Commons (Fotos) | je Foto, siehe `ASSET_LICENSES.md` | |
| EZB-Referenzkurse über frankfurter.dev | frei nutzbar | https://frankfurter.dev |

Die vollständigen Lizenztexte liegen in `node_modules/<paket>/LICENSE` und werden mit dem Quellcode verteilt.
