// OWN: Übersicht und Garage (Liste nach Status + Fahrzeugdetail). Alle Fahrzeuge kommen aus dem gemeinsamen Speicher.
import { ArrowRight, Calculator, ExternalLink, Plus, Trash2 } from 'lucide-react'
import { motion } from 'motion/react'
import { useState } from 'react'
import { MARKETS, sendToCalc } from '../../data.ts'
import { roadImg } from '../../data/roads.ts'
import { WorldHub } from '../../components/WorldHub.tsx'
import { EmptyState, EASE, NotFound, PageHead, StatusPill, fmtMoney, img, vehicleTitle } from '../../components/ui.tsx'
import { useT, type TKey } from '../../i18n/i18n.ts'
import { href, navigate } from '../../lib/router.ts'
import { addVehicle, removeVehicle, updateVehicle, useStore } from '../../store/store.ts'
import { VEHICLE_STATUS, type Vehicle, type VehicleStatus } from '../../store/schema.ts'

export function OwnHub() {
  const { t } = useT()
  const n = useStore((s) => s.vehicles.length)
  const due = useStore((s) => s.maintenance.length)
  return (
    <WorldHub
      eyebrow="Own"
      title={
        <>
          Vom Traum <em>bis zum Fahrzeugbrief.</em>
        </>
      }
      sub={t('world.own.text')}
      image={img('fuji-lakes')}
      tools={[
        { to: 'own/garage', title: 'Garage', text: 'Alle Autos an einem Ort, mit Status vom Traum über Import bis Verkauf.', img: img('cars/r34'), meta: n ? `${n} Fahrzeuge` : 'Noch leer' },
        { to: 'own/simulator', title: 'Ownership-Simulator', text: 'Was ein Auto über die Jahre wirklich kostet: Sprit, Versicherung, Steuer, Wartung und Wertänderung.', img: img('cars/fd'), meta: 'Nur deine Zahlen' },
        { to: 'own/build', title: 'Build Studio', text: 'Umbauten planen, Budget im Blick, Teile-Shops aus Japan.', img: img('parts-wheel'), meta: 'Plan → Einbau' },
        { to: 'own/maintenance', title: 'Wartungsplaner', text: 'Intervalle nach Zeit und Kilometern, Fälligkeiten, Kalender-Export.', img: img('parts-engine'), meta: due ? `${due} Einträge` : 'Mit .ics-Export' },
        { to: 'own/passport', title: 'Automotive Passport', text: 'Die Geschichte deines Autos auf einer Zeitleiste. Druckbar und exportierbar.', img: roadImg('hakone'), meta: 'Kauf · Import · Wartung · Fahrten' },
      ]}
    />
  )
}

/** Kopfbild eines Fahrzeugs: nur lizenzierte Fotos, sonst eine typografische Karte */
export function VehicleVisual({ v, big }: { v: Vehicle; big?: boolean }) {
  if (v.image) return <img className="veh-photo" src={img(v.image)} alt={vehicleTitle(v)} loading={big ? undefined : 'lazy'} />
  return (
    <div className={'veh-type' + (big ? ' big' : '')} aria-hidden>
      <span>{v.make}</span>
      <b>{v.model}</b>
      {v.chassis && <i>{v.chassis}</i>}
    </div>
  )
}

const STATUS_HINT: Record<VehicleStatus, string> = {
  dream: 'Irgendwann einmal',
  watchlist: 'Konkrete Inserate',
  planned: 'Durchgerechnet, Kauf geplant',
  import: 'Gekauft, unterwegs',
  owned: 'In deiner Garage',
  sold: 'Weitergegeben',
}

function AddVehicle({ onDone }: { onDone?: (v: Vehicle) => void }) {
  const [f, setF] = useState({ make: '', model: '', year: '', status: 'dream' as VehicleStatus })
  const { t } = useT()
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
      <input className="input" placeholder="Marke" value={f.make} onChange={(e) => setF({ ...f, make: e.target.value })} aria-label="Marke" />
      <input className="input" placeholder="Modell" value={f.model} onChange={(e) => setF({ ...f, model: e.target.value })} aria-label="Modell" />
      <input className="input short" placeholder="Baujahr" inputMode="numeric" value={f.year} onChange={(e) => setF({ ...f, year: e.target.value.replace(/\D/g, '').slice(0, 4) })} aria-label="Baujahr" />
      <select className="input" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value as VehicleStatus })} aria-label="Status">
        {VEHICLE_STATUS.map((s) => (
          <option key={s} value={s}>
            {t(('status.' + s) as TKey)}
          </option>
        ))}
      </select>
      <button className="btn primary" disabled={!ok}>
        <Plus size={16} /> Anlegen
      </button>
    </form>
  )
}

export function Garage({ vehicleId }: { vehicleId?: string }) {
  if (vehicleId) return <VehiclePage id={vehicleId} />
  return <GarageList />
}

function GarageList() {
  const { t, locale } = useT()
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
            Deine Garage. <em>Jeder Status.</em>
          </>
        }
        sub="Vom Traumauto bis zum Verkauf. Was du hier anlegst, kennen Importrechner, Roadtrip-Builder, Simulator, Wartung und Passport."
      >
        <AddVehicle onDone={(v) => navigate('own/garage/' + v.id)} />
      </PageHead>

      <section className="section">
        <div className="pipeline">
          {VEHICLE_STATUS.map((s) => (
            <button key={s} className={'pipe' + (filter === s ? ' on' : '')} onClick={() => setFilter(filter === s ? 'all' : s)} aria-pressed={filter === s}>
              <b className="mono">{counts[s]}</b>
              <span>{t(('status.' + s) as TKey)}</span>
              <small>{STATUS_HINT[s]}</small>
            </button>
          ))}
        </div>

        {vehicles.length === 0 ? (
          <EmptyState
            title={t('empty.garage.title')}
            text={t('empty.garage.text')}
            image={img('cars/fd')}
            actions={[
              { to: '', label: 'Traumauto auf der Startseite', primary: true },
              { to: 'discover/search', label: 'Fahrzeugsuche' },
              { to: 'discover/calculator', label: 'Importrechner' },
            ]}
          />
        ) : list.length === 0 ? (
          <p className="muted">Kein Fahrzeug mit diesem Status.</p>
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
                    {v.landed ? `${fmtMoney(v.landed.amount, v.landed.cur, locale)} bis vor die Tür` : v.price ? fmtMoney(v.price.amount, v.price.cur, locale) : 'noch kein Preis'}
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
  const { t, locale } = useT()
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
              <b className="mono">{fmtMoney(v.landed.amount, v.landed.cur, locale)}</b> bis vor die Tür ({v.landed.scenario === 'expected' ? 'Expected' : v.landed.scenario === 'best' ? 'Best Case' : v.landed.scenario === 'worst' ? 'Worst Case' : 'Custom'})
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
              <b>Durchrechnen</b>
              <span>Importrechner mit diesem Preis</span>
            </button>
          )}
          <a className="vl" href={href('discover/journey/' + v.id)}>
            <b>Import-Journey</b>
            <span>{v.journey.length} von 9 Schritten</span>
          </a>
          <a className="vl" href={href('own/simulator/' + v.id)}>
            <b>Unterhalt</b>
            <span>{v.ownership ? 'Simulation gespeichert' : 'Simulieren'}</span>
          </a>
          <a className="vl" href={href('own/build/' + v.id)}>
            <b>Build Studio</b>
            <span>{v.mods.length} Umbauten</span>
          </a>
          <a className="vl" href={href('own/maintenance/' + v.id)}>
            <b>Wartung</b>
            <span>{counts.m} Einträge</span>
          </a>
          <a className="vl" href={href('own/passport/' + v.id)}>
            <b>Passport</b>
            <span>
              {counts.p} Einträge · {counts.tr} Fahrten
            </span>
          </a>
        </div>

        <div className="gcard">
          <h3>Daten</h3>
          <div className="fields two">
            <label className="field">
              <span className="f-label">Marke</span>
              <input className="input" value={v.make} onChange={(e) => set({ make: e.target.value.slice(0, 80) })} />
            </label>
            <label className="field">
              <span className="f-label">Modell</span>
              <input className="input" value={v.model} onChange={(e) => set({ model: e.target.value.slice(0, 120) })} />
            </label>
            <label className="field">
              <span className="f-label">Variante</span>
              <input className="input" value={v.variant ?? ''} onChange={(e) => set({ variant: e.target.value.slice(0, 120) || undefined })} placeholder="z. B. V-Spec II" />
            </label>
            <label className="field">
              <span className="f-label">Fahrgestell / Code</span>
              <input className="input" value={v.chassis ?? ''} onChange={(e) => set({ chassis: e.target.value.slice(0, 60) || undefined })} placeholder="z. B. BNR34" />
            </label>
            <label className="field">
              <span className="f-label">Baujahr</span>
              <input className="input" inputMode="numeric" value={v.year ?? ''} onChange={(e) => set({ year: num(e.target.value.slice(0, 4)) })} />
            </label>
            <label className="field">
              <span className="f-label">Status</span>
              <select className="input" value={v.status} onChange={(e) => set({ status: e.target.value as VehicleStatus })}>
                {VEHICLE_STATUS.map((s) => (
                  <option key={s} value={s}>
                    {t(('status.' + s) as TKey)}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="f-label">Markt</span>
              <select className="input" value={v.market ?? ''} onChange={(e) => set({ market: e.target.value || undefined })}>
                <option value="">–</option>
                {MARKETS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.country}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="f-label">Preis im Inserat</span>
              <span className="input">
                <input inputMode="numeric" value={v.price?.amount ?? ''} onChange={(e) => set({ price: num(e.target.value) !== undefined ? { amount: num(e.target.value)!, cur: v.price?.cur ?? (MARKETS.find((m) => m.id === v.market)?.cur ?? 'JPY') } : undefined })} />
                <select className="adorn-select" value={v.price?.cur ?? MARKETS.find((m) => m.id === v.market)?.cur ?? 'JPY'} onChange={(e) => v.price && set({ price: { ...v.price, cur: e.target.value } })} aria-label="Währung">
                  {['JPY', 'EUR', 'USD', 'GBP', 'CAD', 'AUD', 'KRW', 'THB', 'MYR', 'SGD', 'HKD', 'AED'].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </span>
            </label>
            <label className="field">
              <span className="f-label">Kilometerstand</span>
              <input className="input" inputMode="numeric" value={v.mileageKm ?? ''} onChange={(e) => set({ mileageKm: num(e.target.value) })} />
            </label>
            <label className="field">
              <span className="f-label">Link zum Inserat</span>
              <span className="input">
                <input value={v.url ?? ''} placeholder="https://…" onChange={(e) => set({ url: /^https:\/\/\S+$/.test(e.target.value.trim()) ? e.target.value.trim() : e.target.value.trim() === '' ? undefined : v.url })} />
                {v.url && (
                  <a className="adorn" href={v.url} target="_blank" rel="noopener noreferrer" aria-label="Inserat öffnen">
                    <ExternalLink size={15} />
                  </a>
                )}
              </span>
            </label>
          </div>
          <label className="field">
            <span className="f-label">Notizen</span>
            <textarea className="input" rows={4} value={v.notes ?? ''} onChange={(e) => set({ notes: e.target.value.slice(0, 4000) || undefined })} />
          </label>
          <p className="muted small">Nur https-Links werden gespeichert. Änderungen speichern sich sofort auf diesem Gerät.</p>
        </div>

        <div className="row gap wrap">
          <a className="btn" href={href('own/garage')}>
            <ArrowRight size={15} style={{ transform: 'rotate(180deg)' }} /> Zur Garage
          </a>
          <button
            className="btn danger"
            onClick={() => {
              if (confirm(`„${vehicleTitle(v)}“ mit Wartung und Passport-Einträgen löschen? Das lässt sich nicht rückgängig machen.`)) {
                removeVehicle(v.id)
                navigate('own/garage')
              }
            }}
          >
            <Trash2 size={15} /> Fahrzeug löschen
          </button>
        </div>
      </section>
    </>
  )
}
