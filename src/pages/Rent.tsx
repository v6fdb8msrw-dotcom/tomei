import { Info } from 'lucide-react'
import { RENT } from '../data.ts'
import { ProviderGrid, Reveal, SectionHead } from '../components/motion.tsx'
import { useT } from '../i18n/i18n.ts'
import { PageHead, img } from '../components/ui.tsx'

export function Rent() {
  const { tx } = useT()
  return (
    <>
      <PageHead
        eyebrow={tx('Drive · Sportwagen mieten', 'Drive · Rent a sports car')}
        title={<>Drive it on <em>its home ground.</em></>}
        sub={tx('JDM-Sportwagen direkt in Japan mieten. Ein Verzeichnis ohne Provision und ohne Bewertungen: Preise und Bedingungen stehen beim Anbieter.', 'Rent JDM sports cars in Japan. A directory without commission or ratings: prices and terms are on the provider’s site.')}
        image={img('rent-supra')}
      />
      <section className="section">
        <SectionHead eyebrow={tx('Vermieter', 'Rental companies')} title={<>{tx('Such dir deinen ', 'Pick your ')}<em>{tx('Anbieter', 'provider')}</em>{tx(' aus.', '.')}</>} />
        <ProviderGrid items={RENT} />
        <Reveal className="note glass">
          <Info size={18} />
          <p>
            {tx('Mit ', 'With a ')}<strong>{tx('deutschem Führerschein', 'German driving licence')}</strong>{tx(' brauchst du eine offizielle ', ' you need an official ')}<strong>{tx('JAF-Übersetzung', 'JAF translation')}</strong>{tx(', keinen Internationalen Führerschein. Fahrer aus vielen anderen Ländern brauchen den IDP.', ', not an International Driving Permit. Drivers from many other countries need the IDP.')}
          </p>
        </Reveal>
      </section>
    </>
  )
}
