import { Calculator, Car, MapPin, Wrench } from 'lucide-react'
import { AnimatePresence, motion, useScroll, useSpring } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { CONTACT_URL, INSTAGRAM_URL, TABS, type Tab } from './data.ts'
import { EASE } from './components/motion.tsx'
import { Import } from './pages/Import.tsx'
import { Parts } from './pages/Parts.tsx'
import { Rent } from './pages/Rent.tsx'
import { Spots } from './pages/Spots.tsx'

// Adresse: #/reiter oder #/reiter/abschnitt (z. B. #/import/rechner)
function readHash(): { tab: Tab; anchor?: string } {
  const [t, anchor] = location.hash.replace(/^#\/?/, '').split('/')
  const tab = (TABS.some((x) => x.id === t) ? t : 'spots') as Tab
  return { tab, anchor }
}

const ICONS = { spots: MapPin, rent: Car, import: Calculator, parts: Wrench }

export default function App() {
  const [route, setRoute] = useState(readHash)
  const { scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 24 })

  useEffect(() => {
    const on = () => setRoute(readHash())
    addEventListener('hashchange', on)
    return () => removeEventListener('hashchange', on)
  }, [])

  // Abschnitt anspringen. Beim Reiterwechsel erst, wenn die alte Seite ausgeblendet ist (onExitComplete),
  // sonst stellt der Browser die alte Scrollposition wieder her.
  const lastTab = useRef(route.tab)
  const toAnchor = (anchor?: string) => {
    if (anchor) setTimeout(() => document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth' }), 350)
  }
  useEffect(() => {
    if (route.tab === lastTab.current) toAnchor(route.anchor)
    lastTab.current = route.tab
  }, [route])
  const onExitComplete = () => {
    scrollTo({ top: 0, behavior: 'instant' })
    toAnchor(readHash().anchor)
  }

  const go = (tab: Tab) => {
    location.hash = '/' + tab
  }

  const Page = { spots: () => <Spots go={go} />, rent: Rent, import: Import, parts: Parts }[route.tab]

  return (
    <>
      <header className="nav glass">
        <a className="brand" href="#/spots">
          TŌMEI<i />
        </a>
        <nav className="tabs">
          {TABS.map((t) => (
            <a key={t.id} href={'#/' + t.id} className={t.id === route.tab ? 'on' : ''} title={t.long}>
              {t.id === route.tab && <motion.span layoutId="tab-pill" className="tab-pill" transition={{ type: 'spring', stiffness: 380, damping: 32 }} />}
              <span>{t.label}</span>
            </a>
          ))}
        </nav>
        <motion.div className="progress" style={{ scaleX: progress }} />
      </header>

      <AnimatePresence mode="wait" onExitComplete={onExitComplete}>
        <motion.main key={route.tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.4, ease: EASE }}>
          <Page />
        </motion.main>
      </AnimatePresence>

      <footer className="footer" id="about">
        <a className="brand" href="#/spots">
          TŌMEI<i />
        </a>
        <p className="muted small">„Tōmei“ (透明) heißt durchsichtig. Spots, Vermietung, Import und Teile an einem Ort.</p>
        <nav>
          <a href="#/import/rechner">Kostenrechner</a>
          {CONTACT_URL ? <a href={CONTACT_URL}>Kontakt</a> : <span className="muted">Kontakt folgt</span>}
          {INSTAGRAM_URL ? (
            <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
              Instagram
            </a>
          ) : (
            <span className="muted">Instagram folgt</span>
          )}
        </nav>
        <p className="muted small">© {new Date().getFullYear()} TŌMEI · Nicht verbunden mit den genannten Herstellern oder Shops · Fotos: Unsplash</p>
      </footer>

      <nav className="bottom-tabs glass">
        {TABS.map((t) => {
          const I = ICONS[t.id]
          return (
            <a key={t.id} href={'#/' + t.id} className={t.id === route.tab ? 'on' : ''}>
              <I size={20} />
              <span>{t.label}</span>
            </a>
          )
        })}
      </nav>
    </>
  )
}
