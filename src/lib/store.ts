import { createContext, useContext } from 'react'
import type { SaveError } from './storage'
import type {
  AppState,
  BagItem,
  Expense,
  Kid,
  KidEvent,
  Moment,
  Lang,
  ParentId,
  ScheduleConfig,
  Settlement,
} from './types'

export type Updater = (state: AppState) => AppState

export interface Actions {
  update: (fn: Updater) => void
  setMe: (id: ParentId) => void
  setParent: (id: ParentId, patch: Partial<AppState['parents'][ParentId]>) => void
  setPreferences: (patch: Partial<Pick<AppState, 'currency' | 'theme'>>) => void
  /** Sets the wording and the matching Intl locale together. */
  setLanguage: (lang: Lang) => void
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

export interface StoreValue {
  state: AppState
  actions: Actions
  /** The parent using this device, and the one at the other home. */
  me: ParentId
  them: ParentId
  saveError: SaveError | null
}

export const StoreContext = createContext<StoreValue | null>(null)

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
export function nameOf(state: AppState, id: ParentId, you = 'You'): string {
  return id === state.me ? you : state.parents[id].name
}
