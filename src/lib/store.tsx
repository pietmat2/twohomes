import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { demoState, newId } from './seed'
import { otherParent } from './schedule'
import { loadState, saveState } from './storage'
import type {
  AppState,
  BagItem,
  DayOverride,
  Expense,
  Kid,
  KidEvent,
  Moment,
  ParentId,
  ScheduleConfig,
  Settlement,
  SwapRequest,
} from './types'

type Updater = (state: AppState) => AppState

interface Actions {
  update: (fn: Updater) => void
  setMe: (id: ParentId) => void
  setParent: (id: ParentId, patch: Partial<AppState['parents'][ParentId]>) => void
  setPreferences: (patch: Partial<Pick<AppState, 'currency' | 'locale' | 'theme'>>) => void
  setSchedule: (patch: Partial<ScheduleConfig>) => void

  setDayParent: (date: string, parent: ParentId, reason?: string) => void
  clearOverride: (date: string) => void

  requestSwap: (input: { dates: string[]; from: ParentId; message?: string }) => void
  respondToSwap: (id: string, accept: boolean, responseNote?: string) => void
  removeSwap: (id: string) => void

  addKid: (kid: Omit<Kid, 'id'>) => void
  updateKid: (id: string, patch: Partial<Kid>) => void
  removeKid: (id: string) => void

  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => void
  updateExpense: (id: string, patch: Partial<Expense>) => void
  removeExpense: (id: string) => void

  addSettlement: (settlement: Omit<Settlement, 'id' | 'createdAt'>) => void
  removeSettlement: (id: string) => void

  addEvent: (event: Omit<KidEvent, 'id'>) => void
  updateEvent: (id: string, patch: Partial<KidEvent>) => void
  removeEvent: (id: string) => void

  addBagItem: (item: Omit<BagItem, 'id' | 'packed'>) => void
  toggleBagItem: (id: string) => void
  removeBagItem: (id: string) => void
  resetBag: () => void

  addMoment: (moment: Omit<Moment, 'id' | 'createdAt'>) => void
  markMomentSeen: (id: string) => void
  removeMoment: (id: string) => void

  replaceState: (state: AppState) => void
}

interface StoreValue {
  state: AppState
  actions: Actions
  /** The parent using this device, and the one at the other home. */
  me: ParentId
  them: ParentId
  saveError: string | null
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => loadState() ?? demoState())
  const [saveError, setSaveError] = useState<string | null>(null)
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

  const update = useCallback((fn: Updater) => setState((prev) => fn(prev)), [])

  const actions = useMemo<Actions>(() => {
    const now = () => new Date().toISOString()

    return {
      update,

      setMe: (id) => update((s) => ({ ...s, me: id })),

      setParent: (id, patch) =>
        update((s) => ({ ...s, parents: { ...s.parents, [id]: { ...s.parents[id], ...patch } } })),

      setPreferences: (patch) => update((s) => ({ ...s, ...patch })),

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

export function useApp(): StoreValue {
  const value = useContext(StoreContext)
  if (!value) throw new Error('useApp must be used inside StoreProvider')
  return value
}

/**
 * How a parent is named in third-person copy: "You paid", "Jonas paid".
 * Only for subject position — anywhere the sentence needs a verb to agree,
 * branch on the id instead, or you get "You owes you".
 */
export function nameOf(state: AppState, id: ParentId): string {
  return id === state.me ? 'You' : state.parents[id].name
}
