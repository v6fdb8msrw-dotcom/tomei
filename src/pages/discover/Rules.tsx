// Importregeln je Zielland: Altersgrenzen, Zoll und Steuern, Schritte und offizielle Quellen.
import { ArrowRight } from 'lucide-react'
import { IMPORT_RULES, ruleById } from '../../data/importRules.ts'
import { Note, PageHead, SourceLink, img } from '../../components/ui.tsx'
import { useT } from '../../i18n/i18n.ts'
import { href } from '../../lib/router.ts'
import { setSettings, useStore } from '../../store/store.ts'

export function RulesPage({ id }: { id?: string }) {
  const { tx, L } = useT()
  const home = useStore((s) => s.settings.homeCountry) || 'de'
  const rule = ruleById(id ?? home) ?? IMPORT_RULES[0]
  return (
    <>
      <PageHead
        eyebrow={tx('Discover · Importregeln', 'Discover · Import rules')}
        title={
          <>
            {tx('Was gilt ', 'What applies ')}
            <em>{tx('in deinem Land.', 'in your country.')}</em>
          </>
        }
        sub={tx('Altersgrenzen, Zoll und Steuern, die Schritte bis zur Zulassung und die offiziellen Seiten der Behörden. Kurz gefasst, verbindlich ist immer die Behörde.', 'Age thresholds, duty and taxes, the steps to registration and the official government pages. In brief – the authority is always binding.')}
        images={[img('import-port'), img('import-ship')]}
      >
        <div className="row gap wrap">
          {IMPORT_RULES.map((r) => (
            <a key={r.id} className={'btn small' + (r.id === rule.id ? ' primary' : '')} href={href('discover/rules/' + r.id)} onClick={() => setSettings({ homeCountry: r.id })}>
              {r.flag} {L(r.name)}
            </a>
          ))}
        </div>
      </PageHead>
      <section className="section narrow">
        <div className="sec-head">
          <p className="eyebrow">
            {rule.flag} {L(rule.name)}
          </p>
          <h2>{tx('Zoll und Steuern', 'Duty and taxes')}</h2>
          <p className="sec-text">{L(rule.taxes)}</p>
        </div>
        {rule.age && (
          <div className="gcard mp-rule">
            <h3>{tx(`Ab ${rule.age.years} Jahren`, `From ${rule.age.years} years`)}</h3>
            <p>{L(rule.age.text)}</p>
          </div>
        )}
        <h3 className="rules-h">{tx('Schritt für Schritt', 'Step by step')}</h3>
        <ol className="journey">
          {rule.steps.map((s, k) => (
            <li key={k}>
              <span className="j-check">{k + 1}</span>
              <div>
                <p>{L(s)}</p>
              </div>
            </li>
          ))}
        </ol>
        <h3 className="rules-h">{tx('Offizielle Quellen', 'Official sources')}</h3>
        <div className="rules-links">
          {rule.links.map((l) => (
            <SourceLink key={l.url} url={l.url}>
              {L(l.label)}
            </SourceLink>
          ))}
        </div>
        <Note>{tx('Stand 24.11.2026. Regeln und Sätze ändern sich; vor dem Kauf beim Zoll bzw. der Zulassungsbehörde bestätigen lassen.', 'As of 24 Nov 2026. Rules and rates change; confirm with customs or the registration authority before buying.')}</Note>
        <a className="btn primary" href={href('discover/calculator')}>
          {tx('Im Importrechner durchrechnen', 'Calculate in the import calculator')} <ArrowRight size={16} />
        </a>
      </section>
    </>
  )
}
