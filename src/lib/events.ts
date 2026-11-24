// Termine mit Quelle (src/data/events.json, von Hand bzw. aus den Saisonseiten der Wikipedia, Stand 24.11.2026)
// und wöchentliche Treffen. Alle Vergleiche laufen über ISO-Datumstexte (YYYY-MM-DD, Ortszeit des Nutzers).
export type EventKind = 'show' | 'classic' | 'auction' | 'race' | 'rally' | 'meet'
export type CarEvent = { n: string; a: string; b: string; cc: string; p: string; k: EventKind; s: string }
/** Wöchentlich wiederkehrend: day 0 = Sonntag */
export const WEEKLY: (Omit<CarEvent, 'a' | 'b'> & { day: number; from: string; until: string })[] = [
  { n: 'Supercar Sunday', cc: 'us', p: 'Pierce College, Woodland Hills', k: 'meet', s: 'https://www.idrivesocal.com/events/supercar-sunday-car-show/', day: 0, from: '2026-11-29', until: '2027-01-03' },
]

export const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const parse = (s: string) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d, 12)
}
export const shiftDays = (s: string, n: number) => {
  const d = parse(s)
  d.setDate(d.getDate() + n)
  return iso(d)
}
/** Montag bis Sonntag der Woche, in der `day` liegt, verschoben um `offset` Wochen */
export function weekOf(day: string, offset = 0): { from: string; to: string } {
  const wd = (parse(day).getDay() + 6) % 7
  const from = shiftDays(day, -wd + offset * 7)
  return { from, to: shiftDays(from, 6) }
}
/** Alle Termine, die sich mit dem Zeitraum überschneiden, samt wöchentlicher Treffen */
export function eventsBetween(list: CarEvent[], from: string, to: string): CarEvent[] {
  const weekly = WEEKLY.flatMap((w) => {
    const out: CarEvent[] = []
    for (let d = from; d <= to; d = shiftDays(d, 1)) if (parse(d).getDay() === w.day && d >= w.from && d <= w.until) out.push({ n: w.n, a: d, b: d, cc: w.cc, p: w.p, k: w.k, s: w.s })
    return out
  })
  return [...list.filter((e) => e.a <= to && e.b >= from), ...weekly].sort((x, y) => x.a.localeCompare(y.a) || x.n.localeCompare(y.n))
}
