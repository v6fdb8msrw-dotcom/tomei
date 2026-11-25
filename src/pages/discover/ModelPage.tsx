// Modellseite: Beschreibung (Wikipedia), Import ins eigene Land, wo suchen, passende Teile, Straßen im
// Herkunftsland und die Besichtigungs-Checkliste. Erreichbar über #/discover/models/<id>.
import { ArrowRight, ArrowLeft, Calculator, Check, ClipboardCheck, Plus, Search, TriangleAlert, X } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { PRICE_SOURCE } from '../../classics.ts'
import { sendToCalc } from '../../data.ts'
import { DIR_COUNTRY } from '../../data/directory.ts'
import { IMPORT_RULES, ruleById } from '../../data/importRules.ts'
import { CHECK_SOURCES, checklistFor } from '../../data/checklist.ts'
import { ROADS, roadImg, roadThumb } from '../../data/roads.ts'
import { catalogueIfLoaded, loadCatalogue, loadPhotos, modelImg, modelThumb, photosIfLoaded, type CarModel, type ModelPhotos, type Photo } from '../../components/ModelFinder.tsx'
import { Badge, EmptyState, NotFound, SourceLink } from '../../components/ui.tsx'
import { useT } from '../../i18n/i18n.ts'
import { href, navigate } from '../../lib/router.ts'
import { genName, loadSpecs, specsIfLoaded, rangeText, specText, type Spec } from '../../lib/specs.ts'
import { weakSpotsFor } from '../../data/weakspots.ts'
import { addVehicle, setSettings, useStore } from '../../store/store.ts'
import { Details } from '../../components/QuickInput.tsx'
import { PortalQuotes } from '../../components/PortalQuotes.tsx'
import { Workshops } from '../../components/Workshops.tsx'
import { CLASS_LABEL } from '../../components/ModelFinder.tsx'

const YEAR = new Date().getFullYear()
const CALC_ORIGINS = new Set(['jp', 'us', 'uk', 'ca', 'au'])
const EU = new Set(['de', 'it', 'fr', 'se', 'at', 'nl', 'ch', 'es', 'be'])

type Texts = Record<string, { en?: string; de?: string }>
let textCache: Promise<Texts> | null = null
const loadTexts = () => (textCache ??= import('../../data/models_text.json').then((m) => m.default as Texts))

export function ModelPage({ id }: { id: string }) {
  const { tx, L, d, lang, locale } = useT()
  const [m, setM] = useState<CarModel | null | undefined>(() => catalogueIfLoaded()?.find((x) => x.id === id))
  const [txt, setTxt] = useState<{ en?: string; de?: string }>({})
  const home = useStore((s) => s.settings.homeCountry) || 'de'
  const vehicles = useStore((s) => s.vehicles)
  const [pics, setPics] = useState<ModelPhotos>(photosIfLoaded() ?? {})
  const [spec, setSpec] = useState<Spec | undefined>(() => specsIfLoaded()?.[id])
  const [byName, setByName] = useState<Map<string, string>>(new Map())

  useEffect(() => {
    let alive = true
    setM(catalogueIfLoaded()?.find((x) => x.id === id))
    setSpec(specsIfLoaded()?.[id])
    loadCatalogue().then((all) => {
      if (!alive) return
      setM(all.find((x) => x.id === id) ?? null)
      setByName(new Map(all.filter((x) => x.wp).map((x) => [x.n.toLowerCase(), x.id])))
    })
    loadSpecs().then((s) => alive && setSpec(s[id]))
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
  const roads = ROADS.filter((r) => r.country === m.cc).slice(0, 3)
  const checks = checklistFor({ age, origin: m.cc })
  const have = vehicles.find((v) => v.modelId === m.id)
  const text = (lang === 'de' && txt.de) || txt.en
  const shots = pics[m.id] ?? []
  const textLang = lang === 'de' && txt.de ? 'de' : 'en'
  const cover = shots.length ? modelImg(m.id) : roads[0] ? roadImg(roads[0].id) : roadImg('stelvio')
  const weak = weakSpotsFor(m)
  const wikiUrl = m.wp ?? spec?.wp?.replace(/ /g, '_')
  const ageOk = rule.age && age !== undefined ? age >= rule.age.years : undefined

  const save = () => {
    const v = have ?? addVehicle({ make: m.mk, model: m.md, year: m.y0, status: 'dream', market: m.cc, modelId: m.id, source: 'finder' })
    navigate('own/garage/' + v.id)
  }

  return (
    <>
      <header className="mag-hero">
        <div className="mag-hero-img" data-vt={'model-' + m.id} style={shots.length ? { backgroundImage: `url(${modelThumb(m.id)})` } : undefined}>
          <img src={cover} alt={shots.length ? m.n : ''} onError={(e) => shots.length && (e.currentTarget.src = modelThumb(m.id))} />
        </div>
        <div className="mag-hero-text">
          <a className="phead-back" href={href('discover/search/modelle')}>
            <ArrowLeft size={15} /> {tx('Modell-Katalog', 'Model catalogue')}
          </a>
          <p className="eyebrow">
            {c?.flag} {c ? L(c.name) : ''} · {m.cl && CLASS_LABEL[m.cl] ? L(CLASS_LABEL[m.cl]) : m.mk}
          </p>
          <h1>
            <small>{m.mk}</small>
            {m.n.startsWith(m.mk + ' ') ? m.n.slice(m.mk.length + 1) : m.md}
          </h1>
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
        </div>
        {shots[0] && <p className="mag-credit">{<Credit p={shots[0]} />}</p>}
      </header>

      <BigNumbers m={m} spec={spec} />

      <section className="section narrow" id="angebote">
        <div className="sec-head">
          <p className="eyebrow">{tx('Angebote', 'Listings')}</p>
          <h2>
            {tx('Wo du ihn findest. ', 'Where to find it. ')}
            <em>{tx('Was er wirklich kostet.', 'What it really costs.')}</em>
          </h2>
        </div>
        <PortalQuotes m={m} />
      </section>

      <section className="section narrow mag-story">
        {m.why && <p className="mag-quote">{d(m.why)}</p>}
        {text && (
          <>
            <p className="mag-lead">{text}</p>
            <p className="muted small">
              {tx('Text: Wikipedia', 'Text: Wikipedia')} ({textLang}), CC BY-SA 4.0{wikiUrl && ' · '}
              {wikiUrl && <SourceLink url={`https://en.wikipedia.org/wiki/${wikiUrl}`}>{tx('Artikel', 'Article')}</SourceLink>}
            </p>
          </>
        )}
        {m.usd ? (
          <p className="mag-price">
            <b className="mono">$ {m.usd.toLocaleString(locale)}</b> {tx('Median Angebotspreis Japan', 'Median asking price Japan')} · {PRICE_SOURCE.name}, {PRICE_SOURCE.date}, {PRICE_SOURCE.licence}
          </p>
        ) : null}
      </section>

      {shots.length < 2 && roads[0] && <Break src={roadImg(roads[0].id)} alt={roads[0].name} to={'drive/roads/' + roads[0].id} text={tx(`Straße im Herkunftsland: ${roads[0].name}`, `Road in its home country: ${roads[0].name}`)} />}
      {shots.length > 1 && <Gallery id={m.id} name={m.n} shots={shots} />}

      {spec && <SpecSheet spec={spec} byName={byName} wiki={wikiUrl} />}
      {spec?.gen && <Generations spec={spec} />}

      {weak && (
        <section className="section narrow">
          <div className="sec-head">
            <p className="eyebrow">{tx('Schwachstellen', 'Weak spots')} · {weak.scope}</p>
            <h2>
              {tx('Was bei diesem Modell ', 'What tends to ')}
              <em>{tx('gern kaputtgeht.', 'go wrong here.')}</em>
            </h2>
            <p className="sec-text">{tx('Erfahrungswerte aus Kaufberatungen, sinngemäß zusammengefasst. Keine Ausfallquoten: ob dein Auto betroffen ist, zeigt nur die Besichtigung.', 'Experience from buying guides, summarised. Not failure rates: only an inspection shows whether a given car is affected.')}</p>
          </div>
          <ul className="weak">
            {weak.points.map((w) => (
              <li key={w.de}>
                <TriangleAlert size={17} /> <span>{L(w)}</span>
              </li>
            ))}
          </ul>
          <div className="row gap wrap">
            {weak.sources.map((q2) => (
              <SourceLink key={q2.url} url={q2.url}>
                {q2.label}
              </SourceLink>
            ))}
          </div>
        </section>
      )}

      <section className="section narrow">
        <Details title={tx(`Importregeln ${L(rule.name)}`, `Import rules ${L(rule.name)}`)}>
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
        </Details>
      </section>

      <section className="section narrow">
        <Details title={tx('Besichtigung: worauf du achten solltest', 'Viewing: what to check')}>
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
        </Details>
      </section>

      <section className="section">
        <div className="sec-head">
          <p className="eyebrow">{tx('Werkstätten', 'Workshops')}</p>
          <h2>
            {tx('Werkstätten für ', 'Workshops for ')}
            <em>{m.mk}.</em>
          </h2>
        </div>
        <Workshops make={m.mk} year={m.y0} limit={6} />
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
                  <img src={roadThumb(r.id)} alt={r.name} loading="lazy" />
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

function Credit({ p }: { p: Photo }) {
  const { tx } = useT()
  return (
    <>
      {tx('Foto', 'Photo')}: {p.a},{' '}
      <a href={`https://commons.wikimedia.org/wiki/File:${encodeURIComponent(p.f)}`} target="_blank" rel="noopener noreferrer">
        Wikimedia Commons
      </a>
      , {p.u ? <a href={p.u} target="_blank" rel="noopener noreferrer">{p.l}</a> : p.l} {tx('(verkleinert)', '(resized)')}
    </>
  )
}

/** Große Zahlen quer über die Seite */
function BigNumbers({ m, spec }: { m: CarModel; spec?: Spec }) {
  const { tx, locale } = useT()
  const y0 = m.y0 ?? spec?.y?.[0]
  const y1 = m.y0 ? m.y1 : spec?.y?.[1] || undefined
  const items = [
    y0 && { v: `${y0}–${y1 ?? tx('heute', 'today')}`, u: '', l: tx('Bauzeit', 'Production') },
    spec?.cc && { v: rangeText(spec.cc, locale, (x) => x / 1000, 1)!, u: tx('Liter', 'litres'), l: tx('Hubraum', 'Displacement') },
    spec?.kg && { v: rangeText(spec.kg, locale)!, u: 'kg', l: tx('Gewicht', 'Weight') },
    spec?.l && { v: rangeText(spec.l, locale, (x) => x / 1000, 2)!, u: 'm', l: tx('Länge', 'Length') },
    y0 && { v: String(y0 + 30), u: '', l: YEAR >= y0 + 30 ? tx('Oldtimer seit (erste Baujahre)', 'Classic since (early years)') : tx('Oldtimer ab', 'Classic from') },
  ].filter(Boolean) as { v: string; u: string; l: string }[]
  return (
    <section className="mag-nums">
      {items.map((x) => (
        <div key={x.l}>
          <b className="mono">
            {x.v}
            {x.u && <i>{x.u}</i>}
          </b>
          <span>{x.l}</span>
        </div>
      ))}
    </section>
  )
}

function Break({ src, alt, to, text }: { src: string; alt: string; to?: string; text?: string }) {
  return (
    <figure className="mag-break">
      <img src={src} alt={alt} loading="lazy" />
      {text && <figcaption>{to ? <a href={href(to)}>{text}</a> : text}</figcaption>}
    </figure>
  )
}

function Gallery({ id, name, shots }: { id: string; name: string; shots: Photo[] }) {
  const { tx } = useT()
  const [open, setOpen] = useState<number | null>(null)
  const dlg = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    if (open !== null) dlg.current?.showModal()
    else dlg.current?.close()
  }, [open])
  return (
    <section className={'mag-gallery n' + shots.length}>
      {shots.map((p, k) => (
        <figure key={p.f}>
          <button onClick={() => setOpen(k)} aria-label={tx(`Foto ${k + 1} vergrößern`, `Enlarge photo ${k + 1}`)}>
            <img src={modelImg(id, k)} alt={`${name}, ${tx('Foto', 'photo')} ${k + 1}`} loading="lazy" onError={(e) => (e.currentTarget.closest('figure')!.hidden = true)} />
          </button>
          <figcaption>
            <Credit p={p} />
          </figcaption>
        </figure>
      ))}
      <dialog ref={dlg} className="mag-dialog" onClose={() => setOpen(null)} onClick={(e) => e.target === e.currentTarget && setOpen(null)}>
        {open !== null && (
          <>
            <img src={modelImg(id, open)} alt={name} />
            <p className="small">
              <Credit p={shots[open]} />
            </p>
            <button className="icon-btn" onClick={() => setOpen(null)} aria-label={tx('Schließen', 'Close')}>
              <X size={18} />
            </button>
          </>
        )}
      </dialog>
    </section>
  )
}

function SpecSheet({ spec, byName, wiki }: { spec: Spec; byName: Map<string, string>; wiki?: string }) {
  const { tx, lang, locale } = useT()
  const mm = (r: Spec['l']) => rangeText(r, locale) && `${rangeText(r, locale)} mm`
  const list = (a?: string[]) =>
    a && (
      <ul>
        {a.map((x) => (
          <li key={x}>{specText(x, lang)}</li>
        ))}
      </ul>
    )
  const links = (a?: string[]) =>
    a && (
      <ul>
        {a.map((x) => {
          const to = byName.get(x.toLowerCase())
          return <li key={x}>{to ? <a href={href('discover/models/' + to)}>{x}</a> : x}</li>
        })}
      </ul>
    )
  const rows: [string, ReactNode][] = [
    [tx('Motoren', 'Engines'), list(spec.eng)],
    [tx('Getriebe', 'Gearbox'), list(spec.tr)],
    [tx('Antrieb', 'Layout'), list(spec.lay)],
    [tx('Karosserie', 'Body'), list(spec.body)],
    [tx('Radstand', 'Wheelbase'), mm(spec.wb)],
    [tx('Breite', 'Width'), mm(spec.w)],
    [tx('Höhe', 'Height'), mm(spec.h)],
    [tx('Design', 'Design'), list(spec.des)],
    [tx('Vorgänger', 'Predecessor'), links(spec.pre)],
    [tx('Nachfolger', 'Successor'), links(spec.suc)],
  ]
  const have = rows.filter((r) => r[1])
  if (!have.length) return null
  return (
    <section className="section narrow">
      <div className="sec-head">
        <p className="eyebrow">{tx('Technik', 'Specs')}</p>
        <h2>
          {tx('Unter ', 'Under ')}
          <em>{tx('dem Blech.', 'the skin.')}</em>
        </h2>
      </div>
      <dl className="specs">
        {have.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
      <p className="muted small">
        {tx('Werte aus der Infobox der englischen Wikipedia, automatisch ausgelesen (CC BY-SA 4.0). Spannen umfassen Varianten; einzelne Motoren können fehlen.', 'Values read automatically from the English Wikipedia infobox (CC BY-SA 4.0). Ranges cover variants; individual engines may be missing.')}{' '}
        {wiki && <SourceLink url={`https://en.wikipedia.org/wiki/${wiki}`}>Wikipedia</SourceLink>}
      </p>
    </section>
  )
}

function Generations({ spec }: { spec: Spec }) {
  const { tx, lang, locale } = useT()
  const g = [...(spec.gen ?? [])].sort((a, b) => a.y![0] - b.y![0])
  return (
    <section className="section gens-sec">
      <div className="sec-head">
        <p className="eyebrow">{tx('Zeitstrahl', 'Timeline')}</p>
        <h2>
          {g.length} <em>{tx('Generationen und Varianten.', 'generations and variants.')}</em>
        </h2>
      </div>
      <ol className="gens" tabIndex={0} aria-label={tx('Zeitstrahl der Generationen', 'Timeline of generations')}>
        {g.map((x, k) => (
          <li key={x.n + k}>
            <span className="gens-y mono">
              {x.y![0]}
              {x.y![1] !== x.y![0] && <>–{x.y![1] || tx('heute', 'today')}</>}
            </span>
            <b>{genName(x.n, lang)}</b>
            {x.eng?.[0] && <span>{specText(x.eng[0], lang)}</span>}
            <span className="muted small mono">{[x.kg && `${rangeText(x.kg, locale)} kg`, x.l && `${rangeText(x.l, locale, (v) => v / 1000, 2)} m`].filter(Boolean).join(' · ')}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}
