// Globus-Hülle: lädt den Canvas-Globus erst, wenn er gebraucht wird. Fällt auf die 2D-Karte zurück, wenn
// reduzierte Bewegung gewünscht ist, und auf eine Länderliste, wenn das Nachladen scheitert (z. B. offline).
import { Component, lazy, Suspense, useMemo, type ReactNode } from 'react'
import { COUNTRIES } from '../data/countries.ts'
import { ROADS } from '../data/roads.ts'
import { useT } from '../i18n/i18n.ts'
import { href, navigate } from '../lib/router.ts'
import type { GlobePoint } from './GlobeCanvas.tsx'
import type { G3Point, G3Route, G3Theme } from './Globe3D.tsx'

const GlobeCanvas = lazy(() => import('./GlobeCanvas.tsx'))
const Globe3D = lazy(() => import('./Globe3D.tsx'))

/** Bremerhaven: Zielhafen aller Importrouten */
export const BREMERHAVEN: [number, number] = [53.54, 8.58]

/** Importrouten: jedes Land mit Markt nach Bremerhaven (Bogen von Land zu Land, kein Seeweg) */
export function importRoutes(active?: string): G3Route[] {
  return COUNTRIES.filter((c) => c.market && c.id !== 'de').map((c) => ({ from: [c.lat, c.lon] as [number, number], to: BREMERHAVEN, kind: 'import' as const, dim: !!active && c.market !== active }))
}

class LoadGuard extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

export function useGlobePoints(): GlobePoint[] {
  const { L } = useT()
  return useMemo(
    () => [
      ...COUNTRIES.map((c) => ({ id: 'c-' + c.id, lat: c.lat, lon: c.lon, label: `${c.flag} ${L(c.name)}`, kind: 'country' as GlobePoint['kind'], href: href('drive/atlas/' + c.id) })),
      ...ROADS.map((r) => ({ id: 'r-' + r.id, lat: r.waypoints[0].lat, lon: r.waypoints[0].lon, label: r.name, kind: 'road' as const, href: href('drive/roads/' + r.id) })),
    ],
    [L],
  )
}

export function GlobeView({ compact, routes, points: own, focus, theme }: { compact?: boolean; routes?: G3Route[]; points?: G3Point[]; focus?: [number, number]; theme?: G3Theme }) {
  const base = useGlobePoints()
  const points = own ?? base
  const { L, lang } = useT()
  const reduce = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
  const mode: 'globe' | 'map' = reduce ? 'map' : 'globe'
  const list = (
    <ul className="globe-list">
      {COUNTRIES.map((c) => (
        <li key={c.id}>
          <a href={href('drive/atlas/' + c.id)}>
            {c.flag} {L(c.name)}
          </a>
        </li>
      ))}
    </ul>
  )
  return (
    <div className={'globe-view' + (compact ? ' compact' : '')}>
      <LoadGuard fallback={list}>
        <Suspense fallback={<div className="globe-ph" aria-hidden />}>
          {mode === 'globe' ? (
            <Globe3D points={own ? own : [...(points as G3Point[]), { id: 'hub', lat: BREMERHAVEN[0], lon: BREMERHAVEN[1], label: '⚓ Bremerhaven', kind: 'hub' }]} routes={routes ?? importRoutes()} focus={focus} theme={theme} onSelect={(p) => p.href && navigate(p.href.slice(2))} />
          ) : (
            <GlobeCanvas points={base} mode="map" onSelect={(p) => navigate(p.href.slice(2))} />
          )}
        </Suspense>
      </LoadGuard>
      <div className="globe-legend">
        <span>
          <i className="dot country" /> {lang === 'en' ? 'Markets & countries' : 'Märkte & Länder'}
        </span>
        <span>
          <i className="dot road" /> Roads
        </span>
        {!own && (
          <span>
            <i className="dot route" /> {lang === 'en' ? 'Import routes to Bremerhaven' : 'Importrouten nach Bremerhaven'}
          </span>
        )}

      </div>
    </div>
  )
}
