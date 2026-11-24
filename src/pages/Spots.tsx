// Japans Auto-Spots, eingebettet in den Automotive Atlas (Land Japan).
import { MapPin } from 'lucide-react'
import { SPOTS } from '../data.ts'
import { useT } from '../i18n/i18n.ts'
import { SectionHead, TiltCard } from '../components/motion.tsx'

export function SpotsGrid() {
  const { d } = useT()
  return (
    <section className="section">
      <SectionHead eyebrow="Spots" title={<>Wo Japans Autokultur <em>lebt.</em></>} text="Treffpunkte und Orte der Szene. Einige Fotos sind Symbolbilder (siehe Bildnachweise)." />
      <div className="spots">
        {SPOTS.map((s, k) => (
          <TiltCard key={s.name} className={'spot' + (k === 0 ? ' wide' : '')}>
            <img src={s.img} alt={s.name} loading="lazy" />
            <div className="spot-veil" />
            <div className="spot-body">
              <span className="spot-jp">{s.jp}</span>
              <h3>{s.name}</h3>
              <p>{d(s.text)}</p>
              <a className="spot-map" href={s.maps} target="_blank" rel="noopener noreferrer">
                <MapPin size={14} /> {s.area} · Karte
              </a>
            </div>
          </TiltCard>
        ))}
      </div>
    </section>
  )
}
