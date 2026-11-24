// Wartungsplaner: nächste Fälligkeit aus Intervall (Monate/km) und letzter Erledigung.
import type { MaintenanceItem } from '../store/schema.ts'

export function addMonths(iso: string, months: number) {
  const d = new Date(iso + 'T12:00:00Z')
  const day = d.getUTCDate()
  d.setUTCDate(1)
  d.setUTCMonth(d.getUTCMonth() + months)
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate()
  d.setUTCDate(Math.min(day, last))
  return d.toISOString().slice(0, 10)
}

/** Fälligkeit aus Intervall neu berechnen (explizit gesetzte Fälligkeiten bleiben, wenn kein Intervall da ist) */
export function nextDue(m: Pick<MaintenanceItem, 'intervalMonths' | 'intervalKm' | 'lastDate' | 'lastKm' | 'dueDate' | 'dueKm'>) {
  return {
    dueDate: m.intervalMonths && m.lastDate ? addMonths(m.lastDate, m.intervalMonths) : m.dueDate,
    dueKm: m.intervalKm && m.lastKm !== undefined ? m.lastKm + m.intervalKm : m.dueKm,
  }
}

export type DueState = 'overdue' | 'soon' | 'ok' | 'open'

export function dueState(m: Pick<MaintenanceItem, 'dueDate' | 'dueKm'>, today: string, currentKm?: number): DueState {
  if (!m.dueDate && m.dueKm === undefined) return 'open'
  const dateLeft = m.dueDate ? (Date.parse(m.dueDate) - Date.parse(today)) / 86400000 : Infinity
  const kmLeft = m.dueKm !== undefined && currentKm !== undefined ? m.dueKm - currentKm : Infinity
  if (dateLeft < 0 || kmLeft < 0) return 'overdue'
  if (dateLeft <= 30 || kmLeft <= 1000) return 'soon'
  return 'ok'
}

/** Kalenderdatei (iCalendar) mit allen Fälligkeiten, ganztägig */
export function toIcs(items: { title: string; date: string; description?: string }[], prodId = '-//TOMEI//Wartung//DE') {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z')
  const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
  const ev = items.map((it, i) => {
    const d = it.date.replace(/-/g, '')
    const end = addDays(it.date, 1).replace(/-/g, '')
    return ['BEGIN:VEVENT', `UID:${d}-${i}-${stamp}@tomei`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${d}`, `DTEND;VALUE=DATE:${end}`, `SUMMARY:${esc(it.title)}`, ...(it.description ? [`DESCRIPTION:${esc(it.description)}`] : []), 'END:VEVENT'].join('\r\n')
  })
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', `PRODID:${prodId}`, 'CALSCALE:GREGORIAN', ...ev, 'END:VCALENDAR'].join('\r\n')
}

export function addDays(iso: string, days: number) {
  const d = new Date(iso + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}
