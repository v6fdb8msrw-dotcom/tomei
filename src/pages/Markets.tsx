// Märkte: eine Suche für Asien, Amerika, Großbritannien und Australien, dazu der Modell-Finder für ältere Autos. TŌMEI öffnet die öffentlichen Ergebnisseiten der Portale je Land
// (kein Auslesen fremder Inserate). Auktionshäuser sind nur für Händler zugänglich → Weg über Agent oder TŌMEI Service.
import { ArrowUpRight, Gavel, Search, ShieldCheck } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { AUCTIONS, MARKETS, type MarketQuery } from '../data.ts'
import { Reveal, SectionHead } from '../components/motion.tsx'
import { CarStack, RouteMap } from '../components/depth.tsx'
import { Finds } from '../components/Finds.tsx'
import { ClassicFinder } from '../components/ClassicFinder.tsx'

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
    setActive(origin)
    requestAnimationFrame(() => document.getElementById('angebote')?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  return (
    <>
      <section className="section mk-hero">
        <div className="mk-hero-text">
          <Reveal>
            <p className="eyebrow">Märkte · weltweit</p>
            <h1 className="display">
              Eine Suche.
              <br />
              <em>Elf Märkte.</em>
            </h1>
            <p className="lead">Für Autos, die es hier kaum gibt: JDM aus Japan, Muscle-Cars aus den USA, Klassiker aus England und Australien. Sag TŌMEI, was du suchst, und spring direkt zu den Angeboten und Auktionen in jedem Land.</p>
          </Reveal>
        </div>
        <CarStack />
      </section>

      <section className="section tight" id="modelle">
        <SectionHead eyebrow="Modell-Finder" title={<>Selten hier. <em>Zu finden dort.</em></>} text="Ältere, besondere Autos, die du in Deutschland kaum oder nur teuer bekommst. Filtere nach Land, Jahrzehnt und Oldtimer-Status." />
        <ClassicFinder onSearch={search} />
      </section>

      <section className="section tight" id="suche">
        <div className="gcard mk-search">
          <div className="mk-fields">
            <label className="field">
              <span className="f-label">Marke</span>
              <input className="input" list="mk-makes" value={q.make} onChange={(e) => setQ({ ...q, make: e.target.value })} />
              <datalist id="mk-makes">
                {MAKES.map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
            </label>
            <label className="field">
              <span className="f-label">Modell</span>
              <input className="input" value={q.model} placeholder="z. B. Supra" onChange={(e) => setQ({ ...q, model: e.target.value })} />
            </label>
            <label className="field small">
              <span className="f-label">Baujahr ab</span>
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
        <SectionHead eyebrow="Netzwerk" title={<>Von dort <em>bis Bremerhaven.</em></>} text="Tippe auf ein Land, um nur dessen Angebote zu sehen. Die Linien zeigen den Seeweg nach Bremerhaven." />
        <RouteMap markets={MARKETS} active={active} onPick={(id) => setActive((a) => (a === id ? undefined : id))} />
        {active && (
          <button className="link mk-all" onClick={() => setActive(undefined)}>
            Alle Länder zeigen
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
                    <h3>{m.country}</h3>
                    <p className="muted small">{m.hub}</p>
                  </div>
                </header>
                <p className="mk-text">{m.text}</p>
                <div className="mk-portals">
                  {m.portals.map((p) => (
                    <a key={p.name} className="mk-portal" href={p.url(q)} target="_blank" rel="noopener noreferrer">
                      <span>
                        <b>{p.name}</b>
                        <small>{p.kind}</small>
                      </span>
                      <span className="mk-go">
                        {label || 'Alle'} <ArrowUpRight size={15} />
                      </span>
                    </a>
                  ))}
                </div>
              </article>
            </Reveal>
          ))}
        </div>
        <p className="disclaimer">
          <Search size={13} /> TŌMEI öffnet die öffentlichen Suchseiten der jeweiligen Portale. Die Angebote, Preise und Bilder gehören den Portalen und Händlern; TŌMEI speichert oder zeigt sie nicht selbst an.
        </p>
      </section>

      <section className="section tight" id="merkliste">
        <SectionHead eyebrow="Merkliste" title={<>Gefunden? <em>Durchrechnen.</em></>} text="Halte Inserate aus allen Märkten mit Link und Preis fest. Jedes Auto geht mit einem Klick in den Import-Rechner, mit den Durchschnittsgebühren der Export-Agenten." />
        <Finds defaultTitle={label} />
      </section>

      <section className="section">
        <SectionHead
          eyebrow="Auktionen"
          title={<>Die echten Preise <em>entstehen hier.</em></>}
          text="In den USA, England und Australien darf jeder mitbieten, die Ergebnisse sind meist öffentlich. In Japan und Korea laufen die meisten Autos über Händlerauktionen, dort geht der Weg über einen Auktions-Agenten oder den TŌMEI Service."
        />
        {[
          { t: 'Offene Auktionen', l: AUCTIONS.filter((a) => a.open) },
          { t: 'Händlerauktionen Japan & Korea', l: AUCTIONS.filter((a) => !a.open) },
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
                    <span className="muted small">{a.country}</span>
                    <p>{a.text}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        ))}
        <div className="mk-cta">
          <a className="btn red" href="#/service">
            <ShieldCheck size={18} /> Über TŌMEI ersteigern lassen
          </a>
          <a className="btn" href="#/import/rechner">
            Kosten bis vor die Tür berechnen
          </a>
        </div>
      </section>
    </>
  )
}
