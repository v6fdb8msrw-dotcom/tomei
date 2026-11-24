// Zentrales Branding. Der Name wird noch markenrechtlich geprüft: Wer ihn ändert, ändert ihn nur hier
// (Seitentitel, Navigation, Footer, Startseite, Exportdateien und Speicher-Schlüssel lesen diese Werte).
export const BRAND = {
  /** Anzeigename mit Makron */
  name: 'TŌMEI',
  /** Name ohne Sonderzeichen (Dateinamen, E-Mail-Betreff) */
  ascii: 'TOMEI',
  /** Leitmotiv der Version 2.0 */
  claim: 'Beyond the Drive',
  /** Kurzbeschreibung für Suchmaschinen und Teilen-Vorschau */
  description: {
    de: 'Fahrzeuge weltweit finden, ehrlich durchrechnen, Straßen erleben und das eigene Auto dokumentieren. Kostenlos, ohne Konto, alle Daten bleiben auf deinem Gerät.',
    en: 'Find cars worldwide, calculate honestly, explore great roads and document your own car. Free, no account, all data stays on your device.',
  },
  /** Bedeutung des Namens (Footer) */
  meaning: { de: '„Tōmei“ (透明) heißt durchsichtig: offene Zahlen, offene Quellen.', en: '“Tōmei” (透明) means transparent: open numbers, open sources.' },
  /** Präfix für alle Speicher-Schlüssel im Browser */
  storagePrefix: 'tomei',
  /** Öffentliche Webseite (GitHub Pages) */
  url: 'https://v6fdb8msrw-dotcom.github.io/tomei/',
  repo: 'https://github.com/v6fdb8msrw-dotcom/tomei',
} as const
