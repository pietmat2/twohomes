import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { otherParent } from './schedule'
import { demoState, newId } from './seed'
import { localeOf } from './i18n-locale'
import { loadState, saveState } from './storage'
import { StoreContext, type Actions, type StoreValue, type Updater } from './store'
import type { AppState, DayOverride, SwapRequest } from './types'
import type { SaveError } from './storage'

/**
 * Holds the whole app state and every mutation. Kept in its own file so React
 * Fast Refresh sees a module that exports only a component; the context and
 * hooks live in store.ts.
 */
export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => loadState() ?? demoState())
  const [saveError, setSaveError] = useState<SaveError | null>(null)
  const firstRender = useRef(true)

  useEffect(() => {
    // Skip the write on mount so opening the app never rewrites what it read.
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    const result = saveState(state)
    setSaveError(result.ok ? null : result.error)
  }, [state])

  useEffect(() => {
    const root = document.documentElement
    if (state.theme === 'system') root.removeAttribute('data-theme')
    else root.setAttribute('data-theme', state.theme)
  }, [state.theme])

  useEffect(() => {
    // Screen readers and hyphenation both key off this.
    document.documentElement.lang = state.language
  }, [state.language])

  const update = useCallback((fn: Updater) => setState((prev) => fn(prev)), [])

  const actions = useMemo<Actions>(() => {
    const now = () => new Date().toISOString()

    return {
      update,

      setMe: (id) => update((s) => ({ ...s, me: id })),

      setParent: (id, patch) =>
        update((s) => ({ ...s, parents: { ...s.parents, [id]: { ...s.parents[id], ...patch } } })),

      setPreferences: (patch) => update((s) => ({ ...s, ...patch })),

      setLanguage: (lang) =>
        update((s) => ({ ...s, language: lang, locale: localeOf(lang) })),

      setSchedule: (patch) => update((s) => ({ ...s, schedule: { ...s.schedule, ...patch } })),

      setDayParent: (date, parent, reason) =>
        update((s) => {
          const override: DayOverride = {
            id: newId('ovr'),
            date,
            parent,
            reason,
            createdAt: now(),
          }
          return {
            ...s,
            overrides: [...s.overrides.filter((o) => o.date !== date), override],
          }
        }),

      clearOverride: (date) =>
        update((s) => ({ ...s, overrides: s.overrides.filter((o) => o.date !== date) })),

      requestSwap: ({ dates, from, message }) =>
        update((s) => {
          const swap: SwapRequest = {
            id: newId('swp'),
            dates: [...dates].sort(),
            from,
            to: otherParent(from),
            message,
            status: 'pending',
            createdAt: now(),
          }
          return { ...s, swaps: [swap, ...s.swaps] }
        }),

      respondToSwap: (id, accept, responseNote) =>
        update((s) => {
          const swap = s.swaps.find((x) => x.id === id)
          if (!swap || swap.status !== 'pending') return s
          const swaps = s.swaps.map((x) =>
            x.id === id
              ? {
                  ...x,
                  status: accept ? ('accepted' as const) : ('declined' as const),
                  respondedAt: now(),
                  responseNote,
                }
              : x,
          )
          if (!accept) return { ...s, swaps }
          // Accepting is what actually moves the days on the calendar.
          const added: DayOverride[] = swap.dates.map((date) => ({
            id: newId('ovr'),
            date,
            parent: swap.to,
            reason: 'Agreed swap',
            createdAt: now(),
          }))
          const kept = s.overrides.filter((o) => !swap.dates.includes(o.date))
          return { ...s, swaps, overrides: [...kept, ...added] }
        }),

      removeSwap: (id) => update((s) => ({ ...s, swaps: s.swaps.filter((x) => x.id !== id) })),

      addKid: (kid) => update((s) => ({ ...s, kids: [...s.kids, { ...kid, id: newId('kid') }] })),

      updateKid: (id, patch) =>
        update((s) => ({
          ...s,
          kids: s.kids.map((k) => (k.id === id ? { ...k, ...patch } : k)),
        })),

      removeKid: (id) =>
        update((s) => ({
          ...s,
          kids: s.kids.filter((k) => k.id !== id),
          bag: s.bag.filter((b) => b.kidId !== id),
          expenses: s.expenses.map((e) => ({ ...e, kidIds: e.kidIds.filter((k) => k !== id) })),
          events: s.events.map((e) => ({ ...e, kidIds: e.kidIds.filter((k) => k !== id) })),
          moments: s.moments.map((m) => ({ ...m, kidIds: m.kidIds.filter((k) => k !== id) })),
        })),

      addExpense: (expense) =>
        update((s) => ({
          ...s,
          expenses: [{ ...expense, id: newId('exp'), createdAt: now() }, ...s.expenses],
        })),

      updateExpense: (id, patch) =>
        update((s) => ({
          ...s,
          expenses: s.expenses.map((e) => (e.id === id ? { ...e, ...patch } : e)),
        })),

      removeExpense: (id) =>
        update((s) => ({ ...s, expenses: s.expenses.filter((e) => e.id !== id) })),

      addSettlement: (settlement) =>
        update((s) => ({
          ...s,
          settlements: [{ ...settlement, id: newId('set'), createdAt: now() }, ...s.settlements],
        })),

      removeSettlement: (id) =>
        update((s) => ({ ...s, settlements: s.settlements.filter((x) => x.id !== id) })),

      addEvent: (event) =>
        update((s) => ({ ...s, events: [...s.events, { ...event, id: newId('evt') }] })),

      updateEvent: (id, patch) =>
        update((s) => ({
          ...s,
          events: s.events.map((e) => (e.id === id ? { ...e, ...patch } : e)),
        })),

      removeEvent: (id) => update((s) => ({ ...s, events: s.events.filter((e) => e.id !== id) })),

      addBagItem: (item) =>
        update((s) => ({ ...s, bag: [...s.bag, { ...item, id: newId('bag'), packed: false }] })),

      toggleBagItem: (id) =>
        update((s) => ({
          ...s,
          bag: s.bag.map((b) => (b.id === id ? { ...b, packed: !b.packed } : b)),
        })),

      removeBagItem: (id) => update((s) => ({ ...s, bag: s.bag.filter((b) => b.id !== id) })),

      resetBag: () => update((s) => ({ ...s, bag: s.bag.map((b) => ({ ...b, packed: false })) })),

      addMoment: (moment) =>
        update((s) => ({
          ...s,
          moments: [{ ...moment, id: newId('mom'), createdAt: now() }, ...s.moments],
        })),

      markMomentSeen: (id) =>
        update((s) => ({
          ...s,
          moments: s.moments.map((m) => (m.id === id ? { ...m, seenByOther: true } : m)),
        })),

      removeMoment: (id) =>
        update((s) => ({ ...s, moments: s.moments.filter((m) => m.id !== id) })),

      replaceState: (next) => setState(next),
    }
  }, [update])

  const value = useMemo<StoreValue>(
    () => ({ state, actions, me: state.me, them: otherParent(state.me), saveError }),
    [state, actions, saveError],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}
