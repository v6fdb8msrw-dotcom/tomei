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
import { AUCTIONS_MORE, DIR_COUNTRY, TRANSPORT } from '../../data/directory.ts'

export function DiscoverHub() {
  const { t, tx } = useT()
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
        { to: 'discover/search', title: tx('Fahrzeugsuche', 'Vehicle search'), text: tx('Eine Suche, zwölf Märkte von Japan bis Australien, mit Modell-Finder für seltene Klassiker.', 'One search, twelve markets from Japan to Australia, with a model finder for rare classics.'), img: img('cars/r34'), meta: watch ? tx(`${watch} in deiner Garage`, `${watch} in your garage`) : tx('Such-Zentrale', 'Search hub') },
        { to: 'discover/match', title: tx('Autofinder', 'Car matcher'), text: tx('Ein paar Fragen, dann begründete Vorschläge aus über 1.100 Modellen.', 'A few questions, then reasoned suggestions from over 1,100 models.'), img: img('cars/esprit'), meta: tx('Was passt zu dir?', 'What suits you?') },
        { to: 'discover/auctions', title: tx('Auktionshäuser', 'Auction houses'), text: tx('Offene Auktionen und Händlerauktionen als Verzeichnis, mit direkten Suchlinks. Keine kopierten Inserate.', 'Public and dealer-only auctions as a directory, with direct search links. No copied listings.'), img: img('parts-show'), meta: tx(`${AUCTIONS.length + AUCTIONS_MORE.length} Häuser`, `${AUCTIONS.length + AUCTIONS_MORE.length} houses`) },
        { to: 'discover/partners', title: tx('Import-Partner', 'Import partners'), text: tx('Agenten, Importeure und Speditionen nach Herkunft und Leistung, mit veröffentlichten Preisen und Quelle.', 'Agents, importers and shippers by origin and service, with published prices and sources.'), img: img('import-port'), meta: tx('Ohne Bewertungen, ohne Provision', 'No ratings, no commission') },
        { to: 'discover/calculator', title: tx('Importrechner 2.0', 'Import calculator 2.0'), text: tx('Best, Expected, Worst und Custom: die Spanne bis vor die Tür, mit Tageskurs der EZB.', 'Best, expected, worst and custom: the range to your door, with the ECB daily rate.'), img: img('import-ship'), meta: tx('5 Herkunfts-, 6 Zielländer', '5 origin, 6 destination countries') },
        { to: 'discover/journey', title: 'Import-Journey', text: tx('Vom Fund bis zur Zulassung in neun Schritten, mit Häkchen pro Fahrzeug.', 'From find to registration in nine steps, ticked off per vehicle.'), img: roadImg('wangan'), meta: tx('Fortschritt je Auto', 'Progress per car') },
        { to: 'discover/service', title: 'Service', text: tx('Komplettpaket kaufen, verschiffen, zulassen. Anfrage vorbereiten, die Daten bleiben bei dir.', 'Full package: buy, ship, register. Prepare a request; your data stays with you.'), img: img('cars/s15'), meta: tx('In Vorbereitung', 'Coming soon') },
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
  const { tx, d, L, lang } = useT()
  const [kind, setKind] = useState<'all' | 'open' | 'dealer'>('all')
  const [text, setText] = useState('')
  const q: MarketQuery = useMemo(() => {
    const [make, ...rest] = text.trim().split(/\s+/)
    return { make: make ?? '', model: rest.join(' ') }
  }, [text])
  const all = useMemo(
    () => [
      ...AUCTIONS.map((a) => ({ name: a.name, country: d(a.country), text: d(a.text), url: a.url, open: !!a.open })),
      // doppelte Häuser (in beiden Listen) nur einmal
      ...AUCTIONS_MORE.filter((a) => !AUCTIONS.some((b) => b.name === a.name)).map((a) => ({ name: a.name, country: `${DIR_COUNTRY[a.cc].flag} ${L(DIR_COUNTRY[a.cc].name)}`, text: L(a.text), url: a.url, open: !!a.open })),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lang],
  )
  const list = all.filter((a) => (kind === 'all' ? true : kind === 'open' ? a.open : !a.open))
  return (
    <>
      <PageHead
        eyebrow={tx('Discover · Auktionshäuser', 'Discover · Auction houses')}
        title={
          <>
            {tx('Wer versteigert, ', 'Who auctions, ')}<em>{tx('wer darf bieten.', 'who may bid.')}</em>
          </>
        }
        sub={tx('Ein Verzeichnis, keine Auktionsplattform. Offene Häuser lassen jeden mitbieten; die großen Händlerauktionen in Japan und Korea erreichst du nur über einen Agenten. Ergebnisse und Inserate stehen bei den Häusern selbst.', 'A directory, not an auction platform. Public houses let anyone bid; the big dealer auctions in Japan and Korea are only reachable through an agent. Results and listings are on the houses’ own sites.')}
        image={img('parts-show')}
      />
      <section className="section">
        <div className="toolbar">
          <div className="seg">
            {(['all', 'open', 'dealer'] as const).map((k) => (
              <button key={k} className={kind === k ? 'on' : ''} onClick={() => setKind(k)}>
                {k === 'all' ? tx('Alle', 'All') : k === 'open' ? tx('Offen für alle', 'Open to all') : tx('Nur Händler', 'Dealers only')}
              </button>
            ))}
          </div>
          <label className="search-field">
            <Search size={17} />
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder={tx('Modell für die Suchlinks, z. B. Toyota Supra', 'Model for the search links, e.g. Toyota Supra')} aria-label={tx('Modell', 'Model')} />
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
                    {a.country} · {a.open ? tx('offen für alle', 'open to all') : tx('nur registrierte Händler', 'registered dealers only')}
                  </span>
                  <p>{a.text}</p>
                </div>
                <div className="dir-actions">
                  {link && (
                    <a className="btn small primary" href={link} target="_blank" rel="noopener noreferrer">
                      {tx(`„${text.trim()}“ suchen`, `Search “${text.trim()}”`)} <ArrowUpRight size={14} />
                    </a>
                  )}
                  {a.url && (
                    <a className="btn small" href={a.url} target="_blank" rel="noopener noreferrer">
                      {tx('Webseite', 'Website')} <ExternalLink size={13} />
                    </a>
                  )}
                  {!a.open && (
                    <a className="btn small" href={href('discover/partners')}>
                      {tx('Über Agent bieten', 'Bid via agent')}
                    </a>
                  )}
                </div>
              </motion.article>
            )
          })}
        </div>
        <Note>
          {tx(`${BRAND.name} zeigt keine Auktionslisten, Ergebnisse oder Preise der Häuser: Die Daten gehören den Häusern, Auslesen ist nicht erlaubt. Gebühren der offenen Häuser rechnet der Importrechner mit (Herkunft USA, UK, Australien).`, `${BRAND.name} shows no auction lists, results or prices: the data belongs to the houses and scraping is not allowed. Buyer’s premiums of the public houses are included in the import calculator (origin USA, UK, Australia).`)}
        </Note>
      </section>
    </>
  )
}

/* ------------------------------------------------------------------ Import-Partner */

type PartnerRole = 'agent' | 'complete' | 'shipping'
type Partner = { id: string; name: string; url: string; origins: string[]; roles: PartnerRole[]; text: string | { de: string; en: string }; price?: string | { de: string; en: string }; source?: string }

const ROLE: Record<PartnerRole, { de: string; en: string }> = {
  agent: { de: 'Kauf vor Ort / Agent', en: 'Local purchase / agent' },
  complete: { de: 'Komplett-Import', en: 'Full import' },
  shipping: { de: 'Verschiffung & Zoll', en: 'Shipping & customs' },
}

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
    return { id: a.id, name: a.name, url: a.url, origins: ['jp'], roles: ['agent' as PartnerRole], text: a.text, price: at === null ? undefined : { de: `${yen(at)} bei 1,5 Mio. ¥ Zuschlag (inkl. fester Posten und Hafentransport)`, en: `${yen(at)} on a ¥1.5m hammer price (incl. fixed items and port transport)` }, source: a.source }
  })
  for (const f of IMPORT_FLAT) list.push({ id: f.id, name: f.name, url: f.url, origins: ['jp'], roles: ['complete'], text: f.text, price: { de: `${f.eur.toLocaleString('de-DE')} € Service-Pauschale`, en: `€${f.eur.toLocaleString('en-GB')} service flat fee` }, source: f.source })
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
    list.push({ id: host, name: host === 'wcshipping.com' ? 'West Coast Shipping' : host === 'alltransportdepot.com' ? 'All Transport Depot' : host, url: 'https://' + host + '/', origins: ['us'], roles: ['shipping'], text: m.text, price: { de: `ab ${m.cost?.toLocaleString('de-DE')} $`, en: `from $${m.cost?.toLocaleString('en-GB')}` }, source: m.source })
  }
  // Reedereien, Terminal und Speditionen aus dem erweiterten Verzeichnis
  const ALL_ORIGINS = ['jp', 'us', 'uk', 'ca', 'au']
  for (const t of TRANSPORT) {
    if (list.some((x) => x.name === t.name)) continue
    const origins = t.cc === 'jp' ? ['jp'] : t.cc === 'us' ? ['us', 'ca'] : ALL_ORIGINS
    list.push({ id: t.name, name: t.name, url: t.url, origins, roles: ['shipping'], text: t.text })
  }
  return list
}

export function Partners() {
  const { tx, L, d } = useT()
  const all = useMemo(buildPartners, [])
  const [origin, setOrigin] = useState('jp')
  const [role, setRole] = useState<PartnerRole | 'all'>('all')
  const list = all.filter((p) => p.origins.includes(origin) && (role === 'all' || p.roles.includes(role)))
  const origins = [
    { id: 'jp', l: '🇯🇵 Japan' },
    { id: 'us', l: '🇺🇸 USA' },
    { id: 'uk', l: tx('🇬🇧 Großbritannien', '🇬🇧 United Kingdom') },
    { id: 'ca', l: tx('🇨🇦 Kanada', '🇨🇦 Canada') },
    { id: 'au', l: tx('🇦🇺 Australien', '🇦🇺 Australia') },
  ]
  return (
    <>
      <PageHead
        eyebrow={tx('Discover · Import-Partner', 'Discover · Import partners')}
        title={
          <>
            {tx('Wer dein Auto holt. ', 'Who brings your car. ')}<em>{tx('Mit offenen Preisen.', 'With open prices.')}</em>
          </>
        }
        sub={tx('Agenten vor Ort, Komplett-Importeure und Speditionen. Ohne Ranking, ohne Sterne, ohne Provision: Preise nur, wenn die Firma sie selbst veröffentlicht, mit Link zur Quelle.', 'Local agents, full-service importers and shippers. No ranking, no stars, no commission: prices only where the company publishes them, with a link to the source.')}
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
                {r === 'all' ? tx('Alle Leistungen', 'All services') : L(ROLE[r])}
              </button>
            ))}
          </div>
        </div>
        {list.length === 0 ? (
          <EmptyState
            title={tx('Noch keine Partner mit veröffentlichten Angaben.', 'No partners with published details yet.')}
            text={tx(`Für ${origins.find((o) => o.id === origin)?.l.slice(5)} kennen wir keine Firma, die Preise oder Leistungen offen nennt. Im Importrechner kannst du ein eigenes Angebot eintragen.`, `For ${origins.find((o) => o.id === origin)?.l.slice(5)} we know of no company that publishes prices or services. You can enter your own quote in the import calculator.`)}
            image={img('import-ship')}
            actions={[{ to: 'discover/calculator', label: tx('Zum Importrechner', 'Open calculator'), primary: true }]}
          />
        ) : (
          <div className="partners">
            {list.map((p, k) => (
              <motion.article key={p.id} className="partner" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: (k % 3) * 0.05, ease: EASE }}>
                <div className="partner-top">
                  <h3>{p.name}</h3>
                  <a className="icon-btn" href={p.url} target="_blank" rel="noopener noreferrer" aria-label={tx(`${p.name} öffnen`, `Open ${p.name}`)}>
                    <ArrowUpRight size={17} />
                  </a>
                </div>
                <div className="chips">
                  {p.roles.map((r) => (
                    <span key={r} className="chip">
                      {L(ROLE[r])}
                    </span>
                  ))}
                  {p.price ? <Badge kind="ok">{tx('Preis veröffentlicht', 'Price published')}</Badge> : <Badge kind="warn">{tx('Preis auf Anfrage', 'Price on request')}</Badge>}
                </div>
                <p>{typeof p.text === 'string' ? d(p.text) : L(p.text)}</p>
                {p.price && <p className="partner-price mono">{typeof p.price === 'string' ? p.price : L(p.price)}</p>}
                {p.source && <SourceLink url={p.source}>{tx('Preisquelle', 'Price source')}</SourceLink>}
              </motion.article>
            ))}
          </div>
        )}
        <Note>{tx('Die Liste ist keine Empfehlung. Prüfe Impressum, Vertrag und Zahlungsweg jeder Firma selbst; zahle große Beträge nie ohne schriftliches Angebot. Preise: Stand 17./18.11.2026 laut den verlinkten Seiten.', 'This list is not a recommendation. Check each company’s legal details, contract and payment method yourself; never pay large sums without a written quote. Prices as of 17/18 Nov 2026 according to the linked pages.')}</Note>
      </section>
    </>
  )
}

/* ------------------------------------------------------------------ Import-Journey */

export const JOURNEY = [
  { id: 'find', t: { de: 'Finden & merken', en: 'Find & save' }, d: { de: 'Inserat oder Auktion finden, Link und Preis in die Garage übernehmen.', en: 'Find a listing or auction, save link and price to your garage.' }, to: 'discover/search' },
  { id: 'check', t: { de: 'Prüfen', en: 'Inspect' }, d: { de: 'Auktionsblatt bzw. Zustandsbericht übersetzen lassen, Fotos, Historie und Rost prüfen, Zulassungsregeln im Zielland klären.', en: 'Have the auction sheet or condition report translated, check photos, history and rust, clarify registration rules in the destination country.' }, to: 'drive/atlas/de' },
  { id: 'calc', t: { de: 'Durchrechnen', en: 'Calculate' }, d: { de: 'Best, Expected und Worst Case im Importrechner, Ergebnis am Fahrzeug speichern.', en: 'Best, expected and worst case in the import calculator, save the result to the vehicle.' }, to: 'discover/calculator' },
  { id: 'partner', t: { de: 'Partner wählen', en: 'Choose a partner' }, d: { de: 'Agent, Importeur oder Spedition auswählen, schriftliches Angebot einholen.', en: 'Pick an agent, importer or shipper and get a written quote.' }, to: 'discover/partners' },
  { id: 'buy', t: { de: 'Kaufen / Bieten', en: 'Buy / bid' }, d: { de: 'Zuschlag oder Kaufvertrag, Zahlung nur nach Rechnung und an das Firmenkonto.', en: 'Winning bid or purchase contract; pay only against an invoice and to the company account.' }, to: '' },
  { id: 'ship', t: { de: 'Verschiffen', en: 'Ship' }, d: { de: 'RoRo oder Container, Transportversicherung, Exportpapiere (in Japan: Export Certificate).', en: 'RoRo or container, transport insurance, export papers (in Japan: export certificate).' }, to: '' },
  { id: 'customs', t: { de: 'Verzollen', en: 'Clear customs' }, d: { de: 'Zollanmeldung mit Rechnung und Frachtbrief, Zoll und Einfuhrumsatzsteuer zahlen.', en: 'Customs declaration with invoice and bill of lading, pay duty and import VAT.' }, to: '' },
  { id: 'register', t: { de: 'Abnahme & Zulassung', en: 'Inspection & registration' }, d: { de: 'In Deutschland: Vollabnahme nach § 21 StVZO, ggf. Umbau (Licht), danach Zulassung. Ab 30 Jahren ist ein H-Kennzeichen möglich.', en: 'In Germany: full inspection under § 21 StVZO, modifications if needed (lights), then registration. From 30 years an H plate (historic) is possible.' }, to: 'own/maintenance' },
  { id: 'arrived', t: { de: 'Angekommen', en: 'Arrived' }, d: { de: 'Status „In Besitz“, erster Eintrag im Passport, Wartung planen.', en: 'Status “Owned”, first passport entry, plan maintenance.' }, to: 'own/passport' },
] as const

export function Journey({ vehicleId }: { vehicleId?: string }) {
  const { tx, L } = useT()
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
      addPassportEntry({ vehicleId: v.id, date: new Date().toISOString().slice(0, 10), kind: 'import', title: tx('Import abgeschlossen', 'Import completed') })
    }
    updateVehicle(v.id, patch)
  }

  return (
    <>
      <PageHead
        eyebrow="Discover · Import-Journey"
        title={
          <>
            {tx('Vom Fund ', 'From find ')}<em>{tx('bis zur Zulassung.', 'to registration.')}</em>
          </>
        }
        sub={tx('Neun Schritte, die jeder Import durchläuft. Hake sie pro Fahrzeug ab: Der Status in der Garage zieht mit, und am Ende beginnt der Passport.', 'Nine steps every import goes through. Tick them off per vehicle: the garage status follows, and at the end the passport begins.')}
        image={roadImg('wangan')}
      />
      <section className="section narrow">
        {vehicles.length === 0 ? (
          <EmptyState
            title={tx('Leg zuerst ein Fahrzeug an.', 'Add a vehicle first.')}
            text={tx('Die Journey merkt sich den Fortschritt je Auto. Starte mit einem Traumauto oder einem Fund aus der Fahrzeugsuche.', 'The journey tracks progress per car. Start with a dream car or a find from the vehicle search.')}
            image={img('cars/evo')}
            actions={[
              { to: 'own/garage', label: tx('Zur Garage', 'Go to garage'), primary: true },
              { to: 'discover/search', label: tx('Fahrzeugsuche', 'Vehicle search') },
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
                    <button className="j-check" onClick={() => toggle(s.id)} aria-pressed={on} aria-label={`${L(s.t)} ${on ? tx('erledigt', 'done') : tx('offen', 'open')}`}>
                      {on ? <Check size={16} /> : <CircleDot size={16} />}
                    </button>
                    <div>
                      <span className="j-n">{tx('Schritt', 'Step')} {k + 1}</span>
                      <h3>{L(s.t)}</h3>
                      <p>{L(s.d)}</p>
                      {s.to && (
                        <a className="link" href={href(s.to)}>
                          {tx('Werkzeug öffnen →', 'Open tool →')}
                        </a>
                      )}
                    </div>
                  </li>
                )
              })}
            </ol>
            {v && <p className="muted small">{tx('Fahrzeug', 'Vehicle')}: {vehicleTitle(v)}. {tx('Fortschritt bleibt auf diesem Gerät gespeichert.', 'Progress is stored on this device.')}</p>}
          </>
        )}
      </section>
    </>
  )
}
