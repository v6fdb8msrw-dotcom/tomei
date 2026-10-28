// Landed-Cost-Rechnung: vom Hammerpreis in Yen bis zum zugelassenen Auto im Zielland.
// Alle Beträge in der Währung des Ziellands.

export type CalcInput = {
  vehicle: number // Fahrzeugwert (Hammer), umgerechnet
  japanFees: number // Auktionshaus, Recycling, Inlandstransport JP, Export-Papiere, Inspektion
  freight: number
  insureOn: boolean
  insurePct: number // Prozent von Warenwert + Fracht
  dutyPct: number
  vatPct: number
  fees: { clearance: number; agent: number; inland: number; inspection: number; reg: number }
}

export function landedCost(c: CalcInput) {
  const fob = c.vehicle + c.japanFees
  const insurance = c.insureOn ? (fob + c.freight) * (c.insurePct / 100) : 0
  const cif = fob + c.freight + insurance // Zollwert an der Grenze
  const duty = cif * (c.dutyPct / 100)
  const vatBase = cif + duty
  const vat = vatBase * (c.vatPct / 100)
  const f = c.fees
  const destFees = f.clearance + f.agent + f.inland + f.inspection + f.reg
  const landed = cif + duty + vat + destFees
  const taxes = duty + vat
  return {
    fob,
    insurance,
    cif,
    duty,
    vatBase,
    vat,
    destFees,
    landed,
    taxes,
    taxShare: landed > 0 ? taxes / landed : 0,
    multiplier: c.vehicle > 0 ? landed / c.vehicle : 0,
    markupPct: c.vehicle > 0 ? (landed / c.vehicle - 1) * 100 : 0,
  }
}

export const money = (v: number, cur: string) =>
  new Intl.NumberFormat('de-DE', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(Number.isFinite(v) ? v : 0)
export const yen = (v: number) => '¥ ' + new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 }).format(Number.isFinite(v) ? Math.round(v) : 0)
export const int = (v: number) => new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 }).format(Number.isFinite(v) ? Math.round(v) : 0)
