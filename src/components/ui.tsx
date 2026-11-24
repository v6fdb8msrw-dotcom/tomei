// Gemeinsame Bausteine der Version 2.0: Seitenköpfe, Unternavigation, Hinweise, Leer- und Fehlerzustände.
import { AlertTriangle, ArrowLeft, ArrowRight, ArrowUpRight, Info, RefreshCw } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { Component, useEffect, useRef, useState, type ErrorInfo, type ReactNode } from 'react'
import { translate, useT, type TKey } from '../i18n/i18n.ts'
import { href } from '../lib/router.ts'
import { getState } from '../store/store.ts'
import type { Vehicle, VehicleStatus } from '../store/schema.ts'

export const EASE = [0.22, 1, 0.36, 1] as const
export const img = (name: string) => `${import.meta.env.BASE_URL}images/${name}.jpg`

// Standardbilder für Seitenköpfe ohne eigenes Bild (echte, lizenzierte Fotos)
const HEAD_DEFAULTS = ['roads/shimanami', 'roads/atlantic', 'roads/glockner', 'roads/izu', 'fuji-lakes']

/** Kopf einer Unterseite: Vollbild-Foto (oder Slideshow) mit großer Aussage darüber */
export function PageHead({ eyebrow, title, sub, back, children, image, images, vt }: { eyebrow: string; title: ReactNode; sub?: ReactNode; back?: { to: string; label: string }; children?: ReactNode; image?: string; images?: string[]; vt?: string }) {
  const list = images?.length ? images : [image ?? img(HEAD_DEFAULTS[[...eyebrow].reduce((a, c) => a + c.charCodeAt(0), 0) % HEAD_DEFAULTS.length])]
  const [i, setI] = useState(0)
  useEffect(() => {
    if (list.length < 2 || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const tm = setInterval(() => setI((x) => (x + 1) % list.length), 5500)
    return () => clearInterval(tm)
  }, [list.length])
  return (
    <header className="phead with-img">
      <div className="phead-img" style={vt ? { viewTransitionName: vt } : undefined}>
        <AnimatePresence initial={false}>
          <motion.img key={list[i]} src={list[i]} alt="" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.2 }} />
        </AnimatePresence>
      </div>
      <div className="phead-text">
        {back && (
          <a className="phead-back" href={href(back.to)}>
            <ArrowLeft size={15} /> {back.label}
          </a>
        )}
        <motion.p className="eyebrow" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          {eyebrow}
        </motion.p>
        <motion.h1 initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.05, ease: EASE }}>
          {title}
        </motion.h1>
        {sub && (
          <motion.p className="phead-sub" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.15 }}>
            {sub}
          </motion.p>
        )}
        {children}
        {list.length > 1 && (
          <div className="phead-dots" aria-hidden>
            {list.map((src, k) => (
              <i key={src} className={k === i ? 'on' : ''} />
            ))}
          </div>
        )}
      </div>
    </header>
  )
}

export type SubItem = { to: string; label: string }
/** Unternavigation einer Welt (Pillen, auf dem Handy waagerecht scrollbar) */
export function SubNav({ items, active }: { items: SubItem[]; active: string }) {
  const ref = useRef<HTMLDivElement>(null)
  // Auf schmalen Bildschirmen den aktiven Bereich sichtbar halten
  useEffect(() => {
    const el = ref.current?.querySelector<HTMLElement>('a.on')
    const box = ref.current
    if (el && box) box.scrollLeft = Math.max(0, Math.min(box.scrollWidth - box.clientWidth, el.offsetLeft - box.offsetLeft - box.clientWidth / 2 + el.offsetWidth / 2))
  }, [active])
  return (
    <nav className="subnav" aria-label="Bereiche">
      <div className="subnav-in" ref={ref}>
        {items.map((i) => (
          <a key={i.to} href={href(i.to)} className={active === i.to ? 'on' : ''} aria-current={active === i.to ? 'page' : undefined}>
            {i.label}
          </a>
        ))}
      </div>
    </nav>
  )
}

/** Kennzeichnung von Daten: Demo, Schätzwert, Annahme, Quelle */
export function Badge({ kind, children, title }: { kind: 'demo' | 'estimate' | 'assumption' | 'source' | 'ok' | 'warn'; children?: ReactNode; title?: string }) {
  const { t } = useT()
  const label = children ?? (kind === 'demo' ? t('common.demo') : kind === 'estimate' ? t('common.estimate') : kind === 'assumption' ? t('common.assumption') : t('common.source'))
  return (
    <span className={'badge b-' + kind} title={title}>
      {label}
    </span>
  )
}

export function SourceLink({ url, children }: { url: string; children?: ReactNode }) {
  let host = url
  try {
    host = new URL(url).hostname.replace(/^www\./, '')
  } catch {
    /* ungültige Adresse: als Text zeigen */
  }
  return (
    <a className="srclink" href={url} target="_blank" rel="noopener noreferrer">
      {children ?? host} <ArrowUpRight size={12} />
    </a>
  )
}

export function Note({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'warn' }) {
  return (
    <div className={'note n-' + tone} role={tone === 'warn' ? 'alert' : undefined}>
      {tone === 'warn' ? <AlertTriangle size={16} /> : <Info size={16} />}
      <div>{children}</div>
    </div>
  )
}

/** Hochwertiger Leerzustand mit echtem Foto und klarer nächster Aktion */
export function EmptyState({ title, text, image, actions }: { title: ReactNode; text?: ReactNode; image?: string; actions?: { to: string; label: string; primary?: boolean }[] }) {
  return (
    <motion.div className="empty" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }}>
      {image && (
        <div className="empty-img">
          <img src={image} alt="" loading="lazy" />
        </div>
      )}
      <div className="empty-body">
        <h3>{title}</h3>
        {text && <p>{text}</p>}
        {actions && (
          <div className="row gap">
            {actions.map((a) => (
              <a key={a.to} className={'btn' + (a.primary ? ' primary' : '')} href={href(a.to)}>
                {a.label} {a.primary && <ArrowRight size={16} />}
              </a>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}

/** Fängt Laufzeitfehler einer Seite ab, statt die ganze App weiß werden zu lassen */
export class ErrorBoundary extends Component<{ children: ReactNode; resetKey?: string }, { error: Error | null }> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) {
    return { error }
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Seitenfehler', error, info.componentStack)
  }
  componentDidUpdate(prev: { resetKey?: string }) {
    if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null })
  }
  render() {
    if (!this.state.error) return this.props.children
    const lang = getState().settings.lang
    const tr = (k: TKey) => translate(lang, k)
    return (
      <section className="state-page">
        <div className="state-img">
          <img src={img('roads/trollstigen')} alt="" />
        </div>
        <div className="state-body">
          <p className="eyebrow">{lang === 'en' ? 'Error' : 'Fehler'}</p>
          <h1>{tr('error.title')}</h1>
          <p>{tr('error.text')}</p>
          <code className="state-code">{this.state.error.message}</code>
          <div className="row gap">
            <button className="btn primary" onClick={() => location.reload()}>
              <RefreshCw size={16} /> {tr('error.reload')}
            </button>
            <a className="btn" href="#/">
              {tr('nf.home')}
            </a>
          </div>
        </div>
      </section>
    )
  }
}

export function NotFound() {
  const { t, tx } = useT()
  return (
    <section className="state-page">
      <div className="state-img">
        <img src={img('roads/furka')} alt={tx('Kehren am Furkapass', 'Hairpins on the Furka Pass')} />
      </div>
      <div className="state-body">
        <p className="eyebrow">404</p>
        <h1>{t('nf.title')}</h1>
        <p>{t('nf.text')}</p>
        <div className="row gap">
          <a className="btn primary" href="#/">
            {t('nf.home')} <ArrowRight size={16} />
          </a>
          <a className="btn" href="#/drive/roads">
            Roads
          </a>
          <a className="btn" href="#/own/garage">
            Garage
          </a>
        </div>
      </div>
    </section>
  )
}

export function StatusPill({ status }: { status: VehicleStatus }) {
  const { t } = useT()
  return <span className={'status s-' + status}>{t(('status.' + status) as TKey)}</span>
}

export const vehicleTitle = (v: Pick<Vehicle, 'make' | 'model' | 'variant' | 'year'>) => [v.year, v.make, v.model, v.variant].filter(Boolean).join(' ')

/** Auswahl eines Fahrzeugs aus der Garage */
export function VehicleSelect({ vehicles, value, onChange, allowNone, label }: { vehicles: Vehicle[]; value?: string; onChange: (id: string) => void; allowNone?: string; label?: string }) {
  const { tx } = useT()
  label ??= tx('Fahrzeug', 'Vehicle')
  return (
    <label className="field">
      <span className="f-label">{label}</span>
      <select className="input" value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
        {allowNone !== undefined && <option value="">{allowNone}</option>}
        {vehicles.map((v) => (
          <option key={v.id} value={v.id}>
            {vehicleTitle(v)}
          </option>
        ))}
      </select>
    </label>
  )
}

/** Einblenden beim Scrollen (respektiert reduzierte Bewegung über MotionConfig) */
export function Reveal({ children, delay = 0, className, y = 24 }: { children: ReactNode; delay?: number; className?: string; y?: number }) {
  return (
    <motion.div className={className} initial={{ opacity: 0, y }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.8, delay, ease: EASE }}>
      {children}
    </motion.div>
  )
}

export const fmtMoney = (v: number, cur: string, locale = 'de-DE') =>
  new Intl.NumberFormat(locale, { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(Number.isFinite(v) ? v : 0)
export const fmtDate = (iso: string, locale = 'de-DE') => {
  const d = new Date(iso.length === 10 ? iso + 'T12:00:00' : iso)
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })
}
export const today = () => new Date().toISOString().slice(0, 10)

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

