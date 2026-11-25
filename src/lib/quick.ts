// Freitext verstehen: „BMW M3 E46 2003 120.000 km 35.000 €“ oder „München nach Stilfser Joch, 3 Tage“.
// Läuft nur im Browser, ohne fremden Dienst und ohne KI: Wortlisten und einfache Muster.
import type { CarModel } from '../components/ModelFinder.tsx'
import type { VehicleStatus } from '../store/schema.ts'

export const plain = (s: string) => s.toLowerCase().replace(/ß/g, 'ss').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’']/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim()

const CUR: [RegExp, string][] = [
  [/€|eur(?:o)?/i, 'EUR'],
  [/¥|yen|jpy/i, 'JPY'],
  [/£|gbp|pfund|pounds?/i, 'GBP'],
  [/chf|franken/i, 'CHF'],
  [/\$|usd|dollar/i, 'USD'],
]
const number = (s: string): number => {
  const t = s.replace(/\s/g, '')
  // 35.000 oder 35,000 = Tausender; 7,5 = Dezimal
  if (/^\d{1,3}([.,]\d{3})+$/.test(t)) return parseInt(t.replace(/[.,]/g, ''), 10)
  return parseFloat(t.replace(',', '.'))
}

export type QuickCar = { make: string; model: string; modelId?: string; market?: string; year?: number; mileageKm?: number; price?: { amount: number; cur: string }; status?: VehicleStatus; hit?: CarModel }

/** Auto aus einer Zeile lesen. Das Katalogmodell liefert Marke, Modell, Herkunft und Foto. */
export function parseCar(text: string, all: CarModel[], year = new Date().getFullYear()): QuickCar | null {
  let t = ' ' + text.trim() + ' '
  const out: QuickCar = { make: '', model: '' }
  const N = '(?<![\\p{L}\\d-])(\\d{1,3}(?:[.,]\\d{3})+|\\d+(?:[.,]\\d+)?)'
  const km = t.match(new RegExp(`${N}\\s*(tkm|tsd\\.?\\s*km|k\\s*km|km|kilometer)\\b`, 'iu'))
  if (km) {
    out.mileageKm = Math.round(number(km[1]) * (/^(tkm|tsd|k\s*km)/i.test(km[2]) ? 1000 : 1))
    t = t.replace(km[0], ' ')
  }
  const CURS = '€|eur(?:o)?|¥|yen|jpy|£|gbp|pfund|chf|franken|\\$|usd|dollar'
  const pr = t.match(new RegExp(`${N}\\s*(mio\\.?|millionen|million|k|tsd\\.?)?\\s*(${CURS})(?![a-z])`, 'iu')) ?? t.match(new RegExp(`(€|¥|£|\\$)\\s*${N}\\s*(mio\\.?|million|k)?`, 'iu'))
  if (pr) {
    const lead = /^[€¥£$]$/.test(pr[1])
    const n = number(lead ? pr[2] : pr[1])
    const mul = (lead ? pr[3] : pr[2]) ?? ''
    const c = lead ? pr[1] : pr[3]
    const amount = Math.round(n * (/mio|million/i.test(mul) ? 1e6 : mul ? 1000 : 1))
    if (amount > 0) out.price = { amount, cur: CUR.find(([re]) => re.test(c))?.[1] ?? 'EUR' }
    t = t.replace(pr[0], ' ')
  }
  const st: [RegExp, VehicleStatus][] = [
    [/\b(traum(auto)?|dream)\b/i, 'dream'],
    [/\b(verkauft|sold)\b/i, 'sold'],
    [/\b(geplant|planned)\b/i, 'planned'],
    [/\b(beobachte[nt]?|watch(list)?)\b/i, 'watchlist'],
    [/\b(besitze|habe ich|gehört mir|owned)\b/i, 'owned'],
  ]
  for (const [re, s] of st)
    if (re.test(t)) {
      out.status = s
      t = t.replace(re, ' ')
      break
    }
  const yr = t.match(/(?:\b(?:bj\.?|baujahr|from|von)\s*)?\b(19\d\d|20\d\d)\b/i)
  const y = yr ? +yr[1] : undefined
  const words = plain(t).split(' ').filter(Boolean)
  if (!words.length) return null
  // Katalogtreffer: möglichst viele Wörter, Marke muss passen; Jahreszahl hilft bei der Generation
  let best: { m: CarModel; s: number; used: number } | null = null
  for (const m of all) {
    const name = plain(m.n)
    const hay = new Set(name.split(' '))
    const mk = plain(m.mk).split(' ')
    if (!mk.every((w) => words.includes(w)) && !plain(m.md).split(' ').every((w) => words.includes(w))) continue
    const used = words.filter((w) => hay.has(w)).length
    const md = plain(m.md).split(' ')
    const missing = md.filter((w) => !words.includes(w)).length
    if (used <= (mk.length === used ? used : 0) && !md.some((w) => words.includes(w))) continue
    let s = used * 3 - missing * 1.5 - (hay.size - used) * 0.2
    if (y && m.y0) s += y >= m.y0 - 1 && y <= (m.y1 ?? year) + 1 ? 2 : -2.5
    if (m.usd || m.why) s += 0.6
    if (!best || s > best.s) best = { m, s, used }
  }
  if (best && best.s > 1.2) {
    const { m } = best
    Object.assign(out, { make: m.mk, model: m.md, modelId: m.id, market: m.cc, hit: m })
  } else {
    const raw = t.replace(yr?.[0] ?? '\u0000', ' ').replace(/[,;]/g, ' ').trim().split(/\s+/)
    out.make = raw[0] ?? ''
    out.model = raw.slice(1).join(' ')
  }
  if (y && y <= year + 1) out.year = y
  return out.make || out.model ? out : null
}

/* ------------------------------------------------------------------ Roadtrip */

export type Place = { n: string; en?: string; cc: string; lat: number; lon: number; pop: number }
export type Area = { id: string; de: string; en: string; alias?: string[]; lat: number; lon: number; km: number }
/** Bekannte Fahrgebiete (Mittelpunkt und Umkreis), damit „Dolomiten“ oder „Alpen“ als Ziel reichen */
export const AREAS: Area[] = [
  { id: 'alpen', de: 'Alpen', en: 'Alps', lat: 46.6, lon: 9.6, km: 260 },
  { id: 'dolomiten', de: 'Dolomiten', en: 'Dolomites', lat: 46.5, lon: 11.9, km: 90 },
  { id: 'suedtirol', de: 'Südtirol', en: 'South Tyrol', lat: 46.65, lon: 11.2, km: 100 },
  { id: 'schweizeralpen', de: 'Schweizer Alpen', en: 'Swiss Alps', alias: ['Schweizer Pässe'], lat: 46.55, lon: 8.6, km: 110 },
  { id: 'seealpen', de: 'Französische Alpen', en: 'French Alps', alias: ['Seealpen', 'Route des Grandes Alpes'], lat: 44.9, lon: 6.8, km: 150 },
  { id: 'engadin', de: 'Engadin', en: 'Engadine', lat: 46.5, lon: 9.85, km: 70 },
  { id: 'highlands', de: 'Schottland', en: 'Scotland', alias: ['Highlands', 'Schottische Highlands'], lat: 57.0, lon: -5.0, km: 220 },
  { id: 'wales', de: 'England', en: 'England', lat: 53.2, lon: -2.2, km: 300 },
  { id: 'norwegen', de: 'Norwegen', en: 'Norway', alias: ['Fjorde', 'Fjords'], lat: 62.3, lon: 7.5, km: 420 },
  { id: 'pyrenaeen', de: 'Pyrenäen', en: 'Pyrenees', lat: 42.8, lon: 0.3, km: 180 },
  { id: 'karpaten', de: 'Karpaten', en: 'Carpathians', alias: ['Rumänien', 'Romania'], lat: 45.5, lon: 24.2, km: 160 },
  { id: 'kalifornien', de: 'Kalifornien', en: 'California', lat: 36.4, lon: -120.4, km: 420 },
  { id: 'rockies', de: 'Rocky Mountains', en: 'Rocky Mountains', alias: ['Rockies', 'Colorado'], lat: 39.6, lon: -106.2, km: 300 },
  { id: 'appalachen', de: 'Appalachen', en: 'Appalachians', alias: ['Smoky Mountains'], lat: 35.8, lon: -82.9, km: 300 },
  { id: 'hakone', de: 'Hakone', en: 'Hakone', alias: ['Fuji', 'Izu'], lat: 35.2, lon: 139.0, km: 90 },
  { id: 'island', de: 'Island', en: 'Iceland', lat: 64.9, lon: -18.6, km: 330 },
  { id: 'irland', de: 'Irland', en: 'Ireland', lat: 52.4, lon: -9.4, km: 260 },
  { id: 'slowenien', de: 'Slowenien', en: 'Slovenia', alias: ['Julische Alpen'], lat: 46.4, lon: 13.7, km: 70 },
  { id: 'eifel', de: 'Eifel', en: 'Eifel', lat: 50.35, lon: 6.9, km: 80 },
  { id: 'neuseeland', de: 'Neuseeland', en: 'New Zealand', lat: -44.2, lon: 169.5, km: 420 },
  { id: 'cotedazur', de: 'Côte d’Azur', en: 'French Riviera', alias: ['Monaco', 'Nizza'], lat: 43.8, lon: 7.35, km: 70 },
]

export type TripWish = { from?: Place; targets: { kind: 'road' | 'area' | 'place' | 'country'; id: string; name: string; lat?: number; lon?: number; km?: number }[]; days?: number; oneWay: boolean }

type RoadLike = { id: string; name: string; local?: string; country: string }
type Term = { t: string; kind: 'road' | 'area' | 'place' | 'country'; i: number }

export function parseTrip(text: string, roads: RoadLike[], places: Place[], countries: { id: string; name: { de: string; en: string } }[]): TripWish {
  const wish: TripWish = { targets: [], oneWay: /\b(nur hin|einfach|one way|ohne r(ü|ue)ckfahrt)\b/i.test(text) }
  const s = plain(text)
  const num: Record<string, number> = { ein: 1, einen: 1, eine: 1, one: 1, zwei: 2, two: 2, drei: 3, three: 3, vier: 4, four: 4, funf: 5, five: 5, sechs: 6, sieben: 7 }
  const dm = s.match(/\b(\d{1,2}|ein|einen|eine|one|zwei|two|drei|three|vier|four|funf|five|sechs|sieben) ?(tage?n?|days?|wochen?|weeks?)\b/)
  if (dm) wish.days = Math.min(21, Math.max(1, (num[dm[1]] ?? parseInt(dm[1], 10)) * (/^w/.test(dm[2]) ? 7 : 1)))
  else if (/\b(langes wochenende|long weekend)\b/.test(s)) wish.days = 3
  else if (/\b(wochenende|weekend)\b/.test(s)) wish.days = 2
  else if (/\b(tagestour|tagesausflug|day trip)\b/.test(s)) wish.days = 1
  else if (/\b(woche|week)\b/.test(s)) wish.days = 7

  const terms: Term[] = []
  const add = (n: string | undefined, kind: Term['kind'], i: number, min = 3) => {
    if (!n) return
    const t = plain(n)
    if (t.length >= min) terms.push({ t, kind, i })
  }
  roads.forEach((r, i) => {
    add(r.name, 'road', i)
    for (const part of r.name.split(/[()]/)) add(part, 'road', i, 5)
    const short = plain(r.name).replace(/ (hochalpenstrasse|circuit|highway|raceway|pass|road)$/, '')
    add(short, 'road', i, 6)
    if (/joch$/.test(plain(r.name))) add(plain(r.name).replace(/ ?joch$/, ''), 'road', i, 7)
    if (/pass$/.test(plain(r.name))) add(plain(r.name).replace(/ ?pass$/, ''), 'road', i, 5)
  })
  add('Stelvio', 'road', roads.findIndex((r) => r.id === 'stelvio'))
  add('Nordschleife', 'road', roads.findIndex((r) => r.id === 'nordschleife'))
  add('Nürburgring', 'road', roads.findIndex((r) => r.id === 'nordschleife'))
  add('Spa', 'road', roads.findIndex((r) => r.id === 'w-circuit-de-spa-francorchamps'))
  AREAS.forEach((a, i) => [a.de, a.en, ...(a.alias ?? [])].forEach((n) => add(n, 'area', i)))
  countries.forEach((c, i) => [c.name.de, c.name.en].forEach((n) => add(n, 'country', i)))
  places.forEach((p, i) => {
    for (const n of [p.n, p.en]) add(n, 'place', i)
    // Kurzform: „Garmisch“ für Garmisch-Partenkirchen, „Frankfurt“ für Frankfurt am Main
    add(p.n.split(/-| (?:am|an|im|in|bei|ob|auf) /)[0], 'place', i, 5)
  })
  const prio = { road: 0, area: 1, country: 2, place: 3 }
  terms.sort((a, b) => b.t.length - a.t.length || prio[a.kind] - prio[b.kind] || a.i - b.i)

  // längste Treffer zuerst, jede Textstelle nur einmal
  let rest = ` ${s} `
  const found: (Term & { at: number; before: string })[] = []
  for (const t of terms) {
    const at = rest.indexOf(` ${t.t} `)
    if (at < 0) continue
    const before = rest.slice(0, at).trim().split(' ').pop() ?? ''
    found.push({ ...t, at, before })
    rest = rest.slice(0, at + 1) + '#'.repeat(t.t.length) + rest.slice(at + 1 + t.t.length)
  }
  found.sort((a, b) => a.at - b.at)
  const startWord = /^(von|ab|aus|from)$/
  let from = found.find((f) => f.kind === 'place' && startWord.test(f.before))
  // „München Stelvio“: erster Ort vor anderen Zielen ist der Start
  if (!from && found.length > 1 && found[0].kind === 'place') from = found[0]
  if (from) wish.from = places[from.i]
  for (const f of found) {
    if (f === from) continue
    if (f.kind === 'road') wish.targets.push({ kind: 'road', id: roads[f.i].id, name: roads[f.i].name })
    if (f.kind === 'area') wish.targets.push({ kind: 'area', id: AREAS[f.i].id, name: AREAS[f.i].de, lat: AREAS[f.i].lat, lon: AREAS[f.i].lon, km: AREAS[f.i].km })
    if (f.kind === 'country') wish.targets.push({ kind: 'country', id: countries[f.i].id, name: countries[f.i].name.de })
    if (f.kind === 'place') wish.targets.push({ kind: 'place', id: places[f.i].n, name: places[f.i].n, lat: places[f.i].lat, lon: places[f.i].lon, km: 180 })
  }
  return wish
}
