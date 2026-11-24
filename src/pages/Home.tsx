// Startseite „Beyond the Drive“ in neun Sektionen:
// 1 Hero · 2 Drei Welten · 3 Globus · 4 Dream Car · 5 Real Cost · 6 Roads (filmisch, dunkel) · 7 Garage · 8 Passport · 9 Abschluss
import { ArrowRight, Check, Plus, Search } from 'lucide-react'
import { AnimatePresence, motion, useMotionValue, useScroll, useSpring, useTransform } from 'motion/react'
import { useEffect, useMemo, useRef, useState, type FormEvent, type MouseEvent } from 'react'
import { CLASSICS, PRICE_SOURCE } from '../classics.ts'
import { BRAND } from '../config/brand.ts'
import { AGENTS, DEST, agentTotal } from '../data.ts'
import { COUNTRIES, countryById } from '../data/countries.ts'
import { ROADS, ROAD_KINDS, roadImg } from '../data/roads.ts'
import { GlobeView } from '../components/Globe.tsx'
import { Badge, EASE, Reveal, StatusPill, VehicleVisual, fmtDate, fmtMoney, img, vehicleTitle } from '../components/ui.tsx'
import { useT } from '../i18n/i18n.ts'
import { yen } from '../lib/calc.ts'
import { useFx } from '../lib/fx.ts'
import { buildScenarios, range3 } from '../lib/scenarios.ts'
import { href, navigate } from '../lib/router.ts'
import { addVehicle, useStore } from '../store/store.ts'
import { VEHICLE_STATUS, type PassportKind } from '../store/schema.ts'
import { loadCatalogue, suggest, type CarModel } from '../components/ModelFinder.tsx'
import { DIR_COUNTRY } from '../data/directory.ts'

// Weltweit: Straßen und Autos aus Europa, Amerika, Asien und Ozeanien
const SLIDES = [
  { src: roadImg('stelvio'), caption: 'Stilfser Joch, Italien' },
  { src: img('cars/mustang'), caption: 'Ford Mustang Fastback, USA' },
  { src: roadImg('bigsur'), caption: 'Big Sur, Kalifornien' },
  { src: img('fuji-lakes'), caption: 'Nissan Skyline GT-R am Fuji, Japan' },
  { src: roadImg('trollstigen'), caption: 'Trollstigen, Norwegen' },
  { src: img('cars/esprit'), caption: 'Lotus Esprit Turbo, England' },
]

/* 1 ------------------------------------------------------------------ Hero */
function Hero() {
  const { t } = useT()
  const [i, setI] = useState(0)
  const [q, setQ] = useState('')
  const [cat, setCat] = useState<CarModel[]>([])
  const [openSug, setOpenSug] = useState(false)
  const sugg = useMemo(() => suggest(cat, q, 6), [cat, q])
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 40, damping: 18 })
  const sy = useSpring(my, { stiffness: 40, damping: 18 })
  const ix = useTransform(sx, (v) => v * -14)
  const iy = useTransform(sy, (v) => v * -10)
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const tm = setInterval(() => setI((x) => (x + 1) % SLIDES.length), 6500)
    return () => clearInterval(tm)
  }, [])
  const submit = (e: FormEvent) => {
    e.preventDefault()
    const [make, ...rest] = q.trim().split(/\s+/)
    try {
      if (make) localStorage.setItem(`${BRAND.storagePrefix}.markets.q`, JSON.stringify({ make, model: rest.join(' ') }))
    } catch {
      /* ohne Speicher öffnet die Suche mit dem Standard */
    }
    navigate('discover/search/suche')
  }
  const move = (e: MouseEvent) => {
    const r = e.currentTarget.getBoundingClientRect()
    mx.set((e.clientX - r.left) / r.width - 0.5)
    my.set((e.clientY - r.top) / r.height - 0.5)
  }
  return (
    <section className="hx">
      <div className="hx-text">
        <motion.p className="eyebrow" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.7 }}>
          {BRAND.name} · {t('home.hero.eyebrow')}
        </motion.p>
        <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18, duration: 0.9, ease: EASE }}>
          {t('home.hero.title1')}
          <br />
          <em>{t('home.hero.title2')}</em>
        </motion.h1>
        <motion.p className="hx-sub" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.8 }}>
          {t('home.hero.sub')}
        </motion.p>
        <motion.form className="hx-search mf-host" onSubmit={submit} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.8, ease: EASE }}>
          <Search size={19} />
          <input
            value={q}
            onChange={(e) => (setQ(e.target.value), setOpenSug(true))}
            onFocus={() => (loadCatalogue().then(setCat), setOpenSug(true))}
            onBlur={() => setTimeout(() => setOpenSug(false), 150)}
            placeholder={t('home.hero.search')}
            aria-label={t('home.hero.search')}
            autoComplete="off"
          />
          {openSug && sugg.length > 0 && (
            <ul className="mf-suggest" role="listbox">
              {sugg.map((m) => (
                <li key={m.id} role="option" aria-selected={false} onMouseDown={(e) => (e.preventDefault(), setQ(m.n.replace(/\s*\(.*\)$/, '')), setOpenSug(false))}>
                  <span className="mf-flag">{DIR_COUNTRY[m.cc]?.flag ?? '🌍'}</span>
                  <b>{m.n}</b>
                  <small>{m.y0 ?? ''}</small>
                </li>
              ))}
            </ul>
          )}
          <button className="btn primary" type="submit">
            {t('home.hero.go')}
          </button>
        </motion.form>
      </div>
      <motion.div className="hx-stage" onMouseMove={move} initial={{ opacity: 0, y: 30, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.3, duration: 1.1, ease: EASE }}>
        <motion.div className="hx-media" style={{ x: ix, y: iy }}>
          <AnimatePresence>
            <motion.img key={SLIDES[i].src} src={SLIDES[i].src} alt={SLIDES[i].caption} initial={{ opacity: 0, scale: 1.1 }} animate={{ opacity: 1, scale: 1.03 }} exit={{ opacity: 0 }} transition={{ opacity: { duration: 1.3 }, scale: { duration: 9, ease: 'linear' } }} />
          </AnimatePresence>
        </motion.div>
        <div className="hx-cap">
          <div className="hx-dots">
            {SLIDES.map((s, k) => (
              <button key={s.src} className={k === i ? 'on' : ''} onClick={() => setI(k)} aria-label={s.caption} />
            ))}
          </div>
          <AnimatePresence mode="wait">
            <motion.span key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.4 }}>
              {SLIDES[i].caption}
            </motion.span>
          </AnimatePresence>
        </div>
      </motion.div>
    </section>
  )
}

/* 2 ------------------------------------------------------------------ Drei Welten */
function Worlds() {
  const { t, tx } = useT()
  const worlds = [
    { id: 'discover', n: '01', img: img('cars/fd'), items: [tx('Fahrzeugsuche in 12 Märkten', 'Vehicle search in 12 markets'), tx('Auktionshäuser & Import-Partner', 'Auction houses & import partners'), tx('Importrechner mit 4 Szenarien', 'Import calculator with 4 scenarios')] },
    { id: 'drive', n: '02', img: roadImg('stelvio'), items: [tx(`${ROADS.length} belegte Roads`, `${ROADS.length} sourced roads`), tx('Roadtrip-Builder mit GPX', 'Road trip builder with GPX'), tx('Automotive Atlas & Mieten', 'Automotive Atlas & rentals')] },
    { id: 'own', n: '03', img: img('fuji-lakes'), items: [tx('Garage vom Traum bis Verkauf', 'Garage from dream to sale'), tx('Unterhalt, Build, Wartung', 'Ownership, build, maintenance'), 'Automotive Passport'] },
  ] as const
  return (
    <section className="section">
      <Reveal className="sec-head">
        <p className="eyebrow">{t('home.worlds.eyebrow')}</p>
        <h2>
          {t('home.worlds.title')} <em>{t('home.worlds.sub')}</em>
        </h2>
      </Reveal>
      <div className="worlds">
        {worlds.map((w, k) => (
          <motion.a key={w.id} href={href(w.id)} className="world" initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.8, delay: k * 0.08, ease: EASE }}>
            <div className="world-img">
              <img src={w.img} alt="" loading="lazy" />
              <span className="world-n">{w.n}</span>
            </div>
            <div className="world-body">
              <h3>{t(`world.${w.id}.title`)}</h3>
              <p className="world-lead">{t(`world.${w.id}.lead`)}</p>
              <ul>
                {w.items.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
              <span className="world-go">
                {t('common.open')} <ArrowRight size={16} />
              </span>
            </div>
          </motion.a>
        ))}
      </div>
    </section>
  )
}

/* 3 ------------------------------------------------------------------ Globus */
function GlobeSection() {
  const { t, tx } = useT()
  const markets = COUNTRIES.filter((c) => c.market).length
  return (
    <section className="section hglobe">
      <div className="hglobe-text">
        <Reveal>
          <p className="eyebrow">{t('home.globe.eyebrow')}</p>
          <h2>
            {t('home.globe.title')}
          </h2>
          <p className="sec-text">{t('home.globe.sub')}</p>
          <div className="hstats">
            <div>
              <b className="mono">{COUNTRIES.length}</b>
              <span>{tx('Länder im Atlas', 'Countries in the atlas')}</span>
            </div>
            <div>
              <b className="mono">{markets}</b>
              <span>{tx('Märkte mit Suche', 'Markets with search')}</span>
            </div>
            <div>
              <b className="mono">{ROADS.length}</b>
              <span>Roads</span>
            </div>
          </div>
          <a className="btn" href={href('drive/atlas')}>
            Automotive Atlas <ArrowRight size={16} />
          </a>
        </Reveal>
      </div>
      <GlobeView compact theme="stone" />
    </section>
  )
}

/* 4 ------------------------------------------------------------------ Dream Car */
// Vier Kontinente: Japan, USA, England, Australien
const DREAM = [
  { id: 'r34', image: 'cars/r34' },
  { id: 'mustang', image: 'cars/mustang' },
  { id: 'esprit', image: 'cars/esprit' },
  { id: 'monaro', image: 'cars/monaro' },
]
function DreamCar() {
  const { t, tx, locale, d } = useT()
  const vehicles = useStore((s) => s.vehicles)
  const cars = DREAM.map((d) => ({ ...d, c: CLASSICS.find((x) => x.id === d.id)! })).filter((d) => d.c)
  return (
    <section className="section">
      <Reveal className="sec-head">
        <p className="eyebrow">{t('home.dream.eyebrow')}</p>
        <h2>
          {t('home.dream.title')}
        </h2>
        <p className="sec-text">{t('home.dream.sub')}</p>
      </Reveal>
      <div className="dream">
        {cars.map(({ c, image }, k) => {
          const have = vehicles.find((v) => v.make === c.q.make && v.model === c.name.replace(c.q.make + ' ', '') && v.chassis === c.chassis)
          return (
            <motion.article key={c.id} className="dcard" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.7, delay: k * 0.06, ease: EASE }}>
              <div className="dcard-img">
                <img src={img(image)} alt={c.name} loading="lazy" />
              </div>
              <div className="dcard-body">
                <span className="dcard-meta">
                  {c.chassis} · {c.from}–{c.to}
                </span>
                <h3>{c.name}</h3>
                <p>{d(c.why)}</p>
                {c.price ? (
                  <p className="dcard-price">
                    <b className="mono">{c.price.jp.toLocaleString(locale, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}</b>
                    <span>{tx('Median Angebotspreis Japan', 'Median asking price Japan')}{c.price.n ? tx(`, ${c.price.n} Inserate`, `, ${c.price.n} listings`) : ''}</span>
                    {c.price.note && <small>{d(c.price.note)}</small>}
                  </p>
                ) : (
                  <p className="dcard-price muted">{tx('Kein freier Marktpreis', 'No open market price')}</p>
                )}
                {have ? (
                  <a className="btn small" href={href('own/garage/' + have.id)}>
                    <Check size={14} /> {tx('In deiner Garage', 'In your garage')}
                  </a>
                ) : (
                  <button
                    className="btn small primary"
                    onClick={() => addVehicle({ make: c.q.make, model: c.name.replace(c.q.make + ' ', ''), chassis: c.chassis, status: 'dream', market: 'jp', image, source: 'home' })}
                  >
                    <Plus size={14} /> {tx('Als Traum merken', 'Save as dream')}
                  </button>
                )}
              </div>
            </motion.article>
          )
        })}
      </div>
      <p className="muted small">
        {tx('Preise', 'Prices')}: <a href={PRICE_SOURCE.url} target="_blank" rel="noopener noreferrer">{PRICE_SOURCE.name} Market Trends</a> ({PRICE_SOURCE.licence}), {tx(`abgelesen am ${PRICE_SOURCE.date}. Angebotspreise, keine Verkaufspreise. Fotos: Unsplash; Mustang: Coolalabright (CC BY 4.0), Esprit: MrWalkr (CC BY-SA 4.0), Monaro: Jeremy from Sydney (CC BY 2.0), alle Wikimedia Commons.`, `read on ${PRICE_SOURCE.date}. Asking prices, not sale prices. Photos: Unsplash; Mustang: Coolalabright (CC BY 4.0), Esprit: MrWalkr (CC BY-SA 4.0), Monaro: Jeremy from Sydney (CC BY 2.0), all Wikimedia Commons.`)}
      </p>
    </section>
  )
}

/* 5 ------------------------------------------------------------------ Real Cost */
function RealCost() {
  const { t, tx, locale } = useT()
  const { rates, live } = useFx()
  const [hammer, setHammer] = useState(4000000)
  const d = DEST.DE
  const eur = rates.EUR
  const s = useMemo(() => {
    const totals = AGENTS.map((a) => agentTotal(a, hammer)).filter((x): x is number => x !== null).map((x) => x * eur)
    const or = range3(totals)
    return buildScenarios({
      base: { vehicle: hammer * eur, japanFees: or.expected, freight: d.freight.roro, insureOn: true, insurePct: 1.5, dutyPct: d.duty, vatPct: d.vat, fees: d.fees },
      originFees: or,
      freight: { low: d.freight.roro, expected: d.freight.roro, high: d.freight.container },
      fxBandPct: 5,
      worstReservePct: 10,
      custom: { fxPct: 0, reservePct: 0, originFees: or.expected, freight: d.freight.roro },
    })
  }, [hammer, eur, d])
  const max = s.worst.total
  const rows = [
    { k: 'best', l: 'Best Case', v: s.best.total },
    { k: 'expected', l: 'Expected', v: s.expected.total },
    { k: 'worst', l: 'Worst Case', v: s.worst.total },
  ]
  return (
    <section className="section rc">
      <div className="rc-text">
        <Reveal>
          <p className="eyebrow">{t('home.cost.eyebrow')}</p>
          <h2>{t('home.cost.title')}</h2>
          <p className="sec-text">{t('home.cost.sub')}</p>
          <a className="btn primary" href={href('discover/calculator')}>
            {tx('Importrechner öffnen', 'Open import calculator')} <ArrowRight size={16} />
          </a>
        </Reveal>
      </div>
      <Reveal className="rc-card gcard">
        <label className="rc-slider">
          <span className="f-label">{tx('Zuschlag in Japan', 'Hammer price in Japan')}</span>
          <b className="mono">{yen(hammer)}</b>
          <input type="range" min={500000} max={15000000} step={100000} value={hammer} onChange={(e) => setHammer(Number(e.target.value))} aria-label={tx('Zuschlag in Yen', 'Hammer price in yen')} />
          <span className="muted small">
            ≈ {fmtMoney(hammer * eur, 'EUR', locale)} · {live ? tx(`EZB-Kurs vom ${fmtDate(live.date, locale)}`, `ECB rate of ${fmtDate(live.date, locale)}`) : tx('Ersatzkurs', 'Fallback rate')}
          </span>
        </label>
        <div className="rc-bars">
          {rows.map((r) => (
            <div key={r.k} className={'rc-row k-' + r.k}>
              <span>{r.l}</span>
              <span className="rc-bar">
                <motion.i initial={false} animate={{ width: (r.v / max) * 100 + '%' }} transition={{ duration: 0.5, ease: EASE }} />
              </span>
              <b className="mono">{fmtMoney(r.v, 'EUR', locale)}</b>
            </div>
          ))}
        </div>
        <p className="small muted">
          {tx(`Japan → Deutschland, Ø ${AGENTS.length} Agenten mit veröffentlichten Gebühren, RoRo bzw. Container, Zoll 10 %, EUSt 19 %. Kursschwankung ±5 % und 10 % Reserve sind `, `Japan → Germany, avg. of ${AGENTS.length} agents with published fees, RoRo or container, duty 10 %, import VAT 19 %. Currency swing ±5 % and 10 % reserve are `)}<Badge kind="assumption" />{tx(', Fracht und Gebühren in Deutschland sind ', ', freight and fees in Germany are ')}<Badge kind="estimate" />.
        </p>
      </Reveal>
    </section>
  )
}

/* 6 ------------------------------------------------------------------ Roads (horizontal, filmisch) */
function Roads() {
  const { t, tx, L, d } = useT()
  const ref = useRef<HTMLElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const [dist, setDist] = useState(0)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const x = useTransform(scrollYProgress, [0, 1], [0, -dist])
  const pinned = typeof matchMedia !== 'undefined' && matchMedia('(min-width: 900px) and (prefers-reduced-motion: no-preference)').matches
  useEffect(() => {
    const m = () => track.current && setDist(Math.max(0, track.current.scrollWidth - innerWidth + 48))
    m()
    addEventListener('resize', m)
    return () => removeEventListener('resize', m)
  }, [])
  const list = ROADS.slice(0, 10)
  return (
    <section className={'hroads' + (pinned ? ' pinned' : '')} ref={ref} style={pinned ? { height: `calc(100vh + ${dist}px)` } : undefined}>
      <div className="hroads-sticky">
        <div className="hroads-head">
          <div>
            <p className="eyebrow">{t('home.roads.eyebrow')}</p>
            <h2>{t('home.roads.title')}</h2>
          </div>
          <a className="btn light" href={href('drive/roads')}>
            {tx(`Alle ${ROADS.length} Roads`, `All ${ROADS.length} roads`)} <ArrowRight size={16} />
          </a>
        </div>
        <motion.div className="hroads-track" ref={track} style={pinned ? { x } : undefined}>
          {list.map((r) => {
            const c = countryById(r.country)
            return (
              <a key={r.id} className="hroad" href={href('drive/roads/' + r.id)}>
                <div className="hroad-img" style={{ viewTransitionName: 'road-' + r.id }}>
                  <img src={roadImg(r.id)} alt={r.name} loading="lazy" />
                </div>
                <div className="hroad-body">
                  <span>
                    {c?.flag} {c ? L(c.name) : ''} · {L(ROAD_KINDS[r.kind])}
                  </span>
                  <h3>{d(r.name)}</h3>
                  <span className="mono">
                    {r.lengthKm ? `${r.lengthKm.toLocaleString('de-DE')} km` : ''}
                    {r.lengthKm && r.highestM ? ' · ' : ''}
                    {r.highestM ? `${r.highestM.toLocaleString('de-DE')} m` : ''}
                  </span>
                </div>
              </a>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}

/* 7 ------------------------------------------------------------------ Garage */
function GarageSection() {
  const { t, tx, locale } = useT()
  const vehicles = useStore((s) => s.vehicles)
  const counts = VEHICLE_STATUS.map((s) => ({ s, n: vehicles.filter((v) => v.status === s).length }))
  return (
    <section className="section">
      <Reveal className="sec-head">
        <p className="eyebrow">{t('home.garage.eyebrow')}</p>
        <h2>
          {t('home.garage.title')} <em>{vehicles.length ? `${vehicles.length} ${vehicles.length === 1 ? 'Fahrzeug' : 'Fahrzeuge'}.` : 'Noch leer.'}</em>
        </h2>
      </Reveal>
      <div className="hgarage">
        <div className="hpipe">
          {counts.map(({ s, n }) => (
            <a key={s} className={'hpipe-step' + (n ? ' has' : '')} href={href('own/garage')}>
              <b className="mono">{n}</b>
              <StatusPill status={s} />
            </a>
          ))}
        </div>
        {vehicles.length ? (
          <div className="garage">
            {vehicles.slice(0, 3).map((v) => (
              <a key={v.id} href={href('own/garage/' + v.id)} className="veh">
                <div className="veh-img" style={{ viewTransitionName: 'veh-' + v.id }}>
                  <VehicleVisual v={v} />
                </div>
                <div className="veh-body">
                  <StatusPill status={v.status} />
                  <h3>{vehicleTitle(v)}</h3>
                  <span className="muted small mono">{v.landed ? fmtMoney(v.landed.amount, v.landed.cur, locale) + tx(' bis vor die Tür', ' landed') : v.price ? fmtMoney(v.price.amount, v.price.cur, locale) : ''}</span>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="hgarage-empty">
            <p>{t('empty.garage.text')}</p>
            <div className="row gap wrap">
              <a className="btn primary" href={href('own/garage')}>
                {tx('Garage öffnen', 'Open garage')} <ArrowRight size={16} />
              </a>
              <a className="btn" href={href('discover/search')}>
                {tx('Fahrzeugsuche', 'Vehicle search')}
              </a>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

/* 8 ------------------------------------------------------------------ Passport */
// Beispiel-Zeitleiste (Demo, gekennzeichnet), solange der Passport leer ist
const SAMPLE: { d: string; k: PassportKind; t: { de: string; en: string } }[] = [
  { d: '2026-03-14', k: 'purchase', t: { de: 'Zuschlag bei einer Auktion in Japan', en: 'Winning bid at an auction in Japan' } },
  { d: '2026-05-02', k: 'import', t: { de: 'Ankunft in Bremerhaven, verzollt', en: 'Arrived in Bremerhaven, cleared' } },
  { d: '2026-06-10', k: 'registration', t: { de: 'Vollabnahme und H-Kennzeichen', en: 'Full inspection and historic plate' } },
  { d: '2026-09-21', k: 'trip', t: { de: 'Großglockner-Hochalpenstraße', en: 'Grossglockner High Alpine Road' } },
]
const PKIND: Record<PassportKind, { de: string; en: string }> = {
  purchase: { de: 'Kauf', en: 'Purchase' },
  import: { de: 'Import', en: 'Import' },
  registration: { de: 'Zulassung', en: 'Registration' },
  service: { de: 'Wartung', en: 'Service' },
  mod: { de: 'Umbau', en: 'Modification' },
  trip: { de: 'Fahrt', en: 'Drive' },
  document: { de: 'Dokument', en: 'Document' },
  note: { de: 'Notiz', en: 'Note' },
}
function PassportSection() {
  const { t, tx, L, locale } = useT()
  const entries = useStore((s) => s.passport)
  const vehicles = useStore((s) => s.vehicles)
  const real = entries.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4)
  const v = real[0] ? vehicles.find((x) => x.id === real[0].vehicleId) : undefined
  return (
    <section className="section hpass">
      <div>
        <Reveal>
          <p className="eyebrow">{t('home.passport.eyebrow')}</p>
          <h2>{t('home.passport.title')}</h2>
          <p className="sec-text">{t('home.passport.sub')}</p>
          <a className="btn" href={href('own/passport')}>
            {tx('Passport öffnen', 'Open passport')} <ArrowRight size={16} />
          </a>
        </Reveal>
      </div>
      <Reveal className="hpass-card">
        <div className="hpass-top">
          <span>Automotive Passport</span>
          {real.length ? <b>{v ? vehicleTitle(v) : ''}</b> : <Badge kind="demo">{tx('Beispiel', 'Example')}</Badge>}
        </div>
        <ol className="timeline compact">
          {(real.length ? real.map((e) => ({ d: e.date, k: e.kind, t: e.title })) : SAMPLE.map((e) => ({ ...e, t: L(e.t) }))).map((e, k) => (
            <li key={k} className="tl">
              <span className="tl-date mono">{fmtDate(e.d, locale)}</span>
              <span className="tl-dot" />
              <div className="tl-body">
                <span className="tl-kind">{L(PKIND[e.k])}</span>
                <b>{e.t}</b>
              </div>
            </li>
          ))}
        </ol>
      </Reveal>
    </section>
  )
}

/* 9 ------------------------------------------------------------------ Abschluss */
function Closing() {
  const { t } = useT()
  return (
    <section className="hend">
      <div className="hend-img">
        <img src={roadImg('sunroad')} alt="Going-to-the-Sun Road" loading="lazy" />
      </div>
      <div className="hend-text">
        <Reveal>
          <p className="eyebrow">{BRAND.claim}</p>
          <h2>{t('home.end.title')}</h2>
          <div className="row gap wrap center">
            <a className="btn primary" href={href('discover')}>
              Discover <ArrowRight size={16} />
            </a>
            <a className="btn light" href={href('drive')}>
              Drive
            </a>
            <a className="btn light" href={href('own')}>
              Own
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

export function Home() {
  return (
    <div className="home">
      <Hero />
      <Worlds />
      <GlobeSection />
      <DreamCar />
      <RealCost />
      <Roads />
      <GarageSection />
      <PassportSection />
      <Closing />
    </div>
  )
}
