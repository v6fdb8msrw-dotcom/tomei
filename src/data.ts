import { getState } from './store/store.ts'
import FX_SNAPSHOT from './data/fx_snapshot.json'
// Alle Inhalte an einer Stelle: Texte, Links und Bilder lassen sich hier tauschen.
// [REPLACE] markiert Stellen, an denen eigene Fotos oder Videos hingehören.

const img = (name: string) => `${import.meta.env.BASE_URL}images/${name}.webp`

export type Tab = 'home' | 'spots' | 'markets' | 'import' | 'service' | 'rent' | 'parts'

export const TABS: { id: Tab; label: string; long: string }[] = [
  { id: 'home', label: 'Start', long: 'Alles über TŌMEI' },
  { id: 'spots', label: 'Spots', long: 'Top Car Spots in Japan' },
  { id: 'markets', label: 'Märkte', long: 'Fahrzeugmärkte und Auktionen weltweit durchsuchen' },
  { id: 'import', label: 'Import', long: 'JDM nach Deutschland/EU' },
  { id: 'service', label: 'Service', long: 'Kaufen, verschiffen, zulassen: das Komplettpaket' },
  { id: 'rent', label: 'Rent', long: 'JDM mieten in Japan' },
  { id: 'parts', label: 'Parts', long: 'Tuning-Teile & Gadgets' },
]

export type Slide = { src: string; caption: string }

/* ---------------- Spots ---------------- */
export type Spot = { name: string; jp: string; area: string; text: string; img: string; maps: string }

const maps = (q: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`

// [REPLACE] Fotos sind teils Symbolbilder (siehe public/images/CREDITS.md)
export const SPOTS: Spot[] = [
  { name: 'Daikoku PA', jp: '大黒PA', area: 'Yokohama', text: 'Der legendäre Nacht-Treff unter der Autobahnspirale. Freitags und samstags stehen hier GT-Rs neben Kei-Cars.', img: img('daikoku'), maps: maps('Daikoku Parking Area') },
  { name: 'Hakone Turnpike', jp: '箱根ターンパイク', area: 'Kanagawa', text: 'Touge bei Sonnenaufgang: 15 km Kurven mit Blick auf die Sagami-Bucht und den Fuji.', img: img('hakone'), maps: maps('Hakone Turnpike') },
  { name: 'Umihotaru', jp: '海ほたる', area: 'Tokyo-Bucht', text: 'Raststätte mitten im Meer auf der Aqua-Line. Halb Brücke, halb Tunnel, rundum Wasser.', img: img('umihotaru'), maps: maps('Umihotaru Parking Area') },
  { name: 'Tatsumi PA', jp: '辰巳PA', area: 'Tokio', text: 'Kleiner Parkplatz, große Skyline. Startpunkt für Nachtfahrten über die Shuto-Schleifen.', img: img('tatsumi'), maps: maps('Tatsumi Parking Area') },
  { name: 'Shibuya Crossing', jp: '渋谷', area: 'Tokio', text: 'Neon, Menschenmassen und langsames Cruisen über die berühmteste Kreuzung der Welt.', img: img('shibuya'), maps: maps('Shibuya Crossing') },
  { name: 'Mount Fuji & Fuji Speedway', jp: '富士', area: 'Shizuoka', text: 'Rennstrecke mit Bergkulisse. Ein Trackday am Fuji gehört auf jede JDM-Liste.', img: img('fuji'), maps: maps('Fuji Speedway') },
  { name: 'Wangan', jp: '湾岸線', area: 'Tokio–Yokohama', text: 'Die Bayshore-Route: lange Geraden, Rainbow Bridge und die Geschichten aus den 90ern.', img: img('wangan'), maps: maps('Bayshore Route Tokyo') },
  { name: 'Fuji Five Lakes', jp: '富士五湖', area: 'Yamanashi', text: 'Seen, Wälder und Landstraßen am Fuß des Fuji. Das perfekte Fotomotiv für dein Auto.', img: img('fuji-lakes'), maps: maps('Lake Kawaguchiko') },
]

/* ---------------- Anbieter ---------------- */
export type Provider = { name: string; text: string; url: string; tag?: string }

export const RENT: Provider[] = [
  { name: 'Fun2Drive', text: 'Größte JDM-Flotte nahe Fuji und Hakone (GT-R, NSX, Supra, RX-7).', url: 'https://fun2drive-japan.com/' },
  { name: 'OnlyJDM', text: 'JDM-Vermietung in Tokio: GT-R, Supra, GR Yaris. IDP wird akzeptiert.', url: 'https://only-jdm.com/' },
  { name: 'JDM Rental Japan', text: 'Flotte für Fans: Supra 2JZ, R34/ER34, RX-7 FD.', url: 'https://www.jdmrentaljapan.com/' },
  { name: 'Ichioku Tours', text: 'Vermietung in Tokio plus geführte Touren, Betreuung in 17 Sprachen.', url: 'https://rent.ichioku.net/' },
  { name: 'Samurai Car Japan', text: 'Fahrten von Tokio zum Daikoku PA mit R35, R34, RX-7 und Supra.', url: 'https://samuraicarjapanjdm.jp/' },
  { name: 'Magarigawa Club', text: 'Private Rennstrecke für Mitglieder nahe Tokio (Trackday).', url: 'https://www.magarigawa.com/en/', tag: 'Rennstrecke' },
]

export const IMPORTERS: Provider[] = [
  { name: 'Beyond Cars Japan', text: 'Deutsches Team in Nagoya, voller Auktionszugang und Reimport.', url: 'https://beyondcars.jp/' },
  { name: 'Import Brothers', text: 'DE-Spezialist für Importe aus JP, US und UK, alles aus einer Hand.', url: 'https://www.import-brothers.de/' },
  { name: 'LPL Automotive', text: 'Import JP→DE inklusive RoRo/Container und Zoll.', url: 'https://www.lplauto.com/auto_import_japan.html' },
  { name: 'KFZONE', text: 'Bieten auf Auktionen, Versand, TÜV-Vollabnahme und Zulassung.', url: 'https://kfzone.de/' },
  { name: 'MidoriWorks', text: 'JDM-Beschaffung auf Auktionsniveau mit Inspektionsberichten vor Ort.', url: 'https://www.midoriworks.com/de' },
  { name: 'Provide Cars', text: 'USS/TAA/Aucnet-Auktionen und Festpreis-Bestand, RoRo nach Bremerhaven.', url: 'https://providecars.co.jp/de' },
]

export const PARTS: Provider[] = [
  { name: 'Nengun Performance', text: 'HKS, Nismo, GReddy, Blitz, RAYS: Teile, Bodykits und Felgen.', url: 'https://www.nengun.com/' },
  { name: 'RHDJapan', text: 'Riesiger JDM-Katalog inklusive kompletter Bodykits und Felgen.', url: 'https://www.rhdjapan.com/' },
  { name: 'BlackHawkJapan', text: 'Original- und Zubehörteile, Support in mehreren Sprachen.', url: 'https://www.blackhawkjapan.com/' },
  { name: 'PerfectRun Japan', text: 'ADVAN/RAYS-Felgen, HKS, APEXi, TEIN, BRIDE.', url: 'https://perfectrun.jp/' },
  { name: 'JDMDistro', text: 'JDM-Felgen, Motoren und Teile, weltweiter Versand.', url: 'https://jdmdistro.com/' },
]

/* ---------------- Export-Agenten mit veröffentlichten Gebühren ---------------- */
// Nur Firmen, die ihre Preise öffentlich nennen. Alle Werte in Yen je Auto, von der jeweiligen Webseite, Stand 17.11.2026.
// fee(h): Service-Gebühr beim Hammerpreis h; fixed: weitere feste Posten (Auktionshaus, Exportzoll); inland: Transport zum Hafen.
export type Agent = {
  id: string
  name: string
  url: string
  source: string
  kind: string
  fee: (h: number) => number | null // null = nur auf Anfrage
  fixed: number
  inland: number
  fixedNote: string
  text: string
}
const JP_INLAND = 25000 // typischer Transport Auktion → Hafen laut Integrity Exports (8.000–60.000 ¥)
export const AGENTS: Agent[] = [
  {
    id: 'integrity', name: 'Integrity Exports', url: 'https://integrityexports.com/', source: 'https://integrityexports.com/buying-from-us/charges/', kind: 'Auktions-Agent',
    fee: (h) => 70000 + 0.05 * h, fixed: 16000, inland: JP_INLAND, fixedNote: 'Exportzoll 16.000 ¥',
    text: '70.000 ¥ + 5 % vom Hammerpreis (mit Vorkasse bis 1 Mio. ¥: nur 70.000 ¥). Keine Gebühr fürs Bieten, Übersetzen oder Fotos.',
  },
  {
    id: 'brave', name: 'Brave Auto International', url: 'https://braveautoint.com/', source: 'https://braveautoint.com/', kind: 'Auktions-Agent',
    fee: (h) => 70000 + 0.05 * Math.max(0, h - 1000000), fixed: 40000, inland: JP_INLAND, fixedNote: 'Auktionshaus 20.000 ¥ + Exportzoll 20.000 ¥',
    text: '70.000 ¥ pauschal, über 1 Mio. ¥ zusätzlich 5 % auf den Teil darüber. Transport zum Hafen zum Selbstkostenpreis.',
  },
  {
    id: 'provide', name: 'Provide Cars', url: 'https://providecars.co.jp/de', source: 'https://providecars.co.jp/bank-info/service-and-commission', kind: 'Auktions-Agent',
    fee: (h) => 90000 + 0.05 * h, fixed: 0, inland: JP_INLAND, fixedNote: 'Auktionsgebühren und Exportpapiere inklusive',
    text: 'Privatkunden: 90.000 ¥ + 5 %. USS, TAA, Aucnet und Festpreis-Bestand, deutschsprachig, RoRo nach Bremerhaven.',
  },
  {
    id: 'aaj', name: 'Auction Agent Japan', url: 'https://auctionagentjapan.com/', source: 'https://auctionagentjapan.com/', kind: 'Auktions-Agent',
    fee: (h) => 115000 + 10000 * Math.ceil(Math.max(0, h - 1000000) / 500000), fixed: 0, inland: JP_INLAND, fixedNote: 'Versandnebenkosten extra',
    text: '115.000 ¥ bis 1 Mio. ¥ (1–2 Autos im Monat), je weitere 500.000 ¥ plus 10.000 ¥.',
  },
  {
    id: 'jtrade', name: 'Japan Tradings', url: 'https://japan-tradings.com/', source: 'https://japan-tradings.com/agent-fee/', kind: 'Auktions-Agent',
    fee: (h) => (h <= 1000000 ? 80000 : null), fixed: 0, inland: JP_INLAND, fixedNote: 'Transport zum Hafen je nach Auktion 0–38.000 ¥',
    text: '80.000 ¥ pauschal für Autos bis 1 Mio. ¥, darüber nur auf Anfrage. 100.000 ¥ Anzahlung.',
  },
]
/** Deutsche Komplett-Importeure mit veröffentlichtem Festpreis (in €, ersetzt den Agenten in Deutschland) */
export const IMPORT_FLAT = [
  {
    id: 'jpimport', name: 'JP-Importcars.de', url: 'https://www.jp-importcars.de/', source: 'https://www.jp-importcars.de/?lang=en', eur: 1990,
    text: 'Service-Pauschale 1.990 €: Suche, Kauf in Japan, Versand, Zoll und Hilfe bei der Zulassung. Fracht, Zoll, Steuer und TÜV kommen dazu.',
  },
]
/** Durchschnitt aller Agenten, die beim Hammerpreis h einen Preis nennen (Service + feste Posten + Hafentransport) */
export function agentTotal(a: Agent, h: number) {
  const f = a.fee(h)
  return f === null ? null : Math.round(f + a.fixed + a.inland)
}
export function agentAverage(h: number) {
  const v = AGENTS.map((a) => agentTotal(a, h)).filter((x): x is number => x !== null)
  return v.length ? Math.round(v.reduce((s, x) => s + x, 0) / v.length) : 0
}

/* ---------------- Rechner ---------------- */
export type DestKey = 'DE' | 'UK' | 'US' | 'AU' | 'CA' | 'NZ'
export type Dest = {
  name: string
  flag: string
  cur: 'EUR' | 'GBP' | 'USD' | 'AUD' | 'CAD' | 'NZD'
  port: string
  duty: number // Prozent
  vat: number // Prozent
  vatLabel: string
  epa?: boolean // EU-Japan-Abkommen: Zoll kann auf 0 % fallen
  freight: { roro: number; container: number }
  fees: { clearance: number; agent: number; inland: number; inspection: number; reg: number }
  inspectionLabel: string
  note: string
  /** Belegte Einzelposten (Rest der Gebühren bleibt Schätzwert) */
  feeSources?: { de: string; en: string; url: string }[]
}

export const DEST: Record<DestKey, Dest> = {
  DE: {
    name: 'Deutschland', flag: '🇩🇪', cur: 'EUR', port: 'Bremerhaven', duty: 10, vat: 19, vatLabel: 'EUSt', epa: true,
    freight: { roro: 1200, container: 2200 },
    fees: { clearance: 250, agent: 500, inland: 350, inspection: 1000, reg: 600 },
    inspectionLabel: 'TÜV / Einzelabnahme §21',
    note: 'Pkw-Drittlandszoll 10 %. Das EU-Japan-Abkommen (EPA) kann ihn mit Ursprungsnachweis auf 0 % senken, bei Gebrauchtimporten aber selten. TÜV-Vollabnahme und ggf. Scheinwerfer-Umrüstung nötig.',
    // Stand 24.11.2026. Zollabwicklung, Hafen, Inlandstransport und Zulassung/Umbau: keine veröffentlichten Festpreise gefunden.
    feeSources: [
      {
        de: 'Vollgutachten § 21 StVZO bis 3,5 t: 116,50 € Grundentgelt plus 35 € je Viertelstunde Aufwand (TÜV NORD, Entgeltliste 2025). Der Schätzwert im Rechner enthält zusätzlich mögliche Umbauten wie Scheinwerfer.',
        en: 'Full inspection under § 21 StVZO up to 3.5 t: €116.50 base fee plus €35 per quarter hour of work (TÜV NORD price list 2025). The calculator’s estimate also covers possible conversions such as headlights.',
        url: 'https://tuev-nord.de/fileadmin/Content/TUEV_NORD_DE/verkehr/pdf/pk-td-entgeltliste-25-01.pdf',
      },
    ],
  },
  UK: {
    name: 'Großbritannien', flag: '🇬🇧', cur: 'GBP', port: 'Southampton', duty: 10, vat: 20, vatLabel: 'VAT',
    freight: { roro: 1100, container: 2000 },
    fees: { clearance: 300, agent: 500, inland: 300, inspection: 450, reg: 350 },
    inspectionLabel: 'IVA-Test',
    note: '10 % Zoll + 20 % VAT. IVA-Test und DVLA-Registrierung. Rechtslenker sind hier kein Thema.',
  },
  US: {
    name: 'USA', flag: '🇺🇸', cur: 'USD', port: 'Los Angeles', duty: 2.5, vat: 0, vatLabel: 'Bundes-VAT',
    freight: { roro: 1500, container: 2800 },
    fees: { clearance: 400, agent: 300, inland: 600, inspection: 0, reg: 500 },
    inspectionLabel: 'EPA/DOT-Freigabe',
    note: '25-Jahre-Regel (FMVSS-Ausnahme). 2,5 % Zoll auf Pkw (25 % auf Pickups!). Keine Bundes-MwSt, Sales Tax fällt erst bei der Zulassung im Bundesstaat an.',
  },
  AU: {
    name: 'Australien', flag: '🇦🇺', cur: 'AUD', port: 'Melbourne', duty: 5, vat: 10, vatLabel: 'GST',
    freight: { roro: 1600, container: 3000 },
    fees: { clearance: 500, agent: 600, inland: 500, inspection: 1000, reg: 500 },
    inspectionLabel: 'Compliance / Asbest-Test',
    note: '5 % Zoll + 10 % GST. Import Approval (SEVS/Specialist) zwingend, Asbest-Test, Compliance teuer. Ggf. Luxury Car Tax.',
  },
  CA: {
    name: 'Kanada', flag: '🇨🇦', cur: 'CAD', port: 'Vancouver', duty: 6.1, vat: 5, vatLabel: 'GST',
    freight: { roro: 1600, container: 2900 },
    fees: { clearance: 400, agent: 325, inland: 400, inspection: 200, reg: 100 },
    inspectionLabel: 'RIV-Prüfung',
    note: '15-Jahre-Regel. 6,1 % Zoll + 5 % GST (+ Provinz-Steuer bei Zulassung). RIV-Gebühr und A/C-Excise möglich.',
  },
  NZ: {
    name: 'Neuseeland', flag: '🇳🇿', cur: 'NZD', port: 'Auckland', duty: 0, vat: 15, vatLabel: 'GST',
    freight: { roro: 1500, container: 2700 },
    fees: { clearance: 400, agent: 0, inland: 300, inspection: 350, reg: 250 },
    inspectionLabel: 'Entry Certification',
    note: '0 % Zoll + 15 % GST. Entry Certification (VIN/Compliance) und Biosecurity-Reinigung Pflicht.',
  },
}

/* ---------------- Herkunftsländer außer Japan (Ziel immer Deutschland) ---------------- */
// Stand 18.11.2026. Nur Gebühren und Frachtpreise, die eine Firma oder eine Übersicht veröffentlicht.
// Wo es keinen veröffentlichten Preis gibt (Fracht ab Kanada, Australien, Spedition ab England), bleibt das Feld leer.
export type OriginKey = 'jp' | 'us' | 'uk' | 'ca' | 'au'
export type House = { id: string; name: string; url: string; source: string; text: string; fee: (h: number) => number }
export type ShipMode = { id: string; label: string; cost: number | null; cur: string; text: string; source?: string; selfDrive?: boolean }
export type OriginDef = {
  name: string
  flag: string
  cur: 'USD' | 'GBP' | 'CAD' | 'AUD'
  houses: House[]
  ship: ShipMode[]
  /** Hafen- und Zollabwicklung in Bremerhaven (€), wenn veröffentlicht */
  destHandling?: { eur: number; text: string; source: string }
  /** Zollpräferenz, mit der der Zoll entfallen kann */
  pref?: { label: string; text: string; source: string }
  note: string
}

const pct = (p: number, min = 0, max = Infinity) => (h: number) => (h <= 0 ? 0 : Math.min(max, Math.max(min, h * p)))
const tier = (p1: number, cap: number, p2: number) => (h: number) => Math.min(h, cap) * p1 + Math.max(0, h - cap) * p2
const CLASSIC_FEES = 'https://support.classic.com/auction-fees-and-prices'
const PRIVATE: House = { id: 'private', name: 'Privat / Händler', url: '', source: '', text: 'Kauf ohne Auktion: kein Aufgeld.', fee: () => 0 }

export const ORIGIN: Record<Exclude<OriginKey, 'jp'>, OriginDef> = {
  us: {
    name: 'USA', flag: '🇺🇸', cur: 'USD',
    houses: [
      { id: 'bat', name: 'Bring a Trailer', url: 'https://bringatrailer.com/', source: CLASSIC_FEES, text: '5 % Käufergebühr, mindestens 250 $, höchstens 7.500 $.', fee: pct(0.05, 250, 7500) },
      { id: 'cab', name: 'Cars & Bids', url: 'https://carsandbids.com/', source: CLASSIC_FEES, text: '5 % Käufergebühr, mindestens 225 $, höchstens 7.500 $.', fee: pct(0.05, 225, 7500) },
      { id: 'mecum', name: 'Mecum', url: 'https://www.mecum.com/', source: CLASSIC_FEES, text: '10 % Aufgeld vor Ort (12 % am Telefon).', fee: pct(0.1) },
      { id: 'bj', name: 'Barrett-Jackson', url: 'https://www.barrett-jackson.com/', source: CLASSIC_FEES, text: '10 % Aufgeld vor Ort (12 % schriftlich).', fee: pct(0.1) },
      { id: 'rm', name: 'RM Sotheby\'s', url: 'https://rmsothebys.com/', source: CLASSIC_FEES, text: '12 % bis 250.000 $, darüber 10 %.', fee: tier(0.12, 250000, 0.1) },
      { id: 'bonhams-us', name: 'Bonhams (USA)', url: 'https://www.bonhams.com/', source: CLASSIC_FEES, text: '12 % bis 250.000 $, darüber 10 %.', fee: tier(0.12, 250000, 0.1) },
      PRIVATE,
    ],
    ship: [
      { id: 'east', label: 'Container ab Ostküste', cost: 1100, cur: 'USD', text: 'Sammelcontainer New Jersey → Bremerhaven, ab 1.100 $, 30–33 Tage.', source: 'https://www.wcshipping.com/ship-bring-a-trailer-car-germany' },
      { id: 'south', label: 'Container ab Florida', cost: 1225, cur: 'USD', text: 'Sammelcontainer Florida → Bremerhaven, 1.225 $, 31–34 Tage.', source: 'https://www.wcshipping.com/ship-bring-a-trailer-car-germany' },
      { id: 'west', label: 'Container ab Kalifornien', cost: 1850, cur: 'USD', text: 'Sammelcontainer Kalifornien → Bremerhaven, 1.850 $, 40–45 Tage.', source: 'https://www.wcshipping.com/ship-bring-a-trailer-car-germany' },
      { id: 'roro', label: 'RoRo', cost: 1695, cur: 'USD', text: 'RoRo nach Bremerhaven, Listenpreis 1.695–1.995 $ je Auto.', source: 'https://alltransportdepot.com/ship-a-car-to-germany' },
    ],
    destHandling: { eur: 625, text: 'Hafen- und Zollabwicklung in Bremerhaven etwa 600–650 € je Auto, ohne Zoll und EUSt.', source: 'https://www.wcshipping.com/ship-bring-a-trailer-car-germany' },
    pref: {
      label: 'US-Ursprung (0 %)',
      text: 'Seit 1. Juli 2026 erhebt die EU auf Pkw mit US-Ursprung keinen Zoll (VO (EU) 2026/1455, befristet bis 31.12.2029). Gilt nur für in den USA gebaute Autos und braucht einen Ursprungsnachweis, den es bei alten Autos oft nicht gibt; der Zoll entscheidet.',
      source: 'https://www.wcshipping.com/blog/eu-car-import-duties-turnberry-deal',
    },
    note: 'Fracht ab US-Hafen; der Transport zum Hafen kommt dazu. In den USA gebaute Autos können seit Juli 2026 zollfrei sein, Oldtimer ab 30 Jahren ohnehin (0 % Zoll, 7 % EUSt).',
  },
  uk: {
    name: 'Großbritannien', flag: '🇬🇧', cur: 'GBP',
    houses: [
      { id: 'bonhams-uk', name: 'Bonhams (UK)', url: 'https://www.bonhams.com/', source: CLASSIC_FEES, text: '15 % bis 500.000 £, darüber 12 %.', fee: tier(0.15, 500000, 0.12) },
      { id: 'iconic', name: 'Iconic Auctioneers', url: 'https://www.iconicauctioneers.com/', source: CLASSIC_FEES, text: '12,5 % bis 300.000 £, darüber 10 %, jeweils plus 20 % VAT auf das Aufgeld.', fee: (h) => tier(0.125, 300000, 0.1)(h) * 1.2 },
      { id: 'cc', name: 'Collecting Cars', url: 'https://collectingcars.com/', source: CLASSIC_FEES, text: '7,2 % inkl. VAT, Mindest- und Höchstbetrag je nach Standort.', fee: pct(0.072) },
      PRIVATE,
    ],
    ship: [
      { id: 'drive', label: 'Selbst fahren (Fähre)', cost: 85, cur: 'EUR', selfDrive: true, text: 'Abholen und selbst über den Kanal fahren: Fähre ab etwa 85 €, Eurotunnel ab etwa 100 €. Sprit, Kurzzeitkennzeichen und Versicherung kommen dazu.', source: 'https://www.ferryscanner.com/de/blog/mit-dem-auto-nach-london' },
      { id: 'truck', label: 'Spedition', cost: null, cur: 'EUR', text: 'Speditionen nennen für England → Deutschland keine festen Preise. Trag ein Angebot ein.' },
    ],
    pref: {
      label: 'UK-Ursprung (0 %)',
      text: 'Nach dem Handelsabkommen EU–UK sind Waren mit britischem Ursprung zollfrei, wenn der Ursprung erklärt wird. Bei alten Gebrauchtwagen ist das schwer nachzuweisen; der Zoll entscheidet.',
      source: 'https://www.zoll.de/DE/Fachthemen/Warenursprung-Praeferenzen/Praeferenzen/Praeferenzraeume/TCA/tca_node.html',
    },
    note: 'Großbritannien ist kein EU-Land mehr: Zoll und EUSt fallen an. Rechtslenker brauchen in Deutschland keinen Umbau, aber die Scheinwerfer müssen passen.',
  },
  ca: {
    name: 'Kanada', flag: '🇨🇦', cur: 'CAD',
    houses: [PRIVATE],
    ship: [{ id: 'quote', label: 'Container', cost: null, cur: 'CAD', text: 'Für Kanada → Bremerhaven gibt es keine veröffentlichten Preise. Trag ein Angebot ein (Halifax und Montreal sind die üblichen Häfen).' }],
    note: 'Kanada hat keine großen Klassiker-Auktionshäuser mit festen Gebühren; gekauft wird meist über AutoTrader.ca oder Kijiji.',
  },
  au: {
    name: 'Australien', flag: '🇦🇺', cur: 'AUD',
    houses: [
      { id: 'shannons', name: 'Shannons', url: 'https://auctions.shannons.com.au/', source: 'https://auctions.shannons.com.au/auctions/2022-shannons-spring-timed-online-auction/P51QKC10N7BQ6D86/', text: '5 % Aufgeld inkl. GST (Bedingungen einer Online-Auktion von 2022, je Auktion prüfen).', fee: pct(0.05) },
      { id: 'bonhams-au', name: 'Bonhams (Australien)', url: 'https://www.bonhams.com/', source: CLASSIC_FEES, text: '15 % bis 100.000 A$, darüber 10 %.', fee: tier(0.15, 100000, 0.1) },
      PRIVATE,
    ],
    ship: [{ id: 'quote', label: 'Container', cost: null, cur: 'AUD', text: 'Für Australien → Bremerhaven gibt es keine veröffentlichten Preise. Trag ein Angebot ein (6–10 Wochen Laufzeit).' }],
    note: 'Australische Klassiker sind oft Rechtslenker. Für die Ausfuhr braucht es meist eine Spedition, die Container und Papiere übernimmt.',
  },
}

// JPY → Zielwährung (EZB-Kurs vom 27.10.2026), wird beim Laden durch den Tageskurs ersetzt (Frankfurter-API)
// Ersatzkurse (1 ¥ = …), EZB vom 16.11.2026; AED über die feste Bindung 3,6725 AED je USD
export const AED_PER_USD = 3.6725
// EZB-Kurse vom letzten Build (tools/fx-snapshot.mjs), falls der Live-Abruf nicht klappt
export const FX_DATE: string = FX_SNAPSHOT.date
export const FX_FALLBACK: Record<string, number> = { ...FX_SNAPSHOT.rates, AED: FX_SNAPSHOT.rates.USD * AED_PER_USD }

export type Car = { id: string; model: string; chassis: string; year: number; grade: string; km: number; jpy: number; img: string; tag: string }

const car = (name: string) => `${import.meta.env.BASE_URL}images/cars/${name}.webp`

// Beispiel-Listings mit realistischen Marktpreisen, keine Live-Auktionsdaten. Echte Fotos (CREDITS.md)
export const CARS: Car[] = [
  { id: 'r34', model: 'Nissan Skyline GT-R', chassis: 'BNR34', year: 1999, grade: '4.5', km: 78000, jpy: 14500000, img: car('r34'), tag: 'Holy Grail' },
  { id: 'fd', model: 'Mazda RX-7 Type RS', chassis: 'FD3S', year: 1998, grade: '4', km: 95000, jpy: 5200000, img: car('fd'), tag: 'Rotary' },
  { id: 's15', model: 'Nissan Silvia Spec-R', chassis: 'S15', year: 2000, grade: '4', km: 88000, jpy: 4100000, img: car('s15'), tag: 'Drift' },
  { id: 'evo', model: 'Mitsubishi Lancer Evo VI', chassis: 'CP9A', year: 1999, grade: '4', km: 102000, jpy: 3800000, img: car('evo'), tag: 'Rally' },
  { id: 'ek9', model: 'Honda Civic Type R', chassis: 'EK9', year: 1998, grade: '4', km: 110000, jpy: 2600000, img: car('ek9'), tag: 'VTEC' },
  { id: 'kei', model: 'Daihatsu Hijet Truck', chassis: 'S500P', year: 2016, grade: '4', km: 42000, jpy: 750000, img: car('kei'), tag: 'Kei' },
]

/* ---------------- Hero-Bilder je Reiter ---------------- */
// [REPLACE] eigene Drohnen-Aufnahmen: einfach weitere Bilder in die Listen setzen
export const HERO: Record<'spots' | 'rent' | 'import' | 'parts', Slide[]> = {
  spots: SPOTS.map((s) => ({ src: s.img, caption: `${s.name} · ${s.jp}` })),
  rent: [
    { src: img('rent-supra'), caption: 'Weißer Supra auf seinem Heimatboden' },
    { src: img('rent-track'), caption: 'Trackday auf der Rennstrecke' },
    { src: img('hakone'), caption: 'Hakone bei Sonnenaufgang' },
  ],
  import: [
    { src: img('import-ship'), caption: 'Autotransporter im Hafen' },
    { src: img('import-port'), caption: 'Tokio → Bremerhaven' },
    { src: img('fuji-lakes'), caption: 'Bald in deiner Garage' },
  ],
  parts: [
    { src: img('parts-show'), caption: 'Tokyo-Auto-Salon-Feeling' },
    { src: img('parts-wheel'), caption: 'Felgen direkt aus Japan' },
    { src: img('parts-engine'), caption: 'Motorraum, made in Japan' },
  ],
}

export const DASAI_URL = 'https://dasai.com.au/'
// [REPLACE] eigene Kontaktadresse und Instagram-Profil eintragen, leer = „folgt“
export const CONTACT_URL = ''
export const INSTAGRAM_URL = ''


/* ---------------- Märkte weltweit (Such-Zentrale) ----------------
   TŌMEI liest keine Inserate aus (Auslesen verbieten die Portale). Die Suche öffnet die öffentlichen
   Ergebnisseiten der Portale mit deinem Fahrzeug, oder eine gezielte Suche, wo die Portale keine festen Adressen haben. */
export type MarketQuery = { make: string; model: string; from?: number; to?: number }
export type Portal = { name: string; kind: string; url: (q: MarketQuery) => string }
export type Market = { id: string; cur: string; code: string; country: string; hub: string; text: string; x: number; y: number; portals: Portal[] }

const slug = (v: string) => v.trim().toLowerCase().replace(/\s+/g, '-')
const site = (domain: string) => (q: MarketQuery) =>
  `https://www.google.com/search?q=${encodeURIComponent(`site:${domain} ${q.make} ${q.model}${q.from ? ` ${q.from}` : ''}`.trim())}`
const path = (base: string, f: (make: string, model: string) => string) => (q: MarketQuery) =>
  base + f(slug(q.make), slug(q.model)).replace(/\/{2,}/g, '/')

export const MARKETS: Market[] = [
  {
    id: 'jp', cur: 'JPY', code: 'JP', country: 'Japan', hub: 'Yokohama · Nagoya · Kobe', x: 94, y: 36,
    text: 'Der größte Markt für JDM: Hunderttausende Autos pro Woche über USS, TAA, JU und Co. Rechtslenker, oft wenig Kilometer.',
    portals: [
      { name: 'TCV', kind: 'Export-Marktplatz', url: path('https://www.tc-v.com/used_car/', (m, o) => `${m}/${o}/`) },
      { name: 'Goo-net Exchange', kind: 'Export-Marktplatz', url: path('https://www.goo-net-exchange.com/usedcars/', (m, o) => `${m.toUpperCase()}/${o.toUpperCase()}/`) },
      { name: 'SBT Japan', kind: 'Exporteur', url: path('https://www.sbtjapan.com/used-cars/', (m, o) => `${m}/${o}/`) },
      { name: 'Carsensor', kind: 'Inlandsmarkt (Japanisch)', url: site('carsensor.net') },
      { name: 'Yahoo! Auctions', kind: 'Online-Auktion (Japanisch)', url: (q) => `https://auctions.yahoo.co.jp/search/search?p=${encodeURIComponent(`${q.make} ${q.model}`.trim())}` },
      { name: 'JDMBUYSELL', kind: 'Marktplatz für JDM-Klassiker', url: site('jdmbuysell.com') },
    ],
  },
  {
    id: 'kr', cur: 'KRW', code: 'KR', country: 'Südkorea', hub: 'Incheon · Busan', x: 88, y: 34,
    text: 'Stark bei Hyundai, Kia und Genesis, dazu viele junge Importwagen. Linkslenker, gute Ausstattung.',
    portals: [
      { name: 'Autowini', kind: 'Export-Marktplatz', url: (q) => `https://www.autowini.com/search?keyword=${encodeURIComponent(`${q.make} ${q.model}`.trim())}` },
      { name: 'Encar', kind: 'Inlandsmarkt (Koreanisch)', url: site('encar.com') },
    ],
  },
  {
    id: 'th', cur: 'THB', code: 'TH', country: 'Thailand', hub: 'Bangkok · Laem Chabang', x: 74, y: 62,
    text: 'Viele Rechtslenker, Pick-ups und gepflegte Toyota/Honda. Preise oft günstiger, Zustand genau prüfen.',
    portals: [{ name: 'One2car', kind: 'Marktplatz', url: path('https://www.one2car.com/en/cars-for-sale/', (m, o) => `${m}/${o}`) }],
  },
  {
    id: 'my', cur: 'MYR', code: 'MY', country: 'Malaysia', hub: 'Port Klang', x: 72, y: 74,
    text: '„Recon“-Fahrzeuge: aus Japan reimportiert und aufbereitet. Interessant für jüngere JDM-Modelle.',
    portals: [{ name: 'Carlist', kind: 'Marktplatz', url: path('https://www.carlist.my/cars-for-sale/', (m, o) => (o ? `${m}/${o}/malaysia` : `${m}/malaysia`)) }],
  },
  {
    id: 'sg', cur: 'SGD', code: 'SG', country: 'Singapur', hub: 'Singapur', x: 75, y: 80,
    text: 'Wegen der strengen Zulassungsregeln oft junge, top gepflegte Autos mit wenig Kilometern.',
    portals: [{ name: 'sgCarMart', kind: 'Marktplatz', url: site('sgcarmart.com') }],
  },
  {
    id: 'hk', cur: 'HKD', code: 'HK', country: 'Hongkong', hub: 'Hongkong', x: 82, y: 52,
    text: 'Rechtslenker, viele Japan-Importe und Sportwagen. Gute Quelle für seltene Ausstattungen.',
    portals: [{ name: '28Car', kind: 'Marktplatz', url: site('28car.com') }],
  },
  {
    id: 'ae', cur: 'AED', code: 'AE', country: 'Dubai (VAE)', hub: 'Jebel Ali', x: 56, y: 50,
    text: 'Westasiens Drehkreuz: Sportwagen, GCC-Ausführungen mit Klimapaket, schnelle Verschiffung nach Europa.',
    portals: [{ name: 'DubiCars', kind: 'Marktplatz', url: path('https://www.dubicars.com/uae/used/', (m, o) => `${m}/${o}`) }],
  },
  {
    id: 'us', cur: 'USD', code: 'US', country: 'USA', hub: 'Baltimore · New York · Houston', x: 10, y: 34,
    text: 'Muscle-Cars, Corvette, Bronco, Pickups und Sammlerautos. Der größte Klassikermarkt der Welt, viele Autos günstiger als in Europa. Linkslenker.',
    portals: [
      { name: 'Bring a Trailer', kind: 'Online-Auktion, offen für alle', url: (q) => `https://bringatrailer.com/search/?s=${encodeURIComponent(`${q.make} ${q.model}`.trim())}` },
      { name: 'Cars & Bids', kind: 'Online-Auktion, offen für alle', url: site('carsandbids.com') },
      { name: 'Mecum', kind: 'Auktionshaus', url: (q) => `https://www.mecum.com/search/?q=${encodeURIComponent(`${q.make} ${q.model}`.trim())}` },
      { name: 'Barrett-Jackson', kind: 'Auktionshaus', url: site('barrett-jackson.com') },
      { name: "RM Sotheby's", kind: 'Auktionshaus (Top-Klasse)', url: (q) => `https://rmsothebys.com/search/?q=${encodeURIComponent(`${q.make} ${q.model}`.trim())}` },
      { name: 'eBay Motors', kind: 'Marktplatz', url: (q) => `https://www.ebay.com/sch/i.html?_sacat=6001&_nkw=${encodeURIComponent(`${q.make} ${q.model}${q.from ? ` ${q.from}` : ''}`.trim())}` },
    ],
  },
  {
    id: 'ca', cur: 'CAD', code: 'CA', country: 'Kanada', hub: 'Halifax · Montreal', x: 13, y: 16,
    text: 'Amerikanische Klassiker und Pickups, oft etwas günstiger als in den USA. Wegen Streusalz genau auf Rost prüfen.',
    portals: [
      { name: 'AutoTrader.ca', kind: 'Marktplatz', url: (q) => `https://www.autotrader.ca/cars/?kwd=${encodeURIComponent(`${q.make} ${q.model}`.trim())}` },
      { name: 'Kijiji Autos', kind: 'Kleinanzeigen', url: site('kijiji.ca') },
    ],
  },
  {
    id: 'uk', cur: 'GBP', code: 'UK', country: 'Großbritannien', hub: 'Southampton · Tilbury', x: 33, y: 17,
    text: 'TVR, Lotus, Ford RS und viele JDM-Importe. Rechtslenker. Kurzer Weg nach Deutschland, seit dem Brexit aber mit Zoll und Einfuhrumsatzsteuer.',
    portals: [
      { name: 'Bonhams', kind: 'Auktionshaus', url: (q) => `https://www.bonhams.com/search/?q=${encodeURIComponent(`${q.make} ${q.model}`.trim())}` },
      { name: 'Iconic Auctioneers', kind: 'Auktionshaus', url: (q) => `https://www.iconicauctioneers.com/search?q=${encodeURIComponent(`${q.make} ${q.model}`.trim())}` },
      { name: 'Collecting Cars', kind: 'Online-Auktion, offen für alle', url: site('collectingcars.com') },
      { name: 'Car & Classic', kind: 'Marktplatz für Klassiker', url: site('carandclassic.com') },
      { name: 'eBay UK', kind: 'Marktplatz', url: (q) => `https://www.ebay.co.uk/sch/i.html?_nkw=${encodeURIComponent(`${q.make} ${q.model}`.trim())}` },
    ],
  },
  {
    id: 'eu', cur: 'EUR', code: 'EU', country: 'Europa', hub: 'Deutschland · Italien · Frankreich · Schweden', x: 50, y: 20,
    text: 'Europäische Klassiker und Youngtimer: Porsche, BMW, Mercedes, Alfa Romeo, Ferrari, Citroën, Volvo. Innerhalb der EU ohne Zoll und Einfuhrumsatzsteuer.',
    portals: [
      { name: 'AutoScout24', kind: 'Marktplatz', url: (q) => `https://www.autoscout24.de/lst/${slug(q.make)}${q.model ? '/' + slug(q.model) : ''}` },
      { name: 'mobile.de', kind: 'Marktplatz', url: site('mobile.de') },
      { name: 'Classic Trader', kind: 'Marktplatz für Klassiker', url: site('classic-trader.com') },
      { name: 'Catawiki', kind: 'Online-Auktion, offen für alle', url: site('catawiki.com') },
      { name: 'Dorotheum', kind: 'Auktionshaus für Klassiker', url: site('dorotheum.com') },
      { name: 'Artcurial', kind: 'Auktionshaus für Klassiker', url: site('artcurial.com') },
    ],
  },
  {
    id: 'au', cur: 'AUD', code: 'AU', country: 'Australien', hub: 'Melbourne · Sydney', x: 88, y: 88,
    text: 'Eigene Muscle-Car-Kultur: Holden Monaro, Torana, Ford Falcon GT, in Europa kaum zu finden. Dazu viele JDM-Autos. Rechtslenker, lange Verschiffung.',
    portals: [
      { name: 'Shannons', kind: 'Auktionshaus für Klassiker', url: site('shannons.com.au') },
      { name: 'Lloyds Auctions', kind: 'Auktionshaus', url: site('lloydsauctions.com.au') },
      { name: 'Grays', kind: 'Online-Auktion', url: site('grays.com') },
      { name: 'carsales', kind: 'Marktplatz', url: site('carsales.com.au') },
    ],
  },
]

/** Auktionshäuser. Offene Auktionen: jeder darf mitbieten. Händlerauktionen in Japan und Korea: nur registrierte Händler,
    Zugang über einen Auktions-Agenten oder den TŌMEI Service. */
export const AUCTIONS: { name: string; country: string; text: string; open?: boolean; url?: string }[] = [
  { name: 'Bring a Trailer', country: 'USA', open: true, url: 'https://bringatrailer.com/', text: 'Größte Online-Auktion für Klassiker. Alle Ergebnisse sind öffentlich, Käufergebühr 5 % (min. 250 $, max. 7.500 $).' },
  { name: 'Mecum', country: 'USA', open: true, url: 'https://www.mecum.com/', text: 'Große Saal-Auktionen mit tausenden Muscle-Cars und Klassikern im Jahr.' },
  { name: 'Barrett-Jackson', country: 'USA', open: true, url: 'https://www.barrett-jackson.com/', text: 'Bekannte Live-Auktionen, z. B. Scottsdale, viele amerikanische Klassiker.' },
  { name: "RM Sotheby's", country: 'USA · weltweit', open: true, url: 'https://rmsothebys.com/', text: 'Oberste Preisklasse: seltene Sammlerautos mit lückenloser Historie.' },
  { name: 'Bonhams', country: 'Großbritannien · weltweit', open: true, url: 'https://www.bonhams.com/', text: 'Traditionshaus mit Auktionen in Goodwood, London und den USA.' },
  { name: 'Shannons', country: 'Australien', open: true, url: 'https://www.shannons.com.au/', text: 'Führendes Klassiker-Auktionshaus Australiens, viele Holden und Ford.' },
  { name: 'USS', country: 'Japan', text: 'Größter Auktionsverbund Japans, rund 20 Standorte, wöchentlich zehntausende Autos.' },
  { name: 'TAA', country: 'Japan', text: 'Toyotas Auktionen, viele Händler-Rückläufer in gutem Zustand.' },
  { name: 'JU', country: 'Japan', text: 'Verbund regionaler Händlerauktionen, breites Angebot.' },
  { name: 'HAA Kobe', country: 'Japan', text: 'Große Auktion im Westen Japans, bekannt für Sportwagen.' },
  { name: 'Aucnet', country: 'Japan', text: 'Online-Auktion mit detaillierten Prüfberichten.' },
  { name: 'Hyundai Glovis', country: 'Südkorea', text: 'Größte Autoauktion Koreas.' },
  { name: 'Lotte Auto Auction', country: 'Südkorea', text: 'Zweiter großer Auktionsplatz in Korea.' },
]

/** Kontakt für Service-Anfragen. [REPLACE] Öffentliche Adresse eintragen, dann öffnet „Anfrage senden“ eine fertige E-Mail. */
export const CONTACT_EMAIL = ''

/* ---------------- Merkliste: Fundstücke aus den Portalen, verbunden mit dem Rechner ----------------
   Seit 2.0 liegen sie als Fahrzeuge (Status „Beobachtet“) im gemeinsamen Speicher (src/store). */
export type Find = { id: string; title: string; url: string; price: number; cur: string; market: string; added: string }
export const CALC_LOAD_KEY = 'tomei.calc.load'
/** Alle Fahrzeuge der Garage mit Preis, im Format der alten Merkliste (für den Rechner) */
export function loadFinds(): Find[] {
  return getState()
    .vehicles.filter((v) => v.price && v.price.amount > 0)
    .map((v) => ({ id: v.id, title: [v.make, v.model, v.variant].filter(Boolean).join(' '), url: v.url ?? '', price: v.price!.amount, cur: v.price!.cur, market: v.market ?? 'jp', added: v.createdAt }))
}
/** Preis in Yen (rates: 1 ¥ = … Fremdwährung) */
export function toJpy(price: number, cur: string, rates: Record<string, number>) {
  if (cur === 'JPY') return price
  const r = cur === 'AED' ? (rates.USD ?? FX_FALLBACK.USD) * AED_PER_USD : (rates[cur] ?? FX_FALLBACK[cur])
  return r ? Math.round(price / r) : 0
}
/** Fundstück an den Rechner übergeben und hinspringen */
export function sendToCalc(f: Find) {
  try {
    localStorage.setItem(CALC_LOAD_KEY, JSON.stringify(f))
  } catch {
    /* ohne Speicher öffnet der Rechner leer */
  }
  location.hash = '/discover/calculator/rechner'
}
