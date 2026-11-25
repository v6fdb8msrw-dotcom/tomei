// Roadtrip-Planung ohne fremden Dienst: Etappen, Tage und Kosten.
// Straßen aus dem Explorer zählen mit ihrer echten Länge (OpenStreetMap-Verlauf), Verbindungen dazwischen
// werden als Luftlinie mal Umwegfaktor geschätzt und überall als Schätzung angezeigt.
import type { Waypoint } from '../store/schema.ts'
import { haversineKm } from './gpx.ts'

export type Leg = { from: number; to: number; km: number; exact: boolean; roadId?: string }
export type Day = { legs: Leg[]; km: number; from: number; to: number }
export type PlanCosts = { consumption: number; fuelPrice: number; nights: number; hotel: number; tolls: number }

export const DEFAULT_DETOUR = 1.35

export function legsOf(wps: Waypoint[], roadKm: Record<string, number>, detour = DEFAULT_DETOUR): Leg[] {
  const out: Leg[] = []
  for (let i = 1; i < wps.length; i++) {
    const via = wps[i].via
    const real = via ? roadKm[via] : undefined
    out.push({ from: i - 1, to: i, km: real ?? haversineKm(wps[i - 1], wps[i]) * detour, exact: real !== undefined, roadId: via })
  }
  return out
}

/** Etappen auf Tage verteilen: neuer Tag, sobald die nächste Etappe das Tagesziel überschreitet */
export function splitDays(legs: Leg[], maxKm: number): Day[] {
  const days: Day[] = []
  for (const l of legs) {
    const d = days[days.length - 1]
    if (!d || (d.km > 0 && d.km + l.km > maxKm)) days.push({ legs: [l], km: l.km, from: l.from, to: l.to })
    else {
      d.legs.push(l)
      d.km += l.km
      d.to = l.to
    }
  }
  return days
}

export function tripCost(km: number, c: PlanCosts) {
  const litres = (km * c.consumption) / 100
  const fuel = litres * c.fuelPrice
  const hotels = c.nights * c.hotel
  return { litres, fuel, hotels, tolls: c.tolls, total: fuel + hotels + c.tolls }
}

/** Punkte für externe Routenplaner: auf Explorer-Straßen Zwischenpunkte setzen, damit die Route wirklich darüber führt */
export function withVia(wps: Waypoint[], geo: Record<string, [number, number][]>): Waypoint[] {
  const out: Waypoint[] = []
  wps.forEach((w, i) => {
    const g = w.via ? geo[w.via] : undefined
    if (g && i > 0) {
      const rev = haversineKm(wps[i - 1], { lat: g[0][0], lon: g[0][1] }) > haversineKm(wps[i - 1], { lat: g[g.length - 1][0], lon: g[g.length - 1][1] })
      for (const f of [1 / 3, 2 / 3]) {
        const p = g[Math.round((rev ? 1 - f : f) * (g.length - 1))]
        out.push({ name: w.name, lat: p[0], lon: p[1] })
      }
    }
    out.push(w)
  })
  return out
}
