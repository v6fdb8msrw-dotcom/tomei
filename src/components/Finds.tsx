// Merkliste: Inserate, die man in den Portalen gefunden hat, mit Link und Preis festhalten.
// Bleibt auf dem Gerät (localStorage) und ist mit dem Import-Rechner verbunden: ein Klick rechnet das Auto durch.
import { Calculator, ExternalLink, Plus, Trash2 } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { MARKETS, loadFinds, saveFinds, sendToCalc, toJpy, type Find } from '../data.ts'
import { int, yen } from '../lib/calc.ts'
import { useFx } from '../lib/fx.ts'

export function Finds({ defaultTitle = '' }: { defaultTitle?: string }) {
  const { rates } = useFx()
  const [list, setList] = useState<Find[]>(loadFinds)
  const [market, setMarket] = useState('jp')
  const cur = MARKETS.find((m) => m.id === market)?.cur ?? 'JPY'
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [price, setPrice] = useState('')

  const update = (f: Find[]) => {
    setList(f)
    saveFinds(f)
  }
  const amount = parseInt(price.replace(/[^\d]/g, ''), 10) || 0
  const okUrl = /^https:\/\/\S+$/.test(url.trim())
  const add = () => {
    if (!amount) return
    const f: Find = { id: String(Date.now()), title: title.trim() || defaultTitle || 'Fundstück', url: okUrl ? url.trim() : '', price: amount, cur, market, added: new Date().toISOString() }
    update([f, ...list])
    setTitle('')
    setUrl('')
    setPrice('')
  }

  return (
    <div className="gcard finds">
      <div className="mk-fields">
        <label className="field">
          <span className="f-label">Was hast du gefunden?</span>
          <input className="input" value={title} placeholder={defaultTitle || 'z. B. Supra RZ 1997'} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label className="field">
          <span className="f-label">Link zum Inserat</span>
          <input className="input" value={url} placeholder="https://…" onChange={(e) => setUrl(e.target.value)} />
        </label>
      </div>
      <div className="mk-fields">
        <label className="field small">
          <span className="f-label">Land</span>
          <select className="input" value={market} onChange={(e) => setMarket(e.target.value)}>
            {MARKETS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.country}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="f-label">Preis im Inserat ({cur})</span>
          <input className="input" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} />
        </label>
        <button className="btn red finds-add" disabled={!amount} onClick={add}>
          <Plus size={18} /> Merken
        </button>
      </div>
      {amount > 0 && cur !== 'JPY' && <p className="hint">≈ {yen(toJpy(amount, cur, rates))} zum Tageskurs</p>}

      <AnimatePresence initial={false}>
        {list.map((f) => (
          <motion.div key={f.id} className="find" layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <span className="mk-code small-code">{f.market.toUpperCase()}</span>
            <span className="find-main">
              <b>{f.title}</b>
              <small>
                {f.cur === 'JPY' ? yen(f.price) : `${int(f.price)} ${f.cur} · ≈ ${yen(toJpy(f.price, f.cur, rates))}`}
              </small>
            </span>
            {f.url && (
              <a className="icon-btn" href={f.url} target="_blank" rel="noopener noreferrer" title="Inserat öffnen">
                <ExternalLink size={16} />
              </a>
            )}
            <button className="btn small red" onClick={() => sendToCalc(f)}>
              <Calculator size={14} /> Durchrechnen
            </button>
            <button className="icon-btn" title="Entfernen" onClick={() => update(list.filter((x) => x.id !== f.id))}>
              <Trash2 size={16} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
      {list.length === 0 && <p className="muted small">Noch nichts gemerkt. Öffne oben ein Portal, kopier Link und Preis hierher und rechne das Auto mit einem Klick bis vor deine Tür durch.</p>}
    </div>
  )
}
