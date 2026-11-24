// Globus-Hülle: lädt den Canvas-Globus erst, wenn er gebraucht wird. Fällt auf die 2D-Karte zurück, wenn
// reduzierte Bewegung gewünscht ist, und auf eine Länderliste, wenn das Nachladen scheitert (z. B. offline).
import { Component, lazy, Suspense, useMemo, useState, type ReactNode } from 'react'
import { COUNTRIES } from '../data/countries.ts'
import { ROADS } from '../data/roads.ts'
import { useT } from '../i18n/i18n.ts'
import { href, navigate } from '../lib/router.ts'
import type { GlobePoint } from './GlobeCanvas.tsx'

const GlobeCanvas = lazy(() => import('./GlobeCanvas.tsx'))

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
      ...COUNTRIES.map((c) => ({ id: 'c-' + c.id, lat: c.lat, lon: c.lon, label: `${c.flag} ${L(c.name)}`, kind: (c.home ? 'home' : 'country') as GlobePoint['kind'], href: href('drive/atlas/' + c.id) })),
      ...ROADS.map((r) => ({ id: 'r-' + r.id, lat: r.waypoints[0].lat, lon: r.waypoints[0].lon, label: r.name, kind: 'road' as const, href: href('drive/roads/' + r.id) })),
    ],
    [L],
  )
}

export function GlobeView({ compact }: { compact?: boolean }) {
  const points = useGlobePoints()
  const { L } = useT()
  const reduce = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
  const [mode, setMode] = useState<'globe' | 'map'>(reduce ? 'map' : 'globe')
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
          <GlobeCanvas points={points} mode={mode} onSelect={(p) => navigate(p.href.slice(2))} />
        </Suspense>
      </LoadGuard>
      <div className="globe-legend">
        <span>
          <i className="dot home" /> Japan
        </span>
        <span>
          <i className="dot country" /> Märkte & Länder
        </span>
        <span>
          <i className="dot road" /> Roads
        </span>
        <button className="link-btn" onClick={() => setMode(mode === 'globe' ? 'map' : 'globe')}>
          {mode === 'globe' ? '2D-Karte' : '3D-Globus'}
        </button>
      </div>
    </div>
  )
}
