// Gelände und Straßenverläufe (public/data/terrain), klein und ohne three.js, damit auch Planung und GPX sie nutzen können.
export type Terrain = {
  bb: [number, number, number, number]
  nx: number
  ny: number
  lo: number
  hi: number
  h: string
  km: [number, number]
  /** Straßenverlauf [Breite, Länge] */
  r?: [number, number][]
  /** Höhenprofil, gleichmäßig über die Strecke verteilt */
  p?: number[]
  len?: number
  /** weitere Linien ohne festgelegte Reihenfolge (Rennstrecken) */
  x?: [number, number][][]
}

const cache = new Map<string, Promise<Terrain | null>>()
export function loadTerrain(id: string): Promise<Terrain | null> {
  let c = cache.get(id)
  if (!c) {
    c = fetch(`${import.meta.env.BASE_URL}data/terrain/${id}.json`)
      .then((r) => (r.ok ? (r.json() as Promise<Terrain>) : null))
      .catch(() => null)
    cache.set(id, c)
  }
  return c
}
