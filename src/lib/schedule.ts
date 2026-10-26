import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns'
import type { AppState, DayOverride, ParentId, PatternId, ScheduleConfig } from './types'

type Slot = 'first' | 'second'

export interface PatternDef {
  id: PatternId
  label: string
  summary: string
  /** One full repeat, expressed as which home holds each day. */
  cycle: Slot[]
  /** Patterns that only make sense anchored to a particular weekday. */
  anchorHint?: string
}

const f = 'first' as const
const s = 'second' as const

export const PATTERNS: PatternDef[] = [
  {
    id: 'alternating-weeks',
    label: 'Week on, week off',
    summary: 'Seven days in one home, then seven in the other.',
    cycle: [f, f, f, f, f, f, f, s, s, s, s, s, s, s],
    anchorHint: 'Anchor on a changeover day.',
  },
  {
    id: '2-2-3',
    label: '2-2-3',
    summary: 'Two days, two days, then a long weekend, alternating each week.',
    cycle: [f, f, s, s, f, f, f, s, s, f, f, s, s, s],
    anchorHint: 'Anchor on a Monday.',
  },
  {
    id: '2-2-5-5',
    label: '2-2-5-5',
    summary: 'Fixed weekdays for each home, with alternating long blocks.',
    cycle: [f, f, s, s, f, f, f, f, f, s, s, s, s, s],
    anchorHint: 'Anchor on a Monday.',
  },
  {
    id: '3-4-4-3',
    label: '3-4-4-3',
    summary: 'Close to an even split, never more than four nights apart.',
    cycle: [f, f, f, s, s, s, s, f, f, f, f, s, s, s],
    anchorHint: 'Anchor on a Monday.',
  },
  {
    id: '5-2-2-5',
    label: '5-2-2-5',
    summary: 'Each home keeps the same two weekdays, weekends alternate.',
    cycle: [f, f, f, f, f, s, s, f, f, s, s, s, s, s],
    anchorHint: 'Anchor on a Monday.',
  },
  {
    id: '2-2',
    label: 'Two on, two off',
    summary: 'Short, frequent swaps. Often used with younger children.',
    cycle: [f, f, s, s],
  },
  {
    id: 'every-other-weekend',
    label: 'Every other weekend',
    summary: 'One home on weekdays, the other every second Friday to Sunday.',
    cycle: [s, s, s, f, f, f, f, f, f, f, f, f, f, f],
    anchorHint: 'Anchor on the Friday a weekend starts.',
  },
  {
    id: 'custom',
    label: 'Custom',
    summary: 'No repeating pattern. Every day is set by hand on the calendar.',
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
