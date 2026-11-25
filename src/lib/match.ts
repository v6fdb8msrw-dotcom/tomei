// Autofinder: bewertet Katalogmodelle nach nachprüfbaren Merkmalen (Klasse, Baujahr, Gewicht, Antrieb, Karosserie).
// Kein Geschmacksurteil und keine Preisprognose; jeder Punkt hat eine Begründung, die angezeigt wird.
import type { CarModel } from '../components/ModelFinder.tsx'
import type { Spec } from './specs.ts'

export type Use = 'curves' | 'cruise' | 'muscle' | 'offroad' | 'daily' | 'town'
export type Answers = {
  use: Use
  seats: 'two' | 'four' | 'any'
  open: boolean
  era: 'any' | '60' | '70' | '80' | '90' | '00'
  drive: 'any' | 'rear' | 'front' | 'all'
  origin: 'any' | 'jp' | 'us' | 'uk' | 'eu'
  /** nur Autos, deren erste Baujahre die Altersgrenze des Ziellands schon erreichen */
  ageOk: boolean
  manual: boolean
}
export type Reason = { de: string; en: string }
export type Match = { m: CarModel; s: number; why: Reason[] }

const EU = new Set(['de', 'it', 'fr', 'se', 'at', 'nl', 'es', 'be', 'cz'])
const CLASSES: Record<Use, Record<string, number>> = {
  curves: { sports: 4, hot: 3, gt: 1 },
  cruise: { gt: 4, lux: 3, large: 2, sports: 1 },
  muscle: { muscle: 5, pony: 4, sports: 1 },
  offroad: { suv: 4, pickup: 3 },
  daily: { mid: 4, small: 3, hot: 2, lux: 2, van: 2 },
  town: { kei: 5, small: 4, hot: 1 },
}
const ERAS: Record<Exclude<Answers['era'], 'any'>, [number, number]> = { '60': [0, 1969], '70': [1970, 1979], '80': [1980, 1989], '90': [1990, 1999], '00': [2000, 9999] }

const mid = (r?: [number, number]) => (r ? (r[0] + r[1]) / 2 : undefined)
const has = (a: string[] | undefined, re: RegExp) => !!a?.some((x) => re.test(x))

export function matchCars(all: CarModel[], specs: Record<string, Spec>, a: Answers, ageLimit: number | undefined, hasPhoto: (id: string) => boolean, year = new Date().getFullYear()): Match[] {
  const out: Match[] = []
  for (const m of all) {
    const sp = specs[m.id] ?? {}
    const why: Reason[] = []
    const cl = m.cl ? (CLASSES[a.use][m.cl] ?? 0) : 0
    if (!cl) continue
    let s = cl * 2
    const y = m.y0
    if (a.era !== 'any') {
      const [f, t] = ERAS[a.era]
      if (!y || y < f || y > t) continue
      why.push({ de: `ab ${y} gebaut`, en: `built from ${y}` })
    }
    if (a.origin !== 'any') {
      if (a.origin === 'eu' ? !EU.has(m.cc) : m.cc !== a.origin) continue
    }
    if (a.ageOk && ageLimit) {
      if (!y || year - y < ageLimit) continue
      why.push({ de: `früheste Baujahre erreichen die ${ageLimit}-Jahre-Grenze`, en: `earliest cars meet the ${ageLimit}-year threshold` })
    }
    const isOpen = has(sp.body, /convertible|roadster|cabrio|spyder|spider|targa|t-top/i)
    if (a.open) {
      if (!isOpen) continue
      why.push({ de: 'gab es offen', en: 'was available open-top' })
      s += 1
    }
    const twoDoor = has(sp.body, /2-door|3-door|coup|roadster|two-seat/i)
    const fourDoor = has(sp.body, /4-door|5-door|sedan|saloon|estate|wagon/i)
    if (a.seats === 'two') {
      if (sp.body && !twoDoor) continue
      if (twoDoor) (s += 1), why.push({ de: 'Zweitürer', en: 'two-door' })
    }
    if (a.seats === 'four') {
      if (!fourDoor) continue
      s += 1
      why.push({ de: 'gab es als Viertürer oder Kombi', en: 'was available with four doors or as an estate' })
    }
    const lay = sp.lay
    const rear = has(lay, /rear-wheel|\bFR\b|\bRR\b|\bMR\b|RMR/i)
    const front = has(lay, /front-wheel|\bFF\b/i)
    const allw = has(lay, /all-wheel|four-wheel|\b4WD\b|\bAWD\b/i)
    if (a.drive !== 'any') {
      const ok = a.drive === 'rear' ? rear : a.drive === 'front' ? front : allw
      if (!ok) continue
      s += 1
      why.push(a.drive === 'rear' ? { de: 'Hinterradantrieb', en: 'rear-wheel drive' } : a.drive === 'front' ? { de: 'Frontantrieb', en: 'front-wheel drive' } : { de: 'gab es mit Allrad', en: 'was available with all-wheel drive' })
    } else if (a.use === 'offroad' && allw) {
      s += 2
      why.push({ de: 'Allradantrieb', en: 'all-wheel drive' })
    } else if ((a.use === 'curves' || a.use === 'muscle') && rear) {
      s += 1
      why.push({ de: 'Hinterradantrieb', en: 'rear-wheel drive' })
    }
    if (a.manual) {
      if (!has(sp.tr, /manual/i)) continue
      s += 1
      why.push({ de: 'gab es mit Schaltgetriebe', en: 'was available with a manual gearbox' })
    }
    const kg = mid(sp.kg)
    const cc = mid(sp.cc)
    const len = mid(sp.l)
    if (kg && (a.use === 'curves' || a.use === 'town')) {
      if (kg < 1250) {
        s += kg < 1050 ? 3 : 2
        why.push({ de: `leicht, rund ${Math.round(kg / 10) * 10} kg`, en: `light, around ${Math.round(kg / 10) * 10} kg` })
      } else if (kg > 1600) s -= 1
    }
    if (a.use === 'town' && len && len < 3900) {
      s += 2
      why.push({ de: `nur ${(len / 1000).toFixed(2).replace('.', ',')} m lang`, en: `only ${(len / 1000).toFixed(2)} m long` })
    }
    if ((a.use === 'muscle' || a.use === 'cruise') && cc && cc > 3500) {
      s += 2
      why.push({ de: `großer Motor, rund ${(cc / 1000).toFixed(1).replace('.', ',')} Liter`, en: `big engine, around ${(cc / 1000).toFixed(1)} litres` })
    }
    if (m.usd) (s += 1), why.push({ de: 'Angebotspreis Japan bekannt', en: 'asking price in Japan known' })
    if (hasPhoto(m.id)) s += 0.5
    if (m.why) s += 1
    if (sp.lay && sp.body) s += 0.5
    out.push({ m, s, why })
  }
  // Gleichstand ohne Alphabet auflösen und Marken mischen, damit die ersten Vorschläge vielfältig sind
  const hash = (t: string) => [...t].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % 997
  out.sort((x, y) => y.s - x.s || hash(x.m.id) - hash(y.m.id))
  const seen = new Map<string, number>()
  const rank = out.map((o) => {
    const n = seen.get(o.m.mk) ?? 0
    seen.set(o.m.mk, n + 1)
    return { o, r: o.s - Math.min(n, 4) * 0.8 }
  })
  return rank.sort((x, y) => y.r - x.r).map((x) => x.o)
}
