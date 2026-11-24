// Importrechner 2.0: aus einer Rechnung vier Szenarien (Best / Expected / Worst / Custom).
// Die Spannen kommen nur aus veröffentlichten Werten (günstigster/teuerster Agent, RoRo/Container)
// und aus Annahmen, die der Nutzer sieht und ändern kann (Kursschwankung, Reserve).
import { landedCost, type CalcInput } from './calc.ts'
import type { ScenarioKey } from '../store/schema.ts'

export type Range3 = { low: number; expected: number; high: number }

export type ScenarioParams = {
  /** Rechnung wie eingegeben (= Expected). vehicle und japanFees sind schon in Zielwährung umgerechnet. */
  base: CalcInput
  /** Kosten im Herkunftsland (Agent/Aufgeld) in Zielwährung */
  originFees: Range3
  /** Fracht in Zielwährung */
  freight: Range3
  /** Annahme: Kursschwankung bis zur Zahlung in Prozent (wirkt auf alles, was in Fremdwährung bezahlt wird) */
  fxBandPct: number
  /** Annahme: Reserve für Unvorhergesehenes im Worst Case, in Prozent vom Fahrzeugwert */
  worstReservePct: number
  custom: { fxPct: number; reservePct: number; originFees: number; freight: number }
}

export type ScenarioResult = ReturnType<typeof landedCost> & {
  key: ScenarioKey
  fxPct: number
  reserve: number
  total: number
  originFees: number
  freight: number
}

export function runScenario(key: ScenarioKey, base: CalcInput, o: { fxPct: number; originFees: number; freight: number; reservePct: number }): ScenarioResult {
  const f = 1 + o.fxPct / 100
  const vehicle = base.vehicle * f
  const r = landedCost({ ...base, vehicle, japanFees: o.originFees * f, freight: o.freight })
  const reserve = vehicle * (o.reservePct / 100)
  return { ...r, key, fxPct: o.fxPct, reserve, total: r.landed + reserve, originFees: o.originFees * f, freight: o.freight }
}

export function buildScenarios(p: ScenarioParams): Record<ScenarioKey, ScenarioResult> {
  const band = Math.max(0, p.fxBandPct)
  return {
    best: runScenario('best', p.base, { fxPct: -band, originFees: p.originFees.low, freight: p.freight.low, reservePct: 0 }),
    expected: runScenario('expected', p.base, { fxPct: 0, originFees: p.originFees.expected, freight: p.freight.expected, reservePct: 0 }),
    worst: runScenario('worst', p.base, { fxPct: band, originFees: p.originFees.high, freight: p.freight.high, reservePct: Math.max(0, p.worstReservePct) }),
    custom: runScenario('custom', p.base, { fxPct: p.custom.fxPct, originFees: p.custom.originFees, freight: p.custom.freight, reservePct: Math.max(0, p.custom.reservePct) }),
  }
}

/** Kleinster, mittlerer und größter Wert einer Liste (für Agenten-Gebühren) */
export function range3(values: number[], expected?: number): Range3 {
  const v = values.filter((x) => Number.isFinite(x))
  if (!v.length) return { low: expected ?? 0, expected: expected ?? 0, high: expected ?? 0 }
  const low = Math.min(...v)
  const high = Math.max(...v)
  return { low, expected: expected ?? v.reduce((s, x) => s + x, 0) / v.length, high }
}
