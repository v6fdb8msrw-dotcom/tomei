import { motion, useScroll, useTransform } from 'motion/react'
import { ArrowUpRight } from 'lucide-react'
import { useRef } from 'react'
import { DASAI_URL, PARTS } from '../data.ts'
import { useT } from '../i18n/i18n.ts'
import { EASE, ProviderGrid, SectionHead } from '../components/motion.tsx'

/** Das Mochi: kleines Display mit Augen, die blinzeln und umherschauen. */
function Mochi() {
  return (
    <div className="mochi">
      <div className="mochi-screen">
        <motion.div className="mochi-eyes" animate={{ x: [0, 14, 14, -14, -14, 0], y: [0, 0, -4, -4, 2, 0] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}>
          {[0, 1].map((k) => (
            <motion.span key={k} animate={{ scaleY: [1, 1, 0.1, 1, 1] }} transition={{ duration: 3.2, repeat: Infinity, times: [0, 0.85, 0.9, 0.95, 1] }} />
          ))}
        </motion.div>
        <motion.div className="mochi-mouth" animate={{ scaleX: [1, 1.3, 1] }} transition={{ duration: 2.4, repeat: Infinity }} />
      </div>
      <div className="mochi-mount" />
    </div>
  )
}

/** Teile-Shops und Dasai Mochi, eingebettet ins Build Studio */
export function PartsShops() {
  const { tx } = useT()
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'center center'] })
  const scale = useTransform(scrollYProgress, [0, 1], [0.6, 1])
  const rotate = useTransform(scrollYProgress, [0, 1], [-14, 0])
  const glow = useTransform(scrollYProgress, [0, 1], [0, 1])

  return (
    <>
      <section className="section">
        <SectionHead eyebrow="Shops" title={<>{tx('Teile direkt ', 'Parts straight ')}<em>{tx('aus Japan.', 'from Japan.')}</em></>} />
        <ProviderGrid items={PARTS} />
      </section>

      <section className="mochi-stage" ref={ref}>
        <motion.div className="mochi-glow" style={{ opacity: glow }} />
        <motion.div style={{ scale, rotate }}>
          <Mochi />
        </motion.div>
        <motion.div className="mochi-copy" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.9, ease: EASE }}>
          <p className="eyebrow">Dasai Mochi</p>
          <h2>{tx('Dein Auto bekommt ', 'Your car gets ')}<em>{tx('ein Gesicht.', 'a face.')}</em></h2>
          <p className="sec-text">{tx('Der kleine animierte Begleiter fürs Armaturenbrett reagiert auf Fahrt, Gas und Kurven.', 'The little animated dashboard companion reacts to driving, throttle and corners.')}</p>
          <motion.a className="btn red" href={DASAI_URL} target="_blank" rel="noopener noreferrer" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
            Shop the Mochi <ArrowUpRight size={18} />
          </motion.a>
        </motion.div>
      </section>
    </>
  )
}
