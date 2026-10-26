import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns'
import type { AppState, DayOverride, ParentId, PatternId, ScheduleConfig } from './types'

type Slot = 'first' | 'second'

export interface PatternDef {
  id: PatternId
  /** One full repeat, expressed as which home holds each day. */
  cycle: Slot[]
}

/**
 * Wording lives in the message catalogues under `pattern.<id>.label`,
 * `.summary` and `.anchor`, so a pattern stays the same object in every
 * language.
 */

const f = 'first' as const
const s = 'second' as const

export const PATTERNS: PatternDef[] = [
  {
    id: 'alternating-weeks',
    cycle: [f, f, f, f, f, f, f, s, s, s, s, s, s, s],
  },
  {
    id: '2-2-3',
    cycle: [f, f, s, s, f, f, f, s, s, f, f, s, s, s],
  },
  {
    id: '2-2-5-5',
    cycle: [f, f, s, s, f, f, f, f, f, s, s, s, s, s],
  },
  {
    id: '3-4-4-3',
    cycle: [f, f, f, s, s, s, s, f, f, f, f, s, s, s],
  },
  {
    id: '5-2-2-5',
    cycle: [f, f, f, f, f, s, s, f, f, s, s, s, s, s],
  },
  {
    id: '2-2',
    cycle: [f, f, s, s],
  },
  {
    id: 'every-other-weekend',
    cycle: [s, s, s, f, f, f, f, f, f, f, f, f, f, f],
  },
  {
    id: 'custom',
    cycle: [],
  },
]

export function getPattern(id: PatternId): PatternDef {
  return PATTERNS.find((p) => p.id === id) ?? PATTERNS[0]
}

export const toISO = (d: Date) => format(d, 'yyyy-MM-dd')

export function otherParent(p: ParentId): ParentId {
  return p === 'a' ? 'b' : 'a'
}

/** Who the repeating pattern alone would put the child with, ignoring overrides. */
export function patternParent(schedule: ScheduleConfig, date: string): ParentId {
  const pattern = getPattern(schedule.patternId)
  if (pattern.cycle.length === 0) return schedule.startParent
  const offset = differenceInCalendarDays(parseISO(date), parseISO(schedule.anchorDate))
  const len = pattern.cycle.length
  const index = ((offset % len) + len) % len
  return pattern.cycle[index] === 'first' ? schedule.startParent : otherParent(schedule.startParent)
}

export interface DayAssignment {
  date: string
  parent: ParentId
  override?: DayOverride
  /** True when the child changes home at the start of this day. */
  isHandover: boolean
}

export function assignmentFor(state: AppState, date: string): DayAssignment {
  const override = state.overrides.find((o) => o.date === date)
  const parent = override ? override.parent : patternParent(state.schedule, date)
  const prevDate = toISO(addDays(parseISO(date), -1))
  const prevOverride = state.overrides.find((o) => o.date === prevDate)
  const prevParent = prevOverride ? prevOverride.parent : patternParent(state.schedule, prevDate)
  return { date, parent, override, isHandover: parent !== prevParent }
}

export function assignmentsForRange(state: AppState, start: Date, days: number): DayAssignment[] {
  return Array.from({ length: days }, (_, i) => assignmentFor(state, toISO(addDays(start, i))))
}

/** Share of nights each home has over a window, the number people actually track. */
export function nightsSplit(state: AppState, start: Date, days: number) {
  const list = assignmentsForRange(state, start, days)
  const a = list.filter((d) => d.parent === 'a').length
  return { a, b: list.length - a, total: list.length }
}

/** The next day the child changes home, searching forward from `from`. */
export function nextHandover(state: AppState, from: Date, limitDays = 90): DayAssignment | null {
  for (let i = 1; i <= limitDays; i++) {
    const assignment = assignmentFor(state, toISO(addDays(from, i)))
    if (assignment.isHandover) return assignment
  }
  return null
}
