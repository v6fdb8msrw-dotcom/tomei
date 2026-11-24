// 3D-Globus (orthografische Projektion auf Canvas) und 2D-Weltkarte als Fallback.
// Wird nur bei Bedarf geladen (React.lazy), zusammen mit den Landflächen aus world-atlas (Natural Earth, gemeinfrei).
import { geoEquirectangular, geoGraticule10, geoOrthographic, geoPath, geoDistance, type GeoPermissibleObjects } from 'd3-geo'
import { useEffect, useMemo, useRef, useState } from 'react'
import { feature } from 'topojson-client'
import type { GeometryCollection, Topology } from 'topojson-specification'
import land110 from 'world-atlas/land-110m.json'

export type GlobePoint = { id: string; lat: number; lon: number; label: string; kind: 'country' | 'road' | 'home'; href: string }

const LAND = feature(land110 as unknown as Topology, (land110 as unknown as Topology).objects.land as GeometryCollection) as unknown as GeoPermissibleObjects
const GRAT = geoGraticule10()

const css = (name: string, fallback: string) => {
  if (typeof getComputedStyle === 'undefined') return fallback
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback
}

export default function GlobeCanvas({ points, mode = 'globe', start = [-138, -30], onSelect }: { points: GlobePoint[]; mode?: 'globe' | 'map'; start?: [number, number]; onSelect: (p: GlobePoint) => void }) {
  return mode === 'map' ? <WorldMap points={points} onSelect={onSelect} /> : <Globe points={points} start={start} onSelect={onSelect} />
}

function Globe({ points, start, onSelect }: { points: GlobePoint[]; start: [number, number]; onSelect: (p: GlobePoint) => void }) {
  const wrap = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const rot = useRef<[number, number]>([start[0], start[1]])
  const drag = useRef<{ x: number; y: number; r: [number, number]; moved: boolean } | null>(null)
  const idle = useRef(0)
  const [hover, setHover] = useState<{ p: GlobePoint; x: number; y: number } | null>(null)
  const size = useRef({ w: 600, h: 600, dpr: 1 })

  useEffect(() => {
    const c = canvas.current!
    const ctx = c.getContext('2d')
    if (!ctx) return
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    const colors = {
      sphere: css('--porcelain', '#FCFBF8'),
      land: css('--globe-land', '#D5D7D1'),
      line: 'rgba(34,38,36,0.07)',
      edge: 'rgba(34,38,36,0.16)',
      petrol: css('--petrol', '#294D47'),
      verm: css('--vermilion', '#D64B3C'),
      carbon: css('--carbon', '#222624'),
    }
    const proj = geoOrthographic().clipAngle(90)
    const path = geoPath(proj, ctx)
    let raf = 0
    let visible = true
    let last = performance.now()

    const resize = () => {
      const r = wrap.current!.getBoundingClientRect()
      const dpr = Math.min(2, devicePixelRatio || 1)
      const s = Math.max(240, Math.min(r.width, 720))
      size.current = { w: s, h: s, dpr }
      c.width = s * dpr
      c.height = s * dpr
      c.style.width = s + 'px'
      c.style.height = s + 'px'
    }
    const draw = () => {
      const { w, h, dpr } = size.current
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)
      proj.scale(w / 2 - 8).translate([w / 2, h / 2]).rotate([rot.current[0], rot.current[1], 0])
      // Kugel mit weichem Licht von links oben
      const g = ctx.createRadialGradient(w * 0.36, h * 0.3, w * 0.05, w / 2, h / 2, w / 2)
      g.addColorStop(0, '#ffffff')
      g.addColorStop(1, colors.sphere)
      ctx.beginPath()
      path({ type: 'Sphere' })
      ctx.fillStyle = g
      ctx.fill()
      ctx.lineWidth = 1
      ctx.strokeStyle = colors.edge
      ctx.stroke()
      ctx.beginPath()
      path(GRAT)
      ctx.strokeStyle = colors.line
      ctx.stroke()
      ctx.beginPath()
      path(LAND)
      ctx.fillStyle = colors.land
      ctx.fill()
      // Markierungen auf der sichtbaren Seite
      const center: [number, number] = [-rot.current[0], -rot.current[1]]
      for (const p of points) {
        if (geoDistance([p.lon, p.lat], center) > Math.PI / 2 - 0.05) continue
        const xy = proj([p.lon, p.lat])
        if (!xy) continue
        const r = p.kind === 'home' ? 6 : p.kind === 'country' ? 4.2 : 3.4
        if (p.kind === 'home') {
          ctx.beginPath()
          ctx.arc(xy[0], xy[1], 13, 0, Math.PI * 2)
          ctx.fillStyle = 'rgba(214,75,60,0.14)'
          ctx.fill()
        }
        ctx.beginPath()
        ctx.arc(xy[0], xy[1], r, 0, Math.PI * 2)
        ctx.fillStyle = p.kind === 'road' ? colors.verm : p.kind === 'home' ? colors.verm : colors.petrol
        ctx.fill()
        ctx.lineWidth = 1.5
        ctx.strokeStyle = '#ffffff'
        ctx.stroke()
      }
    }
    const loop = (t: number) => {
      const dt = Math.min(64, t - last)
      last = t
      if (!drag.current && !reduce && t > idle.current) rot.current = [rot.current[0] + dt * 0.006, rot.current[1]]
      if (visible) draw()
      raf = requestAnimationFrame(loop)
    }
    resize()
    draw()
    const ro = new ResizeObserver(() => {
      resize()
      draw()
    })
    ro.observe(wrap.current!)
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting))
    io.observe(c)
    if (!reduce) raf = requestAnimationFrame(loop)
    // Zeichnen bei Drag auch ohne Animation
    const redraw = () => draw()
    c.addEventListener('tomei-redraw', redraw)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      c.removeEventListener('tomei-redraw', redraw)
    }
  }, [points])

  const pick = (x: number, y: number) => {
    const { w, h } = size.current
    const proj = geoOrthographic().clipAngle(90).scale(w / 2 - 8).translate([w / 2, h / 2]).rotate([rot.current[0], rot.current[1], 0])
    const center: [number, number] = [-rot.current[0], -rot.current[1]]
    let best: { p: GlobePoint; d: number; x: number; y: number } | null = null
    for (const p of points) {
      if (geoDistance([p.lon, p.lat], center) > Math.PI / 2 - 0.05) continue
      const xy = proj([p.lon, p.lat])
      if (!xy) continue
      const d = Math.hypot(xy[0] - x, xy[1] - y)
      if (d < 14 && (!best || d < best.d)) best = { p, d, x: xy[0], y: xy[1] }
    }
    return best
  }
  const local = (e: React.PointerEvent) => {
    const r = canvas.current!.getBoundingClientRect()
    return [e.clientX - r.left, e.clientY - r.top] as const
  }

  return (
    <div className="globe" ref={wrap}>
      <canvas
        ref={canvas}
        role="img"
        aria-label="Drehbarer Globus mit Märkten und Straßen"
        onPointerDown={(e) => {
          ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
          drag.current = { x: e.clientX, y: e.clientY, r: [...rot.current] as [number, number], moved: false }
        }}
        onPointerMove={(e) => {
          const d = drag.current
          if (d) {
            const dx = e.clientX - d.x
            const dy = e.clientY - d.y
            if (Math.abs(dx) + Math.abs(dy) > 3) d.moved = true
            rot.current = [d.r[0] + dx * 0.35, Math.max(-60, Math.min(60, d.r[1] - dy * 0.35))]
            canvas.current!.dispatchEvent(new Event('tomei-redraw'))
            setHover(null)
            return
          }
          const [x, y] = local(e)
          const b = pick(x, y)
          setHover(b ? { p: b.p, x: b.x, y: b.y } : null)
          canvas.current!.style.cursor = b ? 'pointer' : 'grab'
        }}
        onPointerUp={(e) => {
          const d = drag.current
          drag.current = null
          idle.current = performance.now() + 2500
          if (d && !d.moved) {
            const [x, y] = local(e)
            const b = pick(x, y)
            if (b) onSelect(b.p)
          }
        }}
        onPointerLeave={() => setHover(null)}
      />
      {hover && (
        <div className="globe-tip" style={{ left: hover.x, top: hover.y }}>
          {hover.p.label}
        </div>
      )}
    </div>
  )
}

/** 2D-Fallback: Weltkarte als SVG mit denselben Punkten, als Links bedienbar (Tastatur, Screenreader) */
function WorldMap({ points, onSelect }: { points: GlobePoint[]; onSelect: (p: GlobePoint) => void }) {
  const W = 960
  const H = 480
  const proj = useMemo(() => geoEquirectangular().fitSize([W, H], { type: 'Sphere' }), [])
  const d = useMemo(() => geoPath(proj)(LAND) ?? '', [proj])
  return (
    <svg className="worldmap" viewBox={`0 0 ${W} ${H}`} role="group" aria-label="Weltkarte mit Märkten und Straßen">
      <rect width={W} height={H} rx="18" className="wm-sea" />
      <path d={d} className="wm-land" />
      {points.map((p) => {
        const xy = proj([p.lon, p.lat])
        if (!xy) return null
        return (
          <a key={p.id} href={p.href} onClick={(e) => (e.preventDefault(), onSelect(p))} aria-label={p.label}>
            <circle cx={xy[0]} cy={xy[1]} r={p.kind === 'home' ? 7 : 5} className={'wm-pt k-' + p.kind}>
              <title>{p.label}</title>
            </circle>
          </a>
        )
      })}
    </svg>
  )
}
