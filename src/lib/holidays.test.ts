import { describe, expect, it } from 'vitest'
import { demoState } from './seed'
import { sanitizeState } from './sanitize'
import { easter, holidaysBetween, holidaysOn, upcomingBreaks, validHolidays } from './holidays'
import { applyRemote, diff } from './sync/engine'
import type { AppState } from './types'

const dk7 = { country: 'dk' as const, region: '7' }
const dk8 = { country: 'dk' as const, region: '8' }
const mazowieckie = { country: 'pl' as const, region: 'mazowieckie' }
const slaskie = { country: 'pl' as const, region: 'slaskie' }

const keysOn = (settings: Parameters<typeof holidaysOn>[0], date: string) =>
  holidaysOn(settings, date).map((h) => h.key)

describe('Easter', () => {
  it('lands on the known dates', () => {
    expect(easter(2026)).toBe('2026-04-05')
    expect(easter(2027)).toBe('2027-03-28')
    expect(easter(2028)).toBe('2028-04-16')
    expect(easter(2038)).toBe('2038-04-25')
  })
})

describe('Denmark', () => {
  it('matches Copenhagen’s published plan', () => {
    expect(keysOn(dk7, '2026-10-12')).toEqual(['autumn'])
    expect(keysOn(dk7, '2027-01-01')).toEqual(['christmas', 'newYear'])
    expect(keysOn(dk7, '2027-02-15')).toEqual(['winter'])
    expect(keysOn(dk7, '2027-03-25')).toEqual(['easter', 'maundyThursday'])
  })

  it('moves only winter break for week-8 municipalities', () => {
    expect(keysOn(dk8, '2027-02-15')).toEqual([])
    expect(keysOn(dk8, '2027-02-22')).toEqual(['winter'])
    expect(keysOn(dk8, '2026-10-12')).toEqual(['autumn'])
  })

  it('has no Store bededag any more', () => {
    expect(holidaysBetween(dk7, '2027-01-01', '2027-12-31').map((h) => h.key)).not.toContain('greatPrayerDay')
    expect(keysOn(dk7, '2027-04-23')).toEqual([])
  })
})

describe('Poland', () => {
  it('matches the ministry’s 2026/27 calendar', () => {
    expect(keysOn(mazowieckie, '2026-12-23')).toEqual(['christmas'])
    expect(keysOn(mazowieckie, '2026-12-24')).toEqual(['christmas', 'christmasEve'])
    expect(keysOn(mazowieckie, '2027-03-25')).toEqual(['easter'])
    expect(keysOn(mazowieckie, '2027-03-30')).toEqual(['easter'])
    expect(keysOn(mazowieckie, '2027-03-31')).toEqual([])
    expect(keysOn(mazowieckie, '2027-06-25')).toEqual([])
    expect(keysOn(mazowieckie, '2027-06-26')).toEqual(['summer'])
  })

  it('takes winter break from the voivodeship', () => {
    expect(keysOn(mazowieckie, '2027-02-01')).toEqual(['winter'])
    expect(keysOn(slaskie, '2027-02-01')).toEqual([])
    expect(keysOn(slaskie, '2027-01-18')).toEqual(['winter'])
    expect(keysOn(slaskie, '2028-02-14')).toEqual(['winter'])
  })

  it('shows only public holidays beyond the published years', () => {
    const later = holidaysBetween(mazowieckie, '2031-01-01', '2031-12-31')
    expect(later.every((h) => h.kind === 'public')).toBe(true)
    expect(later.map((h) => h.key)).toContain('independence')
  })
})

describe('settings', () => {
  it('shows nothing when no country is chosen', () => {
    expect(holidaysBetween(undefined, '2027-01-01', '2027-12-31')).toEqual([])
    expect(holidaysBetween({ country: 'none' }, '2027-01-01', '2027-12-31')).toEqual([])
  })

  it('accept only known countries and regions', () => {
    expect(validHolidays({ country: 'pl', region: 'mazowieckie' })).toEqual(mazowieckie)
    expect(validHolidays({ country: 'pl', region: 'atlantis' })).toBeNull()
    expect(validHolidays({ country: 'dk', region: '10' })).toBeNull()
    expect(validHolidays({ country: 'se', region: '7' })).toBeNull()
  })

  it('reports breaks under way and starting soon', () => {
    const soon = upcomingBreaks(dk7, '2026-10-01', 21)
    expect(soon.map((h) => h.key)).toEqual(['autumn'])
    expect(upcomingBreaks(dk7, '2026-10-14', 3).map((h) => h.key)).toEqual(['autumn'])
  })

  it('survive an import, and travel to the other home', () => {
    const state: AppState = { ...demoState('da'), holidays: slaskie }
    expect(sanitizeState(JSON.parse(JSON.stringify(state)))?.holidays).toEqual(slaskie)
    const before: AppState = { ...state, holidays: dk7 }
    const [change] = diff(before, state)
    expect(change).toEqual({ key: 'holidays', kind: 'put', value: slaskie })
    const other: AppState = {
      ...before,
      sync: {
        familyId: 'family-0000000000',
        secret: 's',
        device: 'device-bbbbbbbbbb',
        signing: { privateKey: {}, publicKey: {} },
        peers: {},
        clock: { t: 0, c: 0 },
        meta: {},
        outbox: [],
        cursor: 0,
      },
    }
    const op = { id: 'x', stamp: { t: 1, c: 0, d: 'device-aaaaaaaaaa' }, author: 'a' as const, ...change }
    expect(applyRemote(other, [op]).holidays).toEqual(slaskie)
  })
})
