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
import { Badge, EASE, Reveal, StatusPill, fmtDate, fmtMoney, img, vehicleTitle } from '../components/ui.tsx'
import { useT } from '../i18n/i18n.ts'
import { yen } from '../lib/calc.ts'
import { useFx } from '../lib/fx.ts'
import { buildScenarios, range3 } from '../lib/scenarios.ts'
import { href, navigate } from '../lib/router.ts'
import { addVehicle, useStore } from '../store/store.ts'
import { VEHICLE_STATUS } from '../store/schema.ts'
import { VehicleVisual } from './own/Own.tsx'

const SLIDES = [
  { src: img('fuji-lakes'), caption: 'Nissan Skyline GT-R am Fuji' },
  { src: roadImg('stelvio'), caption: 'Stilfser Joch, Italien' },
  { src: img('cars/r34'), caption: 'Skyline GT-R R34, Shibuya' },
  { src: roadImg('shimanami'), caption: 'Shimanami Kaidō, Japan' },
]

/* 1 ------------------------------------------------------------------ Hero */
function Hero() {
  const { t } = useT()
  const [i, setI] = useState(0)
  const [q, setQ] = useState('')
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
        <motion.form className="hx-search" onSubmit={submit} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.8, ease: EASE }}>
          <Search size={19} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('home.hero.search')} aria-label={t('home.hero.search')} />
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
  const { t } = useT()
  const worlds = [
    { id: 'discover', n: '01', img: img('cars/fd'), items: ['Fahrzeugsuche in 11 Ländern', 'Auktionshäuser & Import-Partner', 'Importrechner mit 4 Szenarien'] },
    { id: 'drive', n: '02', img: roadImg('stelvio'), items: [`${ROADS.length} belegte Roads`, 'Roadtrip-Builder mit GPX', 'Automotive Atlas & Mieten'] },
    { id: 'own', n: '03', img: img('fuji-lakes'), items: ['Garage vom Traum bis Verkauf', 'Unterhalt, Build, Wartung', 'Automotive Passport'] },
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
  const { t } = useT()
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
              <span>Länder im Atlas</span>
            </div>
            <div>
              <b className="mono">{markets}</b>
              <span>Märkte mit Suche</span>
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
      <GlobeView compact />
    </section>
  )
}

/* 4 ------------------------------------------------------------------ Dream Car */
const DREAM = [
  { id: 'r34', image: 'cars/r34' },
  { id: 'fd', image: 'cars/fd' },
  { id: 's15', image: 'cars/s15' },
  { id: 'evo6', image: 'cars/evo' },
]
function DreamCar() {
  const { t, locale } = useT()
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
                <p>{c.why}</p>
                {c.price ? (
                  <p className="dcard-price">
                    <b className="mono">{c.price.jp.toLocaleString(locale, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}</b>
                    <span>Median Angebotspreis Japan{c.price.n ? `, ${c.price.n} Inserate` : ''}</span>
                    {c.price.note && <small>{c.price.note}</small>}
                  </p>
                ) : (
                  <p className="dcard-price muted">Kein freier Marktpreis</p>
                )}
                {have ? (
                  <a className="btn small" href={href('own/garage/' + have.id)}>
                    <Check size={14} /> In deiner Garage
                  </a>
                ) : (
                  <button
                    className="btn small primary"
                    onClick={() => addVehicle({ make: c.q.make, model: c.name.replace(c.q.make + ' ', ''), chassis: c.chassis, status: 'dream', market: 'jp', image, source: 'home' })}
                  >
                    <Plus size={14} /> Als Traum merken
                  </button>
                )}
              </div>
            </motion.article>
          )
        })}
      </div>
      <p className="muted small">
        Preise: <a href={PRICE_SOURCE.url} target="_blank" rel="noopener noreferrer">{PRICE_SOURCE.name} Market Trends</a> ({PRICE_SOURCE.licence}), abgelesen am {PRICE_SOURCE.date}. Angebotspreise, keine Verkaufspreise. Fotos: Unsplash.
      </p>
    </section>
  )
}

/* 5 ------------------------------------------------------------------ Real Cost */
function RealCost() {
  const { t, locale } = useT()
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
            Importrechner öffnen <ArrowRight size={16} />
          </a>
        </Reveal>
      </div>
      <Reveal className="rc-card gcard">
        <label className="rc-slider">
          <span className="f-label">Zuschlag in Japan</span>
          <b className="mono">{yen(hammer)}</b>
          <input type="range" min={500000} max={15000000} step={100000} value={hammer} onChange={(e) => setHammer(Number(e.target.value))} aria-label="Zuschlag in Yen" />
          <span className="muted small">
            ≈ {fmtMoney(hammer * eur, 'EUR', locale)} · {live ? `EZB-Kurs vom ${fmtDate(live.date, locale)}` : 'Ersatzkurs'}
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
          Japan → Deutschland, Ø {AGENTS.length} Agenten mit veröffentlichten Gebühren, RoRo bzw. Container, Zoll 10 %, EUSt 19 %. Kursschwankung ±5 % und 10 % Reserve sind <Badge kind="assumption" />, Fracht und Gebühren in Deutschland sind <Badge kind="estimate" />.
        </p>
      </Reveal>
    </section>
  )
}

/* 6 ------------------------------------------------------------------ Roads (horizontal, filmisch) */
function Roads() {
  const { t, L } = useT()
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
            Alle {ROADS.length} Roads <ArrowRight size={16} />
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
                  <h3>{r.name}</h3>
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
  const { t, locale } = useT()
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
                  <span className="muted small mono">{v.landed ? fmtMoney(v.landed.amount, v.landed.cur, locale) + ' bis vor die Tür' : v.price ? fmtMoney(v.price.amount, v.price.cur, locale) : ''}</span>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="hgarage-empty">
            <p>{t('empty.garage.text')}</p>
            <div className="row gap wrap">
              <a className="btn primary" href={href('own/garage')}>
                Garage öffnen <ArrowRight size={16} />
              </a>
              <a className="btn" href={href('discover/search')}>
                Fahrzeugsuche
              </a>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

/* 8 ------------------------------------------------------------------ Passport */
const SAMPLE = [
  { d: '2026-03-14', k: 'Kauf', t: 'Zuschlag bei einer Auktion in Japan' },
  { d: '2026-05-02', k: 'Import', t: 'Ankunft in Bremerhaven, verzollt' },
  { d: '2026-06-10', k: 'Zulassung', t: 'Vollabnahme und H-Kennzeichen' },
  { d: '2026-09-21', k: 'Fahrt', t: 'Großglockner-Hochalpenstraße' },
]
function PassportSection() {
  const { t, locale } = useT()
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
            Passport öffnen <ArrowRight size={16} />
          </a>
        </Reveal>
      </div>
      <Reveal className="hpass-card">
        <div className="hpass-top">
          <span>Automotive Passport</span>
          {real.length ? <b>{v ? vehicleTitle(v) : ''}</b> : <Badge kind="demo">Beispiel</Badge>}
        </div>
        <ol className="timeline compact">
          {(real.length ? real.map((e) => ({ d: e.date, k: e.kind, t: e.title })) : SAMPLE).map((e, k) => (
            <li key={k} className="tl">
              <span className="tl-date mono">{fmtDate(e.d, locale)}</span>
              <span className="tl-dot" />
              <div className="tl-body">
                <span className="tl-kind">{e.k}</span>
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
