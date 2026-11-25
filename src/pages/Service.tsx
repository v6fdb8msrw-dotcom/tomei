// Service: Kaufen, verschiffen, zulassen als ein Paket. TŌMEI tritt als Vermittler auf (neutral, Partner folgt).
// Preisrahmen aus dem Import-Rechner (Deutschland), Anfrage als vorausgefüllte E-Mail oder zum Kopieren.
import { Badge } from '../components/ui.tsx'
import { Anchor, Check, ClipboardCopy, FileSearch, Gavel, Mail, ShieldCheck, Ship, Truck, Wrench } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'
import { AGENTS, CONTACT_EMAIL, DEST, FX_FALLBACK, MARKETS, agentAverage } from '../data.ts'
import { Reveal, SectionHead } from '../components/motion.tsx'
import { CarStack } from '../components/depth.tsx'
import { CarQuick } from '../components/CarQuick.tsx'
import { Details } from '../components/QuickInput.tsx'
import { useT } from '../i18n/i18n.ts'
import { DATA_EN } from '../i18n/data_en.ts'
import { landedCost, money } from '../lib/calc.ts'

const img = (name: string) => `${import.meta.env.BASE_URL}images/${name}.webp`

const STEPS = [
  { icon: FileSearch, title: 'Finden', en: ['Find', 'We search for your car in Japan, Korea and the other markets, including dealer auctions.'], text: 'Wir suchen dein Auto in Japan, Korea und den anderen Märkten, auch auf den Händlerauktionen.' },
  { icon: ShieldCheck, title: 'Prüfen', en: ['Inspect', 'Auction sheet translated, grade explained, photos and on-site check on request.'], text: 'Auktionsblatt übersetzt, Prüfnote erklärt, auf Wunsch Fotos und Check vor Ort.' },
  { icon: Gavel, title: 'Kaufen', en: ['Buy', 'Bid up to your limit or fixed price at a dealer. You only pay once the car is secured.'], text: 'Gebot bis zu deinem Limit oder Festpreis beim Händler. Du zahlst erst, wenn das Auto gesichert ist.' },
  { icon: Ship, title: 'Verschiffen', en: ['Ship', 'Export papers, RoRo or container to Bremerhaven, insured.'], text: 'Export-Papiere, RoRo oder Container bis Bremerhaven, versichert.' },
  { icon: Anchor, title: 'Verzollen', en: ['Clear customs', 'Duty and import VAT, customs clearance at the port.'], text: 'Zoll und Einfuhrumsatzsteuer, Verzollung im Hafen.' },
  { icon: Wrench, title: 'Zulassen', en: ['Register', 'Full TÜV inspection (§21), conversions if needed, registration.'], text: 'TÜV-Vollabnahme (§21), Umbauten falls nötig, Zulassung.' },
  { icon: Truck, title: 'Liefern', en: ['Deliver', 'To your door on request.'], text: 'Auf Wunsch bis vor deine Tür.' },
]

const SERVICES = ['Suche & Auswahl', 'Auktionsblatt prüfen', 'Bieten / Kauf', 'Verschiffung', 'Verzollung', 'TÜV & Zulassung', 'Lieferung vor die Tür']
const DRAFT = 'tomei.service.draft'

type Draft = { name: string; contact: string; car: string; year: string; budget: string; markets: string[]; services: string[]; note: string }
const EMPTY: Draft = { name: '', contact: '', car: '', year: '', budget: '', markets: ['jp'], services: [...SERVICES], note: '' }

export function Service() {
  const { tx, lang } = useT()
  const [price, setPrice] = useState(20000)
  const [ship, setShip] = useState<'roro' | 'container'>('roro')
  const [d, setD] = useState<Draft>(() => {
    try {
      return { ...EMPTY, ...JSON.parse(localStorage.getItem(DRAFT) || '{}') }
    } catch {
      return EMPTY
    }
  })
  const [line, setLine] = useState('')
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
        japanFees: Math.round(agentAverage(price / FX_FALLBACK.EUR) * FX_FALLBACK.EUR),
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
    ...(d.name ? [`Name: ${d.name}`] : []),
    ...(d.contact ? [`Kontakt: ${d.contact}`] : []),
    `Wunschauto: ${d.car}${d.year ? `, ab Baujahr ${d.year}` : ''}`,
    `Budget (bis vor die Tür): ${d.budget ? d.budget + ' €' : 'offen'}`,
    `Märkte: ${d.markets.map((id) => MARKETS.find((m) => m.id === id)?.country).filter(Boolean).join(', ')}`,
    `Leistungen: ${d.services.join(', ')}`,
    '',
    d.note,
  ].join('\n')
  const ready = d.car.trim() && (!CONTACT_EMAIL || d.contact.trim())
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
              {tx('Kaufen. Verschiffen.', 'Buy. Ship.')}
              <br />
              <em>{tx('Zulassen.', 'Register.')}</em>
            </h1>
            <p className="lead">{tx('Ein Ansprechpartner von der Auktion in Übersee bis zur Zulassung in Deutschland. Du sagst, was du suchst, wir kümmern uns um den Rest.', 'One contact from the overseas auction to registration in Germany. You say what you’re looking for, we take care of the rest.')}</p>
            <p className="cars-note">
              <Badge kind="demo">{tx('In Vorbereitung', 'Coming soon')}</Badge> {tx('Den Service gibt es noch nicht. Die Anfrage lässt sich vorbereiten und kopieren, aber noch an niemanden senden.', 'This service does not exist yet. You can prepare and copy a request, but not send it to anyone yet.')}
            </p>
            <a className="btn red" href="#/discover/service/anfrage">
              {tx('Anfrage starten', 'Start request')}
            </a>
          </Reveal>
        </div>
        <CarStack
          cards={[
            { src: img('import-ship'), label: tx('Verschiffung', 'Shipping'), sub: 'RoRo · Container' },
            { src: img('import-port'), label: 'Bremerhaven', sub: tx('Zoll · EUSt', 'Duty · VAT') },
            { src: img('cars/r34'), label: 'Dein Auto', sub: 'TÜV · Zulassung' },
          ]}
        />
      </section>

      <section className="section tight">
        <SectionHead eyebrow={tx('Ablauf', 'Process')} title={<>{tx('Sieben Schritte, ', 'Seven steps, ')}<em>{tx('ein Paket.', 'one package.')}</em></>} />
        <div className="sv-steps">
          {STEPS.map((s, k) => (
            <Reveal key={s.title} delay={k * 0.06}>
              <div className="gcard sv-step">
                <span className="sv-num">{String(k + 1).padStart(2, '0')}</span>
                <s.icon size={22} className="red" />
                <h3>{lang === 'en' ? s.en[0] : s.title}</h3>
                <p>{lang === 'en' ? s.en[1] : s.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="section tight">
        <SectionHead eyebrow={tx('Preisrahmen', 'Price range')} title={<>{tx('Was es dich ', 'What it will ')}<em>{tx('ungefähr kostet.', 'roughly cost you.')}</em></>} text={tx('Schätzung für Deutschland mit den Werten aus dem Import-Rechner. Die Servicegebühr von TŌMEI kommt nach Angebot dazu.', 'Estimate for Germany using the import calculator’s values. The TŌMEI service fee is added per quote.')} />
        <div className="gcard sv-calc">
          <label className="field">
            <span className="f-label">{tx('Kaufpreis vor Ort (in €)', 'Purchase price abroad (in €)')}</span>
            <input className="input" type="range" min={5000} max={150000} step={1000} value={price} onChange={(e) => setPrice(Number(e.target.value))} />
            <b className="sv-price">{money(price, 'EUR')}</b>
          </label>
          <div className="seg">
            {(['roro', 'container'] as const).map((k) => (
              <button key={k} className={ship === k ? 'on' : ''} onClick={() => setShip(k)}>
                {k === 'roro' ? tx('RoRo-Schiff', 'RoRo ship') : 'Container'}
              </button>
            ))}
          </div>
          <div className="sv-ledger">
            <span>Auto + Ø Export-Agent ({AGENTS.length} Firmen)</span>
            <b>{money(cost.fob, 'EUR')}</b>
            <span>Fracht + Versicherung</span>
            <b>{money(de.freight[ship] + cost.insurance, 'EUR')}</b>
            <span>Zoll ({de.duty} %) + EUSt ({de.vat} %)</span>
            <b>{money(cost.taxes, 'EUR')}</b>
            <span>Hafen, Spedition, TÜV, Zulassung</span>
            <b>{money(cost.destFees, 'EUR')}</b>
          </div>
          <motion.div key={Math.round(cost.landed)} className="sv-total" initial={{ opacity: 0.4, y: 6 }} animate={{ opacity: 1, y: 0 }}>
            <span>{tx('Bis vor die Tür, ca.', 'Landed, approx.')}</span>
            <b>{money(cost.landed, 'EUR')}</b>
          </motion.div>
          <a className="link" href="#/discover/calculator/rechner">
            {tx('Genauer rechnen im Import-Rechner', 'Calculate in detail in the import calculator')}
          </a>
        </div>
      </section>

      <section className="section" id="anfrage">
        <SectionHead eyebrow={tx('Anfrage', 'Request')} title={<>{tx('Was ', 'What are ')}<em>{tx('suchst du?', 'you looking for?')}</em></>} text={tx('Unverbindlich. Deine Angaben bleiben auf deinem Gerät, bis du die Anfrage selbst abschickst.', 'No obligation. Your details stay on your device until you send the request yourself.')} />
        <div className="gcard sv-form">
          <CarQuick
            value={line}
            onValue={setLine}
            button={tx('Übernehmen', 'Use')}
            examples={[tx('Nissan Skyline R34 bis 80.000 €', 'Nissan Skyline R34 up to 80,000 €'), tx('Toyota Supra 1997 60.000 €', 'Toyota Supra 1997 60,000 €')]}
            onCar={(c) => {
              const m = MARKETS.find((x) => x.id === c.market)
              setD({ ...d, car: c.hit?.n ?? [c.make, c.model].filter(Boolean).join(' '), year: c.year ? String(c.year) : '', budget: c.price ? (c.price.cur === 'EUR' ? c.price.amount.toLocaleString('de-DE') : '') : '', markets: m ? [m.id] : d.markets, note: c.price && c.price.cur !== 'EUR' ? `Budget: ${c.price.amount.toLocaleString('de-DE')} ${c.price.cur}` : d.note })
            }}
          />
          {d.car && (
            <p className="sv-sum">
              <b>{d.car}</b>
              {d.year && ` · ${tx('ab', 'from')} ${d.year}`}
              {d.budget && ` · ${d.budget} €`} · {d.markets.map((id) => MARKETS.find((m) => m.id === id)?.country).filter(Boolean).map((c) => (lang === 'en' ? (DATA_EN[c!] ?? c) : c)).join(', ')} · {d.services.length === SERVICES.length ? tx('Komplettpaket', 'full package') : tx(`${d.services.length} Leistungen`, `${d.services.length} services`)}
            </p>
          )}
          <Details title={tx('Mehr angeben: Kontakt, Märkte, Leistungen, Nachricht', 'Add more: contact, markets, services, message')}>
          <div className="mk-fields">
            <label className="field">
              <span className="f-label">Name</span>
              <input className="input" value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} />
            </label>
            <label className="field">
              <span className="f-label">{tx('E-Mail oder Telefon', 'E-mail or phone')}</span>
              <input className="input" value={d.contact} onChange={(e) => setD({ ...d, contact: e.target.value })} />
            </label>
          </div>
          <div className="mk-fields">
            <label className="field">
              <span className="f-label">{tx('Wunschauto', 'Dream car')}</span>
              <input className="input" placeholder={tx('z. B. Nissan Skyline GT-R R34', 'e.g. Nissan Skyline GT-R R34')} value={d.car} onChange={(e) => setD({ ...d, car: e.target.value })} />
            </label>
            <label className="field small">
              <span className="f-label">{tx('Baujahr ab', 'Year from')}</span>
              <input className="input" value={d.year} onChange={(e) => setD({ ...d, year: e.target.value })} />
            </label>
            <label className="field small">
              <span className="f-label">Budget (€)</span>
              <input className="input" inputMode="numeric" value={d.budget} onChange={(e) => setD({ ...d, budget: e.target.value })} />
            </label>
          </div>
          <p className="f-label">{tx('Märkte', 'Markets')}</p>
          <div className="mk-ideas">
            {MARKETS.map((m) => (
              <button key={m.id} className={'chip' + (d.markets.includes(m.id) ? ' on' : '')} onClick={() => toggle('markets', m.id)}>
                {lang === 'en' ? (DATA_EN[m.country] ?? m.country) : m.country}
              </button>
            ))}
          </div>
          <p className="f-label">{tx('Leistungen', 'Services')}</p>
          <div className="mk-ideas">
            {SERVICES.map((s) => (
              <button key={s} className={'chip' + (d.services.includes(s) ? ' on' : '')} onClick={() => toggle('services', s)}>
                {d.services.includes(s) && <Check size={13} />} {lang === 'en' ? (DATA_EN[s] ?? s) : s}
              </button>
            ))}
          </div>
          <label className="field">
            <span className="f-label">{tx('Nachricht', 'Message')}</span>
            <textarea className="input area" rows={4} value={d.note} onChange={(e) => setD({ ...d, note: e.target.value })} placeholder={tx('Farbe, Zustand, Umbauten, Zeitrahmen …', 'Colour, condition, mods, timeframe …')} />
          </label>
          </Details>
          <div className="mk-cta">
            {CONTACT_EMAIL ? (
              <a className={'btn red' + (ready ? '' : ' disabled')} href={ready ? `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Anfrage TŌMEI Service: ' + d.car)}&body=${encodeURIComponent(text)}` : undefined}>
                <Mail size={18} /> {tx('Anfrage senden', 'Send request')}
              </a>
            ) : null}
            <button className={'btn' + (CONTACT_EMAIL ? '' : ' red')} disabled={!ready} onClick={() => void copy()}>
              <ClipboardCopy size={18} /> {copied ? tx('Kopiert', 'Copied') : tx('Anfrage kopieren', 'Copy request')}
            </button>
          </div>
          {!CONTACT_EMAIL && <p className="muted small">{tx('Die Kontaktadresse für Anfragen folgt in Kürze. Bis dahin kannst du deine Anfrage kopieren.', 'A contact address for requests will follow soon. Until then you can copy your request.')}</p>}
        </div>
        <p className="disclaimer">{tx('TŌMEI vermittelt den Kauf über Auktions-Agenten und Logistik-Partner. Alle Kosten sind Schätzungen; verbindlich ist erst das Angebot.', 'TŌMEI arranges the purchase via auction agents and logistics partners. All costs are estimates; only the quote is binding.')}</p>
      </section>
    </>
  )
}
