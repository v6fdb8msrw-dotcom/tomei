import { PARTS } from '../data.ts'
import { useT } from '../i18n/i18n.ts'
import { ProviderGrid, SectionHead } from '../components/motion.tsx'

/** Teile-Shops (bisher mit Schwerpunkt Japan) */
export function PartsShops() {
  const { tx } = useT()
  return (
    <section className="section">
      <SectionHead eyebrow="Shops" title={<>{tx('Teile und Tuning ', 'Parts and tuning ')}<em>{tx('aus aller Welt.', 'from around the world.')}</em></>} />
      <ProviderGrid items={PARTS} />
    </section>
  )
}
