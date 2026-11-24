// Märkte: eine Suche für Asien, Amerika, Großbritannien und Australien, dazu der Modell-Finder für ältere Autos. TŌMEI öffnet die öffentlichen Ergebnisseiten der Portale je Land
// (kein Auslesen fremder Inserate). Auktionshäuser sind nur für Händler zugänglich → Weg über Agent oder TŌMEI Service.
import { ArrowUpRight, Gavel, Search, ShieldCheck } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { AUCTIONS, MARKETS, type MarketQuery } from '../data.ts'
import { Reveal, SectionHead } from '../components/motion.tsx'
import { CarStack } from '../components/depth.tsx'
import { BREMERHAVEN, importRoutes } from '../components/Globe.tsx'
import { COUNTRIES } from '../data/countries.ts'
import { lazy, Suspense } from 'react'

const Globe3D = lazy(() => import('../components/Globe3D.tsx'))
import { Finds } from '../components/Finds.tsx'
import { useT } from '../i18n/i18n.ts'
import { BRAND } from '../config/brand.ts'
import { ModelFinder } from '../components/ModelFinder.tsx'

const MAKES = ['Toyota', 'Nissan', 'Honda', 'Mazda', 'Subaru', 'Mitsubishi', 'Lexus', 'Suzuki', 'Ford', 'Chevrolet', 'Dodge', 'Pontiac', 'Jeep', 'Holden', 'TVR', 'Lotus', 'Jaguar', 'Hyundai', 'Kia']
const IDEAS: MarketQuery[] = [
  { make: 'Toyota', model: 'Supra' },
  { make: 'Nissan', model: 'Skyline' },
  { make: 'Mazda', model: 'RX-7' },
  { make: 'Nissan', model: 'Silvia' },
  { make: 'Ford', model: 'Bronco' },
  { make: 'Chevrolet', model: 'Corvette' },
  { make: 'Holden', model: 'Monaro' },
]
const KEY = 'tomei.markets.q'

function load(): MarketQuery {
  try {
    return { make: 'Toyota', model: 'Supra', ...JSON.parse(localStorage.getItem(KEY) || '{}') }
  } catch {
    return { make: 'Toyota', model: 'Supra' }
  }
}

export function Markets() {
  const { tx, d, L } = useT()
  const [q, setQ] = useState<MarketQuery>(load)
  const [active, setActive] = useState<string | undefined>()
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(q))
    } catch {}
  }, [q])
  const list = useMemo(() => MARKETS.filter((m) => !active || m.id === active), [active])
  const label = `${q.make} ${q.model}`.trim()
  const search = (next: MarketQuery, origin: string) => {
    setQ(next)
    // Europäische Herkunft → Markt Europa; Länder ohne eigene Such-Zentrale → alle Märkte
    const o = ['de', 'it', 'fr', 'se', 'at', 'nl', 'ch', 'no', 'es', 'be'].includes(origin) ? 'eu' : origin
    setActive(MARKETS.some((m) => m.id === o) ? o : undefined)
    requestAnimationFrame(() => document.getElementById('angebote')?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  return (
    <>
      <section className="section mk-hero">
        <div className="mk-hero-text">
          <Reveal>
            <p className="eyebrow">{tx('Märkte · weltweit', 'Markets · worldwide')}</p>
            <h1 className="display">
              {tx('Eine Suche.', 'One search.')}
              <br />
              <em>{tx('Zwölf Märkte.', 'Twelve markets.')}</em>
            </h1>
            <p className="lead">{tx(`Für Autos, die es hier kaum gibt: JDM aus Japan, Muscle-Cars aus den USA, Klassiker aus England und Australien. Sag ${BRAND.name}, was du suchst, und spring direkt zu den Angeboten und Auktionen in jedem Land.`, `For cars that are rare here: JDM from Japan, muscle cars from the USA, classics from England and Australia. Tell ${BRAND.name} what you’re looking for and jump straight to listings and auctions in each country.`)}</p>
          </Reveal>
        </div>
        <CarStack />
      </section>

      <section className="section tight" id="modelle">
        <SectionHead eyebrow={tx('Modell-Katalog', 'Model catalogue')} title={<>{tx('Über 900 Modelle. ', 'Over 900 models. ')}<em>{tx('Aus aller Welt.', 'From around the world.')}</em></>} text={tx('Tipp einfach los: Die Vorschlagsliste findet Marke, Modell und Baujahr. Filtere nach Herkunft, Klasse, Jahrzehnt und Oldtimer-Status; jedes Modell führt direkt zu den Portalen seines Herkunftslands und in den Rechner.', 'Just start typing: suggestions find make, model and year. Filter by origin, class, decade and classic status; every model leads straight to the marketplaces of its home country and into the calculator.')} />
        <ModelFinder onSearch={search} />
      </section>

      <section className="section tight" id="suche">
        <div className="gcard mk-search">
          <div className="mk-fields">
            <label className="field">
              <span className="f-label">{tx('Marke', 'Make')}</span>
              <input className="input" list="mk-makes" value={q.make} onChange={(e) => setQ({ ...q, make: e.target.value })} />
              <datalist id="mk-makes">
                {MAKES.map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
            </label>
            <label className="field">
              <span className="f-label">{tx('Modell', 'Model')}</span>
              <input className="input" value={q.model} placeholder={tx('z. B. Supra', 'e.g. Supra')} onChange={(e) => setQ({ ...q, model: e.target.value })} />
            </label>
            <label className="field small">
              <span className="f-label">{tx('Baujahr ab', 'Year from')}</span>
              <input className="input" type="number" min={1960} max={2030} value={q.from ?? ''} onChange={(e) => setQ({ ...q, from: e.target.value ? Number(e.target.value) : undefined })} />
            </label>
          </div>
          <div className="mk-ideas">
            {IDEAS.map((i) => (
              <button key={i.make + i.model} className={'chip' + (i.make === q.make && i.model === q.model ? ' on' : '')} onClick={() => setQ({ ...q, ...i })}>
                {i.make} {i.model}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="section tight">
        <SectionHead eyebrow={tx('Netzwerk', 'Network')} title={<>{tx('Von dort ', 'From there ')}<em>{tx('bis Bremerhaven.', 'to Bremerhaven.')}</em></>} text={tx('Tippe auf ein Land, um nur dessen Angebote zu sehen. Die Linien zeigen den Seeweg nach Bremerhaven.', 'Tap a country to see only its listings. The lines show the sea route to Bremerhaven.')} />
        <div className="net-globe">
          <Suspense fallback={<div className="globe-ph" aria-hidden />}>
            <Globe3D
              theme="stone"
              focus={[45, 60]}
              routes={importRoutes(active)}
              points={[
                ...COUNTRIES.filter((c) => c.market && c.id !== 'de').map((c) => ({ id: c.market!, lat: c.lat, lon: c.lon, label: `${c.flag} ${L(c.name)}`, kind: (c.home || c.market === active ? 'home' : 'country') as 'home' | 'country' })),
                { id: 'hub', lat: BREMERHAVEN[0], lon: BREMERHAVEN[1], label: '⚓ Bremerhaven', kind: 'hub' as const },
              ]}
              onSelect={(p) => p.id !== 'hub' && setActive((a) => (a === p.id ? undefined : p.id))}
            />
          </Suspense>
          <div className="net-chips">
            {MARKETS.map((m) => (
              <button key={m.id} className={'chip' + (active === m.id ? ' on' : '')} onClick={() => setActive((a) => (a === m.id ? undefined : m.id))}>
                {m.code} · {d(m.country)}
              </button>
            ))}
          </div>
        </div>
        {active && (
          <button className="link mk-all" onClick={() => setActive(undefined)}>
            {tx('Alle Länder zeigen', 'Show all countries')}
          </button>
        )}
      </section>

      <section className="section tight" id="angebote">
        <div className="mk-grid">
          {list.map((m, k) => (
            <Reveal key={m.id} delay={k * 0.05}>
              <article className="gcard mk-card">
                <header>
                  <span className="mk-code">{m.code}</span>
                  <div>
                    <h3>{d(m.country)}</h3>
                    <p className="muted small">{d(m.hub)}</p>
                  </div>
                </header>
                <p className="mk-text">{d(m.text)}</p>
                <div className="mk-portals">
                  {m.portals.map((p) => (
                    <a key={p.name} className="mk-portal" href={p.url(q)} target="_blank" rel="noopener noreferrer">
                      <span>
                        <b>{p.name}</b>
                        <small>{d(p.kind)}</small>
                      </span>
                      <span className="mk-go">
                        {label || tx('Alle', 'All')} <ArrowUpRight size={15} />
                      </span>
                    </a>
                  ))}
                </div>
              </article>
            </Reveal>
          ))}
        </div>
        <p className="disclaimer">
          <Search size={13} /> {tx(`${BRAND.name} öffnet die öffentlichen Suchseiten der jeweiligen Portale. Die Angebote, Preise und Bilder gehören den Portalen und Händlern; ${BRAND.name} speichert oder zeigt sie nicht selbst an.`, `${BRAND.name} opens the public search pages of each marketplace. Listings, prices and images belong to the marketplaces and dealers; ${BRAND.name} does not store or display them.`)}
        </p>
      </section>

      <section className="section tight" id="merkliste">
        <SectionHead eyebrow={tx('Merkliste', 'Watchlist')} title={<>{tx('Gefunden? ', 'Found it? ')}<em>{tx('Durchrechnen.', 'Run the numbers.')}</em></>} text={tx('Halte Inserate aus allen Märkten mit Link und Preis fest. Jedes Auto geht mit einem Klick in den Import-Rechner, mit den Durchschnittsgebühren der Export-Agenten.', 'Save listings from all markets with link and price. Each car goes into the import calculator in one click, with the average export agent fees.')} />
        <Finds defaultTitle={label} />
      </section>

      <section className="section">
        <SectionHead
          eyebrow={tx('Auktionen', 'Auctions')}
          title={<>{tx('Die echten Preise ', 'Real prices ')}<em>{tx('entstehen hier.', 'are made here.')}</em></>}
          text={tx(`In den USA, England und Australien darf jeder mitbieten, die Ergebnisse sind meist öffentlich. In Japan und Korea laufen die meisten Autos über Händlerauktionen, dort geht der Weg über einen Auktions-Agenten oder den ${BRAND.name} Service.`, `In the USA, England and Australia anyone may bid and results are usually public. In Japan and Korea most cars go through dealer auctions; there you need an auction agent or the ${BRAND.name} service.`)}
        />
        {[
          { t: tx('Offene Auktionen', 'Public auctions'), l: AUCTIONS.filter((a) => a.open) },
          { t: tx('Händlerauktionen Japan & Korea', 'Dealer auctions Japan & Korea'), l: AUCTIONS.filter((a) => !a.open) },
        ].map((g) => (
          <div key={g.t} className="mk-auction-group">
            <p className="f-label">{g.t}</p>
            <div className="mk-auctions">
              {g.l.map((a, k) => (
                <Reveal key={a.name} delay={k * 0.04}>
                  <div className="gcard mk-auction">
                    <Gavel size={18} className="red" />
                    {a.url ? (
                      <a className="mk-auction-name" href={a.url} target="_blank" rel="noopener noreferrer">
                        {a.name} <ArrowUpRight size={14} />
                      </a>
                    ) : (
                      <b>{a.name}</b>
                    )}
                    <span className="muted small">{d(a.country)}</span>
                    <p>{d(a.text)}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        ))}
        <div className="mk-cta">
          <a className="btn red" href="#/discover/service">
            <ShieldCheck size={18} /> {tx(`Über ${BRAND.name} ersteigern lassen`, `Bid via ${BRAND.name}`)}
          </a>
          <a className="btn" href="#/discover/calculator/rechner">
            {tx('Kosten bis vor die Tür berechnen', 'Calculate landed cost')}
          </a>
        </div>
      </section>
    </>
  )
}
