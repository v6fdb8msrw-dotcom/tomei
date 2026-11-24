// GPX lesen und schreiben (GPX 1.1). Absichtlich ohne XML-Bibliothek: GPX ist einfach genug,
// und so läuft der Parser auch in Tests ohne Browser.
import type { Waypoint } from '../store/schema.ts'

export type GpxData = { name?: string; waypoints: Waypoint[]; track: [number, number][] }

const decode = (s: string) =>
  s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .trim()
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function attr(tag: string, name: string): number | undefined {
  const m = tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([-+0-9.eE]+)["']`))
  const v = m ? parseFloat(m[1]) : NaN
  return Number.isFinite(v) ? v : undefined
}
const valid = (lat?: number, lon?: number): boolean => lat !== undefined && lon !== undefined && Math.abs(lat) <= 90 && Math.abs(lon) <= 180

/** Liest Wegpunkte (wpt, rtept) und Spurpunkte (trkpt). Wirft, wenn nichts Brauchbares drinsteht. */
export function parseGpx(text: string): GpxData {
  if (!/<gpx[\s>]/i.test(text)) throw new Error('Das ist keine GPX-Datei.')
  const nameM = text.match(/<metadata>[\s\S]*?<name>([\s\S]*?)<\/name>/i) ?? text.match(/<trk>\s*<name>([\s\S]*?)<\/name>/i)
  const waypoints: Waypoint[] = []
  const track: [number, number][] = []
  const pointRe = /<(wpt|rtept|trkpt)\b([^>]*?)(\/>|>([\s\S]*?)<\/\1>)/gi
  let m: RegExpExecArray | null
  let n = 0
  while ((m = pointRe.exec(text))) {
    const lat = attr(m[2], 'lat')
    const lon = attr(m[2], 'lon')
    if (!valid(lat, lon)) continue
    if (m[1].toLowerCase() === 'trkpt') {
      if (track.length < 20000) track.push([lat!, lon!])
    } else {
      const nm = m[4]?.match(/<name>([\s\S]*?)<\/name>/i)
      waypoints.push({ name: nm ? decode(nm[1]).slice(0, 120) : `Punkt ${++n}`, lat: lat!, lon: lon! })
    }
  }
  if (!waypoints.length && !track.length) throw new Error('In der GPX-Datei stehen keine Punkte.')
  return { name: nameM ? decode(nameM[1]).slice(0, 160) : undefined, waypoints, track }
}

export function toGpx(name: string, waypoints: Waypoint[], track: [number, number][] = [], creator = 'TOMEI'): string {
  const f = (v: number) => v.toFixed(6)
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<gpx version="1.1" creator="${esc(creator)}" xmlns="http://www.topografix.com/GPX/1/1">`,
    `  <metadata><name>${esc(name)}</name><time>${new Date().toISOString()}</time></metadata>`,
    ...waypoints.map((w) => `  <wpt lat="${f(w.lat)}" lon="${f(w.lon)}"><name>${esc(w.name)}</name></wpt>`),
  ]
  if (waypoints.length > 1) {
    lines.push(`  <rte><name>${esc(name)}</name>`)
    lines.push(...waypoints.map((w) => `    <rtept lat="${f(w.lat)}" lon="${f(w.lon)}"><name>${esc(w.name)}</name></rtept>`))
    lines.push('  </rte>')
  }
  if (track.length) {
    lines.push(`  <trk><name>${esc(name)}</name><trkseg>`)
    lines.push(...track.map(([la, lo]) => `    <trkpt lat="${f(la)}" lon="${f(lo)}"/>`))
    lines.push('  </trkseg></trk>')
  }
  lines.push('</gpx>')
  return lines.join('\n')
}

/** Großkreis-Entfernung in km */
export function haversineKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const R = 6371.0088
  const r = Math.PI / 180
  const dLat = (b.lat - a.lat) * r
  const dLon = (b.lon - a.lon) * r
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)))
}

/** Luftlinie entlang aller Punkte (Spur, sonst Wegpunkte). Ist keine Straßenlänge. */
export function pathKm(points: { lat: number; lon: number }[]) {
  let s = 0
  for (let i = 1; i < points.length; i++) s += haversineKm(points[i - 1], points[i])
  return s
}

/** Google-Maps-Route mit allen Wegpunkten (max. 10, so viele nimmt der Link) */
export function mapsDirections(wps: Waypoint[]) {
  if (wps.length < 2) return wps[0] ? `https://www.google.com/maps/search/?api=1&query=${wps[0].lat},${wps[0].lon}` : ''
  const pts = wps.length > 10 ? [wps[0], ...wps.slice(1, -1).filter((_, i, a) => i % Math.ceil(a.length / 8) === 0).slice(0, 8), wps[wps.length - 1]] : wps
  const p = (w: Waypoint) => `${w.lat},${w.lon}`
  const via = pts.slice(1, -1).map(p).join('|')
  return `https://www.google.com/maps/dir/?api=1&origin=${p(pts[0])}&destination=${p(pts[pts.length - 1])}${via ? `&waypoints=${encodeURIComponent(via)}` : ''}&travelmode=driving`
}

/** OpenStreetMap-Routenplaner (OSRM) mit allen Wegpunkten */
export function osmDirections(wps: Waypoint[]) {
  if (!wps.length) return ''
  if (wps.length === 1) return `https://www.openstreetmap.org/?mlat=${wps[0].lat}&mlon=${wps[0].lon}#map=11/${wps[0].lat}/${wps[0].lon}`
  return `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${wps.map((w) => `${w.lat.toFixed(5)}%2C${w.lon.toFixed(5)}`).join('%3B')}`
}
