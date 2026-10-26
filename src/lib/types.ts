export type ParentId = 'a' | 'b'

export type Lang = 'en' | 'da' | 'pl'

export type PatternId =
  | 'alternating-weeks'
  | '2-2-3'
  | '2-2-5-5'
  | '3-4-4-3'
  | '5-2-2-5'
  | '2-2'
  | 'every-other-weekend'
  | 'custom'

export type ExpenseCategory =
  | 'childcare'
  | 'school'
  | 'health'
  | 'clothing'
  | 'activities'
  | 'travel'
  | 'food'
  | 'gifts'
  | 'other'

export type EventType = 'school' | 'medical' | 'activity' | 'birthday' | 'other'

export interface Parent {
  id: ParentId
  name: string
  homeName: string
  email?: string
  phone?: string
}

export interface ScheduleConfig {
  patternId: PatternId
  /** The day the repeating cycle starts from. */
  anchorDate: string
  /** Which home holds the first slot of the cycle. */
  startParent: ParentId
  /** Local time the child changes home, "HH:mm". */
  handoverTime: string
  handoverPlace?: string
}

/** A single day deliberately assigned against the pattern. */
export interface DayOverride {
  id: string
  date: string
  parent: ParentId
  reason?: string
  createdAt: string
}

export interface SwapRequest {
  id: string
  dates: string[]
  /** The home giving the days up. */
  from: ParentId
  /** The home asked to take them. */
  to: ParentId
  message?: string
  status: 'pending' | 'accepted' | 'declined'
  createdAt: string
  respondedAt?: string
  responseNote?: string
}

export interface Kid {
  id: string
  name: string
  birthdate?: string
  emoji?: string
  school?: string
  doctor?: string
  allergies?: string
  notes?: string
}

export interface Expense {
  id: string
  date: string
  title: string
  amountCents: number
  category: ExpenseCategory
  paidBy: ParentId
  /** Percent of the cost the payer carries; the rest is owed by the other home. */
  payerSharePct: number
  kidIds: string[]
  note?: string
  createdAt: string
}

export interface Settlement {
  id: string
  date: string
  from: ParentId
  to: ParentId
  amountCents: number
  note?: string
  createdAt: string
}

export interface KidEvent {
  id: string
  date: string
  time?: string
  title: string
  type: EventType
  kidIds: string[]
  location?: string
  note?: string
  /** Who is taking the child, when that differs from whoever has them. */
  owner?: ParentId
}

/**
 * A small shared update from whichever home the child is in: a photo, a line
 * of text, or both. The point is that the other parent sees the ordinary days
 * they were not there for.
 */
export interface Moment {
  id: string
  date: string
  by: ParentId
  caption?: string
  /** Downscaled JPEG data URL. See storage.ts for the size ceiling. */
  photo?: string
  kidIds: string[]
  createdAt: string
  /** Set when the other home has marked it seen. */
  seenByOther?: boolean
}

/** Things that travel with the child between the two homes. */
export interface BagItem {
  id: string
  kidId: string
  label: string
  packed: boolean
}

export interface AppState {
  version: number
  /** Which parent is using this device. Everything is written from their side. */
  me: ParentId
  parents: Record<ParentId, Parent>
  /** Drives the wording, and the Intl locale used for dates and numbers. */
  language: Lang
  currency: string
  /** Derived from `language`; kept in state so money formatting needs no hook. */
  locale: string
  theme: 'system' | 'light' | 'dark'
  schedule: ScheduleConfig
  overrides: DayOverride[]
  swaps: SwapRequest[]
  kids: Kid[]
  expenses: Expense[]
  settlements: Settlement[]
  events: KidEvent[]
  bag: BagItem[]
  moments: Moment[]
}
