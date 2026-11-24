// Importrechner 2.0: vier Szenarien zur aktuellen Rechnung und Speichern in die Garage (verbindet DISCOVER mit OWN).
import { Check, Save } from 'lucide-react'
import { motion } from 'motion/react'
import { useMemo, useState } from 'react'
import type { CalcInput } from '../lib/calc.ts'
import { buildScenarios, type Range3 } from '../lib/scenarios.ts'
import { href } from '../lib/router.ts'
import { addVehicle, nowIso, updateVehicle, useStore } from '../store/store.ts'
import type { ScenarioKey } from '../store/schema.ts'
import { Badge, EASE, fmtMoney, vehicleTitle } from './ui.tsx'

const LABEL: Record<ScenarioKey, { t: string; d: string }> = {
  best: { t: 'Best Case', d: 'günstigster veröffentlichter Agent bzw. günstigste Fracht, Kurs zu deinen Gunsten' },
  expected: { t: 'Expected', d: 'deine Eingaben wie oben, Tageskurs' },
  worst: { t: 'Worst Case', d: 'teuerster veröffentlichter Agent bzw. teuerste Fracht, Kurs gegen dich, Reserve' },
  custom: { t: 'Custom', d: 'deine eigenen Annahmen' },
}

export function ScenarioPanel({ base, originFees, freight, cur, basis, linkedId, suggestion, fxLabel }: {
  base: CalcInput
  originFees: Range3
  freight: Range3
  cur: string
  basis: string
  /** Fahrzeug aus der Garage, das gerade gerechnet wird */
  linkedId?: string
  suggestion?: { make: string; model: string; year?: number; price?: { amount: number; cur: string }; market?: string; url?: string; image?: string }
  fxLabel: string
}) {
  const vehicles = useStore((s) => s.vehicles)
  const [fxBand, setFxBand] = useState(5)
  const [reserve, setReserve] = useState(10)
  const [custom, setCustom] = useState({ fxPct: 0, reservePct: 5, originFees: Math.round(originFees.expected), freight: Math.round(freight.expected) })
  const [pick, setPick] = useState<ScenarioKey>('expected')
  const [target, setTarget] = useState<string>(linkedId && vehicles.some((v) => v.id === linkedId) ? linkedId : '')
  const [make, setMake] = useState(suggestion?.make ?? '')
  const [model, setModel] = useState(suggestion?.model ?? '')
  const [saved, setSaved] = useState<string | null>(null)

  const s = useMemo(() => buildScenarios({ base, originFees, freight, fxBandPct: fxBand, worstReservePct: reserve, custom }), [base, originFees, freight, fxBand, reserve, custom])
  const min = s.best.total
  const max = Math.max(s.worst.total, s.custom.total, s.expected.total)
  const lo = Math.min(min, s.custom.total)
  const pos = (v: number) => (max > lo ? ((v - lo) / (max - lo)) * 100 : 50)
  const m = (v: number) => fmtMoney(v, cur)

  const save = () => {
    const landed = { amount: Math.round(s[pick].total), cur, scenario: pick, savedAt: nowIso(), basis, range: { best: Math.round(s.best.total), worst: Math.round(s.worst.total) } }
    if (target) {
      // Status nur anheben, wenn er noch „Traum“ oder „Beobachtet“ ist
      const v = vehicles.find((x) => x.id === target)
      updateVehicle(target, { landed, status: v?.status === 'dream' || v?.status === 'watchlist' ? 'planned' : v?.status })
      setSaved(target)
    } else {
      if (!make.trim() && !model.trim()) return
      const v = addVehicle({ make: make.trim() || 'Auto', model: model.trim() || '', year: suggestion?.year, price: suggestion?.price, market: suggestion?.market, url: suggestion?.url, image: suggestion?.image, status: 'planned', landed, source: 'calculator' })
      setTarget(v.id)
      setSaved(v.id)
    }
  }

  return (
    <div className="scen" id="szenarien">
      <div className="scen-head">
        <div>
          <p className="eyebrow">Szenarien</p>
          <h3>
            {m(s.best.total)} <em>bis</em> {m(s.worst.total)}
          </h3>
          <p className="muted small">Gleiche Rechnung, vier Blickwinkel. Die Spanne kommt aus veröffentlichten Preisen und aus zwei Annahmen, die du selbst einstellst.</p>
        </div>
      </div>

      <div className="scen-range" aria-hidden>
        <div className="scen-track">
          <motion.i className="scen-fill" initial={false} animate={{ left: pos(s.best.total) + '%', width: pos(s.worst.total) - pos(s.best.total) + '%' }} transition={{ duration: 0.5, ease: EASE }} />
          {(['best', 'expected', 'worst', 'custom'] as ScenarioKey[]).map((k) => (
            <motion.span key={k} className={'scen-mark k-' + k} initial={false} animate={{ left: pos(s[k].total) + '%' }} transition={{ duration: 0.5, ease: EASE }} />
          ))}
        </div>
      </div>

      <div className="scen-cards">
        {(['best', 'expected', 'worst', 'custom'] as ScenarioKey[]).map((k) => (
          <button key={k} className={'scen-card k-' + k + (pick === k ? ' on' : '')} onClick={() => setPick(k)} aria-pressed={pick === k}>
            <span className="scen-t">{LABEL[k].t}</span>
            <b className="mono">{m(s[k].total)}</b>
            <span className="scen-d">{LABEL[k].d}</span>
            <span className="scen-diff mono">{k === 'expected' ? '±0' : (s[k].total - s.expected.total >= 0 ? '+' : '−') + m(Math.abs(s[k].total - s.expected.total))}</span>
          </button>
        ))}
      </div>

      <div className="scen-assume">
        <label className="field">
          <span className="f-label">
            Kursschwankung ± <Badge kind="assumption" />
          </span>
          <span className="input">
            <input type="number" min={0} max={30} step={0.5} value={fxBand} onChange={(e) => setFxBand(Math.max(0, Math.min(30, Number(e.target.value) || 0)))} />
            <span className="adorn">%</span>
          </span>
          <span className="hint">{fxLabel}</span>
        </label>
        <label className="field">
          <span className="f-label">
            Reserve im Worst Case <Badge kind="assumption" />
          </span>
          <span className="input">
            <input type="number" min={0} max={100} step={1} value={reserve} onChange={(e) => setReserve(Math.max(0, Math.min(100, Number(e.target.value) || 0)))} />
            <span className="adorn">%</span>
          </span>
          <span className="hint">vom Fahrzeugwert, für Reparaturen, Umbau, Standzeit</span>
        </label>
      </div>

      <details className="scen-custom">
        <summary>Custom-Szenario einstellen</summary>
        <div className="fields">
          <label className="field">
            <span className="f-label">Kursabweichung</span>
            <span className="input">
              <input type="number" step={0.5} value={custom.fxPct} onChange={(e) => setCustom({ ...custom, fxPct: Number(e.target.value) || 0 })} />
              <span className="adorn">%</span>
            </span>
          </label>
          <label className="field">
            <span className="f-label">Reserve</span>
            <span className="input">
              <input type="number" min={0} step={1} value={custom.reservePct} onChange={(e) => setCustom({ ...custom, reservePct: Math.max(0, Number(e.target.value) || 0) })} />
              <span className="adorn">%</span>
            </span>
          </label>
          <label className="field">
            <span className="f-label">Kosten im Herkunftsland</span>
            <span className="input">
              <span className="adorn">{cur}</span>
              <input type="number" min={0} step={50} value={custom.originFees} onChange={(e) => setCustom({ ...custom, originFees: Math.max(0, Number(e.target.value) || 0) })} />
            </span>
          </label>
          <label className="field">
            <span className="f-label">Fracht</span>
            <span className="input">
              <span className="adorn">{cur}</span>
              <input type="number" min={0} step={50} value={custom.freight} onChange={(e) => setCustom({ ...custom, freight: Math.max(0, Number(e.target.value) || 0) })} />
            </span>
          </label>
        </div>
      </details>

      <div className="scen-save">
        <div className="scen-save-in">
          <span className="f-label">
            <b>{LABEL[pick].t}</b> in die Garage übernehmen
          </span>
          <div className="scen-save-row">
            <select className="input" value={target} onChange={(e) => setTarget(e.target.value)} aria-label="Fahrzeug">
              <option value="">Neues Fahrzeug anlegen</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {vehicleTitle(v)}
                </option>
              ))}
            </select>
            {!target && (
              <>
                <input className="input" placeholder="Marke" value={make} onChange={(e) => setMake(e.target.value)} aria-label="Marke" />
                <input className="input" placeholder="Modell" value={model} onChange={(e) => setModel(e.target.value)} aria-label="Modell" />
              </>
            )}
            <button className="btn primary" onClick={save} disabled={!target && !make.trim() && !model.trim()}>
              <Save size={16} /> Speichern
            </button>
          </div>
          {saved && (
            <p className="ok-line">
              <Check size={15} /> Gespeichert.{' '}
              <a href={href('own/garage/' + saved)}>Zur Garage</a> · <a href={href('own/simulator/' + saved)}>Unterhalt simulieren</a>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
