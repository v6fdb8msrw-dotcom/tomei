// Schlichter, einfarbiger 3D-Globus mit roten Routen (three.js). Landflächen aus Natural Earth (world-atlas, gemeinfrei). Routen sind Bögen von Land zu Land, keine exakten Wege. Mit der Maus drehen,
// Punkte antippen. Rendert nur, solange der Globus sichtbar ist; keine Anfragen an fremde Server.
import { geoEquirectangular, geoPath } from 'd3-geo'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { feature, mesh } from 'topojson-client'
import type { GeometryCollection, Topology } from 'topojson-specification'
import world from 'world-atlas/countries-110m.json'

export type G3Point = { id: string; lat: number; lon: number; label: string; kind: 'home' | 'country' | 'road' | 'stop' | 'hub'; href?: string }
export type G3Route = { from: [number, number]; to: [number, number]; kind?: 'import' | 'trip'; dim?: boolean }

// Farbschemata: schlicht und einfarbig, Routen immer rot. Je Abschnitt wählbar.
export type G3Theme = 'graphite' | 'stone' | 'petrol'
const THEMES: Record<G3Theme, { ocean: string; land: string; border: string; marker: number; ring: number; light: number }> = {
  graphite: { ocean: '#1E2223', land: '#4A4F4E', border: '#2C3130', marker: 0xf4f2ed, ring: 0x1e2223, light: 2.2 },
  stone: { ocean: '#C9CBC6', land: '#9EA29F', border: '#B6B9B4', marker: 0x222624, ring: 0xf4f2ed, light: 2.4 },
  petrol: { ocean: '#2C4A46', land: '#6F8C86', border: '#3D5B56', marker: 0xf4f2ed, ring: 0x2c4a46, light: 2.3 },
}
const RED = 0xd64b3c

/** Textur des Globus: plattkarten-projizierte Länder, eingefärbt nach Rolle */
function makeTexture(th: (typeof THEMES)[G3Theme]): HTMLCanvasElement {
  const W = 2048
  const H = 1024
  const cv = document.createElement('canvas')
  cv.width = W
  cv.height = H
  const ctx = cv.getContext('2d')!
  ctx.fillStyle = th.ocean
  ctx.fillRect(0, 0, W, H)
  const proj = geoEquirectangular().scale(W / (2 * Math.PI)).translate([W / 2, H / 2])
  const path = geoPath(proj, ctx)
  const topo = world as unknown as Topology<{ countries: GeometryCollection<{ name: string }> }>
  ctx.beginPath()
  path(feature(topo, topo.objects.countries))
  ctx.fillStyle = th.land
  ctx.fill()
  ctx.beginPath()
  path(mesh(topo, topo.objects.countries, (a, b) => a !== b))
  ctx.strokeStyle = th.border
  ctx.lineWidth = 1
  ctx.stroke()
  return cv
}

/** Punkt auf der Kugel, passend zur UV-Abbildung von SphereGeometry */
function toVec(lat: number, lon: number, r = 1): THREE.Vector3 {
  const phi = ((lon + 180) * Math.PI) / 180
  const theta = ((90 - lat) * Math.PI) / 180
  return new THREE.Vector3(-Math.cos(phi) * Math.sin(theta) * r, Math.cos(theta) * r, Math.sin(phi) * Math.sin(theta) * r)
}

/** Bogen zwischen zwei Orten, je nach Entfernung höher */
function arcPoints(a: [number, number], b: [number, number], n = 64): THREE.Vector3[] {
  const va = toVec(a[0], a[1])
  const vb = toVec(b[0], b[1])
  const angle = va.angleTo(vb)
  const lift = 0.03 + angle * 0.07
  const out: THREE.Vector3[] = []
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const v = new THREE.Vector3().copy(va).lerp(vb, t).normalize()
    // Kugelinterpolation über normalisierte lineare Mischung (bei Gegenpunkten leicht versetzt)
    if (!Number.isFinite(v.x)) v.set(0, 1, 0)
    out.push(v.multiplyScalar(1.003 + Math.sin(Math.PI * t) * lift))
  }
  return out
}

export default function Globe3D({
  points,
  routes = [],
  focus = [38, 25],
  onSelect,
  className,
  autoRotate = true,
  theme = 'graphite',
}: {
  points: G3Point[]
  routes?: G3Route[]
  focus?: [number, number]
  onSelect?: (p: G3Point) => void
  className?: string
  autoRotate?: boolean
  theme?: G3Theme
}) {
  const host = useRef<HTMLDivElement>(null)
  const [tip, setTip] = useState<{ x: number; y: number; label: string } | null>(null)
  const [failed, setFailed] = useState(false)
  const select = useRef(onSelect)
  select.current = onSelect

  useEffect(() => {
    const el = host.current
    if (!el) return
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    } catch {
      setFailed(true)
      return
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    el.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100)
    camera.position.copy(toVec(focus[0], focus[1], 4.1)).add(new THREE.Vector3(0, 0.8, 0))

    scene.add(new THREE.AmbientLight(0xffffff, THEMES[theme].light))
    const sun = new THREE.DirectionalLight(0xffffff, 0.9)
    sun.position.set(3, 2, 4)
    scene.add(sun)

    const th = THEMES[theme]
    const tex = new THREE.CanvasTexture(makeTexture(th))
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = 8
    const globe = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 64), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9, metalness: 0 }))
    scene.add(globe)

    // Routen: Bogen plus wandernder Punkt
    const movers: { curve: THREE.CatmullRomCurve3; dot: THREE.Mesh; offset: number }[] = []
    for (const [i, r] of routes.entries()) {
      const pts = arcPoints(r.from, r.to)
      const curve = new THREE.CatmullRomCurve3(pts)
      const color = RED
      const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 64, r.dim ? 0.0035 : 0.006, 6, false), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: r.dim ? 0.22 : 0.95 }))
      scene.add(tube)
      if (!r.dim) {
        const dot = new THREE.Mesh(new THREE.SphereGeometry(0.016, 12, 8), new THREE.MeshBasicMaterial({ color }))
        scene.add(dot)
        movers.push({ curve, dot, offset: (i * 0.137) % 1 })
      }
    }

    // Markierungen
    const markers: THREE.Mesh[] = []
    const markerColor: Record<G3Point['kind'], number> = { home: RED, country: th.marker, road: th.marker, stop: RED, hub: RED }
    for (const p of points) {
      const size = p.kind === 'home' || p.kind === 'hub' ? 0.028 : p.kind === 'road' ? 0.016 : 0.022
      const m = new THREE.Mesh(new THREE.SphereGeometry(size, 16, 12), new THREE.MeshBasicMaterial({ color: markerColor[p.kind] }))
      m.position.copy(toVec(p.lat, p.lon, 1.006))
      m.userData = p
      const ring = new THREE.Mesh(new THREE.RingGeometry(size * 1.3, size * 1.75, 24), new THREE.MeshBasicMaterial({ color: th.ring, side: THREE.DoubleSide }))
      ring.position.copy(toVec(p.lat, p.lon, 1.004))
      ring.lookAt(new THREE.Vector3(0, 0, 0))
      scene.add(ring)
      scene.add(m)
      markers.push(m)
    }

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enablePan = false
    controls.enableZoom = false
    controls.enableDamping = true
    controls.rotateSpeed = 0.6
    controls.autoRotate = autoRotate && !reduce
    controls.autoRotateSpeed = 0.5
    let idle = 0
    controls.addEventListener('start', () => {
      controls.autoRotate = false
      clearTimeout(idle)
    })
    controls.addEventListener('end', () => {
      idle = window.setTimeout(() => (controls.autoRotate = autoRotate && !reduce), 5000)
    })

    // Hover und Klick per Strahl
    const ray = new THREE.Raycaster()
    const mouse = new THREE.Vector2()
    let downAt = { x: 0, y: 0 }
    const pick = (e: PointerEvent) => {
      const r = renderer.domElement.getBoundingClientRect()
      mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
      ray.setFromCamera(mouse, camera)
      const hit = ray.intersectObjects([globe, ...markers])[0]
      return hit && hit.object !== globe ? { p: hit.object.userData as G3Point, x: e.clientX - r.left, y: e.clientY - r.top } : null
    }
    const onMove = (e: PointerEvent) => {
      const h = pick(e)
      setTip(h ? { x: h.x, y: h.y, label: h.p.label } : null)
      renderer.domElement.style.cursor = h?.p.href ? 'pointer' : 'grab'
    }
    const onDown = (e: PointerEvent) => (downAt = { x: e.clientX, y: e.clientY })
    const onUp = (e: PointerEvent) => {
      if (Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) > 5) return
      const h = pick(e)
      if (h) select.current?.(h.p)
    }
    const onLeave = () => setTip(null)
    const cv = renderer.domElement
    cv.addEventListener('pointermove', onMove)
    cv.addEventListener('pointerdown', onDown)
    cv.addEventListener('pointerup', onUp)
    cv.addEventListener('pointerleave', onLeave)

    const resize = () => {
      const w = el.clientWidth
      const h = el.clientHeight
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    const ro = new ResizeObserver(resize)
    ro.observe(el)
    resize()

    let visible = true
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting))
    io.observe(el)

    const clock = new THREE.Clock()
    let raf = 0
    const loop = () => {
      raf = requestAnimationFrame(loop)
      if (!visible) return
      const t = clock.getElapsedTime()
      for (const m of movers) m.dot.position.copy(m.curve.getPointAt(reduce ? 0.5 : (t * 0.12 + m.offset) % 1))
      controls.update()
      renderer.render(scene, camera)
    }
    loop()

    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(idle)
      ro.disconnect()
      io.disconnect()
      cv.removeEventListener('pointermove', onMove)
      cv.removeEventListener('pointerdown', onDown)
      cv.removeEventListener('pointerup', onUp)
      cv.removeEventListener('pointerleave', onLeave)
      controls.dispose()
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose()
          ;(Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose())
        }
      })
      tex.dispose()
      renderer.dispose()
      cv.remove()
    }
    // Neu aufbauen, wenn sich Punkte oder Routen ändern (selten)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(points), JSON.stringify(routes), focus[0], focus[1], autoRotate, theme])

  if (failed) return null
  return (
    <div className={'g3 ' + (className ?? '')} ref={host}>
      {tip && (
        <span className="g3-tip" style={{ left: tip.x, top: tip.y }}>
          {tip.label}
        </span>
      )}
    </div>
  )
}
