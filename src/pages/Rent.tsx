import { Info } from 'lucide-react'
import { RENT } from '../data.ts'
import { ProviderGrid, Reveal, SectionHead } from '../components/motion.tsx'
import { PageHead, img } from '../components/ui.tsx'

export function Rent() {
  return (
    <>
      <PageHead
        eyebrow="Drive · Sportwagen mieten"
        title={<>Drive it on <em>its home ground.</em></>}
        sub="JDM-Sportwagen direkt in Japan mieten. Ein Verzeichnis ohne Provision und ohne Bewertungen: Preise und Bedingungen stehen beim Anbieter."
        image={img('rent-supra')}
      />
      <section className="section">
        <SectionHead eyebrow="Vermieter" title={<>Such dir deinen <em>Anbieter</em> aus.</>} />
        <ProviderGrid items={RENT} />
        <Reveal className="note glass">
          <Info size={18} />
          <p>
            Mit <strong>deutschem Führerschein</strong> brauchst du eine offizielle <strong>JAF-Übersetzung</strong>, keinen Internationalen Führerschein. Fahrer aus vielen anderen Ländern brauchen den IDP.
          </p>
        </Reveal>
      </section>
    </>
  )
}
