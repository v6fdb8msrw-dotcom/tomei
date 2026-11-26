// Teilen per Link ohne Server: Die Daten stecken komprimiert im Link selbst (#/share/<code>).
// Geteilt wird nur, was für andere sinnvoll ist; Notizen, Fotos, Preise des Kaufs und private Belege bleiben auf dem Gerät.
import { BRAND } from '../config/brand.ts'
import type { Trip, Vehicle } from '../store/schema.ts'

export type SharedVehicle = Pick<Vehicle, 'make' | 'model' | 'variant' | 'chassis' | 'year' | 'market' | 'mileageKm' | 'modelId' | 'image'> & { mods?: { title: string; category: string; status: Vehicle['mods'][number]['status'] }[] }
export type SharedTrip = Pick<Trip, 'name' | 'roadId' | 'waypoints' | 'plan' | 'date'> & { track?: [number, number][] }
export type Shared = { t: 'v'; v: SharedVehicle } | { t: 't'; v: SharedTrip }

/** Längster Link, den wir erzeugen (Messenger und Browser kommen damit zurecht) */
export const MAX_CODE = 7000

const b64url = (b: Uint8Array) => {
  let s = ''
  for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000))
  return btoa(s).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')
}
const fromB64url = (s: string) => {
  const bin = atob(s.replaceAll('-', '+').replaceAll('_', '/') + '='.repeat((4 - (s.length % 4)) % 4))
  return Uint8Array.from(bin, (c) => c.charCodeAt(0))
}
async function pipe(data: Uint8Array, stream: CompressionStream | DecompressionStream) {
  const out = new Response(new Blob([data as BlobPart]).stream().pipeThrough(stream))
  return new Uint8Array(await out.arrayBuffer())
}
const canZip = () => typeof CompressionStream !== 'undefined'

export async function encodeShare(x: Shared): Promise<string> {
  const raw = new TextEncoder().encode(JSON.stringify(x))
  // „z“ = komprimiert, „j“ = reines JSON (ältere Browser)
  return canZip() ? 'z' + b64url(await pipe(raw, new CompressionStream('deflate-raw'))) : 'j' + b64url(raw)
}

export async function decodeShare(code: string): Promise<Shared | null> {
  try {
    const body = fromB64url(code.slice(1))
    const raw = code[0] === 'z' ? await pipe(body, new DecompressionStream('deflate-raw')) : body
    const x = JSON.parse(new TextDecoder().decode(raw))
    if ((x?.t === 'v' && typeof x.v?.make === 'string') || (x?.t === 't' && Array.isArray(x.v?.waypoints))) return x as Shared
  } catch {
    /* kaputter oder gekürzter Link */
  }
  return null
}

export const vehicleForShare = (v: Vehicle): SharedVehicle => ({
  make: v.make,
  model: v.model,
  variant: v.variant,
  chassis: v.chassis,
  year: v.year,
  market: v.market,
  mileageKm: v.mileageKm,
  modelId: v.modelId,
  image: v.image,
  mods: v.mods.length ? v.mods.slice(0, 60).map((m) => ({ title: m.title, category: m.category, status: m.status })) : undefined,
})

/** Route mit Spur; ist der Link zu lang, wird die GPX-Spur ausgedünnt und notfalls weggelassen */
export async function tripCode(t: Trip): Promise<{ code: string; trackCut: boolean }> {
  const base: SharedTrip = { name: t.name, roadId: t.roadId, waypoints: t.waypoints.slice(0, 200).map((w) => ({ ...w, lat: +w.lat.toFixed(5), lon: +w.lon.toFixed(5) })), plan: t.plan, date: t.date }
  const tr = t.track ?? []
  for (const step of [1, 2, 4, 8, 16, 32, 64]) {
    const track = tr.length ? tr.filter((_, i) => i % step === 0 || i === tr.length - 1).map(([a, b]) => [+a.toFixed(5), +b.toFixed(5)] as [number, number]) : undefined
    const code = await encodeShare({ t: 't', v: { ...base, track } })
    if (code.length <= MAX_CODE) return { code, trackCut: step > 1 }
  }
  return { code: await encodeShare({ t: 't', v: base }), trackCut: tr.length > 0 }
}

/** Öffentliche Adresse, auch wenn die Seite gerade in der Claude-App läuft */
export const shareUrl = (code: string) => BRAND.url + '#/share/' + code

/** Link über das Teilen-Menü des Geräts, sonst in die Zwischenablage. Ergebnis: 'shared' | 'copied' | 'shown' */
export async function offerLink(url: string, title: string): Promise<'shared' | 'copied' | 'shown'> {
  if (navigator.share && matchMedia('(pointer: coarse)').matches) {
    try {
      await navigator.share({ title, url })
      return 'shared'
    } catch {
      /* abgebrochen: weiter mit Kopieren */
    }
  }
  try {
    await navigator.clipboard.writeText(url)
    return 'copied'
  } catch {
    return 'shown'
  }
}
