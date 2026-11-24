// Länderarchitektur: weltweit gleichrangig – Asien, Europa, Amerika, Ozeanien und Naher Osten.
// Jedes Land verknüpft die Welten: Markt (DISCOVER), Straßen und Vermietung (DRIVE), Importregeln (Rechner).
// Koordinaten = ungefähre Landesmitte, nur für Markierungen auf Globus und Karte.
import type { DestKey } from '../data.ts'

export type Region = 'asia' | 'europe' | 'americas' | 'oceania' | 'mideast'
export type Country = {
  id: string
  flag: string
  name: { de: string; en: string }
  region: Region
  lat: number
  lon: number
  /** Linksverkehr? (Fakten, unabhängig vom Fahrzeug) */
  leftHand: boolean
  /** ID in MARKETS (data.ts), wenn es eine Such-Zentrale gibt */
  market?: string
  /** Zielland im Importrechner (DEST in data.ts) */
  dest?: DestKey
  /** Herkunft im Rechner (Japan oder ORIGIN in data.ts) */
  origin?: 'jp' | 'us' | 'uk' | 'ca' | 'au'
  /** Ausgangspunkt der Plattform */
  home?: boolean
}

export const REGIONS: Record<Region, { de: string; en: string }> = {
  asia: { de: 'Asien', en: 'Asia' },
  europe: { de: 'Europa', en: 'Europe' },
  americas: { de: 'Amerika', en: 'Americas' },
  oceania: { de: 'Ozeanien', en: 'Oceania' },
  mideast: { de: 'Naher Osten', en: 'Middle East' },
}

export const COUNTRIES: Country[] = [
  { id: 'jp', flag: '🇯🇵', name: { de: 'Japan', en: 'Japan' }, region: 'asia', lat: 36.2, lon: 138.25, leftHand: true, market: 'jp', origin: 'jp', home: true },
  { id: 'kr', flag: '🇰🇷', name: { de: 'Südkorea', en: 'South Korea' }, region: 'asia', lat: 36.5, lon: 127.9, leftHand: false, market: 'kr' },
  { id: 'hk', flag: '🇭🇰', name: { de: 'Hongkong', en: 'Hong Kong' }, region: 'asia', lat: 22.32, lon: 114.17, leftHand: true, market: 'hk' },
  { id: 'th', flag: '🇹🇭', name: { de: 'Thailand', en: 'Thailand' }, region: 'asia', lat: 15.87, lon: 100.99, leftHand: true, market: 'th' },
  { id: 'my', flag: '🇲🇾', name: { de: 'Malaysia', en: 'Malaysia' }, region: 'asia', lat: 4.21, lon: 101.98, leftHand: true, market: 'my' },
  { id: 'sg', flag: '🇸🇬', name: { de: 'Singapur', en: 'Singapore' }, region: 'asia', lat: 1.35, lon: 103.82, leftHand: true, market: 'sg' },
  { id: 'ae', flag: '🇦🇪', name: { de: 'Vereinigte Arabische Emirate', en: 'United Arab Emirates' }, region: 'mideast', lat: 23.42, lon: 53.85, leftHand: false, market: 'ae' },
  { id: 'de', flag: '🇩🇪', name: { de: 'Deutschland', en: 'Germany' }, region: 'europe', lat: 51.17, lon: 10.45, leftHand: false, market: 'eu', dest: 'DE' },
  { id: 'at', flag: '🇦🇹', name: { de: 'Österreich', en: 'Austria' }, region: 'europe', lat: 47.52, lon: 14.55, leftHand: false },
  { id: 'ch', flag: '🇨🇭', name: { de: 'Schweiz', en: 'Switzerland' }, region: 'europe', lat: 46.82, lon: 8.23, leftHand: false },
  { id: 'fr', flag: '🇫🇷', name: { de: 'Frankreich', en: 'France' }, region: 'europe', lat: 46.6, lon: 2.2, leftHand: false },
  { id: 'it', flag: '🇮🇹', name: { de: 'Italien', en: 'Italy' }, region: 'europe', lat: 42.83, lon: 12.83, leftHand: false },
  { id: 'no', flag: '🇳🇴', name: { de: 'Norwegen', en: 'Norway' }, region: 'europe', lat: 61.0, lon: 8.5, leftHand: false },
  { id: 'ro', flag: '🇷🇴', name: { de: 'Rumänien', en: 'Romania' }, region: 'europe', lat: 45.94, lon: 24.97, leftHand: false },
  { id: 'uk', flag: '🇬🇧', name: { de: 'Großbritannien', en: 'United Kingdom' }, region: 'europe', lat: 54.0, lon: -2.0, leftHand: true, market: 'uk', dest: 'UK', origin: 'uk' },
  { id: 'us', flag: '🇺🇸', name: { de: 'USA', en: 'United States' }, region: 'americas', lat: 39.8, lon: -98.6, leftHand: false, market: 'us', dest: 'US', origin: 'us' },
  { id: 'ca', flag: '🇨🇦', name: { de: 'Kanada', en: 'Canada' }, region: 'americas', lat: 56.13, lon: -106.35, leftHand: false, market: 'ca', dest: 'CA', origin: 'ca' },
  { id: 'au', flag: '🇦🇺', name: { de: 'Australien', en: 'Australia' }, region: 'oceania', lat: -25.27, lon: 133.78, leftHand: true, market: 'au', dest: 'AU', origin: 'au' },
  { id: 'nz', flag: '🇳🇿', name: { de: 'Neuseeland', en: 'New Zealand' }, region: 'oceania', lat: -40.9, lon: 174.89, leftHand: true, dest: 'NZ' },
]

export const countryById = (id?: string) => COUNTRIES.find((c) => c.id === id)
