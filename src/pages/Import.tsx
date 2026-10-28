import { ArrowUpRight, ChevronDown, RotateCcw, Sparkles } from 'lucide-react'
import { animate, AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { BROKERS, CARS, DEST, FX_FALLBACK, HERO, IMPORTERS, type DestKey } from '../data.ts'
import { EASE, Hero, ProviderGrid, Reveal, SectionHead } from '../components/motion.tsx'
import { int, landedCost, money, yen } from '../lib/calc.ts'

const COLORS = {
  vehicle: '#8b93a1',
  japan: '#5d6676',
  freight: '#3a8fb7',
  insurance: '#2dd4bf',
  duty: '#f5a524',
  vat: '#e5322d',
  dest: '#b794f6',
}

type Fees = { clearance: number; agent: number; inland: number; inspection: number; reg: number }

const DEFAULT_JAPAN_FEES = 180000

function useFx() {
  const [rates, setRates] = useState<Record<string, number>>(FX_FALLBACK)
  const [live, setLive] = useState<{ date: string } | null>(null)
  useEffect(() => {
    // Tageskurs der EZB, ohne Schlüssel und CORS-freundlich (frankfurter.app ist nicht mehr erreichbar)
    fetch('https://api.frankfurter.dev/v1/latest?base=JPY&symbols=EUR,USD,GBP,AUD,CAD,NZD')
      .then((r) => r.json())
      .then((d) => {
        if (d?.rates) {
          setRates(d.rates)
          setLive({ date: d.date })
        }
      })
      .catch(() => setLive(null))
  }, [])
  return { rates, live }
}

/** Zahl, die zum neuen Wert hochzählt. */
function Counter({ value, format }: { value: number; format: (v: number) => string }) {
  const [shown, setShown] = useState(value)
  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      setShown(value)
      return
    }
    const c = animate(shown, value, { duration: 0.65, ease: EASE, onUpdate: setShown })
    return () => c.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])
  return <>{format(shown)}</>
}

function NumField({ label, value, onChange, prefix, suffix, hint, step = 1, disabled }: {
  label: string
  value: number
  onChange: (v: number) => void
  prefix?: string
  suffix?: string
  hint?: string
  step?: number
  disabled?: boolean
}) {
  // Ganze Beträge mit Tausenderpunkten, Prozente als normale Zahl
  const whole = step === 1
  return (
    <label className={'field' + (disabled ? ' off' : '')}>
      <span className="f-label">{label}</span>
      <span className="input">
        {prefix && <span className="adorn">{prefix}</span>}
        {whole ? (
          <input
            inputMode="numeric"
            value={value === 0 ? '' : int(value)}
            placeholder="0"
            disabled={disabled}
            onChange={(e) => {
              const d = e.target.value.replace(/[^\d]/g, '')
              onChange(d === '' ? 0 : parseInt(d, 10))
            }}
          />
        ) : (
          <input type="number" step={step} min={0} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))} />
        )}
        {suffix && <span className="adorn right">{suffix}</span>}
      </span>
      {hint && <span className="hint">{hint}</span>}
    </label>
  )
}

function Seg<T extends string>({ value, options, onChange }: { value: T; options: { v: T; l: ReactNode }[]; onChange: (v: T) => void }) {
  return (
    <div className="seg">
      {options.map((o) => (
        <button key={o.v} className={o.v === value ? 'on' : ''} onClick={() => onChange(o.v)}>
          {o.v === value && <motion.span layoutId={'seg-' + options.map((x) => x.v).join()} className="seg-pill" transition={{ type: 'spring', stiffness: 380, damping: 32 }} />}
          <span>{o.l}</span>
        </button>
      ))}
    </div>
  )
}

/** Eingeklappter Bereich, öffnet sich weich. */
function Fold({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={'fold' + (open ? ' open' : '')}>
      <button className="fold-head" onClick={() => setOpen(!open)} aria-expanded={open}>
        {title}
        <ChevronDown size={18} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div className="fold-body" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.4, ease: EASE }}>
            <div className="fold-inner">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function Import() {
  const { rates, live } = useFx()
  const [destKey, setDestKey] = useState<DestKey>('DE')
  const dest = DEST[destKey]
  const cur = dest.cur

  const [carId, setCarId] = useState(CARS[0].id)
  const [lastCar, setLastCar] = useState(CARS[0].id) // Foto bleibt stehen, wenn ein eigener Preis getippt wird
  const [price, setPrice] = useState(CARS[0].jpy)
  const [priceIn, setPriceIn] = useState<'JPY' | 'LOCAL'>('JPY')
  const [japanFees, setJapanFees] = useState(DEFAULT_JAPAN_FEES)
  const [ship, setShip] = useState<'roro' | 'container'>('roro')
  const [freight, setFreight] = useState(dest.freight.roro)
  const [insureOn, setInsureOn] = useState(true)
  const [insurePct, setInsurePct] = useState(1.5)
  const [duty, setDuty] = useState(dest.duty)
  const [vat, setVat] = useState(dest.vat)
  const [epa, setEpa] = useState(false)
  const [fees, setFees] = useState<Fees>(dest.fees)
  const [manualRate, setManualRate] = useState(0) // 1 Zielwährung = … ¥, 0 = Tageskurs

  const liveRate = rates[cur] ?? FX_FALLBACK[cur]
  const rate = manualRate > 0 ? 1 / manualRate : liveRate // JPY → Zielwährung
  const setFee = (k: keyof Fees) => (v: number) => setFees((f) => ({ ...f, [k]: v }))

  function applyDest(k: DestKey, mode = ship) {
    const d = DEST[k]
    setDestKey(k)
    setFreight(d.freight[mode])
    setDuty(d.duty)
    setVat(d.vat)
    setFees(d.fees)
    setEpa(false)
    setManualRate(0)
  }
  function reset() {
    setCarId(CARS[0].id)
    setLastCar(CARS[0].id)
    setPrice(CARS[0].jpy)
    setPriceIn('JPY')
    setJapanFees(DEFAULT_JAPAN_FEES)
    setShip('roro')
    setInsureOn(true)
    setInsurePct(1.5)
    applyDest(destKey, 'roro')
  }
  function example() {
    // Beispiel aus dem ersten Rechner: 7,5 Mio. Yen, Container, höhere Nebenkosten
    setCarId('')
    setPriceIn('JPY')
    setPrice(7500000)
    setJapanFees(300000)
    setShip('container')
    setFreight(dest.freight.container)
    setInsureOn(true)
    setInsurePct(2)
    setFees({ ...dest.fees, inland: Math.round(dest.fees.inland * 1.15), inspection: Math.round(dest.fees.inspection * 1.2), reg: Math.round(dest.fees.reg * 1.5) })
  }
  function pickCar(id: string) {
    const c = CARS.find((x) => x.id === id)!
    setCarId(id)
    setLastCar(id)
    setPriceIn('JPY')
    setPrice(c.jpy)
  }
  function switchPriceIn(v: 'JPY' | 'LOCAL') {
    if (v === priceIn) return
    setPrice(Math.round(v === 'LOCAL' ? price * rate : price / rate))
    setPriceIn(v)
  }

  const shownCar = CARS.find((c) => c.id === (carId || lastCar)) ?? CARS[0]
  const vehicle = priceIn === 'JPY' ? price * rate : price
  const dutyPct = dest.epa && epa ? 0 : duty
  const calc = useMemo(
    () => landedCost({ vehicle, japanFees: japanFees * rate, freight, insureOn, insurePct, dutyPct, vatPct: vat, fees }),
    [vehicle, japanFees, rate, freight, insureOn, insurePct, dutyPct, vat, fees],
  )

  const layers = [
    { key: 'vehicle', label: 'Fahrzeug', val: vehicle },
    { key: 'japan', label: 'Japan', val: japanFees * rate },
    { key: 'freight', label: 'Fracht', val: freight },
    { key: 'insurance', label: 'Versicherung', val: calc.insurance },
    { key: 'duty', label: 'Zoll', val: calc.duty },
    { key: 'vat', label: dest.vatLabel, val: calc.vat },
    { key: 'dest', label: 'Zulassung & Co.', val: calc.destFees },
  ].filter((l) => l.val > 0) as { key: keyof typeof COLORS; label: string; val: number }[]

  const ledger: ({ label: string; val: number; sub?: string } | { divider: string; val: number })[] = [
    { label: 'Fahrzeugwert (Auktion)', val: vehicle, sub: priceIn === 'JPY' ? yen(price) : undefined },
    { label: 'Japan-Gebühren & Export', val: japanFees * rate, sub: yen(japanFees) },
    { label: `Seefracht (${ship === 'roro' ? 'RoRo' : 'Container'})`, val: freight },
    { label: 'Transportversicherung', val: calc.insurance },
    { divider: 'Zollwert (CIF)', val: calc.cif },
    { label: `Zoll · ${dutyPct.toLocaleString('de-DE')} %`, val: calc.duty },
    { label: `${dest.vatLabel} · ${vat.toLocaleString('de-DE')} %`, val: calc.vat, sub: `auf ${money(calc.vatBase, cur)}` },
    { label: 'Zollabwicklung', val: fees.clearance },
    { label: 'Agent / Provision', val: fees.agent },
    { label: `Inlandstransport (${dest.port} → Tür)`, val: fees.inland },
    { label: dest.inspectionLabel, val: fees.inspection },
    { label: 'Zulassung & Umbau', val: fees.reg },
  ]

  // Broker-Vergleich: gleiche Rechnung, nur deren typische Gebühr statt „Agent“
  const usdToLocal = rates.USD ? liveRate / rates.USD : 1
  const brokers = BROKERS.map((b) => {
    const fee = b.fee * usdToLocal
    const r = landedCost({ vehicle, japanFees: japanFees * rate, freight, insureOn, insurePct, dutyPct, vatPct: vat, fees: { ...fees, agent: fee } })
    return { ...b, landed: r.landed }
  }).sort((a, b) => a.landed - b.landed)
  const cheapest = brokers[0]?.landed ?? 0

  const rateNote = manualRate > 0 ? 'eigener Kurs' : live ? `EZB-Kurs vom ${new Date(live.date).toLocaleDateString('de-DE')}` : 'Ersatzkurs vom 27.10.2026'

  return (
    <>
      <Hero slides={HERO.import} eyebrow="Import" title={<>From Yokohama <em>to your garage.</em></>} sub="Was dein JDM bis vor die Haustür wirklich kostet.">
        <a className="btn red" href="#/import/rechner">
          Kosten berechnen
        </a>
      </Hero>

      <section className="section narrow" id="rechner">
        <SectionHead eyebrow="Rechner" title={<>Jeder Yen <em>sichtbar.</em></>} />

        <Reveal className="calc glass">
          <div className="car-stage">
            <AnimatePresence>
              <motion.img
                key={shownCar.id}
                src={shownCar.img}
                alt={shownCar.model}
                initial={{ opacity: 0, scale: 1.12 }}
                animate={{ opacity: 1, scale: 1.02 }}
                exit={{ opacity: 0 }}
                transition={{ opacity: { duration: 0.9 }, scale: { duration: 9, ease: 'linear' } }}
              />
            </AnimatePresence>
            <div className="car-stage-veil" />
            <AnimatePresence mode="wait">
              <motion.div key={shownCar.id + (carId ? '' : '-x')} className="car-stage-text" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.5, ease: EASE }}>
                <span className="tag">{carId ? shownCar.tag : 'Eigener Preis'}</span>
                <strong>{carId ? shownCar.model : 'Dein Auto'}</strong>
                {carId && (
                  <span className="muted mono small">
                    {shownCar.chassis} · {shownCar.year} · {int(shownCar.km)} km · Grade {shownCar.grade}
                  </span>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="cars">
            {CARS.map((c) => (
              <motion.button key={c.id} className={'car' + (c.id === carId ? ' on' : '')} onClick={() => pickCar(c.id)} whileHover={{ y: -3 }} whileTap={{ scale: 0.97 }} title={c.model}>
                <span className="car-img">
                  <img src={c.img} alt={c.model} loading="lazy" />
                </span>
                <strong>{c.chassis}</strong>
                <span>{yen(c.jpy)}</span>
              </motion.button>
            ))}
          </div>

          <div className="calc-row">
            <div className="calc-step">
              <span className="step-label">Zielland</span>
              <div className="dest-row">
                {(Object.keys(DEST) as DestKey[]).map((k) => (
                  <button key={k} className={'dest' + (k === destKey ? ' on' : '')} onClick={() => applyDest(k)} title={DEST[k].name}>
                    {DEST[k].flag} {k}
                  </button>
                ))}
              </div>
            </div>
            <div className="calc-step">
              <span className="step-label">Hammerpreis</span>
              <span className="input big">
                <span className="adorn">{priceIn === 'JPY' ? '¥' : cur}</span>
                <input
                  inputMode="numeric"
                  value={price === 0 ? '' : int(price)}
                  placeholder="0"
                  onChange={(e) => {
                    const d = e.target.value.replace(/[^\d]/g, '')
                    setPrice(d === '' ? 0 : parseInt(d, 10))
                    setCarId('')
                  }}
                />
              </span>
            </div>
          </div>

          <div className="total-block">
            <span className="muted">Kosten bis vor die Tür · {dest.name}</span>
            <div className="total">
              <Counter value={calc.landed} format={(v) => money(v, cur)} />
            </div>
            <span className="total-sub">
              <b>×{calc.multiplier.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b> vom Fahrzeugwert · davon {money(calc.taxes, cur)} Steuern & Zoll
            </span>
          </div>

          <div className="stack">
            {layers.map((l) => (
              <motion.div key={l.key} className="stack-seg" style={{ background: COLORS[l.key] }} initial={{ width: 0 }} animate={{ width: `${(l.val / calc.landed) * 100}%` }} transition={{ duration: 0.6, ease: EASE }} title={`${l.label}: ${money(l.val, cur)}`} />
            ))}
          </div>
          <div className="legend">
            {layers.map((l) => (
              <span key={l.key} className="leg">
                <i style={{ background: COLORS[l.key] }} />
                {l.label}
              </span>
            ))}
          </div>

          <Fold title="Aufschlüsselung">
            <div className="ledger">
              {ledger.map((r, k) =>
                'divider' in r ? (
                  <div key={k} className="ledger-sub">
                    <span>{r.divider}</span>
                    <span className="mono">{money(r.val, cur)}</span>
                  </div>
                ) : (
                  r.val > 0 && (
                    <div key={k} className="ledger-row">
                      <span>
                        {r.label}
                        {r.sub && <em>{r.sub}</em>}
                      </span>
                      <span className="mono">{money(r.val, cur)}</span>
                    </div>
                  )
                ),
              )}
              <div className="ledger-total">
                <span>Gesamt</span>
                <span className="mono">{money(calc.landed, cur)}</span>
              </div>
            </div>
            <p className="small muted">{dest.note}</p>
          </Fold>

          <Fold title="Kosten anpassen">
            <div className="actions">
              <button className="btn small" onClick={example}>
                <Sparkles size={14} /> Beispiel laden
              </button>
              <button className="btn small" onClick={reset}>
                <RotateCcw size={14} /> Zurücksetzen
              </button>
            </div>
            <div className="opt-row">
              <span>Preis in</span>
              <Seg value={priceIn} onChange={switchPriceIn} options={[{ v: 'JPY', l: '¥' }, { v: 'LOCAL', l: cur }]} />
            </div>
            <div className="opt-row">
              <span>Versand</span>
              <Seg value={ship} onChange={(m) => { setShip(m); setFreight(dest.freight[m]) }} options={[{ v: 'roro', l: 'RoRo' }, { v: 'container', l: 'Container' }]} />
            </div>
            {dest.epa && (
              <div className="opt-row">
                <span>EU-Japan-Abkommen</span>
                <Seg value={epa ? 'epa' : 'mfn'} onChange={(v) => setEpa(v === 'epa')} options={[{ v: 'mfn', l: `${duty} % Zoll` }, { v: 'epa', l: '0 %' }]} />
              </div>
            )}
            <div className="opt-row">
              <span>Transportversicherung</span>
              <label className="switch">
                <input type="checkbox" checked={insureOn} onChange={(e) => setInsureOn(e.target.checked)} />
                <span />
              </label>
            </div>
            <div className="fields">
              <NumField label="Japan-Gebühren" prefix="¥" value={japanFees} onChange={setJapanFees} hint="Auktion, Recycling, Transport, Export" />
              <NumField label={`Kurs (1 ${cur} = … ¥)`} step={0.1} suffix="¥" value={manualRate > 0 ? manualRate : Math.round((1 / liveRate) * 10) / 10} onChange={setManualRate} hint={rateNote} />
              <NumField label="Seefracht" prefix={cur} value={freight} onChange={setFreight} />
              <NumField label="Versicherung" step={0.1} suffix="%" value={insurePct} onChange={setInsurePct} disabled={!insureOn} />
              <NumField label="Zoll" step={0.5} suffix="%" value={dutyPct} onChange={(v) => { setDuty(v); setEpa(false) }} disabled={dest.epa && epa} />
              <NumField label={dest.vatLabel} step={0.5} suffix="%" value={vat} onChange={setVat} />
              <NumField label="Zollabwicklung" prefix={cur} value={fees.clearance} onChange={setFee('clearance')} />
              <NumField label="Agent / Provision" prefix={cur} value={fees.agent} onChange={setFee('agent')} />
              <NumField label="Inlandstransport" prefix={cur} value={fees.inland} onChange={setFee('inland')} />
              <NumField label={dest.inspectionLabel} prefix={cur} value={fees.inspection} onChange={setFee('inspection')} />
              <NumField label="Zulassung & Umbau" prefix={cur} value={fees.reg} onChange={setFee('reg')} />
            </div>
            {manualRate > 0 && (
              <button className="link" onClick={() => setManualRate(0)}>
                Wieder den Tageskurs nutzen
              </button>
            )}
          </Fold>

          <p className="disclaimer">
            Schätzung · 1 {cur} = {(1 / rate).toLocaleString('de-DE', { maximumFractionDigits: 2 })} ¥ ({rateNote}). Zoll (HS 8703) und Gebühren mit einem Zollagenten bestätigen. Ohne Kfz-Steuer, Versicherung und Reparaturen.
          </p>
        </Reveal>
      </section>

      <section className="section narrow">
        <SectionHead eyebrow="Broker" title={<>Am günstigsten <em>über …</em></>} />
        <div className="brokers">
          {brokers.map((b, k) => (
            <motion.a key={b.name} layout className={'broker' + (k === 0 ? ' best' : '')} href={b.url} target="_blank" rel="noopener noreferrer" title={b.text}>
              <span className="broker-name">{b.name}</span>
              <span className="broker-type">{b.type}</span>
              <span className="broker-cost mono">{k === 0 ? money(b.landed, cur) : '+' + money(b.landed - cheapest, cur)}</span>
              <ArrowUpRight size={16} className="prov-arrow" />
            </motion.a>
          ))}
        </div>
        <p className="small muted">Gleiche Rechnung mit der typischen Service-Gebühr des Brokers. Echte Angebote gibt es beim Anbieter.</p>
      </section>

      <section className="section">
        <SectionHead eyebrow="Importeure" title={<>Wer dein Auto <em>holt.</em></>} />
        <ProviderGrid items={IMPORTERS} />
      </section>
    </>
  )
}
