// Wohnort: einmal angeben, dann kennen ihn Roadtrip, Werkstätten und Kosten. Bleibt auf dem Gerät.
import { useSyncExternalStore } from 'react'
export type HomePlace = { n: string; lat: number; lon: number; cc?: string }
const KEY = 'tomei.homeplace'
let cur: HomePlace | null | undefined
const subs = new Set<() => void>()
export function getHome(): HomePlace | null {
  if (cur === undefined) {
    try {
      const o = JSON.parse(localStorage.getItem(KEY) ?? 'null') as HomePlace | null
      cur = o && typeof o.n === 'string' && Number.isFinite(o.lat) && Number.isFinite(o.lon) ? o : null
    } catch {
      cur = null
    }
  }
  return cur
}
export function setHome(p: HomePlace | null) {
  cur = p
  try {
    if (p) localStorage.setItem(KEY, JSON.stringify(p))
    else localStorage.removeItem(KEY)
  } catch {
    /* gilt dann nur bis zum Neuladen */
  }
  subs.forEach((f) => f())
}
export const useHome = () =>
  useSyncExternalStore(
    (f) => (subs.add(f), () => void subs.delete(f)),
    getHome,
    () => null,
  )
