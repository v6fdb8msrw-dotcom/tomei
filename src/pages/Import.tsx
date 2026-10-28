import { ArrowUpRight, RotateCcw, Sparkles } from 'lucide-react'
import { animate, motion } from 'motion/react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { BROKERS, CARS, DEST, FX_FALLBACK, HERO, IMPORTERS, type DestKey } from '../data.ts'
import { CarArt } from '../components/CarArt.tsx'
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

function NumField({ label, value, onChange, prefix, suffix, hint, step = 1, dot, disabled }: {
  label: string
  value: number
  onChange: (v: number) => void
  prefix?: string
  suffix?: string
  hint?: string
  step?: number
  dot?: string
  disabled?: boolean
}) {
  // Ganze Beträge mit Tausenderpunkten, Prozente als normale Zahl
  const money = step === 1
  return (
    <label className={'field' + (disabled ? ' off' : '')}>
      <span className="f-label">
        {dot && <i className="tick" style={{ background: dot }} />}
        {label}
      </span>
      <span className="input">
        {prefix && <span className="adorn">{prefix}</span>}
        {money ? (
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

export function Import() {
  const { rates, live } = useFx()
  const [destKey, setDestKey] = useState<DestKey>('DE')
  const dest = DEST[destKey]
  const cur = dest.cur

  const [carId, setCarId] = useState(CARS[0].id)
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
    setPriceIn('JPY')
    setPrice(c.jpy)
  }
  function switchPriceIn(v: 'JPY' | 'LOCAL') {
    if (v === priceIn) return
    setPrice(Math.round(v === 'LOCAL' ? price * rate : price / rate))
    setPriceIn(v)
  }

  const vehicle = priceIn === 'JPY' ? price * rate : price
  const dutyPct = dest.epa && epa ? 0 : duty
  const calc = useMemo(
    () => landedCost({ vehicle, japanFees: japanFees * rate, freight, insureOn, insurePct, dutyPct, vatPct: vat, fees }),
    [vehicle, japanFees, rate, freight, insureOn, insurePct, dutyPct, vat, fees],
  )

  const layers = [
    { key: 'vehicle', label: 'Fahrzeug (Hammer)', val: vehicle },
    { key: 'japan', label: 'Japan-Gebühren', val: japanFees * rate },
    { key: 'freight', label: 'Seefracht', val: freight },
    { key: 'insurance', label: 'Versicherung', val: calc.insurance },
    { key: 'duty', label: `Zoll ${dutyPct.toLocaleString('de-DE')} %`, val: calc.duty },
    { key: 'vat', label: `${dest.vatLabel} ${vat.toLocaleString('de-DE')} %`, val: calc.vat },
    { key: 'dest', label: 'Abwicklung & Zulassung', val: calc.destFees },
  ].filter((l) => l.val > 0) as { key: keyof typeof COLORS; label: string; val: number }[]

  const ledger: ({ label: string; val: number; c: string; sub?: string } | { divider: string; val: number })[] = [
    { label: 'Fahrzeugwert (Auktion)', val: vehicle, c: COLORS.vehicle, sub: priceIn === 'JPY' ? yen(price) : undefined },
    { label: 'Japan-Gebühren & Export', val: japanFees * rate, c: COLORS.japan, sub: yen(japanFees) },
    { label: `Seefracht (${ship === 'roro' ? 'RoRo' : 'Container'})`, val: freight, c: COLORS.freight },
    { label: 'Transportversicherung', val: calc.insurance, c: COLORS.insurance },
    { divider: 'Zollwert (CIF)', val: calc.cif },
    { label: `Zoll · ${dutyPct.toLocaleString('de-DE')} %`, val: calc.duty, c: COLORS.duty },
    { label: `${dest.vatLabel} · ${vat.toLocaleString('de-DE')} %`, val: calc.vat, c: COLORS.vat, sub: `auf ${money(calc.vatBase, cur)}` },
    { label: 'Zollabwicklung', val: fees.clearance, c: COLORS.dest },
    { label: 'Agent / Provision', val: fees.agent, c: COLORS.dest },
    { label: `Inlandstransport (${dest.port} → Tür)`, val: fees.inland, c: COLORS.dest },
    { label: dest.inspectionLabel, val: fees.inspection, c: COLORS.dest },
    { label: 'Zulassung & Umbau', val: fees.reg, c: COLORS.dest },
  ]

  // Broker-Vergleich: gleiche Rechnung, nur deren typische Gebühr statt „Agent“
  const usdToLocal = rates.USD ? liveRate / rates.USD : 1
  const brokers = BROKERS.map((b) => {
    const fee = b.fee * usdToLocal
    const r = landedCost({ vehicle, japanFees: japanFees * rate, freight, insureOn, insurePct, dutyPct, vatPct: vat, fees: { ...fees, agent: fee } })
    return { ...b, fee, landed: r.landed }
  }).sort((a, b) => a.landed - b.landed)
  const cheapest = brokers[0]?.landed ?? 0

  const perLocalYen = 1 / rate

  return (
    <>
      <Hero
        slides={HERO.import}
        eyebrow="Chapter 03 · Import · Tokyo → Bremerhaven"
        title={<>From Yokohama <em>to your garage.</em></>}
        sub="Auktion, Fracht, TÜV, Zulassung. Wir haben die seriösen Anbieter gesammelt und einen Rechner gebaut, der jeden Yen sichtbar macht."
        chips={['USS-Auktion', 'RoRo', 'EUSt 19 %', 'TÜV §21']}
      >
        <a className="btn glass" href="#/import/rechner">Zum Kostenrechner ↓</a>
      </Hero>

      <section className="section">
        <SectionHead eyebrow="Importeure" title={<>Wer dein Auto <em>holt.</em></>} text="Spezialisten für den Weg von der japanischen Auktion bis zur deutschen Zulassung." />
        <ProviderGrid items={IMPORTERS} />
      </section>

      <section className="section" id="rechner">
        <SectionHead
          eyebrow="輸入 · Landed-Cost-Rechner"
          title={<>Vom Hammer bis vor die Haustür — <em>jeder Yen sichtbar.</em></>}
          text={`Was ein JDM-Import wirklich kostet: Hammerpreis, Japan-Gebühren, Fracht, Zoll und ${dest.vatLabel} fürs Zielland.`}
        />

        <Reveal className="garage-wrap">
          <div className="garage-head">
            <h3>Garage · Beispiel-Listings</h3>
            <span className="muted">Keine Live-Auktionsdaten. Illustrationen, realistische Marktpreise.</span>
          </div>
          <div className="garage">
            {CARS.map((c) => (
              <motion.button key={c.id} className={'car glass' + (c.id === carId ? ' on' : '')} onClick={() => pickCar(c.id)} whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }}>
                <div className="car-art">
                  <CarArt body={c.body} />
                </div>
                <div className="car-top">
                  <strong>{c.model}</strong>
                  <span className="tag">{c.tag}</span>
                </div>
                <div className="car-spec">
                  <span className="hi">{c.chassis}</span>
                  <span>{c.year}</span>
                  <span>{int(c.km)} km</span>
                  <span className={'grade g' + Math.floor(parseFloat(c.grade))}>Grade {c.grade}</span>
                </div>
                <div className="car-price">
                  {yen(c.jpy)} <span>≈ {money(c.jpy * rate, cur)}</span>
                </div>
              </motion.button>
            ))}
          </div>
        </Reveal>

        <div className="calc">
          <Reveal className="panel glass inputs">
            <div className="panel-head">
              <h3>Eingaben</h3>
              <div className="actions">
                <button className="btn small red" onClick={example}>
                  <Sparkles size={14} /> Beispiel laden
                </button>
                <button className="btn small ghost" onClick={reset}>
                  <RotateCcw size={14} /> Zurücksetzen
                </button>
              </div>
            </div>

            <div className="group">
              <div className="group-title">Zielland</div>
              <div className="dest-row">
                {(Object.keys(DEST) as DestKey[]).map((k) => (
                  <button key={k} className={'dest' + (k === destKey ? ' on' : '')} onClick={() => applyDest(k)} title={DEST[k].name}>
                    <span>{DEST[k].flag}</span>
                    {k}
                  </button>
                ))}
              </div>
              <motion.p key={destKey} className="dest-note" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                <strong>
                  {dest.flag} {dest.name}
                </strong>{' '}
                · Hafen {dest.port} · {dest.note}
              </motion.p>
            </div>

            <div className="group">
              <div className="group-title">Auktion in Japan</div>
              <div className="row-between">
                <span className="f-label">Preis eingeben in</span>
                <Seg value={priceIn} onChange={switchPriceIn} options={[{ v: 'JPY', l: '¥ JPY' }, { v: 'LOCAL', l: cur }]} />
              </div>
              <div className="cols">
                <NumField label="Hammerpreis" dot={COLORS.vehicle} prefix={priceIn === 'JPY' ? '¥' : cur} value={price} onChange={(v) => { setPrice(v); setCarId('') }} hint="Zuschlagspreis auf der Auktion" />
                <NumField label="Japan-Gebühren" dot={COLORS.japan} prefix="¥" value={japanFees} onChange={setJapanFees} hint="Auktionshaus, Recycling, Abmeldung, Inlandstransport, Export-Papiere" />
              </div>
              <div className="cols">
                <NumField
                  label={`Wechselkurs (1 ${cur} = … ¥)`}
                  step={0.1}
                  value={manualRate > 0 ? manualRate : Math.round((1 / liveRate) * 10) / 10}
                  onChange={setManualRate}
                  suffix="¥"
                  hint={manualRate > 0 ? 'Eigener Kurs aktiv' : live ? `Tageskurs EZB vom ${new Date(live.date).toLocaleDateString('de-DE')}` : 'Ersatzkurs (offline)'}
                />
                <div className="fx-box">
                  <span className={'live-dot' + (live && !manualRate ? ' on' : '')} />
                  <span>{manualRate > 0 ? 'Eigener Kurs' : live ? 'Live-Kurs' : 'Ersatzkurs'}</span>
                  {manualRate > 0 && (
                    <button className="link" onClick={() => setManualRate(0)}>
                      Tageskurs nutzen
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="group">
              <div className="group-title">Transport</div>
              <div className="row-between">
                <span className="f-label">Versandart</span>
                <Seg value={ship} onChange={(m) => { setShip(m); setFreight(dest.freight[m]) }} options={[{ v: 'roro', l: 'RoRo' }, { v: 'container', l: 'Container' }]} />
              </div>
              <div className="cols">
                <NumField label={`Seefracht → ${dest.port}`} dot={COLORS.freight} prefix={cur} value={freight} onChange={setFreight} hint="RoRo meist günstiger, Container sicherer" />
                <div className="field">
                  <span className="f-label">
                    <i className="tick" style={{ background: COLORS.insurance }} />
                    Transportversicherung
                  </span>
                  <div className="ins">
                    <label className="switch">
                      <input type="checkbox" checked={insureOn} onChange={(e) => setInsureOn(e.target.checked)} />
                      <span />
                    </label>
                    <span className="input small">
                      <input type="number" step={0.1} min={0} value={insurePct} disabled={!insureOn} onChange={(e) => setInsurePct(parseFloat(e.target.value) || 0)} />
                      <span className="adorn right">%</span>
                    </span>
                  </div>
                  <span className="hint">auf Warenwert + Fracht, meist 1–2 %</span>
                </div>
              </div>
            </div>

            <div className="group">
              <div className="group-title">Einfuhrabgaben</div>
              {dest.epa && (
                <div className="row-between">
                  <span className="f-label">EU-Japan-Abkommen (EPA)</span>
                  <Seg value={epa ? 'epa' : 'mfn'} onChange={(v) => setEpa(v === 'epa')} options={[{ v: 'mfn', l: `${duty} % Zoll` }, { v: 'epa', l: '0 % mit Nachweis' }]} />
                </div>
              )}
              <div className="cols">
                <NumField label="Zollsatz" step={0.5} suffix="%" value={dutyPct} onChange={(v) => { setDuty(v); setEpa(false) }} disabled={dest.epa && epa} hint="auf den Zollwert (CIF)" />
                <NumField label={dest.vatLabel} step={0.5} suffix="%" value={vat} onChange={setVat} hint="auf Zollwert + Zoll" />
              </div>
            </div>

            <div className="group">
              <div className="group-title">Im Zielland</div>
              <div className="cols three">
                <NumField label="Zollabwicklung" dot={COLORS.dest} prefix={cur} value={fees.clearance} onChange={setFee('clearance')} />
                <NumField label="Agent / Provision" dot={COLORS.dest} prefix={cur} value={fees.agent} onChange={setFee('agent')} />
                <NumField label="Inlandstransport" dot={COLORS.dest} prefix={cur} value={fees.inland} onChange={setFee('inland')} />
              </div>
              <div className="cols">
                <NumField label={dest.inspectionLabel} dot={COLORS.dest} prefix={cur} value={fees.inspection} onChange={setFee('inspection')} />
                <NumField label="Zulassung & Umbau" dot={COLORS.dest} prefix={cur} value={fees.reg} onChange={setFee('reg')} hint="Scheinwerfer, Nebelschlussleuchte, COC, Kennzeichen" />
              </div>
            </div>
          </Reveal>

          <Reveal className="panel glass result" delay={0.1}>
            <div className="result-top">
              <div>
                <span className="eyebrow">Landed Cost · {dest.name}</span>
                <div className="total">
                  <Counter value={calc.landed} format={(v) => money(v, cur)} />
                </div>
                <div className="total-line" />
                <span className="muted mono small">
                  ≈ {yen(calc.landed / rate)} · CIF {money(calc.cif, cur)}
                </span>
              </div>
              <motion.div className="stamp" key={calc.multiplier.toFixed(2)} initial={{ scale: 1.15, rotate: -14 }} animate={{ scale: 1, rotate: -7 }} transition={{ type: 'spring', stiffness: 260, damping: 14 }}>
                <span>GESAMT</span>
                <strong>×{calc.multiplier.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                <span>FAHRZEUGWERT</span>
              </motion.div>
            </div>

            <div className="metrics">
              <div className="metric">
                <strong style={{ color: COLORS.vehicle }}>{money(vehicle, cur)}</strong>
                <span>Fahrzeugwert in {cur}</span>
              </div>
              <div className="metric">
                <strong style={{ color: COLORS.vat }}>{money(calc.taxes, cur)}</strong>
                <span>Steuern & Abgaben · {Math.round(calc.taxShare * 100)} %</span>
              </div>
              <div className="metric">
                <strong className="red">+{Math.round(calc.markupPct)} %</strong>
                <span>über Hammerpreis</span>
              </div>
            </div>

            <div className="stack">
              {layers.map((l) => (
                <motion.div key={l.key} className="stack-seg" style={{ background: COLORS[l.key] }} initial={{ width: 0 }} animate={{ width: `${(l.val / calc.landed) * 100}%` }} transition={{ duration: 0.6, ease: EASE }} title={`${l.label}: ${money(l.val, cur)}`} />
              ))}
            </div>
            <div className="legend">
              {layers.map((l) => (
                <div key={l.key} className="leg">
                  <i style={{ background: COLORS[l.key] }} />
                  <span>{l.label}</span>
                  <b className="mono">{money(l.val, cur)}</b>
                </div>
              ))}
            </div>

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
                        <i className="tick" style={{ background: r.c }} />
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

            <p className="fx-line mono">
              Kurs: 1 {cur} = {perLocalYen.toLocaleString('de-DE', { maximumFractionDigits: 2 })} ¥ · {manualRate > 0 ? 'eigener Kurs' : live ? `EZB-Tageskurs ${new Date(live.date).toLocaleDateString('de-DE')}` : 'Ersatzkurs vom 27.10.2026'}
            </p>
            <p className="disclaimer">
              Nur eine Schätzung. Den genauen Zollsatz (HS 8703) und die Gebühren mit einem Zollagenten bestätigen; festgesetzt werden die Abgaben vom Zollamt. Nicht enthalten: Kfz-Steuer, Versicherung,
              Standgebühren im Hafen und Reparaturen.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="section">
        <SectionHead eyebrow="Die Brücke" title={<>Durch wen du <em>am günstigsten</em> fährst.</>} text="Gleiches Auto, gleiche Rechnung, nur mit der typischen Service-Gebühr des jeweiligen Brokers statt „Agent“. Echte Angebote holst du direkt beim Anbieter." />
        <div className="brokers">
          {brokers.map((b, k) => (
            <motion.a
              key={b.name}
              layout
              className={'broker glass' + (k === 0 ? ' best' : '')}
              href={b.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: k * 0.05, ease: EASE }}
            >
              <span className="broker-rank">{k + 1}</span>
              <div className="broker-main">
                <strong>
                  {b.name} <span className="tag soft">{b.type}</span>
                </strong>
                <span>{b.text}</span>
              </div>
              <div className="broker-cost">
                <strong className="mono">{money(b.landed, cur)}</strong>
                <span>{k === 0 ? 'günstigste Route ✓' : '+' + money(b.landed - cheapest, cur)}</span>
              </div>
              <ArrowUpRight size={18} className="prov-arrow" />
            </motion.a>
          ))}
        </div>
      </section>
    </>
  )
}
