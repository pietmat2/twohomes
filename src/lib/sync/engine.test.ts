import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { demoState } from '../seed'
import type { AppState, SyncState } from '../types'
import { applyRemote, diff, leaveOp, recordLocal, snapshot, type Op } from './engine'

const KEY = { kty: 'EC', crv: 'P-256', x: 'x', y: 'y' }

function device(state: AppState, me: 'a' | 'b', id: string): AppState {
  const sync: SyncState = {
    familyId: 'family-0000000000',
    secret: 's',
    device: id,
    signing: { privateKey: KEY, publicKey: KEY },
    peers: { a: KEY, b: KEY },
    clock: { t: 0, c: 0 },
    meta: {},
    outbox: [],
    cursor: 0,
  }
  return { ...state, me, sync }
}

/** A local edit, as StoreProvider's `update` makes it, a second after the last one. */
const edit = (state: AppState, fn: (s: AppState) => AppState) => {
  vi.advanceTimersByTime(1000)
  return recordLocal(state, fn(state))
}
const sent = (state: AppState): Op[] => state.sync!.outbox
const clear = (state: AppState): AppState => ({ ...state, sync: { ...state.sync!, outbox: [] } })

/** Only what the two homes share, as it would be saved: no per-device fields, no sync. */
const shared = ({ sync: _s, me: _m, language: _l, locale: _lo, theme: _t, ...rest }: AppState) =>
  JSON.parse(JSON.stringify(rest))

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-10-27T12:00:00Z'))
})
afterEach(() => {
  vi.useRealTimers()
})

function pair() {
  const base = demoState('en')
  const a = device(base, 'a', 'device-aaaaaaaaaa')
  const b = device(base, 'b', 'device-bbbbbbbbbb')
  // B starts from A's snapshot, as a joining device does.
  const opsFromA: Op[] = snapshot(base).map((change, i) => ({
    id: `snap-${i}`,
    stamp: { t: 1, c: i, d: 'device-aaaaaaaaaa' },
    author: 'a',
    ...change,
  }))
  return { a, b: applyRemote(b, opsFromA) }
}

describe('diff', () => {
  it('sees nothing when nothing changed', () => {
    const state = demoState('en')
    expect(diff(state, { ...state })).toEqual([])
  })

  it('turns a removal into a tombstone', () => {
    const state = demoState('en')
    const [first, ...rest] = state.expenses
    expect(diff(state, { ...state, expenses: rest })).toEqual([{ key: `expenses/${first.id}`, kind: 'del' }])
  })

  it('keys overrides by date, so one day has one answer', () => {
    const state = { ...demoState('en'), overrides: [] }
    const next = { ...state, overrides: [{ id: 'ovr_1', date: '2026-11-02', parent: 'b' as const, createdAt: '' }] }
    expect(diff(state, next)[0].key).toBe('overrides/2026-11-02')
  })

  it('ignores language, theme and which parent this is', () => {
    const state = demoState('en')
    expect(diff(state, { ...state, language: 'pl', theme: 'dark', me: 'b' })).toEqual([])
  })
})

describe('two homes', () => {
  it('converge whichever order the ops arrive in', () => {
    let { a, b } = pair()
    a = edit(a, (s) => ({ ...s, currency: 'PLN' }))
    a = edit(a, (s) => ({ ...s, expenses: s.expenses.slice(1) }))
    b = edit(b, (s) => ({ ...s, kids: s.kids.map((k, i) => (i === 0 ? { ...k, allergies: 'Peanuts' } : k)) }))
    b = edit(b, (s) => ({ ...s, currency: 'SEK' }))

    const fromA = sent(a)
    const fromB = sent(b)
    const a2 = applyRemote(clear(a), [...fromB].reverse())
    const b2 = applyRemote(clear(b), fromA)

    expect(shared(a2)).toEqual(shared(b2))
    // B's currency change came later, so it wins in both homes.
    expect(a2.currency).toBe('SEK')
    expect(a2.kids[0].allergies).toBe('Peanuts')
  })

  it('applying the same ops twice changes nothing', () => {
    let { a, b } = pair()
    a = edit(a, (s) => ({ ...s, currency: 'NOK' }))
    const once = applyRemote(b, sent(a))
    const twice = applyRemote(once, sent(a))
    expect(shared(twice)).toEqual(shared(once))
  })

  it('a deleted record stays deleted against an older edit', () => {
    let { a, b } = pair()
    const id = a.expenses[0].id
    b = edit(b, (s) => ({ ...s, expenses: s.expenses.map((e) => (e.id === id ? { ...e, title: 'Older edit' } : e)) }))
    const older = sent(b)
    a = edit(a, (s) => ({ ...s, expenses: s.expenses.filter((e) => e.id !== id) }))
    // A's delete is newer: B's older edit must not bring it back.
    const a2 = applyRemote(clear(a), older)
    expect(a2.expenses.some((e) => e.id === id)).toBe(false)
  })

  it('drops a malformed record from the other home', () => {
    const { b } = pair()
    const bad: Op = {
      id: 'x',
      stamp: { t: Date.now() + 1000, c: 0, d: 'device-aaaaaaaaaa' },
      author: 'a',
      kind: 'put',
      key: 'moments/mom_evil',
      value: { id: 'mom_evil', date: 'nonsense', by: 'a' },
    }
    expect(applyRemote(b, [bad]).moments.some((m) => m.id === 'mom_evil')).toBe(false)
  })

  it('forgets a device that left, so a new one can join in its place', () => {
    const { a, b } = pair()
    const after = applyRemote(a, [leaveOp(b.sync!, 'b')])
    expect(after.sync!.peers.b).toBeUndefined()
    expect(after.sync!.peers.a).toBeDefined()
  })

  it('records nothing for a device that isn’t sharing', () => {
    const state = demoState('en')
    expect(recordLocal(state, { ...state, currency: 'PLN' }).sync).toBeUndefined()
  })
})
