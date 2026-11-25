// Portale, deren Link direkt die Trefferliste eines Modells öffnet. Jeder Link wurde am 25.11.2026 von Hand im Browser
// geprüft (Beispiel Mazda RX-7). Es werden keine Inserate ausgelesen; ob gerade eins steht, zeigt das Portal.
// when(): nur Portale zeigen, die dieses Modell üblicherweise führen (Herkunft, Baujahr, Klasse).
import type { CarModel } from '../components/ModelFinder.tsx'
import type { MarketQuery } from '../data.ts'

export type PortalId = string
export type ListingPortal = {
  id: PortalId
  name: string
  market: 'jp' | 'us' | 'uk' | 'au' | 'eu'
  kind: { de: string; en: string }
  /** Auktionshaus aus ORIGIN mit veröffentlichtem Aufgeld */
  house?: string
  /** Händler in Japan exportieren selbst, sonst braucht es einen Agenten */
  exporter?: boolean
  url: (q: MarketQuery) => string
  when: (m: Pick<CarModel, 'cc' | 'y0' | 'y1' | 'cl'>) => boolean
}

const slug = (v: string) => v.trim().toLowerCase().replace(/\s+/g, '-')
const enc = (v: string) => encodeURIComponent(v.trim())
const text = (q: MarketQuery) => enc(`${q.make} ${q.model}`)
/** Deutsche Portale: „3 Series“ heißt 3er, „C-Class“ C-Klasse */
const de = (q: MarketQuery) => `${q.make} ${q.model.replace(/(\d) Series/g, '$1er').replace(/([A-Z]+)-Class/g, '$1-Klasse')}`
const last = (m: { y0?: number; y1?: number }) => m.y1 ?? (m.y0 ? new Date().getFullYear() : 9999)
const first = (m: { y0?: number }) => m.y0 ?? 0
const JP = (m: { cc: string }) => m.cc === 'jp'
const MARKET = { de: 'Marktplatz', en: 'Marketplace' }
const AUCTION = { de: 'Online-Auktion, offen für alle', en: 'Online auction, open to all' }

export const LISTING_PORTALS: ListingPortal[] = [
  { id: 'autoscout', name: 'AutoScout24', market: 'eu', kind: MARKET, url: (q) => `https://www.autoscout24.de/lst/${slug(q.make)}/${slug(de(q).slice(q.make.length))}`, when: (m) => m.cc !== 'au' && m.cl !== 'kei' },
  { id: 'mobile', name: 'mobile.de', market: 'eu', kind: MARKET, url: (q) => `https://suchen.mobile.de/fahrzeuge/search.html?isSearchRequest=true&s=Car&vc=Car&q=${enc(de(q))}`, when: (m) => m.cl !== 'kei' },
  { id: 'kleinanzeigen', name: 'Kleinanzeigen', market: 'eu', kind: { de: 'Kleinanzeigen', en: 'Classifieds' }, url: (q) => `https://www.kleinanzeigen.de/s-autos/${slug(de(q))}/k0c216`, when: (m) => m.cl !== 'kei' },
  { id: 'catawiki', name: 'Catawiki', market: 'eu', kind: AUCTION, url: (q) => `https://www.catawiki.com/en/s?q=${text(q)}`, when: (m) => first(m) < 1995 },
  { id: 'carandclassic', name: 'Car & Classic', market: 'uk', kind: { de: 'Marktplatz für Klassiker', en: 'Classic car marketplace' }, url: (q) => `https://www.carandclassic.com/search?q=${text(q)}`, when: (m) => first(m) < 2005 },
  { id: 'ebayuk', name: 'eBay UK', market: 'uk', kind: MARKET, url: (q) => `https://www.ebay.co.uk/sch/9801/i.html?_nkw=${text(q)}`, when: (m) => m.cc === 'uk' || JP(m) },
  { id: 'tcv', name: 'TCV', market: 'jp', exporter: true, kind: { de: 'Export-Marktplatz', en: 'Export marketplace' }, url: (q) => `https://www.tc-v.com/used_car/${slug(q.make)}/${slug(q.model)}/`, when: (m) => JP(m) && last(m) >= 1988 },
  { id: 'goonet', name: 'Goo-net Exchange', market: 'jp', exporter: true, kind: { de: 'Export-Marktplatz', en: 'Export marketplace' }, url: (q) => `https://www.goo-net-exchange.com/usedcars/${enc(q.make.toUpperCase())}/${enc(q.model.toUpperCase().replace(/\s+/g, '_'))}/`, when: (m) => JP(m) && last(m) >= 1985 },
  { id: 'carsensor', name: 'Carsensor', market: 'jp', kind: { de: 'Inlandsmarkt (Japanisch)', en: 'Domestic market (Japanese)' }, url: (q) => `https://www.carsensor.net/usedcar/freeword/${enc(q.model)}/index.html`, when: (m) => JP(m) && last(m) >= 1980 },
  { id: 'yahoo', name: 'Yahoo! Auctions', market: 'jp', kind: { de: 'Online-Auktion (Japanisch)', en: 'Online auction (Japanese)' }, url: (q) => `https://auctions.yahoo.co.jp/search/search?auccat=26360&p=${text(q)}`, when: (m) => JP(m) && last(m) < 2012 },
  { id: 'bat', name: 'Bring a Trailer', market: 'us', house: 'bat', kind: AUCTION, url: (q) => `https://bringatrailer.com/search/?s=${text(q)}`, when: (m) => first(m) < 2015 && !['mid', 'van', 'kei'].includes(m.cl ?? '') },
  { id: 'carsandbids', name: 'Cars & Bids', market: 'us', house: 'cab', kind: AUCTION, url: (q) => `https://carsandbids.com/search?q=${text(q)}`, when: (m) => last(m) >= 1981 && m.cl !== 'kei' },
  { id: 'hemmings', name: 'Hemmings', market: 'us', kind: { de: 'Marktplatz für Klassiker', en: 'Classic car marketplace' }, url: (q) => `https://www.hemmings.com/classifieds/cars-for-sale/${slug(q.make)}/${slug(q.model).replace(/-/g, '')}`, when: (m) => first(m) < 1996 && m.cc !== 'kr' },
  { id: 'classiccom', name: 'CLASSIC.COM', market: 'us', kind: { de: 'Sammelt Auktionen und Händler', en: 'Collects auctions and dealers' }, url: (q) => `https://www.classic.com/search/?q=${text(q)}`, when: (m) => first(m) < 2012 && !['van', 'kei'].includes(m.cl ?? '') },
  { id: 'ebayus', name: 'eBay Motors', market: 'us', kind: MARKET, url: (q) => `https://www.ebay.com/sch/6001/i.html?_nkw=${text(q)}`, when: (m) => m.cc === 'us' },
  { id: 'carsales', name: 'carsales', market: 'au', kind: MARKET, url: (q) => `https://www.carsales.com.au/cars/${slug(q.make)}/${slug(q.model)}/`, when: (m) => m.cc === 'au' },
]

export const portalsFor = (m: Pick<CarModel, 'cc' | 'y0' | 'y1' | 'cl'>) => LISTING_PORTALS.filter((p) => p.when(m))
export const queryOf = (m: { mk: string; md: string }): MarketQuery => ({ make: m.mk, model: m.md.replace(/\s*\(.*\)$/, '') })
