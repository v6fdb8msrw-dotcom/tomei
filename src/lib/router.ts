// Hash-Router (GitHub Pages kennt keine Server-Weiterleitungen). Adressen: #/welt/bereich/id
// Alte Adressen der Version 1 (#/markets, #/import/rechner …) leiten weiter, damit geteilte Links weiter gehen.
import { useEffect, useState } from 'react'
import { flushSync } from 'react-dom'

export type Route = { path: string[]; raw: string }

const LEGACY: Record<string, string> = {
  home: '',
  markets: 'discover/search',
  import: 'discover/calculator',
  service: 'discover/service',
  spots: 'drive/atlas/jp',
  rent: 'drive/rent',
  parts: 'own/build',
}

export function parseHash(hash: string): Route {
  const raw = decodeURIComponent(hash.replace(/^#\/?/, '')).replace(/\/+$/, '')
  const path = raw ? raw.split('/').filter(Boolean) : []
  if (path[0] && path[0] in LEGACY) {
    const rest = path.slice(1)
    // alter Abschnitt „rechner“ heißt jetzt genauso, „anfrage“ ebenfalls → Anker bleiben erhalten
    const target = LEGACY[path[0]].split('/').filter(Boolean)
    return { path: [...target, ...rest], raw }
  }
  return { path, raw }
}

export const href = (path: string) => '#/' + path.replace(/^\/+/, '')

const reduceMotion = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

/** Navigieren mit View Transition (Shared-Element-Übergänge per view-transition-name), sonst sofort */
export function navigate(path: string) {
  const target = href(path)
  if (location.hash === target) return
  location.hash = target
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseHash(location.hash))
  useEffect(() => {
    const on = () => {
      const next = parseHash(location.hash)
      type VT = { ready: Promise<void>; finished: Promise<void>; updateCallbackDone: Promise<void> }
      const doc = document as Document & { startViewTransition?: (cb: () => void) => VT }
      if (doc.startViewTransition && !reduceMotion()) {
        const vt = doc.startViewTransition(() => {
          flushSync(() => setRoute(next))
          scrollTo({ top: 0, behavior: 'instant' })
        })
        // Schnelles Weiterklicken bricht den vorigen Übergang ab; das ist kein Fehler
        const quiet = () => {}
        vt.ready.catch(quiet)
        vt.finished.catch(quiet)
        vt.updateCallbackDone.catch(quiet)
      } else {
        setRoute(next)
        scrollTo({ top: 0, behavior: 'instant' })
      }
    }
    addEventListener('hashchange', on)
    return () => removeEventListener('hashchange', on)
  }, [])
  return route
}

/** Abschnitt per id anspringen (z. B. #/discover/calculator/rechner) */
export function useAnchor(anchor: string | undefined) {
  useEffect(() => {
    if (!anchor) return
    const t = setTimeout(() => document.getElementById(anchor)?.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'start' }), 120)
    return () => clearTimeout(t)
  }, [anchor])
}
