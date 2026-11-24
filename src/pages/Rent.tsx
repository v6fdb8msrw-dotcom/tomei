import { Info } from 'lucide-react'
import { useState } from 'react'
import { RENT } from '../data.ts'
import { DIR_COUNTRY, RENT_MORE } from '../data/directory.ts'
import { ProviderGrid, Reveal, SectionHead } from '../components/motion.tsx'
import { useT } from '../i18n/i18n.ts'
import { PageHead, img } from '../components/ui.tsx'
import { roadImg } from '../data/roads.ts'

export function Rent() {
  const { tx, L } = useT()
  const [cc, setCc] = useState('all')
  const countries = [...new Set(RENT_MORE.map((r) => r.cc))]
  const world = RENT_MORE.filter((r) => cc === 'all' || r.cc === cc).map((r) => ({ name: r.name, url: r.url, text: L(r.text), tag: `${DIR_COUNTRY[r.cc].flag} ${L(DIR_COUNTRY[r.cc].name)}` }))
  return (
    <>
      <PageHead
        eyebrow={tx('Drive · Sportwagen mieten', 'Drive · Rent a sports car')}
        title={
          <>
            {tx('Fahren, bevor du kaufst. ', 'Drive it before you buy. ')}
            <em>{tx('Weltweit.', 'Worldwide.')}</em>
          </>
        }
        sub={tx('Sportwagen und Rennstrecken-Autos mieten: in Japan, am Nürburgring, in den USA und überall, wo große Vermieter Sportwagen anbieten. Ein Verzeichnis ohne Provision und ohne Bewertungen; Preise und Bedingungen stehen beim Anbieter.', 'Rent sports cars and track cars: in Japan, at the Nürburgring, in the USA and wherever major rental companies offer sports cars. A directory without commission or ratings; prices and terms are on the provider’s site.')}
        images={[img('rent-supra'), roadImg('nordschleife'), roadImg('bigsur'), img('rent-track')]}
      />
      <section className="section">
        <SectionHead eyebrow={tx('Weltweit', 'Worldwide')} title={<>{tx('Sportwagen ', 'Sports cars ')}<em>{tx('in vielen Ländern.', 'in many countries.')}</em></>} />
        <div className="seg wrap parts-filter">
          <button className={cc === 'all' ? 'on' : ''} onClick={() => setCc('all')}>
            {tx('Alle', 'All')} ({RENT_MORE.length})
          </button>
          {countries.map((c) => (
            <button key={c} className={cc === c ? 'on' : ''} onClick={() => setCc(c)}>
              {DIR_COUNTRY[c].flag} {L(DIR_COUNTRY[c].name)}
            </button>
          ))}
        </div>
        <ProviderGrid items={world} />
      </section>
      <section className="section">
        <SectionHead eyebrow={tx('Japan', 'Japan')} title={<>{tx('JDM ', 'JDM ')}<em>{tx('vor Ort fahren.', 'on home ground.')}</em></>} />
        <ProviderGrid items={RENT} />
        <Reveal className="note glass">
          <Info size={18} />
          <p>
            {tx('Mit ', 'With a ')}<strong>{tx('deutschem Führerschein', 'German driving licence')}</strong>{tx(' brauchst du in Japan eine offizielle ', ' you need an official ')}<strong>{tx('JAF-Übersetzung', 'JAF translation')}</strong>{tx(', keinen Internationalen Führerschein. Fahrer aus vielen anderen Ländern brauchen den IDP.', ' in Japan, not an International Driving Permit. Drivers from many other countries need the IDP.')}
          </p>
        </Reveal>
      </section>
    </>
  )
}
