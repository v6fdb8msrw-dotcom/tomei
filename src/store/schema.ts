// Gemeinsame Datenmodelle für DISCOVER, DRIVE und OWN. Alles bleibt lokal im Browser (local-first).
// Jede Änderung am Format erhöht SCHEMA_VERSION und bekommt eine Migration in store.ts.

export const SCHEMA_VERSION = 1

export type Money = { amount: number; cur: string }

/** Lebenszyklus eines Fahrzeugs: vom Traum bis zum Verkauf */
export const VEHICLE_STATUS = ['dream', 'watchlist', 'planned', 'import', 'owned', 'sold'] as const
export type VehicleStatus = (typeof VEHICLE_STATUS)[number]

export type ScenarioKey = 'best' | 'expected' | 'worst' | 'custom'

/** Ergebnis aus dem Importrechner, am Fahrzeug gespeichert */
export type LandedCost = {
  amount: number
  cur: string
  scenario: ScenarioKey
  savedAt: string
  /** Kurzbeschreibung der Annahmen, z. B. „Japan → Deutschland, RoRo, Ø 5 Agenten“ */
  basis: string
  range?: { best: number; worst: number }
}

export type ModStatus = 'idea' | 'planned' | 'ordered' | 'installed'
export type Mod = { id: string; title: string; category: string; status: ModStatus; cost?: Money; url?: string; date?: string; notes?: string }

/** Eingaben des Ownership-Simulators (alles Nutzerwerte, nichts geschätzt) */
export type OwnershipInput = {
  years: number
  kmPerYear: number
  consumption: number // l/100 km
  fuelPrice: number // €/l
  insurance: number // €/Jahr
  tax: number // €/Jahr
  maintenance: number // €/Jahr
  other: number // €/Jahr (Stellplatz, Pflege …)
  valueChangePct: number // Wertänderung pro Jahr in %, negativ = Wertverlust
  purchase: number // Kaufpreis bzw. Importkosten in €
}

export type Vehicle = {
  id: string
  make: string
  model: string
  variant?: string
  chassis?: string
  year?: number
  status: VehicleStatus
  /** Marktland (ISO-artiger Code aus countries.ts, z. B. jp, us) */
  market?: string
  price?: Money
  url?: string
  notes?: string
  mileageKm?: number
  /** Bild-Schlüssel aus den lizenzierten Fotos (z. B. cars/r34), keine fremden Uploads */
  image?: string
  landed?: LandedCost
  ownership?: OwnershipInput
  mods: Mod[]
  /** erledigte Schritte der Import-Journey */
  journey: string[]
  /** Herkunft des Eintrags */
  source?: 'manual' | 'finds' | 'finder' | 'calculator' | 'home' | 'import'
  createdAt: string
  updatedAt: string
}

export type MaintenanceKind = 'service' | 'inspection' | 'repair' | 'tyres' | 'season' | 'other'
export type MaintenanceItem = {
  id: string
  vehicleId: string
  title: string
  kind: MaintenanceKind
  intervalMonths?: number
  intervalKm?: number
  lastDate?: string
  lastKm?: number
  dueDate?: string
  dueKm?: number
  cost?: Money
  notes?: string
  history: { date: string; km?: number; cost?: number; notes?: string }[]
}

export type PassportKind = 'purchase' | 'import' | 'registration' | 'service' | 'mod' | 'trip' | 'document' | 'note'
export type PassportEntry = { id: string; vehicleId: string; date: string; kind: PassportKind; title: string; notes?: string; km?: number; cost?: Money }

export type Waypoint = { name: string; lat: number; lon: number }
export type Trip = {
  id: string
  name: string
  roadId?: string
  vehicleId?: string
  waypoints: Waypoint[]
  /** Spurpunkte aus einer importierten GPX-Datei [lat, lon] */
  track?: [number, number][]
  notes?: string
  date?: string
  createdAt: string
  updatedAt: string
}

export type Lang = 'de' | 'en'
export type Settings = { lang: Lang; homeCountry: string }

export type StoreData = {
  version: typeof SCHEMA_VERSION
  vehicles: Vehicle[]
  maintenance: MaintenanceItem[]
  passport: PassportEntry[]
  trips: Trip[]
  settings: Settings
}

export const EMPTY_STORE: StoreData = {
  version: SCHEMA_VERSION,
  vehicles: [],
  maintenance: [],
  passport: [],
  trips: [],
  settings: { lang: 'de', homeCountry: 'de' },
}
