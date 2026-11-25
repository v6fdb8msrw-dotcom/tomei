// Roadtrip-Builder: eigene Routen aus Wegpunkten, GPX-Import und -Export, verknüpft mit Garage und Passport.
import { ArrowDown, ArrowUp, ArrowUpRight, BookPlus, Download, FileUp, Plus, Trash2 } from 'lucide-react'
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { BRAND } from '../../config/brand.ts'
import { ROADS, roadImg, roadThumb } from '../../data/roads.ts'
import { EmptyState, Note, NotFound, PageHead, VehicleSelect, fmtDate, img, small, today, vehicleTitle } from '../../components/ui.tsx'
import { haversineKm, mapsDirections, osmDirections, parseGpx, pathKm, toGpx } from '../../lib/gpx.ts'
import { href, navigate } from '../../lib/router.ts'
import { addPassportEntry, downloadFile, nowIso, removeTrip, uid, upsertTrip, useStore } from '../../store/store.ts'
import type { Trip, Waypoint } from '../../store/schema.ts'
import { useT } from '../../i18n/i18n.ts'
import { TripPlan, roadWaypoints, useRoadGeo } from '../../components/TripPlan.tsx'
import { TripQuick, placeSuggestions } from '../../components/TripQuick.tsx'
import { Details, QuickInput } from '../../components/QuickInput.tsx'
import { autoTrip, loadPlaces } from '../../lib/autotrip.ts'
import type { Place } from '../../lib/quick.ts'
import { withVia } from '../../lib/tripplan.ts'

// Route auf dem 3D-Globus: von Ort zu Ort, keine Straßenführung
const Globe3D = lazy(() => import('../../components/Globe3D.tsx'))

function newTrip(name = 'Neuer Roadtrip', waypoints: Waypoint[] = [], track?: [number, number][]): Trip {
  const t = nowIso()
  return { id: uid(), name, waypoints, track, createdAt: t, updatedAt: t }
}

async function readGpx(file: File): Promise<Trip> {
  if (file.size > 15 * 1024 * 1024) throw new Error('Die Datei ist größer als 15 MB.')
  const d = parseGpx(await file.text())
  return newTrip(d.name || file.name.replace(/\.gpx$/i, ''), d.waypoints.length ? d.waypoints : d.track.length ? [{ name: 'Start', lat: d.track[0][0], lon: d.track[0][1] }, { name: 'Ziel', lat: d.track[d.track.length - 1][0], lon: d.track[d.track.length - 1][1] }] : [], d.track.length ? d.track : undefined)
}

/** Skizze der Route: Datenpunkte auf einem einfachen Gitter, kein Kartenbild */
function RouteSketch({ trip, lines = {} }: { trip: Trip; lines?: Record<string, [number, number][]> }) {
  const { tx } = useT()
  const pts = useMemo(() => {
    const roads = trip.waypoints.map((w) => (w.via ? lines[w.via] : undefined)).filter((x): x is [number, number][] => !!x)
    const all: [number, number][] = [...(trip.track ?? []), ...roads.flat(), ...trip.waypoints.map((w) => [w.lat, w.lon] as [number, number])]
    if (!all.length) return null
    const lats = all.map((p) => p[0])
    const lons = all.map((p) => p[1])
    const minLat = Math.min(...lats)
    const maxLat = Math.max(...lats)
    const minLon = Math.min(...lons)
    const maxLon = Math.max(...lons)
    const k = Math.cos((((minLat + maxLat) / 2) * Math.PI) / 180)
    const w = Math.max(1e-4, (maxLon - minLon) * k)
    const h = Math.max(1e-4, maxLat - minLat)
    const W = 900
    const H = 460
    const pad = 54
    const s = Math.min((W - 2 * pad) / w, (H - 2 * pad) / h)
    const ox = (W - w * s) / 2
    const oy = (H - h * s) / 2
    const xy = (lat: number, lon: number) => [ox + (lon - minLon) * k * s, H - (oy + (lat - minLat) * s)] as const
    const step = Math.max(1, Math.floor((trip.track?.length ?? 0) / 1500))
    return {
      W,
      H,
      track: trip.track?.filter((_, i) => i % step === 0).map((p) => xy(p[0], p[1]).join(',')).join(' '),
      roads: roads.map((g) => g.map((p) => xy(p[0], p[1]).join(',')).join(' ')),
      links: trip.waypoints.slice(1).flatMap((p, i) => (p.via && lines[p.via] ? [] : [[xy(trip.waypoints[i].lat, trip.waypoints[i].lon), xy(p.lat, p.lon)]])),
      wps: trip.waypoints.map((p, i) => {
        const q = xy(p.lat, p.lon)
        const seen = trip.waypoints.slice(0, i).some((o) => o.name === p.name)
        return { n: p.via || seen ? '' : p.name.replace(/ · A$/, ''), xy: q, left: q[0] > W * 0.72 }
      }),
    }
  }, [trip, lines])
  if (!pts) return <div className="sketch empty-sketch">{tx('Noch keine Punkte', 'No points yet')}</div>
  return (
    <svg className="sketch" viewBox={`0 0 ${pts.W} ${pts.H}`} role="img" aria-label="Route sketch">
      <defs>
        <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
          <path d="M 30 0 L 0 0 0 30" className="sk-grid" />
        </pattern>
      </defs>
      <rect width={pts.W} height={pts.H} rx="14" fill="url(#grid)" className="sk-bg" />
      {pts.track && <polyline points={pts.track} className="sk-track" />}
      {!pts.track && pts.links.map(([a, b], i) => <line key={'l' + i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} className="sk-line" />)}
      {pts.roads.map((p, i) => (
        <polyline key={'r' + i} points={p} className="sk-road" />
      ))}
      {pts.wps.map((w, i) => (
        <g key={i}>
          <circle cx={w.xy[0]} cy={w.xy[1]} r={i === 0 || i === pts.wps.length - 1 ? 6 : 4.5} className={i === 0 ? 'sk-start' : i === pts.wps.length - 1 ? 'sk-end' : 'sk-pt'} />
          <text x={w.xy[0] + (w.left ? -10 : 10)} y={w.xy[1] - 9} textAnchor={w.left ? 'end' : 'start'} className="sk-label">
            {w.n}
          </text>
        </g>
      ))}
    </svg>
  )
}

/** Straßenabschnitt nur behalten, wenn Start (· A) und Ziel (· B) noch direkt hintereinander stehen */
const fixVia = (w: Waypoint[]) => w.map((p, i) => (p.via && !(i > 0 && w[i - 1].road === p.via) ? { ...p, via: undefined } : p))

export default function Builder({ tripId }: { tripId?: string }) {
  return tripId ? <Editor id={tripId} /> : <TripList />
}

function TripList() {
  const { t, tx, locale } = useT()
  const trips = useStore((s) => s.trips)
  const vehicles = useStore((s) => s.vehicles)
  const file = useRef<HTMLInputElement>(null)
  const [err, setErr] = useState('')
  const create = (tr: Trip) => {
    upsertTrip(tr)
    navigate('drive/builder/' + tr.id)
  }
  return (
    <>
      <PageHead
        eyebrow="Drive · Roadtrip-Builder"
        title={
          <>
            {tx('Eine Zeile. ', 'One line. ')}<em>{tx('Ein Roadtrip.', 'One road trip.')}</em>
          </>
        }
        sub={tx('Sag, wohin und wie lange. Straßen, Reihenfolge, Tagesetappen und Kosten plant die Seite.', 'Say where and for how long. The site plans roads, order, daily stages and costs.')}
        image={roadImg('atlantic')}
      >
        <TripQuick />
        <div className="row gap wrap quick-alt">
          <button className="btn" onClick={() => create(newTrip())}>
            <Plus size={16} /> {tx('Leer beginnen', 'Start empty')}
          </button>
          <button className="btn" onClick={() => file.current?.click()}>
            <FileUp size={16} /> {tx('GPX importieren', 'Import GPX')}
          </button>
          <input
            ref={file}
            type="file"
            accept=".gpx,application/gpx+xml,application/xml,text/xml"
            hidden
            onChange={async (e) => {
              const f = e.target.files?.[0]
              e.target.value = ''
              if (!f) return
              try {
                setErr('')
                create(await readGpx(f))
              } catch (x) {
                setErr((x as Error).message)
              }
            }}
          />
        </div>
        {err && <Note tone="warn">{err}</Note>}
      </PageHead>
      <section className="section">
        {trips.length === 0 ? (
          <EmptyState
            title={t('empty.trips.title')}
            text={t('empty.trips.text')}
            image={roadImg('trollstigen')}
            actions={[{ to: 'drive/roads', label: tx('Roads entdecken', 'Explore roads'), primary: true }]}
          />
        ) : (
          <div className="trips">
            {trips.map((tr) => {
              const v = vehicles.find((x) => x.id === tr.vehicleId)
              const km = pathKm(tr.track?.length ? tr.track.map(([lat, lon]) => ({ lat, lon })) : tr.waypoints)
              return (
                <a key={tr.id} className="trip" href={href('drive/builder/' + tr.id)}>
                  <div className="trip-img">
                    <img src={tr.roadId ? roadThumb(tr.roadId) : small(img('fuji'))} alt="" loading="lazy" />
                  </div>
                  <div>
                    <h3>{tr.name}</h3>
                    <span className="muted small">
                      {tr.waypoints.length} {tx('Wegpunkte', 'waypoints')}{tr.track?.length ? ` · ${tr.track.length.toLocaleString(locale)} ${tx('Spurpunkte', 'track points')}` : ''} · {km.toLocaleString(locale, { maximumFractionDigits: 0 })} {tx('km Luftlinie', 'km straight-line')}
                      {v ? ` · ${vehicleTitle(v)}` : ''}
                    </span>
                  </div>
                </a>
              )
            })}
          </div>
        )}
      </section>
    </>
  )
}

function Editor({ id }: { id: string }) {
  const { tx, L, locale } = useT()
  const trip = useStore((s) => s.trips.find((t) => t.id === id))
  const vehicles = useStore((s) => s.vehicles)
  const [wp, setWp] = useState({ name: '', lat: '', lon: '' })
  const [roadPick, setRoadPick] = useState('')
  const [msg, setMsg] = useState('')
  const file = useRef<HTMLInputElement>(null)
  const geo = useRoadGeo(trip?.waypoints ?? [])
  const [stop, setStop] = useState('')
  const [places, setPlaces] = useState<Place[]>([])
  useEffect(() => {
    let alive = true
    loadPlaces().then((p) => alive && setPlaces(p))
    return () => {
      alive = false
    }
  }, [])
  if (!trip) return <NotFound />
  const save = (patch: Partial<Trip>) => upsertTrip({ ...trip, ...patch })
  /** Vorschlag übernehmen: Straße mit Verlauf, Ort als Punkt. Bei Rundreisen vor der Rückkehr. */
  const addStop = async (sid: string) => {
    const w = trip.waypoints
    const round = w.length > 2 && w[0].name === w[w.length - 1].name
    const head = round ? w.slice(0, -1) : w
    const key = sid.slice(1)
    let add: Waypoint[] = []
    if (sid[0] === 'r') add = await roadWaypoints(key, head[head.length - 1])
    if (sid[0] === 'p') {
      const p = places.find((x) => x.n + x.cc === key)
      if (p) add = [{ name: p.n, lat: p.lat, lon: p.lon }]
    }
    if (sid[0] === 'a' || sid[0] === 'c') {
      const r = await autoTrip(stop, roadWaypoints)
      add = r.waypoints
    }
    setStop('')
    if (add.length) save({ waypoints: fixVia([...head, ...add, ...(round ? [w[w.length - 1]] : [])]) })
  }
  const move = (i: number, d: number) => {
    const w = [...trip.waypoints]
    const j = i + d
    if (j < 0 || j >= w.length) return
    ;[w[i], w[j]] = [w[j], w[i]]
    save({ waypoints: fixVia(w) })
  }
  const lat = parseFloat(wp.lat.replace(',', '.'))
  const lon = parseFloat(wp.lon.replace(',', '.'))
  // Nur Weltreisen auf dem Globus; alles andere als Streckenbild mit echtem Straßenverlauf
  const far = trip.waypoints.length > 1 && Math.max(...trip.waypoints.map((w) => haversineKm(trip.waypoints[0], w))) > 3500
  const okPt = Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180
  const km = pathKm(trip.track?.length ? trip.track.map(([la, lo]) => ({ lat: la, lon: lo })) : trip.waypoints)
  const road = ROADS.find((r) => r.id === trip.roadId)
  const v = vehicles.find((x) => x.id === trip.vehicleId)

  return (
    <>
      <PageHead eyebrow="Roadtrip-Builder" title={trip.name || 'Roadtrip'} back={{ to: 'drive/builder', label: tx('Alle Roadtrips', 'All road trips') }} sub={road ? tx(`Basiert auf ${road.name}.`, `Based on ${road.name}.`) : tx('Eigene Route.', 'Custom route.')} />
      <section className="section builder">
        <div className="builder-main">
          {far ? (
            <div className="trip-globe">
              <Suspense fallback={<div className="globe-ph" aria-hidden />}>
                <Globe3D
                  theme="stone"
                  autoRotate={false}
                  focus={[trip.waypoints[0].lat, trip.waypoints[0].lon]}
                  points={trip.waypoints.map((w, i) => ({ id: 'w' + i, lat: w.lat, lon: w.lon, label: `${i + 1}. ${w.name}`, kind: i === 0 ? 'home' : 'stop' }))}
                  routes={trip.waypoints.slice(1).map((w, i) => ({ from: [trip.waypoints[i].lat, trip.waypoints[i].lon] as [number, number], to: [w.lat, w.lon] as [number, number], kind: 'trip' as const }))}
                />
              </Suspense>
            </div>
          ) : (
            <RouteSketch trip={trip} lines={geo.line} />
          )}
          <p className="muted small">
            {trip.waypoints.length} {tx('Wegpunkte', 'waypoints')}{trip.track?.length ? `, ${trip.track.length.toLocaleString(locale)} ${tx('Spurpunkte aus GPX', 'track points from GPX')}` : ''} · {km.toLocaleString(locale, { maximumFractionDigits: 0 })} {tx('km Luftlinie (keine Straßenlänge)', 'km straight-line (not road distance)')}
          </p>

          <QuickInput
            value={stop}
            onChange={setStop}
            suggestions={placeSuggestions(stop, places, L)}
            onPick={(x) => addStop(x.id)}
            onSubmit={() => {
              const first = placeSuggestions(stop, places, L)[0]
              if (first) addStop(first.id)
            }}
            label={tx('Stopp hinzufügen', 'Add a stop')}
            placeholder={tx('Stopp oder Straße hinzufügen …', 'Add a stop or road …')}
            button={tx('Hinzufügen', 'Add')}
          />

          <TripPlan trip={trip} vehicle={v} save={save} />

          <Details title={tx('Alles selbst einstellen: Name, Datum, Auto, Wegpunkte', 'Set everything yourself: name, date, car, waypoints')} open={trip.waypoints.length === 0}>
            <div className="fields two">
              <label className="field">
                <span className="f-label">Name</span>
                <input className="input" value={trip.name} onChange={(e) => save({ name: e.target.value.slice(0, 160) })} />
              </label>
              <label className="field">
                <span className="f-label">{tx('Datum', 'Date')}</span>
                <input className="input" type="date" value={trip.date ?? ''} onChange={(e) => save({ date: e.target.value || undefined })} />
              </label>
              <VehicleSelect vehicles={vehicles} value={trip.vehicleId} onChange={(vid) => save({ vehicleId: vid || undefined })} allowNone={tx('Ohne Fahrzeug', 'No vehicle')} label={tx('Mit welchem Auto?', 'Which car?')} />
              <label className="field">
                <span className="f-label">{tx('Notizen', 'Notes')}</span>
                <input className="input" value={trip.notes ?? ''} onChange={(e) => save({ notes: e.target.value.slice(0, 4000) })} placeholder={tx('Tankstopps, Hotels, Fähren …', 'Fuel stops, hotels, ferries …')} />
              </label>
            </div>
          <h3>{tx('Wegpunkte', 'Waypoints')}</h3>
            {trip.waypoints.length === 0 && <p className="muted">{tx('Noch keine Wegpunkte. Füge unten Koordinaten hinzu oder übernimm Punkte einer Straße.', 'No waypoints yet. Add coordinates below or take the points of a road.')}</p>}
            <ol className="wps edit">
              {trip.waypoints.map((w, i) => (
                <li key={i}>
                  <input className="input" value={w.name} aria-label={tx('Name des Wegpunkts', 'Waypoint name')} onChange={(e) => save({ waypoints: trip.waypoints.map((x, k) => (k === i ? { ...x, name: e.target.value.slice(0, 120) } : x)) })} />
                  <span className="mono muted small">
                    {w.lat.toFixed(4)}, {w.lon.toFixed(4)}
                  </span>
                  <span className="wp-btns">
                    <button className="icon-btn" onClick={() => move(i, -1)} aria-label={tx('Nach oben', 'Move up')} disabled={i === 0}>
                      <ArrowUp size={15} />
                    </button>
                    <button className="icon-btn" onClick={() => move(i, 1)} aria-label={tx('Nach unten', 'Move down')} disabled={i === trip.waypoints.length - 1}>
                      <ArrowDown size={15} />
                    </button>
                    <button className="icon-btn" onClick={() => save({ waypoints: fixVia(trip.waypoints.filter((_, k) => k !== i)) })} aria-label={tx('Entfernen', 'Remove')}>
                      <Trash2 size={15} />
                    </button>
                  </span>
                </li>
              ))}
            </ol>
            <div className="wp-add">
              <input className="input" placeholder="Name" value={wp.name} onChange={(e) => setWp({ ...wp, name: e.target.value })} aria-label="Name" />
              <input className="input" placeholder={tx('Breite, z. B. 46.53', 'Latitude, e.g. 46.53')} inputMode="decimal" value={wp.lat} onChange={(e) => setWp({ ...wp, lat: e.target.value })} aria-label={tx('Breitengrad', 'Latitude')} />
              <input className="input" placeholder={tx('Länge, z. B. 10.45', 'Longitude, e.g. 10.45')} inputMode="decimal" value={wp.lon} onChange={(e) => setWp({ ...wp, lon: e.target.value })} aria-label={tx('Längengrad', 'Longitude')} />
              <button
                className="btn"
                disabled={!okPt}
                onClick={() => {
                  save({ waypoints: [...trip.waypoints, { name: wp.name.trim() || `Punkt ${trip.waypoints.length + 1}`, lat, lon }] })
                  setWp({ name: '', lat: '', lon: '' })
                }}
              >
                <Plus size={15} /> {tx('Punkt', 'Point')}
              </button>
            </div>
            <div className="wp-add">
              <select className="input" value={roadPick} onChange={(e) => setRoadPick(e.target.value)} aria-label={tx('Straße', 'Road')}>
                <option value="">{tx('Punkte einer Straße anhängen …', 'Append points of a road …')}</option>
                {ROADS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
              <button
                className="btn"
                disabled={!roadPick}
                onClick={async () => {
                  const add = await roadWaypoints(roadPick, trip.waypoints[trip.waypoints.length - 1])
                  save({ waypoints: [...trip.waypoints, ...add], roadId: trip.roadId ?? roadPick })
                  setRoadPick('')
                }}
              >
                {tx('Anhängen', 'Append')}
              </button>
            </div>
            <p className="muted small">{tx('Koordinaten findest du z. B. per Rechtsklick in OpenStreetMap oder Google Maps.', 'You can get coordinates e.g. by right-clicking in OpenStreetMap or Google Maps.')}</p>
          </Details>
        </div>

        <aside className="builder-side">
          <div className="gcard">
            <h3>{tx('Mitnehmen', 'Take along')}</h3>
            <div className="stack-btns">
              <button className="btn" disabled={!trip.waypoints.length && !trip.track?.length} onClick={() => downloadFile(`${(trip.name || 'roadtrip').replace(/[^\w-]+/g, '_')}.gpx`, toGpx(trip.name, trip.waypoints, trip.track ?? [], BRAND.ascii, trip.waypoints.map((w) => (w.via ? geo.line[w.via] : undefined)).filter((x) => !!x)), 'application/gpx+xml')}>
                <Download size={15} /> {tx('GPX exportieren', 'Export GPX')}
              </button>
              <button className="btn" onClick={() => file.current?.click()}>
                <FileUp size={15} /> {tx('GPX hinzuladen', 'Add GPX')}
              </button>
              <input
                ref={file}
                type="file"
                accept=".gpx,application/gpx+xml,application/xml,text/xml"
                hidden
                onChange={async (e) => {
                  const f = e.target.files?.[0]
                  e.target.value = ''
                  if (!f) return
                  try {
                    const d = await readGpx(f)
                    save({ waypoints: [...trip.waypoints, ...d.waypoints], track: [...(trip.track ?? []), ...(d.track ?? [])].slice(0, 20000) })
                    setMsg(tx(`${d.waypoints.length} Wegpunkte und ${d.track?.length ?? 0} Spurpunkte übernommen.`, `${d.waypoints.length} waypoints and ${d.track?.length ?? 0} track points added.`))
                  } catch (x) {
                    setMsg((x as Error).message)
                  }
                }}
              />
              {trip.waypoints.length > 0 && (
                <>
                  <a className="btn" href={mapsDirections(withVia(trip.waypoints, geo.line))} target="_blank" rel="noopener noreferrer">
                    Google Maps <ArrowUpRight size={14} />
                  </a>
                  <a className="btn" href={osmDirections(withVia(trip.waypoints, geo.line))} target="_blank" rel="noopener noreferrer">
                    OpenStreetMap <ArrowUpRight size={14} />
                  </a>
                </>
              )}
            </div>
            {msg && <p className="small">{msg}</p>}
            {trip.waypoints.length > 10 && <p className="muted small">{tx('Google Maps nimmt höchstens 10 Punkte; der Link wählt sie gleichmäßig aus.', 'Google Maps accepts at most 10 points; the link picks them evenly.')}</p>}
          </div>

          <div className="gcard">
            <h3>Passport</h3>
            {v ? (
              <>
                <p className="small">{tx(`Halte die Fahrt in der Geschichte von ${vehicleTitle(v)} fest.`, `Record the drive in the history of ${vehicleTitle(v)}.`)}</p>
                <button
                  className="btn"
                  onClick={() => {
                    addPassportEntry({ vehicleId: v.id, date: trip.date ?? today(), kind: 'trip', title: trip.name, notes: `${trip.waypoints.map((w) => w.name).join(' → ')}${trip.notes ? `\n${trip.notes}` : ''}` })
                    setMsg(tx('Im Passport eingetragen.', 'Added to passport.'))
                  }}
                >
                  <BookPlus size={15} /> {tx('Fahrt eintragen', 'Log drive')}
                </button>
                {trip.date && <p className="muted small">{tx('Datum', 'Date')}: {fmtDate(trip.date, locale)}</p>}
              </>
            ) : (
              <p className="muted small">{tx('Wähle links ein Auto aus deiner Garage, dann kannst du die Fahrt in dessen Passport eintragen.', 'Choose a car from your garage on the left to log the drive in its passport.')}</p>
            )}
          </div>

          <button
            className="btn danger"
            onClick={() => {
              if (confirm(tx(`Roadtrip „${trip.name}“ löschen?`, `Delete road trip “${trip.name}”?`))) {
                removeTrip(trip.id)
                navigate('drive/builder')
              }
            }}
          >
            <Trash2 size={15} /> {tx('Roadtrip löschen', 'Delete road trip')}
          </button>
        </aside>
      </section>
    </>
  )
}
