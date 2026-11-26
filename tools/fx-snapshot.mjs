// Holt beim Bauen die aktuellen EZB-Tageskurse (über frankfurter.dev, kostenlos, ohne Schlüssel)
// und speichert sie als Ersatz für Fälle ohne Internet oder ohne Zugriff (z. B. in der Claude-App).
import fs from 'node:fs'
const out = 'src/data/fx_snapshot.json'
try {
  const r = await fetch('https://api.frankfurter.dev/v1/latest?base=JPY&symbols=EUR,USD,GBP,AUD,CAD,NZD,KRW,THB,MYR,SGD,HKD', { headers: { 'User-Agent': 'CarCatalogueBuild/1.0' } })
  const d = await r.json()
  if (!d?.rates?.EUR || !d.date) throw new Error('keine Kurse')
  fs.writeFileSync(out, JSON.stringify({ date: d.date, rates: d.rates }) + '\n')
  console.log('EZB-Kurse vom', d.date)
} catch (e) {
  // ohne Netz: den letzten gespeicherten Stand behalten
  console.warn('EZB-Kurse nicht abrufbar, nutze', JSON.parse(fs.readFileSync(out, 'utf8')).date, String(e))
}
