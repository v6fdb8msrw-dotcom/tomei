import { ArrowRight, MapPin } from 'lucide-react'
import { HERO, SPOTS, type Tab } from '../data.ts'
import { Hero, ParallaxBand, Reveal, SectionHead, TiltCard } from '../components/motion.tsx'

const img = (name: string) => `${import.meta.env.BASE_URL}images/${name}.jpg`

const CHAPTERS: { tab: Tab; n: string; title: string; text: string; img: string }[] = [
  { tab: 'rent', n: '02', title: 'Rent', text: 'GT-R am Fuji buchen, Hakone bei Sonnenaufgang fahren, Trackday auf der Privatstrecke.', img: img('rent-supra') },
  { tab: 'import', n: '03', title: 'Import', text: 'Vom Auktionshammer in Yen bis vor deine Haustür, jeder Posten offengelegt.', img: img('import-ship') },
  { tab: 'parts', n: '04', title: 'Parts', text: 'HKS, Nismo, RAYS, ADVAN: Teile und Gadgets direkt aus Japan.', img: img('parts-show') },
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
        sub="Japans legendäre Strecken, JDM-Vermietung vor Ort, Import nach Deutschland und Teile direkt aus Tokio. Alles an einem Ort."
        chips={['Daikoku PA', 'Hakone', 'Wangan', 'Fuji Speedway']}
      />

      <section className="section">
        <SectionHead
          eyebrow={`Chapter 01 · Spots · ${SPOTS.length} Orte`}
          title={<>Wo Japans Autokultur <em>lebt.</em></>}
          text="Von Nacht-Treffs auf Autobahnparkplätzen bis zu Bergstraßen bei Sonnenaufgang: die Orte, an die jeder JDM-Fan einmal will."
        />
        <div className="spots">
          {SPOTS.map((s, k) => (
            <TiltCard key={s.name} className={'spot' + (k === 0 ? ' wide' : '')}>
              <img src={s.img} alt={s.name} loading="lazy" />
              <div className="spot-veil" />
              <span className="spot-n">{String(k + 1).padStart(2, '0')}</span>
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
          <h2 className="band-title">„Tōmei“ heißt durchsichtig. So wie jeder Yen in deinem Import.</h2>
        </Reveal>
      </ParallaxBand>

      <section className="section">
        <SectionHead eyebrow="Weiter" title={<>Drei Wege, Japan <em>zu fahren.</em></>} />
        <div className="chapters">
          {CHAPTERS.map((c) => (
            <TiltCard key={c.tab} className="chapter" onClick={() => go(c.tab)}>
              <img src={c.img} alt="" loading="lazy" />
              <div className="chapter-veil" />
              <div className="chapter-body">
                <span className="chapter-n">Chapter {c.n}</span>
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
