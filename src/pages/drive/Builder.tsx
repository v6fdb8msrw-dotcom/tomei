// Roadtrip-Builder: eigene Routen aus Wegpunkten, GPX-Import und -Export, verknüpft mit Garage und Passport.
import { ArrowDown, ArrowUp, ArrowUpRight, BookPlus, Download, FileUp, Plus, Trash2 } from 'lucide-react'
import { lazy, Suspense, useMemo, useRef, useState } from 'react'
import { BRAND } from '../../config/brand.ts'
import { ROADS, roadImg } from '../../data/roads.ts'
import { EmptyState, Note, NotFound, PageHead, VehicleSelect, fmtDate, img, today, vehicleTitle } from '../../components/ui.tsx'
import { mapsDirections, osmDirections, parseGpx, pathKm, toGpx } from '../../lib/gpx.ts'
import { href, navigate } from '../../lib/router.ts'
import { addPassportEntry, downloadFile, nowIso, removeTrip, uid, upsertTrip, useStore } from '../../store/store.ts'
import type { Trip, Waypoint } from '../../store/schema.ts'
import { useT } from '../../i18n/i18n.ts'

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
function RouteSketch({ trip }: { trip: Trip }) {
  const pts = useMemo(() => {
    const all: [number, number][] = [...(trip.track ?? []), ...trip.waypoints.map((w) => [w.lat, w.lon] as [number, number])]
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
    const W = 600
    const H = 300
    const pad = 28
    const s = Math.min((W - 2 * pad) / w, (H - 2 * pad) / h)
    const ox = (W - w * s) / 2
    const oy = (H - h * s) / 2
    const xy = (lat: number, lon: number) => [ox + (lon - minLon) * k * s, H - (oy + (lat - minLat) * s)] as const
    const step = Math.max(1, Math.floor((trip.track?.length ?? 0) / 1500))
    return {
      W,
      H,
      track: trip.track?.filter((_, i) => i % step === 0).map((p) => xy(p[0], p[1]).join(',')).join(' '),
      line: trip.waypoints.map((p) => xy(p.lat, p.lon).join(',')).join(' '),
      wps: trip.waypoints.map((p) => ({ n: p.name, xy: xy(p.lat, p.lon) })),
    }
  }, [trip])
  if (!pts) return <div className="sketch empty-sketch">Noch keine Punkte</div>
  return (
    <svg className="sketch" viewBox={`0 0 ${pts.W} ${pts.H}`} role="img" aria-label="Route sketch">
      <defs>
        <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
          <path d="M 30 0 L 0 0 0 30" className="sk-grid" />
        </pattern>
      </defs>
      <rect width={pts.W} height={pts.H} rx="14" fill="url(#grid)" className="sk-bg" />
      {pts.track && <polyline points={pts.track} className="sk-track" />}
      {!pts.track && trip.waypoints.length > 1 && <polyline points={pts.line} className="sk-line" />}
      {pts.wps.map((w, i) => (
        <g key={i}>
          <circle cx={w.xy[0]} cy={w.xy[1]} r={i === 0 || i === pts.wps.length - 1 ? 6 : 4.5} className={i === 0 ? 'sk-start' : i === pts.wps.length - 1 ? 'sk-end' : 'sk-pt'} />
          <text x={w.xy[0] + 9} y={w.xy[1] - 8} className="sk-label">
            {w.n}
          </text>
        </g>
      ))}
    </svg>
  )
}

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
            {tx('Deine Route. ', 'Your route. ')}<em>{tx('Deine Regeln.', 'Your rules.')}</em>
          </>
        }
        sub={tx('Wegpunkte setzen, Straßen aus dem Explorer übernehmen, GPX-Dateien aus Navi oder App einlesen und wieder ausgeben. Alles bleibt auf deinem Gerät.', 'Set waypoints, take roads from the explorer, read GPX files from your sat nav or app and write them back out. Everything stays on your device.')}
        image={roadImg('atlantic')}
      >
        <div className="row gap wrap">
          <button className="btn primary" onClick={() => create(newTrip())}>
            <Plus size={16} /> {tx('Neuer Roadtrip', 'New road trip')}
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
                    <img src={tr.roadId ? roadImg(tr.roadId) : img('fuji')} alt="" loading="lazy" />
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
  const { tx, locale } = useT()
  const trip = useStore((s) => s.trips.find((t) => t.id === id))
  const vehicles = useStore((s) => s.vehicles)
  const [wp, setWp] = useState({ name: '', lat: '', lon: '' })
  const [roadPick, setRoadPick] = useState('')
  const [msg, setMsg] = useState('')
  const file = useRef<HTMLInputElement>(null)
  if (!trip) return <NotFound />
  const save = (patch: Partial<Trip>) => upsertTrip({ ...trip, ...patch })
  const move = (i: number, d: number) => {
    const w = [...trip.waypoints]
    const j = i + d
    if (j < 0 || j >= w.length) return
    ;[w[i], w[j]] = [w[j], w[i]]
    save({ waypoints: w })
  }
  const lat = parseFloat(wp.lat.replace(',', '.'))
  const lon = parseFloat(wp.lon.replace(',', '.'))
  const okPt = Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180
  const km = pathKm(trip.track?.length ? trip.track.map(([la, lo]) => ({ lat: la, lon: lo })) : trip.waypoints)
  const road = ROADS.find((r) => r.id === trip.roadId)
  const v = vehicles.find((x) => x.id === trip.vehicleId)

  return (
    <>
      <PageHead eyebrow="Roadtrip-Builder" title={trip.name || 'Roadtrip'} back={{ to: 'drive/builder', label: tx('Alle Roadtrips', 'All road trips') }} sub={road ? tx(`Basiert auf ${road.name}.`, `Based on ${road.name}.`) : tx('Eigene Route.', 'Custom route.')} />
      <section className="section builder">
        <div className="builder-main">
          <div className="gcard">
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
          </div>

          {trip.waypoints.length > 0 ? (
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
            <RouteSketch trip={trip} />
          )}
          <p className="muted small">
            {trip.waypoints.length} {tx('Wegpunkte', 'waypoints')}{trip.track?.length ? `, ${trip.track.length.toLocaleString(locale)} ${tx('Spurpunkte aus GPX', 'track points from GPX')}` : ''} · {km.toLocaleString(locale, { maximumFractionDigits: 0 })} {tx('km Luftlinie (keine Straßenlänge)', 'km straight-line (not road distance)')}
          </p>

          <div className="gcard">
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
                    <button className="icon-btn" onClick={() => save({ waypoints: trip.waypoints.filter((_, k) => k !== i) })} aria-label={tx('Entfernen', 'Remove')}>
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
                onClick={() => {
                  const r = ROADS.find((x) => x.id === roadPick)!
                  save({ waypoints: [...trip.waypoints, ...r.waypoints], roadId: trip.roadId ?? r.id })
                  setRoadPick('')
                }}
              >
                {tx('Anhängen', 'Append')}
              </button>
            </div>
            <p className="muted small">{tx('Koordinaten findest du z. B. per Rechtsklick in OpenStreetMap oder Google Maps.', 'You can get coordinates e.g. by right-clicking in OpenStreetMap or Google Maps.')}</p>
          </div>
        </div>

        <aside className="builder-side">
          <div className="gcard">
            <h3>{tx('Mitnehmen', 'Take along')}</h3>
            <div className="stack-btns">
              <button className="btn" disabled={!trip.waypoints.length && !trip.track?.length} onClick={() => downloadFile(`${(trip.name || 'roadtrip').replace(/[^\w-]+/g, '_')}.gpx`, toGpx(trip.name, trip.waypoints, trip.track ?? [], BRAND.ascii), 'application/gpx+xml')}>
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
                  <a className="btn" href={mapsDirections(trip.waypoints)} target="_blank" rel="noopener noreferrer">
                    Google Maps <ArrowUpRight size={14} />
                  </a>
                  <a className="btn" href={osmDirections(trip.waypoints)} target="_blank" rel="noopener noreferrer">
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
