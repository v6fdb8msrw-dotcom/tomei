import { describe, expect, it } from 'vitest'
import { decodeShare, encodeShare, MAX_CODE, tripCode, vehicleForShare } from '../lib/share.ts'
import type { Trip, Vehicle } from '../store/schema.ts'

const car: Vehicle = { id: 'a', make: 'Toyota', model: 'Supra', year: 1997, status: 'owned', mods: [{ id: 'm', title: 'Gewindefahrwerk', category: 'Fahrwerk', status: 'installed' }], journey: [], notes: 'privat', price: { amount: 60000, cur: 'EUR' }, createdAt: '', updatedAt: '' } as Vehicle

describe('Teilen per Link', () => {
  it('überträgt ein Fahrzeug ohne private Angaben', async () => {
    const code = await encodeShare({ t: 'v', v: vehicleForShare(car) })
    expect(code).toMatch(/^[zj][\w-]+$/)
    const back = await decodeShare(code)
    expect(back?.t).toBe('v')
    if (back?.t !== 'v') return
    expect(back.v.model).toBe('Supra')
    expect(back.v.mods?.[0].title).toBe('Gewindefahrwerk')
    expect(JSON.stringify(back)).not.toContain('privat')
    expect(JSON.stringify(back)).not.toContain('60000')
  })
  it('kürzt lange GPX-Spuren', async () => {
    const track = Array.from({ length: 20000 }, (_, i) => [47 + Math.sin(i / 50) / 10 + i * 1e-5, 10 + Math.cos(i / 37) / 10] as [number, number])
    const t = { id: 't', name: 'Alpen', waypoints: [{ name: 'A', lat: 47, lon: 10 }], track, createdAt: '', updatedAt: '' } as Trip
    const r = await tripCode(t)
    expect(r.code.length).toBeLessThanOrEqual(MAX_CODE)
    expect(r.trackCut).toBe(true)
    const back = await decodeShare(r.code)
    expect(back?.t).toBe('t')
  })
  it('erkennt kaputte Links', async () => {
    expect(await decodeShare('zabc')).toBeNull()
  })
})

import { findShops } from '../lib/workshops.ts'
import { SPECIALISTS } from '../data/specialists.ts'
describe('Spezialwerkstätten', () => {
  it('zeigt den GT-R-Spezialisten für einen Nissan bei Düsseldorf zuerst', () => {
    const h = findShops([...SPECIALISTS, { n: 'Nissan Autohaus', la: 51.22, lo: 6.78, m: ['nissan'], d: 1 }], { make: 'Nissan', lat: 51.22, lon: 6.78, maxKm: 80 })
    expect(h[0].s.n).toBe('Kabbana Dynamics')
    expect(h[0].why).toBe('spec')
  })
  it('zeigt keine JDM-Spezialisten für einen Porsche', () => {
    expect(findShops(SPECIALISTS, { make: 'Porsche', lat: 51.22, lon: 6.78, maxKm: 300 })).toHaveLength(0)
  })
})
