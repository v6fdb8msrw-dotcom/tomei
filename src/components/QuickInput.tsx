// Ein Feld für alles: Freitext mit Vorschlägen, Eingabe mit Enter. Wird für Garage, Rechner und Roadtrip genutzt.
import { ArrowRight, LoaderCircle } from 'lucide-react'
import { useId, useState, type ReactNode } from 'react'

export type Suggestion = { id: string; label: string; sub?: string; icon?: ReactNode; /** Text, der bei Auswahl im Feld steht */ text?: string }

export function QuickInput({ value, onChange, onSubmit, placeholder, button, suggestions, onPick, examples, busy, label, children }: { value: string; onChange: (v: string) => void; onSubmit: () => void; placeholder: string; button: string; suggestions?: Suggestion[]; onPick?: (s: Suggestion) => void; examples?: string[]; busy?: boolean; label: string; children?: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [hi, setHi] = useState(-1)
  const id = useId()
  const list = open ? (suggestions ?? []) : []
  const pick = (s: Suggestion) => {
    setOpen(false)
    setHi(-1)
    onPick?.(s)
  }
  return (
    <form
      className="quick"
      onSubmit={(e) => {
        e.preventDefault()
        if (hi >= 0 && list[hi]) return pick(list[hi])
        setOpen(false)
        if (value.trim() && !busy) onSubmit()
      }}
    >
      <div className="quick-box">
        <input
          value={value}
          onChange={(e) => {
            onChange(e.target.value.slice(0, 160))
            setOpen(true)
            setHi(-1)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setOpen(false)
            if (!list.length) return
            if (e.key === 'ArrowDown') (e.preventDefault(), setHi((hi + 1) % list.length))
            if (e.key === 'ArrowUp') (e.preventDefault(), setHi(hi <= 0 ? list.length - 1 : hi - 1))
          }}
          placeholder={placeholder}
          aria-label={label}
          role="combobox"
          aria-expanded={list.length > 0}
          aria-controls={id}
          aria-activedescendant={hi >= 0 ? id + hi : undefined}
          autoComplete="off"
        />
        <button className="btn primary" disabled={!value.trim() || busy}>
          {busy ? <LoaderCircle size={17} className="spin" /> : <ArrowRight size={17} />} <span>{button}</span>
        </button>
        {list.length > 0 && (
          <ul id={id} role="listbox" className="quick-list">
            {list.map((s, i) => (
              <li key={s.id} id={id + i} role="option" aria-selected={i === hi} className={i === hi ? 'on' : ''} onMouseEnter={() => setHi(i)} onMouseDown={(e) => (e.preventDefault(), pick(s))}>
                {s.icon}
                <b>{s.label}</b>
                {s.sub && <small>{s.sub}</small>}
              </li>
            ))}
          </ul>
        )}
      </div>
      {children}
      {examples && (
        <div className="quick-ex">
          {examples.map((x) => (
            <button key={x} type="button" className="chip" onClick={() => onChange(x)}>
              {x}
            </button>
          ))}
        </div>
      )}
    </form>
  )
}

/** Eingeklappte Feinheiten: für alle, die doch selbst Hand anlegen wollen */
export function Details({ title, children, open }: { title: string; children: ReactNode; open?: boolean }) {
  return (
    <details className="more" open={open}>
      <summary>{title}</summary>
      <div className="more-in">{children}</div>
    </details>
  )
}
