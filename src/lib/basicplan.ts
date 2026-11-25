// Wartungs-Grundplan, der beim Anlegen eines eigenen Autos automatisch entsteht
import { today } from '../components/ui.tsx'
import { getState, uid, upsertMaintenance } from '../store/store.ts'
import type { MaintenanceKind, Vehicle } from '../store/schema.ts'
import { nextDue } from './maintenance.ts'

/** Üblicher Grundplan als Startpunkt. Maßgeblich ist das Serviceheft; HU-Frist: § 29 StVZO (Pkw alle 24 Monate). */
const BASIC: { de: string; en: string; kind: MaintenanceKind; months: number; km?: number }[] = [
  { de: 'Ölwechsel mit Filter', en: 'Oil and filter change', kind: 'service', months: 12, km: 10000 },
  { de: 'Hauptuntersuchung (HU)', en: 'Roadworthiness test (HU)', kind: 'inspection', months: 24 },
  { de: 'Bremsflüssigkeit', en: 'Brake fluid', kind: 'service', months: 24 },
  { de: 'Reifen prüfen und wechseln', en: 'Check and change tyres', kind: 'tyres', months: 6 },
  { de: 'Batterie und Frostschutz vor dem Winter', en: 'Battery and antifreeze before winter', kind: 'season', months: 12 },
]

export function addBasicPlan(v: Vehicle, L: (x: { de: string; en: string }) => string) {
  const items = getState().maintenance.filter((m) => m.vehicleId === v.id)
  for (const b of BASIC) {
    const title = L(b)
    if (items.some((x) => x.title === title)) continue
    const base = { intervalMonths: b.months, intervalKm: b.km, lastDate: today(), lastKm: b.km ? v.mileageKm : undefined }
    const hu = b.kind === 'inspection' && v.huDue ? { dueDate: v.huDue + '-28' } : {}
    upsertMaintenance({ id: uid(), vehicleId: v.id, title, kind: b.kind, ...base, ...nextDue(base), ...hu, history: [] })
  }
}
