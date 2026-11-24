// Wartungsplaner: Intervalle nach Zeit und Kilometern, Fälligkeiten, Erledigt-Buchung (→ Passport) und Kalender-Export.
import { CalendarPlus, Check, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { BRAND } from '../../config/brand.ts'
import { EmptyState, PageHead, VehicleSelect, fmtDate, fmtMoney, img, today, vehicleTitle } from '../../components/ui.tsx'
import { dueState, nextDue, toIcs } from '../../lib/maintenance.ts'
import { addPassportEntry, downloadFile, removeMaintenance, uid, updateVehicle, upsertMaintenance, useStore } from '../../store/store.ts'
import type { MaintenanceItem, MaintenanceKind } from '../../store/schema.ts'
import { useT } from '../../i18n/i18n.ts'

const KINDS: { k: MaintenanceKind; l: string }[] = [
  { k: 'service', l: 'Service / Öl' },
  { k: 'inspection', l: 'HU / Prüfung' },
  { k: 'tyres', l: 'Reifen' },
  { k: 'season', l: 'Saison (Ein-/Auswintern)' },
  { k: 'repair', l: 'Reparatur' },
  { k: 'other', l: 'Sonstiges' },
]
const STATE_L = { overdue: 'Überfällig', soon: 'Bald fällig', ok: 'Im Plan', open: 'Ohne Termin' }

export default function Maintenance({ vehicleId }: { vehicleId?: string }) {
  const { locale } = useT()
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
        all.filter((m) => m.dueDate).map((m) => ({ title: `${m.title} · ${vehicleTitle(vehicles.find((x) => x.id === m.vehicleId) ?? { make: '', model: '' })}`, date: m.dueDate!, description: m.dueKm ? `oder bei ${m.dueKm.toLocaleString('de-DE')} km` : undefined })),
        `-//${BRAND.ascii}//Wartung//DE`,
      ),
      'text/calendar',
    )

  return (
    <>
      <PageHead
        eyebrow="Own · Wartungsplaner"
        title={
          <>
            Nichts vergessen. <em>Nichts verschleppen.</em>
          </>
        }
        sub="Lege Intervalle nach Monaten oder Kilometern an. Was du erledigst, wandert mit Datum, Stand und Kosten in den Passport. Alle Termine lassen sich als Kalenderdatei exportieren."
        image={img('parts-engine')}
      />
      <section className="section narrow">
        {vehicles.length === 0 ? (
          <EmptyState title="Noch kein Auto in der Garage." text="Die Wartung hängt immer an einem Fahrzeug." image={img('parts-engine')} actions={[{ to: 'own/garage', label: 'Zur Garage', primary: true }]} />
        ) : (
          <>
            <div className="build-head">
              <VehicleSelect vehicles={vehicles} value={sel} onChange={setSel} />
              <button className="btn" onClick={ics} disabled={!all.some((m) => m.dueDate)}>
                <CalendarPlus size={16} /> Alle Termine als .ics
              </button>
            </div>
            {v && (
              <form
                className="gcard maint-add"
                onSubmit={(e) => {
                  e.preventDefault()
                  add()
                }}
              >
                <h3>Neuer Eintrag</h3>
                <div className="fields three">
                  <label className="field">
                    <span className="f-label">Was</span>
                    <input className="input" value={f.title} placeholder="z. B. Ölwechsel" onChange={(e) => setF({ ...f, title: e.target.value })} />
                  </label>
                  <label className="field">
                    <span className="f-label">Art</span>
                    <select className="input" value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value as MaintenanceKind })}>
                      {KINDS.map((k) => (
                        <option key={k.k} value={k.k}>
                          {k.l}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span className="f-label">Zuletzt am</span>
                    <input className="input" type="date" value={f.lastDate} onChange={(e) => setF({ ...f, lastDate: e.target.value })} />
                  </label>
                  <label className="field">
                    <span className="f-label">Alle … Monate</span>
                    <input className="input" inputMode="numeric" value={f.months} onChange={(e) => setF({ ...f, months: e.target.value })} />
                  </label>
                  <label className="field">
                    <span className="f-label">oder alle … km</span>
                    <input className="input" inputMode="numeric" value={f.km} onChange={(e) => setF({ ...f, km: e.target.value })} />
                  </label>
                  <label className="field">
                    <span className="f-label">Stand zuletzt (km)</span>
                    <input className="input" inputMode="numeric" value={f.lastKm} placeholder={v.mileageKm ? String(v.mileageKm) : ''} onChange={(e) => setF({ ...f, lastKm: e.target.value })} />
                  </label>
                </div>
                <p className="muted small">Intervalle stehen in der Betriebsanleitung oder im Serviceheft deines Autos. {BRAND.name} gibt keine vor.</p>
                <button className="btn primary" disabled={!f.title.trim()}>
                  <Plus size={16} /> Anlegen
                </button>
              </form>
            )}
            {sorted.length === 0 ? (
              <p className="muted">Für dieses Auto ist noch nichts geplant.</p>
            ) : (
              <ul className="maint">
                {sorted.map((m) => {
                  const st = dueState(m, today(), v?.mileageKm)
                  return (
                    <li key={m.id} className={'st-' + st}>
                      <span className={'maint-state st-' + st}>{STATE_L[st]}</span>
                      <div className="maint-main">
                        <b>{m.title}</b>
                        <span className="small muted">
                          {KINDS.find((k) => k.k === m.kind)?.l}
                          {m.intervalMonths ? ` · alle ${m.intervalMonths} Monate` : ''}
                          {m.intervalKm ? ` · alle ${m.intervalKm.toLocaleString(locale)} km` : ''}
                        </span>
                        <span className="small">
                          Fällig: {m.dueDate ? fmtDate(m.dueDate, locale) : '–'}
                          {m.dueKm ? ` oder ${m.dueKm.toLocaleString(locale)} km` : ''}
                          {m.history.length > 0 && ` · zuletzt ${fmtDate(m.history[0].date, locale)}${m.history[0].cost ? `, ${fmtMoney(m.history[0].cost, 'EUR', locale)}` : ''}`}
                        </span>
                      </div>
                      <div className="maint-btns">
                        <button className="btn small" onClick={() => setDone({ id: m.id, date: today(), km: v?.mileageKm ? String(v.mileageKm) : '', cost: '' })}>
                          <Check size={14} /> Erledigt
                        </button>
                        <button className="icon-btn" onClick={() => confirm(`„${m.title}“ löschen?`) && removeMaintenance(m.id)} aria-label="Löschen">
                          <Trash2 size={15} />
                        </button>
                      </div>
                      {done?.id === m.id && (
                        <div className="maint-done">
                          <input className="input" type="date" value={done.date} onChange={(e) => setDone({ ...done, date: e.target.value })} aria-label="Datum" />
                          <input className="input" inputMode="numeric" placeholder="km-Stand" value={done.km} onChange={(e) => setDone({ ...done, km: e.target.value })} aria-label="Kilometerstand" />
                          <input className="input" inputMode="numeric" placeholder="Kosten €" value={done.cost} onChange={(e) => setDone({ ...done, cost: e.target.value })} aria-label="Kosten" />
                          <button className="btn primary small" onClick={book}>
                            Buchen
                          </button>
                          <button className="btn small" onClick={() => setDone(null)}>
                            Abbrechen
                          </button>
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </>
        )}
      </section>
    </>
  )
}
