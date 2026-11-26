// Tageskurse der EZB über frankfurter.dev (kostenlos, ohne Schlüssel). Basis Yen: rates[X] = Wert von 1 ¥ in X.
import { useEffect, useState } from 'react'
import { AED_PER_USD, FX_DATE, FX_FALLBACK } from '../data.ts'

export function useFx() {
  const [rates, setRates] = useState<Record<string, number>>(FX_FALLBACK)
  // live: EZB-Datum der verwendeten Kurse (zuerst vom letzten Build, dann der Tagesabruf)
  const [live, setLive] = useState<{ date: string; snapshot?: boolean }>({ date: FX_DATE, snapshot: true })
  useEffect(() => {
    fetch('https://api.frankfurter.dev/v1/latest?base=JPY&symbols=EUR,USD,GBP,AUD,CAD,NZD,KRW,THB,MYR,SGD,HKD')
      .then((r) => r.json())
      .then((d) => {
        if (d?.rates) {
          setRates({ ...FX_FALLBACK, ...d.rates, AED: (d.rates.USD ?? FX_FALLBACK.USD) * AED_PER_USD })
          setLive({ date: d.date })
        }
      })
      .catch(() => {})
  }, [])
  return { rates, live }
}
