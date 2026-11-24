// DRIVE: Übersicht, Roadtrip-Explorer, Straßen-Detailseiten und Automotive Atlas.
import { ArrowRight, ArrowUpRight, Download, Map as MapIcon, MapPin, Mountain, Plus, Route } from 'lucide-react'
import { motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { DEST, MARKETS, ORIGIN, RENT } from '../../data.ts'
import { COUNTRIES, REGIONS, countryById, type Region } from '../../data/countries.ts'
import { ROADS, ROAD_KINDS, ROADS_RETRIEVED, roadImg, type Road } from '../../data/roads.ts'
import { GlobeView } from '../../components/Globe.tsx'
import { ProviderGrid } from '../../components/motion.tsx'
import { WorldHub } from '../../components/WorldHub.tsx'
import { Badge, EASE, Note, NotFound, PageHead, SourceLink, img } from '../../components/ui.tsx'
import { useT } from '../../i18n/i18n.ts'
import { mapsDirections, osmDirections, pathKm, toGpx } from '../../lib/gpx.ts'
import { href, navigate } from '../../lib/router.ts'
import { downloadFile, nowIso, uid, upsertTrip, useStore } from '../../store/store.ts'
import { SpotsGrid } from '../Spots.tsx'
import { BRAND } from '../../config/brand.ts'

export function DriveHub() {
  const { t, tx } = useT()
  const trips = useStore((s) => s.trips.length)
  return (
    <WorldHub
      eyebrow="Drive"
      title={
        <>
          {tx('Straßen, für die man ', 'Roads worth ')}<em>{tx('ein Auto kauft.', 'buying a car for.')}</em>
        </>
      }
      sub={t('world.drive.text')}
      image={roadImg('stelvio')}
      tools={[
        { to: 'drive/roads', title: 'Roads', text: tx(`${ROADS.length} Straßen in Japan, Europa und den USA, mit belegten Fakten und Route zum Mitnehmen.`, `${ROADS.length} roads in Japan, Europe and the USA, with verified facts and a route to take along.`), img: roadImg('trollstigen'), meta: 'Roadtrip-Explorer' },
        { to: 'drive/builder', title: 'Roadtrip-Builder', text: tx('Eigene Route aus Wegpunkten bauen, GPX importieren und exportieren, mit dem Auto aus deiner Garage verknüpfen.', 'Build your own route from waypoints, import and export GPX, link it to a car from your garage.'), img: roadImg('atlantic'), meta: trips ? tx(`${trips} gespeichert`, `${trips} saved`) : tx('GPX rein, GPX raus', 'GPX in, GPX out') },
        { to: 'drive/atlas', title: 'Automotive Atlas', text: tx(`${COUNTRIES.length} Länder: Märkte, Straßen, Importregeln und Mietwagen, verbunden über den Globus.`, `${COUNTRIES.length} countries: markets, roads, import rules and rentals, connected via the globe.`), img: roadImg('shimanami'), meta: tx('Vier Kontinente', 'Four continents') },
        { to: 'drive/rent', title: tx('Sportwagen mieten', 'Rent a sports car'), text: tx('JDM-Legenden direkt in Japan mieten. Ein Verzeichnis ohne Provision.', 'Rent JDM legends in Japan. A directory without commission.'), img: img('rent-supra'), meta: tx(`${RENT.length} Anbieter`, `${RENT.length} providers`) },
      ]}
    />
  )
}

/* ------------------------------------------------------------------ Explorer */

function RoadCard({ r, k }: { r: Road; k: number }) {
  const { L, tx, d, locale } = useT()
  const c = countryById(r.country)
  return (
    <motion.a href={href('drive/roads/' + r.id)} className="road" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-30px' }} transition={{ duration: 0.6, delay: (k % 3) * 0.06, ease: EASE }}>
      <div className="road-img" style={{ viewTransitionName: 'road-' + r.id }}>
        <img src={roadImg(r.id)} alt={r.name} loading="lazy" />
      </div>
      <div className="road-body">
        <span className="road-meta">
          {c?.flag} {c ? L(c.name) : ''} · {L(ROAD_KINDS[r.kind])}
        </span>
        <h3>{d(r.name)}</h3>
        <span className="road-facts mono">
          {r.lengthKm ? `${r.lengthKm.toLocaleString(locale)} km` : ''}
          {r.lengthKm && r.highestM ? ' · ' : ''}
          {r.highestM ? `${r.highestM.toLocaleString(locale)} m` : ''}
          {r.loop ? tx(' · Runde', ' · loop') : ''}
        </span>
      </div>
    </motion.a>
  )
}

export function RoadsExplorer() {
  const { L, tx } = useT()
  const [region, setRegion] = useState<Region | 'all'>('all')
  const [kind, setKind] = useState<Road['kind'] | 'all'>('all')
  const list = ROADS.filter((r) => (region === 'all' || countryById(r.country)?.region === region) && (kind === 'all' || r.kind === kind))
  const regions = [...new Set(ROADS.map((r) => countryById(r.country)!.region))]
  const kinds = [...new Set(ROADS.map((r) => r.kind))]
  return (
    <>
      <PageHead
        eyebrow="Drive · Roads"
        title={
          <>
            {ROADS.length} {tx('Straßen. ', 'roads. ')}<em>{tx('Alle belegt.', 'All sourced.')}</em>
          </>
        }
        sub={tx('Länge, Höhe und Endpunkte stammen aus der Wikipedia, die Fotos von Wikimedia Commons mit freier Lizenz. Jede Straße lässt sich als Roadtrip übernehmen und als GPX mitnehmen.', 'Length, altitude and endpoints come from Wikipedia, the photos from Wikimedia Commons under free licences. Every road can become a road trip and be taken along as GPX.')}
        image={roadImg('glockner')}
      />
      <section className="section">
        <div className="toolbar">
          <div className="seg wrap">
            <button className={region === 'all' ? 'on' : ''} onClick={() => setRegion('all')}>
              {tx('Alle Regionen', 'All regions')}
            </button>
            {regions.map((r) => (
              <button key={r} className={region === r ? 'on' : ''} onClick={() => setRegion(r)}>
                {L(REGIONS[r])}
              </button>
            ))}
          </div>
          <div className="seg wrap">
            <button className={kind === 'all' ? 'on' : ''} onClick={() => setKind('all')}>
              {tx('Alle Arten', 'All types')}
            </button>
            {kinds.map((k) => (
              <button key={k} className={kind === k ? 'on' : ''} onClick={() => setKind(k)}>
                {L(ROAD_KINDS[k])}
              </button>
            ))}
          </div>
        </div>
        <div className="roads">
          {list.map((r, k) => (
            <RoadCard key={r.id} r={r} k={k} />
          ))}
        </div>
        <p className="muted small">{tx(`Fakten abgerufen am ${ROADS_RETRIEVED}. Straßenzustand, Sperrungen und Maut ändern sich: vor der Fahrt beim Betreiber prüfen.`, `Facts retrieved on ${ROADS_RETRIEVED}. Road conditions, closures and tolls change: check with the operator before you go.`)}</p>
      </section>
    </>
  )
}

/* ------------------------------------------------------------------ Detail */

export function startTripFromRoad(r: Road, vehicleId?: string) {
  const t = nowIso()
  const id = uid()
  upsertTrip({ id, name: r.name, roadId: r.id, vehicleId, waypoints: r.waypoints.map((w) => ({ ...w })), createdAt: t, updatedAt: t })
  navigate('drive/builder/' + id)
}

export function RoadDetail({ id }: { id: string }) {
  const { L, tx, d, locale } = useT()
  const r = ROADS.find((x) => x.id === id)
  const trips = useStore((s) => s.trips.filter((t) => t.roadId === id))
  if (!r) return <NotFound />
  const c = countryById(r.country)!
  const crow = pathKm(r.waypoints)
  const others = ROADS.filter((x) => x.id !== r.id && (x.country === r.country || countryById(x.country)?.region === c.region)).slice(0, 3)
  return (
    <>
      <section className="road-hero">
        <div className="road-hero-img" style={{ viewTransitionName: 'road-' + r.id }}>
          <img src={roadImg(r.id)} alt={r.name} />
        </div>
        <div className="road-hero-text">
          <a className="phead-back" href={href('drive/roads')}>
            {tx('← Alle Straßen', '← All roads')}
          </a>
          <p className="eyebrow">
            {c.flag} {L(c.name)} · {r.region}
          </p>
          <h1>{d(r.name)}</h1>
          {r.local && <p className="road-local">{r.local}</p>}
        </div>
      </section>

      <section className="section narrow road-detail">
        <div className="road-stats">
          {r.lengthKm && (
            <div>
              <Route size={18} />
              <b className="mono">{r.lengthKm.toLocaleString(locale)} km</b>
              <span>{r.loop ? tx('Rundenlänge', 'Lap length') : tx('Länge', 'Length')}</span>
            </div>
          )}
          {r.highestM && (
            <div>
              <Mountain size={18} />
              <b className="mono">{r.highestM.toLocaleString(locale)} m</b>
              <span>{tx('höchster Punkt', 'highest point')}</span>
            </div>
          )}
          <div>
            <MapPin size={18} />
            <b className="mono">{r.waypoints.length}</b>
            <span>{tx('Wegpunkte', 'Waypoints')}</span>
          </div>
          <div>
            <MapIcon size={18} />
            <b>{L(ROAD_KINDS[r.kind])}</b>
            <span>{c.leftHand ? tx('Linksverkehr', 'Drives on the left') : tx('Rechtsverkehr', 'Drives on the right')}</span>
          </div>
        </div>

        <p className="road-lead">{L(r.text)}</p>

        <div className="road-cols">
          <div className="gcard">
            <h3>{tx('Fakten', 'Facts')}</h3>
            <ul className="facts">
              {r.facts.map((f) => (
                <li key={f.de}>{L(f)}</li>
              ))}
              {r.notes?.map((n) => (
                <li key={n.de} className="fact-note">
                  {L(n)}
                </li>
              ))}
            </ul>
            <div className="row gap wrap">
              <SourceLink url={r.source}>Wikipedia</SourceLink>
              {r.official && <SourceLink url={r.official}>{tx('Betreiber / offizielle Seite', 'Operator / official site')}</SourceLink>}
            </div>
          </div>
          <div className="gcard">
            <h3>Route</h3>
            <ol className="wps">
              {r.waypoints.map((w) => (
                <li key={w.name}>
                  <b>{w.name}</b>
                  <span className="mono muted">
                    {w.lat.toFixed(3)}, {w.lon.toFixed(3)}
                  </span>
                </li>
              ))}
            </ol>
            {r.waypoints.length > 1 && <p className="muted small">{tx('Luftlinie über die Wegpunkte', 'Straight-line distance via the waypoints')}: {crow.toLocaleString(locale, { maximumFractionDigits: 0 })} km. {tx('Die Wegpunkte sind Orte an der Strecke, keine exakte Linienführung.', 'The waypoints are places along the road, not the exact alignment.')}</p>}
            <div className="row gap wrap">
              <a className="btn small" href={mapsDirections(r.waypoints)} target="_blank" rel="noopener noreferrer">
                Google Maps <ArrowUpRight size={13} />
              </a>
              <a className="btn small" href={osmDirections(r.waypoints)} target="_blank" rel="noopener noreferrer">
                OpenStreetMap <ArrowUpRight size={13} />
              </a>
              <button className="btn small" onClick={() => downloadFile(`${BRAND.ascii.toLowerCase()}-${r.id}.gpx`, toGpx(r.name, r.waypoints, [], BRAND.ascii), 'application/gpx+xml')}>
                <Download size={13} /> GPX
              </button>
            </div>
          </div>
        </div>

        <div className="road-cta">
          <div>
            <h3>{tx('Als Roadtrip übernehmen', 'Turn into a road trip')}</h3>
            <p className="muted">{tx('Kopiert die Wegpunkte in den Builder. Dort ergänzt du Stopps, wählst dein Auto und exportierst GPX.', 'Copies the waypoints into the builder. There you add stops, choose your car and export GPX.')}</p>
          </div>
          <button className="btn primary" onClick={() => startTripFromRoad(r)}>
            <Plus size={16} /> {tx('Roadtrip starten', 'Start road trip')}
          </button>
        </div>
        {trips.length > 0 && (
          <p className="small">
            {tx('Schon geplant:', 'Already planned:')}{' '}
            {trips.map((t, i) => (
              <span key={t.id}>
                {i > 0 && ', '}
                <a href={href('drive/builder/' + t.id)}>{t.name}</a>
              </span>
            ))}
          </p>
        )}

        <p className="credit">
          {tx('Foto', 'Photo')}: {r.photo.author}, <a href={r.photo.page} target="_blank" rel="noopener noreferrer">Wikimedia Commons</a>, {r.photo.licenceUrl ? <a href={r.photo.licenceUrl} target="_blank" rel="noopener noreferrer">{r.photo.licence}</a> : r.photo.licence} {tx('(verkleinert)', '(resized)')}
        </p>
      </section>

      {others.length > 0 && (
        <section className="section">
          <div className="sec-head">
            <p className="eyebrow">{tx('In der Nähe', 'Nearby')}</p>
            <h2>
              {tx('Noch mehr ', 'More ')}<em>{L(REGIONS[c.region])}.</em>
            </h2>
          </div>
          <div className="roads">
            {others.map((o, k) => (
              <RoadCard key={o.id} r={o} k={k} />
            ))}
          </div>
        </section>
      )}
    </>
  )
}

/* ------------------------------------------------------------------ Atlas */

export function Atlas({ countryId }: { countryId?: string }) {
  if (countryId) return <CountryPage id={countryId} />
  return <AtlasIndex />
}

function AtlasIndex() {
  const { L, tx } = useT()
  const groups = useMemo(() => (Object.keys(REGIONS) as Region[]).map((r) => ({ r, list: COUNTRIES.filter((c) => c.region === r) })).filter((g) => g.list.length), [])
  return (
    <>
      <PageHead
        eyebrow="Drive · Automotive Atlas"
        title={
          <>
            {tx('Vier Kontinente. ', 'Four continents. ')}<em>{tx('Eine Karte.', 'One atlas.')}</em>
          </>
        }
        sub={tx('Jedes Land verbindet die drei Welten: wo man sucht, was der Import kostet, welche Straßen sich lohnen und wo man mieten kann.', 'Each country connects the three worlds: where to search, what importing costs, which roads are worth it and where to rent.')}
      />
      <section className="section atlas-globe">
        <GlobeView theme="petrol" />
      </section>
      <section className="section">
        {groups.map((g) => (
          <div key={g.r} className="atlas-group">
            <h2 className="atlas-h">{L(REGIONS[g.r])}</h2>
            <div className="atlas-grid">
              {g.list.map((c) => {
                const roads = ROADS.filter((r) => r.country === c.id).length
                const tags = [c.market && tx('Markt', 'Market'), c.dest && tx('Importziel', 'Import destination'), c.origin && c.origin !== 'jp' && tx('Herkunft', 'Origin'), roads && `${roads} Roads`, c.id === 'jp' && tx('Spots & Mieten', 'Spots & rentals')].filter(Boolean)
                return (
                  <a key={c.id} href={href('drive/atlas/' + c.id)} className="atlas-c">
                    <span className="atlas-flag">{c.flag}</span>
                    <span>
                      <b>{L(c.name)}</b>
                      <small>{tags.join(' · ') || (c.leftHand ? tx('Linksverkehr', 'Drives on the left') : tx('Rechtsverkehr', 'Drives on the right'))}</small>
                    </span>
                    <ArrowRight size={16} />
                  </a>
                )
              })}
            </div>
          </div>
        ))}
      </section>
    </>
  )
}

function CountryPage({ id }: { id: string }) {
  const { L, tx, locale, d } = useT()
  const c = countryById(id)
  if (!c) return <NotFound />
  const market = MARKETS.find((m) => m.id === c.market)
  const roads = ROADS.filter((r) => r.country === c.id)
  const dest = c.dest ? DEST[c.dest] : undefined
  const origin = c.origin && c.origin !== 'jp' ? ORIGIN[c.origin] : undefined
  const cover = roads[0] ? roadImg(roads[0].id) : c.id === 'jp' ? img('fuji-lakes') : undefined
  const q = { make: 'Toyota', model: 'Supra' }
  return (
    <>
      <PageHead
        eyebrow={`Atlas · ${L(REGIONS[c.region])}`}
        title={
          <>
            {c.flag} {L(c.name)}
          </>
        }
        sub={
          tx(
            [market?.text].filter(Boolean).join(' ') || (roads.length ? `${roads.length === 1 ? 'Eine Straße' : roads.length + ' Straßen'} im Roadtrip-Explorer${dest || origin ? ', dazu Importregeln im Rechner' : ''}.` : 'Noch wenig eingetragen.'),
            [market ? d(market.text) : ''].filter(Boolean).join(' ') || (roads.length ? `${roads.length === 1 ? 'One road' : roads.length + ' roads'} in the road trip explorer${dest || origin ? ', plus import rules in the calculator' : ''}.` : 'Not much here yet.'),
          )
        }
        back={{ to: 'drive/atlas', label: 'Atlas' }}
        image={cover}
      >
        <div className="chips">
          <span className="chip">{c.leftHand ? tx('Linksverkehr', 'Drives on the left') : tx('Rechtsverkehr', 'Drives on the right')}</span>
          {market && <span className="chip">{tx('Markt', 'Market')} · {market.hub}</span>}
          {dest && <span className="chip">{tx('Importziel im Rechner', 'Destination in calculator')}</span>}
          {origin && <span className="chip">{tx('Herkunft im Rechner', 'Origin in calculator')}</span>}
        </div>
      </PageHead>

      {roads.length > 0 && (
        <section className="section">
          <div className="sec-head">
            <p className="eyebrow">Roads</p>
            <h2>
              {tx('Hier lohnt sich ', 'Worth ')}<em>{tx('die Fahrt.', 'the drive.')}</em>
            </h2>
          </div>
          <div className="roads">
            {roads.map((r, k) => (
              <RoadCard key={r.id} r={r} k={k} />
            ))}
          </div>
        </section>
      )}

      {market && (
        <section className="section">
          <div className="sec-head">
            <p className="eyebrow">{tx('Markt', 'Market')}</p>
            <h2>
              {tx('Wo man ', 'Where to ')}<em>{tx('sucht.', 'search.')}</em>
            </h2>
            <p className="sec-text">{tx('Öffentliche Suchseiten der Portale, Beispiel', 'Public search pages of the marketplaces, example')}: {q.make} {q.model}. {tx('Die eigene Suche über alle Länder läuft in der Fahrzeugsuche.', 'The search across all countries is in the vehicle search.')}</p>
          </div>
          <div className="portal-list">
            {market.portals.map((p) => (
              <a key={p.name} className="portal" href={p.url(q)} target="_blank" rel="noopener noreferrer">
                <b>{p.name}</b>
                <span>{d(p.kind)}</span>
                <ArrowUpRight size={15} />
              </a>
            ))}
          </div>
          <a className="btn" href={href('discover/search')}>
            {tx('Zur Fahrzeugsuche', 'Vehicle search')} <ArrowRight size={16} />
          </a>
        </section>
      )}

      {(dest || origin) && (
        <section className="section narrow">
          <div className="sec-head">
            <p className="eyebrow">Import</p>
            <h2>
              {tx('Regeln ', 'Rules ')}<em>{tx('und Kosten.', 'and costs.')}</em>
            </h2>
          </div>
          {dest && (
            <div className="gcard">
              <h3>
                {tx('Import nach', 'Import to')} {dest.name} <Badge kind="estimate">{tx('Gebühren geschätzt', 'Fees estimated')}</Badge>
              </h3>
              <p>{d(dest.note)}</p>
              <p className="mono small">
                {tx('Zoll', 'Duty')} {dest.duty.toLocaleString(locale)} % · {dest.vatLabel} {dest.vat.toLocaleString(locale)} % · {tx('Hafen', 'Port')} {dest.port}
              </p>
            </div>
          )}
          {origin && (
            <div className="gcard">
              <h3>{tx(`Kaufen in ${origin.name}, Ziel Deutschland`, `Buying in ${origin.name}, destination Germany`)}</h3>
              <p>{d(origin.note)}</p>
              {origin.pref && (
                <p className="small">
                  <b>{d(origin.pref.label)}:</b> {d(origin.pref.text)} <SourceLink url={origin.pref.source} />
                </p>
              )}
            </div>
          )}
          <a className="btn primary" href={href('discover/calculator')}>
            {tx('Im Importrechner durchrechnen', 'Calculate in the import calculator')} <ArrowRight size={16} />
          </a>
        </section>
      )}

      {c.id === 'jp' && (
        <>
          <SpotsGrid />
          <section className="section">
            <div className="sec-head">
              <p className="eyebrow">{tx('Mieten', 'Rent')}</p>
              <h2>
                JDM <em>{tx('vor Ort fahren.', 'on home ground.')}</em>
              </h2>
            </div>
            <ProviderGrid items={RENT} />
          </section>
        </>
      )}

      {!market && !roads.length && !dest && !origin && (
        <section className="section narrow">
          <Note>{tx('Für dieses Land sind noch keine Märkte oder Straßen eingetragen.', 'No markets or roads have been added for this country yet.')}</Note>
        </section>
      )}
    </>
  )
}
