// Startseite im Scroll-Modus (Aufbau wie die StreetSignal-Startseite): Vollbild-Hero mit Bildwechsel und Maus-Parallaxe,
// schwebende Chips, Kippkarten für jeden Bereich, ein angehefteter Scroll-Abschnitt „So kommt dein Auto zu dir“,
// Parallax-Band mit hochzählenden Zahlen und ein Abschluss mit den wichtigsten Wegen.
import { ArrowRight, Bookmark, Calculator, Car, Globe, MapPin, Search, ShieldCheck, Ship, Wrench } from 'lucide-react'
import { AnimatePresence, motion, useMotionValue, useMotionValueEvent, useScroll, useSpring, useTransform } from 'motion/react'
import { useEffect, useRef, useState, type FormEvent, type MouseEvent } from 'react'
import { AGENTS, MARKETS, agentAverage } from '../data.ts'
import { yen } from '../lib/calc.ts'
import { useFx } from '../lib/fx.ts'

const img = (n: string) => `${import.meta.env.BASE_URL}images/${n}.jpg`
const EASE = [0.22, 1, 0.36, 1] as const

const SLIDES = [
  { src: img('wangan'), caption: 'Wangan bei Nacht' },
  { src: img('daikoku'), caption: 'Daikoku PA' },
  { src: img('cars/r34'), caption: 'Skyline GT-R R34' },
  { src: img('fuji'), caption: 'Fuji und Hakone' },
]

function Hero() {
  const [i, setI] = useState(0)
  const [q, setQ] = useState('')
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 40, damping: 18 })
  const sy = useSpring(my, { stiffness: 40, damping: 18 })
  const imgX = useTransform(sx, (v) => v * -20)
  const imgY = useTransform(sy, (v) => v * -14)
  const chipX = useTransform(sx, (v) => v * 26)
  const chipY = useTransform(sy, (v) => v * 18)
  const avg = agentAverage(1500000)

  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % SLIDES.length), 7000)
    return () => clearInterval(t)
  }, [])
  const onMove = (e: MouseEvent) => {
    const r = e.currentTarget.getBoundingClientRect()
    mx.set((e.clientX - r.left) / r.width - 0.5)
    my.set((e.clientY - r.top) / r.height - 0.5)
  }
  const submit = (e: FormEvent) => {
    e.preventDefault()
    const [make, ...rest] = q.trim().split(/\s+/)
    try {
      if (make) localStorage.setItem('tomei.markets.q', JSON.stringify({ make, model: rest.join(' ') }))
    } catch {}
    location.hash = '/markets'
  }
  const CHIPS = [
    { icon: Globe, label: `${MARKETS.length} Märkte in Asien`, x: '7%', y: '24%' },
    { icon: Calculator, label: `Ø Agent ${yen(avg)}`, x: '73%', y: '19%' },
    { icon: Ship, label: 'Bis Bremerhaven', x: '79%', y: '64%' },
    { icon: MapPin, label: 'Spots in Japan', x: '4%', y: '68%' },
  ]

  return (
    <section className="h-hero" onMouseMove={onMove}>
      <motion.div className="h-hero-media" style={{ x: imgX, y: imgY }}>
        <AnimatePresence>
          <motion.img key={SLIDES[i].src} src={SLIDES[i].src} alt={SLIDES[i].caption} initial={{ opacity: 0, scale: 1.12 }} animate={{ opacity: 1, scale: 1.02 }} exit={{ opacity: 0 }} transition={{ opacity: { duration: 1.6 }, scale: { duration: 9, ease: 'linear' } }} />
        </AnimatePresence>
      </motion.div>
      <div className="h-hero-veil" />

      <motion.div className="h-chips" style={{ x: chipX, y: chipY }} aria-hidden>
        {CHIPS.map((c, k) => (
          <motion.span key={c.label} className="h-chip" style={{ left: c.x, top: c.y }} initial={{ opacity: 0, y: 20, scale: 0.9 }} animate={{ opacity: 1, y: [0, -8, 0], scale: 1 }} transition={{ opacity: { delay: 0.8 + k * 0.25 }, scale: { delay: 0.8 + k * 0.25 }, y: { duration: 5 + k, repeat: Infinity, ease: 'easeInOut', delay: k * 0.6 } }}>
            <c.icon size={15} /> {c.label}
          </motion.span>
        ))}
      </motion.div>

      <div className="h-hero-center">
        <motion.p className="eyebrow" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.8 }}>
          TŌMEI · The Japanese Car Experience
        </motion.p>
        <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.9, ease: EASE }}>
          Dein Traumauto aus Asien.
          <br />
          <em>Durchsichtig bis vor die Tür.</em>
        </motion.h1>
        <motion.p className="h-sub" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45, duration: 0.8 }}>
          Suchen in sieben Märkten, jeden Yen durchrechnen, mit echten Gebühren der Export-Agenten. Und wenn du willst, holen wir es dir.
        </motion.p>
        <motion.form className="h-search" onSubmit={submit} initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.6, duration: 0.8, ease: EASE }}>
          <div className="pulse" aria-hidden>
            <i />
            <i />
            <i />
          </div>
          <Search size={20} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="z. B. Toyota Supra" aria-label="Auto suchen" />
          <button className="btn red" type="submit">
            Suchen <ArrowRight size={16} />
          </button>
        </motion.form>
        <div className="h-dots">
          {SLIDES.map((s, k) => (
            <button key={s.src} className={k === i ? 'on' : ''} onClick={() => setI(k)} aria-label={s.caption} />
          ))}
          <span>{SLIDES[i].caption}</span>
        </div>
      </div>
      <motion.div className="h-scroll" animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity }} aria-hidden>
        <span />
      </motion.div>
    </section>
  )
}

function TiltCard({ href, src, icon: Icon, title, text, items }: { href: string; src: string; icon: typeof Car; title: string; text: string; items: string[] }) {
  const rx = useMotionValue(0)
  const ry = useMotionValue(0)
  const srx = useSpring(rx, { stiffness: 120, damping: 14 })
  const sry = useSpring(ry, { stiffness: 120, damping: 14 })
  return (
    <motion.a
      href={href}
      className="h-tilt"
      style={{ rotateX: srx, rotateY: sry }}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect()
        ry.set(((e.clientX - r.left) / r.width - 0.5) * 10)
        rx.set(-((e.clientY - r.top) / r.height - 0.5) * 8)
      }}
      onMouseLeave={() => {
        rx.set(0)
        ry.set(0)
      }}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.8, ease: EASE }}
    >
      <img src={src} alt="" loading="lazy" />
      <div className="h-tilt-veil" />
      <div className="h-tilt-body">
        <Icon size={20} />
        <h3>{title}</h3>
        <p>{text}</p>
        <ul>
          {items.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
        <span className="h-go">
          Öffnen <ArrowRight size={15} />
        </span>
      </div>
    </motion.a>
  )
}

const AREAS = [
  { href: '#/markets', src: img('cars/r34'), icon: Globe, title: 'Märkte', text: 'Eine Suche für Japan, Korea, Thailand, Malaysia, Singapur, Hongkong und Dubai.', items: ['Direkt zu den Angeboten', 'Auktionshäuser erklärt', 'Merkliste'] },
  { href: '#/import/rechner', src: img('import-ship'), icon: Calculator, title: 'Import-Rechner', text: 'Was dein Auto bis vor die Tür kostet, für sechs Zielländer.', items: ['Tageskurs der EZB', 'Zoll und Steuern', 'Echte Agenten-Gebühren'] },
  { href: '#/service', src: img('import-port'), icon: ShieldCheck, title: 'Service', text: 'Kaufen, verschiffen, zulassen: ein Ansprechpartner für alles.', items: ['Auktionsblatt prüfen', 'Verschiffung und Zoll', 'TÜV und Zulassung'] },
  { href: '#/spots', src: img('daikoku'), icon: MapPin, title: 'Spots', text: 'Die Orte, an denen Japans Autokultur lebt.', items: ['Daikoku, Tatsumi, Wangan', 'Hakone und Fuji', 'Mit Karte'] },
  { href: '#/rent', src: img('rent-supra'), icon: Car, title: 'Rent', text: 'JDM-Legenden in Japan mieten.', items: ['Vermieter im Vergleich', 'Trackdays', 'Tipps für die Reise'] },
  { href: '#/parts', src: img('parts-wheel'), icon: Wrench, title: 'Parts', text: 'Tuning-Teile und Felgen direkt aus Japan.', items: ['HKS, Nismo, RAYS', 'Bodykits', 'Weltweiter Versand'] },
]

const STORY = [
  { icon: Search, title: 'Finden', text: 'Gib Marke und Modell ein. TŌMEI öffnet die aktuellen Angebote in sieben Ländern.', src: img('wangan') },
  { icon: Bookmark, title: 'Merken', text: 'Link und Preis in die Merkliste. Fremdwährung rechnet TŌMEI zum Tageskurs in Yen um.', src: img('cars/fd') },
  { icon: Calculator, title: 'Durchrechnen', text: 'Ein Klick, und der Rechner zeigt alles bis vor die Tür, mit dem Durchschnitt echter Agenten-Gebühren.', src: img('import-ship') },
  { icon: Ship, title: 'Ankommen', text: 'Selbst importieren oder den TŌMEI Service beauftragen: verschiffen, verzollen, zulassen.', src: img('import-port') },
]

/** Angehefteter Abschnitt: Beim Scrollen wechseln Schritt und Bild, ein Balken zeigt den Fortschritt. */
function Story() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const [step, setStep] = useState(0)
  useMotionValueEvent(scrollYProgress, 'change', (v) => setStep(Math.min(STORY.length - 1, Math.max(0, Math.floor(v * STORY.length)))))
  const bar = useSpring(scrollYProgress, { stiffness: 120, damping: 24 })
  const S = STORY[step]
  return (
    <section className="h-story" ref={ref} style={{ height: `${STORY.length * 90}vh` }}>
      <div className="h-story-pin">
        <div className="h-story-text">
          <p className="eyebrow">So kommt dein Auto zu dir</p>
          <ol>
            {STORY.map((s, k) => (
              <li key={s.title} className={k === step ? 'on' : k < step ? 'done' : ''}>
                <span className="h-story-n">{k + 1}</span>
                <div>
                  <h3>{s.title}</h3>
                  <motion.p initial={false} animate={{ height: k === step ? 'auto' : 0, opacity: k === step ? 1 : 0 }} transition={{ duration: 0.45, ease: EASE }}>
                    {s.text}
                  </motion.p>
                </div>
              </li>
            ))}
          </ol>
          <div className="h-story-bar">
            <motion.i style={{ scaleY: bar }} />
          </div>
        </div>
        <div className="h-story-media">
          <AnimatePresence mode="popLayout">
            <motion.figure key={S.src} initial={{ opacity: 0, scale: 1.08, rotateY: -12 }} animate={{ opacity: 1, scale: 1, rotateY: 0 }} exit={{ opacity: 0, scale: 0.94, rotateY: 10 }} transition={{ duration: 0.8, ease: EASE }}>
              <img src={S.src} alt="" />
              <figcaption>
                <S.icon size={18} /> {S.title}
              </figcaption>
            </motion.figure>
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}

/** Zahl zählt hoch, sobald sie ins Bild kommt */
function CountUp({ to, format = (v: number) => Math.round(v).toLocaleString('de-DE') }: { to: number; format?: (v: number) => string }) {
  const [v, setV] = useState(0)
  const [go, setGo] = useState(false)
  useEffect(() => {
    if (!go) return
    let raf = 0
    const t0 = performance.now()
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / 1400)
      setV(to * (1 - Math.pow(1 - p, 3)))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [go, to])
  return <motion.b onViewportEnter={() => setGo(true)} viewport={{ once: true }}>{format(v)}</motion.b>
}

function Band() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], ['-14%', '14%'])
  const { rates, live } = useFx()
  const eurYen = rates.EUR ? 1 / rates.EUR : 0
  return (
    <section className="h-band" ref={ref}>
      <motion.img src={img('fuji-lakes')} alt="" style={{ y }} />
      <div className="h-band-veil" />
      <div className="h-band-inner">
        <div className="h-stat">
          <CountUp to={MARKETS.length} />
          <span>Märkte in Asien</span>
        </div>
        <div className="h-stat">
          <CountUp to={AGENTS.length} />
          <span>Agenten mit offenen Preisen</span>
        </div>
        <div className="h-stat">
          <CountUp to={agentAverage(1500000)} format={(v) => yen(v)} />
          <span>Ø Agent bei 1,5 Mio. ¥</span>
        </div>
        <div className="h-stat">
          <CountUp to={eurYen} format={(v) => v.toLocaleString('de-DE', { maximumFractionDigits: 1 }) + ' ¥'} />
          <span>für 1 € {live ? `(EZB, ${new Date(live.date).toLocaleDateString('de-DE')})` : '(Ersatzkurs)'}</span>
        </div>
      </div>
    </section>
  )
}

export function Home() {
  return (
    <div className="home">
      <Hero />

      <section className="section">
        <motion.div className="sec-head" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
          <p className="eyebrow">Alles an einem Ort</p>
          <h2>
            Sechs Wege <em>zu deinem JDM.</em>
          </h2>
        </motion.div>
        <div className="h-tilt-grid">
          {AREAS.map((a) => (
            <TiltCard key={a.title} {...a} />
          ))}
        </div>
      </section>

      <Story />
      <Band />

      <section className="h-cta">
        <motion.h2 initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, ease: EASE }}>
          Bereit für <em>dein Auto?</em>
        </motion.h2>
        <div className="h-cta-row">
          <a className="btn red" href="#/markets">
            Märkte durchsuchen <ArrowRight size={18} />
          </a>
          <a className="btn" href="#/import/rechner">
            Kosten berechnen
          </a>
          <a className="btn" href="#/service">
            TŌMEI Service
          </a>
        </div>
      </section>
    </div>
  )
}
