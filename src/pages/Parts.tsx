// Teile-Shops weltweit. Oben Vorschläge passend zu den Marken in der Garage, darunter alle Shops nach Land.
import { useMemo, useState } from 'react'
import { PARTS } from '../data.ts'
import { DIR_COUNTRY, PARTS_MORE, type DirEntry } from '../data/directory.ts'
import { useT } from '../i18n/i18n.ts'
import { ProviderGrid, SectionHead } from '../components/motion.tsx'
import { useStore } from '../store/store.ts'
import { PageHead, img } from '../components/ui.tsx'

/** Japanische Marken: dafür passen die JDM-Shops aus Japan */
const JDM_MAKES = ['Toyota', 'Nissan', 'Honda', 'Mazda', 'Mitsubishi', 'Subaru', 'Suzuki', 'Lexus', 'Daihatsu', 'Isuzu', 'Infiniti', 'Acura', 'Datsun']

const ALL: DirEntry[] = [
  ...PARTS.map((p) => ({ name: p.name, url: p.url, cc: 'jp', makes: JDM_MAKES, text: { de: p.text, en: '' } })),
  ...PARTS_MORE,
]

/** Passt ein Shop zu einer Marke? Ignoriert Groß-/Kleinschreibung und Zusätze wie „Mercedes“ vs. „Mercedes-Benz“. */
function fits(shop: DirEntry, make: string): boolean {
  const m = make.trim().toLowerCase()
  if (!m) return false
  return (shop.makes ?? []).some((x) => x !== '*' && (x.toLowerCase() === m || x.toLowerCase().startsWith(m) || m.startsWith(x.toLowerCase())))
}

export function PartsShops() {
  const { tx, L, d } = useT()
  const makes = useStore((s) => [...new Set(s.vehicles.map((v) => v.make).filter(Boolean))])
  const [cc, setCc] = useState<string>('all')
  const toItem = (s: DirEntry) => ({ name: s.name, url: s.url, text: s.text.en ? L(s.text) : d(s.text.de), tag: `${DIR_COUNTRY[s.cc].flag} ${L(DIR_COUNTRY[s.cc].name)}` })

  const key = makes.join('|')
  const suggested = useMemo(() => {
    const hits = ALL.filter((s) => makes.some((m) => fits(s, m)))
    const general = ALL.filter((s) => s.makes?.includes('*'))
    return hits.length ? [...hits, ...general] : []
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
  const countries = [...new Set(ALL.map((s) => s.cc))]
  const list = ALL.filter((s) => cc === 'all' || s.cc === cc)

  return (
    <>
      {suggested.length > 0 && (
        <section className="section">
          <SectionHead
            eyebrow={tx('Passend zu deiner Garage', 'Matching your garage')}
            title={
              <>
                {tx('Teile für ', 'Parts for ')}
                <em>{makes.join(', ')}.</em>
              </>
            }
            text={tx('Shops, die auf deine Marken spezialisiert sind, dazu Händler für fast alle Marken.', 'Shops specialised in your makes, plus retailers for almost every make.')}
          />
          <ProviderGrid items={suggested.map(toItem)} />
        </section>
      )}
      <section className="section">
        <SectionHead
          eyebrow="Shops"
          title={
            <>
              {tx('Teile und Tuning ', 'Parts and tuning ')}
              <em>{tx('aus aller Welt.', 'from around the world.')}</em>
            </>
          }
          text={tx(`${ALL.length} Shops in ${countries.length} Ländern. Leg ein Auto in der Garage an, dann stehen passende Shops oben.`, `${ALL.length} shops in ${countries.length} countries. Add a car to your garage and matching shops appear at the top.`)}
        />
        <div className="seg wrap parts-filter">
          <button className={cc === 'all' ? 'on' : ''} onClick={() => setCc('all')}>
            {tx('Alle Länder', 'All countries')}
          </button>
          {countries.map((c) => (
            <button key={c} className={cc === c ? 'on' : ''} onClick={() => setCc(c)}>
              {DIR_COUNTRY[c].flag} {L(DIR_COUNTRY[c].name)}
            </button>
          ))}
        </div>
        <ProviderGrid items={list.map(toItem)} />
      </section>
    </>
  )
}

/** Eigene Seite: Own · Teile */
export function PartsPage() {
  const { tx } = useT()
  return (
    <>
      <PageHead
        eyebrow={tx('Own · Teile', 'Own · Parts')}
        title={
          <>
            {tx('Die richtigen Teile. ', 'The right parts. ')}
            <em>{tx('Für dein Auto.', 'For your car.')}</em>
          </>
        }
        sub={tx('Spezialisten für Japaner, Amerikaner, Briten, Deutsche, Italiener und Schweden. Was in deiner Garage steht, bestimmt die Vorschläge.', 'Specialists for Japanese, American, British, German, Italian and Swedish cars. What is in your garage drives the suggestions.')}
        images={[img('parts-wheel'), img('parts-engine'), img('parts-show')]}
      />
      <PartsShops />
    </>
  )
}
