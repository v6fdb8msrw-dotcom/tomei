// Ein Auto in einer Zeile: „Porsche 911 1985 120.000 km 60.000 €“. Marke, Herkunft und Foto kommen aus dem Katalog.
import { useEffect, useMemo, useState } from 'react'
import { DIR_COUNTRY } from '../data/directory.ts'
import { useT } from '../i18n/i18n.ts'
import { parseCar, type QuickCar } from '../lib/quick.ts'
import { catalogueIfLoaded, loadCatalogue, modelThumb, suggest, type CarModel } from './ModelFinder.tsx'
import { QuickInput } from './QuickInput.tsx'
import { fmtMoney } from './ui.tsx'

export function useCatalogue() {
  const [all, setAll] = useState<CarModel[]>(() => catalogueIfLoaded() ?? [])
  useEffect(() => {
    let alive = true
    loadCatalogue().then((c) => alive && setAll(c))
    return () => {
      alive = false
    }
  }, [])
  return all
}

/** Jahr, Kilometer und Preis gehören nicht zur Modellsuche */
const modelPart = (t: string) => t.replace(/\b(19|20)\d\d\b.*$/, '').replace(/\d[\d.,]*\s*(tkm|km|€|eur|yen|\$|£).*$/i, '').trim()

export function CarQuick({ onCar, button, examples, value, onValue }: { onCar: (c: QuickCar) => void; button: string; examples?: string[]; value: string; onValue: (v: string) => void }) {
  const { tx, L, locale } = useT()
  const all = useCatalogue()
  const car = useMemo(() => (value.trim().length > 2 ? parseCar(value, all) : null), [value, all])
  const sug = useMemo(() => {
    const p = modelPart(value)
    return p.length > 1 && !/\d{4}.*\S/.test(value.slice(p.length)) ? suggest(all, p, 6) : []
  }, [value, all])
  const facts = car
    ? [
        car.year ?? (car.hit?.y0 ? `${car.hit.y0}${car.hit.y1 ? '–' + car.hit.y1 : ''}` : ''),
        car.market && DIR_COUNTRY[car.market] ? `${DIR_COUNTRY[car.market].flag} ${L(DIR_COUNTRY[car.market].name)}` : '',
        car.mileageKm !== undefined ? `${car.mileageKm.toLocaleString(locale)} km` : '',
        car.price ? fmtMoney(car.price.amount, car.price.cur, locale) : '',
      ].filter(Boolean)
    : []
  return (
    <QuickInput
      value={value}
      onChange={onValue}
      onSubmit={() => car && onCar(car)}
      onPick={(s) => onValue(s.text ?? s.label)}
      suggestions={sug.map((m) => ({ id: m.id, label: m.n, sub: m.y0 ? `${m.y0}${m.y1 ? '–' + m.y1 : ''}` : '', icon: <span>{DIR_COUNTRY[m.cc]?.flag}</span>, text: m.n + ' ' }))}
      label={tx('Auto', 'Car')}
      placeholder={tx('Welches Auto? z. B. Mazda MX-5 1994 98.000 km', 'Which car? e.g. Mazda MX-5 1994 98,000 km')}
      button={button}
      examples={examples}
    >
      {car && (
        <p className="quick-read">
          {car.hit && <img src={modelThumb(car.hit.id)} alt="" onError={(e) => (e.currentTarget.style.display = 'none')} />}
          <span>
            <b>{car.hit ? car.hit.n : [car.make, car.model].filter(Boolean).join(' ')}</b>
            <small>{facts.join(' · ') || tx('Baujahr, Kilometer und Preis kannst du einfach dazuschreiben.', 'Just add year, mileage and price if you like.')}</small>
          </span>
        </p>
      )}
    </QuickInput>
  )
}
