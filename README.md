# TŌMEI 2.0 – Beyond the Drive

Fahrzeuge weltweit finden, ehrlich durchrechnen, große Straßen fahren und das eigene Auto dokumentieren. Drei verbundene Welten (DISCOVER, DRIVE, OWN), ein gemeinsamer Datenspeicher im Browser. Kostenlos, ohne Konto, ohne Tracking.

- React 19 + TypeScript + Vite, Animationen mit `motion`, Icons von `lucide-react`, Globus mit `d3-geo` + `world-atlas`
- Farben: Warm Ivory, Racing Petrol, Vermilion (Tokens in `src/index.css`), Schriften Manrope + Inter
- Name und Claim zentral in `src/config/brand.ts`

## Starten

```bash
npm install
npm run dev        # http://localhost:5193
npm test           # Vitest
npm run build      # tsc + Vite
```

Online stellen: `npm run deploy` (Zweig gh-pages, GitHub Pages) – nur nach ausdrücklichem OK.

## Aufbau

| Pfad | Inhalt |
|---|---|
| `src/App.tsx` | Navigation, Router (`#/welt/bereich/id`), Footer |
| `src/store/` | Datenmodelle (`schema.ts`) und local-first Speicher mit Version, Migration, Export/Import (`store.ts`) |
| `src/pages/discover/`, `drive/`, `own/` | die drei Welten |
| `src/pages/Import.tsx`, `Markets.tsx`, `Service.tsx`, `Rent.tsx` | übernommene Seiten aus 1.x |
| `src/data.ts`, `src/data/`, `src/classics.ts` | Inhalte mit Quellen |
| `src/lib/` | Rechnung, Szenarien, GPX, Unterhalt, Wartung, Router, Kurse |
| `src/i18n/` | Deutsch/Englisch |

Dokumente: [PROJECT_STATUS.md](PROJECT_STATUS.md) · [ROADMAP.md](ROADMAP.md) · [DATA_SOURCES.md](DATA_SOURCES.md) · [ASSET_LICENSES.md](ASSET_LICENSES.md) · [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) · [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md)
