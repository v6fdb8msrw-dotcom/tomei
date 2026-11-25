// Angebote: nur Portale, die dieses Modell führen, mit Direktlink und allen Zusatzkosten bis vor die Tür.
import { ArrowUpRight, ChevronDown } from 'lucide-react'
import { useMemo, useState } from 'react'
import { PRICE_SOURCE } from '../classics.ts'
import { MARKETS } from '../data.ts'
import { IMPORT_RULES, ruleById } from '../data/importRules.ts'
import { portalsFor, queryOf } from '../data/portals.ts'
import { useT } from '../i18n/i18n.ts'
import { useFx } from '../lib/fx.ts'
import { quote } from '../lib/landed.ts'
import { setSettings, useStore } from '../store/store.ts'
import type { CarModel } from './ModelFinder.tsx'
import { Badge } from './ui.tsx'

const FLAG: Record<string, string> = { jp: '🇯🇵', us: '🇺🇸', uk: '🇬🇧', au: '🇦🇺', eu: '🇪🇺' }
const prices = new Map<string, number>()

export function PortalQuotes({ m }: { m: CarModel }) {
  const { tx, L, locale } = useT()
  const { rates, live } = useFx()
  const home = useStore((s) => s.settings.homeCountry) || 'de'
  const rule = ruleById(home) ?? IMPORT_RULES[0]
  const known = m.usd ? Math.round(((m.usd / rates.USD) * rates.EUR) / 500) * 500 : undefined
  const [own, setOwn] = useState<number | undefined>(prices.get(m.id))
  const price = own ?? known ?? 20000
  const classicAble = !!m.y0 && new Date().getFullYear() - (m.y1 ?? m.y0) >= 30
  const [open, setOpen] = useState<string | null>(null)
  const eur = (n: number) => n.toLocaleString(locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
  const q = queryOf(m)
  const rows = useMemo(() => portalsFor(m).map((p) => ({ p, x: quote(p, price, { rates, home, classic: classicAble }) })).sort((a, b) => a.x.total - b.x.total), [m, price, rates, home, classicAble])
  const set = (n: number) => {
    prices.set(m.id, n)
    setOwn(n)
  }
  if (!rows.length) return null
  return (
    <div className="pq">
      <div className="pq-top">
        <label className="pq-price">
          <span className="f-label">{tx('Preis im Inserat', 'Listing price')}</span>
          <span className="sim-km">
            <input type="range" min={2000} max={Math.max(150000, price * 2)} step={500} value={price} onChange={(e) => set(+e.target.value)} aria-valuetext={eur(price)} />
            <b className="mono">{eur(price)}</b>
          </span>
        </label>
        <label className="pq-dest">
          <span className="f-label">{tx('Nach', 'To')}</span>
          <select className="input" value={rule.id} onChange={(e) => setSettings({ homeCountry: e.target.value })}>
            {IMPORT_RULES.map((r) => (
              <option key={r.id} value={r.id}>
                {r.flag} {L(r.name)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="small muted">
        {own === undefined
          ? known
            ? tx(`Vorgabe: Median der Angebotspreise in Japan (${PRICE_SOURCE.name}, ${PRICE_SOURCE.date}).`, `Preset: median asking price in Japan (${PRICE_SOURCE.name}, ${PRICE_SOURCE.date}).`)
            : tx('20.000 € sind nur ein Startwert. Zieh den Regler auf den Preis, den du im Inserat siehst.', '€20,000 is only a starting value. Drag to the price you see in the listing.')
          : tx('Alle Kosten sind mit diesem Preis gerechnet, egal in welchem Land.', 'All costs use this price, whatever the country.')}
      </p>
      <ul className="pq-list">
        {rows.map(({ p, x }) => (
          <li key={p.id}>
            <div className="pq-row">
              <span className="pq-flag">{FLAG[p.market]}</span>
              <span className="pq-name">
                <b>{p.name}</b>
                <small>{L(p.kind)}</small>
              </span>
              <button className="pq-cost" onClick={() => setOpen(open === p.id ? null : p.id)} aria-expanded={open === p.id}>
                <span>
                  <b className="mono">{x.missing.length ? tx('ab ', 'from ') : ''}{eur(x.total)}</b>
                  <small>{x.extra ? `+ ${eur(x.extra)} ${tx('Auslandskosten', 'import costs')}` : tx('keine Auslandskosten', 'no import costs')}</small>
                </span>
                <ChevronDown size={16} />
              </button>
              <a className="btn small primary" href={p.url(q)} target="_blank" rel="noopener noreferrer">
                {tx('Angebote', 'Listings')} <ArrowUpRight size={14} />
              </a>
            </div>
            {open === p.id && (
              <div className="pq-detail">
                <dl>
                  <div>
                    <dt>{tx('Kaufpreis', 'Purchase price')}</dt>
                    <dd className="mono">{eur(price)}</dd>
                  </div>
                  {x.rows.map((r) => (
                    <div key={r.de}>
                      <dt>{L(r)}</dt>
                      <dd className="mono">{eur(r.eur)}</dd>
                    </div>
                  ))}
                  <div className="sum">
                    <dt>{tx('Bis vor die Tür', 'To your door')}</dt>
                    <dd className="mono">{eur(x.total)}</dd>
                  </div>
                </dl>
                {x.missing.length > 0 && (
                  <p className="small">
                    <Badge kind="warn">{tx('Nicht enthalten', 'Not included')}</Badge> {x.missing.map((n) => L(n)).join(', ')}: {tx('kein veröffentlichter Preis.', 'no published price.')}
                  </p>
                )}
                {x.notes.map((n) => (
                  <p key={n.de} className="small muted">
                    {L(n)}
                  </p>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>
      <p className="small muted">
        {tx('Gezeigt werden nur Portale, die dieses Modell üblicherweise führen; der Knopf öffnet dort direkt die Trefferliste. Ob heute eins angeboten wird, zeigt das Portal.', 'Only marketplaces that usually carry this model are shown; the button opens their results directly. Whether one is offered today, the marketplace shows.')}{' '}
        {live ? tx(`Kurse: EZB, ${new Date(live.date).toLocaleDateString(locale)}.`, `Rates: ECB, ${new Date(live.date).toLocaleDateString(locale)}.`) : tx('Kurse: Ersatzwerte vom 16.11.2026.', 'Rates: fallback of 16 Nov 2026.')}
      </p>
    </div>
  )
}

/** Für Märkte ohne eigenes Profil (z. B. Korea, Dubai): weitere Suchseiten */
export const MORE_MARKETS = MARKETS.filter((m) => ['kr', 'th', 'my', 'sg', 'hk', 'ae', 'ca'].includes(m.id))
