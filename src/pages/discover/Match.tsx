// Autofinder „Was passt zu mir?“: ein paar Fragen, danach begründete Vorschläge aus dem Katalog.
import { ArrowRight, Check, RotateCcw } from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { IMPORT_RULES, ruleById } from '../../data/importRules.ts'
import { CLASS_LABEL, catalogueIfLoaded, loadCatalogue, loadPhotos, modelThumb, photosIfLoaded, type CarModel, type ModelPhotos } from '../../components/ModelFinder.tsx'
import { Note, PageHead, img, small } from '../../components/ui.tsx'
import { DIR_COUNTRY } from '../../data/directory.ts'
import { roadImg } from '../../data/roads.ts'
import { useT } from '../../i18n/i18n.ts'
import { href } from '../../lib/router.ts'
import { loadSpecs, specsIfLoaded, type Spec } from '../../lib/specs.ts'
import { matchCars, type Answers, type Use } from '../../lib/match.ts'
import { weakSpotsFor } from '../../data/weakspots.ts'
import { setSettings, useStore } from '../../store/store.ts'

const START: Answers = { use: 'curves', seats: 'any', open: false, era: 'any', drive: 'any', origin: 'any', ageOk: false, manual: false }
const KEY = 'tomei.match'
const load = (): Answers => {
  try {
    return { ...START, ...(JSON.parse(sessionStorage.getItem(KEY) ?? '{}') as Partial<Answers>) }
  } catch {
    return START
  }
}

const USES: { id: Use; img: string; de: string; en: string }[] = [
  { id: 'curves', img: roadImg('stelvio'), de: 'Kurven und Pässe', en: 'Bends and passes' },
  { id: 'cruise', img: roadImg('bigsur'), de: 'Lange Reisen', en: 'Long trips' },
  { id: 'muscle', img: img('cars/mustang'), de: 'V8 und Muscle', en: 'V8 and muscle' },
  { id: 'offroad', img: roadImg('w-dalton-highway'), de: 'Gelände', en: 'Off-road' },
  { id: 'daily', img: roadImg('shimanami'), de: 'Jeden Tag', en: 'Every day' },
  { id: 'town', img: img('shibuya'), de: 'Stadt', en: 'City' },
]

export function MatchPage() {
  const { tx, L, locale } = useT()
  const [a, setA] = useState<Answers>(load)
  const [data, setData] = useState<{ all: CarModel[]; specs: Record<string, Spec>; pics: ModelPhotos } | null>(() => {
    const all = catalogueIfLoaded()
    const specs = specsIfLoaded()
    const pics = photosIfLoaded()
    return all && specs && pics ? { all, specs, pics } : null
  })
  const [n, setN] = useState(9)
  const home = useStore((s) => s.settings.homeCountry) || 'de'
  const rule = ruleById(home) ?? IMPORT_RULES[0]

  useEffect(() => {
    let alive = true
    Promise.all([loadCatalogue(), loadSpecs(), loadPhotos()]).then(([all, specs, pics]) => alive && setData({ all, specs, pics }))
    return () => {
      alive = false
    }
  }, [])
  useEffect(() => {
    setN(9)
    try {
      sessionStorage.setItem(KEY, JSON.stringify(a))
    } catch {
      /* Auswahl wird dann nicht gemerkt */
    }
  }, [a])
  const set = <K extends keyof Answers>(k: K, v: Answers[K]) => setA((x) => ({ ...x, [k]: v }))
  const res = useMemo(() => (data ? matchCars(data.all, data.specs, a, rule.age?.years, (id) => !!data.pics[id]?.length) : []), [data, a, rule])

  const seg = <K extends keyof Answers>(k: K, label: string, opts: [Answers[K], string][]): ReactNode => (
    <div className="match-q">
      <span className="f-label">{label}</span>
      <div className="seg wrap">
        {opts.map(([v, t]) => (
          <button key={String(v)} className={a[k] === v ? 'on' : ''} aria-pressed={a[k] === v} onClick={() => set(k, v)}>
            {t}
          </button>
        ))}
      </div>
    </div>
  )
  const any = tx('Egal', 'Any')

  return (
    <>
      <PageHead
        eyebrow={tx('Discover · Autofinder', 'Discover · Car matcher')}
        title={
          <>
            {tx('Welches Auto ', 'Which car ')}
            <em>{tx('passt zu dir?', 'suits you?')}</em>
          </>
        }
        sub={tx('Ein paar Fragen, dann Vorschläge aus dem Katalog mit Begründung. Es zählen nur nachprüfbare Merkmale, keine Werbung und keine Bewertungen.', 'A few questions, then suggestions from the catalogue with reasons. Only verifiable features count, no ads and no ratings.')}
        image={roadImg('grimsel')}
      />
      <section className="section">
        <span className="f-label">{tx('Wofür vor allem?', 'Mainly for?')}</span>
        <div className="match-uses">
          {USES.map((u) => (
            <button key={u.id} className={a.use === u.id ? 'on' : ''} aria-pressed={a.use === u.id} onClick={() => set('use', u.id)}>
              <img src={small(u.img)} alt="" loading="lazy" />
              <b>{L(u)}</b>
              {a.use === u.id && <Check size={18} />}
            </button>
          ))}
        </div>
        <div className="match-grid">
          {seg('era', tx('Baujahr ab', 'First built'), [['any', any], ['60', tx('bis 1969', 'until 1969')], ['70', tx('70er', '70s')], ['80', tx('80er', '80s')], ['90', tx('90er', '90s')], ['00', tx('ab 2000', 'from 2000')]])}
          {seg('seats', tx('Türen', 'Doors'), [['any', any], ['two', tx('Zweitürer', 'Two-door')], ['four', tx('Viertürer, Kombi', 'Four-door, estate')]])}
          {seg('drive', tx('Antrieb', 'Drive'), [['any', any], ['rear', tx('Hinten', 'Rear')], ['front', tx('Vorn', 'Front')], ['all', tx('Allrad', 'All-wheel')]])}
          {seg('origin', tx('Herkunft', 'Origin'), [['any', any], ['jp', 'Japan'], ['us', 'USA'], ['uk', tx('Großbritannien', 'UK')], ['eu', tx('Europa', 'Europe')]])}
        </div>
        <div className="row gap wrap match-toggles">
          {(
            [
              ['open', tx('Offen fahren', 'Open-top')],
              ['manual', tx('Schaltgetriebe', 'Manual gearbox')],
              ...(rule.age ? [['ageOk', tx(`Altersgrenze ${rule.age.years} Jahre erreicht`, `${rule.age.years}-year threshold met`)]] : []),
            ] as ['open' | 'manual' | 'ageOk', string][]
          ).map(([k, t]) => (
            <label key={k} className="cf-toggle">
              <span className="switch">
                <input type="checkbox" checked={a[k]} onChange={(e) => set(k, e.target.checked)} />
                <span />
              </span>
              {t}
            </label>
          ))}
          <label className="cf-toggle">
            {tx('Zielland', 'Destination')}
            <select className="input" value={rule.id} onChange={(e) => setSettings({ homeCountry: e.target.value })}>
              {IMPORT_RULES.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.flag} {L(r.name)}
                </option>
              ))}
            </select>
          </label>
          <button className="btn small" onClick={() => setA(START)}>
            <RotateCcw size={14} /> {tx('Zurücksetzen', 'Reset')}
          </button>
        </div>
      </section>
      <section className="section" aria-live="polite">
        <div className="sec-head">
          <p className="eyebrow">{data ? tx(`${res.length.toLocaleString(locale)} passende Modelle`, `${res.length.toLocaleString(locale)} matching models`) : tx('Katalog wird geladen …', 'Loading catalogue …')}</p>
          <h2>
            {tx('Deine ', 'Your ')}
            <em>{tx('Vorschläge.', 'matches.')}</em>
          </h2>
        </div>
        {data && res.length === 0 && <Note>{tx('Nichts passt zu allen Antworten. Nimm eine Einschränkung heraus.', 'Nothing matches every answer. Remove a restriction.')}</Note>}
        <div className="match-res">
          {res.slice(0, n).map(({ m, why }, k) => (
            <a key={m.id} href={href('discover/models/' + m.id)} className="match-card">
              <div className="match-img" data-vt={'model-' + m.id}>
                {data?.pics[m.id]?.length ? <img src={modelThumb(m.id)} alt="" loading="lazy" /> : <span>{m.mk}</span>}
                <i className="mono">{k + 1}</i>
              </div>
              <div className="match-body">
                <span className="muted small">
                  {DIR_COUNTRY[m.cc]?.flag} {m.cl && CLASS_LABEL[m.cl] ? L(CLASS_LABEL[m.cl]) : ''} {m.y0 ? `· ${m.y0}${m.y1 ? '–' + m.y1 : ''}` : ''}
                </span>
                <h3>{m.n}</h3>
                <ul>
                  {why.slice(0, 4).map((w) => (
                    <li key={w.de}>
                      <Check size={13} /> {L(w)}
                    </li>
                  ))}
                  {weakSpotsFor(m) && (
                    <li>
                      <Check size={13} /> {tx('Schwachstellen dokumentiert', 'Weak spots documented')}
                    </li>
                  )}
                </ul>
                <span className="tool-go">
                  {tx('Ansehen', 'View')} <ArrowRight size={14} />
                </span>
              </div>
            </a>
          ))}
        </div>
        {res.length > n && (
          <div className="row center">
            <button className="btn" onClick={() => setN(n + 12)}>
              {tx('Mehr zeigen', 'Show more')}
            </button>
          </div>
        )}
        <p className="disclaimer">
          {tx('Merkmale aus Wikidata und der englischen Wikipedia; sie gelten für die ganze Baureihe, nicht für jede Variante. Fehlt ein Merkmal in der Quelle, fällt das Modell bei dieser Einschränkung heraus. Ein Budget fragt der Finder nicht ab, weil es für die meisten Modelle keine freie Preisquelle gibt.', 'Features from Wikidata and English Wikipedia; they apply to the whole model line, not every variant. If the source lacks a feature, the model drops out for that restriction. The matcher does not ask for a budget because most models have no free price source.')}
        </p>
      </section>
    </>
  )
}
