// Gesamtkosten je Portal: Kaufpreis vor Ort → alles bis vor die Tür, mit den veröffentlichten Werten aus data.ts.
import { AGENTS, DEST, ORIGIN, agentAverage, type DestKey } from '../data.ts'
import type { ListingPortal } from '../data/portals.ts'
import { landedCost } from './calc.ts'

export type Quote = {
  /** bis vor die Tür in Euro */
  total: number
  /** alles zusätzlich zum Kaufpreis */
  extra: number
  rows: { de: string; en: string; eur: number }[]
  /** Posten ohne veröffentlichten Preis */
  missing: { de: string; en: string }[]
  notes: { de: string; en: string }[]
}

/** rates: Wert von 1 ¥ in der jeweiligen Währung */
export function quote(p: Pick<ListingPortal, 'market' | 'house' | 'exporter'>, priceEur: number, o: { rates: Record<string, number>; home: string; classic: boolean }): Quote {
  const eur = (v: number, cur: string) => (cur === 'EUR' ? v : cur === 'JPY' ? v * o.rates.EUR : (v / o.rates[cur]) * o.rates.EUR)
  const toLocal = (v: number, cur: string) => (cur === 'JPY' ? v / o.rates.EUR : (v / o.rates.EUR) * o.rates[cur])
  const rows: Quote['rows'] = []
  const missing: Quote['missing'] = []
  const notes: Quote['notes'] = []
  const add = (de: string, en: string, v: number) => v > 0 && rows.push({ de, en, eur: Math.round(v) })

  if (p.market === 'eu') {
    notes.push({ de: 'Innerhalb der EU ohne Zoll und Einfuhrsteuer. Abholung oder Transport und Zulassung kommen dazu.', en: 'No duty or import VAT within the EU. Collection or transport and registration are extra.' })
    if (!['de', 'at', 'it', 'fr', 'nl', 'be', 'es', 'pt', 'ie', 'dk', 'se', 'fi', 'pl', 'cz', 'si', 'hr', 'ro', 'hu', 'gr', 'lu'].includes(o.home)) notes.push({ de: 'Dein Zielland liegt außerhalb der EU: dort können Einfuhrabgaben anfallen.', en: 'Your destination is outside the EU: import charges may apply there.' })
    return { total: Math.round(priceEur), extra: 0, rows, missing, notes }
  }

  const key = (o.home.toUpperCase() in DEST ? o.home.toUpperCase() : 'DE') as DestKey
  const jp = p.market === 'jp'
  // Außer Japan gibt es belegte Werte nur für das Ziel Deutschland
  const dest = jp ? DEST[key] : DEST.DE
  if (!jp && o.home !== 'de') notes.push({ de: 'Für dieses Herkunftsland sind nur Kosten nach Deutschland belegt; gezeigt ist Deutschland.', en: 'For this origin only costs to Germany are documented; Germany is shown.' })
  const dc = (v: number) => eur(v, dest.cur)
  let origin = 0
  let freight: number
  const fees = { ...dest.fees }
  if (jp) {
    if (p.exporter) notes.push({ de: 'Exporthändler: Preise meist ab Hafen (FOB). Gebühren je Händler prüfen.', en: 'Export dealer: prices usually FOB. Check dealer fees.' })
    else {
      origin = eur(agentAverage(toLocal(priceEur, 'JPY')), 'JPY')
      add(`Export-Agent in Japan (Ø ${AGENTS.length} Firmen)`, `Export agent in Japan (avg of ${AGENTS.length})`, origin)
    }
    freight = dc(dest.freight.roro)
    add('Seefracht (RoRo)', 'Sea freight (RoRo)', freight)
  } else {
    const O = ORIGIN[p.market as 'us' | 'uk' | 'au']
    const h = O.houses.find((x) => x.id === p.house)
    if (h) {
      origin = eur(h.fee(toLocal(priceEur, O.cur)), O.cur)
      add(`Käufergebühr ${h.name}`, `Buyer’s fee ${h.name}`, origin)
    }
    const s = O.ship[0]
    freight = s.cost === null ? 0 : eur(s.cost, s.cur)
    if (s.cost === null) missing.push({ de: `Seefracht ab ${O.name}`, en: `Sea freight from ${O.name}` })
    else add(s.selfDrive ? 'Fähre (selbst fahren)' : s.label, s.selfDrive ? 'Ferry (self-drive)' : 'Sea freight', freight)
    if (O.destHandling) {
      fees.clearance = O.destHandling.eur
      fees.agent = 0
    }
    if (s.selfDrive) fees.inland = 0
    else missing.push({ de: 'Transport zum Hafen im Herkunftsland', en: 'Transport to port abroad' })
    if (O.pref) notes.push({ de: `${O.pref.label}: Zoll kann mit Ursprungsnachweis entfallen.`, en: 'Duty may be waived with proof of origin.' })
  }
  const classic = o.classic && (jp ? key === 'DE' : true)
  const duty = classic ? 0 : dest.duty
  const vat = classic ? 7 : dest.vat
  const c = landedCost({ vehicle: priceEur, japanFees: origin, freight, insureOn: freight > 0 && p.market !== 'uk', insurePct: 1.5, dutyPct: duty, vatPct: vat, fees: { clearance: dc(fees.clearance), agent: dc(fees.agent), inland: dc(fees.inland), inspection: dc(fees.inspection), reg: dc(fees.reg) } })
  add('Transportversicherung', 'Transport insurance', c.insurance)
  add(`Zoll ${duty} %`, `Duty ${duty}%`, c.duty)
  add(`${dest.vatLabel} ${vat} %`, `${dest.vatLabel} ${vat}%`, c.vat)
  add('Zollabwicklung, Hafen, Transport', 'Clearance, port, transport', dc(fees.clearance + fees.agent + fees.inland))
  add(`${dest.inspectionLabel}, Zulassung`, 'Inspection, registration', dc(fees.inspection + fees.reg))
  if (classic) notes.push({ de: 'Mit Oldtimer-Regel gerechnet (Sammlungsstück, 0 % Zoll, 7 % EUSt). Gilt nur ab 30 Jahren im Originalzustand.', en: 'Calculated with the classic rule (collector’s item, 0% duty, 7% VAT). Only from 30 years in original condition.' })
  return { total: Math.round(c.landed), extra: Math.round(c.landed - priceEur), rows, missing, notes }
}
