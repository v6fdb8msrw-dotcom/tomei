import { describe, expect, it } from 'vitest'
import { landedCost } from '../lib/calc.ts'
import { buildScenarios, range3 } from '../lib/scenarios.ts'
import { legsOf, splitDays, tripCost, withVia } from '../lib/tripplan.ts'
import { guessCategory, guessKind, guessModStatus, parseCar, parseNote, parseTrip } from '../lib/quick.ts'
import { chooseRoads } from '../lib/autotrip.ts'
import { ROADS } from '../data/roads.ts'
import { COUNTRIES } from '../data/countries.ts'
import { quote } from '../lib/landed.ts'
import { findShops } from '../lib/workshops.ts'
import { carProfile, suits } from '../lib/carprofile.ts'
import { winAnsi } from '../lib/dossier.ts'
import { parseGpx, toGpx, pathKm, mapsDirections } from '../lib/gpx.ts'
import { simulateOwnership, EMPTY_OWNERSHIP } from '../lib/ownership.ts'
import { addMonths, dueState, nextDue, toIcs } from '../lib/maintenance.ts'
import { findsToVehicles, mergeStores, migrate, parseBackup, makeBackup } from '../store/store.ts'
import { EMPTY_STORE, SCHEMA_VERSION } from '../store/schema.ts'

const base = { vehicle: 10000, japanFees: 1000, freight: 1200, insureOn: true, insurePct: 1.5, dutyPct: 10, vatPct: 19, fees: { clearance: 250, agent: 500, inland: 350, inspection: 1000, reg: 600 } }

describe('landedCost', () => {
  it('rechnet Zollwert, Zoll und EUSt in der richtigen Reihenfolge', () => {
    const r = landedCost(base)
    const cif = 11000 + 1200 + (11000 + 1200) * 0.015
    expect(r.cif).toBeCloseTo(cif)
    expect(r.duty).toBeCloseTo(cif * 0.1)
    expect(r.vat).toBeCloseTo((cif + cif * 0.1) * 0.19)
    expect(r.landed).toBeCloseTo(cif + r.duty + r.vat + 2700)
  })
  it('liefert bei Preis 0 keine NaN', () => {
    const r = landedCost({ ...base, vehicle: 0 })
    expect(r.multiplier).toBe(0)
    expect(Number.isFinite(r.landed)).toBe(true)
  })
})

describe('Szenarien', () => {
  const s = buildScenarios({ base, originFees: { low: 800, expected: 1000, high: 1300 }, freight: { low: 1200, expected: 1200, high: 2200 }, fxBandPct: 5, worstReservePct: 10, custom: { fxPct: 0, reservePct: 0, originFees: 1000, freight: 1200 } })
  it('Expected entspricht der normalen Rechnung', () => {
    expect(s.expected.total).toBeCloseTo(landedCost(base).landed)
  })
  it('Best < Expected < Worst', () => {
    expect(s.best.total).toBeLessThan(s.expected.total)
    expect(s.worst.total).toBeGreaterThan(s.expected.total)
  })
  it('Worst enthält die Reserve auf den Fahrzeugwert', () => {
    expect(s.worst.reserve).toBeCloseTo(10000 * 1.05 * 0.1)
  })
  it('range3 nimmt Min/Max und Mittelwert', () => {
    expect(range3([3, 1, 2])).toEqual({ low: 1, expected: 2, high: 3 })
    expect(range3([], 5)).toEqual({ low: 5, expected: 5, high: 5 })
  })
})

describe('GPX', () => {
  const gpx = `<?xml version="1.0"?><gpx version="1.1"><metadata><name>Alpen &amp; Pässe</name></metadata>
    <wpt lat="46.6167" lon="10.6"><name>Prad</name></wpt><wpt lat='46.5286' lon='10.4528'><name><![CDATA[Stilfser Joch]]></name></wpt>
    <trk><trkseg><trkpt lat="46.6" lon="10.5"/><trkpt lat="46.55" lon="10.47"></trkpt><trkpt lat="999" lon="10"/></trkseg></trk></gpx>`
  it('liest Name, Wegpunkte und Spur und verwirft ungültige Punkte', () => {
    const d = parseGpx(gpx)
    expect(d.name).toBe('Alpen & Pässe')
    expect(d.waypoints.map((w) => w.name)).toEqual(['Prad', 'Stilfser Joch'])
    expect(d.track).toHaveLength(2)
  })
  it('Export lässt sich wieder einlesen', () => {
    const d = parseGpx(gpx)
    const back = parseGpx(toGpx('Test <1>', d.waypoints, d.track))
    expect(back.name).toBe('Test <1>')
    expect(back.waypoints.length).toBeGreaterThanOrEqual(2)
    expect(back.track).toHaveLength(2)
  })
  it('lehnt Nicht-GPX ab', () => {
    expect(() => parseGpx('<kml></kml>')).toThrow()
  })
  it('Luftlinie und Routenlink', () => {
    expect(pathKm([{ lat: 0, lon: 0 }, { lat: 0, lon: 1 }])).toBeCloseTo(111.2, 0)
    expect(mapsDirections([{ name: 'a', lat: 1, lon: 2 }, { name: 'b', lat: 3, lon: 4 }])).toContain('origin=1,2')
  })
})

describe('Ownership', () => {
  it('rechnet Sprit, Fixkosten und Wertänderung', () => {
    const r = simulateOwnership({ ...EMPTY_OWNERSHIP, years: 2, kmPerYear: 5000, consumption: 10, fuelPrice: 2, insurance: 500, tax: 191.73, purchase: 20000, valueChangePct: 5 })
    expect(r.fuelPerYear).toBeCloseTo(1000)
    expect(r.runningPerYear).toBeCloseTo(1691.73)
    expect(r.resale).toBeCloseTo(22050)
    expect(r.total).toBeCloseTo(2 * 1691.73 - 2050)
    expect(r.perKm).toBeCloseTo(r.total / 10000)
  })
})

describe('Wartung', () => {
  it('addMonths hält Monatsenden ein', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28')
    expect(addMonths('2026-11-24', 12)).toBe('2027-11-24')
  })
  it('nächste Fälligkeit und Status', () => {
    const d = nextDue({ intervalMonths: 12, lastDate: '2025-11-01', intervalKm: 10000, lastKm: 50000 })
    expect(d).toEqual({ dueDate: '2026-11-01', dueKm: 60000 })
    expect(dueState(d, '2026-11-24')).toBe('overdue')
    expect(dueState(d, '2026-10-20', 55000)).toBe('soon')
    expect(dueState({}, '2026-10-20')).toBe('open')
  })
  it('ICS enthält ganztägige Termine', () => {
    const ics = toIcs([{ title: 'Ölwechsel, R34', date: '2027-03-01' }])
    expect(ics).toContain('DTSTART;VALUE=DATE:20270301')
    expect(ics).toContain('SUMMARY:Ölwechsel\\, R34')
  })
})

describe('Speicher', () => {
  it('migrate macht aus Müll einen leeren Stand', () => {
    expect(migrate(null)).toEqual(EMPTY_STORE)
    expect(migrate({ vehicles: 'x' }).vehicles).toEqual([])
  })
  it('verwirft gefährliche Links und Waisen', () => {
    const s = migrate({
      vehicles: [{ id: 'a', make: 'Nissan', model: 'Skyline', url: 'javascript:alert(1)', status: 'owned' }],
      maintenance: [{ id: 'm', vehicleId: 'zzz', title: 'x' }],
    })
    expect(s.vehicles[0].url).toBeUndefined()
    expect(s.vehicles[0].status).toBe('owned')
    expect(s.maintenance).toEqual([])
  })
  it('übernimmt die alte Merkliste als Watchlist', () => {
    const v = findsToVehicles([{ id: '1', title: 'Toyota Supra RZ', url: 'https://example.com/a', price: 5000000, cur: 'JPY', market: 'jp', added: '2026-11-17T10:00:00Z' }])
    expect(v[0]).toMatchObject({ make: 'Toyota', model: 'Supra RZ', status: 'watchlist', price: { amount: 5000000, cur: 'JPY' }, source: 'finds' })
  })
  it('Sicherung: Export → Import ergibt denselben Stand', () => {
    const s = migrate({ vehicles: [{ id: 'a', make: 'Mazda', model: 'RX-7', mods: [{ title: 'Felgen', status: 'planned' }] }], trips: [{ id: 't', name: 'Alpen', waypoints: [{ name: 'A', lat: 1, lon: 2 }] }] })
    const back = parseBackup(JSON.stringify(makeBackup(s)))
    expect(back).toEqual(s)
    expect(back.version).toBe(SCHEMA_VERSION)
  })
  it('lehnt fremde oder neuere Dateien ab', () => {
    expect(() => parseBackup('kein json')).toThrow()
    expect(() => parseBackup('{"foo":1}')).toThrow()
    expect(() => parseBackup(JSON.stringify({ version: SCHEMA_VERSION + 1, vehicles: [] }))).toThrow()
  })
  it('Zusammenführen behält die neuere Fassung', () => {
    const a = migrate({ vehicles: [{ id: 'x', make: 'A', model: 'alt', updatedAt: '2026-01-01' }] })
    const b = migrate({ vehicles: [{ id: 'x', make: 'A', model: 'neu', updatedAt: '2026-06-01' }, { id: 'y', make: 'B', model: 'b' }] })
    const m = mergeStores(a, b)
    expect(m.vehicles.find((v) => v.id === 'x')?.model).toBe('neu')
    expect(m.vehicles).toHaveLength(2)
  })
})

import ev from '../data/events.json'
import { eventsBetween, weekOf, type CarEvent } from '../lib/events.ts'
describe('Events der Woche', () => {
  const all = ev as CarEvent[]
  it('Woche läuft Montag bis Sonntag, auch an den Rändern und zum Jahreswechsel', () => {
    expect(weekOf('2026-11-24')).toEqual({ from: '2026-11-23', to: '2026-11-29' })
    expect(weekOf('2026-11-29')).toEqual({ from: '2026-11-23', to: '2026-11-29' })
    expect(weekOf('2026-11-23', 1).from).toBe('2026-11-30')
    expect(weekOf('2027-01-01')).toEqual({ from: '2026-12-28', to: '2027-01-03' })
  })
  it('zeigt laufende und wöchentliche Termine', () => {
    const n = eventsBetween(all, '2026-11-23', '2026-11-29').map((e) => e.n)
    expect(n).toContain('LA Auto Show')
    expect(n).toContain('Essen Motor Show')
    expect(n).toContain('Supercar Sunday')
    expect(n).not.toContain('Tokyo Auto Salon')
  })
  it('jeder Termin hat gültige Daten und eine https-Quelle', () => {
    for (const e of all) {
      expect(e.a).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(e.b >= e.a).toBe(true)
      expect(e.s.startsWith('https://')).toBe(true)
    }
  })
})

describe('Roadtrip-Planung', () => {
  const a = { name: 'A', lat: 46, lon: 10 }
  const b = { name: 'B', lat: 46.5, lon: 10, via: 'x' }
  const c = { name: 'C', lat: 47, lon: 10 }
  it('nimmt echte Straßenlängen und schätzt Verbindungen', () => {
    const l = legsOf([a, b, c], { x: 80 }, 1.35)
    expect(l[0]).toMatchObject({ km: 80, exact: true })
    expect(l[1].exact).toBe(false)
    expect(l[1].km).toBeCloseTo(55.6 * 1.35, 0)
  })
  it('teilt in Tage und rechnet Kosten', () => {
    const l = legsOf([a, b, c], { x: 80 }, 1.35)
    expect(splitDays(l, 100)).toHaveLength(2)
    expect(splitDays(l, 500)).toHaveLength(1)
    expect(tripCost(200, { consumption: 10, fuelPrice: 2, nights: 1, hotel: 90, tolls: 10 }).total).toBe(140)
  })
  it('setzt Zwischenpunkte auf der Straße', () => {
    const g: [number, number][] = [[46.5, 10], [46.4, 10.1], [46.2, 10.1], [46, 10]]
    const w = withVia([a, b], { x: g })
    expect(w).toHaveLength(4)
    expect(w[1].lat).toBe(46.2)
  })
})

describe('PDF-Text', () => {
  it('ersetzt Zeichen, die die PDF-Schrift nicht kennt', () => {
    expect(winAnsi('Größe 5 € – „gut“')).toBe('Größe 5 € – „gut“')
    expect(winAnsi('Transfăgărășan → 峠')).toBe('Transfagarasan -> ?')
  })
})

describe('Ein Feld: Auto', () => {
  const all = [
    { id: 'a', n: 'Mazda MX-5', mk: 'Mazda', md: 'MX-5', y0: 1989, cc: 'jp' },
    { id: 'b', n: 'Porsche 911 (964)', mk: 'Porsche', md: '911 (964)', y0: 1989, y1: 1994, cc: 'de' },
    { id: 'c', n: 'Porsche 911 (993)', mk: 'Porsche', md: '911 (993)', y0: 1994, y1: 1998, cc: 'de' },
    { id: 'd', n: 'BMW M3', mk: 'BMW', md: 'M3', y0: 1986, cc: 'de' },
    { id: 'e', n: 'Nissan Skyline (R34)', mk: 'Nissan', md: 'Skyline', y0: 1998, y1: 2002, cc: 'jp' },
  ]
  it('liest Jahr, Kilometer und Preis', () => {
    expect(parseCar('Mazda MX-5 1994 98.000 km 7.500 €', all)).toMatchObject({ modelId: 'a', year: 1994, mileageKm: 98000, price: { amount: 7500, cur: 'EUR' }, market: 'jp' })
    expect(parseCar('Nissan Skyline R34 8 Mio Yen', all)).toMatchObject({ modelId: 'e', price: { amount: 8000000, cur: 'JPY' } })
    expect(parseCar('bmw m3 120 tkm', all)).toMatchObject({ modelId: 'd', mileageKm: 120000 })
  })
  it('wählt die Generation nach Baujahr und lässt Unbekanntes stehen', () => {
    expect(parseCar('Porsche 911 1996', all)?.modelId).toBe('c')
    expect(parseCar('Porsche 911 (964) 1990', all)?.modelId).toBe('b')
    expect(parseCar('Trabant 601 1975', all)).toMatchObject({ make: 'Trabant', model: '601', year: 1975 })
    expect(parseCar('Trabant 601', all)?.modelId).toBeUndefined()
  })
})

describe('Ein Feld: Roadtrip', () => {
  const places = [
    { n: 'München', en: 'Munich', cc: 'de', lat: 48.14, lon: 11.58, pop: 1500 },
    { n: 'Zürich', cc: 'ch', lat: 47.37, lon: 8.54, pop: 430 },
  ]
  const parse = (t: string) => parseTrip(t, ROADS, places, COUNTRIES)
  it('erkennt Start, Ziel und Tage', () => {
    const w = parse('München nach Stilfser Joch, 2 Tage')
    expect(w.from?.n).toBe('München')
    expect(w.targets).toEqual([expect.objectContaining({ kind: 'road', id: 'stelvio' })])
    expect(w.days).toBe(2)
    expect(parse('Dolomiten, Wochenende')).toMatchObject({ days: 2, targets: [{ kind: 'area', id: 'dolomiten' }] })
    expect(parse('from Munich to Dolomites, one week')).toMatchObject({ days: 7, from: { n: 'München' } })
  })
  it('wählt passende Straßen und bleibt im Zeitrahmen', () => {
    const r = chooseRoads(parse('München nach Dolomiten, 3 Tage'))
    expect(r.roads.length).toBeGreaterThan(2)
    expect(r.roads.every((x) => x.country === 'it' || x.country === 'at')).toBe(true)
    expect(chooseRoads(parse('München nach Stilfser Joch')).roads.map((x) => x.id)).toEqual(['stelvio'])
  })
})

describe('Ein Feld: Eintrag, Umbau, Wert', () => {
  const now = new Date(2026, 10, 25)
  it('liest Datum, Kilometer und Betrag', () => {
    expect(parseNote('Ölwechsel gestern bei 84.000 km 180 €', now)).toEqual({ title: 'Ölwechsel', date: '2026-11-24', km: 84000, amount: 180, cur: 'EUR' })
    expect(parseNote('Gekauft im März 2024 für 32.000 €', now)).toMatchObject({ title: 'Gekauft', date: '2024-03-01', amount: 32000 })
    expect(parseNote('TÜV neu 12.5.2026', now)).toEqual({ title: 'TÜV neu', date: '2026-05-12' })
    expect(parseNote('Gutachten 48.000', now, { bareAmount: true })).toMatchObject({ title: 'Gutachten', amount: 48000 })
    expect(parseNote('Reifen 31.2.2026', now).date).not.toBe('2026-02-31')
  })
  it('errät Art, Kategorie und Stand', () => {
    expect(guessKind('Ölwechsel')).toBe('service')
    expect(guessKind('Gekauft in Köln')).toBe('purchase')
    expect(guessKind('Irgendwas')).toBe('note')
    expect(guessCategory('KW Gewindefahrwerk')).toBe('Fahrwerk')
    expect(guessModStatus('Auspuff verbaut')).toEqual({ status: 'installed', title: 'Auspuff' })
  })
})

describe('Kosten je Portal, Werkstätten, Auto-Profil', () => {
  const rates = { EUR: 0.0057, USD: 0.0063, GBP: 0.0047, AUD: 0.0093, CAD: 0.009, NZD: 0.0114 }
  const o = { rates, home: 'de', classic: false }
  it('EU ohne Zusatzkosten, Übersee mit Zoll, Steuer und Gebühr', () => {
    expect(quote({ market: 'eu' }, 20000, o).extra).toBe(0)
    const us = quote({ market: 'us', house: 'bat' }, 20000, o)
    expect(us.rows.find((r) => r.de.startsWith('Käufergebühr'))?.eur).toBe(1000)
    expect(us.total).toBe(20000 + us.extra)
    expect(us.rows.reduce((a, r) => a + r.eur, 0)).toBeGreaterThan(us.extra - 8)
    expect(us.rows.reduce((a, r) => a + r.eur, 0)).toBeLessThan(us.extra + 8)
    const jp = quote({ market: 'jp' }, 20000, { ...o, classic: true })
    expect(jp.rows.some((r) => r.de === 'EUSt 7 %')).toBe(true)
    expect(jp.total).toBeLessThan(quote({ market: 'jp' }, 20000, o).total)
    expect(quote({ market: 'au' }, 20000, o).missing.length).toBeGreaterThan(0)
  })
  it('Werkstätten: Marke vor Klassik, Vertragspartner bei alten Autos hinten', () => {
    const shops = [
      { n: 'PZ', la: 48.14, lo: 11.58, m: ['porsche'], d: 1 as const },
      { n: 'Elfer Klassik', la: 48.2, lo: 11.7, m: ['porsche'], o: 1 as const },
      { n: 'Oldie', la: 48.15, lo: 11.6, o: 1 as const },
      { n: 'Fern', la: 52.5, lo: 13.4, m: ['porsche'] },
    ]
    const h = findShops(shops, { make: 'Porsche', year: 1985, lat: 48.14, lon: 11.58, now: 2026 })
    expect(h.map((x) => x.s.n)[0]).toBe('Elfer Klassik')
    expect(h.some((x) => x.s.n === 'Fern')).toBe(false)
    expect(findShops(shops, { make: 'Porsche', year: 2022, lat: 48.14, lon: 11.58, now: 2026 }).some((x) => x.s.n === 'Oldie')).toBe(false)
  })
  it('flaches Auto meidet Schotter', () => {
    const p = carProfile({ year: 1990 }, { id: 'x', n: 'X', mk: 'X', md: 'X', cc: 'it', cl: 'sports' })!
    expect(suits('w-dalton-highway', p)).toBe(false)
    expect(suits('stelvio', p)).toBe(true)
    expect(p.kmPerDay).toBe(270)
  })
})
