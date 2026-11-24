// Modell-Katalog mit Suche und Vorschlagsliste. Daten: src/data/models.json (aus Wikidata/Wikipedia, siehe
// DATA_SOURCES.md) plus die handverlesenen Klassiker mit Preisangabe aus classics.ts.
// Es gibt keine Live-Abfrage von Inseraten: „Inserate suchen“ öffnet die Portale der Herkunftsländer.
import { ArrowUpRight, Calculator, Check, Plus, Search, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { CLASSICS, PRICE_SOURCE } from '../classics.ts'
import { sendToCalc, type MarketQuery } from '../data.ts'
import { DIR_COUNTRY } from '../data/directory.ts'
import { useT } from '../i18n/i18n.ts'
import { addVehicle, useStore } from '../store/store.ts'
import { EASE } from './ui.tsx'
import { href } from '../lib/router.ts'

export type CarModel = {
  id: string
  /** Anzeigename, z. B. „Nissan Skyline GT-R (R34)“ */
  n: string
  /** Marke */
  mk: string
  /** Modell ohne Marke */
  md: string
  y0?: number
  y1?: number
  /** Herkunft (Land des Herstellers) */
  cc: string
  /** Klasse laut Wikipedia, z. B. „Sports car“ */
  cl?: string
  /** Wikipedia-Titel (Quelle) */
  wp?: string
  /** Wikidata-ID */
  q?: string
  /** Typischer Angebotspreis Japan (USD), nur bei handverlesenen Modellen mit Quelle */
  usd?: number
  why?: string
}

/** Fahrzeugklassen (aus der Wikipedia-Infobox zusammengefasst) */
export const CLASS_LABEL: Record<string, { de: string; en: string }> = {
  sports: { de: 'Sportwagen', en: 'Sports car' },
  gt: { de: 'Gran Turismo', en: 'Grand tourer' },
  hot: { de: 'Kompaktsportler', en: 'Hot hatch' },
  muscle: { de: 'Muscle-Car', en: 'Muscle car' },
  pony: { de: 'Pony-Car', en: 'Pony car' },
  lux: { de: 'Oberklasse', en: 'Luxury / executive' },
  large: { de: 'Große Limousine', en: 'Full-size car' },
  mid: { de: 'Mittelklasse', en: 'Mid-size car' },
  small: { de: 'Klein- und Kompaktwagen', en: 'Small and compact car' },
  suv: { de: 'SUV & Geländewagen', en: 'SUV & off-roader' },
  pickup: { de: 'Pickup', en: 'Pickup' },
  van: { de: 'Van', en: 'MPV' },
  kei: { de: 'Kei-Car', en: 'Kei car' },
}

const YEAR = new Date().getFullYear()
/** Herkunftsländer, für die der Importrechner rechnen kann */
const CALC_ORIGINS = new Set(['jp', 'us', 'uk', 'ca', 'au'])
const PAGE = 24

export const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim()

/** Handverlesene Klassiker in Katalog-Form */
function curated(): CarModel[] {
  return CLASSICS.map((c) => {
    const [mk, ...rest] = c.name.split(' ')
    const k = c.kind.toLowerCase()
    const cl = k.includes('muscle') ? 'muscle' : k.includes('gelände') ? 'suv' : k.includes('pickup') ? 'pickup' : k.includes('limousine') ? 'mid' : k.includes('rallye') ? 'hot' : 'sports'
    return { id: 'c-' + c.id, n: `${c.name} (${c.chassis})`, mk, md: rest.join(' '), y0: c.from, y1: c.to, cc: c.origin, cl, usd: c.price?.jp, why: c.why }
  })
}

export function score(m: CarModel, words: string[]): number {
  const hay = norm(`${m.n} ${m.mk} ${m.md} ${m.y0 ?? ''}`)
  let s = 0
  for (const w of words) {
    if (!hay.includes(w)) return -1
    s += hay.startsWith(w) || hay.includes(' ' + w) ? 3 : 1
  }
  return s + (m.usd ? 1 : 0)
}

let cache: Promise<CarModel[]> | null = null
/** Katalog laden (einmal je Sitzung): handverlesene Klassiker plus Wikidata/Wikipedia-Modelle */
export function loadCatalogue(): Promise<CarModel[]> {
  cache ??= import('../data/models.json').then((m) => {
    const cur = curated()
    const names = new Set(cur.map((c) => norm(c.n)))
    return [...cur, ...(m.default as CarModel[]).filter((b) => !names.has(norm(b.n)))]
  })
  return cache
}

/** Beste Treffer für eine Eingabe */
export function suggest(all: CarModel[], text: string, n = 8): CarModel[] {
  const words = norm(text).split(' ').filter(Boolean)
  if (!words.length) return []
  return all
    .map((m) => ({ m, s: score(m, words) }))
    .filter((x) => x.s >= 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, n)
    .map((x) => x.m)
}

export function ModelFinder({ onSearch }: { onSearch: (q: MarketQuery, origin: string) => void }) {
  const { tx, L, d } = useT()
  const [all, setAll] = useState<CarModel[] | null>(null)
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [hi, setHi] = useState(0)
  const [cc, setCc] = useState('all')
  const [era, setEra] = useState('all')
  const [classic, setClassic] = useState(false)
  const [cls, setCls] = useState('all')
  const [shown, setShown] = useState(PAGE)
  const vehicles = useStore((s) => s.vehicles)
  const box = useRef<HTMLDivElement>(null)

  // Katalog erst laden, wenn der Finder sichtbar wird (eigene Datei, ~100 KB)
  useEffect(() => {
    let alive = true
    loadCatalogue().then((c) => alive && setAll(c))
    return () => {
      alive = false
    }
  }, [])

  const words = useMemo(() => norm(q).split(' ').filter(Boolean), [q])
  const eras: { id: string; de: string; en: string; test: (m: CarModel) => boolean }[] = [
    { id: 'all', de: 'Alle Jahre', en: 'All years', test: () => true },
    { id: '50', de: 'bis 1969', en: 'until 1969', test: (m) => (m.y0 ?? 9999) < 1970 },
    { id: '70', de: '70er', en: '70s', test: (m) => (m.y0 ?? 0) >= 1970 && (m.y0 ?? 0) < 1980 },
    { id: '80', de: '80er', en: '80s', test: (m) => (m.y0 ?? 0) >= 1980 && (m.y0 ?? 0) < 1990 },
    { id: '90', de: '90er', en: '90s', test: (m) => (m.y0 ?? 0) >= 1990 && (m.y0 ?? 0) < 2000 },
    { id: '00', de: 'ab 2000', en: 'from 2000', test: (m) => (m.y0 ?? 0) >= 2000 },
  ]
  const list = useMemo(() => {
    if (!all) return []
    const e = eras.find((x) => x.id === era)!
    const filtered = all.filter((m) => (cc === 'all' || m.cc === cc) && (cls === 'all' || m.cl === cls) && e.test(m) && (!classic || (m.y0 ?? 9999) <= YEAR - 30))
    if (!words.length) return filtered
    return filtered
      .map((m) => ({ m, s: score(m, words) }))
      .filter((x) => x.s >= 0)
      .sort((a, b) => b.s - a.s)
      .map((x) => x.m)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all, words, cc, era, classic, cls])
  const suggestions = words.length ? list.slice(0, 8) : []
  const countries = useMemo(() => [...new Set((all ?? []).map((m) => m.cc))].filter((c) => DIR_COUNTRY[c]), [all])

  useEffect(() => setShown(PAGE), [q, cc, era, classic, cls])
  useEffect(() => {
    const close = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false)
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const pick = (m: CarModel) => {
    setQ(m.n.replace(/\s*\(.*\)$/, ''))
    setOpen(false)
  }
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!suggestions.length) return
    if (e.key === 'ArrowDown') (e.preventDefault(), setOpen(true), setHi((h) => Math.min(h + 1, suggestions.length - 1)))
    if (e.key === 'ArrowUp') (e.preventDefault(), setHi((h) => Math.max(h - 1, 0)))
    if (e.key === 'Enter' && open) (e.preventDefault(), pick(suggestions[hi]))
    if (e.key === 'Escape') setOpen(false)
  }
  const years = (m: CarModel) => (m.y0 ? `${m.y0}${m.y1 && m.y1 !== m.y0 ? '–' + m.y1 : m.y1 ? '' : '–'}` : '')
  const inGarage = (m: CarModel) => vehicles.find((v) => norm(`${v.make} ${v.model}`) === norm(`${m.mk} ${m.md}`))

  return (
    <div className="mf">
      <div className="gcard mf-filters">
        <div className="mf-search" ref={box}>
          <Search size={18} />
          <input
            value={q}
            onChange={(e) => (setQ(e.target.value), setOpen(true), setHi(0))}
            onFocus={() => setOpen(true)}
            onKeyDown={onKey}
            placeholder={all ? tx(`${all.length} Modelle durchsuchen, z. B. Porsche 911, Skyline, Mustang`, `Search ${all.length} models, e.g. Porsche 911, Skyline, Mustang`) : tx('Katalog wird geladen …', 'Loading catalogue …')}
            aria-label={tx('Modell suchen', 'Search model')}
            role="combobox"
            aria-expanded={open && suggestions.length > 0}
            aria-controls="mf-suggest"
            autoComplete="off"
          />
          {q && (
            <button className="icon-btn" onClick={() => setQ('')} aria-label={tx('Leeren', 'Clear')}>
              <X size={15} />
            </button>
          )}
          <AnimatePresence>
            {open && suggestions.length > 0 && (
              <motion.ul id="mf-suggest" role="listbox" className="mf-suggest" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
                {suggestions.map((m, i) => (
                  <li key={m.id} role="option" aria-selected={i === hi} className={i === hi ? 'on' : ''} onMouseEnter={() => setHi(i)} onMouseDown={(e) => (e.preventDefault(), pick(m))}>
                    <span className="mf-flag">{DIR_COUNTRY[m.cc]?.flag ?? '🌍'}</span>
                    <b>{m.n}</b>
                    <small>{years(m)}</small>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
        <div className="mk-ideas">
          <button className={'chip' + (cc === 'all' ? ' on' : '')} onClick={() => setCc('all')}>
            {tx('Alle Länder', 'All countries')}
          </button>
          {countries.map((c) => (
            <button key={c} className={'chip' + (cc === c ? ' on' : '')} onClick={() => setCc(c)}>
              {DIR_COUNTRY[c].flag} {L(DIR_COUNTRY[c].name)}
            </button>
          ))}
        </div>
        <div className="mk-ideas">
          <button className={'chip' + (cls === 'all' ? ' on' : '')} onClick={() => setCls('all')}>
            {tx('Alle Klassen', 'All classes')}
          </button>
          {Object.entries(CLASS_LABEL).map(([k, v]) => (
            <button key={k} className={'chip' + (cls === k ? ' on' : '')} onClick={() => setCls(cls === k ? 'all' : k)}>
              {L(v)}
            </button>
          ))}
        </div>
        <div className="mk-ideas">
          {eras.map((e) => (
            <button key={e.id} className={'chip' + (era === e.id ? ' on' : '')} onClick={() => setEra(e.id)}>
              {L(e)}
            </button>
          ))}
          <label className="cf-toggle">
            <span className="switch">
              <input type="checkbox" checked={classic} onChange={(e) => setClassic(e.target.checked)} />
              <span />
            </span>
            {tx('Nur Oldtimer (30+ Jahre)', 'Classics only (30+ years)')}
          </label>
          <span className="muted small">{all ? tx(`${list.length} Modelle`, `${list.length} models`) : ''}</span>
        </div>
      </div>

      <div className="mf-grid">
        {list.slice(0, shown).map((m, k) => {
          const have = inGarage(m)
          const oldOk = (m.y0 ?? 9999) <= YEAR - 30
          return (
            <motion.article key={m.id} className="gcard mf-card" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: (k % PAGE) * 0.012, ease: EASE }}>
              <header>
                <span className="mf-flag">{DIR_COUNTRY[m.cc]?.flag ?? '🌍'}</span>
                <span className="cf-kind">{m.cl && CLASS_LABEL[m.cl] ? L(CLASS_LABEL[m.cl]) : m.cl ? d(m.cl) : m.mk}</span>
                {m.y0 && <span className={'cf-badge' + (oldOk ? ' ok' : '')}>{oldOk ? tx('Oldtimer-fähig', 'Classic-eligible') : tx(`Oldtimer ab ${m.y0 + 30}`, `Classic from ${m.y0 + 30}`)}</span>}
              </header>
              <h3>
                <a href={href('discover/models/' + m.id)}>{m.n}</a>
              </h3>
              <p className="muted small mono">{years(m) || tx('Bauzeit siehe Quelle', 'Years: see source')}</p>
              {m.why && <p className="cf-why">{d(m.why)}</p>}
              {m.usd ? (
                <p className="mf-price">
                  <b className="mono">$ {m.usd.toLocaleString('de-DE')}</b> <small>{tx(`Median Angebotspreis Japan (${PRICE_SOURCE.name})`, `Median asking price Japan (${PRICE_SOURCE.name})`)}</small>
                </p>
              ) : null}
              <div className="cf-actions">
                <button className="btn small" onClick={() => onSearch({ make: m.mk, model: m.md.replace(/\s*\(.*\)$/, '') }, m.cc)}>
                  <Search size={14} /> {tx('Inserate suchen', 'Search listings')}
                </button>
                {CALC_ORIGINS.has(m.cc) && (
                  <button className="btn small" onClick={() => sendToCalc({ id: 'mf-' + m.id, title: m.n, url: '', price: m.usd ?? 0, cur: 'USD', market: m.usd ? 'jp' : m.cc, added: new Date().toISOString() })}>
                    <Calculator size={14} /> {tx('Durchrechnen', 'Calculate')}
                  </button>
                )}
                {have ? (
                  <span className="btn small ghost">
                    <Check size={14} /> {tx('In der Garage', 'In garage')}
                  </span>
                ) : (
                  <button className="btn small" onClick={() => addVehicle({ make: m.mk, model: m.md, year: m.y0, status: 'dream', market: m.cc, modelId: m.id, source: 'finder' })}>
                    <Plus size={14} /> {tx('Merken', 'Save')}
                  </button>
                )}
                {m.wp && (
                  <a className="icon-btn" href={`https://en.wikipedia.org/wiki/${m.wp}`} target="_blank" rel="noopener noreferrer" aria-label={tx('Quelle: Wikipedia', 'Source: Wikipedia')} title={tx('Quelle: Wikipedia', 'Source: Wikipedia')}>
                    <ArrowUpRight size={15} />
                  </a>
                )}
              </div>
            </motion.article>
          )
        })}
      </div>
      {list.length > shown && (
        <div className="row center">
          <button className="btn" onClick={() => setShown((s) => s + PAGE * 2)}>
            {tx(`Mehr zeigen (${list.length - shown} weitere)`, `Show more (${list.length - shown} more)`)}
          </button>
        </div>
      )}
      <p className="disclaimer">
        {tx(
          'Modelle, Bauzeiten und Klassen aus Wikidata (CC0) und der englischen Wikipedia; Preise nur bei handverlesenen Modellen mit freier Quelle. „Inserate suchen“ öffnet die öffentlichen Suchseiten im Herkunftsland – ob das Modell gerade angeboten wird, zeigt erst das Portal.',
          'Models, production years and classes from Wikidata (CC0) and English Wikipedia; prices only for hand-picked models with a free source. “Search listings” opens the public search pages in the country of origin – whether the model is currently offered only the marketplace can show.',
        )}
      </p>
    </div>
  )
}
