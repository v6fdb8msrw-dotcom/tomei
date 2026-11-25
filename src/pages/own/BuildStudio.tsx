// Build Studio: Umbauten je Fahrzeug planen (Idee → geplant → bestellt → verbaut), Budget, Teile-Shops.
import { ArrowRight, BookPlus, ExternalLink, Trash2 } from 'lucide-react'
import { motion } from 'motion/react'
import { useState } from 'react'
import { EmptyState, EASE, PageHead, VehicleSelect, fmtMoney, img, today, vehicleTitle } from '../../components/ui.tsx'
import { addPassportEntry, uid, updateVehicle, useStore } from '../../store/store.ts'
import type { Mod, ModStatus } from '../../store/schema.ts'
import { QuickInput } from '../../components/QuickInput.tsx'
import { guessCategory, guessModStatus, parseNote } from '../../lib/quick.ts'
import { Workshops } from '../../components/Workshops.tsx'
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
  const [q, setQ] = useState('')
  const n = parseNote(q)
  const g = guessModStatus(n.title)
  const cat = guessCategory(q)

  const setMods = (mods: Mod[]) => v && updateVehicle(v.id, { mods })
  const add = () => {
    if (!v || !g.title.trim()) return
    const cost = n.amount ? { amount: n.amount, cur: n.cur ?? 'EUR' } : undefined
    const mod: Mod = { id: uid(), title: g.title.slice(0, 200), category: cat, status: g.status, cost, url: n.url, date: g.status === 'installed' ? (n.date ?? today()) : undefined }
    setMods([...v.mods, mod])
    if (g.status === 'installed') addPassportEntry({ vehicleId: v.id, date: mod.date!, kind: 'mod', title: mod.title, cost, km: n.km, notes: cat })
    setQ('')
  }
  const change = (id: string, p: Partial<Mod>) => v && setMods(v.mods.map((x) => (x.id === id ? { ...x, ...p } : x)))
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
        sub={tx('Umbauten sammeln, planen, bestellen, verbauen. Schreib Teil und Preis in eine Zeile, Kategorie und Stand erkennt die Seite. Was verbaut ist, landet im Passport.', 'Collect, plan, order and install modifications. Write part and price in one line; the site detects category and status. Whatever is installed goes into the passport.')}
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
                <QuickInput
                  value={q}
                  onChange={setQ}
                  onSubmit={add}
                  label={tx('Umbau', 'Modification')}
                  placeholder={tx('z. B. KW Gewindefahrwerk 1.400 € bestellt', 'e.g. KW coilovers 1,400 € ordered')}
                  button={tx('Hinzufügen', 'Add')}
                  examples={[tx('BBS Felgen 2.200 €', 'BBS wheels 2,200 €'), tx('Edelstahl-Auspuff verbaut 890 €', 'Stainless exhaust installed 890 €')]}
                >
                  {q.trim() && g.title && (
                    <p className="quick-read">
                      <span>
                        <b>{g.title}</b>
                        <small>{[catLabel(cat), L(COLS.find((c) => c.s === g.status)!.l), n.amount ? fmtMoney(n.amount, n.cur ?? 'EUR', locale) : '', n.url ? 'Link' : ''].filter(Boolean).join(' · ')}</small>
                      </span>
                    </p>
                  )}
                </QuickInput>
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
                            <select className="chip kan-cat" value={m.category} onChange={(e) => change(m.id, { category: e.target.value })} aria-label={tx('Kategorie', 'Category')}>
                              {[...new Set([m.category, ...CATS])].map((x) => (
                                <option key={x} value={x}>
                                  {catLabel(x)}
                                </option>
                              ))}
                            </select>
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
      {v && (
        <section className="section">
          <div className="sec-head">
            <p className="eyebrow">{tx('Einbauen lassen', 'Have it fitted')}</p>
            <h2>
              {tx('Werkstätten für ', 'Workshops for ')}
              <em>{v.make}.</em>
            </h2>
          </div>
          <Workshops make={v.make} year={v.year} limit={9} />
        </section>
      )}
    </>
  )
}
