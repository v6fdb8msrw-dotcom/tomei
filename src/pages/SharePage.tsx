// Geöffneter Teilen-Link: Vorschau und Übernahme in die eigene Garage bzw. die eigenen Routen
import { Car, Check, Route as RouteIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { EmptyState, PageHead, VehicleVisual, img, vehicleTitle } from '../components/ui.tsx'
import { useT } from '../i18n/i18n.ts'
import { decodeShare, type Shared } from '../lib/share.ts'
import { modelImg } from '../lib/modelimg.ts'
import { href, navigate } from '../lib/router.ts'
import { addVehicle, nowIso, uid, upsertTrip } from '../store/store.ts'
import type { Vehicle } from '../store/schema.ts'

export function SharePage({ code }: { code: string }) {
  const { tx, locale } = useT()
  const [x, setX] = useState<Shared | null | undefined>(undefined)
  const [done, setDone] = useState(false)
  useEffect(() => {
    let alive = true
    decodeShare(code).then((s) => alive && setX(s))
    return () => {
      alive = false
    }
  }, [code])
  if (x === undefined) return null
  if (!x)
    return (
      <section className="section">
        <EmptyState title={tx('Dieser Link ist unvollständig.', 'This link is incomplete.')} text={tx('Vielleicht wurde er beim Kopieren abgeschnitten. Bitte schick ihn noch einmal.', 'It may have been cut off when copied. Please send it again.')} />
      </section>
    )
  if (x.t === 'v') {
    const v = x.v
    const preview = { ...v, id: 'share', status: 'dream', mods: [], journey: [] } as unknown as Vehicle
    const take = () => {
      const n = addVehicle({ ...v, status: 'dream', mods: (v.mods ?? []).map((m) => ({ ...m, id: uid() })), journey: [] } as Partial<Vehicle> & { make: string; model: string })
      setDone(true)
      navigate('own/garage/' + n.id)
    }
    return (
      <>
        <PageHead eyebrow={tx('Geteiltes Fahrzeug', 'Shared vehicle')} title={<>{vehicleTitle(preview)}</>} sub={tx('Jemand hat dir dieses Auto geschickt. Notizen, Preise und Fotos bleiben beim Absender.', 'Someone sent you this car. Notes, prices and photos stay with the sender.')} image={v.modelId ? modelImg(v.modelId) : img('import-port')} />
        <section className="section share-page">
          <div className="gcard">
            <VehicleVisual v={preview} big />
            <ul className="share-facts">
              {v.year && <li>{tx('Baujahr', 'Year')} {v.year}</li>}
              {v.chassis && <li>{tx('Fahrgestell', 'Chassis')} {v.chassis}</li>}
              {v.mileageKm !== undefined && <li>{v.mileageKm.toLocaleString(locale)} km</li>}
              {v.mods?.length ? <li>{v.mods.length === 1 ? tx('1 Umbau', '1 modification') : tx(`${v.mods.length} Umbauten`, `${v.mods.length} modifications`)}</li> : null}
            </ul>
            <div className="row gap wrap">
              <button className="btn primary" onClick={take} disabled={done}>
                {done ? <Check size={16} /> : <Car size={16} />} {tx('In meine Garage übernehmen', 'Add to my garage')}
              </button>
              {v.modelId && (
                <a className="btn" href={href('discover/models/' + v.modelId)}>
                  {tx('Modellprofil ansehen', 'View model profile')}
                </a>
              )}
            </div>
          </div>
        </section>
      </>
    )
  }
  const t = x.v
  const take = () => {
    const id = uid()
    upsertTrip({ ...t, id, name: t.name || tx('Geteilter Roadtrip', 'Shared road trip'), createdAt: nowIso(), updatedAt: nowIso() })
    setDone(true)
    navigate('drive/builder/' + id)
  }
  return (
    <>
      <PageHead eyebrow={tx('Geteilter Roadtrip', 'Shared road trip')} title={<>{t.name || tx('Roadtrip', 'Road trip')}</>} sub={tx('Jemand hat dir diese Route geschickt.', 'Someone sent you this route.')} image={img('roads/stelvio')} />
      <section className="section share-page">
        <div className="gcard">
          <ol className="share-stops">
            {t.waypoints.slice(0, 30).map((w, k) => (
              <li key={k}>{w.name || `${w.lat.toFixed(3)}, ${w.lon.toFixed(3)}`}</li>
            ))}
            {t.waypoints.length > 30 && <li>… {t.waypoints.length - 30} {tx('weitere', 'more')}</li>}
          </ol>
          {t.track?.length ? <p className="muted small">{tx(`Mit GPX-Spur (${t.track.length.toLocaleString(locale)} Punkte).`, `With GPX track (${t.track.length.toLocaleString(locale)} points).`)}</p> : null}
          <button className="btn primary" onClick={take} disabled={done}>
            {done ? <Check size={16} /> : <RouteIcon size={16} />} {tx('In meine Routen übernehmen', 'Add to my routes')}
          </button>
        </div>
      </section>
    </>
  )
}
