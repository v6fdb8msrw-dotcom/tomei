// Wartungsplaner: Intervalle nach Zeit und Kilometern, Fälligkeiten, Erledigt-Buchung (→ Passport) und Kalender-Export.
import { CalendarPlus, Check, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { BRAND } from '../../config/brand.ts'
import { EmptyState, PageHead, VehicleSelect, fmtDate, fmtMoney, img, today, vehicleTitle } from '../../components/ui.tsx'
import { dueState, nextDue, toIcs } from '../../lib/maintenance.ts'
import { addPassportEntry, downloadFile, removeMaintenance, uid, updateVehicle, upsertMaintenance, useStore } from '../../store/store.ts'
import type { MaintenanceItem, MaintenanceKind } from '../../store/schema.ts'
import { addBasicPlan } from '../../lib/basicplan.ts'
import { Details } from '../../components/QuickInput.tsx'
import { useT } from '../../i18n/i18n.ts'

const KINDS: { k: MaintenanceKind; l: { de: string; en: string } }[] = [
  { k: 'service', l: { de: 'Service / Öl', en: 'Service / oil' } },
  { k: 'inspection', l: { de: 'HU / Prüfung', en: 'Roadworthiness test' } },
  { k: 'tyres', l: { de: 'Reifen', en: 'Tyres' } },
  { k: 'season', l: { de: 'Saison (Ein-/Auswintern)', en: 'Season (storage in/out)' } },
  { k: 'repair', l: { de: 'Reparatur', en: 'Repair' } },
  { k: 'other', l: { de: 'Sonstiges', en: 'Other' } },
]
const STATE_L = {
  overdue: { de: 'Überfällig', en: 'Overdue' },
  soon: { de: 'Bald fällig', en: 'Due soon' },
  ok: { de: 'Im Plan', en: 'On schedule' },
  open: { de: 'Ohne Termin', en: 'No date' },
}

export default function Maintenance({ vehicleId }: { vehicleId?: string }) {
  const { tx, L, locale } = useT()
  const vehicles = useStore((s) => s.vehicles)
  const all = useStore((s) => s.maintenance)
  const [sel, setSel] = useState(vehicleId ?? vehicles.find((v) => v.status === 'owned')?.id ?? vehicles[0]?.id ?? '')
  const v = vehicles.find((x) => x.id === sel)
  const items = all.filter((m) => m.vehicleId === sel)
  const [f, setF] = useState({ title: '', kind: 'service' as MaintenanceKind, months: '12', km: '', lastDate: today(), lastKm: '' })
  const [done, setDone] = useState<{ id: string; date: string; km: string; cost: string } | null>(null)
  const n = (s: string) => {
    const x = parseInt(s.replace(/\D/g, ''), 10)
    return Number.isFinite(x) && x > 0 ? x : undefined
  }

  const add = () => {
    if (!v || !f.title.trim()) return
    const base = { intervalMonths: n(f.months), intervalKm: n(f.km), lastDate: f.lastDate || undefined, lastKm: n(f.lastKm) }
    const item: MaintenanceItem = { id: uid(), vehicleId: v.id, title: f.title.trim().slice(0, 200), kind: f.kind, ...base, ...nextDue(base), history: [] }
    upsertMaintenance(item)
    setF({ ...f, title: '' })
  }
  const addBasic = () => v && addBasicPlan(v, L)
  const book = () => {
    if (!done || !v) return
    const m = items.find((x) => x.id === done.id)
    if (!m) return
    const km = n(done.km)
    const cost = n(done.cost)
    const next = { ...m, lastDate: done.date, lastKm: km ?? m.lastKm, history: [{ date: done.date, km, cost }, ...m.history] }
    upsertMaintenance({ ...next, ...nextDue(next) })
    addPassportEntry({ vehicleId: v.id, date: done.date, kind: 'service', title: m.title, km, cost: cost ? { amount: cost, cur: 'EUR' } : undefined })
    if (km && (!v.mileageKm || km > v.mileageKm)) updateVehicle(v.id, { mileageKm: km })
    setDone(null)
  }
  const sorted = [...items].sort((a, b) => (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999'))
  const ics = () =>
    downloadFile(
      `${BRAND.ascii.toLowerCase()}-wartung.ics`,
      toIcs(
        all.filter((m) => m.dueDate).map((m) => ({ title: `${m.title} · ${vehicleTitle(vehicles.find((x) => x.id === m.vehicleId) ?? { make: '', model: '' })}`, date: m.dueDate!, description: m.dueKm ? tx(`oder bei ${m.dueKm.toLocaleString(locale)} km`, `or at ${m.dueKm.toLocaleString(locale)} km`) : undefined })),
        `-//${BRAND.ascii}//Wartung//DE`,
      ),
      'text/calendar',
    )

  return (
    <>
      <PageHead
        eyebrow={tx('Own · Wartungsplaner', 'Own · Maintenance planner')}
        title={
          <>
            {tx('Nichts vergessen. ', 'Forget nothing. ')}<em>{tx('Nichts verschleppen.', 'Delay nothing.')}</em>
          </>
        }
        sub={tx('Lege Intervalle nach Monaten oder Kilometern an. Was du erledigst, wandert mit Datum, Stand und Kosten in den Passport. Alle Termine lassen sich als Kalenderdatei exportieren.', 'Set intervals by months or kilometres. What you complete goes into the passport with date, mileage and cost. All due dates can be exported as a calendar file.')}
        image={img('parts-engine')}
      />
      <section className="section narrow">
        {vehicles.length === 0 ? (
          <EmptyState title={tx('Noch kein Auto in der Garage.', 'No car in the garage yet.')} text={tx('Die Wartung hängt immer an einem Fahrzeug.', 'Maintenance always belongs to a vehicle.')} image={img('parts-engine')} actions={[{ to: 'own/garage', label: tx('Zur Garage', 'Go to garage'), primary: true }]} />
        ) : (
          <>
            <div className="build-head">
              <VehicleSelect vehicles={vehicles} value={sel} onChange={setSel} />
              <button className="btn" onClick={ics} disabled={!all.some((m) => m.dueDate)}>
                <CalendarPlus size={16} /> {tx('Alle Termine als .ics', 'All due dates as .ics')}
              </button>
            </div>
            {v && items.length === 0 && (
              <div className="gcard maint-auto">
                <h3>{tx('Plan automatisch anlegen', 'Create the plan automatically')}</h3>
                <p>{tx('Öl, HU, Bremsflüssigkeit, Reifen und Winter: übliche Intervalle ab heute. Was dein Serviceheft anders vorgibt, änderst du später.', 'Oil, inspection, brake fluid, tyres and winter: common intervals from today. Change anything your service book says differently.')}</p>
                <button className="btn primary" onClick={addBasic}>
                  <Check size={16} /> {tx('Grundplan anlegen', 'Create basic plan')}
                </button>
              </div>
            )}
            {sorted.length === 0 ? (
              <p className="muted">{tx('Für dieses Auto ist noch nichts geplant.', 'Nothing planned for this car yet.')}</p>
            ) : (
              <ul className="maint">
                {sorted.map((m) => {
                  const st = dueState(m, today(), v?.mileageKm)
                  return (
                    <li key={m.id} className={'st-' + st}>
                      <span className={'maint-state st-' + st}>{L(STATE_L[st])}</span>
                      <div className="maint-main">
                        <b>{m.title}</b>
                        <span className="small muted">
                          {L(KINDS.find((k) => k.k === m.kind)?.l ?? KINDS[5].l)}
                          {m.intervalMonths ? tx(` · alle ${m.intervalMonths} Monate`, ` · every ${m.intervalMonths} months`) : ''}
                          {m.intervalKm ? tx(` · alle ${m.intervalKm.toLocaleString(locale)} km`, ` · every ${m.intervalKm.toLocaleString(locale)} km`) : ''}
                        </span>
                        <span className="small">
                          {tx('Fällig', 'Due')}: {m.dueDate ? fmtDate(m.dueDate, locale) : '–'}
                          {m.dueKm ? tx(` oder ${m.dueKm.toLocaleString(locale)} km`, ` or ${m.dueKm.toLocaleString(locale)} km`) : ''}
                          {m.history.length > 0 && `${tx(' · zuletzt', ' · last')} ${fmtDate(m.history[0].date, locale)}${m.history[0].cost ? `, ${fmtMoney(m.history[0].cost, 'EUR', locale)}` : ''}`}
                        </span>
                      </div>
                      <div className="maint-btns">
                        <button className="btn small" onClick={() => setDone({ id: m.id, date: today(), km: v?.mileageKm ? String(v.mileageKm) : '', cost: '' })}>
                          <Check size={14} /> {tx('Erledigt', 'Done')}
                        </button>
                        <button className="icon-btn" onClick={() => confirm(tx(`„${m.title}“ löschen?`, `Delete “${m.title}”?`)) && removeMaintenance(m.id)} aria-label={tx('Löschen', 'Delete')}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                      {done?.id === m.id && (
                        <div className="maint-done">
                          <input className="input" type="date" value={done.date} onChange={(e) => setDone({ ...done, date: e.target.value })} aria-label={tx('Datum', 'Date')} />
                          <input className="input" inputMode="numeric" placeholder={tx('km-Stand', 'Mileage')} value={done.km} onChange={(e) => setDone({ ...done, km: e.target.value })} aria-label={tx('Kilometerstand', 'Mileage')} />
                          <input className="input" inputMode="numeric" placeholder={tx('Kosten €', 'Cost €')} value={done.cost} onChange={(e) => setDone({ ...done, cost: e.target.value })} aria-label={tx('Kosten', 'Cost')} />
                          <button className="btn primary small" onClick={book}>
                            {tx('Buchen', 'Log')}
                          </button>
                          <button className="btn small" onClick={() => setDone(null)}>
                            {tx('Abbrechen', 'Cancel')}
                          </button>
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
            {v && (
              <Details title={tx('Eigenen Eintrag hinzufügen', 'Add your own entry')}>
              <form
                className="maint-add"
                onSubmit={(e) => {
                  e.preventDefault()
                  add()
                }}
              >
                <div className="fields three">
                  <label className="field">
                    <span className="f-label">{tx('Was', 'What')}</span>
                    <input className="input" value={f.title} placeholder={tx('z. B. Ölwechsel', 'e.g. oil change')} onChange={(e) => setF({ ...f, title: e.target.value })} />
                  </label>
                  <label className="field">
                    <span className="f-label">{tx('Art', 'Type')}</span>
                    <select className="input" value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value as MaintenanceKind })}>
                      {KINDS.map((k) => (
                        <option key={k.k} value={k.k}>
                          {L(k.l)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span className="f-label">{tx('Zuletzt am', 'Last done')}</span>
                    <input className="input" type="date" value={f.lastDate} onChange={(e) => setF({ ...f, lastDate: e.target.value })} />
                  </label>
                  <label className="field">
                    <span className="f-label">{tx('Alle … Monate', 'Every … months')}</span>
                    <input className="input" inputMode="numeric" value={f.months} onChange={(e) => setF({ ...f, months: e.target.value })} />
                  </label>
                  <label className="field">
                    <span className="f-label">{tx('oder alle … km', 'or every … km')}</span>
                    <input className="input" inputMode="numeric" value={f.km} onChange={(e) => setF({ ...f, km: e.target.value })} />
                  </label>
                  <label className="field">
                    <span className="f-label">{tx('Stand zuletzt (km)', 'Mileage last time (km)')}</span>
                    <input className="input" inputMode="numeric" value={f.lastKm} placeholder={v.mileageKm ? String(v.mileageKm) : ''} onChange={(e) => setF({ ...f, lastKm: e.target.value })} />
                  </label>
                </div>
                <p className="muted small">{tx(`Intervalle stehen in der Betriebsanleitung oder im Serviceheft deines Autos. Der Grundplan ist nur ein üblicher Startpunkt.`, `Intervals are in your car’s owner’s manual or service book. The basic plan is only a common starting point.`)}</p>
                <button className="btn primary" disabled={!f.title.trim()}>
                  <Plus size={16} /> {tx('Anlegen', 'Add')}
                </button>
              </form>
              </Details>
            )}
          </>
        )}
      </section>
    </>
  )
}
