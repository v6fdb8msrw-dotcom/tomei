import { ArrowUpRight } from 'lucide-react'
import { AnimatePresence, motion, useMotionValue, useScroll, useSpring, useTransform } from 'motion/react'
import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react'
import type { Provider, Slide } from '../data.ts'

export const EASE = [0.22, 1, 0.36, 1] as const

/** Blendet Inhalte beim Hineinscrollen weich ein (leichtes Hochgleiten). */
export function Reveal({ children, delay = 0, className, y = 28 }: { children: ReactNode; delay?: number; className?: string; y?: number }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.8, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  )
}

/**
 * Vollbild-Hero: Bilder blenden ineinander und zoomen langsam (Ken Burns),
 * folgen leicht der Maus, und der Text gleitet beim Scrollen weg.
 */
export function Hero({ slides, eyebrow, title, sub, chips = [], children, interval = 6000 }: {
  slides: Slide[]
  eyebrow: string
  title: ReactNode
  sub?: ReactNode
  chips?: string[]
  children?: ReactNode
  interval?: number
}) {
  const [i, setI] = useState(0)
  const ref = useRef<HTMLElement>(null)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 40, damping: 18 })
  const sy = useSpring(my, { stiffness: 40, damping: 18 })
  const imgX = useTransform(sx, (v) => v * -18)
  const imgY = useTransform(sy, (v) => v * -12)
  const chipX = useTransform(sx, (v) => v * 24)
  const chipY = useTransform(sy, (v) => v * 16)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const textY = useTransform(scrollYProgress, [0, 1], [0, 140])
  const textO = useTransform(scrollYProgress, [0, 0.7], [1, 0])
  const mediaScale = useTransform(scrollYProgress, [0, 1], [1, 1.12])

  useEffect(() => {
    if (slides.length < 2) return
    const t = setInterval(() => setI((x) => (x + 1) % slides.length), interval)
    return () => clearInterval(t)
  }, [slides.length, interval])

  const onMove = (e: MouseEvent) => {
    const r = e.currentTarget.getBoundingClientRect()
    mx.set((e.clientX - r.left) / r.width - 0.5)
    my.set((e.clientY - r.top) / r.height - 0.5)
  }

  const slide = slides[i] ?? slides[0]
  return (
    <section className="hero" ref={ref} onMouseMove={onMove}>
      <motion.div className="hero-media" style={{ x: imgX, y: imgY, scale: mediaScale }}>
        <AnimatePresence>
          <motion.img
            key={slide.src}
            src={slide.src}
            alt={slide.caption}
            initial={{ opacity: 0, scale: 1.14 }}
            animate={{ opacity: 1, scale: 1.02 }}
            exit={{ opacity: 0 }}
            transition={{ opacity: { duration: 1.6 }, scale: { duration: interval / 1000 + 3, ease: 'linear' } }}
          />
        </AnimatePresence>
      </motion.div>
      <div className="hero-veil" />

      {chips.length > 0 && (
        <motion.div className="hero-chips" style={{ x: chipX, y: chipY }} aria-hidden>
          {chips.map((c, k) => (
            <motion.span
              key={c}
              className="chip"
              style={{ left: CHIP_POS[k % CHIP_POS.length][0], top: CHIP_POS[k % CHIP_POS.length][1] }}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: [0, -8, 0], scale: 1 }}
              transition={{ opacity: { delay: 0.9 + k * 0.2 }, scale: { delay: 0.9 + k * 0.2 }, y: { duration: 5 + k, repeat: Infinity, ease: 'easeInOut', delay: k * 0.5 } }}
            >
              <i /> {c}
            </motion.span>
          ))}
        </motion.div>
      )}

      <motion.div className="hero-content" style={{ y: textY, opacity: textO }}>
        <motion.p className="eyebrow" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.8 }}>
          {eyebrow}
        </motion.p>
        <motion.h1 initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.95, ease: EASE }}>
          {title}
        </motion.h1>
        {sub && (
          <motion.p className="hero-sub" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45, duration: 0.8 }}>
            {sub}
          </motion.p>
        )}
        {children && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.8 }}>
            {children}
          </motion.div>
        )}
      </motion.div>

      <div className="hero-foot">
        {slides.length > 1 && (
          <div className="dots" role="tablist" aria-label="Bilder">
            {slides.map((s, k) => (
              <button key={s.src} className={k === i ? 'on' : ''} onClick={() => setI(k)} aria-label={s.caption} />
            ))}
          </div>
        )}
        <AnimatePresence mode="wait">
          <motion.span key={slide.caption} className="caption" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.5 }}>
            {slide.caption}
          </motion.span>
        </AnimatePresence>
        <span className="scroll-hint">
          Scrollen <motion.i animate={{ y: [0, 6, 0] }} transition={{ duration: 1.8, repeat: Infinity }}>↓</motion.i>
        </span>
      </div>
    </section>
  )
}

const CHIP_POS: [string, string][] = [
  ['4%', '22%'],
  ['80%', '16%'],
  ['84%', '64%'],
  ['6%', '70%'],
]

/** Karte, die sich zur Maus neigt. */
export function TiltCard({ children, className = '', onClick, href }: { children: ReactNode; className?: string; onClick?: () => void; href?: string }) {
  const rx = useMotionValue(0)
  const ry = useMotionValue(0)
  const srx = useSpring(rx, { stiffness: 120, damping: 14 })
  const sry = useSpring(ry, { stiffness: 120, damping: 14 })
  const props = {
    className: 'tilt ' + className,
    style: { rotateX: srx, rotateY: sry },
    onMouseMove: (e: MouseEvent<HTMLElement>) => {
      const r = e.currentTarget.getBoundingClientRect()
      ry.set(((e.clientX - r.left) / r.width - 0.5) * 10)
      rx.set(-((e.clientY - r.top) / r.height - 0.5) * 8)
    },
    onMouseLeave: () => {
      rx.set(0)
      ry.set(0)
    },
    initial: { opacity: 0, y: 40 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-60px' },
    transition: { duration: 0.8, ease: EASE },
  }
  if (href) return <motion.a {...props} href={href} target="_blank" rel="noopener noreferrer">{children}</motion.a>
  if (onClick) return <motion.button {...props} onClick={onClick}>{children}</motion.button>
  return <motion.article {...props}>{children}</motion.article>
}

/** Breites Bildband mit Parallaxe, darüber Text. */
export function ParallaxBand({ src, children }: { src: string; children: ReactNode }) {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], ['-14%', '14%'])
  return (
    <section className="band" ref={ref}>
      <motion.img src={src} alt="" style={{ y }} loading="lazy" />
      <div className="band-veil" />
      <div className="band-inner">{children}</div>
    </section>
  )
}

/** Logo über den Favicon-Dienst von Google, sonst der Anfangsbuchstabe. */
function Logo({ url, name }: { url: string; name: string }) {
  const [failed, setFailed] = useState(false)
  const host = new URL(url).hostname
  if (failed) return <span className="logo letter">{name[0]}</span>
  return <img className="logo" src={`https://www.google.com/s2/favicons?domain=${host}&sz=128`} alt="" loading="lazy" onError={() => setFailed(true)} />
}

/** Raster mit Anbieter-Karten (Logo, ein Satz, externer Link). */
export function ProviderGrid({ items }: { items: Provider[] }) {
  return (
    <div className="providers">
      {items.map((p, k) => (
        <motion.a
          key={p.name}
          className="prov glass"
          href={p.url}
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.7, delay: (k % 3) * 0.08, ease: EASE }}
          whileHover={{ y: -6 }}
        >
          <div className="prov-top">
            <Logo url={p.url} name={p.name} />
            <ArrowUpRight size={18} className="prov-arrow" />
          </div>
          <h3>
            {p.name}
            {p.tag && <span className="tag">{p.tag}</span>}
          </h3>
          <p>{p.text}</p>
          <span className="prov-host">{new URL(p.url).hostname.replace('www.', '')}</span>
        </motion.a>
      ))}
    </div>
  )
}

/** Kapitelkopf: kleine rote Zeile + große Aussage. */
export function SectionHead({ eyebrow, title, text }: { eyebrow: string; title: ReactNode; text?: ReactNode }) {
  return (
    <Reveal className="sec-head">
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      {text && <p className="sec-text">{text}</p>}
    </Reveal>
  )
}
