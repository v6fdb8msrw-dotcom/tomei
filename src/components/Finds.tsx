// Merkliste: Inserate, die man in den Portalen gefunden hat, mit Link und Preis festhalten.
// Seit 2.0 ein Ausschnitt der Garage: Fahrzeuge mit Preis. Bleibt auf dem Gerät und ist mit dem Importrechner verbunden.
import { Calculator, ExternalLink, Plus, Trash2 } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { MARKETS, sendToCalc, toJpy, type Find } from '../data.ts'
import { addVehicle, removeVehicle, useStore } from '../store/store.ts'
import { StatusPill } from './ui.tsx'
import { int, yen } from '../lib/calc.ts'
import { useT } from '../i18n/i18n.ts'
import { useFx } from '../lib/fx.ts'

export function Finds({ defaultTitle = '' }: { defaultTitle?: string }) {
  const { rates } = useFx()
  const vehicles = useStore((s) => s.vehicles)
  const list = vehicles.filter((v) => v.price && v.price.amount > 0)
  const [market, setMarket] = useState('jp')
  const cur = MARKETS.find((m) => m.id === market)?.cur ?? 'JPY'
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [price, setPrice] = useState('')
  const { tx, d } = useT()

  const amount = parseInt(price.replace(/[^\d]/g, ''), 10) || 0
  const okUrl = /^https:\/\/\S+$/.test(url.trim())
  const add = () => {
    if (!amount) return
    const t = (title.trim() || defaultTitle || 'Fundstück').split(/\s+/)
    addVehicle({ make: t[0], model: t.slice(1).join(' '), status: 'watchlist', price: { amount, cur }, market, url: okUrl ? url.trim() : undefined, source: 'finds' })
    setTitle('')
    setUrl('')
    setPrice('')
  }

  return (
    <div className="gcard finds">
      <div className="mk-fields">
        <label className="field">
          <span className="f-label">{tx('Was hast du gefunden?', 'What did you find?')}</span>
          <input className="input" value={title} placeholder={defaultTitle || tx('z. B. Supra RZ 1997', 'e.g. Supra RZ 1997')} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label className="field">
          <span className="f-label">{tx('Link zum Inserat', 'Listing link')}</span>
          <input className="input" value={url} placeholder="https://…" onChange={(e) => setUrl(e.target.value)} />
        </label>
      </div>
      <div className="mk-fields">
        <label className="field small">
          <span className="f-label">{tx('Land', 'Country')}</span>
          <select className="input" value={market} onChange={(e) => setMarket(e.target.value)}>
            {MARKETS.map((m) => (
              <option key={m.id} value={m.id}>
                {d(m.country)}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="f-label">{tx('Preis im Inserat', 'Listing price')} ({cur})</span>
          <input className="input" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} />
        </label>
        <button className="btn red finds-add" disabled={!amount} onClick={add}>
          <Plus size={18} /> {tx('Merken', 'Save')}
        </button>
      </div>
      {amount > 0 && cur !== 'JPY' && <p className="hint">≈ {yen(toJpy(amount, cur, rates))} {tx('zum Tageskurs', 'at today’s rate')}</p>}

      <AnimatePresence initial={false}>
        {list.map((v) => {
          const f: Find = { id: v.id, title: [v.make, v.model, v.variant].filter(Boolean).join(' '), url: v.url ?? '', price: v.price!.amount, cur: v.price!.cur, market: v.market ?? 'jp', added: v.createdAt }
          return (
          <motion.div key={f.id} className="find" layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <span className="mk-code small-code">{f.market.toUpperCase()}</span>
            <span className="find-main">
              <b>{f.title}</b>
              <small>
                {f.cur === 'JPY' ? yen(f.price) : `${int(f.price)} ${f.cur} · ≈ ${yen(toJpy(f.price, f.cur, rates))}`} · <StatusPill status={v.status} />
              </small>
            </span>
            {f.url && (
              <a className="icon-btn" href={f.url} target="_blank" rel="noopener noreferrer" title={tx('Inserat öffnen', 'Open listing')}>
                <ExternalLink size={16} />
              </a>
            )}
            <button className="btn small red" onClick={() => sendToCalc(f)}>
              <Calculator size={14} /> {tx('Durchrechnen', 'Calculate')}
            </button>
            <button className="icon-btn" title={tx('Aus der Garage entfernen', 'Remove from garage')} onClick={() => confirm(tx(`„${f.title}“ aus der Garage entfernen?`, `Remove “${f.title}” from the garage?`)) && removeVehicle(v.id)}>
              <Trash2 size={16} />
            </button>
          </motion.div>
          )
        })}
      </AnimatePresence>
      {list.length === 0 && <p className="muted small">{tx('Noch nichts gemerkt. Öffne oben ein Portal, kopier Link und Preis hierher und rechne das Auto mit einem Klick bis vor deine Tür durch. Alles Gemerkte steht auch in deiner Garage.', 'Nothing saved yet. Open a marketplace above, copy link and price here and calculate the landed cost in one click. Everything you save also appears in your garage.')}</p>}
    </div>
  )
}
