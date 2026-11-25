// Tagesetappen und Kosten eines Roadtrips. Rechnet im Browser, fragt keinen Routendienst.
import { Plus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { ROADS } from '../data/roads.ts'
import { loadTerrain } from '../lib/terrain.ts'
import { haversineKm } from '../lib/gpx.ts'
import { DEFAULT_DETOUR, legsOf, splitDays, tripCost } from '../lib/tripplan.ts'
import type { Trip, Vehicle, Waypoint } from '../store/schema.ts'
import { SourceLink, fmtDate, vehicleTitle } from './ui.tsx'
import { Details } from './QuickInput.tsx'
import { useCarProfile } from '../lib/useCar.ts'
import { suits } from '../lib/carprofile.ts'
import { useT } from '../i18n/i18n.ts'

/** EU-Durchschnitt Super 95 mit Steuern */
export const FUEL = { eur: 1.83, date: '16.11.2026', url: 'https://www.fuel-prices.eu/', label: 'EU Weekly Oil Bulletin' }
/** Annahmen, solange nichts eingetragen ist */
const ASSUME = { consumption: 9, hotel: 100 }

/** Wegpunkte einer Explorer-Straße: mit echtem Verlauf Start und Ziel, sonst die Orte der Straße */
export async function roadWaypoints(roadId: string, last?: Waypoint): Promise<Waypoint[]> {
  const r = ROADS.find((x) => x.id === roadId)
  if (!r) return []
  const t = await loadTerrain(roadId)
  const g = t?.r
  if (!g || r.loop || r.kind === 'track' || haversineKm({ lat: g[0][0], lon: g[0][1] }, { lat: g[g.length - 1][0], lon: g[g.length - 1][1] }) < 0.3) return r.waypoints.map((w) => ({ ...w }))
  const a = { lat: g[0][0], lon: g[0][1] }
  const b = { lat: g[g.length - 1][0], lon: g[g.length - 1][1] }
  const flip = last ? haversineKm(last, b) < haversineKm(last, a) : false
  return [
    { name: `${r.name} · A`, ...(flip ? b : a), road: roadId },
    { name: `${r.name} · B`, ...(flip ? a : b), via: roadId },
  ]
}

/** Länge und Verlauf aller Explorer-Straßen, die im Roadtrip vorkommen */
export function useRoadGeo(wps: Waypoint[]) {
  const ids = [...new Set(wps.map((w) => w.via).filter((x): x is string => !!x))].sort().join(',')
  const [geo, setGeo] = useState<{ km: Record<string, number>; line: Record<string, [number, number][]> }>({ km: {}, line: {} })
  useEffect(() => {
    let alive = true
    Promise.all(ids.split(',').filter(Boolean).map(async (id) => [id, await loadTerrain(id)] as const)).then((all) => {
      if (!alive) return
      const km: Record<string, number> = {}
      const line: Record<string, [number, number][]> = {}
      for (const [id, t] of all)
        if (t?.r && t.len) {
          km[id] = t.len
          line[id] = t.r
        }
      setGeo({ km, line })
    })
    return () => {
      alive = false
    }
  }, [ids])
  return geo
}

export function TripPlan({ trip, vehicle, save }: { trip: Trip; vehicle?: Vehicle; save: (p: Partial<Trip>) => void }) {
  const { tx, L, locale } = useT()
  const geo = useRoadGeo(trip.waypoints)
  const car = useCarProfile(vehicle)
  const plan = trip.plan ?? {}
  const o = vehicle?.ownership
  const detour = plan.detour ?? DEFAULT_DETOUR
  
  const consumption = plan.consumption ?? (o?.consumption || car?.consumption || ASSUME.consumption)
  const fuelPrice = plan.fuelPrice ?? (o?.fuelPrice || FUEL.eur)
  const legs = useMemo(() => legsOf(trip.waypoints, geo.km, detour), [trip.waypoints, geo, detour])
  const hotel = plan.hotel ?? ASSUME.hotel
  const total0 = legs.reduce((s2, l) => s2 + l.km, 0)
  // Wunsch „3 Tage“ verteilt die Strecke gleichmäßig, sonst höchstens 320 km am Tag
  const maxKm = plan.maxKm ?? (plan.days ? Math.max(120, Math.ceil(((total0 / plan.days) * 1.15) / 10) * 10) : (car?.kmPerDay ?? 320))
  const days = useMemo(() => splitDays(legs, maxKm), [legs, maxKm])
  const km = legs.reduce((s, l) => s + l.km, 0)
  const exactKm = legs.filter((l) => l.exact).reduce((s, l) => s + l.km, 0)
  const nights = Math.max(0, days.length - 1)
  const cost = tripCost(km, { consumption, fuelPrice, nights, hotel, tolls: plan.tolls ?? 0 })
  const stops = car ? Math.floor(km / car.rangeKm) : 0
  const bad = car ? [...new Set([...trip.waypoints.map((w) => w.via).filter((x): x is string => !!x), ...(trip.roadId ? [trip.roadId] : [])])].filter((id) => !suits(id, car)) : []
  const nf = (n: number, d = 0) => n.toLocaleString(locale, { maximumFractionDigits: d })
  const eur = (n: number) => n.toLocaleString(locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
  const set = (k: keyof NonNullable<Trip['plan']>, v: string) => {
    const n = parseFloat(v.replace(',', '.'))
    save({ plan: { ...plan, [k]: Number.isFinite(n) && n >= 0 ? n : undefined, ...(k === 'days' ? { maxKm: undefined } : {}) } })
  }
  const field = (k: keyof NonNullable<Trip['plan']>, label: string, val: number, step = 1) => (
    <label className="field">
      <span className="f-label">{label}</span>
      <input className="input" type="number" min={0} step={step} value={val || ''} onChange={(e) => set(k, e.target.value)} />
    </label>
  )
  const date = (i: number) => {
    if (!trip.date) return ''
    const d = new Date(trip.date + 'T12:00:00')
    d.setDate(d.getDate() + i)
    return fmtDate(d.toISOString().slice(0, 10), locale)
  }

  // Straßen in der Nähe des letzten Punkts (oder mitten auf der Route), die noch nicht dabei sind
  const near = useMemo(() => {
    if (!trip.waypoints.length) return []
    const used = new Set(trip.waypoints.map((w) => w.via))
    const names = new Set(trip.waypoints.map((w) => w.name))
    return ROADS.filter((r) => suits(r.id, car) && !used.has(r.id) && r.id !== trip.roadId && !r.waypoints.every((w) => names.has(w.name)))
      .map((r) => ({ r, km: Math.min(...r.waypoints.flatMap((w) => trip.waypoints.map((p) => haversineKm(w, p)))) }))
      .filter((x) => x.km < 220)
      .sort((a, b) => a.km - b.km)
      .slice(0, 5)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip.waypoints, trip.roadId, car?.low, car?.wide])

  if (!trip.waypoints.length) return null
  return (
    <>
      {legs.length > 0 && (
        <div className="trip-sum">
          <div>
            <b className="mono">{nf(km)} km</b>
            <span>{exactKm > km * 0.98 ? tx('gesamt', 'total') : tx('etwa, gesamt', 'approx. total')}</span>
          </div>
          <div>
            <b className="mono">{days.length}</b>
            <span>{days.length === 1 ? tx('Tag', 'day') : tx('Tage', 'days')}</span>
          </div>
          <div>
            <b className="mono">{new Set(legs.map((l) => l.roadId).filter(Boolean)).size}</b>
            <span>{tx('Traumstraßen', 'dream roads')}</span>
          </div>
          {stops > 0 && (
            <div>
              <b className="mono">{stops}</b>
              <span>{tx('Tankstopps', 'fuel stops')}</span>
            </div>
          )}
          <div>
            <b className="mono">≈ {eur(cost.total)}</b>
            <span>
              {tx('Sprit', 'Fuel')} {eur(cost.fuel)}
              {nights > 0 && ` + ${nights} ${nights === 1 ? tx('Nacht', 'night') : tx('Nächte', 'nights')}`}
            </span>
          </div>
        </div>
      )}
      {car && legs.length > 0 && (car.why.length > 0 || bad.length > 0) && (
        <div className="gcard trip-car">
          <h3>{vehicle ? vehicleTitle(vehicle) : ''}</h3>
          <ul>
            {car.why.map((w) => (
              <li key={w.de}>{L(w)}</li>
            ))}
            <li>{tx(`Reichweite etwa ${nf(car.rangeKm)} km (Annahme bei ${nf(car.consumption, 1)} l/100 km)`, `Range around ${nf(car.rangeKm)} km (assumed at ${nf(car.consumption, 1)} l/100 km)`)}</li>
          </ul>
          {bad.length > 0 && (
            <p className="small">
              <b>{tx('Passt nicht gut zu deinem Auto:', 'Not a good match for your car:')}</b> {bad.map((id) => ROADS.find((r) => r.id === id)?.name).join(', ')}
            </p>
          )}
        </div>
      )}
      {legs.length > 0 && (
        <div className="gcard">
          <h3>
            {tx('Tagesetappen', 'Daily stages')} <span className="muted mono small">{days.length} {days.length === 1 ? tx('Tag', 'day') : tx('Tage', 'days')} · {nf(km)} km</span>
          </h3>
          <ol className="days">
            {days.map((d, i) => (
              <li key={i}>
                <div className="days-h">
                  <b>
                    {tx('Tag', 'Day')} {i + 1}
                  </b>
                  <span className="muted small">{date(i)}</span>
                  <span className="mono">{nf(d.km)} km</span>
                </div>
                <div className="days-bar" aria-hidden>
                  {d.legs.map((l) => (
                    <i key={l.to} className={l.exact ? 'road' : ''} style={{ flexGrow: Math.max(0.5, l.km) }} />
                  ))}
                </div>
                {d.legs.map((l) => (
                  <p key={l.to} className="small">
                    {trip.waypoints[l.from].name} → {trip.waypoints[l.to].name} <span className="mono muted">{l.exact ? nf(l.km, 1) : '≈ ' + nf(l.km)} km</span>
                  </p>
                ))}
                {d.legs.some((l) => l.km > maxKm) && <p className="small muted">{tx('Eine Etappe ist länger als dein Tagesziel. Setz einen Zwischenstopp.', 'One stage exceeds your daily target. Add a stop.')}</p>}
              </li>
            ))}
          </ol>
          <p className="muted small">
            {tx(`${nf(exactKm)} km auf Straßen mit echtem Verlauf (© OpenStreetMap, ODbL), ${nf(km - exactKm)} km Verbindungen geschätzt: Luftlinie mal Umwegfaktor. Den genauen Weg zeigt der Routenplaner.`, `${nf(exactKm)} km on roads with real geometry (© OpenStreetMap, ODbL), ${nf(km - exactKm)} km of connections estimated: straight line times detour factor. The route planner shows the exact way.`)}
          </p>
        </div>
      )}
      {near.length > 0 && (
        <div className="gcard">
          <h3>{tx('Straßen in der Nähe', 'Roads nearby')}</h3>
          <div className="row gap wrap">
            {near.map(({ r, km: k }) => (
              <button key={r.id} className="btn small" onClick={async () => save({ waypoints: [...trip.waypoints, ...(await roadWaypoints(r.id, trip.waypoints[trip.waypoints.length - 1]))] })}>
                <Plus size={14} /> {r.name} <span className="muted">{nf(k)} km</span>
              </button>
            ))}
          </div>
        </div>
      )}
      {legs.length > 0 && (
        <Details title={tx('Annahmen anpassen: Tage, Verbrauch, Hotel', 'Adjust assumptions: days, consumption, hotel')}>
          <div className="fields two">
            {field('days', tx('Reisetage', 'Travel days'), plan.days ?? days.length)}
            {field('maxKm', tx('Höchstens km pro Tag', 'Max. km per day'), maxKm, 10)}
            {field('detour', tx('Umwegfaktor der Verbindungen', 'Detour factor for connections'), detour, 0.05)}
            {field('consumption', tx('Verbrauch (l/100 km)', 'Consumption (l/100 km)'), consumption, 0.1)}
            {field('fuelPrice', tx('Spritpreis (€/l)', 'Fuel price (€/l)'), fuelPrice, 0.01)}
            {field('hotel', tx('Übernachtung (€)', 'Hotel per night (€)'), hotel)}
            {field('tolls', tx('Maut, Fähren (€)', 'Tolls, ferries (€)'), plan.tolls ?? 0)}
          </div>
          <p className="muted small">
            {tx(`Ohne eigene Angaben rechnet die Seite mit Annahmen: ${nf(ASSUME.consumption)} l/100 km, ${eur(ASSUME.hotel)} pro Nacht, ${nf(FUEL.eur, 2)} €/l (EU-Durchschnitt Super 95 vom ${FUEL.date}).`, `Without your own values the site uses assumptions: ${nf(ASSUME.consumption)} l/100 km, ${eur(ASSUME.hotel)} per night, €${nf(FUEL.eur, 2)}/l (EU average Super 95 of ${FUEL.date}).`)}{' '}
            <SourceLink url={FUEL.url}>{FUEL.label}</SourceLink>
          </p>
        </Details>
      )}
    </>
  )
}
