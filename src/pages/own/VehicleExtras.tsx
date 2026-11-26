// Zusatzbereiche auf der Fahrzeugseite: Kauf-Checkliste, Wertverlauf, eigene Fotos, Erinnerungen (HU, Saison).
import { Bell, BookPlus, Camera, CalendarPlus, ClipboardCheck, LineChart, Plus, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { BRAND } from '../../config/brand.ts'
import { CHECK_SOURCES, checklistFor, type CheckGroup } from '../../data/checklist.ts'
import { weakSpotsFor, type WeakSpots } from '../../data/weakspots.ts'
import { loadCatalogue } from '../../components/ModelFinder.tsx'
import { SourceLink, fmtDate, fmtMoney, today, vehicleTitle } from '../../components/ui.tsx'
import { QuickInput } from '../../components/QuickInput.tsx'
import { parseNote } from '../../lib/quick.ts'
import { useT } from '../../i18n/i18n.ts'
import { toIcs } from '../../lib/maintenance.ts'
import { addPhotos, listPhotos, removePhoto, type Photo } from '../../lib/photos.ts'
import { addPassportEntry, downloadFile, updateVehicle } from '../../store/store.ts'
import type { Vehicle } from '../../store/schema.ts'

const YEAR = new Date().getFullYear()
const MONTHS_DE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export function VehicleExtras({ v }: { v: Vehicle }) {
  return (
    <div className="vx">
      <Checklist v={v} />
      <Values v={v} />
      <Photos v={v} />
      <Reminders v={v} />
    </div>
  )
}

// Schwachstellen des Katalogmodells (falls es dazu eine Kaufberatung gibt)
function useWeakSpots(modelId?: string) {
  const [w, setW] = useState<{ id: string; ws?: WeakSpots } | null>(null)
  useEffect(() => {
    if (!modelId) return
    let alive = true
    loadCatalogue().then((all) => {
      const m = all.find((x) => x.id === modelId)
      if (alive) setW({ id: modelId, ws: m ? weakSpotsFor(m) : weakSpotsFor({ id: modelId }) })
    })
    return () => {
      alive = false
    }
  }, [modelId])
  return w && w.id === modelId ? w.ws : undefined
}

function Checklist({ v }: { v: Vehicle }) {
  const { tx, L, locale } = useT()
  const ws = useWeakSpots(v.modelId)
  const groups: CheckGroup[] = [
    ...(ws ? [{ id: 'model', title: { de: `Typisch für ${ws.scope}`, en: `Typical of ${ws.scope}` }, items: ws.points.map((t, k) => ({ id: `w${k}`, t })) }] : []),
    ...checklistFor({ age: v.year ? YEAR - v.year : undefined, origin: v.market }),
  ]
  const done = new Set(v.checks ?? [])
  const total = groups.reduce((a, g) => a + g.items.length, 0)
  const n = groups.reduce((a, g) => a + g.items.filter((i) => done.has(i.id)).length, 0)
  const [note, setNote] = useState(v.checkNote ?? '')
  const [saved, setSaved] = useState(false)
  const toggle = (id: string) => {
    const next = new Set(done)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    updateVehicle(v.id, { checks: [...next] })
  }
  // Ergebnis der Besichtigung als Eintrag in den Passport übernehmen
  const toPassport = () => {
    const open = groups.flatMap((g) => g.items.filter((i) => !done.has(i.id)).map((i) => '– ' + L(i.t)))
    const notes = [note.trim() && tx('Notizen: ', 'Notes: ') + note.trim(), open.length ? tx('Nicht geprüft oder offen:', 'Not checked or open:') + '\n' + open.join('\n') : tx('Alle Punkte geprüft.', 'All points checked.')].filter(Boolean).join('\n\n')
    addPassportEntry({ vehicleId: v.id, date: today(), kind: 'note', title: tx(`Besichtigung: ${n} von ${total} Punkten geprüft`, `Inspection: ${n} of ${total} points checked`), notes, km: v.mileageKm })
    setSaved(true)
  }
  return (
    <div className="gcard vx-card">
      <h3>
        <ClipboardCheck size={18} /> {tx('Kauf-Checkliste', 'Buying checklist')} <span className="muted mono small">{n}/{total}</span>
      </h3>
      <div className="vx-bar" aria-hidden>
        <i style={{ width: (total ? (n / total) * 100 : 0) + '%' }} />
      </div>
      {groups.map((g) => (
        <div key={g.id} className="vx-group">
          <b>{L(g.title)}</b>
          {g.items.map((i) => (
            <label key={i.id} className="vx-check">
              <input type="checkbox" checked={done.has(i.id)} onChange={() => toggle(i.id)} />
              <span>{L(i.t)}</span>
            </label>
          ))}
        </div>
      ))}
      <label className="vx-note">
        <span className="f-label">{tx('Deine Notizen zur Besichtigung', 'Your inspection notes')}</span>
        <textarea
          className="input"
          rows={3}
          value={note}
          placeholder={tx('z. B. Rost hinten links, Kupplung greift spät', 'e.g. rust rear left, clutch bites late')}
          onChange={(e) => (setNote(e.target.value), setSaved(false))}
          onBlur={() => note !== (v.checkNote ?? '') && updateVehicle(v.id, { checkNote: note.slice(0, 2000) || undefined })}
        />
      </label>
      <div className="vx-actions">
        <button className="btn small" onClick={toPassport} disabled={!n && !note.trim()}>
          <BookPlus size={14} /> {saved ? tx('Im Passport gespeichert', 'Saved to passport') : tx('Ergebnis in den Passport', 'Save result to passport')}
        </button>
        <span className="muted small">{fmtDate(today(), locale)}</span>
      </div>
      <p className="muted small">
        {tx('Nach den Ratgebern von', 'Based on the guides by')}{' '}
        {[...(ws?.sources ?? []), ...CHECK_SOURCES].map((s, k) => (
          <span key={s.url}>
            {k > 0 && ' · '}
            <SourceLink url={s.url}>{s.label}</SourceLink>
          </span>
        ))}
      </p>
    </div>
  )
}

function Values({ v }: { v: Vehicle }) {
  const { tx, locale } = useT()
  const list = useMemo(() => [...(v.values ?? [])].sort((a, b) => a.date.localeCompare(b.date)), [v.values])
  const [q, setQ] = useState('')
  const n = parseNote(q, undefined, { bareAmount: true })
  const cur = list[list.length - 1]?.cur ?? v.landed?.cur ?? 'EUR'
  const add = () => {
    if (!n.amount) return
    updateVehicle(v.id, { values: [...list, { date: n.date ?? today(), amount: n.amount, cur: n.cur ?? cur, note: n.title || undefined }] })
    setQ('')
  }
  // Kleine Verlaufskurve (SVG, ohne Bibliothek)
  const W = 520
  const H = 140
  const pts = list.length > 1 ? list : []
  const min = Math.min(...pts.map((p) => p.amount))
  const max = Math.max(...pts.map((p) => p.amount))
  const t0 = pts.length ? +new Date(pts[0].date) : 0
  const t1 = pts.length ? +new Date(pts[pts.length - 1].date) : 1
  const xy = pts.map((p) => [12 + ((+new Date(p.date) - t0) / Math.max(1, t1 - t0)) * (W - 24), H - 14 - ((p.amount - min) / Math.max(1, max - min)) * (H - 28)])
  const first = list[0]
  const last = list[list.length - 1]
  const delta = first && last && list.length > 1 ? ((last.amount - first.amount) / first.amount) * 100 : null
  return (
    <div className="gcard vx-card">
      <h3>
        <LineChart size={18} /> {tx('Wertverlauf', 'Value history')}
      </h3>
      <p className="muted small">{tx('Schreib den Wert hin, Datum und Anlass nur wenn du willst. Daraus entsteht deine eigene Wertkurve.', 'Just write the value; add date and reason if you like. They form your own value curve.')}</p>
      {xy.length > 1 && (
        <svg className="vx-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={tx('Wertverlauf', 'Value history')}>
          <polyline points={xy.map((p) => p.join(',')).join(' ')} fill="none" stroke="var(--petrol)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
          {xy.map((p, k) => (
            <circle key={k} cx={p[0]} cy={p[1]} r="4.5" fill="var(--vermilion)" />
          ))}
        </svg>
      )}
      {delta !== null && (
        <p className="mono">
          {fmtMoney(last!.amount, cur, locale)} · {delta >= 0 ? '+' : ''}
          {delta.toLocaleString(locale, { maximumFractionDigits: 1 })} % {tx('seit', 'since')} {fmtDate(first!.date, locale)}
        </p>
      )}
      <ul className="vx-list">
        {list.map((p, k) => (
          <li key={k}>
            <span className="mono">{fmtDate(p.date, locale)}</span>
            <b className="mono">{fmtMoney(p.amount, p.cur, locale)}</b>
            <span className="muted small">{p.note}</span>
            <button className="icon-btn" aria-label={tx('Löschen', 'Delete')} onClick={() => updateVehicle(v.id, { values: list.filter((_, j) => j !== k) })}>
              <Trash2 size={14} />
            </button>
          </li>
        ))}
      </ul>
      <QuickInput value={q} onChange={setQ} onSubmit={add} label={tx('Wert', 'Value')} placeholder={tx('z. B. 48.000 € Gutachten', 'e.g. 48,000 € appraisal')} button={tx('Eintragen', 'Add')}>
        {q.trim() && (
          <p className="small muted">
            {n.amount ? [fmtMoney(n.amount, n.cur ?? cur, locale), fmtDate(n.date ?? today(), locale), n.title].filter(Boolean).join(' · ') : tx('Nenn einen Betrag, z. B. 48.000 €.', 'Enter an amount, e.g. 48,000 €.')}
          </p>
        )}
      </QuickInput>
    </div>
  )
}

function Photos({ v }: { v: Vehicle }) {
  const { tx } = useT()
  const [photos, setPhotos] = useState<Photo[]>([])
  const [urls, setUrls] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const reload = () => listPhotos(v.id).then(setPhotos)
  useEffect(() => {
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v.id])
  useEffect(() => {
    const u = photos.map((p) => URL.createObjectURL(p.blob))
    setUrls(u)
    return () => u.forEach((x) => URL.revokeObjectURL(x))
  }, [photos])
  return (
    <div className="gcard vx-card">
      <h3>
        <Camera size={18} /> {tx('Deine Fotos', 'Your photos')}
      </h3>
      <p className="muted small">{tx('Bleiben nur in diesem Browser gespeichert, werden nirgends hochgeladen und sind nicht in der JSON-Sicherung enthalten.', 'Stored only in this browser, never uploaded and not part of the JSON backup.')}</p>
      <div className="vx-photos">
        {photos.map((p, k) => (
          <figure key={p.id}>
            <img src={urls[k]} alt={`${vehicleTitle(v)} ${k + 1}`} loading="lazy" />
            <button
              className="icon-btn"
              aria-label={tx('Foto löschen', 'Delete photo')}
              onClick={async () => {
                await removePhoto(p.id)
                await reload()
                updateVehicle(v.id, { photoCount: Math.max(0, photos.length - 1) })
              }}
            >
              <Trash2 size={14} />
            </button>
          </figure>
        ))}
      </div>
      {err && <p className="muted small" role="alert">{tx('Mindestens ein Foto ließ sich nicht speichern (Format, Größe oder Speicher voll).', 'At least one photo could not be saved (format, size or storage full).')}</p>}
      <button className="btn small" disabled={busy} onClick={() => input.current?.click()}>
        <Plus size={14} /> {busy ? tx('Wird gespeichert …', 'Saving …') : tx('Fotos hinzufügen', 'Add photos')}
      </button>
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={async (e) => {
          // Erst kopieren: das Zurücksetzen des Feldes leert die lebende Dateiliste
          const files = Array.from(e.target.files ?? [])
          e.target.value = ''
          if (!files.length) return
          setErr(false)
          setBusy(true)
          try {
            if ((await addPhotos(v.id, files)) < files.length) setErr(true)
            const now = await listPhotos(v.id)
            setPhotos(now)
            updateVehicle(v.id, { photoCount: now.length })
          } catch {
            setErr(true)
          } finally {
            setBusy(false)
          }
        }}
      />
    </div>
  )
}

function Reminders({ v }: { v: Vehicle }) {
  const { tx, lang, locale } = useT()
  const months = lang === 'en' ? MONTHS_EN : MONTHS_DE
  const title = vehicleTitle(v)
  const events = () => {
    const out: { title: string; date: string; description?: string }[] = []
    if (v.huDue) {
      const [y, m] = v.huDue.split('-').map(Number)
      const pre = new Date(Date.UTC(y, m - 2, 1)).toISOString().slice(0, 10)
      out.push({ title: tx(`HU in einem Monat fällig · ${title}`, `Inspection due in one month · ${title}`), date: pre })
      out.push({ title: tx(`HU fällig · ${title}`, `Inspection due · ${title}`), date: `${v.huDue}-01` })
    }
    if (v.season) {
      for (let y = YEAR; y <= YEAR + 2; y++) {
        out.push({ title: tx(`Saisonkennzeichen beginnt · ${title}`, `Seasonal plate starts · ${title}`), date: `${y}-${String(v.season.from).padStart(2, '0')}-01`, description: tx('Auto aus dem Winterlager holen, Batterie, Reifendruck und Flüssigkeiten prüfen.', 'Take the car out of storage; check battery, tyre pressure and fluids.') })
        out.push({ title: tx(`Saisonkennzeichen endet · ${title}`, `Seasonal plate ends · ${title}`), date: `${y}-${String(v.season.to).padStart(2, '0')}-${new Date(Date.UTC(y, v.season.to, 0)).getUTCDate()}`, description: tx('Winterlager vorbereiten.', 'Prepare winter storage.') })
      }
    }
    return out.filter((e) => e.date >= today())
  }
  const ev = events()
  return (
    <div className="gcard vx-card">
      <h3>
        <Bell size={18} /> {tx('Erinnerungen', 'Reminders')}
      </h3>
      <div className="fields two">
        <label className="field">
          <span className="f-label">{tx('Nächste HU', 'Next inspection')}</span>
          <input className="input" type="month" value={v.huDue ?? ''} onChange={(e) => updateVehicle(v.id, { huDue: e.target.value || undefined })} />
        </label>
        <label className="field">
          <span className="f-label">{tx('Saisonkennzeichen', 'Seasonal plate')}</span>
          <span className="vx-season">
            <select className="input" value={v.season?.from ?? ''} onChange={(e) => updateVehicle(v.id, { season: e.target.value ? { from: Number(e.target.value), to: v.season?.to ?? 10 } : undefined })} aria-label={tx('von', 'from')}>
              <option value="">{tx('keins', 'none')}</option>
              {months.map((m, k) => (
                <option key={m} value={k + 1}>
                  {m}
                </option>
              ))}
            </select>
            {v.season && (
              <select className="input" value={v.season.to} onChange={(e) => updateVehicle(v.id, { season: { from: v.season!.from, to: Number(e.target.value) } })} aria-label={tx('bis', 'to')}>
                {months.map((m, k) => (
                  <option key={m} value={k + 1}>
                    {m}
                  </option>
                ))}
              </select>
            )}
          </span>
        </label>
      </div>
      {ev.length > 0 && (
        <ul className="vx-list">
          {ev.slice(0, 5).map((e) => (
            <li key={e.date + e.title}>
              <span className="mono">{fmtDate(e.date, locale)}</span>
              <span>{e.title.split(' · ')[0]}</span>
            </li>
          ))}
        </ul>
      )}
      <button className="btn small" disabled={!ev.length} onClick={() => downloadFile(`${BRAND.ascii.toLowerCase()}-${(v.make + '-' + v.model).replace(/[^\w-]+/g, '_')}-termine.ics`, toIcs(ev, `-//${BRAND.ascii}//Erinnerungen//DE`), 'text/calendar')}>
        <CalendarPlus size={14} /> {tx('In den Kalender (.ics)', 'Add to calendar (.ics)')}
      </button>
      <p className="muted small">{tx('Wartungstermine planst du im Wartungsplaner; dort gibt es ebenfalls einen Kalender-Export.', 'Plan service dates in the maintenance planner, which also exports to your calendar.')}</p>
    </div>
  )
}
