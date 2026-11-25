// „Wohin soll's gehen?“: eine Zeile, der Rest wird geplant.
import { Flag, MapPin, Mountain, Route } from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { COUNTRIES, countryById } from '../data/countries.ts'
import { ROADS } from '../data/roads.ts'
import { autoTrip, loadPlaces } from '../lib/autotrip.ts'
import { AREAS, plain, type Place } from '../lib/quick.ts'
import { navigate } from '../lib/router.ts'
import { nowIso, uid, upsertTrip, useStore } from '../store/store.ts'
import { setHome, useHome } from '../lib/home.ts'
import { useCarProfile } from '../lib/useCar.ts'
import { vehicleTitle } from './ui.tsx'
import { useT } from '../i18n/i18n.ts'
import { QuickInput, type Suggestion } from './QuickInput.tsx'
import { roadWaypoints } from './TripPlan.tsx'

/** Vorschläge zum letzten Wort bzw. den letzten Wörtern der Eingabe */
export function placeSuggestions(text: string, places: Place[], L: (x: { de: string; en: string }) => string, only?: 'place'): Suggestion[] {
  const part = text.split(/,|\s+(?:nach|bis|to|via|über|und|and)\s+/i).pop() ?? ''
  const q = plain(part.replace(/^\s*(von|ab|from|nach|to)\s+/i, ''))
  if (q.length < 2) return []
  const out: (Suggestion & { r: number })[] = []
  const hit = (n: string | undefined) => {
    if (!n) return -1
    const t = plain(n)
    return t.startsWith(q) ? 2 : t.includes(' ' + q) ? 1 : -1
  }
  const lead = text.slice(0, text.length - part.length) + (/^\s/.test(part) ? ' ' : '') + (part.match(/^\s*(von|ab|from|nach|to)\s+/i)?.[0].trimStart() ?? '')
  const add = (id: string, n: string, names: (string | undefined)[], sub: string, icon: ReactNode, boost: number) => {
    const r = Math.max(...names.map(hit))
    if (r > 0) out.push({ id, label: n, sub, icon, text: lead + n + ' ', r: r * 10 + boost })
  }
  if (!only) {
    for (const a of AREAS) add('a' + a.id, L(a), [a.de, a.en, ...(a.alias ?? [])], '', <Mountain size={15} />, 6)
    for (const r of ROADS) add('r' + r.id, r.name, [r.name, r.local], countryById(r.country)?.flag ?? '', <Route size={15} />, 5)
    for (const c of COUNTRIES) if (ROADS.some((r) => r.country === c.id)) add('c' + c.id, L(c.name), [c.name.de, c.name.en], c.flag, <Flag size={15} />, 4)
  }
  for (const p of places) add('p' + p.n + p.cc, p.n, [p.n, p.en], countryById(p.cc)?.flag ?? p.cc.toUpperCase(), <MapPin size={15} />, Math.min(3.9, Math.log10(p.pop + 1)))
  return out.sort((a, b) => b.r - a.r).slice(0, 6)
}

export function TripQuick() {
  const { tx, L } = useT()
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [places, setPlaces] = useState<Place[]>([])
  const home = useHome()
  const cars = useStore((s) => s.vehicles)
  const [carId, setCarId] = useState<string | undefined>()
  const owned = cars.find((v) => v.id === carId) ?? cars.find((v) => v.status === 'owned') ?? undefined
  const profile = useCarProfile(owned)
  useEffect(() => {
    let alive = true
    loadPlaces().then((p) => alive && setPlaces(p))
    return () => {
      alive = false
    }
  }, [])
  const sug = useMemo(() => placeSuggestions(q, places, L), [q, places, L])
  const plan = async () => {
    setBusy(true)
    setMsg('')
    try {
      const r = await autoTrip(q, roadWaypoints, home ? { n: home.n, lat: home.lat, lon: home.lon, cc: home.cc ?? '', pop: 1 } : undefined, profile)
      if (r.problem) {
        setMsg(
          r.problem === 'nothing'
            ? tx('Ich habe keinen Ort, keine Gegend und keine Straße erkannt. Nenn zum Beispiel „Dolomiten“, „Stilfser Joch“ oder eine Stadt.', 'I did not recognise a place, area or road. Try “Dolomites”, “Stelvio” or a city.')
            : tx('In dieser Gegend ist noch keine Straße im Explorer. Versuch eine größere Gegend oder ein Land.', 'There is no road in the explorer for this area yet. Try a larger area or a country.'),
        )
        return
      }
      if (r.from && !home) setHome({ n: r.from.n, lat: r.from.lat, lon: r.from.lon, cc: r.from.cc })
      const t = nowIso()
      const id = uid()
      upsertTrip({ id, name: r.name, roadId: r.roads[0]?.id, vehicleId: owned?.id, waypoints: r.waypoints, plan: r.wish.days ? { days: r.wish.days } : undefined, createdAt: t, updatedAt: t })
      navigate('drive/builder/' + id)
    } finally {
      setBusy(false)
    }
  }
  return (
    <QuickInput
      value={q}
      onChange={setQ}
      onSubmit={plan}
      onPick={(s) => setQ(s.text ?? s.label)}
      suggestions={sug}
      busy={busy}
      label={tx('Wohin soll es gehen?', 'Where to?')}
      placeholder={tx('Wohin? z. B. München nach Dolomiten, 3 Tage', 'Where to? e.g. Munich to Dolomites, 3 days')}
      button={tx('Planen', 'Plan')}
      examples={[tx('München nach Stilfser Joch, 2 Tage', 'Munich to Stelvio, 2 days'), tx('Dolomiten, Wochenende', 'Dolomites, weekend'), tx('Schottland, 5 Tage', 'Scotland, 5 days'), tx('Zürich, Schweizer Alpen, 3 Tage', 'Zürich, Swiss Alps, 3 days')]}
    >
      {(home || owned) && (
        <p className="quick-home small">
          {home && (
            <>
              {tx('Start', 'Start')}: <b>{home.n}</b>{' '}
              <button type="button" className="linkish" onClick={() => setHome(null)}>
                {tx('vergessen', 'forget')}
              </button>
            </>
          )}
          {home && owned && ' · '}
          {owned && (
            <>
              {tx('Mit', 'With')}{' '}
              {cars.length > 1 ? (
                <select className="chip" value={owned.id} onChange={(e) => setCarId(e.target.value)} aria-label={tx('Auto', 'Car')}>
                  {cars.map((c) => (
                    <option key={c.id} value={c.id}>
                      {vehicleTitle(c)}
                    </option>
                  ))}
                </select>
              ) : (
                <b>{vehicleTitle(owned)}</b>
              )}
            </>
          )}
        </p>
      )}
      {msg && (
        <p className="quick-msg" role="status">
          {msg}
        </p>
      )}
    </QuickInput>
  )
}
