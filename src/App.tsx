import { Compass, Car, Globe2, House, Languages, Warehouse } from 'lucide-react'
import { MotionConfig, motion, useScroll, useSpring } from 'motion/react'
import { lazy, Suspense, useEffect, type ReactNode } from 'react'
import { BRAND } from './config/brand.ts'
import { useHtmlLang, useT } from './i18n/i18n.ts'
import { href, useAnchor, useRoute } from './lib/router.ts'
import { useStore } from './store/store.ts'
import { ErrorBoundary, NotFound, SubNav, type SubItem } from './components/ui.tsx'
import { Home } from './pages/Home.tsx'

// Alles außer der Startseite erst bei Bedarf laden (kleineres Hauptbündel)
const named = <K extends string>(load: () => Promise<Record<K, unknown>>, key: K) =>
  lazy(() => load().then((m) => ({ default: m[key] as React.ComponentType<Record<string, unknown>> })))
const discover = () => import('./pages/discover/Discover.tsx')
const drive = () => import('./pages/drive/Drive.tsx')
const own = () => import('./pages/own/Own.tsx')
const Import = named(() => import('./pages/Import.tsx'), 'Import')
const Markets = named(() => import('./pages/Markets.tsx'), 'Markets')
const Service = named(() => import('./pages/Service.tsx'), 'Service')
const Rent = named(() => import('./pages/Rent.tsx'), 'Rent')
const DataPage = named(() => import('./pages/DataPage.tsx'), 'DataPage')
const Legal = named(() => import('./pages/Legal.tsx'), 'Legal')
const PartsPage = named(() => import('./pages/Parts.tsx'), 'PartsPage')
const ModelPage = named(() => import('./pages/discover/ModelPage.tsx'), 'ModelPage')
const RulesPage = named(() => import('./pages/discover/Rules.tsx'), 'RulesPage')
const DiscoverHub = named(discover, 'DiscoverHub')
const Auctions = named(discover, 'Auctions')
const Partners = named(discover, 'Partners')
const Journey = named(discover, 'Journey')
const DriveHub = named(drive, 'DriveHub')
const RoadsExplorer = named(drive, 'RoadsExplorer')
const RoadDetail = named(drive, 'RoadDetail')
const Atlas = named(drive, 'Atlas')
const OwnHub = named(own, 'OwnHub')
const Garage = named(own, 'Garage')
const Builder = lazy(() => import('./pages/drive/Builder.tsx'))
const Simulator = lazy(() => import('./pages/own/Simulator.tsx'))
const BuildStudio = lazy(() => import('./pages/own/BuildStudio.tsx'))
const Maintenance = lazy(() => import('./pages/own/Maintenance.tsx'))
const Passport = lazy(() => import('./pages/own/Passport.tsx'))

type World = 'discover' | 'drive' | 'own'

function useSub(world: World): SubItem[] {
  const { lang } = useT()
  const en = lang === 'en'
  if (world === 'discover')
    return [
      { to: 'discover', label: en ? 'Overview' : 'Übersicht' },
      { to: 'discover/search', label: en ? 'Vehicle search' : 'Fahrzeugsuche' },
      { to: 'discover/auctions', label: en ? 'Auction houses' : 'Auktionshäuser' },
      { to: 'discover/partners', label: en ? 'Import partners' : 'Import-Partner' },
      { to: 'discover/calculator', label: en ? 'Calculator' : 'Importrechner' },
      { to: 'discover/journey', label: 'Import-Journey' },
      { to: 'discover/rules', label: en ? 'Import rules' : 'Importregeln' },
      { to: 'discover/service', label: 'Service' },
    ]
  if (world === 'drive')
    return [
      { to: 'drive', label: en ? 'Overview' : 'Übersicht' },
      { to: 'drive/roads', label: 'Roads' },
      { to: 'drive/builder', label: 'Roadtrip-Builder' },
      { to: 'drive/atlas', label: 'Automotive Atlas' },
      { to: 'drive/rent', label: en ? 'Rent' : 'Mieten' },
    ]
  return [
    { to: 'own', label: en ? 'Overview' : 'Übersicht' },
    { to: 'own/garage', label: 'Garage' },
    { to: 'own/simulator', label: en ? 'Ownership' : 'Unterhalt' },
    { to: 'own/build', label: 'Build Studio' },
    { to: 'own/parts', label: en ? 'Parts' : 'Teile' },
    { to: 'own/maintenance', label: en ? 'Maintenance' : 'Wartung' },
    { to: 'own/passport', label: 'Passport' },
  ]
}

function Page({ path }: { path: string[] }): ReactNode {
  const [w, sub, id] = path
  if (!w) return <Home />
  if (w === 'data' && !sub) return <DataPage />
  if ((w === 'privacy' || w === 'imprint') && !sub) return <Legal kind={w} />
  if (w === 'discover') {
    if (!sub) return <DiscoverHub />
    if (sub === 'search') return <Markets />
    if (sub === 'auctions') return <Auctions />
    if (sub === 'partners') return <Partners />
    if (sub === 'calculator') return <Import />
    if (sub === 'journey') return <Journey vehicleId={id} />
    if (sub === 'models' && id) return <ModelPage id={id} />
    if (sub === 'rules') return <RulesPage id={id} />
    if (sub === 'service') return <Service />
  }
  if (w === 'drive') {
    if (!sub) return <DriveHub />
    if (sub === 'roads') return id ? <RoadDetail id={id} /> : <RoadsExplorer />
    if (sub === 'builder') return <Builder tripId={id} />
    if (sub === 'atlas') return <Atlas countryId={id} />
    if (sub === 'rent') return <Rent />
  }
  if (w === 'own') {
    if (!sub) return <OwnHub />
    if (sub === 'garage') return <Garage vehicleId={id} />
    if (sub === 'simulator') return <Simulator vehicleId={id} />
    if (sub === 'build') return <BuildStudio vehicleId={id} />
    if (sub === 'parts') return <PartsPage />
    if (sub === 'maintenance') return <Maintenance vehicleId={id} />
    if (sub === 'passport') return <Passport vehicleId={id} />
  }
  return <NotFound />
}

/** Abschnitt, der als Anker gemeint ist (z. B. #/discover/calculator/rechner) */
function anchorOf(path: string[]): string | undefined {
  const [w, sub, third] = path
  if (w === 'discover' && (sub === 'calculator' || sub === 'service' || sub === 'search')) return third
  return undefined
}

export default function App() {
  useHtmlLang()
  const route = useRoute()
  const { t, lang, setLang } = useT()
  const count = useStore((s) => s.vehicles.length)
  const world = (['discover', 'drive', 'own'].includes(route.path[0]) ? route.path[0] : null) as World | null
  const subItems = useSub(world ?? 'discover')
  const activeSub = world ? (route.path[1] ? `${world}/${route.path[1]}` : world) : ''
  const { scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 24 })
  useAnchor(anchorOf(route.path))

  useEffect(() => {
    const names: Record<string, string> = { discover: 'Discover', drive: 'Drive', own: 'Own', data: t('nav.data'), privacy: lang === 'en' ? 'Privacy' : 'Datenschutz', imprint: lang === 'en' ? 'Imprint' : 'Impressum' }
    document.title = route.path[0] ? `${names[route.path[0]] ?? '404'} · ${BRAND.name}` : `${BRAND.name} · ${BRAND.claim}`
  }, [route.path, t, lang])

  const top = [
    { id: 'discover', label: t('nav.discover'), icon: Compass },
    { id: 'drive', label: t('nav.drive'), icon: Globe2 },
    { id: 'own', label: t('nav.own'), icon: Car },
  ]

  return (
    <MotionConfig reducedMotion="user">
      <a className="skip" href="#main" onClick={(e) => (e.preventDefault(), document.getElementById('main')?.focus())}>
        {lang === 'en' ? 'Skip to content' : 'Zum Inhalt'}
      </a>
      <header className="nav">
        <a className="brand" href="#/" aria-label={BRAND.name + ' Start'}>
          {BRAND.name}
          <i />
        </a>
        <nav className="tabs" aria-label="Welten">
          {top.map((x) => (
            <a key={x.id} href={href(x.id)} className={world === x.id ? 'on' : ''} aria-current={world === x.id ? 'page' : undefined}>
              {world === x.id && <motion.span layoutId="tab-pill" className="tab-pill" transition={{ type: 'spring', stiffness: 380, damping: 32 }} />}
              <span>{x.label}</span>
            </a>
          ))}
        </nav>
        <div className="nav-tools">
          <button className="nav-lang" onClick={() => setLang(lang === 'de' ? 'en' : 'de')} title={t('nav.lang')} aria-label={t('nav.lang')}>
            <Languages size={16} /> {lang === 'de' ? 'EN' : 'DE'}
          </button>
          <a className="nav-garage" href="#/own/garage" title={t('nav.garage')}>
            <Warehouse size={17} />
            <span>{t('nav.garage')}</span>
            {count > 0 && <b>{count}</b>}
          </a>
        </div>
        <motion.div className="progress" style={{ scaleX: progress }} />
      </header>

      {world && <SubNav items={subItems} active={activeSub} />}

      <main id="main" tabIndex={-1} className={'page w-' + (world ?? (route.path[0] ? 'other' : 'home'))}>
        <ErrorBoundary resetKey={route.raw}>
          <Suspense fallback={<div className="page-loading" aria-busy="true" />}>
            <Page path={route.path} />
          </Suspense>
        </ErrorBoundary>
      </main>

      <footer className="footer">
        <div className="footer-top">
          <a className="brand" href="#/">
            {BRAND.name}
            <i />
          </a>
          <p className="muted small">{BRAND.meaning[lang]}</p>
        </div>
        <div className="footer-cols">
          <nav>
            <b>Discover</b>
            <a href="#/discover/search">{lang === 'en' ? 'Vehicle search' : 'Fahrzeugsuche'}</a>
            <a href="#/discover/auctions">{lang === 'en' ? 'Auction houses' : 'Auktionshäuser'}</a>
            <a href="#/discover/partners">{lang === 'en' ? 'Import partners' : 'Import-Partner'}</a>
            <a href="#/discover/calculator">{lang === 'en' ? 'Import calculator' : 'Importrechner'}</a>
          </nav>
          <nav>
            <b>Drive</b>
            <a href="#/drive/roads">Roads</a>
            <a href="#/drive/builder">Roadtrip-Builder</a>
            <a href="#/drive/atlas">Automotive Atlas</a>
            <a href="#/drive/rent">{lang === 'en' ? 'Rent' : 'Mieten'}</a>
          </nav>
          <nav>
            <b>Own</b>
            <a href="#/own/garage">Garage</a>
            <a href="#/own/simulator">{lang === 'en' ? 'Ownership simulator' : 'Unterhalt'}</a>
            <a href="#/own/parts">{lang === 'en' ? 'Parts shops' : 'Teile-Shops'}</a>
            <a href="#/own/maintenance">{lang === 'en' ? 'Maintenance' : 'Wartung'}</a>
            <a href="#/own/passport">Passport</a>
          </nav>
          <nav>
            <b>{BRAND.name}</b>
            <a href="#/data">{t('nav.data')}</a>
            <a href="#/privacy">{lang === 'en' ? 'Privacy' : 'Datenschutz'}</a>
            <a href="#/imprint">{lang === 'en' ? 'Imprint' : 'Impressum'}</a>
            <a href={BRAND.repo + '/blob/main/DATA_SOURCES.md'} target="_blank" rel="noopener noreferrer">
              {t('footer.sources')}
            </a>
            <button className="link-btn" onClick={() => setLang(lang === 'de' ? 'en' : 'de')}>
              {t('nav.lang')}
            </button>
          </nav>
        </div>
        <p className="muted small">{t('footer.data')}</p>
        <p className="muted small">
          © {new Date().getFullYear()} {BRAND.name} · {t('footer.disclaimer')}
        </p>
      </footer>

      <nav className="bottom-tabs" aria-label="Navigation">
        <a href="#/" className={!route.path[0] ? 'on' : ''}>
          <House size={20} />
          <span>{t('nav.home')}</span>
        </a>
        {top.map((x) => (
          <a key={x.id} href={href(x.id)} className={world === x.id ? 'on' : ''}>
            <x.icon size={20} />
            <span>{x.label}</span>
          </a>
        ))}
        <a href="#/own/garage" className={activeSub === 'own/garage' ? 'on' : ''}>
          <Warehouse size={20} />
          <span>{t('nav.garage')}</span>
        </a>
      </nav>
    </MotionConfig>
  )
}
