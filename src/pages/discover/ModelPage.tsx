// Modellseite: Beschreibung (Wikipedia), Import ins eigene Land, wo suchen, passende Teile, Straßen im
// Herkunftsland und die Besichtigungs-Checkliste. Erreichbar über #/discover/models/<id>.
import { ArrowRight, ArrowUpRight, Calculator, Check, ClipboardCheck, Plus, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { PRICE_SOURCE } from '../../classics.ts'
import { MARKETS, sendToCalc } from '../../data.ts'
import { DIR_COUNTRY } from '../../data/directory.ts'
import { IMPORT_RULES, ruleById } from '../../data/importRules.ts'
import { CHECK_SOURCES, checklistFor } from '../../data/checklist.ts'
import { ROADS, roadImg } from '../../data/roads.ts'
import { loadCatalogue, loadPhotos, type CarModel, type ModelPhotos } from '../../components/ModelFinder.tsx'
import { ProviderGrid } from '../../components/motion.tsx'
import { Badge, EmptyState, NotFound, PageHead, SourceLink, img } from '../../components/ui.tsx'
import { useT } from '../../i18n/i18n.ts'
import { href, navigate } from '../../lib/router.ts'
import { addVehicle, setSettings, useStore } from '../../store/store.ts'
import { ALL_SHOPS, fits } from '../Parts.tsx'
import { CLASS_LABEL } from '../../components/ModelFinder.tsx'

const YEAR = new Date().getFullYear()
const CALC_ORIGINS = new Set(['jp', 'us', 'uk', 'ca', 'au'])
const EU = new Set(['de', 'it', 'fr', 'se', 'at', 'nl', 'ch', 'es', 'be'])
/** Fotos der handverlesenen Modelle (lizenziert, siehe CREDITS.md) */
const PHOTO: Record<string, string> = { 'c-r34': 'cars/r34', 'c-fd': 'cars/fd', 'c-s15': 'cars/s15', 'c-evo6': 'cars/evo', 'c-mustang': 'cars/mustang', 'c-esprit': 'cars/esprit', 'c-monaro': 'cars/monaro' }

type Texts = Record<string, { en?: string; de?: string }>
let textCache: Promise<Texts> | null = null
const loadTexts = () => (textCache ??= import('../../data/models_text.json').then((m) => m.default as Texts))

export function ModelPage({ id }: { id: string }) {
  const { tx, L, d, lang } = useT()
  const [m, setM] = useState<CarModel | null | undefined>(undefined)
  const [txt, setTxt] = useState<{ en?: string; de?: string }>({})
  const home = useStore((s) => s.settings.homeCountry) || 'de'
  const vehicles = useStore((s) => s.vehicles)
  const [pics, setPics] = useState<ModelPhotos>({})

  useEffect(() => {
    let alive = true
    loadCatalogue().then((all) => alive && setM(all.find((x) => x.id === id) ?? null))
    loadPhotos().then((x) => alive && setPics(x))
    loadTexts().then((t) => alive && setTxt(t[id] ?? {}))
    return () => {
      alive = false
    }
  }, [id])

  if (m === undefined) return <div className="page-loading" aria-busy="true" />
  if (m === null) return <NotFound />

  const age = m.y0 ? YEAR - m.y0 : undefined
  const c = DIR_COUNTRY[m.cc]
  const rule = ruleById(home) ?? IMPORT_RULES[0]
  const market = MARKETS.find((x) => x.id === (EU.has(m.cc) ? 'eu' : m.cc))
  const q = { make: m.mk, model: m.md.replace(/\s*\(.*\)$/, '') }
  const shops = ALL_SHOPS.filter((s) => fits(s, m.mk))
  const general = ALL_SHOPS.filter((s) => s.makes?.includes('*')).slice(0, 3)
  const roads = ROADS.filter((r) => r.country === m.cc).slice(0, 3)
  const checks = checklistFor({ age, origin: m.cc })
  const have = vehicles.find((v) => v.modelId === m.id)
  const text = (lang === 'de' && txt.de) || txt.en
  const pic = pics[m.id]
  const textLang = lang === 'de' && txt.de ? 'de' : 'en'
  const photo = PHOTO[m.id]
  const cover = photo ? img(photo) : roads[0] ? roadImg(roads[0].id) : roadImg('stelvio')
  const ageOk = rule.age && age !== undefined ? age >= rule.age.years : undefined

  const save = () => {
    const v = have ?? addVehicle({ make: m.mk, model: m.md, year: m.y0, status: 'dream', market: m.cc, modelId: m.id, image: photo, source: 'finder' })
    navigate('own/garage/' + v.id)
  }

  return (
    <>
      <PageHead
        eyebrow={`${c?.flag ?? '🌍'} ${c ? L(c.name) : ''} · ${m.cl && CLASS_LABEL[m.cl] ? L(CLASS_LABEL[m.cl]) : m.mk}`}
        title={
          <>
            {m.mk} <em>{m.md}</em>
          </>
        }
        sub={m.y0 ? tx(`Gebaut ab ${m.y0}${m.y1 ? ` bis ${m.y1}` : ''}.`, `Built from ${m.y0}${m.y1 ? ` to ${m.y1}` : ''}.`) : undefined}
        back={{ to: 'discover/search/modelle', label: tx('Modell-Katalog', 'Model catalogue') }}
        image={cover}
      >
        <div className="row gap wrap">
          <button className="btn primary" onClick={save}>
            {have ? <Check size={16} /> : <Plus size={16} />} {have ? tx('In der Garage öffnen', 'Open in garage') : tx('In die Garage', 'Add to garage')}
          </button>
          {CALC_ORIGINS.has(m.cc) && (
            <button className="btn" onClick={() => sendToCalc({ id: 'mp-' + m.id, title: m.n, url: '', price: m.usd ?? 0, cur: 'USD', market: m.usd ? 'jp' : m.cc, added: new Date().toISOString() })}>
              <Calculator size={16} /> {tx('Import durchrechnen', 'Calculate import')}
            </button>
          )}
        </div>
      </PageHead>

      <section className="section narrow">
        <div className="mp-facts">
          <div>
            <span>{tx('Bauzeit', 'Production')}</span>
            <b className="mono">{m.y0 ? `${m.y0}–${m.y1 ?? tx('heute', 'today')}` : '–'}</b>
          </div>
          <div>
            <span>{tx('Herkunft', 'Origin')}</span>
            <b>
              {c?.flag} {c ? L(c.name) : m.cc.toUpperCase()}
            </b>
          </div>
          <div>
            <span>{tx('Oldtimer (30 Jahre)', 'Classic (30 years)')}</span>
            <b>{m.y0 ? (age! >= 30 ? tx('ja, erste Baujahre', 'yes, early years') : tx(`ab ${m.y0 + 30}`, `from ${m.y0 + 30}`)) : '–'}</b>
          </div>
          {m.usd ? (
            <div>
              <span>
                {tx('Median Angebotspreis Japan', 'Median asking price Japan')} · {PRICE_SOURCE.name}, {PRICE_SOURCE.date}
              </span>
              <b className="mono">$ {m.usd.toLocaleString('de-DE')}</b>
            </div>
          ) : null}
        </div>
        {pic && (
          <figure className="mp-photo">
            <img src={img('models/' + m.id)} alt={m.n} />
            <figcaption className="muted small">
              {tx('Foto', 'Photo')}: {pic.a},{' '}
              <a href={`https://commons.wikimedia.org/wiki/File:${encodeURIComponent(pic.f)}`} target="_blank" rel="noopener noreferrer">
                Wikimedia Commons
              </a>
              , {pic.u ? <a href={pic.u} target="_blank" rel="noopener noreferrer">{pic.l}</a> : pic.l} {tx('(verkleinert)', '(resized)')}
            </figcaption>
          </figure>
        )}
        {text && (
          <div className="gcard mp-text">
            <p>{text}</p>
            <p className="muted small">
              {tx('Text: Wikipedia', 'Text: Wikipedia')} ({textLang === 'de' ? 'de' : 'en'}), CC BY-SA 4.0 ·{' '}
              {m.wp && <SourceLink url={`https://en.wikipedia.org/wiki/${m.wp}`}>{tx('Artikel', 'Article')}</SourceLink>}
            </p>
          </div>
        )}
        {m.why && <p className="cf-why">{d(m.why)}</p>}
      </section>

      <section className="section narrow">
        <div className="sec-head">
          <p className="eyebrow">Import</p>
          <h2>
            {tx('Nach ', 'To ')}
            <em>
              {rule.flag} {L(rule.name)}.
            </em>
          </h2>
        </div>
        <div className="seg wrap parts-filter">
          {IMPORT_RULES.map((r) => (
            <button key={r.id} className={r.id === rule.id ? 'on' : ''} onClick={() => setSettings({ homeCountry: r.id })}>
              {r.flag} {L(r.name)}
            </button>
          ))}
        </div>
        <div className="gcard mp-rule">
          {EU.has(m.cc) && rule.id !== 'ch' && EU.has(rule.id) ? (
            <p>{tx('Innerhalb der EU fällt beim Kauf kein Zoll an; das Auto wird im Zielland nur umgemeldet bzw. zugelassen.', 'Within the EU there is no customs duty; the car only needs to be re-registered in the destination country.')}</p>
          ) : (
            <p>{L(rule.taxes)}</p>
          )}
          {rule.age && (
            <p>
              <Badge kind={ageOk ? 'ok' : 'warn'}>{ageOk ? tx('Früheste Baujahre erfüllen die Grenze', 'Earliest cars meet the threshold') : tx('Altersgrenze noch nicht erreicht', 'Age threshold not yet met')}</Badge> {L(rule.age.text)}
            </p>
          )}
          <a className="link" href={href('discover/rules/' + rule.id)}>
            {tx('Alle Schritte und offiziellen Quellen', 'All steps and official sources')} →
          </a>
        </div>
      </section>

      {market && (
        <section className="section narrow">
          <div className="sec-head">
            <p className="eyebrow">{tx('Wo suchen', 'Where to search')}</p>
            <h2>
              {tx('Inserate ', 'Listings ')}
              <em>{tx('im Herkunftsland.', 'in the home country.')}</em>
            </h2>
            <p className="sec-text">{tx('Öffnet die öffentliche Suche der Portale mit diesem Modell. Ob es gerade angeboten wird, zeigt erst das Portal.', 'Opens the public search of each marketplace for this model. Whether it is currently offered only the marketplace can show.')}</p>
          </div>
          <div className="portal-list">
            {market.portals.map((p) => (
              <a key={p.name} className="portal" href={p.url(q)} target="_blank" rel="noopener noreferrer">
                <b>{p.name}</b>
                <span>{d(p.kind)}</span>
                <ArrowUpRight size={15} />
              </a>
            ))}
          </div>
        </section>
      )}

      <section className="section">
        <div className="sec-head">
          <p className="eyebrow">{tx('Teile', 'Parts')}</p>
          <h2>
            {tx('Shops für ', 'Shops for ')}
            <em>{m.mk}.</em>
          </h2>
        </div>
        <ProviderGrid items={[...shops, ...general].map((s) => ({ name: s.name, url: s.url, text: s.text.en ? L(s.text) : d(s.text.de), tag: `${DIR_COUNTRY[s.cc].flag} ${L(DIR_COUNTRY[s.cc].name)}` }))} />
      </section>

      <section className="section narrow">
        <div className="sec-head">
          <p className="eyebrow">{tx('Kaufberatung', 'Buying guide')}</p>
          <h2>
            {tx('Worauf du bei der ', 'What to check at the ')}
            <em>{tx('Besichtigung achtest.', 'viewing.')}</em>
          </h2>
          <p className="sec-text">{tx('Zugeschnitten auf Alter und Herkunft. In der Garage kannst du die Punkte je Auto abhaken.', 'Tailored to age and origin. In the garage you can tick them off per car.')}</p>
        </div>
        <div className="mp-checks">
          {checks.map((g) => (
            <div key={g.id} className="gcard">
              <h3>{L(g.title)}</h3>
              <ul>
                {g.items.map((i) => (
                  <li key={i.id}>{L(i.t)}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="row gap wrap">
          <button className="btn primary" onClick={save}>
            <ClipboardCheck size={16} /> {tx('In der Garage abhaken', 'Tick off in the garage')}
          </button>
          {CHECK_SOURCES.map((s) => (
            <SourceLink key={s.url} url={s.url}>
              {s.label}
            </SourceLink>
          ))}
        </div>
      </section>

      {roads.length > 0 && (
        <section className="section">
          <div className="sec-head">
            <p className="eyebrow">Roads</p>
            <h2>
              {tx('Straßen in ', 'Roads in ')}
              <em>{c ? L(c.name) : ''}.</em>
            </h2>
          </div>
          <div className="roads">
            {roads.map((r) => (
              <a key={r.id} className="road" href={href('drive/roads/' + r.id)}>
                <div className="road-img">
                  <img src={roadImg(r.id)} alt={r.name} loading="lazy" />
                </div>
                <div className="road-body">
                  <h3>{d(r.name)}</h3>
                  <span className="tool-go">
                    {tx('Ansehen', 'View')} <ArrowRight size={14} />
                  </span>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      <section className="section narrow">
        <EmptyState
          title={tx('Ein anderes Modell?', 'Another model?')}
          text={tx('Über 1.100 Modelle im Katalog.', 'Over 1,100 models in the catalogue.')}
          actions={[{ to: 'discover/search/modelle', label: tx('Zum Katalog', 'Open catalogue'), primary: true }]}
        />
        <p className="muted small">
          <Search size={12} /> {tx('Quelle der Modelldaten: Wikidata (CC0) und Wikipedia.', 'Model data source: Wikidata (CC0) and Wikipedia.')}
        </p>
      </section>
    </>
  )
}
