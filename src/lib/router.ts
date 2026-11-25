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

/* Übergang Kachel → Detailseite: Nur das angeklickte Bild bekommt für den Moment einen gemeinsamen Namen.
   Bilder tragen data-vt="road-<id>" (Straßen), "model-<id>" (Modelle) oder "veh-<id>" (Garage). */
const DETAIL: Record<string, string> = { 'drive/roads': 'road-', 'discover/models': 'model-', 'own/garage': 'veh-' }
const vtKey = (p: string[]) => (p.length === 3 && DETAIL[p[0] + '/' + p[1]] ? DETAIL[p[0] + '/' + p[1]] + p[2] : undefined)
function vtElement(key: string): HTMLElement | undefined {
  return [...document.querySelectorAll<HTMLElement>(`[data-vt="${CSS.escape(key)}"]`)].find((el) => {
    const r = el.getBoundingClientRect()
    return r.width > 0 && r.bottom > 0 && r.top < innerHeight
  })
}

// Zurück im Browser: dorthin, wo man vorher in der Liste war
const scrolls = new Map<string, number>()
let byLink = false

/** Navigieren mit View Transition (Shared-Element-Übergänge per view-transition-name), sonst sofort */
export function navigate(path: string) {
  const target = href(path)
  if (location.hash === target) return
  byLink = true
  location.hash = target
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseHash(location.hash))
  useEffect(() => {
    let current = parseHash(location.hash)
    let y = scrollY
    const onScroll = () => (y = scrollY)
    const onClick = (e: MouseEvent) => {
      if ((e.target as Element | null)?.closest?.('a[href^="#"]')) byLink = true
    }
    const on = () => {
      const next = parseHash(location.hash)
      const prev = current
      current = next
      scrolls.set(prev.raw, y)
      const top = byLink ? 0 : (scrolls.get(next.raw) ?? 0)
      byLink = false
      const apply = () => {
        flushSync(() => setRoute(next))
        scrollTo({ top, behavior: 'instant' })
      }
      type VT = { ready: Promise<void>; finished: Promise<void>; updateCallbackDone: Promise<void> }
      const doc = document as Document & { startViewTransition?: (cb: () => void) => VT }
      if (!doc.startViewTransition || reduceMotion() || document.hidden) {
        apply()
        return
      }
      const key = vtKey(next.path) ?? vtKey(prev.path)
      const from = key ? vtElement(key) : undefined
      let to: HTMLElement | undefined
      from?.style.setProperty('view-transition-name', 'tomei-hero')
      const vt = doc.startViewTransition(() => {
        from?.style.removeProperty('view-transition-name')
        apply()
        to = key && from ? vtElement(key) : undefined
        to?.style.setProperty('view-transition-name', 'tomei-hero')
      })
      // Schnelles Weiterklicken bricht den vorigen Übergang ab; das ist kein Fehler
      const quiet = () => {}
      vt.ready.catch(quiet)
      vt.finished.catch(quiet).then(() => to?.style.removeProperty('view-transition-name'))
      vt.updateCallbackDone.catch(quiet)
    }
    addEventListener('hashchange', on)
    addEventListener('scroll', onScroll, { passive: true })
    document.addEventListener('click', onClick, true)
    return () => {
      removeEventListener('hashchange', on)
      removeEventListener('scroll', onScroll)
      document.removeEventListener('click', onClick, true)
    }
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
