// Modell-Finder: ältere, besondere Autos, die man in Deutschland kaum oder nur teuer bekommt.
// Preise: nur wo eine frei lizenzierte Quelle existiert. JDMBUYSELL veröffentlicht seine Markt-Statistiken
// (Median der Angebotspreise) unter CC BY 4.0, abgelesen von Hand am 17.11.2026 (kein automatischer Abruf).
// Für USA, UK und Australien gibt es keine freie, erlaubte Preisquelle → Link auf die Ergebnisse der Auktionshäuser.
import type { MarketQuery } from './data.ts'

export type Origin = 'jp' | 'us' | 'uk' | 'au'
export type Classic = {
  id: string
  name: string
  chassis: string
  from: number
  to: number
  origin: Origin
  kind: string
  why: string
  q: MarketQuery
  /** Median der Angebotspreise in USD: in Japan (jp) und außerhalb Japans (out), Anzahl Inserate mit Preis in Japan (n) */
  price?: { jp: number; out?: number; n?: number; note?: string }
}

export const PRICE_SOURCE = {
  name: 'JDMBUYSELL',
  url: 'https://www.jdmbuysell.com/market-trends/',
  licence: 'CC BY 4.0',
  licenceUrl: 'https://www.jdmbuysell.com/terms/#data-reuse',
  date: '17.11.2026',
}

export const ORIGINS: { id: Origin; label: string }[] = [
  { id: 'jp', label: 'Japan' },
  { id: 'us', label: 'USA' },
  { id: 'uk', label: 'Großbritannien' },
  { id: 'au', label: 'Australien' },
]

export const CLASSICS: Classic[] = [
  // Japan
  { id: 'a80', name: 'Toyota Supra', chassis: 'A80', from: 1993, to: 2002, origin: 'jp', kind: 'Sportwagen', why: 'In Europa kaum mit Twin-Turbo und Handschaltung zu finden, in Japan die größte Auswahl.', q: { make: 'Toyota', model: 'Supra', from: 1993 }, price: { jp: 50853, out: 70000, n: 125 } },
  { id: 'fd', name: 'Mazda RX-7', chassis: 'FD3S', from: 1992, to: 2002, origin: 'jp', kind: 'Sportwagen', why: 'Wankelmotor, in Deutschland nur wenige offiziell verkauft. Spätere Serien (Spirit R, Type RS) nur in Japan.', q: { make: 'Mazda', model: 'RX-7', from: 1992 }, price: { jp: 38060, out: 37999, n: 222 } },
  { id: 'r34', name: 'Nissan Skyline', chassis: 'R34', from: 1998, to: 2002, origin: 'jp', kind: 'Sportwagen', why: 'Nie offiziell in Europa verkauft. GT-T und GT-R nur als Import.', q: { make: 'Nissan', model: 'Skyline', from: 1998 }, price: { jp: 23729, out: 45999, n: 178, note: 'alle R34-Varianten, ein GT-R kostet ein Vielfaches' } },
  { id: 'r32', name: 'Nissan Skyline GT-R', chassis: 'R32', from: 1989, to: 1994, origin: 'jp', kind: 'Sportwagen', why: 'Der erste „Godzilla“, schon Oldtimer-fähig. Nur als Import zu haben.', q: { make: 'Nissan', model: 'Skyline GT-R', from: 1989 } },
  { id: 's15', name: 'Nissan Silvia', chassis: 'S15', from: 1999, to: 2002, origin: 'jp', kind: 'Sportwagen', why: 'Nur in Japan, Australien und Neuseeland verkauft. Drift-Ikone.', q: { make: 'Nissan', model: 'Silvia', from: 1999 }, price: { jp: 23656, out: 30000, n: 303 } },
  { id: '180sx', name: 'Nissan 180SX', chassis: 'RPS13', from: 1989, to: 1998, origin: 'jp', kind: 'Sportwagen', why: 'Klappscheinwerfer-Coupé, nur in Japan unter diesem Namen.', q: { make: 'Nissan', model: '180SX' }, price: { jp: 23030 } },
  { id: 'z32', name: 'Nissan Fairlady Z', chassis: 'Z32', from: 1989, to: 2000, origin: 'jp', kind: 'Sportwagen', why: 'In Europa als 300ZX selten, in Japan viele gepflegte Twin-Turbos.', q: { make: 'Nissan', model: 'Fairlady Z', from: 1989 }, price: { jp: 16876 } },
  { id: 'jzx100', name: 'Toyota Chaser', chassis: 'JZX100', from: 1996, to: 2001, origin: 'jp', kind: 'Limousine', why: 'Viertürer mit 1JZ-Turbo und Hinterradantrieb, nie in Europa verkauft.', q: { make: 'Toyota', model: 'Chaser', from: 1996 }, price: { jp: 16034, out: 28800, n: 193 } },
  { id: 'ap1', name: 'Honda S2000', chassis: 'AP1', from: 1999, to: 2003, origin: 'jp', kind: 'Roadster', why: 'In Deutschland gesucht und teuer, in Japan mehr Auswahl mit wenig Kilometern.', q: { make: 'Honda', model: 'S2000', from: 1999 }, price: { jp: 20786, out: 25995, n: 153 } },
  { id: 'sw20', name: 'Toyota MR2', chassis: 'SW20', from: 1989, to: 1999, origin: 'jp', kind: 'Sportwagen', why: 'Mittelmotor, die Turbo-Version gab es in Deutschland nicht.', q: { make: 'Toyota', model: 'MR2', from: 1989 }, price: { jp: 15362, n: 148 } },
  { id: 'na1', name: 'Honda NSX', chassis: 'NA1', from: 1990, to: 2001, origin: 'jp', kind: 'Supersportwagen', why: 'Sehr selten in Deutschland. In Japan die meisten Exemplare, auch Type R.', q: { make: 'Honda', model: 'NSX', from: 1990 } },
  { id: 'lc80', name: 'Toyota Land Cruiser 80', chassis: 'FZJ80 / HDJ81', from: 1990, to: 1997, origin: 'jp', kind: 'Geländewagen', why: 'Der 24-Ventil-Diesel (HDJ81) war in Europa rar, in Japan gibt es ihn rostfrei.', q: { make: 'Toyota', model: 'Land Cruiser', from: 1990 } },
  { id: 'evo6', name: 'Mitsubishi Lancer Evolution VI', chassis: 'CP9A', from: 1999, to: 2001, origin: 'jp', kind: 'Rallye-Limousine', why: 'In Europa nur wenige offiziell verkauft, in Japan auch die Tommi Mäkinen Edition.', q: { make: 'Mitsubishi', model: 'Lancer Evolution', from: 1999 } },
  // USA
  { id: 'mustang', name: 'Ford Mustang Fastback', chassis: '1. Generation', from: 1965, to: 1968, origin: 'us', kind: 'Muscle-Car', why: 'In den USA zu Tausenden im Angebot, in Deutschland deutlich teurer.', q: { make: 'Ford', model: 'Mustang Fastback', from: 1965 } },
  { id: 'c2', name: 'Chevrolet Corvette Sting Ray', chassis: 'C2', from: 1963, to: 1967, origin: 'us', kind: 'Sportwagen', why: 'Die Split-Window- und Big-Block-Varianten findet man fast nur in den USA.', q: { make: 'Chevrolet', model: 'Corvette', from: 1963 } },
  { id: 'bronco', name: 'Ford Bronco', chassis: '1. Generation', from: 1966, to: 1977, origin: 'us', kind: 'Geländewagen', why: 'Nie offiziell in Europa verkauft.', q: { make: 'Ford', model: 'Bronco', from: 1966 } },
  { id: 'c10', name: 'Chevrolet C10', chassis: 'Action Line', from: 1967, to: 1972, origin: 'us', kind: 'Pickup', why: 'Klassischer US-Pickup, in Deutschland nur als Import.', q: { make: 'Chevrolet', model: 'C10', from: 1967 } },
  { id: 'charger', name: 'Dodge Charger', chassis: '2. Generation', from: 1968, to: 1970, origin: 'us', kind: 'Muscle-Car', why: 'Ikone der Muscle-Car-Ära, praktisch nur in den USA zu finden.', q: { make: 'Dodge', model: 'Charger', from: 1968 } },
  { id: 'camaro', name: 'Chevrolet Camaro', chassis: '1. Generation', from: 1967, to: 1969, origin: 'us', kind: 'Muscle-Car', why: 'Große Auswahl an Z/28 und SS in den USA.', q: { make: 'Chevrolet', model: 'Camaro', from: 1967 } },
  { id: 'transam', name: 'Pontiac Firebird Trans Am', chassis: '2. Generation', from: 1977, to: 1981, origin: 'us', kind: 'Muscle-Car', why: 'Bekannt aus dem Kino, Pontiac gibt es nicht mehr.', q: { make: 'Pontiac', model: 'Trans Am', from: 1977 } },
  { id: 'wagoneer', name: 'Jeep Grand Wagoneer', chassis: 'SJ', from: 1984, to: 1991, origin: 'us', kind: 'Geländewagen', why: 'Holzdekor-Klassiker, in Europa nie verkauft.', q: { make: 'Jeep', model: 'Grand Wagoneer', from: 1984 } },
  // Großbritannien
  { id: 'griffith', name: 'TVR Griffith', chassis: '500', from: 1991, to: 2002, origin: 'uk', kind: 'Sportwagen', why: 'Handgebauter V8-Roadster, fast alle Exemplare stehen in England.', q: { make: 'TVR', model: 'Griffith', from: 1991 } },
  { id: 'sierra', name: 'Ford Sierra RS Cosworth', chassis: 'RS / RS500', from: 1986, to: 1992, origin: 'uk', kind: 'Sportlimousine', why: 'Der britische Markt hat die meisten gepflegten Exemplare (Rechtslenker).', q: { make: 'Ford', model: 'Sierra Cosworth', from: 1986 } },
  { id: 'esprit', name: 'Lotus Esprit Turbo', chassis: 'S3 / SE / V8', from: 1981, to: 2004, origin: 'uk', kind: 'Sportwagen', why: 'In England die größte Auswahl und die meisten Spezialisten.', q: { make: 'Lotus', model: 'Esprit', from: 1981 } },
  // Australien
  { id: 'monaro', name: 'Holden Monaro GTS', chassis: 'HK–HQ', from: 1968, to: 1974, origin: 'au', kind: 'Muscle-Car', why: 'Australiens eigenes Muscle-Car, in Europa praktisch nicht zu finden.', q: { make: 'Holden', model: 'Monaro', from: 1968 } },
  { id: 'xbgt', name: 'Ford Falcon GT', chassis: 'XB', from: 1973, to: 1976, origin: 'au', kind: 'Muscle-Car', why: 'Nur in Australien gebaut und verkauft.', q: { make: 'Ford', model: 'Falcon GT', from: 1973 } },
  { id: 'torana', name: 'Holden Torana SL/R 5000', chassis: 'LH / LX', from: 1974, to: 1978, origin: 'au', kind: 'Sportlimousine', why: 'V8-Rennhomologation (bis A9X), nur in Australien.', q: { make: 'Holden', model: 'Torana', from: 1974 } },
]
