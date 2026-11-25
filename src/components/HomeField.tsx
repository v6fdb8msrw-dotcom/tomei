// „Wo wohnst du?“ – ein Feld, danach überall bekannt.
import { MapPin } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { loadPlaces } from '../lib/autotrip.ts'
import { setHome, useHome } from '../lib/home.ts'
import type { Place } from '../lib/quick.ts'
import { useT } from '../i18n/i18n.ts'
import { QuickInput } from './QuickInput.tsx'
import { placeSuggestions } from './TripQuick.tsx'

export function HomeField() {
  const { tx, L } = useT()
  const home = useHome()
  const [q, setQ] = useState('')
  const [edit, setEdit] = useState(false)
  const [places, setPlaces] = useState<Place[]>([])
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  useEffect(() => {
    let alive = true
    loadPlaces().then((p) => alive && setPlaces(p))
    return () => {
      alive = false
    }
  }, [])
  const sug = useMemo(() => placeSuggestions(q, places, L, 'place'), [q, places, L])
  const pick = (id?: string) => {
    const p = places.find((x) => 'p' + x.n + x.cc === id)
    if (!p) return setMsg(tx('Diesen Ort kenne ich nicht. Nimm die nächste größere Stadt.', 'Unknown place. Use the nearest larger town.'))
    setHome({ n: p.n, lat: p.lat, lon: p.lon, cc: p.cc })
    setEdit(false)
    setQ('')
    setMsg('')
  }
  const locate = () => {
    if (!navigator.geolocation) return setMsg(tx('Standort ist hier nicht verfügbar.', 'Location is not available here.'))
    setBusy(true)
    navigator.geolocation.getCurrentPosition(
      (g) => {
        setBusy(false)
        const { latitude: lat, longitude: lon } = g.coords
        const near = [...places].sort((a, b) => (a.lat - lat) ** 2 + (a.lon - lon) ** 2 - (b.lat - lat) ** 2 - (b.lon - lon) ** 2)[0]
        // grob runden: genauer als die Stadt wird nichts gespeichert
        if (near) pick('p' + near.n + near.cc)
      },
      () => (setBusy(false), setMsg(tx('Kein Zugriff auf den Standort. Tipp einfach deine Stadt ein.', 'No access to your location. Just type your town.'))),
      { maximumAge: 600000, timeout: 10000 },
    )
  }
  if (home && !edit)
    return (
      <p className="home-chip">
        <MapPin size={15} /> {tx('Nähe', 'Near')} <b>{home.n}</b>{' '}
        <button type="button" className="linkish" onClick={() => setEdit(true)}>
          {tx('ändern', 'change')}
        </button>
      </p>
    )
  return (
    <QuickInput value={q} onChange={setQ} onSubmit={() => pick(sug[0]?.id)} suggestions={sug} onPick={(s) => pick(s.id)} label={tx('Wo wohnst du?', 'Where do you live?')} placeholder={tx('Deine Stadt, z. B. München', 'Your town, e.g. Munich')} button={tx('Merken', 'Save')} busy={busy}>
      <p className="small">
        <button type="button" className="linkish" onClick={locate}>
          {tx('Standort automatisch verwenden', 'Use my location automatically')}
        </button>{' '}
        <span className="muted">{tx('Bleibt auf diesem Gerät, gespeichert wird nur die Stadt.', 'Stays on this device; only the town is stored.')}</span>
      </p>
      {msg && <p className="small">{msg}</p>}
    </QuickInput>
  )
}
