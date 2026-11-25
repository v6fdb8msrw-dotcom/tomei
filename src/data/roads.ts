// Roadtrip-Explorer: berühmte Straßen mit überprüfbaren Fakten.
// Fakten (Länge, Höhe, Endpunkte) aus der englischen Wikipedia, abgerufen am 24.11.2026 über die Wikipedia-API.
// Koordinaten der Wegpunkte = Koordinaten der Wikipedia-Artikel zu Orten bzw. Pässen, keine gezeichnete Strecke.
// Fotos: Wikimedia Commons mit freier Lizenz, Nachweis je Foto (photo.*) und in ASSET_LICENSES.md.
import more from './roads_more.json'
import type { Waypoint } from '../store/schema.ts'

export type RoadPhoto = { file: string; author: string; licence: string; licenceUrl?: string; page: string }
export type Road = {
  id: string
  name: string
  local?: string
  country: string // Länder-ID aus countries.ts
  region: string
  kind: 'pass' | 'coast' | 'touge' | 'expressway' | 'track' | 'scenic'
  lengthKm?: number
  highestM?: number
  /** Kurzfakten, jeweils aus der verlinkten Quelle */
  facts: { de: string; en: string }[]
  text: { de: string; en: string }
  /** Saison- oder Mauthinweis, nur wenn belegt */
  notes?: { de: string; en: string }[]
  waypoints: Waypoint[]
  loop?: boolean
  source: string
  official?: string
  /** Kurztext stammt aus der Wikipedia (Lizenzhinweis nötig) */
  wiki?: boolean
  photo: RoadPhoto
}

const W = (t: string) => `https://en.wikipedia.org/wiki/${t}`
const C = (f: string) => `https://commons.wikimedia.org/wiki/File:${f}`
const BYSA4 = { licence: 'CC BY-SA 4.0', licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0/' }
const BYSA3 = { licence: 'CC BY-SA 3.0', licenceUrl: 'https://creativecommons.org/licenses/by-sa/3.0/' }
const BYSA2 = { licence: 'CC BY-SA 2.0', licenceUrl: 'https://creativecommons.org/licenses/by-sa/2.0/' }
const BY2 = { licence: 'CC BY 2.0', licenceUrl: 'https://creativecommons.org/licenses/by/2.0/' }

export const roadImg = (id: string) => `${import.meta.env.BASE_URL}images/roads/${id}.webp`
export const roadThumb = (id: string) => `${import.meta.env.BASE_URL}images/roads/${id}-s.webp`

const BASE_ROADS: Road[] = [
  {
    id: 'hakone', name: 'Hakone Turnpike', local: '箱根ターンパイク', country: 'jp', region: 'Kanagawa', kind: 'touge', lengthKm: 15.752,
    text: { de: 'Private Mautstraße von Odawara hinauf in die Berge von Hakone. Breite, gepflegte Kurven, oben der Blick über die Sagami-Bucht.', en: 'Private toll road climbing from Odawara into the Hakone mountains. Wide, well-kept curves and a view over Sagami Bay at the top.' },
    facts: [{ de: '15,752 km lang', en: '15.752 km long' }, { de: 'Privat betriebene Mautstraße', en: 'Privately owned toll road' }, { de: 'Verbindet Odawara und Yugawara über Hakone', en: 'Connects Odawara and Yugawara via Hakone' }],
    notes: [{ de: 'Mautpflichtig', en: 'Toll road' }],
    waypoints: [{ name: 'Odawara', lat: 35.25, lon: 139.15 }, { name: 'Yugawara', lat: 35.15, lon: 139.0667 }],
    source: W('Hakone_Turnpike'),
    photo: { file: 'Hakone_Turnpike_20140412-1.jpg', author: 'PekePON', ...BYSA4, page: C('Hakone_Turnpike_20140412-1.jpg') },
  },
  {
    id: 'izu', name: 'Izu Skyline', local: '伊豆スカイライン', country: 'jp', region: 'Shizuoka', kind: 'scenic', lengthKm: 40.6,
    text: { de: 'Kammstraße über die Berge der Izu-Halbinsel, an klaren Tagen mit dem Fuji im Rücken.', en: 'Ridge road across the mountains of the Izu Peninsula, with Mount Fuji behind you on clear days.' },
    facts: [{ de: '40,6 km lang', en: '40.6 km long' }, { de: 'Mautstraße von Atami-tōge bis Amagi-kōgen', en: 'Toll road from Atami-tōge to Amagi-kōgen' }],
    notes: [{ de: 'Mautpflichtig', en: 'Toll road' }],
    waypoints: [{ name: 'Kannami', lat: 35.0889, lon: 138.9534 }, { name: 'Itō', lat: 34.9657, lon: 139.1019 }],
    source: W('Izu_Skyline'),
    photo: { file: 'Izu_Skyline_20120203.jpg', author: 'Batholith', licence: 'Public Domain', page: C('Izu_Skyline_20120203.jpg') },
  },
  {
    id: 'shiga', name: 'Shiga-Kusatsu-Route (Nationalstraße 292)', local: '国道292号', country: 'jp', region: 'Gunma · Nagano · Niigata', kind: 'pass', lengthKm: 112.6,
    text: { de: 'Die Nationalstraße 292 führt von Naganohara über Kusatsu und das Shiga-Hochland nach Myōkō, durch Vulkanlandschaft und Serpentinen.', en: 'National Route 292 runs from Naganohara via Kusatsu and the Shiga Highlands to Myōkō, through volcanic landscape and switchbacks.' },
    facts: [{ de: '112,6 km Gesamtlänge', en: '112.6 km total length' }, { de: 'Von Naganohara (Gunma) nach Myōkō (Niigata)', en: 'From Naganohara (Gunma) to Myōkō (Niigata)' }],
    waypoints: [{ name: 'Naganohara', lat: 36.5523, lon: 138.6542 }, { name: 'Kusatsu', lat: 36.6207, lon: 138.5961 }, { name: 'Myōkō', lat: 37.0252, lon: 138.2535 }],
    source: W('Japan_National_Route_292'),
    photo: { file: '2016-10-10_Japan_National_Route_292（国道292号）_DSCF0538.jpg', author: '松岡明芳', ...BYSA4, page: 'https://commons.wikimedia.org/wiki/File:2016-10-10_Japan_National_Route_292%EF%BC%88%E5%9B%BD%E9%81%93292%E5%8F%B7%EF%BC%89_DSCF0538.jpg' },
  },
  {
    id: 'wangan', name: 'Wangan (Bayshore Route)', local: '湾岸線', country: 'jp', region: 'Tokio · Yokohama', kind: 'expressway', lengthKm: 62.1,
    text: { de: 'Die Route B des Shuto-Expressway an der Bucht von Tokio, eröffnet in Abschnitten von 1976 bis 2001. Ein Stück Autokultur, aber eine normale Autobahn mit Tempolimit.', en: 'Route B of the Shuto Expressway along Tokyo Bay, opened in phases from 1976 to 2001. A piece of car culture, but a normal expressway with speed limits.' },
    facts: [{ de: '62,1 km lang', en: '62.1 km long' }, { de: 'Von Kanazawa (Yokohama) bis Ichikawa (Chiba)', en: 'From Kanazawa (Yokohama) to Ichikawa (Chiba)' }, { de: 'Eröffnet 1976–2001', en: 'Opened 1976–2001' }],
    notes: [{ de: 'Mautpflichtig (Shuto Expressway)', en: 'Toll road (Shuto Expressway)' }],
    waypoints: [{ name: 'Kanazawa-ku', lat: 35.3375, lon: 139.6244 }, { name: 'Ichikawa', lat: 35.7219, lon: 139.9311 }],
    source: W('Bayshore_Route'),
    photo: { file: 'Shinonome_JCT_2.JPG', author: 'Ebiebi2', licence: 'CC0', licenceUrl: 'https://creativecommons.org/publicdomain/zero/1.0/', page: C('Shinonome_JCT_2.JPG') },
  },
  {
    id: 'shimanami', name: 'Shimanami Kaidō', local: 'しまなみ海道', country: 'jp', region: 'Hiroshima · Ehime', kind: 'coast', lengthKm: 59.4,
    text: { de: 'Brückenkette über neun Inseln der Seto-Inlandsee, darunter die Kurushima-Kaikyō-Brücke, die längste Folge von Hängebrücken der Welt.', en: 'Chain of bridges across nine islands of the Seto Inland Sea, including the Kurushima Kaikyō Bridge, the world’s longest series of suspension bridges.' },
    facts: [{ de: '59,4 km lang, eröffnet am 1. Mai 1999', en: '59.4 km long, opened on 1 May 1999' }, { de: '55 Brücken', en: '55 bridges' }, { de: 'Von Onomichi nach Imabari', en: 'From Onomichi to Imabari' }],
    waypoints: [{ name: 'Onomichi', lat: 34.4167, lon: 133.2 }, { name: 'Imabari', lat: 34.0667, lon: 133.0 }],
    source: W('Nishiseto_Expressway'),
    photo: { file: 'Kurushimakaikyou_ohashi01.jpg', author: 'Nkns', ...BYSA3, page: C('Kurushimakaikyou_ohashi01.jpg') },
  },
  {
    id: 'stelvio', name: 'Stilfser Joch', local: 'Passo dello Stelvio', country: 'it', region: 'Südtirol · Lombardei', kind: 'pass', highestM: 2757,
    text: { de: 'Der höchste asphaltierte Pass der Ostalpen. Von Prad windet sich die Straße in Kehre um Kehre nach oben und auf der anderen Seite hinunter nach Bormio.', en: 'The highest paved pass in the Eastern Alps. From Prad the road winds up hairpin after hairpin and down the other side to Bormio.' },
    facts: [{ de: '2.757 m über dem Meer', en: '2,757 m above sea level' }, { de: 'Höchster asphaltierter Pass der Ostalpen, zweithöchster der Alpen', en: 'Highest paved pass in the Eastern Alps, second highest in the Alps' }],
    notes: [{ de: 'Hochgebirgspass, im Winter gesperrt', en: 'High mountain pass, closed in winter' }],
    waypoints: [{ name: 'Prad am Stilfser Joch', lat: 46.6167, lon: 10.6 }, { name: 'Stilfser Joch', lat: 46.5286, lon: 10.4528 }, { name: 'Bormio', lat: 46.4667, lon: 10.3667 }],
    source: W('Stelvio_Pass'),
    photo: { file: 'Stelvio_Pass_Bolzano_side_1.jpg', author: 'kallerna', ...BYSA4, page: C('Stelvio_Pass_Bolzano_side_1.jpg') },
  },
  {
    id: 'glockner', name: 'Großglockner-Hochalpenstraße', country: 'at', region: 'Salzburg · Kärnten', kind: 'pass', highestM: 2504,
    text: { de: 'Österreichs höchste Passstraße, als Panoramastraße gebaut. Von Bruck über Fuscher Törl und Hochtor nach Heiligenblut am Fuß des Großglockners.', en: 'Austria’s highest pass road, built as a scenic route. From Bruck via Fuscher Törl and Hochtor to Heiligenblut at the foot of the Grossglockner.' },
    facts: [{ de: 'Hochtor 2.504 m, Fuscher Törl 2.428 m', en: 'Hochtor 2,504 m, Fuscher Törl 2,428 m' }, { de: 'Höchste asphaltierte Passstraße Österreichs', en: 'Highest paved pass road in Austria' }],
    notes: [{ de: 'Mautpflichtig', en: 'Toll road' }],
    waypoints: [{ name: 'Bruck', lat: 47.2833, lon: 12.825 }, { name: 'Hochtor', lat: 47.0833, lon: 12.8428 }, { name: 'Heiligenblut', lat: 47.0414, lon: 12.8369 }],
    source: W('Grossglockner_High_Alpine_Road'),
    official: 'https://www.grossglockner.at/',
    photo: { file: 'Grossglockner_road.jpg', author: 'Sander Hoogendoorn', ...BY2, page: C('Grossglockner_road.jpg') },
  },
  {
    id: 'furka', name: 'Furkapass', country: 'ch', region: 'Wallis · Uri', kind: 'pass', highestM: 2429,
    text: { de: 'Saisonale Passstraße zwischen Gletsch und Realp, mit den Kehren unter dem Rhonegletscher.', en: 'Seasonal pass road between Gletsch and Realp, with hairpins below the Rhône Glacier.' },
    facts: [{ de: '2.429 m über dem Meer', en: '2,429 m above sea level' }, { de: 'Verbindet Gletsch (Wallis) und Realp (Uri)', en: 'Connects Gletsch (Valais) and Realp (Uri)' }],
    notes: [{ de: 'Saisonstraße, im Winter gesperrt', en: 'Seasonal road, closed in winter' }],
    waypoints: [{ name: 'Gletsch', lat: 46.5622, lon: 8.3614 }, { name: 'Furkapass', lat: 46.5725, lon: 8.415 }, { name: 'Realp', lat: 46.5833, lon: 8.5 }],
    source: W('Furka_Pass'),
    photo: { file: 'Furkapass_westside.jpg', author: 'Cooper.ch', licence: 'CC BY 2.5', licenceUrl: 'https://creativecommons.org/licenses/by/2.5/', page: C('Furkapass_westside.jpg') },
  },
  {
    id: 'nordschleife', name: 'Nürburgring Nordschleife', country: 'de', region: 'Eifel, Rheinland-Pfalz', kind: 'track', lengthKm: 20.83, loop: true,
    text: { de: 'Die „Grüne Hölle“ in der Eifel, gebaut in den 1920er-Jahren. An vielen Tagen für Touristenfahrten geöffnet, mit eigenem Auto.', en: 'The “Green Hell” in the Eifel, built in the 1920s. Open for tourist drives on many days, in your own car.' },
    facts: [{ de: '20,830 km Rundenlänge', en: '20.830 km lap' }, { de: 'Mehr als 300 m Höhenunterschied', en: 'More than 300 m elevation change' }, { de: 'Spitzname „Grüne Hölle“ (Jackie Stewart)', en: 'Nicknamed “Green Hell” (Jackie Stewart)' }],
    notes: [{ de: 'Touristenfahrten gegen Gebühr, Termine beim Betreiber', en: 'Paid tourist drives, dates from the operator' }],
    waypoints: [{ name: 'Nürburg', lat: 50.3422, lon: 6.9522 }],
    source: W('Nürburgring'),
    official: 'https://nuerburgring.de/',
    photo: { file: 'Nurburgring_lap.jpg', author: 'Mike Roberts', ...BYSA2, page: C('Nurburgring_lap.jpg') },
  },
  {
    id: 'transfagarasan', name: 'Transfăgărășan', local: 'DN7C', country: 'ro', region: 'Karpaten', kind: 'pass', lengthKm: 90,
    text: { de: 'In den 1970er-Jahren als militärische Route gebaut, quer über das Făgăraș-Gebirge zwischen Walachei und Siebenbürgen.', en: 'Built in the early 1970s as a strategic military route across the Făgăraș Mountains between Wallachia and Transylvania.' },
    facts: [{ de: '90 km von Bascov bis zur DN1 bei Sibiu', en: '90 km from Bascov to the DN1 near Sibiu' }, { de: 'Zweithöchste asphaltierte Straße Rumäniens', en: 'Second-highest paved road in Romania' }],
    notes: [{ de: 'Hochgebirgsstraße, im Winter gesperrt', en: 'High mountain road, closed in winter' }],
    waypoints: [{ name: 'Bascov', lat: 44.9, lon: 24.8167 }, { name: 'Bâlea Lac', lat: 45.5981, lon: 24.6165 }, { name: 'Cârțișoara', lat: 45.7239, lon: 24.5792 }],
    source: W('Transfăgărășan'),
    photo: { file: 'Transfagarasan_twisty_road.jpg', author: 'Cristian Bortes', ...BY2, page: C('Transfagarasan_twisty_road.jpg') },
  },
  {
    id: 'trollstigen', name: 'Trollstigen', country: 'no', region: 'Møre og Romsdal', kind: 'pass',
    text: { de: 'Elf Haarnadelkurven die Felswand hinauf, Teil der Landstraße 63 zwischen Åndalsnes und Valldal.', en: 'Eleven hairpin bends up a steep mountainside, part of County Road 63 between Åndalsnes and Valldal.' },
    facts: [{ de: '11 Haarnadelkurven, 10 % Steigung', en: '11 hairpin bends, 10 % incline' }, { de: 'Fahrzeuge über 12,4 m Länge verboten', en: 'Vehicles over 12.4 m long prohibited' }],
    notes: [{ de: 'Im Winter gesperrt', en: 'Closed in winter' }],
    waypoints: [{ name: 'Åndalsnes', lat: 62.5675, lon: 7.6871 }, { name: 'Trollstigen', lat: 62.4667, lon: 7.6667 }, { name: 'Valldal (Sylte)', lat: 62.298, lon: 7.2626 }],
    source: W('Trollstigen'),
    official: 'https://www.nasjonaleturistveger.no/en/',
    photo: { file: 'Trollstigen_Norway_2006.JPG', author: 'Color probe', ...BYSA3, page: C('Trollstigen_Norway_2006.JPG') },
  },
  {
    id: 'atlantic', name: 'Atlantikstraße', local: 'Atlanterhavsvegen', country: 'no', region: 'Møre og Romsdal', kind: 'coast', lengthKm: 8.3,
    text: { de: 'Über Inseln und Schären, verbunden durch Dämme, Viadukte und acht Brücken, allen voran die Storseisundet-Brücke.', en: 'Across islands and skerries, linked by causeways, viaducts and eight bridges, most prominently the Storseisundet Bridge.' },
    facts: [{ de: '8,3 km lang, acht Brücken', en: '8.3 km long, eight bridges' }, { de: 'Zwischen Kårvåg und Vevang', en: 'Between Kårvåg and Vevang' }, { de: 'Baubeginn 1. August 1983', en: 'Construction began on 1 August 1983' }],
    waypoints: [{ name: 'Vevang', lat: 63.0048, lon: 7.2966 }, { name: 'Storseisundet', lat: 63.0167, lon: 7.3545 }, { name: 'Kårvåg', lat: 63.0138, lon: 7.4454 }],
    source: W('Atlantic_Ocean_Road'),
    official: 'https://www.nasjonaleturistveger.no/en/',
    photo: { file: 'Atlanterhavsvegen_1.jpg', author: 'Ernst Vikne', ...BYSA2, page: C('Atlanterhavsvegen_1.jpg') },
  },
  {
    id: 'bigsur', name: 'Big Sur (State Route 1)', local: 'Pacific Coast Highway', country: 'us', region: 'Kalifornien', kind: 'coast',
    text: { de: 'Der Abschnitt der State Route 1 zwischen Carmel Highlands und San Simeon, wo die Santa Lucia Mountains direkt aus dem Pazifik steigen. Mit der Bixby-Creek-Brücke.', en: 'The stretch of State Route 1 between Carmel Highlands and San Simeon, where the Santa Lucia Mountains rise straight out of the Pacific. With the Bixby Creek Bridge.' },
    facts: [{ de: 'State Route 1 insgesamt 1.056 km, längste Staatsstraße Kaliforniens', en: 'State Route 1 is 1,056 km in total, the longest state route in California' }, { de: 'Big Sur: zwischen Carmel Highlands und San Simeon', en: 'Big Sur: between Carmel Highlands and San Simeon' }],
    notes: [{ de: 'Abschnitte sind nach Erdrutschen immer wieder gesperrt; vorher Caltrans prüfen', en: 'Sections close repeatedly after landslides; check Caltrans first' }],
    waypoints: [{ name: 'Carmel-by-the-Sea', lat: 36.5553, lon: -121.9233 }, { name: 'San Simeon', lat: 35.6439, lon: -121.1892 }],
    source: W('Big_Sur'),
    official: 'https://quickmap.dot.ca.gov/',
    photo: { file: 'Bixby_Creek_Bridge,_California,_USA_-_May_2013.jpg', author: 'Diliff', ...BYSA3, page: C('Bixby_Creek_Bridge,_California,_USA_-_May_2013.jpg') },
  },
  {
    id: 'blueridge', name: 'Blue Ridge Parkway', country: 'us', region: 'Virginia · North Carolina', kind: 'scenic', lengthKm: 755,
    text: { de: 'Der längste lineare Park der USA: eine Panoramastraße auf dem Kamm der Blue Ridge, vom Shenandoah- zum Great-Smoky-Mountains-Nationalpark.', en: 'The longest linear park in the US: a scenic road along the Blue Ridge, from Shenandoah to Great Smoky Mountains National Park.' },
    facts: [{ de: '469 Meilen (755 km) durch 29 Countys', en: '469 miles (755 km) through 29 counties' }, { de: 'National Parkway und All-American Road', en: 'National Parkway and All-American Road' }],
    waypoints: [{ name: 'Waynesboro (Rockfish Gap)', lat: 38.07, lon: -78.8944 }, { name: 'Cherokee', lat: 35.4769, lon: -83.3206 }],
    source: W('Blue_Ridge_Parkway'),
    official: 'https://www.nps.gov/blri/',
    photo: { file: 'East_Fork_Overlook.jpg', author: 'Tsimmons', licence: 'CC BY 3.0', licenceUrl: 'https://creativecommons.org/licenses/by/3.0/', page: C('East_Fork_Overlook.jpg') },
  },
  {
    id: 'sunroad', name: 'Going-to-the-Sun Road', country: 'us', region: 'Glacier National Park, Montana', kind: 'pass', highestM: 2026,
    text: { de: 'Die einzige Straße quer durch den Glacier-Nationalpark, über den Logan Pass und die kontinentale Wasserscheide. Gebaut 1921 bis 1932.', en: 'The only road across Glacier National Park, over Logan Pass and the Continental Divide. Built from 1921 to 1932.' },
    facts: [{ de: 'Logan Pass 2.026 m (6.646 ft)', en: 'Logan Pass 2,026 m (6,646 ft)' }, { de: 'Gebaut 1921–1932, eröffnet 1933', en: 'Built 1921–1932, dedicated 1933' }, { de: 'National Historic Landmark', en: 'National Historic Landmark' }],
    notes: [{ de: 'Hochgebirgsabschnitt nur im Sommer offen; Regeln beim National Park Service', en: 'Alpine section open in summer only; rules from the National Park Service' }],
    waypoints: [{ name: 'West Glacier', lat: 48.4931, lon: -113.9786 }, { name: 'Logan Pass', lat: 48.6967, lon: -113.7183 }, { name: 'St. Mary', lat: 48.7428, lon: -113.4275 }],
    source: W('Going-to-the-Sun_Road'),
    official: 'https://www.nps.gov/glac/',
    photo: { file: 'Going-to-the-Sun_Road_-_Glacier_National_Park.jpg', author: 'MPSharwood', ...BYSA4, page: C('Going-to-the-Sun_Road_-_Glacier_National_Park.jpg') },
  },
  {
    id: 'timmelsjoch', name: "Timmelsjoch-Hochalpenstraße", local: "Passo del Rombo", country: 'at', region: "Tirol · Südtirol", kind: 'pass', highestM: 2474,
    text: { de: "Hochalpenpass über die Ötztaler Alpen, an der Grenze zwischen Österreich und Italien: vom Ötztal hinüber ins Passeiertal.", en: "High Alpine pass across the Ötztal Alps on the Austria–Italy border: from the Ötztal valley over into the Passeier valley." },
    facts: [{ de: "Passhöhe 2.474 m", en: "Summit 2,474 m" }, { de: "Verbindet das Ötztal (Tirol) mit dem Passeiertal (Südtirol)", en: "Links the Ötztal (Tyrol) with the Passeier valley (South Tyrol)" }],
    waypoints: [{ name: "Sölden", lat: 46.9667, lon: 11.0 }, { name: "Timmelsjoch", lat: 46.9053, lon: 11.0967 }, { name: "Moos in Passeier", lat: 46.8333, lon: 11.1667 }],
    source: W('Timmelsjoch'),
    photo: { file: "Timmelsjoch_-_Hochalpenstraße_IMG_7446.jpg", author: "Fischer.H", ...BYSA4, page: C("Timmelsjoch_-_Hochalpenstraße_IMG_7446.jpg") },
  },
  {
    id: 'grimsel', name: "Grimselpass", country: 'ch', region: "Bern · Wallis", kind: 'pass', lengthKm: 38, highestM: 2163,
    text: { de: "Passstraße durch die Berner Alpen vom Haslital hinüber ins Rhonetal, über die Wasserscheide zwischen Nordsee und Mittelmeer.", en: "Pass road through the Bernese Alps from the Haslital to the Rhône valley, across the divide between the North Sea and the Mediterranean." },
    facts: [{ de: "Passhöhe 2.163 m", en: "Summit 2,163 m" }, { de: "Straße von Gletsch nach Meiringen, 38 km", en: "Road from Gletsch to Meiringen, 38 km" }, { de: "Liegt auf der Wasserscheide zwischen Nordsee und Mittelmeer", en: "Sits on the divide between the North Sea and the Mediterranean" }],
    waypoints: [{ name: "Meiringen", lat: 46.7275, lon: 8.1872 }, { name: "Grimselpass", lat: 46.5617, lon: 8.3453 }, { name: "Gletsch", lat: 46.5622, lon: 8.3614 }],
    source: W('Grimsel_Pass'),
    photo: { file: "2007-10-02_Grimselpass_01.jpg", author: "Hansueli Krapf", ...BYSA3, page: C("2007-10-02_Grimselpass_01.jpg") },
  },
  {
    id: 'tremola', name: "Gotthardpass", local: "Passo del San Gottardo", country: 'ch', region: "Uri · Tessin", kind: 'pass', highestM: 2106,
    text: { de: "Klassischer Alpenpass zwischen Andermatt und Airolo, im Herzen einer der wichtigsten Verkehrsachsen Europas.", en: "Classic Alpine pass between Andermatt and Airolo, at the heart of one of Europe’s key transport axes." },
    facts: [{ de: "Passhöhe 2.106 m", en: "Summit 2,106 m" }, { de: "Verbindet Andermatt (Uri) und Airolo (Tessin)", en: "Links Andermatt (Uri) and Airolo (Ticino)" }],
    waypoints: [{ name: "Andermatt", lat: 46.6167, lon: 8.5833 }, { name: "Gotthardpass", lat: 46.5562, lon: 8.5678 }, { name: "Airolo", lat: 46.5333, lon: 8.6167 }],
    source: W('Gotthard_Pass'),
    photo: { file: "Tremola_on_the_Gotthard_Pass.jpg", author: "Samuel Ferrara", ...BYSA4, page: C("Tremola_on_the_Gotthard_Pass.jpg") },
  },
  {
    id: 'greatocean', name: "Great Ocean Road", country: 'au', region: "Victoria", kind: 'coast', lengthKm: 240,
    text: { de: "Küstenstraße im Südosten Australiens, von Kriegsheimkehrern gebaut, mit Zugang zu den Twelve Apostles.", en: "Coastal road in south-eastern Australia, built by returned soldiers, with access to the Twelve Apostles." },
    facts: [{ de: "240 km zwischen Torquay und Allansford", en: "240 km between Torquay and Allansford" }, { de: "Gebaut 1919 bis 1932 von heimgekehrten Soldaten", en: "Built 1919–1932 by returned soldiers" }, { de: "Gilt als größtes Kriegsdenkmal der Welt", en: "Regarded as the world’s largest war memorial" }],
    waypoints: [{ name: "Torquay", lat: -38.3333, lon: 144.3167 }, { name: "Lorne", lat: -38.5333, lon: 143.9667 }, { name: "Apollo Bay", lat: -38.75, lon: 143.65 }, { name: "Allansford", lat: -38.3861, lon: 142.5931 }],
    source: W('Great_Ocean_Road'),
    photo: { file: "Island_Archway,_Great_Ocean_Rd,_Victoria,_Australia_-_Nov_08.jpg", author: "Diliff", ...BYSA3, page: C("Island_Archway,_Great_Ocean_Rd,_Victoria,_Australia_-_Nov_08.jpg") },
  },
  {
    id: 'icefields', name: "Icefields Parkway", country: 'ca', region: "Alberta", kind: 'scenic',
    text: { de: "Panoramastraße durch die Nationalparks Banff und Jasper, vorbei am Columbia Icefield.", en: "Scenic highway through Banff and Jasper National Parks, past the Columbia Icefield." },
    facts: [{ de: "Teil des Alberta Highway 93", en: "Part of Alberta Highway 93" }, { de: "Führt durch die Nationalparks Banff und Jasper", en: "Runs through Banff and Jasper National Parks" }, { de: "Unterhalten von Parks Canada", en: "Maintained by Parks Canada" }],
    waypoints: [{ name: "Lake Louise", lat: 51.4253, lon: -116.1806 }, { name: "Columbia Icefield", lat: 52.1572, lon: -117.3139 }, { name: "Jasper", lat: 52.8731, lon: -118.0822 }],
    source: W('Alberta_Highway_93'),
    photo: { file: "Winding_road_in_the_Icefields_Parkway_(33798244575).jpg", author: "m01229 from USA", ...BYSA2, page: C("Winding_road_in_the_Icefields_Parkway_(33798244575).jpg") },
  },
  {
    id: 'dragon', name: "Tail of the Dragon (US 129)", country: 'us', region: "North Carolina · Tennessee", kind: 'touge', lengthKm: 18,
    text: { de: "Kurvenreiche Strecke der US 129 über den Deals Gap an der Grenze von North Carolina und Tennessee, beliebt bei Sportwagen- und Motorradfahrern.", en: "Twisty stretch of US 129 over Deals Gap on the North Carolina–Tennessee line, popular with sports car and motorcycle drivers." },
    facts: [{ de: "318 Kurven auf 18 km (11 Meilen)", en: "318 curves in 18 km (11 miles)" }, { de: "Deals Gap liegt auf 606 m", en: "Deals Gap sits at 606 m" }],
    waypoints: [{ name: "Deals Gap", lat: 35.4737, lon: -83.9207 }, { name: "Tallassee", lat: 35.5467, lon: -84.06 }],
    source: W('Deals_Gap,_North_Carolina'),
    photo: { file: "Tail_of_the_Dragon_2.jpg", author: "William Klos from Mason, US", ...BY2, page: C("Tail_of_the_Dragon_2.jpg") },
  },
  {
    id: 'jebeljais', name: "Jebel Jais Road", country: 'ae', region: "Ras al-Chaima", kind: 'pass',
    text: { de: "Bergstraße hinauf in das Hadschar-Gebirge, zum höchsten Punkt der Vereinigten Arabischen Emirate.", en: "Mountain road up into the Hajar range, towards the highest point of the United Arab Emirates." },
    facts: [{ de: "Gipfel des Jebel Jais 1.934 m (auf omanischer Seite)", en: "Jebel Jais summit 1,934 m (on the Omani side)" }, { de: "Höchster Punkt der VAE: 1.892 m", en: "Highest point in the UAE: 1,892 m" }],
    waypoints: [{ name: "Ras al-Chaima", lat: 25.7886, lon: 55.9431 }, { name: "Jebel Jais", lat: 25.9531, lon: 56.1842 }],
    source: W('Jebel_Jais'),
    photo: { file: "Jebel_Jais_road_II.jpg", author: "Montaserarqob", ...BYSA4, page: C("Jebel_Jais_road_II.jpg") },
  },
  {
    id: 'turini', name: "Col de Turini", country: 'fr', region: "Alpes-Maritimes", kind: 'pass', highestM: 1607,
    text: { de: "Passstraße in den Seealpen oberhalb von Nizza, Verbindung zwischen Vésubie- und Bévéra-Tal.", en: "Pass road in the Maritime Alps above Nice, linking the Vésubie and Bévéra valleys." },
    facts: [{ de: "Passhöhe 1.607 m", en: "Summit 1,607 m" }, { de: "Verbindet La Bollène-Vésubie und Sospel", en: "Links La Bollène-Vésubie and Sospel" }],
    waypoints: [{ name: "La Bollène-Vésubie", lat: 43.9906, lon: 7.3317 }, { name: "Col de Turini", lat: 43.9778, lon: 7.3917 }, { name: "Sospel", lat: 43.8781, lon: 7.4492 }],
    source: W('Col_de_Turini'),
    photo: { file: "Col_de_Turini_06-_Since_Camp_d'Argent_road.jpg", author: "Anthospace", ...BYSA4, page: C("Col_de_Turini_06-_Since_Camp_d'Argent_road.jpg") },
  },
  {
    id: 'bealach', name: "Bealach na Bà", country: 'uk', region: "Wester Ross, Schottland", kind: 'pass', highestM: 630,
    text: { de: "Einspurige Passstraße auf der Halbinsel Applecross mit Haarnadelkurven wie in den Alpen.", en: "Single-track pass road on the Applecross peninsula with Alpine-style hairpins." },
    facts: [{ de: "Gebaut 1822", en: "Built in 1822" }, { de: "Größter Anstieg einer Straße in Großbritannien: von Meereshöhe auf 630 m in etwa 6 km", en: "Greatest ascent of any road in the UK: from sea level to 630 m in about 6 km" }, { de: "Steigungen bis fast 20 %", en: "Gradients approaching 20 %" }],
    waypoints: [{ name: "Kishorn", lat: 57.386, lon: -5.636 }, { name: "Bealach na Bà", lat: 57.4328, lon: -5.7525 }, { name: "Applecross", lat: 57.433, lon: -5.8096 }],
    source: W('Bealach_na_Bà'),
    photo: { file: "Bealach_na_ba.jpg", author: "Jooniur", ...BYSA4, page: C("Bealach_na_ba.jpg") },
  },
  {
    id: 'milford', name: "Milford Road", country: 'nz', region: "Fiordland", kind: 'scenic', lengthKm: 119, highestM: 940,
    text: { de: "Gebirgsstraße durch das Fiordland von Te Anau zum Milford Sound, durch den Homer-Tunnel.", en: "Mountain road through Fiordland from Te Anau to Milford Sound, through the Homer Tunnel." },
    facts: [{ de: "119 km von Te Anau bis Milford Sound", en: "119 km from Te Anau to Milford Sound" }, { de: "Höchster Punkt 940 m", en: "Highest point 940 m" }, { de: "Quert den Hauptkamm der Südalpen", en: "Crosses the Main Divide of the Southern Alps" }],
    waypoints: [{ name: "Te Anau", lat: -45.4167, lon: 167.7167 }, { name: "Homer Tunnel", lat: -44.7643, lon: 167.9896 }, { name: "Milford Sound", lat: -44.6481, lon: 167.9056 }],
    source: W('State_Highway_94_(New_Zealand)'),
    photo: { file: "Milford_Road_east_of_Homer_Saddle,_New_Zealand_(22).jpg", author: "Michal Klajban", ...BYSA4, page: C("Milford_Road_east_of_Homer_Saddle,_New_Zealand_(22).jpg") },
  },
]

// Weitere Straßen und Rennstrecken: Kurztexte aus Wikipedia (CC BY-SA 4.0), siehe DATA_SOURCES.md
export const ROADS: Road[] = [...BASE_ROADS, ...(more as Road[])]

export const ROAD_KINDS: Record<Road['kind'], { de: string; en: string }> = {
  pass: { de: 'Passstraße', en: 'Mountain pass' },
  coast: { de: 'Küste & Brücken', en: 'Coast & bridges' },
  touge: { de: 'Tōge', en: 'Tōge' },
  expressway: { de: 'Stadtautobahn', en: 'Expressway' },
  track: { de: 'Rennstrecke', en: 'Race track' },
  scenic: { de: 'Panoramastraße', en: 'Scenic road' },
}

export const ROADS_RETRIEVED = '24.11.2026'
