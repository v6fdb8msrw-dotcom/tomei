// Drehbare 3D-Karte einer Straße: echtes Gelände, echter Straßenverlauf, Höhenprofil und Abspielen der Strecke.
// Gelände: Terrain Tiles (u. a. SRTM, EU-DEM, NED), Straßenverlauf: OpenStreetMap (ODbL). Beides wurde beim Erstellen
// einmal geladen und liegt als Datei auf derselben Seite (public/data/terrain); es gibt keine Anfragen an fremde Server.
import { Minus, Pause, Play, Plus, RotateCcw } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { useT } from '../i18n/i18n.ts'
import { loadTerrain, type Terrain } from '../lib/terrain.ts'
import type { Waypoint } from '../store/schema.ts'

function decode(b64: string): Uint16Array {
  const s = atob(b64)
  const out = new Uint16Array(s.length / 2)
  for (let i = 0; i < out.length; i++) out[i] = s.charCodeAt(2 * i) | (s.charCodeAt(2 * i + 1) << 8)
  return out
}

const RED = 0xd64b3c
// Ruhige Höhenfarben passend zur Drive-Welt: Petrol-Tal, Salbei, Sand, Fels, Schnee
const RAMP: [number, THREE.Color][] = [
  [0, new THREE.Color('#5E7F78')],
  [0.25, new THREE.Color('#87A08F')],
  [0.5, new THREE.Color('#C2BC9E')],
  [0.75, new THREE.Color('#A79F95')],
  [1, new THREE.Color('#F4F2ED')],
]
const SEA = new THREE.Color('#9FBDC4')
function shade(t: number, out: THREE.Color) {
  for (let i = 1; i < RAMP.length; i++)
    if (t <= RAMP[i][0]) return out.copy(RAMP[i - 1][1]).lerp(RAMP[i][1], (t - RAMP[i - 1][0]) / (RAMP[i][0] - RAMP[i - 1][0]))
  return out.copy(RAMP[RAMP.length - 1][1])
}

type Scene3D = { marker: (f: number) => void; zoom: (k: number) => void; reset: () => void; follow: (on: boolean) => void }

/** Überhöhung: flaches Land stärker, Hochgebirge kaum */
const exaggeration = (t: Terrain) => {
  const rel = (t.hi - t.lo) / 1000 / Math.max(...t.km)
  return Math.min(5, Math.max(1.3, Math.round((0.13 / Math.max(rel, 0.004)) * 2) / 2))
}

export default function RoadMap3D({ id, waypoints, closed }: { id: string; waypoints: Waypoint[]; closed?: boolean }) {
  const { tx, locale } = useT()
  const [t, setT] = useState<Terrain | null | undefined>(undefined)
  const [f, setF] = useState(0)
  const [play, setPlay] = useState(false)
  const [failed, setFailed] = useState(false)
  const host = useRef<HTMLDivElement>(null)
  const s3 = useRef<Scene3D | null>(null)

  useEffect(() => {
    let alive = true
    setT(undefined)
    setF(0)
    setPlay(false)
    loadTerrain(id).then((x) => alive && setT(x))
    return () => {
      alive = false
    }
  }, [id])

  useEffect(() => {
    const el = host.current
    if (!t || !el) return
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    } catch {
      setFailed(true)
      return
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
    el.appendChild(renderer.domElement)
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(36, 1, 0.01, 60)

    const L = Math.max(...t.km)
    const W = (t.km[0] / L) * 4
    const D = (t.km[1] / L) * 4
    const ex = exaggeration(t)
    const perM = (4 / L / 1000) * ex
    const raw = decode(t.h)
    const elev = new Float32Array(raw.length)
    for (let i = 0; i < raw.length; i++) elev[i] = t.lo + (raw[i] / 65535) * (t.hi - t.lo)
    const base = Math.max(t.lo, 0)
    const yOf = (m: number) => (Math.max(m, t.lo < 0 ? 0 : t.lo) - base) * perM

    // Gelände
    const geo = new THREE.PlaneGeometry(W, D, t.nx - 1, t.ny - 1)
    geo.rotateX(-Math.PI / 2)
    const pos = geo.attributes.position as THREE.BufferAttribute
    const col = new Float32Array(elev.length * 3)
    const c = new THREE.Color()
    // Flaches Land bleibt grün, erst ab rund 1.200 m Höhenunterschied reicht die Farbskala bis zum Schnee
    const relief = Math.min(1, 0.25 + (t.hi - base) / 1600)
    for (let i = 0; i < elev.length; i++) {
      pos.setY(i, yOf(elev[i]))
      if (t.lo < 1 && elev[i] <= 0.5) c.copy(SEA)
      else shade(((elev[i] - base) / Math.max(1, t.hi - base)) * relief, c)
      col.set([c.r, c.g, c.b], i * 3)
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3))
    geo.computeVertexNormals()
    const ground = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0 }))
    ground.receiveShadow = ground.castShadow = true
    scene.add(ground)

    // Sockel: Seitenwände wie bei einem Geländemodell
    const wallY = -0.16
    const edge: number[] = []
    for (let x = 0; x < t.nx; x++) edge.push(x)
    for (let y = 1; y < t.ny; y++) edge.push(y * t.nx + t.nx - 1)
    for (let x = t.nx - 2; x >= 0; x--) edge.push((t.ny - 1) * t.nx + x)
    for (let y = t.ny - 2; y >= 0; y--) edge.push(y * t.nx)
    const wv: number[] = []
    for (const i of edge) wv.push(pos.getX(i), pos.getY(i), pos.getZ(i), pos.getX(i), wallY, pos.getZ(i))
    const wi: number[] = []
    for (let k = 0; k < edge.length - 1; k++) wi.push(2 * k, 2 * k + 1, 2 * k + 2, 2 * k + 2, 2 * k + 1, 2 * k + 3)
    const wg = new THREE.BufferGeometry()
    wg.setAttribute('position', new THREE.Float32BufferAttribute(wv, 3))
    wg.setIndex(wi)
    wg.computeVertexNormals()
    scene.add(new THREE.Mesh(wg, new THREE.MeshStandardMaterial({ color: '#8E8A80', roughness: 1, side: THREE.DoubleSide })))

    // Höhe an einer Stelle (bilinear)
    const at = (la: number, lo: number) => {
      const fx = Math.min(t.nx - 1.001, Math.max(0, ((lo - t.bb[1]) / (t.bb[3] - t.bb[1])) * (t.nx - 1)))
      const fy = Math.min(t.ny - 1.001, Math.max(0, ((t.bb[2] - la) / (t.bb[2] - t.bb[0])) * (t.ny - 1)))
      const i = Math.floor(fx)
      const j = Math.floor(fy)
      const u = fx - i
      const v = fy - j
      const e = (a: number, b: number) => elev[b * t.nx + a]
      return (e(i, j) * (1 - u) + e(i + 1, j) * u) * (1 - v) + (e(i, j + 1) * (1 - u) + e(i + 1, j + 1) * u) * v
    }
    const toV = (la: number, lo: number, lift = 0.012) => new THREE.Vector3(((lo - t.bb[1]) / (t.bb[3] - t.bb[1]) - 0.5) * W, yOf(at(la, lo)) + lift, (0.5 - (la - t.bb[0]) / (t.bb[2] - t.bb[0])) * D)
    const line = (pts: [number, number][]) => {
      // lange Stücke unterteilen, damit die Linie dem Gelände folgt
      const v: THREE.Vector3[] = []
      for (let i = 0; i < pts.length; i++) {
        if (i) {
          const a = pts[i - 1]
          const b = pts[i]
          const n = Math.min(40, Math.floor(Math.hypot(((b[1] - a[1]) / (t.bb[3] - t.bb[1])) * W, ((b[0] - a[0]) / (t.bb[2] - t.bb[0])) * D) / 0.025))
          for (let k = 1; k < n; k++) v.push(toV(a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n))
        }
        v.push(toV(pts[i][0], pts[i][1]))
      }
      return v
    }
    const tube = (v: THREE.Vector3[], r: number, color: number, opacity = 1) => {
      const path = new THREE.CurvePath<THREE.Vector3>()
      for (let i = 1; i < v.length; i++) if (v[i].distanceToSquared(v[i - 1]) > 1e-9) path.add(new THREE.LineCurve3(v[i - 1], v[i]))
      if (!path.curves.length) return
      scene.add(new THREE.Mesh(new THREE.TubeGeometry(path, Math.min(2400, path.curves.length * 2), r, 6, false), new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity })))
    }
    let routeV: THREE.Vector3[] = []
    const cum: number[] = [0]
    if (t.r && t.r.length > 1) {
      routeV = line(t.r)
      for (let i = 1; i < routeV.length; i++) cum.push(cum[i - 1] + Math.hypot(routeV[i].x - routeV[i - 1].x, routeV[i].z - routeV[i - 1].z))
      tube(routeV, 0.0095, RED)
    }
    for (const l of t.x ?? []) tube(line(l), 0.007, RED, routeV.length ? 0.35 : 0.95)

    // Wegpunkte als Stecknadeln
    for (const w of waypoints) {
      if (w.lat < t.bb[0] || w.lat > t.bb[2] || w.lon < t.bb[1] || w.lon > t.bb[3]) continue
      const p = toV(w.lat, w.lon, 0)
      const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.2, 8), new THREE.MeshBasicMaterial({ color: 0x1e2223 }))
      pin.position.copy(p).y += 0.1
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.032, 18, 12), new THREE.MeshStandardMaterial({ color: 0x1e2223, roughness: 0.5 }))
      head.position.copy(p).y += 0.2
      scene.add(pin, head)
    }

    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.042, 20, 14), new THREE.MeshBasicMaterial({ color: 0xffffff }))
    const dotRing = new THREE.Mesh(new THREE.SphereGeometry(0.026, 20, 14), new THREE.MeshBasicMaterial({ color: RED, depthTest: false }))
    dotRing.renderOrder = 2
    if (routeV.length) scene.add(dot, dotRing)

    scene.add(new THREE.HemisphereLight(0xffffff, 0xb9b3a4, 1.5))
    const sun = new THREE.DirectionalLight(0xfff3df, 2.4)
    sun.position.set(-3, 3.2, -2)
    sun.castShadow = true
    sun.shadow.mapSize.set(1024, 1024)
    Object.assign(sun.shadow.camera, { left: -3, right: 3, top: 3, bottom: -3, near: 0.5, far: 10 })
    sun.shadow.bias = -0.002
    sun.shadow.normalBias = 0.03
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    scene.add(sun)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enablePan = false
    controls.enableZoom = false
    controls.enableDamping = true
    controls.maxPolarAngle = 1.42
    controls.minPolarAngle = 0.15
    controls.autoRotate = !reduce
    controls.autoRotateSpeed = 0.55
    controls.addEventListener('start', () => (controls.autoRotate = false))
    // senkrechtes Wischen scrollt weiter die Seite, waagerechtes dreht die Karte
    renderer.domElement.style.touchAction = 'pan-y'
    let dist = 6.3
    const home = () => {
      const narrow = el.clientWidth < 560
      dist = narrow ? 7.6 : 6.3
      controls.target.set(0, yOf(t.lo + (t.hi - t.lo) * 0.3) * 0.6, 0)
      camera.position.set(-dist * 0.45, dist * 0.62, dist * 0.68)
    }
    home()

    let following = false
    let target = 0
    let shown = 0
    const posAt = (x: number, out: THREE.Vector3) => {
      const d = x * cum[cum.length - 1]
      let a = 0
      let b = cum.length - 1
      while (b - a > 1) {
        const m = (a + b) >> 1
        if (cum[m] <= d) a = m
        else b = m
      }
      return out.copy(routeV[a]).lerp(routeV[b], (d - cum[a]) / Math.max(1e-9, cum[b] - cum[a]))
    }
    s3.current = {
      marker: (x) => (target = x),
      zoom: (k) => {
        const v = camera.position.clone().sub(controls.target)
        const n = Math.min(10, Math.max(1.1, v.length() * k))
        camera.position.copy(controls.target).add(v.setLength(n))
        controls.autoRotate = false
      },
      reset: () => {
        following = false
        home()
        controls.autoRotate = !reduce
      },
      follow: (on) => {
        following = on
        controls.autoRotate = false
      },
    }

    const resize = () => {
      renderer.setSize(el.clientWidth, el.clientHeight, false)
      camera.aspect = el.clientWidth / Math.max(1, el.clientHeight)
      camera.updateProjectionMatrix()
    }
    const ro = new ResizeObserver(resize)
    ro.observe(el)
    resize()
    let visible = true
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting))
    io.observe(el)
    const p = new THREE.Vector3()
    const q = new THREE.Vector3()
    let raf = 0
    const loop = () => {
      raf = requestAnimationFrame(loop)
      if (!visible || document.hidden) return
      if (routeV.length) {
        shown += (target - shown) * 0.35
        posAt(shown, p)
        dot.position.copy(p)
        dotRing.position.copy(p)
        if (following) {
          // Kamera schräg hinter dem Punkt, Blick in Fahrtrichtung
          posAt(Math.max(0, shown - 0.05), q)
          const dir = p.clone().sub(q).setY(0)
          if (dir.lengthSq() > 1e-6) {
            dir.normalize()
            const want = p.clone().addScaledVector(dir, -1.15).add(new THREE.Vector3(0, 0.75, 0))
            camera.position.lerp(want, 0.03)
          }
          controls.target.lerp(p, 0.08)
        }
      }
      controls.update()
      renderer.render(scene, camera)
    }
    loop()
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      controls.dispose()
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose()
          ;(o.material as THREE.Material).dispose()
        }
      })
      renderer.dispose()
      renderer.domElement.remove()
      s3.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t])

  useEffect(() => {
    s3.current?.marker(f)
  }, [f, t])

  // Strecke abspielen
  useEffect(() => {
    s3.current?.follow(play)
    if (!play) return
    let raf = 0
    let last = performance.now()
    const dur = 26000
    const step = (now: number) => {
      const dt = Math.min(100, now - last)
      last = now
      setF((x) => {
        const n = x + dt / dur
        if (n >= 1) {
          setPlay(false)
          return 1
        }
        return n
      })
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [play])

  const stats = useMemo(() => {
    if (!t?.p) return null
    let up = 0
    let down = 0
    for (let i = 1; i < t.p.length; i++) {
      const d = t.p[i] - t.p[i - 1]
      if (d > 0) up += d
      else down -= d
    }
    return { up, down, min: Math.min(...t.p), max: Math.max(...t.p) }
  }, [t])

  if (t === null || failed) return null
  const nf = (n: number, d = 0) => n.toLocaleString(locale, { maximumFractionDigits: d })
  const at = t?.p ? t.p[Math.round(f * (t.p.length - 1))] : 0

  return (
    <div className="rm3">
      <div className="rm3-stage">
        <div className="rm3-canvas" ref={host} role="img" aria-label={tx('Drehbare 3D-Karte der Straße', 'Rotatable 3D map of the road')} />
        {t && (
          <div className="rm3-tools">
            <button className="icon-btn" onClick={() => s3.current?.zoom(0.8)} aria-label={tx('Näher', 'Zoom in')}>
              <Plus size={16} />
            </button>
            <button className="icon-btn" onClick={() => s3.current?.zoom(1.25)} aria-label={tx('Weiter weg', 'Zoom out')}>
              <Minus size={16} />
            </button>
            <button
              className="icon-btn"
              onClick={() => {
                setPlay(false)
                s3.current?.reset()
              }}
              aria-label={tx('Ansicht zurücksetzen', 'Reset view')}
            >
              <RotateCcw size={15} />
            </button>
          </div>
        )}
        {t?.r && (
          <button
            className="btn small primary rm3-play"
            onClick={() => {
              if (!play && f >= 0.999) setF(0)
              setPlay(!play)
            }}
          >
            {play ? <Pause size={14} /> : <Play size={14} />} {play ? tx('Anhalten', 'Pause') : tx('Strecke abfahren', 'Drive the route')}
          </button>
        )}
      </div>
      {t?.p && stats && (
        <div className="rm3-profile">
          <div className="rm3-nums">
            <span>
              <b className="mono">{nf(t.len ?? 0, 1)} km</b> {closed ? tx('gezeigte Runde', 'lap shown') : tx('gezeigter Abschnitt', 'section shown')}
            </span>
            <span>
              <b className="mono">
                ↑ {nf(stats.up)} m · ↓ {nf(stats.down)} m
              </b>
            </span>
            <span>
              <b className="mono">
                {nf(stats.min)}–{nf(stats.max)} m
              </b>
            </span>
            <span>
              {tx('Kilometer', 'Kilometre')} <b className="mono">{nf(f * (t.len ?? 0), 1)}</b>, <b className="mono">{nf(at)} m</b>
            </span>
          </div>
          <Profile p={t.p} f={f} />
          <input
            className="rm3-range"
            type="range"
            min={0}
            max={1000}
            value={Math.round(f * 1000)}
            onChange={(e) => {
              setPlay(false)
              setF(+e.target.value / 1000)
            }}
            aria-label={tx('Position auf der Strecke', 'Position along the road')}
            aria-valuetext={`${nf(f * (t.len ?? 0), 1)} km, ${nf(at)} m`}
          />
        </div>
      )}
      {t && (
        <p className="muted small">
          {t.r || t.x ? (
            <>
              {tx('Straßenverlauf', 'Road geometry')} ©{' '}
              <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">
                OpenStreetMap
              </a>{' '}
              (ODbL), {tx('Kacheln', 'tiles')} OpenFreeMap © OpenMapTiles ·{' '}
            </>
          ) : null}
          {tx('Gelände', 'Terrain')}:{' '}
          <a href="https://github.com/tilezen/joerd/blob/master/docs/attribution.md" target="_blank" rel="noopener noreferrer">
            Terrain Tiles
          </a>{' '}
          · {tx(`Höhen ${nf(exaggeration(t), 1)}-fach überhöht. Höhen aus dem Geländemodell, Tunnel und Brücken können abweichen.`, `Heights exaggerated ${nf(exaggeration(t), 1)}×. Elevations from the terrain model; tunnels and bridges may differ.`)}
        </p>
      )}
    </div>
  )
}

function Profile({ p, f }: { p: number[]; f: number }) {
  const W = 1000
  const H = 120
  const min = Math.min(...p)
  const span = Math.max(30, Math.max(...p) - min)
  const y = (m: number) => H - 8 - ((m - min) / span) * (H - 20)
  const d = p.map((m, i) => `${((i / (p.length - 1)) * W).toFixed(1)},${y(m).toFixed(1)}`).join(' ')
  const x = f * W
  const cy = y(p[Math.round(f * (p.length - 1))])
  return (
    <svg className="rm3-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden>
      <polygon points={`0,${H} ${d} ${W},${H}`} className="rm3-area" />
      <polyline points={d} className="rm3-line" vectorEffect="non-scaling-stroke" />
      <line x1={x} x2={x} y1={cy} y2={H} className="rm3-cursor" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}
