// OWN: Übersicht und Garage (Liste nach Status + Fahrzeugdetail). Alle Fahrzeuge kommen aus dem gemeinsamen Speicher.
import { ArrowRight, Calculator, ExternalLink, Plus, Trash2 } from 'lucide-react'
import { motion } from 'motion/react'
import { useState } from 'react'
import { MARKETS, sendToCalc } from '../../data.ts'
import { roadImg } from '../../data/roads.ts'
import { WorldHub } from '../../components/WorldHub.tsx'
import { EmptyState, EASE, NotFound, PageHead, StatusPill, VehicleVisual, fmtMoney, img, vehicleTitle } from '../../components/ui.tsx'
import { useT, type TKey } from '../../i18n/i18n.ts'
import { href, navigate } from '../../lib/router.ts'
import { addVehicle, removeVehicle, updateVehicle, useStore } from '../../store/store.ts'
import { VEHICLE_STATUS, type Vehicle, type VehicleStatus } from '../../store/schema.ts'

export function OwnHub() {
  const { t, tx } = useT()
  const n = useStore((s) => s.vehicles.length)
  const due = useStore((s) => s.maintenance.length)
  return (
    <WorldHub
      eyebrow="Own"
      title={
        <>
          {tx('Vom Traum ', 'From dream ')}<em>{tx('bis zum Fahrzeugbrief.', 'to logbook.')}</em>
        </>
      }
      sub={t('world.own.text')}
      image={img('fuji-lakes')}
      tools={[
        { to: 'own/garage', title: 'Garage', text: tx('Alle Autos an einem Ort, mit Status vom Traum über Import bis Verkauf.', 'All cars in one place, with status from dream through import to sale.'), img: img('cars/r34'), meta: n ? tx(`${n} Fahrzeuge`, `${n} vehicles`) : tx('Noch leer', 'Still empty') },
        { to: 'own/simulator', title: tx('Ownership-Simulator', 'Ownership simulator'), text: tx('Was ein Auto über die Jahre wirklich kostet: Sprit, Versicherung, Steuer, Wartung und Wertänderung.', 'What a car really costs over the years: fuel, insurance, tax, maintenance and change in value.'), img: img('cars/fd'), meta: tx('Nur deine Zahlen', 'Only your numbers') },
        { to: 'own/build', title: 'Build Studio', text: tx('Umbauten planen, Budget im Blick, Teile-Shops.', 'Plan modifications, keep the budget in view, parts shops.'), img: img('parts-wheel'), meta: tx('Plan → Einbau', 'Plan → installed') },
        { to: 'own/maintenance', title: tx('Wartungsplaner', 'Maintenance planner'), text: tx('Intervalle nach Zeit und Kilometern, Fälligkeiten, Kalender-Export.', 'Intervals by time and distance, due dates, calendar export.'), img: img('parts-engine'), meta: due ? tx(`${due} Einträge`, `${due} entries`) : tx('Mit .ics-Export', 'With .ics export') },
        { to: 'own/passport', title: 'Automotive Passport', text: tx('Die Geschichte deines Autos auf einer Zeitleiste. Druckbar und exportierbar.', 'Your car’s story on one timeline. Printable and exportable.'), img: roadImg('hakone'), meta: tx('Kauf · Import · Wartung · Fahrten', 'Purchase · import · service · drives') },
      ]}
    />
  )
}

export { VehicleVisual }

const STATUS_HINT: Record<VehicleStatus, { de: string; en: string }> = {
  dream: { de: 'Irgendwann einmal', en: 'Someday' },
  watchlist: { de: 'Konkrete Inserate', en: 'Specific listings' },
  planned: { de: 'Durchgerechnet, Kauf geplant', en: 'Calculated, purchase planned' },
  import: { de: 'Gekauft, unterwegs', en: 'Bought, on its way' },
  owned: { de: 'In deiner Garage', en: 'In your garage' },
  sold: { de: 'Weitergegeben', en: 'Passed on' },
}

function AddVehicle({ onDone }: { onDone?: (v: Vehicle) => void }) {
  const [f, setF] = useState({ make: '', model: '', year: '', status: 'dream' as VehicleStatus })
  const { t, tx } = useT()
  const ok = f.make.trim() || f.model.trim()
  return (
    <form
      className="add-veh"
      onSubmit={(e) => {
        e.preventDefault()
        if (!ok) return
        const y = parseInt(f.year, 10)
        const v = addVehicle({ make: f.make.trim(), model: f.model.trim(), year: y > 1885 && y < 2100 ? y : undefined, status: f.status, source: 'manual' })
        setF({ make: '', model: '', year: '', status: f.status })
        onDone?.(v)
      }}
    >
      <input className="input" placeholder={tx('Marke', 'Make')} value={f.make} onChange={(e) => setF({ ...f, make: e.target.value })} aria-label={tx('Marke', 'Make')} />
      <input className="input" placeholder={tx('Modell', 'Model')} value={f.model} onChange={(e) => setF({ ...f, model: e.target.value })} aria-label={tx('Modell', 'Model')} />
      <input className="input short" placeholder={tx('Baujahr', 'Year')} inputMode="numeric" value={f.year} onChange={(e) => setF({ ...f, year: e.target.value.replace(/\D/g, '').slice(0, 4) })} aria-label={tx('Baujahr', 'Year')} />
      <select className="input" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value as VehicleStatus })} aria-label="Status">
        {VEHICLE_STATUS.map((s) => (
          <option key={s} value={s}>
            {t(('status.' + s) as TKey)}
          </option>
        ))}
      </select>
      <button className="btn primary" disabled={!ok}>
        <Plus size={16} /> {tx('Anlegen', 'Add')}
      </button>
    </form>
  )
}

export function Garage({ vehicleId }: { vehicleId?: string }) {
  if (vehicleId) return <VehiclePage id={vehicleId} />
  return <GarageList />
}

function GarageList() {
  const { t, tx, L, locale } = useT()
  const vehicles = useStore((s) => s.vehicles)
  const [filter, setFilter] = useState<VehicleStatus | 'all'>('all')
  const list = vehicles.filter((v) => filter === 'all' || v.status === filter)
  const counts = Object.fromEntries(VEHICLE_STATUS.map((s) => [s, vehicles.filter((v) => v.status === s).length])) as Record<VehicleStatus, number>
  return (
    <>
      <PageHead
        eyebrow="Own · Garage"
        title={
          <>
            {tx('Deine Garage. ', 'Your garage. ')}<em>{tx('Jeder Status.', 'Every status.')}</em>
          </>
        }
        sub={tx('Vom Traumauto bis zum Verkauf. Was du hier anlegst, kennen Importrechner, Roadtrip-Builder, Simulator, Wartung und Passport.', 'From dream car to sale. What you add here is known to the import calculator, road trip builder, simulator, maintenance and passport.')}
      >
        <AddVehicle onDone={(v) => navigate('own/garage/' + v.id)} />
      </PageHead>

      <section className="section">
        <div className="pipeline">
          {VEHICLE_STATUS.map((s) => (
            <button key={s} className={'pipe' + (filter === s ? ' on' : '')} onClick={() => setFilter(filter === s ? 'all' : s)} aria-pressed={filter === s}>
              <b className="mono">{counts[s]}</b>
              <span>{t(('status.' + s) as TKey)}</span>
              <small>{L(STATUS_HINT[s])}</small>
            </button>
          ))}
        </div>

        {vehicles.length === 0 ? (
          <EmptyState
            title={t('empty.garage.title')}
            text={t('empty.garage.text')}
            image={img('cars/fd')}
            actions={[
              { to: '', label: tx('Traumauto auf der Startseite', 'Dream car on the home page'), primary: true },
              { to: 'discover/search', label: tx('Fahrzeugsuche', 'Vehicle search') },
              { to: 'discover/calculator', label: tx('Importrechner', 'Import calculator') },
            ]}
          />
        ) : list.length === 0 ? (
          <p className="muted">{tx('Kein Fahrzeug mit diesem Status.', 'No vehicle with this status.')}</p>
        ) : (
          <div className="garage">
            {list.map((v, k) => (
              <motion.a key={v.id} href={href('own/garage/' + v.id)} className="veh" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: Math.min(k, 8) * 0.04, ease: EASE }}>
                <div className="veh-img" style={{ viewTransitionName: 'veh-' + v.id }}>
                  <VehicleVisual v={v} />
                </div>
                <div className="veh-body">
                  <StatusPill status={v.status} />
                  <h3>{vehicleTitle(v)}</h3>
                  <span className="muted small mono">
                    {v.landed ? `${fmtMoney(v.landed.amount, v.landed.cur, locale)} ${tx('bis vor die Tür', 'landed')}` : v.price ? fmtMoney(v.price.amount, v.price.cur, locale) : tx('noch kein Preis', 'no price yet')}
                  </span>
                </div>
              </motion.a>
            ))}
          </div>
        )}
      </section>
    </>
  )
}

function VehiclePage({ id }: { id: string }) {
  const { t, tx, locale, d } = useT()
  const v = useStore((s) => s.vehicles.find((x) => x.id === id))
  const counts = useStore((s) => ({ m: s.maintenance.filter((x) => x.vehicleId === id).length, p: s.passport.filter((x) => x.vehicleId === id).length, tr: s.trips.filter((x) => x.vehicleId === id).length }))
  if (!v) return <NotFound />
  const set = (patch: Partial<Vehicle>) => updateVehicle(v.id, patch)
  const num = (s: string) => {
    const n = parseInt(s.replace(/[^\d]/g, ''), 10)
    return Number.isFinite(n) ? n : undefined
  }
  return (
    <>
      <section className="veh-hero">
        <div className="veh-hero-img" style={{ viewTransitionName: 'veh-' + v.id }}>
          <VehicleVisual v={v} big />
        </div>
        <div className="veh-hero-text">
          <a className="phead-back" href={href('own/garage')}>
            ← Garage
          </a>
          <StatusPill status={v.status} />
          <h1>{vehicleTitle(v)}</h1>
          {v.landed && (
            <p className="veh-landed">
              <b className="mono">{fmtMoney(v.landed.amount, v.landed.cur, locale)}</b> {tx('bis vor die Tür', 'landed')} ({v.landed.scenario === 'expected' ? 'Expected' : v.landed.scenario === 'best' ? 'Best Case' : v.landed.scenario === 'worst' ? 'Worst Case' : 'Custom'})
              {v.landed.range && (
                <span className="muted">
                  {' '}
                  · Spanne {fmtMoney(v.landed.range.best, v.landed.cur, locale)} bis {fmtMoney(v.landed.range.worst, v.landed.cur, locale)}
                </span>
              )}
              <small className="muted">{v.landed.basis}</small>
            </p>
          )}
        </div>
      </section>

      <section className="section narrow">
        <div className="veh-links">
          {v.price && v.price.amount > 0 && (
            <button className="vl" onClick={() => sendToCalc({ id: v.id, title: [v.make, v.model, v.variant].filter(Boolean).join(' '), url: v.url ?? '', price: v.price!.amount, cur: v.price!.cur, market: v.market ?? 'jp', added: v.createdAt })}>
              <Calculator size={18} />
              <b>{tx('Durchrechnen', 'Calculate')}</b>
              <span>{tx('Importrechner mit diesem Preis', 'Import calculator with this price')}</span>
            </button>
          )}
          <a className="vl" href={href('discover/journey/' + v.id)}>
            <b>Import-Journey</b>
            <span>{v.journey.length} {tx('von 9 Schritten', 'of 9 steps')}</span>
          </a>
          <a className="vl" href={href('own/simulator/' + v.id)}>
            <b>{tx('Unterhalt', 'Ownership')}</b>
            <span>{v.ownership ? tx('Simulation gespeichert', 'Simulation saved') : tx('Simulieren', 'Simulate')}</span>
          </a>
          <a className="vl" href={href('own/build/' + v.id)}>
            <b>Build Studio</b>
            <span>{v.mods.length} {tx('Umbauten', 'mods')}</span>
          </a>
          <a className="vl" href={href('own/maintenance/' + v.id)}>
            <b>{tx('Wartung', 'Maintenance')}</b>
            <span>{counts.m} {tx('Einträge', 'entries')}</span>
          </a>
          <a className="vl" href={href('own/passport/' + v.id)}>
            <b>Passport</b>
            <span>
              {counts.p} {tx('Einträge', 'entries')} · {counts.tr} {tx('Fahrten', 'drives')}
            </span>
          </a>
        </div>

        <div className="gcard">
          <h3>{tx('Daten', 'Details')}</h3>
          <div className="fields two">
            <label className="field">
              <span className="f-label">{tx('Marke', 'Make')}</span>
              <input className="input" value={v.make} onChange={(e) => set({ make: e.target.value.slice(0, 80) })} />
            </label>
            <label className="field">
              <span className="f-label">{tx('Modell', 'Model')}</span>
              <input className="input" value={v.model} onChange={(e) => set({ model: e.target.value.slice(0, 120) })} />
            </label>
            <label className="field">
              <span className="f-label">{tx('Variante', 'Variant')}</span>
              <input className="input" value={v.variant ?? ''} onChange={(e) => set({ variant: e.target.value.slice(0, 120) || undefined })} placeholder={tx('z. B. V-Spec II', 'e.g. V-Spec II')} />
            </label>
            <label className="field">
              <span className="f-label">{tx('Fahrgestell / Code', 'Chassis / code')}</span>
              <input className="input" value={v.chassis ?? ''} onChange={(e) => set({ chassis: e.target.value.slice(0, 60) || undefined })} placeholder={tx('z. B. BNR34', 'e.g. BNR34')} />
            </label>
            <label className="field">
              <span className="f-label">{tx('Baujahr', 'Year')}</span>
              <input className="input" inputMode="numeric" value={v.year ?? ''} onChange={(e) => set({ year: num(e.target.value.slice(0, 4)) })} />
            </label>
            <label className="field">
              <span className="f-label">{tx('Status', 'Status')}</span>
              <select className="input" value={v.status} onChange={(e) => set({ status: e.target.value as VehicleStatus })}>
                {VEHICLE_STATUS.map((s) => (
                  <option key={s} value={s}>
                    {t(('status.' + s) as TKey)}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="f-label">{tx('Markt', 'Market')}</span>
              <select className="input" value={v.market ?? ''} onChange={(e) => set({ market: e.target.value || undefined })}>
                <option value="">–</option>
                {MARKETS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {d(m.country)}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="f-label">{tx('Preis im Inserat', 'Listing price')}</span>
              <span className="input">
                <input inputMode="numeric" value={v.price?.amount ?? ''} onChange={(e) => set({ price: num(e.target.value) !== undefined ? { amount: num(e.target.value)!, cur: v.price?.cur ?? (MARKETS.find((m) => m.id === v.market)?.cur ?? 'JPY') } : undefined })} />
                <select className="adorn-select" value={v.price?.cur ?? MARKETS.find((m) => m.id === v.market)?.cur ?? 'JPY'} onChange={(e) => v.price && set({ price: { ...v.price, cur: e.target.value } })} aria-label={tx('Währung', 'Currency')}>
                  {['JPY', 'EUR', 'USD', 'GBP', 'CAD', 'AUD', 'KRW', 'THB', 'MYR', 'SGD', 'HKD', 'AED'].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </span>
            </label>
            <label className="field">
              <span className="f-label">{tx('Kilometerstand', 'Mileage (km)')}</span>
              <input className="input" inputMode="numeric" value={v.mileageKm ?? ''} onChange={(e) => set({ mileageKm: num(e.target.value) })} />
            </label>
            <label className="field">
              <span className="f-label">{tx('Link zum Inserat', 'Listing link')}</span>
              <span className="input">
                <input value={v.url ?? ''} placeholder="https://…" onChange={(e) => set({ url: /^https:\/\/\S+$/.test(e.target.value.trim()) ? e.target.value.trim() : e.target.value.trim() === '' ? undefined : v.url })} />
                {v.url && (
                  <a className="adorn" href={v.url} target="_blank" rel="noopener noreferrer" aria-label={tx('Inserat öffnen', 'Open listing')}>
                    <ExternalLink size={15} />
                  </a>
                )}
              </span>
            </label>
          </div>
          <label className="field">
            <span className="f-label">{tx('Notizen', 'Notes')}</span>
            <textarea className="input" rows={4} value={v.notes ?? ''} onChange={(e) => set({ notes: e.target.value.slice(0, 4000) || undefined })} />
          </label>
          <p className="muted small">{tx('Nur https-Links werden gespeichert. Änderungen speichern sich sofort auf diesem Gerät.', 'Only https links are saved. Changes are saved instantly on this device.')}</p>
        </div>

        <div className="row gap wrap">
          <a className="btn" href={href('own/garage')}>
            <ArrowRight size={15} style={{ transform: 'rotate(180deg)' }} /> {tx('Zur Garage', 'Back to garage')}
          </a>
          <button
            className="btn danger"
            onClick={() => {
              if (confirm(tx(`„${vehicleTitle(v)}“ mit Wartung und Passport-Einträgen löschen? Das lässt sich nicht rückgängig machen.`, `Delete “${vehicleTitle(v)}” with its maintenance and passport entries? This cannot be undone.`))) {
                removeVehicle(v.id)
                navigate('own/garage')
              }
            }}
          >
            <Trash2 size={15} /> {tx('Fahrzeug löschen', 'Delete vehicle')}
          </button>
        </div>
      </section>
    </>
  )
}
