// Fahrzeugsuche: ein Feld, darunter die Modelle. Ein Klick öffnet das Profil mit Angeboten und Gesamtkosten.
import { ArrowUpRight, Heart } from 'lucide-react'
import { useState } from 'react'
import { MORE_MARKETS } from '../components/PortalQuotes.tsx'
import { Finds } from '../components/Finds.tsx'
import { ModelFinder } from '../components/ModelFinder.tsx'
import { Details } from '../components/QuickInput.tsx'
import { PageHead, img } from '../components/ui.tsx'
import { useT } from '../i18n/i18n.ts'
import { roadImg } from '../data/roads.ts'
import { useStore } from '../store/store.ts'
import { href } from '../lib/router.ts'

export function Markets() {
  const { tx, d } = useT()
  const [label, setLabel] = useState('')
  const saved = useStore((s) => s.vehicles.filter((v) => v.status === 'dream' || v.status === 'watchlist'))
  const [make, ...rest] = label.trim().split(/\s+/)
  const q = { make: make ?? '', model: rest.join(' ') }
  return (
    <>
      <PageHead
        eyebrow={tx('Discover · Fahrzeugsuche', 'Discover · Vehicle search')}
        title={
          <>
            {tx('Welches Auto ', 'Which car ')}
            <em>{tx('suchst du?', 'are you after?')}</em>
          </>
        }
        sub={tx('Tipp ein Modell ein. Im Profil siehst du Bilder, Technik, Angebote weltweit und was er bis vor deine Tür kostet.', 'Type a model. Its profile shows photos, specs, listings worldwide and the cost to your door.')}
        images={[img('cars/r34'), img('cars/esprit'), roadImg('stelvio')]}
      />
      <section className="section tight" id="modelle">
        <ModelFinder onText={setLabel} />
      </section>
      <section className="section narrow search-more">
        {saved.length > 0 && (
          <p>
            <Heart size={15} /> <a href={href('own/garage')}>{tx(`${saved.length} gemerkte Autos in der Garage`, `${saved.length} saved cars in your garage`)}</a>
          </p>
        )}
        <Details title={tx('Inserat gefunden? Link und Preis merken', 'Found a listing? Save link and price')}>
          <Finds defaultTitle={label} />
        </Details>
        <Details title={tx('Weitere Länder: Korea, Dubai, Kanada, Thailand …', 'More countries: Korea, Dubai, Canada, Thailand …')}>
          <p className="muted small">{tx('Für diese Länder gibt es keine belegten Kosten. Der Link sucht nach dem Text oben.', 'No documented costs for these countries. Links search for the text above.')}</p>
          <div className="row gap wrap">
            {MORE_MARKETS.flatMap((m) =>
              m.portals.map((p) => (
                <a key={p.name} className="btn small" href={p.url(q.make ? q : { make: 'Toyota', model: '' })} target="_blank" rel="noopener noreferrer">
                  {d(m.country)}: {p.name} <ArrowUpRight size={13} />
                </a>
              )),
            )}
          </div>
        </Details>
      </section>
    </>
  )
}
