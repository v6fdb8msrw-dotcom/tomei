// Fahrzeugmappe als PDF: Deckblatt, Daten, Fotos, Historie, Wartung, Umbauten, Wertverlauf.
// Entsteht vollständig im Browser (pdf-lib, MIT); nichts wird hochgeladen.
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFImage, type PDFPage } from 'pdf-lib'
import { BRAND } from '../config/brand.ts'
import type { MaintenanceItem, PassportEntry, Vehicle } from '../store/schema.ts'
import { listPhotos } from './photos.ts'

type Tx = (de: string, en: string) => string
export type DossierInput = {
  v: Vehicle
  passport: PassportEntry[]
  maintenance: MaintenanceItem[]
  kinds: Record<string, string>
  status: string
  origin?: string
  tx: Tx
  locale: string
  /** Bild fürs Deckblatt, falls es keine eigenen Fotos gibt */
  cover?: string
  /** Fotonachweis zum Deckblatt */
  coverCredit?: string
}

const W = 595.28
const H = 841.89
const M = 52
const INK = rgb(0.12, 0.14, 0.14)
const MUTED = rgb(0.42, 0.44, 0.43)
const RED = rgb(0.84, 0.29, 0.24)
const LINE = rgb(0.84, 0.83, 0.8)

/** Die eingebauten PDF-Schriften kennen nur westeuropäische Zeichen */
export function winAnsi(s: string): string {
  return s
    .normalize('NFC')
    .replace(/[→⟶]/g, '->')
    .replace(/≈/g, 'ca.')
    .replace(/[   ]/g, ' ')
    .replace(/−/g, '-')
    .replace(/[\t\r\n]+/g, ' ')
    .replace(/[^\x20-\x7e¡-ÿ€–—‘’‚“”„•…ŒœŠšŸŽž]/g, (c) => {
      const b = c.normalize('NFD').replace(/[̀-ͯ]/g, '')
      return /^[\x20-\x7e]+$/.test(b) ? b : '?'
    })
}

async function toJpeg(src: Blob | string, max = 1400): Promise<ArrayBuffer> {
  const blob = typeof src === 'string' ? await (await fetch(src)).blob() : src
  const bmp = await createImageBitmap(blob)
  const k = Math.min(1, max / Math.max(bmp.width, bmp.height))
  const cv = document.createElement('canvas')
  cv.width = Math.round(bmp.width * k)
  cv.height = Math.round(bmp.height * k)
  cv.getContext('2d')!.drawImage(bmp, 0, 0, cv.width, cv.height)
  const out = await new Promise<Blob>((res, rej) => cv.toBlob((b) => (b ? res(b) : rej(new Error('JPEG'))), 'image/jpeg', 0.84))
  return out.arrayBuffer()
}

export async function buildDossier(i: DossierInput): Promise<{ blob: Blob; photos: number; skipped: number }> {
  const { v, tx, locale } = i
  const pdf = await PDFDocument.create()
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const title = [v.make, v.model, v.variant].filter(Boolean).join(' ')
  pdf.setTitle(winAnsi(title))
  pdf.setCreator(BRAND.ascii)
  const date = (s: string) => {
    const d = new Date(s.length === 7 ? s + '-01' : s)
    return Number.isNaN(+d) ? s : d.toLocaleDateString(locale, s.length === 7 ? { month: 'long', year: 'numeric' } : undefined)
  }
  const money = (a: number, cur: string) => {
    try {
      return a.toLocaleString(locale, { style: 'currency', currency: cur, maximumFractionDigits: 0 })
    } catch {
      return `${a} ${cur}`
    }
  }

  let page: PDFPage = pdf.addPage([W, H])
  let y = H - M
  const text = (s: string, x: number, size: number, f: PDFFont = font, color = INK) => page.drawText(winAnsi(s), { x, y, size, font: f, color })
  const wrap = (s: string, f: PDFFont, size: number, width: number): string[] => {
    const out: string[] = []
    let cur = ''
    for (let w of winAnsi(s).split(' ')) {
      // überlange Wörter teilen
      while (f.widthOfTextAtSize(w, size) > width) {
        let n = w.length
        while (n > 1 && f.widthOfTextAtSize(w.slice(0, n), size) > width) n--
        if (cur) out.push(cur)
        cur = ''
        out.push(w.slice(0, n))
        w = w.slice(n)
      }
      const t = cur ? cur + ' ' + w : w
      if (f.widthOfTextAtSize(t, size) > width) {
        out.push(cur)
        cur = w
      } else cur = t
    }
    if (cur) out.push(cur)
    return out
  }
  const need = (h: number) => {
    if (y - h < M + 24) {
      page = pdf.addPage([W, H])
      y = H - M
    }
  }
  const para = (s: string, x: number, size: number, width: number, f: PDFFont = font, color = INK, lead = 1.4) => {
    for (const l of wrap(s, f, size, width)) {
      need(size * lead)
      page.drawText(l, { x, y: y - size, size, font: f, color })
      y -= size * lead
    }
  }
  const heading = (s: string) => {
    need(90)
    y -= 26
    page.drawRectangle({ x: M, y: y - 2, width: 26, height: 3, color: RED })
    y -= 24
    text(s, M, 18, bold)
    y -= 16
  }
  const rule = () => page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 0.6, color: LINE })
  const row = (k: string, val: string) => {
    const lines = wrap(val, bold, 10.5, W - 2 * M - 150)
    need(lines.length * 14 + 10)
    rule()
    y -= 16
    text(k, M, 10.5, font, MUTED)
    lines.forEach((l, n) => {
      if (n) y -= 14
      page.drawText(l, { x: M + 150, y, size: 10.5, font: bold, color: INK })
    })
    y -= 8
  }

  // Fotos laden
  const own = await listPhotos(v.id)
  const images: PDFImage[] = []
  let skipped = 0
  for (const p of own.slice(0, 13)) {
    try {
      images.push(await pdf.embedJpg(await toJpeg(p.blob)))
    } catch {
      skipped++
    }
  }
  skipped += Math.max(0, own.length - 13)
  let coverImg = images[0]
  let credit = ''
  if (!coverImg && i.cover) {
    try {
      coverImg = await pdf.embedJpg(await toJpeg(i.cover))
      credit = i.coverCredit ?? ''
    } catch {
      /* ohne Deckbild weiter */
    }
  }

  // Deckblatt
  if (coverImg) {
    const bw = W
    const bh = Math.min(H * 0.52, (coverImg.height / coverImg.width) * bw)
    // ganze Breite, nichts verzerren: bei Hochformat einpassen
    const k = Math.min(bw / coverImg.width, bh / coverImg.height)
    page.drawRectangle({ x: 0, y: H - bh, width: W, height: bh, color: rgb(0.14, 0.16, 0.16) })
    page.drawImage(coverImg, { x: (W - coverImg.width * k) / 2, y: H - bh + (bh - coverImg.height * k) / 2, width: coverImg.width * k, height: coverImg.height * k })
    y = H - bh
    if (credit) {
      y -= 12
      text(credit, M, 7, font, MUTED)
    }
  }
  y -= 46
  text(tx('FAHRZEUGMAPPE', 'VEHICLE DOSSIER'), M, 9.5, bold, RED)
  y -= 8
  para(title, M, 34, W - 2 * M, bold, INK, 1.12)
  y -= 8
  const sub = [v.year, v.chassis, v.mileageKm !== undefined ? `${v.mileageKm.toLocaleString(locale)} km` : ''].filter(Boolean).join('  ·  ')
  if (sub) para(sub, M, 13, W - 2 * M, font, MUTED)

  // Daten
  heading(tx('Daten', 'Details'))
  row('Status', i.status)
  if (i.origin) row(tx('Herkunft', 'Origin'), i.origin)
  if (v.price) row(tx('Kaufpreis', 'Purchase price'), money(v.price.amount, v.price.cur))
  if (v.landed) row(tx('Importkosten gesamt', 'Landed cost'), money(v.landed.amount, v.landed.cur))
  const values = [...(v.values ?? [])].sort((a, b) => a.date.localeCompare(b.date))
  if (values.length) row(tx('Letzte Wertangabe', 'Latest value entry'), `${money(values[values.length - 1].amount, values[values.length - 1].cur)} (${date(values[values.length - 1].date)})`)
  if (v.huDue) row(tx('Nächste Hauptuntersuchung', 'Next inspection'), date(v.huDue))
  if (v.season) row(tx('Saisonkennzeichen', 'Seasonal plate'), `${String(v.season.from).padStart(2, '0')}-${String(v.season.to).padStart(2, '0')}`)
  row(tx('Einträge in der Historie', 'History entries'), String(i.passport.length))
  if (v.notes) {
    y -= 8
    para(v.notes, M, 10.5, W - 2 * M)
  }

  // Historie
  if (i.passport.length) {
    heading(tx('Historie', 'History'))
    for (const e of [...i.passport].sort((a, b) => a.date.localeCompare(b.date))) {
      need(46)
      rule()
      y -= 16
      text(date(e.date), M, 10, bold)
      text(i.kinds[e.kind] ?? e.kind, M + 78, 10, font, RED)
      const right = [e.km ? `${e.km.toLocaleString(locale)} km` : '', e.cost ? money(e.cost.amount, e.cost.cur) : ''].filter(Boolean).join('  ·  ')
      if (right) text(right, W - M - font.widthOfTextAtSize(winAnsi(right), 10), 10, font, MUTED)
      y -= 4
      para(e.title, M + 78, 11, W - 2 * M - 78, bold)
      if (e.notes) para(e.notes, M + 78, 9.5, W - 2 * M - 78, font, MUTED)
      y -= 4
    }
  }

  // Wartung
  if (i.maintenance.length) {
    heading(tx('Wartungsplan', 'Maintenance plan'))
    for (const m of i.maintenance) {
      const last = [m.lastDate && date(m.lastDate), m.lastKm && `${m.lastKm.toLocaleString(locale)} km`].filter(Boolean).join(', ')
      const due = [m.dueDate && date(m.dueDate), m.dueKm && `${m.dueKm.toLocaleString(locale)} km`].filter(Boolean).join(', ')
      row(m.title, [last && `${tx('zuletzt', 'last')} ${last}`, due && `${tx('fällig', 'due')} ${due}`].filter(Boolean).join('  ·  ') || '-')
      for (const h of m.history) para(`${date(h.date)}${h.km ? `, ${h.km.toLocaleString(locale)} km` : ''}${h.notes ? `: ${h.notes}` : ''}`, M + 150, 9, W - 2 * M - 150, font, MUTED)
    }
  }

  // Umbauten
  if (v.mods.length) {
    heading(tx('Umbauten', 'Modifications'))
    for (const m of v.mods) row(m.title, [m.category, m.date && date(m.date), m.cost && money(m.cost.amount, m.cost.cur), m.notes].filter(Boolean).join('  ·  ') || '-')
  }

  // Wertverlauf
  if (values.length > 1) {
    heading(tx('Wertverlauf (eigene Angaben)', 'Value history (own entries)'))
    need(150)
    const x0 = M
    const w = W - 2 * M
    const h = 110
    const t0 = +new Date(values[0].date)
    const t1 = +new Date(values[values.length - 1].date)
    const lo = Math.min(...values.map((p) => p.amount))
    const hi = Math.max(...values.map((p) => p.amount))
    const pts = values.map((p) => ({ x: x0 + ((+new Date(p.date) - t0) / Math.max(1, t1 - t0)) * w, y: y - h + ((p.amount - lo) / Math.max(1, hi - lo)) * (h - 14) }))
    for (let k = 1; k < pts.length; k++) page.drawLine({ start: pts[k - 1], end: pts[k], thickness: 2, color: rgb(0.17, 0.29, 0.27) })
    for (const p of pts) page.drawCircle({ x: p.x, y: p.y, size: 3.4, color: RED })
    y -= h + 14
    for (const p of values) row(date(p.date), `${money(p.amount, p.cur)}${p.note ? `  ·  ${p.note}` : ''}`)
  }

  // Fotoseiten, zwei je Seite
  const rest = images.slice(1)
  for (let k = 0; k < rest.length; k += 2) {
    page = pdf.addPage([W, H])
    const slot = (H - 2 * M - 20 - 24) / 2
    rest.slice(k, k + 2).forEach((im, n) => {
      const s = Math.min((W - 2 * M) / im.width, slot / im.height)
      page.drawImage(im, { x: (W - im.width * s) / 2, y: H - M - n * (slot + 20) - slot + (slot - im.height * s) / 2, width: im.width * s, height: im.height * s })
    })
  }

  // Fußzeilen
  const pages = pdf.getPages()
  const foot = winAnsi(`${title}  ·  ${tx('Erstellt am', 'Created on')} ${new Date().toLocaleDateString(locale)}  ·  ${tx('Selbst geführte Aufzeichnung, kein amtliches Dokument', 'Self-kept record, not an official document')}`)
  pages.forEach((p, n) => {
    const num = `${n + 1} / ${pages.length}`
    const room = W - 2 * M - 50
    let f = foot
    while (font.widthOfTextAtSize(f, 7.5) > room) f = f.slice(0, -1)
    p.drawText(f, { x: M, y: 30, size: 7.5, font, color: MUTED })
    p.drawText(num, { x: W - M - font.widthOfTextAtSize(num, 7.5), y: 30, size: 7.5, font, color: MUTED })
  })
  const bytes = await pdf.save()
  return { blob: new Blob([bytes as BlobPart], { type: 'application/pdf' }), photos: images.length, skipped }
}
