// Übersichtsseite einer Welt: großer Kopf mit Foto und Werkzeug-Kacheln (Text oben, Bild unten).
import { ArrowRight } from 'lucide-react'
import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { href } from '../lib/router.ts'
import { useT } from '../i18n/i18n.ts'
import { EASE, PageHead } from './ui.tsx'

export type Tool = { to: string; title: string; text: string; img: string; meta?: string }

export function WorldHub({ eyebrow, title, sub, image, tools, children }: { eyebrow: string; title: ReactNode; sub: string; image: string; tools: Tool[]; children?: ReactNode }) {
  const { tx } = useT()
  return (
    <>
      <PageHead eyebrow={eyebrow} title={title} sub={sub} image={image} />
      {children}
      <section className="section">
        <div className="tools">
          {tools.map((t, k) => (
            <motion.a
              key={t.to}
              href={href(t.to)}
              className="tool"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.7, delay: (k % 3) * 0.07, ease: EASE }}
            >
              <div className="tool-body">
                {t.meta && <span className="tool-meta">{t.meta}</span>}
                <h3>{t.title}</h3>
                <p>{t.text}</p>
                <span className="tool-go">
                  {tx('Öffnen', 'Open')} <ArrowRight size={15} />
                </span>
              </div>
              <div className="tool-img">
                <img src={t.img} alt="" loading="lazy" />
              </div>
            </motion.a>
          ))}
        </div>
      </section>
    </>
  )
}
