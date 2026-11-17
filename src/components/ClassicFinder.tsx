// Modell-Finder: ältere, besondere Autos nach Herkunft, Jahrzehnt und Oldtimer-Status filtern.
// Japan: Median der Angebotspreise (JDMBUYSELL, CC BY 4.0). Andere Länder: Links zu den Ergebnissen der Auktionshäuser.
import { ArrowUpRight, Calculator, Search } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { CLASSICS, ORIGINS, PRICE_SOURCE, type Classic, type Origin } from '../classics.ts'
import { FX_FALLBACK, MARKETS, ORIGIN, sendToCalc, type MarketQuery } from '../data.ts'
import { money } from '../lib/calc.ts'
import { useFx } from '../lib/fx.ts'

const YEAR = new Date().getFullYear()
const ERAS = [
  { id: 'all', label: 'Alle Jahre', test: () => true },
  { id: '60', label: '60er & 70er', test: (c: Classic) => c.from < 1980 },
  { id: '80', label: '80er', test: (c: Classic) => c.from >= 1980 && c.from < 1990 },
  { id: '90', label: '90er & 2000er', test: (c: Classic) => c.from >= 1990 },
]
type Sort = 'year' | 'price'

const usd = (v: number) => '$ ' + new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 }).format(v)

export function ClassicFinder({ onSearch }: { onSearch: (q: MarketQuery, origin: Origin) => void }) {
  const { rates } = useFx()
  const [origin, setOrigin] = useState<Origin | 'all'>('all')
  const [era, setEra] = useState('all')
  const [classic, setClassic] = useState(false)
  const [sort, setSort] = useState<Sort>('year')
  const eurPerUsd = (rates.EUR ?? FX_FALLBACK.EUR) / (rates.USD ?? FX_FALLBACK.USD)

  const list = useMemo(() => {
    const e = ERAS.find((x) => x.id === era)!
    const l = CLASSICS.filter((c) => (origin === 'all' || c.origin === origin) && e.test(c) && (!classic || c.from <= YEAR - 30))
    return [...l].sort((a, b) => (sort === 'price' ? (b.price?.jp ?? -1) - (a.price?.jp ?? -1) : a.from - b.from))
  }, [origin, era, classic, sort])

  return (
    <div className="cf">
      <div className="gcard cf-filters">
        <div className="mk-ideas">
          {[{ id: 'all' as const, label: 'Alle Länder' }, ...ORIGINS].map((o) => (
            <button key={o.id} className={'chip' + (origin === o.id ? ' on' : '')} onClick={() => setOrigin(o.id)}>
              {o.label}
            </button>
          ))}
        </div>
        <div className="mk-ideas">
          {ERAS.map((e) => (
            <button key={e.id} className={'chip' + (era === e.id ? ' on' : '')} onClick={() => setEra(e.id)}>
              {e.label}
            </button>
          ))}
        </div>
        <div className="cf-row">
          <label className="cf-toggle">
            <span className="switch">
              <input type="checkbox" checked={classic} onChange={(e) => setClassic(e.target.checked)} />
              <span />
            </span>
            Nur Oldtimer (30+ Jahre)
          </label>
          <div className="seg cf-sort">
            {(['year', 'price'] as const).map((s) => (
              <button key={s} className={sort === s ? 'on' : ''} onClick={() => setSort(s)}>
                {s === 'year' ? 'Nach Baujahr' : 'Nach Preis'}
              </button>
            ))}
          </div>
          <span className="muted small">{list.length} Modelle</span>
        </div>
      </div>

      <motion.div className="cf-grid" layout>
        <AnimatePresence mode="popLayout">
          {list.map((c) => {
            const market = MARKETS.find((m) => m.id === c.origin)
            const results = market?.portals[0]
            const oldOk = c.from <= YEAR - 30
            return (
              <motion.article key={c.id} layout className="gcard cf-card" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.3 }}>
                <header>
                  <span className="mk-code small-code">{market?.code}</span>
                  <span className="cf-kind">{c.kind}</span>
                  <span className={'cf-badge' + (oldOk ? ' ok' : '')}>{oldOk ? 'Oldtimer-fähig' : `Oldtimer ab ${c.from + 30}`}</span>
                </header>
                <h3>{c.name}</h3>
                <p className="muted small mono">
                  {c.chassis} · {c.from}–{c.to}
                </p>
                <p className="cf-why">{c.why}</p>
                {c.price ? (
                  <div className="cf-price">
                    <span>Typischer Angebotspreis in Japan (Median)</span>
                    <b>{usd(c.price.jp)}</b>
                    <small>
                      ≈ {money(c.price.jp * eurPerUsd, 'EUR')}
                      {c.price.out ? ` · außerhalb Japans ${usd(c.price.out)}` : ''}
                      {c.price.n ? ` · ${c.price.n} Inserate` : ''}
                    </small>
                    {c.price.note && <small>{c.price.note}</small>}
                  </div>
                ) : (
                  <div className="cf-price none">
                    <span>Preise</span>
                    <small>Keine frei lizenzierte Statistik. Die aktuellen Angebote und Ergebnisse siehst du direkt bei {results?.name}.</small>
                  </div>
                )}
                <div className="cf-actions">
                  <button className="btn small" onClick={() => onSearch(c.q, c.origin)}>
                    <Search size={14} /> Inserate suchen
                  </button>
                  <button
                    className="btn small red"
                    onClick={() =>
                      sendToCalc({
                        id: 'cf-' + c.id,
                        title: `${c.name} ${c.chassis}`,
                        url: '',
                        price: c.price ? c.price.jp : 0,
                        cur: c.price || c.origin === 'jp' ? 'USD' : ORIGIN[c.origin].cur,
                        market: c.price ? 'jp' : c.origin,
                        added: new Date().toISOString(),
                      })
                    }
                  >
                    <Calculator size={14} /> Durchrechnen
                  </button>
                  {!c.price && results && (
                    <a className="btn small" href={results.url(c.q)} target="_blank" rel="noopener noreferrer">
                      {results.name} <ArrowUpRight size={14} />
                    </a>
                  )}
                </div>
              </motion.article>
            )
          })}
        </AnimatePresence>
      </motion.div>
      <p className="disclaimer">
        Preise Japan: Median der Angebotspreise, nicht Verkaufspreise, von{' '}
        <a href={PRICE_SOURCE.url} target="_blank" rel="noopener noreferrer">
          {PRICE_SOURCE.name}
        </a>{' '}
        (Stand {PRICE_SOURCE.date}, Lizenz{' '}
        <a href={PRICE_SOURCE.licenceUrl} target="_blank" rel="noopener noreferrer">
          {PRICE_SOURCE.licence}
        </a>
        ). Oldtimer-fähig heißt: alt genug für die Einreihung als Sammlungsstück (0 % Zoll, 7 % EUSt), sofern im Originalzustand; die Entscheidung trifft der Zoll. „Durchrechnen“ ohne Preis öffnet den Rechner mit dem Herkunftsland; trag dort den Preis aus dem Inserat ein.
      </p>
    </div>
  )
}
