// Typische Schwachstellen ausgewählter Kultmodelle. Jeder Punkt ist sinngemäß aus den verlinkten Kaufberatungen
// zusammengefasst (gelesen über die Websuche am 25.11.2026, eigene Worte, keine Zitate). Die Ratgeber beschreiben
// Erfahrungswerte, keine Ausfallquoten: ob ein einzelnes Auto betroffen ist, klärt nur die Besichtigung.
type Tx = { de: string; en: string }
export type WeakSource = { label: string; url: string }
export type WeakSpots = { match: string[]; /** Generation, für die die Punkte gelten */ scope: string; points: Tx[]; sources: WeakSource[] }

const p = (de: string, en: string): Tx => ({ de, en })
const s = (label: string, url: string): WeakSource => ({ label, url })

/** match: Katalog-IDs der Klassiker (c-…) oder Wikipedia-Titel des Katalogmodells */
export const WEAKSPOTS: WeakSpots[] = [
  {
    match: ['c-a80'], scope: 'A80 (1993–2002)',
    points: [
      p('Rost an Heckklappen-Lippe und hinteren Seitenteilen; frischer Unterbodenschutz kann ihn verdecken', 'Rust at the hatch lip and rear quarters; fresh underseal can hide it'),
      p('Sequenzielle Turbos: Übergang vom ersten zum zweiten Turbo auf der Probefahrt prüfen', 'Sequential turbos: check the transition from first to second turbo on the test drive'),
      p('V160-Getriebe: Synchronringe im 2. und 3. Gang', 'V160 gearbox: synchros in 2nd and 3rd gear'),
      p('Umbauten mit erhöhtem Ladedruck nur mit Belegen', 'Modifications with raised boost only with paperwork'),
    ],
    sources: [s('Classics World', 'https://classicsworld.co.uk/guides/toyota-supra-a80-buyers-guide/'), s('Classic & Sports Car', 'https://classicandsportscar.com/node/62237')],
  },
  {
    match: ['c-fd'], scope: 'FD3S (1992–2002)',
    points: [
      p('Apex-Dichtleisten: Kompressionstest beim Wankel-Spezialisten vor dem Kauf', 'Apex seals: compression test at a rotary specialist before buying'),
      p('Kühlsystem: Luftabscheider-Behälter kann reißen und Kühlmittel verlieren', 'Cooling: the air-separator tank can split and leak coolant'),
      p('Unterdruckschläuche der Turbosteuerung verhärten durch die Hitze im Motorraum', 'Vacuum hoses of the turbo control harden in the hot engine bay'),
      p('32 Fahrwerksbuchsen altern; rauer 5. Gang möglich', '32 suspension bushes age; a rough 5th gear is possible'),
    ],
    sources: [s('Fast Car', 'https://www.fastcar.co.uk/tuning-tech-guides/mazda-rx-7-fd-buyers-guide/'), s('PistonHeads', 'https://pistonheads.com/news/ph-buying-guide-contents/mazda-rx-7-buying-guide-at-a-glance/36924')],
  },
  {
    match: ['c-r34'], scope: 'R34',
    points: [
      p('GT-R: durchgebrannte Zündspulen und gerissene Unterdruckleitungen', 'GT-R: failed coil packs and split vacuum lines'),
      p('Gang springt heraus, vor allem der erste', 'Gearbox popping out of gear, first in particular'),
      p('Fehler am Multifunktions-Display', 'Faulty multi-function display'),
      p('Rost in Falzen und Vertiefungen', 'Rust in seams and recesses'),
    ],
    sources: [s('Fast Car', 'https://www.fastcar.co.uk/tuning-tech-guides/nissan-skyline-gt-r-r34-buyers-guide/')],
  },
  {
    match: ['c-r32'], scope: 'R32 GT-R',
    points: [p('RB26: Ausfall der Ölpumpe, besonders bei Leistungssteigerung klären, ob sie ersetzt wurde', 'RB26: oil pump failure; ask if it was replaced, especially on tuned cars'), p('Serien-Turbolader können versagen', 'Original turbochargers can fail')],
    sources: [s('Fast Car', 'https://www.fastcar.co.uk/tuning-tech-guides/nissan-skyline-gt-r-r32-buyers-guide/'), s('PistonHeads', 'https://www.pistonheads.com/news/ph-buying-guides/nissan-skyline-gt-r-r32--ph-used-buying-guide/39095')],
  },
  {
    match: ['c-s15', 'c-180sx', 'Nissan_Silvia', 'Nissan_180SX'], scope: 'S13–S15',
    points: [
      p('SR20DET: verschlissene Nockenwelle bei versäumten Ölwechseln', 'SR20DET: camshaft wear when oil changes were skipped'),
      p('Undichte Turbo-Dichtungen und Auspuffkrümmer', 'Leaking turbo gaskets and exhaust manifold'),
      p('Unfallschäden sind häufig: Längsträger und Spaltmaße genau prüfen', 'Crash damage is common: check rails and panel gaps closely'),
      p('Rost und Motor-Umbauten bestimmen bei S13/S14 den Wert', 'On S13/S14, rust and engine swaps decide the value'),
    ],
    sources: [s('Auto Express (S14)', 'https://autoexpress.co.uk/nissan/104944/nissan-200sxsilvia-s14-buying-guide-and-review-1995-2000'), s('Unique Cars', 'https://www.pressreader.com/australia/unique-cars/20180524/283270278426110')],
  },
  {
    match: ['c-z32', 'Nissan_300ZX'], scope: 'Z32',
    points: [
      p('Einspritzdüsen sind die am häufigsten gemeldete Schwachstelle', 'Fuel injectors are the most reported fault'),
      p('Hitze im engen Motorraum: spröde Kunststoffe, Kabelbäume und PCV-Ventile', 'Heat in the tight engine bay: brittle plastics, wiring and PCV valves'),
      p('Gelenke und Mittellager der Kardanwelle', 'Driveshaft joints and centre bearing'),
      p('Super-HICAS (Allradlenkung) wurde oft stillgelegt: nachfragen', 'Super HICAS (rear steer) was often deleted: ask'),
    ],
    sources: [s('SlashGear', 'https://www.slashgear.com/1157212/everything-you-should-know-before-buying-a-nissan-300zx'), s('Hagerty UK', 'https://www.hagerty.co.uk/articles/buying-guide-1990-96-nissan-300zx/'), s('carsales', 'https://www.carsales.com.au/editorial/details/used-car-advice-nissan-z32-300zx-1989-97-7453')],
  },
  {
    match: ['c-jzx100', 'Toyota_Chaser'], scope: 'JZX100',
    points: [p('1JZ-GTE gilt als robust: Kühlung, Buchsen und gealterte Verkabelung einplanen', 'The 1JZ-GTE is considered robust: budget for cooling, bushings and ageing wiring'), p('Rostfreie Karosserien werden selten; Herkunft Japan schützt nicht vor Streusalz', 'Rust-free shells are getting rare; Japanese origin is no proof against road salt')],
    sources: [s('JDMBUYSELL', 'https://www.jdmbuysell.com/learn/toyota/chaser/x100/')],
  },
  {
    match: ['c-ap1', 'Honda_S2000'], scope: 'AP1',
    points: [
      p('AP1: Ölmangel kann die Pleuellager zerstören; Ölstand und Ölverbrauch klären', 'AP1: oil starvation can destroy rod bearings; check level and consumption'),
      p('Überdrehen: Schäden an den Ventilfedertellern', 'Over-revving: damaged valve spring retainers'),
      p('Frühe Autos: 2., 4. oder 6. Gang springt heraus', 'Early cars: popping out of 2nd, 4th or 6th gear'),
      p('Verdeck auf Risse prüfen, vordere Querlenker auf Spiel', 'Check the soft top for tears and the front lower arms for play'),
    ],
    sources: [s('s2000.club', 'https://s2000.club/buyingused.html'), s('Rush Magazine', 'https://www.rushmagazine.co.uk/post/honda-s2000-buying-guide'), s('Hagerty UK', 'https://www.hagerty.co.uk/articles/buying-guide-1999-2010-honda-s2000/')],
  },
  {
    match: ['c-sw20', 'Toyota_MR2'], scope: 'SW20',
    points: [
      p('Lange Kühlmittelrohre unter dem Auto rosten durch', 'Long coolant pipes under the car corrode through'),
      p('T-Dach undicht: Teppich und Bodenblech auf Feuchtigkeit prüfen', 'Leaking T-bar roof: check carpets and floor for damp'),
      p('Rost an Schwellern, Radläufen, Boden und hinterem Hilfsrahmen', 'Rust on sills, arches, floors and around the rear subframe'),
      p('Ölverlust nahe der Lichtmaschine; Turbo leidet unter Hitze', 'Oil leaks near the alternator; the turbo suffers from heat soak'),
    ],
    sources: [s('Car Throttle', 'https://www.carthrottle.com/news/9-things-you-need-know-buying-sw20-toyota-mr2'), s('Classics World', 'https://classicsworld.co.uk/guides/toyota-mr2-mk2-sw20-buyers-guide/')],
  },
  {
    match: ['c-na1', 'Honda_NSX', 'Honda_NSX_(first_generation)'], scope: 'NA1/NA2',
    points: [
      p('Zahnriemen und Wasserpumpe: Nachweis verlangen', 'Timing belt and water pump: ask for proof'),
      p('ABS-Pumpe summt lange nach dem Start: frühes System braucht Service', 'ABS pump buzzing long after start-up: early system needs service'),
      p('Spaltmaße: ungleiche Fugen deuten auf Unfall; die Aluminium-Karosserie reparieren nur wenige Betriebe', 'Panel gaps: uneven gaps suggest a crash; few shops repair the aluminium body'),
    ],
    sources: [s('PistonHeads: Antrieb', 'https://www.pistonheads.com/news/ph-buying-guide-contents/honda-nsx-buying-guide-powertrain/25298'), s('PistonHeads: Karosserie', 'https://www.pistonheads.com/news/ph-buying-guide-contents/honda-nsx-buying-guide-body/25300'), s('JDMBUYSELL', 'https://www.jdmbuysell.com/learn/honda/nsx/na1/')],
  },
  {
    match: ['c-lc80', 'Toyota_Land_Cruiser_(J80)'], scope: 'J80',
    points: [
      p('Diesel: Pleuellager (Big-End) prüfen lassen', 'Diesels: have the big end bearings checked'),
      p('Risse am Rahmen um das Lenkgetriebe, undichte Servolenkung, Radbolzen hinten', 'Chassis cracks at the steering box, power steering leaks, rear axle studs'),
      p('Früher Benziner 1FZ-FE (vor 1995): Zylinderkopfdichtung', 'Early 1FZ-FE petrol (before 1995): head gasket'),
    ],
    sources: [s('Unsealed 4X4', 'https://unsealed4x4.com.au/toyota-landcruiser-80-series-common-problems-solutions/'), s('JDMBUYSELL', 'https://www.jdmbuysell.com/learn/toyota/land-cruiser/j80/')],
  },
  {
    match: ['c-evo6', 'Mitsubishi_Lancer_Evolution'], scope: 'Evo VI',
    points: [
      p('AYC-Differenzial: regelmäßiger Service mit der richtigen Flüssigkeit', 'AYC differential: regular service with the correct fluid'),
      p('Rost an Längsträgern und Radläufen', 'Rust on chassis legs and wheel arches'),
      p('Zahnriemen-Wechsel belegt (Autocar nennt 40.000 Meilen), Kaltstart anhören', 'Cambelt change documented (Autocar quotes 40,000 miles), listen to a cold start'),
      p('Verhärtete hintere Buchsen, verschlissene Bremsen', 'Perished rear bushes, worn brakes'),
    ],
    sources: [s('Autocar', 'https://www.autocar.co.uk/node/338950/reliability'), s('JDMBUYSELL', 'https://www.jdmbuysell.com/learn/mitsubishi/lancer-evo/cp9a/')],
  },
  {
    match: ['c-mustang', 'Ford_Mustang_(first_generation)'], scope: '1965–1968',
    points: [
      p('Torque-Boxen zwischen Längsträger und Boden: tragend, teuer zu reparieren', 'Torque boxes between rails and floor: structural and expensive to fix'),
      p('Cowl (Wasserkasten) unter der Frontscheibe rostet und lässt Wasser ein', 'The cowl below the windscreen rusts and leaks'),
      p('Längsträger und Federbeindome auf Durchrostung und Falten (Unfall) prüfen', 'Check frame rails and shock towers for rot and ripples (crash)'),
      p('Alte Reparaturbleche und Spachtel suchen', 'Look for old patches and filler'),
    ],
    sources: [s('Classic & Sports Car', 'https://www.classicandsportscar.com/node/100065'), s('Goodwood', 'https://insurance.goodwood.com/buyers-guide/ford-mustang/'), s('Petrolicious', 'https://petrolicious.com/ford-mustang-buying-guide')],
  },
  {
    match: ['c-c2', 'Chevrolet_Corvette_(C2)'], scope: 'C2 (1963–1967)',
    points: [
      p('Rahmen an der hinteren Aufkröpfung, wo die Längslenker sitzen', 'Frame at the rear kick-up where the trailing arms mount'),
      p('Stahlgerüst („Birdcage“) unter der Kunststoffhaut: Scheibenecken und Türsäulen', 'Steel “birdcage” under the fibreglass: windscreen corners and door pillars'),
      p('VIN und Trim-Tag unverändert? „Numbers matching“ nur mit Belegen glauben', 'VIN and trim tag untouched? Believe “numbers matching” only with proof'),
    ],
    sources: [s('LSX Magazine', 'https://www.lsxmag.com/features/the-corvette-online-c2-buyers-guide/'), s('Classic Motorsports', 'https://classicmotorsports.com/articles/1963-67-chevrolet-corvette-buyers-guide'), s('Corvette Forum', 'https://www.corvetteforum.com/forums/c1-and-c2-corvettes/4216034-going-to-look-at-a-c2-63-a.html')],
  },
  {
    match: ['c-bronco', 'Ford_Bronco'], scope: '1966–1977',
    points: [
      p('Rost an Bodenblech, Schwellern, Türsäulen und Karosserielagern', 'Rust on floor pans, rockers, door posts and body mounts'),
      p('Cowl von unten (hinter dem Armaturenbrett) ansehen', 'Inspect the cowl from below (behind the dash)'),
      p('Rahmenrost; versteckte Reparaturen wie Boden auf Boden geschweißt', 'Frame rust; hidden repairs such as a floor welded over the old floor'),
    ],
    sources: [s('CJ Pony Parts', 'https://www.cjponyparts.com/resources/bronco-buying-guide'), s('Velocity Restorations', 'https://velocityrestorations.com/blog/classic-ford-bronco-buyers-guide'), s('ClassicBroncos', 'https://classicbroncos.com/forums/threads/what-to-look-for-when-buying-your-eb.86541/')],
  },
  {
    match: ['c-c10'], scope: '1967–1972',
    points: [
      p('Schweller und hintere Kabinenecken sind fast immer betroffen, auch die inneren Schweller', 'Rockers and cab corners are almost always affected, inner rockers too'),
      p('Cowl, Spritzwand, Regenrinnen, Kotflügel und Türen unten', 'Cowl, firewall, drip rails, lower fenders and doors'),
      p('Oberflächenrost ist beherrschbar, Rost am Rahmen nicht', 'Surface rust is manageable, structural rust is not'),
    ],
    sources: [s('Speedway Motors', 'https://speedwaymotors.com/the-toolbox/67-72-c10-rust-repair-cab-floor-and-rocker-panel-replacement/105134'), s('CJ Pony Parts', 'https://www.cjponyparts.com/resources/buying-a-used-c10')],
  },
  {
    match: ['c-charger', 'Dodge_Charger_(1966)'], scope: '1968–1970',
    points: [p('Rost um die Heckscheibe, am Kofferraumboden und an den Längsträgern', 'Rust around the rear window, trunk floor and frame rails'), p('Cowl-Abläufe und Bereich hinter den Radhäusern', 'Cowl drains and the area behind the wheel wells'), p('Türen, Türpfosten, Schweller und Dachhaut abklopfen', 'Check doors, jambs, rockers and roof skin')],
    sources: [s('The Drive', 'https://www.thedrive.com/features/1969-dodge-charger-project-car.md'), s('For B Bodies Only', 'https://www.forbbodiesonly.com/moparforum/threads/buying-a-68-charger-what-to-look-for.88503'), s('Hagerty', 'https://www.hagerty.com/media/?p=4550')],
  },
  {
    match: ['c-camaro', 'Chevrolet_Camaro_(first_generation)'], scope: '1967–1969',
    points: [
      p('Bodenbleche (Fahrerseite, unter dem Teppich) und Kofferraumboden', 'Floor pans (driver’s side, under the carpet) and trunk floor'),
      p('Verschraubung von Hilfsrahmen und Karosserie', 'Where the subframe bolts to the body'),
      p('Z/28 und SS werden oft gefälscht: Cowl-Tag entschlüsseln; beides zusammen gab es nicht', 'Z/28 and SS are often faked: decode the cowl tag; the two were never combined'),
    ],
    sources: [s('Wilson Auto', 'https://wilsonauto.com/classic-camaro-buyers-guide-what-to-look-for/'), s('SlashGear', 'https://www.slashgear.com/1488172/things-to-know-before-buying-classic-chevrolet-camaro'), s('Classic Industries', 'https://news.classicindustries.com/restoring-a-1969-z/28-camaro-selection-and-planning')],
  },
  {
    match: ['c-transam', 'Pontiac_Firebird_(second_generation)'], scope: '1970–1981',
    points: [
      p('Bodenbleche unter dem Teppich, hintere Federaufnahmen und Kofferraum', 'Floors under the carpet, rear suspension mounts and trunk'),
      p('Seitenteile von der Kofferraumseite auf genietete Flicken prüfen, Magnet gegen Spachtel', 'Check quarters from inside the trunk for riveted patches; use a magnet for filler'),
      p('Versteckte VIN-Prägungen mit dem Titel vergleichen (Nachbauten)', 'Match hidden VIN stamps with the title (clones)'),
    ],
    sources: [s('Hagerty', 'https://hagerty.com/media/market-trends/hagerty-insider/your-handy-1970-81-pontiac-firebird-buyers-guide/comment-page-2'), s('firstgenfirebird.org (1. Generation)', 'https://firstgenfirebird.org/faqs/buying-a-first-generation-firebird'), s('Grassroots Motorsports', 'https://grassrootsmotorsports.com/forum/grm/talk-me-down-mullet-content-2nd-gen-f-body/98508/page1')],
  },
  {
    match: ['c-wagoneer', 'Jeep_Wagoneer_(SJ)'], scope: 'SJ',
    points: [p('V8: Ölverlust, vor allem am hinteren Kurbelwellendichtring; Ärger mit der Motorcraft-Zündung', 'V8: oil leaks, mainly the rear main seal; Motorcraft ignition trouble'), p('Rost unter dem Teppich der Fahrerseite und an den Schwellern', 'Rust under the driver’s carpet and on the rockers'), p('Motor des Heckwischers kann festgehen', 'The rear wiper motor can seize')],
    sources: [s('Hagerty', 'https://www.hagerty.com/media/?p=6853'), s('YourMechanic', 'https://www.yourmechanic.com/article/how-to-choose-a-jeep-grand-wagoneer-by-jason-unrau')],
  },
  {
    match: ['c-griffith', 'TVR_Griffith'], scope: 'Griffith 400/500',
    points: [
      p('Rahmen rostet von innen: Ausleger, untere Rohre und der Bereich unter den Krümmern', 'Chassis rusts from within: outriggers, lower rails and below the manifolds'),
      p('5.0: Nockenwelle verschleißt, Austausch etwa alle 40.000–50.000 Meilen, Motor muss raus', '5.0: camshaft wear, replacement roughly every 40,000–50,000 miles with the engine out'),
      p('Unfallschäden an Karosserie und Rahmen sind häufig', 'Crash damage to body and chassis is common'),
      p('Wassereinbruch: feuchte Teppiche, beschlagene Instrumente', 'Water ingress: damp carpets, misted instruments'),
    ],
    sources: [s('Octane', 'https://www.octane-magazine.com/articles/buying-guides/tvr-griffith-buying-guide-history-and-model-review/'), s('PistonHeads', 'https://www.pistonheads.com/news/ph-buying-guides/tvr-griffith-ph-used-buying-guide/37141'), s('Classics World', 'https://classicsworld.co.uk/guides/tvr-griffith-buyers-guide/')],
  },
  {
    match: ['c-sierra', 'Ford_Sierra_RS_Cosworth'], scope: 'RS Cosworth',
    points: [
      p('Zylinderkopfdichtung durch Korrosion im Motor: Kühlmittel an der Auspuffseite, Kompressionstest', 'Head gasket failure from internal corrosion: coolant on the exhaust side, compression test'),
      p('T5-Getriebe: Synchronringe im 2. und 3. Gang', 'T5 gearbox: synchros in 2nd and 3rd'),
      p('Zahnriemen alle 30.000 Meilen oder 5 Jahre', 'Cambelt every 30,000 miles or five years'),
      p('Klone, zusammengeschweißte und zurückgedrehte Autos: Historie prüfen', 'Clones, cut-and-shuts and clocked cars: verify the history'),
    ],
    sources: [s('Classic & Sports Car', 'https://classicandsportscar.com/features/buyers-guide-ford-sierra-rs-cosworth'), s('Classics World', 'https://classicsworld.co.uk/news/ford-cosworth-buyers-guide/'), s('Fast Car', 'https://fastcar.co.uk/tuning-tech-guides/sierra-rs-cosworth-buyers-guide/')],
  },
  {
    match: ['c-esprit', 'Lotus_Esprit'], scope: 'Esprit',
    points: [
      p('Zahnriemen etwa alle 25.000 Meilen', 'Timing belt about every 25,000 miles'),
      p('Renault-Getriebe: 1. und 2. Gang synchronisieren zuerst nicht mehr', 'Renault gearbox: 1st and 2nd synchros go first'),
      p('Kühler rosten, Lüfter gehen fest', 'Radiators rot and fans seize'),
      p('Standzeiten: korrodierte Kontakte, festsitzende Bremssättel', 'Long storage: corroded contacts, sticking calipers'),
    ],
    sources: [s('Classic & Sports Car', 'https://www.classicandsportscar.com/node/47607'), s('Sports Car Market', 'https://www.sportscarmarket.com/?p=1079'), s('lotusespritturbo.com', 'https://lotusespritturbo.com/Lotus_Esprit_Buyers_Guide.htm')],
  },
  {
    match: ['c-monaro', 'Holden_Monaro'], scope: 'HK–HQ',
    points: [p('Rost hat viele HQ vernichtet; Wassereinbruch ist teuer zu beheben', 'Rust killed many HQs; water entry is expensive to fix'), p('Sitzbefestigungen auf Rost und lose Schrauben prüfen', 'Check seat mounts for rust and loose bolts'), p('Echte GTS 350 sind selten, ersetzte Motoren häufig: Nummern prüfen', 'Factory GTS 350s are scarce, replacement engines common: check the numbers')],
    sources: [s('Retro Rides', 'https://retrorides.com.au/buyers-guides/top-tips-for-buying-a-used-holden-monaro-hq-gts-1971-74/'), s('Unique Cars', 'https://www.pressreader.com/australia/unique-cars-9GON/20191205/282570199967410')],
  },
  {
    match: ['c-xbgt'], scope: 'XA–XC',
    points: [p('Rost: Längsträger, Federbeindome, Spritzwand-Nähte; der Cowl leitet Wasser und Schmutz ein', 'Rust: chassis rails, shock towers, firewall seams; the cowl channels water and dirt'), p('Hardtops sind stärker betroffen als Limousinen', 'Hardtops suffer more than sedans'), p('GT und Hardtop werden oft kopiert: jede GT-Angabe belegen lassen', 'GTs and hardtops are often cloned: have every GT claim proven')],
    sources: [s('Aussie Fords: Ratgeber XA–XC', 'https://aussiefords.com/?p=2904'), s('Aussie Fords: XB', 'https://aussiefords.com/?p=269'), s('Retro Rides', 'https://retrorides.com.au/originals/top-tips-for-buying-a-used-ford-falconfairmont-xa-xc-1972-79')],
  },
  {
    match: ['c-torana', 'Holden_Torana'], scope: 'LH / LX',
    points: [p('LX: Rost an Schwellern, A-Säulen und Scheibenrahmen', 'LX: rust in sills, front pillars and windscreen surround'), p('LX Hatch: Heckdichtung lässt Wasser und Abgase herein', 'LX hatch: the seal lets in water and exhaust fumes'), p('SL/R 5000 wird häufig kopiert: Torana-Fachleute hinzuziehen', 'The SL/R 5000 is widely copied: ask a Torana expert')],
    sources: [s('Retro Rides', 'https://retrorides.com.au/buyers-guides/top-tips-for-buying-a-used-holden-torana-lx-ss-v8-hatch-1976-78'), s('Unique Cars and Parts', 'https://uniquecarsandparts.com.au/holden_torana_identification_guide')],
  },
  {
    match: ['Mazda_MX-5_(NA)', 'Mazda_MX-5'], scope: 'NA',
    points: [p('NA: Rost ist das Hauptproblem, vor allem hintere Schweller und Radläufe', 'NA: rust is the main issue, mainly rear sills and arches'), p('Verstopfte Abläufe lassen Schweller von innen rosten', 'Blocked drains rot the sills from inside'), p('Batteriekasten und Kofferraumboden; frischer Unterbodenschutz nur mit Fotos der Reparatur', 'Battery tray and boot floor; fresh underseal only with photos of the repair')],
    sources: [s('Goodwood', 'https://insurance.goodwood.com/buyers-guide/mazda-mx-5-na/'), s('Octane', 'https://www.octane-magazine.com/articles/buying-guides/mazda-mx-5-mk1-na-buying-guide-history-and-model-review/'), s('Hagerty UK', 'https://hagerty.co.uk/articles/buyers-guide-mazda-mx-5-mk1-1989-1998')],
  },
  {
    match: ['Lancia_Delta', 'Lancia_Delta_Integrale'], scope: 'HF Integrale',
    points: [p('Integrale: Spannungsrisse an A-Säulen, Scheibenrahmen und Türunterkante', 'Integrale: stress cracks at A-pillars, screen surround and door bases'), p('Rost von innen nach außen: Radläufe, Schweller, hinterer Hilfsrahmen, Boden, vordere Längsträger', 'Rust from inside out: arches, sills, rear subframe, floor, front chassis legs'), p('Zahnriemen-Wechsel belegt', 'Cambelt change documented')],
    sources: [s('Classics World', 'https://classicsworld.co.uk/guides/lancia-delta-integrale-buyers-guide'), s('PistonHeads', 'https://www.pistonheads.com/news/ph-buying-guides/lancia-delta-hf-integrale-ph-used-buying-guide/38862'), s('Classic & Sports Car', 'https://www.classicandsportscar.com/node/48912')],
  },
  {
    match: ['BMW_M3_(E46)', 'BMW_M3'], scope: 'E46',
    points: [p('E46: Risse im hinteren Achsträgerblech, auch versteckt hinter den Buchsen', 'E46: cracks in the rear axle carrier panel, sometimes hidden by the bushings'), p('Pleuellager: Rückruf der Baujahre 2001–2003 erledigt?', 'Rod bearings: was the 2001–2003 recall carried out?'), p('VANOS: Magnetventile und Nasen der Nockenwellennabe', 'VANOS: solenoids and cam hub tabs'), p('SMG: Pumpe des Schaltsystems', 'SMG: shift pump')],
    sources: [s('ECS Tuning', 'https://blog.ecstuning.com/most-common-bmw-e46-m3-problems/'), s('Classic & Sports Car', 'https://classicandsportscar.com/node/49004'), s('BMWBLOG', 'https://www.bmwblog.com/2022/10/13/e46-m3-buyers-guide/')],
  },
  {
    match: ['Porsche_911_(964)'], scope: '964',
    points: [p('Ölverlust: Ursache und Menge genau klären', 'Oil leaks: establish cause and severity'), p('Frühe Autos: Riemen im Doppelzündungs-Verteiler', 'Early cars: belt in the dual-ignition distributor'), p('Zweimassenschwungrad der frühen Schaltwagen', 'Dual-mass flywheel of early manuals'), p('Rost an den unteren Scheibenecken', 'Rust at the lower windscreen corners')],
    sources: [s('Hagerty UK', 'https://www.hagerty.co.uk/articles/buying-guide-porsche-964-1989-1993/'), s('Classic & Sports Car', 'https://classicandsportscar.com/features/buyers-guide-porsche-911-964'), s('Classics World', 'https://classicsworld.co.uk/guides/porsche-911-964-buyers-guide/')],
  },
  {
    match: ['Subaru_Impreza', 'Subaru_Impreza_WRX', 'Subaru_Impreza_(first_generation)'], scope: 'GC8',
    points: [p('GC8: Rost an hinteren Seitenteilen, Federbeindomen, Schwellernähten und Türkanten', 'GC8: rust at rear quarters, strut towers, sill seams and door edges'), p('Hakeliges Getriebe, Synchronringe; Kupplung rupft kalt', 'Notchy gearbox, synchros; clutch judder when cold'), p('Turbo: Kompressionstest vor dem Kauf', 'Turbo: compression test before buying')],
    sources: [s('Goodwood', 'https://insurance.goodwood.com/subaru-impreza-buyers-guide/'), s('Fast Car', 'https://www.fastcar.co.uk/tuning-tech-guides/subaru-impreza-wrx-sti-gc8-buying-guide/')],
  },
  {
    match: ['Audi_Quattro'], scope: 'Ur-Quattro',
    points: [p('Auspuffkrümmer reißt: Klicken beim Kaltstart', 'Exhaust manifold cracks: clicking when cold'), p('Rost an Schwellern, Türkanten und Radläufen', 'Rust on sills, door edges and arches'), p('Frühe Autos: korrodierte Kontakte, Turboschäden', 'Early cars: corroded connections, turbo trouble'), p('Teileversorgung ist teils schwierig (z. B. Leuchten)', 'Parts supply can be difficult (e.g. lights)')],
    sources: [s('Classic & Sports Car', 'https://classicandsportscar.com/node/68658'), s('Classics World', 'https://classicsworld.co.uk/guides/audi-quattro-buyers-guide/'), s('Goodwood', 'https://insurance.goodwood.com/buyers-guide/audi-quattro/')],
  },
]

export const weakSpotsFor = (m: { id: string; wp?: string }) => WEAKSPOTS.find((w) => w.match.includes(m.id) || (m.wp && w.match.includes(m.wp)))
