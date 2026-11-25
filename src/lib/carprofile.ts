// Was ein Auto für einen Roadtrip bedeutet: Verbrauch, Tagesstrecke, Tankstopps und Straßen, die nicht zu ihm passen.
// Verbrauch und Reichweite sind Annahmen nach Klasse und Baujahr (als „Annahme“ angezeigt und änderbar).
import type { CarModel } from '../components/ModelFinder.tsx'
import type { Spec } from './specs.ts'

export type CarProfile = { consumption: number; kmPerDay: number; rangeKm: number; low: boolean; wide: boolean; why: { de: string; en: string }[] }
const USE: Record<string, number> = { kei: 6, small: 7, hot: 9, mid: 8.5, sports: 10.5, gt: 13, pony: 14, muscle: 17, lux: 12, large: 14, suv: 12.5, pickup: 14, van: 10 }

/** Schotter oder lange unbefestigte Abschnitte */
const GRAVEL = new Set(['w-dalton-highway', 'w-carretera-austral'])
/** Einspurig, sehr eng oder Kopfsteinpflaster */
const NARROW = new Set(['w-hardknott-pass', 'bealach', 'w-conor-pass', 'w-sa-calobra', 'w-mangart-saddle'])
const COBBLE = new Set(['tremola'])

export function carProfile(v: { year?: number } | undefined, m?: CarModel, sp?: Spec): CarProfile | null {
  if (!v && !m) return null
  const year = v?.year ?? m?.y0
  const why: CarProfile['why'] = []
  let use = USE[m?.cl ?? ''] ?? 9
  if (year && year < 1985) use *= 1.12
  if (year && year >= 2012) use *= 0.82
  use = Math.round(use * 2) / 2
  let km = 340
  if (year && year < 1970) (km = 220), why.push({ de: `Baujahr ${year}: ruhige Etappen um 220 km`, en: `Built ${year}: relaxed stages of around 220 km` })
  else if (year && year < 1992) (km = 270), why.push({ de: `Baujahr ${year}: Etappen um 270 km`, en: `Built ${year}: stages of around 270 km` })
  if (m?.cl === 'kei') (km = Math.min(km, 230)), why.push({ de: 'Kei-Car: kürzere Etappen', en: 'Kei car: shorter stages' })
  const h = sp?.h ? (sp.h[0] + sp.h[1]) / 2 : undefined
  const low = h !== undefined ? h < 1290 : ['sports'].includes(m?.cl ?? '')
  const wide = !!sp?.w && (sp.w[0] + sp.w[1]) / 2 > 1930
  if (low) why.push({ de: 'Flaches Auto: Schotter und Kopfsteinpflaster ausgelassen', en: 'Low car: gravel and cobbles left out' })
  if (wide) why.push({ de: 'Breites Auto: sehr enge Pässe ausgelassen', en: 'Wide car: very narrow passes left out' })
  // übliche Tankgröße angenommen: 45 l klein, 60 l sonst, 75 l große Motoren; 80 % nutzbar
  const tank = use < 8 ? 42 : use > 12.5 ? 75 : 58
  return { consumption: use, kmPerDay: km, rangeKm: Math.round((tank * 0.8 * 100) / use / 10) * 10, low, wide, why }
}

export const suits = (roadId: string, p: CarProfile | null | undefined) => !p || !((p.low && (GRAVEL.has(roadId) || COBBLE.has(roadId))) || (p.wide && NARROW.has(roadId)))
