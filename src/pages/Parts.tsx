// Own · Werkstätten: Betriebe in der Nähe, passend zum Auto in der Garage. Keine Online-Shops.
import { useState } from 'react'
import { Workshops } from '../components/Workshops.tsx'
import { PageHead, VehicleSelect, img } from '../components/ui.tsx'
import { useT } from '../i18n/i18n.ts'
import { useStore } from '../store/store.ts'

export function PartsPage() {
  const { tx } = useT()
  const vehicles = useStore((s) => s.vehicles)
  const [sel, setSel] = useState(vehicles.find((v) => v.status === 'owned')?.id ?? vehicles[0]?.id ?? '')
  const v = vehicles.find((x) => x.id === sel)
  return (
    <>
      <PageHead
        eyebrow={tx('Own · Werkstätten', 'Own · Workshops')}
        title={
          <>
            {tx('Wer dein Auto ', 'Who really ')}
            <em>{tx('wirklich kennt.', 'knows your car.')}</em>
          </>
        }
        sub={tx('Service, Reparatur und Umbau vor Ort: Betriebe in deiner Nähe, die zu deiner Marke und zum Alter deines Autos passen.', 'Service, repair and modifications on site: workshops near you that match your make and the age of your car.')}
        images={[img('parts-engine'), img('parts-wheel')]}
      />
      <section className="section">
        {vehicles.length > 1 && <VehicleSelect vehicles={vehicles} value={sel} onChange={setSel} />}
        <Workshops make={v?.make} year={v?.year} limit={24} />
      </section>
    </>
  )
}
