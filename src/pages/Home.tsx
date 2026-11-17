// Startseite im Scroll-Modus (Aufbau wie die StreetSignal-Startseite): Vollbild-Hero mit Bildwechsel und Maus-Parallaxe,
// schwebende Chips, Kippkarten für jeden Bereich, ein angehefteter Scroll-Abschnitt „So kommt dein Auto zu dir“,
// Parallax-Band mit hochzählenden Zahlen und ein Abschluss mit den wichtigsten Wegen.
import { ArrowRight, Bookmark, Calculator, Car, Globe, MapPin, Search, ShieldCheck, Ship, Wrench } from 'lucide-react'
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useSpring, useTransform } from 'motion/react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
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
  const ref = useRef<HTMLDivElement>(null)
  // Das große Bild wächst beim Scrollen leicht auf volle Breite (wie auf Apples Produktseiten)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'start start'] })
  const scale = useTransform(scrollYProgress, [0, 1], [0.92, 1])
  const imgY = useTransform(scrollYProgress, [0, 1], ['-4%', '4%'])

  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % SLIDES.length), 6000)
    return () => clearInterval(t)
  }, [])
  const submit = (e: FormEvent) => {
    e.preventDefault()
    const [make, ...rest] = q.trim().split(/\s+/)
    try {
      if (make) localStorage.setItem('tomei.markets.q', JSON.stringify({ make, model: rest.join(' ') }))
    } catch {}
    location.hash = '/markets'
  }

  return (
    <section className="h-hero">
      <div className="h-hero-text">
        <motion.p className="eyebrow" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.8 }}>
          TŌMEI
        </motion.p>
        <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.9, ease: EASE }}>
          Dein Auto aus Asien.
          <br />
          <em>Klar gerechnet.</em>
        </motion.h1>
        <motion.p className="h-sub" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.8 }}>
          Sieben Märkte durchsuchen, jeden Yen bis vor die Tür rechnen, mit echten Gebühren der Export-Agenten.
        </motion.p>
        <motion.form className="h-search" onSubmit={submit} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55, duration: 0.8, ease: EASE }}>
          <Search size={19} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="z. B. Toyota Supra" aria-label="Auto suchen" />
          <button className="btn red" type="submit">
            Suchen
          </button>
        </motion.form>
      </div>
      <motion.div className="h-stage" ref={ref} style={{ scale }} initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 1, ease: EASE }}>
        <AnimatePresence>
          <motion.img key={SLIDES[i].src} src={SLIDES[i].src} alt={SLIDES[i].caption} style={{ y: imgY }} initial={{ opacity: 0, scale: 1.08 }} animate={{ opacity: 1, scale: 1.1 }} exit={{ opacity: 0 }} transition={{ opacity: { duration: 1.2 }, scale: { duration: 7, ease: 'linear' } }} />
        </AnimatePresence>
        <div className="h-stage-cap">
          <div className="h-dots">
            {SLIDES.map((s, k) => (
              <button key={s.src} className={k === i ? 'on' : ''} onClick={() => setI(k)} aria-label={s.caption} />
            ))}
          </div>
          {SLIDES[i].caption}
        </div>
      </motion.div>
    </section>
  )
}

function Tile({ href, src, title, text, delay }: { href: string; src: string; title: string; text: string; delay: number }) {
  return (
    <motion.a href={href} className="h-tile" initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.8, delay, ease: EASE }}>
      <div className="h-tile-body">
        <h3>{title}</h3>
        <p>{text}</p>
        <span className="h-go">
          Mehr erfahren <ArrowRight size={15} />
        </span>
      </div>
      <div className="h-tile-img">
        <img src={src} alt="" loading="lazy" />
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
            <motion.figure key={S.src} initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8, ease: EASE }}>
              <img src={S.src} alt="" />
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

function Stats() {
  const { rates, live } = useFx()
  const eurYen = rates.EUR ? 1 / rates.EUR : 0
  const items = [
    { to: MARKETS.length, f: undefined, label: 'Märkte in Asien' },
    { to: AGENTS.length, f: undefined, label: 'Agenten mit offenen Preisen' },
    { to: agentAverage(1500000), f: (v: number) => yen(v), label: 'Ø Agent bei 1,5 Mio. ¥' },
    { to: eurYen, f: (v: number) => v.toLocaleString('de-DE', { maximumFractionDigits: 1 }) + ' ¥', label: `für 1 € ${live ? `(EZB, ${new Date(live.date).toLocaleDateString('de-DE')})` : '(Ersatzkurs)'}` },
  ]
  return (
    <section className="section">
      <div className="sec-head">
        <p className="eyebrow">In Zahlen</p>
        <h2>
          Mit Quelle. <em>Zum Tageskurs.</em>
        </h2>
      </div>
      <div className="h-stats">
        {items.map((s, k) => (
          <motion.div key={s.label} className="h-stat" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, delay: k * 0.08, ease: EASE }}>
            <CountUp to={s.to} format={s.f} />
            <span>{s.label}</span>
          </motion.div>
        ))}
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
          <p className="eyebrow">Entdecken</p>
          <h2>
            Alles an einem Ort. <em>Sechs Wege zu deinem JDM.</em>
          </h2>
        </motion.div>
        <div className="h-tiles">
          {AREAS.map((a, k) => (
            <Tile key={a.title} href={a.href} src={a.src} title={a.title} text={a.text} delay={(k % 3) * 0.08} />
          ))}
        </div>
      </section>

      <Story />
      <Stats />

      <section className="h-cta">
        <motion.h2 initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, ease: EASE }}>
          Bereit? <em>Los geht's.</em>
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
