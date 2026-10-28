import { Info } from 'lucide-react'
import { HERO, RENT } from '../data.ts'
import { Hero, ProviderGrid, Reveal, SectionHead } from '../components/motion.tsx'

export function Rent() {
  return (
    <>
      <Hero
        slides={HERO.rent}
        eyebrow="Rent"
        title={<>Drive it on <em>its home ground.</em></>}
        sub="JDM mieten, direkt in Japan."
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
