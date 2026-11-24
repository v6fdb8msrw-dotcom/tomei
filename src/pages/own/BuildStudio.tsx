// Build Studio: Umbauten je Fahrzeug planen (Idee → geplant → bestellt → verbaut), Budget, Teile-Shops.
import { ArrowRight, BookPlus, ExternalLink, Plus, Trash2 } from 'lucide-react'
import { motion } from 'motion/react'
import { useState } from 'react'
import { EmptyState, EASE, PageHead, VehicleSelect, fmtMoney, img, today, vehicleTitle } from '../../components/ui.tsx'
import { addPassportEntry, uid, updateVehicle, useStore } from '../../store/store.ts'
import type { Mod, ModStatus } from '../../store/schema.ts'
import { PartsShops } from '../Parts.tsx'
import { useT } from '../../i18n/i18n.ts'

const COLS: { s: ModStatus; l: { de: string; en: string } }[] = [
  { s: 'idea', l: { de: 'Idee', en: 'Idea' } },
  { s: 'planned', l: { de: 'Geplant', en: 'Planned' } },
  { s: 'ordered', l: { de: 'Bestellt', en: 'Ordered' } },
  { s: 'installed', l: { de: 'Verbaut', en: 'Installed' } },
]
// Gespeichert wird der deutsche Name, angezeigt je nach Sprache
const CATS = ['Fahrwerk', 'Felgen & Reifen', 'Bremsen', 'Motor', 'Abgas', 'Innenraum', 'Karosserie', 'Licht', 'Elektronik', 'Pflege', 'Sonstiges']
const CAT_EN: Record<string, string> = { Fahrwerk: 'Suspension', 'Felgen & Reifen': 'Wheels & tyres', Bremsen: 'Brakes', Motor: 'Engine', Abgas: 'Exhaust', Innenraum: 'Interior', Karosserie: 'Body', Licht: 'Lighting', Elektronik: 'Electronics', Pflege: 'Care', Sonstiges: 'Other' }

export default function BuildStudio({ vehicleId }: { vehicleId?: string }) {
  const { tx, L, lang, locale } = useT()
  const catLabel = (c: string) => (lang === 'en' ? (CAT_EN[c] ?? c) : c)
  const vehicles = useStore((s) => s.vehicles)
  const [sel, setSel] = useState(vehicleId ?? vehicles.find((v) => v.status === 'owned')?.id ?? vehicles[0]?.id ?? '')
  const v = vehicles.find((x) => x.id === sel)
  const [f, setF] = useState({ title: '', category: CATS[0], cost: '', url: '' })

  const setMods = (mods: Mod[]) => v && updateVehicle(v.id, { mods })
  const add = () => {
    if (!v || !f.title.trim()) return
    const cost = parseInt(f.cost.replace(/\D/g, ''), 10)
    setMods([...v.mods, { id: uid(), title: f.title.trim().slice(0, 200), category: f.category, status: 'idea', cost: Number.isFinite(cost) ? { amount: cost, cur: 'EUR' } : undefined, url: /^https:\/\/\S+$/.test(f.url.trim()) ? f.url.trim() : undefined }])
    setF({ ...f, title: '', cost: '', url: '' })
  }
  const move = (m: Mod, s: ModStatus) => {
    if (!v) return
    setMods(v.mods.map((x) => (x.id === m.id ? { ...x, status: s, date: s === 'installed' ? today() : x.date } : x)))
    if (s === 'installed') addPassportEntry({ vehicleId: v.id, date: today(), kind: 'mod', title: m.title, cost: m.cost, notes: m.category })
  }
  const sum = (s?: ModStatus) => (v?.mods ?? []).filter((m) => !s || m.status === s).reduce((a, m) => a + (m.cost?.amount ?? 0), 0)

  return (
    <>
      <PageHead
        eyebrow="Own · Build Studio"
        title={
          <>
            {tx('Dein Build. ', 'Your build. ')}<em>{tx('Schritt für Schritt.', 'Step by step.')}</em>
          </>
        }
        sub={tx('Umbauten sammeln, planen, bestellen, verbauen. Was verbaut ist, landet automatisch im Passport. Preise trägst du selbst ein.', 'Collect, plan, order and install modifications. Whatever is installed goes into the passport automatically. You enter prices yourself.')}
        image={img('parts-wheel')}
      />
      <section className="section">
        {vehicles.length === 0 ? (
          <EmptyState title={tx('Für einen Build brauchst du ein Auto.', 'A build needs a car.')} text={tx('Leg in der Garage ein Fahrzeug an, dann planst du hier seine Umbauten.', 'Add a vehicle in the garage, then plan its modifications here.')} image={img('parts-engine')} actions={[{ to: 'own/garage', label: tx('Zur Garage', 'Go to garage'), primary: true }]} />
        ) : (
          <>
            <div className="build-head">
              <VehicleSelect vehicles={vehicles} value={sel} onChange={setSel} />
              {v && (
                <div className="build-sum">
                  <span>
                    {tx('Gesamt', 'Total')} <b className="mono">{fmtMoney(sum(), 'EUR', locale)}</b>
                  </span>
                  <span>
                    {tx('Verbaut', 'Installed')} <b className="mono">{fmtMoney(sum('installed'), 'EUR', locale)}</b>
                  </span>
                  <span>
                    {tx('Offen', 'Open')} <b className="mono">{fmtMoney(sum() - sum('installed'), 'EUR', locale)}</b>
                  </span>
                </div>
              )}
            </div>
            {v && (
              <>
                <form
                  className="mod-add"
                  onSubmit={(e) => {
                    e.preventDefault()
                    add()
                  }}
                >
                  <input className="input" placeholder={tx('Teil oder Umbau, z. B. Gewindefahrwerk', 'Part or mod, e.g. coilovers')} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} aria-label={tx('Teil', 'Part')} />
                  <select className="input" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} aria-label={tx('Kategorie', 'Category')}>
                    {CATS.map((c) => (
                      <option key={c} value={c}>
                        {catLabel(c)}
                      </option>
                    ))}
                  </select>
                  <span className="input short">
                    <input inputMode="numeric" placeholder={tx('Preis', 'Price')} value={f.cost} onChange={(e) => setF({ ...f, cost: e.target.value })} aria-label={tx('Preis in Euro', 'Price in euros')} />
                    <span className="adorn">€</span>
                  </span>
                  <input className="input" placeholder={tx('Link (optional)', 'Link (optional)')} value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} aria-label="Link" />
                  <button className="btn primary" disabled={!f.title.trim()}>
                    <Plus size={16} /> {tx('Hinzufügen', 'Add')}
                  </button>
                </form>
                <div className="kanban">
                  {COLS.map((c, ci) => {
                    const items = v.mods.filter((m) => m.status === c.s)
                    return (
                      <div key={c.s} className="kan-col">
                        <h3>
                          {L(c.l)} <span className="muted">{items.length}</span>
                        </h3>
                        {items.length === 0 && <p className="kan-empty">–</p>}
                        {items.map((m) => (
                          <motion.div key={m.id} layout className="kan-card" transition={{ duration: 0.35, ease: EASE }}>
                            <span className="chip">{catLabel(m.category)}</span>
                            <b>{m.title}</b>
                            {m.cost && <span className="mono small">{fmtMoney(m.cost.amount, m.cost.cur, locale)}</span>}
                            <div className="kan-btns">
                              {m.url && (
                                <a className="icon-btn" href={m.url} target="_blank" rel="noopener noreferrer" aria-label={tx('Link öffnen', 'Open link')}>
                                  <ExternalLink size={14} />
                                </a>
                              )}
                              <button className="icon-btn" onClick={() => setMods(v.mods.filter((x) => x.id !== m.id))} aria-label={tx('Entfernen', 'Remove')}>
                                <Trash2 size={14} />
                              </button>
                              {ci < COLS.length - 1 && (
                                <button className="btn small" onClick={() => move(m, COLS[ci + 1].s)}>
                                  {COLS[ci + 1].s === 'installed' ? <BookPlus size={13} /> : <ArrowRight size={13} />} {L(COLS[ci + 1].l)}
                                </button>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )
                  })}
                </div>
                <p className="muted small">{tx(`Build von ${vehicleTitle(v)}. „Verbaut“ trägt den Umbau mit Datum und Preis in den Passport ein.`, `Build of ${vehicleTitle(v)}. “Installed” logs the mod with date and price in the passport.`)}</p>
              </>
            )}
          </>
        )}
      </section>
      <PartsShops />
    </>
  )
}
