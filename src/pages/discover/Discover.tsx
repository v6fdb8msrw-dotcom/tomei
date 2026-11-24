// DISCOVER: Übersicht, Auktionshäuser (Verzeichnis), Import-Partner-Finder und Import-Journey.
// Fahrzeugsuche (Markets.tsx), Importrechner (Import.tsx) und Service (Service.tsx) sind eigene Seiten.
import { ArrowUpRight, Check, CircleDot, ExternalLink, Gavel, Lock, Search } from 'lucide-react'
import { motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { AGENTS, AUCTIONS, IMPORT_FLAT, IMPORTERS, MARKETS, ORIGIN, agentTotal, type MarketQuery } from '../../data.ts'
import { WorldHub } from '../../components/WorldHub.tsx'
import { Badge, EASE, EmptyState, Note, PageHead, SourceLink, StatusPill, VehicleSelect, img, vehicleTitle } from '../../components/ui.tsx'
import { useT } from '../../i18n/i18n.ts'
import { yen } from '../../lib/calc.ts'
import { href } from '../../lib/router.ts'
import { addPassportEntry, updateVehicle, useStore } from '../../store/store.ts'
import { roadImg } from '../../data/roads.ts'
import { BRAND } from '../../config/brand.ts'

export function DiscoverHub() {
  const { t } = useT()
  const watch = useStore((s) => s.vehicles.filter((v) => v.status === 'watchlist' || v.status === 'dream').length)
  return (
    <WorldHub
      eyebrow="Discover"
      title={
        <>
          {t('world.discover.lead').split(',')[0]}, <em>{t('world.discover.lead').split(',').slice(1).join(',').trim()}</em>
        </>
      }
      sub={t('world.discover.text')}
      image={img('cars/fd')}
      tools={[
        { to: 'discover/search', title: 'Fahrzeugsuche', text: 'Eine Suche, elf Märkte von Japan bis Australien, mit Modell-Finder für seltene Klassiker.', img: img('cars/r34'), meta: watch ? `${watch} in deiner Garage` : 'Such-Zentrale' },
        { to: 'discover/auctions', title: 'Auktionshäuser', text: 'Offene Auktionen und Händlerauktionen als Verzeichnis, mit direkten Suchlinks. Keine kopierten Inserate.', img: img('parts-show'), meta: `${AUCTIONS.length} Häuser` },
        { to: 'discover/partners', title: 'Import-Partner', text: 'Agenten, Importeure und Speditionen nach Herkunft und Leistung, mit veröffentlichten Preisen und Quelle.', img: img('import-port'), meta: 'Ohne Bewertungen, ohne Provision' },
        { to: 'discover/calculator', title: 'Importrechner 2.0', text: 'Best, Expected, Worst und Custom: die Spanne bis vor die Tür, mit Tageskurs der EZB.', img: img('import-ship'), meta: '5 Herkunfts-, 6 Zielländer' },
        { to: 'discover/journey', title: 'Import-Journey', text: 'Vom Fund bis zur Zulassung in neun Schritten, mit Häkchen pro Fahrzeug.', img: roadImg('wangan'), meta: 'Fortschritt je Auto' },
        { to: 'discover/service', title: 'Service', text: 'Komplettpaket kaufen, verschiffen, zulassen. Anfrage vorbereiten, die Daten bleiben bei dir.', img: img('cars/s15'), meta: 'In Vorbereitung' },
      ]}
    />
  )
}

/* ------------------------------------------------------------------ Auktionshäuser */

/** Suchlink eines Auktionshauses aus der Such-Zentrale (data.ts → MARKETS), wenn es dort einen gibt */
function auctionSearch(name: string, q: MarketQuery): string | undefined {
  for (const m of MARKETS) {
    const p = m.portals.find((x) => x.name.toLowerCase().startsWith(name.toLowerCase()) || name.toLowerCase().startsWith(x.name.toLowerCase()))
    if (p) return p.url(q)
  }
  return undefined
}

export function Auctions() {
  const [kind, setKind] = useState<'all' | 'open' | 'dealer'>('all')
  const [text, setText] = useState('')
  const q: MarketQuery = useMemo(() => {
    const [make, ...rest] = text.trim().split(/\s+/)
    return { make: make ?? '', model: rest.join(' ') }
  }, [text])
  const list = AUCTIONS.filter((a) => (kind === 'all' ? true : kind === 'open' ? a.open : !a.open))
  return (
    <>
      <PageHead
        eyebrow="Discover · Auktionshäuser"
        title={
          <>
            Wer versteigert, <em>wer darf bieten.</em>
          </>
        }
        sub="Ein Verzeichnis, keine Auktionsplattform. Offene Häuser lassen jeden mitbieten; die großen Händlerauktionen in Japan und Korea erreichst du nur über einen Agenten. Ergebnisse und Inserate stehen bei den Häusern selbst."
        image={img('parts-show')}
      />
      <section className="section">
        <div className="toolbar">
          <div className="seg">
            {(['all', 'open', 'dealer'] as const).map((k) => (
              <button key={k} className={kind === k ? 'on' : ''} onClick={() => setKind(k)}>
                {k === 'all' ? 'Alle' : k === 'open' ? 'Offen für alle' : 'Nur Händler'}
              </button>
            ))}
          </div>
          <label className="search-field">
            <Search size={17} />
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Modell für die Suchlinks, z. B. Toyota Supra" aria-label="Modell" />
          </label>
        </div>
        <div className="dir">
          {list.map((a, k) => {
            const link = a.open && text.trim() ? auctionSearch(a.name, q) : undefined
            return (
              <motion.article key={a.name} className="dir-item" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: (k % 4) * 0.04, ease: EASE }}>
                <span className={'dir-icon' + (a.open ? ' open' : '')}>{a.open ? <Gavel size={18} /> : <Lock size={18} />}</span>
                <div className="dir-main">
                  <h3>{a.name}</h3>
                  <span className="dir-sub">
                    {a.country} · {a.open ? 'offen für alle' : 'nur registrierte Händler'}
                  </span>
                  <p>{a.text}</p>
                </div>
                <div className="dir-actions">
                  {link && (
                    <a className="btn small primary" href={link} target="_blank" rel="noopener noreferrer">
                      „{text.trim()}“ suchen <ArrowUpRight size={14} />
                    </a>
                  )}
                  {a.url && (
                    <a className="btn small" href={a.url} target="_blank" rel="noopener noreferrer">
                      Webseite <ExternalLink size={13} />
                    </a>
                  )}
                  {!a.open && (
                    <a className="btn small" href={href('discover/partners')}>
                      Über Agent bieten
                    </a>
                  )}
                </div>
              </motion.article>
            )
          })}
        </div>
        <Note>
          {`${BRAND.name} zeigt keine Auktionslisten, Ergebnisse oder Preise der Häuser: Die Daten gehören den Häusern, Auslesen ist nicht erlaubt. Gebühren der offenen Häuser rechnet der Importrechner mit (Herkunft USA, UK, Australien).`}
        </Note>
      </section>
    </>
  )
}

/* ------------------------------------------------------------------ Import-Partner */

type PartnerRole = 'agent' | 'complete' | 'shipping'
type Partner = { id: string; name: string; url: string; origins: string[]; roles: PartnerRole[]; text: string; price?: string; source?: string }

const ROLE: Record<PartnerRole, string> = { agent: 'Kauf vor Ort / Agent', complete: 'Komplett-Import', shipping: 'Verschiffung & Zoll' }

function buildPartners(): Partner[] {
  const roleOf: Record<string, { origins: string[]; roles: PartnerRole[] }> = {
    'Beyond Cars Japan': { origins: ['jp'], roles: ['agent'] },
    'Import Brothers': { origins: ['jp', 'us', 'uk'], roles: ['complete'] },
    'LPL Automotive': { origins: ['jp'], roles: ['shipping'] },
    KFZONE: { origins: ['jp'], roles: ['complete'] },
    MidoriWorks: { origins: ['jp'], roles: ['agent'] },
  }
  const list: Partner[] = AGENTS.map((a) => {
    const at = agentTotal(a, 1500000)
    return { id: a.id, name: a.name, url: a.url, origins: ['jp'], roles: ['agent' as PartnerRole], text: a.text, price: at === null ? 'auf Anfrage' : `${yen(at)} bei 1,5 Mio. ¥ Zuschlag (inkl. fester Posten und Hafentransport)`, source: a.source }
  })
  for (const f of IMPORT_FLAT) list.push({ id: f.id, name: f.name, url: f.url, origins: ['jp'], roles: ['complete'], text: f.text, price: `${f.eur.toLocaleString('de-DE')} € Service-Pauschale`, source: f.source })
  for (const p of IMPORTERS) {
    if (list.some((x) => x.name === p.name)) continue
    const r = roleOf[p.name] ?? { origins: ['jp'], roles: ['complete'] }
    list.push({ id: p.name, name: p.name, url: p.url, origins: r.origins, roles: r.roles, text: p.text })
  }
  // Speditionen mit veröffentlichten Preisen (aus dem Rechner, Herkunft USA)
  const seen = new Set<string>()
  for (const m of ORIGIN.us.ship) {
    if (!m.source || seen.has(new URL(m.source).hostname)) continue
    seen.add(new URL(m.source).hostname)
    const host = new URL(m.source).hostname.replace(/^www\./, '')
    list.push({ id: host, name: host === 'wcshipping.com' ? 'West Coast Shipping' : host === 'alltransportdepot.com' ? 'All Transport Depot' : host, url: 'https://' + host + '/', origins: ['us'], roles: ['shipping'], text: m.text, price: `ab ${m.cost?.toLocaleString('de-DE')} $`, source: m.source })
  }
  return list
}

export function Partners() {
  const all = useMemo(buildPartners, [])
  const [origin, setOrigin] = useState('jp')
  const [role, setRole] = useState<PartnerRole | 'all'>('all')
  const list = all.filter((p) => p.origins.includes(origin) && (role === 'all' || p.roles.includes(role)))
  const origins = [
    { id: 'jp', l: '🇯🇵 Japan' },
    { id: 'us', l: '🇺🇸 USA' },
    { id: 'uk', l: '🇬🇧 Großbritannien' },
    { id: 'ca', l: '🇨🇦 Kanada' },
    { id: 'au', l: '🇦🇺 Australien' },
  ]
  return (
    <>
      <PageHead
        eyebrow="Discover · Import-Partner"
        title={
          <>
            Wer dein Auto holt. <em>Mit offenen Preisen.</em>
          </>
        }
        sub="Agenten vor Ort, Komplett-Importeure und Speditionen. Ohne Ranking, ohne Sterne, ohne Provision: Preise nur, wenn die Firma sie selbst veröffentlicht, mit Link zur Quelle."
        image={img('import-port')}
      />
      <section className="section">
        <div className="toolbar">
          <div className="seg wrap">
            {origins.map((o) => (
              <button key={o.id} className={origin === o.id ? 'on' : ''} onClick={() => setOrigin(o.id)}>
                {o.l}
              </button>
            ))}
          </div>
          <div className="seg wrap">
            {(['all', 'agent', 'complete', 'shipping'] as const).map((r) => (
              <button key={r} className={role === r ? 'on' : ''} onClick={() => setRole(r)}>
                {r === 'all' ? 'Alle Leistungen' : ROLE[r]}
              </button>
            ))}
          </div>
        </div>
        {list.length === 0 ? (
          <EmptyState
            title="Noch keine Partner mit veröffentlichten Angaben."
            text={`Für ${origins.find((o) => o.id === origin)?.l.slice(5)} kennen wir keine Firma, die Preise oder Leistungen offen nennt. Im Importrechner kannst du ein eigenes Angebot eintragen.`}
            image={img('import-ship')}
            actions={[{ to: 'discover/calculator', label: 'Zum Importrechner', primary: true }]}
          />
        ) : (
          <div className="partners">
            {list.map((p, k) => (
              <motion.article key={p.id} className="partner" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: (k % 3) * 0.05, ease: EASE }}>
                <div className="partner-top">
                  <h3>{p.name}</h3>
                  <a className="icon-btn" href={p.url} target="_blank" rel="noopener noreferrer" aria-label={`${p.name} öffnen`}>
                    <ArrowUpRight size={17} />
                  </a>
                </div>
                <div className="chips">
                  {p.roles.map((r) => (
                    <span key={r} className="chip">
                      {ROLE[r]}
                    </span>
                  ))}
                  {p.price ? <Badge kind="ok">Preis veröffentlicht</Badge> : <Badge kind="warn">Preis auf Anfrage</Badge>}
                </div>
                <p>{p.text}</p>
                {p.price && <p className="partner-price mono">{p.price}</p>}
                {p.source && <SourceLink url={p.source}>Preisquelle</SourceLink>}
              </motion.article>
            ))}
          </div>
        )}
        <Note>Die Liste ist keine Empfehlung. Prüfe Impressum, Vertrag und Zahlungsweg jeder Firma selbst; zahle große Beträge nie ohne schriftliches Angebot. Preise: Stand 17./18.11.2026 laut den verlinkten Seiten.</Note>
      </section>
    </>
  )
}

/* ------------------------------------------------------------------ Import-Journey */

export const JOURNEY = [
  { id: 'find', t: 'Finden & merken', d: 'Inserat oder Auktion finden, Link und Preis in die Garage übernehmen.', to: 'discover/search' },
  { id: 'check', t: 'Prüfen', d: 'Auktionsblatt bzw. Zustandsbericht übersetzen lassen, Fotos, Historie und Rost prüfen, Zulassungsregeln im Zielland klären.', to: 'drive/atlas/de' },
  { id: 'calc', t: 'Durchrechnen', d: 'Best, Expected und Worst Case im Importrechner, Ergebnis am Fahrzeug speichern.', to: 'discover/calculator' },
  { id: 'partner', t: 'Partner wählen', d: 'Agent, Importeur oder Spedition auswählen, schriftliches Angebot einholen.', to: 'discover/partners' },
  { id: 'buy', t: 'Kaufen / Bieten', d: 'Zuschlag oder Kaufvertrag, Zahlung nur nach Rechnung und an das Firmenkonto.', to: '' },
  { id: 'ship', t: 'Verschiffen', d: 'RoRo oder Container, Transportversicherung, Exportpapiere (in Japan: Export Certificate).', to: '' },
  { id: 'customs', t: 'Verzollen', d: 'Zollanmeldung mit Rechnung und Frachtbrief, Zoll und Einfuhrumsatzsteuer zahlen.', to: '' },
  { id: 'register', t: 'Abnahme & Zulassung', d: 'In Deutschland: Vollabnahme nach § 21 StVZO, ggf. Umbau (Licht), danach Zulassung. Ab 30 Jahren ist ein H-Kennzeichen möglich.', to: 'own/maintenance' },
  { id: 'arrived', t: 'Angekommen', d: 'Status „In Besitz“, erster Eintrag im Passport, Wartung planen.', to: 'own/passport' },
] as const

export function Journey({ vehicleId }: { vehicleId?: string }) {
  const vehicles = useStore((s) => s.vehicles.filter((v) => v.status !== 'sold'))
  const [sel, setSel] = useState(vehicleId ?? vehicles[0]?.id ?? '')
  const v = vehicles.find((x) => x.id === sel)
  const done = new Set(v?.journey ?? [])
  const pct = Math.round((done.size / JOURNEY.length) * 100)

  const toggle = (id: string) => {
    if (!v) return
    const next = new Set(done)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    const patch: Parameters<typeof updateVehicle>[1] = { journey: [...next] }
    if (id === 'buy' && next.has('buy') && ['dream', 'watchlist', 'planned'].includes(v.status)) patch.status = 'import'
    if (id === 'arrived' && next.has('arrived') && v.status !== 'owned') {
      patch.status = 'owned'
      addPassportEntry({ vehicleId: v.id, date: new Date().toISOString().slice(0, 10), kind: 'import', title: 'Import abgeschlossen' })
    }
    updateVehicle(v.id, patch)
  }

  return (
    <>
      <PageHead
        eyebrow="Discover · Import-Journey"
        title={
          <>
            Vom Fund <em>bis zur Zulassung.</em>
          </>
        }
        sub="Neun Schritte, die jeder Import durchläuft. Hake sie pro Fahrzeug ab: Der Status in der Garage zieht mit, und am Ende beginnt der Passport."
        image={roadImg('wangan')}
      />
      <section className="section narrow">
        {vehicles.length === 0 ? (
          <EmptyState
            title="Leg zuerst ein Fahrzeug an."
            text="Die Journey merkt sich den Fortschritt je Auto. Starte mit einem Traumauto oder einem Fund aus der Fahrzeugsuche."
            image={img('cars/evo')}
            actions={[
              { to: 'own/garage', label: 'Zur Garage', primary: true },
              { to: 'discover/search', label: 'Fahrzeugsuche' },
            ]}
          />
        ) : (
          <>
            <div className="journey-head">
              <VehicleSelect vehicles={vehicles} value={sel} onChange={setSel} />
              {v && (
                <div className="journey-meta">
                  <StatusPill status={v.status} />
                  <span className="mono">{pct} %</span>
                </div>
              )}
            </div>
            <div className="journey-bar" aria-hidden>
              <motion.i initial={false} animate={{ width: pct + '%' }} transition={{ duration: 0.6, ease: EASE }} />
            </div>
            <ol className="journey">
              {JOURNEY.map((s, k) => {
                const on = done.has(s.id)
                return (
                  <li key={s.id} className={on ? 'done' : ''}>
                    <button className="j-check" onClick={() => toggle(s.id)} aria-pressed={on} aria-label={`${s.t} ${on ? 'erledigt' : 'offen'}`}>
                      {on ? <Check size={16} /> : <CircleDot size={16} />}
                    </button>
                    <div>
                      <span className="j-n">Schritt {k + 1}</span>
                      <h3>{s.t}</h3>
                      <p>{s.d}</p>
                      {s.to && (
                        <a className="link" href={href(s.to)}>
                          Werkzeug öffnen →
                        </a>
                      )}
                    </div>
                  </li>
                )
              })}
            </ol>
            {v && <p className="muted small">Fahrzeug: {vehicleTitle(v)}. Fortschritt bleibt auf diesem Gerät gespeichert.</p>}
          </>
        )}
      </section>
    </>
  )
}
