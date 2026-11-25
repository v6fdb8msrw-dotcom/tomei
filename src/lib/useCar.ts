// Profil eines Garagenautos (Katalogdaten werden bei Bedarf geladen)
import { useEffect, useState } from 'react'
import { loadCatalogue, type CarModel } from '../components/ModelFinder.tsx'
import type { Vehicle } from '../store/schema.ts'
import { carProfile, type CarProfile } from './carprofile.ts'
import { loadSpecs, type Spec } from './specs.ts'

export function useCarProfile(v: Vehicle | undefined): CarProfile | null {
  const [data, setData] = useState<{ id: string; m?: CarModel; sp?: Spec } | null>(null)
  const id = v?.modelId
  useEffect(() => {
    if (!id) return
    let alive = true
    Promise.all([loadCatalogue(), loadSpecs()]).then(([all, sp]) => alive && setData({ id, m: all.find((x) => x.id === id), sp: sp[id] }))
    return () => {
      alive = false
    }
  }, [id])
  const d = data && data.id === id ? data : undefined
  return carProfile(v, d?.m, d?.sp)
}
