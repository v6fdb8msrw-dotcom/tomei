import { describe, expect, it } from 'vitest'
import { landedCost } from '../lib/calc.ts'
import { buildScenarios, range3 } from '../lib/scenarios.ts'
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
