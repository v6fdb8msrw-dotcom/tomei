// Tageskurse der EZB über frankfurter.dev (kostenlos, ohne Schlüssel). Basis Yen: rates[X] = Wert von 1 ¥ in X.
import { useEffect, useState } from 'react'
import { AED_PER_USD, FX_FALLBACK } from '../data.ts'

export function useFx() {
  const [rates, setRates] = useState<Record<string, number>>(FX_FALLBACK)
  const [live, setLive] = useState<{ date: string } | null>(null)
  useEffect(() => {
    fetch('https://api.frankfurter.dev/v1/latest?base=JPY&symbols=EUR,USD,GBP,AUD,CAD,NZD,KRW,THB,MYR,SGD,HKD')
      .then((r) => r.json())
      .then((d) => {
        if (d?.rates) {
          setRates({ ...FX_FALLBACK, ...d.rates, AED: (d.rates.USD ?? FX_FALLBACK.USD) * AED_PER_USD })
          setLive({ date: d.date })
        }
      })
      .catch(() => setLive(null))
  }, [])
  return { rates, live }
}
