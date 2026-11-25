// Werkstätten in der Nähe, passend zu Marke und Alter. Quelle: OpenStreetMap; keine Bewertungen, keine Werbung.
import { ArrowUpRight, MapPin, Phone, Globe } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useT } from '../i18n/i18n.ts'
import { useHome } from '../lib/home.ts'
import { findShops, loadShops, type Hit, type Shop } from '../lib/workshops.ts'
import { HomeField } from './HomeField.tsx'

const COVERED = new Set(['de', 'at', 'ch', 'li', 'lu', 'nl', 'be', 'fr', 'it', 'uk', ''])

export function Workshops({ make, year, limit = 9 }: { make?: string; year?: number; limit?: number }) {
  const { tx, locale } = useT()
  const home = useHome()
  const [all, setAll] = useState<Shop[] | null>(null)
  const [n, setN] = useState(limit)
  useEffect(() => {
    if (!home) return
    let alive = true
    loadShops().then((s) => alive && setAll(s))
    return () => {
      alive = false
    }
  }, [home])
  // Umkreis von allein vergrößern, bis genug Betriebe da sind (seltene Marken)
  const hits = useMemo(() => {
    if (!home || !all) return []
    for (const maxKm of [80, 150, 300]) {
      const h = findShops(all, { make, year, lat: home.lat, lon: home.lon, maxKm })
      if (h.length >= 4 || maxKm === 300) return h
    }
    return []
  }, [all, home, make, year])
  const label = (h: Hit) =>
    h.why === 'make'
      ? tx(make ? `Werkstatt für ${make}` : 'Markenwerkstatt', make ? `${make} workshop` : 'Marque workshop')
      : h.why === 'dealer'
        ? tx(`Markenbetrieb ${make}`, `${make} brand workshop`)
        : h.why === 'family'
          ? tx('Spezialist für ähnliche Marken', 'Specialist for related makes')
          : tx('Oldtimer-Werkstatt', 'Classic car workshop')
  const maps = (q: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`
  const what = [make, year && new Date().getFullYear() - year >= 30 ? tx('Oldtimer', 'classic car') : ''].filter(Boolean).join(' ')
  return (
    <div className="ws">
      <HomeField />
      {home && all && hits.length > 0 && (
        <>
          <div className="ws-grid">
            {hits.slice(0, n).map((h) => (
              <article key={h.s.n + h.s.la} className="ws-card">
                <span className={'ws-tag ' + h.why}>{label(h)}</span>
                <h3>{h.s.n}</h3>
                <p className="muted small">
                  <MapPin size={13} /> {[h.s.a, h.s.c].filter(Boolean).join(', ') || tx('Lage auf der Karte', 'See map')} · <b className="mono">{h.km.toLocaleString(locale, { maximumFractionDigits: h.km < 10 ? 1 : 0 })} km</b>
                </p>
                <div className="row gap wrap">
                  {h.s.w && (
                    <a className="btn small" href={h.s.w} target="_blank" rel="noopener noreferrer">
                      <Globe size={13} /> {tx('Webseite', 'Website')}
                    </a>
                  )}
                  {h.s.t && (
                    <a className="btn small" href={'tel:' + h.s.t.replace(/[^+\d]/g, '')}>
                      <Phone size={13} /> {h.s.t}
                    </a>
                  )}
                  <a className="btn small" href={`https://www.google.com/maps/dir/?api=1&origin=${home.lat},${home.lon}&destination=${h.s.la},${h.s.lo}`} target="_blank" rel="noopener noreferrer">
                    {tx('Route', 'Directions')} <ArrowUpRight size={13} />
                  </a>
                </div>
              </article>
            ))}
          </div>
          {hits.length > n && (
            <button className="btn" onClick={() => setN(n + 12)}>
              {tx(`Mehr zeigen (${hits.length - n})`, `Show more (${hits.length - n})`)}
            </button>
          )}
        </>
      )}
      {home && all && hits.length === 0 && <p className="muted">{COVERED.has(home.cc ?? '') ? tx('Im Umkreis von 300 km ist keine passende Werkstatt eingetragen.', 'No matching workshop is listed within 300 km.') : tx('Für dein Land sind noch keine Werkstätten hinterlegt.', 'No workshops are stored for your country yet.')}</p>}
      {home && (
        <p className="ws-more">
          <a className="link" href={maps(`${what} ${tx('Werkstatt', 'workshop')} ${home.n}`)} target="_blank" rel="noopener noreferrer">
            {tx(`„${what || 'Auto'} Werkstatt ${home.n}“ in Google Maps suchen`, `Search “${what || 'car'} workshop ${home.n}” in Google Maps`)} <ArrowUpRight size={13} />
          </a>
        </p>
      )}
      {home && (
        <p className="muted small">
          {tx('Betriebe', 'Workshops')} ©{' '}
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">
            OpenStreetMap
          </a>{' '}
          (ODbL), {tx('Stand 25.11.2026. Spezialisierung aus Name und Marke erkannt, nicht geprüft; ruf vor dem Besuch an.', 'as of 25 Nov 2026. Specialism derived from name and brand, not verified; call before visiting.')}
        </p>
      )}
    </div>
  )
}
