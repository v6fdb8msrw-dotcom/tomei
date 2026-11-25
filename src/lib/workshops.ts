// Werkstätten aus OpenStreetMap (public/data/shops.json, einmalig beim Erstellen geladen). Sortiert nach Passung und Entfernung.
import { haversineKm } from './gpx.ts'

/** n Name, la/lo Lage, c Ort, w Webseite, t Telefon, m Marken (Kürzel), o Oldtimer-Bezug, i frei/unabhängig */
export type Shop = { n: string; la: number; lo: number; c?: string; a?: string; w?: string; t?: string; m?: string[]; o?: 1; d?: 1 }
let cache: Promise<Shop[]> | null = null
export const loadShops = () =>
  (cache ??= fetch(`${import.meta.env.BASE_URL}data/shops.json`)
    .then((r) => (r.ok ? (r.json() as Promise<Shop[]>) : []))
    .catch(() => ((cache = null), [])))

export const makeKey = (s: string) => s.toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g, '')
const SAME: Record<string, string[]> = { mercedesbenz: ['mercedes'], landrover: ['rangerover'], volkswagen: ['vw'] }
const FAMILY: Record<string, RegExp> = {
  jdm: /^(toyota|nissan|honda|mazda|subaru|mitsubishi|suzuki|lexus|daihatsu|isuzu|infiniti|acura|datsun|mitsuoka)$/,
  us: /^(ford|chevrolet|dodge|cadillac|buick|pontiac|chrysler|jeep|plymouth|oldsmobile|amc|lincoln|mercury|gmc|hudson|studebaker|shelby|saturn|eagle)$/,
  italian: /^(ferrari|lamborghini|maserati|alfaromeo|fiat|lancia|abarth|detomaso|autobianchi|iso|bizzarrini|dino)$/,
  british: /^(mg|triumph|jaguar|lotus|austin|rover|mini|morris|tvr|astonmartin|bentley|rollsroyce|landrover|rangerover|ac|bmc|talbot)$/,
}
export type Hit = { s: Shop; km: number; why: 'make' | 'family' | 'classic' | 'dealer' }

export function findShops(all: Shop[], o: { make?: string; year?: number; lat: number; lon: number; maxKm?: number; now?: number }): Hit[] {
  const mk = o.make ? makeKey(o.make) : ''
  const keys = new Set([mk, ...(SAME[mk] ?? [])])
  const fam = Object.keys(FAMILY).filter((k) => FAMILY[k].test(mk))
  const old = !!o.year && (o.now ?? new Date().getFullYear()) - o.year >= 25
  const out: Hit[] = []
  for (const s of all) {
    const km = haversineKm({ lat: o.lat, lon: o.lon }, { lat: s.la, lon: s.lo })
    if (km > (o.maxKm ?? 150)) continue
    const m = s.m ?? []
    const make = m.some((x) => keys.has(x))
    const family = fam.some((f) => m.includes(f)) || (mk !== '' && FAMILY.italian.test(mk) && !s.d && m.some((x) => FAMILY.italian.test(x)))
    if (make) out.push({ s, km, why: s.d ? 'dealer' : 'make' })
    else if (family) out.push({ s, km, why: 'family' })
    else if (old && s.o) out.push({ s, km, why: 'classic' })
    else if (!mk && (s.o || m.length)) out.push({ s, km, why: s.o ? 'classic' : 'make' })
  }
  // Spezialisten dürfen weiter weg sein als der Vertragshändler; bei alten Autos zählt Klassik-Erfahrung mehr
  const bonus = (h: Hit) => (h.why === 'make' ? 45 : h.why === 'family' ? 30 : h.why === 'classic' ? 25 : 0) + (old && h.s.o ? 25 : 0) - (old && h.why === 'dealer' ? 20 : 0)
  return out.sort((a, b) => a.km - bonus(a) - (b.km - bonus(b)))
}
