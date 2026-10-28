import { ArrowRight, MapPin } from 'lucide-react'
import { HERO, SPOTS, type Tab } from '../data.ts'
import { Hero, ParallaxBand, Reveal, SectionHead, TiltCard } from '../components/motion.tsx'

const img = (name: string) => `${import.meta.env.BASE_URL}images/${name}.jpg`

const CHAPTERS: { tab: Tab; title: string; text: string; img: string }[] = [
  { tab: 'rent', title: 'Rent', text: 'JDM mieten in Japan.', img: img('rent-supra') },
  { tab: 'import', title: 'Import', text: 'Kosten bis vor die Tür berechnen.', img: img('import-ship') },
  { tab: 'parts', title: 'Parts', text: 'Teile und Gadgets aus Japan.', img: img('parts-show') },
]

export function Spots({ go }: { go: (t: Tab) => void }) {
  return (
    <>
      <Hero
        slides={HERO.spots}
        eyebrow="The Japanese Car Experience"
        title={
          <>
            <span className="wordmark-xl">TŌMEI</span>
            <span className="tagline">Rent it. Import it. <em>Build it.</em></span>
          </>
        }
      />

      <section className="section">
        <SectionHead eyebrow="Spots" title={<>Wo Japans Autokultur <em>lebt.</em></>} />
        <div className="spots">
          {SPOTS.map((s, k) => (
            <TiltCard key={s.name} className={'spot' + (k === 0 ? ' wide' : '')}>
              <img src={s.img} alt={s.name} loading="lazy" />
              <div className="spot-veil" />
              <div className="spot-body">
                <span className="spot-jp">{s.jp}</span>
                <h3>{s.name}</h3>
                <p>{s.text}</p>
                <a className="spot-map" href={s.maps} target="_blank" rel="noopener noreferrer">
                  <MapPin size={14} /> {s.area} · Karte
                </a>
              </div>
            </TiltCard>
          ))}
        </div>
      </section>

      <ParallaxBand src={img('wangan')}>
        <Reveal>
          <p className="eyebrow">TŌMEI · 透明</p>
          <h2 className="band-title">„Tōmei“ heißt durchsichtig.</h2>
        </Reveal>
      </ParallaxBand>

      <section className="section">
        <SectionHead eyebrow="Mehr" title={<>Mieten, importieren, <em>tunen.</em></>} />
        <div className="chapters">
          {CHAPTERS.map((c) => (
            <TiltCard key={c.tab} className="chapter" onClick={() => go(c.tab)}>
              <img src={c.img} alt="" loading="lazy" />
              <div className="chapter-veil" />
              <div className="chapter-body">
                <h3>{c.title}</h3>
                <p>{c.text}</p>
                <span className="chapter-go">
                  Öffnen <ArrowRight size={16} />
                </span>
              </div>
            </TiltCard>
          ))}
        </div>
      </section>
    </>
  )
}
