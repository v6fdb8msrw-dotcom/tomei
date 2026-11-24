// Ownership-Simulator: Unterhalt über die Haltedauer, nur mit Werten des Nutzers (plus belegte H-Kennzeichen-Steuer).
import { Check, Save } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'
import { Badge, EASE, Note, PageHead, SourceLink, VehicleSelect, fmtMoney, img, vehicleTitle } from '../../components/ui.tsx'
import { EMPTY_OWNERSHIP, H_PLATE_TAX, simulateOwnership } from '../../lib/ownership.ts'
import { href } from '../../lib/router.ts'
import { updateVehicle, useStore } from '../../store/store.ts'
import type { OwnershipInput } from '../../store/schema.ts'
import { useT } from '../../i18n/i18n.ts'

/** Klar gekennzeichnete Beispielwerte zum Ausprobieren, keine Marktdaten */
const DEMO: OwnershipInput = { years: 5, kmPerYear: 6000, consumption: 11, fuelPrice: 1.8, insurance: 600, tax: H_PLATE_TAX.eur, maintenance: 1200, other: 600, valueChangePct: 0, purchase: 40000 }

type Tx = { de: string; en: string }
const YR: Tx = { de: '€/Jahr', en: '€/year' }
const FIELDS: { k: keyof OwnershipInput; l: Tx; unit: Tx; step?: number; hint?: Tx }[] = [
  { k: 'purchase', l: { de: 'Kaufpreis bzw. Importkosten', en: 'Purchase or landed cost' }, unit: { de: '€', en: '€' }, step: 500 },
  { k: 'years', l: { de: 'Haltedauer', en: 'Holding period' }, unit: { de: 'Jahre', en: 'years' }, step: 1 },
  { k: 'kmPerYear', l: { de: 'Fahrleistung', en: 'Distance' }, unit: { de: 'km/Jahr', en: 'km/year' }, step: 500 },
  { k: 'consumption', l: { de: 'Verbrauch', en: 'Consumption' }, unit: { de: 'l/100 km', en: 'l/100 km' }, step: 0.1 },
  { k: 'fuelPrice', l: { de: 'Spritpreis', en: 'Fuel price' }, unit: { de: '€/l', en: '€/l' }, step: 0.01 },
  { k: 'insurance', l: { de: 'Versicherung', en: 'Insurance' }, unit: YR, step: 50 },
  { k: 'tax', l: { de: 'Kfz-Steuer', en: 'Vehicle tax' }, unit: YR, step: 10 },
  { k: 'maintenance', l: { de: 'Wartung & Reparatur', en: 'Service & repairs' }, unit: YR, step: 100 },
  { k: 'other', l: { de: 'Stellplatz, Pflege, Sonstiges', en: 'Parking, care, other' }, unit: YR, step: 50 },
  { k: 'valueChangePct', l: { de: 'Wertänderung', en: 'Change in value' }, unit: { de: '%/Jahr', en: '%/year' }, step: 0.5, hint: { de: 'negativ = Wertverlust', en: 'negative = depreciation' } },
]

export default function Simulator({ vehicleId }: { vehicleId?: string }) {
  const { tx, L, locale } = useT()
  const vehicles = useStore((s) => s.vehicles)
  const [sel, setSel] = useState(vehicleId ?? vehicles.find((v) => v.status === 'owned' || v.status === 'planned')?.id ?? '')
  const v = vehicles.find((x) => x.id === sel)
  const initial = (): OwnershipInput => v?.ownership ?? { ...EMPTY_OWNERSHIP, purchase: v?.landed && v.landed.cur === 'EUR' ? v.landed.amount : v?.price?.cur === 'EUR' ? v.price.amount : 0 }
  const [inp, setInp] = useState<OwnershipInput>(initial)
  const [demo, setDemo] = useState(false)
  const [saved, setSaved] = useState(false)
  useEffect(() => {
    setInp(initial())
    setDemo(false)
    setSaved(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel])
  const r = useMemo(() => simulateOwnership(inp), [inp])
  const m = (x: number) => fmtMoney(x, 'EUR', locale)
  const classic = v?.year && new Date().getFullYear() - v.year >= 30
  const maxBar = Math.max(1, ...r.rows.map((x) => x.cumulative + Math.max(0, inp.purchase - x.value)))

  return (
    <>
      <PageHead
        eyebrow={tx('Own · Ownership-Simulator', 'Own · Ownership simulator')}
        title={
          <>
            {tx('Was es kostet, ', 'What it costs ')}<em>{tx('es zu behalten.', 'to keep it.')}</em>
          </>
        }
        sub={tx('Sprit, Versicherung, Steuer, Wartung und Wertänderung über die Haltedauer. Der Simulator rechnet nur mit deinen Zahlen; Versicherung und Steuer hängen von Fahrzeug, Wohnort und Tarif ab.', 'Fuel, insurance, tax, maintenance and change in value over the holding period. The simulator only uses your numbers; insurance and tax depend on vehicle, location and policy.')}
        image={img('cars/fd')}
      />
      <section className="section sim">
        <div className="sim-inputs gcard">
          <VehicleSelect vehicles={vehicles} value={sel} onChange={setSel} allowNone={tx('Ohne Fahrzeug rechnen', 'Calculate without a vehicle')} />
          {v?.landed && (
            <p className="small muted">
              {tx('Importkosten aus dem Rechner', 'Landed cost from the calculator')}: {fmtMoney(v.landed.amount, v.landed.cur, locale)}
              {v.landed.cur !== 'EUR' && tx(' (nicht in Euro, bitte umrechnen)', ' (not in euros, please convert)')}
            </p>
          )}
          <div className="fields two">
            {FIELDS.map((f) => (
              <label key={f.k} className="field">
                <span className="f-label">{L(f.l)}</span>
                <span className="input">
                  <input
                    type="number"
                    step={f.step}
                    min={f.k === 'valueChangePct' ? -50 : 0}
                    value={Number.isFinite(inp[f.k]) ? inp[f.k] : 0}
                    onChange={(e) => {
                      setInp({ ...inp, [f.k]: Number(e.target.value) || 0 })
                      setDemo(false)
                      setSaved(false)
                    }}
                  />
                  <span className="adorn">{L(f.unit)}</span>
                </span>
                {f.hint && <span className="hint">{L(f.hint)}</span>}
              </label>
            ))}
          </div>
          <div className="row gap wrap">
            {classic && (
              <button className="btn small" onClick={() => setInp({ ...inp, tax: H_PLATE_TAX.eur })}>
                {tx('H-Kennzeichen', 'H plate (historic)')}: {H_PLATE_TAX.eur.toLocaleString(locale)} {tx('€/Jahr', '€/year')}
              </button>
            )}
            <button
              className="btn small"
              onClick={() => {
                setInp(DEMO)
                setDemo(true)
              }}
            >
              {tx('Beispielwerte laden', 'Load example values')}
            </button>
          </div>
          <p className="small muted">
            {tx('Kfz-Steuer mit H-Kennzeichen', 'German vehicle tax with H plate')}: {H_PLATE_TAX.eur.toLocaleString(locale)} {tx('€ pauschal', '€ flat rate')} (<SourceLink url={H_PLATE_TAX.source}>{H_PLATE_TAX.label}</SourceLink>). {tx('Sonst die Steuer beim Zoll berechnen lassen', 'Otherwise calculate the tax with the official tool')}: <SourceLink url="https://www.bundesfinanzministerium.de/Web/DE/Service/Apps_Rechner/KfzRechner/KfzRechner.html">{tx('Kfz-Steuer-Rechner des BMF', 'BMF vehicle tax calculator')}</SourceLink>.
          </p>
        </div>

        <div className="sim-out">
          <div className="gcard sim-total">
            {demo && <Badge kind="demo">{tx('Beispielwerte, keine Marktdaten', 'Example values, not market data')}</Badge>}
            <span className="muted">{tx(`Kosten über ${r.years} Jahre`, `Cost over ${r.years} years`)}</span>
            <b className="mono">{m(r.total)}</b>
            <div className="sim-kpis">
              <span>
                <b className="mono">{m(r.perMonth)}</b> {tx('pro Monat', 'per month')}
              </span>
              <span>
                <b className="mono">{r.perKm ? r.perKm.toLocaleString(locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }) : '–'}</b> {tx('pro km', 'per km')}
              </span>
              <span>
                <b className="mono">{m(r.runningPerYear)}</b> {tx('laufend pro Jahr', 'running per year')}
              </span>
              <span>
                <b className="mono">{r.valueDelta >= 0 ? '−' + m(r.valueDelta) : '+' + m(-r.valueDelta)}</b> {r.valueDelta >= 0 ? tx('Wertverlust', 'depreciation') : tx('Wertgewinn', 'appreciation')}
              </span>
            </div>
          </div>

          <div className="gcard">
            <h3>{tx('Jahr für Jahr', 'Year by year')}</h3>
            <div className="sim-bars" role="table" aria-label={tx('Kumulierte Kosten pro Jahr', 'Cumulative cost per year')}>
              {r.rows.map((row) => {
                const loss = Math.max(0, inp.purchase - row.value)
                return (
                  <div key={row.year} className="sim-row" role="row">
                    <span role="cell">{tx('Jahr', 'Year')} {row.year}</span>
                    <span className="sim-bar" role="cell">
                      <motion.i className="run" initial={{ width: 0 }} animate={{ width: (row.cumulative / maxBar) * 100 + '%' }} transition={{ duration: 0.5, ease: EASE }} />
                      <motion.i className="loss" initial={{ width: 0 }} animate={{ width: (loss / maxBar) * 100 + '%' }} transition={{ duration: 0.5, ease: EASE }} />
                    </span>
                    <span className="mono" role="cell">
                      {m(row.cumulative + loss)}
                    </span>
                  </div>
                )
              })}
            </div>
            <div className="legend-inline">
              <span>
                <i className="run" /> {tx('laufende Kosten', 'running costs')}
              </span>
              <span>
                <i className="loss" /> {tx('Wertverlust', 'depreciation')}
              </span>
            </div>
            <p className="small muted">{tx(`Restwert nach ${r.years} Jahren`, `Residual value after ${r.years} years`)}: {m(r.resale)}. {tx('Inflation und Finanzierung sind nicht eingerechnet.', 'Inflation and financing are not included.')}</p>
          </div>

          {v ? (
            <button
              className="btn primary"
              onClick={() => {
                updateVehicle(v.id, { ownership: inp })
                setSaved(true)
              }}
            >
              {saved ? <Check size={16} /> : <Save size={16} />} {saved ? tx('Gespeichert', 'Saved') : tx(`Bei ${vehicleTitle(v)} speichern`, `Save to ${vehicleTitle(v)}`)}
            </button>
          ) : (
            <Note>
              {tx('Mit einem Fahrzeug aus der ', 'With a vehicle from the ')}<a href={href('own/garage')}>Garage</a>{tx(' werden die Werte am Auto gespeichert.', ' the values are saved to the car.')}
            </Note>
          )}
        </div>
      </section>
    </>
  )
}
