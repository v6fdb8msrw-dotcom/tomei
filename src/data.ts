// Alle Inhalte an einer Stelle: Texte, Links und Bilder lassen sich hier tauschen.
// [REPLACE] markiert Stellen, an denen eigene Fotos oder Videos hingehören.

const img = (name: string) => `${import.meta.env.BASE_URL}images/${name}.jpg`

export type Tab = 'spots' | 'rent' | 'import' | 'parts'

export const TABS: { id: Tab; label: string; long: string }[] = [
  { id: 'spots', label: 'Spots', long: 'Top Car Spots in Japan' },
  { id: 'rent', label: 'Rent', long: 'JDM mieten in Japan' },
  { id: 'import', label: 'Import', long: 'JDM nach Deutschland/EU' },
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

// Broker im Kostenvergleich: fee = typische Service-Gebühr in USD (Schätzung)
export type Broker = Provider & { type: string; fee: number }
export const BROKERS: Broker[] = [
  { name: 'Japan Car Direct', url: 'https://www.japancardirect.com/', type: 'Auktions-Agent', fee: 1500, text: 'Feste Service-Gebühr, 120+ Auktionen, starke Bewertungen für Erst-Importe.' },
  { name: 'TokyoCarZ', url: 'https://tokyocarz.com/', type: 'Exporteur', fee: 900, text: 'Live-Zugang zu USS/TAA/CAA, über 100.000 Lagerwagen, JUMVEA-verifiziert.' },
  { name: 'JDM Auction Watch', url: 'https://www.jdmauctionwatch.com/', type: 'EU-Agent', fee: 1300, text: 'EU-basierter Service mit eigenem Team in Japan.' },
  { name: 'JAP Express', url: 'https://jap-express.com/', type: 'Exporteur', fee: 1000, text: 'JDM-Spezialist (Skyline/Silvia/Supra), SHODAN-Verhandlung.' },
  { name: 'TCV / tradecarview', url: 'https://www.tradecarview.com/', type: 'Marktplatz', fee: 700, text: 'Riesiges Händler-Inventar, transparente Gebotshistorie.' },
  { name: 'Goo-net Exchange', url: 'https://www.goonet-exchange.com/', type: 'Marktplatz', fee: 800, text: 'Größtes japanisches Listing-Portal, gut zur Preisrecherche.' },
]

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
}

export const DEST: Record<DestKey, Dest> = {
  DE: {
    name: 'Deutschland', flag: '🇩🇪', cur: 'EUR', port: 'Bremerhaven', duty: 10, vat: 19, vatLabel: 'EUSt', epa: true,
    freight: { roro: 1200, container: 2200 },
    fees: { clearance: 250, agent: 500, inland: 350, inspection: 1000, reg: 600 },
    inspectionLabel: 'TÜV / Einzelabnahme §21',
    note: 'Pkw-Drittlandszoll 10 %. Das EU-Japan-Abkommen (EPA) kann ihn mit Ursprungsnachweis auf 0 % senken, bei Gebrauchtimporten aber selten. TÜV-Vollabnahme und ggf. Scheinwerfer-Umrüstung nötig.',
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

// JPY → Zielwährung (EZB-Kurs vom 27.10.2026), wird beim Laden durch den Tageskurs ersetzt (Frankfurter-API)
export const FX_FALLBACK: Record<string, number> = { EUR: 0.0056828, USD: 0.0063363, GBP: 0.0047541, AUD: 0.0090106, CAD: 0.0088856, NZD: 0.011111 }

export type Car = { id: string; model: string; chassis: string; year: number; grade: string; km: number; jpy: number; img: string; tag: string }

const car = (name: string) => `${import.meta.env.BASE_URL}images/cars/${name}.jpg`

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
export const HERO: Record<Tab, Slide[]> = {
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
