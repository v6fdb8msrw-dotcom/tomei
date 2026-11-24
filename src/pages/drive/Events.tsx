// Events: zeigt immer die aktuelle Woche (Montag bis Sonntag), dazu Blättern, Filter und die nächsten Termine.
import { ArrowLeft, ArrowRight, CalendarPlus } from 'lucide-react'
import { useEffect, useState } from 'react'
import data from '../../data/events.json'
import { BRAND } from '../../config/brand.ts'
import { ROADS, roadImg } from '../../data/roads.ts'
import { EmptyState, Note, PageHead, SourceLink, fmtDate, img } from '../../components/ui.tsx'
import { useT } from '../../i18n/i18n.ts'
import { eventsBetween, iso, shiftDays, weekOf, type CarEvent, type EventKind } from '../../lib/events.ts'
import { toIcs } from '../../lib/maintenance.ts'
import { href } from '../../lib/router.ts'
import { downloadFile } from '../../store/store.ts'

const ALL = data as CarEvent[]
const KIND: Record<EventKind, { de: string; en: string }> = {
  show: { de: 'Messe & Show', en: 'Show' },
  classic: { de: 'Klassiker', en: 'Classics' },
  auction: { de: 'Auktion', en: 'Auction' },
  race: { de: 'Rennen', en: 'Race' },
  rally: { de: 'Rallye', en: 'Rally' },
  meet: { de: 'Treffen', en: 'Meet' },
}
const flag = (cc: string) => String.fromCodePoint(...[...(cc === 'uk' ? 'gb' : cc).toUpperCase()].map((c) => 127397 + c.charCodeAt(0)))

export function Events() {
  const { tx, L, locale } = useT()
  const [today, setToday] = useState(() => iso(new Date()))
  const [off, setOff] = useState(0)
  const [kind, setKind] = useState<EventKind | 'all'>('all')
  // Bleibt die Seite über Mitternacht offen, zieht „diese Woche“ mit
  useEffect(() => {
    const check = () => setToday(iso(new Date()))
    const t = setInterval(check, 60_000)
    document.addEventListener('visibilitychange', check)
    return () => {
      clearInterval(t)
      document.removeEventListener('visibilitychange', check)
    }
  }, [])
  const w = weekOf(today, off)
  const pick = (l: CarEvent[]) => l.filter((e) => kind === 'all' || e.k === kind)
  const week = pick(eventsBetween(ALL, w.from, w.to))
  const next = pick(ALL.filter((e) => e.a > w.to)).slice(0, 12)
  const tracks = ROADS.filter((r) => r.kind === 'track')
  const range = (e: CarEvent) => (e.a === e.b ? fmtDate(e.a, locale) : `${fmtDate(e.a, locale)} – ${fmtDate(e.b, locale)}`)
  const row = (e: CarEvent) => (
    <article key={e.n + e.a} className={'ev' + (e.a <= today && e.b >= today ? ' now' : '')}>
      <div className="ev-date mono">{range(e)}</div>
      <div>
        <span className="chip">{L(KIND[e.k])}</span>
        {e.a <= today && e.b >= today && <span className="badge b-ok">{tx('Heute', 'Today')}</span>}
        <h3>{e.n}</h3>
        <p className="muted small">
          {flag(e.cc)} {e.p}
        </p>
      </div>
      <SourceLink url={e.s} />
    </article>
  )
  return (
    <>
      <PageHead
        eyebrow="Drive · Events"
        title={
          <>
            {tx('Was läuft ', 'What’s on ')}
            <em>{tx('diese Woche.', 'this week.')}</em>
          </>
        }
        sub={tx('Messen, Klassiker, Rallyes und Rennen weltweit, jeder Termin mit Quelle.', 'Shows, classics, rallies and races worldwide, every date with its source.')}
        images={[img('rent-track'), roadImg('nordschleife'), img('parts-show')]}
      />
      <section className="section">
        <div className="ev-bar">
          <button className="icon-btn" onClick={() => setOff(off - 1)} aria-label={tx('Vorige Woche', 'Previous week')}>
            <ArrowLeft size={17} />
          </button>
          <h2>
            {off === 0 ? tx('Diese Woche', 'This week') : tx('Woche', 'Week')} <em>{fmtDate(w.from, locale)} – {fmtDate(w.to, locale)}</em>
          </h2>
          <button className="icon-btn" onClick={() => setOff(off + 1)} aria-label={tx('Nächste Woche', 'Next week')}>
            <ArrowRight size={17} />
          </button>
          {off !== 0 && (
            <button className="btn small" onClick={() => setOff(0)}>
              {tx('Heute', 'Today')}
            </button>
          )}
        </div>
        <div className="seg wrap parts-filter">
          <button className={kind === 'all' ? 'on' : ''} onClick={() => setKind('all')}>
            {tx('Alle', 'All')}
          </button>
          {(Object.keys(KIND) as EventKind[]).map((k) => (
            <button key={k} className={kind === k ? 'on' : ''} onClick={() => setKind(k)}>
              {L(KIND[k])}
            </button>
          ))}
        </div>
        {week.length ? <div className="evs">{week.map(row)}</div> : <EmptyState title={tx('Für diese Woche ist kein Termin eingetragen.', 'No dates listed for this week.')} text={tx('Darunter stehen die nächsten Termine.', 'The next dates are listed below.')} />}
        {week.length > 0 && (
          <button className="btn small" onClick={() => downloadFile(`${BRAND.ascii.toLowerCase()}-events-${w.from}.ics`, toIcs(week.flatMap((e) => Array.from({ length: 31 }, (_, i) => shiftDays(e.a, i)).filter((d) => d <= e.b && d >= w.from && d <= w.to).map((date) => ({ title: e.n, date, description: `${e.p} · ${e.s}` }))), `-//${BRAND.ascii}//Events//DE`), 'text/calendar')}>
            <CalendarPlus size={14} /> {tx('Woche in den Kalender', 'Add week to calendar')}
          </button>
        )}
      </section>
      <section className="section">
        <div className="sec-head">
          <h2>{tx('Danach', 'Coming up')}</h2>
        </div>
        <div className="evs">{next.map(row)}</div>
        <Note>{tx('Stand 24.11.2026, von Hand eingetragen. Termine können sich ändern: vor der Anreise beim Veranstalter prüfen. Bei Rennen steht meist nur der Renntag.', 'As of 24 Nov 2026, entered by hand. Dates can change: check with the organiser before travelling. Races usually list race day only.')}</Note>
      </section>
      <section className="section">
        <div className="sec-head">
          <h2>{tx('Rennstrecken', 'Race tracks')}</h2>
          <p className="sec-text">
            {tx('Öffnungszeiten und Touristenfahrten der Nordschleife: ', 'Nordschleife opening times and tourist drives: ')}
            <SourceLink url="https://nuerburgring.de/news/categories/touristenfahrten">nuerburgring.de</SourceLink>
          </p>
        </div>
        <div className="roads">
          {tracks.map((r) => (
            <a key={r.id} className="road" href={href('drive/roads/' + r.id)}>
              <div className="road-img">
                <img src={roadImg(r.id)} alt={r.name} loading="lazy" />
              </div>
              <div className="road-body">
                <h3>{r.name}</h3>
              </div>
            </a>
          ))}
        </div>
      </section>
    </>
  )
}
