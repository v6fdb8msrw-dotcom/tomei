// Automotive Passport: die Geschichte eines Autos auf einer Zeitleiste. Druckbar und als Datei exportierbar.
import { Download, Plus, Printer, Trash2 } from 'lucide-react'
import { motion } from 'motion/react'
import { useState } from 'react'
import { BRAND } from '../../config/brand.ts'
import { countryById } from '../../data/countries.ts'
import { EmptyState, EASE, PageHead, StatusPill, VehicleSelect, fmtDate, fmtMoney, img, today, vehicleTitle } from '../../components/ui.tsx'
import { addPassportEntry, downloadFile, nowIso, removePassportEntry, useStore } from '../../store/store.ts'
import type { PassportKind } from '../../store/schema.ts'
import { useT } from '../../i18n/i18n.ts'
import { VehicleVisual } from './Own.tsx'

const KIND: Record<PassportKind, string> = { purchase: 'Kauf', import: 'Import', registration: 'Zulassung', service: 'Wartung', mod: 'Umbau', trip: 'Fahrt', document: 'Dokument', note: 'Notiz' }

export default function Passport({ vehicleId }: { vehicleId?: string }) {
  const { locale } = useT()
  const vehicles = useStore((s) => s.vehicles)
  const passport = useStore((s) => s.passport)
  const maintenance = useStore((s) => s.maintenance)
  const trips = useStore((s) => s.trips)
  const [sel, setSel] = useState(vehicleId ?? vehicles.find((v) => v.status === 'owned')?.id ?? vehicles[0]?.id ?? '')
  const v = vehicles.find((x) => x.id === sel)
  const [f, setF] = useState({ date: today(), kind: 'note' as PassportKind, title: '', km: '', notes: '' })
  const entries = passport.filter((p) => p.vehicleId === sel).sort((a, b) => b.date.localeCompare(a.date))
  const total = entries.reduce((s, e) => s + (e.cost?.cur === 'EUR' ? e.cost.amount : 0), 0)

  const exportOne = () => {
    if (!v) return
    const data = { app: BRAND.ascii, kind: 'passport', exportedAt: nowIso(), vehicle: v, passport: entries, maintenance: maintenance.filter((m) => m.vehicleId === v.id), trips: trips.filter((t) => t.vehicleId === v.id) }
    downloadFile(`${BRAND.ascii.toLowerCase()}-passport-${[v.make, v.model].join('-').replace(/[^\w-]+/g, '_')}.json`, JSON.stringify(data, null, 2))
  }

  return (
    <>
      <PageHead
        eyebrow="Own · Automotive Passport"
        title={
          <>
            Jedes Auto <em>hat eine Geschichte.</em>
          </>
        }
        sub="Kauf, Import, Zulassung, Wartung, Umbauten und Fahrten. Einträge aus Wartungsplaner, Build Studio, Roadtrip-Builder und Import-Journey landen automatisch hier."
        image={img('fuji-lakes')}
      />
      <section className="section narrow">
        {vehicles.length === 0 ? (
          <EmptyState title="Der Passport beginnt mit einem Auto." text="Leg dein Fahrzeug in der Garage an, dann schreibt sich seine Geschichte hier." image={img('cars/r34')} actions={[{ to: 'own/garage', label: 'Zur Garage', primary: true }]} />
        ) : (
          <>
            <div className="build-head no-print">
              <VehicleSelect vehicles={vehicles} value={sel} onChange={setSel} />
              <div className="row gap">
                <button className="btn" onClick={() => print()} disabled={!v}>
                  <Printer size={16} /> Drucken / PDF
                </button>
                <button className="btn" onClick={exportOne} disabled={!v}>
                  <Download size={16} /> Export
                </button>
              </div>
            </div>
            {v && (
              <article className="passport">
                <header className="pp-head">
                  <div className="pp-img">
                    <VehicleVisual v={v} />
                  </div>
                  <div>
                    <p className="eyebrow">Automotive Passport · {BRAND.name}</p>
                    <h2>{vehicleTitle(v)}</h2>
                    <dl className="pp-data">
                      {v.chassis && (
                        <>
                          <dt>Code</dt>
                          <dd>{v.chassis}</dd>
                        </>
                      )}
                      <dt>Status</dt>
                      <dd>
                        <StatusPill status={v.status} />
                      </dd>
                      {v.mileageKm !== undefined && (
                        <>
                          <dt>Kilometerstand</dt>
                          <dd className="mono">{v.mileageKm.toLocaleString(locale)} km</dd>
                        </>
                      )}
                      {v.market && (
                        <>
                          <dt>Herkunft</dt>
                          <dd>{countryById(v.market)?.flag} {countryById(v.market)?.name.de ?? v.market.toUpperCase()}</dd>
                        </>
                      )}
                      {v.landed && (
                        <>
                          <dt>Importkosten</dt>
                          <dd className="mono">{fmtMoney(v.landed.amount, v.landed.cur, locale)}</dd>
                        </>
                      )}
                      <dt>Einträge</dt>
                      <dd className="mono">
                        {entries.length}
                        {total > 0 ? ` · ${fmtMoney(total, 'EUR', locale)} belegt` : ''}
                      </dd>
                    </dl>
                  </div>
                </header>

                <form
                  className="pp-add no-print"
                  onSubmit={(e) => {
                    e.preventDefault()
                    if (!f.title.trim()) return
                    const km = parseInt(f.km.replace(/\D/g, ''), 10)
                    addPassportEntry({ vehicleId: v.id, date: f.date || today(), kind: f.kind, title: f.title.trim().slice(0, 200), notes: f.notes.trim().slice(0, 4000) || undefined, km: Number.isFinite(km) ? km : undefined })
                    setF({ ...f, title: '', km: '', notes: '' })
                  }}
                >
                  <input className="input" type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} aria-label="Datum" />
                  <select className="input" value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value as PassportKind })} aria-label="Art">
                    {(Object.keys(KIND) as PassportKind[]).map((k) => (
                      <option key={k} value={k}>
                        {KIND[k]}
                      </option>
                    ))}
                  </select>
                  <input className="input grow" placeholder="Eintrag, z. B. Zulassung mit H-Kennzeichen" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} aria-label="Eintrag" />
                  <input className="input short" placeholder="km" inputMode="numeric" value={f.km} onChange={(e) => setF({ ...f, km: e.target.value })} aria-label="Kilometerstand" />
                  <button className="btn primary" disabled={!f.title.trim()}>
                    <Plus size={16} /> Eintragen
                  </button>
                </form>

                {entries.length === 0 ? (
                  <p className="muted pp-empty">Noch keine Einträge. Trag den Kauf ein, buche eine Wartung als erledigt oder schließe die Import-Journey ab.</p>
                ) : (
                  <ol className="timeline">
                    {entries.map((e, k) => (
                      <motion.li key={e.id} className={'tl k-' + e.kind} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: Math.min(k, 10) * 0.03, ease: EASE }}>
                        <span className="tl-date mono">{fmtDate(e.date, locale)}</span>
                        <span className="tl-dot" />
                        <div className="tl-body">
                          <span className="tl-kind">{KIND[e.kind]}</span>
                          <b>{e.title}</b>
                          {(e.km || e.cost) && (
                            <span className="small mono muted">
                              {e.km ? `${e.km.toLocaleString(locale)} km` : ''}
                              {e.km && e.cost ? ' · ' : ''}
                              {e.cost ? fmtMoney(e.cost.amount, e.cost.cur, locale) : ''}
                            </span>
                          )}
                          {e.notes && <p className="small">{e.notes}</p>}
                        </div>
                        <button className="icon-btn no-print" onClick={() => confirm('Eintrag löschen?') && removePassportEntry(e.id)} aria-label="Eintrag löschen">
                          <Trash2 size={14} />
                        </button>
                      </motion.li>
                    ))}
                  </ol>
                )}
                <footer className="pp-foot">
                  Erstellt mit {BRAND.name} am {fmtDate(today(), locale)}. Selbst geführte Aufzeichnung, kein amtliches Dokument.
                </footer>
              </article>
            )}
          </>
        )}
      </section>
    </>
  )
}
