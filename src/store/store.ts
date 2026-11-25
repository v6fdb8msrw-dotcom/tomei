// Local-first Speicher: ein versioniertes JSON-Dokument im localStorage.
// Pure Funktionen (migrate, sanitize, parseBackup) sind getrennt vom Browser-Teil, damit sie testbar bleiben.
import { useRef, useSyncExternalStore } from 'react'
import { BRAND } from '../config/brand.ts'
import {
  EMPTY_STORE,
  SCHEMA_VERSION,
  VEHICLE_STATUS,
  type MaintenanceItem,
  type PassportEntry,
  type Settings,
  type StoreData,
  type Trip,
  type Vehicle,
} from './schema.ts'

export const STORE_KEY = `${BRAND.storagePrefix}.store`
/** alte Merkliste aus Version 1.x */
export const LEGACY_FINDS_KEY = `${BRAND.storagePrefix}.finds`

export const uid = () => (globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`)
export const nowIso = () => new Date().toISOString()

/* ------------------------------------------------------------------ pure */

type Obj = Record<string, unknown>
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v)
const str = (v: unknown, max = 500) => (typeof v === 'string' ? v.slice(0, max) : undefined)
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : undefined)
const arr = (v: unknown) => (Array.isArray(v) ? v : [])
const money = (v: unknown) => (isObj(v) && num(v.amount) !== undefined && str(v.cur) ? { amount: v.amount as number, cur: (v.cur as string).slice(0, 3).toUpperCase() } : undefined)
/** Nur https-Links übernehmen (keine javascript:-Links aus fremden Sicherungen) */
const safeUrl = (v: unknown) => {
  const s = str(v, 2000)
  return s && /^https:\/\/[^\s]+$/i.test(s) ? s : undefined
}
const clean = <T extends Obj>(o: T): T => {
  for (const k of Object.keys(o)) if (o[k] === undefined) delete o[k]
  return o
}

export function sanitizeVehicle(v: unknown): Vehicle | null {
  if (!isObj(v)) return null
  const make = str(v.make, 80)?.trim() ?? ''
  const model = str(v.model, 120)?.trim() ?? ''
  if (!make && !model) return null
  const status = VEHICLE_STATUS.includes(v.status as never) ? (v.status as Vehicle['status']) : 'dream'
  const t = nowIso()
  return clean({
    id: str(v.id, 80) || uid(),
    make,
    model,
    variant: str(v.variant, 120),
    chassis: str(v.chassis, 60),
    year: num(v.year),
    status,
    market: str(v.market, 8),
    price: money(v.price),
    url: safeUrl(v.url),
    notes: str(v.notes, 4000),
    mileageKm: num(v.mileageKm),
    image: str(v.image, 80),
    landed: isObj(v.landed) && num(v.landed.amount) !== undefined ? (v.landed as Vehicle['landed']) : undefined,
    ownership: isObj(v.ownership) ? (v.ownership as Vehicle['ownership']) : undefined,
    mods: arr(v.mods)
      .filter(isObj)
      .map((m) => clean({ id: str(m.id, 80) || uid(), title: str(m.title, 200) ?? 'Teil', category: str(m.category, 60) ?? 'Sonstiges', status: (['idea', 'planned', 'ordered', 'installed'].includes(m.status as string) ? m.status : 'idea') as Vehicle['mods'][number]['status'], cost: money(m.cost), url: safeUrl(m.url), date: str(m.date, 30), notes: str(m.notes, 2000) })),
    journey: arr(v.journey).filter((x): x is string => typeof x === 'string').slice(0, 50),
    modelId: str(v.modelId, 40),
    checks: v.checks === undefined ? undefined : arr(v.checks).filter((x): x is string => typeof x === 'string').slice(0, 100),
    values:
      v.values === undefined
        ? undefined
        : arr(v.values)
            .filter(isObj)
            .map((x) => clean({ date: str(x.date, 10) ?? '', amount: num(x.amount) ?? 0, cur: str(x.cur, 3) ?? 'EUR', note: str(x.note, 200) }))
            .filter((x) => /^\d{4}-\d{2}-\d{2}$/.test(x.date) && x.amount > 0)
            .slice(0, 200),
    huDue: typeof v.huDue === 'string' && /^\d{4}-\d{2}$/.test(v.huDue) ? v.huDue : undefined,
    season: isObj(v.season) && num(v.season.from) && num(v.season.to) ? { from: Math.min(12, Math.max(1, num(v.season.from)!)), to: Math.min(12, Math.max(1, num(v.season.to)!)) } : undefined,
    photoCount: num(v.photoCount),
    source: str(v.source, 20) as Vehicle['source'],
    createdAt: str(v.createdAt, 40) ?? t,
    updatedAt: str(v.updatedAt, 40) ?? t,
  })
}

function sanitizeMaintenance(m: unknown, ids: Set<string>): MaintenanceItem | null {
  if (!isObj(m) || !ids.has(m.vehicleId as string)) return null
  return clean({
    id: str(m.id, 80) || uid(),
    vehicleId: m.vehicleId as string,
    title: str(m.title, 200) ?? 'Wartung',
    kind: (['service', 'inspection', 'repair', 'tyres', 'season', 'other'].includes(m.kind as string) ? m.kind : 'other') as MaintenanceItem['kind'],
    intervalMonths: num(m.intervalMonths),
    intervalKm: num(m.intervalKm),
    lastDate: str(m.lastDate, 30),
    lastKm: num(m.lastKm),
    dueDate: str(m.dueDate, 30),
    dueKm: num(m.dueKm),
    cost: money(m.cost),
    notes: str(m.notes, 2000),
    history: arr(m.history)
      .filter(isObj)
      .map((h) => clean({ date: str(h.date, 30) ?? nowIso().slice(0, 10), km: num(h.km), cost: num(h.cost), notes: str(h.notes, 1000) })),
  })
}

function sanitizePassport(p: unknown, ids: Set<string>): PassportEntry | null {
  if (!isObj(p) || !ids.has(p.vehicleId as string)) return null
  return clean({
    id: str(p.id, 80) || uid(),
    vehicleId: p.vehicleId as string,
    date: str(p.date, 30) ?? nowIso().slice(0, 10),
    kind: (['purchase', 'import', 'registration', 'service', 'mod', 'trip', 'document', 'note'].includes(p.kind as string) ? p.kind : 'note') as PassportEntry['kind'],
    title: str(p.title, 200) ?? 'Eintrag',
    notes: str(p.notes, 4000),
    km: num(p.km),
    cost: money(p.cost),
  })
}

function sanitizeTrip(t: unknown): Trip | null {
  if (!isObj(t)) return null
  const pt = (w: unknown) => (isObj(w) && num(w.lat) !== undefined && num(w.lon) !== undefined && Math.abs(w.lat as number) <= 90 && Math.abs(w.lon as number) <= 180 ? { name: str(w.name, 120) ?? '', lat: w.lat as number, lon: w.lon as number, ...(str(w.via, 60) ? { via: str(w.via, 60) } : {}), ...(str(w.road, 60) ? { road: str(w.road, 60) } : {}) } : null)
  const now = nowIso()
  return clean({
    id: str(t.id, 80) || uid(),
    name: str(t.name, 160) ?? 'Roadtrip',
    roadId: str(t.roadId, 60),
    vehicleId: str(t.vehicleId, 80),
    waypoints: arr(t.waypoints).map(pt).filter((x): x is NonNullable<typeof x> => !!x).slice(0, 500),
    track: arr(t.track)
      .filter((p): p is [number, number] => Array.isArray(p) && num(p[0]) !== undefined && num(p[1]) !== undefined)
      .slice(0, 20000),
    plan: isObj(t.plan) ? clean(Object.fromEntries((['days', 'maxKm', 'detour', 'consumption', 'fuelPrice', 'hotel', 'tolls'] as const).map((k) => [k, num((t.plan as Record<string, unknown>)[k])]))) : undefined,
    notes: str(t.notes, 4000),
    date: str(t.date, 30),
    createdAt: str(t.createdAt, 40) ?? now,
    updatedAt: str(t.updatedAt, 40) ?? now,
  })
}

function sanitizeSettings(s: unknown): Settings {
  const o = isObj(s) ? s : {}
  return { lang: o.lang === 'en' ? 'en' : 'de', homeCountry: str(o.homeCountry, 8) ?? 'de' }
}

/** Bringt beliebige (auch alte oder fremde) Daten in das aktuelle Format. Unbekanntes wird verworfen. */
export function migrate(raw: unknown): StoreData {
  if (!isObj(raw)) return structuredClone(EMPTY_STORE)
  // Version 0 (hypothetisch) oder fehlende Version: wie 1 behandeln; künftige Migrationen hier einhängen.
  const vehicles = arr(raw.vehicles).map(sanitizeVehicle).filter((x): x is Vehicle => !!x)
  const ids = new Set(vehicles.map((v) => v.id))
  return {
    version: SCHEMA_VERSION,
    vehicles,
    maintenance: arr(raw.maintenance)
      .map((m) => sanitizeMaintenance(m, ids))
      .filter((x): x is MaintenanceItem => !!x),
    passport: arr(raw.passport)
      .map((p) => sanitizePassport(p, ids))
      .filter((x): x is PassportEntry => !!x),
    trips: arr(raw.trips).map(sanitizeTrip).filter((x): x is Trip => !!x),
    settings: sanitizeSettings(raw.settings),
  }
}

/** Alte Merkliste (tomei.finds) in Fahrzeuge mit Status „watchlist“ übersetzen */
export function findsToVehicles(raw: unknown): Vehicle[] {
  return arr(raw)
    .filter(isObj)
    .map((f) => {
      const title = (str(f.title, 160) ?? 'Fundstück').trim()
      const [make, ...rest] = title.split(/\s+/)
      return sanitizeVehicle({
        id: str(f.id, 80),
        make,
        model: rest.join(' ') || make,
        status: 'watchlist',
        market: str(f.market, 8),
        price: num(f.price) !== undefined ? { amount: f.price, cur: str(f.cur, 3) ?? 'JPY' } : undefined,
        url: f.url,
        source: 'finds',
        createdAt: str(f.added, 40),
        updatedAt: str(f.added, 40),
        mods: [],
        journey: [],
      })
    })
    .filter((x): x is Vehicle => !!x)
}

export type BackupFile = { app: string; kind: 'backup'; exportedAt: string; data: StoreData }

export function makeBackup(data: StoreData): BackupFile {
  return { app: BRAND.ascii, kind: 'backup', exportedAt: nowIso(), data }
}

/** Sicherung einlesen. Wirft einen verständlichen Fehler, wenn die Datei nicht passt. */
export function parseBackup(text: string): StoreData {
  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    throw new Error('Die Datei ist kein gültiges JSON.')
  }
  const data = isObj(json) && isObj(json.data) ? json.data : json
  if (!isObj(data) || (!Array.isArray(data.vehicles) && !Array.isArray(data.trips))) throw new Error('In der Datei stehen keine Fahrzeuge oder Roadtrips.')
  if (num(data.version) !== undefined && (data.version as number) > SCHEMA_VERSION) throw new Error('Die Sicherung stammt aus einer neueren Version. Bitte die Seite aktualisieren.')
  return migrate(data)
}

/** Zwei Datenstände zusammenführen (Import „hinzufügen“): gleiche IDs überschreibt die neuere Fassung */
export function mergeStores(a: StoreData, b: StoreData): StoreData {
  const byId = <T extends { id: string; updatedAt?: string }>(x: T[], y: T[]) => {
    const m = new Map(x.map((i) => [i.id, i]))
    for (const i of y) {
      const old = m.get(i.id)
      if (!old || (i.updatedAt ?? '') >= (old.updatedAt ?? '')) m.set(i.id, i)
    }
    return [...m.values()]
  }
  return migrate({
    version: SCHEMA_VERSION,
    vehicles: byId(a.vehicles, b.vehicles),
    maintenance: byId(a.maintenance, b.maintenance),
    passport: byId(a.passport, b.passport),
    trips: byId(a.trips, b.trips),
    settings: a.settings,
  })
}

/* --------------------------------------------------------------- runtime */

let state: StoreData = load()
const listeners = new Set<() => void>()
let storageOk = true

function load(): StoreData {
  try {
    if (typeof localStorage === 'undefined') return structuredClone(EMPTY_STORE)
    const raw = localStorage.getItem(STORE_KEY)
    if (raw) return migrate(JSON.parse(raw))
    // Erster Start von 2.0: alte Merkliste übernehmen (bleibt als Sicherung liegen)
    const legacy = localStorage.getItem(LEGACY_FINDS_KEY)
    const s = structuredClone(EMPTY_STORE)
    if (legacy) s.vehicles = findsToVehicles(JSON.parse(legacy))
    return s
  } catch {
    return structuredClone(EMPTY_STORE)
  }
}

function persist() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state))
    storageOk = true
  } catch {
    storageOk = false
  }
}

export function getState() {
  return state
}
export function isStorageOk() {
  return storageOk
}

export function setState(fn: (s: StoreData) => StoreData) {
  state = fn(state)
  persist()
  listeners.forEach((l) => l())
}

function subscribe(l: () => void) {
  listeners.add(l)
  return () => listeners.delete(l)
}

// Änderungen aus anderen Tabs übernehmen
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === STORE_KEY) {
      state = load()
      listeners.forEach((l) => l())
    }
  })
}

/** Flacher Vergleich, damit Selektoren mit filter()/map() keine Endlosschleife auslösen */
export function shallowEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true
  if (typeof a !== 'object' || typeof b !== 'object' || !a || !b) return false
  if (Array.isArray(a) !== Array.isArray(b)) return false
  const ka = Object.keys(a)
  const kb = Object.keys(b)
  if (ka.length !== kb.length) return false
  return ka.every((k) => Object.is((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]))
}

export function useStore<T>(select: (s: StoreData) => T): T {
  const cache = useRef<{ v: T } | null>(null)
  const get = () => {
    const v = select(state)
    if (cache.current && shallowEqual(cache.current.v, v)) return cache.current.v
    cache.current = { v }
    return v
  }
  return useSyncExternalStore(subscribe, get, get)
}

/* --------------------------------------------------------------- actions */

export function addVehicle(v: Partial<Vehicle> & { make: string; model: string }): Vehicle {
  const t = nowIso()
  const veh = sanitizeVehicle({ mods: [], journey: [], status: 'dream', ...v, id: v.id ?? uid(), createdAt: t, updatedAt: t })!
  setState((s) => ({ ...s, vehicles: [veh, ...s.vehicles.filter((x) => x.id !== veh.id)] }))
  return veh
}

export function updateVehicle(id: string, patch: Partial<Vehicle>) {
  setState((s) => ({ ...s, vehicles: s.vehicles.map((v) => (v.id === id ? { ...v, ...patch, id, updatedAt: nowIso() } : v)) }))
}

export function removeVehicle(id: string) {
  setState((s) => ({
    ...s,
    vehicles: s.vehicles.filter((v) => v.id !== id),
    maintenance: s.maintenance.filter((m) => m.vehicleId !== id),
    passport: s.passport.filter((p) => p.vehicleId !== id),
    trips: s.trips.map((t) => (t.vehicleId === id ? { ...t, vehicleId: undefined } : t)),
  }))
}

export function upsertMaintenance(m: MaintenanceItem) {
  setState((s) => ({ ...s, maintenance: [m, ...s.maintenance.filter((x) => x.id !== m.id)] }))
}
export function removeMaintenance(id: string) {
  setState((s) => ({ ...s, maintenance: s.maintenance.filter((x) => x.id !== id) }))
}

export function addPassportEntry(p: Omit<PassportEntry, 'id'>) {
  setState((s) => ({ ...s, passport: [{ ...p, id: uid() }, ...s.passport] }))
}
export function removePassportEntry(id: string) {
  setState((s) => ({ ...s, passport: s.passport.filter((x) => x.id !== id) }))
}

export function upsertTrip(t: Trip) {
  setState((s) => ({ ...s, trips: [{ ...t, updatedAt: nowIso() }, ...s.trips.filter((x) => x.id !== t.id)] }))
}
export function removeTrip(id: string) {
  setState((s) => ({ ...s, trips: s.trips.filter((x) => x.id !== id) }))
}

export function setSettings(patch: Partial<Settings>) {
  setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }))
}

export function replaceAll(data: StoreData) {
  setState(() => migrate(data))
}

/** Alles löschen: Speicher, alte Merkliste und Hilfsschlüssel dieser App */
export function wipeAll() {
  try {
    for (const k of Object.keys(localStorage)) if (k.startsWith(BRAND.storagePrefix + '.')) localStorage.removeItem(k)
  } catch {
    /* Speicher gesperrt: dann ist ohnehin nichts gespeichert */
  }
  state = structuredClone(EMPTY_STORE)
  persist()
  listeners.forEach((l) => l())
}

export function downloadFile(name: string, content: string, type = 'application/json') {
  const blob = new Blob([content], { type })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = name
  document.body.append(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}
