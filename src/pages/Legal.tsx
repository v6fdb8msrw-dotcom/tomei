// Impressum und Datenschutzerklärung (Entwurf). Die Angaben zum Betreiber kommen aus BRAND.operator und
// sind leer, bis Tim sie liefert. Der Datenschutztext beschreibt nur, was die Seite technisch wirklich tut.
import { FileText, ShieldCheck } from 'lucide-react'
import { BRAND } from '../config/brand.ts'
import { Note, PageHead } from '../components/ui.tsx'
import { useT } from '../i18n/i18n.ts'
import { href } from '../lib/router.ts'
import { STORE_KEY } from '../store/store.ts'

const op = BRAND.operator
const missing = !op.name || !op.street || !op.city || !op.email

function Operator() {
  const { tx } = useT()
  if (missing)
    return (
      <p className="legal-gap">
        {tx('[Name, Anschrift und E-Mail des Betreibers fehlen noch]', '[Operator name, address and e-mail still missing]')}
      </p>
    )
  return (
    <p>
      {op.name}
      <br />
      {op.street}
      <br />
      {op.city}
      <br />
      {tx('E-Mail', 'E-mail')}: <a href={'mailto:' + op.email}>{op.email}</a>
    </p>
  )
}

function Draft() {
  const { tx } = useT()
  return (
    <Note tone="warn">
      {tx(
        'Entwurf: Dieser Text ist noch nicht rechtlich geprüft und vor der Veröffentlichung zu vervollständigen. Er ersetzt keine Rechtsberatung.',
        'Draft: this text has not been legally reviewed and must be completed before publication. It is not legal advice.',
      )}
    </Note>
  )
}

export function Legal({ kind }: { kind: 'privacy' | 'imprint' }) {
  const { tx } = useT()
  if (kind === 'imprint')
    return (
      <>
        <PageHead eyebrow={tx('Impressum', 'Imprint')} title={tx('Wer hinter dieser Seite steht.', 'Who is behind this site.')} />
        <section className="section narrow legal">
          <Draft />
          <div className="gcard">
            <h3>
              <FileText size={18} /> {tx('Angaben gemäß § 5 DDG', 'Information pursuant to § 5 DDG (German Digital Services Act)')}
            </h3>
            <Operator />
            <h4>{tx('Verantwortlich für den Inhalt', 'Responsible for content')}</h4>
            <Operator />
            <h4>{tx('Haftung für Links', 'Liability for links')}</h4>
            <p>
              {tx(
                `${BRAND.name} verweist auf Webseiten von Portalen, Auktionshäusern, Händlern, Vermietern und Behörden. Auf deren Inhalte haben wir keinen Einfluss; verantwortlich ist der jeweilige Anbieter. Wir sind mit keinem der genannten Unternehmen verbunden und erhalten keine Provision.`,
                `${BRAND.name} links to websites of marketplaces, auction houses, dealers, rental companies and authorities. We have no influence on their content; the respective provider is responsible. We are not affiliated with any of the companies mentioned and receive no commission.`,
              )}
            </p>
            <h4>{tx('Bilder und Daten', 'Images and data')}</h4>
            <p>
              {tx('Alle Fotos stehen unter freien Lizenzen, Urheber und Lizenz stehen bei jedem Foto bzw. im ', 'All photos are under free licences; author and licence are given with each photo or in the ')}
              <a href={BRAND.repo + '/blob/main/ASSET_LICENSES.md'} target="_blank" rel="noopener noreferrer">
                {tx('Bildnachweis', 'image credits')}
              </a>
              {tx('. Quellen aller Zahlen: ', '. Sources of all figures: ')}
              <a href={BRAND.repo + '/blob/main/DATA_SOURCES.md'} target="_blank" rel="noopener noreferrer">
                DATA_SOURCES.md
              </a>
              .
            </p>
          </div>
        </section>
      </>
    )

  return (
    <>
      <PageHead eyebrow={tx('Datenschutz', 'Privacy')} title={tx('Kein Konto. Kein Tracking. Keine Cookies.', 'No account. No tracking. No cookies.')} />
      <section className="section narrow legal">
        <Draft />
        <div className="gcard">
          <h3>
            <ShieldCheck size={18} /> {tx('Verantwortlicher', 'Controller')}
          </h3>
          <Operator />

          <h4>{tx('1. Hosting bei GitHub Pages', '1. Hosting on GitHub Pages')}</h4>
          <p>
            {tx(
              'Die Seite wird von GitHub Pages ausgeliefert (GitHub, Inc., 88 Colin P. Kelly Jr. St, San Francisco, CA 94107, USA). Beim Aufruf verarbeitet GitHub technisch notwendige Daten wie die IP-Adresse, um die Seite auszuliefern und vor Angriffen zu schützen. Rechtsgrundlage ist unser berechtigtes Interesse an einer sicheren Bereitstellung (Art. 6 Abs. 1 lit. f DSGVO). Einzelheiten: ',
              'The site is served by GitHub Pages (GitHub, Inc., 88 Colin P. Kelly Jr. St, San Francisco, CA 94107, USA). When you visit, GitHub processes technically necessary data such as your IP address to deliver the site and protect it against attacks. The legal basis is our legitimate interest in secure delivery (Art. 6(1)(f) GDPR). Details: ',
            )}
            <a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement" target="_blank" rel="noopener noreferrer">
              GitHub Privacy Statement
            </a>
            .
          </p>

          <h4>{tx('2. Deine Daten bleiben in deinem Browser', '2. Your data stays in your browser')}</h4>
          <p>
            {tx(
              `Garage, Rechnungen, Roadtrips, Wartung, Passport und deine Einstellungen speichert ${BRAND.name} ausschließlich im lokalen Speicher deines Browsers (Schlüssel „${STORE_KEY}“). Nichts davon wird an uns oder Dritte übertragen. Du kannst alles unter `,
              `Garage, calculations, road trips, maintenance, passport and your settings are stored by ${BRAND.name} only in your browser's local storage (key “${STORE_KEY}”). None of it is transmitted to us or third parties. You can export or delete everything under `,
            )}
            <a href={href('data')}>{tx('Meine Daten', 'My data')}</a>
            {tx(' exportieren oder vollständig löschen.', '.')}
          </p>

          <h4>{tx('3. Wechselkurse', '3. Exchange rates')}</h4>
          <p>
            {tx(
              'Für aktuelle Wechselkurse fragt die Seite die Referenzkurse der Europäischen Zentralbank bei api.frankfurter.dev ab. Dabei wird deine IP-Adresse an diesen Dienst übertragen; es werden keine weiteren Daten gesendet. Schlägt die Abfrage fehl, rechnet die Seite mit hinterlegten Kursen.',
              'For current exchange rates the site requests the European Central Bank reference rates from api.frankfurter.dev. Your IP address is transmitted to this service; no other data is sent. If the request fails, the site uses stored rates.',
            )}
          </p>

          <h4>{tx('4. Keine Cookies, kein Tracking, keine eingebundenen Dienste', '4. No cookies, no tracking, no embedded services')}</h4>
          <p>
            {tx(
              'Es gibt keine Cookies, keine Analyse- oder Werbedienste, keine eingebetteten Karten oder Videos. Schriften und Fotos liegen auf demselben Server wie die Seite. Externe Links (Portale, Auktionshäuser, Google Maps, OpenStreetMap) öffnen sich erst, wenn du sie anklickst; ab dann gelten die Regeln des jeweiligen Anbieters.',
              'There are no cookies, no analytics or advertising services, no embedded maps or videos. Fonts and photos are served from the same server as the site. External links (marketplaces, auction houses, Google Maps, OpenStreetMap) open only when you click them; from then on the provider’s own rules apply.',
            )}
          </p>

          <h4>{tx('5. Deine Rechte', '5. Your rights')}</h4>
          <p>
            {tx(
              'Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch (Art. 15–21 DSGVO) sowie auf Beschwerde bei einer Datenschutz-Aufsichtsbehörde (Art. 77 DSGVO). Da wir selbst keine personenbezogenen Daten speichern, wende dich für die Server-Protokolle bitte auch an GitHub.',
              'You have the right of access, rectification, erasure, restriction of processing, data portability and objection (Art. 15–21 GDPR) and the right to lodge a complaint with a supervisory authority (Art. 77 GDPR). As we do not store personal data ourselves, please also contact GitHub regarding server logs.',
            )}
          </p>
          <p className="muted small">{tx('Stand: 24.11.2026', 'Last updated: 24 Nov 2026')}</p>
        </div>
      </section>
    </>
  )
}
