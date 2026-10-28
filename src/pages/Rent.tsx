import { Info } from 'lucide-react'
import { HERO, RENT } from '../data.ts'
import { Hero, ProviderGrid, Reveal, SectionHead } from '../components/motion.tsx'

export function Rent() {
  return (
    <>
      <Hero
        slides={HERO.rent}
        eyebrow="Chapter 02 · Rent"
        title={<>Drive it on <em>its home ground.</em></>}
        sub="GT-R am Fuß des Fuji buchen. Hakone bei Sonnenaufgang fahren. Oder Japans neueste Privatstrecke in einem weißen Supra umrunden."
        chips={['GT-R R35', 'Supra 2JZ', 'RX-7 FD', 'NSX']}
      />
      <section className="section">
        <SectionHead eyebrow="Vermieter" title={<>Such dir deinen <em>Anbieter</em> aus.</>} text="Kurzzeit-Miete direkt in Japan, von Tokio bis Hakone. Alle Links führen zu den Anbietern selbst." />
        <ProviderGrid items={RENT} />
        <Reveal className="note glass">
          <Info size={18} />
          <p>
            Zum Fahren in Japan brauchst du eine gültige Fahrerlaubnis. Wer einen <strong>deutschen Führerschein</strong> hat, braucht eine offizielle
            <strong> JAF-Übersetzung</strong>, keinen Internationalen Führerschein (IDP). Fahrer aus vielen anderen Ländern brauchen den IDP nach dem Genfer Abkommen.
          </p>
        </Reveal>
      </section>
    </>
  )
}
