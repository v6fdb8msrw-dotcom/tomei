// Von Hand geprüfte Spezialwerkstätten, die in OpenStreetMap fehlen oder dort nicht als Spezialisten erkennbar sind.
// Aufnahme nur, wenn Adresse und Schwerpunkt auf der eigenen Webseite stehen (geprüft am 26.11.2026). Keine Bewertung,
// keine Empfehlung: Wer hinfährt, klärt Termin, Preise und Erfahrung mit der eigenen Generation vorher selbst.
// Lage: Ortsmitte bzw. Straße ungefähr (für die Entfernung), die genaue Anschrift steht in a.
import type { Shop } from '../lib/workshops.ts'

export const SPECIALISTS: Shop[] = [
  {
    n: 'Kabbana Dynamics',
    a: 'Widdersche Str. 278',
    c: '47804 Krefeld',
    la: 51.3289,
    lo: 6.5372,
    w: 'https://www.kabbana-dynamics.de/',
    t: '+49 163 666 0255',
    m: ['nissan'],
    x: { de: 'Spezialist Nissan GT-R (R35)', en: 'Nissan GT-R (R35) specialist' },
    s: 'https://www.kabbana-dynamics.de/',
  },
  {
    n: 'DB Performance Cars',
    a: 'Heidenheimer Straße 83',
    c: '89537 Giengen an der Brenz',
    la: 48.6183,
    lo: 10.2456,
    w: 'https://dbperformancecars.com/',
    m: ['jdm'],
    x: { de: 'JDM-Import mit Werkstatt', en: 'JDM importer with workshop' },
    s: 'https://dbperformancecars.com/impressum/',
  },
  {
    n: 'Middlehurst Road Race & Classic',
    a: 'Jackson Street',
    c: 'St Helens WA9 1AW',
    la: 53.4489,
    lo: -2.7316,
    w: 'https://www.middlehurst.co.uk/',
    t: '+44 1744 26681',
    m: ['nissan'],
    x: { de: 'Skyline-GT-R-Spezialist', en: 'Skyline GT-R specialist' },
    s: 'https://classicandsportscar.com/features/uks-nissan-skyline-gt-r-expert-meet-andy-middlehurst',
  },
  {
    n: 'Torque GT',
    a: 'Unit 1, The Drum Business Park',
    c: 'Heathfield TQ12 6RY',
    la: 50.5617,
    lo: -3.6519,
    w: 'https://www.torque-gt.co.uk/',
    m: ['jdm'],
    x: { de: 'Spezialist für japanische Performance-Autos', en: 'Japanese performance car specialist' },
    s: 'https://www.torque-gt.co.uk/contact.html',
  },
]
