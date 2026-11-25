// Automotive Passport: die Geschichte eines Autos auf einer Zeitleiste. Druckbar und als Datei exportierbar.
import { Download, FileText, Plus, Printer, Trash2 } from 'lucide-react'
import { motion } from 'motion/react'
import { useState } from 'react'
import { BRAND } from '../../config/brand.ts'
import { countryById } from '../../data/countries.ts'
import { EmptyState, EASE, PageHead, StatusPill, VehicleSelect, VehicleVisual, fmtDate, fmtMoney, img, today, vehicleTitle } from '../../components/ui.tsx'
import { loadPhotos } from '../../components/ModelFinder.tsx'
import { modelImg } from '../../lib/modelimg.ts'
import { addPassportEntry, downloadFile, nowIso, removePassportEntry, useStore } from '../../store/store.ts'
import type { PassportKind } from '../../store/schema.ts'
import { useT, type TKey } from '../../i18n/i18n.ts'

const KIND: Record<PassportKind, { de: string; en: string }> = {
  purchase: { de: 'Kauf', en: 'Purchase' },
  import: { de: 'Import', en: 'Import' },
  registration: { de: 'Zulassung', en: 'Registration' },
  service: { de: 'Wartung', en: 'Service' },
  mod: { de: 'Umbau', en: 'Modification' },
  trip: { de: 'Fahrt', en: 'Drive' },
  document: { de: 'Dokument', en: 'Document' },
  note: { de: 'Notiz', en: 'Note' },
}

export default function Passport({ vehicleId }: { vehicleId?: string }) {
  const { t, tx, L, locale } = useT()
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

  const [pdf, setPdf] = useState<'idle' | 'busy' | 'error'>('idle')
  const [pdfNote, setPdfNote] = useState('')
  const exportPdf = async () => {
    if (!v) return
    setPdf('busy')
    setPdfNote('')
    try {
      const { buildDossier } = await import('../../lib/dossier.ts')
      const c = v.market ? countryById(v.market) : undefined
      const shot = v.modelId && !v.image ? (await loadPhotos())[v.modelId]?.[0] : undefined
      const r = await buildDossier({
        v,
        passport: entries,
        maintenance: maintenance.filter((m) => m.vehicleId === v.id),
        kinds: Object.fromEntries(Object.entries(KIND).map(([k, x]) => [k, L(x)])),
        status: t(('status.' + v.status) as TKey),
        origin: c ? L(c.name) : v.market?.toUpperCase(),
        tx,
        locale,
        cover: v.image ? img(v.image) : shot ? modelImg(v.modelId!) : undefined,
        coverCredit: shot ? `${tx('Symbolfoto des Modells', 'Stock photo of the model')}: ${shot.a}, Wikimedia Commons, ${shot.l}` : v.image ? tx('Symbolfoto des Modells, Nachweis in der App unter „Daten“', 'Stock photo of the model, credits in the app under “Data”') : undefined,
      })
      const url = URL.createObjectURL(r.blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${BRAND.ascii.toLowerCase()}-${[v.make, v.model].join('-').replace(/[^\w-]+/g, '_')}.pdf`
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 20000)
      setPdf('idle')
      setPdfNote(r.skipped ? tx(`${r.skipped} Fotos sind nicht in der Mappe (höchstens 13, oder nicht lesbar).`, `${r.skipped} photos are not in the dossier (13 at most, or unreadable).`) : '')
    } catch {
      setPdf('error')
    }
  }

  return (
    <>
      <PageHead
        eyebrow="Own · Automotive Passport"
        title={
          <>
            {tx('Jedes Auto ', 'Every car ')}<em>{tx('hat eine Geschichte.', 'has a story.')}</em>
          </>
        }
        sub={tx('Kauf, Import, Zulassung, Wartung, Umbauten und Fahrten. Einträge aus Wartungsplaner, Build Studio, Roadtrip-Builder und Import-Journey landen automatisch hier.', 'Purchase, import, registration, service, modifications and drives. Entries from the maintenance planner, build studio, road trip builder and import journey appear here automatically.')}
        image={img('fuji-lakes')}
      />
      <section className="section narrow">
        {vehicles.length === 0 ? (
          <EmptyState title={tx('Der Passport beginnt mit einem Auto.', 'The passport starts with a car.')} text={tx('Leg dein Fahrzeug in der Garage an, dann schreibt sich seine Geschichte hier.', 'Add your vehicle in the garage and its story will be written here.')} image={img('cars/r34')} actions={[{ to: 'own/garage', label: tx('Zur Garage', 'Go to garage'), primary: true }]} />
        ) : (
          <>
            <div className="build-head no-print">
              <VehicleSelect vehicles={vehicles} value={sel} onChange={setSel} />
              <div className="row gap">
                <button className="btn primary" onClick={exportPdf} disabled={!v || pdf === 'busy'}>
                  <FileText size={16} /> {pdf === 'busy' ? tx('PDF entsteht …', 'Creating PDF …') : tx('Fahrzeugmappe (PDF)', 'Vehicle dossier (PDF)')}
                </button>
                <button className="btn" onClick={() => print()} disabled={!v}>
                  <Printer size={16} /> {tx('Drucken', 'Print')}
                </button>
                <button className="btn" onClick={exportOne} disabled={!v}>
                  <Download size={16} /> Export
                </button>
              </div>
            </div>
            {pdf === 'error' && <p className="small">{tx('Die Mappe konnte nicht erstellt werden.', 'The dossier could not be created.')}</p>}
            {pdfNote && <p className="small muted">{pdfNote}</p>}
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
                          <dt>{tx('Kilometerstand', 'Mileage')}</dt>
                          <dd className="mono">{v.mileageKm.toLocaleString(locale)} km</dd>
                        </>
                      )}
                      {v.market && (
                        <>
                          <dt>{tx('Herkunft', 'Origin')}</dt>
                          <dd>
                            {countryById(v.market)?.flag} {countryById(v.market) ? L(countryById(v.market)!.name) : v.market.toUpperCase()}
                          </dd>
                        </>
                      )}
                      {v.landed && (
                        <>
                          <dt>{tx('Importkosten', 'Landed cost')}</dt>
                          <dd className="mono">{fmtMoney(v.landed.amount, v.landed.cur, locale)}</dd>
                        </>
                      )}
                      <dt>{tx('Einträge', 'Entries')}</dt>
                      <dd className="mono">
                        {entries.length}
                        {total > 0 ? ` · ${fmtMoney(total, 'EUR', locale)} ${tx('belegt', 'documented')}` : ''}
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
                  <input className="input" type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} aria-label={tx('Datum', 'Date')} />
                  <select className="input" value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value as PassportKind })} aria-label={tx('Art', 'Type')}>
                    {(Object.keys(KIND) as PassportKind[]).map((k) => (
                      <option key={k} value={k}>
                        {L(KIND[k])}
                      </option>
                    ))}
                  </select>
                  <input className="input grow" placeholder={tx('Eintrag, z. B. Zulassung mit H-Kennzeichen', 'Entry, e.g. registered with historic plate')} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} aria-label={tx('Eintrag', 'Entry')} />
                  <input className="input short" placeholder="km" inputMode="numeric" value={f.km} onChange={(e) => setF({ ...f, km: e.target.value })} aria-label={tx('Kilometerstand', 'Mileage')} />
                  <button className="btn primary" disabled={!f.title.trim()}>
                    <Plus size={16} /> {tx('Eintragen', 'Add entry')}
                  </button>
                </form>

                {entries.length === 0 ? (
                  <p className="muted pp-empty">{tx('Noch keine Einträge. Trag den Kauf ein, buche eine Wartung als erledigt oder schließe die Import-Journey ab.', 'No entries yet. Log the purchase, mark a service as done or complete the import journey.')}</p>
                ) : (
                  <ol className="timeline">
                    {entries.map((e, k) => (
                      <motion.li key={e.id} className={'tl k-' + e.kind} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: Math.min(k, 10) * 0.03, ease: EASE }}>
                        <span className="tl-date mono">{fmtDate(e.date, locale)}</span>
                        <span className="tl-dot" />
                        <div className="tl-body">
                          <span className="tl-kind">{L(KIND[e.kind])}</span>
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
                        <button className="icon-btn no-print" onClick={() => confirm(tx('Eintrag löschen?', 'Delete entry?')) && removePassportEntry(e.id)} aria-label={tx('Eintrag löschen', 'Delete entry')}>
                          <Trash2 size={14} />
                        </button>
                      </motion.li>
                    ))}
                  </ol>
                )}
                <footer className="pp-foot">
                  {tx(`Erstellt mit ${BRAND.name} am ${fmtDate(today(), locale)}. Selbst geführte Aufzeichnung, kein amtliches Dokument.`, `Created with ${BRAND.name} on ${fmtDate(today(), locale)}. Self-kept record, not an official document.`)}
                </footer>
              </article>
            )}
          </>
        )}
      </section>
    </>
  )
}
