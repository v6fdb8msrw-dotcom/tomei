// 3D-Elemente nur mit CSS-Perspektive und motion (keine zusätzliche Bibliothek, keine Lizenzfragen).
// CarStack: schwebender Stapel aus Autokarten, folgt der Maus.  RouteMap: gekippte Karte Asiens → Europa mit Routen.
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react'
import { useEffect, type ReactNode } from 'react'
import type { Market } from '../data.ts'

const img = (name: string) => `${import.meta.env.BASE_URL}images/${name}.jpg`

/** Maus-Position im Fenster als −1 … 1 (weich gefedert) */
function usePointer() {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const reduce = useReducedMotion()
  useEffect(() => {
    if (reduce) return
    const on = (e: PointerEvent) => {
      x.set((e.clientX / innerWidth) * 2 - 1)
      y.set((e.clientY / innerHeight) * 2 - 1)
    }
    addEventListener('pointermove', on)
    return () => removeEventListener('pointermove', on)
  }, [reduce, x, y])
  return { x: useSpring(x, { stiffness: 60, damping: 18 }), y: useSpring(y, { stiffness: 60, damping: 18 }) }
}

const CARS = [
  { src: img('cars/r34'), label: 'Skyline GT-R R34', sub: 'Japan · USS' },
  { src: img('cars/fd'), label: 'RX-7 FD', sub: 'Japan · TAA' },
  { src: img('cars/s15'), label: 'Silvia S15', sub: 'Japan · HAA Kobe' },
]

/** Drei Autokarten hintereinander im Raum, leicht gedreht, schwebend; die Maus kippt den Stapel. */
export function CarStack({ cards = CARS }: { cards?: { src: string; label: string; sub: string }[] }) {
  const p = usePointer()
  const rotY = useTransform(p.x, (v) => -22 + v * 10)
  const rotX = useTransform(p.y, (v) => 8 - v * 6)
  return (
    <div className="carstack" aria-hidden>
      <motion.div className="carstack-inner" style={{ rotateY: rotY, rotateX: rotX }}>
        {cards.map((c, i) => (
          <motion.figure
            key={c.label}
            className="carstack-card"
            style={{ zIndex: cards.length - i }}
            initial={{ opacity: 0, z: -200 }}
            animate={{ opacity: 1, z: -i * 90, x: i * 34, y: [-i * 18, -i * 18 - 8, -i * 18] }}
            transition={{ opacity: { duration: 0.8, delay: 0.2 + i * 0.12 }, z: { duration: 1, delay: 0.2 + i * 0.12, ease: [0.22, 1, 0.36, 1] }, x: { duration: 1, delay: 0.2 + i * 0.12 }, y: { duration: 6 + i, repeat: Infinity, ease: 'easeInOut' } }}
          >
            <img src={c.src} alt="" />
            <figcaption>
              <b>{c.label}</b>
              <span>{c.sub}</span>
            </figcaption>
          </motion.figure>
        ))}
      </motion.div>
    </div>
  )
}

/** Gekippte Karte: Märkte als leuchtende Punkte, Routen fließen nach Bremerhaven (links). Schematisch, nicht maßstäblich. */
export function RouteMap({ markets, active, onPick }: { markets: Market[]; active?: string; onPick?: (id: string) => void }) {
  const p = usePointer()
  const rotZ = useTransform(p.x, (v) => -4 + v * 3)
  const rotX = useTransform(p.y, (v) => 52 - v * 4)
  const de = { x: 6, y: 22 }
  return (
    <div className="routemap">
      <motion.div className="routemap-plane" style={{ rotateX: rotX, rotateZ: rotZ }}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="routemap-svg">
          <defs>
            <linearGradient id="route" x1="1" x2="0">
              <stop offset="0" stopColor="#8fd0ff" stopOpacity="0.9" />
              <stop offset="1" stopColor="#8fd0ff" stopOpacity="0.15" />
            </linearGradient>
          </defs>
          {/* Raster */}
          {Array.from({ length: 11 }, (_, i) => (
            <g key={i} opacity={0.08}>
              <line x1={i * 10} y1="0" x2={i * 10} y2="100" stroke="#fff" strokeWidth="0.15" />
              <line x1="0" y1={i * 10} x2="100" y2={i * 10} stroke="#fff" strokeWidth="0.15" />
            </g>
          ))}
          {markets.map((m, i) => {
            const mx = (m.x + de.x) / 2
            const d = `M ${m.x} ${m.y} Q ${mx} ${Math.min(m.y, de.y) - 18} ${de.x} ${de.y}`
            return (
              <g key={m.id}>
                <path d={d} fill="none" stroke="url(#route)" strokeWidth={active === m.id ? 0.7 : 0.35} opacity={active && active !== m.id ? 0.25 : 1} />
                <motion.path d={d} fill="none" stroke="#fff" strokeWidth="0.5" strokeLinecap="round" strokeDasharray="2 98" initial={{ strokeDashoffset: 0 }} animate={{ strokeDashoffset: -100 }} transition={{ duration: 5 + i * 0.6, repeat: Infinity, ease: 'linear', delay: i * 0.4 }} pathLength={100} opacity={active && active !== m.id ? 0.2 : 0.8} />
              </g>
            )
          })}
          <circle cx={de.x} cy={de.y} r="1.6" fill="#fff" />
        </svg>
        <span className="routemap-label home" style={{ left: `${de.x}%`, top: `${de.y}%` }}>
          Bremerhaven
        </span>
        {markets.map((m) => (
          <button key={m.id} className={'routemap-node' + (active === m.id ? ' on' : '')} style={{ left: `${m.x}%`, top: `${m.y}%` }} onClick={() => onPick?.(m.id)} title={m.country}>
            <i />
            <span>{m.code}</span>
          </button>
        ))}
      </motion.div>
    </div>
  )
}

/** Glaskarte mit Lichtkante oben (Apple-Stil) */
export function GlassCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={'gcard ' + className}>{children}</div>
}
