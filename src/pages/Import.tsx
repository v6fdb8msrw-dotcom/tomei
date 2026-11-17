import { ArrowUpRight, ChevronDown, RotateCcw, Sparkles } from 'lucide-react'
import { animate, AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { AGENTS, CALC_LOAD_KEY, CARS, DEST, FX_FALLBACK, HERO, IMPORT_FLAT, IMPORTERS, ORIGIN, agentAverage, agentTotal, loadFinds, toJpy, type DestKey, type Find, type OriginKey } from '../data.ts'
import { EASE, Hero, ProviderGrid, Reveal, SectionHead } from '../components/motion.tsx'
import { int, landedCost, money, yen } from '../lib/calc.ts'
import { useFx } from '../lib/fx.ts'

const COLORS = {
  vehicle: '#8b93a1',
  japan: '#5d6676',
  freight: '#3a8fb7',
  insurance: '#2dd4bf',
  duty: '#f5a524',
  vat: '#f472b6',
  dest: '#b794f6',
}

type Fees = { clearance: number; agent: number; inland: number; inspection: number; reg: number }

const DEFAULT_JAPAN_FEES = 180000
const ORIGIN_KEYS: OriginKey[] = ['jp', 'us', 'uk', 'ca', 'au']
const ORIGIN_FLAG: Record<OriginKey, string> = { jp: '🇯🇵', us: '🇺🇸', uk: '🇬🇧', ca: '🇨🇦', au: '🇦🇺' }
const SYM: Record<string, string> = { JPY: '¥', USD: '$', GBP: '£', CAD: 'CA$', AUD: 'A$', EUR: '€' }
const isOrigin = (m: string): m is Exclude<OriginKey, 'jp'> => m in ORIGIN

/** Deutsche Kosten ab einem anderen Herkunftsland: veröffentlichte Hafenabwicklung, beim Selbstfahren kein Hafen und kein Inlandstransport */
function destFeesFor(o: Exclude<OriginKey, 'jp'>, modeId: string): Fees {
  const O = ORIGIN[o]
  const mode = O.ship.find((m) => m.id === modeId) ?? O.ship[0]
  const f = { ...DEST.DE.fees }
  if (O.destHandling) {
    f.clearance = O.destHandling.eur
    f.agent = 0
  }
  if (mode.selfDrive) {
    f.agent = 0
    f.inland = 0
  }
  return f
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
  const [origin, setOrigin] = useState<OriginKey>('jp')
  const O = origin === 'jp' ? null : ORIGIN[origin]
  const [house, setHouse] = useState('')
  const [shipMode, setShipMode] = useState('')
  const [toPort, setToPort] = useState(0) // Transport zum Hafen im Herkunftsland (Herkunftswährung)
  const [destKey, setDestKey] = useState<DestKey>('DE')
  const dest = DEST[destKey]
  const cur = dest.cur

  const [carId, setCarId] = useState(CARS[0].id)
  const [lastCar, setLastCar] = useState(CARS[0].id) // Foto bleibt stehen, wenn ein eigener Preis getippt wird
  const [price, setPrice] = useState(CARS[0].jpy)
  const [priceIn, setPriceIn] = useState<'ORIG' | 'LOCAL'>('ORIG')
  const [manualJapanFees, setJapanFees] = useState(DEFAULT_JAPAN_FEES)
  const [ship, setShip] = useState<'roro' | 'container'>('roro')
  const [freight, setFreight] = useState(dest.freight.roro)
  const [insureOn, setInsureOn] = useState(true)
  const [insurePct, setInsurePct] = useState(1.5)
  const [duty, setDuty] = useState(dest.duty)
  const [vat, setVat] = useState(dest.vat)
  const [epa, setEpa] = useState(false)
  const [classic, setClassic] = useState(false) // Oldtimer: Sammlungsstück (Pos. 9705), nur Deutschland
  const [fees, setFees] = useState<Fees>(dest.fees)
  const [manualRate, setManualRate] = useState(0) // 1 Zielwährung = … ¥, 0 = Tageskurs
  // Export-Agent in Japan: Durchschnitt aller Agenten mit veröffentlichten Preisen, ein bestimmter Agent oder eigene Zahl
  const [agent, setAgent] = useState<string>('avg')
  const [find, setFind] = useState<Find | null>(null)
  const [finds] = useState<Find[]>(loadFinds)

  const origCur = O ? O.cur : 'JPY'
  const osym = SYM[origCur]
  const perJpy = (c: string) => (c === 'JPY' ? 1 : (rates[c] ?? FX_FALLBACK[c]))
  /** Betrag von einer Währung in eine andere, über die Yen-Kurse */
  const conv = (v: number, from: string, to: string) => (v / perJpy(from)) * perJpy(to)
  const liveRate = perJpy(cur) / perJpy(origCur) // 1 Einheit Herkunftswährung → Zielwährung
  const rate = manualRate > 0 ? 1 / manualRate : liveRate
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
  /** Herkunftsland wechseln. Außer Japan rechnet der Rechner immer nach Deutschland. */
  function applyOrigin(o: OriginKey) {
    setOrigin(o)
    setManualRate(0)
    setEpa(false)
    setPriceIn('ORIG')
    if (o === 'jp') {
      applyDest(destKey)
      return
    }
    const d = ORIGIN[o]
    const mode = d.ship[0]
    setDestKey('DE')
    setDuty(DEST.DE.duty)
    setVat(DEST.DE.vat)
    setHouse(d.houses[0].id)
    setShipMode(mode.id)
    setFreight(mode.cost === null ? 0 : Math.round(conv(mode.cost, mode.cur, 'EUR')))
    setFees(destFeesFor(o, mode.id))
    setToPort(0)
    setCarId('')
  }
  function pickShip(id: string) {
    if (!O || origin === 'jp') return
    const mode = O.ship.find((m) => m.id === id)!
    setShipMode(id)
    setFreight(mode.cost === null ? 0 : Math.round(conv(mode.cost, mode.cur, cur)))
    setFees(destFeesFor(origin, id))
  }
  function loadFind(f: Find) {
    setFind(f)
    setCarId('')
    setPriceIn('ORIG')
    if (isOrigin(f.market)) {
      if (f.market !== origin) applyOrigin(f.market)
      setPrice(Math.round(conv(f.price, f.cur, ORIGIN[f.market].cur)))
    } else {
      if (origin !== 'jp') applyOrigin('jp')
      setPrice(toJpy(f.price, f.cur, rates))
    }
  }
  // Fundstück aus den Märkten übernehmen (einmalig beim Öffnen des Rechners)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CALC_LOAD_KEY)
      if (raw) {
        localStorage.removeItem(CALC_LOAD_KEY)
        loadFind(JSON.parse(raw))
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  function reset() {
    if (origin !== 'jp') {
      setFind(null)
      setPrice(0)
      setInsureOn(true)
      setInsurePct(1.5)
      applyOrigin(origin)
      return
    }
    setFind(null)
    setAgent('avg')
    setCarId(CARS[0].id)
    setLastCar(CARS[0].id)
    setPrice(CARS[0].jpy)
    setPriceIn('ORIG')
    setJapanFees(DEFAULT_JAPAN_FEES)
    setShip('roro')
    setInsureOn(true)
    setInsurePct(1.5)
    applyDest(destKey, 'roro')
  }
  function example() {
    // Beispiel aus dem ersten Rechner: 7,5 Mio. Yen, Container, höhere Nebenkosten
    setCarId('')
    setPriceIn('ORIG')
    setPrice(7500000)
    setJapanFees(300000)
    setAgent('manual')
    setFind(null)
    setShip('container')
    setFreight(dest.freight.container)
    setInsureOn(true)
    setInsurePct(2)
    setFees({ ...dest.fees, inland: Math.round(dest.fees.inland * 1.15), inspection: Math.round(dest.fees.inspection * 1.2), reg: Math.round(dest.fees.reg * 1.5) })
  }
  function pickCar(id: string) {
    if (origin !== 'jp') applyOrigin('jp')
    const c = CARS.find((x) => x.id === id)!
    setCarId(id)
    setLastCar(id)
    setFind(null)
    setPriceIn('ORIG')
    setPrice(c.jpy)
  }
  function switchPriceIn(v: 'ORIG' | 'LOCAL') {
    if (v === priceIn) return
    setPrice(Math.round(v === 'LOCAL' ? price * rate : price / rate))
    setPriceIn(v)
  }

  const shownCar = CARS.find((c) => c.id === (carId || lastCar)) ?? CARS[0]
  const vehicle = priceIn === 'ORIG' ? price * rate : price
  const hammer = priceIn === 'ORIG' ? price : price / rate
  const avgFees = agentAverage(hammer)
  const picked = AGENTS.find((a) => a.id === agent)
  const pickedHouse = O ? (O.houses.find((h) => h.id === house) ?? O.houses[0]) : null
  const premium = pickedHouse ? pickedHouse.fee(hammer) : 0
  const pickedShip = O ? (O.ship.find((m) => m.id === shipMode) ?? O.ship[0]) : null
  const freightMissing = !!pickedShip && pickedShip.cost === null && freight === 0
  // Kosten im Herkunftsland (in Herkunftswährung): Japan = Agent & Export, sonst Aufgeld + Transport zum Hafen
  const japanFees = O ? premium + toPort : agent === 'manual' ? manualJapanFees : picked ? (agentTotal(picked, hammer) ?? avgFees) : avgFees
  const prefOk = O ? !!O.pref : !!dest.epa
  const classicOn = destKey === 'DE' && classic
  const dutyPct = classicOn ? 0 : prefOk && epa ? 0 : duty
  const vatPct = classicOn ? 7 : vat
  const calc = useMemo(
    () => landedCost({ vehicle, japanFees: japanFees * rate, freight, insureOn, insurePct, dutyPct, vatPct, fees }),
    [vehicle, japanFees, rate, freight, insureOn, insurePct, dutyPct, vatPct, fees],
  )

  const ofmt = (v: number) => (O ? money(v, O.cur) : yen(v))
  const layers = [
    { key: 'vehicle', label: 'Fahrzeug', val: vehicle },
    { key: 'japan', label: O ? 'Kauf & Export' : 'Japan', val: japanFees * rate },
    { key: 'freight', label: 'Fracht', val: freight },
    { key: 'insurance', label: 'Versicherung', val: calc.insurance },
    { key: 'duty', label: 'Zoll', val: calc.duty },
    { key: 'vat', label: dest.vatLabel, val: calc.vat },
    { key: 'dest', label: 'Zulassung & Co.', val: calc.destFees },
  ].filter((l) => l.val > 0) as { key: keyof typeof COLORS; label: string; val: number }[]

  const ledger: ({ label: string; val: number; sub?: string } | { divider: string; val: number })[] = [
    { label: O ? 'Fahrzeugwert (Zuschlag / Kaufpreis)' : 'Fahrzeugwert (Auktion)', val: vehicle, sub: priceIn === 'ORIG' ? ofmt(price) : undefined },
    ...(O
      ? [
          { label: `Aufgeld ${pickedHouse!.name}`, val: premium * rate, sub: ofmt(premium) },
          { label: 'Transport zum Hafen', val: toPort * rate, sub: ofmt(toPort) },
        ]
      : [{ label: agent === 'manual' ? 'Japan-Gebühren & Export' : `Agent & Export (${picked ? picked.name : 'Ø ' + AGENTS.length + ' Agenten'})`, val: japanFees * rate, sub: yen(japanFees) }]),
    { label: O ? `${pickedShip!.selfDrive ? 'Überfahrt' : 'Seefracht'} (${pickedShip!.label})` : `Seefracht (${ship === 'roro' ? 'RoRo' : 'Container'})`, val: freight },
    { label: 'Transportversicherung', val: calc.insurance },
    { divider: 'Zollwert (CIF)', val: calc.cif },
    { label: `Zoll · ${dutyPct.toLocaleString('de-DE')} %`, val: calc.duty },
    { label: `${dest.vatLabel} · ${vatPct.toLocaleString('de-DE')} %`, val: calc.vat, sub: `auf ${money(calc.vatBase, cur)}` },
    { label: 'Zollabwicklung', val: fees.clearance },
    { label: 'Agent / Provision', val: fees.agent },
    { label: `Inlandstransport (${dest.port} → Tür)`, val: fees.inland },
    { label: dest.inspectionLabel, val: fees.inspection },
    { label: 'Zulassung & Umbau', val: fees.reg },
  ]

  // Agenten-Vergleich: gleiche Rechnung, nur mit den veröffentlichten Gebühren der jeweiligen Firma
  const base = { vehicle, freight, insureOn, insurePct, dutyPct, vatPct }
  const brokers = O
    ? O.houses
        .map((h) => {
          const f = h.fee(hammer)
          return { id: h.id, name: h.name, url: h.url, source: h.source, type: h.id === 'private' ? 'ohne Auktion' : 'Aufgeld ' + money(f, O.cur), text: h.text, jp: f, landed: landedCost({ ...base, japanFees: (f + toPort) * rate, fees }).landed as number | null }
        })
        .sort((a, b) => (a.landed ?? Infinity) - (b.landed ?? Infinity))
    : [
    ...AGENTS.map((a) => {
      const t = agentTotal(a, hammer)
      return { id: a.id, name: a.name, url: a.url, source: a.source, type: a.kind, text: a.text, jp: t, landed: t === null ? null : landedCost({ ...base, japanFees: t * rate, fees }).landed }
    }),
    ...IMPORT_FLAT.map((f) => {
      const eur = rates.EUR ?? FX_FALLBACK.EUR
      const agentLocal = (f.eur / eur) * rate // € → ¥ → Zielwährung
      return { id: f.id, name: f.name, url: f.url, source: f.source, type: 'Komplett-Import DE', text: f.text, jp: avgFees, landed: landedCost({ ...base, japanFees: avgFees * rate, fees: { ...fees, agent: agentLocal } }).landed }
    }),
  ]
    .sort((a, b) => (a.landed ?? Infinity) - (b.landed ?? Infinity))
  const cheapest = brokers[0]?.landed ?? 0
  const avgLanded = landedCost({ ...base, japanFees: avgFees * rate, fees }).landed

  const rateNote = O && manualRate === 0 ? (live ? `EZB-Kurs vom ${new Date(live.date).toLocaleDateString('de-DE')}` : 'Ersatzkurs vom 16.11.2026') : manualRate > 0 ? 'eigener Kurs' : live ? `EZB-Kurs vom ${new Date(live.date).toLocaleDateString('de-DE')}` : 'Ersatzkurs vom 27.10.2026'

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
                key={(find || O) && !carId ? 'find' : shownCar.id}
                src={(find || O) && !carId ? `${import.meta.env.BASE_URL}images/import-port.jpg` : shownCar.img}
                alt={find && !carId ? find.title : O && !carId ? 'Dein Auto' : shownCar.model}
                initial={{ opacity: 0, scale: 1.12 }}
                animate={{ opacity: 1, scale: 1.02 }}
                exit={{ opacity: 0 }}
                transition={{ opacity: { duration: 0.9 }, scale: { duration: 9, ease: 'linear' } }}
              />
            </AnimatePresence>
            <div className="car-stage-veil" />
            <AnimatePresence mode="wait">
              <motion.div key={shownCar.id + (carId ? '' : '-x')} className="car-stage-text" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.5, ease: EASE }}>
                <span className="tag">{carId ? shownCar.tag : find ? (find.id.startsWith('cf-') ? 'Modell-Finder' : 'Merkliste') : 'Eigener Preis'}</span>
                <strong>{carId ? shownCar.model : find ? find.title : 'Dein Auto'}</strong>
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

          <div className="calc-step origin-step">
            <span className="step-label">Herkunft</span>
            <div className="dest-row origin-row">
              {ORIGIN_KEYS.map((k) => (
                <button key={k} className={'dest' + (k === origin ? ' on' : '')} onClick={() => k !== origin && (applyOrigin(k), k === 'jp' ? pickCar(CARS[0].id) : (setPrice(0), setFind(null)))} title={k === 'jp' ? 'Japan' : ORIGIN[k].name}>
                  {ORIGIN_FLAG[k]} {k.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="calc-row">
            <div className="calc-step">
              <span className="step-label">Zielland</span>
              {O ? (
                <p className="hint dest-fixed">🇩🇪 Deutschland · ab {O.name} rechnet der Rechner bis vor die Tür in Deutschland.</p>
              ) : (
                <div className="dest-row">
                  {(Object.keys(DEST) as DestKey[]).map((k) => (
                    <button key={k} className={'dest' + (k === destKey ? ' on' : '')} onClick={() => applyDest(k)} title={DEST[k].name}>
                      {DEST[k].flag} {k}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="calc-step">
              <span className="step-label">{O ? 'Zuschlag / Kaufpreis' : 'Hammerpreis'}</span>
              <span className="input big">
                <span className="adorn">{priceIn === 'ORIG' ? osym : cur}</span>
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
            {freightMissing && <span className="total-warn">Noch ohne Seefracht: {pickedShip!.text}</span>}
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

          {O && (
            <>
              <div className="agent-pick">
                <span className="step-label">Gekauft bei · {O.name}</span>
                <div className="mk-ideas">
                  {O.houses.map((h) => (
                    <button key={h.id} className={'chip' + (pickedHouse?.id === h.id ? ' on' : '')} onClick={() => setHouse(h.id)} title={h.text}>
                      {h.name}
                      {h.id !== 'private' && ' · ' + money(h.fee(hammer), O.cur)}
                    </button>
                  ))}
                </div>
                <p className="hint">
                  {pickedHouse!.text}
                  {pickedHouse!.source && (
                    <>
                      {' '}
                      <a href={pickedHouse!.source} target="_blank" rel="noopener noreferrer">
                        Quelle
                      </a>
                    </>
                  )}
                </p>
              </div>
              <div className="agent-pick">
                <span className="step-label">Nach Deutschland</span>
                <div className="mk-ideas">
                  {O.ship.map((m) => (
                    <button key={m.id} className={'chip' + (pickedShip?.id === m.id ? ' on' : '')} onClick={() => pickShip(m.id)}>
                      {m.label} · {m.cost === null ? 'Angebot einholen' : money(m.cost, m.cur)}
                    </button>
                  ))}
                </div>
                <p className="hint">
                  {pickedShip!.text}
                  {pickedShip!.source && (
                    <>
                      {' '}
                      <a href={pickedShip!.source} target="_blank" rel="noopener noreferrer">
                        Quelle
                      </a>
                    </>
                  )}
                  {O.destHandling && !pickedShip!.selfDrive && <> {O.destHandling.text}</>}
                </p>
              </div>
            </>
          )}

          {!O && (
          <div className="agent-pick">
            <span className="step-label">Export-Agent in Japan</span>
            <div className="mk-ideas">
              <button className={'chip' + (agent === 'avg' ? ' on' : '')} onClick={() => setAgent('avg')}>
                Ø Durchschnitt · {yen(avgFees)}
              </button>
              {AGENTS.map((a) => {
                const t = agentTotal(a, hammer)
                return (
                  <button key={a.id} className={'chip' + (agent === a.id ? ' on' : '')} disabled={t === null} onClick={() => setAgent(a.id)} title={a.text}>
                    {a.name} · {t === null ? 'auf Anfrage' : yen(t)}
                  </button>
                )
              })}
              {agent === 'manual' && <span className="chip on">Eigene Zahl · {yen(japanFees)}</span>}
            </div>
            <p className="hint">Service-Gebühr + feste Posten + Transport zum Hafen ({yen(25000)} typisch), nach den veröffentlichten Preisen der Firmen (Stand 17.11.2026).</p>
          </div>
          )}

          {(finds.length > 0 || find) && (
            <div className="agent-pick">
              <span className="step-label">Aus deiner Merkliste</span>
              <div className="mk-ideas">
                {finds.map((f) => (
                  <button key={f.id} className={'chip' + (find?.id === f.id ? ' on' : '')} onClick={() => loadFind(f)}>
                    {f.title}{f.price > 0 ? ' · ' + (f.cur === 'JPY' ? yen(f.price) : int(f.price) + ' ' + f.cur) : ''}
                  </button>
                ))}
              </div>
              {find && find.market !== 'jp' && !isOrigin(find.market) && <p className="hint">Gerechnet mit Fracht und Gebühren ab Japan. Ab {find.market.toUpperCase()} können Fracht und Exportkosten abweichen; trag sie unter „Kosten anpassen“ ein, sobald du ein Angebot hast.</p>}
            </div>
          )}

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
            <p className="small muted">{O ? O.note : dest.note}</p>
          </Fold>

          <Fold title="Kosten anpassen">
            <div className="actions">
              {!O && (
                <button className="btn small" onClick={example}>
                  <Sparkles size={14} /> Beispiel laden
                </button>
              )}
              <button className="btn small" onClick={reset}>
                <RotateCcw size={14} /> Zurücksetzen
              </button>
            </div>
            <div className="opt-row">
              <span>Preis in</span>
              <Seg value={priceIn} onChange={switchPriceIn} options={[{ v: 'ORIG', l: osym }, { v: 'LOCAL', l: cur }]} />
            </div>
            {!O && <div className="opt-row">
              <span>Versand</span>
              <Seg value={ship} onChange={(m) => { setShip(m); setFreight(dest.freight[m]) }} options={[{ v: 'roro', l: 'RoRo' }, { v: 'container', l: 'Container' }]} />
            </div>}
            {prefOk && (
              <div className="opt-row">
                <span>{O ? O.pref!.label.replace(' (0 %)', '') : 'EU-Japan-Abkommen'}</span>
                <Seg value={epa ? 'epa' : 'mfn'} onChange={(v) => setEpa(v === 'epa')} options={[{ v: 'mfn', l: `${duty} % Zoll` }, { v: 'epa', l: '0 %' }]} />
              </div>
            )}
            {O?.pref && epa && !classicOn && (
              <p className="hint">
                {O.pref.text}{' '}
                <a href={O.pref.source} target="_blank" rel="noopener noreferrer">
                  Quelle
                </a>
              </p>
            )}
            {destKey === 'DE' && (
              <div className="opt-row">
                <span title="Ab 30 Jahren im Originalzustand kann der Zoll das Auto als Sammlungsstück (Pos. 9705) einreihen: 0 % Zoll, 7 % EUSt. Die Entscheidung trifft der Zoll (Quelle: ADAC Oldtimer-Ratgeber).">Oldtimer (30+ Jahre, Original)</span>
                <label className="switch">
                  <input type="checkbox" checked={classic} onChange={(e) => setClassic(e.target.checked)} />
                  <span />
                </label>
              </div>
            )}
            {classicOn && <p className="hint">Als Sammlungsstück: 0 % Zoll und 7 % EUSt statt 10 % und 19 %. Nur bei Originalzustand, der Zoll entscheidet bei der Anmeldung.</p>}
            <div className="opt-row">
              <span>Transportversicherung</span>
              <label className="switch">
                <input type="checkbox" checked={insureOn} onChange={(e) => setInsureOn(e.target.checked)} />
                <span />
              </label>
            </div>
            <div className="fields">
              {O ? (
                <NumField label="Transport zum Hafen" prefix={osym} value={toPort} onChange={setToPort} hint={`im Herkunftsland, je nach Entfernung`} />
              ) : (
                <NumField label="Japan-Gebühren" prefix="¥" value={japanFees} onChange={(v) => { setJapanFees(v); setAgent('manual') }} hint="Agent, Auktion, Transport, Export" />
              )}
              <NumField label={`Kurs (1 ${cur} = … ${osym})`} step={0.1} suffix="¥" value={manualRate > 0 ? manualRate : Math.round((1 / liveRate) * 10) / 10} onChange={setManualRate} hint={rateNote} />
              <NumField label={pickedShip?.selfDrive ? 'Überfahrt' : 'Seefracht'} prefix={cur} value={freight} onChange={setFreight} hint={freightMissing ? 'Angebot eintragen' : undefined} />
              <NumField label="Versicherung" step={0.1} suffix="%" value={insurePct} onChange={setInsurePct} disabled={!insureOn} />
              <NumField label="Zoll" step={0.5} suffix="%" value={dutyPct} onChange={(v) => { setDuty(v); setEpa(false) }} disabled={prefOk && epa} />
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
            Schätzung · 1 {cur} = {(1 / rate).toLocaleString('de-DE', { maximumFractionDigits: 2 })} {osym} ({rateNote}). Zoll (HS 8703) und Gebühren mit einem Zollagenten bestätigen. Ohne Kfz-Steuer, Versicherung und Reparaturen.
          </p>
        </Reveal>
      </section>

      <section className="section narrow" id="agenten">
        {O ? (
          <SectionHead eyebrow={`Auktionshäuser · ${O.name}`} title={<>Am günstigsten <em>über …</em></>} text={<>Dein Auto mit dem veröffentlichten Aufgeld jedes Hauses gerechnet, bis vor die Tür in Deutschland.</>} />
        ) : (
          <SectionHead eyebrow="Agenten & Importeure" title={<>Am günstigsten <em>über …</em></>} text={<>Dein Auto mit den veröffentlichten Gebühren jeder Firma gerechnet. Ø aller Agenten: <b>{money(avgLanded, cur)}</b> bis vor die Tür.</>} />
        )}
        <div className="brokers">
          {brokers.map((b, k) => (
            <motion.div key={b.id} layout className={'broker' + (k === 0 && b.landed !== null ? ' best' : '')} title={b.text}>
              {b.url ? (
                <a className="broker-name" href={b.url} target="_blank" rel="noopener noreferrer">
                  {b.name}
                </a>
              ) : (
                <span className="broker-name">{b.name}</span>
              )}
              <span className="broker-type">{b.type}</span>
              <span className="broker-cost mono">{b.landed === null ? 'auf Anfrage' : k === 0 ? money(b.landed, cur) : '+' + money(b.landed - cheapest, cur)}</span>
              {b.source ? (
                <a className="broker-src" href={b.source} target="_blank" rel="noopener noreferrer" title="Preisquelle">
                  <ArrowUpRight size={16} />
                </a>
              ) : (
                <span />
              )}
            </motion.div>
          ))}
        </div>
        <p className="small muted">{O ? 'Aufgeld laut Gebührenübersicht von CLASSIC.com bzw. den Bedingungen des Hauses, Stand 18.11.2026.' : 'Nur Firmen, die ihre Preise öffentlich nennen; Werte von deren Webseiten, Stand 17.11.2026.'} Preise können sich ändern, verbindlich ist das Angebot der Firma.</p>
      </section>

      <section className="section">
        <SectionHead eyebrow="Importeure" title={<>Wer dein Auto <em>holt.</em></>} />
        <ProviderGrid items={IMPORTERS} />
      </section>
    </>
  )
}
