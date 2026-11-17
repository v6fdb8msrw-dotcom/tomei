// Service: Kaufen, verschiffen, zulassen als ein Paket. TŌMEI tritt als Vermittler auf (neutral, Partner folgt).
// Preisrahmen aus dem Import-Rechner (Deutschland), Anfrage als vorausgefüllte E-Mail oder zum Kopieren.
import { Anchor, Check, ClipboardCopy, FileSearch, Gavel, Mail, ShieldCheck, Ship, Truck, Wrench } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'
import { CONTACT_EMAIL, DEST, FX_FALLBACK, MARKETS } from '../data.ts'
import { Reveal, SectionHead } from '../components/motion.tsx'
import { CarStack } from '../components/depth.tsx'
import { landedCost, money } from '../lib/calc.ts'

const img = (name: string) => `${import.meta.env.BASE_URL}images/${name}.jpg`

const STEPS = [
  { icon: FileSearch, title: 'Finden', text: 'Wir suchen dein Auto in Japan, Korea und den anderen Märkten, auch auf den Händlerauktionen.' },
  { icon: ShieldCheck, title: 'Prüfen', text: 'Auktionsblatt übersetzt, Prüfnote erklärt, auf Wunsch Fotos und Check vor Ort.' },
  { icon: Gavel, title: 'Kaufen', text: 'Gebot bis zu deinem Limit oder Festpreis beim Händler. Du zahlst erst, wenn das Auto gesichert ist.' },
  { icon: Ship, title: 'Verschiffen', text: 'Export-Papiere, RoRo oder Container bis Bremerhaven, versichert.' },
  { icon: Anchor, title: 'Verzollen', text: 'Zoll und Einfuhrumsatzsteuer, Verzollung im Hafen.' },
  { icon: Wrench, title: 'Zulassen', text: 'TÜV-Vollabnahme (§21), Umbauten falls nötig, Zulassung.' },
  { icon: Truck, title: 'Liefern', text: 'Auf Wunsch bis vor deine Tür.' },
]

const SERVICES = ['Suche & Auswahl', 'Auktionsblatt prüfen', 'Bieten / Kauf', 'Verschiffung', 'Verzollung', 'TÜV & Zulassung', 'Lieferung vor die Tür']
const DRAFT = 'tomei.service.draft'

type Draft = { name: string; contact: string; car: string; year: string; budget: string; markets: string[]; services: string[]; note: string }
const EMPTY: Draft = { name: '', contact: '', car: '', year: '', budget: '', markets: ['jp'], services: [...SERVICES], note: '' }

export function Service() {
  const [price, setPrice] = useState(20000)
  const [ship, setShip] = useState<'roro' | 'container'>('roro')
  const [d, setD] = useState<Draft>(() => {
    try {
      return { ...EMPTY, ...JSON.parse(localStorage.getItem(DRAFT) || '{}') }
    } catch {
      return EMPTY
    }
  })
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    try {
      localStorage.setItem(DRAFT, JSON.stringify(d))
    } catch {}
  }, [d])

  // Preisrahmen für Deutschland: gleiche Rechnung wie im Import-Rechner
  const de = DEST.DE
  const cost = useMemo(
    () =>
      landedCost({
        vehicle: price,
        japanFees: Math.round(180000 * FX_FALLBACK.EUR),
        freight: de.freight[ship],
        insureOn: true,
        insurePct: 1.5,
        dutyPct: de.duty,
        vatPct: de.vat,
        fees: de.fees,
      }),
    [price, ship, de],
  )

  const toggle = (k: 'markets' | 'services', v: string) => setD((x) => ({ ...x, [k]: x[k].includes(v) ? x[k].filter((y) => y !== v) : [...x[k], v] }))
  const text = [
    'Anfrage TŌMEI Service',
    '',
    `Name: ${d.name}`,
    `Kontakt: ${d.contact}`,
    `Wunschauto: ${d.car}${d.year ? `, ab Baujahr ${d.year}` : ''}`,
    `Budget (bis vor die Tür): ${d.budget ? d.budget + ' €' : 'offen'}`,
    `Märkte: ${d.markets.map((id) => MARKETS.find((m) => m.id === id)?.country).filter(Boolean).join(', ')}`,
    `Leistungen: ${d.services.join(', ')}`,
    '',
    d.note,
  ].join('\n')
  const ready = d.name.trim() && d.contact.trim() && d.car.trim()
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {}
  }

  return (
    <>
      <section className="section mk-hero">
        <div className="mk-hero-text">
          <Reveal>
            <p className="eyebrow">TŌMEI Service</p>
            <h1 className="display">
              Kaufen. Verschiffen.
              <br />
              <em>Zulassen.</em>
            </h1>
            <p className="lead">Ein Ansprechpartner von der Auktion in Asien bis zur Zulassung in Deutschland. Du sagst, was du suchst, wir kümmern uns um den Rest.</p>
            <a className="btn red" href="#/service/anfrage">
              Anfrage starten
            </a>
          </Reveal>
        </div>
        <CarStack
          cards={[
            { src: img('import-ship'), label: 'Verschiffung', sub: 'RoRo · Container' },
            { src: img('import-port'), label: 'Bremerhaven', sub: 'Zoll · EUSt' },
            { src: img('cars/r34'), label: 'Dein Auto', sub: 'TÜV · Zulassung' },
          ]}
        />
      </section>

      <section className="section tight">
        <SectionHead eyebrow="Ablauf" title={<>Sieben Schritte, <em>ein Paket.</em></>} />
        <div className="sv-steps">
          {STEPS.map((s, k) => (
            <Reveal key={s.title} delay={k * 0.06}>
              <div className="gcard sv-step">
                <span className="sv-num">{String(k + 1).padStart(2, '0')}</span>
                <s.icon size={22} className="red" />
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="section tight">
        <SectionHead eyebrow="Preisrahmen" title={<>Was es dich <em>ungefähr kostet.</em></>} text="Schätzung für Deutschland mit den Werten aus dem Import-Rechner. Die Servicegebühr von TŌMEI kommt nach Angebot dazu." />
        <div className="gcard sv-calc">
          <label className="field">
            <span className="f-label">Kaufpreis vor Ort (in €)</span>
            <input className="input" type="range" min={5000} max={150000} step={1000} value={price} onChange={(e) => setPrice(Number(e.target.value))} />
            <b className="sv-price">{money(price, 'EUR')}</b>
          </label>
          <div className="seg">
            {(['roro', 'container'] as const).map((k) => (
              <button key={k} className={ship === k ? 'on' : ''} onClick={() => setShip(k)}>
                {k === 'roro' ? 'RoRo-Schiff' : 'Container'}
              </button>
            ))}
          </div>
          <div className="sv-ledger">
            <span>Auto + Gebühren vor Ort</span>
            <b>{money(cost.fob, 'EUR')}</b>
            <span>Fracht + Versicherung</span>
            <b>{money(de.freight[ship] + cost.insurance, 'EUR')}</b>
            <span>Zoll ({de.duty} %) + EUSt ({de.vat} %)</span>
            <b>{money(cost.taxes, 'EUR')}</b>
            <span>Hafen, Spedition, TÜV, Zulassung</span>
            <b>{money(cost.destFees, 'EUR')}</b>
          </div>
          <motion.div key={Math.round(cost.landed)} className="sv-total" initial={{ opacity: 0.4, y: 6 }} animate={{ opacity: 1, y: 0 }}>
            <span>Bis vor die Tür, ca.</span>
            <b>{money(cost.landed, 'EUR')}</b>
          </motion.div>
          <a className="link" href="#/import/rechner">
            Genauer rechnen im Import-Rechner
          </a>
        </div>
      </section>

      <section className="section" id="anfrage">
        <SectionHead eyebrow="Anfrage" title={<>Was <em>suchst du?</em></>} text="Unverbindlich. Deine Angaben bleiben auf deinem Gerät, bis du die Anfrage selbst abschickst." />
        <div className="gcard sv-form">
          <div className="mk-fields">
            <label className="field">
              <span className="f-label">Name</span>
              <input className="input" value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} />
            </label>
            <label className="field">
              <span className="f-label">E-Mail oder Telefon</span>
              <input className="input" value={d.contact} onChange={(e) => setD({ ...d, contact: e.target.value })} />
            </label>
          </div>
          <div className="mk-fields">
            <label className="field">
              <span className="f-label">Wunschauto</span>
              <input className="input" placeholder="z. B. Nissan Skyline GT-R R34" value={d.car} onChange={(e) => setD({ ...d, car: e.target.value })} />
            </label>
            <label className="field small">
              <span className="f-label">Baujahr ab</span>
              <input className="input" value={d.year} onChange={(e) => setD({ ...d, year: e.target.value })} />
            </label>
            <label className="field small">
              <span className="f-label">Budget (€)</span>
              <input className="input" inputMode="numeric" value={d.budget} onChange={(e) => setD({ ...d, budget: e.target.value })} />
            </label>
          </div>
          <p className="f-label">Märkte</p>
          <div className="mk-ideas">
            {MARKETS.map((m) => (
              <button key={m.id} className={'chip' + (d.markets.includes(m.id) ? ' on' : '')} onClick={() => toggle('markets', m.id)}>
                {m.country}
              </button>
            ))}
          </div>
          <p className="f-label">Leistungen</p>
          <div className="mk-ideas">
            {SERVICES.map((s) => (
              <button key={s} className={'chip' + (d.services.includes(s) ? ' on' : '')} onClick={() => toggle('services', s)}>
                {d.services.includes(s) && <Check size={13} />} {s}
              </button>
            ))}
          </div>
          <label className="field">
            <span className="f-label">Nachricht</span>
            <textarea className="input area" rows={4} value={d.note} onChange={(e) => setD({ ...d, note: e.target.value })} placeholder="Farbe, Zustand, Umbauten, Zeitrahmen …" />
          </label>
          <div className="mk-cta">
            {CONTACT_EMAIL ? (
              <a className={'btn red' + (ready ? '' : ' disabled')} href={ready ? `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Anfrage TŌMEI Service: ' + d.car)}&body=${encodeURIComponent(text)}` : undefined}>
                <Mail size={18} /> Anfrage senden
              </a>
            ) : null}
            <button className={'btn' + (CONTACT_EMAIL ? '' : ' red')} disabled={!ready} onClick={() => void copy()}>
              <ClipboardCopy size={18} /> {copied ? 'Kopiert' : 'Anfrage kopieren'}
            </button>
          </div>
          {!CONTACT_EMAIL && <p className="muted small">Die Kontaktadresse für Anfragen folgt in Kürze. Bis dahin kannst du deine Anfrage kopieren.</p>}
        </div>
        <p className="disclaimer">TŌMEI vermittelt den Kauf über Auktions-Agenten und Logistik-Partner. Alle Kosten sind Schätzungen; verbindlich ist erst das Angebot.</p>
      </section>
    </>
  )
}
