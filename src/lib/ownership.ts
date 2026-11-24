// Ownership-Simulator: was ein Auto über die Haltedauer wirklich kostet. Rechnet nur mit Eingaben des Nutzers.
import type { OwnershipInput } from '../store/schema.ts'

/** Kfz-Steuer mit H-Kennzeichen (Oldtimer ab 30 Jahren): Pauschale nach § 9 Abs. 4 Nr. 2 KraftStG, Kennzeichen nach § 1 Abs. 1 Nr. 4 KraftStG */
export const H_PLATE_TAX = { eur: 191.73, source: 'https://www.gesetze-im-internet.de/kraftstg/__9.html', label: "§ 9 Abs. 4 Nr. 2 KraftStG" }

export const EMPTY_OWNERSHIP: OwnershipInput = { years: 3, kmPerYear: 0, consumption: 0, fuelPrice: 0, insurance: 0, tax: 0, maintenance: 0, other: 0, valueChangePct: 0, purchase: 0 }

export type OwnershipYear = { year: number; running: number; fuel: number; value: number; cumulative: number }

export function simulateOwnership(i: OwnershipInput) {
  const years = Math.max(1, Math.min(30, Math.round(i.years)))
  const fuelPerYear = (i.kmPerYear * i.consumption * i.fuelPrice) / 100
  const fixedPerYear = i.insurance + i.tax + i.maintenance + i.other
  const runningPerYear = fuelPerYear + fixedPerYear
  const rows: OwnershipYear[] = []
  let cumulative = 0
  for (let y = 1; y <= years; y++) {
    cumulative += runningPerYear
    rows.push({ year: y, running: runningPerYear, fuel: fuelPerYear, value: i.purchase * Math.pow(1 + i.valueChangePct / 100, y), cumulative })
  }
  const resale = rows[rows.length - 1].value
  const valueDelta = i.purchase - resale // positiv = Wertverlust
  const total = cumulative + valueDelta
  const km = i.kmPerYear * years
  return {
    years,
    rows,
    fuelPerYear,
    fixedPerYear,
    runningPerYear,
    resale,
    valueDelta,
    total,
    perMonth: total / (years * 12),
    perKm: km > 0 ? total / km : 0,
  }
}
