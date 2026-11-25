// Roadtrip aus einer Zeile: wählt passende Straßen aus dem Explorer, ordnet sie und plant Hin- und Rückweg.
import { COUNTRIES } from '../data/countries.ts'
import { ROADS, type Road } from '../data/roads.ts'
import type { Waypoint } from '../store/schema.ts'
import { suits, type CarProfile } from './carprofile.ts'
import { haversineKm } from './gpx.ts'
import { DEFAULT_DETOUR } from './tripplan.ts'
import { parseTrip, type Place, type TripWish } from './quick.ts'

/** Kilometer pro Tag, mit denen der Planer rechnet (in der Planung änderbar) */
export const KM_PER_DAY = 320

let cache: Promise<Place[]> | null = null
/** Orte mit Koordinaten (OpenStreetMap über OpenFreeMap, ODbL), erst bei Bedarf geladen */
export const loadPlaces = () =>
  (cache ??= import('../data/places.json').then((m) =>
    (m.default as unknown as [string, string | 0, string, number, number, number][]).map(([n, en, cc, lat, lon, pop]) => ({ n, en: en || undefined, cc, lat, lon, pop })),
  ))

export type AutoTrip = { wish: TripWish; roads: Road[]; from?: Place; waypoints: Waypoint[]; name: string; problem?: 'nothing' | 'noroads' }

const center = (r: Road) => ({ lat: r.waypoints.reduce((s, w) => s + w.lat, 0) / r.waypoints.length, lon: r.waypoints.reduce((s, w) => s + w.lon, 0) / r.waypoints.length })
const lengthOf = (r: Road) => r.lengthKm ?? (r.waypoints.length > 1 ? r.waypoints.slice(1).reduce((s, w, i) => s + haversineKm(r.waypoints[i], w) * 1.5, 0) : 35)

/** Reihenfolge und Auswahl der Straßen (ohne Netz, ohne Zufall) */
export function chooseRoads(wish: TripWish, roads: Road[] = ROADS, car?: CarProfile | null): { roads: Road[]; via: Waypoint[] } {
  const explicit = wish.targets.filter((t) => t.kind === 'road').map((t) => roads.find((r) => r.id === t.id)!).filter(Boolean)
  const via: Waypoint[] = wish.targets.filter((t) => t.kind === 'place').map((t) => ({ name: t.name, lat: t.lat!, lon: t.lon! }))
  const pool = new Set<Road>()
  for (const t of wish.targets) {
    if (t.kind === 'country') for (const r of roads) if (r.country === t.id) pool.add(r)
    if (t.kind === 'area' || t.kind === 'place') for (const r of roads) if (haversineKm(center(r), { lat: t.lat!, lon: t.lon! }) <= (t.km ?? 150)) pool.add(r)
    // Um eine ausdrücklich genannte Straße herum nur ergänzen, wenn die Reise länger ist
    if (t.kind === 'road' && (wish.days ?? 1) > 1) {
      const e = explicit.find((r) => r.id === t.id)
      if (e) for (const r of roads) if (haversineKm(center(r), center(e)) <= 110) pool.add(r)
    }
  }
  const perDay = car?.kmPerDay ?? KM_PER_DAY
  const budget = wish.days ? wish.days * perDay : explicit.length ? 0 : 2 * perDay
  // Straßen, die nicht zum Auto passen, schlägt der Planer nicht von sich aus vor
  for (const r of [...pool]) if (!suits(r.id, car)) pool.delete(r)
  const tracks = [...pool].filter((r) => r.kind === 'track')
  const whole = [...pool].filter((r) => r.kind !== 'track').sort((a, b) => lengthOf(a) - lengthOf(b))
  for (const r of [...pool]) if (explicit.includes(r) || r.kind === 'track' || lengthOf(r) > Math.max(160, budget * 0.6)) pool.delete(r)
  // Gegend mit nur sehr langen Straßen (z. B. Islands Ringstraße): dann eben die kürzeste davon
  if (!pool.size && !explicit.length && (whole[0] ?? tracks[0])) pool.add(whole[0] ?? tracks[0])
  const start = wish.from ?? (explicit[0] ? center(explicit[0]) : undefined)
  const back = (p: { lat: number; lon: number }) => (wish.from && !wish.oneWay ? haversineKm(p, wish.from) * DEFAULT_DETOUR : 0)
  const out: Road[] = []
  const left = [...explicit]
  const ends = (r: Road) => [r.waypoints[0], r.waypoints[r.waypoints.length - 1]]
  let pos = start
  let km = 0
  const near = (list: Road[]) => {
    if (!pos) return list[0]
    return list.reduce<Road | undefined>((b, r) => {
      const d = (x: Road) => Math.min(...ends(x).map((e) => haversineKm(e, pos!)))
      return !b || d(r) < d(b) ? r : b
    }, undefined)
  }
  const take = (r: Road) => {
    const [a, b] = ends(r)
    if (pos) km += Math.min(haversineKm(pos, a), haversineKm(pos, b)) * DEFAULT_DETOUR
    pos = pos && haversineKm(pos, b) < haversineKm(pos, a) ? a : b
    km += lengthOf(r)
    out.push(r)
  }
  // genannte Straßen immer, dann auffüllen, solange Zeit bleibt
  while (left.length) {
    const r = near(left)!
    left.splice(left.indexOf(r), 1)
    take(r)
  }
  const more = [...pool]
  while (more.length && out.length < 12) {
    const r = near(more)!
    more.splice(more.indexOf(r), 1)
    const [a, b] = ends(r)
    const add = (pos ? Math.min(haversineKm(pos, a), haversineKm(pos, b)) * DEFAULT_DETOUR : 0) + lengthOf(r)
    if (out.length && km + add + back(b) > budget) continue
    take(r)
  }
  return { roads: out, via }
}

export async function autoTrip(text: string, roadWaypoints: (id: string, last?: Waypoint) => Promise<Waypoint[]>, home?: Place, car?: CarProfile | null): Promise<AutoTrip> {
  const places = await loadPlaces()
  const wish = parseTrip(text, ROADS, places, COUNTRIES)
  const base = { wish, roads: [] as Road[], waypoints: [] as Waypoint[], name: text.trim().slice(0, 80) }
  if (!wish.targets.length) {
    if (!wish.from) return { ...base, problem: 'nothing' }
    // nur ein Ort genannt: Rundreise in der Umgebung
    wish.targets.push({ kind: 'place', id: wish.from.n, name: wish.from.n, lat: wish.from.lat, lon: wish.from.lon, km: 220 })
  }
  if (!wish.from && home && wish.targets.every((t) => t.kind !== 'place' || t.name !== home.n)) wish.from = home
  // Ein einzelner Ort ohne Start ist Start und Ziel zugleich
  if (!wish.from && wish.targets.length === 1 && wish.targets[0].kind === 'place') wish.from = places.find((p) => p.n === wish.targets[0].name)
  const { roads, via } = chooseRoads(wish, ROADS, car)
  const extra = via.filter((v) => v.name !== wish.from?.n)
  if (!roads.length && !extra.length) return { ...base, from: wish.from, problem: 'noroads' }
  const wps: Waypoint[] = wish.from ? [{ name: wish.from.n, lat: wish.from.lat, lon: wish.from.lon }] : []
  for (const r of roads) wps.push(...(await roadWaypoints(r.id, wps[wps.length - 1])))
  // Zielorte, die selbst keine Straße sind, ans Ende der Hinreise
  for (const v of extra) wps.push(v)
  if (wish.from && !wish.oneWay && wps.length > 1) wps.push({ name: wish.from.n, lat: wish.from.lat, lon: wish.from.lon })
  const label = wish.targets.map((t) => t.name).join(' & ')
  return { wish, roads, from: wish.from, waypoints: wps, name: wish.from && label !== wish.from.n ? `${wish.from.n} – ${label}` : label }
}
