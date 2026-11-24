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

const FIELDS: { k: keyof OwnershipInput; l: string; unit: string; step?: number; hint?: string }[] = [
  { k: 'purchase', l: 'Kaufpreis bzw. Importkosten', unit: '€', step: 500 },
  { k: 'years', l: 'Haltedauer', unit: 'Jahre', step: 1 },
  { k: 'kmPerYear', l: 'Fahrleistung', unit: 'km/Jahr', step: 500 },
  { k: 'consumption', l: 'Verbrauch', unit: 'l/100 km', step: 0.1 },
  { k: 'fuelPrice', l: 'Spritpreis', unit: '€/l', step: 0.01 },
  { k: 'insurance', l: 'Versicherung', unit: '€/Jahr', step: 50 },
  { k: 'tax', l: 'Kfz-Steuer', unit: '€/Jahr', step: 10 },
  { k: 'maintenance', l: 'Wartung & Reparatur', unit: '€/Jahr', step: 100 },
  { k: 'other', l: 'Stellplatz, Pflege, Sonstiges', unit: '€/Jahr', step: 50 },
  { k: 'valueChangePct', l: 'Wertänderung', unit: '%/Jahr', step: 0.5, hint: 'negativ = Wertverlust' },
]

export default function Simulator({ vehicleId }: { vehicleId?: string }) {
  const { locale } = useT()
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
        eyebrow="Own · Ownership-Simulator"
        title={
          <>
            Was es kostet, <em>es zu behalten.</em>
          </>
        }
        sub="Sprit, Versicherung, Steuer, Wartung und Wertänderung über die Haltedauer. Der Simulator rechnet nur mit deinen Zahlen; Versicherung und Steuer hängen von Fahrzeug, Wohnort und Tarif ab."
        image={img('cars/fd')}
      />
      <section className="section sim">
        <div className="sim-inputs gcard">
          <VehicleSelect vehicles={vehicles} value={sel} onChange={setSel} allowNone="Ohne Fahrzeug rechnen" />
          {v?.landed && (
            <p className="small muted">
              Importkosten aus dem Rechner: {fmtMoney(v.landed.amount, v.landed.cur, locale)}
              {v.landed.cur !== 'EUR' && ' (nicht in Euro, bitte umrechnen)'}
            </p>
          )}
          <div className="fields two">
            {FIELDS.map((f) => (
              <label key={f.k} className="field">
                <span className="f-label">{f.l}</span>
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
                  <span className="adorn">{f.unit}</span>
                </span>
                {f.hint && <span className="hint">{f.hint}</span>}
              </label>
            ))}
          </div>
          <div className="row gap wrap">
            {classic && (
              <button className="btn small" onClick={() => setInp({ ...inp, tax: H_PLATE_TAX.eur })}>
                H-Kennzeichen: {H_PLATE_TAX.eur.toLocaleString('de-DE')} €/Jahr
              </button>
            )}
            <button
              className="btn small"
              onClick={() => {
                setInp(DEMO)
                setDemo(true)
              }}
            >
              Beispielwerte laden
            </button>
          </div>
          <p className="small muted">
            Kfz-Steuer mit H-Kennzeichen: {H_PLATE_TAX.eur.toLocaleString('de-DE')} € pauschal (<SourceLink url={H_PLATE_TAX.source}>{H_PLATE_TAX.label}</SourceLink>). Sonst die Steuer beim Zoll berechnen lassen: <SourceLink url="https://www.bundesfinanzministerium.de/Web/DE/Service/Apps_Rechner/KfzRechner/KfzRechner.html">Kfz-Steuer-Rechner des BMF</SourceLink>.
          </p>
        </div>

        <div className="sim-out">
          <div className="gcard sim-total">
            {demo && <Badge kind="demo">Beispielwerte, keine Marktdaten</Badge>}
            <span className="muted">Kosten über {r.years} Jahre</span>
            <b className="mono">{m(r.total)}</b>
            <div className="sim-kpis">
              <span>
                <b className="mono">{m(r.perMonth)}</b> pro Monat
              </span>
              <span>
                <b className="mono">{r.perKm ? r.perKm.toLocaleString(locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }) : '–'}</b> pro km
              </span>
              <span>
                <b className="mono">{m(r.runningPerYear)}</b> laufend pro Jahr
              </span>
              <span>
                <b className="mono">{r.valueDelta >= 0 ? '−' + m(r.valueDelta) : '+' + m(-r.valueDelta)}</b> {r.valueDelta >= 0 ? 'Wertverlust' : 'Wertgewinn'}
              </span>
            </div>
          </div>

          <div className="gcard">
            <h3>Jahr für Jahr</h3>
            <div className="sim-bars" role="table" aria-label="Kumulierte Kosten pro Jahr">
              {r.rows.map((row) => {
                const loss = Math.max(0, inp.purchase - row.value)
                return (
                  <div key={row.year} className="sim-row" role="row">
                    <span role="cell">Jahr {row.year}</span>
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
                <i className="run" /> laufende Kosten
              </span>
              <span>
                <i className="loss" /> Wertverlust
              </span>
            </div>
            <p className="small muted">Restwert nach {r.years} Jahren: {m(r.resale)}. Inflation und Finanzierung sind nicht eingerechnet.</p>
          </div>

          {v ? (
            <button
              className="btn primary"
              onClick={() => {
                updateVehicle(v.id, { ownership: inp })
                setSaved(true)
              }}
            >
              {saved ? <Check size={16} /> : <Save size={16} />} {saved ? 'Gespeichert' : `Bei ${vehicleTitle(v)} speichern`}
            </button>
          ) : (
            <Note>
              Mit einem Fahrzeug aus der <a href={href('own/garage')}>Garage</a> werden die Werte am Auto gespeichert.
            </Note>
          )}
        </div>
      </section>
    </>
  )
}
