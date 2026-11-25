// Technische Daten je Modell (aus der Infobox der englischen Wikipedia, beim Erstellen ausgewertet).
import type { Lang } from '../store/schema.ts'

export type Range = [number, number]
export type Spec = {
  /** Länge, Breite, Höhe, Radstand in mm; Gewicht in kg; Hubraum in cm³ (kleinster und größter Wert) */
  l?: Range
  w?: Range
  h?: Range
  wb?: Range
  kg?: Range
  cc?: Range
  eng?: string[]
  body?: string[]
  lay?: string[]
  tr?: string[]
  des?: string[]
  pre?: string[]
  suc?: string[]
  /** Bauzeit; zweiter Wert 0 = wird noch gebaut */
  y?: Range
  gen?: (Spec & { n: string; im?: string })[]
  wp?: string
}

let cache: Promise<Record<string, Spec>> | null = null
let now: Record<string, Spec> | null = null
export const specsIfLoaded = () => now
export const loadSpecs = () => (cache ??= import('../data/models_specs.json').then((m) => (now = m.default as unknown as Record<string, Spec>)))

/** Spanne als Text, z. B. „1.230–1.435“ */
export function rangeText(r: Range | undefined, locale: string, f: (x: number) => number = (x) => x, digits = 0): string | undefined {
  if (!r) return undefined
  const n = (x: number) => f(x).toLocaleString(locale, { maximumFractionDigits: digits, minimumFractionDigits: digits })
  const a = n(r[0])
  const b = n(r[1])
  return a === b ? a : `${a}–${b}`
}

// Häufige Begriffe der englischen Infobox auf Deutsch. Motor- und Modellnamen bleiben unverändert.
const DE: [RegExp, string][] = [
  [/\b(?:longitudinally mounted |transverse(?:ly mounted)? |longitudinal )/gi, ''],
  [/\bfront mid-engine,? /gi, 'Front-Mittelmotor, '],
  [/\brear mid-engine,? |\bmid-engine,? /gi, 'Mittelmotor, '],
  [/\brear-engine,? /gi, 'Heckmotor, '],
  [/\bfront-engine,? /gi, 'Frontmotor, '],
  [/\bfront-wheel[- ]drive/gi, 'Frontantrieb'],
  [/\brear-wheel[- ]drive/gi, 'Hinterradantrieb'],
  [/\b(?:all|four)-wheel[- ]drive/gi, 'Allradantrieb'],
  [/\bFR layout\b/g, 'Frontmotor, Hinterradantrieb'],
  [/\bFF layout\b/g, 'Frontmotor, Frontantrieb'],
  [/\bRR layout\b/g, 'Heckmotor, Hinterradantrieb'],
  [/\bMR layout\b|\bRMR layout\b/g, 'Mittelmotor, Hinterradantrieb'],
  [/\blayout\b/gi, ''],
  [/(\d)-speed /g, '$1-Gang '],
  [/\bautomated manual\b/gi, 'automatisiert'],
  [/\bdual[- ]clutch\b/gi, 'Doppelkupplung'],
  [/\bautomatic\b/gi, 'Automatik'],
  [/\bmanual\b/gi, 'Schaltgetriebe'],
  [/\btransmission\b/gi, ''],
  [/(\d)-door /g, '$1-türig, '],
  [/\bstation wagon\b|\bestate\b|\bwagon\b/gi, 'Kombi'],
  [/\b(?:hardtop )?(?:sedan|saloon)\b/gi, 'Limousine'],
  [/\bhatchback\b/gi, 'Schrägheck'],
  [/\bfastback\b/gi, 'Fließheck'],
  [/\bliftback\b/gi, 'Liftback'],
  [/\bconvertible\b|\bcabriolet\b/gi, 'Cabrio'],
  [/\bcoup[eé]\b/gi, 'Coupé'],
  [/\bpickup(?: truck)?\b/gi, 'Pickup'],
  [/\bsupercharged\b/gi, 'Kompressor'],
  [/\btwin-turbo(?:charged)?\b/gi, 'Biturbo'],
  [/\bturbocharged\b/gi, 'Turbo'],
  [/\b(petrol|gasoline)\b/gi, 'Benzin'],
  [/ {2,}/g, ' '],
]
export function specText(s: string, lang: Lang): string {
  if (lang !== 'de') return s
  let out = s
  for (const [re, to] of DE) out = out.replace(re, to)
  return out.trim().replace(/[ ,]+$/, '')
}

/** „First generation (FD)“ → „1. Generation (FD)“ */
const ORD = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth', 'eleventh', 'twelfth', 'thirteenth']
export function genName(n: string, lang: Lang): string {
  if (lang !== 'de') return n
  return n.replace(new RegExp(`\\b(${ORD.join('|')}) generation\\b`, 'i'), (_, w: string) => `${ORD.indexOf(w.toLowerCase()) + 1}. Generation`)
}
